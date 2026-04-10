import { useState, useCallback } from "react";
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
    const [routines, setRoutines] = useState([]); // ✅ HomePage용 임시 상태
    const [feedPosts, setFeedPosts] = useState([]); // ✅ FeedPage용 임시 상태

    const today = new Date();
    const month = today.getMonth() + 1;

    // 백엔드에서 루틴 가져오기 + 필드명 변환
    const fetchRoutines = useCallback(async () => {
        try {
            const res = await fetch("http://localhost:3000/routine", {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                const mapped = data.routines.map((r) => ({
                    id: r.routine_id,
                    title: r.title,
                    category: r.category,
                    time: r.time_slot,
                    routineMode: r.routine_mode,
                    goal: r.goal,
                    repeat: r.repeat_cycle,
                    description: r.description,
                    completed: false,
                    completedAt: "",
                    proofText: "",
                    proofFiles: [],
                }));
                setRoutines(mapped);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    // 로그인 성공 시 루틴도 함께 불러오기
    const handleLogin = async () => {
        setIsLoggedIn(true);
        await fetchRoutines();
    };

    // ✅ HomePage용 루틴 완료 함수들 (나중에 백엔드 연결 예정)
    const completeCheckRoutine = (id) => {
        const now = new Date();
        const timeText = now.toLocaleTimeString("ko-KR", {
            hour: "2-digit", minute: "2-digit", hour12: false,
        });
        setRoutines((prev) =>
            prev.map((r) => r.id === id ? { ...r, completed: true, completedAt: timeText } : r)
        );
    };

    const completeDetailRoutine = (id, proofText, proofFiles, uploadToFeed) => {
        const now = new Date();
        const timeText = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
        const dateText = now.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
        const targetRoutine = routines.find((r) => r.id === id);

        setRoutines((prev) =>
            prev.map((r) => r.id === id
                ? { ...r, completed: true, completedAt: timeText, proofText, proofFiles }
                : r
            )
        );

        if (uploadToFeed && targetRoutine) {
            setFeedPosts((prev) => [{
                id: Date.now(),
                routineId: id,
                routineTitle: targetRoutine.title,
                routineDescription: targetRoutine.description,
                category: targetRoutine.category,
                content: proofText,
                files: proofFiles,
                createdAt: dateText,
                createdTime: timeText,
            }, ...prev]);
        }
    };

    const cancelRoutineCompletion = (id) => {
        setRoutines((prev) =>
            prev.map((r) => r.id === id
                ? { ...r, completed: false, completedAt: "", proofText: "", proofFiles: [] }
                : r
            )
        );
        setFeedPosts((prev) => prev.filter((post) => post.routineId !== id));
    };

    // ✅ 로그아웃 백엔드 호출
    const handleLogout = async () => {
        try {
            await fetch("http://localhost:3000/logout", {
                method: "POST",
                credentials: "include",
            });
        } catch (error) {
            console.error(error);
        }
        setIsLoggedIn(false);
        setPage("home");
        setAuthPage("login");
    };
    
    const renderPage = () => {
        if (page === "home") return (
            <HomePage
                routines={routines}
                onCompleteCheck={completeCheckRoutine}
                onCompleteDetail={completeDetailRoutine}
                onCancelComplete={cancelRoutineCompletion}
            />
        );
        if (page === "routine") return <RoutinePage onRoutineChange={fetchRoutines} />;
        if (page === "feed") return <FeedPage feedPosts={feedPosts} />;
        if (page === "mypage") return <MyPage />;
        return (
            <HomePage
                routines={routines}
                onCompleteCheck={completeCheckRoutine}
                onCompleteDetail={completeDetailRoutine}
                onCancelComplete={cancelRoutineCompletion}
            />
        );
    };


    if (!isLoggedIn) {
        return (
            <div className="app">
                <main className="page-container">
                    {authPage === "login" && (
                        <LoginPage
                            onLogin={handleLogin}
                            onGoSignup={() => setAuthPage("signup")}
                        />
                    )}
                    {authPage === "signup" && (
                        <SignupPage onBackToLogin={() => setAuthPage("login")} />
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
                    <button onClick={handleLogout}>로그아웃</button>
                </nav>
            </header>
            <main className="page-container">{renderPage()}</main>
        </div>
    );
}

export default App;