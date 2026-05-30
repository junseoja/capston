# 06. 보안 정책

> Routine Mate 는 **다층 방어 (Defense in Depth)** 원칙을 따른다. 단일 미들웨어 한 줄로 보호하는 것이 아니라, **세션 / 내부 키 / S3 키 검증 / Soft Delete / 트랜잭션 rollback** 의 다섯 겹으로 사고 영향을 격리한다.

## 6.1 방어 계층 한눈에 보기

```mermaid
flowchart TB
    A[🌐 외부 요청<br/>HTTPS] --> B{httpOnly 세션?}
    B -- No --> X1[401]
    B -- Yes --> C{requireAdmin?}
    C -- No 통과 --> D
    C -- Admin --> CA{login_id == "admin"}
    CA -- No --> X2[403]
    CA -- Yes --> D
    D[파일 업로드 검증<br/>MIME · 크기 · 프리픽스] --> E[S3 키 추출<br/>호스트 · 경로 traversal 차단]
    E --> F[X-Internal-Api-Key]
    F --> G{FastAPI 미들웨어}
    G -- 불일치 --> X3[403]
    G -- OK --> H[라우터 try]
    H --> I[BEGIN → Query]
    I -->|예외| R[rollback + finally close]
    I --> J[COMMIT]
```

## 6.2 비밀번호

| 정책 | 적용 위치 |
|------|----------|
| `bcryptjs` salt round 10 단방향 해시 | `login.js` 회원가입 / 임시 비밀번호 변경 시 |
| 평문 로그 금지 | Express 요청 로깅에서 `password` 키 출력 금지 |
| 응답 페이로드에서 `password` 컬럼 제거 | `/me` 응답에서 비밀번호 해시 제외 |

## 6.3 세션 / 쿠키

| 옵션 | 값 | 이유 |
|------|-----|------|
| `httpOnly` | true | JS 가 `document.cookie` 로 읽을 수 없음 → XSS 토큰 탈취 차단 |
| `secure` | true (운영) | HTTPS only — Cloudflared 종단 보장 |
| `sameSite` | 로컬 `"lax"`, 운영 `"none"` | 개발 편의와 운영 크로스 도메인 HTTPS 쿠키 전송을 분리 |
| `maxAge` | 1d | DB 세션 만료와 쿠키 만료를 맞춤. 비밀번호 변경 시 세션 무효화는 보강 예정. |

## 6.4 내부 API Key 게이트 (FastAPI)

```python
@app.middleware("http")
async def internal_api_key_guard(request, call_next):
    if request.headers.get("X-Internal-Api-Key") != INTERNAL_API_KEY:
        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return await call_next(request)
```

- **단 1 곳**에서 강제 → 라우터마다 검증을 반복하지 않아도 됨.
- 환경 변수에서만 주입 → 코드/이미지에 포함되지 않음.
- 운영 / 개발 키 분리.

## 6.5 S3 키 검증 (`src/backend/lib/s3.js`, `challenge.js`)

검증기는 **두 개로 분리**되어 있고 정책 형태는 동일하다.
- **피드 / 프로필**: 공용 `src/backend/lib/s3.js` 의 `extractS3Key` — 화이트리스트 `["feed/", "profile/"]`.
- **챌린지 인증**: `src/backend/routes/challenge.js` 의 자체 `extractS3Key` — 화이트리스트 `["challenge/"]`.

두 함수 모두 (1) URL 파싱 (2) 호스트 정확 매칭 (3) `..`·백슬래시 차단 (4) 프리픽스 화이트리스트라는 동일한 4단계를 거친다. 즉 S3 버킷은 `feed/` · `profile/` · `challenge/` 세 프리픽스로 분리되지만, 검증 로직은 도메인별로 나뉘어 있다.

```mermaid
flowchart TB
    A[클라이언트가 보낸 URL 또는<br/>저장된 file_url] --> B[URL 파싱]
    B --> C{프로토콜 https?}
    C -- No --> X1[reject]
    C -- Yes --> D{호스트가<br/>정확히 우리 버킷?}
    D -- No --> X2[reject - 외부 도메인]
    D -- Yes --> E[pathname 추출]
    E --> F[decodeURIComponent]
    F --> G{경로 traversal<br/>(.. , \\)?}
    G -- Yes --> X3[reject]
    G -- No --> H{프리픽스 화이트리스트<br/>feed·profile 검증기: feed/ profile/<br/>challenge 검증기: challenge/?}
    H -- No --> X4[reject]
    H -- Yes --> Y[S3 key 반환 → 삭제 가능]
```

차단되는 공격 시나리오:
- **타 사용자 파일 삭제 시도**: `previous_profile_img` 를 클라이언트가 변조해 보내도, FastAPI 가 DB 에서 자체 조회한 값만 신뢰.
- **S3 외부 객체 삭제 유도**: 우리 버킷이 아닌 호스트는 1차 차단.
- **경로 traversal**: `profile/../../../prod-backup/...` 같은 시도는 디코딩 후 정규화 단계에서 차단.
- **임의 프리픽스 업로드**: `random/`, `admin-secret/` 등은 multer-s3 의 key 함수에서 강제 `feed/`, `profile/`, `challenge/` 계열만 허용.

