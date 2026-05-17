# 🏃 Routine Mate - 루틴 메이트

갓생을 위한 루틴 관리 서비스

---

## ⚡ 빠른 설치

### 1. 프론트엔드 루트 모듈 설치

```bash
npm install
```

설치되는 주요 npm 모듈
- `react`, `react-dom`, `react-router-dom`
- `vite`, `@vitejs/plugin-react`
- `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- `@types/react`, `@types/react-dom`, `globals`

### 2. Express 백엔드 모듈 설치

```bash
cd src/backend
npm install
```

설치되는 주요 npm 모듈
- `express`, `cors`, `cookie-parser`
- `bcryptjs`, `dotenv`
- `node-fetch`, `uuid`
- `multer`

### 3. 처음 세팅할 때 권장 순서

```bash
npm install
cd src/backend && npm install
cd ../python_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🛠 기술 스택

### Frontend
- React 19 (Vite)
- react-router-dom v7 (URL 기반 라우팅)

### Backend
- Node.js (Express) — 세션 관리 및 라우팅 허브
- Python (FastAPI) — 실제 DB CRUD 처리

### Database
- AWS RDS MySQL (ap-northeast-2)

---

## 📦 의존성 패키지

### 프론트엔드 (`package.json`)

```bash
npm install
```

| 패키지 | 버전 | 용도 |
|---|---|---|
| react | ^19.2.4 | UI 라이브러리 |
| react-dom | ^19.2.4 | React DOM 렌더링 |
| react-router-dom | ^7.14.0 | URL 기반 클라이언트 라우팅 |

**devDependencies**

| 패키지 | 버전 | 용도 |
|---|---|---|
| vite | ^8.0.0 | 빌드 도구 / 개발 서버 |
| @vitejs/plugin-react | ^6.0.0 | Vite React 플러그인 |
| eslint | ^9.39.4 | 코드 린터 |
| eslint-plugin-react-hooks | ^7.0.1 | React Hooks 린트 규칙 |
| eslint-plugin-react-refresh | ^0.5.2 | HMR 안전성 검사 |
| @types/react | ^19.2.14 | React 타입 정의 |
| @types/react-dom | ^19.2.3 | ReactDOM 타입 정의 |
| globals | ^17.4.0 | ESLint 전역 변수 목록 |

---

### Express 백엔드 (`src/backend/package.json`)

```bash
cd src/backend
npm install
```

| 패키지 | 버전 | 용도 |
|---|---|---|
| express | ^5.2.1 | Node.js 웹 프레임워크 |
| cors | ^2.8.6 | CORS 허용 미들웨어 |
| cookie-parser | ^1.4.7 | 쿠키 파싱 미들웨어 |
| bcryptjs | ^3.0.3 | 비밀번호 bcrypt 해싱 |
| dotenv | ^16.6.1 | `.env` 환경변수 로드 |
| node-fetch | ^2.7.0 | Express → FastAPI HTTP 요청 |
| uuid | ^13.0.0 | UUID v4 세션 ID 생성 |
| multer | ^2.1.1 | 파일 업로드 처리 (multipart/form-data) |

---

### Python FastAPI 백엔드 (`src/python_api/requirements.txt`)

```bash
cd src/python_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

| 패키지 | 버전 | 용도 |
|---|---|---|
| fastapi | 0.135.2 | Python 웹 프레임워크 |
| uvicorn | 0.42.0 | ASGI 서버 (FastAPI 실행) |
| pydantic | 2.12.5 | 요청 데이터 타입 검증 |
| PyMySQL | 1.1.2 | Python ↔ MySQL 연결 |
| python-dotenv | 1.2.2 | `.env` 환경변수 로드 |
| bcrypt | 5.0.0 | 비밀번호 해시 검증 |
| uuid6 | 2025.0.1 | UUID v7 생성 라이브러리 |
| uuid7 | 0.1.0 | UUID v7 추가 지원 |
| starlette | 1.0.0 | FastAPI 내부 ASGI 프레임워크 |
| anyio | 4.13.0 | 비동기 I/O 지원 |

---

## 📁 프로젝트 구조

```
capston-main/
├── index.html                # HTML 진입점
├── start.sh                  # 전체 서버 한번에 실행
├── .env                      # 프론트엔드 환경변수 (VITE_EXPRESS_URL)
├── src/
│   ├── frontend/             # React 프론트엔드
│   │   ├── main.jsx          # 앱 진입점 (BrowserRouter 포함)
│   │   ├── App.jsx           # 루트 컴포넌트 (라우팅 + 전역 상태 관리)
│   │   ├── config.js         # 서버 URL 환경변수 중앙 관리
│   │   ├── LoginPage.jsx     # 로그인 페이지
│   │   ├── SignupPage.jsx    # 회원가입 페이지
│   │   ├── HomePage.jsx      # 홈 페이지 (루틴 완료 체크)
│   │   ├── RoutinePage.jsx   # 루틴 관리 페이지 (CRUD)
│   │   ├── FeedPage.jsx      # 피드 페이지
│   │   └── MyPage.jsx        # 마이페이지
│   │
│   ├── css/                  # 스타일시트
│   │   ├── App.css           # 전체 레이아웃 및 컴포넌트 스타일
│   │   └── index.css         # 전역 기본 스타일
│   │
│   ├── backend/              # Node.js Express 서버 (:3000)
│   │   ├── app.js
│   │   ├── database.js       # Express → FastAPI 연결 모듈
│   │   ├── .env              # Express 환경변수 (PORT, PYTHON_API, FRONTEND_URL)
│   │   ├── uploads/          # 피드 이미지/영상 업로드 저장소
│   │   └── routes/
│   │       ├── login.js      # 인증 라우터 (로그인/회원가입/세션/중복체크)
│   │       ├── routine.js    # 루틴 CRUD 라우터
│   │       ├── completion.js # 완료 이력 라우터
│   │       ├── feed.js       # 피드 라우터 (생성/조회/삭제, 이미지 업로드)
│   │       ├── like.js       # 좋아요 라우터 (토글)
│   │       └── comment.js    # 댓글 라우터 (작성/조회/삭제)
│   │
│   └── python_api/           # FastAPI 서버 (:8000)
│       ├── app.py
│       ├── database.py       # MySQL 커넥션 모듈
│       ├── requirements.txt
│       ├── .env              # DB 접속 정보 (DB_HOST, DB_USER 등)
│       └── routers/
│           ├── user.py       # 유저 API (회원가입/세션/중복체크)
│           ├── routine.py    # 루틴 API
│           ├── completion.py # 루틴 완료 기록 API
│           ├── feed.py       # 피드 게시물 API
│           ├── like.py       # 좋아요 API
│           └── comment.py    # 댓글 API
```

---

## ⚙️ 환경 설정

> ⚠️ `.env` 파일은 모두 `.gitignore`에 등록되어 있어 Git에 올라가지 않습니다.  
> 각 `.env.example` 파일을 복사해서 `.env`로 이름을 바꾼 뒤 값을 채우세요.

### 1. 프로젝트 루트 `.env`

```bash
cp .env.example .env
```

```
# Express 백엔드 서버 URL
VITE_EXPRESS_URL=http://localhost:3000
```

### 2. Express 백엔드 `.env`

```bash
cp src/backend/.env.example src/backend/.env
```

```
# Express 서버 포트
PORT=3000

# FastAPI 서버 URL
PYTHON_API=http://localhost:8000

# Express → FastAPI 내부 호출 인증 키
# [추가 2026-05-10]
# 이유: FastAPI 포트가 직접 열려도 Express가 붙이는 내부 헤더 없이는 DB 변경 API를 호출하지 못하게 막기 위함.
# 설명: src/python_api/.env 의 INTERNAL_API_KEY 와 반드시 같은 긴 랜덤 문자열로 맞추세요.
INTERNAL_API_KEY=replace-with-a-long-random-shared-secret

# React 프론트엔드 URL (CORS 허용 대상)
FRONTEND_URL=http://localhost:5173
```

### 3. Python FastAPI `.env`

```bash
cp src/python_api/.env.example src/python_api/.env
```

```
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=capston
DB_PORT=3306

# Express → FastAPI 내부 호출 인증 키
# [추가 2026-05-10]
# 이유: FastAPI는 공개 API가 아니라 Express 뒤의 내부 데이터 계층이므로 직접 호출을 차단합니다.
# 설명: src/backend/.env 의 INTERNAL_API_KEY 와 반드시 같은 긴 랜덤 문자열로 맞추세요.
INTERNAL_API_KEY=replace-with-a-long-random-shared-secret

# DB 커넥션 풀 / 성능 측정
# [추가 2026-05-10]
# 이유: 요청마다 MySQL 연결을 새로 만들지 않고 재사용하여 RDS 연결 생성 비용을 줄입니다.
DB_POOL_SIZE=8
DB_POOL_MAX_OVERFLOW=4
SLOW_QUERY_MS=200
SLOW_REQUEST_MS=500
```

### 4. 성능 관련 선택 설정

```env
# src/backend/.env
# [추가 2026-05-10]
# 이유: 느린 Express 요청을 찾고, 통계 API 반복 조회 비용을 줄이기 위한 설정입니다.
SLOW_REQUEST_MS=500
STATS_CACHE_TTL_MS=60000
```

DB 인덱스 권장안은 `docs/performance-indexes-2026-05-10.sql`에 정리되어 있습니다.
실제 RDS에는 `SHOW INDEX`로 기존 인덱스 중복 여부를 확인한 뒤 적용하세요.

---

## 🚀 서버 실행 방법

### 빠른 실행 순서

#### 1. 의존성 설치

```bash
npm install
cd src/backend && npm install
cd ../python_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 2. `.env` 파일 3개 설정

- 프로젝트 루트 `.env`
- `src/backend/.env`
- `src/python_api/.env`

위 값들을 모두 채운 뒤 실행하세요.

#### 3. 한번에 실행 (추천)

```bash
chmod +x start.sh  # 최초 1회만
./start.sh
```

#### 4. 개별 실행

**React 프론트엔드 (포트 5173)**
```bash
npm run dev
```

**Node.js Express 서버 (포트 3000)**
```bash
cd src/backend
node app.js
```

**Python FastAPI 서버 (포트 8000)**
```bash
cd src/python_api
source venv/bin/activate   # Mac/Linux
uvicorn app:app --reload --port 8000
```

```bash
cd src/python_api
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
python -m uvicorn app:app --reload --port 8000
```

#### 5. 접속 주소

- React: `http://localhost:5173`
- Express: `http://localhost:3000`
- FastAPI: `http://localhost:8000`

---

## 🐳 Docker 로 실행하기 (권장 — 2026-05-07 도입)

### 왜 Docker 인가

기존 방식은 팀원마다 Node 버전 / Python 버전 / OS 의존성이 달라 "내 PC 에선 됐는데" 류 디버깅에 시간이 자주 들어갔다. Docker 컨테이너는 실행 환경 자체를 코드와 함께 git 으로 공유해 이 문제를 차단한다.

핵심 효과:

- Node 20 / Python 3.12 / uvicorn / multer-s3 등 모든 의존성 버전이 컨테이너 안에 못박힘
- 팀원은 Docker Desktop 한 가지만 깔면 끝 — 별도로 Node/Python/npm/pip 설치 불필요
- 코드는 호스트 폴더에 그대로 → IDE / git 워크플로우는 평소대로
- AWS RDS / S3 는 컨테이너 외부 그대로 사용

### 사전 준비

| 항목 | 비고 |
|---|---|
| Docker Desktop 설치 | https://docker.com/products/docker-desktop · Mac/Windows 자동 감지 |
| Windows: WSL2 백엔드 | Docker Desktop 설치 시 자동 권장 — Hyper-V 보다 빠름 |
| `.env` 파일 3개 | 루트 / `src/backend/` / `src/python_api/` — `.env.example` 복사 후 값 입력 |
| AWS / RDS 자격증명 | 슬랙 DM 으로 별도 전달 (절대 git 에 안 올라감) |

### 빠른 실행 (팀원용)

```bash
# 최초 1회
git clone <repo>
cd capston-main
cp .env.example .env
cp src/backend/.env.example src/backend/.env
cp src/python_api/.env.example src/python_api/.env
# 위 3개 파일에 슬랙 DM 받은 자격증명 입력

# 매번 작업 시작 시
./start-docker.sh           # 또는 docker compose up
```

브라우저: `http://localhost:5173`

> 💡 Windows 팀원은 WSL2 터미널에서 `./start-docker.sh` 실행 권장. PowerShell/CMD 에선 `docker compose up` 직접 실행.

### 매일 작업 흐름

```bash
# 아침 (백그라운드 실행)
docker compose up -d

# 작업 중 — 평소대로 IDE 로 코드 수정
#   - 호스트의 ./src 가 컨테이너 /app/src 에 마운트되어 있어
#     수정 즉시 Vite/Node --watch/uvicorn --reload 가 자동 반영
#   - git add / commit / push 도 평소대로

# 로그 보기 (필요 시)
docker compose logs -f                   # 모든 서비스
docker compose logs -f backend           # 특정 서비스만

# 컨테이너 안 쉘 진입 (디버깅)
docker compose exec backend sh
docker compose exec python_api bash

# 일과 종료
docker compose down
```

### 의존성 변경 후 재빌드 (가끔 필요)

새 npm/pip 패키지를 추가하거나 Dockerfile 을 수정한 경우:

```bash
git pull origin dev
docker compose up --build               # 이미지 다시 만든 뒤 시작
```

코드만 수정한 경우엔 `--build` 불필요 (볼륨 마운트로 자동 반영).

### 정리 명령

```bash
docker compose down                      # 컨테이너만 정리
docker compose down -v                   # 컨테이너 + named volume 까지 (node_modules 재생성됨)
docker compose down --rmi all -v         # 모든 이미지/볼륨 완전 삭제 (다음 실행 시 처음부터 빌드)
```

### 컨테이너 구성

| 서비스 | 이미지 | 포트 | 역할 |
|---|---|---|---|
| `frontend` | node:20-alpine | 5173 | Vite dev 서버 (React) |
| `backend` | node:20-alpine | 3000 | Express (인증/세션/S3 업로드) |
| `python_api` | python:3.12-slim | 8000 | FastAPI (DB CRUD) |

컨테이너 간 통신은 docker compose 내부 DNS 사용:

- 브라우저 → frontend(5173), backend(3000) — 호스트 포트로 접근
- backend → python_api — `http://python_api:8000` (서비스명)
- python_api → AWS RDS, backend → AWS S3 — 인터넷 통해 외부 접속

### 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| `port 5173 already in use` | 다른 앱이 포트 점유 | 해당 앱 종료 또는 `docker-compose.yml` 의 `ports:` 변경 |
| `AWS S3 환경변수 누락` 경고 | `src/backend/.env` 누락/오타 | `.env` 파일 확인, 4줄 정확히 입력 후 `docker compose restart backend` |
| 코드 수정해도 반영 안 됨 | 볼륨 마운트 문제 (특히 Windows) | `docker compose down && up` 으로 재시작 |
| `Cannot connect to Docker daemon` | Docker Desktop 미실행 | Docker Desktop 앱 실행 후 다시 시도 |
| 첫 실행이 너무 오래 걸림 | 이미지 다운로드 + 의존성 설치 | 정상 — 1~3분 (이후 캐시) |
| `permission denied` (sh 실행 시) | `start-docker.sh` 실행 권한 | `chmod +x start-docker.sh` |
| Windows 줄바꿈으로 sh 깨짐 | CRLF 변환 | 본 저장소는 `.gitattributes` 로 LF 강제 — 보통 자동 해결 |

### Docker 안 쓰고 싶은 팀원용 — 기존 방식

`./start.sh` 또는 위의 "서버 실행 방법" 섹션의 개별 실행 그대로 사용 가능. Docker 와 병행 가능.

---

## 🗄 데이터베이스 테이블

### 전체 테이블 관계도

```
users
  ├── routines (1:N)
  │     └── routine_completions (1:N)
  │           └── feeds (1:1)
  │                 ├── feed_images (1:N)
  │                 ├── feed_likes (1:N)
  │                 ├── feed_comments (1:N)
  │                 └── reports (1:N)              ← [추가 2026-05-13]
  ├── feed_likes (1:N)
  ├── challenges (1:N, created_by)                 ← [추가 2026-05-13]
  │     ├── challenge_participants (1:N)
  │     └── challenge_proofs (1:N)
  │           └── challenge_proof_files (1:N)
  └── notices (1:N, created_by)                    ← [추가 2026-05-13]
```

### users

| 컬럼 | 타입 | 설명 |
|---|---|---|
| user_id | CHAR(36) | 기본키 (UUID v7) |
| login_id | VARCHAR(255) | 로그인 아이디 (UNIQUE) |
| password | VARCHAR(255) | 비밀번호 (bcrypt 해시 저장) |
| nickname | VARCHAR(255) | 닉네임 |
| birth_date | DATE | 생년월일 |
| gender | ENUM('남','여','기타') | 성별 |
| email | VARCHAR(255) | 이메일 (UNIQUE) |
| profile_img | TEXT | 프로필 이미지 |
| created_at | DATETIME | 가입일 |
| deleted_at | DATETIME | [추가 2026-05-01] 회원 탈퇴 시각. NULL=활성, NOT NULL=탈퇴 |

### routines

| 컬럼 | 타입 | 설명 |
|---|---|---|
| routine_id | CHAR(36) | 기본키 (UUID v7) |
| user_id | CHAR(36) | 유저 FK |
| title | VARCHAR(255) | 루틴 제목 |
| category | VARCHAR(50) | 카테고리 |
| time_slot | ENUM('morning','lunch','dinner') | 시간대 (목표 시간으로 자동 분류) |
| routine_mode | ENUM('check','detail') | 완료 방식 |
| goal | VARCHAR(255) | 목표 시간 (예: "07:30") |
| repeat_cycle | VARCHAR(255) | 반복 주기 (예: "매일", "월, 수, 금") |
| description | TEXT | 루틴 설명 |
| created_at | DATETIME | 생성일 |
| deleted_at | DATETIME | [추가 2026-05-01] 루틴 삭제 시각. NULL=활성, NOT NULL=삭제됨 |

### sessions

| 컬럼 | 타입 | 설명 |
|---|---|---|
| session_id | VARCHAR(255) | 세션 ID (UUID v4) |
| user_id | CHAR(36) | 유저 FK |
| created_at | DATETIME | 세션 생성 시각 |
| expires_at | DATETIME | 세션 만료 시간 (로그인 시점 + 1일) |

### routine_completions

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| completion_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| routine_id | CHAR(36) | NO | FK | — | 루틴 외래키 |
| user_id | CHAR(36) | NO | FK | — | 유저 외래키 |
| completed_at | DATETIME | YES | — | CURRENT_TIMESTAMP | 완료 시간 |
| proof_text | TEXT | YES | — | NULL | 상세 루틴 인증 글 |
| deleted_at | DATETIME | YES | — | NULL | [추가 2026-05-01] 완료 취소 시각. NULL=활성, NOT NULL=취소됨 |

### feeds

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| feed_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| user_id | CHAR(36) | NO | FK | — | 유저 외래키 |
| routine_id | CHAR(36) | NO | FK | — | 루틴 외래키 |
| completion_id | CHAR(36) | NO | FK | — | 완료기록 외래키 |
| content | TEXT | YES | — | NULL | 인증 글 내용 |
| created_at | DATETIME | YES | — | CURRENT_TIMESTAMP | 작성 시간 |
| deleted_at | DATETIME | YES | — | NULL | [추가 2026-05-17] Soft Delete (신고 제재용). NULL=활성 |

### feed_images

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| image_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| feed_id | CHAR(36) | NO | FK | — | 피드 외래키 |
| file_url | TEXT | NO | — | — | 파일 저장 경로 |
| file_type | VARCHAR(50) | YES | — | NULL | image/jpeg, video/mp4 등 |
| created_at | DATETIME | YES | — | CURRENT_TIMESTAMP | 업로드 시간 |

### feed_likes

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| like_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| feed_id | CHAR(36) | NO | FK | — | 피드 외래키 |
| user_id | CHAR(36) | NO | FK | — | 유저 외래키 |
| created_at | DATETIME | YES | — | CURRENT_TIMESTAMP | 좋아요 시간 |
| — | UNIQUE | — | UNI | — | (feed_id + user_id) 중복 방지 |

### feed_comments

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| comment_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| feed_id | CHAR(36) | NO | FK | — | 피드 외래키 |
| user_id | CHAR(36) | NO | FK | — | 유저 외래키 |
| content | TEXT | NO | — | — | 댓글 내용 |
| created_at | DATETIME | YES | — | CURRENT_TIMESTAMP | 작성 시간 |

---

### 📌 2026-05-13 추가 테이블 (관리자 + 챌린지 시스템)

DDL 원본: `docs/migrations-2026-05-13-admin-challenge.sql`

#### challenges

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| challenge_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| title | VARCHAR(100) | NO | — | — | 챌린지 제목 |
| description | TEXT | YES | — | NULL | 챌린지 설명 |
| category | VARCHAR(50) | YES | — | NULL | 운동/공부/미라클모닝/건강/생활습관 등 (자유) |
| start_date | DATE | NO | — | — | 시작일 |
| end_date | DATE | NO | — | — | 종료일 |
| total_days | INT UNSIGNED | NO | — | — | 총 진행 일수 |
| participant_count | INT UNSIGNED | NO | — | 0 | 참여자 수 캐시 |
| created_by | CHAR(36) | YES | FK | NULL | 생성 관리자 user_id |
| created_at | DATETIME | NO | — | CURRENT_TIMESTAMP | 생성일 |
| updated_at | DATETIME | NO | — | CURRENT_TIMESTAMP ON UPDATE | 수정일 |
| deleted_at | DATETIME | YES | — | NULL | Soft Delete |
| — | CHECK | — | — | — | `start_date <= end_date` |

#### challenge_participants

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| participant_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| challenge_id | CHAR(36) | NO | FK | — | 챌린지 외래키 (CASCADE) |
| user_id | CHAR(36) | NO | FK | — | 유저 외래키 |
| joined_at | DATETIME | NO | — | CURRENT_TIMESTAMP | 참여일 |
| status | ENUM('ACTIVE','COMPLETED','STOPPED') | NO | — | 'ACTIVE' | 참여 상태 |
| created_at | DATETIME | NO | — | CURRENT_TIMESTAMP | 생성일 |
| updated_at | DATETIME | NO | — | CURRENT_TIMESTAMP ON UPDATE | 수정일 |
| — | UNIQUE | — | UNI | — | (challenge_id + user_id) 중복 참여 방지 |

#### challenge_proofs

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| proof_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| challenge_id | CHAR(36) | NO | FK | — | 챌린지 외래키 (CASCADE) |
| user_id | CHAR(36) | NO | FK | — | 유저 외래키 |
| content | TEXT | YES | — | NULL | 인증 글 |
| proof_date | DATE | NO | — | — | 하루 1회 인증 제한 기준 |
| created_at | DATETIME | NO | — | CURRENT_TIMESTAMP | 생성일 |
| deleted_at | DATETIME | YES | — | NULL | Soft Delete |
| — | UNIQUE | — | UNI | — | (challenge_id + user_id + proof_date) 하루 2회 방지 |

#### challenge_proof_files

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| proof_file_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| proof_id | CHAR(36) | NO | FK | — | 인증 외래키 (CASCADE) |
| file_url | VARCHAR(500) | NO | — | — | S3 URL |
| file_type | VARCHAR(50) | NO | — | — | image/jpeg, video/mp4 등 (feed_images 와 통일) |
| file_order | INT UNSIGNED | NO | — | 0 | 표시 순서 |
| created_at | DATETIME | NO | — | CURRENT_TIMESTAMP | 등록일 |

#### notices

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| notice_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| category | ENUM('일반','이벤트','점검','업데이트') | NO | — | — | NoticeList 필터와 일치 |
| title | VARCHAR(255) | NO | — | — | 공지 제목 |
| content | TEXT | NO | — | — | 공지 본문 |
| post_date | DATE | NO | — | — | 리스트 표시용 게시일 |
| created_by | CHAR(36) | YES | FK | NULL | 작성 관리자 user_id |
| created_at | DATETIME | NO | — | CURRENT_TIMESTAMP | 생성일 |
| updated_at | DATETIME | NO | — | CURRENT_TIMESTAMP ON UPDATE | 수정일 |
| deleted_at | DATETIME | YES | — | NULL | Soft Delete |

#### reports

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| report_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| feed_id | CHAR(36) | NO | FK | — | 신고된 게시글 외래키 |
| reporter_user_id | CHAR(36) | NO | FK | — | 신고한 사용자 user_id |
| target_user_id | CHAR(36) | NO | FK | — | 게시글 작성자 user_id |
| report_category | ENUM(6종) | NO | — | — | 욕설/비방, 부적절한 홍보, 도용/저작권, 스팸/도배, 음란/혐오, 기타 |
| report_detail | TEXT | YES | — | NULL | 상세 사유 (선택) |
| status | ENUM('pending','completed') | NO | — | 'pending' | 처리 상태 |
| admin_comment | TEXT | YES | — | NULL | 관리자가 제재 시 작성 |
| processed_by | CHAR(36) | YES | FK | NULL | 처리한 관리자 user_id |
| created_at | DATETIME | NO | — | CURRENT_TIMESTAMP | 신고 접수 시각 |
| processed_at | DATETIME | YES | — | NULL | 관리자 조치 완료 시각 |
| deleted_at | DATETIME | YES | — | NULL | Soft Delete |

---

### 🔗 외래키 관계

```
users ──────────────────────────────────────────┐
  │                                             │
  ├── routines                                  │
  │     └── routine_completions ────────────────┤
  │               └── feeds ────────────────────┤
  │                     ├── feed_images         │
  │                     ├── feed_likes ─────────┤
  │                     ├── feed_comments       │
  │                     └── reports ────────────┤  ← [추가 2026-05-13]
  │                           (reporter,target,
  │                            processed_by 도
  │                            users 참조)
  │                                             │
  ├── challenges (created_by)                   │  ← [추가 2026-05-13]
  │     ├── challenge_participants ─────────────┤
  │     └── challenge_proofs ───────────────────┤
  │           └── challenge_proof_files
  │                                             │
  └── notices (created_by)                      │  ← [추가 2026-05-13]
```

### ⚠️ 삭제 정책

#### 기존 (Hard Delete + CASCADE)

| 삭제 대상 | 연쇄 삭제 범위 |
|---|---|
| users 삭제 | 관련 모든 데이터 자동 삭제 |
| feeds 삭제 | images, likes, comments 자동 삭제 |

#### Soft Delete (deleted_at 적용 테이블)

| 테이블 | Soft Delete 도입 시점 |
|---|---|
| users / routines / routine_completions | 2026-05-01 |
| challenges / challenge_proofs / notices / reports | 2026-05-13 |
| feeds | 2026-05-17 (신고 제재용, `migrations-2026-05-17-feeds-soft-delete.sql`) |

→ 위 테이블들은 `DELETE` 대신 `UPDATE deleted_at = NOW()`. 모든 SELECT 는 `WHERE deleted_at IS NULL` 필터 필요.

#### CASCADE (관리자/챌린지 영역, 2026-05-13 추가)

| 삭제 대상 | 연쇄 삭제 범위 |
|---|---|
| challenges 삭제 (hard) | participants, proofs, proof_files 자동 삭제 |
| challenge_proofs 삭제 (hard) | proof_files 자동 삭제 |

> 실무에서는 챌린지도 Soft Delete 사용 권장. CASCADE 는 개발/테스트 환경에서 잘못 삽입된 데이터 정리용으로 활용.

---

## 📡 API 명세

### Express (:3000) — 인증

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /signup | 회원가입 |
| POST | /login | 로그인 (세션 쿠키 발급) |
| GET | /me | 현재 로그인 유저 정보 조회 |
| POST | /logout | 로그아웃 |
| GET | /check-duplicate | 아이디/닉네임 중복체크 |

### Express (:3000) — 루틴

| 메서드 | URL | 설명 |
|---|---|---|
| GET | /routine | 내 루틴 목록 조회 |
| POST | /routine | 루틴 생성 |
| DELETE | /routine/:id | 루틴 삭제 (화면 상태만이 아니라 DB `routines` 테이블에서도 실제 삭제) |

### Express (:3000) — 루틴 완료 기록

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /completion | 루틴 완료 기록 생성 |
| GET | /completion/today | 오늘 완료 목록 조회 |
| GET | /completion/history | 최근 완료 이력 조회 |
| DELETE | /completion/:completion_id | 완료 기록 삭제/취소 |

### FastAPI (:8000) — 유저

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /user/signup | 유저 DB 저장 |
| GET | /user/{login_id} | 유저 조회 |
| POST | /user/session | 세션 DB 저장 |
| GET | /user/session/{session_id} | 세션 조회 |
| DELETE | /user/session/{session_id} | 세션 삭제 |
| GET | /user/check/login_id/{login_id} | 아이디 중복체크 |
| GET | /user/check/nickname/{nickname} | 닉네임 중복체크 |

### FastAPI (:8000) — 루틴

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /routine/ | 루틴 생성 |
| GET | /routine/{user_id} | 유저 루틴 전체 조회 |
| DELETE | /routine/{routine_id} | 루틴 삭제 (`WHERE routine_id = ? AND user_id = ?` 조건으로 DB에서 실제 삭제) |

### FastAPI (:8000) — 루틴 완료 기록

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /completion/ | 루틴 완료 기록 생성 |
| GET | /completion/today/{user_id} | 오늘 완료 목록 조회 |
| GET | /completion/history/{user_id} | 전체 완료 이력 조회 |
| DELETE | /completion/{completion_id} | 완료 기록 삭제 |

### FastAPI (:8000) — 피드

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /feed/ | 피드 게시물 생성 |
| POST | /feed/image | 피드 이미지 추가 |
| GET | /feed/ | 전체 피드 목록 조회 (최신순) |
| GET | /feed/{feed_id} | 피드 상세 조회 (이미지+댓글 포함) |
| DELETE | /feed/{feed_id} | 피드 삭제 |

