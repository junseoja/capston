const fetch = require("node-fetch"); // HTTP 요청 라이브러리

const PYTHON_API = "http://localhost:8000"; // FastAPI 서버 주소

// ───── 유저 관련 ─────

/**
 * 로그인 아이디로 유저 정보 조회
 * @param {string} login_id - 로그인 아이디
 * @returns {object|null} 유저 정보 또는 null
 */
async function findUser(login_id) {
    const res = await fetch(`${PYTHON_API}/user/${login_id}`);
    const data = await res.json();
    return Object.keys(data).length ? data : null;
}

/**
 * 회원가입 - 유저 생성
 * @param {object} userInfo - 유저 정보 (login_id, password, nickname, birth_date, gender, email)
 * @returns {object} 성공 여부
 */
async function createUser(userInfo) {
    const res = await fetch(`${PYTHON_API}/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userInfo),
    });
    return await res.json();
}

// ───── 세션 관련 ─────

/**
 * 세션 DB에 저장
 * @param {string} session_id - UUID v4 세션 ID
 * @param {string} user_id - UUID v7 유저 ID
 * @returns {object} 성공 여부
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
 * 세션 ID로 세션 정보 조회
 * @param {string} session_id - 쿠키에서 가져온 세션 ID
 * @returns {object|null} 세션 정보 (user_id, login_id, nickname) 또는 null
 */
async function findSession(session_id) {
    const res = await fetch(`${PYTHON_API}/user/session/${session_id}`);
    const data = await res.json();
    return Object.keys(data).length ? data : null;
}

/**
 * 세션 삭제 (로그아웃)
 * @param {string} session_id - 삭제할 세션 ID
 * @returns {object} 성공 여부
 */
async function deleteSession(session_id) {
    const res = await fetch(`${PYTHON_API}/user/session/${session_id}`, {
        method: "DELETE",
    });
    return await res.json();
}

// ───── 루틴 관련 ─────

/**
 * 루틴 생성
 * @param {object} routineData - 루틴 정보 (user_id, title, category, time_slot, routine_mode, goal, repeat_cycle, description)
 * @returns {object} 성공 여부
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
 * @param {string} user_id - UUID v7 유저 ID
 * @returns {Array} 루틴 목록
 */
async function getRoutines(user_id) {
    const res = await fetch(`${PYTHON_API}/routine/${user_id}`);
    return await res.json();
}

/**
 * 루틴 삭제
 * @param {string} routine_id - UUID v7 루틴 ID
 * @returns {object} 성공 여부
 */
async function deleteRoutine(routine_id) {
    const res = await fetch(`${PYTHON_API}/routine/${routine_id}`, {
        method: "DELETE",
    });
    return await res.json();
}

module.exports = {
    findUser,
    createUser,
    createSession,
    findSession,
    deleteSession,
    createRoutine,
    getRoutines,
    deleteRoutine,
};