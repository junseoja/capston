// ============================================================
// App.jsx - 앱 루트 컴포넌트
// ============================================================
// 역할:
//   - 로그인 상태(isLoggedIn)를 전역으로 관리
//   - 루틴 데이터(routines)를 중앙에서 fetch하여 하위 컴포넌트에 props로 전달
//     (단일 진실 공급원 패턴 - Single Source of Truth)
//   - 루틴 완료 처리(체크/상세) 및 피드 업로드를 백엔드 API로 처리
//   - react-router-dom의 Routes로 URL 기반 페이지 이동 처리
//
// 상태 구조:
//   isLoggedIn  : 로그인 여부 (true/false)
//   routines    : 백엔드에서 fetch한 루틴 배열 (필드명 변환 적용)
//   currentUser : 현재 로그인한 유저 정보 ({ user_id, login_id, nickname, ... })
//   authChecked : 세션 복구 확인 완료 여부 (리다이렉트 방지용 플래그)
//
// 라우트 구조:
//   /login  → LoginPage  (비로그인 전용)
//   /signup → SignupPage (비로그인 전용)
//   /       → HomePage   (로그인 전용)
//   /routine → RoutinePage (로그인 전용)
//   /feed   → FeedPage   (로그인 전용)
//   /mypage → MyPage     (로그인 전용)
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { EXPRESS_URL } from "./config";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "../css/App.css";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RoutinePage from "./RoutinePage";
import FeedPage from "./FeedPage";
import MyPage from "./MyPage";
import SignupPage from "./SignupPage";

