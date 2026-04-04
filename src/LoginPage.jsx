import { useState } from "react"; // ✅ 추가 - 입력값 상태 관리를 위해 import

function LoginPage({ onLogin, onGoSignup }) {
  const [id, setId] = useState("");         // ✅ 추가 - 아이디 입력값 상태
  const [password, setPassword] = useState(""); // ✅ 추가 - 비밀번호 입력값 상태

  // ✅ 추가 - 로그인 버튼 클릭 시 백엔드로 요청
  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ 추가 - 쿠키 주고받기 위해 필수
        body: JSON.stringify({ id, password }),
      });

      const result = await response.json();

      if (result.success) {
        alert("로그인 성공");
        onLogin(); // ✅ 기존 - 부모한테 로그인 성공 알림
      } else {
        alert(result.message); // ✅ 추가 - 서버에서 받은 에러 메시지 표시
      }
    } catch (error) {
      console.error(error);
      alert("서버 오류가 발생했습니다."); // ✅ 추가 - 서버 연결 실패 시
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">로그인</h1>
        <p className="login-subtitle">계정에 로그인하고 루틴을 시작해보세요.</p>

        <div className="login-form">
          <input
            type="text"
            placeholder="아이디를 입력하세요"
            value={id}                              // ✅ 추가 - 상태 연결
            onChange={(e) => setId(e.target.value)} // ✅ 추가 - 입력값 변경 감지
          />
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}                              // ✅ 추가 - 상태 연결
            onChange={(e) => setPassword(e.target.value)} // ✅ 추가 - 입력값 변경 감지
          />
          <button onClick={handleLogin}>로그인</button> {/* ✅ 변경 - onLogin → handleLogin */}
        </div>

        <p className="login-footer">
          아직 회원이 아니신가요?
          <span onClick={onGoSignup} style={{ cursor: "pointer" }}> 회원가입 </span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;