import React, { useState } from "react";

/**
 * @param {Array} feedPosts - App.jsx에서 넘어온 전체 피드 데이터
 * @param {Function} setFeedPosts - 좋아요/댓글 상태를 실시간으로 변경하기 위한 함수
 * @param {Function} onReportPost - 관리자 페이지 신고 연동 함수
 * @param {Object} currentUser - 현재 로그인한 유저 정보
 */
function FeedPage({ feedPosts, setFeedPosts, onReportPost, currentUser = { nickname: "전채명", user_id: "me" } }) {
  // [상태 관리] 상세 모달 제어 및 댓글 입력창
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentInput, setCommentInput] = useState("");

  // 현재 선택된 게시글 데이터 찾기
  const selectedPost = feedPosts?.find((p) => p.id === selectedPostId);

  // ── [기능 1] 좋아요 토글 (실시간 반영) ──
  const handleToggleLike = (postId) => {
    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const isLiked = !post.liked;
        return {
          ...post,
          liked: isLiked,
          likes: isLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1),
        };
      })
    );
  };

  // ── [기능 2] 실시간 댓글 게시 ──
  const handleCommentSubmit = (e, postId) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const now = new Date();
    const newComment = {
      comment_id: Date.now(),
      user_id: currentUser.user_id,
      nickname: currentUser.nickname,
      content: commentInput.trim(),
      createdAt: `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}. ${now.getHours()}:${now.getMinutes()}`,
    };

    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: [...(post.comments || []), newComment],
        };
      })
    );
    setCommentInput(""); 
  };

  // ── [기능 3] 댓글 삭제 (본인 댓글만) ──
  const handleDeleteComment = (postId, commentId) => {
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;
    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: post.comments.filter((c) => c.comment_id !== commentId),
        };
      })
    );
  };

  // ── [기능 4] 게시물 신고 (관리자 페이지 연동) ──
  const handleReportClick = (post) => {
    const reason = window.prompt("신고 사유를 입력해주세요.\n(예: 부적절한 홍보, 욕설, 도용 등)");
    if (reason && reason.trim()) {
      onReportPost(post, reason);
    }
  };

  // --- [원본 유지] 데이터 없을 때 안내 문구 ---
  if (!feedPosts || feedPosts.length === 0) {
    return (
      <div className="feed-page">
        <div className="feed-header">
          <h1 className="feed-title">피드</h1>
          <p className="feed-subtitle">
            상세 루틴 인증에서 피드 업로드를 체크하면 여기에 게시물이 올라와요.
          </p>
        </div>
        <div className="feed-empty-card">
          <p className="feed-empty-title">아직 업로드된 게시물이 없어요.</p>
          <p className="feed-empty-text">
            홈에서 상세 루틴을 인증하고 피드 업로드를 체크해보세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-page instagram-feed-page">
      <div className="feed-header">
        <h1 className="feed-title">피드</h1>
        <p className="feed-subtitle">상세 루틴 인증에서 피드 업로드를 체크하면 여기에 게시물이 올라와요.</p>
      </div>

      <div className="instagram-feed-list">
        {feedPosts.map((post) => (
          <article key={post.id} className="instagram-feed-card" style={{ background: 'white', border: '1px solid #dbdbdb', borderRadius: '8px', marginBottom: '24px', overflow: 'hidden' }}>
            
            {/* 상단: 작성자 및 루틴 정보 + 신고 버튼 */}
            <div className="instagram-feed-top" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: "800", fontSize: "14px" }}>{post.nickname || post.userName}</span>
                <span style={{ color: "#8e8e8e" }}>•</span>
                <span style={{ color: "#4f46e5", fontWeight: "700", fontSize: "13px" }}>{post.routineTitle}</span>
              </div>
              <button 
                onClick={() => handleReportClick(post)}
                style={{ border: "none", background: "none", color: "#8e8e8e", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
              >
                🚩 신고
              </button>
            </div>

            {/* 미디어 영역: 클릭 시 모달 열기 */}
            {post.files?.length > 0 && (
              <div className="instagram-feed-media-box" onClick={() => setSelectedPostId(post.id)} style={{ cursor: 'pointer' }}>
                <img src={post.files[0].url} alt="인증샷" className="instagram-feed-media" style={{ width: "100%", display: "block" }} />
              </div>
            )}

            {/* 하단: 간략 정보 및 인터랙션 */}
            <div className="instagram-feed-body" style={{ padding: "12px 16px", textAlign: "left" }}>
              <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
                <button onClick={() => handleToggleLike(post.id)} style={{ border: "none", background: "none", fontSize: "24px", cursor: "pointer", padding: 0 }}>
                  {post.liked ? "❤️" : "♡"}
                </button>
                <button onClick={() => setSelectedPostId(post.id)} style={{ border: "none", background: "none", fontSize: "24px", cursor: "pointer", padding: 0 }}>💬</button>
              </div>
              <p style={{ fontWeight: "800", fontSize: "14px", margin: "0 0 8px 0" }}>좋아요 {post.likes || 0}개</p>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <span style={{ fontWeight: "800", marginRight: "8px" }}>{post.nickname || post.userName}</span>
                {post.content}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* ★ 게시글 상세 모달 (요청하신 디자인과 100% 동일 구성) ★ */}
      {selectedPost && (
        <div className="feed-modal-backdrop" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setSelectedPostId(null)}>
          <div className="feed-modal" style={{ display: 'flex', width: "95%", maxWidth: "1050px", height: "85vh", backgroundColor: "white", borderRadius: "4px", overflow: "hidden", position: "relative" }} onClick={(e) => e.stopPropagation()}>
            
            {/* 왼쪽: 이미지 영역 */}
            <div style={{ flex: 1.5, backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={selectedPost.files[0].url} alt="상세" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>

            {/* 오른쪽: 상세 정보 및 댓글 */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: "350px", background: "white", textAlign: "left" }}>
              
              {/* 헤더 */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #efefef", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: "700", fontSize: "14px" }}>{selectedPost.nickname || selectedPost.userName}</span>
                  <span style={{ color: "#8e8e8e" }}>•</span>
                  <span style={{ fontWeight: "600", color: "#4f46e5", fontSize: "13px" }}>{selectedPost.routineTitle}</span>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button 
                    onClick={() => handleReportClick(selectedPost)}
                    style={{ border: "none", background: "#fff5f5", color: "#ef4444", fontSize: "12px", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "3px" }}
                  >
                    <span>🚩</span> 신고
                  </button>
                  <button onClick={() => setSelectedPostId(null)} style={{ border: "none", background: "none", fontSize: "28px", cursor: "pointer", color: "#262626", lineHeight: 1 }}>×</button>
                </div>
              </div>

              {/* 본문 및 댓글 스크롤 영역 */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                <div style={{ marginBottom: "24px" }}>
                  <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
                    <span style={{ fontWeight: "700", marginRight: "8px" }}>{selectedPost.nickname || selectedPost.userName}</span>
                    {selectedPost.content}
                  </p>
                  <p style={{ fontSize: "12px", color: "#8e8e8e", marginTop: "8px" }}>{selectedPost.createdAt} {selectedPost.createdTime}</p>
                </div>
                
                {/* 실시간 댓글 리스트 */}
                <div style={{ borderTop: "1px solid #fafafa", paddingTop: "16px" }}>
                  {(selectedPost.comments || []).map((c) => (
                    <div key={c.comment_id} style={{ marginBottom: "16px", fontSize: "14px" }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, flex: 1, lineHeight: "1.4" }}>
                          <span style={{ fontWeight: "700", marginRight: "8px" }}>{c.nickname}</span>
                          {c.content}
                        </p>
                        {(c.user_id === currentUser.user_id || c.nickname === currentUser.nickname) && (
                          <button onClick={() => handleDeleteComment(selectedPost.id, c.comment_id)} style={{ border: 'none', background: 'none', color: '#8e8e8e', fontSize: '11px', cursor: 'pointer', marginLeft: '8px' }}>삭제</button>
                        )}
                      </div>
                      <p style={{ fontSize: "11px", color: "#8e8e8e", marginTop: "4px" }}>{c.createdAt}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 하단: 좋아요 버튼 및 댓글 입력창 */}
              <div style={{ borderTop: "1px solid #efefef", padding: "12px 16px" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                  <button onClick={() => handleToggleLike(selectedPost.id)} style={{ border: "none", background: "none", fontSize: "28px", cursor: "pointer", padding: 0 }}>
                    {selectedPost.liked ? "❤️" : "♡"}
                  </button>
                </div>
                <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 12px 0" }}>좋아요 {selectedPost.likes || 0}개</p>
                
                <form onSubmit={(e) => handleCommentSubmit(e, selectedPost.id)} style={{ display: "flex", borderTop: "1px solid #efefef", paddingTop: "12px" }}>
                  <input 
                    type="text" 
                    placeholder="댓글 달기..." 
                    value={commentInput} 
                    onChange={(e) => setCommentInput(e.target.value)}
                    style={{ flex: 1, border: "none", outline: "none", fontSize: "14px" }} 
                  />
                  <button type="submit" disabled={!commentInput.trim()} style={{ border: "none", background: "none", color: "#0095f6", fontWeight: "700", cursor: 'pointer', opacity: commentInput.trim() ? 1 : 0.3 }}>게시</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedPage;