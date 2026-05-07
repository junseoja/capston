import React, { useState } from "react"; // [추가] 상태 관리를 위해 추가

function LoginPage({ onLogin, onGoSignup }) {
  // [추가] 입력값 저장용 상태
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  // [추가] 관리자 체크 로직
  const handleLoginClick = () => {
    if (id === "admin" && pw === "1234") {
      onLogin("ADMIN");
    } else {
      onLogin("USER");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">로그인</h1>
        <p className="login-subtitle">계정에 로그인하고 루틴을 시작해보세요.</p>

        <div className="login-form">
          {/* [추가] value와 onChange 연결 */}
          <input type="text" placeholder="아이디를 입력하세요" value={id} onChange={(e) => setId(e.target.value)} />
          <input type="password" placeholder="비밀번호를 입력하세요" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button onClick={handleLoginClick}>로그인</button>
        </div>

        <p className="login-footer">
          아직 회원이 아니신가요? <span onClick={onGoSignup} style={{ cursor: "pointer" }}> 회원가입 </span>
        </p>
      </div>
    </div>
  )
}

export default LoginPage;