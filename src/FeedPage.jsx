// 피드 페이지 컴포넌트
// - 상세 루틴 인증 시 "피드에도 업로드하기"를 체크한 게시물을 카드 형태로 표시
// - 현재는 App.jsx의 feedPosts 상태(메모리)를 props로 받아 표시
// - 새로고침 시 데이터 소멸 → 추후 백엔드 연결 예정

import { useState, useEffect } from "react";

// props:
//   feedPosts - App.jsx에서 관리하는 피드 게시물 배열
//               각 항목: { id, routineId, routineTitle, routineDescription,
//                          category, content, files, createdAt, createdTime }
function FeedPage({ feedPosts, onToggleLike }) {
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
        <div className="feed-page insta-feed-page">
            <div className="feed-header">
                <h1 className="feed-title">피드</h1>
                <p className="feed-subtitle">
                    루틴 인증이 인스타그램처럼 쌓이는 공간이에요.
                </p>
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
                                    <div
                                        key={`${post.id}-${index}`}
                                        className="insta-feed-media-item"
                                    >
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
                                <span className="insta-feed-icon">
                                    {post.liked ? "♥" : "♡"}
                                </span>
                                <span>{post.likeCount}</span>
                            </button>

                            <button
                                type="button"
                                className="insta-feed-action-btn insta-comment-btn"
                                disabled
                            >
                                <span className="insta-feed-icon">💬</span>
                                <span>{post.commentCount}</span>
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default FeedPage;

