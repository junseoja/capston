# ☁️ Cloudflare Tunnel (Quick Tunnel) — 무료 글로벌 접속 가이드

작성: 2026-05-17 / 방식: **Quick Tunnel** (도메인·계정 불필요, 무료)

> 맥에서 `./start.sh` 로 로컬 실행 + cloudflared 터널 2개 →
> 외부에서 `https://랜덤.trycloudflare.com` 으로 접속.
> 도메인 사기 전, **무료로 글로벌 동작을 검증**하는 단계.
>
> 추후 도메인 구매 시 → Named Tunnel 로 승격 (이 문서 맨 아래 참고).

---

## 0. 구조

```
[맥]  ./start.sh
   localhost:5173 프론트 ─── cloudflared ──→ https://AAA.trycloudflare.com  (프론트 공개주소)
   localhost:3000 Express ── cloudflared ──→ https://BBB.trycloudflare.com  (API 공개주소)
   localhost:8000 FastAPI   (터널 X — Express 가 내부 호출, 외부 비노출 = 보안 ↑)
```

터널 **2개** (프론트 + Express). FastAPI 는 노출하지 않는다.

---

## 1. cloudflared 설치 (최초 1회)

```bash
brew install cloudflared
cloudflared --version   # 설치 확인
```

---

## 2. 실행 순서 (매번 / 디펜스 당일)

> ⚠️ Quick Tunnel URL 은 **터널 재시작마다 바뀐다**. 아래 순서를 1회 세팅으로 진행.

### 2-1. 로컬 서버 켜기 (터미널 ①)
```bash
./start.sh
```
→ 프론트(5173) / Express(3000) / FastAPI(8000) 로컬 가동

### 2-2. Express 터널 (터미널 ②)
```bash
cloudflared tunnel --url http://localhost:3000
```
→ 출력에서 `https://BBB.trycloudflare.com` 형태 URL 복사 (= **API 주소**)

### 2-3. 프론트 터널 (터미널 ③)
```bash
cloudflared tunnel --url http://localhost:5173
```
→ 출력에서 `https://AAA.trycloudflare.com` 형태 URL 복사 (= **접속 주소**)

### 2-4. 환경변수 3곳 수정

**루트 `.env`**
```
VITE_EXPRESS_URL=https://BBB.trycloudflare.com      # ← Express 터널(2-2)
```

**`src/backend/.env`**
```
FRONTEND_URL=https://AAA.trycloudflare.com,http://localhost:5173   # ← 프론트 터널(2-3) + 로컬
NODE_ENV=production                                  # ← 쿠키 secure+sameSite:none (HTTPS 터널이라 필수)
```
> `NODE_ENV` 키가 없으면 새 줄로 추가. (현재 src/backend/.env 에 없음 — 추가 필요)

### 2-5. 재시작 (터미널 ①)
```
Ctrl+C  후  ./start.sh 다시 실행
```
→ Vite 가 새 `VITE_EXPRESS_URL` 로 다시 빌드해야 프론트가 올바른 API 를 호출함.
  (터널 ②③ 은 끄지 말 것 — 그대로 유지)

### 2-6. 접속 테스트
브라우저(또는 팀원 기기)에서 **2-3 의 프론트 URL** (`https://AAA...`) 접속.

---

## 3. 동작 점검 체크리스트

브라우저 F12 → Network 보며:

```
□ https://AAA.trycloudflare.com 접속 → 로그인 화면 뜸
□ 회원가입 → 비번정책(8자+영숫자특수) 동작
□ 로그인 → Network 에 Set-Cookie + 이후 요청에 Cookie 동봉
□ 새로고침해도 로그인 유지 (세션 쿠키 정상)
□ 공지/신고/챌린지 핵심 흐름 동작
□ 콘솔에 CORS 에러 없음
```

---

## 4. 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 로그인은 되는데 새로고침하면 풀림 | 쿠키 미전송 | `NODE_ENV=production` 들어갔는지 / 2-5 재시작 했는지 |
| CORS 에러 (콘솔 빨강) | FRONTEND_URL 에 프론트 터널 URL 없음/오타 | 2-4 의 `https://AAA...` 정확히(끝 슬래시 X) + 재시작 |
| API 호출 다 실패 | VITE_EXPRESS_URL 이 옛 URL | 2-4 Express URL 갱신 후 **반드시 2-5 재시작**(Vite 빌드 시점 반영) |
| trycloudflare 502 | 로컬 서버 안 떠 있음 | 터미널 ① `./start.sh` 살아있는지 |
| 터널 URL 이 바뀜 | Quick Tunnel 특성 | 정상. 2-2~2-5 다시 (그래서 디펜스 직전 1회 세팅 권장) |

---

## 5. 한계 (알고 쓰기)

- **맥이 켜져 있어야** 동작 (절전 끄기: 시스템 설정 → 배터리 → 디스플레이 꺼져도 잠자기 안 함)
- 터미널 3개(`start.sh` + 터널 2개) 계속 떠 있어야 함
- Quick Tunnel URL 은 매 실행마다 변경 → 상시 고정 주소 필요하면 6번
- `NODE_ENV=production` 인 동안 **로컬 http://localhost:5173 직접 접속은 쿠키가 안 됨**
  (secure 쿠키는 HTTPS 만) → 테스트는 **터널 URL 로** 해야 함.
  순수 로컬 개발로 되돌릴 땐 `NODE_ENV=development` 로 바꾸고 재시작.

---

## 6. (나중에) 도메인 구매 후 — Named Tunnel 승격

도메인(`godsanglog.com` 등) 구매 시 고정 주소 + 자동 실행 가능:

1. 도메인 구입 → Cloudflare 에 사이트 추가 (네임서버 변경, DNS 무료)
2. `cloudflared tunnel login` → `cloudflared tunnel create routine-mate`
3. `~/.cloudflared/config.yml` 작성 (ingress 규칙):
   ```yaml
   tunnel: <터널ID>
   credentials-file: /Users/sayongja/.cloudflared/<터널ID>.json
   ingress:
     - hostname: godsanglog.com
       service: http://localhost:5173
     - hostname: api.godsanglog.com
       service: http://localhost:3000
     - service: http_status:404
   ```
4. DNS 라우팅: `cloudflared tunnel route dns routine-mate godsanglog.com` (api. 도 동일)
5. `.env` 를 고정 도메인으로:
   ```
   VITE_EXPRESS_URL=https://api.godsanglog.com
   FRONTEND_URL=https://godsanglog.com,http://localhost:5173
   NODE_ENV=production
   ```
6. 실행: `cloudflared tunnel run routine-mate` (URL 고정 — 재시작해도 안 바뀜)
   → start.sh 에 통합 가능 (Quick 과 달리 URL 고정이라 자동화 의미 있음)

→ 앱(Capacitor) 단계에서도 이 고정 도메인을 `server.url` 로 쓰면 됨.
