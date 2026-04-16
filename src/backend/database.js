// ============================================================
// Express ↔ FastAPI 연결 모듈 (database.js)
// ============================================================
// 역할:
//   Express 라우터(login.js, routine.js)에서 호출하며,
//   실제 DB 작업은 FastAPI(포트 8000)에 HTTP 요청으로 위임.
//
// 아키텍처:
//   Express 라우터 → 이 모듈의 함수 → HTTP fetch → FastAPI 라우터 → MySQL
//
// 함수 분류:
//   유저 관련  : findUser, createUser
//   세션 관련  : createSession, findSession, deleteSession
//   루틴 관련  : createRoutine, getRoutines, deleteRoutine
//   완료 관련  : createCompletion, getTodayCompletions, getCompletionHistory, deleteCompletion
// ============================================================

const fetch = require("node-fetch"); // HTTP 요청 라이브러리 (node.js 환경용)

const PYTHON_API = process.env.PYTHON_API || "http://localhost:8000"; // FastAPI 서버 주소

// ─── 유저 관련 함수 ────────────────────────────────────────────────────────

/**
 * 로그인 아이디로 유저 정보 조회
 *
 * FastAPI GET /user/{login_id} 호출.
 * 로그인 처리, /me 엔드포인트에서 유저 정보 가져올 때 사용.
 *
 * @param {string} login_id - 로그인 아이디 (예: "hong123")
 * @returns {object|null} 유저 정보 객체 또는 null (없으면 null)
 *   - 반환 예시: { user_id, login_id, password, nickname, email, gender, birth_date }
 */
async function findUser(login_id) {
    const res = await fetch(`${PYTHON_API}/user/${login_id}`);
    const data = await res.json();
    // FastAPI는 유저가 없을 때 빈 객체 {} 반환 → Object.keys로 존재 여부 판단
    return Object.keys(data).length ? data : null;
}

/**
 * 회원가입 - 유저 생성
 *
 * FastAPI POST /user/signup 호출.
 * login.js의 POST /signup 라우트에서 유효성 검사 후 호출됨.
 *
 * @param {object} userInfo - 유저 정보
 *   @param {string} userInfo.login_id   - 로그인 아이디
 *   @param {string} userInfo.password   - 비밀번호 (현재 평문 - TODO: 해시 처리 필요)
 *   @param {string} userInfo.nickname   - 닉네임
 *   @param {string} userInfo.birth_date - 생년월일 "YYYY-MM-DD" 형식
 *   @param {string} userInfo.gender     - 성별 ("남"/"여"/"기타")
 *   @param {string} userInfo.email      - 이메일
 * @returns {object} 성공 시 { success: true }, 중복 시 HTTP 409 에러
 */
async function createUser(userInfo) {
    const res = await fetch(`${PYTHON_API}/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userInfo),
    });
    return await res.json();
}

// ─── 세션 관련 함수 ────────────────────────────────────────────────────────

/**
 * 세션 DB에 저장
 *
 * FastAPI POST /user/session 호출.
 * 로그인 성공 시 세션 ID와 유저 ID를 sessions 테이블에 저장.
 * 세션은 1일 후 자동 만료됨 (expires_at = NOW() + 1 DAY).
 *
 * @param {string} session_id - UUID v4 세션 ID (Express에서 uuid 라이브러리로 생성)
 * @param {string} user_id    - UUID v7 유저 ID (users 테이블의 PK)
 * @returns {object} { success: true }
 */
async function createSession(session_id, user_id) {
    const res = await fetch(`${PYTHON_API}/user/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id, user_id }),
    });
    return await res.json();
}

/**
 * 세션 ID로 세션 정보 조회 (인증 미들웨어 역할)
 *
 * FastAPI GET /user/session/{session_id} 호출.
 * 모든 보호된 라우트(/routine, /me, /logout)에서 쿠키의 sessionId로 호출됨.
 * 만료된 세션은 자동으로 null 반환.
 *
 * @param {string} session_id - 브라우저 쿠키에서 추출한 세션 ID
 * @returns {object|null} 세션 + 유저 정보 또는 null
 *   - 반환 예시: { session_id, user_id, login_id, nickname }
 *   - 만료 또는 없는 세션: null
 */
async function findSession(session_id) {
    const res = await fetch(`${PYTHON_API}/user/session/${session_id}`);
    const data = await res.json();
    // FastAPI는 세션이 없거나 만료되면 빈 객체 {} 반환
    return Object.keys(data).length ? data : null;
}

/**
 * 세션 삭제 (로그아웃)
 *
 * FastAPI DELETE /user/session/{session_id} 호출.
 * 로그아웃 시 sessions 테이블에서 해당 세션 레코드를 삭제.
 *
 * @param {string} session_id - 삭제할 세션 ID
 * @returns {object} { success: true }
 */
async function deleteSession(session_id) {
    const res = await fetch(`${PYTHON_API}/user/session/${session_id}`, {
        method: "DELETE",
    });
    return await res.json();
}

// ─── 루틴 관련 함수 ────────────────────────────────────────────────────────

