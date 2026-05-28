# 05. 핵심 기능 흐름

> 화면별로 클라이언트 → BFF → FastAPI → DB 까지의 시퀀스를 정리. 모든 라우트는 `requireAuth` 통과를 전제로 한다.

## 5.1 루틴 등록 & 완료 체크

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as RoutinePage.jsx
    participant BE as routine.js / completion.js
    participant API as routine.py / completion.py
    participant DB as MySQL

    U->>FE: "운동 30분" + time_slot=morning 입력
    FE->>BE: POST /routine
    BE->>API: POST /routine
    API->>DB: INSERT routines (uuidv7, ...)
    API-->>FE: 201

    U->>FE: 체크박스 ✓
    FE->>BE: POST /completion { routine_id }
    BE->>API: POST /completion
    API->>DB: BEGIN<br/>SELECT 오늘 동일 routine_id 완료 행<br/>없으면 INSERT routine_completions<br/>COMMIT
    API-->>FE: 200 { completion_id }
    FE-->>U: 달성률 즉시 재계산
```

특이점:
- "오늘 완료" 판단은 `DATE(completed_at) = CURDATE()` 기준.
- 동일 루틴을 하루에 여러 번 체크해도 **distinct routine_id 단위로 1회만 인정** (마이페이지 달성률 계산 동일 규칙).
- 체크 해제 = Soft Delete (`UPDATE routine_completions SET deleted_at = NOW()`).

## 5.2 피드 작성 (사진 인증)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as FeedPage.jsx
    participant BE as feed.js<br/>(multer-s3)
    participant S3 as AWS S3
    participant API as feed.py
    participant DB as MySQL

    U->>FE: 사진 선택 + 본문 입력
    FE->>BE: POST /feed (FormData)
    BE->>BE: requireAuth + 파일 타입/크기 검증
    BE->>S3: PUT feed/<uuid>.jpg (multer-s3 직접 업로드)
    S3-->>BE: file_url
    BE->>API: POST /feed<br/>{ user_id, content, files:[{url,type}] }
    API->>DB: BEGIN<br/>INSERT feeds<br/>INSERT feed_images (N개)<br/>COMMIT
    API-->>BE: 201 { feed_id }
    BE-->>FE: 201

    note over FE: 무한 스크롤은<br/>GET /feed?cursor=<created_at>,<feed_id>
```

설계 포인트:
- **multer-s3 가 EC2 임시 디스크를 건너뛰고 S3 로 다이렉트 PUT** → 디스크 IO 부하 0, 임시 파일 청소 불필요.
- FastAPI 가 INSERT 실패하면 Express 가 S3 객체를 보상 삭제 (orphan 청소).
- 피드 삭제 시: feed 행을 `deleted_at` 마킹 → 동시에 S3 객체도 검증 통과 시 삭제.

## 5.3 피드 무한 스크롤 (Cursor 기반)

```mermaid
flowchart LR
    A[페이지 최초 진입] --> B[GET /feed<br/>cursor 없음]
    B --> C{rows 9개+}
    C -- Yes --> D[lastCursor =<br/>created_at,feed_id]
    C -- No --> E[hasMore=false]
    D --> F[스크롤 끝 근접<br/>IntersectionObserver]
    F --> G[GET /feed?cursor=...]
    G --> C
```

- offset 페이지네이션 대비 **새 글이 추가/삭제돼도 중복/누락 없음**.
- 인덱스: `(created_at DESC, feed_id DESC)` 복합 사용으로 ORDER BY 정렬 안정.

## 5.4 마이페이지 통합 조회

