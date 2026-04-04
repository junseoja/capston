const fetch = require("node-fetch");

const PYTHON_API = "http://localhost:8000";

// 유저 조회
async function findUser(login_id) {
    const res = await fetch(`${PYTHON_API}/user/${login_id}`);
    const data = await res.json();
    return Object.keys(data).length ? data : null;
}

// 유저 생성
async function createUser(userInfo) {
    const res = await fetch(`${PYTHON_API}/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userInfo),
    });
    return await res.json();
}

// 루틴 생성
async function createRoutine(routineData) {
    const res = await fetch(`${PYTHON_API}/routine/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routineData),
    });
    return await res.json();
}

// 루틴 조회
async function getRoutines(user_id) {
    const res = await fetch(`${PYTHON_API}/routine/${user_id}`);
    return await res.json();
}

// 루틴 삭제
async function deleteRoutine(routine_id) {
    const res = await fetch(`${PYTHON_API}/routine/${routine_id}`, {
        method: "DELETE",
    });
    return await res.json();
}

module.exports = { findUser, createUser, createRoutine, getRoutines, deleteRoutine };