## 6.6 업로드 제한

| 라우트 | 최대 크기 | 허용 MIME |
|--------|----------|----------|
| 피드 (`feed.js`) | 50 MB | `image/*`, `video/*` |
| 프로필 아바타 (`login.js`) | 5 MB | `image/*` 만 |
| 챌린지 인증 (`challenge.js`) | 50 MB | `image/*`, `video/*` |

- multer-s3 단계에서 차단 → EC2 디스크 / 메모리 모두 거치지 않음.

## 6.7 Soft Delete = 보안적 가시성 제어

| 시나리오 | 처리 |
|---------|------|
| 사용자가 본인 게시글 삭제 | `feeds.deleted_at = NOW()` (Soft Delete). 피드가 가려지면 `feed_comments` · `feed_likes`(Hard Delete 테이블)는 조회 시 피드 단위 필터로 함께 노출되지 않음. |
| 사용자 탈퇴 | `users.deleted_at = NOW()`. 작성 글은 `LEFT JOIN + COALESCE` 로 "(탈퇴 사용자)" 로 표시. |
| 관리자 강제 삭제 | 동일하게 Soft Delete + 해당 피드의 모든 신고 `reports.status = "completed"` 로 일괄 처리. |
| 데이터 무결성 사고 | `deleted_at` 만 NULL 로 되돌리면 즉시 복구 가능. |

**모든 SELECT 에서 `deleted_at IS NULL` 필터 누락 = P0 버그**.
실제로 2026-05-23 패치된 사례: `mypage.py:_load_gallery` 에 필터가 누락되어 삭제된 피드가 갤러리에 나타나던 버그.

## 6.8 트랜잭션 / 커넥션 풀

```python
conn = get_connection()
try:
    with conn.cursor() as cursor:
        # INSERT / UPDATE / SELECT
    conn.commit()
except HTTPException:
    try: conn.rollback()
    except: pass
    raise
except Exception as e:
    try: conn.rollback()
    except: pass
    raise HTTPException(500, str(e))
finally:
    conn.close()  # 풀로 반환
```

- 성공 경로 = COMMIT, 실패 경로 = ROLLBACK + 풀 반환 → **장기 운영에도 커넥션 누수 0**.
- HTTPException 도 rollback 거치게 두 번 처리 → 404 가 발생했어도 직전 SELECT 가 트랜잭션 상태로 남지 않음.

## 6.9 자기 자신 / 타인 보호 규칙

| 규칙 | 적용 위치 |
|------|----------|
| 신고자 위조 방지 | `report.js` 가 `reporter_user_id` 를 클라이언트 값이 아닌 **세션 user_id** 로 주입. 신고 대상(`target_user_id`)도 FastAPI 가 `feed_id` 로 작성자를 자체 조회해 확정 ([report.py](../../src/python_api/routers/report.py)). |
| 중복 신고 차단 | 같은 사용자 + 같은 피드 + `pending` 신고가 이미 있으면 409 ([report.py:135-149](../../src/python_api/routers/report.py)). *(현재 자기 글 신고를 막는 가드는 없음 — 백로그)* |
| 챌린지 인증 신고 | 챌린지 인증 글(`source_type="challenge"`)은 **프론트에서 신고 메뉴를 숨김** ([FeedPage.jsx](../../src/frontend/FeedPage.jsx)). reports 테이블은 `feed_id` 전용이라 챌린지 인증은 신고 대상에 포함되지 않음. |
| 중복 좋아요 방지 | `feed_likes` 의 `UNIQUE(feed_id, user_id)` 제약. INSERT 충돌(IntegrityError) 시 DELETE 로 토글 ([like.py:61-80](../../src/python_api/routers/like.py)). |
| 댓글 작성자 본인만 삭제 | FastAPI 가 `DELETE ... WHERE comment_id = ? AND user_id = ?` 로 소유자 검증 ([comment.py:173](../../src/python_api/routers/comment.py)). (별도 수정 엔드포인트는 없음.) |

## 6.10 비밀 관리

| 시크릿 | 위치 | 노출 정책 |
|--------|------|----------|
| RDS 비밀번호 | 환경 변수 + `.env` (gitignore) | ⚠️ 과거 깃에 노출된 적 있음 → README 백로그에 P0 기록 |
| `INTERNAL_API_KEY` | 환경 변수 | 빌드 산출물에 포함 X |
| AWS Access Key | EC2 IAM Role 권장 | 코드 / 이미지에 포함 X |
| 세션 시크릿 | 환경 변수 | 프로세스 시작 시점에만 로드 |

## 6.11 알려진 보강 백로그 (P1)

- 비밀번호 변경 API + 변경 후 모든 세션 무효화.
- 아이디/비밀번호 찾기 **Rate-limit (IP 5회/분)**.
- 비밀번호 찾기 → 이메일 송신 기반 토큰 재설정.
- Helmet 헤더 (CSP, X-Frame-Options) 강화.
- Audit log 테이블 (관리자 행위 추적).
- 관리자 권한을 `login_id === "admin"` 문자열 정책에서 `users.role` 컬럼 기반 정책으로 전환.

---

이전: [05. 핵심 기능 흐름](./05-feature-flows.md) · 다음: [07. 배포 환경](./07-deployment.md)
