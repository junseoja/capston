import React, { useState } from "react";

/**
 * @param {Array} feedPosts - App.jsx에서 관리되는 실시간 피드 게시물 데이터
 * @param {Function} setPage - 페이지 전환 함수
 * @param {Object} currentUser - 현재 유저 정보 (댓글 작성/삭제용)
 */
function MyPage({ feedPosts = [], setPage, currentUser = { nickname: "전채명", user_id: "me" } }) {
  // [상세보기를 위한 상태]
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentInput, setCommentInput] = useState("");

  // 가상 데이터 및 계산 (기본 유지)
  const totalRate = 78;
  const continuousDays = 12;

  const fontStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
    letterSpacing: '-0.03em'
  };

  // ── [중요] 갤러리 아이템 연동 ──
  // feedPosts: App.jsx에서 사용자가 상세 루틴 인증 후 '피드에 올리기' 체크한 데이터들
  // 이 데이터가 있으면 화면에 보여주고, 없으면 기본 예시(galleryItems)를 보여줍니다.
  const displayPosts = feedPosts.length > 0
    ? feedPosts.map(post => ({
        ...post,
        // 데이터 필드명 통일 (FeedPage와 MyPage 구조 맞춤)
        feed_id: post.id,
        nickname: post.userName || "전채명",
        routine_title: post.routineTitle,
        images: post.files, // App.jsx에서는 files로 저장됨
        like_count: post.likes || 0,
        liked: post.liked || false,
        created_at: post.createdAt ? `${post.createdAt}T${post.createdTime}:00Z` : new Date().toISOString(),
        comments: post.comments || []
      }))
    : [
        {
          feed_id: 'ex1',
          images: [{ url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500' }],
          nickname: "전채명",
          routine_title: "아침 운동",
          category: "운동",
          content: "오늘 아침 운동 완료! 🔥",
          like_count: 12,
          liked: false,
          created_at: "2026-05-07T22:15:00Z",
          comments: [
            { comment_id: 1, user_id: "other", nickname: "루틴이", content: "와 대단하세요!", created_at: "2026-05-07T22:30:00Z" }
          ]
        }
      ];

  // [기능] 좋아요 토글
  const handleToggleLike = () => {
    if (!selectedPost) return;
    const isLiked = !selectedPost.liked;
    setSelectedPost({
      ...selectedPost,
      liked: isLiked,
      like_count: isLiked ? (selectedPost.like_count || 0) + 1 : Math.max(0, (selectedPost.like_count || 0) - 1)
    });
  };

  // [기능] 댓글 작성
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedPost) return;
    const newComment = {
      comment_id: Date.now(),
      user_id: currentUser.user_id,
      nickname: currentUser.nickname,
      content: commentInput.trim(),
      created_at: new Date().toISOString()
    };
    setSelectedPost({
      ...selectedPost,
      comments: [...(selectedPost.comments || []), newComment]
    });
    setCommentInput("");
  };

  // [기능] 댓글 삭제
  const handleDeleteComment = (comment_id) => {
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;
    setSelectedPost({
      ...selectedPost,
      comments: selectedPost.comments.filter(c => c.comment_id !== comment_id)
    });
  };

  // [유틸] 날짜 포맷
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    });
  };

  return (
    <div className="mypage" style={{ backgroundColor: "#f9fafb", minHeight: "100vh", position: "relative", ...fontStyle }}>
     
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
          <h1 style={{ margin: '0', fontSize: '22px', fontWeight: '900', color: '#111827' }}>전채명</h1>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px', fontWeight: '600' }}>오늘도 나만의 루틴으로 채워가는 하루 ✨</p>
        </div>
      </div>

      {/* 2. 오늘의 갓생 지수 */}
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

      {/* 3. 핵심 지표 섹션 */}
      <div className="mypage-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '0 24px' }}>
        {[
          { label: "총 루틴 수", value: "12", unit: "개", color: "#4f46e5" },
          { label: "연속 달성", value: continuousDays, unit: "일", color: "#ef4444" },
          { label: "인증 게시글", value: displayPosts.length, unit: "개", color: "#f59e0b" }
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
          <span style={{ color: "#6b7280", fontSize: "14px", fontWeight: '800' }}>총 {displayPosts.length}개</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: '8px' }}>
          {displayPosts.map((post) => (
            <div key={post.feed_id} onClick={() => setSelectedPost(post)} style={{ position: "relative", width: "100%", paddingBottom: "100%", overflow: "hidden", borderRadius: "12px", cursor: "pointer" }}>
              <img
                src={post.images?.[0]?.url || post.images?.[0]}
                alt="인증샷"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ★ 5. 피드 게시물 상세 보기 모달 ★ */}
      {selectedPost && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setSelectedPost(null)}>
          <div className="feed-modal-container" style={{ display: 'flex', width: "95%", maxWidth: "1050px", height: "85vh", backgroundColor: "white", borderRadius: "4px", overflow: "hidden", position: 'relative' }} onClick={(e) => e.stopPropagation()}>
           
            <button onClick={() => setSelectedPost(null)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '32px', color: '#262626', cursor: 'pointer', zIndex: 10, lineHeight: 1 }}>×</button>

            {/* 왼쪽: 이미지 영역 */}
            <div style={{ flex: 1.5, backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #efefef" }}>
              <img src={selectedPost.images?.[0]?.url || selectedPost.images?.[0]} alt="상세" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>

            {/* 오른쪽: 상세 정보 및 댓글 (FeedPage와 100% 동일 구성) */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: "350px", background: "white", textAlign: "left" }}>
             
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #efefef", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontWeight: "700", color: "#262626", fontSize: "14px" }}>{selectedPost.nickname}</span>
                <span style={{ color: "#8e8e8e" }}>•</span>
                <span style={{ fontWeight: "600", color: "#4f46e5", fontSize: "13px" }}>{selectedPost.routine_title}</span>
                <span style={{ background: '#f3efff', color: '#4f46e5', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{selectedPost.category}</span>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                <div style={{ marginBottom: "24px" }}>
                  <p style={{ margin: 0, fontSize: "14px", color: "#262626", lineHeight: "1.5" }}>
                    <span style={{ fontWeight: "700", marginRight: "8px" }}>{selectedPost.nickname}</span>
                    {selectedPost.content}
                  </p>
                  <p style={{ fontSize: "12px", color: "#8e8e8e", marginTop: "8px" }}>{formatDateTime(selectedPost.created_at)}</p>
                </div>
               
                <div style={{ borderTop: "1px solid #fafafa", paddingTop: "16px" }}>
                  {(selectedPost.comments || []).map((c) => (
                    <div key={c.comment_id} style={{ marginBottom: "16px", fontSize: "14px" }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, flex: 1, lineHeight: "1.4" }}>
                          <span style={{ fontWeight: "700", marginRight: "8px", color: "#262626" }}>{c.nickname}</span>
                          <span style={{ color: "#333" }}>{c.content}</span>
                        </p>
                        <button onClick={() => handleDeleteComment(c.comment_id)} style={{ border: 'none', background: 'none', color: '#8e8e8e', fontSize: '11px', cursor: 'pointer', marginLeft: '8px' }}>삭제</button>
                      </div>
                      <p style={{ fontSize: "11px", color: "#8e8e8e", marginTop: "4px" }}>{formatDateTime(c.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #efefef" }}>
                <div style={{ padding: "12px 16px" }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <button onClick={handleToggleLike} style={{ border: "none", background: "none", fontSize: "28px", cursor: "pointer", padding: 0 }}>
                      {selectedPost.liked ? "❤️" : "♡"}
                    </button>
                    <button style={{ border: "none", background: "none", fontSize: "24px", cursor: "pointer", padding: 0 }}>💬</button>
                  </div>
                  <p style={{ fontWeight: "700", fontSize: "14px", color: '#262626', margin: 0 }}>좋아요 {selectedPost.like_count}개</p>
                </div>
               
                <form onSubmit={handleCommentSubmit} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #efefef" }}>
                  <input type="text" placeholder="댓글 달기..." value={commentInput} onChange={(e) => setCommentInput(e.target.value)} style={{ flex: 1, border: "none", outline: "none", fontSize: "14px" }} />
                  <button type="submit" disabled={!commentInput.trim()} style={{ border: "none", background: "none", color: "#0095f6", fontWeight: "700", cursor: 'pointer', opacity: commentInput.trim() ? 1 : 0.3 }}>게시</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        div::-webkit-scrollbar { width: 4px; }
        div::-webkit-scrollbar-thumb { background-color: #dbdbdb; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default MyPage;