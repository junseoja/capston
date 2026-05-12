import React, { useState, useMemo } from "react";

function AdminPage({ reports, onDeleteConfirm, notices, setNotices }) {
  const [currentMenu, setCurrentMenu] = useState("dashboard"); 
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportTab, setReportTab] = useState("pending"); 
  const [sortOrder, setSortOrder] = useState("desc"); 
  const [deleteReasonText, setDeleteReasonText] = useState("");

  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("일반"); 
  const [filterCategory, setFilterCategory] = useState("전체"); 
  const [editingNoticeId, setEditingNoticeId] = useState(null); 

  const pendingCount = reports.filter(r => r.status === "pending").length;

  const getMostFrequentReason = (reporters) => {
    if (!reporters || reporters.length === 0) return "사유 없음";
    const counts = reporters.reduce((acc, curr) => {
      acc[curr.reason] = (acc[curr.reason] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  const filteredReports = useMemo(() => {
    let list = reports.filter(r => r.status === reportTab);
    return list.sort((a, b) => sortOrder === "desc" ? b.reportCount - a.reportCount : a.reportCount - b.reportCount);
  }, [reports, reportTab, sortOrder]);

  const handleConfirmDelete = (report) => {
    if (!deleteReasonText.trim()) {
      alert("유저에게 보낼 제재 사유를 직접 입력해주세요.");
      return;
    }
    if (window.confirm(`이 게시물을 삭제하고 작성자(${report.user})에게 제재 알림을 보낼까요?`)) {
      onDeleteConfirm(report.id, report.feedId, report.user, deleteReasonText);
      alert("제재가 완료되었습니다.");
      setDeleteReasonText("");
      setSelectedReport(null);
    }
  };

  const filteredNotices = useMemo(() => {
    if (filterCategory === "전체") return notices;
    return notices.filter(n => n.category === filterCategory);
  }, [notices, filterCategory]);

  const handleSaveNotice = () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    if (editingNoticeId) {
      setNotices(notices.map(n => n.id === editingNoticeId 
        ? { ...n, category: noticeCategory, title: noticeTitle, content: noticeContent } 
        : n
      ));
      alert("공지사항이 수정되었습니다.");
    } else {
      const newNotice = {
        id: Date.now(),
        category: noticeCategory,
        title: noticeTitle,
        content: noticeContent,
        date: new Date().toISOString().split('T')[0]
      };
      setNotices([newNotice, ...notices]);
      alert("새 공지사항이 게시되었습니다.");
    }
    resetNoticeForm();
  };

  const resetNoticeForm = () => {
    setEditingNoticeId(null);
    setNoticeTitle("");
    setNoticeContent("");
    setNoticeCategory("일반");
  };

  const handleEditNotice = (notice) => {
    setEditingNoticeId(notice.id);
    setNoticeCategory(notice.category);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
  };

  const handleDeleteNotice = (id) => {
    if (window.confirm("이 공지사항을 삭제하시겠습니까?")) {
      setNotices(notices.filter(n => n.id !== id));
      if (editingNoticeId === id) resetNoticeForm();
    }
  };

  const StatCard = ({ title, value, colorVar }) => (
    <div className="stat-card" style={{ borderTop: `4px solid var(--${colorVar})`, background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
      <h3 style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>{title}</h3>
      <p style={{ color: `var(--${colorVar})`, fontSize: "24px", fontWeight: "900", margin: 0 }}>{value}</p>
    </div>
  );

  const renderContent = () => {
    switch (currentMenu) {
      case "reports":
        return (
          <div className="page-container" style={{ padding: "20px" }}>
            <div className="routine-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h2 className="routine-title">🚩 부적절 게시글 제재 관리</h2>
                <p className="routine-subtitle">신고 분류를 기반으로 우선순위를 정해 게시물을 검토하세요.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ background: '#fff0f0', padding: '10px 15px', borderRadius: '10px', border: '1px solid #ffccc7' }}>
                  <span style={{ fontSize: '12px', color: '#ff4d4f', fontWeight: '700' }}>미처리 신고</span>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#ff4d4f' }}>{pendingCount}건</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "25px 0 15px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {["pending", "completed"].map(status => (
                  <button key={status} onClick={() => setReportTab(status)} style={{ padding: "10px 20px", borderRadius: "25px", border: "none", cursor: "pointer", backgroundColor: reportTab === status ? "#4f46e5" : "#eee", color: reportTab === status ? "white" : "#666", fontWeight: '700', fontSize: '14px' }}>
                    {status === "pending" ? "검토 대기" : "처리 완료"}
                  </button>
                ))}
              </div>
              <select onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }}>
                <option value="desc">신고 많은 순</option>
                <option value="asc">신고 적은 순</option>
              </select>
            </div>
            <div className="routine-form-box" style={{ padding: 0, overflow: "hidden", background: "white", borderRadius: "16px", border: "1px solid #eee" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #eee" }}>
                  <tr style={{ fontSize: '13px', color: '#6b7280' }}>
                    <th style={{ padding: "16px 20px" }}>게시글 정보</th>
                    <th>주요 신고 분류</th>
                    <th style={{ textAlign: 'center' }}>누적 횟수</th>
                    <th style={{ textAlign: 'center' }}>상태</th>
                    <th style={{ padding: "16px 20px", textAlign: 'right' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => (
                    <tr key={report.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={report.postContent.img} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', background: '#eee' }} alt="썸네일" />
                          <div>
                            <div style={{ fontWeight: "800", fontSize: '14px' }}>{report.user}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{report.postContent.title}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', backgroundColor: '#e6f7ff', color: '#1890ff', border: '1px solid #91d5ff' }}>
                          {getMostFrequentReason(report.reporters).match(/\[(.*?)\]/)?.[1] || "기타"}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: "800" }}>{report.reportCount}회</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: report.status === 'pending' ? '#ff4d4f' : '#52c41a' }}></span>
                          {report.status === 'pending' ? '대기' : '완료'}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: 'right' }}>
                        <button className="check-btn" onClick={() => setSelectedReport(report)} style={{ padding: '6px 12px', fontSize: '12px' }}>상세 검토</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "notice":
        return (
          <div className="page-container" style={{ padding: "20px" }}>
            <div className="routine-header">
              <h2 className="routine-title">📢 공지사항 통합 관리</h2>
              <p className="routine-subtitle">사용자들에게 노출될 카테고리별 공지를 작성하고 관리하세요.</p>
            </div>

            <div style={{ display: 'flex', gap: '25px', marginTop: '25px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, background: "white", padding: "24px", borderRadius: "16px", border: editingNoticeId ? "2px solid #4f46e5" : "1px solid #eee", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontSize: '15px', fontWeight: '900', marginBottom: '16px', color: editingNoticeId ? '#4f46e5' : '#111' }}>
                  {editingNoticeId ? "📝 공지사항 수정" : "➕ 새 공지 등록"}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ width: '100px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#999', display: 'block', marginBottom: '4px' }}>분류</label>
                      <select value={noticeCategory} onChange={(e) => setNoticeCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: '#f9f9f9', fontWeight: '700', fontSize: '13px' }}>
                        <option value="일반">일반</option>
                        <option value="이벤트">이벤트</option>
                        <option value="점검">점검</option>
                        <option value="업데이트">업데이트</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#999', display: 'block', marginBottom: '4px' }}>제목</label>
                      <input type="text" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="공지 제목을 입력하세요" style={{ width: '100%', padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: '13px', outline: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#999', display: 'block', marginBottom: '4px' }}>내용</label>
                    <textarea value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} placeholder="상세 내용을 입력하세요..." style={{ width: "100%", minHeight: "200px", padding: "14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: '13px', lineHeight: '1.6', outline: 'none', resize: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSaveNotice} className="routine-save-btn" style={{ flex: 2, padding: '12px', fontSize: '14px' }}>{editingNoticeId ? "수정 완료" : "공지 게시"}</button>
                    {editingNoticeId && <button onClick={resetNoticeForm} style={{ flex: 1, background: '#eee', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>취소</button>}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #eee" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '900' }}>📃 게시 내역</h3>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {["전체", "일반", "이벤트", "점검", "업데이트"].map(cat => (
                      <button key={cat} onClick={() => setFilterCategory(cat)} style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '15px', cursor: 'pointer', border: '1px solid #ddd', background: filterCategory === cat ? '#4f46e5' : 'white', color: filterCategory === cat ? 'white' : '#666', fontWeight: '700' }}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div style={{ maxHeight: '520px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
                  {filteredNotices.length === 0 ? <div style={{ textAlign: 'center', color: '#ccc', padding: '60px 0', fontSize: '13px' }}>해당 카테고리의 공지가 없습니다.</div> : filteredNotices.map(notice => (
                    <div key={notice.id} style={{ padding: '12px', border: '1px solid #f3f4f6', borderRadius: '10px', background: editingNoticeId === notice.id ? '#f5f7ff' : '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', background: notice.category === '점검' ? '#fff1f0' : '#f0f5ff', color: notice.category === '점검' ? '#ff4d4f' : '#4f46e5' }}>{notice.category}</span>
                          <span style={{ fontSize: '10px', color: '#bbb' }}>{notice.date}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEditNotice(notice)} style={{ border: 'none', background: 'none', color: '#4f46e5', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>수정</button>
                          <button onClick={() => handleDeleteNotice(notice.id)} style={{ border: 'none', background: 'none', color: '#ff4d4f', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>삭제</button>
                        </div>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '13px', marginBottom: '4px', color: '#333' }}>{notice.title}</div>
                      <div style={{ fontSize: '12px', color: '#777', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>{notice.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "metrics":
        return (
          <div className="page-container" style={{ padding: "20px" }}>
            <div className="routine-header" style={{ marginBottom: "20px" }}>
              <h2 className="routine-title">📊 서비스 활성 지표 분석</h2>
              <p className="routine-subtitle">전체 가입자 및 콘텐츠 성장 지표를 확인합니다.</p>
            </div>
            <div className="mypage-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              <StatCard title="총 가입자" value="1,284명" colorVar="primary" />
              <StatCard title="누적 게시글" value="5,432개" colorVar="primary-2" />
              <StatCard title="신규 가입자" value="+24명" colorVar="success" />
            </div>
          </div>
        );

      default:
        return (
          <div className="page-container" style={{ padding: "20px" }}>
            <div className="routine-header">
              <h1 className="routine-title">갓생 통합 관리 시스템</h1>
              <p className="routine-subtitle">오늘의 주요 운영 현황 요약</p>
            </div>
            <div className="mypage-stats" style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              <StatCard title="오늘의 인증" value="1,892건" colorVar="success" />
              <StatCard title="미처리 신고" value={`${pendingCount}건`} colorVar="danger" />
              <StatCard title="신규 루틴 수" value="+89개" colorVar="warning" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app" style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      <header className="topbar">
        <div className="logo">ADMIN PANEL</div>
        <nav className="nav">
          {[{ id: "dashboard", label: "홈" }, { id: "reports", label: "신고 처리" }, { id: "notice", label: "공지사항" }, { id: "metrics", label: "서비스 지표" }].map((menu) => (
            <button key={menu.id} onClick={() => { setCurrentMenu(menu.id); setSelectedReport(null); }} className={currentMenu === menu.id ? "active-time-tab" : ""}>{menu.label}</button>
          ))}
        </nav>
        <div className="nav"><button onClick={() => window.location.reload()} style={{ color: "var(--danger)" }}>로그아웃</button></div>
      </header>
      <main>{renderContent()}</main>
      <style>{`
        .routine-delete-btn { background-color: var(--danger); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 800; }
        .check-btn { background-color: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 800; padding: 8px 12px; }
        .routine-save-btn { background-color: var(--primary); color: white; border: none; padding: 15px; border-radius: 12px; cursor: pointer; font-weight: 800; }
        .active-time-tab { background-color: var(--primary) !important; color: white !important; }
        .report-row:hover { background-color: #fafafa; }
        div::-webkit-scrollbar { width: 5px; }
        div::-webkit-scrollbar-track { background: transparent; }
        div::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default AdminPage;