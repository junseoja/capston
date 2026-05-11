// ============================================================
// 통계(Stats) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   GET /stats?mode=weekly|monthly&start=YYYY-MM-DD&end=YYYY-MM-DD
//
// [추가 2026-05-10]
// 이유:
//   StatsPage.jsx 의 mock 데이터를 실제 routine_completions 기반 통계로 바꾸되,
//   사용자 인증과 user_id 주입은 Express requireAuth 로 일관되게 처리하기 위함.
// ============================================================

const express = require("express");
const router = express.Router();
const { getStats } = require("../database");
const requireAuth = require("../middleware/requireAuth");

const STATS_CACHE_TTL_MS = Number(process.env.STATS_CACHE_TTL_MS || 60000);
const statsCache = new Map();

router.get("/stats", requireAuth, async (req, res, next) => {
    try {
        // [추가 2026-05-10] /stats 짧은 TTL 메모리 캐시.
        //
        // 이유:
        //   통계 API는 routines/routine_completions 를 여러 번 집계하므로 DB 비용이 상대적으로 크다.
        //   같은 사용자가 같은 기간의 weekly/monthly 통계를 반복 조회할 때
        //   Express → FastAPI → MySQL 왕복을 줄이기 위해 짧은 TTL 캐시를 둔다.
        //
        // 동작:
        //   user_id + mode + start + end 를 키로 60초 기본 캐시한다.
        //   완료/취소 직후 최대 TTL 만큼 늦게 반영될 수 있으므로 짧게 유지한다.
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
