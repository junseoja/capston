// ============================================================
// 완료 이력(Completion) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST /completion                  : 루틴 완료 기록 생성 (세션 인증)
//   GET  /completion/today            : 오늘 완료한 루틴 목록 조회 (세션 인증)
//   GET  /completion/history          : 내 루틴 완료 이력 조회 (세션 인증)
//   DELETE /completion/:completion_id : 완료 기록 삭제/취소 (세션 인증)
//
// 보안:
//   세션 쿠키로 로그인 여부 확인 후 user_id를 FastAPI에 전달
//
// [리팩터링 #12] 세션 인증 4줄 블록을 requireAuth 미들웨어로 대체
// ============================================================

const express = require("express");
const router = express.Router();
const {
    createCompletion,
    getTodayCompletions,
    getCompletionHistory,
    deleteCompletion,
} = require("../database");
const requireAuth = require("../middleware/requireAuth");

// ── 완료 기록 생성 (POST /completion) ──────────────────────────────────────────

/**
 * POST /completion
 *
 * 프론트 메모리 상태에만 머물던 완료 처리를 DB에 저장.
 * 처리 흐름:
 *   1. requireAuth: 세션 확인 후 req.user 주입
 *   2. routine_id, proof_text를 FastAPI로 전달하여 완료 기록 생성
 *   3. 생성된 completion_id 반환
 */
// [리팩터링 #1+#3] next(err)로 글로벌 핸들러에 위임
router.post("/completion", requireAuth, async (req, res, next) => {
    const { routine_id, proof_text = "" } = req.body;

    if (!routine_id) {
        return res.status(400).json({ success: false, message: "routine_id가 필요합니다." });
    }

    try {
        const result = await createCompletion({
            routine_id,
            user_id: req.user.user_id,
            proof_text,
        });
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

// ── 오늘 완료 기록 조회 (GET /completion/today) ───────────────────────────────

/**
 * GET /completion/today
 *
 * 새로고침 후에도 오늘 완료 상태를 복원할 수 있도록
 * 세션의 user_id 기준으로 오늘 완료한 기록을 조회.
 */
router.get("/completion/today", requireAuth, async (req, res, next) => {
    try {
        const completions = await getTodayCompletions(req.user.user_id);
        return res.json({ success: true, completions });
    } catch (error) {
        return next(error);
    }
});

// ── 완료 이력 조회 (GET /completion/history) ──────────────────────────────────

/**
 * GET /completion/history
 *
 * 처리 흐름:
 *   1. requireAuth: 세션 확인 후 req.user 주입
 *   2. FastAPI GET /completion/history/{user_id} 호출
 *   3. 최근 20건의 완료 이력 반환
 */
router.get("/completion/history", requireAuth, async (req, res, next) => {
    try {
        const history = await getCompletionHistory(req.user.user_id);
        return res.json({ success: true, history });
    } catch (error) {
        return next(error);
    }
});

// ── 완료 기록 삭제/취소 (DELETE /completion/:completion_id) ────────────────────

/**
 * DELETE /completion/:completion_id
 *
 * completion_id만 넘기면 requireAuth가 세션의 user_id를 함께 붙여서
 * FastAPI에 전달하므로, 클라이언트가 임의 user_id를 조작할 수 없음.
 */
router.delete("/completion/:completion_id", requireAuth, async (req, res, next) => {
    try {
        const result = await deleteCompletion(req.params.completion_id, req.user.user_id);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
