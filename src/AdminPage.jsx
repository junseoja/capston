import React, { useState, useMemo } from "react";

function AdminPage({ reports, onDeleteConfirm }) {
  const [currentMenu, setCurrentMenu] = useState("dashboard"); // 초기 메뉴: 홈(대시보드)
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportTab, setReportTab] = useState("pending"); 
  const [sortOrder, setSortOrder] = useState("desc"); 
  const [deleteReasonText, setDeleteReasonText] = useState("");

  // [상태 관리] 공지사항 입력을 위한 임시 상태
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");

  // [통계] 미처리 신고 수
  const pendingCount = reports.filter(r => r.status === "pending").length;

  // [로직] 가장 많이 신고된 사유 추출
  const getMostFrequentReason = (reporters) => {
    if (!reporters || reporters.length === 0) return "사유 없음";
    const counts = reporters.reduce((acc, curr) => {
      acc[curr.reason] = (acc[curr.reason] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  // [필터링] 신고 목록 정렬 및 필터링
  const filteredReports = useMemo(() => {
    let list = reports.filter(r => r.status === reportTab);
    return list.sort((a, b) => sortOrder === "desc" ? b.reportCount - a.reportCount : a.reportCount - b.reportCount);
  }, [reports, reportTab, sortOrder]);

  // [기능] 게시글 제재 실행
  const handleConfirmDelete = (report) => {
    if (!deleteReasonText.trim()) {
      alert("유저에게 보낼 제재 사유를 입력해주세요.");
      return;
    }
    if (window.confirm(`이 게시물을 삭제하고 작성자(${report.user})에게 제재 알림을 보낼까요?`)) {
      onDeleteConfirm(report.id, report.feedId, report.user, deleteReasonText);
      alert("제재가 완료되었습니다.");
      setDeleteReasonText("");
      setSelectedReport(null);
    }
  };

  // [컴포넌트] 통계 카드
  const StatCard = ({ title, value, colorVar }) => (
    <div className="stat-card" style={{ borderTop: `4px solid var(--${colorVar})`, background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
      <h3 style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>{title}</h3>
      <p style={{ color: `var(--${colorVar})`, fontSize: "24px", fontWeight: "900", margin: 0 }}>{value}</p>
    </div>
  );

  const renderContent = () => {
    switch (currentMenu) {
      // ── 1. 신고 처리 메뉴 (업그레이드 버전) ──
      case "reports":
        return (
          <div className="page-container" style={{ padding: "20px" }}>
            <div className="routine-header">
              <h2 className="routine-title">🚩 부적절 게시글 제재 관리</h2>
              <p className="routine-subtitle">신고된 게시물을 직접 확인하고 다수의 신고 사유를 검토하세요.</p>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setReportTab("pending")} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", backgroundColor: reportTab === "pending" ? "var(--primary)" : "white", color: reportTab === "pending" ? "white" : "black" }}>미처리 ({pendingCount})</button>
                <button onClick={() => setReportTab("completed")} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", backgroundColor: reportTab === "completed" ? "var(--primary)" : "white", color: reportTab === "completed" ? "white" : "black" }}>처리 완료</button>
              </div>
            </div>

            <div className="routine-form-box" style={{ padding: 0, overflow: "hidden", background: "white", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ backgroundColor: "var(--primary-light)" }}>
                  <tr>
                    <th style={{ padding: "16px" }}>작성자</th>
                    <th>가장 많이 신고된 사유</th>
                    <th>누적 횟수</th>
                    <th>조치</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => (
                    <tr key={report.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "16px", fontWeight: "900" }}>{report.user}</td>
                      <td style={{ color: "var(--danger)", fontWeight: "600" }}>{getMostFrequentReason(report.reporters)}</td>
                      <td style={{ fontWeight: "800" }}>{report.reportCount}회</td>
                      <td><button className="check-btn" onClick={() => setSelectedReport(report)}>게시글 확인 및 처리</button></td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr><td colSpan="4" style={{ padding: "40px", textAlign: "center", color: "#999" }}>내역이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 상세 검토 모달 */}
            {selectedReport && (
              <div className="report-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                <div style={{ background: 'white', width: '90%', maxWidth: '1000px', height: '80vh', borderRadius: '16px', display: 'flex', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ flex: 1.2, borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' }}>
                    <div style={{ padding: '15px 20px', background: 'white', borderBottom: '1px solid #eee', fontWeight: '900' }}>원본 게시물 확인</div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={selectedReport.postContent.img} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} alt="증거" />
                        <div style={{ padding: '15px' }}>
                          <p style={{ fontWeight: '800', margin: '0 0 10px 0' }}>{selectedReport.user}님의 게시글</p>
                          <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{selectedReport.postContent.text}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '900', color: 'red' }}>🚩 누적 신고 상세 ({selectedReport.reportCount})</span>
                      <button onClick={() => setSelectedReport(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                      {selectedReport.reporters.map((rep, idx) => (
                        <div key={idx} style={{ marginBottom: '10px', padding: '10px', background: '#fff5f5', borderRadius: '8px', border: '1px solid #ffccc7' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                            <span style={{ fontWeight: '800' }}>신고자: {rep.user}</span>
                            <span style={{ color: '#999' }}>{rep.date}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '13px' }}>사유: {rep.reason}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '20px', borderTop: '1px solid #eee', background: '#f9fafb' }}>
                      {selectedReport.status === "pending" ? (
                        <>
                          <textarea value={deleteReasonText} onChange={(e) => setDeleteReasonText(e.target.value)} placeholder="제재 사유 입력..." style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', resize: 'none', marginBottom: '10px' }} />
                          <button className="routine-delete-btn" style={{ width: '100%', padding: '12px' }} onClick={() => handleConfirmDelete(selectedReport)}>게시글 삭제 및 제재 알림 발송</button>
                        </>
                      ) : (
                        <div style={{ padding: '15px', background: '#e6f7ff', borderRadius: '8px', border: '1px solid #91d5ff' }}>
                          <p style={{ margin: 0, fontWeight: '800', color: '#0050b3' }}>✅ 조치 완료 (사유: {selectedReport.adminComment})</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // ── 2. 공지사항 메뉴 (유지) ──
      case "notice":
        return (
          <div className="page-container" style={{ padding: "20px" }}>
            <div className="routine-header">
              <h2 className="routine-title">📢 시스템 공지사항 등록</h2>
              <p className="routine-subtitle">사용자 홈 화면 배너와 공지 목록에 게시될 소식을 등록합니다.</p>
            </div>
            <div className="routine-form-box" style={{ marginTop: "20px", background: "white", padding: "25px", borderRadius: "12px" }}>
              <div className="routine-form" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <input type="text" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="공지 제목" style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)" }} />
                <textarea value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} placeholder="공지 상세 내용" style={{ width: "100%", minHeight: "200px", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }} />
                <button className="routine-save-btn" onClick={() => {alert("공지가 등록되었습니다."); setNoticeTitle(""); setNoticeContent("");}}>공지사항 게시하기</button>
              </div>
            </div>
          </div>
        );

      // ── 3. 서비스 지표 메뉴 (유지) ──
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

      // ── 4. 관리자 홈/대시보드 (유지) ──
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
      `}</style>
    </div>
  );
}

export default AdminPage;