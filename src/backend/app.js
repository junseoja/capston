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
//   /login, /signup, /logout, /me, /check-duplicate   → loginRouter
//   /routine (GET, POST, DELETE /routine/:id)          → routineRouter
//   /completion (POST, GET /today, GET /history, DELETE) → completionRouter
//   /feed (POST, GET, DELETE /feed/:feed_id)           → feedRouter
//   /like (POST /like)                                 → likeRouter
//   /comment (POST, GET /:feed_id, DELETE /:comment_id) → commentRouter
// ============================================================

require("dotenv").config(); // .env 파일을 process.env에 로드 (가장 먼저 실행)

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const SLOW_REQUEST_MS = Number(process.env.SLOW_REQUEST_MS || 500);

// 인증 라우터: 회원가입(/signup), 로그인(/login), 로그아웃(/logout),
//             현재 유저(/me), 중복체크(/check-duplicate)
const { router: loginRouter } = require("./routes/login");

// 루틴 라우터: 루틴 CRUD (GET/POST /routine, DELETE /routine/:id)
const routineRouter = require("./routes/routine");

// 완료 이력 라우터: GET /completion/history
const completionRouter = require("./routes/completion");

// 피드 라우터: POST/GET /feed, DELETE /feed/:feed_id
const feedRouter = require("./routes/feed");

// 좋아요 라우터: POST /like
const likeRouter = require("./routes/like");

// 댓글 라우터: POST /comment, GET /comment/:feed_id, DELETE /comment/:comment_id
const commentRouter = require("./routes/comment");

// 마이페이지 라우터: GET /mypage/summary, GET /mypage/gallery
const mypageRouter = require("./routes/mypage");

// 통계 라우터: GET /stats
const statsRouter = require("./routes/stats");

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

// [추가 2026-05-10] Express 요청 처리 시간 측정.
//
// 이유:
//   React → Express → FastAPI → MySQL 구조를 유지하면서 성능을 높이려면
//   어느 API가 실제로 느린지 먼저 숫자로 확인해야 한다.
//
// 동작:
//   모든 요청의 시작/종료 시간을 측정하고, SLOW_REQUEST_MS 이상 걸린 요청만 로그로 남긴다.
//   빠른 요청까지 전부 찍으면 개발 로그가 너무 커지므로 기본값은 500ms 이상만 기록한다.
//
// 결과:
//   Express 자체 병목인지, FastAPI/DB 대기인지, 특정 화면 API가 느린지 추적할 수 있다.
app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        if (elapsedMs >= SLOW_REQUEST_MS) {
            console.warn(
                `🐢 [express] ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs.toFixed(1)}ms`
            );
        }
    });
    next();
});

// [제거 2026-05-05] /uploads 정적 서빙 — 피드 이미지를 S3 로 이전.
// 기존: app.use("/uploads", express.static(...))  → 로컬 디스크의 업로드 파일 서빙
// 변경: routes/feed.js 가 multer-s3 로 S3 에 직접 업로드, DB 의 file_url 은 S3 퍼블릭 URL.
//       프론트(FeedPage.jsx getImageUrl) 는 http* 로 시작하는 URL 을 그대로 통과시키므로
//       이미지 표시는 추가 코드 변경 없이 동작.

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

// 피드 관련 라우트 (prefix "/")
// - POST   /feed         : 피드 생성 (이미지 업로드 포함)
// - GET    /feed         : 전체 피드 목록 조회
// - DELETE /feed/:feed_id : 피드 삭제
app.use("/", feedRouter);

// 좋아요 관련 라우트 (prefix "/")
// - POST   /like : 좋아요 토글
app.use("/", likeRouter);

// 댓글 관련 라우트 (prefix "/")
// - POST   /comment              : 댓글 작성
// - GET    /comment/:feed_id     : 댓글 목록 조회
// - DELETE /comment/:comment_id  : 댓글 삭제
app.use("/", commentRouter);

// [추가 2026-05-10] 마이페이지/통계 실제 데이터 라우트.
// 이유: MyPage.jsx / StatsPage.jsx 의 mock 값을 DB 기반 API로 대체하기 위함.
// 설명: 두 라우터 모두 requireAuth 로 세션 user_id 를 주입한 뒤 FastAPI 에 전달한다.
app.use("/", mypageRouter);
app.use("/", statsRouter);

// ── 글로벌 에러 핸들러 ───────────────────────────────────────────────────────
// 해결하는 에러 (README 4월 18일 #3 — 글로벌 에러 핸들러 없음):
//   - 기존에는 라우터에서 throw된 에러가 Express 기본 핸들러로 떨어져
//     HTML 500 페이지가 클라이언트에 반환됨
//     → 프론트의 res.json()이 SyntaxError 로 크래시하던 문제
//   - Express 5는 async 핸들러의 throw / reject를 자동으로 next(err)로 넘겨줌
//     → 여기 한 블록으로 모든 라우트의 미처리 에러를 JSON 500 응답으로 통일
//
// FastApiError 처리:
//   - 4xx (409 아이디 중복 등): 원래 상태코드 그대로 전달
//   - 5xx 또는 status=0 (FastAPI 자체 다운/네트워크 실패): 502 Bad Gateway 로 변환
//     → "Express 서버 문제"가 아니라 "업스트림 FastAPI 문제"임을 명시
//
// 주의:
//   - Express는 error handler를 "파라미터 4개짜리 함수"로 판별하므로
//     next 를 실제로 호출하지 않아도 시그니처 (err, req, res, next) 유지 필수
//   - 반드시 모든 라우터 등록 뒤에 위치해야 함 (Express 미들웨어 순서)
const { FastApiError } = require("./database");
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
    console.error(`❌ [${req.method} ${req.path}]`, err);

    let status = 500;
    let message = err.message || "서버 오류가 발생했습니다.";

    if (err instanceof FastApiError) {
        // 4xx: 클라이언트 입력 오류 등 → 상태코드 그대로 전달
        // 그 외 (5xx, 0): 업스트림 장애 → 502 Bad Gateway
        status = err.status >= 400 && err.status < 500 ? err.status : 502;
    }

    return res.status(status).json({ success: false, message });
});

// ── 서버 시작 ────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
    console.log(`FastAPI 연결 대상: ${process.env.PYTHON_API || "http://localhost:8000"}`);
    console.log(`허용된 프론트엔드: ${FRONTEND_URL}`);
});
