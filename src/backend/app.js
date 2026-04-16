// ============================================================
// Express 백엔드 진입점 (app.js)
// ============================================================
// 역할:
//   - 포트 3000에서 HTTP 서버 실행
//   - React 프론트(localhost:5173)의 요청을 받아 FastAPI(localhost:8000)로 중계
//   - 세션 관리(httpOnly 쿠키)를 이 서버에서 담당
//
// 실행 방법:
//   cd src/backend
//   node app.js  (또는 nodemon app.js)
//
// 전체 아키텍처:
//   React(5173) ←→ Express(3000) ←→ FastAPI(8000) ←→ MySQL(AWS RDS)
//
// 등록된 라우트:
//   /login, /signup, /logout, /me, /check-duplicate → loginRouter
//   /routine (GET, POST, DELETE /routine/:id)        → routineRouter
//   /completion/history                              → completionRouter
// ============================================================

require("dotenv").config(); // .env 파일을 process.env에 로드 (가장 먼저 실행)

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// 인증 라우터: 회원가입(/signup), 로그인(/login), 로그아웃(/logout),
//             현재 유저(/me), 중복체크(/check-duplicate)
const { router: loginRouter } = require("./routes/login");

// 루틴 라우터: 루틴 CRUD (GET/POST /routine, DELETE /routine/:id)
const routineRouter = require("./routes/routine");

// 완료 이력 라우터: GET /completion/history
const completionRouter = require("./routes/completion");

const app = express();

// ── 미들웨어 등록 ────────────────────────────────────────────────────────────

// CORS 설정: React 개발 서버(5173)에서 오는 요청만 허용
// credentials: true → 쿠키 포함 요청(fetch credentials: "include") 허용
//              반드시 origin을 와일드카드(*) 대신 명시적 URL로 지정해야 함
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// 요청 body를 JSON으로 파싱 → req.body 에 JSON 데이터 담김
app.use(express.json());

// 쿠키 파싱 미들웨어 → req.cookies.sessionId 처럼 쿠키 값에 접근 가능
app.use(cookieParser());

// ── 라우터 등록 ──────────────────────────────────────────────────────────────

// 인증 관련 라우트 (prefix "/")
// - POST   /login           : 로그인 (세션 쿠키 발급)
// - POST   /signup          : 회원가입
// - POST   /logout          : 로그아웃 (세션 쿠키 삭제)
// - GET    /me              : 현재 로그인 유저 정보
// - GET    /check-duplicate : 아이디/닉네임 중복 확인
app.use("/", loginRouter);

// 루틴 관련 라우트 (prefix "/")
// - GET    /routine         : 내 루틴 목록 조회
// - POST   /routine         : 루틴 생성
// - DELETE /routine/:id     : 루틴 삭제
app.use("/", routineRouter);

// 완료 이력 관련 라우트 (prefix "/")
// - GET    /completion/history : 내 루틴 완료 이력 조회
app.use("/", completionRouter);

// ── 서버 시작 ────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
    console.log(`FastAPI 연결 대상: ${process.env.PYTHON_API || "http://localhost:8000"}`);
    console.log(`허용된 프론트엔드: ${FRONTEND_URL}`);
});
