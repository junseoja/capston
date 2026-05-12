import React, { useState, useEffect } from "react";

function NoticeList({ notices, setPage, setSelectedNotice }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("제목");
  
  // 1. 현재 선택된 공지 분류(카테고리) 상태
  const [activeCategory, setActiveCategory] = useState("전체");
  
  const [readNotices, setReadNotices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 8;

  useEffect(() => {
    const savedRead = JSON.parse(localStorage.getItem("readNotices") || "[]");
    setReadNotices(savedRead.map(id => String(id)));
  }, []);

  // 2. 분류(카테고리)나 검색어가 변경되면 무조건 1페이지로 돌아가게 설정
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory]);

  const handleNoticeClick = (notice) => {
    const noticeId = String(notice.id);
    const savedRead = JSON.parse(localStorage.getItem("readNotices") || "[]").map(id => String(id));
    
    if (!savedRead.includes(noticeId)) {
      const updatedRead = [...savedRead, noticeId];
      localStorage.setItem("readNotices", JSON.stringify(updatedRead));
      setReadNotices(updatedRead);
    }

    setSelectedNotice(notice);
    setPage("notice_detail");
  };

  // 3. 분류 필터링 로직: 선택된 카테고리에 맞는 공지만 걸러냄
  const filteredNotices = notices.filter((n) => {
    // 카테고리 매칭 (전체일 경우 모두 통과)
    const matchesCategory = activeCategory === "전체" || n.category === activeCategory;
    
    // 검색어 매칭
    const value = searchTerm.toLowerCase();
    const matchesSearch = searchCategory === "제목" 
      ? n.title.toLowerCase().includes(value)
      : n.content.toLowerCase().includes(value);
      
    return matchesCategory && matchesSearch;
  });

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentNotices = filteredNotices.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredNotices.length / postsPerPage);

  // 사용할 카테고리 목록
  const categories = ["전체", "일반", "이벤트", "점검", "업데이트"];

  return (
    <div className="page-container">
      <div className="routine-header" style={{ textAlign: 'left', marginBottom: '30px' }}>
        <h2 className="routine-title">공지사항</h2>
        <p className="routine-subtitle">분류별로 원하는 소식을 빠르게 찾아보세요.</p>
      </div>

      {/* 검색 바 */}
      <div className="notice-search-area">
        <select className="notice-search-select" value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)}>
          <option value="제목">제목</option>
          <option value="내용">내용</option>
        </select>
        <div className="notice-search-input-wrapper">
          <input className="notice-search-input" type="text" placeholder="검색어를 입력하세요..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="notice-search-btn">🔍</button>
        </div>
      </div>

      {/* 4. 분류(카테고리) 선택 버튼 영역 */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "25px", flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "8px 18px",
              borderRadius: "20px",
              border: "1px solid " + (activeCategory === cat ? "var(--primary)" : "#eee"),
              background: activeCategory === cat ? "var(--primary)" : "white",
              color: activeCategory === cat ? "white" : "#888",
              fontWeight: "800",
              cursor: "pointer",
              fontSize: "13px",
              transition: "all 0.2s ease"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 공지사항 목록 */}
      <div className="notice-list-wrap">
        {currentNotices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#bbb" }}>
            {activeCategory} 카테고리에 해당하는 공지사항이 없습니다.
          </div>
        ) : (
          currentNotices.map((notice) => {
            const isRead = readNotices.includes(String(notice.id));
            return (
              <div key={notice.id} className="notice-item-row" onClick={() => handleNoticeClick(notice)}>
                <div className="notice-item-left">
                  <div style={{ width: "30px", textAlign: "center" }}>
                    {isRead ? (
                      <span style={{ color: "var(--primary)", fontSize: "18px", fontWeight: "bold" }}>✔</span>
                    ) : (
                      <span style={{ color: "#eee", fontSize: "18px" }}>·</span>
                    )}
                  </div>
                  
                  <div className="notice-info-content">
                    <div className="notice-title-line">
                      <span className={`notice-badge-tag ${notice.category === '점검' ? 'badge-emergency' : 'badge-normal'}`}>
                        {notice.category}
                      </span>
                      <h3 className={`notice-main-title ${isRead ? 'read-title' : 'unread-title'}`}>
                        {notice.title}
                      </h3>
                    </div>
                    <p className="notice-sub-preview">{notice.content}</p>
                  </div>
                </div>

                <div className="notice-item-right">
                  <span>{notice.date}</span>
                  <span style={{ margin: "0 10px", color: "#eee" }}>|</span>
                  <span>관리자</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 0 && (
        <div className="notice-pagination-box">
          <button className="page-num-btn" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>〈</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i + 1} className={`page-num-btn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="page-num-btn" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>〉</button>
        </div>
      )}
    </div>
  );
}

export default NoticeList;