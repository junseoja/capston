// 피드 페이지 컴포넌트
// - 상세 루틴 인증 시 "피드에도 업로드하기"를 체크한 게시물을 카드 형태로 표시
// - 현재는 App.jsx의 feedPosts 상태(메모리)를 props로 받아 표시
// - 새로고침 시 데이터 소멸 → 추후 백엔드 연결 예정

import { useState, useEffect } from "react";

// props:
//   feedPosts - App.jsx에서 관리하는 피드 게시물 배열
//               각 항목: { id, routineId, routineTitle, routineDescription,
//                          category, content, files, createdAt, createdTime }
function FeedPage({ feedPosts }) {
    // 피드 게시물이 없을 때 안내 화면
    if (!feedPosts || feedPosts.length === 0) {
        return (
            <div className="feed-page">
                <div className="feed-header">
                    <h1 className="feed-title">피드</h1>
                    <p className="feed-subtitle">
                        상세 루틴 인증에서 피드 업로드를 체크하면 여기에 게시물이 올라와요.
                    </p>
                </div>
                {/* 빈 피드 안내 카드 */}
                <div className="feed-empty-card">
                    <p className="feed-empty-title">아직 업로드된 게시물이 없어요.</p>
                    <p className="feed-empty-text">
                        홈에서 상세 루틴을 인증하고 피드 업로드를 체크해보세요.
                    </p>
                </div>
            </div>
        );
    }

    // 게시물이 있을 때 인스타그램 스타일 카드 목록 표시
    return (
        <div className="feed-page instagram-feed-page">
            <div className="feed-header">
                <h1 className="feed-title">피드</h1>
                <p className="feed-subtitle">
                    루틴 인증이 인스타그램처럼 카드 형태로 쌓이는 공간이에요.
                </p>
            </div>

            {/* 피드 카드 목록 */}
            <div className="instagram-feed-list">
                {feedPosts.map((post) => (
                    <article key={post.id} className="instagram-feed-card">
                        {/* 카드 상단: 루틴 제목, 설명, 카테고리 배지, 인증 시간 */}
                        <div className="instagram-feed-top">
                            <h3 className="instagram-feed-routine-title">{post.routineTitle}</h3>
                            <p className="instagram-feed-routine-description">{post.routineDescription}</p>
                            <div className="instagram-feed-info-row">
                                <span className="instagram-feed-info-badge">{post.category}</span>
                                <span className="instagram-feed-info-time">
                                    인증 시간 {post.createdAt} {post.createdTime}
                                </span>
                            </div>
                        </div>

                        {/* 첨부 파일: 첫 번째 파일만 대표 이미지/영상으로 표시 */}
                        {post.files?.length > 0 && (
                            <div className="instagram-feed-media-box">
                                {post.files[0].type.startsWith("image/") ? (
                                    <img
                                        src={post.files[0].url}
                                        alt="루틴 인증 이미지"
                                        className="instagram-feed-media"
                                    />
                                ) : (
                                    <video
                                        src={post.files[0].url}
                                        controls
                                        className="instagram-feed-media"
                                    />
                                )}
                            </div>
                        )}

                        {/* 카드 하단: 인증 글 (없으면 기본 문구 표시) */}
                        <div className="instagram-feed-body">
                            <p className="instagram-feed-caption">
                                {post.content || "오늘 루틴 인증 완료!"}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default FeedPage;
