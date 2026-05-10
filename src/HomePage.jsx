import { useState } from "react";

function HomePage({
  routines,
  onCompleteCheck,
  onCompleteDetail,
  onCancelComplete,
  // ── [Props 추가] 관리자 제재 알림 연동 ──
  deleteNotifications,
  setDeleteNotifications,
}) {
  const today = new Date();
  const dayIndex = today.getDay();
  const days = ["일", "월", "화", "수", "목", "금", "토"];

  const weekDates = days.map((_, index) => {
    const newDate = new Date(today);
    newDate.setDate(today.getDate() - dayIndex + index);
    return newDate;
  });

  const [time, setTime] = useState("morning");
  const [proofInputs, setProofInputs] = useState({});
  const [proofFiles, setProofFiles] = useState({});
  const [uploadChecks, setUploadChecks] = useState({});
  const [openProofId, setOpenProofId] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");

  const filteredRoutines = routines.filter((routine) => routine.time === time);

  const getTimeTitle = () => {
    if (time === "morning") return { title: "🌅 아침 루틴", range: "06:00 ~ 11:59" };
    if (time === "lunch") return { title: "🌤️ 점심 루틴", range: "12:00 ~ 17:59" };
    return { title: "🌙 저녁 루틴", range: "18:00 ~ 05:59" };
  };

  const getModeText = (mode) => (mode === "check" ? "체크 루틴" : "상세 루틴");

  const getRoutineTimeStatus = (routineTime) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (routineTime === "morning") {
      if (currentMinutes < 6 * 60) return "before";
      if (currentMinutes <= 11 * 60 + 59) return "active";
      return "after";
    }
    if (routineTime === "lunch") {
      if (currentMinutes < 12 * 60) return "before";
      if (currentMinutes <= 17 * 60 + 59) return "active";
      return "after";
    }
    if (currentMinutes >= 18 * 60 || currentMinutes <= 5 * 60 + 59) return "active";
    return "before";
  };

  const getCheckButtonText = (timeStatus) => {
    if (timeStatus === "before") return "인증 전";
    if (timeStatus === "after") return "인증 마감";
    return "오늘 완료";
  };

  const getDetailButtonText = (timeStatus) => {
    if (timeStatus === "before") return "인증 전";
    if (timeStatus === "after") return "인증 마감";
    return "인증하기";
  };

  const getDetailSubmitButtonText = (timeStatus) => {
    if (timeStatus === "before") return "인증 전";
    if (timeStatus === "after") return "인증 마감";
    return "인증 완료";
  };

  const handleProofChange = (id, value) => { setProofInputs((prev) => ({ ...prev, [id]: value })); };
  const handleUploadCheckChange = (id, checked) => { setUploadChecks((prev) => ({ ...prev, [id]: checked })); };

  const handleFileChange = (id, fileList) => {
    const previewFiles = Array.from(fileList).map((file) => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
    setProofFiles((prev) => ({ ...prev, [id]: previewFiles }));
  };

  const handleDetailSubmit = (id, routineTime) => {
    const timeStatus = getRoutineTimeStatus(routineTime);
    if (timeStatus !== "active") { alert("현재는 인증 가능한 시간이 아닙니다."); return; }

    const proofText = proofInputs[id]?.trim() || "";
    const selectedFiles = proofFiles[id] || [];
    const uploadToFeed = uploadChecks[id] || false;

    if (!proofText && selectedFiles.length === 0) { alert("인증 글이나 사진/영상을 추가해주세요."); return; }
    if (proofText.length > 200) { alert("200자 이하로 입력해주세요."); return; }

    onCompleteDetail(id, proofText, selectedFiles, uploadToFeed);
    setProofInputs((prev) => ({ ...prev, [id]: "" }));
    setProofFiles((prev) => ({ ...prev, [id]: [] }));
    setUploadChecks((prev) => ({ ...prev, [id]: false }));
    setOpenProofId(null);
  };

  const handleCheckComplete = (id, routineTime) => {
    if (getRoutineTimeStatus(routineTime) !== "active") { alert("현재는 인증 가능한 시간이 아닙니다."); return; }
    onCompleteCheck(id);
  };

  const handleCancelComplete = (id) => {
    if (window.confirm("루틴 완료를 취소하시겠습니까?")) onCancelComplete(id);
  };

  // ── [기능 추가] 알림 확인 버튼 클릭 시 알림 삭제 ──
  const handleCloseNoti = (id) => {
    setDeleteNotifications(prev => prev.filter(noti => noti.id !== id));
  };

  const currentSection = getTimeTitle();

  return (
    <div className="home">
      {/* ── [신규 추가] 관리자 제재 알림 중앙 모달 ── */}
      {deleteNotifications && deleteNotifications.length > 0 && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "white", padding: "30px", borderRadius: "20px",
            width: "90%", maxWidth: "400px", textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}>
            <div style={{ fontSize: "50px", marginBottom: "20px" }}>⚠️</div>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#333", marginBottom: "15px" }}>게시글 제재 안내</h2>
            <p style={{ fontSize: "15px", color: "#666", lineHeight: "1.6", marginBottom: "20px" }}>
              회원님의 게시글이<br />
              <strong>커뮤니티 가이드 위반</strong>으로 삭제되었습니다.
            </p>
            <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "10px", marginBottom: "25px", textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>삭제 대상: {deleteNotifications[0].routineTitle}</p>
              <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#ef4444", fontWeight: "700" }}>사유: {deleteNotifications[0].reason}</p>
            </div>
            <button 
              onClick={() => handleCloseNoti(deleteNotifications[0].id)}
              style={{
                width: "100%", padding: "15px", border: "none", borderRadius: "12px",
                backgroundColor: "#4f46e5", color: "white", fontWeight: "800", cursor: "pointer", fontSize: "16px"
              }}
            >
              내용을 확인했습니다
            </button>
          </div>
        </div>
      )}

      <div className="week">
        {weekDates.map((weekDate, index) => (
          <div key={index} className={index === dayIndex ? "day active" : "day"}>
            <p>{days[index]}</p>
            <p>{weekDate.getDate()}</p>
          </div>
        ))}
      </div>

      <div className="time-tabs">
        {["morning", "lunch", "dinner"].map((t) => (
          <button key={t} className={time === t ? "active-time-tab" : ""} onClick={() => setTime(t)}>
            {t === "morning" ? "아침" : t === "lunch" ? "점심" : "저녁"}
          </button>
        ))}
      </div>

      <div className="routine-content">
        <h2 className="home-section-title">
          {currentSection.title}
          <span className="home-section-time"> {currentSection.range}</span>
        </h2>

        {filteredRoutines.length === 0 ? (
          <p className="empty-routine-text">이 시간대에 등록된 루틴이 아직 없어요.</p>
        ) : (
          <div className="home-routine-list">
            {filteredRoutines.map((routine) => {
              const timeStatus = getRoutineTimeStatus(routine.time);
              const isDisabled = !routine.completed && timeStatus !== "active";

              return (
                <div className={`home-routine-card ${routine.completed ? "home-routine-card-completed" : ""}`} key={routine.id}>
                  <div className="home-routine-card-left">
                    <div className="home-routine-card-top">
                      <h3 onClick={() => setSelectedTitle(routine.title)}>{routine.title}</h3>
                      <span className="home-routine-badge">{routine.category}</span>
                    </div>
                    <p className="home-routine-type">{getModeText(routine.routineMode)}</p>
                    <p className="home-routine-desc">{routine.description || "루틴 설명이 아직 없습니다."}</p>
                    <div className="home-routine-meta">
                      {routine.goal && <span>{routine.goal}</span>}
                      {routine.repeat && <span>{routine.repeat}</span>}
                    </div>
                  </div>

                  <div className="home-routine-card-right">
                    {routine.completed ? (
                      <button type="button" className="home-complete-box" onClick={() => handleCancelComplete(routine.id)}>
                        <p className="home-complete-text">완료 시간: {routine.completedAt}</p>
                        {routine.proofText && <p className="home-proof-text">{routine.proofText}</p>}
                        {routine.proofFiles?.length > 0 && (
                          <div className="proof-preview-list completed-proof-preview-list">
                            {routine.proofFiles.map((f, i) => (
                              <div key={i} className="proof-preview-item">
                                {f.type.startsWith("image/") ? <img src={f.url} alt="" className="proof-preview-media" /> : <video src={f.url} controls className="proof-preview-media" />}
                              </div>
                            ))}
                          </div>
                        )}
                      </button>
                    ) : routine.routineMode === "check" ? (
                      <button className="routine-check-btn home-action-btn" onClick={() => handleCheckComplete(routine.id, routine.time)} disabled={isDisabled}>
                        {getCheckButtonText(timeStatus)}
                      </button>
                    ) : (
                      <div className="home-detail-action">
                        {openProofId === routine.id ? (
                          <div className="proof-box">
                            <textarea placeholder="오늘 루틴 인증 내용을 입력하세요 (최대 200자)" value={proofInputs[routine.id] || ""} onChange={(e) => handleProofChange(routine.id, e.target.value)} maxLength={200} />
                            <label className="proof-file-label">사진 / 영상 추가 <input type="file" accept="image/*,video/*" multiple onChange={(e) => handleFileChange(routine.id, e.target.files)} /></label>
                            {proofFiles[routine.id]?.length > 0 && (
                              <div className="proof-preview-list">
                                {proofFiles[routine.id].map((f, i) => (
                                  <div key={i} className="proof-preview-item">
                                    {f.type.startsWith("image/") ? <img src={f.url} alt="" className="proof-preview-media" /> : <video src={f.url} controls className="proof-preview-media" />}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="feed-upload-check">
                              <input type="checkbox" id={`feed-upload-${routine.id}`} checked={uploadChecks[routine.id] || false} onChange={(e) => handleUploadCheckChange(routine.id, e.target.checked)} />
                              <label htmlFor={`feed-upload-${routine.id}`}>피드에도 올리기</label>
                            </div>
                            <button className="proof-save-btn" onClick={() => handleDetailSubmit(routine.id, routine.time)} disabled={isDisabled}>
                              {getDetailSubmitButtonText(timeStatus)}
                            </button>
                          </div>
                        ) : (
                          <button className="routine-detail-btn home-action-btn" onClick={() => setOpenProofId(routine.id)} disabled={isDisabled}>
                            {getDetailButtonText(timeStatus)}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedTitle && (
        <div className="title-modal-overlay" onClick={() => setSelectedTitle("")}>
          <div className="title-modal" onClick={(e) => e.stopPropagation()}>
            <p>{selectedTitle}</p>
            <button onClick={() => setSelectedTitle("")}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;