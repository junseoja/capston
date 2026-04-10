# 🏃 Routine Mate - 루틴 메이트

갓생을 위한 루틴 관리 서비스

---

## 🛠 기술 스택

### Frontend
- React (Vite)

### Backend
- Node.js (Express)
- Python (FastAPI)

### Database
- AWS RDS MySQL

---

## 📁 프로젝트 구조
capston-main/
├── start.sh                  # 전체 서버 한번에 실행
├── src/
│   ├── frontend/             # React 프론트엔드
│   │   └── src/
│   │       ├── App.jsx
│   │       ├── LoginPage.jsx
│   │       ├── SignupPage.jsx
│   │       ├── RoutinePage.jsx
│   │       ├── FeedPage.jsx
│   │       ├── HomePage.jsx
│   │       └── MyPage.jsx
│   │
│   ├── backend/              # Node.js Express 서버
│   │   ├── app.js
│   │   ├── database.js
│   │   └── routes/
│   │       ├── login.js
│   │       └── routine.js
│   │
│   └── python_api/           # FastAPI 서버
│       ├── app.py
│       ├── database.py
│       ├── requirements.txt
│       └── routers/
│           ├── user.py
│           └── routine.py

---

## ⚙️ 환경 설정

`src/python_api/.env` 파일 생성 후 아래 내용 입력
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=capston
DB_PORT=3306

> ⚠️ `.env` 파일은 git에 올라가지 않으므로 직접 생성해야 합니다.

---

## 🚀 서버 실행 방법

### 한번에 실행 (추천)

```bash
# 프로젝트 루트에서
chmod +x start.sh  # 최초 1회만
./start.sh
```

### 개별 실행

**React 프론트엔드 (포트 5173)**
```bash
cd src/frontend
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

# 가상환경 생성 (최초 1회만)
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# 패키지 설치 (최초 1회만)
pip install -r requirements.txt

# 서버 실행
uvicorn app:app --reload --port 8000
```

---

## 🗄 데이터베이스 테이블

### users
| 컬럼 | 타입 | 설명 |
|---|---|---|
| user_id | INT AUTO_INCREMENT | 기본키 |
| login_id | VARCHAR(255) | 로그인 아이디 |
| password | VARCHAR(255) | 비밀번호 |
| nickname | VARCHAR(255) | 닉네임 |
| birth_date | DATE | 생년월일 |
| gender | ENUM('남','여','기타') | 성별 |
| email | VARCHAR(255) | 이메일 |
| profile_img | TEXT | 프로필 이미지 |
| created_at | DATETIME | 가입일 |

### routines
| 컬럼 | 타입 | 설명 |
|---|---|---|
| routine_id | INT AUTO_INCREMENT | 기본키 |
| user_id | INT | 유저 FK |
| title | VARCHAR(255) | 루틴 제목 |
| category | VARCHAR(50) | 카테고리 |
| time_slot | ENUM | 아침/점심/저녁 |
| routine_mode | ENUM | 체크/상세 루틴 |
| goal | VARCHAR(255) | 목표 시간 |
| repeat_cycle | VARCHAR(255) | 반복 주기 |
| description | TEXT | 루틴 설명 |
| created_at | DATETIME | 생성일 |

---

## 📡 API 명세

### 인증
| 메서드 | URL | 설명 |
|---|---|---|
| POST | /signup | 회원가입 |
| POST | /login | 로그인 |
| GET | /me | 로그인 상태 확인 |
| POST | /logout | 로그아웃 |
| GET | /check-duplicate | 아이디/닉네임 중복체크 |

### 루틴
| 메서드 | URL | 설명 |
|---|---|---|
| GET | /routine | 루틴 목록 조회 |
| POST | /routine | 루틴 생성 |
| DELETE | /routine/:id | 루틴 삭제 |

---

## ✅ 구현 완료 기능

- [x] 회원가입 (유효성 검사, 중복체크, DB 저장)
- [x] 로그인 (쿠키 세션 방식)
- [x] 루틴 생성 / 조회 / 삭제
- [x] 루틴 반복 요일 선택
- [x] 루틴 시간 자동 분류 (아침/점심/저녁)
- [ ] 홈 루틴 완료 체크 백엔드 연결
- [ ] 피드 기능 백엔드 연결
- [ ] 마이페이지 백엔드 연결
- [ ] 댓글 및 하트 기능

---

## 👥 팀원

| 이름 | 역할 |
|---|---|
|  | Frontend |
|  | Backend |