import React from "react";

/**
 * @param {Array} feedPosts - 피드 게시물 데이터
 * @param {Function} setPage - 페이지 전환 함수
 */
function MyPage({ feedPosts = [], setPage }) {
  // 가상 데이터 및 계산
  const morningRate = 100;
  const lunchRate = 45;
  const eveningRate = 0;
  const totalRate = Math.floor((morningRate + lunchRate + eveningRate) / 3);
  
  const continuousDays = 12;

  // 폰트 스타일 공통 적용
  const fontStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
    letterSpacing: '-0.03em'
  };

  // 갤러리 아이템 설정
  const galleryItems = feedPosts.length > 0 
    ? feedPosts.filter(post => post.files && post.files.length > 0)
    : [
        { id: 'ex1', files: [{ url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300' }] },
        { id: 'ex2', files: [{ url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300' }] },
        { id: 'ex3', files: [{ url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=300' }] },
        { id: 'ex4', files: [{ url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=300' }] },
        { id: 'ex5', files: [{ url: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=300' }] },
        { id: 'ex6', files: [{ url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=300' }] },
      ];

  return (
    <div className="mypage" style={{ backgroundColor: "#f9fafb", minHeight: "100vh", ...fontStyle }}>
      
      {/* 1. 프로필 섹션 */}
      <div className="mypage-profile" style={{ 
        display: 'flex', alignItems: 'center', gap: '16px', padding: '30px 24px',
        background: 'white', borderRadius: '0 0 24px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div className="profile-avatar" style={{ 
          width: '72px', height: '72px', borderRadius: '50%', 
          background: 'linear-gradient(135deg, #4f46e5, #818cf8)', 
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '28px', fontWeight: '800', flexShrink: 0,
          boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)'
        }}>전</div>
        <div className="profile-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <h1 style={{ margin: '0', fontSize: '22px', fontWeight: '900', color: '#111827' }}>
            전채명
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px', fontWeight: '600' }}>
            오늘도 나만의 루틴으로 채워가는 하루 ✨
          </p>
        </div>
      </div>

      {/* 2. 오늘의 갓생 지수 (박스 크기 및 차트 사이즈 축소) */}
      <div style={{ padding: '16px 24px' }}> {/* 상하 패딩을 24px에서 16px로 줄임 */}
        <div className="mypage-card" style={{ 
          backgroundColor: 'white', padding: '20px 24px', borderRadius: '24px', 
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.04)', border: '1px solid #f3f4f6' 
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#111827' }}>📊 오늘의 갓생 지수</h2>
            
            <button 
              onClick={() => setPage("stats")} 
              style={{ 
                border: "none", 
                background: "#f3f4f6", 
                color: "#4f46e5", 
                padding: "6px 12px", 
                borderRadius: "10px", 
                cursor: "pointer", 
                fontSize: "12px", 
                fontWeight: "800",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#4f46e5";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.color = "#4f46e5";
              }}
            >
              상세 분석
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* SVG 크기를 130에서 110으로 축소 */}
            <div style={{ position: "relative", width: "110px", height: "110px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
              <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="55" cy="55" r="48" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle cx="55" cy="55" r="48" fill="none" stroke="#4f46e5" strokeWidth="10" 
                  strokeDasharray={2 * Math.PI * 48} 
                  strokeDashoffset={2 * Math.PI * 48 * (1 - totalRate / 100)} 
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                />
              </svg>
              <span style={{ position: "absolute", fontSize: "28px", fontWeight: "950", color: '#111827' }}>{totalRate}%</span>
            </div>
            <span style={{ fontSize: "14px", color: "#374151", fontWeight: "800", letterSpacing: "-0.04em" }}>오늘의 통합 달성률</span>
          </div>
        </div>
      </div>

      {/* 3. 핵심 지표 섹션 */}
      <div className="mypage-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '0 24px' }}>
        {[
          { label: "총 루틴 수", value: "12", unit: "개", color: "#4f46e5" },
          { label: "연속 달성", value: continuousDays, unit: "일", color: "#ef4444" },
          { label: "인증 게시글", value: feedPosts.length || "0", unit: "개", color: "#f59e0b" }
        ].map((stat, idx) => (
          <div key={idx} style={{ 
            backgroundColor: 'white', padding: '20px 10px', borderRadius: '24px', 
            textAlign: 'center', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '10px', fontWeight: '800' }}>{stat.label}</h3>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: '950', color: stat.color }}>
              {stat.value}<span style={{ fontSize: '13px', marginLeft: '3px', color: '#111827', fontWeight: '800' }}>{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 4. 내 인증 갤러리 */}
      <div className="mypage-gallery" style={{ marginTop: "32px", padding: '0 24px 40px 24px' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: '19px', fontWeight: '900', color: '#111827' }}>📸 내 인증 갤러리</h2>
          <span style={{ color: "#6b7280", fontSize: "14px", fontWeight: '800' }}>총 {galleryItems.length}개</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: '12px' }}>
          {galleryItems.map((post) => (
            <div 
              key={post.id} 
              onClick={() => setPage("feed")}
              style={{ 
                position: "relative", width: "100%", paddingBottom: "100%", 
                overflow: "hidden", borderRadius: "20px", cursor: "pointer", 
                backgroundColor: "#e5e7eb", transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(0.95)";
                e.currentTarget.style.boxShadow = "0 8px 15px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <img 
                src={post.files[0]?.url || post.files[0]} 
                alt="인증샷" 
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyPage;