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
const { createRoutine, getRoutines, deleteRoutine } = require("../database");
const requireAuth = require("../middleware/requireAuth");

// ── 루틴 생성 (POST /routine) ─────────────────────────────────────────────────

/**
 * POST /routine
 *
 * 세션에서 user_id를 추출하여 req.body와 함께 FastAPI POST /routine/ 호출
 * RoutinePage.jsx에서 "저장하기" 버튼 클릭 시 호출됨
 *
 * body: { title, category, time_slot, routine_mode, goal, repeat_cycle, description }
 * user_id는 requireAuth가 req.user에 실어 주므로 클라이언트에서 전달하지 않음
 */
router.post("/routine", requireAuth, async (req, res, next) => {
    try {
        const result = await createRoutine({ user_id: req.user.user_id, ...req.body });
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

// ── 루틴 목록 조회 (GET /routine) ────────────────────────────────────────────

/**
 * GET /routine
 *
 * 세션에서 user_id를 추출하여 FastAPI GET /routine/{user_id} 호출
 * 최신 생성 순으로 정렬된 루틴 배열을 반환
 * App.jsx, RoutinePage.jsx 양쪽에서 호출됨
 *
 * 반환: { success: true, routines: [...] }
 */
router.get("/routine", requireAuth, async (req, res, next) => {
    try {
        const routines = await getRoutines(req.user.user_id);
        return res.json({ success: true, routines });
    } catch (error) {
        return next(error);
    }
});

// ── 루틴 삭제 (DELETE /routine/:routine_id) ───────────────────────────────────

/**
 * DELETE /routine/:routine_id
 *
 * [보안] 세션 인증 + 본인 소유 루틴만 삭제 가능 (FastAPI에서 WHERE 조건으로 검증)
 *
 * 처리 흐름:
 *   1. requireAuth: 세션 쿠키 확인 → 미로그인 시 401
 *   2. req.user.user_id 를 FastAPI에 함께 전달
 *   3. FastAPI DELETE /routine/{routine_id}?user_id={user_id}
 *      → WHERE routine_id=? AND user_id=? 조건으로 타인 루틴 삭제 차단
 */
router.delete("/routine/:routine_id", requireAuth, async (req, res, next) => {
    try {
        const { routine_id } = req.params;
        const result = await deleteRoutine(routine_id, req.user.user_id);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
