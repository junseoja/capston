const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

const users = new Map();
const sessions = new Map();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

// ✅ "/signuppage" → "/signup" 으로 수정
app.post("/signup", (req, res) => {
    const { id, password } = req.body;

    if (!id || !password) {
        return res.status(400).json({
        success: false,
        message: "아이디와 비밀번호를 입력하세요.",
    });
    }

    if (users.has(id)) {
        return res.status(409).json({
        success: false,
        message: "이미 존재하는 아이디입니다.",
        });
    }

    users.set(id, req.body);
    return res.json({ success: true, message: "회원가입 성공" });
});

// ✅ "/loginpage" → "/login" 으로 수정
app.post("/login", (req, res) => {
    const { id, password } = req.body;
    const user = users.get(id);

    if (!user) {
        return res.status(401).json({
        success: false,
        message: "존재하지 않는 아이디입니다.",
        });
    }

    if (user.password !== password) {
        return res.status(401).json({
        success: false,
        message: "비밀번호가 틀렸습니다.",
        });
    }

    const sessionId = uuidv4();
    sessions.set(sessionId, { id: user.id });

    res.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24,
    });

    return res.json({ success: true, message: "로그인 성공" });
});

app.get("/me", (req, res) => {
    const { sessionId } = req.cookies;

    if (!sessionId) {
        return res.status(401).json({ success: false, message: "로그인되지 않았습니다." });
    }

    const session = sessions.get(sessionId);
    if (!session) {
        return res.status(401).json({ success: false, message: "유효하지 않은 세션입니다." });
    }

    const user = users.get(session.id);
    if (!user) {
        return res.status(401).json({ success: false, message: "사용자 정보를 찾을 수 없습니다." });
    }

    return res.status(200).json({ success: true, user: { id: user.id } });
});

app.post("/logout", (req, res) => {
    const { sessionId } = req.cookies;
    if (sessionId) sessions.delete(sessionId);

    res.clearCookie("sessionId", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });

    return res.status(200).json({ success: true, message: "로그아웃 완료" });
});

app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});