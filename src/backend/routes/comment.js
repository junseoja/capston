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
//
// [리팩터링 #12] 세션 인증 4줄 블록을 requireAuth 미들웨어로 대체
// ============================================================

const express = require("express");
const router = express.Router();
const { createComment, getComments, deleteComment } = require("../database");
const requireAuth = require("../middleware/requireAuth");

// ── 댓글 작성 (POST /comment) ────────────────────────────────────────────────

/**
 * POST /comment
 *
 * body: { feed_id, content }
 * user_id는 requireAuth가 req.user.user_id 에 실어 주므로 클라이언트 전달 불필요
 *
 * 처리 흐름:
 *   1. requireAuth: 세션 확인 → user_id 주입
 *   2. feed_id, content 유효성 검사
 *   3. FastAPI POST /comment/ 호출 → DB에 댓글 레코드 생성
 *
 * 반환: { success: true, comment_id: "uuid-v7-..." }
 */
// [리팩터링 #1+#3] next(err)로 글로벌 핸들러에 위임
router.post("/comment", requireAuth, async (req, res, next) => {
    const { feed_id, content } = req.body;

    if (!feed_id || !content?.trim()) {
        return res.status(400).json({ success: false, message: "feed_id와 댓글 내용이 필요합니다." });
    }

    try {
        const result = await createComment({
            feed_id,
            user_id: req.user.user_id,
            content: content.trim(),
        });
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

// ── 댓글 목록 조회 (GET /comment/:feed_id) ───────────────────────────────────

/**
 * GET /comment/:feed_id
 *
 * 특정 피드의 댓글 목록을 작성 순서대로 조회
 * FastAPI GET /comment/{feed_id} 호출 → 닉네임 포함된 댓글 배열 반환
 *
 * 반환: { success: true, comments: [...] }
 */
router.get("/comment/:feed_id", requireAuth, async (req, res, next) => {
    try {
        const comments = await getComments(req.params.feed_id);
        return res.json({ success: true, comments });
    } catch (error) {
        return next(error);
    }
});

// ── 댓글 삭제 (DELETE /comment/:comment_id) ──────────────────────────────────

/**
 * DELETE /comment/:comment_id
 *
 * 댓글 삭제 (세션 인증 + 본인 소유 검증)
 * FastAPI DELETE /comment/{comment_id}?user_id={user_id} 호출
 * → FastAPI에서 WHERE comment_id=? AND user_id=? 조건으로 본인 댓글만 삭제
 *
 * 반환: { success: true } 또는 { success: false, message: "..." }
 */
router.delete("/comment/:comment_id", requireAuth, async (req, res, next) => {
    try {
        const result = await deleteComment(req.params.comment_id, req.user.user_id);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
