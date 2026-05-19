# 🚀 배포 가이드

이 문서는 **개발용 `docker-compose.yml` 이 아니라**, self-contained prod 이미지 기준으로
Routine Mate 를 검증·배포하는 절차를 정리한 문서다.

개발용 Docker는 bind mount와 hot reload를 위해 존재하고, 배포용 Docker는
코드까지 이미지에 포함해 다른 컴퓨터나 PaaS에서도 같은 결과를 재현하기 위해 존재한다.

---

## 0. 배포용 파일 구조

| 파일 | 역할 |
|---|---|
| `Dockerfile.frontend.prod` | React 정적 빌드 생성 + 정적 파일 서빙 |
| `Dockerfile.backend.prod` | Express production 이미지 |
| `Dockerfile.python_api.prod` | FastAPI production 이미지 |
| `docker-compose.prod.yml` | self-contained prod 이미지 로컬 검증용 |

> 개발용 파일(`Dockerfile.frontend`, `Dockerfile.backend`, `Dockerfile.python_api`, `docker-compose.yml`)은 그대로 유지한다.

---

## 1. 배포 전 필수 점검

### 1-1. 환경변수 파일 준비

필수 `.env` 파일 3개:

- 루트 `.env`
- `src/backend/.env`
- `src/python_api/.env`

각 파일은 반드시 `.env.example` 기반으로 만들고, 배포 플랫폼에도 같은 값을 등록한다.

### 1-2. RDS / S3 접근 확인

외부 의존성:

- AWS RDS MySQL
- AWS S3

따라서 prod 이미지는 떠도, 아래가 틀리면 실제 서비스는 실패한다.

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `INTERNAL_API_KEY`

### 1-3. 로컬 기능 검증 선행

배포 전에 최소 한 번은 아래를 로컬에서 확인한다.

- 회원가입 / 로그인 / 로그아웃
- 루틴 생성 / 완료 / 취소
- 피드 업로드
- 공지 / 신고 / 관리자 기능

---

## 2. Prod 이미지 로컬 검증

배포 전에 “이미지 자체가 독립적으로 뜨는지” 확인하는 단계다.

```bash
docker compose -f docker-compose.prod.yml up --build
```

검증 포인트:

- 프런트 이미지가 `dist/` 를 정상 생성하는지
- Express 이미지가 `app.js`, `routes/`, `middleware/` 를 포함한 채 기동하는지
- FastAPI 이미지가 `app.py`, `database.py`, `routers/` 를 포함한 채 기동하는지
- `backend -> python_api` 내부 호출이 `http://python_api:8000` 으로 정상 연결되는지

정리:

```bash
docker compose -f docker-compose.prod.yml down
```

> 이 흐름은 개발용 bind mount에 기대지 않기 때문에, “다른 컴퓨터/PaaS에서도 같은 이미지가 뜰 수 있는지”를 보는 가장 가까운 검증이다.

---

## 3. 서비스별 빌드 기준

### 3-1. Frontend

- Dockerfile: `Dockerfile.frontend.prod`
- Build context: 저장소 루트
- Build arg:
  - `VITE_EXPRESS_URL`

중요:

- `VITE_EXPRESS_URL` 은 **빌드 시점 변수**다.
- 잘못 넣으면 이미지는 떠도 브라우저가 잘못된 API 주소로 요청한다.

예시:

```bash
docker build \
  -f Dockerfile.frontend.prod \
  --build-arg VITE_EXPRESS_URL=https://api.example.com \
  .
```

### 3-2. Backend

- Dockerfile: `Dockerfile.backend.prod`
- Build context: `src/backend`
- Runtime env:
  - `PORT`
  - `PYTHON_API`
  - `INTERNAL_API_KEY`
  - `FRONTEND_URL`
  - `NODE_ENV`
  - AWS S3 변수 4종
  - 운영 로그/캐시 변수 (`SLOW_REQUEST_MS`, `STATS_CACHE_TTL_MS`)

중요:

- 실제 배포에서는 `NODE_ENV=production` 이어야 한다.
- 그래야 세션 쿠키가 `secure:true`, `sameSite:none` 정책으로 동작한다.

### 3-3. Python API

- Dockerfile: `Dockerfile.python_api.prod`
- Build context: `src/python_api`
- Runtime env:
  - `DB_HOST`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `DB_PORT`
  - `INTERNAL_API_KEY`
  - `DB_POOL_SIZE`
  - `DB_POOL_MAX_OVERFLOW`
  - `SLOW_QUERY_MS`
  - `SLOW_REQUEST_MS`

---

## 4. 실제 배포 시 권장 원칙

### 4-1. 개발용 compose를 배포에 쓰지 않는다

배포 환경에서는 아래 개발용 특성이 필요 없다.

- bind mount
- `vite dev`
- `nodemon --legacy-watch`
- `uvicorn --reload`

배포는 반드시 prod Dockerfile 기준으로 한다.

### 4-2. 프런트는 정적 빌드, 백엔드는 런타임 환경변수

- 프런트:
  - `VITE_EXPRESS_URL` 은 빌드 시점에 고정됨
- 백엔드 / FastAPI:
  - 환경변수는 런타임에 주입됨

따라서 API 도메인이 바뀌면 프런트 이미지는 다시 빌드해야 한다.

### 4-3. 서비스 분리는 이렇게 본다

- `frontend`: 브라우저에 정적 파일 제공
- `backend`: 공개 API, 세션 쿠키, CORS, S3 업로드
- `python_api`: 내부 데이터 계층, Express 뒤에만 존재

가능하면 `python_api` 는 외부에 직접 노출하지 않는 구성이 바람직하다.

---

## 5. 배포 후 체크리스트

브라우저와 서버 로그를 함께 보면서 아래를 점검한다.

```text
□ 프런트 첫 화면 정상 렌더링
□ 로그인 성공 후 Set-Cookie 발급
□ 새로고침 후 세션 유지
□ 루틴/완료/피드/댓글 API 정상 응답
□ 공지/신고/관리자 기능 정상 동작
□ CORS 오류 없음
□ backend -> python_api 내부 호출 403 없음 (INTERNAL_API_KEY 일치)
□ python_api -> RDS 연결 오류 없음
□ backend -> S3 업로드 오류 없음
```

---

## 6. 자주 막히는 지점

| 증상 | 원인 | 해결 |
|---|---|---|
| 프런트는 뜨는데 API 전부 실패 | `VITE_EXPRESS_URL` 잘못 빌드 | 프런트 이미지를 다시 빌드 |
| 로그인 후 새로고침하면 풀림 | `NODE_ENV=production` 누락 / HTTPS 미구성 | 백엔드 환경변수와 HTTPS 확인 |
| FastAPI 403 | `INTERNAL_API_KEY` 불일치 | `src/backend/.env` 와 `src/python_api/.env` 값 통일 |
| FastAPI 500 / DB 연결 실패 | RDS 보안그룹 또는 DB 자격증명 문제 | RDS 접근 허용 + 환경변수 재확인 |
| 피드 업로드 실패 | S3 자격증명/버킷 설정 오류 | 백엔드 AWS 변수 4종 재확인 |

---

## 7. 메모

- 일상 개발은 `docker-compose.yml`
- 배포 전 이미지 검증은 `docker-compose.prod.yml`
- 실제 배포는 `*.prod` Dockerfile 기준

즉, **dev와 prod를 분리해서 유지하되, prod 검증을 로컬에서도 먼저 할 수 있게 만든 구조**로 이해하면 된다.
