const express = require("express");
const router = express.Router();
const {
    findSession,
    createRoutine,
    getRoutines,
    deleteRoutine,
} = require("../database"); // database.js에서 함수 가져오기

// ───── 루틴 생성 ─────

/**
 * POST /routine
 * 루틴 생성
 * - 쿠키 세션으로 로그인 여부 확인
 * - 세션에서 user_id 가져와서 루틴 생성
 */
router.post("/routine", async (req, res) => {
    const { sessionId } = req.cookies;

    // 쿠키에 세션 ID 없으면 미로그인
    if (!sessionId) {
        return res.status(401).json({
            success: false,
            message: "로그인이 필요합니다."
        });
    }

    // DB에서 세션 조회
    const session = await findSession(sessionId);
    if (!session) {
        return res.status(401).json({
            success: false,
            message: "로그인이 필요합니다."
        });
    }

    // 세션의 user_id로 루틴 생성
    const result = await createRoutine({
        user_id: session.user_id, // 세션에서 가져온 user_id
        ...req.body               // 프론트에서 받은 루틴 데이터
    });
    return res.json(result);
});

// ───── 루틴 조회 ─────

/**
 * GET /routine
 * 로그인한 유저의 루틴 목록 조회
 * - 쿠키 세션으로 로그인 여부 확인
 * - 세션의 user_id로 루틴 목록 조회
 */
router.get("/routine", async (req, res) => {
    const { sessionId } = req.cookies;

    // 쿠키에 세션 ID 없으면 미로그인
    if (!sessionId) {
        return res.status(401).json({
            success: false,
            message: "로그인이 필요합니다."
        });
    }

    // DB에서 세션 조회
    const session = await findSession(sessionId);
    if (!session) {
        return res.status(401).json({
            success: false,
            message: "로그인이 필요합니다."
        });
    }

    // 세션의 user_id로 루틴 목록 조회
    const routines = await getRoutines(session.user_id);
    return res.json({ success: true, routines });
});

// ───── 루틴 삭제 ─────

/**
 * DELETE /routine/:routine_id
 * 루틴 삭제
 * - URL 파라미터로 routine_id 받아서 삭제
 */
router.delete("/routine/:routine_id", async (req, res) => {
    const { routine_id } = req.params;

    const result = await deleteRoutine(routine_id);
    return res.json(result);
});

module.exports = router;