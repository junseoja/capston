// ============================================================
// FeedPage.jsx - 피드 페이지 컴포넌트
// ============================================================
// 역할:
//   - DB에서 전체 피드 목록을 최신순으로 조회하여 표시
//   - 인스타그램 스타일 카드 UI (닉네임, 루틴 제목, 인증 글, 사진/영상)
//   - 좋아요 토글 (POST /like API 연결)
//   - 댓글 모달 (작성: POST /comment, 삭제: DELETE /comment)
//   - 피드 이미지는 Express /uploads/ 경로에서 정적 서빙
//
// Props:
//   currentUser - 현재 로그인한 유저 정보 ({ user_id, nickname, ... })
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { EXPRESS_URL } from "./config";

function FeedPage({ currentUser }) {
    // 피드 목록 (DB에서 조회, 최신순)
    const [feedPosts, setFeedPosts] = useState([]);

    // 데이터 로딩 상태
    const [loading, setLoading] = useState(true);

    // 댓글 모달: 선택된 피드 ID
    const [selectedPostId, setSelectedPostId] = useState(null);

    // 댓글 입력값
    const [commentInput, setCommentInput] = useState("");

    // 현재 선택된 피드 객체
    const selectedPost = feedPosts.find((post) => post.feed_id === selectedPostId) ?? null;

    // ── 피드 목록 조회 ────────────────────────────────────────────────────────

    /**
     * fetchFeeds - Express GET /feed에서 전체 피드를 최신순으로 조회
     * 각 피드에 이미지 목록, 좋아요 상태, 댓글 목록이 포함되어 반환됨
     */
    const fetchFeeds = useCallback(async () => {
        try {
            const res = await fetch(`${EXPRESS_URL}/feed`, {
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setFeedPosts(data.feeds);
            }
        } catch (error) {
            console.error("피드 목록 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 컴포넌트 마운트 시 피드 로드
    useEffect(() => {
        fetchFeeds();
    }, [fetchFeeds]);

    // 모달 열릴 때 배경 스크롤 방지
    useEffect(() => {
        if (!selectedPost) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [selectedPost]);

    // ── 좋아요 토글 ──────────────────────────────────────────────────────────

    const handleToggleLike = async (feed_id) => {
        try {
            const res = await fetch(`${EXPRESS_URL}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ feed_id }),
            });
            const data = await res.json();

            if (data.success) {
                // 로컬 상태 즉시 업데이트 (서버 응답 기반)
                setFeedPosts((prev) =>
                    prev.map((post) => {
                        if (post.feed_id !== feed_id) return post;
                        return {
                            ...post,
                            liked: data.liked,
                            like_count: data.liked
                                ? post.like_count + 1
                                : Math.max(0, post.like_count - 1),
                        };
                    })
                );
            }
        } catch (error) {
            console.error("좋아요 토글 실패:", error);
        }
    };

    // ── 댓글 모달 ─────────────────────────────────────────────────────────────

    const openCommentModal = (feed_id) => {
        setSelectedPostId(feed_id);
        setCommentInput("");
    };

    const closeCommentModal = () => {
        setSelectedPostId(null);
        setCommentInput("");
    };

    // ── 댓글 작성 ─────────────────────────────────────────────────────────────

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPost || !commentInput.trim()) return;

        try {
            const res = await fetch(`${EXPRESS_URL}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    feed_id: selectedPost.feed_id,
                    content: commentInput.trim(),
                }),
            });
            const data = await res.json();

            if (data.success) {
                // 댓글 추가 후 로컬 상태 즉시 업데이트
                const newComment = {
                    comment_id: data.comment_id,
                    feed_id: selectedPost.feed_id,
                    user_id: currentUser?.user_id,
                    content: commentInput.trim(),
                    nickname: currentUser?.nickname ?? "나",
                    created_at: new Date().toISOString(),
                };

                setFeedPosts((prev) =>
                    prev.map((post) => {
                        if (post.feed_id !== selectedPost.feed_id) return post;
                        return {
                            ...post,
                            comments: [...(post.comments || []), newComment],
                            comment_count: (post.comment_count || 0) + 1,
                        };
                    })
                );
                setCommentInput("");
            }
        } catch (error) {
            console.error("댓글 작성 실패:", error);
        }
    };

    // ── 댓글 삭제 ─────────────────────────────────────────────────────────────

    const handleDeleteComment = async (comment_id) => {
        if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`${EXPRESS_URL}/comment/${comment_id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setFeedPosts((prev) =>
                    prev.map((post) => {
                        const filtered = (post.comments || []).filter(
                            (c) => c.comment_id !== comment_id
                        );
                        if (filtered.length === (post.comments || []).length) return post;
                        return {
                            ...post,
                            comments: filtered,
                            comment_count: Math.max(0, (post.comment_count || 0) - 1),
                        };
                    })
                );
            }
        } catch (error) {
            console.error("댓글 삭제 실패:", error);
        }
    };

    // ── 유틸리티 ──────────────────────────────────────────────────────────────

    /**
     * getImageUrl - 이미지 URL을 Express 서버 기준으로 변환
     * DB에 저장된 /uploads/xxx.jpg → http://localhost:3000/uploads/xxx.jpg
     */
    const getImageUrl = (fileUrl) => {
        if (!fileUrl) return "";
        if (fileUrl.startsWith("http")) return fileUrl;
        return `${EXPRESS_URL}${fileUrl}`;
    };

    /**
     * formatDateTime - DB 타임스탬프를 한국어 날짜/시간으로 변환
     */
    const formatDateTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

    // ── 렌더링 ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="feed-page insta-feed-page">
                <div className="feed-header">
                    <h1 className="feed-title">피드</h1>
                </div>
                <p style={{ textAlign: "center", color: "#6b7280" }}>로딩 중...</p>
            </div>
        );
    }

    if (!feedPosts || feedPosts.length === 0) {
        return (
            <div className="feed-page insta-feed-page">
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
        <>
            <div className="feed-page insta-feed-page">
                <div className="feed-header">
                    <h1 className="feed-title">피드</h1>
                    <p className="feed-subtitle">루틴 인증이 인스타그램처럼 쌓이는 공간이에요.</p>
                </div>

                <div className="insta-feed-list">
                    {feedPosts.map((post) => (
                        <article key={post.feed_id} className="insta-feed-card">
                            {/* 상단: 닉네임 + 루틴 제목 + 카테고리 */}
                            <div className="insta-feed-topline">
                                <div className="insta-feed-mainline">
                                    <span className="insta-feed-nickname">{post.nickname}</span>
                                    <span className="insta-feed-divider">•</span>
                                    <span className="insta-feed-routine-title">{post.routine_title}</span>
                                </div>
                                <span className="insta-feed-category">{post.category}</span>
                            </div>

                            {/* 인증 글 */}
                            <p className="insta-feed-proof-text">
                                {post.content || "오늘 루틴 인증 완료!"}
                            </p>

                            {/* 이미지/영상 (DB에서 가져온 images 배열) */}
                            {post.images?.length > 0 && (
                                <div
                                    className={
                                        post.images.length === 1
                                            ? "insta-feed-media-single"
                                            : "insta-feed-media-grid"
                                    }
                                >
                                    {post.images.map((image) => (
                                        <div key={image.image_id} className="insta-feed-media-item">
                                            {image.file_type?.startsWith("image/") ? (
                                                <img
                                                    src={getImageUrl(image.file_url)}
                                                    alt="루틴 인증 이미지"
                                                    className="insta-feed-media"
                                                />
                                            ) : (
                                                <video
                                                    src={getImageUrl(image.file_url)}
                                                    controls
                                                    className="insta-feed-media"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 좋아요 / 댓글 버튼 */}
                            <div className="insta-feed-action-row">
                                <button
                                    type="button"
                                    className={`insta-feed-action-btn insta-like-btn ${post.liked ? "liked" : ""}`}
                                    onClick={() => handleToggleLike(post.feed_id)}
                                >
                                    <span className="insta-feed-icon">{post.liked ? "♥" : "♡"}</span>
                                    <span>{post.like_count || 0}</span>
                                </button>

                                <button
                                    type="button"
                                    className="insta-feed-action-btn insta-comment-btn"
                                    onClick={() => openCommentModal(post.feed_id)}
                                >
                                    <span className="insta-feed-icon">💬</span>
                                    <span>{post.comment_count || 0}</span>
                                </button>
                            </div>

                            {/* 작성 시간 */}
                            <p className="insta-feed-time" style={{ fontSize: "12px", color: "#9ca3af", padding: "0 16px 12px" }}>
                                {formatDateTime(post.created_at)}
                            </p>
                        </article>
                    ))}
                </div>
            </div>

            {/* ── 댓글 모달 ── */}
            {selectedPost && (
                <div className="feed-modal-backdrop" onClick={closeCommentModal}>
                    <div className="feed-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="feed-modal-close"
                            onClick={closeCommentModal}
                        >
                            ×
                        </button>

                        {/* 왼쪽: 미디어 */}
                        <div className="feed-modal-left">
                            {selectedPost.images?.[0]?.file_type?.startsWith("image/") ? (
                                <img
                                    src={getImageUrl(selectedPost.images[0].file_url)}
                                    alt="루틴 인증 이미지"
                                    className="feed-modal-media"
                                />
                            ) : selectedPost.images?.[0] ? (
                                <video
                                    src={getImageUrl(selectedPost.images[0].file_url)}
                                    controls
                                    className="feed-modal-media"
                                />
                            ) : (
                                <div className="feed-modal-empty-media">
                                    등록된 사진 또는 영상이 없습니다.
                                </div>
                            )}
                        </div>

                        {/* 오른쪽: 게시물 정보 + 댓글 */}
                        <div className="feed-modal-right">
                            <div className="feed-modal-post-info">
                                <div className="feed-modal-meta-row">
                                    <span className="feed-modal-nickname">{selectedPost.nickname}</span>
                                    <span className="feed-modal-divider">•</span>
                                    <span className="feed-modal-routine">{selectedPost.routine_title}</span>
                                    <span className="feed-modal-category">{selectedPost.category}</span>
                                </div>

                                <p className="feed-modal-proof-text">
                                    {selectedPost.content || "오늘 루틴 인증 완료!"}
                                </p>

                                <p className="feed-modal-time">
                                    {formatDateTime(selectedPost.created_at)}
                                </p>
                            </div>

                            {/* 댓글 목록 */}
                            <div className="feed-modal-comments">
                                {(selectedPost.comments?.length ?? 0) === 0 ? (
                                    <p className="feed-modal-empty-comment">아직 댓글이 없습니다.</p>
                                ) : (
                                    selectedPost.comments.map((comment) => {
                                        const isMine = comment.user_id === currentUser?.user_id;

                                        return (
                                            <div key={comment.comment_id} className="feed-modal-comment-item">
                                                <div className="feed-modal-comment-top">
                                                    <p className="feed-modal-comment-inline">
                                                        <span className="feed-modal-comment-name">
                                                            {comment.nickname}
                                                        </span>{" "}
                                                        <span className="feed-modal-comment-text">
                                                            {comment.content}
                                                        </span>
                                                    </p>

                                                    {isMine && (
                                                        <button
                                                            type="button"
                                                            className="feed-modal-comment-delete"
                                                            onClick={() => handleDeleteComment(comment.comment_id)}
                                                        >
                                                            삭제
                                                        </button>
                                                    )}
                                                </div>

                                                <p className="feed-modal-comment-time">
                                                    {formatDateTime(comment.created_at)}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* 하단: 좋아요 + 댓글 입력 */}
                            <div className="feed-modal-bottom">
                                <button
                                    type="button"
                                    className={`insta-feed-action-btn insta-like-btn ${selectedPost.liked ? "liked" : ""}`}
                                    onClick={() => handleToggleLike(selectedPost.feed_id)}
                                >
                                    <span className="insta-feed-icon">
                                        {selectedPost.liked ? "♥" : "♡"}
                                    </span>
                                    <span>{selectedPost.like_count || 0}</span>
                                </button>

                                <form className="feed-modal-comment-form" onSubmit={handleCommentSubmit}>
                                    <input
                                        type="text"
                                        placeholder="댓글을 입력하세요"
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                    />
                                    <button type="submit">게시</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default FeedPage;
