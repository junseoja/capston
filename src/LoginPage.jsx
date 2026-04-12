// 로그인 페이지 컴포넌트
// - 아이디/비밀번호 입력 후 Express 백엔드(/login)로 POST 요청
// - 성공 시 부모(App.jsx)의 handleLogin 콜백 호출 → 홈으로 이동
// - Enter 키로도 로그인 실행 가능

import { useState } from "react";

// props:
//   onLogin    - 로그인 성공 시 App.jsx에서 전달한 handleLogin 함수
//   onGoSignup - 회원가입 페이지로 이동 시 App.jsx에서 전달한 navigate("/signup")
function LoginPage({ onLogin, onGoSignup }) {
  const [id, setId] = useState("");       // 아이디 입력값 상태
  const [password, setPassword] = useState(""); // 비밀번호 입력값 상태

  // 로그인 요청 함수
  // Express 서버(/login)에 POST → 성공 시 세션 쿠키 발급
  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 서버가 Set-Cookie로 sessionId를 내려줄 때 브라우저가 저장하도록 허용
        body: JSON.stringify({ id, password }),
      });

      const result = await response.json();

      if (result.success) {
        alert("로그인 성공");
        onLogin(); // App.jsx의 handleLogin 호출 → isLoggedIn = true, fetchRoutines, navigate("/")
      } else {
        alert(result.message); // 서버에서 보낸 에러 메시지 표시 (예: "비밀번호가 틀렸습니다.")
      }
    } catch (error) {
      // 서버가 꺼져있거나 네트워크 오류 시
      console.error("로그인 요청 실패:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">로그인</h1>
        <p className="login-subtitle">계정에 로그인하고 루틴을 시작해보세요.</p>

        <div className="login-form">
          {/* 아이디 입력 - Enter 키로 로그인 실행 */}
          <input
            type="text"
            placeholder="아이디를 입력하세요"
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          {/* 비밀번호 입력 - Enter 키로 로그인 실행 */}
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          <button onClick={handleLogin}>로그인</button>
        </div>

        {/* 회원가입 페이지 이동 링크 */}
        <p className="login-footer">
          아직 회원이 아니신가요?
          <span onClick={onGoSignup} style={{ cursor: "pointer" }}> 회원가입 </span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
