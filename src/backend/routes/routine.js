// 루틴 CRUD 라우터
// - POST   /routine          : 루틴 생성
// - GET    /routine          : 내 루틴 목록 조회
// - DELETE /routine/:routine_id : 루틴 삭제
//
// 모든 엔드포인트는 세션 쿠키로 로그인 인증 후 처리

const express = require("express");
const router = express.Router();
const { findUser, createRoutine, getRoutines, deleteRoutine } = require("../database");
const { sessions } = require("./login"); // 로그인 라우터의 세션 Map 공유

// ── 세션 인증 공통 로직 ──────────────────────────────────────────────────────
// 쿠키의 sessionId로 로그인 상태 확인 후 해당 유저 정보 반환
// 비로그인 시 401 응답
async function getSessionUser(req, res) {
    const { sessionId } = req.cookies;

    if (!sessionId || !sessions.has(sessionId)) {
        res.status(401).json({ success: false, message: "로그인이 필요합니다." });
        return null;
    }

    const { id } = sessions.get(sessionId);    // 세션에서 login_id 추출
    const user = await findUser(id);            // FastAPI → DB에서 유저 정보 조회
    return user;
}

// ── POST /routine ────────────────────────────────────────────────────────────
// 루틴 생성: 세션에서 user_id 조회 → FastAPI를 통해 routines 테이블에 INSERT
// body: { title, category, time_slot, routine_mode, goal, repeat_cycle, description }
router.post("/routine", async (req, res) => {
    const user = await getSessionUser(req, res);
    if (!user) return; // 비로그인이면 이미 401 응답됨

    // user_id를 자동으로 추가하여 루틴 생성 (클라이언트에서 user_id 전달 불필요)
    const result = await createRoutine({
        user_id: user.user_id, // DB의 users.user_id (Auto Increment PK)
        ...req.body            // title, category, time_slot 등 나머지 필드
    });
    return res.json(result);
});

// ── GET /routine ─────────────────────────────────────────────────────────────
// 내 루틴 목록 조회: 로그인한 유저의 모든 루틴을 생성일 내림차순으로 반환
router.get("/routine", async (req, res) => {
    const user = await getSessionUser(req, res);
    if (!user) return;

    const routines = await getRoutines(user.user_id); // FastAPI → DB SELECT
    return res.json({ success: true, routines });
});

// ── DELETE /routine/:routine_id ───────────────────────────────────────────────
// 루틴 삭제: routine_id로 특정 루틴 삭제
// 주의: 현재 본인 루틴 여부 확인 없음 → 추후 권한 검사 추가 권장
router.delete("/routine/:routine_id", async (req, res) => {
    const { routine_id } = req.params;
    const result = await deleteRoutine(routine_id); // FastAPI → DB DELETE
    return res.json(result);
});

module.exports = router;
