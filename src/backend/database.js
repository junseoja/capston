// ============================================================
// Express ↔ FastAPI 연결 모듈 (database.js)
// ============================================================
// 역할:
//   Express 라우터(login.js, routine.js, feed.js, like.js, comment.js)에서 호출하며,
//   실제 DB 작업은 FastAPI(포트 8000)에 HTTP 요청으로 위임.
//
// 아키텍처:
//   Express 라우터 → 이 모듈의 함수 → HTTP fetch → FastAPI 라우터 → MySQL
//
// 함수 분류:
//   유저 관련   : findUser, createUser
//   세션 관련   : createSession, findSession, deleteSession
//   루틴 관련   : createRoutine, getRoutines, deleteRoutine
//   완료 관련   : createCompletion, getTodayCompletions, getCompletionHistory, deleteCompletion
//   피드 관련   : createFeed, addFeedImage, getFeeds, getFeedDetail, deleteFeed
//   좋아요 관련 : toggleLike, checkLike
//   댓글 관련   : createComment, getComments, deleteComment
//
// [리팩터링 #2] FastAPI 호출 에러 처리 통합 (README 4월 18일 #2)
//   기존 문제:
//     - `await res.json()` 직전에 res.ok 검증이 없었음
//       → FastAPI가 HTML 500을 내려주면 SyntaxError 로 라우터 크래시
//     - fetch 자체가 네트워크 오류로 throw 하면 스택 전체로 전파
//     - FastAPI의 {detail: "..."} 에러 페이로드를 그대로 성공처럼 반환
//   해결:
//     - 모든 FastAPI 호출을 fetchJson() 단일 헬퍼로 통과시킴
//     - 네트워크/HTTP/JSON 파싱 에러를 일관된 FastApiError 로 throw
//     - 라우터는 try/catch 만 붙이면 500 응답을 안전하게 내릴 수 있음
// ============================================================

const fetch = require("node-fetch"); // HTTP 요청 라이브러리 (node.js 환경용)

const PYTHON_API = process.env.PYTHON_API || "http://localhost:8000"; // FastAPI 서버 주소

// ─── FastAPI 호출 공통 헬퍼 ────────────────────────────────────────────────

/**
 * FastAPI 호출 시 발생하는 에러를 표준화하기 위한 커스텀 에러.
 *
 * 라우터 쪽에서 `error instanceof FastApiError` 로 분기하여
 * FastAPI 쪽 실패(502/503 상황)와 Express 내부 버그를 구분할 수 있게 함.
 */
class FastApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "FastApiError";
        this.status = status; // 0 이면 네트워크 자체 실패 (서버 다운 등)
    }
}

/**
 * FastAPI에 HTTP 요청을 보내고 JSON 응답을 파싱.
 *
 * 해결하는 에러 (README 4월 18일 #2):
 *   1. FastAPI가 HTML 500 응답 반환 → res.json() 이 SyntaxError 로 크래시
 *      → content-type 체크 + try/catch 로 표준 에러로 변환
 *   2. res.ok 체크 없음 → FastAPI 에러 응답({detail: "..."})이 성공처럼 반환
 *      → res.ok 검증 후 false 면 throw
 *   3. 네트워크 끊김 → fetch 자체가 throw 후 스택 전체 크래시
 *      → try/catch 로 감싸 FastApiError(status=0) 으로 변환
 *
 * @param {string} url - FastAPI 엔드포인트 절대 URL
 * @param {object} [options] - fetch 옵션 (method, headers, body 등)
 * @returns {Promise<any>} 파싱된 JSON 응답
 * @throws {FastApiError} 네트워크/HTTP/JSON 파싱 실패 시
 */
async function fetchJson(url, options) {
    let response;
    try {
        response = await fetch(url, options);
    } catch (error) {
        // 네트워크 레벨 실패: FastAPI 서버 다운, DNS 실패, 타임아웃 등
        // 이 throw를 잡지 않으면 기존에는 Express 기본 핸들러가 HTML 500을 내렸음
        throw new FastApiError(
            `FastAPI 서버에 연결할 수 없습니다: ${error.message}`,
            0
        );
    }

    // HTTP 에러(4xx/5xx)의 경우에도 body는 비어있을 수도, JSON 일 수도, HTML 일 수도 있음
    // 우선 텍스트로 읽고 JSON 파싱 시도 → 실패하면 원문 메시지를 사용
    const rawText = await response.text();

    let parsed;
    try {
        parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
        // JSON 아닌 응답 (FastAPI 트레이스백 HTML, 프록시 에러 페이지 등)
        // → 라우터가 res.json()으로 클라이언트에 보내면 안 되므로 여기서 throw
        throw new FastApiError(
            `FastAPI 응답을 JSON으로 파싱할 수 없습니다 (status ${response.status})`,
            response.status
        );
    }

    if (!response.ok) {
        // FastAPI 표준 에러는 { detail: "..." } 형태
        // 라우터가 "정상 json"처럼 취급하지 않도록 여기서 throw
        const detail = parsed?.detail || parsed?.message || "FastAPI 오류";
        throw new FastApiError(
            `FastAPI ${response.status}: ${detail}`,
            response.status
        );
    }

    return parsed;
}

