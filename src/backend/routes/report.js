// ============================================================
// 게시글 신고(Report) 관련 Express 라우터
// ============================================================
// 작성일: 2026-05-16
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
// 에러 처리: feed.js 패턴 — try/catch 후 next(error).
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

        // [수정 2026-05-17] target_user_id 는 더 이상 클라이언트 body 에서 받지 않는다.
        // 원인:
        //   기존 구조는 브라우저가 보낸 target_user_id 를 그대로 FastAPI 에 전달했다.
        //   이 경우 악의적 클라이언트가 다른 user_id 로 바꿔 보내면
        //   신고 대상자가 실제 게시글 작성자와 어긋날 수 있었다.
        // 이유:
        //   feed_id 만 신뢰 경계 밖에서 받고, 실제 작성자는 FastAPI 가
        //   DB 의 feeds.user_id 를 조회해 확정해야 신고 데이터 정합성이 보장된다.
        // 작동원리:
        //   Express 는 reporter_user_id 만 세션에서 주입하고,
        //   FastAPI report.py 의 create_report() 가 feed_id 기준으로
        //   target_user_id 를 재조회한 뒤 reports 테이블에 저장한다.
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