### FastAPI (:8000) — 좋아요

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /like/ | 좋아요 추가 / 취소 (토글) |
| GET | /like/{feed_id} | 좋아요 수 조회 |
| GET | /like/{feed_id}/{user_id} | 특정 유저 좋아요 여부 확인 |

### FastAPI (:8000) — 댓글

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /comment/ | 댓글 작성 |
| GET | /comment/{feed_id} | 피드 댓글 목록 조회 |
| DELETE | /comment/{comment_id} | 댓글 삭제 |

---

## 🏗 아키텍처 흐름

```
React (:5173)
    ↓ HTTP + 쿠키
Express (:3000)  ← 세션 관리 (DB 저장 방식)
    ↓ node-fetch
FastAPI (:8000)  ← 실제 DB 쿼리
    ↓ pymysql
AWS RDS MySQL
```

---


## ✅ 구현 완료 기능

- [x] 회원가입 (유효성 검사, 아이디/닉네임 중복체크, DB 저장)
- [x] 로그인 (쿠키 세션 방식, DB 세션 저장)
- [x] 로그아웃 (DB 세션 삭제)
- [x] 루틴 생성 / 조회 / 삭제
- [x] 루틴 반복 요일 선택
- [x] 루틴 시간 자동 분류 (아침/점심/저녁)
- [x] 상세 인증형 루틴 완료 처리
- [x] 인증 글 작성 및 사진 / 동영상 업로드
- [x] 피드 게시물 업로드 및 카드형 UI 구현
- [x] 피드 좋아요 기능
- [x] 댓글 모달 UI 및 댓글 작성 / 삭제 기능
- [x] 마이페이지 유저 정보 및 루틴 수 표시
- [x] UUID v7 기반 PK (user_id, routine_id 등)
- [x] 피드 UI (인스타그램 스타일, 좋아요 토글)
- [x] 루틴 완료 기록 / 피드 / 좋아요 / 댓글 FastAPI 라우터 구현
- [x] 피드 / 좋아요 / 댓글 Express 라우터 구현 및 프론트엔드 연결
- [x] 피드 이미지/영상 업로드 (multer + Express 정적 서빙)
- [x] 피드 목록 DB 기반 최신순 조회 (메모리 → DB 전환 완료)


---

## 🔧 2026-04-10 작업 내역

### 1. HomePage ↔ RoutinePage 데이터 연결 문제 해결
- **문제**: `RoutinePage`는 DB에서 루틴을 가져오는데 `HomePage`는 빈 배열을 사용 → 홈에서 루틴이 안 보이는 버그
- **해결**:
  - `App.jsx`에 `fetchRoutines()` 함수 추가 → 로그인 시 DB에서 루틴 fetch
  - DB 컬럼명 → 컴포넌트 필드명 변환 처리 (`routine_id→id`, `time_slot→time`, `routine_mode→routineMode`, `repeat_cycle→repeat`)
  - `RoutinePage`에 `onRoutineChange` props 연결 → 루틴 추가/삭제 시 `HomePage`도 자동 갱신

### 2. 브라우저 뒤로가기 버튼 지원
- **변경**: 커스텀 `page` 상태 → `react-router-dom` URL 기반 라우팅으로 전환
- `main.jsx`에 `BrowserRouter` 추가
- `App.jsx`에서 `useNavigate` + `Routes/Route` 사용
- 각 페이지 URL: `/` (홈), `/routine`, `/feed`, `/mypage`, `/login`, `/signup`
- 비로그인 상태에서 내부 URL 접근 시 `/login`으로 자동 리다이렉트

### 3. 로그인/회원가입 Enter 키 지원
- `LoginPage.jsx`: 아이디/비밀번호 input에 `onKeyDown` 추가 → Enter 키로 로그인 실행
- `SignupPage.jsx`: 기존 `<form onSubmit>` 구조로 이미 동작

### 4. 전체 코드 주석 작성 (1차)
- 프론트엔드 8개 파일, 백엔드 7개 파일 전체 한국어 주석 작성
- 각 함수/컴포넌트의 역할, props 구조, API 흐름, 미구현 사항 명시

---

## 🔧 2026-04-13 작업 내역

### 피드 화면 개선 (김찬엽)
- 피드 UI를 인스타그램 스타일에 가깝게 수정
- 닉네임, 루틴 제목, 카테고리, 인증 글, 사진/영상 순으로 게시물 구조 변경
- 게시물 하단에 좋아요/댓글 영역 추가
- 좋아요 클릭 시 하트 색상 변경 및 좋아요 수 반영 기능 추가

## 🔧 2026-04-14 작업 내역

### 피드 댓글 모달 기능 개선 (김찬엽)
- 댓글 버튼 클릭 시 게시물 상세 모달이 열리도록 구현
- 모달 배경 blur 처리 및 뒤 화면 선택 불가 처리
- 모달 왼쪽에는 인증 사진 / 영상, 오른쪽에는 게시물 정보와 댓글 영역이 보이도록 구성
- 댓글 작성 기능 추가
- 본인 댓글 삭제 기능 추가
- 댓글 삭제 전 확인창이 뜨도록 처리
- 댓글이 많아질 경우 댓글 영역만 스크롤되도록 수정
- 모달 하단의 좋아요 버튼과 댓글 입력창이 고정되도록 개선

### 댓글 UI 정리 (김찬엽)
- 댓글 작성자 이름과 댓글 내용이 한 줄 흐름으로 보이도록 수정
- 댓글이 길어져도 자연스럽게 줄바꿈되도록 스타일 조정

---

## 🔧 2026-04-15 작업 내역

### 1. 전체 코드 리뷰 및 버그/보안 이슈 발견
전체 소스 파일(프론트 8개 + Express 4개 + FastAPI 8개 = 총 20개)을 분석하여 아래 이슈 확인

| 구분 | 파일 | 내용 |
|---|---|---|
| 🔴 버그 | `login.js` | `/check-duplicate` 라우트 미구현 — `SignupPage`에서 호출하지만 라우터 없음 |
| 🔴 버그 | `App.jsx` | `fetchCurrentUser` 함수 내 한글 오류 메시지 인코딩 깨짐 수정 |
| 🔴 버그 | `App.jsx` | 로그아웃 시 `feedPosts`, `currentUser` 상태 미초기화 → 다른 유저 로그인 시 이전 데이터 잔존 |
| 🟡 보안 | `user.py`, `login.js` | 비밀번호 평문 저장/비교 — bcrypt 해싱 적용 필요 |
| 🟡 보안 | `routine.js` | `DELETE /routine/:id` 인증 없음 — 누구나 routine_id만 알면 삭제 가능 |
| 🟡 보안 | `feed.py`, `comment.py` | 삭제 엔드포인트에 권한 검증 없음 |
| 🟠 품질 | `FeedPage.jsx` | `useState`, `useEffect` import 후 미사용 |
| 🟠 품질 | `HomePage.jsx` | `URL.createObjectURL()` 생성 후 `revokeObjectURL()` 미호출 → 메모리 누수 가능성 |
| 🟠 품질 | `MyPage.jsx` | 최근 활동 내역 더미 데이터 하드코딩 |

### 2. 전체 코드 주석 세분화 (2차 — 전면 개정)
프론트엔드 및 백엔드 전 파일에 상세 주석 추가

**프론트엔드 (JSX)**

| 파일 | 주요 추가 주석 내용 |
|---|---|
| `main.jsx` | BrowserRouter, StrictMode 역할 및 동작 원리 |
| `App.jsx` | 전역 상태 구조, 각 핸들러 JSDoc, 라우트 구조 설명 |
| `LoginPage.jsx` | credentials 동작 원리, 세션 쿠키 흐름 |
| `SignupPage.jsx` | 유효성 검사 전략, 각 검사 함수 JSDoc, 생년월일 일수 계산 로직 |
| `HomePage.jsx` | 주차 날짜 계산, Object URL 메모리 주의, 인증 박스 토글 메커니즘 |
| `RoutinePage.jsx` | time_slot 자동 분류 로직, 데이터 흐름, 요일 배열 토글 |
| `FeedPage.jsx` | 미사용 import 표시, 미디어 MIME 타입 분기 설명 |
| `MyPage.jsx` | fetch 순서, 더미 데이터 TODO, 개선 방향 명시 |

**백엔드 — Express (JS)**

| 파일 | 주요 추가 주석 내용 |
|---|---|
| `app.js` | 전체 아키텍처 흐름, 미들웨어 역할, 등록된 라우트 목록 |
| `database.js` | 각 함수 JSDoc (파라미터/반환값/사용처), FastAPI 중계 구조 |
| `routes/login.js` | 세션 발급 흐름, /check-duplicate 미구현 구현 예시 코드 포함 |
| `routes/routine.js` | DELETE 인증 없음 보안 TODO, 각 라우트 처리 흐름 |

**백엔드 — FastAPI (Python)**

| 파일 | 주요 추가 주석 내용 |
|---|---|
| `app.py` | 아키텍처 흐름, 각 라우터의 URL 목록 |
| `database.py` | get_connection 사용 예시, 커넥션 풀 개선 안내 |
| `routers/user.py` | 전체 엔드포인트 docstring, 평문 비밀번호 bcrypt TODO |
| `routers/routine.py` | 권한 없는 DELETE TODO, UUID v7 정렬 특성 설명 |
| `routers/completion.py` | 프론트 미연결 상태 안내, 각 엔드포인트 상세 설명 |
| `routers/feed.py` | JOIN 쿼리 설명, LEFT JOIN 이유, 권한 검사 TODO |
| `routers/like.py` | 토글 메커니즘, 두 번째 커넥션 사용 이유 설명 |
| `routers/comment.py` | disabled 상태 안내, 삭제 권한 TODO |

### 3. README 전면 개정
- 깨진 테이블 포맷 수정 (routine_completions, feeds, feed_images, feed_likes, feed_comments)
- 프로젝트 구조에 누락된 라우터 파일 추가 (completion.py, feed.py, like.py, comment.py)
- API 명세에 완료 기록 / 피드 / 좋아요 / 댓글 FastAPI 라우터 추가
- 외래키 관계, 삭제 정책 섹션 표 형식 통일
- 아키텍처 흐름 설명 수정 (메모리 Map → DB 저장 방식)

### 4. 버그/보안/품질 이슈 수정

코드 리뷰에서 발견된 이슈를 실제 코드에 반영하고, 수정 과정에서 추가 문제가 발생하여 해결함

#### 4-1. 비밀번호 bcrypt 해싱 적용

- **작업**: `login.js` 회원가입 시 `bcrypt.hash(password, 10)`으로 해싱 후 DB 저장, 로그인 시 `bcrypt.compare()`로 비교하도록 변경
- **에러 사항**: 수정 후 기존에 가입된 계정(평문 비밀번호 저장)으로 로그인하면 "비밀번호가 틀렸습니다" 오류 발생. 원인은 DB에 저장된 값이 bcrypt 해시가 아니므로 `bcrypt.compare()`가 항상 false를 반환하기 때문
- **해결**: 로그인 시 DB에 저장된 비밀번호가 bcrypt 해시(`$2b$`로 시작)인지 평문인지 자동 판별하여 비교 방식을 분기 처리. 기존 계정은 평문 비교, 신규 가입 계정은 bcrypt 비교

```js
const isBcryptHash = user.password.startsWith("$2b$") || user.password.startsWith("$2a$");
const isMatch = isBcryptHash
    ? await bcrypt.compare(password, user.password)
    : password === user.password;
```

#### 4-2. 회원가입 중복체크 라우트 구현

- **작업**: `SignupPage.jsx`에서 중복체크 버튼 클릭 시 `GET /check-duplicate`를 호출하는데, Express에 해당 라우트가 없었음
- **에러 사항**: 중복체크 버튼을 눌러도 404 응답 → `checkStatus.checked`가 `false`로 유지 → 중복체크 미통과 시 폼 제출 자체가 차단되어 회원가입 불가
- **해결**: `login.js`에 `GET /check-duplicate` 라우트 추가. `field=userId`이면 FastAPI `/user/check/login_id/`로, `field=nickname`이면 `/user/check/nickname/`으로 중계

#### 4-3. 루틴/피드/댓글 삭제 권한 검증 추가

- **작업**: 기존 DELETE 엔드포인트는 `routine_id`만 알면 누구나 삭제 가능한 보안 취약점 존재
- **해결**:
  - `routes/routine.js`: DELETE 요청 시 세션 쿠키로 로그인 여부 확인 후 `user_id`를 FastAPI에 전달
  - `routers/routine.py`, `feed.py`, `comment.py`: `WHERE id = ? AND user_id = ?` 조건으로 삭제, `rowcount == 0`이면 권한 없음으로 판단

#### 4-4. Object URL 메모리 누수 수정 (`HomePage.jsx`)

- **작업**: `URL.createObjectURL()`로 생성한 미리보기 URL을 `revokeObjectURL()` 없이 방치 → 파일 선택을 반복할수록 브라우저 메모리 점유 누적
- **해결**: `useRef`로 생성된 URL 목록을 추적하고, 파일 재선택 시 이전 URL을 즉시 해제, 컴포넌트 언마운트 시 전체 해제하는 cleanup 로직 추가

#### 4-5. 마이페이지 완료 이력 API 연결 (`MyPage.jsx`)

- **작업**: 최근 활동 섹션에 "아침 스트레칭 완료", "물 2L 마시기" 등 더미 데이터가 하드코딩되어 있었음
- **해결**:
  - `GET /completion/history` Express 라우트 신규 추가 (세션 인증 포함)
  - `database.js`에 `getCompletionHistory()` 함수 추가 → FastAPI `GET /completion/history/{user_id}` 호출
  - `MyPage.jsx`를 실제 완료 이력 데이터로 렌더링하도록 전환. `Promise.all`로 3개 요청(유저 정보 / 루틴 수 / 완료 이력) 병렬 fetch로 성능 개선
  - `completed_at` 타임스탬프를 "오늘" / "어제" / "N일 전"으로 변환하는 `formatDate()` 헬퍼 함수 추가

### 5. API 명세 및 프로젝트 구조 업데이트

| 항목 | 변경 내용 |
|---|---|
| `GET /check-duplicate` | ⚠️ 미구현 → ✅ 구현 완료로 상태 변경 |
| `GET /completion/history` | Express 라우트 신규 추가 (`routes/completion.js`) |
| `users` 테이블 | password 컬럼 설명을 "평문 저장" → "bcrypt 해시 저장"으로 수정 |
| 프로젝트 구조 | `routes/completion.js` 파일 추가 |

### 6. 루틴 완료 기록 백엔드 영속화/권한 검증 보강 (추가 작업)

- **작업 배경**: 로그인 + 루틴 기능을 우선 완성하기 위해, 프론트 메모리 상태에만 머물던 완료 처리 흐름을 백엔드 기준으로 먼저 정리
- **수정 파일**:
  - `src/backend/routes/completion.js`
  - `src/backend/database.js`
  - `src/python_api/routers/completion.py`
  - `src/App.jsx` (주석만 보강)

#### 6-1. Express 완료 라우트 확장

- **작업**: 기존 `GET /completion/history`만 있던 Express 라우트에 아래 엔드포인트 추가
  - `POST /completion`
  - `GET /completion/today`
  - `DELETE /completion/:completion_id`
- **의도**:
  - 홈 화면 완료 체크를 DB에 저장할 수 있는 백엔드 진입점 마련
  - 새로고침 후 오늘 완료 목록을 다시 읽을 수 있는 API 확보
  - 완료 취소 시 클라이언트가 FastAPI를 직접 치지 않고 Express 세션 검증을 거치도록 강제

#### 6-2. Express → FastAPI 브리지 함수 추가

- **작업**: `database.js`에 아래 함수 추가
  - `createCompletion()`
  - `getTodayCompletions()`
  - `deleteCompletion()`
- **의도**:
  - Express 라우터가 완료 생성/오늘 조회/삭제를 일관된 방식으로 FastAPI에 위임
  - 기존 `database.js` 구조와 동일한 패턴으로 completion 계층도 정리

#### 6-3. FastAPI 완료 삭제 권한 검증 강화

- **작업**: `routers/completion.py`의 `DELETE /completion/{completion_id}`를 수정
- **기존 문제**:
  - `completion_id`만 알면 해당 완료 기록을 삭제할 수 있는 구조였음
  - 루틴 삭제와 달리 `user_id` 소유자 검증이 빠져 있었음
- **해결**:
  - Query 파라미터로 `user_id`를 함께 받도록 변경
  - SQL을 `WHERE completion_id = %s AND user_id = %s` 조건으로 수정
  - `rowcount == 0`이면 권한 없음 또는 대상 없음으로 처리

#### 6-4. 프론트 연동 시 주의사항을 App.jsx 주석에 기록

- **작업**: `App.jsx`의 `cancelRoutineCompletion` TODO 주변에 추가 주석 작성
- **내용**:
  - 완료 취소는 FastAPI를 직접 호출하지 말고 반드시 Express `DELETE /completion/:completion_id`를 통해 호출해야 함
  - 이유는 Express가 세션에서 `user_id`를 붙이고, FastAPI가 `completion_id + user_id`로 본인 기록만 삭제하도록 검증하기 때문
  - 나중에 프론트가 완료 취소 API를 연결할 때 `completion_id`를 함께 저장해야 한다는 점 명시

#### 6-5. 백엔드 수정 범위 문법 검증

- **검증 명령어**:
  - `node --check src/backend/routes/completion.js`
  - `node --check src/backend/database.js`
  - `python3 -m py_compile src/python_api/routers/completion.py`
- **결과**: 세 파일 모두 문법 검증 통과

### 7. 로그인 복구 / 완료 복구 / 품질 정리 (오늘 추가 작업)

- **작업 배경**: 백엔드에 준비된 세션/완료 API를 실제 앱 동작과 연결하고, 로그인 + 루틴 기능을 새로고침 이후에도 일관되게 동작하도록 마무리
- **수정 파일**:
  - `src/App.jsx`
  - `src/HomePage.jsx`
  - `src/RoutinePage.jsx`
  - `src/SignupPage.jsx`
  - `src/backend/routes/login.js`
  - `eslint.config.js`
  - `README.md`

#### 7-1. App 시작 시 세션 복구(`/me`) 연결

- **작업**: `App.jsx`에 `authChecked` 상태와 초기 `useEffect` 추가
- **해결 내용**:
  - 앱 시작 시 `GET /me` 호출
  - 유효한 세션 쿠키가 있으면 `isLoggedIn`, `currentUser` 복구
  - 세션 확인 전에는 보호 라우트를 즉시 리다이렉트하지 않고 로딩 화면 표시
- **효과**:
  - 새로고침해도 로그인 유지
  - 직접 URL 접근 시에도 세션이 살아 있으면 다시 로그인 화면으로 튕기지 않음

#### 7-2. 오늘 완료 상태 복구(`/completion/today`) 연결

- **작업**: `App.jsx`의 `fetchRoutines()`를 확장하여 `GET /routine`과 `GET /completion/today`를 병렬 호출
- **해결 내용**:
  - 루틴 목록을 가져온 뒤 오늘 완료 기록과 `routine_id` 기준으로 매칭
  - `completed`, `completionId`, `completedAt`, `proofText`를 초기 상태에 반영
- **효과**:
  - 루틴 완료 후 새로고침해도 오늘 완료 상태 유지
  - 홈 화면과 완료 기록 데이터의 기준이 통일됨

#### 7-3. 완료 생성 / 완료 취소를 실제 백엔드 API로 연결

- **작업**: `App.jsx`의 완료 처리 함수를 로컬 state 전용 로직에서 실제 API 호출 구조로 변경
- **해결 내용**:
  - 체크 루틴 완료 → `POST /completion`
  - 상세 루틴 완료 → `POST /completion`
  - 완료 취소 → `DELETE /completion/:completion_id`
  - 성공 시 각 루틴 상태에 `completionId` 저장
- **효과**:
  - 완료 기록이 실제 DB에 저장됨
  - 완료 취소도 Express 세션 검증 + FastAPI 소유자 검증을 거쳐 안전하게 수행

#### 7-4. 상세 루틴 인증 UI 안정화

- **작업**: `HomePage.jsx`의 상세 루틴 제출 흐름 보정
- **기존 문제**:
  - 완료 저장 실패 시에도 입력창이 먼저 초기화될 수 있었음
  - 제출 직후 `blob URL`을 해제하여 완료 카드/피드 미리보기가 깨질 수 있었음
- **해결**:
  - `onCompleteDetail()` 성공 여부를 받은 뒤에만 입력 상태 초기화
  - 제출 직후 `revokeObjectURL()`을 호출하지 않도록 수정
- **효과**:
  - 저장 실패 시 사용자 입력 유지
  - 업로드한 이미지/영상 미리보기 안정성 개선

#### 7-5. 회원가입 입력 검증 보강

- **작업**: `src/backend/routes/login.js`의 `POST /signup` 입력 검증 강화
- **추가 검증 항목**:
  - `nickname`, `email`, `gender`, `birth` 필수 확인
  - 생년월일 숫자/실제 날짜 유효성 검사
  - 이메일 형식 검사
  - 성별 값이 `"남"`, `"여"`, `"기타"` 중 하나인지 확인
- **효과**:
  - 잘못된 요청이 들어와도 500 대신 400으로 명확히 응답
  - 프론트 외 클라이언트 호출에도 백엔드 안정성 향상

#### 7-6. ESLint 환경 분리 및 프론트 lint 오류 정리

- **작업**: `eslint.config.js`를 프론트/백엔드 환경으로 분리
- **해결 내용**:
  - 프론트(`src/**/*.js,jsx`)는 브라우저 환경
  - Express(`src/backend/**/*.js`)는 Node/CommonJS 환경
  - 기존 `require is not defined`, `module is not defined` 노이즈 제거
- **추가 정리**:
  - `RoutinePage.jsx`의 초기 fetch 구조를 React Hooks lint 규칙에 맞게 정리
  - `SignupPage.jsx`의 불필요한 정규식 escape 수정
- **검증 결과**:
  - `npm run lint` 통과

#### 7-7. README 보강

- **작업**:
  - 루틴 삭제 API 설명에 “화면 상태만이 아니라 DB에서도 실제 삭제”된다는 점 명시
  - FastAPI 루틴 삭제 설명에 `WHERE routine_id = ? AND user_id = ?` 조건 반영
- **효과**:
  - README만 봐도 루틴 삭제가 실제 DB 삭제까지 포함된다는 점을 바로 이해 가능

---


### 🔧 2026-04-16 작업 내역

### 1. 전체 코드 리뷰 및 피드백

전체 소스 파일(프론트 8개 + Express 4개 + FastAPI 8개)을 분석하여 문제점 도출

| 구분 | 내용 |
|---|---|
| 🔴 버그 | `app.js` `PORT` 중복 선언 → `SyntaxError` Express 서버 기동 불가 |
| 🔴 버그 | `SignupPage.jsx` 중복체크 URL에 `encodeURIComponent` 누락 → 특수문자 입력 시 URL 파괴 |
| 🔴 기능 누락 | 루틴 수정(편집) 기능 없음 — 삭제 후 재생성만 가능 |
| 🟡 보안 | 평문 비밀번호 병행 비교 로직 잔존 (`login.js`) |
| 🟡 보안 | `database.js` 각 함수에 try-catch 없음 — FastAPI 다운 시 Express 크래시 가능 |
| 🟠 품질 | 모든 fetch 호출에 `localhost:3000`, `localhost:8000` 하드코딩 |
| 🟠 품질 | `start.sh` 절대경로(`/Users/sayongja/...`) 하드코딩 |
| 🟠 품질 | `src/` 루트에 JSX, CSS, JS 파일이 혼재 — 폴더 구분 없음 |

---

### 2. 서버 URL 환경변수화

모든 하드코딩된 서버 주소를 `.env` 파일 기반으로 전환

#### 2-1. 환경변수 파일 생성

| 파일 | 내용 |
|---|---|
| `.env` (프로젝트 루트) | `VITE_EXPRESS_URL=http://localhost:3000` |
| `.env.example` (루트) | 팀원 공유용 템플릿 |
| `src/backend/.env` | `PORT`, `PYTHON_API`, `FRONTEND_URL` |
| `src/backend/.env.example` | 팀원 공유용 템플릿 |

#### 2-2. Express 백엔드 적용

- `src/backend/app.js`: `require("dotenv").config()` 추가, `PORT` · `FRONTEND_URL` 환경변수화
- `src/backend/database.js`: `PYTHON_API` 상수를 `process.env.PYTHON_API || "http://localhost:8000"` 로 변경
- `src/backend/routes/login.js`: 동일하게 `PYTHON_API` 환경변수화
- `src/backend/package.json`: `dotenv ^16.6.1` 의존성 추가 및 설치

#### 2-3. React 프론트엔드 적용

- `src/frontend/config.js` 신규 생성 — `EXPRESS_URL` 상수를 한 곳에서 관리
  ```js
  export const EXPRESS_URL = import.meta.env.VITE_EXPRESS_URL ?? "http://localhost:3000";
  ```
- `LoginPage.jsx`, `SignupPage.jsx`, `App.jsx`, `RoutinePage.jsx`, `MyPage.jsx` — 하드코딩 URL 19곳을 `${EXPRESS_URL}/...` 로 일괄 교체
- `SignupPage.jsx` 중복체크 URL에 `encodeURIComponent()` 추가 (버그 수정 겸)

---

### 3. `start.sh` 개선

| 항목 | 이전 | 이후 |
|---|---|---|
| 경로 | `/Users/sayongja/...` 절대경로 | `$SCRIPT_DIR` 기반 상대경로 |
| FastAPI 포트 | `--port 8000` 하드코딩 | `src/backend/.env`의 `PYTHON_API`에서 포트 추출 |
| Express 포트 | echo에만 3000 고정 | `.env`의 `PORT` 변수 사용 |
| 출력 URL | 하드코딩 | `.env` 변수 출력 |
| .env 없을 때 | 에러 없이 오작동 | 경고 메시지 출력 후 기본값으로 실행 |

---

### 4. `src/` 폴더 구조 재편

JSX · CSS · JS 파일이 `src/` 루트에 혼재하던 구조를 역할별 폴더로 분리

```
[이전]                          [이후]
src/                            src/
├── App.jsx                     ├── frontend/         ← JSX + config.js
├── main.jsx                    │   ├── main.jsx
├── LoginPage.jsx               │   ├── App.jsx
├── SignupPage.jsx              │   ├── config.js
├── HomePage.jsx                │   ├── LoginPage.jsx
├── RoutinePage.jsx             │   ├── SignupPage.jsx
├── FeedPage.jsx                │   ├── HomePage.jsx
├── MyPage.jsx                  │   ├── RoutinePage.jsx
├── App.css                     │   ├── FeedPage.jsx
├── index.css                   │   └── MyPage.jsx
├── config.js                   ├── css/              ← CSS
├── backend/                    │   ├── App.css
└── python_api/                 │   └── index.css
                                ├── backend/
                                └── python_api/
```

**수정된 import 경로**

| 파일 | 변경 내용 |
|---|---|
| `index.html` | `/src/main.jsx` → `/src/frontend/main.jsx` |
| `main.jsx` | `'./index.css'` → `'../css/index.css'` |
| `App.jsx` | `'./App.css'` → `'../css/App.css'` |
| 나머지 JSX | `'./config'` → 변경 없음 (`config.js`도 `frontend/`로 함께 이동) |

---

### 5. 버그 수정 — `app.js` PORT 중복 선언

- **원인**: 환경변수화 작업 시 `const PORT = process.env.PORT || 3000`을 추가했으나 기존 `const PORT = 3000` 줄을 제거하지 않음 → `SyntaxError: Identifier 'PORT' has already been declared`
- **증상**: Express 서버 기동 불가 (서버 접속 오류)
- **해결**: `app.js` 42번째 줄의 중복 `const PORT = 3000` 제거

---

### 6. README 패키지 목록 추가

전체 의존성 패키지를 README에 정리

| 영역 | 추가된 패키지 | 설치 명령 |
|---|---|---|
| 프론트엔드 | react, react-dom, react-router-dom + devDeps 8개 | `npm install` |
| Express | express, bcryptjs, cors, cookie-parser, **dotenv**, node-fetch, uuid | `cd src/backend && npm install` |
| FastAPI | fastapi, uvicorn, pydantic, PyMySQL, python-dotenv, bcrypt, uuid7 등 | `pip install -r requirements.txt` |

환경 설정 섹션도 `.env` 파일 3개(루트 / backend / python_api) 전부 안내하도록 개정



## 🔧 2026-04-18 작업 내역

### 1. 피드/좋아요/댓글 Express 라우터 신규 생성 — 백엔드 API 완전 연결

기존에 FastAPI에만 구현되어 있던 피드, 좋아요, 댓글 API를 Express에서 세션 인증을 거쳐 중계하도록 Express 라우터 3개를 신규 생성.

#### 1-1. Express 피드 라우터 (`routes/feed.js`)

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /feed | 피드 생성 (multipart/form-data, 이미지 업로드 포함) |
| GET | /feed | 전체 피드 목록 조회 (이미지 + 현재 유저 좋아요 상태 + 댓글 포함, 최신순) |
| DELETE | /feed/:feed_id | 피드 삭제 (세션 인증 + 본인 소유 검증) |

- **파일 업로드**: `multer` 패키지로 multipart/form-data 처리, 파일은 `src/backend/uploads/`에 저장
- **파일명 충돌 방지**: `timestamp-랜덤숫자.확장자` 형식으로 저장
- **파일 제한**: 파일당 최대 50MB, 이미지/영상만 허용 (MIME 타입 필터)
- **GET /feed 응답 구조**: 각 피드에 대해 FastAPI `GET /feed/{feed_id}` (이미지/댓글) + `GET /like/{feed_id}/{user_id}` (좋아요 여부)를 `Promise.all`로 병렬 조회하여 하나의 응답으로 합침

