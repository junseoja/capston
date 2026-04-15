// ============================================================
// 완료 이력(Completion) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   GET /completion/history : 내 루틴 완료 이력 조회 (세션 인증)
//
// 보안:
//   세션 쿠키로 로그인 여부 확인 후 user_id를 FastAPI에 전달
// ============================================================

const express = require("express");
const router = express.Router();
const { findSession, getCompletionHistory } = require("../database");

// ── 완료 이력 조회 (GET /completion/history) ──────────────────────────────────

/**
 * GET /completion/history
 *
 * 처리 흐름:
 *   1. 세션 쿠키 확인 → 미로그인 시 401
 *   2. 세션에서 user_id 추출
 *   3. FastAPI GET /completion/history/{user_id} 호출
 *   4. 최근 20건의 완료 이력 반환
 */
router.get("/completion/history", async (req, res) => {
    const { sessionId } = req.cookies;

    if (!sessionId) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    const session = await findSession(sessionId);
    if (!session) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    try {
        const history = await getCompletionHistory(session.user_id);
        return res.json({ success: true, history });
    } catch (error) {
        console.error("완료 이력 조회 오류:", error);
        return res.status(500).json({ success: false, message: "서버 오류" });
    }
});

module.exports = router;
