# Windows 팀원 PC를 호스팅 서버로 전환하는 안내문

목적: 기존에 맥에서 열던 `https://routimate.com` / `https://api.routimate.com` Cloudflare Tunnel 원점을 팀원 Windows PC로 옮긴다.

이 문서는 "팀원이 로컬에서 개발용으로 보는 방법"이 아니라, 팀원 PC가 실제 공개 호스트 역할을 하는 절차다.

---

## 0. 최종 구조

```txt
외부 사용자
  https://routimate.com
    -> Cloudflare Tunnel
    -> 팀원 Windows PC localhost:5173
    -> frontend 컨테이너

외부 사용자 브라우저의 API 요청
  https://api.routimate.com
    -> Cloudflare Tunnel
    -> 팀원 Windows PC localhost:3000
    -> Express 컨테이너
    -> FastAPI 컨테이너 http://python_api:8000
    -> AWS RDS MySQL
```

FastAPI `8000` 포트는 외부에 직접 공개하지 않는다. Express만 FastAPI를 내부 Docker 네트워크로 호출한다.

---

## 1. 먼저 기존 맥 호스트 중지

팀원 PC로 넘기기 전에 기존 맥에서 실행 중인 것을 끈다.

맥 터미널에서 `./server.sh`를 실행 중이었다면 해당 터미널에서 `Ctrl+C`를 누른다.

또는 맥에서 따로 켜 둔 `cloudflared tunnel run routimate`도 종료한다.

같은 Named Tunnel을 맥과 Windows에서 동시에 켜면 Cloudflare가 양쪽 connector로 트래픽을 보낼 수 있다. 그러면 어떤 요청은 맥으로, 어떤 요청은 Windows로 가서 원인 파악이 매우 어려워진다.

---

## 2. Windows 사전 설치

팀원 Windows PC에 설치한다.

- Git
- Docker Desktop
- cloudflared

Docker Desktop은 실행 상태여야 한다.

PowerShell에서 확인:

```powershell
git --version
docker --version
docker compose version
```

---

## 3. 프로젝트 받기

PowerShell에서:

```powershell
git clone https://github.com/junseoja/capston.git
cd capston
git checkout dev
git pull
```

이미 받은 저장소가 있으면:

```powershell
cd capston
git checkout dev
git pull
```

---

## 4. 환경변수 파일 3개 만들기

저장소에는 실제 `.env`가 올라가지 않는다. 아래 3개 파일을 만든다.

```powershell
copy .env.example .env
copy src\backend\.env.example src\backend\.env
copy src\python_api\.env.example src\python_api\.env
```

### 4-1. 루트 `.env`

호스팅 서버용이므로 로컬 API가 아니라 공개 API 도메인을 넣는다.

```env
VITE_EXPRESS_URL=https://api.routimate.com
```

이 값은 프론트 빌드 시점에 코드에 박힌다. 값을 바꾼 뒤에는 반드시 프론트 이미지를 다시 빌드해야 한다.

### 4-2. `src/backend/.env`

```env
PORT=3000
PYTHON_API=http://localhost:8000
INTERNAL_API_KEY=백엔드와_파이썬에서_같은_긴_랜덤값
FRONTEND_URL=https://routimate.com,http://localhost:5173
NODE_ENV=production

SLOW_REQUEST_MS=500
STATS_CACHE_TTL_MS=60000

AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=실제_S3_버킷명
AWS_ACCESS_KEY_ID=실제_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=실제_AWS_SECRET_ACCESS_KEY
```

주의:

- `NODE_ENV=production`이어야 HTTPS 크로스도메인 쿠키가 정상 동작한다.
- `FRONTEND_URL`에는 `https://routimate.com`이 반드시 들어가야 한다.
- Docker production compose에서는 Express가 FastAPI를 `http://python_api:8000`으로 호출하도록 덮어쓴다. 그래서 이 파일의 `PYTHON_API=http://localhost:8000`은 호스트 직접 실행용 기본값으로 남겨도 된다.

### 4-3. `src/python_api/.env`

```env
DB_HOST=실제_RDS_엔드포인트
DB_USER=admin
DB_PASSWORD=실제_DB_비밀번호
DB_NAME=capston
DB_PORT=13306

INTERNAL_API_KEY=백엔드와_파이썬에서_같은_긴_랜덤값

DB_POOL_SIZE=8
DB_POOL_MAX_OVERFLOW=4
SLOW_QUERY_MS=200
SLOW_REQUEST_MS=500
```

주의:

- `src/backend/.env`의 `INTERNAL_API_KEY`와 `src/python_api/.env`의 `INTERNAL_API_KEY`는 반드시 같아야 한다.
- RDS 포트가 프로젝트 기준 `13306`이면 그대로 `13306`을 사용한다.

---

## 5. Docker production 모드로 앱 실행

호스팅용은 개발 compose가 아니라 production compose를 사용한다.

```powershell
docker compose -f docker-compose.prod.yml up --build
```

정상이라면 팀원 PC에서 아래 주소가 열린다.

```txt
http://localhost:5173  # frontend
http://localhost:3000  # Express
http://localhost:8000  # FastAPI, 직접 공개용 아님
```

로그를 백그라운드로 돌리고 싶으면:

```powershell
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml logs -f
```

중지:

```powershell
docker compose -f docker-compose.prod.yml down
```

