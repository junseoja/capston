// ============================================================
// 공지사항(Notice) 관련 Express 라우터
// ============================================================
// 작성일: 2026-05-16
// 담당 라우트:
//   POST   /notice            : 공지 작성   (로그인 + 관리자)
//   GET    /notice            : 공지 목록   (로그인)
//   GET    /notice/:notice_id : 공지 상세   (로그인)
//   PATCH  /notice/:notice_id : 공지 수정   (로그인 + 관리자)
//   DELETE /notice/:notice_id : 공지 삭제   (로그인 + 관리자, Soft Delete)
//
// 역할:
//   React(AdminPage/NoticeList) 의 요청을 받아 세션/권한을 검증한 뒤,
//   database.js 헬퍼를 통해 FastAPI(/notice) 로 중계.
//
// 인증 체이닝:
//   - 조회(GET): requireAuth 만 (로그인한 유저 누구나 공지 조회 가능)
//   - 변경(POST/PATCH/DELETE): requireAuth → requireAdmin
//     (requireAuth 가 req.user 주입 → requireAdmin 이 login_id==="admin" 검증)
//
// 에러 처리:
//   기존 feed.js 패턴과 동일 — try/catch 후 next(error) 로
//   글로벌 에러 핸들러(#3)에 위임. fetchJson 이 FastApiError 표준화.
// ============================================================

const express = require("express");
const router = express.Router();
const {
    createNotice,
    listNotices,
    getNotice,
    updateNotice,
    deleteNotice,
} = require("../database");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// ── 공지 작성 (POST /notice) — 관리자 ────────────────────────────────────────
router.post("/notice", requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { category, title, content, post_date } = req.body;

        // 기본 입력 검증 (FastAPI 가 한 번 더 검증하지만 400 을 빨리 돌려줌)
        if (!category || !title || !content || !post_date) {
            return res.status(400).json({
                success: false,
                message: "category, title, content, post_date 는 필수입니다.",
            });
        }

        // created_by 는 클라이언트 값을 믿지 않고 세션 user_id 로 주입
        const result = await createNotice({
            category,
            title,
            content,
            post_date,
            created_by: req.user.user_id,
        });

        return res.json({ success: true, notice_id: result.notice_id });
    } catch (error) {
        return next(error);
    }
});

// ── 공지 목록 (GET /notice) — 로그인 ─────────────────────────────────────────
router.get("/notice", requireAuth, async (req, res, next) => {
    try {
        const result = await listNotices({
            category: req.query.category, // 없으면 undefined → 전체
            limit: parseInt(req.query.limit, 10) || 100,
        });
        return res.json({ success: true, notices: result.notices || [] });
    } catch (error) {
        return next(error);
    }
});

// ── 공지 상세 (GET /notice/:notice_id) — 로그인 ──────────────────────────────
router.get("/notice/:notice_id", requireAuth, async (req, res, next) => {
    try {
        const result = await getNotice(req.params.notice_id);
        return res.json({ success: true, notice: result.notice });
    } catch (error) {
        return next(error);
    }
});

// ── 공지 수정 (PATCH /notice/:notice_id) — 관리자 ────────────────────────────
router.patch(
    "/notice/:notice_id",
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
        try {
            const { category, title, content, post_date } = req.body;

            // 모든 필드가 비어있으면 수정할 게 없음 → 400 (FastAPI 도 막지만 선차단)
            if (
                category === undefined &&
                title === undefined &&
                content === undefined &&
                post_date === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message: "수정할 필드를 1개 이상 보내야 합니다.",
                });
            }

            // undefined 가 아닌 필드만 추려서 전달 (부분 수정)
            const patch = {};
            if (category !== undefined) patch.category = category;
            if (title !== undefined) patch.title = title;
            if (content !== undefined) patch.content = content;
            if (post_date !== undefined) patch.post_date = post_date;

            await updateNotice(req.params.notice_id, patch);
            return res.json({ success: true });
        } catch (error) {
            return next(error);
        }
    },
);

// ── 공지 삭제 (DELETE /notice/:notice_id) — 관리자, Soft Delete ──────────────
router.delete(
    "/notice/:notice_id",
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
        try {
            await deleteNotice(req.params.notice_id);
            return res.json({ success: true });
        } catch (error) {
            return next(error);
        }
    },
);

module.exports = router;
