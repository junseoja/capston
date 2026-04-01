function FeedPage() {
  return (
    <div className="feed-page">
      <div className="feed-header">
        <h1 className="feed-title">인증 피드</h1>
        <p className="feed-subtitle">
          다른 사용자들의 루틴 인증을 확인하고 동기부여를 받아보세요.
        </p>
      </div>

      <div className="feed-list">
        <div className="feed-card">
          <div className="feed-image">사진</div>
          <div className="feed-content">
            <div className="feed-top">
              <h3>아침 스트레칭 완료</h3>
              <span>2026.03.19</span>
            </div>
            <p className="feed-user">김준서</p>
            <p className="feed-text">
              오늘도 아침에 10분 스트레칭 완료! 몸이 훨씬 가벼워진 느낌이에요.
            </p>
          </div>
        </div>

        <div className="feed-card">
          <div className="feed-image">사진</div>
          <div className="feed-content">
            <div className="feed-top">
              <h3>물 2L 마시기 성공</h3>
              <span>2026.03.18</span>
            </div>
            <p className="feed-user">박민지</p>
            <p className="feed-text">
              오늘 목표했던 물 2리터 채웠어요. 작은 습관이지만 뿌듯합니다.
            </p>
          </div>
        </div>

        <div className="feed-card">
          <div className="feed-image">사진</div>
          <div className="feed-content">
            <div className="feed-top">
              <h3>저녁 러닝 인증</h3>
              <span>2026.03.17</span>
            </div>
            <p className="feed-user">이서연</p>
            <p className="feed-text">
              퇴근 후 30분 러닝 완료. 힘들었지만 끝나고 나니까 기분이 정말 좋았어요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedPage