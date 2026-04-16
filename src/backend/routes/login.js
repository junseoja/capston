// ============================================================
// 인증(Auth) 관련 Express 라우터
// ============================================================
// 담당 라우트:
//   POST /signup          : 회원가입 (bcrypt 해싱 후 저장)
//   POST /login           : 로그인 (bcrypt 비교, httpOnly 쿠키 세션 발급)
//   GET  /me              : 현재 로그인 유저 정보 반환
//   POST /logout          : 로그아웃 (세션 DB 삭제 + 쿠키 제거)
//   GET  /check-duplicate : 아이디/닉네임 중복 확인 (회원가입 전)
//
// 보안:
//   - 비밀번호는 bcryptjs로 단방향 해싱 후 DB 저장 (평문 저장 금지)
//   - 세션 ID는 UUID v4로 생성 → httpOnly 쿠키에 저장 (XSS 방어)
// ============================================================

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // 비밀번호 단방향 해싱 라이브러리
const {
    findUser,
    createUser,
    createSession,
    findSession,
    deleteSession,
} = require("../database");
const { v4: uuidv4 } = require("uuid"); // 세션 ID 생성용 UUID v4

const PYTHON_API = process.env.PYTHON_API || "http://localhost:8000"; // FastAPI 서버 주소
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // [추가] 백엔드 기본 이메일 형식 검사
const ALLOWED_GENDERS = ["남", "여", "기타"]; // [추가] DB ENUM과 동일한 허용 성별 목록

// ── 회원가입 (POST /signup) ───────────────────────────────────────────────────

/**
 * POST /signup
 *
 * 처리 흐름:
 *   1. 아이디/비밀번호 필수값 확인
 *   2. 아이디 중복 확인
 *   3. 비밀번호 bcrypt 해싱 (saltRounds=10)
 *   4. 생년월일 "YYYY-MM-DD" 변환
 *   5. FastAPI /user/signup 으로 유저 생성 (해시된 비밀번호 전달)
 */
