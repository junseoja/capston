// Express → FastAPI 연결 모듈
// Express 라우터에서 직접 MySQL에 접근하지 않고,
// 이 모듈을 통해 FastAPI(포트 8000)에 HTTP 요청을 보내 데이터를 가져온다
// (실제 DB 쿼리는 FastAPI + pymysql에서 처리)

const fetch = require("node-fetch");

const PYTHON_API = "http://localhost:8000"; // FastAPI 서버 주소

// ── 유저 조회 ──────────────────────────────────────────────────────────────
// login_id로 유저 정보를 조회 → 로그인/중복체크 시 사용
// 유저가 없으면 null 반환 (FastAPI는 빈 객체 {} 반환)
async function findUser(login_id) {
    const res = await fetch(`${PYTHON_API}/user/${login_id}`);
    const data = await res.json();
    // 빈 객체({})면 유저 없음으로 처리
    return Object.keys(data).length ? data : null;
}

// ── 유저 생성 ──────────────────────────────────────────────────────────────
// 회원가입 시 호출 → FastAPI /user/signup 에 POST
// userInfo: { login_id, password, nickname, birth_date, gender, email }
async function createUser(userInfo) {
    const res = await fetch(`${PYTHON_API}/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userInfo),
    });
    return await res.json(); // { success: true } or HTTPException
}

// ── 루틴 생성 ──────────────────────────────────────────────────────────────
// routineData: { user_id, title, category, time_slot, routine_mode, goal, repeat_cycle, description }
async function createRoutine(routineData) {
    const res = await fetch(`${PYTHON_API}/routine/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routineData),
    });
    return await res.json();
}

// ── 루틴 목록 조회 ─────────────────────────────────────────────────────────
// user_id로 해당 유저의 모든 루틴을 조회 (생성일 내림차순)
async function getRoutines(user_id) {
    const res = await fetch(`${PYTHON_API}/routine/${user_id}`);
    return await res.json(); // 루틴 배열 반환
}

// ── 루틴 삭제 ──────────────────────────────────────────────────────────────
// routine_id로 특정 루틴 삭제
async function deleteRoutine(routine_id) {
    const res = await fetch(`${PYTHON_API}/routine/${routine_id}`, {
        method: "DELETE",
    });
    return await res.json();
}

module.exports = { findUser, createUser, createRoutine, getRoutines, deleteRoutine };
