# ============================================================
# DB 연결 모듈
# ============================================================
# 역할:
#   - .env 파일에서 MySQL 접속 정보를 읽어 커넥션 생성
#   - 각 라우터 함수에서 호출하여 요청마다 새로운 커넥션 사용 후 반드시 close()
#
# 주의사항:
#   - 현재는 요청마다 커넥션을 새로 열고 닫는 방식 (Connection per request)
#   - 트래픽이 늘어날 경우 커넥션 풀(SQLAlchemy, aiomysql 등) 적용 권장
#   - .env 파일은 절대 Git에 커밋하지 말 것 (DB 접속 정보 포함)
# ============================================================

import pymysql
import pymysql.cursors
from dotenv import load_dotenv
import os

# .env 파일 로드 → os.getenv()로 환경변수 읽기 가능
# 필요한 환경변수: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
load_dotenv()

def get_connection():
    """MySQL 커넥션 생성 및 반환

    Returns:
        pymysql.Connection: 열린 DB 커넥션 객체
            - 사용 후 반드시 conn.close() 호출 (try/finally 패턴 권장)
            - DictCursor 사용으로 결과가 dict 형태로 반환됨
            예: {"user_id": "uuid...", "login_id": "hong123"}

    사용 예시:
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE login_id = %s", (login_id,))
                user = cursor.fetchone()
            return user
        finally:
            conn.close()  # 항상 커넥션 반환
    """
    # ────────────────────────────────────────────────────────────────────
    # [수정 2026-04-29] 타임존 KST(+09:00) 강제 설정
    # ────────────────────────────────────────────────────────────────────
    # 배경:
    #   AWS RDS MySQL은 기본적으로 UTC 타임존으로 동작하므로, KST와 9시간 차이 발생.
    #   이로 인해 completion.py 의 `DATE(completed_at) = CURDATE()` 비교 시
    #   KST 기준 자정~오전 09:00 사이에 완료한 루틴이 "어제 기록"으로 분류되는
    #   타임존 버그가 발생하고 있었음.
    #
    # 예시:
    #   - KST 2026-04-30 02:00 완료  →  UTC 2026-04-29 17:00 저장
    #     → CURDATE() (UTC) = 2026-04-29  → 새로고침 시 오늘 목록에서 사라짐
    #
    # 해결책 (옵션 A — 가장 깔끔):
    #   커넥션을 열 때마다 init_command 로 세션 타임존을 +09:00 으로 설정하면
    #   해당 커넥션에서 실행되는 모든 NOW() / CURDATE() / CURRENT_TIMESTAMP /
    #   DATE(컬럼) 계산이 KST 기준으로 동작.
    #
    # 주의:
    #   - 글로벌 타임존을 바꾸는 것이 아니라 "현재 세션 타임존"만 바꿈
    #   - 따라서 RDS 인스턴스 설정 변경 권한이 없어도 적용 가능
    #   - DB에 저장되는 DATETIME 값(UTC 원본) 자체는 바뀌지 않으며, 비교/표시
    #     시점에서만 KST로 해석됨 → 기존 데이터 마이그레이션 불필요
    # ────────────────────────────────────────────────────────────────────
    return pymysql.connect(
        host=os.getenv("DB_HOST"),              # AWS RDS 엔드포인트 (예: xxx.rds.amazonaws.com)
        user=os.getenv("DB_USER"),              # DB 사용자명 (예: admin)
        password=os.getenv("DB_PASSWORD"),      # DB 비밀번호
        database=os.getenv("DB_NAME"),          # 데이터베이스명 (예: capston)
        port=int(os.getenv("DB_PORT", 3306)),   # 포트 (기본값: MySQL 표준 포트 3306)
        charset="utf8mb4",                      # 한글 + 이모지까지 지원하는 인코딩
        cursorclass=pymysql.cursors.DictCursor, # SELECT 결과를 dict 형태로 반환
        # [추가 2026-04-29] 세션 타임존을 KST(+09:00)로 고정 — 위 주석 참조
        init_command="SET time_zone = '+09:00'",
    )
