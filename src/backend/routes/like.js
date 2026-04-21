// ============================================================
// 좋아요(Like) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST /like : 좋아요 토글 (추가/취소, 세션 인증)
//
// 보안:
//   세션 쿠키로 로그인 여부 확인 후 user_id를 FastAPI에 전달
//
// [리팩터링 #12] 세션 인증 4줄 블록을 requireAuth 미들웨어로 대체
// ============================================================

const express = require("express");
const router = express.Router();
const { toggleLike } = require("../database");
const requireAuth = require("../middleware/requireAuth");

// ── 좋아요 토글 (POST /like) ─────────────────────────────────────────────────

/**
 * POST /like
 *
 * body: { feed_id }
 * user_id는 requireAuth가 req.user.user_id 에 실어 주므로 별도 전달 불필요
 *
 * 반환: { success: true, liked: true/false }
 */
// [리팩터링 #1+#3] next(err)로 글로벌 핸들러에 위임 — FastApiError 상태코드 보존
router.post("/like", requireAuth, async (req, res, next) => {
    const { feed_id } = req.body;

    if (!feed_id) {
        return res.status(400).json({ success: false, message: "feed_id가 필요합니다." });
    }

    try {
        const result = await toggleLike(feed_id, req.user.user_id);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
