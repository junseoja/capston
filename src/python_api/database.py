# ============================================================
# DB 연결 모듈
# ============================================================
# 역할:
#   - .env 파일에서 MySQL 접속 정보를 읽어 커넥션 생성
#   - FastAPI 라우터가 get_connection() 으로 DB 커넥션을 빌려 쓰고 close() 로 반환
#
# [수정 2026-05-10] 요청마다 새 연결 → 간단한 PyMySQL 커넥션 풀로 전환
# 이유:
#   React → Express → FastAPI → MySQL 구조를 유지하면서 성능을 높이려면
#   FastAPI 내부에서 매 요청마다 MySQL 연결을 새로 여는 비용을 줄이는 것이 가장 효과적이다.
#   RDS 연결 생성은 TCP 연결/인증/세션 초기화 비용이 있고, 트래픽이 늘면 연결 수 한도에도 빨리 닿는다.
#
# 설명:
#   - 기존 라우터 코드의 try/finally conn.close() 패턴은 그대로 유지한다.
#   - get_connection() 은 풀에서 연결을 빌려온 PooledConnection 래퍼를 반환한다.
#   - conn.close() 는 실제 종료가 아니라 풀 반환으로 동작한다.
#   - 끊긴 연결은 ping(reconnect=True) 로 복구한 뒤 사용한다.
#   - 쿼리 시간이 SLOW_QUERY_MS 이상이면 로그를 남겨 병목 쿼리를 찾는다.
# ============================================================

import os
import queue
import threading
import time
import pymysql
import pymysql.cursors
from dotenv import load_dotenv

load_dotenv()

DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "8"))
DB_POOL_MAX_OVERFLOW = int(os.getenv("DB_POOL_MAX_OVERFLOW", "4"))
SLOW_QUERY_MS = int(os.getenv("SLOW_QUERY_MS", "200"))


def _connection_kwargs():
    """PyMySQL 커넥션 공통 옵션.

    [유지 2026-05-10]
    이유:
        기존 KST 타임존 보정 정책을 커넥션 풀에서도 동일하게 유지하기 위함.
    """
    return {
        "host": os.getenv("DB_HOST"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "database": os.getenv("DB_NAME"),
        "port": int(os.getenv("DB_PORT", 3306)),
        "charset": "utf8mb4",
        "cursorclass": pymysql.cursors.DictCursor,
        "init_command": "SET time_zone = '+09:00'",
        "autocommit": False,
    }


class TimedCursor:
    """쿼리 실행 시간을 측정하는 cursor 래퍼."""

    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, args=None):
        started_at = time.perf_counter()
        try:
            return self._cursor.execute(query, args)
        finally:
            elapsed_ms = (time.perf_counter() - started_at) * 1000
            if elapsed_ms >= SLOW_QUERY_MS:
                compact_query = " ".join(str(query).split())
                print(f"🐢 [slow-sql] {elapsed_ms:.1f}ms {compact_query[:240]}")

    def executemany(self, query, args):
        started_at = time.perf_counter()
        try:
            return self._cursor.executemany(query, args)
        finally:
            elapsed_ms = (time.perf_counter() - started_at) * 1000
            if elapsed_ms >= SLOW_QUERY_MS:
                compact_query = " ".join(str(query).split())
                print(f"🐢 [slow-sql-many] {elapsed_ms:.1f}ms {compact_query[:240]}")

    def __getattr__(self, name):
        return getattr(self._cursor, name)

    def __enter__(self):
        self._cursor.__enter__()
        return self

    def __exit__(self, exc_type, exc, tb):
        return self._cursor.__exit__(exc_type, exc, tb)


class PooledConnection:
    """라우터가 기존 pymysql.Connection 처럼 쓰는 풀 커넥션 래퍼."""

    def __init__(self, pool, raw_connection, overflow=False):
        self._pool = pool
        self._raw = raw_connection
        self._overflow = overflow
        self._closed = False

    def cursor(self, *args, **kwargs):
        return TimedCursor(self._raw.cursor(*args, **kwargs))

    def commit(self):
        return self._raw.commit()

    def rollback(self):
        return self._raw.rollback()

    def close(self):
        if self._closed:
            return
        self._closed = True
        self._pool.release(self._raw, overflow=self._overflow)

    def __getattr__(self, name):
        return getattr(self._raw, name)


class MysqlConnectionPool:
    """의존성 추가 없이 PyMySQL 연결을 재사용하는 작은 커넥션 풀."""

    def __init__(self, size, max_overflow):
        self.size = size
        self.max_overflow = max_overflow
        self._queue = queue.LifoQueue(maxsize=size)
        self._overflow_count = 0
        self._lock = threading.Lock()

        for _ in range(size):
            self._queue.put(self._create_connection())

    def _create_connection(self):
        return pymysql.connect(**_connection_kwargs())

    def acquire(self):
        try:
            raw = self._queue.get(block=False)
            overflow = False
        except queue.Empty:
            with self._lock:
                can_overflow = self._overflow_count < self.max_overflow
                if can_overflow:
                    self._overflow_count += 1

            if can_overflow:
                raw = self._create_connection()
                overflow = True
            else:
                raw = self._queue.get(block=True, timeout=5)
                overflow = False

        try:
            raw.ping(reconnect=True)
        except Exception:
            try:
                raw.close()
            except Exception:
                pass
            raw = self._create_connection()

        return PooledConnection(self, raw, overflow=overflow)

    def release(self, raw, overflow=False):
        try:
            raw.rollback()
        except Exception:
            pass

        if overflow:
            try:
                raw.close()
            finally:
                with self._lock:
                    self._overflow_count = max(0, self._overflow_count - 1)
            return

        try:
            self._queue.put(raw, block=False)
        except queue.Full:
            raw.close()


_pool = None


def get_connection():
    """MySQL 커넥션 풀에서 연결을 빌려 반환.

    사용 예시는 기존과 동일:
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
        finally:
            conn.close()

    [수정 2026-05-10]
    결과:
        라우터 코드는 그대로 두고, close() 시 실제 종료 대신 풀 반환을 수행한다.
    """
    global _pool
    if _pool is None:
        _pool = MysqlConnectionPool(DB_POOL_SIZE, DB_POOL_MAX_OVERFLOW)
        print(
            f"✅ MySQL 커넥션 풀 초기화: size={DB_POOL_SIZE}, "
            f"max_overflow={DB_POOL_MAX_OVERFLOW}, slow_query_ms={SLOW_QUERY_MS}"
        )
    return _pool.acquire()
