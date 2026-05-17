# 🚀 배포 가이드 (2026-05-17 작성)

로컬 전용이던 Routine Mate 를 인터넷 주소로 접속 가능하게 배포하는 절차.

> 캡스톤 데모 기준 **가장 빠른 경로** (EC2 수동 세팅 대신 PaaS).
> 디펜스 일정(~5/27) 안에 끝내려면 이 가이드대로 D5~7 에 진행 권장.

---

## 0. 배포 아키텍처

```
브라우저
  │  https
  ▼
[Vercel]  프론트(React/Vite)            ── my-app.vercel.app
  │  https + credentials(쿠키)
  ▼
[Render]  백엔드(Express + FastAPI)     ── routine-mate-api.onrender.com
  │  (컨테이너 내부 통신)
  ▼
[AWS RDS] MySQL  (기존 유지, 보안그룹만 수정)
```

| 부분 | 플랫폼 | 비용 |
|---|---|---|
| 프론트 | Vercel | 무료 |
| 백엔드 | Render (또는 Railway) | 무료 티어 |
| DB | 기존 AWS RDS | 기존 |

---

## 1. ⚠️ 배포 전 필수 선행 (이거 안 하면 사고)

### 1-1. 🚨 RDS 비밀번호 회전 (Phase 1.5) — 절대 필수

`src/python_api/.env` 의 DB 비번은 **2026-05-11 GitHub 에 공개 노출된 이력**이 있음.
그 상태로 글로벌 배포 = 전 세계가 DB 접근 가능.

1. AWS RDS 콘솔 → 인스턴스 → "수정" → 새 마스터 비밀번호(16자+ 무작위) → "즉시 적용"
2. `src/python_api/.env` 의 `DB_PASSWORD` 갱신
3. 배포 플랫폼 환경변수에도 새 비번 반영
4. `git status` 로 `.env` 가 추적 안 되는지 재확인

### 1-2. 핵심 흐름 로컬 검증 완료 확인

배포 환경은 로그 보기가 더 어렵다. **로컬(`./start.sh`)에서 로그인→공지→신고→제재→챌린지가
다 동작하는 것**을 먼저 확인한 뒤 배포할 것. (안 되는 걸 올리면 인터넷에서 디버깅하게 됨)

---

## 2. AWS RDS 보안그룹 수정

배포 백엔드(Render)가 RDS 에 접속하려면 RDS 가 그 IP 를 허용해야 함.

1. AWS EC2 콘솔 → 보안 그룹 → RDS 가 쓰는 보안그룹 선택
2. 인바운드 규칙 → MySQL/Aurora(3306) →
   - Render 는 고정 IP 가 없을 수 있음 → 우선 `0.0.0.0/0`(전체 허용)으로 데모 진행 후,
     디펜스 끝나면 제거하거나 Render 의 Static Outbound IP(유료) 사용 검토
   - ⚠️ `0.0.0.0/0` + 강한 비번(1-1) 조합으로만 임시 허용. 데모 후 원복 권장.

> RDS 엔드포인트(`DB_HOST`)는 **안 바뀐다**. 보안그룹만 수정.

---

## 3. 백엔드 배포 (Render)

> Express + FastAPI 2개 서비스. `docker-compose.yml` 이 있으므로 두 가지 방법:
> (A) Render 에 docker-compose 그대로 / (B) 서비스 2개 따로 생성.
> Render 무료 티어는 compose 미지원일 수 있어 **(B) 서비스 2개 따로** 가 안전.

### 3-1. FastAPI 서비스
1. Render → New → Web Service → GitHub 저장소 연결
2. Root Directory: `src/python_api`
3. Dockerfile: `Dockerfile.python_api` (또는 Environment: Docker)
4. 환경변수 (Render Environment):
   - `DB_HOST` `DB_USER` `DB_PASSWORD`(새 비번) `DB_NAME` `DB_PORT`
   - `INTERNAL_API_KEY` (긴 랜덤 — Express 와 동일값)
5. 배포 후 내부 URL 확인 (예: `routine-mate-fastapi.onrender.com`)

