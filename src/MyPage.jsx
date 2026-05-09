import React, { useState } from "react";

/**
 * @param {Array} feedPosts - 피드 게시물 데이터
 * @param {Function} setPage - 페이지 전환 함수
 */
function MyPage({ feedPosts = [], setPage }) {
  // 상세보기 상태
  const [selectedPost, setSelectedPost] = useState(null);

  // 관리 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);

  // 선택된 게시글 id 저장
  const [selectedPosts, setSelectedPosts] = useState([]);

  // 가상 데이터 및 계산
  const morningRate = 100;
  const lunchRate = 45;
  const eveningRate = 0;
  const totalRate = Math.floor((morningRate + lunchRate + eveningRate) / 3);
  const continuousDays = 12;

  const fontStyle = {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
    letterSpacing: "-0.03em",
  };

  // 갤러리 아이템
  const galleryItems =
    feedPosts.length > 0
      ? feedPosts.filter((post) => post.files && post.files.length > 0)
      : [
          {
            id: "ex1",
            files: [
              {
                url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500",
              },
            ],
            user: "전채명",
            routineTitle: "아침 운동",
            category: "운동",
            content: "오늘 아침 운동 완료! 🔥",
            likes: 12,
            createdAt: "2026.05.03",
            createdTime: "07:30",
          },
          {
            id: "ex2",
            files: [
              {
                url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500",
              },
            ],
            user: "전채명",
            routineTitle: "점심 식단",
            category: "식단",
            content: "식단 관리 시작합니다.",
            likes: 8,
            createdAt: "2026.05.02",
            createdTime: "12:15",
          },
          {
            id: "ex3",
            files: [
              {
                url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500",
              },
            ],
            user: "전채명",
            routineTitle: "독서",
            category: "학습",
            content: "독서 기록 공유해요.",
            likes: 15,
            createdAt: "2026.05.01",
            createdTime: "21:00",
          },
        ];

  // 실제 갤러리 상태
  const [galleryData, setGalleryData] = useState(galleryItems);

  // 선택 토글 함수
  const togglePostSelection = (postId) => {
    setSelectedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  // 선택 삭제
  const handleDeletePosts = () => {
    setGalleryData((prev) =>
      prev.filter((post) => !selectedPosts.includes(post.id))
    );

    setSelectedPosts([]);
  };

  return (
    <div
      className="mypage"
      style={{
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
        position: "relative",
        ...fontStyle,
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
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="profile-avatar"
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4f46e5, #818cf8)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: "800",
            flexShrink: 0,
            boxShadow: "0 4px 10px rgba(79, 70, 229, 0.2)",
          }}
        >
          전
        </div>

        <div
          className="profile-info"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <h1
            style={{
              margin: "0",
              fontSize: "22px",
              fontWeight: "900",
              color: "#111827",
            }}
          >
            전채명
          </h1>

          <p
            style={{
              margin: "4px 0 0 0",
              color: "#6b7280",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            오늘도 나만의 루틴으로 채워가는 하루 ✨
          </p>
        </div>
      </div>

      {/* 갤러리 */}
      <div
        className="mypage-gallery"
        style={{
          marginTop: "32px",
          padding: "0 24px 40px 24px",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "19px",
              fontWeight: "900",
              color: "#111827",
            }}
          >
            📸 내 인증 갤러리
          </h2>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span
              style={{
                color: "#6b7280",
                fontSize: "14px",
                fontWeight: "800",
              }}
            >
              총 {galleryData.length}개
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
                fontSize: "13px",
              }}
            >
              {isEditMode ? "완료" : "관리"}
            </button>

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
                  fontSize: "13px",
                }}
              >
                삭제
              </button>
            )}
          </div>
        </div>

        {/* 갤러리 리스트 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}
        >
          {galleryData.map((post) => (
            <div
              key={post.id}
              onClick={() => {
                if (isEditMode) {
                  togglePostSelection(post.id);
                } else {
                  setSelectedPost(post);
                }
              }}
              style={{
                position: "relative",
                width: "100%",
                paddingBottom: "100%",
                overflow: "hidden",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              <img
                src={post.files[0]?.url || post.files[0]}
                alt="인증샷"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {/* 체크 버튼 */}
              {isEditMode && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: selectedPosts.includes(post.id)
                      ? "#4f46e5"
                      : "rgba(255,255,255,0.8)",
                    border: "2px solid white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "900",
                  }}
                >
                  {selectedPosts.includes(post.id) ? "✓" : ""}
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
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
          onClick={() => setSelectedPost(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "450px",
              background: "white",
              borderRadius: "20px",
              overflow: "hidden",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedPost(null)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                border: "none",
                background: "rgba(0,0,0,0.5)",
                color: "white",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                zIndex: 10,
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            {/* 이미지 */}
            <img
              src={selectedPost.files[0]?.url || selectedPost.files[0]}
              alt="인증샷"
              style={{
                width: "100%",
                aspectRatio: "1/1",
                objectFit: "cover",
              }}
            />

            {/* 내용 */}
            <div style={{ padding: "20px" }}>
              <h3
                style={{
                  margin: 0,
                  marginBottom: "10px",
                  fontWeight: "900",
                  fontSize: "20px",
                }}
              >
                {selectedPost.routineTitle}
              </h3>

              <p
                style={{
                  margin: 0,
                  marginBottom: "14px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                {selectedPost.createdAt} {selectedPost.createdTime}
              </p>

              <p
                style={{
                  margin: 0,
                  lineHeight: "1.6",
                  color: "#374151",
                  fontWeight: "500",
                }}
              >
                {selectedPost.content}
              </p>

              <div
                style={{
                  marginTop: "18px",
                  display: "flex",
                  gap: "16px",
                }}
              >
                <span style={{ fontWeight: "800", color: "#ef4444" }}>
                  ❤️ {selectedPost.likes}
                </span>

                <span style={{ fontWeight: "800", color: "#6b7280" }}>
                  💬 댓글
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default MyPage;