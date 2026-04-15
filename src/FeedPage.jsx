// ============================================================
// FeedPage.jsx - 피드 페이지 컴포넌트
// ============================================================
// 역할:
//   - 상세 루틴 인증 시 "피드에도 업로드하기"를 체크한 게시물을 카드 형태로 표시
//   - 인스타그램 스타일의 피드 레이아웃 (닉네임, 루틴 제목, 카테고리, 인증 글, 미디어)
//   - 좋아요 토글 (App.jsx의 toggleFeedLike 함수 연결)
//   - 댓글 버튼은 UI만 표시 (disabled - 추후 구현 예정)
//
// Props:
//   feedPosts   - App.jsx에서 관리하는 피드 게시물 배열
//                 각 항목: { id, routineId, nickname, routineTitle, category,
//                            content, files, liked, likeCount, commentCount,
//                            createdAt, createdTime }
//   onToggleLike - 좋아요 토글 함수 (App.jsx의 toggleFeedLike)
//
// 데이터 흐름:
//   HomePage(인증 완료 + 피드 업로드 체크) → App.jsx(feedPosts 상태 추가)
//   → FeedPage(props로 전달받아 표시)
//
// NOTE:
//   - 현재 feedPosts는 메모리(React state)에만 존재 → 새로고침 시 초기화
//   - 추후 FastAPI GET /feed API를 직접 호출하여 DB 데이터를 표시하도록 전환 예정
//   - useState, useEffect import는 현재 미사용 → 추후 API 연결 시 활용
// ============================================================

// 현재 이 컴포넌트는 App.jsx에서 feedPosts를 props로 받아 렌더링만 수행
// 추후 직접 API 호출 시 아래 import 추가:
// import { useState, useEffect } from "react";

function FeedPage({ feedPosts, onToggleLike }) {
    // ── 게시물이 없을 때 안내 화면 ─────────────────────────────────────────
    // feedPosts가 undefined이거나 빈 배열인 경우 처리
    if (!feedPosts || feedPosts.length === 0) {
        return (
            <div className="feed-page insta-feed-page">
                <div className="feed-header">
                    <h1 className="feed-title">피드</h1>
                    <p className="feed-subtitle">
                        상세 루틴 인증에서 피드 업로드를 체크하면 여기에 게시물이 올라와요.
                    </p>
                </div>

                {/* 빈 상태 안내 카드 */}
                <div className="feed-empty-card">
                    <p className="feed-empty-title">아직 업로드된 게시물이 없어요.</p>
                    <p className="feed-empty-text">
                        홈에서 상세 루틴을 인증하고 피드 업로드를 체크해보세요.
                    </p>
                </div>
            </div>
        );
    }

    // ── 게시물 목록 표시 ───────────────────────────────────────────────────
    return (
        <div className="feed-page insta-feed-page">
            <div className="feed-header">
                <h1 className="feed-title">피드</h1>
                <p className="feed-subtitle">
                    루틴 인증이 인스타그램처럼 쌓이는 공간이에요.
                </p>
            </div>

            {/* 피드 카드 목록 (최신 게시물이 맨 위 - App.jsx에서 unshift 방식으로 추가) */}
            <div className="insta-feed-list">
                {feedPosts.map((post) => (
                    // article: 독립적인 콘텐츠 단위로 시맨틱 마크업
                    <article key={post.id} className="insta-feed-card">

                        {/* ── 카드 상단: 닉네임 · 루틴 제목 · 카테고리 ── */}
                        <div className="insta-feed-topline">
                            <div className="insta-feed-mainline">
                                {/* 게시자 닉네임 */}
                                <span className="insta-feed-nickname">{post.nickname}</span>
                                {/* 구분점 */}
                                <span className="insta-feed-divider">•</span>
                                {/* 인증한 루틴 제목 */}
                                <span className="insta-feed-routine-title">{post.routineTitle}</span>
                            </div>
                            {/* 루틴 카테고리 배지 (예: "운동", "공부") */}
                            <span className="insta-feed-category">{post.category}</span>
                        </div>

                        {/* ── 인증 글 ── */}
                        {/* content가 없을 때 기본 문구 표시 */}
                        <p className="insta-feed-proof-text">
                            {post.content || "오늘 루틴 인증 완료!"}
                        </p>

                        {/* ── 미디어 영역 (이미지 / 영상) ── */}
                        {/* files 배열이 있고 1개 이상일 때만 렌더링 */}
                        {post.files?.length > 0 && (
                            <div
                                className={
                                    // 파일 1개: 단일 이미지 레이아웃 / 2개 이상: 그리드 레이아웃
                                    post.files.length === 1
                                        ? "insta-feed-media-single"
                                        : "insta-feed-media-grid"
                                }
                            >
                                {post.files.map((file, index) => (
                                    <div
                                        // key: post.id + index 조합으로 고유성 보장
                                        key={`${post.id}-${index}`}
                                        className="insta-feed-media-item"
                                    >
                                        {/* MIME 타입으로 이미지/영상 구분하여 적절한 태그 사용 */}
                                        {file.type.startsWith("image/") ? (
                                            <img
                                                src={file.url}
                                                alt="루틴 인증 이미지"
                                                className="insta-feed-media"
                                            />
                                        ) : (
                                            // 영상: controls 속성으로 재생 버튼 표시
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

                        {/* ── 액션 버튼 영역 (좋아요, 댓글) ── */}
                        <div className="insta-feed-action-row">
                            {/* 좋아요 버튼: liked 상태에 따라 "♥"/"♡" 아이콘 변경 */}
                            <button
                                type="button"
                                className={`insta-feed-action-btn insta-like-btn ${post.liked ? "liked" : ""}`}
                                onClick={() => onToggleLike(post.id)} // App.jsx의 toggleFeedLike 호출
                            >
                                <span className="insta-feed-icon">
                                    {post.liked ? "♥" : "♡"}
                                </span>
                                {/* 좋아요 수 표시 */}
                                <span>{post.likeCount}</span>
                            </button>

                            {/* 댓글 버튼: 현재 disabled (추후 댓글 UI 구현 시 활성화)
                                commentCount는 항상 0 (메모리 관리 중이므로) */}
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
