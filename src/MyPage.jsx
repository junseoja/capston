import { useState, useEffect } from "react"; // ✅ 추가

function MyPage() {
    const [user, setUser] = useState(null);         // ✅ 유저 정보
    const [routineCount, setRoutineCount] = useState(0); // ✅ 총 루틴 수
    const [loading, setLoading] = useState(true);   // ✅ 로딩 상태

    // ✅ 페이지 로딩 시 유저 정보 + 루틴 개수 가져오기
    useEffect(() => {
        fetchMyInfo();
    }, []);

    const fetchMyInfo = async () => {
        try {
            // 유저 정보 가져오기
            const userRes = await fetch("http://localhost:3000/me", {
                credentials: "include"
            });
            const userData = await userRes.json();

            if (userData.success) {
                setUser(userData.user);
            }

            // 루틴 개수 가져오기
            const routineRes = await fetch("http://localhost:3000/routine", {
                credentials: "include"
            });
            const routineData = await routineRes.json();

            if (routineData.success) {
                setRoutineCount(routineData.routines.length);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="mypage">로딩 중...</div>;
    if (!user) return <div className="mypage">유저 정보를 불러올 수 없습니다.</div>;

    return (
        <div className="mypage">
            <div className="mypage-profile">
                {/* ✅ 닉네임 첫 글자 표시 */}
                <div className="profile-avatar">{user.nickname?.charAt(0)}</div>
                <div className="profile-info">
                    {/* ✅ 실제 닉네임 표시 */}
                    <h1>{user.nickname}</h1>
                    <p>꾸준한 습관으로 더 나은 하루를 만드는 중</p>
                </div>
            </div>

            <div className="mypage-stats">
                {/* ✅ 실제 루틴 개수 표시 */}
                <div className="stat-card">
                    <h3>총 루틴 수</h3>
                    <p>{routineCount}</p>
                </div>
                <div className="stat-card">
                    <h3>이번 주 달성률</h3>
                    <p>??%</p> {/* 나중에 연결 */}
                </div>
                <div className="stat-card">
                    <h3>인증 게시글</h3>
                    <p>??개</p> {/* 나중에 연결 */}
                </div>
            </div>

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