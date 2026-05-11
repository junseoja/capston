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

import { useEffect, useState, useCallback, useRef } from "react";
import { EXPRESS_URL } from "./config";

// [수정 2026-05-03] 한 번에 가져올 페이지 크기 — FastAPI Query(limit) 와 동일한 의미
const PAGE_SIZE = 20;

function FeedPage({ currentUser }) {
  // 피드 목록 (DB에서 조회, 최신순) — 페이지가 로드될 때마다 누적
  const [feedPosts, setFeedPosts] = useState([]);

  // 첫 로딩 상태 (초기 화면용)
  const [loading, setLoading] = useState(true);

  // [수정 2026-05-03] 무한 스크롤용 — 다음 페이지 cursor / 추가 로딩 여부 / 더 이상 없음 플래그
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 댓글 모달: 선택된 피드 ID
  const [selectedPostId, setSelectedPostId] = useState(null);

  // 댓글 입력값
  const [commentInput, setCommentInput] = useState("");

  // 피드별 현재 보고 있는 미디어 인덱스
  const [currentMediaIndexes, setCurrentMediaIndexes] = useState({});

  // 현재 선택된 피드 객체
  const selectedPost =
    feedPosts.find((post) => post.feed_id === selectedPostId) ?? null;

  // ── 피드 목록 조회 ────────────────────────────────────────────────────────

  /**
   * fetchFeeds - Express GET /feed에서 한 페이지(PAGE_SIZE)만큼의 피드를 조회.
   *
   * [수정 2026-05-03]
   *   기존: 전체 피드를 한 번에 조회 + 각 피드별로 상세/좋아요 추가 호출 (N+1)
   *   현재: cursor 기반 페이지네이션 — Express 가 FastAPI 의 단일 JOIN 결과를 그대로 전달
   *
   * @param {string|null} cursor - 다음 페이지 cursor (null 이면 첫 페이지)
   * @param {boolean} reset      - true 면 기존 목록을 비우고 새로 시작
   */
  const fetchFeeds = useCallback(async (cursor = null, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`${EXPRESS_URL}/feed?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        const incoming = data.feeds || [];
        setFeedPosts((prev) => (reset ? incoming : [...prev, ...incoming]));
        setNextCursor(data.next_cursor || null);
        setHasMore(Boolean(data.next_cursor));
      }
    } catch (error) {
      console.error("피드 목록 조회 실패:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 컴포넌트 마운트 시 첫 페이지 로드
  useEffect(() => {
    fetchFeeds(null, true);
  }, [fetchFeeds]);

  // ── 무한 스크롤: IntersectionObserver 로 sentinel 이 보이면 다음 페이지 요청 ──
  // [수정 2026-05-03] sentinel 엘리먼트가 뷰포트에 진입하면 fetchFeeds(nextCursor) 호출.
  // useRef + callback ref 패턴으로 sentinel 을 매 렌더마다 새로 관찰하지 않도록 처리.
  const observerRef = useRef(null);
  // ────────────────────────────────────────────────────────────────────
  // [수정 2026-05-11] 프론트 누수 #3 — 댓글 모달 페치 경합 방지용 AbortController
  // ────────────────────────────────────────────────────────────────────
  // 오류 번호: 신규 #19 (프론트 누수 3종 중 #3)
  // 날짜: 2026-05-11
  // 기대효과:
  //   - 댓글 모달을 빠르게 다른 피드로 전환하거나 닫을 때
  //     이전 GET /comment/{feed_id} 응답이 늦게 도착해 다른 피드 댓글을
  //     덮어쓰는 race condition 차단
  //   - 페이지 이탈/언마운트 시 진행 중 fetch 강제 중단으로 setState-after-unmount 경고 제거
  // 장점:
  //   - useRef 기반이라 리렌더 트리거 없이 관리 가능
  //   - openCommentModal/closeCommentModal/언마운트 3개 경로에서 일관 처리
  //   - AbortController는 표준 API라 추가 의존성 0
  // ────────────────────────────────────────────────────────────────────
  const abortRef = useRef(null);
  const sentinelRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            hasMore &&
            !loadingMore &&
            nextCursor
          ) {
            fetchFeeds(nextCursor, false);
          }
        },
        { rootMargin: "200px" },
      );
      observerRef.current.observe(node);
    },
    [fetchFeeds, hasMore, loadingMore, nextCursor],
  );

  // ────────────────────────────────────────────────────────────────────
  // [수정 2026-05-11] 프론트 누수 #1 — IntersectionObserver 언마운트 정리
  // ────────────────────────────────────────────────────────────────────
  // 오류 번호: 신규 #19 (프론트 누수 3종 중 #1)
  // 날짜: 2026-05-11
  // 기대효과:
  //   - sentinelRef 콜백은 새 노드가 attach 될 때만 disconnect 하므로
  //     언마운트(라우팅 이동)로 노드가 사라지면 observer 가 그대로 살아남았다
  //   - 페이지 이동 후에도 callback 클로저가 fetchFeeds/setFeedPosts 를 잡고 있어
  //     장시간 SPA 사용 시 누적 누수가 발생함
  //   - 본 useEffect 가 cleanup 단계에서 강제 disconnect 하여 누수 차단
  // 장점:
  //   - sentinelRef 의 기존 동작을 변경하지 않으므로 회귀 위험 0
  //   - 함께 추가한 abortRef 도 같은 cleanup 에서 정리해 일관성 확보
  // ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

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

  /**
   * handleToggleLike - 좋아요 추가/취소 토글
   *
   * POST /like API를 호출하여 좋아요 상태를 토글.
   * 서버 응답(data.liked)을 기반으로 로컬 상태를 즉시 업데이트하여
   * 별도의 피드 재조회 없이 UI에 반영 (낙관적 업데이트).
   *
   * @param {string} feed_id - 좋아요를 토글할 피드의 UUID v7
   */
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
          }),
        );
      }
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
    }
  };

  // ── 댓글 모달 ─────────────────────────────────────────────────────────────

  /**
   * openCommentModal - 댓글 모달 열기
   * 선택된 피드 ID를 설정하고 댓글 입력 초기화.
   *
   * [수정 2026-05-03] 피드 목록 응답에서 comments 가 제거되었기 때문에
   * 모달이 열리는 시점에 GET /comment/{feed_id} 로 댓글을 별도 페치한다.
   * 이미 페치된 피드라면 다시 받아 최신 상태로 갱신.
   *
   * @param {string} feed_id - 댓글을 볼 피드의 UUID v7
   */
  const openCommentModal = async (feed_id) => {
    setSelectedPostId(feed_id);
    setCommentInput("");

    // [수정 2026-05-11 #19-3] 이전 페치가 있다면 중단 후 새 컨트롤러 발급
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${EXPRESS_URL}/comment/${feed_id}`, {
        credentials: "include",
        signal: controller.signal,
      });
      const data = await res.json();
      if (!data.success) return;

      // [수정 2026-05-11 #19-3] 응답 도착 사이에 다른 모달로 전환되었다면 무시
      if (abortRef.current !== controller) return;

      setFeedPosts((prev) =>
        prev.map((post) =>
          post.feed_id === feed_id
            ? { ...post, comments: data.comments || [] }
            : post,
        ),
      );
    } catch (error) {
      // [수정 2026-05-11 #19-3] AbortError 는 정상 흐름이므로 로그 제외
      if (error?.name === "AbortError") return;
      console.error("댓글 조회 실패:", error);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  /** closeCommentModal - 댓글 모달 닫기, 선택 상태 및 입력값 초기화 */
  const closeCommentModal = () => {
    // [수정 2026-05-11 #19-3] 모달 닫기 시 진행 중인 댓글 페치도 중단
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setSelectedPostId(null);
    setCommentInput("");
  };

  // ── 댓글 작성 ─────────────────────────────────────────────────────────────

  /**
   * handleCommentSubmit - 댓글 작성 폼 제출 핸들러
   *
   * POST /comment API를 호출하여 댓글을 DB에 저장.
   * 성공 시 서버 응답의 comment_id를 사용하여 로컬 상태에 즉시 추가 (재조회 없이 반영).
   * 현재 유저의 user_id와 nickname을 포함한 로컬 댓글 객체를 생성.
   *
   * @param {Event} e - form submit 이벤트 (preventDefault로 페이지 이동 방지)
   */
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
          }),
        );
        setCommentInput("");
      }
    } catch (error) {
      console.error("댓글 작성 실패:", error);
    }
  };

  // ── 댓글 삭제 ─────────────────────────────────────────────────────────────

  /**
   * handleDeleteComment - 댓글 삭제 핸들러
   *
   * confirm 확인 후 DELETE /comment/:comment_id API 호출.
   * 본인 댓글만 삭제 가능 (Express에서 세션의 user_id를 FastAPI에 전달하여 소유자 검증).
   * 성공 시 로컬 상태에서도 해당 댓글을 즉시 제거.
   *
   * @param {string} comment_id - 삭제할 댓글의 UUID v7
   */
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
              (c) => c.comment_id !== comment_id,
            );
            if (filtered.length === (post.comments || []).length) return post;
            return {
              ...post,
              comments: filtered,
              comment_count: Math.max(0, (post.comment_count || 0) - 1),
            };
          }),
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

  const getCurrentMediaIndex = (feedId, images = []) => {
    if (!images.length) return 0;

    const savedIndex = currentMediaIndexes[feedId] ?? 0;
    return Math.min(savedIndex, images.length - 1);
  };

  const handlePrevMedia = (feedId) => {
    setCurrentMediaIndexes((prev) => ({
      ...prev,
      [feedId]: Math.max((prev[feedId] ?? 0) - 1, 0),
    }));
  };

  const handleNextMedia = (feedId, imagesLength) => {
    setCurrentMediaIndexes((prev) => ({
      ...prev,
      [feedId]: Math.min((prev[feedId] ?? 0) + 1, imagesLength - 1),
    }));
  };

  const selectedPostMediaIndex = selectedPost
    ? getCurrentMediaIndex(selectedPost.feed_id, selectedPost.images)
    : 0;

  const selectedPostMedia =
    selectedPost?.images?.[selectedPostMediaIndex] ?? null;

  // ── 렌더링 ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="feed-page instagram-feed-page">
        <div className="feed-header">
          <h1 className="feed-title">피드</h1>
        </div>
        <p style={{ textAlign: "center", color: "#6b7280" }}>로딩 중...</p>
      </div>
    );
  }

  if (!feedPosts || feedPosts.length === 0) {
    return (
      <div className="feed-page instagram-feed-page">
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
      <div className="feed-page instagram-feed-page">
        <div className="feed-header">
          <h1 className="feed-title">피드</h1>
          <p className="feed-subtitle">
            루틴 인증이 인스타그램처럼 쌓이는 공간이에요.
          </p>
        </div>

        <div className="instagram-feed-list">
          {feedPosts.map((post) => {
            const currentMediaIndex = getCurrentMediaIndex(
              post.feed_id,
              post.images,
            );
            const currentMedia = post.images?.[currentMediaIndex] ?? null;

            return (
              <article key={post.feed_id} className="instagram-feed-card">
                {/* 상단: 닉네임 + 루틴 제목 + 카테고리 */}
                <div className="instagram-feed-top">
                  <div className="instagram-feed-info-row">
                    <span className="instagram-feed-author">
                      {post.nickname}
                    </span>
                    <span className="instagram-feed-divider">•</span>
                    <span className="instagram-feed-routine-title">
                      {post.routine_title}
                    </span>
                    {post.category && (
                      <span className="instagram-feed-info-badge">
                        {post.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* 이미지/영상: 현재 인덱스의 미디어 1개만 표시 */}
                {currentMedia && (
                  <div className="feed-media-carousel">
                    <div className="instagram-feed-media-box">
                      {currentMedia.file_type?.startsWith("image/") ? (
                        <img
                          src={getImageUrl(currentMedia.file_url)}
                          alt="루틴 인증 이미지"
                          className="instagram-feed-media"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <video
                          src={getImageUrl(currentMedia.file_url)}
                          controls
                          preload="metadata"
                          className="instagram-feed-media"
                        />
                      )}

                      {post.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="feed-media-nav left"
                            onClick={() => handlePrevMedia(post.feed_id)}
                            disabled={currentMediaIndex === 0}
                            aria-label="이전 사진 또는 영상"
                          >
                            ‹
                          </button>

                          <button
                            type="button"
                            className="feed-media-nav right"
                            onClick={() =>
                              handleNextMedia(post.feed_id, post.images.length)
                            }
                            disabled={
                              currentMediaIndex === post.images.length - 1
                            }
                            aria-label="다음 사진 또는 영상"
                          >
                            ›
                          </button>

                          <div className="feed-media-indicator">
                            {currentMediaIndex + 1} / {post.images.length}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="instagram-feed-body">
                  {/* 인증 글 */}
                  <p className="instagram-feed-caption">
                    {post.content || "오늘 루틴 인증 완료!"}
                  </p>

                  {/* 좋아요 / 댓글 버튼 */}
                  <div className="instagram-feed-action-row">
                    <button
                      type="button"
                      className={`instagram-feed-action-btn instagram-feed-like-btn ${post.liked ? "liked" : ""}`}
                      onClick={() => handleToggleLike(post.feed_id)}
                    >
                      <span className="instagram-feed-icon">
                        {post.liked ? "♥" : "♡"}
                      </span>
                      <span>{post.like_count || 0}</span>
                    </button>

                    <button
                      type="button"
                      className="instagram-feed-action-btn instagram-feed-comment-btn"
                      onClick={() => openCommentModal(post.feed_id)}
                    >
                      <span className="instagram-feed-icon">💬</span>
                      <span>{post.comment_count || 0}</span>
                    </button>
                  </div>

                  {/* 작성 시간 */}
                  <p className="instagram-feed-info-time">
                    {formatDateTime(post.created_at)}
                  </p>
                </div>
              </article>
            );
          })}

          {/* [수정 2026-05-03] 무한 스크롤 sentinel — 보이면 다음 페이지 로드 */}
          {hasMore && (
            <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
          )}

          {loadingMore && (
            <p
              style={{ textAlign: "center", color: "#6b7280", padding: "12px" }}
            >
              더 불러오는 중...
            </p>
          )}

          {!hasMore && feedPosts.length > 0 && (
            <p
              style={{ textAlign: "center", color: "#9ca3af", padding: "12px" }}
            >
              마지막 게시물까지 모두 봤어요.
            </p>
          )}
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
              {selectedPostMedia ? (
                <div className="feed-media-carousel">
                  {selectedPostMedia.file_type?.startsWith("image/") ? (
                    <img
                      src={getImageUrl(selectedPostMedia.file_url)}
                      alt="루틴 인증 이미지"
                      className="feed-modal-media"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <video
                      src={getImageUrl(selectedPostMedia.file_url)}
                      controls
                      preload="metadata"
                      className="feed-modal-media"
                    />
                  )}

                  {(selectedPost.images?.length ?? 0) > 1 && (
                    <>
                      <button
                        type="button"
                        className="feed-media-nav left"
                        onClick={() => handlePrevMedia(selectedPost.feed_id)}
                        disabled={selectedPostMediaIndex === 0}
                        aria-label="이전 사진 또는 영상"
                      >
                        ‹
                      </button>

                      <button
                        type="button"
                        className="feed-media-nav right"
                        onClick={() =>
                          handleNextMedia(
                            selectedPost.feed_id,
                            selectedPost.images.length,
                          )
                        }
                        disabled={
                          selectedPostMediaIndex ===
                          selectedPost.images.length - 1
                        }
                        aria-label="다음 사진 또는 영상"
                      >
                        ›
                      </button>

                      <div className="feed-media-indicator modal">
                        {selectedPostMediaIndex + 1} /{" "}
                        {selectedPost.images.length}
                      </div>
                    </>
                  )}
                </div>
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
                  <span className="feed-modal-nickname">
                    {selectedPost.nickname}
                  </span>
                  <span className="feed-modal-divider">•</span>
                  <span className="feed-modal-routine">
                    {selectedPost.routine_title}
                  </span>
                  <span className="feed-modal-category">
                    {selectedPost.category}
                  </span>
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
                  <p className="feed-modal-empty-comment">
                    아직 댓글이 없습니다.
                  </p>
                ) : (
                  selectedPost.comments.map((comment) => {
                    const isMine = comment.user_id === currentUser?.user_id;

                    return (
                      <div
                        key={comment.comment_id}
                        className="feed-modal-comment-item"
                      >
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
                              onClick={() =>
                                handleDeleteComment(comment.comment_id)
                              }
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
                  className={`instagram-feed-action-btn instagram-feed-like-btn ${selectedPost.liked ? "liked" : ""}`}
                  onClick={() => handleToggleLike(selectedPost.feed_id)}
                >
                  <span className="instagram-feed-icon">
                    {selectedPost.liked ? "♥" : "♡"}
                  </span>
                  <span>{selectedPost.like_count || 0}</span>
                </button>

                <form
                  className="feed-modal-comment-form"
                  onSubmit={handleCommentSubmit}
                >
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