router.post("/signup", async (req, res) => {
    const { id, password, nickname, birth, gender, email } = req.body;

    if (!id || !password) {
        return res.status(400).json({ success: false, message: "아이디와 비밀번호를 입력하세요." });
    }

    // [추가] 프론트 외의 클라이언트가 잘못된 body를 보내더라도
    // 500이 아닌 400으로 명확히 응답하도록 기본 입력 검증 보강
    if (!nickname || !email || !gender || !birth) {
        return res.status(400).json({ success: false, message: "회원가입 필수값이 누락되었습니다." });
    }

    const birthYear = Number(birth.year);
    const birthMonth = Number(birth.month);
    const birthDay = Number(birth.day);

    if (!Number.isInteger(birthYear) || !Number.isInteger(birthMonth) || !Number.isInteger(birthDay)) {
        return res.status(400).json({ success: false, message: "생년월일 형식이 올바르지 않습니다." });
    }

    const birthDateObject = new Date(birthYear, birthMonth - 1, birthDay);
    const isValidBirthDate =
        birthDateObject.getFullYear() === birthYear &&
        birthDateObject.getMonth() === birthMonth - 1 &&
        birthDateObject.getDate() === birthDay;

    if (!isValidBirthDate) {
        return res.status(400).json({ success: false, message: "유효한 생년월일을 입력하세요." });
    }

    if (!EMAIL_REGEX.test(String(email).trim())) {
        return res.status(400).json({ success: false, message: "올바른 이메일 형식이 아닙니다." });
    }

    if (!ALLOWED_GENDERS.includes(gender)) {
        return res.status(400).json({ success: false, message: "성별 값이 올바르지 않습니다." });
    }

    const existing = await findUser(id);
    if (existing) {
        return res.status(409).json({ success: false, message: "이미 존재하는 아이디입니다." });
    }

    // 비밀번호 해싱 (saltRounds=10: 보안↑ 속도↓ 적절한 균형값)
    // bcrypt.hash()는 내부적으로 랜덤 salt를 생성하여 결합
    const hashedPassword = await bcrypt.hash(password, 10);

    const birth_date = `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;

    const result = await createUser({
        login_id: id,
        password: hashedPassword, // 해시된 비밀번호만 DB에 저장 (원본 비밀번호는 폐기)
        nickname,
        birth_date,
        gender,
        email,
    });
    return res.json(result);
});

// ── 로그인 (POST /login) ──────────────────────────────────────────────────────

/**
 * POST /login
 *
 * 처리 흐름:
 *   1. 아이디로 유저 조회 (DB에서 해시된 비밀번호 포함한 유저 정보 반환)
 *   2. bcrypt.compare()로 입력 비밀번호 vs 저장된 해시 비교
 *   3. 일치 시 세션 생성 → httpOnly 쿠키 발급
 */
router.post("/login", async (req, res) => {
    const { id, password } = req.body;

    const user = await findUser(id);
    if (!user) {
        return res.status(401).json({ success: false, message: "존재하지 않는 아이디입니다." });
    }

    // 비밀번호 비교:
    //   - DB에 bcrypt 해시($2b$로 시작)가 저장된 경우 → bcrypt.compare()로 안전하게 비교
    //   - 이전 방식으로 평문이 저장된 계정 → 직접 문자열 비교 (하위 호환)
    const isBcryptHash = user.password.startsWith("$2b$") || user.password.startsWith("$2a$");
    const isMatch = isBcryptHash
        ? await bcrypt.compare(password, user.password)
        : password === user.password;
    if (!isMatch) {
        return res.status(401).json({ success: false, message: "비밀번호가 틀렸습니다." });
    }

    const sessionId = uuidv4();
    await createSession(sessionId, user.user_id);

    res.cookie("sessionId", sessionId, {
        httpOnly: true,              // JS 접근 불가 → XSS 방어
        secure: false,               // 개발 환경: HTTP 허용 (프로덕션 시 true로 변경)
        sameSite: "lax",             // CSRF 일부 방어
        maxAge: 1000 * 60 * 60 * 24, // 1일
    });

    return res.json({ success: true, message: "로그인 성공" });
});

// ── 현재 유저 정보 (GET /me) ──────────────────────────────────────────────────

/**
 * GET /me
 * 쿠키의 sessionId → 세션 조회 → 유저 정보 반환 (비밀번호 제외)
 */
router.get("/me", async (req, res) => {
    const { sessionId } = req.cookies;

    if (!sessionId) {
        return res.status(401).json({ success: false, message: "로그인되지 않았습니다." });
    }

    const session = await findSession(sessionId);
    if (!session) {
        return res.status(401).json({ success: false, message: "유효하지 않은 세션입니다." });
    }

    const user = await findUser(session.login_id);
    if (!user) {
        return res.status(401).json({ success: false, message: "유저 정보를 찾을 수 없습니다." });
    }

    // 비밀번호(해시)는 절대 클라이언트에 전달하지 않음
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
        },
    });
});

// ── 로그아웃 (POST /logout) ───────────────────────────────────────────────────

/**
 * POST /logout
 * DB에서 세션 삭제 + 브라우저 쿠키 제거
 */
router.post("/logout", async (req, res) => {
    const { sessionId } = req.cookies;
    if (sessionId) await deleteSession(sessionId);

    res.clearCookie("sessionId", { httpOnly: true, secure: false, sameSite: "lax" });
    return res.json({ success: true, message: "로그아웃 완료" });
});

// ── 중복체크 (GET /check-duplicate) ──────────────────────────────────────────

/**
 * GET /check-duplicate?field=userId&value=값
 *       또는
 * GET /check-duplicate?field=nickname&value=값
 *
 * SignupPage.jsx에서 아이디/닉네임 중복체크 버튼 클릭 시 호출
 * FastAPI의 /user/check/* 엔드포인트를 중계하여 결과 반환
 *
 * Query Params:
 *   field - "userId" 또는 "nickname"
 *   value - 확인할 값
 *
 * Response:
 *   { isDuplicate: true }  → 이미 사용 중
 *   { isDuplicate: false } → 사용 가능
 */
router.get("/check-duplicate", async (req, res) => {
    const { field, value } = req.query;

    if (!field || !value) {
        return res.status(400).json({ success: false, message: "field와 value가 필요합니다." });
    }

    // field 이름에 따라 FastAPI 엔드포인트 분기
    let url;
    if (field === "userId") {
        url = `${PYTHON_API}/user/check/login_id/${encodeURIComponent(value.trim())}`;
    } else if (field === "nickname") {
        url = `${PYTHON_API}/user/check/nickname/${encodeURIComponent(value.trim())}`;
    } else {
        return res.status(400).json({ success: false, message: "field는 userId 또는 nickname이어야 합니다." });
    }

    try {
        const fetch = require("node-fetch");
        const response = await fetch(url);
        const result = await response.json();
        // FastAPI 응답: { isDuplicate: true/false }
        return res.json(result);
    } catch (error) {
        console.error("중복체크 FastAPI 요청 실패:", error);
        return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
});

module.exports = { router };
