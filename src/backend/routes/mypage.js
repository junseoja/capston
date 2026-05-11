// ============================================================
// 마이페이지(MyPage) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   GET /mypage/summary : 핵심 지표 조회
//   GET /mypage/gallery : 내 인증 갤러리 조회
//
// [추가 2026-05-10]
// 이유:
//   프론트 MyPage.jsx 의 mock 데이터를 실제 DB 통계/갤러리 데이터로 전환하기 위해
//   React 가 FastAPI 를 직접 호출하지 않고 기존 인증 구조처럼 Express 를 경유하게 한다.
// ============================================================

const express = require("express");
const router = express.Router();
const { getMypageOverview, getMypageSummary, getMypageGallery } = require("../database");
const requireAuth = require("../middleware/requireAuth");

router.get("/mypage", requireAuth, async (req, res, next) => {
    try {
        // [추가 2026-05-10] 화면 단위 통합 API.
        // 이유: MyPage.jsx 에서 /me, /mypage/summary, /mypage/gallery 를 각각 호출하던
        // 왕복 비용을 줄이고, 한 번의 응답으로 user/summary/gallery 를 모두 받기 위함.
        const limit = parseInt(req.query.gallery_limit, 10) || 9;
        const overview = await getMypageOverview(req.user.user_id, limit);
        return res.json({ success: true, ...overview });
    } catch (error) {
        return next(error);
    }
});

router.get("/mypage/summary", requireAuth, async (req, res, next) => {
    try {
        const summary = await getMypageSummary(req.user.user_id);
        return res.json({ success: true, summary });
    } catch (error) {
        return next(error);
    }
});

router.get("/mypage/gallery", requireAuth, async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 9;
        const result = await getMypageGallery(req.user.user_id, limit);
        return res.json({ success: true, items: result.items || [] });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