/**
 * 루틴 생성
 *
 * FastAPI POST /routine/ 호출.
 * routine.js의 POST /routine 라우트에서 세션 인증 후 호출됨.
 * user_id는 세션에서 자동으로 주입되어 전달됨.
 *
 * @param {object} routineData - 루틴 정보
 *   @param {string} routineData.user_id      - UUID v7 (세션에서 자동 주입)
 *   @param {string} routineData.title        - 루틴 제목
 *   @param {string} routineData.category     - 카테고리
 *   @param {string} routineData.time_slot    - 시간대 (morning/lunch/dinner)
 *   @param {string} routineData.routine_mode - 완료 방식 (check/detail)
 *   @param {string} routineData.goal         - 목표 시간 (예: "07:30")
 *   @param {string} routineData.repeat_cycle - 반복 주기
 *   @param {string} routineData.description  - 루틴 설명
 * @returns {object} { success: true }
 */
async function createRoutine(routineData) {
    const res = await fetch(`${PYTHON_API}/routine/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routineData),
    });
    return await res.json();
}

/**
 * 유저의 루틴 목록 조회
 *
 * FastAPI GET /routine/{user_id} 호출.
 * routine.js의 GET /routine 라우트에서 세션 인증 후 호출됨.
 * 최신 생성 순(created_at DESC)으로 정렬된 배열 반환.
 *
 * @param {string} user_id - UUID v7 유저 ID (세션에서 추출)
 * @returns {Array} 루틴 목록 배열 (DB 컬럼명 그대로: routine_id, time_slot 등)
 */
async function getRoutines(user_id) {
    const res = await fetch(`${PYTHON_API}/routine/${user_id}`);
    return await res.json(); // 배열 그대로 반환 (Express에서 { success: true, routines: [...] }로 감싸서 전달)
}

/**
 * 루틴 삭제 (본인 소유 검증 포함)
 *
 * FastAPI DELETE /routine/{routine_id}?user_id={user_id} 호출.
 * FastAPI에서 WHERE routine_id=? AND user_id=? 조건으로 삭제하여
 * 다른 유저의 루틴을 삭제하지 못하도록 차단.
 *
 * @param {string} routine_id - 삭제할 루틴의 UUID v7
 * @param {string} user_id    - 요청한 유저의 UUID v7 (세션에서 추출)
 * @returns {object} { success: true } 또는 { success: false, message: "..." }
 */
async function deleteRoutine(routine_id, user_id) {
    const res = await fetch(
        `${PYTHON_API}/routine/${routine_id}?user_id=${encodeURIComponent(user_id)}`,
        { method: "DELETE" }
    );
    return await res.json();
}

// ─── 완료 이력 관련 함수 ───────────────────────────────────────────────────

/**
 * 유저의 루틴 완료 이력 조회 (최근 20건)
 *
 * FastAPI GET /completion/history/{user_id} 호출.
 * completion.js의 GET /completion/history 라우트에서 세션 인증 후 호출됨.
 * 마이페이지 "최근 활동" 섹션에서 사용.
 *
 * @param {string} user_id - UUID v7 유저 ID (세션에서 추출)
 * @returns {Array} 완료 이력 배열 (최신 20건)
 *   각 항목: { completion_id, routine_id, user_id, proof_text,
 *              completed_at, title, category, routine_mode }
 */
async function getCompletionHistory(user_id) {
    const res = await fetch(`${PYTHON_API}/completion/history/${user_id}`);
    return await res.json(); // 배열 그대로 반환
}

/**
 * 루틴 완료 기록 생성
 *
 * [추가] 홈 화면의 완료 처리를 DB에 영속화하기 위한 함수.
 * Express completion.js의 POST /completion 라우트에서 세션 인증 후 호출됨.
 *
 * @param {object} completionData
 *   @param {string} completionData.routine_id - 완료한 루틴 UUID v7
 *   @param {string} completionData.user_id    - 세션에서 추출한 유저 UUID v7
 *   @param {string} completionData.proof_text - 인증 글 (체크 루틴은 빈 문자열)
 * @returns {object} { success: true, completion_id: "uuid-v7-..." }
 */
async function createCompletion(completionData) {
    const res = await fetch(`${PYTHON_API}/completion/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completionData),
    });
    return await res.json();
}

/**
 * 오늘 완료한 루틴 목록 조회
 *
 * [추가] 새로고침 후에도 오늘 완료 상태를 복원할 수 있도록
 * FastAPI GET /completion/today/{user_id}를 중계.
 *
 * @param {string} user_id - 세션에서 추출한 유저 UUID v7
 * @returns {Array} 오늘 완료 기록 배열
 */
async function getTodayCompletions(user_id) {
    const res = await fetch(`${PYTHON_API}/completion/today/${user_id}`);
    return await res.json();
}

/**
 * 완료 기록 삭제 (완료 취소)
 *
 * [추가] completion_id만으로 삭제하지 않고,
 * user_id를 함께 전달하여 FastAPI에서 소유자 검증까지 수행.
 *
 * @param {string} completion_id - 삭제할 완료 기록 UUID v7
 * @param {string} user_id       - 요청한 유저의 UUID v7 (세션에서 추출)
 * @returns {object} { success: true } 또는 { success: false, message: "..." }
 */
async function deleteCompletion(completion_id, user_id) {
    const res = await fetch(
        `${PYTHON_API}/completion/${completion_id}?user_id=${encodeURIComponent(user_id)}`,
        { method: "DELETE" }
    );
    return await res.json();
}

// ── 모듈 내보내기 ────────────────────────────────────────────────────────────
module.exports = {
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
};