프론트 `.env`의 `VITE_EXPRESS_URL`을 바꿨다면 다시 빌드한다.

```powershell
docker compose -f docker-compose.prod.yml up --build
```

---

## 6. Cloudflare Tunnel 연결

권장 방식은 Cloudflare Dashboard에서 기존 `routimate` 터널에 Windows connector를 추가하는 방식이다.

### 6-1. 권장: tunnel token 방식

Cloudflare Dashboard에서:

1. Zero Trust / Cloudflare One Dashboard로 이동
2. `Networks` 또는 `Networking` -> `Tunnels`
3. 기존 `routimate` 터널 선택
4. `Add a replica` 또는 connector 추가 메뉴 선택
5. Windows용 설치 명령을 복사

팀원 Windows에서 관리자 권한 Command Prompt를 열고 실행한다.

```cmd
cloudflared.exe service install <TUNNEL_TOKEN>
```

테스트만 먼저 하고 싶으면 서비스 설치 대신 foreground 실행도 가능하다.

```cmd
cloudflared.exe tunnel run --token <TUNNEL_TOKEN>
```

토큰은 비밀번호처럼 취급한다. GitHub, 카카오톡 오픈방, 노션 공개 페이지 등에 올리지 않는다.

### 6-2. 대안: 기존 로컬 관리형 Named Tunnel credentials 복사

현재 맥의 `server.sh`는 이 방식에 가깝다.

맥에서 팀원에게 안전하게 전달해야 하는 것:

```txt
~/.cloudflared/config.yml
~/.cloudflared/<터널ID>.json
```

Windows에서는 예를 들어 아래 위치에 둔다.

```txt
C:\Users\<윈도우사용자>\.cloudflared\config.yml
C:\Users\<윈도우사용자>\.cloudflared\<터널ID>.json
```

Windows용 `config.yml` 예시:

```yaml
tunnel: <터널ID>
credentials-file: C:/Users/<윈도우사용자>/.cloudflared/<터널ID>.json

ingress:
  - hostname: routimate.com
    service: http://localhost:5173
  - hostname: api.routimate.com
    service: http://localhost:3000
  - service: http_status:404
```

실행:

```powershell
cloudflared tunnel --config "$env:USERPROFILE\.cloudflared\config.yml" run routimate
```

이 방식은 credentials JSON 파일 자체가 민감정보다. 가능하면 token 방식이 더 관리하기 쉽다.

---

## 7. Cloudflare 라우팅 확인

Cloudflare의 공개 hostname은 아래처럼 연결되어 있어야 한다.

```txt
routimate.com      -> http://localhost:5173
api.routimate.com  -> http://localhost:3000
```

FastAPI는 라우팅하지 않는다.

```txt
localhost:8000     -> 공개 라우팅 없음
```

---

## 8. 최종 검증 체크리스트

팀원 Windows PC에서:

```powershell
docker compose -f docker-compose.prod.yml ps
```

브라우저에서:

```txt
https://routimate.com
```

확인할 것:

- 로그인 화면이 뜬다.
- 회원가입 또는 로그인이 된다.
- 새로고침해도 로그인 상태가 유지된다.
- 피드/챌린지 이미지 업로드가 된다.
- 브라우저 개발자도구 Console에 CORS 에러가 없다.
- Network에서 API 요청이 `https://api.routimate.com`으로 간다.

---

## 9. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| `https://routimate.com` 접속 시 502 | Docker 앱이 안 떠 있음 | `docker compose -f docker-compose.prod.yml ps`, `logs -f` 확인 |
| 화면은 뜨는데 API 전부 실패 | 루트 `.env`의 `VITE_EXPRESS_URL`이 틀린 상태로 빌드됨 | `.env` 수정 후 `docker compose -f docker-compose.prod.yml up --build` |
| 로그인 후 새로고침하면 풀림 | `NODE_ENV=production` 누락 또는 HTTPS 도메인으로 접속하지 않음 | `src/backend/.env` 확인, `https://routimate.com`으로 테스트 |
| CORS 에러 | `FRONTEND_URL`에 `https://routimate.com` 없음 | `src/backend/.env` 수정 후 컨테이너 재시작 |
| DB 관련 API 실패 | RDS env 오타 또는 DB 포트 오타 | `src/python_api/.env`의 `DB_HOST`, `DB_PORT=13306`, 계정/비번 확인 |
| Express -> FastAPI 호출 실패 | `INTERNAL_API_KEY` 불일치 | backend/python_api 두 `.env` 값을 동일하게 수정 |
| 일부 요청이 예전 맥 서버로 가는 듯함 | 맥과 Windows에서 같은 터널 동시 실행 | 맥의 `cloudflared` 종료 후 Windows만 실행 |

---

## 10. 운영할 때 지켜야 할 것

- 팀원 Windows PC는 켜져 있어야 한다.
- Docker Desktop이 실행 중이어야 한다.
- `cloudflared` 서비스 또는 foreground 프로세스가 실행 중이어야 한다.
- 절전/잠자기 모드로 들어가면 사이트가 내려간다.
- `.env`, tunnel token, credentials JSON, AWS 키, DB 비밀번호는 GitHub에 올리지 않는다.

권장 운영 형태:

```txt
Docker Compose: background detached mode
cloudflared: Windows service
Windows 전원 설정: 절전 해제
```