function App() {
    // useNavigate: URL 이동을 프로그래밍적으로 처리 (예: 로그인 후 "/" 로 이동)
    // BrowserRouter 내부에서만 사용 가능 (main.jsx에서 감싸줌)
    const navigate = useNavigate();

    // ── 전역 상태 ────────────────────────────────────────────────────────────

    // 로그인 여부 - true면 메인 앱, false면 로그인/회원가입 화면 표시
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // 루틴 목록 - 백엔드에서 fetch 후 DB 컬럼명 → 컴포넌트 필드명으로 변환하여 저장
    // HomePage, RoutinePage에 props로 전달하여 동일 데이터 공유 (중복 fetch 방지)
    const [routines, setRoutines] = useState([]);

    // 현재 로그인한 유저 정보 (GET /me 응답: { user_id, login_id, nickname, ... })
    const [currentUser, setCurrentUser] = useState(null);

    // [추가] 앱 시작 시 세션 복구(/me) 여부가 확인되기 전에는
    // 라우트 리다이렉트를 바로 수행하지 않기 위한 플래그
    const [authChecked, setAuthChecked] = useState(false);

    // 상단바에 표시할 현재 월 (예: "6월")
    const today = new Date();
    const month = today.getMonth() + 1; // getMonth()는 0-indexed이므로 +1

    // ── 루틴 데이터 fetch ─────────────────────────────────────────────────────

    /**
     * fetchRoutines - Express /routine에서 루틴 목록을 가져와 상태 업데이트
     *
     * useCallback으로 메모이제이션:
     *   RoutinePage에 onRoutineChange 콜백 props로 전달할 때 불필요한 리렌더 방지
     *   의존성 배열 []이므로 컴포넌트 생명주기 동안 동일한 함수 참조 유지
     *
     * 필드 매핑 (DB 컬럼명 → 컴포넌트 prop 이름):
     *   routine_id   → id
     *   time_slot    → time
     *   routine_mode → routineMode
     *   repeat_cycle → repeat
     *
     * [수정] 이제 루틴 목록만 가져오지 않고
     * GET /completion/today도 함께 읽어서 오늘 완료 상태를 복원함.
     */
    const fetchRoutines = useCallback(async () => {
        try {
            const [routineRes, completionRes] = await Promise.all([
                fetch(`${EXPRESS_URL}/routine`, {
                    credentials: "include", // 쿠키(sessionId)를 요청에 포함 → 로그인 인증
                }),
                fetch(`${EXPRESS_URL}/completion/today`, {
                    credentials: "include",
                }),
            ]);

            const [routineData, completionData] = await Promise.all([
                routineRes.json(),
                completionRes.json(),
            ]);

            if (routineData.success) {
                // [추가] 오늘 완료 기록을 routine_id 기준으로 빠르게 찾기 위해 Map 구성
                const completionMap = new Map(
                    (completionData.success ? completionData.completions : []).map((completion) => [
                        completion.routine_id,
                        completion,
                    ])
                );

                // DB 컬럼명을 컴포넌트에서 쓰기 편한 이름으로 변환 (필드 매핑)
                const mapped = routineData.routines.map((r) => {
                    const todayCompletion = completionMap.get(r.routine_id);

                    return {
                    id: r.routine_id,            // 루틴 고유 ID (UUID v7)
                    title: r.title,              // 루틴 제목
                    category: r.category,        // 카테고리 (운동, 공부 등)
                    time: r.time_slot,           // 시간대 ("morning" / "lunch" / "dinner")
                    routineMode: r.routine_mode, // 완료 방식 ("check" / "detail")
                    goal: r.goal,                // 목표 시간 문자열 (예: "07:30")
                    repeat: r.repeat_cycle,      // 반복 주기 (예: "월, 수, 금" 또는 "매일")
                    description: r.description,  // 루틴 설명
                    // [수정] 완료 상태는 프론트 메모리 기본값이 아니라
                    // /completion/today 응답으로부터 복원
                    completed: Boolean(todayCompletion),
                    completionId: todayCompletion?.completion_id ?? null,
                    completedAt: todayCompletion
                        ? new Date(todayCompletion.completed_at).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        })
                        : "",
                    proofText: todayCompletion?.proof_text ?? "",
                    proofFiles: [],
                };
                });
                setRoutines(mapped);
            }
        } catch (error) {
            // 서버 꺼짐, 네트워크 오류 등
            console.error("루틴 fetch 실패:", error);
        }
    }, []); // 의존성 없음 → 첫 렌더링 시 한 번만 함수 생성

    // ── 유저 정보 fetch ───────────────────────────────────────────────────────

    /**
     * fetchCurrentUser - GET /me로 현재 로그인한 유저 정보를 가져와 상태 업데이트
     *
     * 로그인 직후 호출하여 currentUser 상태를 채움
     * currentUser.nickname은 피드 게시물 작성자 이름으로 사용됨
     */
    const fetchCurrentUser = useCallback(async () => {
        try {
            const res = await fetch(`${EXPRESS_URL}/me`, {
                credentials: "include", // 세션 쿠키 포함
            });
            const data = await res.json();

            if (data.success) {
                setCurrentUser(data.user); // { user_id, login_id, nickname, ... }
                return data.user;
            }
        } catch (error) {
            console.error("유저 정보 fetch 실패:", error);
        }

        // fetch 실패 또는 비로그인 상태
        setCurrentUser(null);
        return null;
    }, []); // 의존성 없음

    // ── 앱 시작 시 세션 복구 ───────────────────────────────────────────────────

    /**
     * [추가] 앱 첫 진입/새로고침 시 세션 쿠키로 로그인 상태를 복구.
     * /me 성공 시 현재 유저 + 루틴/오늘 완료 내역까지 함께 로드한 뒤
     * 그 다음에 보호 라우트 렌더링을 허용함.
     */
    useEffect(() => {
        const bootstrapAuth = async () => {
            try {
                const user = await fetchCurrentUser();

                if (user) {
                    setIsLoggedIn(true);
                    await fetchRoutines();
                } else {
                    setIsLoggedIn(false);
                    setRoutines([]);
                }
            } finally {
                setAuthChecked(true);
            }
        };

        bootstrapAuth();
    }, [fetchCurrentUser, fetchRoutines]);

    // ── 로그인 처리 ───────────────────────────────────────────────────────────

    /**
     * handleLogin - LoginPage에서 로그인 성공 콜백으로 호출됨
     *
     * 처리 순서:
     *   1. 로그인 상태 전환 (isLoggedIn = true)
     *   2. 현재 유저 정보 fetch (currentUser 채움)
     *   3. 루틴 목록 fetch
     *   4. 홈("/")으로 이동
     */
    const handleLogin = async () => {
        setIsLoggedIn(true);
        await fetchCurrentUser(); // 로그인한 유저 정보 fetch (닉네임 등)
        await fetchRoutines();    // 루틴 데이터 fetch (홈 화면 표시용)
        navigate("/");
    };

    // ── 루틴 완료 처리 (체크 모드) ────────────────────────────────────────────

    /**
     * completeCheckRoutine - 체크 루틴 완료 처리
     *
     * 체크 루틴: 버튼 클릭 한 번으로 즉시 완료 처리
     * POST /completion API를 호출하여 DB에 완료 기록 저장
     * 완료 시간을 "HH:MM" 형식으로 기록 (한국어 24시간제)
     *
     * @param {string} id - 완료할 루틴의 UUID v7
     * @returns {boolean} 완료 성공 여부
     */
    const completeCheckRoutine = async (id) => {
        const now = new Date();
        const timeText = now.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false, // 24시간제 (예: "09:30", "21:00")
        });

        try {
            // [추가] 완료 버튼 클릭 시 실제 백엔드 POST /completion에 저장
            const res = await fetch(`${EXPRESS_URL}/completion`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    routine_id: id,
                    proof_text: "",
                }),
            });
            const data = await res.json();

            if (!data.success) {
                alert(data.message || "루틴 완료 저장에 실패했습니다.");
                return false;
            }

            // 해당 id의 루틴만 completed: true로 변경, 나머지는 그대로 (불변성 유지)
            setRoutines((prev) =>
                prev.map((r) =>
                    r.id === id
                        ? {
                            ...r,
                            completed: true,
                            completionId: data.completion_id,
                            completedAt: timeText,
                            proofText: "",
                            proofFiles: [],
                        }
                        : r
                )
            );
            return true;
        } catch (error) {
            console.error("체크 루틴 완료 저장 실패:", error);
            alert("서버 오류가 발생했습니다.");
            return false;
        }
    };

    // ── 루틴 완료 처리 (상세 모드) ────────────────────────────────────────────

    /**
     * completeDetailRoutine - 상세 루틴 완료 처리
     *
     * 상세 루틴: 인증 글(proofText) + 파일(proofFiles) + 피드 업로드 여부를 받아 처리
     * 1. POST /completion 으로 완료 기록을 DB에 저장
     * 2. "피드에도 업로드하기" 체크 시 POST /feed 로 피드 생성 (FormData로 파일 함께 전송)
     *
     * @param {string} id          - 완료할 루틴의 UUID v7
     * @param {string} proofText   - 인증 글 (최대 200자)
     * @param {Array}  proofFiles  - 첨부 파일 배열 [{ name, type, url, file }]
     * @param {boolean} uploadToFeed - 피드 업로드 여부
     * @returns {boolean} 완료 성공 여부
     */
    const completeDetailRoutine = async (id, proofText, proofFiles, uploadToFeed) => {
        const now = new Date();
        const timeText = now.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        // setRoutines 이후에는 이전 값 접근이 어려우므로 미리 루틴 정보를 찾아둠
        const targetRoutine = routines.find((r) => r.id === id);

        try {
            // [추가] 상세 루틴도 동일하게 백엔드 POST /completion에 저장
            const res = await fetch(`${EXPRESS_URL}/completion`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    routine_id: id,
                    proof_text: proofText,
                }),
            });
            const data = await res.json();

            if (!data.success) {
                alert(data.message || "상세 루틴 완료 저장에 실패했습니다.");
                return false;
            }

            // 루틴 완료 상태 및 인증 데이터 저장
            setRoutines((prev) =>
                prev.map((r) =>
                    r.id === id
                        ? {
                            ...r,
                            completed: true,
                            completionId: data.completion_id,
                            completedAt: timeText,
                            proofText,
                            proofFiles,
                        }
                        : r
                )
            );

            // "피드에 업로드" 체크 시 실제 백엔드 API로 피드 생성
            if (uploadToFeed && targetRoutine) {
                try {
                    // FormData로 텍스트 필드 + 파일을 함께 전송
                    const formData = new FormData();
                    formData.append("routine_id", id);
                    formData.append("completion_id", data.completion_id);
                    formData.append("content", proofText);

                    // proofFiles 배열의 각 항목에서 원본 File 객체가 필요
                    // blob URL로는 서버에 업로드할 수 없으므로, 원본 파일을 사용
                    // handleFileChange에서 File 객체를 함께 저장해야 함
                    for (const file of proofFiles) {
                        if (file.file) {
                            formData.append("files", file.file);
                        }
                    }

                    await fetch(`${EXPRESS_URL}/feed`, {
                        method: "POST",
                        credentials: "include",
                        body: formData, // multipart/form-data (Content-Type 자동 설정)
                    });
                } catch (feedError) {
                    console.error("피드 업로드 실패:", feedError);
                    // 피드 업로드 실패해도 루틴 완료 자체는 성공이므로 alert만 표시
                    alert("루틴 완료는 저장되었지만, 피드 업로드에 실패했습니다.");
                }
            }
            return true;
        } catch (error) {
            console.error("상세 루틴 완료 저장 실패:", error);
            alert("서버 오류가 발생했습니다.");
            return false;
        }
    };

    // ── 루틴 완료 취소 ────────────────────────────────────────────────────────

    /**
     * cancelRoutineCompletion - 루틴 완료 취소
     *
     * 완료된 루틴을 미완료 상태로 되돌림
     * DELETE /completion/:completion_id API를 호출하여 DB에서 완료 기록 삭제
     * 연관 피드 게시물은 DB의 ON DELETE CASCADE로 자동 삭제됨
     * [백엔드 주의] 완료 취소는 FastAPI를 직접 호출하지 말고,
     * 반드시 Express DELETE /completion/:completion_id 경유로 호출해야 함.
     * 이유:
     *   1. Express가 세션 쿠키로 로그인 유저를 확인하고
     *   2. 백엔드에서 session.user_id를 함께 전달하여
     *   3. FastAPI가 WHERE completion_id=? AND user_id=? 로 본인 기록만 삭제하도록 검증함
     * 따라서 프론트에서는 완료 시 completion_id를 함께 보관해야
     * 나중에 안전하게 완료 취소 API를 연결할 수 있음.
     *
     * @param {string} id - 완료 취소할 루틴의 UUID v7
     */
    const cancelRoutineCompletion = async (id) => {
        const targetRoutine = routines.find((routine) => routine.id === id);

        // [추가] 백엔드 완료 취소는 completion_id가 있어야 호출 가능
        if (!targetRoutine?.completionId) {
            alert("완료 기록 식별자가 없어 취소할 수 없습니다.");
            return;
        }

        try {
            const res = await fetch(`${EXPRESS_URL}/completion/${targetRoutine.completionId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();

            if (!data.success) {
                alert(data.message || "루틴 완료 취소에 실패했습니다.");
                return;
            }

            // 루틴 완료 상태 초기화
            setRoutines((prev) =>
                prev.map((r) =>
                    r.id === id
                        ? {
                            ...r,
                            completed: false,
                            completionId: null,
                            completedAt: "",
                            proofText: "",
                            proofFiles: [],
                        }
                        : r
                )
            );

            // 연관 피드 게시물은 DB의 ON DELETE CASCADE로 자동 삭제됨
        } catch (error) {
            console.error("루틴 완료 취소 실패:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    // ── 로그아웃 처리 ─────────────────────────────────────────────────────────

    /**
     * handleLogout - 로그아웃 처리
     *
     * 처리 순서:
     *   1. Express POST /logout 요청 → DB에서 세션 삭제 + 쿠키 제거
     *   2. 프론트 상태 초기화 (isLoggedIn, routines, currentUser)
     *   3. 로그인 페이지("/login")로 이동
     *
     * NOTE: 2단계는 서버 요청 실패 시에도 수행 (try/catch 구조)
     *       → 서버가 꺼져있어도 프론트에서는 로그아웃됨
     */
    const handleLogout = async () => {
        try {
            await fetch(`${EXPRESS_URL}/logout`, {
                method: "POST",
                credentials: "include", // 세션 쿠키 전달 → 서버에서 세션 삭제
            });
        } catch (error) {
            console.error("로그아웃 요청 실패:", error);
            // 서버 오류여도 프론트 상태는 초기화 진행
        }

        // 프론트 상태 초기화 (다른 유저가 로그인해도 이전 데이터 보이지 않도록)
        setIsLoggedIn(false);
        setRoutines([]);
        setCurrentUser(null);
        setAuthChecked(true);
        navigate("/login");
    };

    // ── 렌더링 ────────────────────────────────────────────────────────────────

    // [추가] 세션 복구 확인 전에는 보호 라우트 리다이렉트 대신 로딩 화면 표시
    if (!authChecked) {
        return <div className="app">로딩 중...</div>;
    }

    return (
        <div className="app">
            {/* 로그인 상태일 때만 상단 네비게이션 바 표시 */}
            {isLoggedIn && (
                <header className="topbar">
                    {/* 로고 + 현재 월 표시 */}
                    <div className="logo">Routine Mate 🌙 {month}월</div>

                    <nav className="nav">
                        {/* navigate()로 URL 변경 → 브라우저 히스토리에 쌓임 → 뒤로가기 가능 */}
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
                    {/* 로그인 페이지: 비로그인이면 표시, 이미 로그인 중이면 홈으로 리다이렉트 */}
                    <Route
                        path="/login"
                        element={
                            !isLoggedIn
                                ? <LoginPage
                                    onLogin={handleLogin}           // 로그인 성공 콜백
                                    onGoSignup={() => navigate("/signup")} // 회원가입 페이지 이동
                                  />
                                : <Navigate to="/" />              // 이미 로그인 → 홈으로
                        }
                    />

                    {/* 회원가입 페이지: 비로그인이면 표시, 이미 로그인 중이면 홈으로 리다이렉트 */}
                    <Route
                        path="/signup"
                        element={
                            !isLoggedIn
                                ? <SignupPage onBackToLogin={() => navigate("/login")} />
                                : <Navigate to="/" />
                        }
                    />

                    {/* 홈 페이지: 로그인이면 표시, 비로그인이면 로그인으로 리다이렉트
                        routines를 props로 내려줌으로써 RoutinePage와 동일한 데이터 공유 */}
                    <Route
                        path="/"
                        element={
                            isLoggedIn
                                ? <HomePage
                                    routines={routines}                       // 중앙에서 fetch된 루틴 데이터
                                    onCompleteCheck={completeCheckRoutine}    // 체크 루틴 완료 핸들러
                                    onCompleteDetail={completeDetailRoutine}  // 상세 루틴 완료 핸들러
                                    onCancelComplete={cancelRoutineCompletion} // 완료 취소 핸들러
                                  />
                                : <Navigate to="/login" />
                        }
                    />

                    {/* 루틴 관리 페이지: 루틴 추가/삭제 후 App의 routines 상태도 갱신
                        onRoutineChange = fetchRoutines 를 콜백으로 전달 */}
                    <Route
                        path="/routine"
                        element={
                            isLoggedIn
                                ? <RoutinePage onRoutineChange={fetchRoutines} />
                                : <Navigate to="/login" />
                        }
                    />

                    {/* 피드 페이지: DB에서 전체 피드를 최신순으로 조회 */}
                    <Route
                        path="/feed"
                        element={
                            isLoggedIn
                                ? <FeedPage currentUser={currentUser} />
                                : <Navigate to="/login" />
                        }
                    />

                    {/* 마이페이지: MyPage 내부에서 직접 /me, /routine API 호출 */}
                    <Route
                        path="/mypage"
                        element={isLoggedIn ? <MyPage /> : <Navigate to="/login" />}
                    />

                    {/* 정의되지 않은 URL 접근 시 상태에 따라 홈 또는 로그인으로 리다이렉트 */}
                    <Route
                        path="*"
                        element={<Navigate to={isLoggedIn ? "/" : "/login"} />}
                    />
                </Routes>
            </main>
        </div>
    );
}

export default App;
