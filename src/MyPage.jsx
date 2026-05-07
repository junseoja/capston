import React, { useState } from "react";

/**
 * @param {Array} feedPosts - 피드 게시물 데이터
 * @param {Function} setPage - 페이지 전환 함수
 */
function MyPage({ feedPosts = [], setPage }) {
  // [수정] 상세보기를 위한 상태
  const [selectedPost, setSelectedPost] = useState(null);

  // 가상 데이터 및 계산 (기존 유지)
  const morningRate = 100;
  const lunchRate = 45;
  const eveningRate = 0;
  const totalRate = Math.floor((morningRate + lunchRate + eveningRate) / 3);
  const continuousDays = 12;

  const fontStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
    letterSpacing: '-0.03em'
  };

  // 갤러리 아이템 설정 (기존 유지)
  const galleryItems = feedPosts.length > 0 
    ? feedPosts.filter(post => post.files && post.files.length > 0)
    : [
        { id: 'ex1', files: [{ url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500' }], user: "전채명", routineTitle: "아침 운동", category: "운동", content: "오늘 아침 운동 완료! 🔥", likes: 12, createdAt: "2026.05.03", createdTime: "07:30" },
        { id: 'ex2', files: [{ url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500' }], user: "전채명", routineTitle: "점심 식단", category: "식단", content: "식단 관리 시작합니다.", likes: 8, createdAt: "2026.05.02", createdTime: "12:15" },
        { id: 'ex3', files: [{ url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500' }], user: "전채명", routineTitle: "독서", category: "학습", content: "독서 기록 공유해요.", likes: 15, createdAt: "2026.05.01", createdTime: "21:00" },
      ];

  return (
    <div className="mypage" style={{ backgroundColor: "#f9fafb", minHeight: "100vh", position: "relative", ...fontStyle }}>
      
      {/* 1. 프로필 섹션 (기존 코드 유지) */}
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

      {/* 2. 오늘의 갓생 지수 (기존 코드 유지) */}
      <div style={{ padding: '16px 24px' }}>
        <div className="mypage-card" style={{ 
          backgroundColor: 'white', padding: '20px 24px', borderRadius: '24px', 
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.04)', border: '1px solid #f3f4f6' 
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#111827' }}>📊 오늘의 갓생 지수</h2>
            <button onClick={() => setPage("stats")} className="check-btn" style={{ padding: "6px 12px", fontSize: "12px" }}>상세 분석</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
            <span style={{ fontSize: "14px", color: "#374151", fontWeight: "800" }}>오늘의 통합 달성률</span>
          </div>
        </div>
      </div>

      {/* 3. 핵심 지표 섹션 (기존 코드 유지) */}
      <div className="mypage-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '0 24px' }}>
        {[
          { label: "총 루틴 수", value: "12", unit: "개", color: "#4f46e5" },
          { label: "연속 달성", value: continuousDays, unit: "일", color: "#ef4444" },
          { label: "인증 게시글", value: galleryItems.length, unit: "개", color: "#f59e0b" }
        ].map((stat, idx) => (
          <div key={idx} className="stat-card" style={{ padding: '20px 10px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '10px', fontWeight: '800' }}>{stat.label}</h3>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: '950', color: stat.color }}>
              {stat.value}<span style={{ fontSize: '13px', marginLeft: '3px', color: '#111827' }}>{stat.unit}</span>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: '8px' }}>
          {galleryItems.map((post) => (
            <div 
              key={post.id} 
              onClick={() => setSelectedPost(post)} 
              style={{ position: "relative", width: "100%", paddingBottom: "100%", overflow: "hidden", borderRadius: "12px", cursor: "pointer" }}
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

      {/* ★ 5. 피드 게시글 스타일 모달 (상세보기) ★ */}
      {selectedPost && (
        <div 
          className="modal-overlay" 
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" }}
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="instagram-feed-card" 
            style={{ width: "100%", maxWidth: "450px", margin: 0, maxHeight: "90vh", overflowY: "auto", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button onClick={() => setSelectedPost(null)} style={{ position: "absolute", top: "15px", right: "15px", border: "none", background: "rgba(0,0,0,0.5)", color: "white", width: "30px", height: "30px", borderRadius: "50%", zIndex: 10, cursor: "pointer" }}>✕</button>

            {/* 피드 헤더와 동일하게 구성 */}
            <div className="instagram-feed-top">
              <h3 className="instagram-feed-routine-title">{selectedPost.routineTitle || "오늘의 루틴"}</h3>
              <div className="instagram-feed-info-row">
                <span className="instagram-feed-info-badge">{selectedPost.category || "인증"}</span>
                <span className="instagram-feed-info-time">{selectedPost.createdAt} {selectedPost.createdTime || ""}</span>
              </div>
            </div>

            {/* 미디어 박스 */}
            <div className="instagram-feed-media-box">
              <img 
                src={selectedPost.files[0]?.url || selectedPost.files[0]} 
                alt="인증샷" 
                className="instagram-feed-media"
                style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} 
              />
            </div>

            {/* 피드 바디 (캡션 + 좋아요/댓글) */}
            <div className="instagram-feed-body">
              <p className="instagram-feed-caption" style={{ marginBottom: "15px" }}>
                {selectedPost.content}
              </p>
              
              <div style={{ display: "flex", gap: "15px", borderTop: "1px solid #f3f4f6", paddingTop: "15px" }}>
                <span style={{ cursor: "pointer", fontWeight: "800", color: "#ef4444" }}>❤️ {selectedPost.likes}</span>
                <span style={{ cursor: "pointer", fontWeight: "800", color: "#6b7280" }}>💬 댓글 쓰기</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

export default MyPage;