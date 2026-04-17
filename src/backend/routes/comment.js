// ============================================================
// 댓글(Comment) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST   /comment              : 댓글 작성 (세션 인증)
//   GET    /comment/:feed_id     : 피드 댓글 목록 조회 (세션 인증)
//   DELETE /comment/:comment_id  : 댓글 삭제 (세션 인증 + 본인 소유 검증)
//
// 보안:
//   세션 쿠키로 로그인 여부 확인 후 user_id를 FastAPI에 전달
// ============================================================

const express = require("express");
const router = express.Router();
const { findSession, createComment, getComments, deleteComment } = require("../database");

// ── 댓글 작성 (POST /comment) ────────────────────────────────────────────────

router.post("/comment", async (req, res) => {
    const { sessionId } = req.cookies;

    if (!sessionId) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    const session = await findSession(sessionId);
    if (!session) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    const { feed_id, content } = req.body;

    if (!feed_id || !content?.trim()) {
        return res.status(400).json({ success: false, message: "feed_id와 댓글 내용이 필요합니다." });
    }

    try {
        const result = await createComment({
            feed_id,
            user_id: session.user_id,
            content: content.trim(),
        });
        return res.json(result);
    } catch (error) {
        console.error("댓글 작성 오류:", error);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
});

// ── 댓글 목록 조회 (GET /comment/:feed_id) ───────────────────────────────────

router.get("/comment/:feed_id", async (req, res) => {
    const { sessionId } = req.cookies;

    if (!sessionId) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    const session = await findSession(sessionId);
    if (!session) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    try {
        const comments = await getComments(req.params.feed_id);
        return res.json({ success: true, comments });
    } catch (error) {
        console.error("댓글 목록 조회 오류:", error);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
});

// ── 댓글 삭제 (DELETE /comment/:comment_id) ──────────────────────────────────

router.delete("/comment/:comment_id", async (req, res) => {
    const { sessionId } = req.cookies;

    if (!sessionId) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    const session = await findSession(sessionId);
    if (!session) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    try {
        const result = await deleteComment(req.params.comment_id, session.user_id);
        return res.json(result);
    } catch (error) {
        console.error("댓글 삭제 오류:", error);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
});

module.exports = router;
