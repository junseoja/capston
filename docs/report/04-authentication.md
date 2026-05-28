# 04. 인증 · 세션

## 4.1 인증 전략 개요

| 단계 | 사용 기술 | 비고 |
|------|----------|------|
| 비밀번호 저장 | `bcryptjs` salt round 10 | 회원가입/임시 비밀번호 발급 시 단방향 해시 저장 |
| 세션 유지 | DB `sessions` 테이블 + `sessionId` httpOnly 쿠키 | JS 에서 읽기 불가 → XSS 토큰 탈취 방어 |
| 권한 가드 | `requireAuth` / `requireAdmin` 미들웨어 | 현재는 `login_id === "admin"` 기준 |
| 내부 통신 | `X-Internal-Api-Key` 헤더 | FastAPI 미들웨어가 1차 차단 |

## 4.2 회원가입 흐름

```mermaid
sequenceDiagram
    autonumber
    participant FE as React<br/>SignupPage.jsx
    participant BE as Express<br/>login.js
    participant API as FastAPI<br/>user.py
    participant DB as MySQL

    FE->>BE: POST /signup<br/>{ login_id, password, nickname, ... }
    BE->>BE: 입력 검증<br/>(빈값, 길이, 이메일 형식)
    BE->>API: GET /user/{login_id}<br/>X-Internal-Api-Key
    API->>DB: SELECT login_id WHERE login_id = ?
    alt 중복
        DB-->>API: row
        API-->>BE: existing user
        BE-->>FE: 409
    else 통과
        BE->>BE: bcrypt.hash(password, 10)
        BE->>API: POST /user/signup<br/>X-Internal-Api-Key
        API->>DB: INSERT users (uuidv7, bcrypt hash)
        DB-->>API: OK
        API-->>BE: 201 { user_id }
        BE-->>FE: 201
    end
```

핵심 검증 포인트:
- `login_id` UNIQUE 인덱스 + Express 사전 검증의 **이중화** → 동시 가입 레이스에서도 안전.
- 비밀번호는 Express 에서 해시한 뒤 FastAPI 로 전달되며, FastAPI/DB 에는 해시 문자열만 저장된다.

## 4.3 로그인 / 세션 발급

```mermaid
sequenceDiagram
    autonumber
    participant FE as React<br/>LoginPage.jsx
    participant BE as Express<br/>login.js + DB session
    participant API as FastAPI
    participant DB as MySQL

    FE->>BE: POST /login<br/>{ login_id, password }
    BE->>API: GET /user/{login_id}<br/>X-Internal-Api-Key
    API->>DB: SELECT * WHERE login_id<br/>AND deleted_at IS NULL
    DB-->>API: row(user)
    API-->>BE: row(user)
    BE->>BE: bcrypt.compare(password, hash)
    alt 실패
        BE-->>FE: 401 "아이디 또는 비밀번호가 일치하지 않습니다."
    else 성공
        BE->>BE: UUID v4 sessionId 생성
        BE->>API: POST /user/session<br/>{ session_id, user_id }
        API->>DB: INSERT sessions<br/>expires_at = NOW()+1 DAY
        BE-->>FE: 200 + Set-Cookie sessionId httpOnly
    end

    note over FE,BE: 이후 모든 요청에 fetch(credentials:include)<br/>=> 동일 도메인의 httpOnly 쿠키가 자동 첨부
```

쿠키 옵션 (운영):
- `httpOnly: true`
- 로컬 `sameSite: "lax"`, 운영 `sameSite: "none"`
- `secure: true` (HTTPS only, Cloudflared 종단 사용)
- `maxAge: 1d`

## 4.4 권한 가드 (`requireAuth` / `requireAdmin`)

```mermaid
flowchart LR
    R[클라이언트 요청] --> A{세션 있음?}
    A -- No --> X1[401 Unauthorized]
    A -- Yes --> B{admin 라우트?}
    B -- No --> P[다음 핸들러]
    B -- Yes --> C{login_id == "admin"?}
    C -- No --> X2[403 Forbidden]
    C -- Yes --> P
```

- `requireAuth` 가 통과되지 않으면 라우터 본체는 절대 실행되지 않음.
- `requireAdmin` 은 `requireAuth` 통과 후에만 작동 (체이닝 순서 강제).

## 4.5 내부 API Key 게이트 (FastAPI)

FastAPI 는 외부에 직접 노출되지 않지만, 동일 EC2 내에서 우회 호출이 일어날 수 있으므로 **전역 미들웨어**로 헤더 검증:

```python
@app.middleware("http")
async def internal_api_key_guard(request, call_next):
    if request.headers.get("X-Internal-Api-Key") != INTERNAL_API_KEY:
        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return await call_next(request)
```

- 키는 환경 변수 (`INTERNAL_API_KEY`) — 컨테이너 build 산출물에 포함되지 않음.
- 운영 / 개발 별도 키.

## 4.6 아이디 / 비밀번호 찾기

| 흐름 | 구현 |
|------|------|
| 아이디 찾기 | 이름 + 이메일 매칭 → 일부 마스킹된 `login_id` 반환 |
| 비밀번호 재설정 | 본인 확인 정보 매칭 → 임시 비밀번호 발급 → bcrypt 저장 후 응답 |

> 운영 환경 보강 백로그: **Rate-limit (IP 당 1분 5회)**, **이메일 송신을 통한 토큰 기반 재설정**, **시도 횟수 잠금**.

## 4.7 프로필 편집 (아바타 포함)

```mermaid
sequenceDiagram
    autonumber
    participant FE as MyPage.jsx
    participant BE as login.js<br/>(uploadAvatar)
    participant S3 as AWS S3
    participant API as user.py
    participant DB as MySQL

    FE->>FE: FormData(avatar, nickname, bio)
    FE->>BE: PATCH /me/profile<br/>multipart/form-data
    BE->>BE: requireAuth
    BE->>S3: PUT profile/<uuid>.jpg<br/>(5MB max, image/*)
    S3-->>BE: file_url
    BE->>API: PATCH /user/profile<br/>{ user_id, nickname, bio, profile_img }
    API->>DB: SELECT 이전 profile_img
    DB-->>API: prev_url
    API->>DB: UPDATE users<br/>SET nickname=?, bio=?, profile_img=?
    API-->>BE: 200 { previous_profile_img }
    alt 이전 URL 존재
        BE->>S3: DELETE prev_url<br/>(S3 키 검증 통과 시)
    end
    BE-->>FE: 200 { user 갱신본 }
```

핵심 안전 장치:
- S3 키 검증 (`extractS3Key`) — 호스트 / 프리픽스 / 경로 traversal 차단.
- FastAPI 가 실패하면 새로 업로드한 S3 객체를 **orphan 청소** (Express 에서 보상 삭제).
- 이전 사진은 응답으로 받은 `previous_profile_img` 만 삭제 → 다른 사용자 / 다른 도메인 파일은 절대 못 지움.

---

이전: [03. 데이터 모델](./03-database.md) · 다음: [05. 핵심 기능 흐름](./05-feature-flows.md)
