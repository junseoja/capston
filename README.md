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

# React 프론트엔드 URL (CORS 허용 대상)
FRONTEND_URL=http://localhost:5173
```

### 3. Python FastAPI `.env`

```bash
cp src/python_api/.env.example src/python_api/.env   # .env.example이 없으면 직접 생성
```

```
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=capston
DB_PORT=3306
```

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

## 🗄 데이터베이스 테이블

### 전체 테이블 관계도

```
users
  ├── routines (1:N)
  │     └── routine_completions (1:N)
  │           └── feeds (1:1)
  │                 ├── feed_images (1:N)
  │                 ├── feed_likes (1:N)
  │                 └── feed_comments (1:N)
  └── feed_likes (1:N)
```

### users

| 컬럼 | 타입 | 설명 |
|---|---|---|
| user_id | VARCHAR(255) | 기본키 (UUID v7) |
| login_id | VARCHAR(255) | 로그인 아이디 (UNIQUE) |
| password | VARCHAR(255) | 비밀번호 (bcrypt 해시 저장) |
| nickname | VARCHAR(255) | 닉네임 |
| birth_date | DATE | 생년월일 |
| gender | ENUM('남','여','기타') | 성별 |
| email | VARCHAR(255) | 이메일 (UNIQUE) |
| profile_img | TEXT | 프로필 이미지 |
| created_at | DATETIME | 가입일 |

### routines

| 컬럼 | 타입 | 설명 |
|---|---|---|
| routine_id | VARCHAR(255) | 기본키 (UUID v7) |
| user_id | VARCHAR(255) | 유저 FK |
| title | VARCHAR(255) | 루틴 제목 |
| category | VARCHAR(50) | 카테고리 |
| time_slot | ENUM('morning','lunch','dinner') | 시간대 (목표 시간으로 자동 분류) |
| routine_mode | ENUM('check','detail') | 완료 방식 |
| goal | VARCHAR(255) | 목표 시간 (예: "07:30") |
| repeat_cycle | VARCHAR(255) | 반복 주기 (예: "매일", "월, 수, 금") |
| description | TEXT | 루틴 설명 |
| created_at | DATETIME | 생성일 |

### sessions

| 컬럼 | 타입 | 설명 |
|---|---|---|
| session_id | VARCHAR(255) | 세션 ID (UUID v4) |
| user_id | VARCHAR(255) | 유저 FK |
| expires_at | DATETIME | 세션 만료 시간 (로그인 시점 + 1일) |

### routine_completions

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| completion_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| routine_id | CHAR(36) | NO | FK | — | 루틴 외래키 |
| user_id | CHAR(36) | NO | FK | — | 유저 외래키 |
| completed_at | DATETIME | YES | — | CURRENT_TIMESTAMP | 완료 시간 |
| proof_text | TEXT | YES | — | NULL | 상세 루틴 인증 글 |

### feeds

| 컬럼 | 타입 | NULL | KEY | 기본값 | 설명 |
|---|---|---|---|---|---|
| feed_id | CHAR(36) | NO | PRI | — | UUID v7 기본키 |
| user_id | CHAR(36) | NO | FK | — | 유저 외래키 |
| routine_id | CHAR(36) | NO | FK | — | 루틴 외래키 |
| completion_id | CHAR(36) | NO | FK | — | 완료기록 외래키 |
| content | TEXT | YES | — | NULL | 인증 글 내용 |
| created_at | DATETIME | YES | — | CURRENT_TIMESTAMP | 작성 시간 |

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

### 🔗 외래키 관계

```
users ──────────────────────────────────┐
  │                                     │
  ├── routines                          │
  │     └── routine_completions ────────┤
  │               └── feeds ────────────┤
  │                     ├── feed_images │
  │                     ├── feed_likes ─┤
  │                     └── feed_comments
```

### ⚠️ 삭제 정책 (ON DELETE CASCADE)

| 삭제 대상 | 연쇄 삭제 범위 |
|---|---|
| users 삭제 | 관련 모든 데이터 자동 삭제 |
| routines 삭제 | completions, feeds 자동 삭제 |
| feeds 삭제 | images, likes, comments 자동 삭제 |

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

## ⚠️ 미구현 / 개선 필요 사항

- [x] ~~피드 기능 → 백엔드 연결 (현재 메모리에만 저장, 새로고침 시 초기화)~~ ✅ 2026-04-18 완료
- [x] ~~댓글 기능 → 현재 프론트 메모리 기준이며 댓글 API 연결 필요~~ ✅ 2026-04-18 완료
- [x] ~~피드 업로드 → 실제 백엔드 API(`/feed`)와 연결 필요~~ ✅ 2026-04-18 완료
- [x] ~~Express 라우트 try/catch 누락 (#1)~~ ✅ 2026-04-22 완료
- [x] ~~`database.js` 함수 에러 처리 없음 (#2)~~ ✅ 2026-04-22 완료
- [x] ~~글로벌 에러 핸들러 없음 (#3)~~ ✅ 2026-04-22 완료
- [x] ~~세션 인증 코드 반복 (#12)~~ ✅ 2026-04-22 완료
- [ ] 타임존 이슈 (CURDATE vs KST) — #6
- [ ] 피드 업로드/삭제 시 파일 미정리 — #4
- [ ] GET /feed N+1 쿼리 + 페이지네이션 없음 — #5
- [ ] 평문 비밀번호 폴백 로직 제거 — #7
- [ ] `like.py` rollback 누락 — #8
- [ ] DB 커넥션 풀 도입 — #9
- [ ] `secure: false` 환경변수화 — #10
- [ ] Rate limiting 추가 — #11
- [ ] 마이페이지 → 이번 주 달성률, 인증 게시글 수 백엔드 연결
- [ ] 현재 루틴을 추가하면 인증한 루틴 표시가 사라지는 버그 확인 필요
- [ ] 피드 이미지 → 현재 로컬 디스크 저장 방식, 추후 S3 등 클라우드 스토리지 전환 고려
---

## 👥 팀원

| 이름 | 역할 |
|---|---|
|  | Frontend |
|  | Backend |
