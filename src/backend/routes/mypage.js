// ============================================================
// 마이페이지(MyPage) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   GET /mypage         : 유저 + summary + gallery 통합 조회
//   GET /mypage/summary : 핵심 지표 조회
//   GET /mypage/gallery : 내 인증 갤러리 조회
// ============================================================

const express = require("express");
const router = express.Router();
const { getMypageOverview, getMypageSummary, getMypageGallery } = require("../database");
const requireAuth = require("../middleware/requireAuth");

router.get("/mypage", requireAuth, async (req, res, next) => {
    try {
        // 화면 단위 통합 API: user/summary/gallery를 한 번에 가져온다.
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
