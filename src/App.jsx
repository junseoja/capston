import { useState } from "react";
import "./App.css";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RoutinePage from "./RoutinePage";
import FeedPage from "./FeedPage";
import MyPage from "./MyPage";
import SignupPage from "./SignupPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState("home");
  const [authPage, setAuthPage] = useState("login");
  //회원가입 시 중복체크를 할 수 있도록 임시 사용자 목록 상태 추가
  const [users, setUsers] = useState([
    {
      id: 1,
      userId: "test123",
      password: "test123",
      nickname: "테스트",
      email: "demo@routine.com",
      gender: "female",
      birth: "2000-01-01",
    },
  ]);
  const today = new Date();
  const month = today.getMonth() + 1;

  const [routines, setRoutines] = useState([
    {
      id: 1,
      title: "아침 물 1잔 마시기",
      category: "건강",
      goal: "1잔",
      repeat: "매일",
      description: "하루를 가볍게 시작하는 작은 습관",
      time: "morning",
      routineMode: "check",
      completed: false,
      completedAt: "",
      proofText: "",
      proofFiles: [],
    },
    {
      id: 2,
      title: "점심 산책 15분",
      category: "운동",
      goal: "15분",
      repeat: "매일",
      description: "식사 후 가볍게 걷기",
      time: "lunch",
      routineMode: "check",
      completed: false,
      completedAt: "",
      proofText: "",
      proofFiles: [],
    },
    {
      id: 3,
      title: "자기 전 독서 20분",
      category: "독서",
      goal: "20분",
      repeat: "매일",
      description: "잠들기 전 책 읽는 습관 만들기",
      time: "dinner",
      routineMode: "detail",
      completed: false,
      completedAt: "",
      proofText: "",
      proofFiles: [],
    },
  ]);

  const addRoutine = (newRoutine) => {
    setRoutines((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...newRoutine,
        completed: false,
        completedAt: "",
        proofText: "",
        proofFiles: [],
      },
    ]);
  };

  const completeCheckRoutine = (id) => {
    const now = new Date();
    const timeText = now.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    setRoutines((prev) =>
      prev.map((routine) =>
        routine.id === id
          ? {
            ...routine,
            completed: true,
            completedAt: timeText,
          }
          : routine
      )
    );
  };

  const completeDetailRoutine = (id, proofText, proofFiles) => {
    const now = new Date();
    const timeText = now.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    setRoutines((prev) =>
      prev.map((routine) =>
        routine.id === id
          ? {
            ...routine,
            completed: true,
            completedAt: timeText,
            proofText,
            proofFiles,
          }
          : routine
      )
    );
  };

  // 회원가입 완료 시 사용자 목록에 저장하는 함수
  const handleSignup = (newUser) => {
    setUsers((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...newUser,
      },
    ]);

    alert(`${newUser.nickname}님, 회원가입이 완료되었습니다.`);
    setAuthPage("login");
  };

  const renderPage = () => {
    if (page === "home") {
      return (
        <HomePage
          routines={routines}
          onCompleteCheck={completeCheckRoutine}
          onCompleteDetail={completeDetailRoutine}
        />
      );
    }

    if (page === "routine") {
      return <RoutinePage routines={routines} onAddRoutine={addRoutine} />;
    }

    if (page === "feed") return <FeedPage />;
    if (page === "mypage") return <MyPage />;

    return (
      <HomePage
        routines={routines}
        onCompleteCheck={completeCheckRoutine}
        onCompleteDetail={completeDetailRoutine}
      />
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="app">
        <main className="page-container">
          {authPage === "login" && (
            <LoginPage
              onLogin={() => setIsLoggedIn(true)}
              onGoSignup={() => setAuthPage("signup")}
            />
          )}

          {authPage === "signup" && (
            <SignupPage
              // 회원가입 페이지에 기존 사용자 목록 전달
              existingUsers={users}
              // 회원가입 성공 시 실행할 함수 전달
              onSignup={handleSignup}
              onBackToLogin={() => setAuthPage("login")} />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">Routine Mate 🌙 {month}월</div>

        <nav className="nav">
          <button onClick={() => setPage("home")}>홈</button>
          <button onClick={() => setPage("routine")}>루틴</button>
          <button onClick={() => setPage("feed")}>피드</button>
          <button onClick={() => setPage("mypage")}>마이페이지</button>
          <button onClick={() => setIsLoggedIn(false)}>로그아웃</button>
        </nav>
      </header>

      <main className="page-container">{renderPage()}</main>
    </div>
  );
}

export default App;