# 🏃 Routine Mate - 루틴 메이트

갓생을 위한 루틴 관리 서비스

---

## 🛠 기술 스택

### Frontend
- React 19 (Vite)
- react-router-dom v7 (URL 기반 라우팅)

### Backend
- Node.js (Express) - 세션 관리 및 라우팅 허브
- Python (FastAPI) - 실제 DB CRUD 처리

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
│   │       ├── login.js      # 인증 라우터
│   │       └── routine.js    # 루틴 CRUD 라우터
│   │
│   └── python_api/           # FastAPI 서버 (:8000)
│       ├── app.py
│       ├── database.py       # MySQL 커넥션 모듈
│       ├── requirements.txt
│       └── routers/
│           ├── user.py       # 유저 API
│           └── routine.py    # 루틴 API
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

### users
| 컬럼 | 타입 | 설명 |
|---|---|---|
| user_id | VARCHAR(255) | 기본키 (UUID v7) |
| login_id | VARCHAR(255) | 로그인 아이디 (UNIQUE) |
| password | VARCHAR(255) | 비밀번호 (평문 저장 - 추후 bcrypt 적용 예정) |
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

### sessions (DB 저장 방식 준비 중)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| session_id | VARCHAR(255) | 세션 ID (UUID v4) |
| user_id | VARCHAR(255) | 유저 FK |

---

## 📡 API 명세

### Express (:3000) - 인증

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /signup | 회원가입 |
| POST | /login | 로그인 (세션 쿠키 발급) |
| GET | /me | 현재 로그인 유저 정보 조회 |
| POST | /logout | 로그아웃 |
| GET | /check-duplicate | 아이디/닉네임 중복체크 |

### Express (:3000) - 루틴

| 메서드 | URL | 설명 |
|---|---|---|
| GET | /routine | 내 루틴 목록 조회 |
| POST | /routine | 루틴 생성 |
| DELETE | /routine/:id | 루틴 삭제 |

### FastAPI (:8000) - 유저

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /user/signup | 유저 DB 저장 |
| GET | /user/{login_id} | 유저 조회 |
| POST | /user/session | 세션 DB 저장 (준비 중) |
| GET | /user/session/{session_id} | 세션 조회 (준비 중) |
| DELETE | /user/session/{session_id} | 세션 삭제 (준비 중) |
| GET | /user/check/login_id/{login_id} | 아이디 중복체크 |
| GET | /user/check/nickname/{nickname} | 닉네임 중복체크 |

### FastAPI (:8000) - 루틴

| 메서드 | URL | 설명 |
|---|---|---|
| POST | /routine/ | 루틴 생성 |
| GET | /routine/{user_id} | 유저 루틴 전체 조회 |
| DELETE | /routine/{routine_id} | 루틴 삭제 |

---

## 🏗 아키텍처 흐름

```
React (:5173)
    ↓ HTTP + 쿠키
Express (:3000)  ← 세션 관리 (메모리 Map)
    ↓ node-fetch
FastAPI (:8000)  ← 실제 DB 쿼리
    ↓ pymysql
AWS RDS MySQL
```

---

## ✅ 구현 완료 기능

- [x] 회원가입 (유효성 검사, 아이디 중복체크, DB 저장)
- [x] 로그인 (쿠키 세션 방식)
- [x] 로그아웃
- [x] 루틴 생성 / 조회 / 삭제
- [x] 루틴 반복 요일 선택
- [x] 루틴 시간 자동 분류 (아침/점심/저녁)
- [x] 마이페이지 유저 정보 및 루틴 수 표시
- [x] UUID v7 기반 PK (user_id, routine_id)

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

### 4. 전체 코드 주석 작성
- 프론트엔드 8개 파일, 백엔드 7개 파일 전체 한국어 주석 작성
- 각 함수/컴포넌트의 역할, props 구조, API 흐름, 미구현 사항 명시


## 🔧 2026-04-13 작업 내역

### 피드 화면 개선 (김찬엽)
- 피드 UI를 인스타그램 스타일에 가깝게 수정
- 닉네임, 루틴 제목, 카테고리, 인증 글, 사진/영상 순으로 게시물 구조 변경
- 게시물 하단에 좋아요/댓글 영역 추가
- 좋아요 클릭 시 하트 색상 변경 및 좋아요 수 반영 기능 추가

---

## ⚠️ 미구현 / 개선 필요 사항

- [ ] 홈 루틴 완료 체크 → 백엔드 저장 (현재 메모리에만 저장, 새로고침 시 초기화)
- [ ] 피드 기능 → 백엔드 연결 (현재 메모리에만 저장)
- [ ] 마이페이지 → 이번 주 달성률, 인증 게시글 수, 최근 활동 백엔드 연결
- [ ] 닉네임 중복체크 → Express에서 FastAPI `/user/check/nickname` 연결
- [ ] 세션 → Express 메모리 Map 대신 DB 저장 방식으로 전환 (FastAPI sessions API 준비 완료)
- [ ] 비밀번호 bcrypt 해싱 적용
- [ ] 댓글 및 하트 기능
- [ ] 현재 루틴을 추가하면 인증한 루틴에 대한 표시가 전부 사라지는 버그 발생
---

## 👥 팀원

| 이름 | 역할 |
|---|---|
|  | Frontend |
|  | Backend |
