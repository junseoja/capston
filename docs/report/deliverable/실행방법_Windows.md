# Routine Mate 실행 방법 (Windows 로컬 환경)

> 본 프로젝트는 **React(프론트) + Express(BFF) + FastAPI(API)** 3계층으로 구성되며,
> 데이터베이스(AWS RDS MySQL)와 파일 저장소(AWS S3)는 외부 인프라를 사용한다.
> 따라서 실행하려면 **DB·S3·내부 통신 키 등의 환경변수 값**이 필요하다(제출 시 별도 전달).

실행 방법은 두 가지다.
- **방법 A — Docker Desktop (권장)**: 명령 한 줄로 3개 서버를 한 번에 실행.
- **방법 B — 수동 실행**: Node.js·Python을 직접 설치하고 서버를 따로 실행.

---

## 1. 사전 준비물

| 방법 | 설치 항목 |
|------|-----------|
| 공통 | Git |
| 방법 A (Docker) | Docker Desktop (실행 중이어야 함) |
| 방법 B (수동) | Node.js 20 이상, Python 3.12 이상 |

PowerShell에서 설치 확인:

```powershell
git --version
docker --version            # 방법 A
docker compose version      # 방법 A
node --version              # 방법 B
python --version            # 방법 B
```

---

## 2. 소스 코드 내려받기

```powershell
git clone https://github.com/junseoja/capston.git
cd capston
git checkout dev
```

---

## 3. 환경변수 파일 3개 생성

저장소에는 실제 `.env`가 포함되어 있지 않으므로, 예시 파일을 복사해 만든다.

```powershell
copy .env.example .env
copy src\backend\.env.example src\backend\.env
copy src\python_api\.env.example src\python_api\.env
```

각 파일을 메모장으로 열어 아래 값을 채운다. (RDS·S3 자격증명과 `INTERNAL_API_KEY`는 팀에서 전달받은 실제 값 사용)

### 3-1. 루트 `.env` (프론트엔드)
```env
VITE_EXPRESS_URL=http://localhost:3000
```

### 3-2. `src\backend\.env` (Express)
```env
PORT=3000
PYTHON_API=http://localhost:8000
INTERNAL_API_KEY=백엔드와_파이썬에서_같은_긴_랜덤값
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=실제_S3_버킷명
AWS_ACCESS_KEY_ID=실제_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=실제_AWS_SECRET_ACCESS_KEY
```

### 3-3. `src\python_api\.env` (FastAPI / DB)
```env
DB_HOST=실제_RDS_엔드포인트
DB_USER=실제_DB_사용자
DB_PASSWORD=실제_DB_비밀번호
DB_NAME=capston
DB_PORT=13306

INTERNAL_API_KEY=백엔드와_파이썬에서_같은_긴_랜덤값
```

> ⚠️ `src\backend\.env`와 `src\python_api\.env`의 `INTERNAL_API_KEY`는 **반드시 동일한 값**이어야 한다.
> (Express가 FastAPI를 호출할 때 이 키로 내부 인증을 하기 때문)

---

## 4. 방법 A — Docker로 실행 (권장)

Docker Desktop이 실행 중인 상태에서, 프로젝트 루트(`capston`)에서:

```powershell
docker compose up --build
```

- 프론트 3계층(frontend·backend·python_api)이 한 번에 뜬다.
- 코드를 수정하면 자동 반영(핫 리로드)된다.
- 백그라운드 실행: `docker compose up --build -d` / 로그 보기: `docker compose logs -f`
- **종료**: `docker compose down`

> Docker 개발 구성은 컨테이너 간 통신(`PYTHON_API`)과 `FRONTEND_URL`을 자동으로 맞춰주므로,
> 위 `.env` 값만 채우면 별도 수정 없이 실행된다.

---

## 5. 방법 B — Docker 없이 수동 실행 (대안)

PowerShell 창 **3개**를 열어 각각 실행한다.

**① FastAPI (API 서버, 8000)**
```powershell
cd capston\src\python_api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

**② Express (백엔드, 3000)**
```powershell
cd capston\src\backend
npm install
npm start
```

**③ React (프론트, 5173)**
```powershell
cd capston
npm install
npm run dev
```

---

## 6. 접속 확인

브라우저에서:

```txt
http://localhost:5173      ← 실제 화면 (여기로 접속)
http://localhost:3000      ← Express (직접 접속용 아님)
http://localhost:8000/docs ← FastAPI 문서 (참고용)
```

`http://localhost:5173`에서 로그인 화면이 뜨고, 회원가입·로그인·루틴·피드가 동작하면 정상이다.

---

## 7. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|------|------|------|
| 화면은 뜨는데 로그인·피드 등 API가 전부 실패 | DB(RDS) 자격증명 오타 또는 미입력 | `src\python_api\.env`의 `DB_HOST/USER/PASSWORD/PORT` 확인 |
| Express → FastAPI 호출 실패(500) | 두 `.env`의 `INTERNAL_API_KEY` 불일치 | 두 값을 같은 문자열로 통일 |
| CORS 에러 | `FRONTEND_URL`에 `http://localhost:5173` 없음 | `src\backend\.env` 확인 후 재시작 |
| 이미지 업로드 실패 | S3 자격증명/버킷명 오류 | `src\backend\.env`의 `AWS_*` 확인 |
| `docker compose` 명령 인식 안 됨 | Docker Desktop 미실행 | Docker Desktop 실행 후 재시도 |
| 포트 충돌(5173/3000/8000 사용 중) | 다른 프로그램이 포트 점유 | 해당 프로그램 종료 또는 포트 변경 |

---

> **요약**: ① Git·Docker 설치 → ② 소스 clone(`dev` 브랜치) → ③ `.env` 3개 작성(팀 제공 값) → ④ `docker compose up --build` → ⑤ `http://localhost:5173` 접속.
