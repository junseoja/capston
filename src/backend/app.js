// Express 백엔드 진입점
// - 포트 3000에서 실행
// - React 프론트(localhost:5173)의 요청을 받아 FastAPI(localhost:8000)로 중계
// - 세션 관리(쿠키 기반)를 이 서버에서 담당

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { router: loginRouter } = require("./routes/login");   // 인증 라우터 (회원가입/로그인/로그아웃)
const routineRouter = require("./routes/routine");            // 루틴 라우터 (CRUD)

const app = express();
const PORT = 3000;

// CORS 설정: React 개발 서버(5173)에서 오는 요청만 허용
// credentials: true → 쿠키 포함 요청 허용 (세션 기반 인증에 필수)
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// 요청 body를 JSON으로 파싱
app.use(express.json());

// 쿠키 파싱 미들웨어 → req.cookies 에 쿠키 값 담김
app.use(cookieParser());

// 라우터 등록
app.use("/", loginRouter);  // /login, /signup, /logout, /me, /check-duplicate
app.use("/", routineRouter); // /routine (GET, POST, DELETE)

app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});
