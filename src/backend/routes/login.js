// 인증 관련 라우터
// - POST /signup          : 회원가입
// - POST /login           : 로그인 (세션 쿠키 발급)
// - GET  /me              : 현재 로그인 유저 정보 조회 (마이페이지용)
// - POST /logout          : 로그아웃 (세션 쿠키 삭제)
// - GET  /check-duplicate : 아이디/닉네임 중복체크

const express = require("express");
const router = express.Router();
const { findUser, createUser } = require("../database");
const { v4: uuidv4 } = require("uuid"); // 고유한 세션 ID 생성용

// 세션 저장소: 메모리 Map { sessionId(UUID) → { id: 로그인ID } }
// 주의: 서버 재시작 시 모든 세션 소멸 → 추후 Redis/DB 저장으로 교체 권장
const sessions = new Map();

// ── POST /signup ────────────────────────────────────────────────────────────
// 회원가입: 입력값 검증 → 아이디 중복 확인 → FastAPI를 통해 DB 저장
router.post("/signup", async (req, res) => {
    const { id, password, nickname, birth, gender, email } = req.body;

    // 필수값 누락 확인
    if (!id || !password) {
        return res.status(400).json({ success: false, message: "아이디와 비밀번호를 입력하세요." });
    }

    // 아이디 중복 확인 (FastAPI → MySQL SELECT)
    const existing = await findUser(id);
    if (existing) {
        return res.status(409).json({ success: false, message: "이미 존재하는 아이디입니다." });
    }

    // 생년월일 포맷 변환: { year, month, day } → "YYYY-MM-DD" (MySQL DATE 타입에 맞게)
    const birth_date = `${birth.year}-${String(birth.month).padStart(2, "0")}-${String(birth.day).padStart(2, "0")}`;

    const result = await createUser({ login_id: id, password, nickname, birth_date, gender, email });
    return res.json(result);
});

// ── POST /login ─────────────────────────────────────────────────────────────
// 로그인: DB 조회 → 비밀번호 확인 → 세션 생성 → 쿠키 발급
router.post("/login", async (req, res) => {
    const { id, password } = req.body;

    // DB에서 유저 조회 (없으면 null)
    const user = await findUser(id);

    if (!user) {
        return res.status(401).json({ success: false, message: "존재하지 않는 아이디입니다." });
    }
    // 비밀번호 평문 비교 (보안 주의: 추후 bcrypt 해싱 적용 강력 권장)
    if (user.password !== password) {
        return res.status(401).json({ success: false, message: "비밀번호가 틀렸습니다." });
    }

    // UUID로 고유한 세션 ID 생성 → 메모리 Map에 저장
    const sessionId = uuidv4();
    sessions.set(sessionId, { id: user.login_id });

    // HttpOnly 쿠키로 sessionId 발급 → JS 접근 불가 (XSS 방어)
    res.cookie("sessionId", sessionId, {
        httpOnly: true,               // 브라우저 JS에서 접근 불가
        secure: false,                // 개발환경: false / 운영환경(HTTPS): true 권장
        sameSite: "lax",              // CSRF 방어 (외부 사이트 요청 시 쿠키 미포함)
        maxAge: 1000 * 60 * 60 * 24, // 쿠키 유효시간: 24시간 (밀리초 단위)
    });

    return res.json({ success: true, message: "로그인 성공" });
});

// ── GET /me ─────────────────────────────────────────────────────────────────
// 현재 로그인한 유저의 상세 정보 반환 (마이페이지에서 사용)
// 세션 쿠키 검증 → DB에서 최신 유저 정보 조회 후 반환
router.get("/me", async (req, res) => {
    const { sessionId } = req.cookies;

    // 쿠키 없거나 유효하지 않은 세션이면 인증 실패
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ success: false, message: "로그인되지 않았습니다." });
    }

    // 세션에서 login_id 추출 → FastAPI를 통해 DB에서 최신 유저 정보 조회
    const { id } = sessions.get(sessionId);
    const user = await findUser(id);

    if (!user) {
        return res.status(401).json({ success: false, message: "유저 정보를 찾을 수 없습니다." });
    }

    // 필요한 필드만 선택해서 반환 (password 등 민감 정보 제외)
    return res.json({
        success: true,
        user: {
            user_id: user.user_id,
            login_id: user.login_id,
            nickname: user.nickname,
            email: user.email,
            gender: user.gender,
            birth_date: user.birth_date,
            profile_img: user.profile_img,
        }
    });
});

// ── POST /logout ─────────────────────────────────────────────────────────────
// 로그아웃: 서버 세션 삭제 + 클라이언트 쿠키 삭제
router.post("/logout", (req, res) => {
    const { sessionId } = req.cookies;

    // 서버 메모리에서 세션 제거
    if (sessionId) sessions.delete(sessionId);

    // 브라우저의 세션 쿠키 삭제 (발급 시와 동일한 옵션 사용해야 정상 삭제)
    res.clearCookie("sessionId", { httpOnly: true, secure: false, sameSite: "lax" });

    return res.json({ success: true, message: "로그아웃 완료" });
});

// ── GET /check-duplicate ─────────────────────────────────────────────────────
// 아이디/닉네임 중복체크
// query params: field=userId|nickname, value=확인할값
// 주의: 닉네임 중복체크는 FastAPI 미구현 → 항상 isDuplicate: false 반환
router.get("/check-duplicate", async (req, res) => {
    const { field, value } = req.query;

    if (field === "userId") {
        // DB에서 아이디 조회 → 있으면 중복
        const user = await findUser(value);
        return res.json({ isDuplicate: !!user });
    }

    // 닉네임 중복체크: 추후 FastAPI에 /user/check-nickname 엔드포인트 추가 필요
    return res.json({ isDuplicate: false });
});

// sessions는 routine.js에서 세션 인증에 사용하므로 함께 export
module.exports = { router, sessions };
