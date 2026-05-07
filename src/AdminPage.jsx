import React, { useState, useMemo } from "react";

function AdminPage() {
  const [currentMenu, setCurrentMenu] = useState("dashboard");
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportTab, setReportTab] = useState("pending"); // pending(미처리) / completed(처리완료)
  const [sortOrder, setSortOrder] = useState("desc"); // desc(신고많은순) / asc(신고적은순)
  
  // [상태 관리] 삭제 사유 입력을 위한 상태
  const [deleteReasonText, setDeleteReasonText] = useState("");

  // [상태 관리] 리포트 데이터 (실제 데이터 연동 시 API로 교체)
  const [reports, setReports] = useState([
    { 
      id: 1, 
      user: "ttaemyong", 
      reason: "부적절한 광고", 
      reportCount: 5, 
      status: "pending",
      date: "2026-05-07 13:45",
      postContent: {
        title: "아침 운동 완료!",
        text: "이거 사고 돈 벌었어요! [광고 링크]",
        img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500"
      }
    },
    { 
      id: 2, 
      user: "habit_hunter", 
      reason: "욕설 및 비방", 
      reportCount: 2, 
      status: "pending",
      date: "2026-05-06 10:20",
      postContent: {
        title: "식단 공유",
        text: "말도 안 되는 소리 마세요 XXX",
        img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500"
      }
    }
  ]);

  // [통계 계산]
  const pendingCount = reports.filter(r => r.status === "pending").length;

  const filteredReports = useMemo(() => {
    let list = reports.filter(r => r.status === reportTab);
    return list.sort((a, b) => 
      sortOrder === "desc" ? b.reportCount - a.reportCount : a.reportCount - b.reportCount
    );
  }, [reports, reportTab, sortOrder]);

  const handleConfirmDelete = (report) => {
    if (!deleteReasonText.trim()) {
      alert("사용자에게 보낼 삭제 사유를 입력해주세요.");
      return;
    }
    if (window.confirm(`사유: "${deleteReasonText}"\n삭제하시겠습니까?`)) {
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: "completed", adminComment: deleteReasonText } : r));
      alert("삭제 처리가 완료되었습니다.");
      setDeleteReasonText("");
      setSelectedReport(null);
    }
  };

  const StatCard = ({ title, value, colorVar }) => (
    <div className="stat-card" style={{ borderTop: `4px solid var(--${colorVar})` }}>
      <h3>{title}</h3>
      <p style={{ color: `var(--${colorVar})` }}>{value}</p>
    </div>
  );

  const renderContent = () => {
    switch (currentMenu) {
      case "reports":
        return (
          <div className="page-container">
            <div className="routine-header">
              <h2 className="routine-title">🚩 부적절 게시글 신고 관리</h2>
              <p className="routine-subtitle">신고 누적 횟수에 따라 우선순위를 확인하고 조치하세요.</p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setReportTab("pending")} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", backgroundColor: reportTab === "pending" ? "var(--primary)" : "white", color: reportTab === "pending" ? "white" : "black" }}>미처리 신고 ({pendingCount})</button>
                <button onClick={() => setReportTab("completed")} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", backgroundColor: reportTab === "completed" ? "var(--primary)" : "white", color: reportTab === "completed" ? "white" : "black" }}>처리 완료</button>
              </div>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <option value="desc">신고 많은 순</option>
                <option value="asc">신고 적은 순</option>
              </select>
            </div>
            <div className="routine-form-box" style={{ padding: 0, overflow: "hidden", marginBottom: "20px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ backgroundColor: "var(--primary-light)" }}>
                  <tr>
                    <th style={{ padding: "16px" }}>작성자</th>
                    <th>사유</th>
                    <th>누적 횟수</th>
                    <th>관리 조치</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => (
                    <tr key={report.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "16px", fontWeight: "900" }}>{report.user}</td>
                      <td style={{ color: "var(--danger)" }}>{report.reason}</td>
                      <td style={{ fontWeight: "800" }}>{report.reportCount}회</td>
                      <td><button className="check-btn" onClick={() => setSelectedReport(report)}>상세보기 및 처리</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedReport && (
              <div className="routine-form-box" style={{ animation: "fadeIn 0.3s ease", border: "2px solid var(--primary-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h3>🔎 신고 내용 상세 확인</h3>
                  <button onClick={() => setSelectedReport(null)} style={{ border: "none", background: "none", cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                  <img src={selectedReport.postContent.img} alt="게시물" style={{ width: "150px", height: "150px", borderRadius: "12px", objectFit: "cover" }} />
                  <div style={{ flex: 1, fontSize: "14px" }}>
                    <p><strong>작성자:</strong> {selectedReport.user}</p>
                    <div style={{ background: "var(--bg)", padding: "12px", borderRadius: "8px", marginBottom: "10px" }}>{selectedReport.postContent.text}</div>
                    {selectedReport.status === "pending" ? (
                      <div>
                        <textarea placeholder="삭제 사유를 입력하세요." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }} value={deleteReasonText} onChange={(e) => setDeleteReasonText(e.target.value)} />
                        <button className="routine-delete-btn" style={{ marginTop: "10px", width: "100%" }} onClick={() => handleConfirmDelete(selectedReport)}>게시글 삭제</button>
                      </div>
                    ) : (
                      <p style={{ fontWeight: "800", color: "var(--primary)" }}>조치 완료: {selectedReport.adminComment}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "notice":
        return (
          <div className="page-container">
            <div className="routine-header">
              <h2 className="routine-title">📢 시스템 공지사항 등록</h2>
              <p className="routine-subtitle">사용자 홈 화면 배너와 공지 목록에 게시될 소식을 등록합니다.</p>
            </div>
            <div className="routine-form-box" style={{ marginTop: "20px" }}>
              <div className="routine-form" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <input type="text" placeholder="공지 제목" style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)" }} />
                <textarea placeholder="공지 상세 내용" style={{ width: "100%", minHeight: "200px", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }} />
                <button className="routine-save-btn">공지사항 게시하기</button>
              </div>
            </div>
          </div>
        );

      case "metrics":
        return (
          <div className="page-container">
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

      default: // 홈 화면
        return (
          <div className="page-container">
            <div className="routine-header">
              <h1 className="routine-title">갓생 통합 관리 시스템</h1>
              <p className="routine-subtitle">오늘의 주요 운영 현황 요약</p>
            </div>
            <div className="mypage-stats" style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              <StatCard title="오늘의 인증" value="1,892건" colorVar="success" />
              <StatCard title="미처리 신고" value={`${pendingCount}건`} colorVar="danger" />
              <StatCard title="신규 루틴 수" value="+89개" colorVar="warning" />
            </div>
            {/* 실시간 인기 루틴 TOP 3 섹션이 제거되었습니다. */}
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
      <main style={{ animation: "fadeIn 0.3s ease-in-out" }}>{renderContent()}</main>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .routine-delete-btn { background-color: var(--danger); color: white; border: none; padding: 10px 16px; borderRadius: 8px; cursor: pointer; font-weight: 800; }
        .check-btn { background-color: var(--primary); color: white; border: none; padding: 10px 16px; borderRadius: 8px; cursor: pointer; font-weight: 800; }
        .active-time-tab { background-color: var(--primary) !important; color: white !important; }
      `}</style>
    </div>
  );
}

export default AdminPage;