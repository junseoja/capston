# 09. 한계 및 개선 방향

> 본 장은 2026-05-27 현재 로컬 코드 리뷰 결과를 기준으로, 보고서의 결론/향후 과제에 바로 사용할 수 있도록 정리한 내용이다. 단순 미구현 목록이 아니라, 현재 구조가 어디까지 동작하고 어떤 순서로 개선하면 좋은지에 초점을 둔다.

## 9.1 현재 구현의 강점

| 영역 | 정리 |
|------|------|
| 계층 분리 | React -> Express BFF -> FastAPI -> MySQL 구조로 공개 API, 인증/업로드, DB 로직의 책임을 분리했다. |
| 인증 경계 | 브라우저는 Express 만 호출하고, FastAPI 는 `X-Internal-Api-Key` 없이는 실제 API 접근을 차단한다. |
| 미디어 저장 | 피드/프로필/챌린지 인증 파일을 S3 에 저장해 EC2 로컬 디스크 의존도를 낮췄다. |
| 데이터 복구성 | 루틴, 완료, 피드, 공지, 신고, 챌린지 주요 도메인에 Soft Delete 정책을 적용했다. |
| 집계 API | 마이페이지와 통계 화면은 FastAPI 에서 집계한 단일 응답을 받아 화면 렌더링에 집중한다. |
| 운영성 | Docker Compose 개발/운영 구성을 분리하고, slow request / slow SQL 로그로 병목 추적 기반을 마련했다. |

## 9.2 현재 확인된 한계

### 9.2.1 관리자 권한 정책

현재 관리자 판별은 `src/backend/middleware/requireAdmin.js` 의 `login_id === "admin"` 조건에 의존한다. 구현이 단순하고 캡스톤 시연에는 충분하지만, 운영 서비스로 확장할 경우 다음 한계가 있다.

- 관리자 계정이 하나로 고정된다.
- 운영자/일반 사용자/정지 사용자 같은 다단계 권한을 표현하기 어렵다.
- 권한 변경 이력이 DB 에 남지 않는다.

개선 방향은 `users.role` 또는 별도 `user_roles` 테이블을 도입하고, `requireAdmin` 이 세션의 role 값을 검증하도록 바꾸는 것이다.

### 9.2.2 프론트 관리자 상태 복구

로그인 직후에는 `LoginPage.jsx` 가 관리자 여부를 `App.jsx` 로 전달해 `/admin` 으로 이동한다. 그러나 새로고침으로 세션을 복구하는 흐름에서는 `isAdmin` 상태가 함께 복구되지 않는다. 이 때문에 관리자 계정도 `/admin` 경로에서 홈으로 리다이렉트될 수 있다.

개선 방향:
- `/me` 응답에 서버가 판단한 `role` 값을 포함한다.
- `App.jsx` 의 세션 복구 단계에서 `setIsAdmin(user.role === "admin")` 을 함께 수행한다.
- 프론트의 `id === "admin"` 판단은 제거하고, 서버 응답만 신뢰한다.

### 9.2.3 린트 기준과 실제 코드의 불일치

`npm run build` 와 Python 문법 검사는 통과했지만, `npm run lint` 는 실패했다. 주요 원인은 다음과 같다.

| 위치 | 내용 | 우선순위 |
|------|------|----------|
| `src/backend/routes/feed.js` | `createFeed`, `addFeedImage` 미사용 import | P1 |
| `src/frontend/HomePage.jsx` | effect 내부 동기 `setState` 규칙 위반 | P1 |
| `src/frontend/NoticeList.jsx` | effect 내부 동기 `setState` 규칙 위반 | P1 |
| `src/frontend/AdminPage.jsx` | hook dependency 경고 | P2 |
| `src/frontend/ChallengePage.jsx` | hook dependency 경고 | P2 |
| `.claude/worktrees` | ESLint 검사 범위에 로컬 worktree 포함 | P2 |

개선 방향:
- 사용하지 않는 import 제거.
- `NoticeList` 의 초기 읽음 목록은 `useState(() => ...)` lazy initializer 로 이동.
- 검색/카테고리 변경 시 페이지 초기화는 이벤트 핸들러 또는 파생 상태 방식으로 정리.
- `eslint.config.js` 의 `globalIgnores` 에 `.claude/worktrees`, `node_modules`, build 산출물을 명시.

### 9.2.4 비밀번호 찾기 UX와 보안

현재 비밀번호 찾기는 본인 확인 후 임시 비밀번호를 응답으로 직접 반환한다. 이메일/SMS 발송 인프라가 없는 상황에서는 실용적인 대안이지만, 운영 환경에서는 다음 보강이 필요하다.

- 임시 비밀번호를 화면에 직접 노출하지 않고 이메일 기반 재설정 링크로 전환.
- IP / 계정 기준 rate limit 적용.
- 반복 실패 시 일정 시간 잠금.
- 비밀번호 변경 후 기존 세션 전체 무효화.

### 9.2.5 관측성 및 운영 자동화

현재 slow request / slow SQL 로그는 병목 파악의 시작점으로 충분하지만, 운영 관점에서는 로그 검색과 알림이 부족하다.

개선 방향:
- CloudWatch Logs 또는 Grafana/Loki 연동.
- 5xx 비율, 응답 시간, DB 커넥션 풀 대기 시간 알림.
- 관리자 제재, 공지 작성, 챌린지 생성 같은 운영 행위 audit log 저장.

## 9.3 개선 로드맵

| 단계 | 개선 항목 | 기대 효과 |
|------|----------|----------|
| 1차 | ESLint 오류 제거, 관리자 세션 복구 수정 | 빌드/검증 신뢰도 향상, 관리자 화면 접근 안정화 |
| 2차 | role 기반 권한 모델 도입 | 관리자/일반 사용자 권한 확장성 확보 |
| 3차 | 비밀번호 재설정 이메일화 + rate limit | 계정 찾기 기능의 운영 보안 강화 |
| 4차 | Helmet/CSP, CSRF 정책 검토 | 브라우저 보안 헤더 강화 |
| 5차 | 로그/알림/감사 테이블 도입 | 장애 대응과 운영 추적성 개선 |
| 6차 | CI 파이프라인에서 lint/build/py_compile 자동 실행 | 배포 전 회귀 오류 조기 차단 |

## 9.4 보고서 결론에 넣을 수 있는 요약

Routine Mate 는 단순 CRUD 웹앱이 아니라, 루틴 관리·인증 피드·챌린지·통계를 하나의 데이터 흐름으로 연결한 3계층 웹 서비스이다. Express BFF 를 공개 API 경계로 두고 FastAPI 를 내부 DB API 로 분리함으로써 인증, 파일 업로드, 도메인 로직의 책임을 나눴다. 또한 S3 기반 미디어 저장, Soft Delete, 커넥션 풀, 내부 API Key, 통계 집계 API 를 통해 캡스톤 프로젝트 범위를 넘어 운영을 고려한 구조를 구현했다.

다만 현재 버전은 관리자 권한 정책, 린트 기준 정합성, 비밀번호 재설정 보안, 운영 관측성 측면에서 추가 개선 여지가 있다. 향후에는 role 기반 권한 모델과 CI 검증 자동화, 이메일 기반 비밀번호 재설정, audit log 를 도입해 실제 서비스 수준의 안정성과 보안성을 강화하는 방향으로 발전시킬 수 있다.

---

이전: [08. 본인 기여](./08-contribution.md) · 처음으로: [README](./README.md)