```mermaid
sequenceDiagram
    autonumber
    participant FE as MyPage.jsx
    participant BE as mypage.js
    participant API as mypage.py
    participant DB as MySQL

    FE->>BE: GET /mypage
    BE->>API: GET /mypage/{user_id}
    par 단일 라우터 안에서 순차 실행
        API->>DB: _load_user (users 1행)
        API->>DB: _load_summary<br/>(routines GROUP BY time_slot<br/>+ today 완료수<br/>+ feed_count<br/>+ 365일 완료일자 → streak)
        API->>DB: _load_gallery<br/>(feeds + feed_images,<br/>deleted_at IS NULL)
    end
    API-->>BE: { user, summary, gallery }
    BE-->>FE: 200
    FE->>FE: 단일 응답으로 화면 모든 영역 렌더
```

`/mypage/{id}` 1 회 호출로 `user + summary + gallery` 가 모두 도착 → 화면 새로고침 시 N+1 호출 제거.

### 5.4.1 연속 달성 (streak) 계산

```python
def _calculate_current_streak(completion_dates, today):
    date_set = set(completion_dates)
    current = today
    streak = 0
    while current.isoformat() in date_set:
        streak += 1
        current -= timedelta(days=1)
    return streak
```

- 오늘부터 거꾸로 "하루에 1개 이상 완료" 가 끊기지 않는 길이.
- DB 가 아니라 애플리케이션에서 계산 → 인덱스만 잘 타면 O(N) (최근 365일 한정).

## 5.5 챌린지 (관리자 등록 → 참가 → 인증)

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    actor U as User
    participant FE as ChallengePage.jsx<br/>AdminPage.jsx
    participant BE as challenge.js
    participant S3 as AWS S3
    participant API as challenge.py
    participant DB as MySQL

    A->>FE: 챌린지 제목/기간 입력
    FE->>BE: POST /challenge
    BE->>BE: requireAdmin
    BE->>API: POST /challenge
    API->>DB: INSERT challenges
    API-->>FE: 201

    U->>FE: "참가" 버튼
    FE->>BE: POST /challenge/{id}/join
    BE->>API: POST /challenge/{id}/join
    API->>DB: INSERT challenge_participants

    U->>FE: 인증 사진 업로드
    FE->>BE: POST /challenge/{id}/proof (multipart)
    BE->>S3: PUT challenge/<uuid>.jpg
    BE->>API: POST /challenge/{id}/proof<br/>{ files, content, share_to_feed }
    API->>DB: BEGIN<br/>INSERT challenge_proofs<br/>INSERT challenge_proof_files<br/>COMMIT
    API-->>FE: 201
```

특이점:
- **챌린지 인증 → 피드 노출**: `challenge_proofs.share_to_feed = 1` 인 인증을 `GET /feed` 응답에서 일반 피드와 병합한다.
- 챌린지 인증은 별도 `feeds` 행으로 복제하지 않고, 피드 조회 단계에서 `source_type="challenge"` 메타를 붙여 표시한다.

## 5.6 통계

```mermaid
flowchart LR
    A[StatsPage.jsx] --> B[GET /stats]
    B --> C[stats.js<br/>requireAuth]
    C --> D[stats.py<br/>여러 집계 쿼리]
    D --> E[time_slot 별 7일 달성률]
    D --> F[월별 캘린더 완료 일자]
    D --> G[누적 인증 게시글 수]
    E & F & G --> H[JSON 단일 응답]
```

- 모든 집계는 인덱스 (`user_id, completed_at`) 위에서 실행.
- 응답은 한 번에 모아 보내 클라이언트는 차트 렌더링에만 집중.

## 5.7 공지 / 신고

| 흐름 | 비고 |
|------|------|
| 공지 작성 | `requireAdmin`. `AdminPage.jsx` → `POST /notice`. |
| 공지 열람 | `NoticeList.jsx` 목록 + `NoticeDetail.jsx`. Soft Delete 필터 적용. |
| 신고 작성 | `target_type` (feed / comment / user) 분기. 본인 게시물 신고 가드. |
| 신고 처리 | Admin 이 `status` 를 `resolved` / `rejected` 로 갱신. |

---

이전: [04. 인증·세션](./04-authentication.md) · 다음: [06. 보안 정책](./06-security.md)
