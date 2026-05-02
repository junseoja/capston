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
    <div className="mypage" style={{ backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      {/* 1. 프로필 섹션 - 유지: 전채명 이름/스타일 */}
      <div className="mypage-profile" style={{ 
        display: 'flex', alignItems: 'center', gap: '20px', padding: '40px 24px',
        background: 'white', borderRadius: '0 0 24px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div className="profile-avatar" style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          background: 'linear-gradient(135deg, #4f46e5, #818cf8)', 
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '32px', fontWeight: 'bold' 
        }}>전</div>
        <div className="profile-info">
          <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#111827' }}>전채명</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>오늘도 나만의 루틴으로 채워가는 하루 ✨</p>
        </div>
      </div>

      {/* 2. 오늘의 갓생 지수 (차트) - 텍스트 유지 */}
      <div style={{ padding: '24px' }}>
        <div className="mypage-card" style={{ 
          backgroundColor: 'white', padding: '24px', borderRadius: '20px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6' 
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#374151' }}>📊 오늘의 갓생 지수</h2>
            <button 
              onClick={() => setPage("stats")} 
              style={{ border: "none", background: "#f3f4f6", color: "#4f46e5", padding: "6px 14px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}
            >
              상세 분석
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ position: "relative", width: "120px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
              <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#4f46e5" strokeWidth="10" 
                  strokeDasharray={2 * Math.PI * 52} 
                  strokeDashoffset={2 * Math.PI * 52 * (1 - totalRate / 100)} 
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                />
              </svg>
              <span style={{ position: "absolute", fontSize: "26px", fontWeight: "800", color: '#111827' }}>{totalRate}%</span>
            </div>
            {/* 유지: 오늘의 통합 달성률 텍스트 */}
            <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>오늘의 통합 달성률</span>
          </div>
        </div>
      </div>

      {/* 3. 핵심 지표 섹션 */}
      <div className="mypage-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '0 24px' }}>
        {[
          { label: "총 루틴 수", value: "12", unit: "개", color: "#4f46e5", bg: "#eef2ff" },
          { label: "연속 달성", value: continuousDays, unit: "일", color: "#ef4444", bg: "#fef2f2" },
          { label: "인증 게시글", value: feedPosts.length || "0", unit: "개", color: "#f59e0b", bg: "#fffbeb" }
        ].map((stat, idx) => (
          <div key={idx} style={{ 
            backgroundColor: 'white', padding: '18px 10px', borderRadius: '18px', 
            textAlign: 'center', border: '1px solid #f3f4f6'
          }}>
            <h3 style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>{stat.label}</h3>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: stat.color }}>
              {stat.value}<span style={{ fontSize: '12px', marginLeft: '2px', color: '#9ca3af', fontWeight: '500' }}>{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 4. 내 인증 갤러리 */}
      <div className="mypage-gallery" style={{ marginTop: "32px", padding: '0 24px 40px 24px' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#374151' }}>📸 내 인증 갤러리</h2>
          <span style={{ color: "#9ca3af", fontSize: "13px", fontWeight: '500' }}>총 {galleryItems.length}개</span>
        </div>

        <div style={{ 
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: '10px'
        }}>
          {galleryItems.map((post) => (
            <div 
              key={post.id} 
              onClick={() => setPage("feed")}
              style={{ 
                position: "relative", width: "100%", paddingBottom: "100%", 
                overflow: "hidden", borderRadius: "14px", cursor: "pointer", 
                backgroundColor: "#e5e7eb", transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <img 
                src={post.files[0]?.url || post.files[0]} 
                alt="인증샷" 
                style={{ 
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" 
                }}
              />
            </div>
          ))}
        </div>
        
        {galleryItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", backgroundColor: 'white', borderRadius: '20px', marginTop: '10px' }}>
            <p style={{ color: "#9ca3af", fontSize: '14px' }}>아직 인증 사진이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage;