import { useState } from "react";
import "./App.css";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RoutinePage from "./RoutinePage";
import FeedPage from "./FeedPage";
import MyPage from "./MyPage";
import SignupPage from "./SignupPage";
import StatsPage from "./StatsPage";
import AdminPage from "./AdminPage"; // [추가]

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("USER"); // [추가] 권한 상태
  const [page, setPage] = useState("home");
  const [authPage, setAuthPage] = useState("login");

  // [추가] 로그인 성공 시 권한 처리
  const handleLoginSuccess = (role) => {
    setUserRole(role);
    setIsLoggedIn(true);
    if (role === "ADMIN") setPage("admin");
    else setPage("home");
  };

  const [users, setUsers] = useState([{ id: 1, userId: "test123", password: "test123", nickname: "테스트", email: "demo@routine.com", gender: "female", birth: "2000-01-01" }]);
  const [feedPosts, setFeedPosts] = useState([]);
  const today = new Date();
  const month = today.getMonth() + 1;
  const [routines, setRoutines] = useState([
    { id: 1, title: "아침 물 마시기", category: "건강", goal: "1잔", repeat: "매일", description: "하루를 가볍게 시작하는 작은 습관", time: "morning", routineMode: "check", completed: false, completedAt: "", proofText: "", proofFiles: [] },
    { id: 2, title: "점심 산책 15분", category: "운동", goal: "15분", repeat: "매일", description: "식사 후 가볍게 걷기", time: "lunch", routineMode: "check", completed: false, completedAt: "", proofText: "", proofFiles: [] },
    { id: 3, title: "자기 전 독서 20분", category: "독서", goal: "20분", repeat: "매일", description: "잠들기 전 책 읽는 습관 만들기", time: "dinner", routineMode: "detail", completed: false, completedAt: "", proofText: "", proofFiles: [] }
  ]);

  const addRoutine = (newRoutine) => { setRoutines((prev) => [...prev, { id: Date.now(), ...newRoutine, completed: false, completedAt: "", proofText: "", proofFiles: [] }]); };
  const completeCheckRoutine = (id) => { const now = new Date(); const timeText = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }); setRoutines((prev) => prev.map((routine) => routine.id === id ? { ...routine, completed: true, completedAt: timeText } : routine )); };
  const completeDetailRoutine = (id, proofText, proofFiles, uploadToFeed) => { const now = new Date(); const timeText = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }); const dateText = now.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }); const targetRoutine = routines.find((routine) => routine.id === id); setRoutines((prev) => prev.map((routine) => routine.id === id ? { ...routine, completed: true, completedAt: timeText, proofText, proofFiles } : routine )); if (uploadToFeed && targetRoutine) { setFeedPosts((prev) => [ { id: Date.now(), routineId: id, routineTitle: targetRoutine.title, routineDescription: targetRoutine.description, category: targetRoutine.category, userName: users[0]?.nickname || "나", content: proofText, files: proofFiles, createdAt: dateText, createdTime: timeText }, ...prev ]); } };
  const cancelRoutineCompletion = (id) => { setRoutines((prev) => prev.map((routine) => routine.id === id ? { ...routine, completed: false, completedAt: "", proofText: "", proofFiles: [] } : routine )); setFeedPosts((prev) => prev.filter((post) => post.routineId !== id)); };
  const deleteRoutine = (id) => { setRoutines((prev) => prev.filter((routine) => routine.id !== id)); setFeedPosts((prev) => prev.filter((post) => post.routineId !== id)); };
  const handleSignup = (newUser) => { setUsers((prev) => [...prev, { id: Date.now(), ...newUser }]); alert(`${newUser.nickname}님, 회원가입이 완료되었습니다.`); setAuthPage("login"); };

  const renderPage = () => {
    if (page === "admin") return <AdminPage />; // [추가]
    if (page === "home") return <HomePage routines={routines} onCompleteCheck={completeCheckRoutine} onCompleteDetail={completeDetailRoutine} onCancelComplete={cancelRoutineCompletion} />;
    if (page === "routine") return <RoutinePage routines={routines} onAddRoutine={addRoutine} onDeleteRoutine={deleteRoutine} />;
    if (page === "feed") return <FeedPage feedPosts={feedPosts} />;
    if (page === "mypage") return <MyPage feedPosts={feedPosts} setPage={setPage} />;
    if (page === "stats") return <StatsPage setPage={setPage} />;
    return <HomePage routines={routines} onCompleteCheck={completeCheckRoutine} onCompleteDetail={completeDetailRoutine} onCancelComplete={cancelRoutineCompletion} />;
  };

  if (!isLoggedIn) {
    return (
      <div className="app">
        <main className="page-container">
          {authPage === "login" && <LoginPage onLogin={handleLoginSuccess} onGoSignup={() => setAuthPage("signup")} />}
          {authPage === "signup" && <SignupPage existingUsers={users} onSignup={handleSignup} onBackToLogin={() => setAuthPage("login")} />}
        </main>
      </div>
    );
  }

  // [추가] 여기서 관리자일 때 화면을 완전히 가로챕니다. (상단바 안 나오게 함)
  if (userRole === "ADMIN") {
    return <AdminPage />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo" onClick={() => setPage("home")} style={{cursor: "pointer"}}>Routine Mate 🌙 {month}월</div>
        <nav className="nav">
          <h4>{users[0]?.nickname || "사용자"}님</h4>
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