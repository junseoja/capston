-- ============================================================
-- 2026-05-17 마이그레이션 — feeds Soft Delete 컬럼 추가
-- ============================================================
-- 배경:
--   5/1 Soft Delete 도입 시 users / routines / routine_completions 에는
--   deleted_at 을 추가했지만 feeds 는 누락(Hard Delete 유지)되어 있었음.
--   5/16 신고(report) 기능의 "게시물 제재 = 피드 Soft Delete" 가
--   feeds.deleted_at 을 전제하므로, 이번에 feeds 도 Soft Delete 로 통일.
--
-- 증상 (이 마이그레이션 미적용 시):
--   GET /report/  →  500
--   (1054, "Unknown column 'f.deleted_at' ...")
--
-- 영향:
--   - report.py process_report : UPDATE feeds SET deleted_at = NOW()
--   - report.py list_reports   : f.deleted_at IS NOT NULL AS feed_deleted
--   - feed.py  get_feeds/상세  : WHERE f.deleted_at IS NULL (제재 피드 숨김)
--
-- 적용 전 주의:
--   1. AWS RDS 스냅샷 후 실행 권장.
--   2. 기존 feeds 행은 deleted_at = NULL (활성) 로 자동 채워짐 → 기존 동작 영향 없음.
--   3. feed.py 의 DELETE FROM feeds (delete_feed) 는 그대로 둠 — 본인 피드
--      직접 삭제는 기존처럼 Hard Delete. 신고 제재만 Soft Delete.
-- ============================================================

ALTER TABLE feeds
    ADD COLUMN deleted_at DATETIME NULL
    COMMENT 'Soft Delete (2026-05-17, 신고 제재용). NULL=활성';

-- 활성 피드 조회 가속 (목록/상세가 WHERE deleted_at IS NULL 로 자주 조회)
CREATE INDEX idx_feeds_active_created
    ON feeds (deleted_at, created_at);


-- ============================================================
-- 적용 후 검증
-- ============================================================
--   DESCRIBE feeds;                        -- deleted_at 컬럼 보이는지
--   SHOW INDEX FROM feeds;                 -- idx_feeds_active_created 있는지
--   SELECT COUNT(*) FROM feeds WHERE deleted_at IS NULL;   -- 전부 활성인지
--
--   그 다음 앱에서:
--   - GET /report?status=pending  → 500 안 나고 정상 응답
--   - 관리자 제재 → 해당 피드가 FeedPage 목록에서 사라지는지
-- ============================================================


-- ============================================================
-- 롤백 (개발/스테이징 한정 — 운영 데이터 있으면 신중)
-- ============================================================
-- DROP INDEX idx_feeds_active_created ON feeds;
-- ALTER TABLE feeds DROP COLUMN deleted_at;
-- ============================================================
