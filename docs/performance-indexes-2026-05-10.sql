-- ============================================================
-- Routine Mate 성능 인덱스 권장안
-- ============================================================
-- [추가 2026-05-10]
-- 이유:
--   React -> Express -> FastAPI -> MySQL 구조를 유지하면서 성능을 올리려면
--   /feed, /completion/today, /mypage, /stats 에서 반복되는 WHERE/JOIN/ORDER BY 조건을
--   MySQL 인덱스로 받쳐주는 것이 가장 효과적이다.
--
-- 적용 전 주의:
--   1. 실제 RDS에 바로 실행하기 전에 SHOW INDEX 로 같은 이름/비슷한 복합 인덱스가 있는지 확인한다.
--   2. 데이터가 많은 테이블에서는 CREATE INDEX 중 쓰기 성능이 일시적으로 떨어질 수 있다.
--   3. MySQL 버전에 따라 CREATE INDEX IF NOT EXISTS 를 지원하지 않을 수 있어 일반 CREATE INDEX 로 작성했다.
-- ============================================================

-- 루틴 목록 / 마이페이지 시간대별 active 루틴 수
CREATE INDEX idx_routines_user_active_slot
ON routines (user_id, deleted_at, time_slot);

-- 통계 카테고리별 집계
CREATE INDEX idx_routines_user_active_category
ON routines (user_id, deleted_at, category);

-- 오늘 완료 / 기간별 완료 / streak 계산
CREATE INDEX idx_completions_user_active_completed
ON routine_completions (user_id, deleted_at, completed_at);

-- 루틴별 완료 여부 계산
CREATE INDEX idx_completions_user_routine_completed
ON routine_completions (user_id, routine_id, completed_at);

-- 피드 목록 / 내 인증 게시글 수 / 마이페이지 갤러리
CREATE INDEX idx_feeds_user_created
ON feeds (user_id, created_at);

-- 피드 이미지 일괄 조회 / 갤러리 정렬
CREATE INDEX idx_feed_images_feed_created
ON feed_images (feed_id, created_at);

-- 좋아요 상태 및 좋아요 수 집계 보조
CREATE INDEX idx_feed_likes_feed_user
ON feed_likes (feed_id, user_id);

-- 댓글 목록 및 댓글 수 집계 보조
CREATE INDEX idx_feed_comments_feed_created
ON feed_comments (feed_id, created_at);