// ─── 유저 관련 함수 ────────────────────────────────────────────────────────

/**
 * 로그인 아이디로 유저 정보 조회
 *
 * FastAPI GET /user/{login_id} 호출.
 * 로그인 처리, /me 엔드포인트에서 유저 정보 가져올 때 사용.
 *
 * @param {string} login_id - 로그인 아이디 (예: "hong123")
 * @returns {object|null} 유저 정보 객체 또는 null (없으면 null)
 */
async function findUser(login_id) {
    const data = await fetchJson(`${PYTHON_API}/user/${login_id}`);
    // FastAPI는 유저가 없을 때 빈 객체 {} 반환 → Object.keys로 존재 여부 판단
    return data && Object.keys(data).length ? data : null;
}

/**
 * 회원가입 - 유저 생성
 *
 * FastAPI POST /user/signup 호출.
 *
 * @returns {object} 성공 시 { success: true }, 중복 시 HTTP 409 → FastApiError throw
 */
async function createUser(userInfo) {
    return await fetchJson(`${PYTHON_API}/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userInfo),
    });
}

// ─── 세션 관련 함수 ────────────────────────────────────────────────────────

/**
 * 세션 DB에 저장 (FastAPI POST /user/session)
 *
 * 로그인 성공 시 세션 ID와 유저 ID를 sessions 테이블에 저장.
 * 세션은 1일 후 자동 만료됨 (expires_at = NOW() + 1 DAY).
 */
async function createSession(session_id, user_id) {
    return await fetchJson(`${PYTHON_API}/user/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, user_id }),
    });
}

/**
 * 세션 ID로 세션 정보 조회 (인증 미들웨어 역할)
 *
 * FastAPI GET /user/session/{session_id} 호출.
 * 모든 보호된 라우트(/routine, /me, /logout)에서 쿠키의 sessionId로 호출됨.
 * 만료된 세션은 FastAPI 측에서 빈 객체 반환 → 여기서 null로 변환.
 *
 * @returns {object|null} 세션 + 유저 정보 또는 null (만료/없음)
 */
async function findSession(session_id) {
    const data = await fetchJson(`${PYTHON_API}/user/session/${session_id}`);
    return data && Object.keys(data).length ? data : null;
}

/**
 * 세션 삭제 (로그아웃, FastAPI DELETE /user/session/{session_id})
 */
async function deleteSession(session_id) {
    return await fetchJson(`${PYTHON_API}/user/session/${session_id}`, {
        method: "DELETE",
    });
}

// ─── 루틴 관련 함수 ────────────────────────────────────────────────────────

/**
 * 루틴 생성 (FastAPI POST /routine/)
 * user_id는 세션에서 자동 주입되어 전달됨.
 */
async function createRoutine(routineData) {
    return await fetchJson(`${PYTHON_API}/routine/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routineData),
    });
}

/**
 * 유저의 루틴 목록 조회 (FastAPI GET /routine/{user_id})
 * 최신 생성 순(created_at DESC)으로 정렬된 배열 반환.
 */
async function getRoutines(user_id) {
    return await fetchJson(`${PYTHON_API}/routine/${user_id}`);
}

/**
 * 루틴 삭제 (본인 소유 검증 포함)
 * FastAPI DELETE /routine/{routine_id}?user_id={user_id} 호출.
 * WHERE routine_id=? AND user_id=? 조건으로 타인 루틴 삭제 차단.
 */
async function deleteRoutine(routine_id, user_id) {
    return await fetchJson(
        `${PYTHON_API}/routine/${routine_id}?user_id=${encodeURIComponent(user_id)}`,
        { method: "DELETE" }
    );
}

// ─── 완료 이력 관련 함수 ───────────────────────────────────────────────────

/**
 * 유저의 루틴 완료 이력 조회 (최근 20건)
 * FastAPI GET /completion/history/{user_id}. 마이페이지 "최근 활동" 섹션에서 사용.
 */
async function getCompletionHistory(user_id) {
    return await fetchJson(`${PYTHON_API}/completion/history/${user_id}`);
}

/**
 * 루틴 완료 기록 생성 (FastAPI POST /completion/)
 * 홈 화면의 완료 처리를 DB에 영속화.
 */
async function createCompletion(completionData) {
    return await fetchJson(`${PYTHON_API}/completion/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completionData),
    });
}

