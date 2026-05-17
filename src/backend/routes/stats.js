// ============================================================
// 통계(Stats) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   GET /stats?mode=weekly|monthly&start=YYYY-MM-DD&end=YYYY-MM-DD
//
// 사용자 인증과 user_id 주입은 Express requireAuth로 처리하고,
// 통계 계산은 FastAPI의 routine_completions 기반 집계에 위임한다.
// ============================================================

const express = require("express");
const router = express.Router();
const { getStats } = require("../database");
const requireAuth = require("../middleware/requireAuth");

const STATS_CACHE_TTL_MS = Number(process.env.STATS_CACHE_TTL_MS || 60000);
const statsCache = new Map();

router.get("/stats", requireAuth, async (req, res, next) => {
    try {
        // user_id + mode + start + end를 키로 짧게 캐시해 반복 집계 비용을 줄인다.
        // 완료/취소 직후 반영 지연이 생길 수 있어 기본 TTL은 짧게 유지한다.
        const cacheKey = [
            req.user.user_id,
            req.query.mode || "weekly",
            req.query.start || "",
            req.query.end || "",
        ].join("|");

        const cached = statsCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return res.json({ success: true, stats: cached.stats, cached: true });
        }

        const stats = await getStats(req.user.user_id, {
            mode: req.query.mode,
            start: req.query.start,
            end: req.query.end,
        });

        statsCache.set(cacheKey, {
            stats,
            expiresAt: Date.now() + STATS_CACHE_TTL_MS,
        });

        return res.json({ success: true, stats });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
