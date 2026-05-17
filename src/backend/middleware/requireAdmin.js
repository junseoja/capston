// ============================================================
// requireAdmin 미들웨어
// ============================================================
// 동작:
//   requireAuth 다음에 체이닝해서 사용한다.
//     router.post("/notice", requireAuth, requireAdmin, handler)
//   requireAuth 가 req.user 를 주입한 뒤,
//   requireAdmin 이 req.user.login_id === "admin" 인지 확인.
//   아니면 403 Forbidden.
//
// 현재 정책:
//   현재는 login_id 문자열 "admin" 으로 단순 판별.
//   추후 users 테이블에 role 컬럼 추가 시 이 한 곳만 수정하면 됨
//   (req.user.role === "admin" 등). 판별 로직을 미들웨어로 모은 이유.
//
// 사용 전제:
//   반드시 requireAuth 뒤에 와야 함 (req.user 가 먼저 주입돼야 하므로).
//   순서가 바뀌면 req.user 가 undefined → 항상 403.
// ============================================================

// 관리자로 인정할 login_id. 추후 정책 변경 시 여기만 수정.
const ADMIN_LOGIN_ID = "admin";

function requireAdmin(req, res, next) {
    // requireAuth 가 앞에서 req.user 를 주입했어야 한다.
    // 방어적으로 한 번 더 확인 (미들웨어 순서 실수 대비).
    if (!req.user) {
        return res
            .status(401)
            .json({ success: false, message: "로그인이 필요합니다." });
    }

    if (req.user.login_id !== ADMIN_LOGIN_ID) {
        return res
            .status(403)
            .json({ success: false, message: "관리자 권한이 필요합니다." });
    }

    return next();
}

module.exports = requireAdmin;
