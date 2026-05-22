# Current Code Review Notes - 2026-05-20

이 문서는 현재 워크스페이스 코드 기준으로 다시 훑은 분석 결과다. 날짜별 작업 로그가 길게 남아 있어도, 아래 내용이 현재 동작을 설명하는 기준선이다.

## 1. 전체 구조

```text
React + Vite
  -> Express 공개 API
  -> FastAPI 내부 데이터 API
  -> AWS RDS MySQL

Express
  -> AWS S3 (피드/챌린지 인증 파일)
```

- 브라우저는 `VITE_EXPRESS_URL`의 Express 서버만 호출한다.
- Express는 세션 쿠키, CORS, 관리자 권한, S3 업로드, FastAPI 브리지를 담당한다.
- FastAPI는 DB CRUD, 집계, 소유권 검증, Soft Delete 정책을 담당한다.
- FastAPI는 `X-Internal-Api-Key`가 없는 직접 호출을 차단한다.

## 2. 기능별 현재 상태

| 영역 | 현재 구현 상태 |
|---|---|
| 인증 | 회원가입, 로그인, DB 세션, `/me`, 로그아웃, 중복체크, 아이디 찾기, 임시 비밀번호 재설정 |
| 루틴 | 생성/조회/Soft Delete, 홈/루틴 페이지 상태 동기화 |
| 완료 기록 | 완료 생성, 오늘 완료 복구, 이력 조회, 완료 취소 Soft Delete |
| 피드 | S3 파일 업로드, 피드+이미지 트랜잭션 생성, 커서 페이지네이션, 루틴/챌린지 통합 조회 |
| 댓글/좋아요 | 댓글 작성/조회/삭제, 좋아요 토글 |
| 마이페이지 | 유저 정보, summary, gallery 통합 조회, 닉네임/bio 수정 |
| 통계 | weekly/monthly 기간 기반 달성률, 시간대/카테고리 집계, streak 계산 |
| 공지 | 관리자 CRUD, 사용자 목록/상세, 홈 공지 모달 |
| 신고 | 피드 신고 접수, 관리자 그룹 조회, 제재 처리 시 pending 신고 완료 + 피드 Soft Delete |
| 챌린지 | 목록, 참여, 인증 등록/취소, S3 파일, 관리자 CRUD, 참여자/인증 현황 |

## 3. 주석 업데이트 기준

이번 정리에서 오래된 설명은 다음 기준으로 고쳤다.

- `uploads/` 정적 서빙 설명은 S3 기준 설명으로 변경.
- 챌린지 mock/프론트 내부 상태 설명은 실제 Express/FastAPI 연결 기준으로 변경.
- README의 API 명세는 현재 라우터 목록 기준으로 갱신.
- `App.jsx`, `FeedPage.jsx`, `AdminPage.jsx`, `ChallengePage.jsx`, `database.js`, `challenge` 라우터의 상단 설명을 현재 책임에 맞췄다.

## 4. 남은 점검 포인트

- 관리자 판별은 아직 `login_id === "admin"` 정책이다. 실서비스 확장 시 `users.role` 같은 명시 컬럼을 권장한다.
- FastAPI의 관리자 라우터는 Express의 `requireAdmin`을 신뢰한다. 운영에서는 FastAPI 포트를 외부에 직접 노출하지 않아야 한다.
- README 하단의 날짜별 작업 내역에는 과거 로컬 업로드, hard delete, mock 관련 기록이 보존되어 있다. 현재 명세와 충돌하면 상단 구조/API 명세와 `docs/architecture-overview.md`를 우선한다.
- S3 객체 삭제는 실패해도 API 처리를 막지 않는 best-effort 방식이다. 운영에서는 실패 로그를 별도 모니터링하는 편이 좋다.
