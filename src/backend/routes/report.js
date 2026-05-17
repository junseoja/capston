// ============================================================
// 게시글 신고(Report) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST   /report             : 신고 접수   (로그인 — 일반 사용자)
//   GET    /report             : 신고 목록   (로그인 + 관리자)
//   PATCH  /report/process     : 게시물 제재 (로그인 + 관리자)
//   GET    /report/:report_id  : 신고 상세   (로그인 + 관리자)
//
// 역할:
//   - 신고 접수: FeedPage 🚩 → 세션의 reporter_user_id 주입 후 FastAPI 중계
//   - 관리: AdminPage → requireAdmin 검증 후 FastAPI 중계
//
// 인증 체이닝:
//   - POST /report           : requireAuth (로그인 유저 누구나 신고 가능)
//   - GET / PATCH (관리)      : requireAuth → requireAdmin
//
// 라우트 순서 주의:
//   PATCH /report/process 를 GET /report/:report_id 보다 먼저 선언.
//   (둘은 HTTP 메서드가 달라 충돌은 없지만, 향후 PATCH /report/:id 가
//    추가될 경우를 대비해 고정 경로(/process)를 파라미터 경로보다 위에 둠)
//
// 에러 처리: try/catch 후 next(error)로 app.js 글로벌 에러 핸들러에 위임.
// ============================================================

const express = require("express");
const router = express.Router();
const {
    createReport,
    listReports,
    getReport,
    processReport,
} = require("../database");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// ── 신고 접수 (POST /report) — 로그인 ────────────────────────────────────────
router.post("/report", requireAuth, async (req, res, next) => {
    try {
        const { feed_id, report_category, report_detail } = req.body;

        if (!feed_id || !report_category) {
            return res.status(400).json({
                success: false,
                message: "feed_id, report_category 는 필수입니다.",
            });
        }

        // target_user_id는 클라이언트에서 받지 않는다.
        // FastAPI가 feed_id 기준으로 실제 작성자를 조회해 신고 대상자를 확정한다.
        // reporter_user_id 는 클라이언트 값을 믿지 않고 세션에서 주입
        // (남의 이름으로 신고하는 위조 방지)
        const result = await createReport({
            feed_id,
            reporter_user_id: req.user.user_id,
            report_category,
            report_detail: report_detail || null,
        });

        return res.json({ success: true, report_id: result.report_id });
    } catch (error) {
        return next(error);
    }
});

// ── 신고 목록 (GET /report) — 관리자 ─────────────────────────────────────────
router.get("/report", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const result = await listReports({
            status: req.query.status || "pending", // pending | completed
            limit: parseInt(req.query.limit, 10) || 100,
        });
        return res.json({ success: true, reports: result.reports || [] });
    } catch (error) {
        return next(error);
    }
});

// ── 게시물 제재 처리 (PATCH /report/process) — 관리자 ────────────────────────
// 고정 경로라 /report/:report_id 보다 위에 선언
router.patch(
    "/report/process",
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
        try {
            const { feed_id, admin_comment } = req.body;

            if (!feed_id || !admin_comment) {
                return res.status(400).json({
                    success: false,
                    message: "feed_id 와 admin_comment 는 필수입니다.",
                });
            }

            // processed_by 는 세션의 관리자 user_id 로 주입
            const result = await processReport({
                feed_id,
                admin_comment,
                processed_by: req.user.user_id,
            });

            return res.json({
                success: true,
                processed_count: result.processed_count,
            });
        } catch (error) {
            return next(error);
        }
    },
);

// ── 신고 상세 (GET /report/:report_id) — 관리자 ──────────────────────────────
router.get(
    "/report/:report_id",
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
        try {
            const result = await getReport(req.params.report_id);
            return res.json({ success: true, report: result.report });
        } catch (error) {
            return next(error);
        }
    },
);

module.exports = router;
