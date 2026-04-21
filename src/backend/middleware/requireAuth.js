// ============================================================
// requireAuth 미들웨어
// ============================================================
// 해결하는 에러 (README 4월 18일 #12 — 세션 인증 코드 반복):
//   routine/feed/like/comment/completion 라우터가 각자
//   "쿠키 꺼내기 → findSession → 401 반환" 4줄을 복붙해서
//   보호 라우트마다 동일 로직이 6군데 이상 중복되던 문제.
//
//   → 미들웨어 한 곳으로 모아 req.user 에 세션 정보를 주입.
//     라우터는 req.user.user_id 만 꺼내 쓰면 됨.
//
// 동작:
//   1) 쿠키에서 sessionId 추출 (없으면 401)
//   2) findSession()으로 DB 세션 조회 (만료/없음이면 401)
//   3) req.user = { user_id, login_id, nickname, ... } 주입 후 next()
//
// 실패 시 응답 포맷은 기존 라우터가 반환하던 것과 동일하게 유지
// (프론트 쪽 에러 처리 코드를 건드리지 않기 위함)
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
        // findSession(FastAPI 호출) 자체가 throw하는 경우 — 여기서 잡지 않으면
        // 기존 라우터들에 try/catch가 없는 곳(routine.js 등)에서 Express 기본
        // 에러 핸들러가 HTML 500을 내려 주던 문제(#3)를 부분적으로 완화.
        console.error("세션 조회 오류:", error);
        return res.status(500).json({ success: false, message: "세션 확인 중 오류가 발생했습니다." });
    }
}

module.exports = requireAuth;
