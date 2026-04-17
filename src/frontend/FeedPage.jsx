import { useEffect, useState } from "react";

function FeedPage({
    feedPosts,
    onToggleLike,
    onAddComment,
    onDeleteComment,
    currentUserNickname,
}) {
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [commentInput, setCommentInput] = useState("");

    const selectedPost = feedPosts.find((post) => post.id === selectedPostId) ?? null;

    useEffect(() => {
        if (!selectedPost) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [selectedPost]);

    const openCommentModal = (postId) => {
        setSelectedPostId(postId);
        setCommentInput("");
    };

    const closeCommentModal = () => {
        setSelectedPostId(null);
        setCommentInput("");
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!selectedPost) return;

        onAddComment(selectedPost.id, commentInput);
        setCommentInput("");
    };

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
                        <article key={post.id} className="insta-feed-card">
                            <div className="insta-feed-topline">
                                <div className="insta-feed-mainline">
                                    <span className="insta-feed-nickname">{post.nickname}</span>
                                    <span className="insta-feed-divider">•</span>
                                    <span className="insta-feed-routine-title">{post.routineTitle}</span>
                                </div>
                                <span className="insta-feed-category">{post.category}</span>
                            </div>

                            <p className="insta-feed-proof-text">
                                {post.content || "오늘 루틴 인증 완료!"}
                            </p>

                            {post.files?.length > 0 && (
                                <div
                                    className={
                                        post.files.length === 1
                                            ? "insta-feed-media-single"
                                            : "insta-feed-media-grid"
                                    }
                                >
                                    {post.files.map((file, index) => (
                                        <div key={`${post.id}-${index}`} className="insta-feed-media-item">
                                            {file.type.startsWith("image/") ? (
                                                <img
                                                    src={file.url}
                                                    alt="루틴 인증 이미지"
                                                    className="insta-feed-media"
                                                />
                                            ) : (
                                                <video
                                                    src={file.url}
                                                    controls
                                                    className="insta-feed-media"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="insta-feed-action-row">
                                <button
                                    type="button"
                                    className={`insta-feed-action-btn insta-like-btn ${post.liked ? "liked" : ""}`}
                                    onClick={() => onToggleLike(post.id)}
                                >
                                    <span className="insta-feed-icon">{post.liked ? "♥" : "♡"}</span>
                                    <span>{post.likeCount}</span>
                                </button>

                                <button
                                    type="button"
                                    className="insta-feed-action-btn insta-comment-btn"
                                    onClick={() => openCommentModal(post.id)}
                                >
                                    <span className="insta-feed-icon">💬</span>
                                    <span>{post.commentCount}</span>
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

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

                        <div className="feed-modal-left">
                            {selectedPost.files?.[0]?.type?.startsWith("image/") ? (
                                <img
                                    src={selectedPost.files[0].url}
                                    alt="루틴 인증 이미지"
                                    className="feed-modal-media"
                                />
                            ) : selectedPost.files?.[0] ? (
                                <video
                                    src={selectedPost.files[0].url}
                                    controls
                                    className="feed-modal-media"
                                />
                            ) : (
                                <div className="feed-modal-empty-media">
                                    등록된 사진 또는 영상이 없습니다.
                                </div>
                            )}
                        </div>

                        <div className="feed-modal-right">
                            <div className="feed-modal-post-info">
                                <div className="feed-modal-meta-row">
                                    <span className="feed-modal-nickname">{selectedPost.nickname}</span>
                                    <span className="feed-modal-divider">•</span>
                                    <span className="feed-modal-routine">{selectedPost.routineTitle}</span>
                                    <span className="feed-modal-category">{selectedPost.category}</span>
                                </div>

                                <p className="feed-modal-proof-text">
                                    {selectedPost.content || "오늘 루틴 인증 완료!"}
                                </p>

                                <p className="feed-modal-time">
                                    {selectedPost.createdAt} {selectedPost.createdTime}
                                </p>
                            </div>

                            <div className="feed-modal-comments">
                                {(selectedPost.comments?.length ?? 0) === 0 ? (
                                    <p className="feed-modal-empty-comment">아직 댓글이 없습니다.</p>
                                ) : (
                                    selectedPost.comments.map((comment) => {
                                        const isMine = comment.nickname === currentUserNickname;

                                        return (
                                            <div key={comment.id} className="feed-modal-comment-item">
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
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        "이 댓글을 삭제하시겠습니까?"
                                                                    )
                                                                ) {
                                                                    onDeleteComment(
                                                                        selectedPost.id,
                                                                        comment.id
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            삭제
                                                        </button>
                                                    )}
                                                </div>

                                                <p className="feed-modal-comment-time">{comment.createdAt}</p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="feed-modal-bottom">
                                <button
                                    type="button"
                                    className={`insta-feed-action-btn insta-like-btn ${selectedPost.liked ? "liked" : ""}`}
                                    onClick={() => onToggleLike(selectedPost.id)}
                                >
                                    <span className="insta-feed-icon">
                                        {selectedPost.liked ? "♥" : "♡"}
                                    </span>
                                    <span>{selectedPost.likeCount}</span>
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
