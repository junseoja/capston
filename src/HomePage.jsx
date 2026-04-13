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
  // 루틴별 파일 상태 관리
  const [proofFiles, setProofFiles] = useState({});
  // 피드 업로드 체크 상태
  const [uploadChecks, setUploadChecks] = useState({});
  // 인증 박스 열림 상태
  const [openProofId, setOpenProofId] = useState(null);

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

  // 루틴 시간 상태 확인
  // before: 아직 시작 전
  // active: 인증 가능
  // after: 인증 마감
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

    // dinner: 18:00 ~ 다음날 05:59
    if (currentMinutes >= 18 * 60 || currentMinutes <= 5 * 60 + 59) {
      return "active";
    }

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

  const handleProofChange = (id, value) => {
    setProofInputs((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

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

  const handleDetailSubmit = (id, routineTime) => {
    const timeStatus = getRoutineTimeStatus(routineTime);

    if (timeStatus !== "active") {
      alert("현재는 인증 가능한 시간이 아닙니다.");
      return;
    }

    const proofText = proofInputs[id]?.trim() || "";
    const selectedFiles = proofFiles[id] || [];
    const uploadToFeed = uploadChecks[id] || false;

    if (!proofText && selectedFiles.length === 0) {
      alert("인증 글이나 사진/영상을 추가해주세요.");
      return;
    }

    if (proofText.length > 200) {
      alert("200자 이하로 입력해주세요.");
      return;
    }

    onCompleteDetail(id, proofText, selectedFiles, uploadToFeed);

    setProofInputs((prev) => ({ ...prev, [id]: "" }));
    setProofFiles((prev) => ({ ...prev, [id]: [] }));
    setUploadChecks((prev) => ({ ...prev, [id]: false }));
    setOpenProofId(null);
  };

  const handleCheckComplete = (id, routineTime) => {
    const timeStatus = getRoutineTimeStatus(routineTime);

    if (timeStatus !== "active") {
      alert("현재는 인증 가능한 시간이 아닙니다.");
      return;
    }

    onCompleteCheck(id);
  };

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
            {filteredRoutines.map((routine) => {
              const timeStatus = getRoutineTimeStatus(routine.time);
              const isDisabled =
                !routine.completed && timeStatus !== "active";

              return (
                <div
                  className={`home-routine-card ${
                    routine.completed ? "home-routine-card-completed" : ""
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
                          <p className="home-proof-text">
                            {routine.proofText}
                          </p>
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
                    ) : routine.routineMode === "check" ? (
                      <button
                        className="routine-check-btn home-action-btn"
                        onClick={() =>
                          handleCheckComplete(routine.id, routine.time)
                        }
                        disabled={isDisabled}
                      >
                        {getCheckButtonText(timeStatus)}
                      </button>
                    ) : (
                      <div className="home-detail-action">
                        {openProofId === routine.id ? (
                          <div className="proof-box">
                            <textarea
                              placeholder="오늘 루틴 인증 내용을 입력하세요 (최대 200자)"
                              value={proofInputs[routine.id] || ""}
                              onChange={(e) =>
                                handleProofChange(routine.id, e.target.value)
                              }
                              maxLength={200}
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

                            {proofFiles[routine.id] &&
                              proofFiles[routine.id].length > 0 && (
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
                                      ) : file.type.startsWith("video/") ? (
                                        <video
                                          src={file.url}
                                          controls
                                          className="proof-preview-media"
                                        />
                                      ) : (
                                        <p className="proof-file-name">
                                          {file.name}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                            <label>
                              <input
                                type="checkbox"
                                checked={uploadChecks[routine.id] || false}
                                onChange={(e) =>
                                  handleUploadCheckChange(
                                    routine.id,
                                    e.target.checked
                                  )
                                }
                              />{" "}
                              피드에도 올리기
                            </label>

                            <button
                              className="proof-save-btn"
                              onClick={() =>
                                handleDetailSubmit(routine.id, routine.time)
                              }
                              disabled={isDisabled}
                            >
                              {getDetailSubmitButtonText(timeStatus)}
                            </button>
                          </div>
                        ) : (
                          <button
                            className="routine-detail-btn home-action-btn"
                            onClick={() => setOpenProofId(routine.id)}
                            disabled={isDisabled}
                          >
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
    </div>
  );
}

export default HomePage;