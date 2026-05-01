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
  
  // 연속 달성일 가상 데이터 (추후 상태값으로 관리 가능)
  const continuousDays = 12;

  // 갤러리 아이템 (피드 데이터가 있으면 가져오고 없으면 샘플)
  const galleryItems = feedPosts.length > 0 
    ? feedPosts.filter(post => post.files && post.files.length > 0)
    : [
        { id: 'ex1', files: [{ url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300' }] },
        { id: 'ex2', files: [{ url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300' }] },
        { id: 'ex3', files: [{ url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=300' }] },
      ];

  return (
    <div className="mypage">
      {/* 1. 프로필 섹션 */}
      <div className="mypage-profile" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '30px' }}>
        <div className="profile-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>전</div>
        <div className="profile-info">
          <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>전채명</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>오늘도 나만의 루틴으로 채워가는 하루 ✨</p>
        </div>
      </div>

      {/* 2. 오늘의 갓생 지수 (차트) */}
      <div className="mypage-history" style={{ marginBottom: "24px", padding: '24px' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>📊 오늘의 갓생 지수</h2>
          <button 
            onClick={() => setPage("stats")} 
            style={{ border: "none", background: "#f3f4f6", color: "#4b5563", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
          >
            상세 분석 &gt;
          </button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", width: "100px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
            <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="44" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#4f46e5" strokeWidth="8" 
                strokeDasharray={2 * Math.PI * 44} 
                strokeDashoffset={2 * Math.PI * 44 * (1 - totalRate / 100)} 
                strokeLinecap="round"
              />
            </svg>
            <span style={{ position: "absolute", fontSize: "22px", fontWeight: "800", color: '#111827' }}>{totalRate}%</span>
          </div>
          <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>오늘의 통합 달성률</span>
        </div>
      </div>

      {/* 3. 핵심 지표 섹션 (수정됨) */}
      <div className="mypage-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '0 24px' }}>
        {[
          { label: "총 루틴 수", value: "12", unit: "개", color: "#4f46e5" },
          { label: "연속 달성", value: continuousDays, unit: "일", color: "#ef4444" },
          { label: "인증 게시글", value: feedPosts.length || "0", unit: "개", color: "#f59e0b" }
        ].map((stat, idx) => (
          <div key={idx} className="stat-card" style={{ 
            backgroundColor: 'white', 
            padding: '20px 10px', 
            borderRadius: '16px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
            border: '1px solid #f3f4f6'
          }}>
            <h3 style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>{stat.label}</h3>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: stat.color }}>
              {stat.value}<span style={{ fontSize: '13px', marginLeft: '2px', color: '#374151', fontWeight: '600' }}>{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 4. 내 인증 갤러리 */}
      <div className="mypage-history" style={{ marginTop: "24px", padding: '24px' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>📸 내 인증 갤러리</h2>
          <span style={{ color: "#9ca3af", fontSize: "13px", fontWeight: '500' }}>총 {galleryItems.length}개</span>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: '4px',
          width: "100%" 
        }}>
          {galleryItems.map((post) => (
            <div 
              key={post.id} 
              onClick={() => setPage("feed")}
              style={{ 
                position: "relative", 
                width: "100%", 
                paddingBottom: "100%",
                overflow: "hidden",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor: "#f9fafb"
              }}
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
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: '14px' }}>아직 인증된 사진이 없어요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage;