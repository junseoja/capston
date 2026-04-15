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
    return pymysql.connect(
        host=os.getenv("DB_HOST"),              # AWS RDS 엔드포인트 (예: xxx.rds.amazonaws.com)
        user=os.getenv("DB_USER"),              # DB 사용자명 (예: admin)
        password=os.getenv("DB_PASSWORD"),      # DB 비밀번호
        database=os.getenv("DB_NAME"),          # 데이터베이스명 (예: capston)
        port=int(os.getenv("DB_PORT", 3306)),   # 포트 (기본값: MySQL 표준 포트 3306)
        charset="utf8mb4",                      # 한글 + 이모지까지 지원하는 인코딩
        cursorclass=pymysql.cursors.DictCursor  # SELECT 결과를 dict 형태로 반환
    )
