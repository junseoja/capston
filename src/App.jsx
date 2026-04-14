// 앱 전체의 루트 컴포넌트
// - 로그인 상태(isLoggedIn)를 전역으로 관리
// - 루틴 데이터(routines)를 중앙에서 fetch하여 하위 컴포넌트에 전달 (단일 진실 공급원)
// - react-router-dom의 Routes로 URL 기반 페이지 이동 처리

import { useState, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RoutinePage from "./RoutinePage";
import FeedPage from "./FeedPage";
import MyPage from "./MyPage";
import SignupPage from "./SignupPage";

function App() {
    // useNavigate: URL 이동을 프로그래밍적으로 처리 (예: 로그인 후 "/" 로 이동)
    const navigate = useNavigate();

    // 로그인 여부 상태 - true면 메인 앱, false면 로그인/회원가입 화면 표시
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // 루틴 목록 상태 - 백엔드에서 fetch한 뒤 필드명 변환하여 저장
    // HomePage, RoutinePage에 props로 전달하여 동일 데이터 공유
    const [routines, setRoutines] = useState([]);

    // 피드 게시물 상태 - 상세 루틴 인증 시 "피드 업로드" 체크하면 추가됨
    const [feedPosts, setFeedPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // 상단바에 표시할 현재 월
    const today = new Date();
    const month = today.getMonth() + 1;

    // ── 루틴 데이터 fetch ──────────────────────────────────────────────────────
    // useCallback: 함수 재생성 방지 (RoutinePage에 props로 넘길 때 불필요한 리렌더 방지)
    const fetchRoutines = useCallback(async () => {
        try {
            const res = await fetch("http://localhost:3000/routine", {
                credentials: "include", // 쿠키(세션ID)를 요청에 포함 → 로그인 인증
            });
            const data = await res.json();

            if (data.success) {
                // DB 컬럼명을 컴포넌트에서 쓰기 편한 이름으로 변환 (필드 매핑)
                // DB: routine_id, time_slot, routine_mode, repeat_cycle
                // 컴포넌트: id, time, routineMode, repeat
                const mapped = data.routines.map((r) => ({
                    id: r.routine_id,           // 루틴 고유 ID
                    title: r.title,             // 루틴 제목
                    category: r.category,       // 카테고리 (운동, 공부 등)
                    time: r.time_slot,          // 시간대 (morning / lunch / dinner)
                    routineMode: r.routine_mode, // 완료 방식 (check / detail)
                    goal: r.goal,               // 목표 시간 (예: "07:30")
                    repeat: r.repeat_cycle,     // 반복 주기 (예: "월, 수, 금" 또는 "매일")
                    description: r.description, // 루틴 설명
                    // 아래는 프론트에서만 쓰는 완료 관련 상태 (DB에 없음, 추후 연결 예정)
                    completed: false,
                    completedAt: "",
                    proofText: "",
                    proofFiles: [],
                }));
                setRoutines(mapped);
            }
        } catch (error) {
            console.error("루틴 fetch 실패:", error);
        }
    }, []);

    // ── 로그인 처리 ────────────────────────────────────────────────────────────
    // LoginPage에서 로그인 성공 콜백으로 호출됨
    // 로그인 상태 전환 → 루틴 fetch → 홈("/")으로 이동
    const fetchCurrentUser = useCallback(async () => {
        try {
            const res = await fetch("http://localhost:3000/me", {
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setCurrentUser(data.user);
                return data.user;
            }
        } catch (error) {
            console.error("?좎? ?뺣낫 fetch ?ㅽ뙣:", error);
        }

        setCurrentUser(null);
        return null;
    }, []);

    // 로그인 성공 시 상태 업데이트 및 루틴 데이터 fetch 후 홈으로 이동
    const handleLogin = async () => {
        setIsLoggedIn(true);
        await fetchCurrentUser(); // 로그인한 유저 정보 fetch
        await fetchRoutines(); // 루틴 데이터 fetch
        navigate("/");
    };


    // ── 루틴 완료 처리 (체크 모드) ─────────────────────────────────────────────
    // 체크 루틴: 버튼 클릭 한 번으로 완료 처리, 현재 시간을 completedAt에 저장
    // 추후 백엔드 완료 저장 API 연결 예정
    const completeCheckRoutine = (id) => {
        const now = new Date();
        const timeText = now.toLocaleTimeString("ko-KR", {
            hour: "2-digit", minute: "2-digit", hour12: false,
        });
        // 해당 id의 루틴만 completed: true 로 변경, 나머지는 그대로
        setRoutines((prev) =>
            prev.map((r) => r.id === id ? { ...r, completed: true, completedAt: timeText } : r)
        );
    };

    // ── 루틴 완료 처리 (상세 모드) ─────────────────────────────────────────────
    // 상세 루틴: 인증 글(proofText) + 파일(proofFiles) + 피드 업로드 여부(uploadToFeed)를 받아 처리
    const completeDetailRoutine = (id, proofText, proofFiles, uploadToFeed) => {
        const now = new Date();
        const timeText = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
        const dateText = now.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

        // 피드에 올릴 루틴 정보를 미리 찾아둠 (setRoutines 이후엔 변경 전 값 필요)
        const targetRoutine = routines.find((r) => r.id === id);

        // 루틴 완료 상태 및 인증 데이터 저장
        setRoutines((prev) =>
            prev.map((r) => r.id === id
                ? { ...r, completed: true, completedAt: timeText, proofText, proofFiles }
                : r
            )
        );

        // "피드에 업로드" 체크했을 때 feedPosts에 게시물 추가
        if (uploadToFeed && targetRoutine) {
            setFeedPosts((prev) => [{
                id: Date.now(),
                routineId: id,
                nickname: currentUser?.nickname ?? "나",
                routineTitle: targetRoutine.title,
                category: targetRoutine.category,
                content: proofText,
                files: proofFiles,
                liked: false,
                likeCount: 0,
                commentCount: 0,
                comments: [],
                createdAt: dateText,
                createdTime: timeText,
            }, ...prev]);
        }
    };
    // ── 피드 좋아요 토글 ─────────────────────────────────────────────────────
    const toggleFeedLike = (postId) => {
        setFeedPosts((prev) =>
            prev.map((post) => {
                if (post.id !== postId) return post;

                const nextLiked = !post.liked;

                return {
                    ...post,
                    liked: nextLiked,
                    likeCount: nextLiked
                        ? post.likeCount + 1
                        : Math.max(0, post.likeCount - 1),
                };
            })
        );
    };

    // ── 피드 댓글 추가 ─────────────────────────────────────────────────────
    const addFeedComment = (postId, commentText) => {
        const trimmed = commentText.trim();
        if (!trimmed) return;

        // postId에 해당하는 게시물 찾아서 comments 배열에 새 댓글 추가
        setFeedPosts((prev) =>
            prev.map((post) => {
                if (post.id !== postId) return post;

                const nextComments = [
                    ...(post.comments ?? []),
                    {
                        id: Date.now(),
                        nickname: currentUser?.nickname ?? "나",
                        content: trimmed,
                        createdAt: new Date().toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                    },
                ];

                return {
                    ...post,
                    comments: nextComments,
                    commentCount: nextComments.length,
                };
            })
        );
    };

    // ── 피드 댓글 삭제 ─────────────────────────────────────────────────────
    const deleteFeedComment = (postId, commentId) => {
        setFeedPosts((prev) =>
            prev.map((post) => {
                if (post.id !== postId) return post;

                const nextComments = (post.comments ?? []).filter(
                    (comment) => comment.id !== commentId
                );

                return {
                    ...post,
                    comments: nextComments,
                    commentCount: nextComments.length,
                };
            })
        );
    };


    // ── 루틴 완료 취소 ─────────────────────────────────────────────────────────
    // 완료된 루틴을 미완료 상태로 되돌리고, 피드에 올린 게시물도 함께 삭제
    const cancelRoutineCompletion = (id) => {
        setRoutines((prev) =>
            prev.map((r) => r.id === id
                ? { ...r, completed: false, completedAt: "", proofText: "", proofFiles: [] }
                : r
            )
        );
        // 해당 루틴으로 올라간 피드 게시물도 함께 제거
        setFeedPosts((prev) => prev.filter((post) => post.routineId !== id));
    };

    // ── 로그아웃 처리 ─────────────────────────────────────────────────────────
    // 백엔드에 로그아웃 요청 → 세션 쿠키 삭제 → 상태 초기화 → 로그인 페이지로 이동
    const handleLogout = async () => {
        try {
            await fetch("http://localhost:3000/logout", {
                method: "POST",
                credentials: "include", // 세션 쿠키 전달 → 서버에서 세션 삭제
            });
        } catch (error) {
            console.error("로그아웃 요청 실패:", error);
        }
        setIsLoggedIn(false);
        setRoutines([]); // 루틴 데이터 초기화 (다른 유저가 로그인해도 이전 데이터 안 보이도록)
        navigate("/login");
    };

    return (
        <div className="app">
            {/* 로그인 상태일 때만 상단 네비게이션 바 표시 */}
            {isLoggedIn && (
                <header className="topbar">
                    <div className="logo">Routine Mate 🌙 {month}월</div>
                    <nav className="nav">
                        {/* navigate()로 URL 변경 → 브라우저 히스토리에 쌓임 → 뒤로가기 동작 */}
                        <button onClick={() => navigate("/")}>홈</button>
                        <button onClick={() => navigate("/routine")}>루틴</button>
                        <button onClick={() => navigate("/feed")}>피드</button>
                        <button onClick={() => navigate("/mypage")}>마이페이지</button>
                        <button onClick={handleLogout}>로그아웃</button>
                    </nav>
                </header>
            )}

            <main className="page-container">
                <Routes>
                    {/* 로그인 페이지: 비로그인 상태면 표시, 이미 로그인 중이면 홈으로 리다이렉트 */}
                    <Route
                        path="/login"
                        element={!isLoggedIn
                            ? <LoginPage onLogin={handleLogin} onGoSignup={() => navigate("/signup")} />
                            : <Navigate to="/" />
                        }
                    />

                    {/* 회원가입 페이지: 비로그인 상태면 표시, 이미 로그인 중이면 홈으로 리다이렉트 */}
                    <Route
                        path="/signup"
                        element={!isLoggedIn
                            ? <SignupPage onBackToLogin={() => navigate("/login")} />
                            : <Navigate to="/" />
                        }
                    />

                    {/* 홈 페이지: 로그인 상태면 표시, 비로그인이면 로그인 페이지로 리다이렉트
                        routines를 props로 내려줌으로써 RoutinePage와 동일한 데이터를 공유 */}
                    <Route
                        path="/"
                        element={isLoggedIn
                            ? <HomePage
                                routines={routines}              // 중앙 fetch된 루틴 데이터
                                onCompleteCheck={completeCheckRoutine}    // 체크 루틴 완료 핸들러
                                onCompleteDetail={completeDetailRoutine}  // 상세 루틴 완료 핸들러
                                onCancelComplete={cancelRoutineCompletion} // 완료 취소 핸들러
                            />
                            : <Navigate to="/login" />
                        }
                    />

                    {/* 루틴 관리 페이지: 루틴 추가/삭제 후 App의 routines 상태를 갱신하도록
                        onRoutineChange(fetchRoutines)를 전달 */}
                    <Route
                        path="/routine"
                        element={isLoggedIn
                            ? <RoutinePage onRoutineChange={fetchRoutines} />
                            : <Navigate to="/login" />
                        }
                    />

                    {/* 피드 페이지: 상세 루틴 인증 시 "피드 업로드" 체크한 게시물 표시 */}
                    <Route
                        path="/feed"
                        element={isLoggedIn
                            ? <FeedPage
                                feedPosts={feedPosts}
                                onToggleLike={toggleFeedLike}
                                onAddComment={addFeedComment}
                                onDeleteComment={deleteFeedComment}
                                currentUserNickname={currentUser?.nickname ?? ""}
                            />
                            : <Navigate to="/login" />
                        }
                    />


                    {/* 마이페이지: 추후 백엔드 연결 예정 */}
                    <Route
                        path="/mypage"
                        element={isLoggedIn
                            ? <MyPage />
                            : <Navigate to="/login" />
                        }
                    />

                    {/* 정의되지 않은 URL 접근 시 상태에 따라 홈 또는 로그인으로 리다이렉트 */}
                    <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