#### 1-2. Express 좋아요 라우터 (`routes/like.js`)

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /like | 좋아요 토글 — 추가/취소 (세션 인증, user_id 자동 주입) |

- 클라이언트는 `feed_id`만 전달, `user_id`는 세션에서 추출하여 FastAPI에 전달
- FastAPI의 INSERT → IntegrityError 시 DELETE 토글 메커니즘 그대로 활용

#### 1-3. Express 댓글 라우터 (`routes/comment.js`)

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /comment | 댓글 작성 (세션 인증, user_id 자동 주입) |
| GET | /comment/:feed_id | 피드 댓글 목록 조회 (세션 인증) |
| DELETE | /comment/:comment_id | 댓글 삭제 (세션 인증 + 본인 소유 검증) |

#### 1-4 에로사항
 요약 (우선순위별)

  ┌──────────┬──────────────────────────────────────────────────────┬────────────────────────────────┐
  │ 우선순위 │                         문제                         │              영향              │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 긴급     │ Express 라우트 try/catch 누락 (routine.js, login.js) │ FastAPI 다운 시 Express 크래시 │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 긴급     │ database.js 함수에 에러 처리 없음                    │ 비정상 응답 시 json 파싱 에러  │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 긴급     │ 글로벌 에러 핸들러 없음 (app.js)                     │ 미처리 에러 시 HTML 500 응답   │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 높음     │ 피드 삭제/실패 시 파일 미정리                        │ 디스크 공간 지속적 증가        │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 높음     │ GET /feed N+1 쿼리 + 페이지네이션 없음               │ 피드 증가 시 심각한 성능 저하  │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 높음     │ 타임존 이슈 (CURDATE vs KST)                         │ 자정~9시 완료 루틴 날짜 오류   │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 중간     │ 평문 비밀번호 폴백                                   │ DB 유출 시 비밀번호 노출       │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 중간     │ like.py 커넥션 rollback 누락                         │ 잠재적 에러/리소스 누수        │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 중간     │ DB 커넥션 풀 미사용                                  │ 동시 요청 시 커넥션 고갈       │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 낮음     │ secure: false 하드코딩                               │ 프로덕션 배포 시 보안 취약     │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 낮음     │ Rate limiting 없음                                   │ 무차별 공격 가능               │
  ├──────────┼──────────────────────────────────────────────────────┼────────────────────────────────┤
  │ 낮음     │ 세션 인증 코드 반복                                  │ 유지보수성 저하                │
  └──────────┴──────────────────────────────────────────────────────┴────────────────────────────────┘

---

### 2. Express ↔ FastAPI 브리지 함수 추가 (`database.js`)

피드/좋아요/댓글 관련 FastAPI 중계 함수 11개를 `database.js`에 추가

| 함수명 | FastAPI 엔드포인트 | 용도 |
|---|---|---|
| `createFeed()` | POST /feed/ | 피드 레코드 생성 |
| `addFeedImage()` | POST /feed/image | 피드 이미지 레코드 추가 |
| `getFeeds()` | GET /feed/ | 전체 피드 목록 조회 |
| `getFeedDetail()` | GET /feed/{feed_id} | 피드 상세 (이미지+댓글 포함) |
| `deleteFeed()` | DELETE /feed/{feed_id} | 피드 삭제 (소유자 검증) |
| `toggleLike()` | POST /like/ | 좋아요 토글 |
| `checkLike()` | GET /like/{feed_id}/{user_id} | 좋아요 여부 확인 |
| `createComment()` | POST /comment/ | 댓글 작성 |
| `getComments()` | GET /comment/{feed_id} | 댓글 목록 조회 |
| `deleteComment()` | DELETE /comment/{comment_id} | 댓글 삭제 (소유자 검증) |

---

### 3. Express 서버 설정 변경 (`app.js`)

- 새 라우터 3개 등록: `feedRouter`, `likeRouter`, `commentRouter`
- `path` 모듈 추가 및 `/uploads/` 정적 파일 서빙 설정 (`express.static`)
- `multer` 패키지 설치 (`src/backend/package.json`에 의존성 추가)
- `src/backend/uploads/` 디렉토리 생성 (`.gitkeep` 포함)

---

### 4. 프론트엔드 피드 시스템 전면 개편

#### 4-1. App.jsx — 메모리 기반 피드 상태 제거

- **삭제된 상태**: `feedPosts` (useState)
- **삭제된 함수**: `toggleFeedLike`, `addFeedComment`, `deleteFeedComment` (메모리 전용 핸들러 3개)
- **변경된 함수 — `completeDetailRoutine`**:
  - 기존: 피드 업로드 시 `feedPosts` 메모리 배열에 추가
  - 변경: `FormData`로 텍스트 필드(routine_id, completion_id, content) + 파일을 함께 `POST /feed`로 전송
  - 피드 업로드 실패 시 루틴 완료 자체는 유지하고 실패 알림만 표시
- **변경된 함수 — `cancelRoutineCompletion`**: 메모리 feedPosts 필터링 코드 제거 (DB의 ON DELETE CASCADE로 자동 삭제)
- **FeedPage props 변경**: 기존 5개(`feedPosts`, `onToggleLike`, `onAddComment`, `onDeleteComment`, `currentUserNickname`) → 1개(`currentUser`)

#### 4-2. FeedPage.jsx — 전면 재작성 (메모리 → DB 기반)

- **피드 조회**: 컴포넌트 마운트 시 `GET /feed`로 전체 피드를 DB에서 최신순 조회
- **좋아요**: `POST /like` API 호출 → 서버 응답(`liked: true/false`) 기반으로 로컬 상태 즉시 업데이트
- **댓글 작성**: `POST /comment` API 호출 → 성공 시 로컬 상태에 즉시 반영
- **댓글 삭제**: `DELETE /comment/:comment_id` API 호출 → 성공 시 로컬 상태에서 제거
- **이미지 표시**: DB의 `feed_images.file_url` 값을 Express `/uploads/` 경로 기준으로 변환하여 표시
- **댓글 본인 확인**: 기존 `nickname` 비교 → `user_id` 비교로 변경 (동일 닉네임 충돌 방지)
- **작성 시간 표시**: DB 타임스탬프를 `formatDateTime()` 함수로 한국어 포맷 변환

#### 4-3. HomePage.jsx — 파일 객체 보존

- `handleFileChange`: 파일 선택 시 미리보기용 Object URL 외에 원본 `File` 객체도 함께 저장
  - 기존: `{ name, type, url }`
  - 변경: `{ name, type, url, file }` — `file`은 서버 업로드 시 `FormData.append()`에 사용

---

### 5. 데이터 흐름 변경 (Before → After)

```
[Before — 메모리 기반]
홈 → 상세 루틴 완료 → App.jsx feedPosts 배열에 push (메모리)
피드 페이지 → App.jsx feedPosts를 props로 전달 (새로고침 시 초기화)
좋아요/댓글 → App.jsx에서 feedPosts 배열 조작 (메모리)

[After — DB 기반]
홈 → 상세 루틴 완료 + 피드 체크 → POST /feed (multipart)
     → Express: multer로 파일 저장 + FastAPI POST /feed/ + POST /feed/image
피드 페이지 → GET /feed
     → Express: FastAPI GET /feed/ + 각 피드별 이미지/좋아요 상태 병렬 조회
좋아요 → POST /like → Express → FastAPI POST /like/ (토글)
댓글   → POST /comment → Express → FastAPI POST /comment/
```

---

### 6. 기타 변경

| 항목 | 내용 |
|---|---|
| `.gitignore` | `src/backend/uploads/*` 추가 (업로드 파일 Git 제외, `.gitkeep`은 유지) |
| `src/backend/package.json` | `multer` 의존성 추가 |
| ESLint | `App.jsx`에서 미사용 `dateText` 변수 제거 |
| 프론트 빌드 | `npx vite build` 성공 확인 |
| Express 문법 검증 | 전체 8개 파일 `node --check` 통과 |

---

### 7. API 명세 추가 (Express :3000)

#### Express (:3000) — 피드

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /feed | 피드 생성 (multipart — files[] + routine_id, completion_id, content) |
| GET | /feed | 전체 피드 목록 조회 (이미지, 좋아요 상태, 댓글 포함, 최신순) |
| DELETE | /feed/:feed_id | 피드 삭제 |

#### Express (:3000) — 좋아요

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /like | 좋아요 토글 (body: { feed_id }) |

#### Express (:3000) — 댓글

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /comment | 댓글 작성 (body: { feed_id, content }) |
| GET | /comment/:feed_id | 피드 댓글 목록 조회 |
| DELETE | /comment/:comment_id | 댓글 삭제 |

---

## 🔧 2026-04-22 작업 내역

### 1. 4월 18일자 에로사항 12개 항목 코드 실태 점검

README 4월 18일 섹션 1-4 "에로사항" 표의 12개 항목을 실제 소스 코드와 하나씩 대조 → **12개 전부 미해결 상태**로 확인. 아래 표의 "발견 상태"는 점검 시점 기준.

| 우선순위 | 항목 | 발견 위치 | 발견 상태 |
|---|---|---|---|
| 🔴 긴급 | #1 Express 라우트 try/catch 누락 | `routes/routine.js` 전체, `routes/login.js`의 `/signup`·`/login`·`/me`·`/logout` | 미해결 |
| 🔴 긴급 | #2 `database.js` 함수 에러 처리 없음 | 21개 함수 전부 `await res.json()` 직행, `res.ok` 검증 없음 | 미해결 |
| 🔴 긴급 | #3 글로벌 에러 핸들러 없음 | `src/backend/app.js` | 미해결 |
| 🟠 높음 | #4 피드 삭제/실패 시 파일 미정리 | `routes/feed.js` POST/DELETE | 미해결 |
| 🟠 높음 | #5 GET /feed N+1 쿼리 + 페이지네이션 없음 | `routes/feed.js:150` `Promise.all` 반복, `FastAPI feed.py:144` `LIMIT` 없음 | 미해결 |
| 🟠 높음 | #6 타임존 이슈 (CURDATE vs KST) | `routers/completion.py:106` `DATE(completed_at) = CURDATE()` | 미해결 |
| 🟡 중간 | #7 평문 비밀번호 폴백 | `routes/login.js:126-129` `isBcryptHash` 분기 | 미해결 |
| 🟡 중간 | #8 `like.py` 커넥션 rollback 누락 | `routers/like.py:73-86` `IntegrityError` 시 `conn2` 재생성 | 미해결 |
| 🟡 중간 | #9 DB 커넥션 풀 미사용 | `python_api/database.py:42-50` 요청마다 신규 커넥션 | 미해결 |
| 🟢 낮음 | #10 `secure: false` 하드코딩 | `routes/login.js:139` | 미해결 |
| 🟢 낮음 | #11 Rate limiting 없음 | Express 의존성/미들웨어 전무 | 미해결 |
| 🟢 낮음 | #12 세션 인증 코드 반복 | 보호 라우트 6+ 곳에서 동일 4줄 블록 복붙 | 미해결 |

---

### 2. 이번 세션에서 해결한 항목 (4건)