/**
 * 오늘 완료한 루틴 목록 조회 (FastAPI GET /completion/today/{user_id})
 * 새로고침 후에도 오늘 완료 상태를 복원.
 */
async function getTodayCompletions(user_id) {
    return await fetchJson(`${PYTHON_API}/completion/today/${user_id}`);
}

/**
 * 완료 기록 삭제 (완료 취소)
 * user_id 함께 전달하여 FastAPI에서 소유자 검증.
 */
async function deleteCompletion(completion_id, user_id) {
    return await fetchJson(
        `${PYTHON_API}/completion/${completion_id}?user_id=${encodeURIComponent(user_id)}`,
        { method: "DELETE" }
    );
}

// ─── 피드 관련 함수 ────────────────────────────────────────────────────────

/**
 * 피드 게시물 생성 (FastAPI POST /feed/)
 * 상세 루틴 완료 시 "피드에도 업로드" 체크한 경우 호출.
 */
async function createFeed(feedData) {
    return await fetchJson(`${PYTHON_API}/feed/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedData),
    });
}

/**
 * 피드 이미지 레코드 추가 (FastAPI POST /feed/image)
 * 파일은 Express에서 디스크에 저장한 뒤, URL을 이 함수로 전달.
 */
async function addFeedImage(imageData) {
    return await fetchJson(`${PYTHON_API}/feed/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageData),
    });
}

/**
 * 전체 피드 목록 조회 (FastAPI GET /feed/, 최신순)
 * 좋아요 수, 댓글 수가 포함된 피드 목록 반환.
 */
async function getFeeds() {
    return await fetchJson(`${PYTHON_API}/feed/`);
}

/**
 * 피드 상세 조회 (이미지 + 댓글 포함, FastAPI GET /feed/{feed_id})
 */
async function getFeedDetail(feed_id) {
    return await fetchJson(`${PYTHON_API}/feed/${feed_id}`);
}

/**
 * 피드 삭제 (본인 소유 검증 포함)
 */
async function deleteFeed(feed_id, user_id) {
    return await fetchJson(
        `${PYTHON_API}/feed/${feed_id}?user_id=${encodeURIComponent(user_id)}`,
        { method: "DELETE" }
    );
}

// ─── 좋아요 관련 함수 ─────────────────────────────────────────────────────

/**
 * 좋아요 토글 (추가/취소, FastAPI POST /like/)
 */
async function toggleLike(feed_id, user_id) {
    return await fetchJson(`${PYTHON_API}/like/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feed_id, user_id }),
    });
}

/**
 * 특정 유저의 좋아요 여부 확인 (FastAPI GET /like/{feed_id}/{user_id})
 */
async function checkLike(feed_id, user_id) {
    return await fetchJson(`${PYTHON_API}/like/${feed_id}/${user_id}`);
}

// ─── 댓글 관련 함수 ──────────────────────────────────────────────────────

/**
 * 댓글 작성 (FastAPI POST /comment/)
 */
async function createComment(commentData) {
    return await fetchJson(`${PYTHON_API}/comment/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData),
    });
}

/**
 * 피드 댓글 목록 조회 (FastAPI GET /comment/{feed_id})
 */
async function getComments(feed_id) {
    return await fetchJson(`${PYTHON_API}/comment/${feed_id}`);
}

/**
 * 댓글 삭제 (본인 소유 검증 포함)
 */
async function deleteComment(comment_id, user_id) {
    return await fetchJson(
        `${PYTHON_API}/comment/${comment_id}?user_id=${encodeURIComponent(user_id)}`,
        { method: "DELETE" }
    );
}

// ── 모듈 내보내기 ────────────────────────────────────────────────────────────
module.exports = {
    // 헬퍼 / 커스텀 에러 — 라우터에서 `error instanceof FastApiError` 로 구분 가능
    fetchJson,
    FastApiError,

    findUser,
    createUser,
    createSession,
    findSession,
    deleteSession,
    createRoutine,
    getRoutines,
    deleteRoutine,
    createCompletion,
    getTodayCompletions,
    getCompletionHistory,
    deleteCompletion,
    createFeed,
    addFeedImage,
    getFeeds,
    getFeedDetail,
    deleteFeed,
    toggleLike,
    checkLike,
    createComment,
    getComments,
    deleteComment,
};
