// ============================================================
// FeedPage.jsx - 피드 페이지 컴포넌트
// ============================================================
// 역할:
//   - DB에서 루틴 인증 피드와 챌린지 인증 피드를 최신순으로 통합 조회하여 표시
//   - 인스타그램 스타일 카드 UI (닉네임, 루틴 제목, 인증 글, 사진/영상)
//   - 좋아요 토글 (POST /like API 연결)
//   - 댓글 모달 (작성: POST /comment, 삭제: DELETE /comment)
//   - 일반 피드 신고 접수 (POST /report)
//   - 피드/챌린지 미디어는 S3 URL을 그대로 사용하며, 과거 /uploads 경로도 호환 처리
//
// Props:
//   currentUser - 현재 로그인한 유저 정보 ({ user_id, nickname, ... })
// ============================================================

// ────────────────────────────────────────────────────────────────────
// 현재 GET /feed 응답은 FastAPI feed.py에서 routine feeds + challenge proofs를
// created_at DESC 기준으로 합친 결과다. 따라서 프론트는 별도 mock 병합 없이
// source_type 메타만 보고 신고/댓글/좋아요 가능 여부를 구분한다.
import { useEffect, useState, useCallback, useRef } from "react";
import { EXPRESS_URL } from "./config";

// [수정 2026-05-03] 한 번에 가져올 페이지 크기 — FastAPI Query(limit) 와 동일한 의미
const PAGE_SIZE = 20;

