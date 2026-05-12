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
import NoticeList from "./NoticeList";
import NoticeDetail from "./NoticeDetail";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("USER"); 
  const [page, setPage] = useState("home");
  const [authPage, setAuthPage] = useState("login");

  // 상세 페이지용 선택된 공지사항 상태
  const [selectedNotice, setSelectedNotice] = useState(null);

  const savedPosts = JSON.parse(localStorage.getItem("feedPosts") || "[]");
  const savedReports = JSON.parse(localStorage.getItem("reports") || "[]");
  const savedNoti = JSON.parse(localStorage.getItem("deleteNotifications") || "[]");
  const savedUsers = JSON.parse(localStorage.getItem("users") || '[{"id":1,"userId":"test123","password":"test123","nickname":"테스트","email":"demo@routine.com","gender":"female","birth":"2000-01-01"}]');
  const savedNotices = JSON.parse(localStorage.getItem("notices") || "[]");

  const [feedPosts, setFeedPosts] = useState(savedPosts);
  const [reports, setReports] = useState(savedReports);
  const [deleteNotifications, setDeleteNotifications] = useState(savedNoti);
  const [users, setUsers] = useState(savedUsers);
  const [notices, setNotices] = useState(savedNotices);

  useEffect(() => { localStorage.setItem("feedPosts", JSON.stringify(feedPosts)); }, [feedPosts]);
  useEffect(() => { localStorage.setItem("reports", JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem("deleteNotifications", JSON.stringify(deleteNotifications)); }, [deleteNotifications]);
  useEffect(() => { localStorage.setItem("users", JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem("notices", JSON.stringify(notices)); }, [notices]);

  const handleLoginSuccess = (role) => {
    setUserRole(role);
    setIsLoggedIn(true);
    if (role === "ADMIN") setPage("admin");
    else setPage("home");
  };

  const handleLogout = () => {
    sessionStorage.clear(); 
    setIsLoggedIn(false);
    setPage("home");
  };

  const today = new Date();
  const month = today.getMonth() + 1;
  const [routines, setRoutines] = useState([
    { id: 1, title: "아침 물 마시기", category: "건강", goal: "1잔", repeat: "매일", description: "하루를 가볍게 시작하는 작은 습관", time: "morning", routineMode: "check", completed: false, completedAt: "", proofText: "", proofFiles: [] },
    { id: 2, title: "점심 산책 15분", category: "운동", goal: "15분", repeat: "매일", description: "식사 후 가볍게 걷기", time: "lunch", routineMode: "check", completed: false, completedAt: "", proofText: "", proofFiles: [] },
    { id: 3, title: "자기 전 독서 20분", category: "독서", goal: "20분", repeat: "매일", description: "잠들기 전 책 읽는 습관 만들기", time: "dinner", routineMode: "detail", completed: false, completedAt: "", proofText: "", proofFiles: [] }
  ]);

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

  const handleAdminDelete = (reportId, feedId, targetNickname, reasonText) => {
    setFeedPosts((prev) => prev.filter((p) => p.id !== feedId));
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: "completed", adminComment: reasonText } : r));
    setDeleteNotifications((prev) => [...prev, { id: Date.now(), nickname: targetNickname, routineTitle: reports.find((r) => r.id === reportId)?.postContent.title, reason: reasonText }]);
  };

  // 공지사항 등록 시 알림 연동
  const handleSetNotices = (updatedNotices) => {
    if (updatedNotices.length > notices.length) {
      const newNotice = updatedNotices[0];
      setDeleteNotifications(prev => [
        { 
          id: Date.now(), 
          nickname: "전체사용자", 
          routineTitle: "새 공지사항", 
          reason: `[${newNotice.category}] ${newNotice.title} 공지가 등록되었습니다.` 
        }, 
        ...prev
      ]);
    }
    setNotices(updatedNotices);
  };

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
    if (page === "admin") return <AdminPage reports={reports} onDeleteConfirm={handleAdminDelete} notices={notices} setNotices={handleSetNotices} />;
    if (page === "home") return <HomePage routines={routines} onCompleteCheck={completeCheckRoutine} onCompleteDetail={completeDetailRoutine} onCancelComplete={cancelRoutineCompletion} deleteNotifications={deleteNotifications} setDeleteNotifications={setDeleteNotifications} currentUser={users[0]} notices={notices} />;
    if (page === "routine") return <RoutinePage routines={routines} onAddRoutine={addRoutine} onDeleteRoutine={deleteRoutine} />;
    if (page === "feed") return <FeedPage feedPosts={feedPosts} setFeedPosts={setFeedPosts} onReportPost={handleReportPost} currentUser={users[0]} />;
    if (page === "mypage") return <MyPage feedPosts={feedPosts} setPage={setPage} currentUser={users[0]} />;
    if (page === "stats") return <StatsPage setPage={setPage} />;
    
    // 공지사항 페이지 렌더링
    if (page === "notice_list") return <NoticeList notices={notices} setPage={setPage} setSelectedNotice={setSelectedNotice} />;
    if (page === "notice_detail") return <NoticeDetail notice={selectedNotice} setPage={setPage} />;
    
    return <HomePage routines={routines} onCompleteCheck={completeCheckRoutine} onCompleteDetail={completeDetailRoutine} onCancelComplete={cancelRoutineCompletion} notices={notices} />;
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

  // 관리자 모드 헤더 분리 시
  if (userRole === "ADMIN") {
    return <AdminPage reports={reports} onDeleteConfirm={handleAdminDelete} notices={notices} setNotices={handleSetNotices} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo" onClick={() => setPage("home")} style={{cursor: "pointer"}}>Routine Mate 🌙 {month}월</div>
        <nav className="nav">
          <h4>{users[0]?.nickname || "사용자"}님</h4>
          <button onClick={() => setPage("home")} className={page === "home" ? "active" : ""}>홈</button>
          <button onClick={() => setPage("routine")} className={page === "routine" ? "active" : ""}>루틴</button>
          <button onClick={() => setPage("feed")} className={page === "feed" ? "active" : ""}>피드</button>
          <button onClick={() => setPage("mypage")} className={page === "mypage" ? "active" : ""}>마이페이지</button>
          
          {/* [수정] 공지사항 버튼 디자인 통일 - 다른 버튼과 같은 클래스 구조 사용 */}
          <button 
            onClick={() => setPage("notice_list")} 
            className={page === "notice_list" || page === "notice_detail" ? "active" : ""}
          >
            공지사항
          </button>
          
          <button onClick={handleLogout}>로그아웃</button>
        </nav>
      </header>
      <main className="page-container">{renderPage()}</main>
    </div>
  );
}

export default App;