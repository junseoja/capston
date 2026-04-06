import { useState } from "react";

function HomePage({
  routines,
  onCompleteCheck,
  onCompleteDetail,
  onCancelComplete,
}) {
  const today = new Date();
  const dayIndex = today.getDay();
  const days = ["일", "월", "화", "수", "목", "금", "토"];

  const weekDates = days.map((_, index) => {
    const newDate = new Date(today);
    newDate.setDate(today.getDate() - dayIndex + index);
    return newDate;
  });

  // 시간대 상태 관리
  const [time, setTime] = useState("morning");
  // 인증 글과 파일 상태 관리
  const [proofInputs, setProofInputs] = useState({});
  // 루틴별로 파일 상태를 객체 형태로 관리 (예: { routineId: [file1, file2] })
  const [proofFiles, setProofFiles] = useState({});
  // 루틴 완료 (체크형)
  const [uploadChecks, setUploadChecks] = useState({});
  // 인증 박스 열림 상태 관리
  const [openProofId, setOpenProofId] = useState(null);
  // 루틴 완료 (체크형)
  const filteredRoutines = routines.filter((routine) => routine.time === time);

  const getTimeTitle = () => {
    if (time === "morning") {
      return { title: "🌅 아침 루틴", range: "06:00 ~ 11:59" };
    }
    if (time === "lunch") {
      return { title: "🍱 점심 루틴", range: "12:00 ~ 17:59" };
    }
    return { title: "🌙 저녁 루틴", range: "18:00 ~ 05:59" };
  };

  const getModeText = (mode) => {
    return mode === "check" ? "체크 루틴" : "상세 루틴";
  };

  const handleProofChange = (id, value) => {
    setProofInputs((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // 체크박스 변경 함수 (ui랑 실제 데이터 연결)
  const handleUploadCheckChange = (id, checked) => {
    setUploadChecks((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const handleFileChange = (id, fileList) => {
    const selectedFiles = Array.from(fileList);

    const previewFiles = selectedFiles.map((file) => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    setProofFiles((prev) => ({
      ...prev,
      [id]: previewFiles,
    }));
  };

  // 상세 루틴 인증 제출
  const handleDetailSubmit = (id) => {
    const proofText = proofInputs[id]?.trim() || "";
    const selectedFiles = proofFiles[id] || [];
    const uploadToFeed = uploadChecks[id] || false;

    if (!proofText && selectedFiles.length === 0) {
      alert("인증 글이나 사진/영상을 추가해주세요.");
      return;
    }

    onCompleteDetail(id, proofText, selectedFiles, uploadToFeed);

    setProofInputs((prev) => ({ ...prev, [id]: "" }));
    setProofFiles((prev) => ({ ...prev, [id]: [] }));
    setUploadChecks((prev) => ({ ...prev, [id]: false }));
    setOpenProofId(null);
  };

  // 완료 취소 확인
  const handleCancelComplete = (id) => {
    const isConfirmed = window.confirm("루틴 완료를 취소하시겠습니까?");
    if (isConfirmed) {
      onCancelComplete(id);
    }
  };

  const currentSection = getTimeTitle();

  return (
    <div className="home">
      <div className="week">
        {weekDates.map((weekDate, index) => (
          <div
            key={index}
            className={index === dayIndex ? "day active" : "day"}
          >
            <p>{days[index]}</p>
            <p>{weekDate.getDate()}</p>
          </div>
        ))}
      </div>

      <div className="time-tabs">
        <button
          className={time === "morning" ? "active-time-tab" : ""}
          onClick={() => setTime("morning")}
        >
          아침
        </button>
        <button
          className={time === "lunch" ? "active-time-tab" : ""}
          onClick={() => setTime("lunch")}
        >
          점심
        </button>
        <button
          className={time === "dinner" ? "active-time-tab" : ""}
          onClick={() => setTime("dinner")}
        >
          저녁
        </button>
      </div>

      <div className="routine-content">
        <h2 className="home-section-title">
          {currentSection.title}
          <span className="home-section-time"> {currentSection.range}</span>
        </h2>

        {filteredRoutines.length === 0 ? (
          <p className="empty-routine-text">
            이 시간대에 등록된 루틴이 아직 없어요.
          </p>
        ) : (
          <div className="home-routine-list">
            {filteredRoutines.map((routine) => (
              <div
                className={`home-routine-card ${routine.completed ? "home-routine-card-completed" : ""
                  }`}
                key={routine.id}
              >
                <div className="home-routine-card-left">
                  <div className="home-routine-card-top">
                    <h3>{routine.title}</h3>
                    <span className="home-routine-badge">
                      {routine.category}
                    </span>
                  </div>

                  <p className="home-routine-type">
                    {getModeText(routine.routineMode)}
                  </p>

                  <p className="home-routine-desc">
                    {routine.description || "루틴 설명이 아직 없습니다."}
                  </p>

                  <div className="home-routine-meta">
                    {routine.goal && <span>{routine.goal}</span>}
                    {routine.repeat && <span>{routine.repeat}</span>}
                  </div>
                </div>

                <div className="home-routine-card-right">
                  {routine.completed ? (
                    <button
                      type="button"
                      className="home-complete-box"
                      onClick={() => handleCancelComplete(routine.id)}
                    >
                      <p className="home-complete-text">
                        완료 시간: {routine.completedAt}
                      </p>

                      {routine.proofText && (
                        <p className="home-proof-text">{routine.proofText}</p>
                      )}

                      {routine.proofFiles &&
                        routine.proofFiles.length > 0 && (
                          <div className="proof-preview-list completed-proof-preview-list">
                            {routine.proofFiles.map((file, index) => (
                              <div key={index} className="proof-preview-item">
                                {file.type.startsWith("image/") ? (
                                  <img
                                    src={file.url}
                                    alt=""
                                    className="proof-preview-media"
                                  />
                                ) : file.type.startsWith("video/") ? (
                                  <video
                                    src={file.url}
                                    controls
                                    className="proof-preview-media"
                                  />
                                ) : (
                                  <p>{file.name}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                    </button>
                  ) : (
                    <>
                      {routine.routineMode === "check" ? (
                        <button
                          className="routine-check-btn home-action-btn"
                          onClick={() => onCompleteCheck(routine.id)}
                        >
                          오늘 완료
                        </button>
                      ) : (
                        <div className="home-detail-action">
                          <button
                            className="routine-detail-btn home-action-btn"
                            onClick={() =>
                              setOpenProofId(
                                openProofId === routine.id ? null : routine.id
                              )
                            }
                          >
                            인증하기
                          </button>

                          {openProofId === routine.id && (
                            <div className="proof-box">
                              <textarea
                                placeholder="오늘 하루를 기록해보세요"
                                value={proofInputs[routine.id] || ""}
                                onChange={(e) =>
                                  handleProofChange(routine.id, e.target.value)
                                }
                              />

                              <label className="proof-file-label">
                                사진 / 영상 추가
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  multiple
                                  onChange={(e) =>
                                    handleFileChange(routine.id, e.target.files)
                                  }
                                />
                              </label>

                              <label className="feed-upload-check">
                                <input
                                  type="checkbox"
                                  checked={uploadChecks[routine.id] || false}
                                  onChange={(e) =>
                                    handleUploadCheckChange(routine.id, e.target.checked)
                                  }
                                />
                                <span>피드에도 업로드하기</span>
                              </label>

                              {proofFiles[routine.id]?.length > 0 && (
                                <div className="proof-preview-list">
                                  {proofFiles[routine.id].map((file, index) => (
                                    <div
                                      key={index}
                                      className="proof-preview-item"
                                    >
                                      {file.type.startsWith("image/") ? (
                                        <img
                                          src={file.url}
                                          alt=""
                                          className="proof-preview-media"
                                        />
                                      ) : (
                                        <video
                                          src={file.url}
                                          controls
                                          className="proof-preview-media"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              <button
                                className="proof-save-btn"
                                onClick={() => handleDetailSubmit(routine.id)}
                              >
                                인증 완료
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;