// onReportPost는 App.jsx가 Express /report로 연결한다.
// Challenge 인증 게시물은 source_type === "challenge"로 내려오므로 신고 메뉴를 숨긴다.
function FeedPage({ currentUser, onReportPost }) {
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

  // [추가] 인스타그램식 더보기 드롭다운 토글을 위한 상태 (메뉴가 열릴 피드 ID 혹은 "modal" 문자열 저장)
  const [showMenuId, setShowMenuId] = useState(null);

  // [추가 2026-05-13 / frontend 머지 Stage 2-5] 신고 모달 상태 3종
  // 출처: origin/frontend FeedPage
  // 사유: 기존 window.prompt 신고를 카테고리+상세 사유 모달로 고도화하기 위한 상태.
  // 기대효과: 사용자가 분류 선택 → 상세 입력 → 신고하기 → onReportPost 호출.
  const [reportModalPost, setReportModalPost] = useState(null);
  const [reportCategory, setReportCategory] = useState("");
  const [reportDetail, setReportDetail] = useState("");

  // ────────────────────────────────────────────────────────────────────
  // [수정 2026-05-20] mergedFeedPosts 단순화
  // ────────────────────────────────────────────────────────────────────
  // 기대효과:
  //   - 백엔드가 routine+challenge 를 미리 시간순 머지해 반환하므로
  //     프론트에서 별도 정렬·머지 불필요 → 그대로 feedPosts 참조
  // 장점:
  //   - 정렬 비용 제거 + 의존성 추적 단순화
  // ────────────────────────────────────────────────────────────────────
  const mergedFeedPosts = feedPosts;

  const selectedPost =
    mergedFeedPosts.find((post) => post.feed_id === selectedPostId) ?? null;

  // ── 피드 목록 조회 ────────────────────────────────────────────────────────

  /**
   * fetchFeeds - Express GET /feed에서 한 페이지(PAGE_SIZE)만큼의 피드를 조회.
   *
   * [수정 2026-05-03]
   *    기존: 전체 피드를 한 번에 조회 + 각 피드별로 상세/좋아요 추가 호출 (N+1)
   *    현재: cursor 기반 페이지네이션 — Express 가 FastAPI 의 단일 JOIN 결과를 그대로 전달
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

  // ── 게시물 신고 ───────────────────────────────────────────────────────────
  /**
   * [추가 2026-05-12 / frontend 머지 2/7]
   * 출처: origin/frontend commit c261988
   * 사유: 사용자가 부적절 게시물을 신고 → 관리자 페이지 신고 목록에 누적되도록 함.
   * 기대효과: window.prompt 로 사유 입력 후 상위 onReportPost(post, reason) 콜백 호출.
   *           App.jsx 의 reports 상태에 누적되어 AdminPage 에 표시됨.
   * 장점: 신고 UI 와 데이터 관리를 분리 → FeedPage 는 UI 만 담당, App 이 단일 신고 데이터 저장소.
   *         백엔드 API 가 아직 없어도 프론트만으로 신고 흐름 시연 가능.
   *         (백엔드 신고 API 가 추가되면 onReportPost 안에서 fetch 만 호출하면 됨)
   */
  // [수정 2026-05-13 / frontend 머지 Stage 2-5]
  // 출처: origin/frontend FeedPage (commit 98693c1 등)
  // 사유: 기존 window.prompt 단일 입력 → 카테고리 드롭다운 + 상세 사유 분리한 신고 모달로 UX 개선.
  // 기대효과:
  //   - 신고 분류(부적절한 홍보/욕설/도용/스팸/기타 등) 통계화 가능.
  //   - 상세 사유 별도 입력으로 분류 통일성 + 자유 서술 동시 확보.
  // 장점: dev 의 onReportPost 콜백 시그니처 변경 없음 (combinedReason 으로 묶어 전달).
  const handleReportClick = (post) => {
    if (typeof onReportPost !== "function") {
      alert("신고 기능이 아직 초기화되지 않았습니다.");
      return;
    }
    // 모달을 띄움 — 실제 신고 전송은 handleFinalReport 가 담당.
    setReportModalPost(post);
    setShowMenuId(null); // 모달 오픈 시 열려있던 드롭다운 닫기
  };

  // 모달의 "신고하기" 버튼 → 카테고리 + 상세 사유 결합 → 상위 onReportPost 호출.
  const handleFinalReport = () => {
    if (!reportCategory) {
      alert("신고 분류를 선택해주세요.");
      return;
    }
    const combinedReason = `[${reportCategory}] ${reportDetail.trim() || "(상세 사유 미입력)"}`;
    onReportPost(reportModalPost, combinedReason);
    alert("신고가 접수되었습니다. 관리자가 검토 후 처리합니다.");
    setReportModalPost(null);
    setReportCategory("");
    setReportDetail("");
    setShowMenuId(null);
  };

  // ── 유틸리티 ──────────────────────────────────────────────────────────────

  /**
   * getImageUrl - 이미지 URL을 Express 서버 기준으로 변환
   * 미디어 URL 정규화.
   * - 현재 S3 URL(https://...)은 그대로 사용
   * - 과거 DB에 남은 /uploads/xxx.jpg는 Express 기준 절대 URL로 보정
   * - blob: URL은 로컬 미리보기/과거 mock 호환을 위해 그대로 사용
   */
  const getImageUrl = (fileUrl) => {
    if (!fileUrl) return "";
    // S3 절대 URL과 브라우저 blob 미리보기 URL은 그대로 렌더링한다.
    // "/uploads/..." 형태의 과거 레코드만 Express origin을 붙여 보정한다.
    if (fileUrl.startsWith("http") || fileUrl.startsWith("blob:")) return fileUrl;
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

  // 루틴 피드와 챌린지 인증 피드가 모두 없는 경우에만 빈 상태를 표시한다.
  if (!mergedFeedPosts || mergedFeedPosts.length === 0) {
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
          {/* FastAPI가 병합해 준 루틴/챌린지 통합 피드 목록 */}
          {mergedFeedPosts.map((post) => {
            // source_type 메타로 챌린지 인증 게시물을 구분한다.
            // 현재 챌린지 게시물은 일반 피드 신고/좋아요/댓글 흐름에서 제외한다.
            const isChallengePost = post.source_type === "challenge";
            const currentMediaIndex = getCurrentMediaIndex(
              post.feed_id,
              post.images,
            );
            const currentMedia = post.images?.[currentMediaIndex] ?? null;

            return (
              <article key={post.feed_id} className="instagram-feed-card" style={{ position: "relative", overflow: "visible" }}>
                {/* 상단: 닉네임 + 루틴 제목 + 카테고리 + (수정) 인스타식 ... 버튼 및 드롭다운 */}
                <div className="instagram-feed-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                    {/* 챌린지 인증 배지 */}
                    {isChallengePost && (
                      <span className="instagram-feed-info-badge">
                        챌린지 인증
                      </span>
                    )}
                  </div>

                  {/* 챌린지 인증 게시물과 내 게시물에는 신고 메뉴를 노출하지 않는다. */}
                  {!isChallengePost && post.user_id !== currentUser?.user_id && (
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => setShowMenuId(showMenuId === post.feed_id ? null : post.feed_id)}
                        style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer", color: "#262626", padding: "0 4px" }}
                        aria-label="더보기 메뉴 열기"
                      >
                        ⋮
                      </button>

                      {showMenuId === post.feed_id && (
                        <div style={{ position: "absolute", top: "25px", right: "0", background: "white", border: "1px solid #dbdbdb", borderRadius: "8px", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", zIndex: 100 }}>
                          <button
                            type="button"
                            onClick={() => handleReportClick(post)}
                            style={{ border: "none", background: "none", color: "#ed4956", padding: "12px 20px", fontSize: "14px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            신고하기
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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

                  {/* 좋아요/댓글은 현재 루틴 피드 전용 API라 챌린지 항목에서는 비활성화한다. */}
                  <div className="instagram-feed-action-row">
                    <button
                      type="button"
                      className={`instagram-feed-action-btn instagram-feed-like-btn ${post.liked ? "liked" : ""}`}
                      onClick={() => handleToggleLike(post.feed_id)}
                      disabled={isChallengePost}
                      title={
                        isChallengePost
                          ? "챌린지 인증 게시물의 좋아요 기능은 추후 연동 예정입니다."
                          : undefined
                      }
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
                      disabled={isChallengePost}
                      title={
                        isChallengePost
                          ? "챌린지 인증 게시물의 댓글 기능은 추후 연동 예정입니다."
                          : undefined
                      }
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

          {/* 통합 피드 목록을 끝까지 본 상태 */}
          {!hasMore && mergedFeedPosts.length > 0 && (
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
                <div className="feed-modal-meta-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", overflow: "visible" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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

                  {/* [수정형 상세 모달 내 인스타식 더보기 드롭다운 적용]
                      [수정 2026-05-20] 챌린지 게시물 모달에서도 신고 메뉴 비노출
                      기대효과: 카드와 모달의 신고 가시성 정책을 일치시켜 일관된 UX 제공
                      장점: source_type 메타 한 가지로 두 진입점을 같은 규칙으로 제어 */}
                  {selectedPost.source_type !== "challenge" &&
                    selectedPost.user_id !== currentUser?.user_id && (
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => setShowMenuId(showMenuId === "modal" ? null : "modal")}
                        style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer", color: "#262626", padding: "0 4px" }}
                        aria-label="더보기 메뉴 열기"
                      >
                        ⋮
                      </button>

                      {showMenuId === "modal" && (
                        <div style={{ position: "absolute", top: "25px", right: "0", background: "white", border: "1px solid #dbdbdb", borderRadius: "8px", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", zIndex: 100 }}>
                          <button
                            type="button"
                            onClick={() => handleReportClick(selectedPost)}
                            style={{ border: "none", background: "none", color: "#ed4956", padding: "12px 20px", fontSize: "14px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            신고하기
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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

      {/* ── [추가 2026-05-13 / frontend 머지 Stage 2-5] 신고 모달 ──
          출처: origin/frontend FeedPage (commit 98693c1)
          사유: 기존 window.prompt 단일 입력을 카테고리 + 상세 사유로 분리한 모달로 교체.
          기대효과: 분류된 신고 데이터 누적 → AdminPage 통계화 가능.
          장점: dev 의 onReportPost 콜백 시그니처(post, reason) 그대로 유지 — combinedReason 으로 묶어 전달. */}
      {reportModalPost && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 2200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => {
            setReportModalPost(null);
            setReportCategory("");
            setReportDetail("");
            setShowMenuId(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "16px",
              width: "90%",
              maxWidth: "440px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ margin: "0 0 18px", fontSize: "18px", fontWeight: 900, color: "#111" }}>
              게시물 신고
            </h3>
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#6b7280", fontWeight: 700 }}>
              신고 분류 *
            </p>
            <select
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
                marginBottom: "16px",
                background: "white",
              }}
            >
              <option value="">분류를 선택하세요</option>
              <option value="부적절한 홍보">부적절한 홍보</option>
              <option value="욕설/비방">욕설/비방</option>
              <option value="도용/저작권">도용/저작권</option>
              <option value="스팸/도배">스팸/도배</option>
              <option value="음란/혐오">음란/혐오</option>
              <option value="기타">기타</option>
            </select>

            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#6b7280", fontWeight: 700 }}>
              상세 사유
            </p>
            <textarea
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              placeholder="구체적인 신고 사유를 입력해주세요 (선택)"
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
                resize: "none",
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => {
                  setReportModalPost(null);
                  setReportCategory("");
                  setReportDetail("");
                  setShowMenuId(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  background: "white",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleFinalReport}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                신고하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FeedPage;
