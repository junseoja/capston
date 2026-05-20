// ============================================================
// LoginPage.jsx - 로그인 페이지 컴포넌트
// ============================================================
// 역할:
//   - 아이디/비밀번호 입력 후 Express 백엔드(/login)로 POST 요청
//   - 성공 시 부모(App.jsx)의 handleLogin 콜백 호출 → 홈("/")으로 이동
//   - Enter 키로도 로그인 실행 가능 (onKeyDown 이벤트)
//
// Props:
//   onLogin    - 로그인 성공 시 호출할 콜백 (App.jsx의 handleLogin)
//                isLoggedIn = true + fetchRoutines + navigate("/") 처리
//   onGoSignup - 회원가입 버튼 클릭 시 호출 (App.jsx의 navigate("/signup"))
// ============================================================

import { useState } from "react";
import { EXPRESS_URL } from "./config";

function LoginPage({ onLogin, onGoSignup }) {
    // 아이디 입력값 상태 (제어 컴포넌트 방식)
    const [id, setId] = useState("");

    // 비밀번호 입력값 상태
    const [password, setPassword] = useState("");

    // ── [추가] 디자인 맞춤형 모달 및 알림 팝업 전용 상태 관리 ─────────────────────
    // "LOGIN" (기본 로그인), "FIND_MODAL" (아이디/비밀번호 찾기 창)
    const [viewMode, setViewMode] = useState("LOGIN");

    // 아이디 찾기 필드 상태
    const [findIdName, setFindIdName] = useState("");
    const [findIdEmail, setFindIdEmail] = useState("");

    // 비밀번호 찾기 필드 상태
    const [findPwName, setFindPwName] = useState("");
    const [findPwId, setFindPwId] = useState("");
    const [findPwEmail, setFindPwEmail] = useState("");

    // 찾기 결과용 가상 알림창(Alert Box) 제어 상태
    const [alertPopup, setAlertPopup] = useState({
        isOpen: false,
        message: ""
    });

    // ── 로그인 요청 함수 ──────────────────────────────────────────────────────

    /**
     * handleLogin - Express POST /login에 아이디/비밀번호 전송
     *
     * 처리 흐름:
     * 1. Express /login으로 POST 요청
     * 2. 성공 → 서버가 Set-Cookie로 sessionId 쿠키 발급
     * 3. onLogin() 호출 → App.jsx에서 isLoggedIn = true + 루틴 fetch + navigate("/")
     *
     * credentials: "include" 필수:
     * 서버가 Set-Cookie 헤더로 내려주는 sessionId를 브라우저가 저장하려면
     * 요청에 credentials 옵션이 "include"여야 함
     * (Express에서도 cors({ credentials: true })가 설정되어 있어야 동작)
     */
    const handleLogin = async () => {
        try {
            const response = await fetch(`${EXPRESS_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // 쿠키 저장/전송 허용
                body: JSON.stringify({ id, password }),
            });

            const result = await response.json();

            if (result.success) {
                alert("로그인 성공");
                // [추가 2026-05-12 / frontend 머지 6/7]
                // 출처: origin/frontend src/LoginPage.jsx (commit 8c9c6a2)
                // 사유: 관리자 계정 로그인 시 별도 분기(/admin 라우트) 처리를 위한 role 신호 전달.
                // 기대효과: id 가 "admin" 이면 onLogin("ADMIN") → App.jsx 가 navigate("/admin"),
                //          일반 유저는 onLogin("USER") → 기존대로 "/".
                // 장점:
                //   - dev 의 백엔드 /login 검증을 그대로 거치므로 비밀번호도 DB 에 등록된 값이어야 통과
                //     (frontend 의 하드코딩 "admin/1234" 보안 취약점 회피).
                //   - 백엔드 응답에 result.user 가 오면 user.login_id 로도 폴백 판별.
                //   - role 인자가 빠진 기존 호출 호환을 위해 App.jsx 의 handleLogin 도 기본값 처리 예정.
                const role =
                    id === "admin" || result.user?.login_id === "admin"
                        ? "ADMIN"
                        : "USER";
                // App.jsx의 handleLogin 호출
                // → setIsLoggedIn(true) + fetchCurrentUser() + fetchRoutines() + navigate(role 분기)
                onLogin(role);
            } else {
                // 서버에서 내려준 에러 메시지 표시 (예: "비밀번호가 틀렸습니다.")
                alert(result.message);
            }
        } catch (error) {
            // 서버가 꺼져있거나 네트워크 오류 시
            console.error("로그인 요청 실패:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    // ────────────────────────────────────────────────────────────────────
    // [수정 2026-05-20] 아이디/비번 찾기 Mock 제거 후 실제 백엔드 연결 (P0 #3)
    // ────────────────────────────────────────────────────────────────────
    // 오류 번호: P0 #3 (LoginPage Mock 하드코딩 → "홍길동/test@test.com" 만 동작)
    // 날짜: 2026-05-20
    // 기대 효과:
    //   - 실제 회원이 아이디/임시비밀번호를 정상적으로 받을 수 있음
    //   - 미일치 시 동일한 메시지로 사용자 정보 노출 차단
    // 장점:
    //   - 닉네임은 DB users.nickname 컬럼과 매칭 (실명 컬럼이 별도로 없음)
    //   - 비밀번호 재설정 시 서버가 임시 비번을 즉시 발급 → 다음 로그인부터 사용 가능
    //   - 이메일 발송 인프라 도입 시 응답에서 temp_password 만 제거하면 됨 (UI 변경 없음)
    // ────────────────────────────────────────────────────────────────────
    const [findIdLoading, setFindIdLoading] = useState(false);
    const [findPwLoading, setFindPwLoading] = useState(false);

    const handleFindId = async () => {
        const name = findIdName.trim();
        const email = findIdEmail.trim();
        if (!name || !email) {
            alert("닉네임과 이메일을 입력해주세요.");
            return;
        }
        if (findIdLoading) return;
        setFindIdLoading(true);
        try {
            const res = await fetch(`${EXPRESS_URL}/find-id`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname: name, email }),
            });
            const data = await res.json();
            if (res.ok && data.success && data.login_id) {
                setAlertPopup({
                    isOpen: true,
                    message: `사용자의 아이디는 [ ${data.login_id} ] 입니다.`
                });
            } else {
                setAlertPopup({
                    isOpen: true,
                    message: data.message || "일치하는 회원 정보가 없습니다."
                });
            }
        } catch (error) {
            console.error("아이디 찾기 요청 실패:", error);
            setAlertPopup({
                isOpen: true,
                message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            });
        } finally {
            setFindIdLoading(false);
        }
    };

    const handleFindPassword = async () => {
        const name = findPwName.trim();
        const id = findPwId.trim();
        const email = findPwEmail.trim();
        if (!name || !id || !email) {
            alert("닉네임, 아이디, 이메일을 모두 입력해주세요.");
            return;
        }
        if (findPwLoading) return;
        setFindPwLoading(true);
        try {
            const res = await fetch(`${EXPRESS_URL}/find-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname: name, login_id: id, email }),
            });
            const data = await res.json();
            if (res.ok && data.success && data.temp_password) {
                setAlertPopup({
                    isOpen: true,
                    message: `임시 비밀번호가 발급되었습니다.\n\n임시 비밀번호: ${data.temp_password}\n\n로그인 후 즉시 변경해주세요.`
                });
            } else {
                setAlertPopup({
                    isOpen: true,
                    message: data.message || "일치하는 회원 정보가 없습니다."
                });
            }
        } catch (error) {
            console.error("비밀번호 재설정 요청 실패:", error);
            setAlertPopup({
                isOpen: true,
                message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            });
        } finally {
            setFindPwLoading(false);
        }
    };

    // 창 닫기 및 필드값 클리어
    const handleCloseFindModal = () => {
        setViewMode("LOGIN");
        setFindIdName("");
        setFindIdEmail("");
        setFindPwName("");
        setFindPwId("");
        setFindPwEmail("");
        setAlertPopup({ isOpen: false, message: "" });
    };

    // ── 렌더링 ────────────────────────────────────────────────────────────────

    return (
        <div className="login-page" style={{ position: "relative" }}>
            <div className="login-card" style={{ overflow: "hidden" }}>
                {viewMode === "LOGIN" ? (
                    <>
                        <h1 className="login-title">로그인</h1>
                        <p className="login-subtitle">계정에 로그인하고 루틴을 시작해보세요.</p>

                        <div className="login-form">
                            {/* 아이디 입력
                                onKeyDown: Enter 키 입력 시 handleLogin 실행 (UX 개선) */}
                            <input
                                type="text"
                                placeholder="아이디를 입력하세요"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            />

                            {/* 비밀번호 입력
                                type="password": 입력값이 마스킹되어 화면에 보이지 않음
                                onKeyDown: Enter 키 입력 시 handleLogin 실행 */}
                            <input
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            />

                            <button onClick={handleLogin}>로그인</button>

                            {/* 찾기 전용 링크 링크 추가 */}
                            <div className="find-trigger-links" style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "14px", fontSize: "14px", color: "#777" }}>
                                <span onClick={() => setViewMode("FIND_MODAL")} style={{ cursor: "pointer", textDecoration: "underline" }}>아이디 / 비밀번호 찾기</span>
                            </div>
                        </div>

                        {/* 회원가입 페이지 이동 링크
                            cursor: "pointer" 스타일로 클릭 가능함을 시각적으로 표시 */}
                        <p className="login-footer">
                            아직 회원이 아니신가요?
                            <span onClick={onGoSignup} style={{ cursor: "pointer" }}>
                                {" "}회원가입{" "}
                            </span>
                        </p>
                    </>
                ) : (
                    /* [추가] 로그인 페이지의 텍스트 상자 및 버튼 스타일을 완벽하게 계승한 찾기 레이아웃 */
                    <div className="login-form" style={{ textAlign: "left", position: "relative" }}>

                        {/* 상단 스크린샷 버전 흰색 바탕 헤더 및 X 버튼 */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", margin: "-10px -10px 20px -10px" }}>
                            <span style={{ fontSize: "18px", fontWeight: "bold", color: "#2B3A78" }}>아이디/비밀번호 찾기</span>
                            <span onClick={handleCloseFindModal} style={{ cursor: "pointer", fontSize: "22px", color: "#555", fontWeight: "bold" }}>✕</span>
                        </div>

                        {/* 1. 아이디 찾기 단락 */}
                        <div style={{ marginBottom: "35px" }}>
                            <h3 style={{ fontSize: "15px", color: "#2B3A78", fontWeight: "bold", marginBottom: "12px" }}>아이디 찾기</h3>
                            <input
                                type="text"
                                placeholder="이름을 입력하세요"
                                value={findIdName}
                                onChange={(e) => setFindIdName(e.target.value)}
                                style={{ marginBottom: "10px", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                            />
                            <input
                                type="email"
                                placeholder="이메일 주소를 입력하세요"
                                value={findIdEmail}
                                onChange={(e) => setFindIdEmail(e.target.value)}
                                style={{ marginBottom: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                            />
                            {/* 그라데이션 라운드 입체 버튼 디자인 반영 */}
                            <button
                                onClick={handleFindId}
                                style={{ background: "linear-gradient(135deg, #6366f1 0%, #d946ef 100%)", color: "white", border: "none", borderRadius: "16px", padding: "10px 20px", fontWeight: "bold", cursor: "pointer", width: "auto" }}
                            >
                                아이디 찾기
                            </button>
                        </div>

                        {/* 2. 비밀번호 찾기 단락 */}
                        <div style={{ marginBottom: "10px" }}>
                            <h3 style={{ fontSize: "15px", color: "#2B3A78", fontWeight: "bold", marginBottom: "12px" }}>비밀번호 찾기</h3>
                            <input
                                type="text"
                                placeholder="이름을 입력하세요"
                                value={findPwName}
                                onChange={(e) => setFindPwName(e.target.value)}
                                style={{ marginBottom: "10px", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                            />
                            <input
                                type="text"
                                placeholder="아이디를 입력하세요"
                                value={findPwId}
                                onChange={(e) => setFindPwId(e.target.value)}
                                style={{ marginBottom: "10px", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                            />
                            <input
                                type="email"
                                placeholder="이메일 주소를 입력하세요"
                                value={findPwEmail}
                                onChange={(e) => setFindPwEmail(e.target.value)}
                                style={{ marginBottom: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                            />
                            {/* 그라데이션 라운드 입체 버튼 디자인 반영 */}
                            <button
                                onClick={handleFindPassword}
                                style={{ background: "linear-gradient(135deg, #6366f1 0%, #d946ef 100%)", color: "white", border: "none", borderRadius: "16px", padding: "10px 20px", fontWeight: "bold", cursor: "pointer", width: "auto" }}
                            >
                                비밀번호 찾기
                            </button>
                        </div>

                        {/* [수정제안 전형] 상단에 "알림" 헤더가 들어가 구조화된 세련된 인앱 알림 상자 팝업 */}
                        {alertPopup.isOpen && (
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.95)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px", zIndex: 10 }}>
                                <div style={{ border: "1px solid #e2e8f0", padding: "0", borderRadius: "16px", width: "90%", boxShadow: "0 15px 35px rgba(0,0,0,0.1)", backgroundColor: "#fff", overflow: "hidden" }}>

                                    {/* 알림 팝업 전용 헤더 상단부 */}
                                    <div style={{ backgroundColor: "#2B3A78", color: "white", padding: "12px 20px", fontSize: "15px", fontWeight: "bold", textAlign: "left" }}>
                                        알림
                                    </div>

                                    {/* 알림 본문 텍스트부 */}
                                    <div style={{ padding: "30px 20px", textAlign: "center" }}>
                                        <p style={{ fontSize: "14px", color: "#333", whiteSpace: "pre-line", lineHeight: "1.6", margin: "0 0 20px 0", fontWeight: "500" }}>
                                            {alertPopup.message}
                                        </p>
                                        <button
                                            onClick={() => setAlertPopup({ ...alertPopup, isOpen: false })}
                                            style={{ backgroundColor: "#2B3A78", color: "white", border: "none", padding: "9px 32px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", width: "auto", fontSize: "14px" }}
                                        >
                                            확인
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}

export default LoginPage;