// ============================================================
// 루틴(Routine) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST   /routine           : 루틴 생성 (세션 인증)
//   GET    /routine           : 내 루틴 목록 조회 (세션 인증)
//   DELETE /routine/:id       : 루틴 삭제 (세션 인증 + 본인 소유 검증)
//
// 보안:
//   모든 라우트 세션 쿠키로 로그인 여부 확인
//   DELETE: user_id를 FastAPI에 함께 전달하여 본인 루틴만 삭제 가능하도록 검증
// ============================================================

const express = require("express");
const router = express.Router();
const { findSession, createRoutine, getRoutines, deleteRoutine } = require("../database");

// ── 루틴 생성 (POST /routine) ─────────────────────────────────────────────────

router.post("/routine", async (req, res) => {
    const { sessionId } = req.cookies;
    if (!sessionId) return res.status(401).json({ success: false, message: "로그인이 필요합니다." });

    const session = await findSession(sessionId);
    if (!session) return res.status(401).json({ success: false, message: "로그인이 필요합니다." });

    const result = await createRoutine({ user_id: session.user_id, ...req.body });
    return res.json(result);
});

// ── 루틴 목록 조회 (GET /routine) ────────────────────────────────────────────

router.get("/routine", async (req, res) => {
    const { sessionId } = req.cookies;
    if (!sessionId) return res.status(401).json({ success: false, message: "로그인이 필요합니다." });

    const session = await findSession(sessionId);
    if (!session) return res.status(401).json({ success: false, message: "로그인이 필요합니다." });

    const routines = await getRoutines(session.user_id);
    return res.json({ success: true, routines });
});

// ── 루틴 삭제 (DELETE /routine/:routine_id) ───────────────────────────────────

/**
 * DELETE /routine/:routine_id
 *
 * [보안 개선] 세션 인증 추가 + 본인 소유 루틴만 삭제 가능
 *
 * 처리 흐름:
 *   1. 세션 쿠키 확인 → 미로그인 시 401
 *   2. 세션에서 user_id 추출
 *   3. FastAPI DELETE /routine/{routine_id}?user_id={user_id}
 *      → FastAPI에서 WHERE routine_id=? AND user_id=? 조건으로 삭제
 *      → 다른 유저의 루틴은 WHERE 조건 불일치로 삭제 안됨
 */
router.delete("/routine/:routine_id", async (req, res) => {
    const { sessionId } = req.cookies;

    // 세션 인증 (이전에는 없었던 검증)
    if (!sessionId) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    const session = await findSession(sessionId);
    if (!session) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    const { routine_id } = req.params;

    // user_id를 함께 전달하여 FastAPI에서 소유자 검증
    const result = await deleteRoutine(routine_id, session.user_id);
    return res.json(result);
});

module.exports = router;
