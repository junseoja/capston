// 마이페이지 컴포넌트
// - 로그인한 유저의 닉네임, 총 루틴 수 표시 (백엔드 연결 완료)
// - 이번 주 달성률, 인증 게시글 수, 최근 활동 내역은 추후 연결 예정

import { useState, useEffect } from "react";

function MyPage() {
    // 로그인한 유저 정보 (GET /me 응답: { id, nickname 등 })
    const [user, setUser] = useState(null);

    // 총 루틴 수 (GET /routine 응답 배열의 length)
    const [routineCount, setRoutineCount] = useState(0);

    // 데이터 로딩 중 여부 (로딩 중에는 "로딩 중..." 표시)
    const [loading, setLoading] = useState(true);

    // 컴포넌트 마운트 시 유저 정보 + 루틴 개수 로드
    useEffect(() => {
        fetchMyInfo();
    }, []);

    // 유저 정보와 루틴 개수를 병렬로 fetch
    const fetchMyInfo = async () => {
        try {
            // GET /me: 현재 로그인한 유저의 세션 정보 조회
            const userRes = await fetch("http://localhost:3000/me", {
                credentials: "include", // 세션 쿠키 포함
            });
            const userData = await userRes.json();

            if (userData.success) {
                setUser(userData.user); // { id: "로그인ID" } 형태로 저장됨
            }

            // GET /routine: 내 루틴 목록 조회 → 개수만 사용
            const routineRes = await fetch("http://localhost:3000/routine", {
                credentials: "include",
            });
            const routineData = await routineRes.json();

            if (routineData.success) {
                setRoutineCount(routineData.routines.length); // 루틴 총 개수
            }
        } catch (error) {
            console.error("마이페이지 데이터 로딩 실패:", error);
        } finally {
            setLoading(false); // 성공/실패 관계없이 로딩 종료
        }
    };

    // 로딩 중 화면
    if (loading) return <div className="mypage">로딩 중...</div>;

    // 유저 정보 fetch 실패 시 에러 화면
    if (!user) return <div className="mypage">유저 정보를 불러올 수 없습니다.</div>;

    return (
        <div className="mypage">
            {/* ── 프로필 영역 ── */}
            <div className="mypage-profile">
                {/* 아바타: 닉네임 첫 글자 표시 (추후 프로필 이미지로 교체 예정) */}
                <div className="profile-avatar">{user.nickname?.charAt(0)}</div>
                <div className="profile-info">
                    {/* 실제 닉네임 표시 */}
                    <h1>{user.nickname}</h1>
                    <p>꾸준한 습관으로 더 나은 하루를 만드는 중</p>
                </div>
            </div>

            {/* ── 통계 카드 영역 ── */}
            <div className="mypage-stats">
                {/* 총 루틴 수: 백엔드 연결 완료 */}
                <div className="stat-card">
                    <h3>총 루틴 수</h3>
                    <p>{routineCount}</p>
                </div>

                {/* 이번 주 달성률: 추후 완료 기록 API 연결 예정 */}
                <div className="stat-card">
                    <h3>이번 주 달성률</h3>
                    <p>??%</p>
                </div>

                {/* 인증 게시글 수: 추후 feed 테이블 COUNT API 연결 예정 */}
                <div className="stat-card">
                    <h3>인증 게시글</h3>
                    <p>??개</p>
                </div>
            </div>

            {/* ── 최근 활동 내역 ── */}
            {/* 추후 실제 완료 기록 / 피드 게시 이력 API로 교체 예정 */}
            <div className="mypage-history">
                <h2>최근 활동</h2>

                <div className="history-item">
                    <div>
                        <h4>아침 스트레칭 완료</h4>
                        <p>오늘 아침 10분 스트레칭 루틴을 성공적으로 마쳤습니다.</p>
                    </div>
                    <span>오늘</span>
                </div>

                <div className="history-item">
                    <div>
                        <h4>물 2L 마시기 인증</h4>
                        <p>물 마시기 목표를 달성하고 인증 게시글을 업로드했습니다.</p>
                    </div>
                    <span>어제</span>
                </div>

                <div className="history-item">
                    <div>
                        <h4>저녁 러닝 완료</h4>
                        <p>30분 러닝 루틴을 완료하고 운동 기록을 남겼습니다.</p>
                    </div>
                    <span>2일 전</span>
                </div>
            </div>
        </div>
    );
}

export default MyPage;
