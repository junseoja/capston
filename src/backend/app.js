// ============================================================
// Express 백엔드 진입점 (app.js)
// ============================================================
// 역할:
//   - React 프론트엔드의 요청을 받는 공개 API 계층
//   - httpOnly 세션 쿠키, CORS, 라우터 마운트, 공통 에러 응답 담당
//   - 실제 DB 작업은 database.js를 통해 FastAPI 내부 API로 위임
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
//   /mypage, /stats, /notice, /report                  → 화면/관리 API
// ============================================================

require("dotenv").config(); // .env 파일을 process.env에 로드 (가장 먼저 실행)

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 3000;
// FRONTEND_URL은 콤마로 여러 origin을 받을 수 있다.
// 예: FRONTEND_URL=http://localhost:5173,https://my-app.vercel.app
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const ALLOWED_ORIGINS = FRONTEND_URL.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
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

// 공지 라우터: POST/GET/PATCH/DELETE /notice
const noticeRouter = require("./routes/notice");
// 신고 라우터: POST/GET /report, PATCH /report/process, GET /report/:id
const reportRouter = require("./routes/report");

// 챌린지 라우터: 목록/참여/인증/취소 + 관리자 CRUD/현황
const challengeRouter = require("./routes/challenge");

const app = express();

// ── 미들웨어 등록 ────────────────────────────────────────────────────────────

// CORS 설정: 허용된 프론트 origin 목록(ALLOWED_ORIGINS)만 통과
// credentials: true → 쿠키 포함 요청(fetch credentials: "include") 허용
//   - 와일드카드(*) 는 credentials 와 함께 못 쓰므로 명시 목록 사용
//   - origin 이 없는 서버간 호출, 헬스체크, curl 요청은 통과시킴
app.use(
    cors({
        origin(origin, callback) {
            if (!origin || ALLOWED_ORIGINS.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`CORS 차단된 origin: ${origin}`));
        },
        credentials: true,
    }),
);

// 요청 body를 JSON으로 파싱 → req.body 에 JSON 데이터 담김
app.use(express.json());

// 쿠키 파싱 미들웨어 → req.cookies.sessionId 처럼 쿠키 값에 접근 가능
app.use(cookieParser());

// 요청 시간을 측정하고 기준값 이상인 요청만 로그에 남긴다.
// Express 자체 지연과 FastAPI/DB 대기 시간을 분리해 추적하기 위한 운영 로그다.
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

// 신규 피드 파일은 routes/feed.js에서 S3로 직접 업로드한다.
// uploads 디렉터리는 자리표시자만 유지하며 정적 서빙하지 않는다.

// ── 라우터 등록 ──────────────────────────────────────────────────────────────

// 인증 관련 라우트 (prefix "/")
// - POST   /login           : 로그인 (세션 쿠키 발급)
// - POST   /signup          : 회원가입
// - POST   /logout          : 로그아웃 (세션 쿠키 삭제)
// - GET    /me              : 현재 로그인 유저 정보
// - PATCH  /me/profile      : 닉네임/자기소개 수정
// - POST   /find-id         : 아이디 찾기
// - POST   /find-password   : 임시 비밀번호 발급
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

// 마이페이지/통계 라우트는 requireAuth로 세션 user_id를 주입한 뒤 FastAPI에 전달한다.
app.use("/", mypageRouter);
app.use("/", statsRouter);

// 공지/신고 관리 라우트는 각 라우터 내부에서 requireAuth와 requireAdmin으로 보호한다.
app.use("/", noticeRouter);
app.use("/", reportRouter);

// 챌린지 라우트는 내부에서 requireAuth/requireAdmin을 적용한다.
app.use("/", challengeRouter);

// ── 글로벌 에러 핸들러 ───────────────────────────────────────────────────────
// 모든 라우터의 미처리 오류를 JSON 응답으로 통일한다.
// FastApiError 처리:
//   - 4xx (409 아이디 중복 등): 원래 상태코드 그대로 전달
//   - 5xx 또는 status=0 (FastAPI 자체 다운/네트워크 실패): 502 Bad Gateway 로 변환
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
