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
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"; // [수정] useLocation 추가
import "../css/App.css";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RoutinePage from "./RoutinePage";
import FeedPage from "./FeedPage";
import MyPage from "./MyPage";
import SignupPage from "./SignupPage";
import StatsPage from "./StatsPage";
// [추가 2026-05-12 / frontend-cy 머지 (45d00d8)]
// 사유: 챌린지 페이지 컴포넌트 신규 추가에 따른 import.
// 기대효과: /challenge 라우트에서 ChallengePage 렌더링 가능.
// 장점: 챌린지 기능을 독립 페이지로 분리 → 코드 응집도↑, 라우팅 일관성 유지.
import ChallengePage from "./ChallengePage";
// [추가 2026-05-12 / frontend 머지 7/7]
// 출처: origin/frontend commits 8c9c6a2 / 62d5017 / f387027 / 56bc7cc
// 사유: 1단계에서 추가한 관리자 페이지 컴포넌트를 라우트 등록 및 권한 가드 적용.
// 기대효과: 로그인 시 id="admin" 이면 /admin 으로 진입, 일반 유자는 접근 차단.
// 장점: 다른 보호 라우트와 동일한 isLoggedIn 가드 패턴 + 추가 관리자 권한 가드 한 줄로 처리.
import AdminPage from "./AdminPage";
// [추가 2026-05-13 / frontend 머지 Stage 2-7]
// 출처: origin/frontend commits adde39d / 98693c1 (공지사항 리스트/상세 페이지)
// 사유: Stage 2-1, 2-2 에서 추가한 NoticeList / NoticeDetail 컴포넌트를 라우트 등록.
// 기대효과: /notice 로 리스트, /notice/detail 로 상세 페이지 접근 가능.
// 장점: react-router 라우트 패턴으로 통일 (frontend 원본의 page-state 패턴 대신).
import NoticeList from "./NoticeList";
import NoticeDetail from "./NoticeDetail";

