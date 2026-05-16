// ============================================================
// requireAdmin 미들웨어
// ============================================================
// [추가 2026-05-16] 관리자 전용 라우트 보호.
//
// 배경:
//   5/12 frontend 머지에서 관리자 판별을 프론트 LoginPage 가
//   id === "admin" 으로만 하고 있었음 (백엔드에 관리자 컬럼 없음).
//   → 관리자 전용 백엔드(notice 작성/수정/삭제, report 처리)를
//     프론트 신뢰만으로 두면, 일반 유저가 직접 API 를 호출해
//     공지를 작성하거나 남의 게시물을 제재할 수 있음 (권한 우회).
//
// 동작:
//   requireAuth 다음에 체이닝해서 사용한다.
//     router.post("/notice", requireAuth, requireAdmin, handler)
//   requireAuth 가 req.user 를 주입한 뒤,
//   requireAdmin 이 req.user.login_id === "admin" 인지 확인.
//   아니면 403 Forbidden.
//
// 한계 / 향후:
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
