import { useState, useEffect } from "react";
import "./App.css";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RoutinePage from "./RoutinePage";
import FeedPage from "./FeedPage";
import MyPage from "./MyPage";
import SignupPage from "./SignupPage";
import StatsPage from "./StatsPage";
import AdminPage from "./AdminPage"; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("USER"); 
  const [page, setPage] = useState("home");
  const [authPage, setAuthPage] = useState("login");

  // ── [저장 로직] 로컬스토리지에서 기존 데이터 불러오기 ──
  const savedPosts = JSON.parse(localStorage.getItem("feedPosts") || "[]");
  const savedReports = JSON.parse(localStorage.getItem("reports") || "[]");
  const savedNoti = JSON.parse(localStorage.getItem("deleteNotifications") || "[]");
  const savedUsers = JSON.parse(localStorage.getItem("users") || '[{"id":1,"userId":"test123","password":"test123","nickname":"테스트","email":"demo@routine.com","gender":"female","birth":"2000-01-01"}]');

  // ── [상태 관리] 불러온 데이터로 초기값 설정 ──
  const [feedPosts, setFeedPosts] = useState(savedPosts);
  const [reports, setReports] = useState(savedReports);
  const [deleteNotifications, setDeleteNotifications] = useState(savedNoti);
  const [users, setUsers] = useState(savedUsers);

  // ── [저장 로직] 데이터가 변할 때마다 자동으로 브라우저에 저장 ──
  useEffect(() => { localStorage.setItem("feedPosts", JSON.stringify(feedPosts)); }, [feedPosts]);
  useEffect(() => { localStorage.setItem("reports", JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem("deleteNotifications", JSON.stringify(deleteNotifications)); }, [deleteNotifications]);
  useEffect(() => { localStorage.setItem("users", JSON.stringify(users)); }, [users]);

  // [기능] 로그인/권한 처리
  const handleLoginSuccess = (role) => {
    setUserRole(role);
    setIsLoggedIn(true);
    if (role === "ADMIN") setPage("admin");
    else setPage("home");
  };

  const today = new Date();
  const month = today.getMonth() + 1;
  const [routines, setRoutines] = useState([
    { id: 1, title: "아침 물 마시기", category: "건강", goal: "1잔", repeat: "매일", description: "하루를 가볍게 시작하는 작은 습관", time: "morning", routineMode: "check", completed: false, completedAt: "", proofText: "", proofFiles: [] },
    { id: 2, title: "점심 산책 15분", category: "운동", goal: "15분", repeat: "매일", description: "식사 후 가볍게 걷기", time: "lunch", routineMode: "check", completed: false, completedAt: "", proofText: "", proofFiles: [] },
    { id: 3, title: "자기 전 독서 20분", category: "독서", goal: "20분", repeat: "매일", description: "잠들기 전 책 읽는 습관 만들기", time: "dinner", routineMode: "detail", completed: false, completedAt: "", proofText: "", proofFiles: [] }
  ]);

  // [기능] 신고 접수 로직
  const handleReportPost = (post, reason) => {
    setReports((prev) => {
      const existing = prev.find((r) => r.feedId === post.id);
      const reportDate = new Date().toLocaleString();
      if (existing) {
        return prev.map((r) => r.feedId === post.id ? { ...r, reportCount: r.reportCount + 1, reporters: [...r.reporters, { user: users[0]?.nickname || "나", reason, date: reportDate }] } : r );
      }
      return [{ id: Date.now(), feedId: post.id, user: post.nickname || post.userName, reason: reason, reportCount: 1, status: "pending", date: reportDate, reporters: [{ user: users[0]?.nickname || "나", reason, date: reportDate }], postContent: { title: post.routineTitle, text: post.content, img: post.files?.[0]?.url || "" } }, ...prev];
    });
    alert("신고가 접수되었습니다.");
  };

  // [기능] 관리자 삭제 로직
  const handleAdminDelete = (reportId, feedId, targetNickname, reasonText) => {
    setFeedPosts((prev) => prev.filter((p) => p.id !== feedId));
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: "completed", adminComment: reasonText } : r));
    setDeleteNotifications((prev) => [...prev, { id: Date.now(), nickname: targetNickname, routineTitle: reports.find((r) => r.id === reportId)?.postContent.title, reason: reasonText }]);
  };

  // 루틴 핸들러 (원본 로직 그대로 유지)
  const addRoutine = (newRoutine) => { setRoutines((prev) => [...prev, { id: Date.now(), ...newRoutine, completed: false, completedAt: "", proofText: "", proofFiles: [] }]); };
  const completeCheckRoutine = (id) => { const now = new Date(); const timeText = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }); setRoutines((prev) => prev.map((routine) => routine.id === id ? { ...routine, completed: true, completedAt: timeText } : routine )); };
  
  const completeDetailRoutine = (id, proofText, proofFiles, uploadToFeed) => {
    const now = new Date();
    const timeText = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
    const dateText = now.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
    const targetRoutine = routines.find((routine) => routine.id === id);
    setRoutines((prev) => prev.map((routine) => routine.id === id ? { ...routine, completed: true, completedAt: timeText, proofText, proofFiles } : routine));
    if (uploadToFeed && targetRoutine) {
      setFeedPosts((prev) => [{ id: Date.now(), routineId: id, routineTitle: targetRoutine.title, routineDescription: targetRoutine.description, category: targetRoutine.category, userName: users[0]?.nickname || "나", content: proofText, files: proofFiles, createdAt: dateText, createdTime: timeText, likes: 0, liked: false, comments: [] }, ...prev]);
    }
  };

  const cancelRoutineCompletion = (id) => { setRoutines((prev) => prev.map((routine) => routine.id === id ? { ...routine, completed: false, completedAt: "", proofText: "", proofFiles: [] } : routine )); setFeedPosts((prev) => prev.filter((post) => post.routineId !== id)); };
  const deleteRoutine = (id) => { setRoutines((prev) => prev.filter((routine) => routine.id !== id)); setFeedPosts((prev) => prev.filter((post) => post.routineId !== id)); };
  const handleSignup = (newUser) => { setUsers((prev) => [...prev, { id: Date.now(), ...newUser }]); alert(`${newUser.nickname}님, 회원가입이 완료되었습니다.`); setAuthPage("login"); };

  const renderPage = () => {
    if (page === "admin") return <AdminPage reports={reports} onDeleteConfirm={handleAdminDelete} />;
    if (page === "home") return <HomePage routines={routines} onCompleteCheck={completeCheckRoutine} onCompleteDetail={completeDetailRoutine} onCancelComplete={cancelRoutineCompletion} deleteNotifications={deleteNotifications} setDeleteNotifications={setDeleteNotifications} currentUser={users[0]} />;
    if (page === "routine") return <RoutinePage routines={routines} onAddRoutine={addRoutine} onDeleteRoutine={deleteRoutine} />;
    if (page === "feed") return <FeedPage feedPosts={feedPosts} setFeedPosts={setFeedPosts} onReportPost={handleReportPost} currentUser={users[0]} />;
    if (page === "mypage") return <MyPage feedPosts={feedPosts} setPage={setPage} currentUser={users[0]} />;
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

  if (userRole === "ADMIN") {
    return <AdminPage reports={reports} onDeleteConfirm={handleAdminDelete} />;
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