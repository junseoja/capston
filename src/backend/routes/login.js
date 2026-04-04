const express = require("express");
const router = express.Router();
const { findUser, createUser } = require("../database");
const { v4: uuidv4 } = require("uuid");

const sessions = new Map();

// 회원가입
router.post("/signup", async (req, res) => {
    const { id, password, nickname, birth, gender, email } = req.body;

    if (!id || !password) {
        return res.status(400).json({ success: false, message: "아이디와 비밀번호를 입력하세요." });
    }

    const existing = await findUser(id);
    if (existing) {
        return res.status(409).json({ success: false, message: "이미 존재하는 아이디입니다." });
    }

    // birth_date 포맷 변환 "2000-03-15"
    const birth_date = `${birth.year}-${String(birth.month).padStart(2, "0")}-${String(birth.day).padStart(2, "0")}`;

    const result = await createUser({ login_id: id, password, nickname, birth_date, gender, email });
    return res.json(result);
});

// 로그인
router.post("/login", async (req, res) => {
    const { id, password } = req.body;
    const user = await findUser(id);

    if (!user) {
        return res.status(401).json({ success: false, message: "존재하지 않는 아이디입니다." });
    }
    if (user.password !== password) {
        return res.status(401).json({ success: false, message: "비밀번호가 틀렸습니다." });
    }

    const sessionId = uuidv4();
    sessions.set(sessionId, { id: user.login_id });

    res.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24,
    });

    return res.json({ success: true, message: "로그인 성공" });
});

// 로그인 상태 확인
router.get("/me", (req, res) => {
    const { sessionId } = req.cookies;
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ success: false, message: "로그인되지 않았습니다." });
    }
    return res.json({ success: true, user: sessions.get(sessionId) });
});

// 로그아웃
router.post("/logout", (req, res) => {
    const { sessionId } = req.cookies;
    if (sessionId) sessions.delete(sessionId);
    res.clearCookie("sessionId", { httpOnly: true, secure: false, sameSite: "lax" });
    return res.json({ success: true, message: "로그아웃 완료" });
});

// routes/login.js 에 추가
//중복체크 API
router.get("/check-duplicate", async (req, res) => {
    const { field, value } = req.query;

    const user = await findUser(value);

    if (field === "userId") {
        return res.json({ isDuplicate: !!user });
    }

    // 닉네임 중복체크는 FastAPI에 별도 추가 필요
    return res.json({ isDuplicate: false });
});

module.exports = { router, sessions }; // ✅ sessions 추가 export