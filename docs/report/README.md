# Routine Mate — 보고서 / 학습용 문서

> 캡스톤 졸업작품 "Routine Mate" 의 시스템 전반을 보고서 작성 및 학습용으로 정리한 문서 모음입니다.
> 모든 다이어그램은 Mermaid 로 작성되어 GitHub / VS Code 에서 바로 렌더링됩니다.

## 📚 목차

| # | 문서 | 한 줄 설명 |
|---|------|----------|
| 01 | [프로젝트 개요](./01-overview.md) | 무엇을, 왜, 누구를 위해 — 서비스 정의와 핵심 가치 |
| 02 | [시스템 아키텍처](./02-architecture.md) | 3-Tier (React / Express BFF / FastAPI) 구조와 통신 흐름 |
| 03 | [데이터 모델 (DB)](./03-database.md) | MySQL 스키마 + ERD + Soft Delete / UUIDv7 정책 |
| 04 | [인증 · 세션](./04-authentication.md) | 회원가입 → 로그인 → httpOnly 세션 → 내부 API Key 게이트 |
| 05 | [핵심 기능 흐름](./05-feature-flows.md) | 루틴 / 피드 / 마이페이지 / 챌린지 / 통계 시퀀스 다이어그램 |
| 06 | [보안 정책](./06-security.md) | INTERNAL_API_KEY, S3 키 검증, 신고, Rate-limit, Soft Delete |
| 07 | [배포 환경](./07-deployment.md) | Docker Compose, AWS (EC2 / RDS / S3), Cloudflared 터널 |
| 08 | [본인 기여](./08-contribution.md) | 백엔드 / DB / 배포 / 프론트 통합 — 챌린지 제외 전체 |
| 09 | [한계 및 개선 방향](./09-limitations-improvements.md) | 현재 코드 리뷰 기반 한계, 검증 결과, 향후 개선 로드맵 |

## 🗂 본 문서가 다루는 범위

- **하드 사실** (코드 / DB / 인프라) 기반으로 작성. 추측 없음.
- **챕터 8** 은 본인 기여 명시를 위한 별도 챕터입니다.
- 모든 코드 경로는 `path/to/file.ext:line` 형식으로 표기 → 보고서 검토 시 즉시 찾아갈 수 있도록 함.

## 🔖 빠른 참조

- 메인 README (작업 일지 / 백로그): [`../../README.md`](../../README.md)
- 아키텍처 원본 노트: [`../architecture-overview.md`](../architecture-overview.md)
- 현재 코드 리뷰 노트: [`../code-review-current-state-2026-05-20.md`](../code-review-current-state-2026-05-20.md)
- 배포 노트: [`../deploy.md`](../deploy.md)
- 마이그레이션 SQL: [`../migrations-*.sql`](../)

---

작성일: 2026-05-23 / 작성자: 백엔드·인프라 담당
