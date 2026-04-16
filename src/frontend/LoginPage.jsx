// ============================================================
// LoginPage.jsx - 로그인 페이지 컴포넌트
// ============================================================
// 역할:
//   - 아이디/비밀번호 입력 후 Express 백엔드(/login)로 POST 요청
//   - 성공 시 부모(App.jsx)의 handleLogin 콜백 호출 → 홈("/")으로 이동
//   - Enter 키로도 로그인 실행 가능 (onKeyDown 이벤트)
//
// Props:
//   onLogin    - 로그인 성공 시 호출할 콜백 (App.jsx의 handleLogin)
//               isLoggedIn = true + fetchRoutines + navigate("/") 처리
//   onGoSignup - 회원가입 버튼 클릭 시 호출 (App.jsx의 navigate("/signup"))
// ============================================================

import { useState } from "react";
import { EXPRESS_URL } from "./config";

function LoginPage({ onLogin, onGoSignup }) {
    // 아이디 입력값 상태 (제어 컴포넌트 방식)
    const [id, setId] = useState("");

    // 비밀번호 입력값 상태
    const [password, setPassword] = useState("");

    // ── 로그인 요청 함수 ──────────────────────────────────────────────────────

    /**
     * handleLogin - Express POST /login에 아이디/비밀번호 전송
     *
     * 처리 흐름:
     *   1. Express /login으로 POST 요청
     *   2. 성공 → 서버가 Set-Cookie로 sessionId 쿠키 발급
     *   3. onLogin() 호출 → App.jsx에서 isLoggedIn = true + 루틴 fetch + navigate("/")
     *
     * credentials: "include" 필수:
     *   서버가 Set-Cookie 헤더로 내려주는 sessionId를 브라우저가 저장하려면
     *   요청에 credentials 옵션이 "include"여야 함
     *   (Express에서도 cors({ credentials: true })가 설정되어 있어야 동작)
     */
    const handleLogin = async () => {
        try {
            const response = await fetch(`${EXPRESS_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // 쿠키 저장/전송 허용
                body: JSON.stringify({ id, password }),
            });

            const result = await response.json();

            if (result.success) {
                alert("로그인 성공");
                // App.jsx의 handleLogin 호출
                // → setIsLoggedIn(true) + fetchCurrentUser() + fetchRoutines() + navigate("/")
                onLogin();
            } else {
                // 서버에서 내려준 에러 메시지 표시 (예: "비밀번호가 틀렸습니다.")
                alert(result.message);
            }
        } catch (error) {
            // 서버가 꺼져있거나 네트워크 오류 시
            console.error("로그인 요청 실패:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    // ── 렌더링 ────────────────────────────────────────────────────────────────

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">로그인</h1>
                <p className="login-subtitle">계정에 로그인하고 루틴을 시작해보세요.</p>

                <div className="login-form">
                    {/* 아이디 입력
                        onKeyDown: Enter 키 입력 시 handleLogin 실행 (UX 개선) */}
                    <input
                        type="text"
                        placeholder="아이디를 입력하세요"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />

                    {/* 비밀번호 입력
                        type="password": 입력값이 마스킹되어 화면에 보이지 않음
                        onKeyDown: Enter 키 입력 시 handleLogin 실행 */}
                    <input
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />

                    <button onClick={handleLogin}>로그인</button>
                </div>

                {/* 회원가입 페이지 이동 링크
                    cursor: "pointer" 스타일로 클릭 가능함을 시각적으로 표시 */}
                <p className="login-footer">
                    아직 회원이 아니신가요?
                    <span onClick={onGoSignup} style={{ cursor: "pointer" }}>
                        {" "}회원가입{" "}
                    </span>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
