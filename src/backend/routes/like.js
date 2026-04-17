// ============================================================
// 좋아요(Like) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST /like : 좋아요 토글 (추가/취소, 세션 인증)
//
// 보안:
//   세션 쿠키로 로그인 여부 확인 후 user_id를 FastAPI에 전달
// ============================================================

const express = require("express");
const router = express.Router();
const { findSession, toggleLike } = require("../database");

// ── 좋아요 토글 (POST /like) ─────────────────────────────────────────────────

/**
 * POST /like
 *
 * body: { feed_id }
 * user_id는 세션에서 자동 추출하여 FastAPI에 전달
 *
 * 반환: { success: true, liked: true/false }
 */
router.post("/like", async (req, res) => {
    const { sessionId } = req.cookies;

    if (!sessionId) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    const session = await findSession(sessionId);
    if (!session) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    const { feed_id } = req.body;

    if (!feed_id) {
        return res.status(400).json({ success: false, message: "feed_id가 필요합니다." });
    }

    try {
        const result = await toggleLike(feed_id, session.user_id);
        return res.json(result);
    } catch (error) {
        console.error("좋아요 토글 오류:", error);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
});

module.exports = router;
