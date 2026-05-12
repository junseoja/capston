import React, { useState, useMemo } from "react";

function AdminPage({ reports, onDeleteConfirm, notices, setNotices }) {
  const [currentMenu, setCurrentMenu] = useState("dashboard");
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportTab, setReportTab] = useState("pending");
  const [sortOrder, setSortOrder] = useState("desc");
  const [deleteReasonText, setDeleteReasonText] = useState("");

  // ── [챌린지 관리 상태] ──
  const [challenges, setChallenges] = useState([
    { id: 1, title: "30일 미라클 모닝", category: "생활습관", participants: 128, status: "진행중", startDate: "2026-05-01", endDate: "2026-05-30", description: "매일 아침 6시 기상 인증을 통해 갓생을 시작합니다.", progress: 75 },
    { id: 2, title: "하루 1만보 걷기", category: "운동", participants: 256, status: "진행중", startDate: "2026-05-10", endDate: "2026-06-10", description: "건강한 신체를 위해 매일 1만보를 걷고 인증합니다.", progress: 42 }
  ]);
  const [selectedChallenge, setSelectedChallenge] = useState(null); 
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false); 
  const [editingChallenge, setEditingChallenge] = useState(null); 

  const [challengeForm, setChallengeForm] = useState({
    title: "", category: "운동", startDate: "", endDate: "", description: ""
  });

  // ── [공지사항 상태] ──
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("일반");
  const [filterCategory, setFilterCategory] = useState("전체");
  const [editingNoticeId, setEditingNoticeId] = useState(null);

  const pendingCount = reports.filter(r => r.status === "pending").length;

  // ── [챌린지 핸들러] ──
  const handleOpenAddModal = () => {
    setEditingChallenge(null);
    setChallengeForm({ title: "", category: "운동", startDate: "", endDate: "", description: "" });
    setIsChallengeModalOpen(true);
  };

  const handleOpenEditModal = (challenge) => {
    setEditingChallenge(challenge);
    setChallengeForm({
      title: challenge.title,
      category: challenge.category,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      description: challenge.description
    });
    setIsChallengeModalOpen(true);
  };

  const handleSaveChallenge = () => {
    if (!challengeForm.title || !challengeForm.startDate || !challengeForm.endDate) {
      alert("챌린지 제목과 기간을 정확히 입력해주세요.");
      return;
    }

    if (editingChallenge) {
      setChallenges(challenges.map(c => 
        c.id === editingChallenge.id ? { ...c, ...challengeForm } : c
      ));
      alert("챌린지가 수정되었습니다.");
    } else {
      const newChallenge = {
        id: Date.now(),
        ...challengeForm,
        participants: 0,
        status: "진행중",
        progress: 0
      };
      setChallenges([newChallenge, ...challenges]);
      alert("새로운 챌린지가 등록되었습니다.");
    }
    setIsChallengeModalOpen(false);
  };

  const handleDeleteChallenge = (id) => {
    if (window.confirm("이 챌린지를 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) {
      setChallenges(challenges.filter(c => c.id !== id));
      if (selectedChallenge?.id === id) setSelectedChallenge(null);
      alert("챌린지가 삭제되었습니다.");
    }
  };

  // ── [공지사항 핸들러] ──
  const handleSaveNotice = () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) { 
      alert("제목과 내용을 입력해주세요."); 
      return; 
    }

    if (editingNoticeId) {
      setNotices(notices.map(n => n.id === editingNoticeId ? { ...n, category: noticeCategory, title: noticeTitle, content: noticeContent } : n));
      alert("공지사항이 성공적으로 수정되었습니다.");
    } else {
      const newNotice = { 
        id: Date.now(), 
        category: noticeCategory, 
        title: noticeTitle, 
        content: noticeContent, 
        date: new Date().toISOString().split('T')[0] 
      };
      setNotices([newNotice, ...notices]);
      alert(`[${noticeCategory}] 새 공지사항이 등록되었습니다.\n모든 사용자에게 앱 푸시 알림이 발송됩니다.`);
    }
    resetNoticeForm();
  };

  const resetNoticeForm = () => { setEditingNoticeId(null); setNoticeTitle(""); setNoticeContent(""); setNoticeCategory("일반"); };
  const handleEditNotice = (notice) => { setEditingNoticeId(notice.id); setNoticeCategory(notice.category); setNoticeTitle(notice.title); setNoticeContent(notice.content); };
  const handleDeleteNotice = (id) => { 
    if (window.confirm("공지를 삭제하시겠습니까?")) {
      setNotices(notices.filter(n => n.id !== id));
      alert("공지사항이 삭제되었습니다.");
    }
  };

  // ── [신고 처리 로직 - 이식된 부분] ──
  const getMostFrequentReason = (reporters) => {
    if (!reporters || reporters.length === 0) return "사유 없음";
    const counts = reporters.reduce((acc, curr) => { acc[curr.reason] = (acc[curr.reason] || 0) + 1; return acc; }, {});
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  const filteredReports = useMemo(() => {
    let list = reports.filter(r => r.status === reportTab);
    return list.sort((a, b) => sortOrder === "desc" ? b.reportCount - a.reportCount : a.reportCount - b.reportCount);
  }, [reports, reportTab, sortOrder]);

  const handleConfirmDelete = (report) => {
    if (!deleteReasonText.trim()) { alert("제재 사유를 입력해주세요."); return; }
    if (window.confirm(`${report.user}의 게시물을 삭제할까요?`)) {
      onDeleteConfirm(report.id, report.feedId, report.user, deleteReasonText);
      alert("해당 게시물이 삭제되었으며 유저에게 제재 알림이 전송되었습니다.");
      setDeleteReasonText("");
      setSelectedReport(null);
    }
  };

  const filteredNotices = useMemo(() => {
    if (filterCategory === "전체") return notices;
    return notices.filter(n => n.category === filterCategory);
  }, [notices, filterCategory]);

  const StatCard = ({ title, value, colorVar }) => (
    <div className="stat-card" style={{ borderTop: `4px solid var(--${colorVar})`, background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
      <h3 style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>{title}</h3>
      <p style={{ color: `var(--${colorVar})`, fontSize: "24px", fontWeight: "900", margin: 0 }}>{value}</p>
    </div>
  );

  const renderContent = () => {
    switch (currentMenu) {
      case "challenges":
        return (
          <div className="page-container" style={{ padding: "20px" }}>
            <div className="routine-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="routine-title">🏆 챌린지 통합 관리</h2>
                <p className="routine-subtitle">챌린지 개설, 수정, 삭제 및 참여 통계를 실시간으로 관리합니다.</p>
              </div>
              <button className="check-btn" onClick={handleOpenAddModal} style={{ padding: '12px 25px', fontSize: '15px' }}>+ 새 챌린지 등록</button>
            </div>

            <div className="mypage-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", margin: "25px 0" }}>
              <StatCard title="진행 중 챌린지" value={`${challenges.length}개`} colorVar="primary" />
              <StatCard title="총 참여 인원" value="384명" colorVar="success" />
              <StatCard title="오늘의 인증 수" value="152건" colorVar="warning" />
              <StatCard title="평균 달성률" value="78%" colorVar="primary-2" />
            </div>

            <div className="routine-form-box" style={{ padding: 0, overflow: "hidden", background: "white", borderRadius: "16px", border: "1px solid #eee" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #eee" }}>
                  <tr style={{ fontSize: '13px', color: '#6b7280' }}>
                    <th style={{ padding: "16px 20px" }}>챌린지명</th>
                    <th>카테고리</th>
                    <th>기간</th>
                    <th style={{ textAlign: 'center' }}>참여자</th>
                    <th style={{ textAlign: 'center' }}>진행도</th>
                    <th style={{ padding: "16px 20px", textAlign: 'right' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map(c => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "16px 20px", fontWeight: "800", fontSize: '14px', color: '#111' }}>{c.title}</td>
                      <td><span style={{ fontSize: '11px', background: '#f0f2ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '4px', fontWeight: '800' }}>{c.category}</span></td>
                      <td style={{ fontSize: '12px', color: '#888' }}>{c.startDate} ~ {c.endDate}</td>
                      <td style={{ textAlign: 'center', fontWeight: "800" }}>{c.participants}명</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ width: '60px', background: '#eee', height: '6px', borderRadius: '3px', margin: '0 auto' }}>
                          <div style={{ width: `${c.progress}%`, background: '#4f46e5', height: '100%', borderRadius: '3px' }}></div>
                        </div>
                        <span style={{ fontSize: '10px', color: '#4f46e5', fontWeight: '800' }}>{c.progress}%</span>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: 'right' }}>
                        <button className="check-btn" onClick={() => setSelectedChallenge(c)} style={{ padding: '6px 12px', fontSize: '12px', marginRight: '5px' }}>상세/인증</button>
                        <button onClick={() => handleOpenEditModal(c)} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', marginRight: '5px' }}>수정</button>
                        <button className="routine-delete-btn" onClick={() => handleDeleteChallenge(c.id)} style={{ padding: '6px 12px', fontSize: '12px' }}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedChallenge && (
              <div style={{ marginTop: "30px", background: "#fff", padding: "30px", borderRadius: "24px", border: "2px solid #4f46e5", boxShadow: "0 10px 30px rgba(79, 70, 229, 0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "25px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "900" }}>🔍 {selectedChallenge.title} 상세 데이터</h3>
                    <p style={{ color: "#888", fontSize: "14px", marginTop: "5px" }}>{selectedChallenge.description}</p>
                  </div>
                  <button onClick={() => setSelectedChallenge(null)} style={{ border: "none", background: "#f3f4f6", borderRadius: "50%", width: "35px", height: "35px", cursor: "pointer", fontWeight: "900" }}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "25px" }}>
                  <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "16px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "15px", color: "#4f46e5" }}>👥 참여자 리스트 ({selectedChallenge.participants}명)</h4>
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {["김루틴", "이갓생", "박미라클", "최열정", "정꾸준", "강도전"].map((user, i) => (
                        <div key={i} style={{ padding: "12px", borderBottom: "1px solid #eee", fontSize: "13px", display: "flex", justifyContent: "space-between", background: 'white', borderRadius: '8px', marginBottom: '8px' }}>
                          <span style={{ fontWeight: "700" }}>{user}</span>
                          <span style={{ fontWeight: "800", color: "#10b981" }}>85% 성공</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "16px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "15px", color: "#4f46e5" }}>📸 실시간 인증 현황</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", maxHeight: "300px", overflowY: "auto", paddingRight: "5px" }}>
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ background: "white", padding: "10px", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                          <div style={{ width: "100%", height: "80px", background: "#f0f0f0", borderRadius: "8px", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#999" }}>인증 미디어 영역</div>
                          <div style={{ fontSize: "11px", fontWeight: "800" }}>사용자_{i}</div>
                          <div style={{ fontSize: "9px", color: "#bbb", marginBottom: '5px' }}>05-12 08:30</div>
                          <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.4' }}>오늘도 기분 좋은 기상 완료!</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isChallengeModalOpen && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, backdropFilter: 'blur(4px)' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', width: '450px', boxShadow: '0 15px 40px rgba(0,0,0,0.2)' }}>
                  <h3 style={{ fontWeight: "900", fontSize: "18px", marginBottom: "20px", textAlign: "center" }}>{editingChallenge ? "📝 챌린지 정보 수정" : "🏆 새 챌린지 개설"}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="챌린지 제목" value={challengeForm.title} onChange={(e) => setChallengeForm({...challengeForm, title: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' }} />
                    <select value={challengeForm.category} onChange={(e) => setChallengeForm({...challengeForm, category: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}>
                      <option value="운동">운동</option><option value="생활습관">생활습관</option><option value="독서">독서</option><option value="학습">학습</option>
                    </select>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                         <label style={{ fontSize: '11px', color: '#999', marginLeft: '5px' }}>시작일</label>
                         <input type="date" value={challengeForm.startDate} onChange={(e) => setChallengeForm({...challengeForm, startDate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                         <label style={{ fontSize: '11px', color: '#999', marginLeft: '5px' }}>종료일</label>
                         <input type="date" value={challengeForm.endDate} onChange={(e) => setChallengeForm({...challengeForm, endDate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd' }} />
                      </div>
                    </div>
                    <textarea placeholder="챌린지 상세 설명" value={challengeForm.description} onChange={(e) => setChallengeForm({...challengeForm, description: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd', minHeight: '100px', resize: 'none' }} />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button className="routine-save-btn" onClick={handleSaveChallenge} style={{ flex: 2, padding: '15px' }}>{editingChallenge ? "수정 완료" : "챌린지 등록하기"}</button>
                      <button onClick={() => setIsChallengeModalOpen(false)} style={{ flex: 1, border: 'none', background: '#eee', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>취소</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "reports":
        return (
          <div className="page-container" style={{ padding: "20px" }}>
            <div className="routine-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h2 className="routine-title">🚩 부적절 게시글 제재 관리</h2>
                <p className="routine-subtitle">신고 분류를 기반으로 우선순위를 정해 게시물을 검토하세요.</p>
              </div>
              <div style={{ background: '#fff0f0', padding: '10px 15px', borderRadius: '10px', border: '1px solid #ffccc7' }}>
                <span style={{ fontSize: '12px', color: '#ff4d4f', fontWeight: '700' }}>미처리 신고</span>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#ff4d4f' }}>{pendingCount}건</div>
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
              <select onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <option value="desc">신고 많은 순</option><option value="asc">신고 적은 순</option>
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

            {/* ── [이전 짜드린 완성형 상세 검토 모달 디자인 시작] ── */}
            {selectedReport && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10002, backdropFilter: 'blur(5px)' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '28px', width: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontWeight: '950', fontSize: '20px' }}>🔎 게시글 신고 상세 검토</h3>
                    <button onClick={() => { setSelectedReport(null); setDeleteReasonText(""); }} style={{ border: 'none', background: '#f5f5f5', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: '900' }}>✕</button>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', background: '#fbfbff', padding: '20px', borderRadius: '20px', border: '1px solid #f0f0ff' }}>
                    <div style={{ width: '180px', height: '180px', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#eee', flexShrink: 0 }}>
                        {selectedReport.postContent.img && <img src={selectedReport.postContent.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="원본" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '900', color: '#4f46e5', fontSize: '14px', marginBottom: '8px' }}>작성 유저: {selectedReport.user}</div>
                      <div style={{ fontWeight: '800', fontSize: '17px', marginBottom: '12px', color: '#111' }}>{selectedReport.postContent.title}</div>
                      <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #eee' }}>{selectedReport.postContent.text || "본문 내용이 없습니다."}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '12px', color: '#333' }}>📢 신고 접수 내역 ({selectedReport.reportCount}건)</h4>
                    <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '15px', padding: '5px' }}>
                      {selectedReport.reporters.map((r, i) => (
                        <div key={i} style={{ fontSize: '12px', padding: '12px', borderBottom: i === selectedReport.reporters.length - 1 ? 'none' : '1px solid #f9f9f9', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '700', color: '#444' }}>{r.user} <span style={{fontWeight:'400', color:'#999', marginLeft:'5px'}}>| {r.reason}</span></span>
                          <span style={{ color: '#bbb' }}>{r.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedReport.status === "pending" ? (
                    <div style={{ padding: '20px', background: '#fffafa', borderRadius: '20px', border: '1px solid #ffebeb' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '10px', color: '#ff4d4f' }}>⚖️ 관리자 처분 결정</h4>
                      <textarea 
                        placeholder="해당 유저에게 전송될 구체적인 제재 사유를 입력하세요..." 
                        value={deleteReasonText}
                        onChange={(e) => setDeleteReasonText(e.target.value)}
                        style={{ width: '100%', padding: '15px', borderRadius: '14px', border: '1px solid #ffcccc', minHeight: '100px', marginBottom: '15px', outline: 'none', fontSize: '13px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="routine-delete-btn" onClick={() => handleConfirmDelete(selectedReport)} style={{ flex: 1.5, padding: '16px', borderRadius: '14px', fontSize: '14px' }}>게시글 삭제 및 제재 확정</button>
                        <button onClick={() => { setSelectedReport(null); setDeleteReasonText(""); }} style={{ flex: 1, border: 'none', background: '#eee', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>검토 보류</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '20px', border: '1px solid #bae7ff', color: '#0050b3', fontWeight: '800', textAlign: 'center' }}>
                      이미 처리가 완료된 신고건입니다. <br/>
                      <span style={{fontWeight:'500', fontSize:'13px', marginTop:'5px', display:'block'}}>관리자 의견: {selectedReport.adminComment}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* ── [상세 검토 모달 디자인 끝] ── */}
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
                        <option value="일반">일반</option><option value="이벤트">이벤트</option><option value="점검">점검</option><option value="업데이트">업데이트</option>
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

      default: // Dashboard
        return (
          <div className="page-container" style={{ padding: "20px" }}>
            <div className="routine-header">
              <h1 className="routine-title">갓생 통합 관리 시스템</h1>
              <p className="routine-subtitle">오늘의 주요 운영 현황 요약</p>
            </div>
            <div className="mypage-stats" style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              <StatCard title="오늘의 인증" value="1,892건" colorVar="success" />
              <StatCard title="미처리 신고" value={`${pendingCount}건`} colorVar="danger" />
              <StatCard title="진행 중 챌린지" value={`${challenges.length}개`} colorVar="primary" />
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
          {[
            { id: "dashboard", label: "홈" },
            { id: "challenges", label: "챌린지 관리" },
            { id: "reports", label: "신고 처리" },
            { id: "notice", label: "공지사항" },
            { id: "metrics", label: "서비스 지표" }
          ].map((menu) => (
            <button key={menu.id} onClick={() => { setCurrentMenu(menu.id); setSelectedReport(null); setSelectedChallenge(null); }} className={currentMenu === menu.id ? "active-time-tab" : ""}>{menu.label}</button>
          ))}
        </nav>
        <div className="nav"><button onClick={() => window.location.reload()} style={{ color: "var(--danger)" }}>로그아웃</button></div>
      </header>
      <main>{renderContent()}</main>
      <style>{`
        .routine-delete-btn { background-color: var(--danger); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 800; transition: 0.2s; }
        .routine-delete-btn:hover { opacity: 0.8; }
        .check-btn { background-color: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 800; padding: 8px 12px; transition: 0.2s; }
        .check-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); }
        .routine-save-btn { background-color: var(--primary); color: white; border: none; padding: 15px; border-radius: 12px; cursor: pointer; font-weight: 800; }
        .active-time-tab { background-color: var(--primary) !important; color: white !important; border-radius: 20px !important; }
        div::-webkit-scrollbar { width: 5px; }
        div::-webkit-scrollbar-track { background: transparent; }
        div::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default AdminPage;