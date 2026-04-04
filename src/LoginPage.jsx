function LoginPage({ onLogin, onGoSignup }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">로그인</h1>
        <p className="login-subtitle">계정에 로그인하고 루틴을 시작해보세요.</p>

        <div className="login-form">
          <input type="text" placeholder="아이디를 입력하세요" />
          <input type="password" placeholder="비밀번호를 입력하세요" />
          <button onClick={onLogin}>로그인</button>
        </div>

        <p className="login-footer">
          아직 회원이 아니신가요? <span onClick={onGoSignup} style={{ cursor: "pointer" }}> 회원가입 </span>
        </p>
      </div>
    </div>
  )
}

export default LoginPage