function App() {
    // useNavigate: URL 이동을 프로그래밍적으로 처리 (예: 로그인 후 "/" 로 이동)
    // BrowserRouter 내부에서만 사용 가능 (main.jsx에서 감싸줌)
    const navigate = useNavigate();

    // [추가] useLocation: 현재 브라우저의 URL 경로 정보를 가져옴 (관리자 페이지 상단바 제외용)
    const location = useLocation();

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

    // ────────────────────────────────────────────────────────────────────
    // [제거 2026-05-20] frontend-cy(7dd5535) 챌린지 백엔드 통합으로 mock 상태 폐기
    // ────────────────────────────────────────────────────────────────────
    // 오류 번호: 머지 작업 (frontend-cy → dev 챌린지 통합)
    // 날짜: 2026-05-20
    // 기대효과:
    //   - 챌린지 인증은 FastAPI feed.py GET /feed/ 가 challenge_proofs 와 합쳐 반환
    //   - 프론트 mock 상태(challengeMockFeedPosts) 와 업로드 콜백 더 이상 불필요
    // 장점:
    //   - 단일 진실 공급원(SSOT) 완성 — 새로고침/다중 기기에서도 동일 데이터
    //   - App.jsx 상태 표면 축소 → 유지보수 부담 감소
    // ────────────────────────────────────────────────────────────────────

    // ── [추가 2026-05-12 / frontend 머지 7/7] 관리자/신고/제재 알림 상태 ──
    // 출처: origin/frontend src/App.jsx (commits f387027, 56bc7cc, 8c9c6a2)
    // 사유:
    //   1) FeedPage 의 onReportPost / AdminPage 의 reports props 가 공유할
    //      신고 데이터 저장소가 필요.
    //   2) HomePage 의 deleteNotifications props 가 받을 제재 알림 큐.
    //   3) LoginPage 가 6단계에서 role 시그널을 보내므로 관리자 권한 플래그 추가.
    // 기대효과:
    //   - FeedPage 신고 → reports 누적 → AdminPage 리스트 표시.
    //   - AdminPage 제재 → deleteNotifications 추가 → HomePage 모달 표시.
    //   - 로그인 ID 가 "admin" 이면 isAdmin=true → /admin 라우트 접근 허용.
    // 장점:
    //   - 단일 진실 공급원(SSOT) 패턴 유지 — 데이터 흐름이 App.jsx 한 곳에 모임.
    //   - deleteNotifications 는 localStorage 영속화 → 새로고침/재로그인 후에도 알림 유지.
    // [수정 2026-05-16] reports 는 더 이상 App.jsx 가 메모리로 관리하지 않음.
    // AdminPage 가 GET /report 로 직접 조회하고, 제재 후 자체 재조회한다.
    // (관리자만 보는 데이터라 항상 App 에서 들고 있을 필요가 없음)
    const [deleteNotifications, setDeleteNotifications] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("deleteNotifications") || "[]");
        } catch {
            return [];
        }
    });
    const [isAdmin, setIsAdmin] = useState(false);

    // [수정 2026-05-16 / 관리자 백엔드 연결] 공지사항 전역 상태
    // 오류/변경 번호: 5/13 Stage 2-7 의 localStorage mock → 실제 백엔드(GET /notice) 전환
    // 날짜: 2026-05-16
    // 사유:
    //   기존엔 AdminPage 가 setNotices 로 메모리/localStorage 에만 공지를 쌓아
    //   다른 기기/새 브라우저에서는 공지가 안 보였음 (가짜 데이터).
    //   백엔드 notice 라우터 완성으로 실제 DB 기반 공유 데이터로 전환.
    // 기대효과:
    //   AdminPage 가 공지를 작성하면 DB 에 저장되고, HomePage 모달 /
    //   NoticeList 가 모든 사용자/기기에서 같은 공지를 본다.
    // 장점:
    //   단일 진실 공급원이 localStorage → 백엔드 DB 로 승격.
    //   fetchRoutines 와 동일한 useCallback 패턴이라 코드 일관성 유지.
    const [notices, setNotices] = useState([]);
    // 공지사항 상세 페이지에서 표시할 항목 (NoticeList 에서 클릭 → setSelectedNotice)
    const [selectedNotice, setSelectedNotice] = useState(null);

    // [추가 2026-05-16] 공지 목록 조회 — Express GET /notice 중계 → FastAPI
    // fetchRoutines 와 같은 useCallback 패턴 (의존성 [] → 참조 고정).
    const fetchNotices = useCallback(async () => {
        try {
            const res = await fetch(`${EXPRESS_URL}/notice`, {
                credentials: "include", // 세션 쿠키 → requireAuth 통과
            });
            const data = await res.json();
            if (data.success) {
                // [정규화] 백엔드 컬럼(notice_id/post_date)을 소비처들이 쓰는
                // id/date 로 통일. NoticeList/NoticeDetail/HomePage 모달/AdminPage
                // 가 전부 동일 필드명을 보도록 App 한 곳에서 한 번만 변환.
                const normalized = (data.notices || []).map((n) => ({
                    ...n,
                    id: n.notice_id ?? n.id,
                    date: n.post_date ?? n.date,
                }));
                setNotices(normalized);
            }
        } catch (error) {
            // 공지 조회 실패는 치명적이지 않으므로 콘솔만 (홈/리스트가 빈 상태로 표시)
            console.error("공지 목록 조회 실패:", error);
        }
    }, []);

    // deleteNotifications 변경 시 localStorage 동기화 (새로고침 후에도 모달 유지)
    useEffect(() => {
        try {
            localStorage.setItem(
                "deleteNotifications",
                JSON.stringify(deleteNotifications),
            );
        } catch {
            // 브라우저 저장소 미지원/쿼터 초과 시 무시 (UX 영향 없음)
        }
    }, [deleteNotifications]);

    // 상단바에 표시할 현재 월 (예: "6월")
    const today = new Date();
    const month = today.getMonth() + 1; // getMonth()는 0-indexed이므로 +1

    // ── 루틴 데이터 fetch ─────────────────────────────────────────────────────

    /**
     * fetchRoutines - Express /routine에서 루틴 목록을 가져와 상태 업데이트
     *
     * useCallback으로 메모이제이션:
     * RoutinePage에 onRoutineChange 콜백 props로 전달할 때 불필요한 리렌더 방지
     * 의존성 배열 []이므로 컴포넌트 생명주기 동안 동일한 함수 참조 유지
     *
     * 필드 매핑 (DB 컬럼명 → 컴포넌트 prop 이름):
     * routine_id   → id
     * time_slot    → time
     * routine_mode → routineMode
     * repeat_cycle → repeat
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
                    // [추가 2026-05-16] 로그인 복구 시 공지도 함께 조회
                    // (HomePage 공지 모달이 첫 진입에 바로 뜨도록)
                    await fetchNotices();
                } else {
                    setIsLoggedIn(false);
                    setRoutines([]);
                }
            } finally {
                setAuthChecked(true);
            }
        };

        bootstrapAuth();
    }, [fetchCurrentUser, fetchRoutines, fetchNotices]);

    // ── 로그인 처리 ───────────────────────────────────────────────────────────

    /**
     * handleLogin - LoginPage에서 로그인 성공 콜백으로 호출됨
     *
     * 처리 순서:
     * 1. 로그인 상태 전환 (isLoggedIn = true)
     * 2. 현재 유저 정보 fetch (currentUser 채움)
     * 3. 루틴 목록 fetch
     * 4. 홈("/")으로 이동
     */
    // [수정 2026-05-12 / frontend 머지 7/7]
    // 출처: origin/frontend 의 onLogin("ADMIN" | "USER") 분기
    // 사유: 6단계에서 LoginPage 가 role 인자를 전달하므로, App 의 handleLogin 도 그것을 받아 라우팅 분기.
    // 기대효과: role==="ADMIN" → setIsAdmin(true) + navigate("/admin"); 일반 → navigate("/").
    // 장점:
    //   - 기본값 "USER" 처리로 기존 onLogin() 무인자 호출(있다면) 도 호환.
    //   - 관리자 권한 자체는 isAdmin 상태로 보관 → 어디서든 가드 조건으로 활용.
    const handleLogin = async (role = "USER") => {
        setIsLoggedIn(true);
        setIsAdmin(role === "ADMIN");
        await fetchCurrentUser(); // 로그인한 유저 정보 fetch (닉네임 등)
        await fetchRoutines();    // 루틴 데이터 fetch (홈 화면 표시용)
        await fetchNotices();     // [추가 2026-05-16] 공지 조회 (홈 모달/리스트용)
        navigate(role === "ADMIN" ? "/admin" : "/");
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
        // [추가 2026-05-13 / frontend-cy 머지 (a5075ce)]
        // 사유: 피드 업로드 체크 시 파일 없으면 차단 (부모에서 한 번 더 방어).
        // 기대효과: HomePage 검증이 어떤 이유로 우회되어도 빈 피드 게시물 생성 방지.
        // 장점: 백엔드까지 잘못된 요청이 가는 비용 절감.
        if (uploadToFeed && (proofFiles?.length ?? 0) === 0) {
            alert("피드에 업로드하려면 사진 또는 영상을 1개 이상 추가해주세요.");
            return false;
        }
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

                    // [수정 2026-05-10] 피드 업로드 응답 검증 추가.
                    //
                    // 이유:
                    //   fetch() 는 HTTP 400/500 응답에서도 throw 하지 않는다.
                    //   기존 코드는 POST /feed 요청만 보내고 응답을 확인하지 않아,
                    //   S3 업로드/FastAPI 검증/DB 저장이 실패해도 사용자에게 성공처럼 보였다.
                    //
                    // 동작:
                    //   응답 JSON 의 success 와 HTTP status 를 모두 확인하고, 실패 시 catch 로 보내
                    //   "루틴 완료는 저장되었지만 피드 업로드는 실패" 안내를 띄운다.
                    //
                    // 결과:
                    //   완료 기록과 피드 업로드의 부분 성공 상태가 사용자에게 명확히 전달된다.
                    const feedRes = await fetch(`${EXPRESS_URL}/feed`, {
                        method: "POST",
                        credentials: "include",
                        body: formData, // multipart/form-data (Content-Type 자동 설정)
                    });
                    const feedData = await feedRes.json();
                    if (!feedRes.ok || !feedData.success) {
                        throw new Error(feedData.message || "피드 업로드에 실패했습니다.");
                    }
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
     * DELETE /completion/:completion_id API를 호출하여 완료 기록을 Soft Delete
     * (UPDATE deleted_at = NOW()). 연관 피드 게시물은 그대로 보존되며,
     * 피드 화면에서는 "(삭제된 루틴)" 라벨로 계속 노출된다.
     * [백엔드 주의] 완료 취소는 FastAPI를 직접 호출하지 말고,
     * 반드시 Express DELETE /completion/:completion_id 경유로 호출해야 함.
     * 이유:
     * 1. Express가 세션 쿠키로 로그인 유저를 확인하고
     * 2. 백엔드에서 session.user_id를 함께 전달하여
     * 3. FastAPI가 WHERE completion_id=? AND user_id=? 로 본인 기록만 삭제하도록 검증함
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

            // [수정 2026-05-01] Soft Delete 전환 이후, 연관 피드 게시물은
            // 함께 삭제되지 않고 그대로 보존된다 (FeedPage 에서 "(삭제된 루틴)" 라벨 표시).
        } catch (error) {
            console.error("루틴 완료 취소 실패:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    // ── [추가 2026-05-12 / frontend 머지 7/7] 신고/제재 처리 ──────────────────
    /**
     * handleReportPost - FeedPage 의 onReportPost 콜백.
     * 출처: origin/frontend src/App.jsx (commit f387027)
     * 사유: 사용자가 신고한 게시물을 reports 큐에 누적 → AdminPage 에 노출.
     * 기대효과: 한 사람이 같은 게시물을 여러 번 신고하면 reporters 배열에 누적 +
     * reportCount 증가, 새 게시물이면 새 항목 생성.
     * 장점:
     * - 백엔드 신고 API 가 없어도 프론트 단독으로 신고 흐름 완결.
     * - 백엔드 API 가 추가되면 fetch 호출 한 줄만 더하면 됨.
     */
    // [수정 2026-05-16 / 관리자 백엔드 연결]
    // 오류/변경 번호: 5/12 7/7 의 in-memory reports 누적 → 실제 백엔드(POST /report) 전환
    // 날짜: 2026-05-16
    // 사유:
    //   기존엔 신고을 App.jsx 메모리 배열에만 쌓아 새로고침하면 사라지고,
    //   다른 기기/관리자 화면에서 안 보였음. 백엔드 report 라우터 완성으로 DB 영속.
    // 기대효과:
    //   FeedPage 🚩 → POST /report → reports 테이블 저장 → AdminPage 가 GET /report 로 조회.
    // 장점:
    //   reason 문자열( "[카테고리] 상세" )을 백엔드 ENUM 스키마(report_category/report_detail)로
    //   정확히 분해해서 전달 → AdminPage 통계/필터가 정상 동작.
    const handleReportPost = async (post, reason) => {
        if (!post || !reason) return;

        // FeedPage Stage 2-5 가 "[분류] 상세사유" 형태로 reason 을 만들어 보냄.
        // 백엔드 reports.report_category(ENUM) / report_detail 로 분해한다.
        const matched = reason.match(/^\[(.+?)\]\s*(.*)$/);
        const report_category = matched ? matched[1] : "기타";
        const report_detail = matched ? matched[2] : reason;

        try {
            const res = await fetch(`${EXPRESS_URL}/report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // 세션 → reporter_user_id 는 Express 가 주입
                body: JSON.stringify({
                    feed_id: post.feed_id,
                    // 게시글 작성자 — 백엔드 reports.target_user_id
                    target_user_id: post.user_id || post.userId,
                    report_category,
                    report_detail,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                // 중복 신고(409) 등은 FeedPage 가 이미 성공 alert 를 띄우므로
                // 여기서는 콘솔만 (UX 흐름 깨지 않게)
                console.warn("신고 접수 응답:", data.message);
            }
        } catch (error) {
            console.error("신고 접수 실패:", error);
        }
    };

    /**
     * handleDeleteConfirm - AdminPage 의 onDeleteConfirm 콜백.
     * 출처: origin/frontend src/App.jsx handleConfirmDelete (commit 62d5017)
     * 사유: 관리자가 신고를 처리하면 (1) 신고 상태를 "completed" 로 전환,
     * (2) 해당 게시물 작성자에게 deleteNotifications 알림 추가.
     * 기대효과: HomePage 에 모달 표시 + AdminPage 에서 처리 완료 탭으로 이동.
     * 장점: dev 의 DELETE /feed/:feed_id 백엔드 호출도 함께 트리거하여
     * 실제 게시물도 제거 (실패해도 알림은 보냄).
     */
    // [수정 2026-05-16 / 관리자 백엔드 연결]
    // 오류/변경 번호: 5/12 7/7 의 DELETE /feed + in-memory 처리
    //                → 단일 트랜잭션(PATCH /report/process) 전환
    // 날짜: 2026-05-16
    // 사유:
    //   기존엔 (1) DELETE /feed 따로 (2) reports 상태 따로 변경이라
    //   둘 사이 실패 시 데이터가 어긋남. 백엔드 process_report 가
    //   "pending 신고 일괄 completed + 피드 Soft Delete" 를 한 트랜잭션으로 처리.
    // 기대효과:
    //   관리자가 제재하면 신고 완료 + 게시물 삭제가 원자적으로 처리되고,
    //   작성자에게 deleteNotifications 알림이 큐잉된다.
    // 장점:
    //   프론트는 PATCH /report/process 한 번만 호출 → 정합성은 백엔드 트랜잭션이 보장.
    //
    // 인자 (AdminPage handleConfirmDelete 가 호출):
    //   reportId(미사용/호환용), feedId, targetNickname, reasonText
    const handleDeleteConfirm = async (reportId, feedId, targetNickname, reasonText) => {
        try {
            const res = await fetch(`${EXPRESS_URL}/report/process`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // 세션 → processed_by(관리자) Express 주입
                body: JSON.stringify({
                    feed_id: feedId,
                    admin_comment: reasonText,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || "신고 처리에 실패했습니다.");
                return false;
            }
        } catch (error) {
            console.error("신고 처리 실패:", error);
            alert("서버 오류로 신고 처리에 실패했습니다.");
            return false;
        }

        // 작성자에게 제재 알림 큐잉 (HomePage 모달용 — 별도 mock 기능 유지)
        setDeleteNotifications((prev) => [
            ...prev,
            {
                id: Date.now(),
                nickname: targetNickname,
                routineTitle: "(제재된 게시물)",
                reason: reasonText,
            },
        ]);
        return true;
    };

    // ────────────────────────────────────────────────────────────────────
    // [제거 2026-05-20] uploadChallengeProofToFeed mock 핸들러 폐기
    // ────────────────────────────────────────────────────────────────────
    // 오류 번호: 머지 작업 (frontend-cy → dev 챌린지 통합)
    // 날짜: 2026-05-20
    // 기대효과:
    //   - ChallengePage 가 자체적으로 POST /challenge/:id/proof 호출 (백엔드 처리)
    //   - share_to_feed 컬럼이 1 이면 GET /feed/ 응답에 자동 포함되어 노출
    // 장점:
    //   - 화면 새로고침/다른 기기에서도 동일 데이터 보장
    //   - mock 핸들러/상태/prop 3종 동시 제거로 변경 흐름 추적성 향상
    // ────────────────────────────────────────────────────────────────────

    // ── 로그아웃 처리 ─────────────────────────────────────────────────────────

    /**
     * handleLogout - 로그아웃 처리
     *
     * 처리 순서:
     * 1. Express POST /logout 요청 → DB에서 세션 삭제 + 쿠키 제거
     * 2. 프론트 상태 초기화 (isLoggedIn, routines, currentUser)
     * 3. 로그인 페이지("/login")로 이동
     *
     * NOTE: 2단계는 서버 요청 실패 시에도 수행 (try/catch 구조)
     * → 서버가 꺼져있어도 프론트에서는 로그아웃됨
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
        // [추가 2026-05-12 / frontend 머지 7/7]
        // 사유: 로그아웃 시 관리자 권한/신고 임시 상태도 함께 초기화.
        // 기대효과: 같은 브라우저에서 다른 계정으로 로그인해도 이전 관리자 권한이 남지 않음.
        // 장점: deleteNotifications 는 의도적으로 보존(영구화) → 알림은 다음 접속 시에도 확인 가능.
        setIsAdmin(false);
        setNotices([]); // [수정 2026-05-16] 로그아웃 시 공지 캐시도 비움 (재로그인 시 재조회)
        // [제거 2026-05-20] challengeMockFeedPosts 폐기 — 백엔드 통합으로 mock 상태 불필요
        // [추가 2026-05-13 / frontend 머지 Stage 2-7]
        // 사유: 로그아웃 시 공지 상세 선택 상태 초기화 (notices 자체는 localStorage 보존).
        // 장점: 다른 계정 로그인 시 이전 유저가 보던 공지 상세가 노출되지 않음.
        setSelectedNotice(null);
        navigate("/login");
    };

    // ── 렌더링 ────────────────────────────────────────────────────────────────

    // [추가] 세션 복구 확인 전에는 보호 라우트 리다이렉트 대신 로딩 화면 표시
    if (!authChecked) {
        return <div className="app">로딩 중...</div>;
    }

    return (
        <div className="app">
            {/* [수정형 조건부 렌더링 적용]
                로그인 상태이면서 동시에 현재 URL 경로가 관리자(/admin)가 아닐 때만 일반 네비게이션 바를 표시합니다. */}
            {isLoggedIn && !location.pathname.startsWith("/admin") && (
                <header className="topbar">
                    {/* 로고 + 현재 월 표시 */}
                    <div className="logo">Routine Mate 🌙 {month}월</div>

                    <nav className="nav">
                        {/* navigate()로 URL 변경 → 브라우저 히스토리에 쌓임 → 뒤로가기 가능 */}
                        <button onClick={() => navigate("/")}>홈</button>
                        <button onClick={() => navigate("/routine")}>루틴</button>
                        <button onClick={() => navigate("/feed")}>피드</button>
                        <button onClick={() => navigate("/mypage")}>마이페이지</button>
                        {/* [추가 2026-05-12 / frontend-cy 머지 (45d00d8)]
                            사유: 챌린지 페이지 진입 버튼.
                            기대효과: 상단 네비게이션에서 /challenge 즉시 이동 가능.
                            장점: 사용자 동선 단축, 다른 메뉴들과 통일된 진입 방식 제공. */}
                        <button onClick={() => navigate("/challenge")}>챌린지</button>
                        {/* [추가 2026-05-13 / frontend 머지 Stage 2-7]
                            사유: 공지사항 리스트 페이지 진입점.
                            기대효과: 사용자가 언제든 공지 목록 확인 가능. */}
                        <button onClick={() => navigate("/notice")}>공지사항</button>
                        {/* [추가 2026-05-12 / frontend 머지 7/7 - 관리자 메뉴]
                            사유: 관리자만 보이는 상단 네비 진입점.
                            기대효과: isAdmin 일 때만 표시 → 일반 유저는 깔끔한 메뉴 유지.
                            장점: 조건부 렌더라 권한 없는 사람에게는 메뉴 노출 0. */}
                        {isAdmin && (
                            <button onClick={() => navigate("/admin")}>관리자</button>
                        )}
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
                                    // [추가 2026-05-12 / frontend 머지 7/7]
                                    // 사유: 3단계 HomePage 의 관리자 제재 알림 모달 props 주입.
                                    // 기대효과: AdminPage 에서 제재 → 작성자가 홈 진입 시 모달로 안내.
                                    deleteNotifications={deleteNotifications}
                                    setDeleteNotifications={setDeleteNotifications}
                                    // [추가 2026-05-13 / frontend 머지 Stage 2-7]
                                    // 사유: HomePage Stage 2-4 에서 추가한 공지사항 노출 모달이 사용할 notices 주입.
                                    // 기대효과: AdminPage 에서 공지 작성 → 홈 진입 시 모달로 안내.
                                    notices={notices}
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
                                ? <FeedPage
                                    currentUser={currentUser}
                                    // [추가 2026-05-12 / frontend 머지 7/7]
                                    // 사유: 2단계 FeedPage 의 신고 콜백 주입.
                                    // 기대효과: 🚩 신고 버튼 클릭 → reports 큐 누적 → AdminPage 노출.
                                    onReportPost={handleReportPost}
                                    // [제거 2026-05-20] extraMockPosts prop 폐기
                                    // 기대효과: FeedPage 가 백엔드(GET /feed/) 응답만으로 challenge 통합 피드 노출
                                    // 장점: 부모-자식 간 상태 동기화 부담 제거, props 표면 축소
                                />
                                : <Navigate to="/login" />
                        }
                    />

                    {/* [추가 2026-05-12 / frontend 머지 7/7 - 관리자 페이지 라우트]
                        사유: 1단계에서 추가한 AdminPage 컴포넌트를 라우트에 등록.
                        가드: 로그인 + 관리자(isAdmin) 동시 만족 필요.
                        기대효과:
                          - 비로그인 → /login
                          - 일반 유저 → / (홈으로 차단)
                          - 관리자 → AdminPage(reports, onDeleteConfirm 주입)
                        장점: 다른 보호 라우트와 같은 패턴 + 권한 가드 1줄 추가만 차이. */}
                    <Route
                        path="/admin"
                        element={
                            !isLoggedIn
                                ? <Navigate to="/login" />
                                : isAdmin
                                    ? <AdminPage
                                        // [수정 2026-05-16 / 관리자 백엔드 연결]
                                        // reports 는 props 주입 대신 AdminPage 가
                                        // 자체적으로 GET /report 조회 (관리자만 보는 데이터).
                                        // onDeleteConfirm: 제재 시 PATCH /report/process 호출.
                                        onDeleteConfirm={handleDeleteConfirm}
                                        // notices 는 App 의 fetchNotices 결과를 그대로 보여주고,
                                        // 작성/수정/삭제 후엔 onNoticeChange 로 App 이 재조회.
                                        notices={notices}
                                        onNoticeChange={fetchNotices}
                                    />
                                    : <Navigate to="/" />
                        }
                    />

                    {/* [추가 2026-05-13 / frontend 머지 Stage 2-7 - 공지사항 라우트]
                        사유: Stage 2-1/2-2 에서 추가한 NoticeList / NoticeDetail 컴포넌트 라우팅 등록.
                        가드: 로그인 사용자만 접근.
                        주의: NoticeList 의 setPage 는 frontend 원본 page-state 패턴 → useNavigate adapt.
                              setSelectedNotice 는 App.jsx 상태와 직결. */}
                    <Route
                        path="/notice"
                        element={
                            isLoggedIn
                                ? <NoticeList
                                    notices={notices}
                                    setPage={(pageKey) => {
                                        // frontend 원본: setPage("notice_detail") → react-router 로 매핑
                                        if (pageKey === "notice_detail") navigate("/notice/detail");
                                    }}
                                    setSelectedNotice={setSelectedNotice}
                                />
                                : <Navigate to="/login" />
                        }
                    />
                    <Route
                        path="/notice/detail"
                        element={
                            isLoggedIn
                                ? <NoticeDetail
                                    notice={selectedNotice}
                                    setPage={(pageKey) => {
                                        // frontend 원본: setPage("notice") → 목록으로 복귀
                                        if (pageKey === "notice") navigate("/notice");
                                    }}
                                />
                                : <Navigate to="/login" />
                        }
                    />

                    {/* 마이페이지: MyPage 내부에서 직접 /me, /routine API 호출 */}
                    <Route
                        path="/mypage"
                        element={isLoggedIn ? <MyPage /> : <Navigate to="/login" />}
                    />

                    {/* 상세 분석 페이지: 마이페이지에서 "상세 분석" 버튼으로 진입 */}
                    <Route
                        path="/stats"
                        element={isLoggedIn ? <StatsPage /> : <Navigate to="/login" />}
                    />

                    {/* [추가 2026-05-12 / frontend-cy 머지 (45d00d8)]
                        사유: 신규 챌린지 페이지 라우트 등록.
                        기대효과: 비로그인 시 /login 으로 가드, 로그인 시 ChallengePage 렌더.
                        장점: 다른 보호 라우트와 동일한 isLoggedIn 가드 패턴 사용 → 일관성↑. */}
                    <Route
                        path="/challenge"
                        element={
                            isLoggedIn
                                // [제거 2026-05-20] onUploadChallengeFeed prop 폐기
                                // 기대효과: ChallengePage 가 자체적으로 POST /challenge/:id/proof 호출
                                // 장점: 콜백 의존 제거 → 챌린지 도메인이 App.jsx 와 완전 디커플
                                ? <ChallengePage />
                                : <Navigate to="/login" />
                        }
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