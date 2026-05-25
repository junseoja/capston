# 04. 인증 · 세션

## 4.1 인증 전략 개요

| 단계 | 사용 기술 | 비고 |
|------|----------|------|
| 비밀번호 저장 | `bcrypt` salt round 10 | 평문 / 단방향 해시 X |
| 세션 유지 | `express-session` + `httpOnly` 쿠키 | JS 에서 읽기 불가 → XSS 토큰 탈취 방어 |
| 권한 가드 | `requireAuth` / `requireAdmin` 미들웨어 | `is_admin = 1` 만 관리자 라우트 진입 |
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
    BE->>API: POST /user<br/>X-Internal-Api-Key
    API->>DB: SELECT login_id WHERE login_id = ?
    alt 중복
        DB-->>API: row
        API-->>BE: 409 Conflict
        BE-->>FE: 409
    else 통과
        API->>API: bcrypt.hash(password)
        API->>DB: INSERT users (uuidv7, ...)
        DB-->>API: OK
        API-->>BE: 201 { user_id }
        BE-->>FE: 201
    end
```

핵심 검증 포인트:
- `login_id` UNIQUE 인덱스 + Express 사전 검증의 **이중화** → 동시 가입 레이스에서도 안전.
- 비밀번호는 FastAPI 진입 후 해시 → Express 로그에도 평문이 남지 않음.

## 4.3 로그인 / 세션 발급

```mermaid
sequenceDiagram
    autonumber
    participant FE as React<br/>LoginPage.jsx
    participant BE as Express<br/>login.js + session
    participant API as FastAPI
    participant DB as MySQL

    FE->>BE: POST /login<br/>{ login_id, password }
    BE->>API: POST /user/login<br/>X-Internal-Api-Key
    API->>DB: SELECT * WHERE login_id<br/>AND deleted_at IS NULL
    DB-->>API: row(user)
    API->>API: bcrypt.compare(password, hash)
    alt 실패
        API-->>BE: 401
        BE-->>FE: 401 "아이디 또는 비밀번호가 일치하지 않습니다."
    else 성공
        API-->>BE: 200 { user_id, nickname, is_admin }
        BE->>BE: req.session.user = { ... }<br/>Set-Cookie httpOnly
        BE-->>FE: 200 { user }<br/>+ Cookie
    end

    note over FE,BE: 이후 모든 요청에 fetch(credentials:include)<br/>=> 동일 도메인의 httpOnly 쿠키가 자동 첨부
```

쿠키 옵션 (운영):
- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` (HTTPS only, Cloudflared 종단 사용)
- `maxAge: 7d`

## 4.4 권한 가드 (`requireAuth` / `requireAdmin`)

```mermaid
flowchart LR
    R[클라이언트 요청] --> A{세션 있음?}
    A -- No --> X1[401 Unauthorized]
    A -- Yes --> B{admin 라우트?}
    B -- No --> P[다음 핸들러]
    B -- Yes --> C{is_admin = 1?}
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
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
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