"크래시 빈도가 가장 높은 뿌리" 계열 4건(#12 → #2 → #3 → #1) 순으로 처리. 미들웨어 추출로 코드 중복을 먼저 제거한 뒤, 에러 전파 경로를 정비하는 순서로 진행.

| 항목 | 해결 방식 | 성공 여부 |
|---|---|---|
| #12 세션 인증 중복 | `src/backend/middleware/requireAuth.js` 신규 생성, 보호 라우트 14곳에 `requireAuth` 적용 | ✅ 완료 |
| #2 `database.js` 에러 처리 | `fetchJson()` 공통 헬퍼 + `FastApiError` 커스텀 에러 도입, 21개 함수 전부 이 헬퍼로 통과 | ✅ 완료 |
| #3 글로벌 에러 핸들러 | `app.js` 맨 끝에 4-arity 미들웨어 추가, `FastApiError` 상태코드 보존 처리 | ✅ 완료 |
| #1 라우트 try/catch 누락 | `routine.js` 3개 + `login.js` 4개 라우트에 `try/catch + next(err)` 추가, 기존 `feed/like/comment/completion` catch 블록도 동일 패턴으로 통일 | ✅ 완료 |

#### 2-1. `requireAuth` 미들웨어 (#12 해결)

- **원인**: `routine/feed/like/comment/completion` 라우터가 각자 "쿠키 꺼내기 → `findSession` → 401" 4줄을 복붙해서 6+ 곳에서 중복
- **해결**:
  - `src/backend/middleware/requireAuth.js` 생성
  - 세션 검증 성공 시 `req.user` 에 세션 정보(user_id, login_id, nickname 등) 주입
  - `findSession` 실패 시 미들웨어 내부 try/catch로 500 JSON 응답
- **적용 범위**: `/routine` 3건, `/feed` 3건, `/like` 1건, `/comment` 3건, `/completion` 4건, `/me` 1건 = **14곳**

#### 2-2. `fetchJson` 공통 헬퍼 (#2 해결)

- **원인**:
  - `await res.json()` 앞에 `res.ok` 검증 없음 → FastAPI 4xx/5xx 에러 응답도 성공처럼 반환
  - FastAPI가 HTML 500(트레이스백)을 반환하면 `res.json()`이 `SyntaxError` throw → 라우터 크래시
  - `fetch()` 자체가 네트워크 오류로 throw하면 스택 전체 전파
- **해결**:
  - `fetchJson(url, options)` 단일 헬퍼로 모든 FastAPI 호출 통일
  - 네트워크 실패 → `FastApiError(status=0)` 변환
  - HTML/비-JSON 응답 → `text()` 후 `JSON.parse` try/catch → `FastApiError` 변환
  - `res.ok === false` → `{detail}`을 메시지로 담아 `FastApiError` throw
  - `FastApiError` 는 `database.js`에서 export → 라우터가 `error instanceof FastApiError` 로 분기 가능

#### 2-3. 글로벌 에러 핸들러 (#3 해결)

- **원인**: 라우터에서 throw된 에러가 Express 기본 핸들러로 떨어져 HTML 500 응답 → 프론트 `res.json()` 크래시
- **해결**:
  - `app.js` 맨 끝(모든 라우터 등록 뒤)에 `app.use((err, req, res, _next) => {...})` 추가
  - **상태코드 매핑**:
    - `FastApiError` 이면서 status가 4xx → 원래 상태코드 그대로 전달 (예: 409 중복 아이디)
    - `FastApiError` 이면서 5xx 또는 status=0(네트워크 실패) → **502 Bad Gateway** 로 변환하여 "업스트림 FastAPI 장애"임을 명시
    - 그 외 일반 에러 → 500
  - 모든 응답이 `{ success: false, message }` JSON 포맷 → 프론트 파싱 보장
- **주의사항**: Express는 error handler를 "파라미터 4개짜리 함수"로 판별하므로 `_next` 파라미터는 호출하지 않더라도 시그니처를 유지

#### 2-4. 라우트 try/catch + next(err) 통일 (#1 해결)

- **원인**:
  - `routine.js` 전 3개 라우트, `login.js`의 `/signup`·`/login`·`/me`·`/logout` 이 try/catch 없이 `await` 호출 → #2 적용 후 `FastApiError` throw 시 Express 기본 핸들러로 흘러가 HTML 500 응답
  - 기존 `feed/like/comment/completion` 의 catch 블록은 `res.status(500).json(...)` 으로 하드코딩되어 `FastApiError` 의 실제 상태코드(예: 404, 409)가 500으로 뭉개짐
- **해결**:
  - **신규 추가 (7개 라우트)**: `routine.js × 3`, `login.js × 4` 에 `try { ... } catch (error) { return next(error); }` 추가
  - **기존 통일 (11개 라우트)**: `feed/like/comment/completion` 의 catch 블록을 `next(error)` 로 교체 → 글로벌 핸들러가 `FastApiError` 상태코드를 그대로 응답
- **효과**:
  - 409 중복 아이디 → 500으로 뭉개지지 않고 409 그대로 전달
  - FastAPI 다운 → 500이 아닌 502 Bad Gateway 로 "서버 오류"와 "업스트림 장애" 명확히 구분

---

### 3. 에러 전파 경로 변화 (Before → After)

```
[Before]
FastAPI가 HTML 500 응답
  → database.js: res.json() SyntaxError
  → routine.js: try/catch 없음 → Express 기본 핸들러
  → 클라이언트에 HTML 500 응답
  → 프론트 fetch().then(res => res.json()) 에서 또 SyntaxError → 화면 crash

[After]
FastAPI가 HTML 500 응답
  → fetchJson(): FastApiError(status=500) throw
  → routine.js catch: next(error)
  → 글로벌 핸들러: FastApiError 5xx → 502 Bad Gateway + JSON body
  → 클라이언트에 { success: false, message } 깔끔 전달
```

---

### 4. 변경 파일 목록 (9개)

| 파일 | 변경 내용 |
|---|---|
| `src/backend/middleware/requireAuth.js` | 🆕 신규 — 세션 검증 미들웨어 |
| `src/backend/app.js` | 글로벌 에러 핸들러 추가 (`FastApiError` 상태코드 보존) |
| `src/backend/database.js` | `fetchJson` + `FastApiError` 도입, 21개 함수 전부 헬퍼로 통과 |
| `src/backend/routes/login.js` | `requireAuth` 적용(`/me`), `/signup`·`/login`·`/me`·`/logout` try/catch 추가 |
| `src/backend/routes/routine.js` | `requireAuth` 적용, 3개 라우트 try/catch + next(err) 추가 |
| `src/backend/routes/feed.js` | `requireAuth` 적용, catch 블록 `next(err)` 통일 |
| `src/backend/routes/like.js` | `requireAuth` 적용, catch 블록 `next(err)` 통일 |
| `src/backend/routes/comment.js` | `requireAuth` 적용, catch 블록 `next(err)` 통일 |
| `src/backend/routes/completion.js` | `requireAuth` 적용, catch 블록 `next(err)` 통일 |

#### 검증
- `node --check` — 전 파일 문법 통과
- `npm run lint` — ESLint 경고 없음

---

### 5. 남은 8개 항목 — 다음 우선순위

이번 세션에서 #1, #2, #3, #12 (크래시 계열)를 해결했으므로 다음 순서는 **데이터 정합성 + 보안** 계열.

#### 🟠 높음 — 즉시 처리 권장

| # | 항목 | 왜 높은가 | 예상 작업 |
|---|---|---|---|
| #6 | 타임존 (CURDATE vs KST) | 한국 시간 00~09시 완료 루틴이 전날로 집계되는 **데이터 정합성** 문제. 사용자 혼란 직결 | `completion.py` 의 `CURDATE()` 를 `DATE(CONVERT_TZ(completed_at, '+00:00', '+09:00'))` 로 교체, 또는 RDS 파라미터 그룹의 `time_zone` 을 `Asia/Seoul` 로 설정 |
| #4 | 피드 업로드/삭제 시 파일 미정리 | 디스크 누수 — 장기 운영 시 서버 멈춤 위험 | POST 실패 시 `fs.unlink`로 롤백, DELETE 시 `feed_images.file_url` 조회 후 디스크 파일 함께 삭제 |
| #5 | GET /feed N+1 + 페이지네이션 없음 | 피드 100개 → HTTP 호출 201회. 피드 증가 시 기하급수적 성능 저하 | FastAPI `GET /feed/` 가 images/likes/comments 를 한 번에 JOIN 해서 반환하도록 개선, `?page=&limit=` 쿼리 파라미터 추가 |

#### 🟡 중간

| # | 항목 | 예상 작업 |
|---|---|---|
| #7 | 평문 비밀번호 폴백 | 기존 평문 계정 마이그레이션(로그인 시 재해싱) 후 `isBcryptHash` 분기 제거 |
| #8 | `like.py` rollback 누락 | `IntegrityError` 시 `conn.rollback()` 호출 후 동일 커넥션으로 DELETE 재시도 — `conn2` 신규 생성 불필요 |
| #9 | DB 커넥션 풀 미사용 | `pymysql` 대신 `sqlalchemy` + `QueuePool` 또는 `aiomysql.Pool` 도입 |

#### 🟢 낮음 — 배포 직전에

| # | 항목 | 예상 작업 |
|---|---|---|
| #10 | `secure: false` 하드코딩 | `NODE_ENV === 'production'` 이면 `secure: true` 로 분기 |
| #11 | Rate limiting 없음 | `express-rate-limit` 추가, `/login` · `/signup` · `/check-duplicate` 에 제한 적용 |

---

### 6. 권장 다음 커밋 단위

1. **타임존(#6)** — 1커밋, 테스트는 자정 근처 타임스탬프로 확인
2. **파일 정리(#4)** — 1커밋, `fs/promises` 로 async 파일 삭제
3. **페이지네이션(#5 일부)** — 1커밋, `LIMIT/OFFSET` 만 먼저 추가해도 급한 불은 끄는 수준
4. **N+1 쿼리 개선(#5 나머지)** — 1커밋, FastAPI JOIN 쿼리 재작성

---

## 🔧 2026-04-29 작업 내역

### 1. 이번 세션 개요

4월 22일 점검에서 미해결로 분류되었던 12개 항목 중 **Critical 등급 3건**(#6 타임존, #4 고아 파일, #7 평문 비밀번호 폴백)을 일괄 처리. 추가로 쿠키 `secure` 옵션 환경변수화(#10)도 함께 적용.

| 항목 | 등급 | 처리 결과 | 영향 파일 |
|---|---|---|---|
| #6 타임존 (CURDATE vs KST) | 🔴 Critical | ✅ 완료 | `src/python_api/database.py`, `src/python_api/routers/completion.py` |
| #4 피드 업로드/삭제 파일 미정리 | 🔴 Critical | ✅ 완료 | `src/backend/routes/feed.js` |
| #7 평문 비밀번호 폴백 | 🔴 Critical | ✅ 완료 (Lazy Migration) | `src/backend/routes/login.js`, `src/backend/database.js`, `src/python_api/routers/user.py` |
| #10 `secure: false` 하드코딩 | 🟢 낮음 | ✅ 완료 | `src/backend/routes/login.js` |

---

### 2. #6 타임존 버그 — DB 커넥션 KST 강제 설정

#### 문제

AWS RDS MySQL 의 기본 타임존은 UTC. `routers/completion.py:106` 의 `DATE(completed_at) = CURDATE()` 가 UTC 기준으로 동작하여, **KST 자정~오전 09:00 사이에 완료한 루틴이 새로고침 시 "오늘 목록"에서 사라지는** 버그가 있었음.

| KST 완료 시각 | UTC 저장값 | `CURDATE()` (UTC) | 결과 |
|---|---|---|---|
| 04/30 02:00 (KST) | 04/29 17:00 (UTC) | 04/30 (UTC) | 🔴 어제 기록으로 누락 |
| 04/30 08:59 (KST) | 04/29 23:59 (UTC) | 04/30 (UTC) | 🔴 어제 기록으로 누락 |

#### 해결

`get_connection()` 에서 `init_command="SET time_zone = '+09:00'"` 를 사용하여 **세션 단위로** 타임존을 KST 로 고정. 인스턴스 글로벌 설정 변경 권한이 없어도 적용 가능하며, 저장된 DATETIME 원본값(UTC)은 변경되지 않으므로 데이터 마이그레이션 불필요.

```python
# src/python_api/database.py
return pymysql.connect(
    ...
    init_command="SET time_zone = '+09:00'",  # [추가 2026-04-29]
)
```

#### 검증 방법

KST 자정 직후(예: 00:30) 루틴 완료 → 새로고침 → 홈 화면 "오늘 완료" 목록에 표시되는지 확인.

---

### 3. #4 피드 업로드/삭제 시 파일 미정리

#### 문제 1 — POST /feed (업로드)

`multer` 가 디스크에 파일을 먼저 저장한 뒤 FastAPI `createFeed()` / `addFeedImage()` 가 실패하면, **DB 레코드 없는 고아 파일이 `/uploads` 에 영구 보관**되어 디스크 사용량이 누적.

#### 문제 2 — DELETE /feed/:feed_id (삭제)

FastAPI 의 `ON DELETE CASCADE` 로 `feeds`/`feed_images` 행은 삭제되지만 **디스크 실제 파일은 삭제되지 않아** 동일하게 고아 파일 누적.

#### 해결

**POST 분기**: `cleanupFiles()` 헬퍼를 추가하여 검증 실패 / FastAPI 실패 / throw 모든 분기에서 `req.files` 디스크 정리. `Promise.allSettled` 를 사용해 일부 실패해도 나머지 정리를 멈추지 않음.

**DELETE 분기**: CASCADE 실행 전 `getFeedDetail()` 로 `file_url` 목록을 미리 확보 → DB 삭제가 실제 성공한 경우에만 (`result.success === true`) 디스크에서 `fs.unlink`. 보안을 위해 `path.basename()` 으로 파일명만 추출하여 `../../etc/passwd` 같은 디렉터리 트래버설 공격을 차단.

```javascript
// src/backend/routes/feed.js (요약)
const fs = require("fs/promises");
const UPLOAD_DIR = path.join(__dirname, "../uploads");

// POST: cleanupFiles() — 모든 실패 분기에서 호출
// DELETE: 선조회 → DB 삭제 성공 → path.basename() 으로 안전한 unlink
```

#### 검증 방법

1. FastAPI 강제 종료 → Express 만 켠 상태에서 피드 업로드 시도 → `/uploads` 에 잔여 파일 없는지 확인
2. 피드 삭제 후 `ls src/backend/uploads/` 에서 해당 파일이 사라졌는지 확인

---

### 4. #7 평문 비밀번호 폴백 — Lazy Migration

#### 문제

`routes/login.js:139-142` 의 `isBcryptHash` 분기에서 평문 비밀번호도 그대로 받아주는 폴백이 있었음. DB 유출 시 즉시 탈취되며, 같은 비밀번호를 다른 서비스에 재사용하는 사용자에게 연쇄 피해 가능.

#### 해결 — Lazy Migration 패턴

폴백을 즉시 제거하면 평문 계정 사용자 로그인 불가가 되므로, **로그인 성공 시점에 자동으로 bcrypt 해시로 업그레이드** 하는 패턴 도입.

흐름:
1. 평문 일치 확인 (기존 폴백 그대로)
2. 매치 성공 시 `bcrypt.hash(password, 10)` 으로 해시 생성
3. FastAPI `PATCH /user/password/{user_id}` 호출하여 DB 의 `password` 컬럼 교체
4. 다음 로그인부터는 `bcrypt.compare` 분기로만 동작

업그레이드 자체가 실패해도 로그인은 통과 (UX 우선) — 다음 로그인 때 재시도되며 멱등.

#### 신규 추가된 부분

| 위치 | 내용 |
|---|---|
| `src/python_api/routers/user.py` | `PATCH /user/password/{user_id}` 엔드포인트 + `PasswordUpdate` 스키마 |
| `src/backend/database.js` | `updateUserPassword(user_id, hashed_password)` 헬퍼 + export |
| `src/backend/routes/login.js` | 평문 매치 분기 안에 `bcrypt.hash()` + `updateUserPassword()` 호출 |

#### 향후 정리

다음 SQL 결과가 0 건이 되면 평문 분기를 완전히 제거 가능:

```sql
SELECT user_id, login_id FROM users WHERE password NOT LIKE '$2%';
```

#### ⚠️ 보안 주의

새로 추가한 `PATCH /user/password/{user_id}` 는 인증/세션 검증 없이 호출되므로, FastAPI(8000)는 반드시 외부 비공개로 운영해야 함 (Express(3000) → localhost 8000 만 호출). 일반적인 "비밀번호 변경" UI 가 추가될 경우 별도 엔드포인트로 분리 필요.

---

### 5. #10 쿠키 `secure` 옵션 환경변수화

#### 문제

`routes/login.js:152` 의 `secure: false` 가 하드코딩되어 있어, 프로덕션(HTTPS) 배포 시 쿠키 탈취 위험.

#### 해결

`secure: process.env.NODE_ENV === "production"` 으로 자동 결정. 발급 측(`res.cookie`)과 제거 측(`res.clearCookie`) 옵션을 동일하게 정렬하여 일부 브라우저에서 쿠키가 제거되지 않는 문제도 함께 예방.

```javascript
// src/backend/routes/login.js
res.cookie("sessionId", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",  // [수정 2026-04-29]
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
});
```

---

### 6. 검증 결과

- 수정한 모든 JS 파일: `node -c` 문법 검증 통과
- 수정한 모든 Python 파일: `ast.parse()` 문법 검증 통과
- 모든 추가/수정 라인에 `[추가 2026-04-29]` / `[수정 2026-04-29]` 주석으로 변경 사유와 영향 명시

---

### 7. 4월 22일 표 기준 잔여 항목 갱신

| # | 등급 | 항목 | 4/22 상태 | 4/29 상태 |
|---|---|---|---|---|
| #1 | 🔴 | Express 라우트 try/catch | ✅ | ✅ |
| #2 | 🔴 | database.js 에러 처리 | ✅ | ✅ |
| #3 | 🔴 | 글로벌 에러 핸들러 | ✅ | ✅ |
| #4 | 🟠 | 피드 파일 미정리 | 미해결 | **✅ 완료** |
| #5 | 🟠 | GET /feed N+1 + 페이지네이션 | 미해결 | 미해결 |
| #6 | 🟠 | 타임존 (CURDATE vs KST) | 미해결 | **✅ 완료** |
| #7 | 🟡 | 평문 비밀번호 폴백 | 미해결 | **✅ 완료 (Lazy Migration)** |
| #8 | 🟡 | like.py rollback 누락 | 미해결 | 미해결 |
| #9 | 🟡 | DB 커넥션 풀 미사용 | 미해결 | 미해결 |
| #10 | 🟢 | secure: false 하드코딩 | 미해결 | **✅ 완료** |
| #11 | 🟢 | Rate limiting 없음 | 미해결 | 미해결 |
| #12 | 🟡 | 세션 인증 코드 반복 | ✅ | ✅ |

---

### 8. 권장 다음 커밋 단위

1. **#5 페이지네이션** — `GET /feed?limit=20&offset=0` 형태로 LIMIT/OFFSET 추가 (1커밋)
2. **#5 N+1 쿼리 제거** — FastAPI 에서 LEFT JOIN 으로 image/like 한 번에 조회 (1커밋)
3. **#11 Rate limiting** — `express-rate-limit` 으로 `/login`·`/signup`·`/check-duplicate` 보호 (1커밋)
4. **#8 like.py rollback** — `IntegrityError` 시 동일 커넥션에서 `rollback()` 후 DELETE 재시도 (1커밋)
5. **#9 DB 커넥션 풀** — `sqlalchemy + QueuePool` 또는 `aiomysql.Pool` 도입 (별도 PR 단위)

---

## 🔧 2026-05-01 작업 내역

### 1. 이번 세션 개요

루틴/완료 기록을 삭제해도 연결된 인증 피드(이미지·댓글·좋아요 포함)가 함께 사라지는 기존 동작을 개선. **Soft Delete 패턴**(`deleted_at` 컬럼)을 도입하여 사용자 화면에서는 삭제된 것처럼 보이되 DB 레코드와 연관 데이터는 그대로 보존.

| 변경 영역 | 처리 방식 | 영향 파일 |
|---|---|---|
| DB 스키마 | `deleted_at DATETIME NULL` 컬럼 + 복합 인덱스 추가 | AWS RDS 직접 ALTER (`users`, `routines`, `routine_completions`) |
| 루틴 라우터 | DELETE → UPDATE deleted_at, 모든 SELECT 에 `deleted_at IS NULL` | `src/python_api/routers/routine.py` |
| 완료 라우터 | DELETE → UPDATE deleted_at, history JOIN 정책 변경 | `src/python_api/routers/completion.py` |
| 피드 라우터 | INNER JOIN → LEFT JOIN + `COALESCE` fallback | `src/python_api/routers/feed.py` |
| 유저 라우터 | 조회/세션/중복체크에 `deleted_at IS NULL` 필터 | `src/python_api/routers/user.py` |

---

### 2. 변경 배경

기존 정책에서는 `routines` 테이블에 `ON DELETE CASCADE` 가 걸려 있어, 사용자가 루틴을 삭제하는 순간 다음이 모두 사라졌음:

```
routines 1건 삭제
  → routine_completions (CASCADE)
    → feeds (CASCADE)
      → feed_images (CASCADE)
      → feed_likes (CASCADE)
      → feed_comments (CASCADE)
```

문제점:
- 사용자가 과거에 인증한 게시물(피드 + 사진 + 댓글 + 좋아요)이 한 번에 삭제됨 → 본인 게시물만이 아니라 **다른 사용자가 작성한 댓글/좋아요까지** 사라져 SNS 일관성 깨짐
- 인스타그램/트위터 등 SNS 표준 동작과 어긋남

해결 방향: **루틴/완료 기록은 Soft Delete 로 전환**하여 CASCADE 가 트리거되지 않도록 하고, 사용자 화면에서는 필터링으로 숨김.

---

### 3. DB 스키마 변경 (AWS RDS 직접 적용)

#### 적용한 SQL

```sql
-- ① users
ALTER TABLE users
  ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL
  COMMENT '회원 탈퇴 시각 (NULL=활성, NOT NULL=탈퇴)';

-- ② routines
ALTER TABLE routines
  ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL
  COMMENT '루틴 삭제 시각 (NULL=활성, NOT NULL=삭제됨)';

-- ③ routine_completions
ALTER TABLE routine_completions
  ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL
  COMMENT '완료 기록 삭제 시각 (NULL=활성, NOT NULL=취소됨)';

-- ④ 활성 데이터 조회 최적화 인덱스
CREATE INDEX idx_routines_user_active     ON routines(user_id, deleted_at);
CREATE INDEX idx_completions_user_active  ON routine_completions(user_id, deleted_at);
```

#### 적용 결과 (검증 쿼리)

| 테이블 | total | active (deleted_at IS NULL) | deleted |
|---|---:|---:|---:|
| users | 11 | 11 | 0 |
| routines | 17 | 17 | 0 |
| routine_completions | 2 | 2 | 0 |

→ MySQL 8.0 의 INSTANT ADD COLUMN 으로 락 없이 즉시 반영. 기존 데이터는 모두 NULL = 활성 상태 유지.

#### 인덱스

```
idx_routines_user_active     : (user_id, deleted_at)  — BTREE
idx_completions_user_active  : (user_id, deleted_at)  — BTREE
```

---

### 4. 라우터별 변경 사항

#### 4-1. `routers/routine.py`

| 엔드포인트 | 변경 | 비고 |
|---|---|---|
| `GET /routine/{user_id}` | `WHERE user_id = %s AND deleted_at IS NULL` | 삭제된 루틴은 화면에서 숨김 |
| `DELETE /routine/{routine_id}` | `DELETE FROM ...` → `UPDATE ... SET deleted_at = NOW()` | CASCADE 미발동, 연결 데이터 보존 |
| `POST /routine/` | 변경 없음 | INSERT 는 그대로 |

`DELETE` 의 `WHERE` 절에 `AND deleted_at IS NULL` 을 추가하여 이미 삭제된 행은 다시 갱신되지 않도록 멱등성 확보.

#### 4-2. `routers/completion.py`

| 엔드포인트 | 변경 | 비고 |
|---|---|---|
| `GET /completion/today/{user_id}` | `AND deleted_at IS NULL` 추가 | 취소된 완료는 숨김 |
| `GET /completion/history/{user_id}` | `INNER JOIN` → `LEFT JOIN` + `COALESCE(r.title, '(삭제된 루틴)')` + `AND rc.deleted_at IS NULL` | 사용자 결정사항 2(a): 삭제된 루틴의 완료 기록도 표시 |
| `DELETE /completion/{id}` | `DELETE` → `UPDATE deleted_at = NOW()` | CASCADE 미발동 |

핵심 결정: `history` 에서 **completion 자체는 활성, routine 은 삭제 여부 무관** 으로 필터링하여, 과거 인증 활동이 사라지지 않도록.

#### 4-3. `routers/feed.py`

| 엔드포인트 | 변경 | 비고 |
|---|---|---|
| `GET /feed/` | `users / routines INNER JOIN` → `LEFT JOIN`, `COALESCE` 로 닉네임/루틴 제목 fallback | 사용자 결정사항 1(a): 피드는 그대로 표시 |
| `GET /feed/{feed_id}` | 동일 (상세 조회 + 댓글 JOIN 도 LEFT JOIN) | 상세 화면도 일관 처리 |

표시 fallback:
- 삭제된 루틴 → `(삭제된 루틴)`
- 탈퇴한 사용자 → `(탈퇴한 사용자)` (회원 탈퇴 기능 도입 시 자동 적용되도록 미리 처리)

#### 4-4. `routers/user.py`

| 엔드포인트 | 변경 | 비고 |
|---|---|---|
| `GET /user/{login_id}` | `AND deleted_at IS NULL` | 탈퇴 사용자 로그인 차단 |
| `GET /user/session/{session_id}` | `AND u.deleted_at IS NULL` (JOIN 한 user) | 탈퇴 직후 자동 로그아웃 효과 |
| `GET /user/check/login_id/{login_id}` | `AND deleted_at IS NULL` | 탈퇴 ID 재사용 가능 |
| `GET /user/check/nickname/{nickname}` | `AND deleted_at IS NULL` | 탈퇴 닉네임 재사용 가능 |
| 회원 탈퇴 엔드포인트 자체 | **추가하지 않음** | 별도 정책 결정 필요 (UNIQUE 제약 충돌 등) |

---

### 5. 정책 결정 사항 (사용자 확정)

| # | 항목 | 결정 |
|---|---|---|
| 1 | 피드 페이지에서 "삭제된 루틴" 의 인증 글 | **(a) 그대로 표시** + `(삭제된 루틴)` fallback |
| 2 | 마이페이지 "최근 활동" 의 삭제 루틴 완료 기록 | **(a) 표시** (취소된 completion 만 숨김) |
| 3 | `users` 테이블에도 `deleted_at` 추가 여부 | **추가** (탈퇴 엔드포인트는 미구현) |
| 4 | `feeds`/`feed_likes`/`feed_comments`/`feed_images`/`sessions` | Soft Delete 미적용 (Hard Delete 유지) |

`feeds` 자체는 사용자가 의도적으로 본인 게시물 삭제하면 사라지는 SNS 표준 동작 유지. `feed_likes`/`feed_comments` 도 토글/삭제 의미가 명확한 행동이므로 Hard Delete 유지.

---

### 6. CASCADE 정책의 현재 상태

기존 외래키의 `ON DELETE CASCADE` 는 그대로 유지. 다만 본 라우터들이 더 이상 `DELETE` 를 실행하지 않으므로 **CASCADE 자체가 트리거되지 않음**. 안전망으로 두고, 향후 진짜 hard delete 가 필요한 경우(예: 30일 후 영구 삭제 배치) 그때 정책 재검토 예정.

---

### 7. 검증 결과

- 수정한 모든 Python 파일: `ast.parse()` 문법 검증 통과
- AWS RDS 에서 ALTER + CREATE INDEX 직접 적용 후 검증 쿼리로 컬럼/인덱스 정상 반영 확인
- 모든 추가/수정 라인에 `[수정 2026-05-01]` / `[추가 2026-05-01]` 주석으로 변경 사유 명시

---

### 8. 향후 검토 항목

- **회원 탈퇴 엔드포인트**: 추가 시 `users.login_id` UNIQUE 제약 정책 변경 필요 (예: `UNIQUE (login_id, deleted_at)` 또는 탈퇴 시 login_id 무효화)
- **영구 삭제 배치**: 30일 경과한 `deleted_at NOT NULL` 행을 실제 DELETE 하는 배치 (현재는 미적용)
- **GDPR/개인정보 삭제 요청 대응**: Soft Delete 와 별도로 hard delete 경로 필요



### 9. 에로 사항
 🔍 코드 점검 — 수정/추가/개선 필요 항목 분석

  🔴 보안 (우선순위 높음)

  ┌─────┬────────────────────────────────────────┬────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────┐
  │  #  │                  위치                  │                                문제                                │                     권장 조치                     │    
  ├─────┼────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤    
  │ 1   │ routes/login.js POST /login            │ 무차별 대입 공격(brute-force) 무방어 — 시도 횟수 제한, IP 잠금,    │ express-rate-limit 도입 (예: /login 5회/분/IP) +  │    
  │     │                                        │ CAPTCHA 없음                                                       │ 5회 연속 실패 시 30분 잠금                        │    
  ├─────┼────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤    
  │ 2   │ routes/login.js GET /check-duplicate   │ 계정 열거(username enumeration) — 무제한 호출 가능, 응답이         │ rate limit 동일 적용 + 응답 시간                  │    
  │     │                                        │ 즉시라서 봇이 사전 공격 가능                                       │ 일정화(crypto.timingSafeEqual 패턴)               │    
  ├─────┼────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
  │     │ python_api/routers/user.py PATCH       │ 인증 검증 없는 비밀번호 변경 엔드포인트 — FastAPI가 외부 노출되는  │ FastAPI에 공유 시크릿 헤더 검증 추가              │    
  │ 3   │ /user/password/{user_id}               │ 순간 모든 계정 탈취 가능. 현재는 "FastAPI 비공개 운영" 가정에 100% │ (Express에서만 알 수 있는 토큰) — 다층 방어       │    
  │     │                                        │  의존                                                              │                                                   │
  ├─────┼────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤    
  │ 4   │ routes/feed.js multer fileFilter       │ mimetype은 클라이언트가 조작 가능 — .exe를 image/png으로 위장하면  │ file-type 라이브러리로 매직 바이트 검사 + 확장자  │
  │     │                                        │ 업로드됨                                                           │ 화이트리스트                                      │    
  ├─────┼────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
  │ 5   │ routes/feed.js upload limit            │ DoS 위험 — 50MB × 10파일 = 500MB/요청, 동시 10명이면 5GB. 디스크   │ 파일당 10MB로 축소 + 일일 사용자별 업로드 쿼터    │    
  │     │                                        │ 가득차면 서비스 중단                                               │ 도입                                              │    
  ├─────┼────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
  │ 6   │ 전체                                   │ CSRF 미방어 — sameSite: lax만으로는 GET 트리거 공격은 막지만 POST  │ csurf 또는 더블 서밋 쿠키 패턴                    │    
  │     │                                        │ 폼 + simple Content-Type은 우회 가능                               │                                                   │    
  ├─────┼────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
  │ 7   │ routes/login.js 회원가입               │ 비밀번호 복잡도 미강제 — if (!password)만 검사. 공백 1자도 통과    │ 최소 8자 + 영문/숫자 혼합 정규식 + 공통 비밀번호  │    
  │     │                                        │                                                                    │ 블랙리스트                                        │    
  ├─────┼────────────────────────────────────────┼────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
  │ 8   │ 세션 관리                              │ 고정 1일 만료, 슬라이딩 갱신 없음 — 활성 사용자도 매일 재로그인    │ 활동 시 expires_at 갱신 또는 refresh token 패턴   │    
  └─────┴────────────────────────────────────────┴────────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘    
   
  ---                                                                                                                                                                          
  🟠 안정성 / 성능 (이미 인지된 부채 + 발견 사항)           
                                                                                                                                                                               
  ┌─────┬──────────────────────────────────┬───────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────┐ 
  │  #  │               위치               │                                 문제                                  │                      권장 조치                       │    
  ├─────┼──────────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤ 
  │ 9   │ python_api/database.py           │ 요청마다 새 MySQL 커넥션 생성 — RDS 동시 연결 한도(t3.micro=66)       │ aiomysql 풀 또는 SQLAlchemy + QueuePool 도입         │    
  │     │ get_connection()                 │ 도달하면 502. TCP+TLS 핸드셰이크 비용도 매 호출 누적                  │ (size=10, overflow=5)                                │ 
  ├─────┼──────────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤    
  │ 10  │ routes/feed.js GET /feed         │ N+1 쿼리 — 피드 N개 → 상세 N + 좋아요 N = 2N+1 회 호출. 100개 피드 =  │ FastAPI에 GET /feed/?user_id=... 단일 엔드포인트     │ 
  │     │                                  │ 201 HTTP 요청                                                         │ 추가 → JOIN으로 한 번에 조회                         │    
  ├─────┼──────────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤ 
  │ 11  │ routes/feed.js GET /feed         │ 페이지네이션 없음 — 전체 피드 일괄 로딩 → 모바일에서 OOM 가능         │ ?cursor=<feed_id>&limit=20 커서 기반 페이지네이션    │    
  ├─────┼──────────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤    
  │ 12  │ python_api/routers/feed.py       │ 이미지 압축/썸네일 없음 — 원본 그대로 서빙 → 모바일 데이터 폭증       │ Pillow로 썸네일 생성 + WebP 변환, 또는 S3 +          │
  │     │ 업로드                           │                                                                       │ CloudFront 이전                                      │    
  ├─────┼──────────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
  │ 13  │ routes/login.js requireAuth      │ 세션 검증마다 FastAPI 라운드트립 — 모든 보호 라우트가 매번 DB 쿼리    │ Express 메모리 LRU 캐시(60초 TTL) — 무효화는 logout  │    
  │     │                                  │ 1회                                                                   │ 시점만                                               │    
  ├─────┼──────────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
  │ 14  │ 전체                             │ 로깅 인프라 부재 — console.log/error만 사용 → 운영 시 검색/필터 불가  │ pino + 파일/CloudWatch 출력, 요청 추적용 traceId     │    
  │     │                                  │                                                                       │ 헤더                                                 │    
  ├─────┼──────────────────────────────────┼───────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
  │ 15  │ 전체                             │ 에러 모니터링 부재 — Sentry/Bugsnag 미연동 → 운영 중 발생한 예외는    │ Sentry SDK 도입 (Express + React 양쪽)               │    
  │     │                                  │ stdout만 보면 발견                                                    │                                                      │    
  └─────┴──────────────────────────────────┴───────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────┘
                                                                                                                                                                               
  ---                                                       
  🟡 기능 / UX 누락
                                                                                                                                                                               
  ┌─────┬────────┬───────────────────────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┐
  │  #  │  영역  │                                    누락된 기능                                    │                            비고                            │            
  ├─────┼────────┼───────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ 16  │ 계정   │ 비밀번호 재설정 / 이메일 인증 플로우 없음                                         │ 이메일 전송 인프라(SES/SendGrid) + 토큰 만료 테이블 필요   │
  ├─────┼────────┼───────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ 17  │ 계정   │ 회원 탈퇴 엔드포인트 없음 — Soft Delete 컬럼은 준비됐으나 실제 호출 경로 없음     │ DELETE /user/me 신설 + login_id UNIQUE 제약 정책 결정 필요 │            
  ├─────┼────────┼───────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤            
  │ 18  │ 루틴   │ 반복 주기 자유텍스트 ("월,수,금") → 검색/통계 불가                                │ 비트마스크(repeat_days TINYINT) 또는 별도 테이블           │            
  ├─────┼────────┼───────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤            
  │ 19  │ 통계   │ 연속 달성(streak) / 통계 차트 없음                                                │ routine_completions 만으로 유도 가능 — 별도 API 추가       │
  ├─────┼────────┼───────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤            
  │ 20  │ 알림   │ 댓글/좋아요 알림 없음                                                             │ DB 테이블 notifications + WebSocket 또는 폴링              │
  ├─────┼────────┼───────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤            
  │ 21  │ 프론트 │ 에러 바운더리 / 로딩 스켈레톤 없음                                                │ 컴포넌트 크래시 시 화면 전체 백지 → <ErrorBoundary> 도입   │
  ├─────┼────────┼───────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤            
  │ 22  │ 프론트 │ HomePage proofFiles 가 메모리에만 존재 — 새로고침 시 사라짐 (이미 인지된 부채 #6) │ /feed/{feed_id} 의 이미지 URL을 다시 가져와 표시           │
  └─────┴────────┴───────────────────────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────┘            
                                                            
  ---                                                                                                                                                                          
  🟢 코드 품질 / 유지보수                                   
                         
  ┌─────┬──────────────────────────────────────┬────────────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────┐ 
  │  #  │                 영역                 │                                  이슈                                  │                      비고                       │    
  ├─────┼──────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤ 
  │ 23  │ 테스트                               │ 자동 테스트 0건 — 단위/통합/E2E 모두 없음                              │ 최소 vitest + supertest로 인증/루틴 CRUD 스모크 │    
  │     │                                      │                                                                        │  테스트                                         │ 
  ├─────┼──────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤    
  │ 24  │ CI/CD                                │ .github/workflows/ 없음 — 린트/타입체크/테스트가 수동                  │ GH Actions 추가 (PR 시 lint + node -c +         │    
  │     │                                      │                                                                        │ ast.parse)                                      │    
  ├─────┼──────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤    
  │ 25  │ 타입                                 │ TypeScript 미적용 — routine_id, user_id 등 식별자가 모두 string이라    │ 점진적 도입 (frontend 먼저)                     │ 
  │     │                                      │ 혼용 위험                                                              │                                                 │    
  ├─────┼──────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤ 
  │ 26  │ 의존성 중복                          │ requirements.txt 에 uuid6 + uuid7 동시 존재 — 실제 사용은              │ 미사용 패키지 제거                              │    
  │     │                                      │ uuid_extensions.uuid7str 하나                                          │                                                 │ 
  ├─────┼──────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤    
  │ 27  │ routes/login.js 응답                 │ 요청 검증 부족 — birth.year/birth.month 등 객체 구조 가정만 하고       │ Joi 또는 zod 도입                               │ 
  │     │                                      │ 미체크                                                                 │                                                 │ 
  ├─────┼──────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤    
  │ 28  │ python_api/routers/user.py           │ bcrypt 해시 검증 없음 — 평문이 들어와도 받음                           │ validator로 ^\$2[ab]\$\d{2}\$.{53}$ 정규식 검사 │ 
  │     │ PasswordUpdate                       │                                                                        │                                                 │    
  ├─────┼──────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤ 
  │ 29  │ 환경변수                             │ FRONTEND_URL 단일값 — 운영/스테이징 다중 도메인 불가                   │ 콤마 구분 + cors.origin 함수형 설정             │    
  ├─────┼──────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ 30  │ 프론트                               │ config.js 외에 fetch URL이 분산                                        │ API 클라이언트 모듈로 통합 (인터셉터로 401 자동 │    
  │     │                                      │                                                                        │  로그아웃)                                      │
  └─────┴──────────────────────────────────────┴────────────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────┘    
                                                            

---
## 🔧 2026-05-02 작업 내역

### 1. 이번 세션 개요

성능/안정성 부채 항목 재점검 + 신규 발견 + **README #8 (`like.py` rollback 누락) 실제 수정** 세션. 4월 18일자 12개 부채 표를 기준으로 잔여 항목(#5, #8, #9, #11)을 다시 짚고, 코드 리뷰로 새로 발견한 4개 항목(이미지 압축, 세션 캐시, 로깅, 에러 모니터링)을 추가 식별. 운영 중 실제 발생한 좋아요 토글 1205 락 타임아웃 트레이스를 기반으로 #8 우선 처리.

| 결과물 | 내용 |
|---|---|
| 잔여 부채 분석 | #9·#10·#11·#12·#13·#14·#15 (총 7건) 항목별 기존 방식 → 수정 후 방식 → 기대 효과 → 문제점 4단 분석 |
| README 매핑 | 신규 #9-#15 ↔ 4월 18일자 #1-#12 표 매핑 정리 |
| 작업 순서 권장 | #8 → #9 → #11 → #10 → #12 → #13 → #14 → #15 (보안 #11 후순위) |
| **실제 수정** | **README #8 — `like.py` rollback 패턴 적용 (1건 완료)** |

> ⚠️ 본 섹션의 신규 #번호(9~15)는 4월 18일자 #1~#12 와 별개 체계임. 혼동 방지 위해 본 섹션은 **"신규 #9~#15"** 로 표기하고, 4/18 체계는 **"README #1~#12"** 로 표기함.

---

### 2. 4월 18일자 12개 부채 진행 현황

| # | 등급 | 항목 | 4/18 발견 | 4/22 | 4/29 | 5/2 |
|---|---|---|---|---|---|---|
| #1 | 🔴 | Express try/catch 누락 | 발견 | ✅ | ✅ | ✅ |
| #2 | 🔴 | database.js 에러 처리 없음 | 발견 | ✅ | ✅ | ✅ |
| #3 | 🔴 | 글로벌 에러 핸들러 없음 | 발견 | ✅ | ✅ | ✅ |
| #4 | 🟠 | 피드 파일 미정리 | 발견 | 미해결 | ✅ | ✅ |
| **#5** | 🟠 | **GET /feed N+1 + 페이지네이션** | 발견 | 미해결 | 미해결 | **❌ 미해결** |
| #6 | 🟠 | 타임존 (CURDATE vs KST) | 발견 | 미해결 | ✅ | ✅ |
| #7 | 🟡 | 평문 비밀번호 폴백 | 발견 | 미해결 | ✅(Lazy) | ✅ |
| #8 | 🟡 | like.py rollback 누락 | 발견 | 미해결 | 미해결 | **✅ 완료 (5/2)** |
| **#9** | 🟡 | **DB 커넥션 풀 미사용** | 발견 | 미해결 | 미해결 | **❌ 미해결** |
| #10 | 🟢 | secure: false 하드코딩 | 발견 | 미해결 | ✅ | ✅ |
| **#11** | 🟢 | **Rate limiting 없음** | 발견 | 미해결 | 미해결 | **❌ 미해결** |
| #12 | 🟡 | 세션 인증 코드 반복 | 발견 | ✅ | ✅ | ✅ |

**진행률**: 8/12 해결 (≈67%) · 잔여 4건(#5, #8, #9, #11)이 3차례 세션 동안 후순위로 밀려옴 → 이번이 잔여 처리 타이밍.

---

### 3. 신규 #9~#15 항목별 4단 분석

#### 신규 #9. DB 커넥션 매 요청 생성 (`python_api/database.py:23`) — README #9 와 동일

| 구분 | 내용 |
|---|---|
| 기존 방식 | `get_connection()` 호출 시마다 `pymysql.connect()` 신규 생성, 라우터마다 `try/finally + conn.close()` 반복, 매 호출에 TCP+TLS 핸드셰이크 발생 |
| 수정 후 방식 | `aiomysql.create_pool(minsize=2, maxsize=10)` 또는 SQLAlchemy + `QueuePool` 도입, FastAPI `lifespan` 이벤트에서 풀 생성/해제 |
| 기대 효과 | 핸드셰이크 비용 제거 → 응답 시간 30~80ms 단축, RDS `max_connections`(t3.micro=66) 초과로 인한 502 차단, 처리량 2~5배 향상 가능 |
| 문제점 | pymysql(동기) → aiomysql(비동기) 전환 시 모든 라우터를 `async def + await` 로 마이그레이션 필요. 트랜잭션이 길면 풀 고갈로 latency 증가 → `pool_timeout` 튜닝 필요. stale connection 대비 `pool_pre_ping` 추가 필요 |

#### 신규 #10. N+1 쿼리 — 피드 목록 (`routes/feed.js:188`) — README #5 의 절반

| 구분 | 내용 |
|---|---|
| 기존 방식 | `getFeeds()` 1회 + 각 피드마다 `getFeedDetail()` + `checkLike()` → 피드 100개 시 Express↔FastAPI HTTP 호출 201회, FastAPI↔MySQL 쿼리는 그 이상 |
| 수정 후 방식 | FastAPI 에 `GET /feed/?user_id=xxx` 신설 — 한 쿼리로 피드+이미지+좋아요 상태 일괄 반환. `LEFT JOIN feed_likes fl ON fl.feed_id=f.feed_id AND fl.user_id=:uid` 로 좋아요 상태 결합 |
| 기대 효과 | HTTP 호출 201 → 1회로 축소, 첫 화면 로딩 수 초 → 수백 ms |
| 문제점 | `GROUP_CONCAT` 은 기본 1024바이트 제한 → 이미지 많은 피드는 잘림 (별도 쿼리 권장). `JSON_ARRAYAGG` 사용 시 MySQL 5.7.22+ 필요. 댓글까지 한꺼번에 가져오면 페이로드 폭증 → 댓글은 모달 열릴 때 별도 호출 유지 권장 |

#### 신규 #11. 페이지네이션 부재 (`routes/feed.js:188`) — README #5 의 절반

| 구분 | 내용 |
|---|---|
| 기존 방식 | `GET /feed` 가 전체 피드를 한 번에 반환 — 피드 1,000개면 1,000개 + 이미지 URL 모두 포함 |
| 수정 후 방식 | 커서 기반: `GET /feed?cursor=<created_at>_<feed_id>&limit=20`, FastAPI `WHERE (f.created_at, f.feed_id) < (:cursor_ts, :cursor_id) ORDER BY ... DESC LIMIT 20`, 프론트는 `IntersectionObserver` 무한 스크롤 |
| 기대 효과 | 첫 응답 페이로드 ~95% 감소, 모바일 OOM 방지, 데이터 사용량 절감, DB 부하 일정 |
| 문제점 | offset 방식보다 클라이언트 상태관리 복잡(cursor 직렬화). `created_at` 동률 시 tie-breaker(`feed_id`) 누락하면 페이지 경계 누락/중복. 신규 피드가 상단 추가될 때 "새 피드 보기" UX 별도 구현 필요 |

#### 신규 #12. 이미지 압축/썸네일 없음 (`python_api/routers/feed.py:88`, `routes/feed.js:103`) — README 미등록 신규

| 구분 | 내용 |
|---|---|
| 기존 방식 | multer 가 50MB 까지 원본 그대로 디스크 저장, 클라이언트에 동일한 원본 URL 서빙 → 모바일에서 4MB 사진 100장 = 400MB 다운로드 |
| 수정 후 방식 | multer → Sharp/Pillow 파이프라인: 원본을 WebP 80% 품질로 재인코딩 + 썸네일 320px/800px 생성, DB `feed_images` 에 `thumb_url`/`original_url` 분리 저장, 리스트는 thumb 사용 |
| 기대 효과 | 평균 파일 크기 60~80% 감소, 피드 리스트 데이터 사용량 ~10배 절감, 디스크 사용량 동시 감소 |
| 문제점 | 변환 시 CPU/메모리 사용 — Express 단일 프로세스라면 업로드 시 블로킹 위험 → worker_thread 또는 Sharp native async. 영상은 변환 비용이 높아 별도 처리 또는 원본만 유지 결정 필요. 기존 업로드 파일 마이그레이션 배치 필요. 장기적으로는 S3+CloudFront 가 정답 |

#### 신규 #13. 세션 검증 캐시 없음 (`backend/middleware/requireAuth.js`) — README 미등록 신규

| 구분 | 내용 |
|---|---|
| 기존 방식 | 모든 보호 라우트마다 `findSession()` → FastAPI HTTP → MySQL `SELECT * FROM sessions` 1회. 한 화면에 routine + feed + completion 호출 시 매번 세션 쿼리 누적 |
| 수정 후 방식 | `lru-cache` 패키지로 메모리 캐시: `key=sessionId`, `value=session`, TTL=60초. 캐시 히트 시 FastAPI 호출 생략, `POST /logout` 에서 `cache.delete(sessionId)` 즉시 무효화 |
| 기대 효과 | 세션 검증 latency 30~50ms → 0ms, FastAPI/RDS 부하 절반 이상 감소(보호 라우트가 절대다수) |
| 문제점 | 60초 윈도우 동안 세션 만료/강제 로그아웃 즉시 반영 안 됨(보안 트레이드오프). Express 인스턴스 여러 개일 때 캐시 일관성 깨짐 → Redis 이전 또는 짧은 TTL 유지. 세션 정보 변경(닉네임 등) 시 캐시 무효화 누락하면 stale data 노출 |

#### 신규 #14. 로깅 인프라 부재 (전체) — README 미등록 신규

| 구분 | 내용 |
|---|---|
| 기존 방식 | `console.log` / `console.error` / `print("🔴 오류:", e)` 산발 사용. 운영 시 파일에 남지 않거나 형식 제각각 → 검색/필터 불가. 요청 추적 불가 |
| 수정 후 방식 | Express: `pino` + `pino-http` (JSON 라인). FastAPI: `structlog` 또는 `python-json-logger`. 미들웨어에서 `traceId`(uuid) 발급 → `X-Trace-Id` 헤더로 Express↔FastAPI 전파. 로컬 stdout, 운영 파일/CloudWatch |
| 기대 효과 | traceId 1개로 Express → FastAPI → DB 전 흐름 추적, 로그 레벨/JSON 파싱으로 대시보드화 용이, 민감 정보 마스킹(redact) 일괄 적용 가능 |
| 문제점 | 기존 console.log 전부 변환 작업 필요(수십 군데). JSON 로그는 사람이 읽기 어려움 → 로컬 개발은 `pino-pretty` 별도 적용. 로그 양 폭증 시 디스크/비용 부담 → 로테이션/보존 정책 필요 |

#### 신규 #15. 에러 모니터링 부재 (전체) — README 미등록 신규

| 구분 | 내용 |
|---|---|
| 기존 방식 | 운영 중 발생한 예외는 stdout 만 들여다봐야 발견. React 클라이언트 에러는 사용자가 신고하지 않으면 영원히 모름. 발생 빈도/영향 범위/스택 트레이스 집계 불가 |
| 수정 후 방식 | Sentry SDK 도입: Express(`@sentry/node`), React(`@sentry/react` + `ErrorBoundary`), FastAPI(`sentry-sdk[fastapi]`). 신규 #14 traceId 와 연동 → Sentry 이슈에서 로그로 점프 |
| 기대 효과 | 실시간 알림(Slack/Email), 발생 빈도/영향 사용자 수 자동 집계 → 우선순위 판단, release 단위 그룹화로 회귀 추적 |
| 문제점 | 무료 플랜 5,000건/월 — 노이즈 필터링(`beforeSend`) 필요. PII(이메일/세션ID) 스택 노출 → 스크럽 규칙 필수. DSN 키 노출 시 가짜 이벤트 주입 가능 → CSP/도메인 화이트리스트 필요. Sentry 장애 시 fire-and-forget 설정 확인 |

---

### 4. 신규 #9-#15 ↔ 4월 18일자 README #1-#12 매핑

| 신규 # | 항목 | README 대응 | 비고 |
|---|---|---|---|
| 신규 #9 | DB 커넥션 풀 | **README #9** | 동일 항목 — README 잔여 |
| 신규 #10 | N+1 쿼리 | **README #5 의 절반** | 동일 항목 — README 잔여 |
| 신규 #11 | 페이지네이션 부재 | **README #5 의 절반** | 동일 항목 — README 잔여 |
| 신규 #12 | 이미지 압축/썸네일 없음 | ❌ 없음 | **신규 발견** — 페이로드 크기는 N+1과 별개 축 |
| 신규 #13 | 세션 검증 캐시 | ❌ 없음 | **신규 발견** — 4/22 #12(미들웨어화) 후속 최적화 |
| 신규 #14 | 로깅 인프라 부재 | ❌ 없음 | **신규 발견** — `console.log`/`print` 산재 |
| 신규 #15 | 에러 모니터링 부재 | ❌ 없음 | **신규 발견** — 운영 단계 진입 전 필수 |

**누락 검토 (이전 분석에서 빠진 README 잔여 항목)**:
- **README #8 `like.py` rollback 누락**: 안정성 영역인데 이번 분석에 누락. 단일 함수 수정이라 30분 작업, 위험도 낮음. **신규 #9(커넥션 풀) 도입 전에 먼저 정리하면 풀 마이그레이션이 깔끔해짐**.
- **README #11 Rate limiting**: 사용자가 보안은 후순위라고 명시했으므로 의도적 후순위. 단 `/login`·`/signup` 무차별 대입 방어는 운영 직전 필수.

---

### 5. 권장 처리 순서 (README + 신규 분석 통합)

| 순서 | 항목 | 출처 | 사유 |
|---|---|---|---|
| 1 | **README #8 `like.py` rollback** | README 잔여 | 단일 함수, 30분, 풀 도입 전 사전 정리 |
| 2 | **신규 #9 / README #9 DB 커넥션 풀** | 양쪽 일치 | 핵심 인프라 변경, async 마이그레이션 동반 |
| 3 | **신규 #11 / README #5(절반) 페이지네이션** | 양쪽 일치 | LIMIT/OFFSET 먼저, 커서는 후속 |
| 4 | **신규 #10 / README #5(절반) N+1 쿼리** | 양쪽 일치 | FastAPI JOIN 신설 |
| 5 | **신규 #12 이미지 압축** | 신규 | 페이로드 절감 |
| 6 | **신규 #13 세션 캐시** | 신규 | 신규 #9 풀과 함께 고려하면 효과 극대 |
| 7 | **신규 #14 로깅 → 신규 #15 모니터링** | 신규 | 운영 진입 직전 |
| 8 | **README #11 Rate limiting** | README 잔여 | 보안 후순위 (사용자 결정) |

---

### 6. README #8 — `like.py` rollback 누락 실제 수정

#### 발견 경위

운영 환경에서 좋아요 토글 시 다음 트레이스 발생:

```
pymysql.err.IntegrityError: (1062, "Duplicate entry '...' for key 'feed_likes.unique_like'")
During handling of the above exception, another exception occurred:
pymysql.err.OperationalError: (1205, 'Lock wait timeout exceeded; try restarting transaction')
```

Express 측에는 `FastApiError: status 500` (50초 지연 후 502) 로 노출.

#### 근본 원인

`pymysql` 의 기본 `autocommit=False` 환경에서:

1. `conn1 = get_connection()` → 트랜잭션 시작
2. INSERT 시도 → `IntegrityError 1062` (UNIQUE 충돌)
3. **conn1 의 트랜잭션은 활성 상태로 유지** → 해당 (feed_id, user_id) 인덱스 슬롯에 락 보유 중
4. `except` 분기에서 `conn2 = get_connection()` 신규 오픈
5. conn2 로 같은 행에 DELETE 시도 → conn1 의 락 해제 대기
6. `innodb_lock_wait_timeout` (50초) 초과 → `OperationalError 1205`
7. `finally` 의 `conn1.close()` 는 너무 늦게 발동

→ **자기 자신과의 락 충돌(self-deadlock)**.

#### 수정 내용 (`src/python_api/routers/like.py`)

| Before | After |
|---|---|
| `IntegrityError` 캐치 → `conn2 = get_connection()` 신규 오픈 → DELETE | `IntegrityError` 캐치 → `conn.rollback()` 으로 락 해제 → 동일 커넥션에서 DELETE |
| 커넥션 2개 사용 | 커넥션 1개 사용 |
| 50초 후 1205 타임아웃 | 즉시 응답 |

추가로 일반 `Exception` 분기에도 `try: conn.rollback(); except: pass` 안전망을 두어 어떤 실패 경로에서도 트랜잭션이 정리되도록 함.

#### 부수 효과

- 신규 #9 (DB 커넥션 풀 도입) 작업 시 `add_like()` 가 이미 단일 커넥션 패턴이므로 마이그레이션이 한 함수만큼 줄어듦 — 사전 정리 효과
- 동시 클릭 race condition (둘 다 INSERT 실패 → 둘 다 DELETE → 결과 0) 은 본 패턴으로도 미해결이지만, 같은 사용자가 동시에 같은 피드를 두 번 클릭하는 케이스는 실사용에서 거의 발생하지 않아 본 수정 범위 외로 둠

#### 검증

- `python3 -c "import ast; ast.parse(...)"` → 문법 통과
- 권장 수동 검증:
  1. 같은 피드 좋아요 → 취소 → 좋아요 → 취소 4번 클릭 모두 즉시 응답 (50초 지연 없음)
  2. `SELECT * FROM feed_likes WHERE feed_id=? AND user_id=?` 로 토글 결과와 DB 상태 일치 확인

#### 파일

| 파일 | 변경 |
|---|---|
| `src/python_api/routers/like.py` | `add_like()` 의 INSERT/DELETE 분기를 단일 커넥션 + rollback 패턴으로 재작성, `[수정 2026-05-02]` 주석으로 변경 사유 명시 |

---

### 7. 검증 결과 (전체)

- `like.py`: `ast.parse()` 통과
- README 본 섹션 추가 + 4월 18일자 부채 표의 #8 상태 갱신 (`✅ 완료 (5/2)`)
- 미구현 체크리스트에서 #8 항목 제거

---

## 🔧 2026-05-03 작업 내역

### 1. 배경: 피드 목록 조회 N+1 + 페이지네이션 부재 (신규 #10 + #11 동시 처리)

5/2 분석에서 도출된 두 항목을 동시에 묶어 처리. 두 문제는 같은 엔드포인트(GET /feed)에서 발생하며, 별도 커밋으로 나누면 응답 스키마가 두 번 바뀌게 되어 프론트와 두 번 동기화해야 한다. 한 번에 처리하는 편이 합리적.

**기존 흐름 (병목):**
```
FeedPage (mount)
  └─ GET /feed                     ← 전체 피드 1회 (LIMIT 없음)
        └─ Express getFeeds()      ← FastAPI GET /feed/ 1회
        └─ Promise.all(feeds.map):
              └─ getFeedDetail()   ← 피드 상세(이미지/댓글) 1회씩
              └─ checkLike()       ← 좋아요 여부 1회씩
```
피드 N개 시 **HTTP 호출 1 + 2N**, DB 쿼리도 거의 비례. 100개 → 201회.

**변경 흐름:**
```
FeedPage (mount/scroll-end)
  └─ GET /feed?cursor=...&limit=20  ← 페이지 단위 (cursor 기반)
        └─ FastAPI: 단일 SQL JOIN
              feeds + users + routines + feed_likes(count) + feed_comments(count)
              + LEFT JOIN feed_likes(user_id 조건) → liked 결합
        └─ feed_id IN (...) 1회로 이미지 일괄 조회
  └─ openCommentModal()
        └─ GET /comment/{feed_id}   ← 모달 열 때만 댓글 페치
```
페이지당 HTTP 1회 + DB 쿼리 2회 (피드+이미지). 댓글은 모달 진입 시 lazy fetch.

### 2. 구현 변경

#### A. FastAPI `GET /feed/` 시그니처 확장

`src/python_api/routers/feed.py`:
- `Query` 파라미터 3개 추가 — `user_id` (Optional), `cursor` (Optional), `limit` (1~100, 기본 20)
- 단일 쿼리로 좋아요 카운트/댓글 카운트 + 현재 사용자 좋아요 상태(`MAX(CASE WHEN fl_me.like_id IS NOT NULL THEN 1 ELSE 0 END) AS liked`) 결합
- 커서 페이지네이션: `WHERE (f.created_at, f.feed_id) < (%s, %s)` + `ORDER BY ... DESC LIMIT %s`
  - tie-breaker로 `feed_id` 포함 — 같은 created_at이 여러 행 있어도 페이지 경계가 누락되지 않음
- 이미지는 페이지에 포함된 feed_id 목록을 모아 `IN (...)` 1회 쿼리로 조회
- 응답 형식: `{ feeds: [...], next_cursor: "<created_at>_<feed_id>" | null }` (구버전: bare list)

#### B. Express `getFeeds()` / `GET /feed` 라우트 정리

- `database.js` `getFeeds()` 시그니처: `({ user_id, cursor, limit = 20 } = {})` — `URLSearchParams`로 쿼리 빌드
- `routes/feed.js`:
  - `Promise.all` + `getFeedDetail`/`checkLike` N+1 루프 완전 제거
  - 인증된 `user_id`와 `req.query.cursor`/`req.query.limit`만 그대로 FastAPI로 패스스루
  - `checkLike` import 제거 (라우트에서 더 이상 사용 안 함; database.js의 함수 자체는 다른 라우트에서 쓰일 가능성 대비 유지)

#### C. FeedPage.jsx 무한 스크롤 + lazy 댓글 페치

- 상태 추가: `nextCursor`, `loadingMore`, `hasMore`
- `fetchFeeds(cursor, reset)` — `reset=true`면 첫 페이지로 초기화, 아니면 누적
- `IntersectionObserver` + sentinel `<div ref={sentinelRef}>` — 뷰포트에 진입하면 다음 페이지 로드 (rootMargin: 200px로 약간 미리 트리거)
- `openCommentModal(feed_id)` — 모달 진입 시 `GET /comment/:feed_id`로 댓글 페치 후 해당 post의 `comments` 필드를 갱신
- "더 불러오는 중..." / "마지막 게시물까지 모두 봤어요." 안내 문구 추가

### 3. 핵심 SQL (단일 JOIN으로 N+1 제거)

```sql
SELECT
    f.feed_id, f.content, f.created_at, f.user_id,
    COALESCE(u.nickname, '(탈퇴한 사용자)') AS nickname, u.profile_img,
    COALESCE(r.title, '(삭제된 루틴)') AS routine_title, r.category,
    COUNT(DISTINCT fl.like_id) AS like_count,
    COUNT(DISTINCT fc.comment_id) AS comment_count,
    MAX(CASE WHEN fl_me.like_id IS NOT NULL THEN 1 ELSE 0 END) AS liked
FROM feeds f
LEFT JOIN users u ON f.user_id = u.user_id
LEFT JOIN routines r ON f.routine_id = r.routine_id
LEFT JOIN feed_likes fl ON f.feed_id = fl.feed_id
LEFT JOIN feed_comments fc ON f.feed_id = fc.feed_id
LEFT JOIN feed_likes fl_me
    ON fl_me.feed_id = f.feed_id AND fl_me.user_id = %s
WHERE (f.created_at, f.feed_id) < (%s, %s)   -- cursor 없으면 생략
GROUP BY f.feed_id
ORDER BY f.created_at DESC, f.feed_id DESC
LIMIT %s
```

`COUNT(DISTINCT ...)`로 `fl`/`fc` 두 LEFT JOIN의 카티시안 곱이 카운트를 부풀리는 문제를 차단.
`fl_me`는 `user_id` 매칭 행이 0개 또는 1개이므로 `MAX(CASE ...)`로 0/1을 결합.

### 4. 기대 효과

- 피드 100개 페이지 응답: HTTP 1회 + DB 쿼리 2회 (기존 201회 → **99% 감소**)
- 페이로드 크기: 페이지 크기로 상한 (20개 × 평균 카드 = 수십 KB), 댓글은 모달에서만 로드
- DB 부하: GROUP BY + LEFT JOIN 1쿼리 + IN 쿼리 1회로 일정 (피드 N에 대해 O(1) 라운드트립)

### 5. 잠재 문제 / 향후 보완

- **`MAX(CASE...)` + GROUP BY 조합** — `fl_me`가 user_id로 0/1행 보장이지만 누군가 동일 (feed_id, user_id)에 like를 두 번 INSERT하면 (UNIQUE 제약 깨졌을 때) MAX는 여전히 1을 반환하므로 데이터는 정상. 단, `like_count`/`comment_count`의 정확성은 UNIQUE 제약에 의존.
- **cursor 안정성** — soft-deleted 피드(미래 도입 시) 또는 새로 추가된 피드가 cursor 사이에 끼어들 가능성. 현재는 created_at DESC 정렬이라 신규는 무조건 위에 오므로 문제 없으나, "리프레시 버튼"으로 첫 페이지를 다시 받는 UX는 별도 구현 필요.
- **댓글 lazy fetch의 race** — 모달을 빠르게 여러 번 열고 닫을 때 이전 요청 응답이 늦게 도착할 수 있음. 현재 구현은 feed_id 매칭으로 갱신해서 큰 문제는 없지만, 엄밀하게는 AbortController로 직전 요청을 취소하는 편이 안전.
- **frontend hot path 두 번 변경** — 5/3에 응답 스키마 + 댓글 페치 위치가 동시에 바뀌었으므로, 캐시된 클라이언트가 구버전 코드로 새 응답을 받으면 `data.feeds.map(...)` 등에서 깨질 수 있음. 배포 시 강제 리로드 권장.

### 6. 검증

- `node --check src/backend/routes/feed.js` 및 `database.js` → 통과
- `python3 -c "import ast; ast.parse(...)"` (feed.py) → 통과
- `npx vite build` → 성공 (283.14 kB)
- 권장 수동 검증:
  1. 피드 21개 이상 등록 후 스크롤 — 20개씩 추가 로드되고 마지막에 "마지막 게시물..." 표시
  2. 댓글 모달 열기 — `/comment/{feed_id}` 호출 후 댓글 표시
  3. 좋아요 토글 — `liked` 상태가 새로고침 후에도 유지
  4. 네트워크 탭에서 DB 쿼리 수 확인 (예: 슬로우 쿼리 로그)

### 7. 파일

| 파일 | 변경 |
|---|---|
| `src/python_api/routers/feed.py` | `GET /feed/` 에 user_id/cursor/limit 쿼리 추가, 단일 JOIN + IN 쿼리로 N+1 제거, 응답을 `{feeds, next_cursor}` dict 로 변경 |
| `src/backend/database.js` | `getFeeds()` 시그니처를 `{user_id, cursor, limit}` 옵션 객체로 변경, URLSearchParams 로 쿼리 빌드 |
| `src/backend/routes/feed.js` | `Promise.all` N+1 루프 제거, FastAPI 응답 그대로 패스스루, `checkLike` import 제거 |
| `src/frontend/FeedPage.jsx` | 커서 + IntersectionObserver 무한 스크롤, 모달 진입 시 댓글 별도 페치, sentinel/안내 문구 추가 |

---

### 8. 피드 미디어 UI 개선

- 피드 게시물의 사진/영상을 한 번에 모두 보여주지 않고, 인스타그램처럼 현재 미디어 1개만 표시하도록 변경
- 좌우 버튼을 눌러 다음 사진/영상으로 이동할 수 있는 캐러셀 방식 적용
- 댓글 모달에서도 동일한 미디어 탐색 방식이 동작하도록 구조 통일
- 작은 이미지/영상 업로드 시 피드 영역 크기가 줄어들지 않도록 미디어 박스 비율을 고정
- 남는 여백은 검은 배경으로 처리하고, 미디어는 `contain` 방식으로 중앙 정렬되도록 스타일 수정

### 9. 루틴 인증 업로드 개선

- 상세 루틴 인증 시 사진/영상을 최대 3개까지 누적해서 추가할 수 있도록 수정
- 이미 선택한 파일을 유지한 채 추가 선택이 가능하도록 업로드 로직 개선
- 영상 파일은 6초 이하일 때만 업로드 가능하도록 제한

---

## 🔧 2026-05-05 작업 내역

### 1. 이번 세션 개요

피드 이미지를 **로컬 디스크(`src/backend/uploads/`) → AWS S3** 로 전환. 4월 18일자 미구현 체크리스트의 마지막 인프라 항목("피드 이미지 → S3 전환 고려") 해소. Docker 화 / 글로벌 배포 사전 작업.

| 항목 | 처리 결과 | 영향 파일 |
|---|---|---|
| S3 직접 업로드 (multer-s3) | ✅ 완료 | `src/backend/routes/feed.js` |
| S3 객체 삭제 (DeleteObjectCommand) | ✅ 완료 | `src/backend/routes/feed.js` |
| `/uploads` 정적 서빙 제거 | ✅ 완료 | `src/backend/app.js` |
| 환경변수 4개 추가 | ✅ 완료 | `src/backend/.env.example` |
| 의존성 추가 | ✅ 완료 | `src/backend/package.json` |
| 프론트엔드 변경 | 불필요 | `getImageUrl` 이 이미 `http*` URL 통과 처리 |

### 2. 변경 배경

기존 구조의 한계:

```
[Before]
A의 PC: POST /feed → src/backend/uploads/abc.jpg 에 저장 + DB file_url=/uploads/abc.jpg
        → A 화면에선 정상 표시 (Express 정적 서빙)
B의 PC: GET /feed → DB 의 /uploads/abc.jpg URL 받음
        → B 의 디스크에 abc.jpg 없음 → 이미지 깨짐 (404)
```

팀원이 RDS 를 공유해도 이미지 파일이 각자 PC 에만 있어 **피드 화면이 사용자별로 다르게 보이는 문제**가 있었음. Docker 컨테이너로 옮겨도 동일 (컨테이너 디스크에만 저장되므로 본질이 같음).

```
[After]
A의 PC: POST /feed → multer-s3 → S3 PUT → file.location 으로 퍼블릭 URL 획득
        → DB file_url=https://my-bucket.s3.ap-northeast-2.amazonaws.com/feed/171...jpg
B의 PC: GET /feed → DB 에서 S3 퍼블릭 URL 받음 → <img src="..."> → 정상 표시
```

S3 는 객체 스토리지 전용 서비스로, 99.999999999% 내구성 + 글로벌 CDN 연동 + 프리티어 5GB 무료. EC2 디스크에 저장하는 것보다 **싸고 빠르고 안전**.

### 3. 구체 변경 사항

#### 3-1. 의존성 (`src/backend/package.json`)

| 패키지 | 버전 | 용도 |
|---|---|---|
| `@aws-sdk/client-s3` | ^3.700.0 | S3Client, DeleteObjectCommand (객체 삭제) |
| `multer-s3` | ^3.0.1 | multer storage engine — 디스크 거치지 않고 S3 로 직접 스트림 |

`multer` 본체는 그대로 유지. `multerS3` 는 `multer.diskStorage` 자리만 대체.

#### 3-2. 환경변수 (`src/backend/.env`)

```bash
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=<bucket-name>
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

→ `.gitignore` 에 의해 git 비추적. 팀원에겐 Slack DM 등 안전 채널로 별도 전달.

#### 3-3. `routes/feed.js` — multer-s3 설정

```javascript
const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const upload = multer({
    storage: multerS3({
        s3,
        bucket: AWS_S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `feed/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
        },
    }),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: /* image/* 또는 video/* 만 허용 */,
});
```

키 규칙: `feed/<timestamp>-<랜덤>.<확장자>` — `feed/` prefix 로 다른 용도(향후 프로필 사진 등) 객체와 분리.

#### 3-4. `routes/feed.js` — 업로드 분기 (POST /feed)

| 변경 전 | 변경 후 |
|---|---|
| 파일을 `req.files[i].path` 로 디스크 저장 | `req.files[i].location` (S3 URL), `req.files[i].key` 사용 |
| `file_url = "/uploads/" + filename` | `file_url = file.location` (S3 퍼블릭 URL 그대로) |
| 실패 시 `fs.unlink(file.path)` | 실패 시 `s3.send(new DeleteObjectCommand(...))` |
| `cleanupFiles()` 헬퍼 | `cleanupS3Objects()` 헬퍼 |

검증 실패 / FastAPI 실패 / throw 모든 분기에서 `cleanupS3Objects()` 호출 — 고아 객체(DB 레코드 없는 S3 파일) 누적 방지 정책은 4/29 와 동일.

#### 3-5. `routes/feed.js` — 삭제 분기 (DELETE /feed/:feed_id)

| 변경 전 | 변경 후 |
|---|---|
| `fileUrls` 에서 `path.basename()` 으로 파일명 추출 | `extractS3Key(url)` 로 S3 키 추출 |
| `fs.unlink(path.join(UPLOAD_DIR, filename))` | `s3.send(new DeleteObjectCommand({ Bucket, Key }))` |

`extractS3Key()` 는 호스트네임이 `*.amazonaws.com` 인지 검증 후 `pathname` 을 키로 변환. 비-S3 URL 이거나 형식이 맞지 않으면 `null` 반환 → 삭제 대상에서 제외 (보안).

선조회 → DB 삭제 성공 시에만 S3 삭제 정책은 동일.

#### 3-6. `app.js` — 정적 서빙 제거

```diff
- app.use("/uploads", express.static(path.join(__dirname, "uploads")));
+ // [제거 2026-05-05] /uploads 정적 서빙 — 피드 이미지를 S3 로 이전.
```

`path` import 도 더 이상 사용처 없어 제거.

### 4. 프론트엔드 변경 불필요

`src/frontend/FeedPage.jsx` 의 `getImageUrl()`:

```javascript
const getImageUrl = (fileUrl) => {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http")) return fileUrl;   // ← S3 URL 은 여기서 통과
    return `${EXPRESS_URL}${fileUrl}`;                 // ← 옛날 /uploads/ 형태
};
```

기존 코드가 이미 S3 퍼블릭 URL(절대 URL)을 그대로 통과시키므로 화면 코드 수정 불필요. 프론트는 DB 가 주는 URL 을 그냥 `<img src=>` 에 넣으면 된다.

### 5. 기존 데이터 마이그레이션

캡스톤 개발 단계 데이터라 **마이그레이션 미실시**:

- 기존 `src/backend/uploads/` 의 파일들은 그대로 남아있지만 더 이상 서빙되지 않음
- 기존 DB `feed_images.file_url` 의 `/uploads/...` 값은 화면에서 깨짐 (예상)
- 깨끗한 시작 권장: 기존 피드를 모두 삭제 후 새로 업로드 테스트

운영 환경 전환 시 필요한 마이그레이션 스크립트 (현재는 미작성):

```sql
-- 옛날 로컬 URL 만 가진 행 식별
SELECT image_id, file_url FROM feed_images WHERE file_url LIKE '/uploads/%';
```

→ 이 행들의 파일을 `aws s3 cp src/backend/uploads/ s3://<bucket>/feed/ --recursive` 로 일괄 업로드 후 `UPDATE feed_images SET file_url = ...` 일괄 갱신.

### 6. AWS 사전 셋업 (수동, 1회)

1. **S3 버킷 생성** (서울 리전 `ap-northeast-2`, 퍼블릭 액세스 부분 차단 해제)
2. **버킷 정책** — `s3:GetObject` 퍼블릭 허용 (이미지 공개 읽기)
3. **CORS 설정** — `localhost:5173`, `localhost:3000` 허용
4. **IAM 사용자** `routine-mate-s3-uploader` 생성, `s3:PutObject` + `s3:DeleteObject` 권한만 부여
5. **액세스 키 발급** → `.env` 에 저장

자세한 절차는 별도 셋업 가이드 참조 (대화 이력 또는 운영 위키).

### 7. 검증

- `node --check src/backend/routes/feed.js` 통과
- `node --check src/backend/app.js` 통과
- `npm run lint` (프로젝트 ESLint) 경고 0건
- `npm install` (cd src/backend) — 208 packages added 정상 (사전 보안 경고 2건은 기존 path-to-regexp/uuid 로 본 작업과 무관)

### 8. 트레이드오프 / 향후 과제

| 항목 | 현재 | 향후 |
|---|---|---|
| 이미지 권한 | 퍼블릭 (인스타식, 누구나 URL 로 보기) | 비공개 + 프리사인 URL 도 가능하나 코드 추가 필요 |
| CDN | 직접 S3 URL 서빙 | CloudFront 도입 시 글로벌 응답속도 ↓ + 비용 ↓ |
| 비용 | 프리티어 5GB / 월 20K GET 무료 | 트래픽 증가 시 모니터링 필요 |
| 압축/썸네일 | 원본 그대로 저장/서빙 (README 신규 #12 잔여 부채) | Sharp 로 WebP 80% + 320/800px 썸네일 |
| 영상 | 원본 저장 (변환 비용 큼) | 별도 처리 또는 외부 서비스 위탁 |

### 9. 변경 파일 목록 (5개)

| 파일 | 변경 내용 |
|---|---|
| `src/backend/routes/feed.js` | multer-s3 도입, S3 키 추출 헬퍼, S3 객체 삭제로 전환 (전면 재작성에 가까운 수정) |
| `src/backend/app.js` | `/uploads` 정적 서빙 제거, `path` import 제거 |
| `src/backend/package.json` | `@aws-sdk/client-s3`, `multer-s3` 의존성 추가 |
| `src/backend/.env.example` | AWS 환경변수 4개 추가 (REGION/BUCKET/KEY_ID/SECRET) |
| `README.md` | 본 작업 섹션 추가 + 미구현 체크리스트 갱신 |

---

## 🔧 2026-05-07 작업 내역

### 1. 이번 세션 개요

팀 배포 환경을 표준화하기 위해 **Docker / docker compose 기반 개발 환경**을 도입. 팀원이 모두 Windows 환경이고 각자 로컬에서 돌리는 구조라, 가상화 도구 한 가지로 Node 버전 / Python 버전 / OS 의존성 차이를 한꺼번에 격리하는 방식이 가장 효율적이라고 판단.

| 항목 | 내용 |
|---|---|
| 도입 방식 | Dockerfile + docker-compose.yml 을 git 으로 공유 (registry 푸시 X, tar 배포 X) |
| 배포 단위 | git push → 팀원 git pull + `docker compose up --build` |
| 코드 동기화 | 호스트 ./src ↔ 컨테이너 /app/src 볼륨 마운트 (핫 리로드) |
| AWS RDS / S3 | 컨테이너 외부, 인터넷 통해 직접 접속 (이미지에 박지 않음) |
| 비밀 (env) | `.env` 3개 + `env_file` 디렉티브로 런타임 주입, `.gitignore` 비추적 유지 |

### 2. 도입 배경

**문제 — "내 PC 에선 됐는데"**

| 상황 | 결과 |
|---|---|
| 팀원 A: Node 20.5, Python 3.12 | 정상 실행 |
| 팀원 B: Node 18.12 | npm install 시 호환 경고, 일부 모듈 동작 불일치 |
| 팀원 C: Python 3.10 + Windows | bcrypt 휠 빌드 실패, venv 활성화 PowerShell 권한 이슈 |

캡스톤 진행 중 환경 셋업 디버깅에 누적 시간이 너무 많이 들어가 데드라인 압박 가중. 본 작업은 이를 한 번에 해소.

**선택한 방식 — Dockerfile 을 git 으로 공유**

3가지 배포 방식 중 비교 후 결정:

| 옵션 | 특징 | 본 프로젝트 적합도 |
|---|---|---|
| Docker Hub / GHCR push | 이미지 자체를 레지스트리에 올림 | ❌ 캡스톤엔 과한 인프라 |
| `docker save` → tar 파일 배포 | 오프라인용, USB/슬랙 전달 | ❌ 코드 수정마다 tar 새로 보내야 함, git 흐름과 충돌 |
| **Dockerfile + compose.yml git 공유** | 텍스트 파일만 공유, 팀원이 자체 빌드 | ⭐ 채택 |

세 번째 방식이 가진 장점:

- 환경 정의 파일이 **코드와 함께 버전 관리**됨 (git blame 가능)
- 팀원이 코드 수정해서 push 하는 흐름이 그대로 유지됨
- 이미지 자체를 보내지 않으니 변경 전파가 단순 — git pull 이 곧 환경 동기화

### 3. 컨테이너 구성

**3개 서비스, 외부 인프라 그대로 사용**

```
┌─────────────────┐  http://localhost:5173 (브라우저)
│ frontend        │
│ node:20-alpine  │  Vite dev server, --host 0.0.0.0
│ port 5173       │
└─────────┬───────┘
          │ Vite dev 환경에선 브라우저 ↔ Express 직접 통신
          │ (Vite 빌드 산출물이 브라우저에서 돌아감)
          ▼
┌─────────────────┐  http://localhost:3000 (브라우저)
│ backend         │  http://backend:3000   (컨테이너 간)
│ node:20-alpine  │  Express, node --watch 로 hot reload
│ port 3000       │  multer-s3 → AWS S3
└─────────┬───────┘
          │ http://python_api:8000 (compose 내부 DNS)
          ▼
┌─────────────────┐
│ python_api      │  http://localhost:8000 (디버깅용 노출)
│ python:3.12-slim│  uvicorn --reload, pymysql → AWS RDS
│ port 8000       │
└─────────┬───────┘
          │
          ▼
   AWS RDS MySQL (외부)
   AWS S3       (외부)
```

핵심 결정 사항:

- **로컬 MySQL 컨테이너 미도입** — 팀이 이미 RDS 공유 사용 중. 데이터 통일성 우선.
- **이미지 사이즈 최적화** — alpine / slim 베이스 + 레이어 캐싱 + .dockerignore 로 의존성 파일을 코드보다 먼저 복사 (의존성 안 바뀌면 `npm install` 캐시 재사용)
- **node_modules / venv 격리** — named volume 으로 컨테이너 안에만 두어 Mac (M1) ↔ Windows ↔ Linux 의 native 모듈 차이 차단
- **컨테이너 통신은 서비스명** — `PYTHON_API=http://python_api:8000` 을 docker-compose.yml 에서 환경변수로 덮어씀. `.env` 의 `localhost:8000` 은 비-Docker 사용자용으로 유지.

### 4. 핫 리로드 동작 원리

```
[팀원 PC]                                    [컨테이너 안]
                                             
src/backend/routes/feed.js   ←—volume mount—→  /app/routes/feed.js
                                                    │
                                                    │ 파일 수정 감지
                                                    ▼
                                              node --watch app.js
                                                    │ 자동 재시작
                                                    ▼
                                              Express 서버 재기동
                                              새 코드로 응답
```

- **Frontend (Vite)** — `CHOKIDAR_USEPOLLING=true` 환경변수로 Mac/Windows 바인드 마운트의 inotify 차이 보정
- **Backend (Node)** — `node --watch` (Node 20+ 내장 기능, nodemon 추가 의존성 불필요)
- **Python API (uvicorn)** — `--reload` 플래그 (기존 start.sh 와 동일)

팀원은 평소처럼 IDE 로 코드 수정 → 저장 → 브라우저 새로고침. Docker 가 거기 있는 줄도 의식 안 해도 됨.

### 5. 추가/생성된 파일 목록 (8개)

| 파일 | 역할 |
|---|---|
| `Dockerfile.frontend` | React/Vite 컨테이너 이미지 정의 (node:20-alpine, port 5173) |
| `Dockerfile.backend` | Express 컨테이너 이미지 정의 (node:20-alpine, port 3000, `node --watch`) |
| `Dockerfile.python_api` | FastAPI 컨테이너 이미지 정의 (python:3.12-slim, port 8000, `uvicorn --reload`) |
| `docker-compose.yml` | 3개 서비스 + 네트워크 + 볼륨 + env_file 통합 정의 |
| `.dockerignore` (루트) | frontend 빌드 시 이미지에 안 들어갈 파일 (node_modules, .env, .git 등) |
| `src/backend/.dockerignore` | backend 빌드 컨텍스트용 |
| `src/python_api/.dockerignore` | python_api 빌드 컨텍스트용 |
| `.gitattributes` | Windows/macOS 줄바꿈 통일 (LF 강제) — sh 스크립트가 컨테이너에서 깨지지 않도록 |
| `start-docker.sh` | 팀원용 한 줄 래퍼 — Docker 데몬 / .env 사전 검사 후 `docker compose up` 호출 |
| `README.md` | "Docker 로 실행하기" 섹션 추가 + 본 작업 내역 기록 |

> 기존 `start.sh` 는 그대로 유지 — Docker 안 쓰는 팀원이나 빠른 단독 실행용 fallback.

### 6. 보안 / 운영 고려사항

| 항목 | 처리 방식 |
|---|---|
| **AWS Access Key / RDS 비번** | `.env` 3개로 분리 → `.gitignore` 비추적 → 슬랙 DM 으로 별도 전달 |
| **이미지에 비밀 베이크 금지** | `Dockerfile` 안에 `ENV AWS_*` 하드코딩 ❌. `env_file:` 디렉티브로 런타임 주입 ✅ |
| **컨테이너 권한** | 현재 root 로 실행 (개발 모드). 운영 전환 시 비권한 사용자(`USER node`) 적용 권장 |
| **버전 핀** | 베이스 이미지 `node:20-alpine` / `python:3.12-slim` 만 사용 — `:latest` 금지 (재현성 보장) |
| **레이어 캐싱** | 의존성 파일 → 의존성 설치 → 코드 마운트 순으로 정렬 → 코드 수정만으론 의존성 재설치 안 됨 |

### 7. 운영 흐름 — 본인 / 팀원

#### 본인 (배포 담당)

```bash
# 1. Dockerfile / package.json / requirements.txt 등 환경 변경 시
git add Dockerfile.* docker-compose.yml ...
git commit -m "ops: Docker 의존성 추가/변경"
git push origin dev

# 2. 슬랙 공지
"환경 변경했어. git pull 후 docker compose up --build 해줘."
```

#### 팀원 (배포 받기)

```bash
# 최초 1회
git clone <repo>
cp .env.example .env (× 3)
# .env 파일에 슬랙 DM 받은 키 입력

./start-docker.sh         # 또는 docker compose up

# 매일
docker compose up -d      # 백그라운드
# IDE 로 코드 수정 — 평소대로
git add / commit / push   # 평소대로
docker compose down       # 일과 종료

# 환경 변경 알림 받았을 때
git pull
docker compose up --build
```

### 8. 검증

- 본인 PC (Mac, Apple Silicon, Docker Desktop v5.1.3) 에서 빌드 성공:
  - `stoic-hamilton-e58836-frontend:latest` 424MB
  - `stoic-hamilton-e58836-backend:latest` 240MB
  - `stoic-hamilton-e58836-python_api:latest` 239MB
- `docker compose config` 문법 검증 통과
- 호스트 코드 수정 → 컨테이너 안 자동 반영 동작 확인 (Vite/node --watch/uvicorn --reload)
- `start-docker.sh` 가 .env 누락 / Docker 데몬 미실행 사전 차단

### 9. 알려진 한계 / 향후 과제

| 항목 | 현재 상태 | 향후 고려 |
|---|---|---|
| 운영용 빌드 | 도입 안 함 (dev only) | `docker-compose.prod.yml` 분리, multi-stage build, `npm run build` 정적 파일 nginx 서빙 |
| HTTPS | 평문 HTTP only | EC2 배포 시 nginx + Let's Encrypt 또는 ALB + ACM |
| 컨테이너 root 권한 | dev 모드라 그대로 | 운영 전 비권한 사용자(`USER node`) 적용 |
| 이미지 레지스트리 | 미사용 | 운영 단계 진입 시 GHCR/ECR 도입 검토 |
| Windows 바인드 마운트 속도 | WSL2 기준 양호 | 느리면 Mutagen / docker-sync 검토 (현재 단계엔 불필요) |
| Vite HMR 안정성 | `CHOKIDAR_USEPOLLING=true` 적용 | 폴링 대신 파일시스템 이벤트가 정상 동작하는지 팀원 검증 후 폴링 옵션 제거 가능 |

### 10. 팀원 안내 슬랙 템플릿

```
🐳 Docker 환경 도입했어. 이제 앞으로는 다음과 같이 실행하면 돼:

[최초 1회]
1. Docker Desktop 설치: https://docker.com/products/docker-desktop
2. git pull origin dev
3. .env 파일 3개 작성 (.env.example 복사 후 값 입력)
   - 루트 .env
   - src/backend/.env  ← AWS 키 4줄 (별도 DM)
   - src/python_api/.env  ← RDS 자격증명 (별도 DM)
4. ./start-docker.sh

[매일]
- docker compose up -d (시작)
- 코드 수정은 평소대로 (자동 핫 리로드)
- docker compose down (종료)

[환경 변경 알림 받았을 때]
- git pull && docker compose up --build

기존 start.sh 도 그대로 살아있으니 Docker 안 쓰고 싶으면 그쪽으로 가도 돼.
막히면 README 의 "Docker 로 실행하기" 섹션 보거나 나한테 DM.
```

---

## 🔧 2026-05-10 작업 내역

### 1. 이번 세션 개요

이번 작업은 기존 구조인 **React → Express → FastAPI → MySQL** 을 유지하면서,
보안 경계 강화, 마이페이지/통계 실제 데이터 연결, 성능 개선 기반을 한 번에 정리한 세션이다.

핵심 목표:

- FastAPI 직접 호출 우회 방지
- 완료/피드 생성 시 소유권 검증 강화
- MyPage / StatsPage 의 mock 데이터 제거
- DB 커넥션 재사용, 요청 시간 측정, 짧은 통계 캐시 도입
- 향후 RDS 적용용 인덱스 SQL 정리

---

### 2. FastAPI 직접 접근 방어

#### 2-1. 내부 인증 헤더 도입

FastAPI는 브라우저가 직접 호출하는 공개 API가 아니라 Express 뒤의 내부 데이터 계층이다.
따라서 Express가 FastAPI를 호출할 때만 공유 키를 헤더로 붙이고, FastAPI는 이 헤더가 없거나 틀리면 요청을 차단하도록 변경했다.

| 항목 | 변경 내용 |
|---|---|
| 헤더 이름 | `X-Internal-Api-Key` |
| Express 설정 | `src/backend/database.js` 의 `fetchJson()` 이 모든 FastAPI 요청에 내부 헤더 자동 주입 |
| 예외 처리 | `routes/login.js` 의 중복체크 직접 fetch에도 내부 헤더 추가 |
| FastAPI 설정 | `src/python_api/app.py` 전역 미들웨어에서 헤더 검증 |
| 공개 예외 경로 | `/docs`, `/redoc`, `/openapi.json`, `/docs/oauth2-redirect`, `/favicon.ico` |

환경변수:

```env
# src/backend/.env
INTERNAL_API_KEY=긴_랜덤_공유_키

# src/python_api/.env
INTERNAL_API_KEY=같은_긴_랜덤_공유_키
```

결과:

- Express를 거치지 않은 FastAPI 직접 호출은 기본적으로 403 차단
- `PATCH /user/password/{user_id}` 같은 내부 전용 API의 외부 우회 위험 감소
- 설정 누락 시 FastAPI가 500으로 실패하여 잘못 열린 상태로 동작하지 않음

---

### 3. 완료/피드 생성 소유권 검증 강화

기존에는 Express가 세션에서 `user_id`를 주입하더라도, `routine_id`와 `completion_id`는 프론트 입력값이므로 FastAPI에서 한 번 더 검증할 필요가 있었다.

| 파일 | 변경 내용 |
|---|---|
| `src/python_api/routers/completion.py` | 완료 생성 전 `routine_id + user_id + deleted_at IS NULL` 검증 |
| `src/python_api/routers/feed.py` | 피드 생성 전 `completion_id + routine_id + user_id + deleted_at IS NULL` 검증 |

차단되는 케이스:

- 타인의 `routine_id`로 완료 기록 생성
- 타인의 `completion_id`로 피드 생성
- 서로 관계없는 루틴/완료 기록을 강제로 연결
- 이후 MyPage / Stats 통계가 잘못된 데이터로 오염되는 문제

---

### 4. 피드 업로드 실패 처리 개선

`fetch()`는 HTTP 400/500에서도 throw 하지 않기 때문에, 기존 `App.jsx`는 `POST /feed` 실패를 성공처럼 넘길 수 있었다.

변경:

- `src/frontend/App.jsx`
  - 피드 업로드 응답의 `res.ok`와 `data.success`를 모두 확인
  - 실패 시 catch로 보내고 사용자에게 "루틴 완료는 저장되었지만, 피드 업로드에 실패했습니다." 안내

결과:

- 완료 기록 저장과 피드 업로드의 부분 성공/실패 상태를 사용자에게 명확히 전달
- S3/FastAPI/DB 실패가 조용히 묻히는 문제 감소

---

### 5. MyPage 실제 데이터 API 연결

#### 5-1. 신규 API

| 계층 | 엔드포인트 | 역할 |
|---|---|---|
| Express | `GET /mypage` | 유저 정보 + summary + gallery 통합 조회 |
| Express | `GET /mypage/summary` | 마이페이지 핵심 지표 조회 |
| Express | `GET /mypage/gallery` | 내 인증 갤러리 조회 |
| FastAPI | `GET /mypage/{user_id}` | 유저 정보 + summary + gallery 통합 계산 |
| FastAPI | `GET /mypage/summary/{user_id}` | summary 단독 조회 |
| FastAPI | `GET /mypage/gallery/{user_id}` | gallery 단독 조회 |

#### 5-2. 프론트 변경

`src/frontend/MyPage.jsx`:

- 기존 `/me`, `/routine`, `/completion/history` 병렬 호출 구조 제거
- 기존 mock 달성률 / `continuousDays = 12` / Unsplash 갤러리 제거
- `GET /mypage?gallery_limit=9` 한 번으로 아래 데이터 조회
  - 유저 정보
  - 총 루틴 수
  - 오늘 통합 달성률
  - 현재 연속 달성일
  - 인증 게시글 수
  - 내 인증 갤러리 이미지/영상

#### 5-3. 계산 기준

| 지표 | 기준 |
|---|---|
| 총 루틴 수 | `routines.deleted_at IS NULL` |
| 오늘 달성률 | 오늘 완료한 distinct routine 수 / 활성 루틴 수 |
| 시간대별 달성률 | 해당 `time_slot` 활성 루틴 대비 오늘 완료 수 |
| 연속 달성 | 오늘부터 역순으로 "하루 1개 이상 완료"가 이어진 날짜 수 |
| 인증 게시글 수 | `feeds` 에서 현재 user_id가 작성한 게시글 수 |
| 갤러리 | `feeds` + `feed_images` 최신순 |

---

### 6. StatsPage 실제 데이터 API 연결

#### 6-1. 신규 API

| 계층 | 엔드포인트 | 역할 |
|---|---|---|
| Express | `GET /stats?mode=weekly\|monthly&start=YYYY-MM-DD&end=YYYY-MM-DD` | 현재 로그인 유저 기준 통계 조회 |
| FastAPI | `GET /stats/{user_id}` | 루틴/완료 기록 기반 통계 계산 |

#### 6-2. 프론트 변경

`src/frontend/StatsPage.jsx`:

- 고정 mock 데이터 제거
- 현재 주/월 범위를 실제 오늘 날짜 기준으로 계산
- 달력에서 선택한 범위를 `GET /stats` 쿼리로 전달
- 응답 기반으로 아래 영역 렌더링
  - 통합 달성률
  - 요일별/주차별 차트
  - 시간대별 루틴 달성률
  - 카테고리별 달성률
  - 최다 연속 달성일

#### 6-3. 계산 기준

현재 `repeat_cycle`은 `"매일"`, `"월, 수"` 같은 자유 문자열이므로, 이번 구현에서는 안전하게 **활성 루틴 전체 × 기간 일수**를 목표량으로 계산한다.

향후 더 정확한 예정 루틴 기준 달성률을 내려면:

- 반복 요일을 별도 테이블로 정규화하거나
- `repeat_cycle`을 JSON/ENUM 기반 구조로 바꾸고
- 통계 쿼리에서 해당 날짜의 예정 루틴만 denominator에 포함해야 한다.

---

### 7. 성능 개선

#### 7-1. 요청 시간 측정

| 계층 | 파일 | 동작 |
|---|---|---|
| Express | `src/backend/app.js` | `SLOW_REQUEST_MS` 이상 걸린 요청 로그 |
| FastAPI | `src/python_api/app.py` | `SLOW_REQUEST_MS` 이상 걸린 요청 로그 |
| MySQL | `src/python_api/database.py` | `SLOW_QUERY_MS` 이상 걸린 SQL 로그 |

기본값:

```env
SLOW_REQUEST_MS=500
SLOW_QUERY_MS=200
```

로그 예:

```text
🐢 [express] GET /stats 200 722.4ms
🐢 [fastapi] GET /stats/... 200 650.1ms
🐢 [slow-sql] 245.8ms SELECT ...
```

#### 7-2. FastAPI DB 커넥션 풀

`src/python_api/database.py`를 요청마다 새 연결 생성 방식에서 커넥션 풀 방식으로 변경했다.

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| 연결 방식 | 요청마다 `pymysql.connect()` | 앱 프로세스 내 커넥션 풀 재사용 |
| 라우터 코드 | `conn.close()`로 실제 종료 | `conn.close()` 호출 시 풀 반환 |
| 타임존 | 연결마다 `SET time_zone = '+09:00'` | 풀 커넥션 생성 시 동일 적용 |
| slow SQL | 없음 | `SLOW_QUERY_MS` 이상 로그 |

환경변수:

```env
DB_POOL_SIZE=8
DB_POOL_MAX_OVERFLOW=4
SLOW_QUERY_MS=200
```

장점:

- RDS 연결 생성/인증 비용 감소
- 동시 요청에서 연결 재사용
- 기존 라우터의 `try/finally conn.close()` 패턴 유지

#### 7-3. Stats 짧은 TTL 캐시

`src/backend/routes/stats.js`에 사용자/기간별 메모리 캐시를 추가했다.

| 항목 | 내용 |
|---|---|
| 캐시 키 | `user_id + mode + start + end` |
| 기본 TTL | `60000ms` |
| 목적 | 같은 기간 통계 재조회 시 Express → FastAPI → MySQL 왕복 감소 |
| 한계 | 완료/취소 직후 최대 TTL 만큼 통계 반영이 늦을 수 있음 |

환경변수:

```env
STATS_CACHE_TTL_MS=60000
```

#### 7-4. 마이페이지 API 왕복 감소

기존:

```text
MyPage.jsx
  ├─ GET /me
  ├─ GET /mypage/summary
  └─ GET /mypage/gallery
```

변경:

```text
MyPage.jsx
  └─ GET /mypage
       ├─ user
       ├─ summary
       └─ gallery
```

React → Express → FastAPI 왕복이 3회에서 1회로 줄어든다.

#### 7-5. 피드/갤러리 미디어 로딩 최적화

| 파일 | 변경 |
|---|---|
| `src/frontend/FeedPage.jsx` | 이미지 `loading="lazy"`, `decoding="async"`, 영상 `preload="metadata"` |
| `src/frontend/MyPage.jsx` | 갤러리 이미지 lazy/async, 영상 metadata preload |

원본 S3 이미지를 그대로 쓰는 구조는 유지하되, 목록 화면에서 불필요한 즉시 로딩을 줄였다.

---

### 8. 인덱스 권장 SQL 작성

실제 RDS에 바로 DDL을 실행하지 않고, 적용용 SQL 파일을 별도로 작성했다.

| 파일 | 역할 |
|---|---|
| `docs/performance-indexes-2026-05-10.sql` | `/feed`, `/completion/today`, `/mypage`, `/stats` 성능 개선용 인덱스 권장안 |

포함 인덱스:

- `routines(user_id, deleted_at, time_slot)`
- `routines(user_id, deleted_at, category)`
- `routine_completions(user_id, deleted_at, completed_at)`
- `routine_completions(user_id, routine_id, completed_at)`
- `feeds(user_id, created_at)`
- `feed_images(feed_id, created_at)`
- `feed_likes(feed_id, user_id)`
- `feed_comments(feed_id, created_at)`

주의:

- 실제 RDS 적용 전 `SHOW INDEX`로 중복 인덱스 확인 필요
- 데이터가 많은 테이블에서는 `CREATE INDEX` 중 쓰기 성능이 일시 저하될 수 있음
- 팀 검토 후 적용 권장

---

### 9. 환경변수 / 문서 변경

| 파일 | 변경 내용 |
|---|---|
| `src/backend/.env.example` | `INTERNAL_API_KEY`, `SLOW_REQUEST_MS`, `STATS_CACHE_TTL_MS` 추가 |
| `src/python_api/.env.example` | 신규 생성. DB 접속 정보, `INTERNAL_API_KEY`, DB 풀/slow log 설정 추가 |
| `README.md` | 환경 설정 섹션에 2026-05-10 보안/성능 env 안내 추가 |

---

### 10. 검증

이번 작업 후 실행한 검증:

- `python3 -m py_compile src/python_api/app.py src/python_api/database.py src/python_api/routers/*.py`
- `node --check src/backend/app.js`
- `node --check src/backend/database.js`
- `node --check src/backend/routes/stats.js`
- `npm run lint`
- `npm run build`
- `git diff --check`

결과:

- 빌드 / 문법 / diff whitespace 검증 통과
- `npm run lint` 에러 없음
- 기존 warning 2개는 유지
  - `.claude/worktrees/.../src/backend/app.js` unused eslint-disable
  - `src/frontend/HomePage.jsx` Object URL cleanup ref 경고

---

### 11. 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/backend/app.js` | slow request 로그 미들웨어, mypage/stats 라우터 등록 |
| `src/backend/database.js` | 내부 인증 헤더 주입, mypage/stats 브리지 함수 추가 |
| `src/backend/routes/login.js` | 중복체크 FastAPI 직접 fetch에도 내부 인증 헤더 추가 |
| `src/backend/routes/mypage.js` | 신규. `/mypage`, `/mypage/summary`, `/mypage/gallery` |
| `src/backend/routes/stats.js` | 신규. `/stats` + 짧은 TTL 메모리 캐시 |
| `src/frontend/App.jsx` | 피드 업로드 실패 응답 검증 |
| `src/frontend/MyPage.jsx` | mock 제거, `/mypage` 통합 API 연결, 실제 갤러리 표시 |
| `src/frontend/StatsPage.jsx` | mock 제거, `/stats` 실제 API 연결 |
| `src/frontend/FeedPage.jsx` | 이미지 lazy/async, 영상 metadata preload |
| `src/python_api/app.py` | 내부 인증 미들웨어, slow request 로그, mypage/stats 라우터 등록 |
| `src/python_api/database.py` | PyMySQL 커넥션 풀, slow SQL 로그 |
| `src/python_api/routers/completion.py` | 완료 생성 전 루틴 소유권 검증 |
| `src/python_api/routers/feed.py` | 피드 생성 전 completion/routine/user 관계 검증 |
| `src/python_api/routers/user.py` | password lazy migration 엔드포인트 보안 주석 갱신 |
| `src/python_api/routers/mypage.py` | 신규. 마이페이지 summary/gallery/overview 실제 데이터 |
| `src/python_api/routers/stats.py` | 신규. 주간/월간/시간대/카테고리 통계 |
| `src/python_api/.env.example` | 신규. Python API 환경변수 예시 |
| `docs/performance-indexes-2026-05-10.sql` | 신규. 성능 인덱스 권장 SQL |
| `README.md` | 2026-05-10 작업 내역 및 환경변수 안내 추가 |

---

## 🔧 2026-05-11 작업 내역

### 1. 이번 세션 개요

5/7 Docker 도입 후 첫 종합 코드 리뷰 세션. README + 백엔드(Express/FastAPI) + 프론트(React) + 인프라를 3축 분담 분석한 뒤, 가장 시급한 **P0 보안 이슈 — `src/python_api/.env` 가 GitHub 퍼블릭 리포에 추적되어 RDS admin 자격증명 노출** — 을 즉시 처리. README 잔여 부채 #9~#15 외에 **신규 부채 4건 (#16~#19)** 추가 식별.

| 결과물 | 내용 |
|---|---|
| 종합 리뷰 | 백엔드/프론트/인프라 3축 진단, 잘 된 부분과 개선 항목 분리 |
| **P0 발견 + 처리** | `.env` git 추적 제거 + `.env.example` 신설 + PR #1 → dev 머지 |
| 신규 부채 | #16 분산 트랜잭션 / #17 S3 URL 검증 / #18 라우터 트랜잭션 정합성 / #19 비번 정책 |
| 프론트 누수/race 3종 | IntersectionObserver cleanup / blob URL revoke / 댓글 모달 fetch race (모두 2026-05-11 완료) |

---

### 2. P0 — RDS admin 자격증명 GitHub 퍼블릭 노출

#### 2-1. 발견 경위

인프라 리뷰 중 `git ls-files | grep env` 결과에 `src/python_api/.env` 가 잡힘. 직접 검증:

| 검증 | 결과 |
|---|---|
| `https://github.com/junseoja/capston` 접근 | 200 OK (no auth) → **퍼블릭 확정** |
| `https://raw.githubusercontent.com/junseoja/capston/dev/src/python_api/.env` | 200 OK → **누구나 raw 다운로드 가능** |
| 노출 내용 | `DB_HOST=database-1.chysgoaw43v3.ap-northeast-2.rds.amazonaws.com`, `DB_USER=admin`, `DB_PASSWORD=...`, `DB_NAME=capston` |
| 첫 노출 커밋 | `57e11de` ("로그인/회원가입 기능 구현 및 AWS RDS 연결"), 이후 `76af630`/`5bd5a5d` 에서도 변경 |

#### 2-2. 근본 원인

`.gitignore` 에 `.env` / `*.env` 규칙은 존재했지만, 첫 커밋 시점에 이미 추적된 후 그대로 유지됨. **`.gitignore` 는 이미 추적 중인 파일에는 효력 없음**.

#### 2-3. 처리 내용

| 단계 | 작업 | 상태 |
|---|---|---|
| 1 | `git rm --cached src/python_api/.env` (디스크 파일은 보존 → FastAPI 정상 동작) | ✅ 완료 |
| 2 | `src/python_api/.env.example` 신규 작성 (backend 패턴과 일관) | ✅ 완료 |
| 3 | 워크트리 브랜치 → dev 로 PR #1 머지 (커밋 `37ee79b`) | ✅ 완료 |
| 4 | `dev` 시점부터 raw URL `.env` 접근 차단 검증 | ✅ 404 응답 확인 |
| 5 | git history 정리 (filter-repo + force push) | ❌ 미실시 (사용자 결정 — 신경 안 쓰는 범위로 판단) |
| 6 | AWS 콘솔에서 RDS admin 비번 회전 + 보안그룹 inbound IP 좁히기 | ⏳ 사용자 작업 영역 |

#### 2-4. 검증

- `git ls-tree origin/dev src/python_api/` → `.env` 없음, `.env.example` 만 존재
- `curl https://raw.githubusercontent.com/junseoja/capston/dev/src/python_api/.env` → **404**
- `curl https://raw.githubusercontent.com/junseoja/capston/dev/src/python_api/.env.example` → **200**

#### 2-5. 잔여 위험

git **history** 에는 여전히 `.env` 가 존재 — 예: `https://raw.githubusercontent.com/junseoja/capston/57e11de/src/python_api/.env` 같은 과거 커밋 SHA 직접 접근 시 노출. 자동 스캐너(GitGuardian, GitHub Secret Scanning) 가 이미 인덱싱했을 가능성도 있음. **운영 진입 전엔 별도 비번 회전 권장**.

---

### 3. 종합 코드 리뷰 결과

#### 3-1. 잘 되어 있는 부분 (유지)

| 항목 | 위치 |
|---|---|
| 에러 처리 표준화 | `database.js` `fetchJson` + `app.js` 글로벌 핸들러 + 라우터 `try/catch` |
| 세션 복원 | `requireAuth` 미들웨어 + `App.jsx` `/me` 자동 호출 |
| Lazy bcrypt migration | 평문 사용자 로그인 시 자연스럽게 해시화 (4/29 작업) |
| N+1 + 페이지네이션 | 단일 JOIN + `MAX(CASE WHEN)` + `IN` 쿼리 분리, tie-breaker `feed_id` 포함 (5/3 작업) |
| Docker 결정 | Dockerfile + compose.yml git 공유, named volume 격리 (5/7 작업) |
| README 변경 이력 | 시간순 누적 + 4단 분석 포맷 일관성 |

#### 3-2. 신규 발견 부채 — 4단 분석

##### 신규 #16. Express ↔ FastAPI 분산 트랜잭션 부재

| 구분 | 내용 |
|---|---|
| 기존 방식 | `src/backend/routes/feed.js` 의 `createFeed → addFeedImage` 다단 호출. 중간 실패 시 S3 cleanup 은 동작하지만 `feeds` 행은 orphan |
| 수정 후 방식 | FastAPI 에 `POST /feed/with-images` 신설 — 단일 트랜잭션으로 `feeds + feed_images` 일괄 INSERT, 실패 시 ROLLBACK. Express 는 한 번만 호출 |
| 기대 효과 | DB 정합성 보장, S3 cleanup 과 DB 상태 분리 해소, Express 코드 단순화 |
| 문제점 | FastAPI 페이로드 증가(이미지 URL 배열). 파일 크기/MIME 검증은 Express 단계 유지. 풀(#9) 도입 후 진행이 자연스러움 |

##### 신규 #17. S3 URL 검증이 호스트네임만 체크

| 구분 | 내용 |
|---|---|
| 기존 방식 | `extractS3Key()` 가 hostname 만 검사. 버킷명 정확 매칭 / `..` 시퀀스 차단 / key prefix 화이트리스트 모두 없음. 현재는 클라이언트가 `file_url` 을 보내지 않아 안전하지만 향후 변경 시 임의 객체 삭제 가능 |
| 수정 후 방식 | hostname `${AWS_S3_BUCKET}.s3.${REGION}.amazonaws.com` 정확 매칭 + `..` 시퀀스 reject + 추출 key 가 화이트리스트 prefix(`feed/`, `profile/`) 로 시작하는지 확인 |
| 기대 효과 | 향후 클라이언트 입력 경로 추가되어도 임의 객체 삭제 불가 |
| 문제점 | prefix 정책을 코드와 S3 IAM 양쪽에 일관성 있게 유지 필요 |

##### 신규 #18. 라우터별 트랜잭션 정합성 일괄 점검

| 구분 | 내용 |
|---|---|
| 기존 방식 | 5/2 에 `like.py` 만 rollback 패턴으로 정리됨. `feed.py` / `completion.py` / `user.py` 등 다른 라우터의 다단계 INSERT/UPDATE 가 같은 패턴인지 미점검 |
| 수정 후 방식 | 모든 라우터 `try/except/finally + conn.rollback()` 표준화. 풀 도입(#9) 작업과 묶어서 처리 |
| 기대 효과 | 1205 락 타임아웃 재발 방지, 풀 마이그레이션 시 깔끔 |
| 문제점 | 단순 작업이지만 모든 라우터에 손이 들어가므로 변경 폭 큼 — PR 분할 권장 |

##### 신규 #19. 회원가입 비밀번호 정책 부재

| 구분 | 내용 |
|---|---|
| 기존 방식 | Express 에서 bcrypt 해시화하지만 FastAPI 의 Pydantic 모델에 validator 없음 — 향후 평문 경로 추가 시 무방비 |
| 수정 후 방식 | Pydantic `field_validator` 로 `$2a$/$2b$` prefix + length 60 강제 |
| 기대 효과 | 운영 오류로 평문이 들어와도 INSERT 차단 |
| 문제점 | 정상 흐름엔 영향 없음. 단순 추가 작업 |

#### 3-3. 프론트엔드 누수/race 3종 ✅ 2026-05-11 완료 (#19)

원래 작은 PR 로 묶기 좋다고 분류했으나, 5/11 단일 세션에서 일괄 적용:

| 항목 | 파일 | 적용 내용 |
|---|---|---|
| ① IntersectionObserver 언마운트 cleanup 누락 | `src/frontend/FeedPage.jsx` | `useEffect(() => () => { observerRef.current?.disconnect(); abortRef.current?.abort(); }, [])` 추가. sentinelRef 콜백은 새 노드 attach 시에만 disconnect 하므로 라우팅 이동 시 observer 가 잔존하던 문제 차단 |
| ② `proofFiles` blob URL 누적 누수 | `src/frontend/HomePage.jsx` | `handleDetailSubmit` 성공 후 `selectedFiles.url` 일괄 `URL.revokeObjectURL` + `objectUrlsRef` 동시 정리. 기존엔 언마운트 전까지 누적되어 인증 반복 시 메모리 선형 증가 |
| ③ 댓글 모달 fetch race | `src/frontend/FeedPage.jsx` | `abortRef` 도입 → `openCommentModal` 진입 시 이전 페치 abort + 새 `AbortController.signal` 부착, `closeCommentModal` 도 abort. 응답 도착 직전 다른 모달로 전환되어도 stale 응답으로 덮어쓰는 일 없음. `AbortError` 는 정상 흐름이라 로그 제외 |

3건 모두 4항목 주석(오류번호 #19 / 날짜 / 기대효과 / 장점) 헤더 부여 완료.

#### 3-4. 600줄 이상 단일 컴포넌트 분할 권장

| 파일 | LOC | 분할 |
|---|---|---|
| `FeedPage.jsx` | 732 | `<FeedCard>`, `<MediaCarousel>`, `<CommentModal>` — 캐러셀이 피드/모달 양쪽 중복 → 추출만으로 200줄 감소 |
| `SignupPage.jsx` | 628 | `<FormField>`, `<DuplicateCheckField>` |
| `HomePage.jsx` | 575 | `<RoutineCard>`, `<ProofBox>` |

#### 3-5. Minor 정리 항목 (한 PR 로 묶기)

- `build-output.txt` 가 git 추적 중 → `git rm --cached` 후 `.gitignore` 추가
- `src/backend/package.json` 에 `dev`/`start` 스크립트 없음 (Docker 외 환경 불편)
- `src/backend/routes/login.js` 의 `/check-duplicate` 만 `fetchJson` 헬퍼 미사용 (다른 곳은 일관)
- 세션 만료가 절대시간 비교만 — 비활성 타임아웃(`last_activity` 갱신) 검토 (신규 #13 LRU 캐시와 함께)

---

### 4. 권장 처리 순서 (5/2 권장 + 5/11 신규 통합)

| 순서 | 항목 | 출처 |
|---|---|---|
| 1 | (P0 후속) AWS RDS admin 비번 회전 | 5/11 P0 잔여 |
| 2 | 신규 #18 라우터 트랜잭션 정합성 일괄 점검 | 5/11 신규 |
| 3 | README #9 / 신규 #9 — DB 커넥션 풀 + async 마이그레이션 | 5/2 권장 1번 |
| 4 | 신규 #16 분산 트랜잭션 / 신규 #17 S3 URL 검증 | 5/11 신규 |
| 5 | 프론트 누수 3종 + FeedPage 캐러셀 추출 | 5/11 신규 |
| 6 | README #12 → #13 → #14 → #15 → #11 (이미지 압축 → 세션 캐시 → 로깅 → Sentry → Rate limit) | 5/2 권장 |
| 7 | Minor 정리 PR (build-output.txt 외) | 5/11 신규 |

---

### 5. 변경 파일 목록 (2개)

| 파일 | 변경 |
|---|---|
| `src/python_api/.env` | 삭제 (git 추적에서만 — 디스크 보존, FastAPI 정상 동작) |
| `src/python_api/.env.example` | 신규 (DB_HOST/USER/PASSWORD/NAME/PORT 템플릿) |

PR #1 (커밋 `37ee79b`) → dev 머지 완료.

---

### 6. 신규 #18 라우터 트랜잭션 정합성 일괄 점검 — 같은 날 후속 처리

5/11 종합 리뷰에서 발견한 **신규 #18** 을 같은 세션 안에서 즉시 처리. 5/2 `like.py` 가 단독으로 적용했던 rollback 패턴을 나머지 7개 라우터에도 일괄 확장.

#### 6-1. 영향 범위

| 파일 | except 블록 수 | 비고 |
|---|---|---|
| `src/python_api/routers/feed.py` | 5 | `create_feed`/`get_feed_detail` 은 HTTPException 분기까지 포함 |
| `src/python_api/routers/completion.py` | 4 | `create_completion` HTTPException 분기 포함 |
| `src/python_api/routers/comment.py` | 3 | INSERT/SELECT/DELETE 1개씩 |
| `src/python_api/routers/user.py` | 8 | `signup` IntegrityError 특수 케이스 + 세션/Lazy migration UPDATE 포함 |
| `src/python_api/routers/routine.py` | 3 | INSERT/SELECT/Soft Delete UPDATE |
| `src/python_api/routers/mypage.py` | 3 | SELECT-only 지만 일관 패턴 적용 |
| `src/python_api/routers/stats.py` | 1 | SELECT-only 지만 일관 패턴 적용 |
| **합계** | **27** | (HTTPException 분기 포함) |

#### 6-2. 4단 분석

| 구분 | 내용 |
|---|---|
| 기존 방식 | `like.py` 만 `conn.rollback()` 패턴 적용. 다른 7개 라우터는 `except` 에서 바로 `print + raise` → 풀(2026-05-10 도입) 환경에서 미정리 트랜잭션이 그대로 풀에 반환되어 다음 요청에 오염 가능 |
| 수정 후 방식 | 모든 `except` 블록 (HTTPException / IntegrityError / Exception 분기) 에 `try: conn.rollback() except Exception: pass` + 짧은 `[수정 2026-05-11 #18]` 마커 주석. 파일 상단에는 4항목(오류번호/날짜/기대효과/장점) 헤더 블록 prepend |
| 기대 효과 | 풀 반환 시 깨끗한 트랜잭션 상태 보장. 5/2 `like.py` 1205 락 타임아웃 패턴이 다른 라우터에서 재발하지 않음. 신규 #16 분산 트랜잭션 도입 전 사전 정리 완료 |
| 문제점 | SELECT-only 라우터(`mypage.py`/`stats.py`/일부 GET)에는 사실상 no-op 이지만 일관 패턴을 위해 동일 적용 → 추후 INSERT/UPDATE 추가 시 자동 안전. PR 변경 폭이 크지만 로직 변경 제로 |

#### 6-3. 검증

- 7개 파일 모두 `python3 -m py_compile` 통과
- `like.py` 의 기존 패턴과 100% 동일한 형태로 통일 → 미래 리뷰어가 한 곳만 보면 됨
- 모든 `except` 마커에 `[수정 2026-05-11 #18]` prefix → grep 으로 일괄 확인/롤백 가능

#### 6-4. 주석 규칙 (앞으로 모든 코드 수정 적용)

이번 세션부터 모든 코드 수정에 다음 4항목 주석을 의무화:

- **오류 번호** — README/메모리의 부채 번호 (예: 신규 #18, README #9)
- **날짜** — 수정 일자 (YYYY-MM-DD 절대 표기)
- **기대효과** — 정합성/성능/보안 등 구체적 결과
- **장점** — 다른 방식 대비 이 방식의 이점

파일 단위에는 구분선 + 4항목 헤더 블록을, 한 줄 수정에는 짧은 마커 주석을 사용. 본 #18 작업이 첫 적용 사례.

---

### 7. 신규 #16/#17 분산 트랜잭션 + S3 URL 검증 — 같은 날 후속 처리

#18 작업 직후 같은 세션에서 신규 #16(데이터 정합성), 신규 #17(S3 검증 강화) 도 연달아 처리.

#### 7-1. 신규 #16 — Express ↔ FastAPI 분산 트랜잭션 통합

**기존 흐름 (다단 호출)**
```
Express POST /feed
  ├─ FastAPI POST /feed/        → feeds INSERT + commit
  └─ FastAPI POST /feed/image   ×N → 각 commit
       (중간 실패 시 feeds 행은 orphan, S3 cleanup 만 best-effort)
```

**신규 흐름 (단일 트랜잭션)**
```
Express POST /feed
  └─ FastAPI POST /feed/with-images
       └─ 단일 트랜잭션: feeds INSERT + feed_images INSERT × N → 한 번 commit
       └─ 어느 단계든 실패 → 모든 INSERT ROLLBACK + 503/500 반환
       └─ Express 가 받아서 S3 객체만 cleanup
```

| 구분 | 내용 |
|---|---|
| 기존 방식 | `createFeed` 호출로 commit → 각 `addFeedImage` 호출로 commit. 도중 실패 시 `feeds` 는 살고 `feed_images` 는 일부만 존재 → 화면에 본문만 있는 빈 피드 표시 |
| 수정 후 방식 | FastAPI `POST /feed/with-images` 신설. 동일 커넥션·동일 트랜잭션에서 모든 INSERT 후 단 한 번 `conn.commit()`. 실패 시 except 블록의 `conn.rollback()` 로 일괄 무효화. Express 는 `createFeedWithImages` 단일 호출로 단순화 |
| 기대 효과 | DB 정합성 보장, 정상 흐름 라운드트립 (1 + N) → 1 회로 축소, Express 분기 단순화 |
| 문제점 | FastAPI 페이로드가 이미지 URL 배열만큼 커짐(최대 10건/50MB→URL 만이라 무시할 수준). 기존 `POST /feed/`/`POST /feed/image` 두 엔드포인트는 호환을 위해 유지(향후 사용처 없으면 제거) |

**변경 파일 3개**
- `src/python_api/routers/feed.py` — `FeedWithImagesCreate` 스키마 + `POST /feed/with-images` 핸들러 신설 (소유권 검증 → feeds INSERT → feed_images N건 INSERT → 단일 commit)
- `src/backend/database.js` — `createFeedWithImages` 헬퍼 신설 + export
- `src/backend/routes/feed.js` — `POST /feed` 라우터 본문이 `createFeed → addFeedImage × N` 루프에서 `createFeedWithImages` 단일 호출로 교체

#### 7-2. 신규 #17 — `extractS3Key` 검증 강화

**대상**: `src/backend/routes/feed.js` `extractS3Key()` 함수

| 검증 항목 | 기존 | 수정 후 |
|---|---|---|
| hostname | `.amazonaws.com` suffix 만 체크 (다른 사람 버킷도 통과) | `${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com` 정확 매칭 |
| 환경변수 누락 | 무시 | `AWS_S3_BUCKET`/`AWS_REGION` 미설정 시 `null` (보수적 fail-closed) |
| Path traversal | 검사 없음 | key 에 `..` 또는 `\` 포함 시 `null` |
| Key prefix | 검사 없음 | `ALLOWED_S3_KEY_PREFIXES = ["feed/", "profile/"]` 외 시작은 `null` |
| 빈 key | 무시 | 빈 문자열은 `null` |

| 구분 | 내용 |
|---|---|
| 기존 방식 | `u.hostname.endsWith(".amazonaws.com")` 만 검사 — 임의 버킷·임의 객체 키 모두 통과. 현재는 클라이언트가 `file_url` 을 직접 보내지 않아 안전했지만, 향후 변경 시 임의 객체 삭제 가능 |
| 수정 후 방식 | hostname 정확 매칭 + `..` 시퀀스 reject + key prefix 화이트리스트 강제. 어느 하나라도 어긋나면 `null` 반환 → 호출자 cleanup 흐름은 그대로 (삭제 시도하지 않고 skip) |
| 기대 효과 | 향후 클라이언트 입력 경로가 추가되어도 임의 S3 객체 삭제 불가. 환경변수 누락 시도 fail-closed |
| 문제점 | 새 prefix(예: `avatar/`) 추가 시 화이트리스트도 함께 갱신 필요 — 코드 한 줄이라 부담 적음. IAM 정책과 별개 방어층이라 중복 보호 |

#### 7-3. 검증

- `python3 -m py_compile routers/feed.py` → OK
- `node --check routes/feed.js && node --check database.js` → OK
- 기존 `POST /feed/` / `POST /feed/image` / `GET /feed/` / `DELETE /feed/{feed_id}` 시그니처 변경 없음 → 다른 호출자 영향 없음
- `extractS3Key` 가 사용되는 유일한 호출 지점인 `DELETE /feed/:feed_id` 의 cleanup 루프는 그대로 — 화이트리스트 미스 시 자연스럽게 skip

---

### 8. 기타 — 웹뷰 앱화 단계 검토 (정보 공유)

캡스톤 최종 목표인 "웹을 웹뷰로 앱 데모" 를 위한 단계 정보 공유 (실제 작업은 미시작):

| Phase | 작업 | 비고 |
|---|---|---|
| 0 | P0 보안 이슈 처리 | (이번 세션에서 부분 처리) |
| 1 | 백엔드 운영 배포 + HTTPS | EC2/Render + Let's Encrypt 또는 ALB+ACM. **가장 큰 작업** |
| 2 | 프론트 정적 호스팅 | Vercel/Netlify 또는 S3+CloudFront |
| 3 | 백엔드 정책 변경 | CORS origin 배열, 쿠키 `secure: true` + `sameSite: 'none'`, HTTPS 강제 |
| 4 | Capacitor 도입 | `npx cap add android`, `webDir` 또는 `server.url` 결정 |
| 5 | 디바이스 권한 + 실기기 테스트 | AndroidManifest 권한, USB 디버깅, APK 산출 |

코드 변경 규모: 프론트 거의 없음 / Express 중간 / FastAPI 변경 없음 / 인프라 큼 / Capacitor 추가는 작음. 채택 옵션은 Capacitor + 백엔드 운영 배포 조합 권장 (캡스톤 데모용 가장 합리적).

---

## 🔧 2026-05-12 작업 내역

### 1. 이번 세션 개요

다른 브런치에 흩어진 UI 신기능을 dev 로 통합한 머지 세션. **두 개의 별개 머지**를 단계별로 진행:

| 머지 | 대상 브런치 | 신기능 | 커밋 수 |
|---|---|---|---|
| #1 | `frontend-cy` | 챌린지 페이지 (`/challenge`) | 1 |
| #2 | `frontend` (unrelated histories) | 관리자 페이지 + 신고/제재 시스템 + 갤러리 모달 | 7 (단계별) |

원칙: **dev 의 백엔드 연결 코드(EXPRESS_URL, fetch, /completion, /feed, /like, /comment 등)는 한 줄도 손대지 않음**. 다른 브런치의 UI 의도만 추출해서 dev 의 정규화된 데이터 구조에 맞춰 통합. 모든 변경 블록에 메모리 규칙(사유/기대효과/장점 4항목) 주석 부착.

| 결과물 | 내용 |
|---|---|
| 머지 #1 커밋 | `a586040` (frontend-cy → dev) |
| 머지 #2 커밋 | `9875b90` → `9989a0f` → `55a5d36` → `8b0bd29` → `c897022` → `d2bf751` → `4fc80bf` (7단계) |
| 총 변경량 | **+2,734 / −146** (거의 순수 추가, dev 백엔드 100% 보존) |
| 백업 브런치 | `dev-backup-before-frontend-cy-merge`, `dev-backup-before-frontend-merge` |

---

### 2. 머지 #1 — `frontend-cy` 챌린지 페이지

#### 2-1. 배경

`frontend-cy` 의 최신 커밋 `45d00d8` 에 `ChallengePage.jsx` 신규(906줄) + `App.css` 스타일 추가 + `App.jsx` 라우팅 추가가 묶여 있었음.

#### 2-2. 충돌과 안전 머지 전략

자동 `cherry-pick -n` 결과: `App.css` / `ChallengePage.jsx` 는 자동 머지 성공, **`App.jsx` 에서 충돌 1블록 (246줄 범위)** 발생. 자동 머지가 정상 완료된 부분도 +560/−311 줄로 큼 → dev 의 `completeDetailRoutine` / `cancelRoutineCompletion` / `handleLogout` 등 핵심 로직이 frontend-cy 의 옛 버전으로 덮일 위험 확인.

→ `App.jsx` 는 **dev HEAD 로 완전 복원** 후, ChallengePage 활성화에 꼭 필요한 **3가지만 수동 패치**:
1. `import ChallengePage from "./ChallengePage";`
2. 상단 네비게이션에 "챌린지" 버튼
3. `/challenge` Route 등록

`ChallengePage.jsx` 와 `App.css` 추가분(+650)은 그대로 적용. `README.md` 변경은 요청 범위 외라 제외.

#### 2-3. 검증

| 항목 | 결과 |
|---|---|
| 괄호 균형 (App.jsx) | open 362 = close 362 ✓ |
| dev 핵심 함수 보존 | `completeDetailRoutine` / `cancelRoutineCompletion` / `handleLogout` / `setRoutines` 호출 7곳 모두 유지 |
| ChallengePage default export | 존재 |

---

### 3. App.jsx 구조 분석 (코드 변경 없음)

머지 #1 직후 "App.jsx 수정이 너무 자주 일어난다"는 우려가 제기되어 현재 구조를 조사. 변경 없는 분석이지만, **향후 리팩터링 우선순위 결정용 기록**.

#### 3-1. 현재 구조 (총 616줄)

```
라인 1-46     파일 헤더 + import (8개 페이지 컴포넌트)
라인 48-66    전역 상태 4종: isLoggedIn, routines, currentUser, authChecked
라인 68-173   데이터 fetch 2종: fetchRoutines, fetchCurrentUser (useCallback)
라인 175-200  세션 부트스트랩 useEffect
라인 213-489  액션 핸들러 5종:
                handleLogin / completeCheckRoutine /
                completeDetailRoutine / cancelRoutineCompletion / handleLogout
라인 491-613  렌더링 (topbar + Routes 9개)
```

#### 3-2. 자주 수정되는 구조적 원인

1. **신규 페이지 추가 시 import + nav 버튼 + Route 3곳** 동시 수정 필요.
2. 데이터 주입 방식이 페이지마다 불일치:
   - HomePage: props 주입
   - RoutinePage: 콜백만 받고 자체 fetch
   - MyPage: App 모르게 내부에서 `/me`, `/routine` 직접 호출
   - FeedPage: currentUser props만
   → 단일 진실 공급원 의도가 깨진 상태.
3. 5개 액션 핸들러(약 277줄)가 App.jsx 안에 직접 박혀있어 백엔드 API 변경 영향 직격.
4. `setRoutines` 호출 7곳 → 루틴 모델 필드 변경 시 모든 핸들러 동시 수정.

#### 3-3. 권장 리팩터링 (별도 작업으로 보류)

| 리팩터링 | 효과 | 비고 |
|---|---|---|
| `src/frontend/api/` 모듈 분리 | App.jsx 약 200줄 감소 | 백엔드 API 변경 영향 격리 |
| `useRoutines()` 커스텀 훅 | routines 관련 코드 일괄 캡슐화 | 단일 진실 공급원 회복 |
| `<AuthContext>` 도입 | props drilling 해소 | MyPage/FeedPage props 단순화 |
| `navLinks` 배열 map | 신규 페이지 추가 수정 지점 3→1 | 자동화 |

---

### 4. 머지 #2 — `frontend` 7단계 선별 통합

#### 4-1. 배경

| 구분 | 내용 |
|---|---|
| 공통 조상 | **없음** (unrelated histories). 단순 merge 시 `--allow-unrelated-histories` 필요 |
| 경로 구조 | frontend: `src/*.jsx`, dev: `src/frontend/*.jsx` |
| 데이터 흐름 | frontend = mock UI, dev = 백엔드 API 연결 완료 |
| 사용자 지정 기준점 | `e79a5be` 이후 15개 커밋이 머지 대상 |
| frontend 측 백엔드 | **없음** (단방향 mock) → dev 백엔드 코드 머지 영향 0 |

#### 4-2. 머지 원칙 (전 단계 공통)

1. **dev 의 백엔드 호출은 한 줄도 손대지 않음**
2. **frontend 의 기능 의도만 추출** → dev 의 정규화 필드(`feed_id`, `routine_title`, `image_id`)에 맞춤 재구현
3. **dev 가 더 발전한 부분은 frontend 측을 가져오지 않음** (예: FeedPage 의 인스타 모달은 dev 가 이미 보유)
4. 모든 추가 블록에 메모리 규칙(사유/기대효과/장점) 4항목 주석
5. 각 단계마다 `esbuild --loader=jsx` 파서로 syntax 검증 후 단계별 커밋

#### 4-3. 단계별 커밋 (7개)

| 단계 | 커밋 | +/− | 신기능 |
|---|---|---|---|
| 1/7 | `9875b90` | +232 / 0 | `AdminPage.jsx` 컴포넌트 신규 (대시보드/신고처리/공지/지표 4메뉴) |
| 2/7 | `9989a0f` | +63 / −2 | FeedPage 게시물 신고 (카드+모달 🚩, 본인 게시물엔 미노출) |
| 3/7 | `55a5d36` | +123 / 0 | HomePage 관리자 제재 알림 중앙 모달 (큐 + localStorage 영속) |
| 4/7 | `8b0bd29` | +282 / −6 | MyPage 갤러리 상세 모달 + 편집 모드 + `DELETE /feed/:id` 일괄 삭제 |
| 5/7 | `c897022` | +127 / 0 | App.css 누락 클래스 6종 + 신고 버튼 스타일 2종 |
| 6/7 | `d2bf751` | +16 / −2 | LoginPage 관리자 role 신호 (id="admin" → `onLogin("ADMIN")`) |
| 7/7 | `4fc80bf` | +188 / −3 | App.jsx 라우팅/상태/핸들러 통합 (최종) |

#### 4-4. 단계별 핵심 결정

**단계 2 — FeedPage**
- dev FeedPage 는 이미 인스타 스타일 카드 / 댓글 모달 / 좋아요 / 멀티미디어 슬라이더 + 백엔드 API 연결까지 frontend 보다 발전.
- **frontend 의 유일한 미구현 신기능 = 게시물 신고** 만 선별 머지 (4지점: props + 핸들러 + 카드 버튼 + 모달 버튼).

**단계 4 — MyPage**
- frontend MyPage(595줄, mock) vs dev MyPage(334줄, 백엔드 연결) — 데이터 구조 자체가 다름.
- frontend 의 좋아요/댓글 모달은 mock 이라 무시 (FeedPage 가 이미 백엔드 모달 보유 → 책임 분리).
- **편집 모드 일괄 삭제**는 dev 백엔드의 `DELETE /feed/{feed_id}` API 가 이미 존재하므로 그대로 활용.
- `Promise.allSettled` 로 부분 성공 허용, Set 변환으로 중복 호출 방지.

**단계 5 — App.css**
- dev App.css(2467줄) 가 frontend App.css(1890줄) 보다 큼 → 대부분 흡수된 상태.
- 셀렉터 차집합 분석: frontend 에만 있는 클래스 6개는 모두 **dev JSX 가 참조하지만 dev CSS 에 정의가 빠져 있던 클래스** → 그것만 보충.
- frontend 의 `@media (max-width: 768px / 480px)` 는 dev 의 기존 `@media (1024 / 640 / 860 / 520px)` 와 브레이크포인트가 달라 충돌 위험 → 의도적으로 머지 제외.

**단계 6 — LoginPage**
- frontend 는 `if (id === "admin" && pw === "1234")` 하드코딩 → 보안 취약.
- dev 의 백엔드 `/login` 검증을 그대로 거치도록 두고, **로그인 성공 후에만** id 가 `admin` 인지로 role 판별 → DB 의 admin 계정+비밀번호가 일치해야만 통과.

#### 4-5. 완성된 데이터 폐쇄 루프

```
로그인(id=admin) ─► isAdmin=true ─► /admin 접근 허용
사용자 신고(🚩) ─► handleReportPost ─► reports 큐 누적
                                              │
                                              ▼
관리자 처리 ─► handleDeleteConfirm ─► DELETE /feed/:id (백엔드)
              ├► reports.status: pending → completed
              └► deleteNotifications 알림 추가 (localStorage 영속)
                                              │
                                              ▼
작성자 홈 진입 ─► 모달로 제재 사유 안내 ─► 확인 ─► 큐에서 제거
```

---

### 5. 변경 파일 목록 (이번 세션 전체, 8개)

| 파일 | +줄 | −줄 | 단계 |
|---|---|---|---|
| `src/css/App.css` | 905 | 133 | 머지 #1 자동 머지 + 단계 5 |
| `src/frontend/App.jsx` | 207 | 3 | 머지 #1 수동 패치 + 단계 7 |
| `src/frontend/ChallengePage.jsx` | 906 | 0 | 머지 #1 (신규) |
| `src/frontend/AdminPage.jsx` | 232 | 0 | 단계 1 (신규) |
| `src/frontend/MyPage.jsx` | 282 | 6 | 단계 4 |
| `src/frontend/HomePage.jsx` | 123 | 0 | 단계 3 |
| `src/frontend/FeedPage.jsx` | 63 | 2 | 단계 2 |
| `src/frontend/LoginPage.jsx` | 16 | 2 | 단계 6 |
| **합계** | **2,734** | **146** | |

---

### 6. 검증

| 항목 | 결과 |
|---|---|
| 수정된 6개 JSX 파일 syntax | `esbuild --loader=jsx` 전부 OK |
| App.css 중괄호 균형 | open 347 = close 347 (5단계 추가분 기준) |
| 신규 CSS 클래스 사용처 매칭 | 추가한 8개 클래스 모두 JSX `className` 에서 참조 중 확인 |
| dev 핵심 비즈니스 로직 보존 | `completeDetailRoutine` / `cancelRoutineCompletion` / `handleLogout` / `setRoutines` 호출 7곳 모두 유지 |
| 백업 브런치 보존 | `dev-backup-before-frontend-cy-merge`, `dev-backup-before-frontend-merge` |

---

### 7. 알려진 한계 / 다음 단계

1. **DB 에 admin 계정 필요** — 6단계의 관리자 분기 동작을 위해 `INSERT INTO users (login_id, password_hash, ...) VALUES ('admin', ...)` 별도 필요. 없으면 `/admin` 접근 불가.
2. **신고 데이터 `reports` 는 in-memory** — 새로고침/재로그인 시 사라짐. 백엔드 신고 API 추가 시 `handleReportPost` 안에서 fetch 호출만 추가하면 됨.
3. **프론트 반응형 정책 통일 필요** — frontend 의 `@media 768/480px` 는 의도적으로 머지 제외. dev 의 1024/640/860/520px 와 통일하는 별도 작업 권장.
4. **App.jsx 리팩터링** — 3-3 참고. 이번 세션에서는 분석만 하고 작업 보류.
5. **frontend 브런치는 origin 에 그대로 존재** — 정리하려면 머지 완료 확인 후 `git push origin --delete frontend` 가능. 다만 백업용으로 당분간 보존 권장.

---

## 🔧 2026-05-13 작업 내역

### 1. 이번 세션 개요

5/12 머지 작업 종료 후, 남은 미구현 항목들을 사용자 역량/캡스톤 데모 일정에 맞춰 **3단계 Phase 로 분류**한 작업 계획 수립 세션. 실제 코드 변경은 없고 **README 의 모든 오류·개선점 트래커를 시간순으로 재정렬 + Phase 별 실행 계획 표 추가**.

| 결과물 | 내용 |
|---|---|
| 트래커 정리 | 해결 27건 / 미해결 16건 / 5-12 부수 5건 = 총 48건 시각화 |
| 선택 6건 + 권장 추가 4건 = 총 10건 | 데모 안정성 우선 재정렬 |
| Phase 1 (반나절) | 5건 — 데모 직전 필수 (admin 계정, 브런치 정리, 루틴 버그, 비번 정책, RDS 회전) |
| Phase 2 (1~2일) | 3건 — 사용성/안정성 (반응형 통일, 이미지 압축, Sentry) |
| Phase 3 (3~5일) | 2건 — 코드 품질 (App.jsx 리팩터링, 컴포넌트 분할) |

---

### 2. Phase 1 — 데모 직전 필수 (반나절)

| # | 항목 | 무엇을 | 어떻게 | 영향 파일 | 위험/주의 | 예상 |
|---|---|---|---|---|---|---|
| 1.1 | **DB admin 계정 INSERT** | `users` 테이블에 `login_id='admin'` 계정 생성 | 회원가입 API 호출 (`POST /signup` with `id="admin"`) — 6단계 LoginPage 가 `id==="admin"` 으로 판별하므로 이게 가장 간단. bcrypt 해시는 백엔드가 처리 | DB 만 (코드 변경 0) | 비밀번호는 Phase 1.4 정책 통과해야 함 | 10분 |
| 1.2 | **frontend 브런치 정리** | 머지 완료된 원격 브런치 정리 | 3옵션 중 결정: (a) 그대로 보존 / (b) `archive/frontend-2026-05-12` 로 rename / (c) 삭제. **권장 (b)** | 원격 브런치만 | 로컬 백업 `dev-backup-before-frontend-merge` 는 보존 | 5분 |
| 1.3 | **루틴 추가 시 인증 표시 사라지는 버그** | 재현 → 원인 → 수정 | 1) 재현 시나리오 작성 2) `fetchRoutines` 응답에 `completed`/`completion_id` 필드 살아있는지 콘솔 검증 3) 추정: 새 루틴 추가 시 RoutinePage → `onRoutineChange()` → `fetchRoutines()` 가 completion 매핑 누락 가능 | `src/frontend/App.jsx` 의 `fetchRoutines`, 또는 `src/backend/routes/routine.js` JOIN | 백엔드 응답 구조 변경 시 다른 화면 영향 점검 | 1-2시간 |
| 1.4 | **회원가입 비번 정책** | Pydantic `field_validator` 로 강제 | `src/python_api/routers/user.py` 의 `SignupRequest` 모델에 추가: 최소 8자 + 영문+숫자 혼합 (또는 +특수문자). 프론트엔드 SignupPage 에 안내 문구 추가 | `src/python_api/routers/user.py`, `src/frontend/SignupPage.jsx` | 기존 계정은 영향 없음 (가입 시점만 검증) | 30분 |
| 1.5 | 🚨 **RDS 비번 회전** | AWS 콘솔에서 마스터 비번 변경 | 1) AWS RDS 콘솔 → 인스턴스 → "수정" → 새 마스터 비번 (16자+ 무작위) → "즉시 적용" 2) `src/python_api/.env` 의 `DB_PASSWORD` 갱신 3) FastAPI 재시작 4) `git status` 로 .env 추적 안 되는지 재확인 | `src/python_api/.env` (로컬만, git 비추적) | 재시작 동안 짧은 다운타임. 기존 비번 잠시 백업 권장 | 30분 |

---

### 3. Phase 2 — 사용성/안정성 (1~2일)

| # | 항목 | 무엇을 | 어떻게 | 영향 파일 | 위험/주의 | 예상 |
|---|---|---|---|---|---|---|
| 2.1 | **반응형 정책 통일** | 4종(1024/640/860/520) → 표준 3종(1024/768/480) | 1) 정책 결정 — 권장: `≥1024 데스크탑 / 768~1023 태블릿 / <768 모바일` 2) 기존 dev `@media` 4개를 새 브레이크포인트로 마이그레이션 3) 5/12 에 보류했던 frontend 의 768/480 콘텐츠도 통합 4) 시각 검증 (DevTools 디바이스 모드) | `src/css/App.css` 전체 미디어 쿼리 영역 | 시각 회귀 가능 → 주요 페이지 4종(Home/Feed/MyPage/Routine) × 모바일/태블릿/PC 12조합 스모크 테스트 | 1-2시간 |
| 2.2 | **피드 이미지 압축/썸네일** | 업로드 시 원본 + 썸네일 2장 저장, 카드는 썸네일 사용 | 1) `npm install sharp` 2) `src/backend/routes/feed.js` 업로드 미들웨어에서 sharp 로 `resize(1080) + webp(quality:80)` 원본, `resize(320) + webp` 썸네일 생성 후 S3 2장 업로드 3) `feed_images` 테이블에 `thumbnail_url` 컬럼 추가 4) 마이그레이션: 기존 row 는 `thumbnail_url IS NULL` → 프론트 폴백 로직 (`thumbnail_url ?? file_url`) | `src/backend/routes/feed.js`, `src/python_api/routers/feed.py` SELECT, `feed_images` 스키마, `FeedPage.jsx` 카드 렌더 | sharp 는 OS 의존성 있음(Docker 이미지에서 이미 지원). 기존 이미지 폴백 누락 시 깨짐 | 2-3시간 |
| 2.3 | **Sentry 도입** | 3축(프론트/Express/FastAPI) 에러 자동 보고 | 1) Sentry 계정/프로젝트 3개 생성 (React/Node/Python) — 무료 5K events/mo 2) DSN 발급 → 각 `.env` 에 `SENTRY_DSN_*` 추가 3) **프론트**: `npm i @sentry/react` + `main.jsx` 에서 `Sentry.init({dsn, integrations: [browserTracingIntegration()], tracesSampleRate: 0.1})` 4) **Express**: `npm i @sentry/node` + `app.js` 에 requestHandler/errorHandler 미들웨어 5) **FastAPI**: `pip install sentry-sdk` + `main.py` 에 `sentry_sdk.init` 6) 테스트: 각 축에서 의도 throw 로 dashboard 확인 | `src/frontend/main.jsx`, `src/backend/app.js`, `src/python_api/main.py`, 3개 `.env`, `requirements.txt`, 2개 `package.json` | DSN 을 git 에 커밋하지 않도록 주의. tracesSampleRate 너무 높으면 quota 빠르게 소진 | 1-2시간 |

---

### 4. Phase 3 — 코드 품질 (3~5일, 시간 되는 만큼)

| # | 항목 | 무엇을 | 어떻게 (단계별) | 영향 파일 | 위험/주의 | 예상 |
|---|---|---|---|---|---|---|
| 3.1 | **App.jsx 리팩터링** | 616줄 → ~300줄. 데이터 흐름을 api 모듈 / 훅 / Context 로 분리 | **단계 1**: `src/frontend/api/` 디렉터리 생성 → `auth.js`(login/me/logout) / `routine.js`(fetchRoutines) / `completion.js`(체크/상세/취소) / `feed.js` 로 fetch 분리. **단계 2**: `src/frontend/hooks/useRoutines.js` — routines 상태 + 5개 핸들러 캡슐화. **단계 3**: `src/frontend/contexts/AuthContext.jsx` — `isLoggedIn` / `currentUser` / `isAdmin` / `handleLogout` 을 context 로. HomePage/MyPage/FeedPage 의 currentUser props drilling 제거. **단계 4**: 검증 + 단계별 커밋 | `src/frontend/App.jsx`, 신규 `api/*.js`, `hooks/*.js`, `contexts/*.jsx`, props 받던 모든 페이지 | 회귀 위험 높음 → 단계별 커밋 + esbuild syntax 검증 + 수동 동작 테스트 필수. 5/12 머지처럼 4-7개 커밋으로 쪼개기 | 1-2일 |
| 3.2 | **600줄+ 컴포넌트 분할** | 거대 컴포넌트를 책임 단위로 쪼갬 | **FeedPage (804줄)** → `FeedCard.jsx` / `FeedModal.jsx` / `CommentList.jsx` / `CommentInput.jsx` / `MediaCarousel.jsx`. FeedPage 는 fetchFeeds + 무한스크롤 컨테이너로 슬림화. **HomePage** → `WeekCalendar.jsx` / `TimeTabs.jsx` / `RoutineList.jsx` / `ProofForm.jsx` / `AdminNotificationModal.jsx`. **SignupPage** → `PasswordPolicyHint.jsx` 분리 (Phase 1.4 정책 안내). **MyPage (621줄)** → `ProfileCard.jsx` / `StatCards.jsx` / `GalleryGrid.jsx` / `GalleryDetailModal.jsx`. **AdminPage (232줄)** → 이미 작아서 보류 | 위 4개 페이지 + 신규 컴포넌트 약 15개 | 분할 후 props drilling 증가 가능 → 3.1 의 AuthContext 와 함께 진행. 순서: **3.1 먼저, 3.2 나중** | 1-2일 |

---

### 5. 작업 진행 권장 순서

```
Day 1 오전:  1.1 → 1.4 → 1.2 → 1.5  (1.4 후 1.5 권장: 새 비번이 정책 통과해야 함)
Day 1 오후:  1.3 (재현/수정)
Day 2:       2.1 → 2.2
Day 3:       2.3 (Sentry)
Day 4~5:     3.1 (App.jsx 리팩터링 단계별)
Day 6~7:     3.2 (컴포넌트 분할, 3.1 의 Context 활용)
```

---

### 6. 검토 대기 결정 사항

| 결정 | 옵션 | 권장 |
|---|---|---|
| 1.2 frontend 브런치 | (a) 보존 / (b) archive rename / (c) 삭제 | (b) |
| 1.4 비번 정책 강도 | (A) 8자+영숫자 / (B) 8자+영숫자+특수 / (C) 10자+영숫자+특수+대문자 | (B) |
| 2.1 반응형 정책 | (1024/768/480 표준) / (dev 기존 4종 유지) | 표준 |
| 3.1 상태 관리 | Context API / Zustand 도입 | Context API |
| 2.3 Sentry 계정 | 본인 이메일로 무료 계정 생성 | 사용자 직접 |

---

## 🔧 2026-05-17 작업 내역

### 1. 이번 세션 개요

5/13 계획의 작업 순서(① DB 테이블 → ② 챌린지 FastAPI 구조 가이드 → ③ 관리자 페이지 백엔드)를 실제 구현. **관리자 페이지(공지사항·신고)를 mock → 실제 백엔드로 풀스택 연결**. 챌린지 백엔드는 담당 팀원 인계용 구조 가이드만 작성.

| 결과물 | 내용 |
|---|---|
| DB 테이블 | `docs/migrations-2026-05-13-admin-challenge.sql` (6개) RDS 적용 |
| 챌린지 가이드 | `routers/challenge.py` — 12 엔드포인트 구조 + TODO 주석 (팀원 구현용) |
| 공지/신고 백엔드 | FastAPI 2 + Express 2 라우터 + 미들웨어 + 헬퍼 — 풀스택 |
| 프론트 통합 | AdminPage / App.jsx 의 localStorage·in-memory mock 전부 제거 |
| 부수 처리 | 도커 핫리로드 복구 + `start.sh` 자동 셋업 + `feeds.deleted_at` 누락 수정 |

---

### 2. DB 테이블 (6개) + feeds 보강

- 5/13 작성한 `migrations-2026-05-13-admin-challenge.sql` 을 AWS RDS 에 실제 적용:
  challenges / challenge_participants / challenge_proofs / challenge_proof_files / notices / reports
- 규약: PK `CHAR(36)` UUID v7, KST, Soft Delete(`deleted_at`), 실제 FK
- **5/17 추가 발견·수정**: 5/1 Soft Delete 도입 시 `feeds` 만 누락되어 있었음.
  신고 제재(피드 Soft Delete)가 `feeds.deleted_at` 을 전제하므로
  `migrations-2026-05-17-feeds-soft-delete.sql` 로 `ALTER TABLE feeds ADD deleted_at` +
  `feed.py` 조회 2곳에 `WHERE deleted_at IS NULL` 필터 추가.

---

### 3. 챌린지 FastAPI 구조 가이드 (구현은 팀원)

`src/python_api/routers/challenge.py` — **실 구현 대신 청사진**:
- 12 엔드포인트 (CRUD 5 / 참여 3 / 인증 3 + my)
- 5 Pydantic 모델 + try/except/rollback/finally 골격 미리 작성
- 각 함수 docstring 에 SQL 예시 + 단계별 TODO 17개
- `raise HTTPException(501)` 로 미구현 표시 (Swagger 에 노출되어 팀원이 채워감)

---

### 4. 관리자 페이지 백엔드 풀스택 (공지 + 신고)

#### 4-1. FastAPI 라우터
- `routers/notice.py` (5) — 공지 CRUD. category ENUM 4종 사전검증, Soft Delete
- `routers/report.py` (4) — 신고 접수 / `GET /report` (feed_id 그룹 집계 + JSON_ARRAYAGG) /
  `PATCH /report/process` (**단일 트랜잭션**: pending 신고 일괄 completed + 피드 Soft Delete)
- `app.py` 에 2 라우터 등록

#### 4-2. Express 계층
- `middleware/requireAdmin.js` — `login_id === "admin"` 검증 (requireAuth 뒤 체이닝)
- `database.js` — FastAPI 호출 헬퍼 9개 추가 (createNotice~processReport)
- `routes/notice.js` (5) / `routes/report.js` (4) — 인증·검증 후 중계
  - 신규/변경 보안: `created_by`/`reporter_user_id`/`processed_by` 는 클라 값 무시,
    세션 `req.user.user_id` 주입 (위조 방지)
- `app.js` 에 2 라우터 등록

#### 4-3. 프론트 통합 (mock 완전 제거)
- `App.jsx`
  - `notices`: localStorage → `fetchNotices()` (GET /notice, 로그인 시 호출)
  - `handleReportPost`: in-memory → `POST /report` (`[분류] 상세` reason 분해)
  - `handleDeleteConfirm`: DELETE+메모리 → `PATCH /report/process` (단일 트랜잭션)
  - 백엔드 `notice_id/post_date` → 프론트 `id/date` 정규화 1곳에서 처리
- `AdminPage.jsx`
  - 공지 CRUD: `setNotices` 직접조작 → POST/PATCH/DELETE + `onNoticeChange()` 재조회
  - 신고: 자체 `GET /report?status=` fetch + reportTab 변경 시 재조회
  - 백엔드 그룹 집계 응답 → 기존 렌더 구조로 `mapReportRow` 변환

데이터 흐름(공지): AdminPage → POST /notice → FastAPI INSERT → onNoticeChange → App.fetchNotices → HomePage 모달/NoticeList/AdminPage 동시 갱신

---

### 5. 2026-05-17 추가 오류 수정 (신고·통계·루틴·공지)

관리자/신고 기능 연결 후 코드 리딩 과정에서 발견한 정합성·검증·라우팅 오류 5건을 추가 수정.

| 번호 | 파일 | 원인 | 수정 | 작동 원리 |
|---|---|---|---|---|
| 1 | `src/backend/routes/report.js`, `src/python_api/routers/report.py` | 신고 접수 시 `target_user_id` 를 클라이언트 body 에서 받아 저장해 실제 게시글 작성자와 어긋날 수 있었음 | Express 는 `feed_id/report_category/report_detail` 만 받고, FastAPI 가 `feed_id` 기준으로 `feeds.user_id` 를 직접 조회 | `reports.target_user_id` 는 요청자가 보낸 값이 아니라 DB 의 `feeds.user_id` 로 확정되어 위조·누락 방지 |
| 2 | `src/python_api/routers/stats.py` | `date.today()` 와 MySQL `CURDATE()` 가 서버/DB 타임존을 따라 KST 기준 통계와 어긋날 수 있었음 | `_kst_today()` helper 추가, 기본 주/월 범위와 latest streak 비교를 KST 로 통일. 최근 365일 조회도 Python 이 계산한 KST cutoff 전달 | FastAPI/DB 서버 타임존이 UTC 여도 사용자가 보는 “오늘/이번 주/이번 달”은 한국 시간 기준으로 계산 |
| 3 | `src/python_api/routers/routine.py` | `time_slot`, `routine_mode` 를 서버에서 검증하지 않아 잘못된 값이 DB ENUM 오류 또는 잘못된 데이터로 이어질 수 있었음 | `ALLOWED_TIME_SLOTS`, `ALLOWED_ROUTINE_MODES` 집합 검증 추가 | INSERT 전 400 응답으로 차단해 DB 제약은 마지막 방어선으로만 사용 |
| 4 | `src/frontend/NoticeDetail.jsx` | 목록 버튼은 `setPage("notice_list")` 를 호출하지만 `App.jsx` 라우터 어댑터는 `"notice"` 만 처리 | 버튼 pageKey 를 `setPage("notice")` 로 변경 | 클릭 시 App 의 adapter 가 `navigate("/notice")` 를 실행해 공지 목록으로 복귀 |
| 5 | `src/python_api/routers/report.py` | `AdminPage` 는 `admin_comment` 를 읽지만 `GET /report` 목록 SELECT 가 해당 컬럼을 반환하지 않음 | feed_id 그룹 집계 SELECT 에 `MAX(r.admin_comment) AS admin_comment` 추가 | 처리 완료 목록에서도 제재 사유가 응답에 포함되어 상세 모달 표시 가능 |

수정 주석 정책:
- 변경 지점마다 `2026-05-17` 날짜를 남김.
- 단순 변경 설명이 아니라 **원인 / 이유 / 작동원리**를 코드 주석에 분리해 기록.
- 관리자 권한을 `users.role` 로 전환하는 작업은 별도 6번 이슈로 남겨 두고 이번 수정 범위에서는 제외.

---

### 6. 부수 작업 (개발 환경)

| 문제 | 원인 | 해결 |
|---|---|---|
| 도커에서 코드 수정해도 반영 안 됨 → 매번 재빌드 | macOS 볼륨이 inotify 못 넘김. backend/python_api 에 polling 설정 누락 (frontend 만 있었음) | python_api `WATCHFILES_FORCE_POLLING=true`, backend `nodemon --legacy-watch`, package.json dev 스크립트(5/11 #Minor 부채 해소) |
| 도커 후 `./start.sh` 깨짐 | 호스트에 venv/node_modules 없음 | `start.sh` 가 없으면 자동 생성·설치(첫 1회) + node --watch 핫리로드 |
| `GET /report` 500 | `feeds.deleted_at` 컬럼 없음 (5/1 누락) | 2번 참고 — feeds Soft Delete 통일 |

---

### 7. Phase 1 마무리 (5/13 계획 — 데모 직전 필수)

| Phase | 항목 | 결과 |
|---|---|---|
| 1.1 | DB admin 계정 INSERT | ✅ 완료 |
| 1.2 | frontend 브런치 정리 | ⏭️ 스킵 결정 |
| 1.3 | 루틴 추가 시 인증 표시 사라지는 버그 | ✅ 클로즈 (D1 e2e 에서 재현 안 됨) |
| 1.4 | 회원가입 비밀번호 정책 (신규 #19) | ✅ `login.js` 백엔드 강제 추가 (강도 B: 8자+영문+숫자+특수). 프론트 `SignupPage.validatePassword` 는 이미 완비라 변경 0. FastAPI 는 password 가 해시라 검증 무의미 → Express 가 정확한 위치 |
| 1.5 | 🚨 RDS 비밀번호 회전 (5/11 P0 잔여) | ✅ AWS 콘솔 새 비번 → `.env` 갱신 → 재시작. 회전 직후 세션 500(`GET /user/session`) 발생 → DB 접속 동기화 문제로 진단·해결 |
| — | RDS 보안그룹 | 배포 대비 인바운드 MySQL 3306 `0.0.0.0/0` 추가 (강한 새 비번 전제 임시 개방, 데모 후 원복 권장) |

→ **Phase 1 전부 완료**. 배포 2대 선행조건(① D1 동작검증 ② 비번 회전) 충족.

---

### 8. 배포 준비 및 전략

#### 8-1. 코드 측 배포 준비 (환경변수만으로 로컬↔배포 전환)

| 파일 | 변경 |
|---|---|
| `src/backend/routes/login.js` | 세션 쿠키 `SESSION_COOKIE_OPTIONS` 공통 상수 — `NODE_ENV=production` 시 자동 `secure:true`+`sameSite:"none"` (크로스도메인 쿠키), 발급/제거 옵션 공유로 로그아웃 쿠키 미삭제 버그 예방 |
| `src/backend/app.js` | CORS 다중 origin — `FRONTEND_URL` 콤마 분리(배포+로컬 동시 테스트) |
| `.env.example` 3개 | 배포 변수 안내 + `NODE_ENV` 추가 |
| `docs/deploy.md` | Render/Vercel 배포 가이드 (흔한 실패 Top 3 포함) |
| `docs/cloudflared-tunnel.md` | Cloudflare Tunnel(Quick) 가이드 + Named 승격 절차 |

→ 코드 수정 없이 `.env` 값만 채우면 로컬/배포 전환. EC2·Render·cloudflared 어디든 동일 코드 사용.

#### 8-2. 배포 전략 결정

EC2(직접) / Render·Vercel(PaaS) / cloudflared(터널) 트레이드오프 비교 후 결정:

> **웹 먼저 (cloudflared) → 앱 (Capacitor 웹뷰)**
> - 1단계: 도메인 없이 **Quick Tunnel** 로 무료 글로벌 검증
> - 2단계: 검증 후 도메인 구매 → **Named Tunnel** (고정 주소 `godsanglog.com` 등)
> - 3단계: 앱은 Capacitor `server.url = 고정도메인` 으로 기존 React 그대로 웹뷰 앱화
> - 근거: 본인이 "유지보수 부담 최소 + 맥 24h 가동 가능" → 터널 방식이 최적.
>   FastAPI(8000)는 터널 비노출(Express 내부 호출만) → 보안 ↑

---

### 9. 검증 / 한계

- 전 파일 syntax OK (esbuild JSX 6 / Python 3 / Express 5)
- 2026-05-17 추가 오류 수정 검증:
  - `python3 -m py_compile src/python_api/routers/report.py src/python_api/routers/stats.py src/python_api/routers/routine.py`
  - `node --check src/backend/routes/report.js`
  - `npm run build`
  - `git diff --check`
- 로컬 `./start.sh` 정상, 공지·신고 흐름 1차 동작 확인 (정밀 테스트는 후속)
- 한계:
  - 챌린지 백엔드 미구현 (가이드만 — 팀원 담당)
  - 도커(`./start-docker.sh`) 재빌드 필요 상태 (정밀 검증 후속)
  - `deleteNotifications`(제재 알림) 는 여전히 localStorage mock (별도 항목)
  - 메트릭스/대시보드 통계는 하드코딩 유지 (별도 항목)

---

## ⚠️ 미구현 / 개선 필요 사항

- [x] ~~피드 기능 → 백엔드 연결 (현재 메모리에만 저장, 새로고침 시 초기화)~~ ✅ 2026-04-18 완료
- [x] ~~댓글 기능 → 현재 프론트 메모리 기준이며 댓글 API 연결 필요~~ ✅ 2026-04-18 완료
- [x] ~~피드 업로드 → 실제 백엔드 API(`/feed`)와 연결 필요~~ ✅ 2026-04-18 완료
- [x] ~~Express 라우트 try/catch 누락 (#1)~~ ✅ 2026-04-22 완료
- [x] ~~`database.js` 함수 에러 처리 없음 (#2)~~ ✅ 2026-04-22 완료
- [x] ~~글로벌 에러 핸들러 없음 (#3)~~ ✅ 2026-04-22 완료
- [x] ~~세션 인증 코드 반복 (#12)~~ ✅ 2026-04-22 완료
- [x] ~~타임존 이슈 (CURDATE vs KST) — #6~~ ✅ 2026-04-29 완료
- [x] ~~피드 업로드/삭제 시 파일 미정리 — #4~~ ✅ 2026-04-29 완료
- [x] ~~평문 비밀번호 폴백 로직 제거 — #7~~ ✅ 2026-04-29 완료 (Lazy Migration)
- [x] ~~`secure: false` 환경변수화 — #10~~ ✅ 2026-04-29 완료
- [x] ~~루틴 삭제 시 인증 피드/댓글/좋아요 함께 사라지는 문제~~ ✅ 2026-05-01 완료 (Soft Delete)
- [x] ~~GET /feed N+1 쿼리 + 페이지네이션 없음 — #5 (2026-05-02 분석: 신규 #10·#11)~~ ✅ 2026-05-03 완료 (단일 JOIN + cursor 페이지네이션 + 무한 스크롤)
- [x] ~~`like.py` rollback 누락 — #8~~ ✅ 2026-05-02 완료 (rollback + 단일 커넥션 패턴)
- [x] ~~FastAPI 직접 호출 방어 / 내부 공유 키 검증~~ ✅ 2026-05-10 완료 (`X-Internal-Api-Key`)
- [x] ~~완료/피드 생성 소유권 검증 강화~~ ✅ 2026-05-10 완료
- [x] ~~DB 커넥션 풀 도입 — #9 (2026-05-02 분석: 신규 #9)~~ ✅ 2026-05-10 완료
- [ ] Rate limiting 추가 — #11
- [ ] 피드 이미지 압축/썸네일 생성 — 2026-05-02 신규 #12
- [ ] 세션 검증 LRU 캐시 도입 — 2026-05-02 신규 #13
- [ ] 로깅 인프라 (pino + traceId) — 2026-05-02 신규 #14
- [ ] 에러 모니터링 (Sentry) — 2026-05-02 신규 #15
- [ ] 회원 탈퇴 엔드포인트 (Soft Delete 컬럼은 준비됨, login_id UNIQUE 정책 결정 필요)
- [ ] Soft Delete 영구 삭제 배치 (예: 30일 경과 시 실제 DELETE)
- [x] ~~마이페이지 → 이번 주 달성률, 인증 게시글 수 백엔드 연결~~ ✅ 2026-05-10 완료 (`/mypage`)
- [x] ~~상세 통계 페이지 mock 데이터 제거 및 실제 API 연결~~ ✅ 2026-05-10 완료 (`/stats`)
- [ ] 현재 루틴을 추가하면 인증한 루틴 표시가 사라지는 버그 확인 필요
- [x] ~~피드 이미지 → 현재 로컬 디스크 저장 방식, 추후 S3 등 클라우드 스토리지 전환 고려~~ ✅ 2026-05-05 완료 (multer-s3 도입)
- [x] ~~`src/python_api/.env` git 추적 제거 (RDS 자격증명 GitHub 퍼블릭 노출)~~ ✅ 2026-05-11 부분 완료 (git rm --cached + .env.example 신설, PR #1 머지). git history 정리·RDS 비번 회전은 별도 항목
- [ ] (P0 후속) AWS RDS admin 비번 회전 — 2026-05-11 잔여 (운영 진입 전 필수)
- [ ] git history 에서 과거 `.env` 영구 제거 (filter-repo + force push) — 2026-05-11 잔여 (사용자 결정)
- [x] ~~Express ↔ FastAPI 분산 트랜잭션 통합 (`POST /feed/with-images`) — 2026-05-11 신규 #16~~ ✅ 2026-05-11 완료 (단일 트랜잭션 INSERT + Express 단일 호출 전환)
- [x] ~~S3 URL 검증 강화 (버킷명 정확 매칭 / `..` 차단 / prefix 화이트리스트) — 2026-05-11 신규 #17~~ ✅ 2026-05-11 완료 (`extractS3Key` hostname 정확 매칭 + `..`/`\` reject + `feed/`/`profile/` 화이트리스트)
- [x] ~~라우터별 트랜잭션 정합성 일괄 점검 (`feed.py`/`completion.py`/`user.py` 등) — 2026-05-11 신규 #18~~ ✅ 2026-05-11 완료 (7개 라우터 26개 except 블록에 rollback 패턴 일괄 적용)
- [ ] 회원가입 비밀번호 정책 (Pydantic `field_validator`) — 2026-05-11 신규 #19
- [ ] 600줄+ 단일 컴포넌트 분할 (FeedPage / SignupPage / HomePage) — 2026-05-11 신규
- [x] ~~FeedPage IntersectionObserver 언마운트 cleanup — 2026-05-11 신규~~ ✅ 2026-05-11 완료 (`useEffect` cleanup 으로 `observerRef.disconnect()` 강제 호출 + `abortRef` 정리)
- [x] ~~HomePage `proofFiles` blob URL 재선택 시 revoke — 2026-05-11 신규~~ ✅ 2026-05-11 완료 (제출 성공 직후 `selectedFiles.url` 일괄 revoke + `objectUrlsRef` 동시 정리)
- [x] ~~FeedPage 댓글 모달 fetch race (`AbortController`) — 2026-05-11 신규~~ ✅ 2026-05-11 완료 (openCommentModal `signal` 부착 + closeCommentModal/언마운트 abort 일관 처리)
- [ ] `build-output.txt` git 추적 제거 — 2026-05-11 신규 (Minor)
- [ ] `src/backend/package.json` 에 `dev`/`start` 스크립트 추가 — 2026-05-11 신규 (Minor)
- [ ] `login.js` `/check-duplicate` 의 `fetchJson` 헬퍼 통일 — 2026-05-11 신규 (Minor)
- [ ] 세션 비활성 타임아웃 (`last_activity` 갱신) — 2026-05-11 신규 (#13 LRU 캐시와 함께)
---

## 👥 팀원

| 이름 | 역할 |
|---|---|
|  | Frontend |
|  | Backend |
