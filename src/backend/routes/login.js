const express = require("express");
const router = express.Router();
const {
    findUser,
    createUser,
    createSession,
    findSession,
    deleteSession,
} = require("../database"); // database.js에서 함수 가져오기
const { v4: uuidv4 } = require("uuid"); // 세션 ID 생성용 UUID v4

// ───── 회원가입 ─────

/**
 * POST /signup
 * 회원가입 처리
 * - 아이디/비밀번호 입력 여부 확인
 * - 아이디 중복 확인
 * - birth 데이터를 "YYYY-MM-DD" 형식으로 변환
 * - FastAPI를 통해 DB에 저장
 */
router.post("/signup", async (req, res) => {
    const { id, password, nickname, birth, gender, email } = req.body;

    // 아이디, 비밀번호 입력 여부 확인
    if (!id || !password) {
        return res.status(400).json({
            success: false,
            message: "아이디와 비밀번호를 입력하세요."
        });
    }

    // 아이디 중복 확인
    const existing = await findUser(id);
    if (existing) {
        return res.status(409).json({
            success: false,
            message: "이미 존재하는 아이디입니다."
        });
    }

    // birth 데이터를 "YYYY-MM-DD" 형식으로 변환
    const birth_date = `${birth.year}-${String(birth.month).padStart(2, "0")}-${String(birth.day).padStart(2, "0")}`;

    // FastAPI를 통해 DB에 유저 저장
    const result = await createUser({
        login_id: id,
        password,
        nickname,
        birth_date,
        gender,
        email
    });
    return res.json(result);
});

// ───── 로그인 ─────

/**
 * POST /login
 * 로그인 처리
 * - 아이디로 유저 조회
 * - 비밀번호 일치 여부 확인
 * - 세션 ID 생성 후 DB에 저장
 * - 쿠키에 세션 ID 저장 (httpOnly)
 */
router.post("/login", async (req, res) => {
    const { id, password } = req.body;

    // 아이디로 유저 조회
    const user = await findUser(id);

    // 존재하지 않는 아이디
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "존재하지 않는 아이디입니다."
        });
    }

    // 비밀번호 불일치
    if (user.password !== password) {
        return res.status(401).json({
            success: false,
            message: "비밀번호가 틀렸습니다."
        });
    }

    // 세션 ID 생성 (UUID v4)
    const sessionId = uuidv4();

    // DB에 세션 저장 (user_id와 연결, 1일 후 만료)
    await createSession(sessionId, user.user_id);

    // 브라우저 쿠키에 세션 ID 저장
    res.cookie("sessionId", sessionId, {
        httpOnly: true,   // JS에서 접근 불가 (XSS 방어)
        secure: false,    // HTTPS 아닐 때도 전송 (개발 환경)
        sameSite: "lax",  // CSRF 방어
        maxAge: 1000 * 60 * 60 * 24, // 1일
    });

    return res.json({ success: true, message: "로그인 성공" });
});

// ───── 로그인 상태 확인 ─────

/**
 * GET /me
 * 현재 로그인한 유저 정보 반환
 * - 쿠키의 세션 ID로 세션 조회
 * - 세션에서 login_id로 유저 전체 정보 조회
 * - 마이페이지, 루틴 등에서 유저 정보 가져올 때 사용
 */
router.get("/me", async (req, res) => {
    const { sessionId } = req.cookies;

    // 쿠키에 세션 ID 없으면 미로그인
    if (!sessionId) {
        return res.status(401).json({
            success: false,
            message: "로그인되지 않았습니다."
        });
    }

    // DB에서 세션 조회 (만료된 세션은 조회 안됨)
    const session = await findSession(sessionId);
    if (!session) {
        return res.status(401).json({
            success: false,
            message: "유효하지 않은 세션입니다."
        });
    }

    // 세션의 login_id로 유저 전체 정보 조회
    const user = await findUser(session.login_id);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "유저 정보를 찾을 수 없습니다."
        });
    }

    // 유저 정보 반환 (비밀번호 제외)
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

// ───── 로그아웃 ─────

/**
 * POST /logout
 * 로그아웃 처리
 * - DB에서 세션 삭제
 * - 쿠키에서 세션 ID 삭제
 */
router.post("/logout", async (req, res) => {
    const { sessionId } = req.cookies;

    // DB에서 세션 삭제
    if (sessionId) await deleteSession(sessionId);

    // 쿠키에서 세션 ID 삭제
    res.clearCookie("sessionId", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });

    return res.json({ success: true, message: "로그아웃 완료" });
});

module.exports = { router }; // sessions 제거 - DB 방식으로 변경