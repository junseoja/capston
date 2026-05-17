// ============================================================
// requireAuth 미들웨어
// ============================================================
// 동작:
//   1) 쿠키에서 sessionId 추출 (없으면 401)
//   2) findSession()으로 DB 세션 조회 (만료/없음이면 401)
//   3) req.user = { user_id, login_id, nickname, ... } 주입 후 next()
//
// 보호 라우터는 클라이언트가 보낸 user_id를 믿지 않고 req.user.user_id를 사용한다.
// ============================================================

const { findSession } = require("../database");

async function requireAuth(req, res, next) {
    const { sessionId } = req.cookies;

    if (!sessionId) {
        return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
    }

    try {
        const session = await findSession(sessionId);
        if (!session) {
            return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
        }
        // 라우터가 세션에서 파생된 user_id 등을 쉽게 쓸 수 있도록 req에 싣음
        req.user = session;
        return next();
    } catch (error) {
        console.error("세션 조회 오류:", error);
        return res.status(500).json({ success: false, message: "세션 확인 중 오류가 발생했습니다." });
    }
}

module.exports = requireAuth;
