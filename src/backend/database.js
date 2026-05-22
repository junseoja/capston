// ============================================================
// Express ↔ FastAPI 연결 모듈 (database.js)
// ============================================================
// 역할:
//   Express 라우터가 FastAPI 내부 API를 호출할 때 쓰는 단일 통신 계층.
//   실제 DB 작업은 FastAPI가 수행하고, 이 모듈은 URL 구성/JSON 파싱/에러 표준화를 담당.
//
// 아키텍처:
//   Express 라우터 → 이 모듈의 함수 → HTTP fetch → FastAPI 라우터 → MySQL
//
// 함수 분류:
//   유저 관련   : findUser, createUser, updateUserProfile, findLoginIdByProfile, verifyForPasswordReset
//   세션 관련   : createSession, findSession, deleteSession
//   루틴 관련   : createRoutine, getRoutines, deleteRoutine
//   완료 관련   : createCompletion, getTodayCompletions, getCompletionHistory, deleteCompletion
//   피드 관련   : createFeed, createFeedWithImages, addFeedImage, getFeeds, getFeedDetail, deleteFeed
//   좋아요 관련 : toggleLike, checkLike
//   댓글 관련   : createComment, getComments, deleteComment
//   마이페이지   : getMypageOverview, getMypageSummary, getMypageGallery
//   통계 관련   : getStats
//   관리자/운영 : notice, report, challenge 계열 helper
//
// 모든 FastAPI 호출은 fetchJson()을 통과한다.
// 네트워크 실패, HTTP 에러, JSON 파싱 실패를 FastApiError로 표준화해
// app.js의 글로벌 에러 핸들러가 일관된 JSON 응답을 만들 수 있게 한다.
// ============================================================

const fetch = require("node-fetch"); // HTTP 요청 라이브러리 (node.js 환경용)

const PYTHON_API = process.env.PYTHON_API || "http://localhost:8000"; // FastAPI 서버 주소
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY; // Express → FastAPI 내부 호출 인증 키

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

/** Express가 FastAPI 내부 API를 호출할 때 공유 비밀키 헤더를 자동 첨부한다. */
function withInternalAuth(options = {}) {
    const headers = {
        ...(options.headers || {}),
    };

    if (INTERNAL_API_KEY) {
        headers["X-Internal-Api-Key"] = INTERNAL_API_KEY;
    }

    return {
        ...options,
        headers,
    };
}

/**
 * FastAPI에 HTTP 요청을 보내고 JSON 응답을 파싱.
 *
 * @param {string} url - FastAPI 엔드포인트 절대 URL
 * @param {object} [options] - fetch 옵션 (method, headers, body 등)
 * @returns {Promise<any>} 파싱된 JSON 응답
 * @throws {FastApiError} 네트워크/HTTP/JSON 파싱 실패 시
 */