### 3-2. Express 서비스
1. Render → New → Web Service → 같은 저장소
2. Root Directory: `src/backend`
3. Dockerfile: `Dockerfile.backend`
4. 환경변수:
   - `PORT` (Render 가 주는 포트 사용 — 보통 자동)
   - `PYTHON_API=https://<3-1 에서 만든 FastAPI 도메인>`
   - `INTERNAL_API_KEY` (3-1 과 동일값)
   - `FRONTEND_URL=https://<4 에서 만들 Vercel 도메인>,http://localhost:5173`
     (콤마로 로컬도 같이 — 배포 후 로컬 테스트 가능)
   - **`NODE_ENV=production`** ← 이게 없으면 쿠키 sameSite 가 lax 라 로그인 실패
   - AWS S3 변수 4종 (`AWS_REGION` 등)
5. 배포 후 도메인 확인 (예: `routine-mate-api.onrender.com`)

---

## 4. 프론트 배포 (Vercel)

1. Vercel → New Project → GitHub 저장소 연결
2. Framework Preset: Vite
3. 환경변수 (Vercel Environment Variables):
   - `VITE_EXPRESS_URL=https://<3-2 Express 도메인>`
   - ⚠️ Vite 는 **빌드 시점**에 박으므로 반드시 배포 전에 등록
4. Deploy → 도메인 확인 (예: `routine-mate.vercel.app`)
5. 이 도메인을 3-2 의 `FRONTEND_URL` 에 반영했는지 재확인 (CORS)

---

## 5. 배포 후 점검 (D8 테스트)

브라우저에서 Vercel 도메인 접속 후, 개발자도구(F12) Network 탭 보며:

```
□ 회원가입 → 비번 정책(8자+영숫자특수) 거부/통과 정상?
□ 로그인 → Network 에서 Set-Cookie 응답 + 이후 요청에 Cookie 동봉?
   (안 되면: NODE_ENV=production 확인 / sameSite none / HTTPS 확인)
□ 새로고침 후에도 로그인 유지? (세션 쿠키 정상)
□ 공지 작성(admin) → 다른 브라우저/시크릿에서 공지 모달 뜸?
□ 피드 🚩 신고 → admin 신고 목록에 뜸 → 제재 → 피드 사라짐?
□ CORS 에러 콘솔에 없나? (있으면 FRONTEND_URL 오타/누락)
```

### 가장 흔한 배포 실패 Top 3

| 증상 | 원인 | 해결 |
|---|---|---|
| 로그인 되는데 새로고침하면 풀림 | 쿠키 미전송 | `NODE_ENV=production` 누락 / HTTPS 아님 / `sameSite` |
| 콘솔에 CORS 에러 | `FRONTEND_URL` 에 Vercel 도메인 없음 | Express 환경변수에 정확한 도메인 추가(끝 슬래시 X) |
| 백엔드 500 / DB 연결 실패 | RDS 보안그룹 / 비번 | 2번 보안그룹 + 1-1 새 비번 반영 확인 |

---

## 6. 코드 측 배포 준비 (2026-05-17 완료된 것)

이미 코드에 반영됨 (이 가이드대로 환경변수만 채우면 됨):

- `config.js` — `VITE_EXPRESS_URL` 환경변수
- `app.js` — CORS 다중 origin (`FRONTEND_URL` 콤마 분리)
- `login.js` — 세션 쿠키 `SESSION_COOKIE_OPTIONS`
  (production → secure:true + sameSite:none, 로컬 → false + lax)
- `.env.example` 3개 — 배포 변수 안내

> 즉 **코드 수정 없이 환경변수만으로 로컬/배포 전환** 가능.

---

## 7. 대안 / 참고

- Render 무료 티어는 15분 무응답 시 슬립 → 첫 요청이 느림.
  디펜스 직전 미리 한 번 호출해 깨워두기.
- EC2 직접(nginx+Let's Encrypt)도 가능하나 처음이면 2~3일 더 소요 → 비권장.
- 캡스톤 데모만 목적이면 **노트북에서 `./start.sh` 로 시연**도 충분히 유효한 대안
  (배포가 안 풀리면 이 폴백을 디펜스 보험으로).
