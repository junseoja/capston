# 🏃 Routine Mate - 루틴 메이트

갓생을 위한 루틴 관리 서비스

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

## 📁 프로젝트 구조

```
capston-main/
├── start.sh                  # 전체 서버 한번에 실행
├── src/
│   ├── App.jsx               # 루트 컴포넌트 (라우팅 + 전역 상태 관리)
│   ├── main.jsx              # 앱 진입점 (BrowserRouter 포함)
│   ├── LoginPage.jsx         # 로그인 페이지
│   ├── SignupPage.jsx        # 회원가입 페이지
│   ├── HomePage.jsx          # 홈 페이지 (루틴 완료 체크)
│   ├── RoutinePage.jsx       # 루틴 관리 페이지 (CRUD)
│   ├── FeedPage.jsx          # 피드 페이지
│   ├── MyPage.jsx            # 마이페이지
│   │
│   ├── backend/              # Node.js Express 서버 (:3000)
│   │   ├── app.js
│   │   ├── database.js       # Express → FastAPI 연결 모듈
│   │   └── routes/
│   │       ├── login.js      # 인증 라우터 (로그인/회원가입/세션/중복체크)
│   │       ├── routine.js    # 루틴 CRUD 라우터
│   │       └── completion.js # 완료 이력 라우터
│   │
│   └── python_api/           # FastAPI 서버 (:8000)
│       ├── app.py
│       ├── database.py       # MySQL 커넥션 모듈
│       ├── requirements.txt
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

`src/python_api/.env` 파일 생성 후 아래 내용 입력

```
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=capston
DB_PORT=3306
```

> ⚠️ `.env` 파일은 git에 올라가지 않으므로 직접 생성해야 합니다.

---

## 🚀 서버 실행 방법

### 한번에 실행 (추천)

```bash
chmod +x start.sh  # 최초 1회만
./start.sh
```

### 개별 실행

**React 프론트엔드 (포트 5173)**
```bash
npm install
npm run dev
```

**Node.js Express 서버 (포트 3000)**
```bash
cd src/backend
npm install
node app.js
```

**Python FastAPI 서버 (포트 8000)**
```bash
cd src/python_api
python3 -m venv venv
source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

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
- [x] 마이페이지 유저 정보 및 루틴 수 표시
- [x] UUID v7 기반 PK (user_id, routine_id 등)
- [x] 피드 UI (인스타그램 스타일, 좋아요 토글)
- [x] 루틴 완료 기록 / 피드 / 좋아요 / 댓글 FastAPI 라우터 구현

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

## ⚠️ 미구현 / 개선 필요 사항

- [ ] 피드 기능 → 백엔드 연결 (현재 메모리에만 저장, 새로고침 시 초기화)
- [ ] 마이페이지 → 이번 주 달성률, 인증 게시글 수 API 연결
- [ ] 댓글 입력 UI 구현 및 댓글 API 연결
- [ ] 피드 업로드까지 실제 백엔드 API(`/feed`)와 연결

---

## 👥 팀원

| 이름 | 역할 |
|---|---|
|  | Frontend |
|  | Backend |
