const express = require("express");
const router = express.Router();
const { findUser, createRoutine, getRoutines, deleteRoutine } = require("../database");
const { sessions } = require("./login");

// 루틴 생성
router.post("/routine", async (req, res) => {
    const { sessionId } = req.cookies;
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    // 현재 로그인한 유저 정보 가져오기
    const { id } = sessions.get(sessionId);
    const user = await findUser(id);

    const result = await createRoutine({
        user_id: user.user_id,
        ...req.body
    });
    return res.json(result);
});

// 루틴 조회
router.get("/routine", async (req, res) => {
    const { sessionId } = req.cookies;
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    const { id } = sessions.get(sessionId);
    const user = await findUser(id);

    const routines = await getRoutines(user.user_id);
    return res.json({ success: true, routines });
});

// 루틴 삭제
router.delete("/routine/:routine_id", async (req, res) => {
    const { routine_id } = req.params;
    const result = await deleteRoutine(routine_id);
    return res.json(result);
});

module.exports = router;