function MyPage() {
  return (
    <div className="mypage">
      <div className="mypage-profile">
        <div className="profile-avatar">김</div>
        <div className="profile-info">
          <h1>김준서</h1>
          <p>꾸준한 습관으로 더 나은 하루를 만드는 중</p>
        </div>
      </div>

      <div className="mypage-stats">
        <div className="stat-card">
          <h3>총 루틴 수</h3>
          <p>12개</p>
        </div>
        <div className="stat-card">
          <h3>이번 주 달성률</h3>
          <p>86%</p>
        </div>
        <div className="stat-card">
          <h3>인증 게시글</h3>
          <p>24개</p>
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
  )
}

export default MyPage