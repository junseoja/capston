// ============================================================
// MyPage.jsx - 마이페이지 컴포넌트
// ============================================================
// 역할:
//   - 로그인한 유저의 닉네임, 프로필 아바타 표시
//   - 총 루틴 수 표시 (GET /routine 연결 완료)
//   - 이번 주 달성률, 인증 게시글 수 (추후 API 연결 예정)
//   - 최근 활동 내역 (GET /completion/history 연결 완료)
//
// 데이터 fetch 구조:
//   GET /me                   → 유저 정보 (nickname, profile_img 등)
//   GET /routine              → 루틴 목록 (개수만 사용)
//   GET /completion/history   → 최근 완료 이력 (최신 20건)
//   Promise.all로 병렬 fetch (성능 최적화)
// ============================================================

import { useState, useEffect } from "react";

/**
 * formatDate - completed_at 타임스탬프를 상대적 날짜 문자열로 변환
 *
 * @param {string} dateStr - DB에서 반환된 날짜 문자열 (예: "2026-04-15T10:30:00")
 * @returns {string} "오늘" | "어제" | "N일 전"
 */
function formatDate(dateStr) {
    const completed = new Date(dateStr);
    const today = new Date();

    // 시간을 0으로 맞춰 날짜 단위로만 비교
    const completedDay = new Date(
        completed.getFullYear(),
        completed.getMonth(),
        completed.getDate()
    );
    const todayDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    const diffMs = todayDay - completedDay;       // 밀리초 단위 차이
    const diffDays = Math.round(diffMs / 86400000); // 일 단위로 변환

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    return `${diffDays}일 전`;
}

function MyPage() {
    // 로그인한 유저 정보 (GET /me 응답: { user_id, login_id, nickname, ... })
    const [user, setUser] = useState(null);

    // 총 루틴 수 (GET /routine 응답 배열의 length)
    const [routineCount, setRoutineCount] = useState(0);

    // 완료 이력 (GET /completion/history 응답: 최신 20건 배열)
    // 각 항목: { completion_id, routine_id, proof_text, completed_at, title, category, routine_mode }
    const [completionHistory, setCompletionHistory] = useState([]);

    // 데이터 로딩 중 여부 (true일 때 "로딩 중..." 표시)
    const [loading, setLoading] = useState(true);

    // ── 데이터 fetch ──────────────────────────────────────────────────────────

    // 컴포넌트 마운트 시 한 번만 유저 정보 + 루틴 개수 + 완료 이력 로드
    // 의존성 배열 [] → 마운트 시 1회 실행 (언마운트 시 정리 불필요)
    useEffect(() => {
        fetchMyInfo();
    }, []);

    /**
     * fetchMyInfo - 유저 정보, 루틴 개수, 완료 이력을 병렬로 fetch
     *
     * Promise.all로 세 요청을 동시에 보내 총 대기 시간을 단축.
     * 개별 요청이 실패해도 finally에서 loading = false 보장.
     *
     * 에러 처리:
     *   - 개별 fetch 실패 시 해당 상태는 초기값 유지
     *   - finally에서 loading = false (항상 로딩 종료)
     */
    const fetchMyInfo = async () => {
        try {
            // ── 세 요청을 병렬로 실행 ──
            const [userRes, routineRes, historyRes] = await Promise.all([
                // 유저 정보: 세션 쿠키로 현재 로그인한 유저 정보를 Express에서 반환
                fetch("http://localhost:3000/me", { credentials: "include" }),
                // 루틴 목록: 개수 계산에만 사용
                fetch("http://localhost:3000/routine", { credentials: "include" }),
                // 완료 이력: 마이페이지 최근 활동 섹션용
                fetch("http://localhost:3000/completion/history", { credentials: "include" }),
            ]);

            const [userData, routineData, historyData] = await Promise.all([
                userRes.json(),
                routineRes.json(),
                historyRes.json(),
            ]);

            if (userData.success) {
                setUser(userData.user); // { user_id, login_id, nickname, email, ... }
            }

            if (routineData.success) {
                setRoutineCount(routineData.routines.length); // 배열 길이 = 루틴 총 개수
            }

            if (historyData.success) {
                setCompletionHistory(historyData.history); // 최신 20건 완료 이력
            }
        } catch (error) {
            console.error("마이페이지 데이터 로딩 실패:", error);
            // 에러 시 각 상태는 초기값 유지 (null, 0, [])
        } finally {
            setLoading(false); // 성공/실패 관계없이 로딩 상태 해제
        }
    };

    // ── 조건부 렌더링 ─────────────────────────────────────────────────────────

    // 데이터 로딩 중 표시
    if (loading) return <div className="mypage">로딩 중...</div>;

    // 유저 정보 fetch 실패 시 에러 화면 (세션 만료 등)
    if (!user) return <div className="mypage">유저 정보를 불러올 수 없습니다.</div>;

    // ── 렌더링 ────────────────────────────────────────────────────────────────

    return (
        <div className="mypage">
            {/* ── 프로필 영역 ── */}
            <div className="mypage-profile">
                {/* 프로필 아바타: 닉네임 첫 글자를 원형으로 표시
                    optional chaining(?.)으로 nickname이 없는 경우 안전하게 처리
                    TODO: user.profile_img가 있으면 이미지로 교체 */}
                <div className="profile-avatar">{user.nickname?.charAt(0)}</div>

                <div className="profile-info">
                    <h1>{user.nickname}</h1>
                    <p>꾸준한 습관으로 더 나은 하루를 만드는 중</p>
                </div>
            </div>

            {/* ── 통계 카드 영역 ── */}
            <div className="mypage-stats">
                {/* 총 루틴 수: GET /routine 연결 완료 */}
                <div className="stat-card">
                    <h3>총 루틴 수</h3>
                    <p>{routineCount}</p>
                </div>

                {/* 이번 주 달성률: 추후 GET /completion/today + 루틴 수로 계산 예정 */}
                <div className="stat-card">
                    <h3>이번 주 달성률</h3>
                    <p>??%</p>
                </div>

                {/* 인증 게시글 수: 추후 GET /feed (유저별) COUNT 연결 예정 */}
                <div className="stat-card">
                    <h3>인증 게시글</h3>
                    <p>??개</p>
                </div>
            </div>

            {/* ── 최근 활동 내역 ── */}
            {/* GET /completion/history 연결 완료 → 실제 완료 이력 표시 */}
            <div className="mypage-history">
                <h2>최근 활동</h2>

                {completionHistory.length === 0 ? (
                    // 완료 이력이 없을 때 안내 메시지
                    <p className="history-empty">아직 완료한 루틴이 없어요. 홈에서 루틴을 인증해보세요!</p>
                ) : (
                    // 완료 이력 목록 렌더링 (최신순, 최대 20건)
                    completionHistory.map((item) => (
                        <div key={item.completion_id} className="history-item">
                            <div>
                                {/* 루틴 제목 + 카테고리 배지 */}
                                <h4>
                                    {item.title}
                                    {item.category && (
                                        <span className="insta-feed-category" style={{ marginLeft: "8px", fontSize: "0.75rem" }}>
                                            {item.category}
                                        </span>
                                    )}
                                </h4>
                                {/* 인증 글이 있으면 표시, 없으면 완료 방식 표시 */}
                                <p>
                                    {item.proof_text
                                        ? item.proof_text
                                        : item.routine_mode === "detail"
                                            ? "상세 루틴 인증 완료"
                                            : "루틴 체크 완료"}
                                </p>
                            </div>
                            {/* 완료 날짜: "오늘" / "어제" / "N일 전" */}
                            <span>{formatDate(item.completed_at)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default MyPage;
