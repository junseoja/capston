---

## 🚀 서버 실행 방법

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
# 패키지 설치 (최초 1회만)
pip install -r requirements.txt
# 서버 실행
uvicorn app:app --reload --port 8000
'''

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

### 루틴
| 메서드 | URL | 설명 |
|---|---|---|
| GET | /routine | 루틴 목록 조회 |
| POST | /routine | 루틴 생성 |
| DELETE | /routine/:id | 루틴 삭제 |

---

## ✅ 구현 완료 기능

- [x] 회원가입 (유효성 검사, 중복체크)
- [x] 로그인 (쿠키 세션 방식)
- [x] 루틴 생성 / 조회 / 삭제
- [ ] 피드 기능
- [ ] 마이페이지
- [ ] 루틴 완료 체크

---



# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## 회원가입 시 중복체크를 할 수 있도록 임시 사용자 목록 상태 추가

  //회원가입 시 중복체크를 할 수 있도록 임시 사용자 목록 상태 추가
  const [users, setUsers] = useState([
    {
      id: 1,
      userId: "test123",
      password: "test123",
      nickname: "테스트",
      email: "demo@routine.com",
      gender: "female",
      birth: "2000-01-01",
    },
  ]);