import React, { useState } from "react";

function MyPage({
  feedPosts = [],
  setPage,
  currentUser = { nickname: "전채명", user_id: "me" },
}) {
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState([]);

  const totalRate = 78;
  const continuousDays = 12;

  const initialPosts =
    feedPosts.length > 0
      ? feedPosts.map((post) => ({
        ...post,
        feed_id: post.id,
        nickname: post.userName || "전채명",
        routine_title: post.routineTitle,
        images: post.files,
        like_count: post.likes || 0,
        liked: post.liked || false,
        created_at: post.createdAt
          ? `${post.createdAt}T${post.createdTime}:00Z`
          : new Date().toISOString(),
        comments: post.comments || [],
      }))
      : [
        {
          feed_id: "ex1",
          images: [
            {
              url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500",
            },
          ],
          nickname: "전채명",
          routine_title: "아침 운동",
          category: "운동",
          content: "오늘 아침 운동 완료! 🔥",
          like_count: 12,
          liked: false,
          created_at: "2026-05-07T22:15:00Z",
          comments: [],
        },
      ];

  const [galleryPosts, setGalleryPosts] = useState(initialPosts);

  const togglePostSelection = (feedId) => {
    setSelectedPosts((prev) =>
      prev.includes(feedId)
        ? prev.filter((id) => id !== feedId)
        : [...prev, feedId]
    );
  };

  const handleDeletePosts = () => {
    if (selectedPosts.length === 0) return;
    if (!window.confirm("선택한 게시글을 삭제하시겠습니까?")) return;

    setGalleryPosts((prev) =>
      prev.filter((post) => !selectedPosts.includes(post.feed_id))
    );

    setSelectedPosts([]);
    setIsEditMode(false);
  };

  const handleToggleLike = () => {
    if (!selectedPost) return;

    const isLiked = !selectedPost.liked;

    setSelectedPost({
      ...selectedPost,
      liked: isLiked,
      like_count: isLiked
        ? (selectedPost.like_count || 0) + 1
        : Math.max(0, (selectedPost.like_count || 0) - 1),
    });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedPost) return;

    const newComment = {
      comment_id: Date.now(),
      user_id: currentUser.user_id,
      nickname: currentUser.nickname,
      content: commentInput.trim(),
      created_at: new Date().toISOString(),
    };

    setSelectedPost({
      ...selectedPost,
      comments: [...(selectedPost.comments || []), newComment],
    });

    setCommentInput("");
  };

  const handleDeleteComment = (comment_id) => {
    if (!selectedPost) return;
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    setSelectedPost({
      ...selectedPost,
      comments: selectedPost.comments.filter(
        (c) => c.comment_id !== comment_id
      ),
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";

    return new Date(dateStr).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div
      className="mypage"
      style={{
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
      }}
    >
      {/* 프로필 */}
      <div
        className="mypage-profile"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "30px 24px",
          background: "white",
          borderRadius: "0 0 24px 24px",
        }}
      >
        <div
          className="profile-avatar"
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#4f46e5,#818cf8)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: "800",
            flexShrink: 0,
          }}
        >
          전
        </div>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: "900",
            }}
          >
            전채명
          </h1>

          <p
            style={{
              margin: "4px 0 0 0",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            오늘도 나만의 루틴으로 채워가는 하루 ✨
          </p>
        </div>
      </div>

      {/* 갓생지수 */}
      <div style={{ padding: "24px" }}>
        <div
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "900",
              }}
            >
              📊 오늘의 갓생 지수
            </h2>

            <button
              onClick={() => setPage("stats")}
              style={{
                border: "none",
                background: "#eef2ff",
                color: "#4f46e5",
                padding: "8px 14px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              상세 분석
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                border: "10px solid #4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "900",
                color: "#111827",
                marginBottom: "12px",
              }}
            >
              {totalRate}%
            </div>

            <span
              style={{
                fontWeight: "700",
                color: "#4b5563",
              }}
            >
              오늘의 통합 달성률
            </span>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div
        className="mypage-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          padding: "0 24px",
        }}
      >
        {[
          {
            label: "총 루틴 수",
            value: "12",
            unit: "개",
            color: "#4f46e5",
          },
          {
            label: "연속 달성",
            value: continuousDays,
            unit: "일",
            color: "#ef4444",
          },
          {
            label: "인증 게시글",
            value: galleryPosts.length,
            unit: "개",
            color: "#f59e0b",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="stat-card"
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                color: "#4b5563",
              }}
            >
              {stat.label}
            </h3>

            <p
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: "900",
                color: stat.color,
              }}
            >
              {stat.value}
              <span
                style={{
                  fontSize: "14px",
                  color: "#111827",
                }}
              >
                {stat.unit}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* 갤러리 */}
      <div
        className="mypage-gallery"
        style={{
          marginTop: "32px",
          padding: "0 24px 40px",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "900",
            }}
          >
            📸 내 인증 갤러리
          </h2>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontWeight: "800",
                color: "#6b7280",
              }}
            >
              총 {galleryPosts.length}개
            </span>

            <button
              onClick={() => {
                setIsEditMode(!isEditMode);
                setSelectedPosts([]);
              }}
              style={{
                border: "none",
                background: "#111827",
                color: "white",
                padding: "8px 14px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              {isEditMode ? "완료" : "관리"}
            </button>

            {selectedPosts.length === 1 && (
              <button
                style={{
                  border: "none",
                  background: "#3b82f6",
                  color: "white",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "700",
                  opacity: 0.7,
                }}
              >
                수정
              </button>
            )}

            {selectedPosts.length > 0 && (
              <button
                onClick={handleDeletePosts}
                style={{
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "700",
                }}
              >
                삭제
              </button>
            )}
          </div>
        </div>

        {/* 갤러리 목록 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            width: "100%",
          }}
        >
          {galleryPosts.map((post) => (
            <div
              key={post.feed_id}
              onClick={() => {
                if (isEditMode) {
                  togglePostSelection(post.feed_id);
                } else {
                  setSelectedPost(post);
                }
              }}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                width: "100%",
                maxWidth: "360px",
                borderRadius: "18px",
                overflow: "hidden",
                cursor: "pointer",
                background: "#e5e7eb",
              }}
            >
              <img
                src={post.images?.[0]?.url || post.images?.[0]}
                alt="피드"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              {isEditMode && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: selectedPosts.includes(post.feed_id)
                      ? "#4f46e5"
                      : "rgba(255,255,255,0.9)",
                    border: "2px solid white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "900",
                    fontSize: "15px",
                  }}
                >
                  {selectedPosts.includes(post.feed_id) ? "✓" : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedPost && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPost(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "white",
              borderRadius: "20px",
              overflow: "hidden",
            }}
          >
            <img
              src={selectedPost.images?.[0]?.url || selectedPost.images?.[0]}
              alt="상세"
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                display: "block",
              }}
            />

            <div style={{ padding: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "900" }}>
                {selectedPost.routine_title}
              </h3>

              <p style={{ color: "#6b7280", fontSize: "13px" }}>
                {formatDateTime(selectedPost.created_at)}
              </p>

              <p style={{ lineHeight: 1.6 }}>{selectedPost.content}</p>

              <button onClick={handleToggleLike}>
                {selectedPost.liked ? "❤️" : "♡"} 좋아요{" "}
                {selectedPost.like_count}
              </button>

              <form onSubmit={handleCommentSubmit} style={{ marginTop: "16px" }}>
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="댓글 달기..."
                />
                <button type="submit">게시</button>
              </form>

              {(selectedPost.comments || []).map((comment) => (
                <div key={comment.comment_id}>
                  <b>{comment.nickname}</b> {comment.content}
                  <button onClick={() => handleDeleteComment(comment.comment_id)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPage;