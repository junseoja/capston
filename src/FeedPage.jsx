import { useState, useEffect } from "react"; // ✅ 추가

function FeedPage() { // ✅ props 제거
    const [feedPosts, setFeedPosts] = useState([]); // ✅ 추가 - 나중에 백엔드 연결

    // ✅ 추가 - 나중에 백엔드 연결할 자리
    // useEffect(() => {
    //     fetchFeedPosts();
    // }, []);

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
                <p className="feed-subtitle">
                    루틴 인증이 인스타그램처럼 카드 형태로 쌓이는 공간이에요.
                </p>
            </div>
            <div className="instagram-feed-list">
                {feedPosts.map((post) => (
                    <article key={post.id} className="instagram-feed-card">
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
                        {post.files?.length > 0 && (
                            <div className="instagram-feed-media-box">
                                {post.files[0].type.startsWith("image/") ? (
                                    <img src={post.files[0].url} alt="루틴 인증 이미지" className="instagram-feed-media" />
                                ) : (
                                    <video src={post.files[0].url} controls className="instagram-feed-media" />
                                )}
                            </div>
                        )}
                        <div className="instagram-feed-body">
                            <p className="instagram-feed-caption">{post.content || "오늘 루틴 인증 완료!"}</p>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default FeedPage;