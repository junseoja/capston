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

module.exports = { findUser, createUser };