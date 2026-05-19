// ============================================================
// MyPage.jsx - 마이페이지 컴포넌트
// ============================================================
// 역할:
//   - 로그인한 유저의 닉네임, 프로필 아바타 표시
//   - 오늘의 갓생 지수(통합 달성률) 차트
//   - 핵심 지표: 총 루틴 수 / 연속 달성 / 인증 게시글 수
//   - 내 인증 갤러리 (피드 이미지 모음)
//   - "상세 분석" 버튼 → /stats 페이지 이동
//
// 데이터 fetch 구조:
//   GET /mypage               → 유저 정보 + 오늘 달성률 + 갤러리 통합 조회
//
// 디자인 기준:
//   2026-05-02 frontend 브랜치 UI 통합 (갓생 지수 + 갤러리 추가)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { EXPRESS_URL } from "./config";

function MyPage() {
    const navigate = useNavigate();

    // 로그인한 유저 정보 (GET /me 응답)
    const [user, setUser] = useState(null);

    // [추가 2026-05-10] 마이페이지 실제 요약 지표.
    // 이유: 기존 mock 달성률/연속 달성/인증 게시글 수를 DB 기반 API 응답으로 대체.
    const [summary, setSummary] = useState(null);

    // [추가 2026-05-10] 내 인증 갤러리 실제 항목.
    // 이유: Unsplash placeholder 대신 feeds/feed_images 에 저장된 실제 업로드 파일 표시.
    const [galleryItems, setGalleryItems] = useState([]);

    // 데이터 로딩 중 여부
    const [loading, setLoading] = useState(true);

    // [추가 2026-05-12 / frontend 머지 4/7]
    // 출처: origin/frontend commits a2c8b03/ba6ac25 "마이페이지 갤러리 클릭 시 상세 게시글 모달 연동"
    //           832d3bf "반응형 1차, 마이페이지 피드 삭제 관리"
    // 사유: 갤러리 클릭 시 큰 이미지 모달 + 편집 모드(다중 선택 삭제) 신기능 통합.
    // 기대효과:
    //   1) 갤러리 썸네일 클릭 → 같은 페이지에서 큰 이미지 확인 (피드로 이탈 안 함)
    //   2) "관리" 토글 → 다중 선택 → "선택 삭제" → DELETE /feed/:feed_id 일괄 호출 → 갤러리 갱신
    // 장점:
    //   - selectedItem 은 클릭한 한 갤러리 항목만 보관 → 메모리 효율↑
    //   - selectedFeedIds 는 feed_id 단위로 누적 → 한 게시물의 여러 이미지가 같은 feed_id 면
    //     중복 선택돼도 한 번만 삭제 호출됨 (Set 변환)
    //   - dev 기존 백엔드 응답(galleryItems 의 feed_id/image_id) 그대로 활용
    const [selectedItem, setSelectedItem] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedFeedIds, setSelectedFeedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);

    // ── [추가] 인스타그램형 프로필 편집 상태 관리 ─────────────────────────────────────
    const [isProfileEdit, setIsProfileEdit] = useState(false);
    const [editNickname, setEditNickname] = useState("");
    const [editBio, setEditBio] = useState("오늘도 나만의 루틴으로 채워가는 하루 ✨");
    const [previewAvatar, setPreviewAvatar] = useState(null); // 프리뷰 아바타 이미지 주소
    const fileInputRef = useRef(null); // 파일 탐색기 트리거용 Ref

    useEffect(() => {
        fetchMyInfo();
    }, []);

    const fetchMyInfo = async () => {
        try {
            // [수정 2026-05-10] 마이페이지 통합 API 사용.
            // 이유: /me + /mypage/summary + /mypage/gallery 3회 호출을 1회 호출로 줄여
            // React → Express → FastAPI 왕복 비용과 로딩 조각을 줄이기 위함.
            const res = await fetch(`${EXPRESS_URL}/mypage?gallery_limit=9`, {
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setUser(data.user);
                setSummary(data.summary);
                setGalleryItems(data.gallery || []);
                if (data.user?.nickname) {
                    setEditNickname(data.user.nickname);
                }
            }
        } catch (error) {
            console.error("마이페이지 데이터 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    // ── 편집 모드 / 일괄 삭제 핸들러 ─────────────────────────────────────────
    /**
     * [추가 2026-05-12 / frontend 머지 4/7]
     * 출처: origin/frontend commit 832d3bf "마이페이지 피드 삭제 관리"
     * 사유: 다중 선택된 갤러리 게시물을 DELETE /feed/:feed_id 로 일괄 삭제.
     * 기대효과: 사용자가 옛 인증 게시물을 한 번에 정리 가능.
     * 장점:
     * - dev 의 백엔드 DELETE /feed/{feed_id} 를 그대로 활용(추가 API 작업 0).
     * - Promise.allSettled 로 일부 실패해도 나머지는 진행 → 부분 성공 허용.
     * - 삭제 후 galleryItems 를 prev.filter 로 즉시 갱신해 재조회 없이 UI 반영.
     */
    const handleToggleEditMode = () => {
        // 편집 모드를 끌 때 누적된 선택을 초기화하여 다음 진입 시 깨끗한 상태 보장
        setIsEditMode((prev) => {
            if (prev) setSelectedFeedIds([]);
            return !prev;
        });
    };

    const handleToggleSelect = (feedId) => {
        setSelectedFeedIds((prev) =>
            prev.includes(feedId)
                ? prev.filter((id) => id !== feedId)
                : [...prev, feedId],
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedFeedIds.length === 0) {
            alert("삭제할 게시물을 먼저 선택해주세요.");
            return;
        }
        if (!window.confirm(`선택한 ${selectedFeedIds.length}개의 게시물을 삭제할까요?`)) return;

        setDeleting(true);
        try {
            // Set 으로 변환하여 같은 feed_id 의 중복 호출 방지
            const uniqueFeedIds = Array.from(new Set(selectedFeedIds));
            const results = await Promise.allSettled(
                uniqueFeedIds.map((fid) =>
                    fetch(`${EXPRESS_URL}/feed/${fid}`, {
                        method: "DELETE",
                        credentials: "include",
                    }).then((res) => res.json().then((d) => ({ fid, ok: res.ok && d.success, d }))),
                ),
            );

            const succeeded = results
                .filter((r) => r.status === "fulfilled" && r.value.ok)
                .map((r) => r.value.fid);

            if (succeeded.length > 0) {
                // 갤러리에서 삭제된 게시물의 이미지들 제거
                setGalleryItems((prev) => prev.filter((item) => !succeeded.includes(item.feed_id)));
            }

            const failed = uniqueFeedIds.length - succeeded.length;
            if (failed > 0) {
                alert(`${succeeded.length}개 삭제 성공 / ${failed}개 실패. 잠시 후 다시 시도해주세요.`);
            } else {
                alert("선택한 게시물을 모두 삭제했습니다.");
            }

            setSelectedFeedIds([]);
            setIsEditMode(false);
        } catch (error) {
            console.error("피드 일괄 삭제 실패:", error);
            alert("삭제 중 오류가 발생했습니다.");
        } finally {
            setDeleting(false);
        }
    };

    // ── [추가] 아바타 사진 클릭 시 이미지 변경 파일 탐색기 연동 로직 ───────────────────
    const handleAvatarClick = () => {
        if (!isProfileEdit) return; // 프로필 편집 모드 활성화 상태일 때만 파일 탐색기 작동
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreviewAvatar(imageUrl); // 가상 프리뷰 데이터 반영
        }
    };

    const handleSaveProfile = () => {
        if (!editNickname.trim()) {
            alert("이름(닉네임)을 입력해주세요.");
            return;
        }
        setUser((prev) => ({ ...prev, nickname: editNickname }));
        setIsProfileEdit(false);
        alert("프로필 정보 변경이 성공적으로 저장되었습니다.");
    };

    const handleCancelProfile = () => {
        setIsProfileEdit(false);
        setEditNickname(user.nickname);
        setPreviewAvatar(null); // 프리뷰 데이터 리셋
    };

    if (loading) return <div className="mypage">로딩 중...</div>;
    if (!user) return <div className="mypage">유저 정보를 불러올 수 없습니다.</div>;

    const totalRate = summary?.today?.total_rate || 0;
    const continuousDays = summary?.current_streak || 0;
    const routineCount = summary?.routine_count || 0;
    const feedCount = summary?.feed_count || 0;

    const getFileUrl = (fileUrl) => {
        if (!fileUrl) return "";
        if (fileUrl.startsWith("http")) return fileUrl;
        return `${EXPRESS_URL}${fileUrl}`;
    };

    const fontStyle = {
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
        letterSpacing: "-0.03em",
    };

    return (
        <div className="mypage" style={{ backgroundColor: "#f9fafb", minHeight: "100vh", ...fontStyle }}>
            {/* 1. 프로필 섹션 */}
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
                {/* 사진 파일 탐색기 숨김 요소 */}
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {/* 프로필 아바타 (위치 보존, 편집 활성화 시 클릭 가능 안내 오버레이 노출) */}
                <div
                    className="profile-avatar"
                    onClick={handleAvatarClick}
                    style={{
                        width: "72px",
                        height: "72px",
                        borderRadius: "50%",
                        background: previewAvatar ? `url(${previewAvatar}) center/cover no-repeat` : "linear-gradient(135deg, #4f46e5, #818cf8)",
                        color: previewAvatar ? "transparent" : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        fontWeight: "800",
                        flexShrink: 0,
                        boxShadow: "0 4px 10px rgba(79, 70, 229, 0.25)",
                        cursor: isProfileEdit ? "pointer" : "default",
                        position: "relative"
                    }}
                >
                    {!previewAvatar && (isProfileEdit ? editNickname.charAt(0) : user.nickname?.charAt(0))}
                    {isProfileEdit && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "white", fontSize: "10px", textAlign: "center", padding: "3px 0", borderRadius: "0 0 50px 50px", fontWeight: "bold" }}>변경</div>
                    )}
                </div>

                {/* 프로필 인포레이션 영역 (우상단에 인스타그램 테마 '프로필 편집' 배치 고정) */}
                <div className="profile-info" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flexGrow: 1 }}>
                    {!isProfileEdit ? (
                        <>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", justifyContent: "space-between" }}>
                                <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "900", color: "#111827" }}>
                                    {user.nickname}
                                </h1>
                                <button
                                    onClick={() => setIsProfileEdit(true)}
                                    style={{
                                        border: "1px solid #dbdbdb",
                                        background: "#ffffff",
                                        padding: "5px 12px",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        color: "#262626",
                                        cursor: "pointer",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                                    }}
                                >
                                    프로필 편집
                                </button>
                            </div>
                            <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px", fontWeight: "600", textAlign: "left" }}>
                                {editBio}
                            </p>
                        </>
                    ) : (
                        /* 프로필 편집 인라인 레이아웃 전환 상태 */
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                            <input
                                type="text"
                                value={editNickname}
                                onChange={(e) => setEditNickname(e.target.value)}
                                style={{ width: "92%", padding: "5px 8px", fontSize: "14px", fontWeight: "bold", border: "1px solid #dbdbdb", borderRadius: "6px" }}
                                placeholder="이름을 입력하세요"
                            />
                            <input
                                type="text"
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                style={{ width: "92%", padding: "5px 8px", fontSize: "13px", border: "1px solid #dbdbdb", borderRadius: "6px", color: "#4b5563" }}
                                placeholder="소개글을 입력하세요"
                            />
                            <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                                <button onClick={handleSaveProfile} style={{ border: "none", background: "#4f46e5", color: "white", padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>저장</button>
                                <button onClick={handleCancelProfile} style={{ border: "1px solid #dbdbdb", background: "#fff", color: "#4b5563", padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>취소</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. 오늘의 갓생 지수 */}
            <div style={{ padding: "16px 24px" }}>
                <div
                    className="mypage-card"
                    style={{
                        backgroundColor: "white",
                        padding: "20px 24px",
                        borderRadius: "24px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.04)",
                        border: "1px solid #f3f4f6",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "900", color: "#111827" }}>
                            📊 오늘의 갓생 지수
                        </h2>
                        <button
                            onClick={() => navigate("/stats")}
                            style={{
                                border: "none",
                                background: "#f3f4f6",
                                color: "#4f46e5",
                                padding: "6px 12px",
                                borderRadius: "10px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "800",
                                transition: "all 0.3s ease",
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = "#4f46e5";
                                e.currentTarget.style.color = "#ffffff";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = "#f3f4f6";
                                e.currentTarget.style.color = "#4f46e5";
                            }}
                        >
                            상세 분석
                        </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div
                            style={{
                                position: "relative",
                                width: "110px",
                                height: "110px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "12px",
                            }}
                        >
                            <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
                                <circle cx="55" cy="55" r="48" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                                <circle
                                    cx="55"
                                    cy="55"
                                    r="48"
                                    fill="none"
                                    stroke="#4f46e5"
                                    strokeWidth="10"
                                    strokeDasharray={2 * Math.PI * 48}
                                    strokeDashoffset={2 * Math.PI * 48 * (1 - totalRate / 100)}
                                    strokeLinecap="round"
                                    style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                                />
                            </svg>
                            <span style={{ position: "absolute", fontSize: "28px", fontWeight: "950", color: "#111827" }}>
                                {totalRate}%
                            </span>
                        </div>
                        <span style={{ fontSize: "14px", color: "#374151", fontWeight: "800", letterSpacing: "-0.04em" }}>
                            오늘의 통합 달성률
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. 핵심 지표 섹션 */}
            <div
                className="mypage-stats"
                style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", padding: "0 24px" }}
            >
                {[
                    { label: "총 루틴 수", value: routineCount, unit: "개", color: "#4f46e5" },
                    { label: "연속 달성", value: continuousDays, unit: "일", color: "#ef4444" },
                    { label: "인증 게시글", value: feedCount, unit: "개", color: "#f59e0b" },
                ].map((stat, idx) => (
                    <div
                        key={idx}
                        style={{
                            backgroundColor: "white",
                            padding: "20px 10px",
                            borderRadius: "24px",
                            textAlign: "center",
                            border: "1px solid #f3f4f6",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                        }}
                    >
                        <h3 style={{ fontSize: "13px", color: "#4b5563", marginBottom: "10px", fontWeight: "800" }}>
                            {stat.label}
                        </h3>
                        <p style={{ margin: 0, fontSize: "22px", fontWeight: "950", color: stat.color }}>
                            {stat.value}
                            <span style={{ fontSize: "13px", marginLeft: "3px", color: "#111827", fontWeight: "800" }}>
                                {stat.unit}
                            </span>
                        </p>
                    </div>
                ))}
            </div>

            {/* 4. 내 인증 갤러리 */}
            <div className="mypage-gallery" style={{ marginTop: "32px", padding: "0 24px 40px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
                    <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "900", color: "#111827" }}>
                        📸 내 인증 갤러리
                    </h2>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ color: "#6b7280", fontSize: "14px", fontWeight: "800" }}>
                            총 {galleryItems.length}개
                        </span>
                        {galleryItems.length > 0 && (
                            <button
                                type="button"
                                onClick={handleToggleEditMode}
                                style={{
                                    border: "1px solid #e5e7eb",
                                    background: isEditMode ? "#4f46e5" : "white",
                                    color: isEditMode ? "white" : "#374151",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                }}
                            >
                                {isEditMode ? "완료" : "관리"}
                            </button>
                        )}
                        {isEditMode && selectedFeedIds.length > 0 && (
                            <button
                                type="button"
                                onClick={handleDeleteSelected}
                                disabled={deleting}
                                style={{
                                    border: "none",
                                    background: "#ef4444",
                                    color: "white",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: deleting ? "not-allowed" : "pointer",
                                    opacity: deleting ? 0.6 : 1,
                                }}
                            >
                                {deleting ? "삭제 중..." : `선택 삭제 (${new Set(selectedFeedIds).size})`}
                            </button>
                        )}
                    </div>
                </div>

                {galleryItems.length === 0 ? (
                    <div
                        style={{
                            background: "white",
                            border: "1px solid #f3f4f6",
                            borderRadius: "20px",
                            padding: "28px 16px",
                            color: "#6b7280",
                            fontSize: "14px",
                            fontWeight: "800",
                            textAlign: "center",
                        }}
                    >
                        아직 인증 갤러리에 표시할 파일이 없어요.
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                        {galleryItems.map((item) => {
                            const isSelected = selectedFeedIds.includes(item.feed_id);
                            return (
                                <div
                                    key={item.image_id}
                                    onClick={() => {
                                        if (isEditMode) {
                                            handleToggleSelect(item.feed_id);
                                        } else {
                                            setSelectedItem(item);
                                        }
                                    }}
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        paddingBottom: "100%",
                                        overflow: "hidden",
                                        borderRadius: "20px",
                                        cursor: "pointer",
                                        backgroundColor: "#e5e7eb",
                                        transition: "all 0.2s ease",
                                        outline: isSelected ? "3px solid #4f46e5" : "none",
                                        outlineOffset: isSelected ? "-3px" : 0,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "scale(0.95)";
                                        e.currentTarget.style.boxShadow = "0 8px 15px rgba(0,0,0,0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    {item.file_type?.startsWith("video/") ? (
                                        <video
                                            src={getFileUrl(item.file_url)}
                                            muted
                                            playsInline
                                            preload="metadata"
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    ) : (
                                        <img
                                            src={getFileUrl(item.file_url)}
                                            alt="인증샷"
                                            loading="lazy"
                                            decoding="async"
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    )}
                                    {isEditMode && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "8px",
                                                right: "8px",
                                                width: "26px",
                                                height: "26px",
                                                borderRadius: "50%",
                                                background: isSelected ? "#4f46e5" : "rgba(255,255,255,0.85)",
                                                color: isSelected ? "white" : "#111827",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "14px",
                                                fontWeight: 900,
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                                            }}
                                        >
                                            {isSelected ? "✓" : ""}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 갤러리 상세 모달 */}
            {selectedItem && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(0,0,0,0.85)",
                        zIndex: 2000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px",
                    }}
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "relative",
                            maxWidth: "min(900px, 100%)",
                            maxHeight: "100%",
                            background: "#000",
                            borderRadius: "12px",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedItem(null)}
                            aria-label="모달 닫기"
                            style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                border: "none",
                                background: "rgba(0,0,0,0.55)",
                                color: "white",
                                fontSize: "22px",
                                lineHeight: 1,
                                cursor: "pointer",
                                zIndex: 1,
                            }}
                        >
                            ×
                        </button>

                        {selectedItem.file_type?.startsWith("video/") ? (
                            <video
                                src={getFileUrl(selectedItem.file_url)}
                                controls
                                preload="metadata"
                                style={{ maxWidth: "100%", maxHeight: "80vh", display: "block" }}
                            />
                        ) : (
                            <img
                                src={getFileUrl(selectedItem.file_url)}
                                alt="갤러리 상세"
                                style={{ maxWidth: "100%", maxHeight: "80vh", display: "block" }}
                            />
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setSelectedItem(null);
                                navigate("/feed");
                            }}
                            style={{
                                marginTop: "12px",
                                marginBottom: "16px",
                                padding: "10px 18px",
                                border: "none",
                                borderRadius: "10px",
                                background: "#4f46e5",
                                color: "white",
                                fontWeight: 800,
                                fontSize: "14px",
                                cursor: "pointer",
                            }}
                        >
                            피드에서 보기 →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyPage;