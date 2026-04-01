import { useState } from "react";

function LoginPage({ onLogin, onGoSignup }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, password }),
      });

      const result = await response.json();

      if (result.success) {
        alert("로그인 성공");
        onLogin();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert("서버 오류가 발생했습니다.");
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
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>로그인</button>
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
/*
import { useState } from "react";

function LoginPage({ onLogin, onGoSignup }) {
  //아이디 비번 변수 선언?
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      // 백엔드 서버에 로그인 요청 보내기
      const response = await fetch("http://localhost:3000/Login", {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify({ id, password }),
      });

      const result = await response.json();

      if (result.success) {
        alert("로그인 성공");
        onLogin();
      } else {
        alert(result.message);
      }
    }
    catch (error) {
      console.error(error);
      alert("서버 오류가 발생했습니다.");
    }
  };

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
*/


// react에서 로그인 기능을 구현하기 위해 useState를 사용하여 아이디와 비밀번호 상태를 관리하고, fetch API를 사용하여
// 백엔드 서버에 로그인 요청을 보내는 방식으로 코드를 수정하였습니다. 로그인 성공 시 알림을 띄우고 onLogin 함수를 호출하며,
// 실패 시에는 서버에서 받은 메시지를 알림으로 표시합니다. 또한, 서버 오류가 발생할 경우에도 사용자에게 알림을 제공합니다.

/*
import { useState } from "react";
//사용자가 입력한 값 저장

function LoginPage({ onLogin }) {
  //아이디 비번 변수 선언?
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      // 백엔드 서버에 로그인 요청 보내기
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, password }),
      });

      const result = await response.json();

      if (result.success) {
        alert("로그인 성공");
        onLogin();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert("서버 오류가 발생했습니다.");
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
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>로그인</button>
        </div>

        <p className="login-footer">
          아직 회원이 아니신가요? <span onClick={onGoSignup} style={{ cursor: "pointer" }}> 회원가입 </span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage

*/