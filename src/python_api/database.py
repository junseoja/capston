# DB 연결 모듈
# - .env 파일에서 MySQL 접속 정보를 읽어 커넥션 생성
# - 각 라우터 함수에서 호출하여 요청마다 새로운 커넥션 사용 후 반드시 close()
# - 운영 환경에서는 커넥션 풀(connection pool) 적용 권장

import pymysql
import pymysql.cursors
from dotenv import load_dotenv
import os

# .env 파일 로드 (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)
load_dotenv()

def get_connection():
    """MySQL 커넥션 생성 및 반환

    DictCursor: 쿼리 결과를 dict 형태로 반환 (예: {"user_id": 1, "login_id": "hong"})
    charset utf8mb4: 한글 및 이모지 지원
    """
    return pymysql.connect(
        host=os.getenv("DB_HOST"),          # AWS RDS 엔드포인트
        user=os.getenv("DB_USER"),          # DB 사용자명
        password=os.getenv("DB_PASSWORD"),  # DB 비밀번호
        database=os.getenv("DB_NAME"),      # 데이터베이스명 (capston)
        port=int(os.getenv("DB_PORT", 3306)), # 포트 (기본값 3306)
        charset="utf8mb4",                  # 한글 + 이모지 지원 인코딩
        cursorclass=pymysql.cursors.DictCursor  # 결과를 dict로 반환
    )