async function fetchJson(url, options) {
    let response;
    try {
        response = await fetch(url, withInternalAuth(options));
    } catch (error) {
        // 네트워크 레벨 실패: FastAPI 서버 다운, DNS 실패, 타임아웃 등
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

/**
 * 유저의 비밀번호 해시값을 DB 에 업데이트.
 * 평문 비밀번호가 남아 있는 계정의 로그인 성공 시 bcrypt 해시로 교체하는 내부 호출이다.
 *
 * @param {string} user_id - 대상 유저의 UUID v7
 * @param {string} hashed_password - bcrypt 해시 문자열 ($2b$... 형식)
 * @returns {Promise<object>} { success: true } 또는 { success: false, message }
 * @throws {FastApiError} HTTP/네트워크 오류 시
 */
async function updateUserPassword(user_id, hashed_password) {
    return await fetchJson(`${PYTHON_API}/user/password/${encodeURIComponent(user_id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: hashed_password }),
    });
}

/** 프로필 수정. Express PATCH /me/profile -> FastAPI PATCH /user/profile/{user_id}. */
async function updateUserProfile(user_id, profile) {
    return await fetchJson(`${PYTHON_API}/user/profile/${encodeURIComponent(user_id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
    });
}

/** 닉네임+이메일로 로그인 아이디를 찾는다. */
async function findLoginIdByProfile(nickname, email) {
    return await fetchJson(`${PYTHON_API}/user/find-login-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, email }),
    });
}

/** 임시 비밀번호 발급 전 닉네임+아이디+이메일 조합을 검증한다. */
async function verifyForPasswordReset(nickname, login_id, email) {
    return await fetchJson(`${PYTHON_API}/user/verify-for-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, login_id, email }),
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
 * 현재 주 흐름은 createFeedWithImages()이며, 이 함수는 단순/레거시 호출용으로 유지한다.
 */
async function addFeedImage(imageData) {
    return await fetchJson(`${PYTHON_API}/feed/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageData),
    });
}

/**
 * FastAPI POST /feed/with-images 호출.
 * 피드와 첨부 이미지 여러 건을 FastAPI 단일 트랜잭션에서 생성한다.
 *
 * @param {object} payload
 * @param {string} payload.user_id      - 세션에서 주입된 작성자 UUID v7
 * @param {string} payload.routine_id   - 루틴 UUID v7
 * @param {string} payload.completion_id - 완료 기록 UUID v7
 * @param {string} [payload.content]    - 피드 본문 (없으면 빈 문자열)
 * @param {Array<{file_url: string, file_type?: string}>} [payload.images]
 * @returns {Promise<{success: boolean, feed_id: string, image_count: number}>}
 * @throws {FastApiError} 4xx/5xx (이 시점에 FastAPI 측은 모든 INSERT ROLLBACK 됨)
 */
async function createFeedWithImages(payload) {
    return await fetchJson(`${PYTHON_API}/feed/with-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

/**
 * 전체 피드 목록 조회 (FastAPI GET /feed/, 최신순, 커서 기반 페이지네이션)
 *
 * user_id / cursor / limit을 전달하면 FastAPI가 피드 메타, 좋아요 상태,
 * 이미지 목록, 카운트를 페이지 단위로 묶어 반환한다.
 *
 * @param {object} opts
 * @param {string} [opts.user_id] - 현재 로그인 사용자. liked 상태 결정용.
 * @param {string} [opts.cursor]  - 다음 페이지 커서 (이전 응답의 next_cursor).
 * @param {number} [opts.limit=20] - 페이지 크기 (1~100).
 * @returns {Promise<{feeds: Array, next_cursor: string|null}>}
 */
async function getFeeds({ user_id, cursor, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (user_id) params.set("user_id", user_id);
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(limit));
    return await fetchJson(`${PYTHON_API}/feed/?${params.toString()}`);
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

// ─── 마이페이지 / 통계 관련 함수 ─────────────────────────────────────────────

/** 마이페이지 핵심 지표 조회. */
async function getMypageSummary(user_id) {
    return await fetchJson(`${PYTHON_API}/mypage/summary/${user_id}`);
}

/** 마이페이지 화면용 user + summary + gallery 통합 조회. */
async function getMypageOverview(user_id, galleryLimit = 9) {
    const params = new URLSearchParams({ gallery_limit: String(galleryLimit) });
    return await fetchJson(`${PYTHON_API}/mypage/${user_id}?${params.toString()}`);
}

/** 내 인증 갤러리 이미지/영상 조회. */
async function getMypageGallery(user_id, limit = 9) {
    const params = new URLSearchParams({ limit: String(limit) });
    return await fetchJson(`${PYTHON_API}/mypage/gallery/${user_id}?${params.toString()}`);
}

/** 주간/월간 상세 분석 통계 조회. */
async function getStats(user_id, { mode = "weekly", start, end } = {}) {
    const params = new URLSearchParams({ mode });
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return await fetchJson(`${PYTHON_API}/stats/${user_id}?${params.toString()}`);
}

// ─── 관리자 페이지: 공지사항 / 신고 ─────────────────────────────────────────
// 관리자 라우터도 일반 기능과 동일하게 fetchJson()을 통해 내부 인증 헤더와
// FastApiError 표준화를 적용받는다.

// ── 공지사항 ──────────────────────────────────────────────────────────────────

/** 공지 작성 (관리자). FastAPI POST /notice/ */
async function createNotice(noticeData) {
    return await fetchJson(`${PYTHON_API}/notice/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noticeData),
    });
}

/** 공지 목록. category 옵션 시 필터. FastAPI GET /notice/ */
async function listNotices({ category, limit = 100 } = {}) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("limit", String(limit));
    return await fetchJson(`${PYTHON_API}/notice/?${params.toString()}`);
}

/** 공지 단건 상세. FastAPI GET /notice/{notice_id} */
async function getNotice(notice_id) {
    return await fetchJson(
        `${PYTHON_API}/notice/${encodeURIComponent(notice_id)}`,
    );
}

/** 공지 부분 수정 (관리자). FastAPI PATCH /notice/{notice_id} */
async function updateNotice(notice_id, patchData) {
    return await fetchJson(
        `${PYTHON_API}/notice/${encodeURIComponent(notice_id)}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patchData),
        },
    );
}

/** 공지 Soft Delete (관리자). FastAPI DELETE /notice/{notice_id} */
async function deleteNotice(notice_id) {
    return await fetchJson(
        `${PYTHON_API}/notice/${encodeURIComponent(notice_id)}`,
        { method: "DELETE" },
    );
}

// ── 신고 ──────────────────────────────────────────────────────────────────────

/** 신고 접수 (일반 사용자). FastAPI POST /report/ */
async function createReport(reportData) {
    return await fetchJson(`${PYTHON_API}/report/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
    });
}

/** 신고 목록 (관리자, feed_id 그룹 집계). FastAPI GET /report/ */
async function listReports({ status = "pending", limit = 100 } = {}) {
    const params = new URLSearchParams();
    params.set("status", status);
    params.set("limit", String(limit));
    return await fetchJson(`${PYTHON_API}/report/?${params.toString()}`);
}

/** 신고 단건 상세 (관리자). FastAPI GET /report/{report_id} */
async function getReport(report_id) {
    return await fetchJson(
        `${PYTHON_API}/report/${encodeURIComponent(report_id)}`,
    );
}

/**
 * 게시물 제재 처리 (관리자, 단일 트랜잭션). FastAPI PATCH /report/process
 * FastAPI 내부에서 (1) pending 신고 일괄 completed (2) 피드 Soft Delete 를
 * 한 트랜잭션으로 처리한다.
 */
async function processReport(processData) {
    return await fetchJson(`${PYTHON_API}/report/process`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processData),
    });
}

// ─── 챌린지 관련 함수 ───────────────────────────────────────────────────────
// 모든 챌린지 호출도 fetchJson을 통해 내부 인증 헤더, JSON 파싱, FastApiError
// 표준화를 동일하게 적용받는다.

/** 전체 챌린지 목록 조회 (FastAPI GET /challenge/) */
async function getChallenges() {
    return await fetchJson(`${PYTHON_API}/challenge/`);
}

/** 내가 참여한 챌린지 목록 (FastAPI GET /challenge/my/{user_id}) */
async function getMyChallenges(user_id) {
    return await fetchJson(
        `${PYTHON_API}/challenge/my/${encodeURIComponent(user_id)}`,
    );
}

/** 내 챌린지 인증 기록 조회 (FastAPI GET /challenge/proofs/{user_id}) */
async function getChallengeProofs(user_id) {
    return await fetchJson(
        `${PYTHON_API}/challenge/proofs/${encodeURIComponent(user_id)}`,
    );
}

/** 챌린지 참여 (FastAPI POST /challenge/{challenge_id}/join) */
async function joinChallenge(challenge_id, user_id) {
    return await fetchJson(
        `${PYTHON_API}/challenge/${encodeURIComponent(challenge_id)}/join`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id }),
        },
    );
}

/** 챌린지 인증 등록 (FastAPI POST /challenge/{challenge_id}/proof) */
async function createChallengeProof(challenge_id, payload) {
    return await fetchJson(
        `${PYTHON_API}/challenge/${encodeURIComponent(challenge_id)}/proof`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        },
    );
}

/** 오늘 챌린지 인증 취소 (FastAPI DELETE /challenge/{challenge_id}/proof/today?user_id=...) */
async function cancelTodayChallengeProof(challenge_id, user_id) {
    return await fetchJson(
        `${PYTHON_API}/challenge/${encodeURIComponent(challenge_id)}/proof/today?user_id=${encodeURIComponent(user_id)}`,
        { method: "DELETE" },
    );
}

// ─── 관리자 챌린지 CRUD + 참여자/인증 현황 ──────────────────────────────────
async function createChallenge(challengeData) {
    return await fetchJson(`${PYTHON_API}/challenge/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(challengeData),
    });
}

async function updateChallenge(challenge_id, patchData) {
    return await fetchJson(
        `${PYTHON_API}/challenge/${encodeURIComponent(challenge_id)}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patchData),
        },
    );
}

async function deleteChallenge(challenge_id) {
    return await fetchJson(
        `${PYTHON_API}/challenge/${encodeURIComponent(challenge_id)}`,
        { method: "DELETE" },
    );
}

async function getChallengeParticipants(challenge_id) {
    return await fetchJson(
        `${PYTHON_API}/challenge/${encodeURIComponent(challenge_id)}/participants`,
    );
}

async function getChallengeAllProofs(challenge_id, limit = 60) {
    const params = new URLSearchParams({ limit: String(limit) });
    return await fetchJson(
        `${PYTHON_API}/challenge/${encodeURIComponent(challenge_id)}/proofs?${params.toString()}`,
    );
}

// ── 모듈 내보내기 ────────────────────────────────────────────────────────────
module.exports = {
    // 헬퍼 / 커스텀 에러 — 라우터에서 `error instanceof FastApiError` 로 구분 가능
    fetchJson,
    FastApiError,

    findUser,
    createUser,
    updateUserPassword,
    updateUserProfile,
    findLoginIdByProfile,
    verifyForPasswordReset,
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
    createFeedWithImages,
    getFeeds,
    getFeedDetail,
    deleteFeed,
    toggleLike,
    checkLike,
    createComment,
    getComments,
    deleteComment,
    getMypageOverview,
    getMypageSummary,
    getMypageGallery,
    getStats,
    createNotice,
    listNotices,
    getNotice,
    updateNotice,
    deleteNotice,
    createReport,
    listReports,
    getReport,
    processReport,
    // 사용자 챌린지 helper
    getChallenges,
    getMyChallenges,
    getChallengeProofs,
    joinChallenge,
    createChallengeProof,
    cancelTodayChallengeProof,
    // 관리자 챌린지 helper
    createChallenge,
    updateChallenge,
    deleteChallenge,
    getChallengeParticipants,
    getChallengeAllProofs,
};
