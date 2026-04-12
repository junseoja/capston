// 홈 페이지 컴포넌트
// - 이번 주 날짜 캘린더 표시
// - 아침/점심/저녁 탭으로 시간대별 루틴 목록 표시
// - 체크 루틴: 버튼 클릭으로 완료 처리
// - 상세 루틴: 인증 글 + 사진/영상 첨부 후 완료 처리 (피드 업로드 옵션 포함)
//
// 주의: routines 데이터는 App.jsx에서 fetch하여 props로 전달받음
//       (RoutinePage와 동일한 데이터를 공유하기 위해 중앙 관리)

import { useState } from "react";

// props:
//   routines         - App.jsx에서 fetch + 필드 매핑된 루틴 배열
//   onCompleteCheck  - 체크 루틴 완료 처리 함수 (App.jsx)
//   onCompleteDetail - 상세 루틴 완료 처리 함수 (App.jsx)
//   onCancelComplete - 루틴 완료 취소 함수 (App.jsx)
function HomePage({
  routines,
  onCompleteCheck,
  onCompleteDetail,
  onCancelComplete,
}) {
  const today = new Date();
  const dayIndex = today.getDay(); // 0(일) ~ 6(토)
  const days = ["일", "월", "화", "수", "목", "금", "토"];

  // 이번 주 일요일부터 토요일까지의 Date 객체 배열 생성
  const weekDates = days.map((_, index) => {
    const newDate = new Date(today);
    newDate.setDate(today.getDate() - dayIndex + index); // 오늘 기준 앞뒤로 날짜 계산
    return newDate;
  });

  // 현재 선택된 시간대 탭 (morning / lunch / dinner)
  const [time, setTime] = useState("morning");

  // 상세 루틴 인증 글 입력값 - { [루틴 id]: "입력값" } 형태로 루틴별 독립 관리
  const [proofInputs, setProofInputs] = useState({});

  // 상세 루틴 첨부 파일 - { [루틴 id]: [{ name, type, url }] } 형태
  const [proofFiles, setProofFiles] = useState({});

  // 피드 업로드 체크박스 상태 - { [루틴 id]: boolean }
  const [uploadChecks, setUploadChecks] = useState({});

  // 현재 열려있는 인증 박스의 루틴 id (하나만 열 수 있음)
  const [openProofId, setOpenProofId] = useState(null);

  // 선택된 시간대(time)에 해당하는 루틴만 필터링
  // App.jsx에서 time_slot → time 으로 필드 매핑되어 있음
  const filteredRoutines = routines.filter((routine) => routine.time === time);

  // 현재 시간대의 제목과 시간 범위 반환
  const getTimeTitle = () => {
    if (time === "morning") return { title: "🌅 아침 루틴", range: "06:00 ~ 11:59" };
    if (time === "lunch")   return { title: "🍱 점심 루틴", range: "12:00 ~ 17:59" };
    return                         { title: "🌙 저녁 루틴", range: "18:00 ~ 05:59" };
  };

  // 루틴 모드 한글 텍스트 반환
  // App.jsx에서 routine_mode → routineMode 로 필드 매핑되어 있음
  const getModeText = (mode) => {
    return mode === "check" ? "체크 루틴" : "상세 루틴";
  };

  // 상세 루틴 인증 글 입력 핸들러
  const handleProofChange = (id, value) => {
    setProofInputs((prev) => ({
      ...prev,
      [id]: value, // 해당 루틴의 입력값만 업데이트, 다른 루틴에 영향 없음
    }));
  };

  // 피드 업로드 체크박스 변경 핸들러
  const handleUploadCheckChange = (id, checked) => {
    setUploadChecks((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  // 파일 선택 핸들러
  // FileList → 배열로 변환 후 브라우저 미리보기용 Object URL 생성
  const handleFileChange = (id, fileList) => {
    const selectedFiles = Array.from(fileList);

    const previewFiles = selectedFiles.map((file) => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file), // 메모리에 임시 URL 생성 (페이지 새로고침 시 소멸)
    }));

    setProofFiles((prev) => ({
      ...prev,
      [id]: previewFiles,
    }));
  };

  // 상세 루틴 인증 제출 핸들러
  // 유효성 검사 후 App.jsx의 onCompleteDetail 호출 → 완료 처리 및 피드 업로드
  const handleDetailSubmit = (id) => {
    const proofText = proofInputs[id]?.trim() || "";
    const selectedFiles = proofFiles[id] || [];
    const uploadToFeed = uploadChecks[id] || false;

    // 인증 글과 파일 둘 다 없으면 제출 불가
    if (!proofText && selectedFiles.length === 0) {
      alert("인증 글이나 사진/영상을 추가해주세요.");
      return;
    }

    // 인증 글 200자 초과 제한
    if (proofText.length > 200) {
      alert("200자 이하로 입력해주세요.");
      return;
    }

    // 부모(App.jsx)에 완료 처리 위임
    onCompleteDetail(id, proofText, selectedFiles, uploadToFeed);

    // 인증 박스 초기화 및 닫기
    setProofInputs((prev) => ({ ...prev, [id]: "" }));
    setProofFiles((prev) => ({ ...prev, [id]: [] }));
    setUploadChecks((prev) => ({ ...prev, [id]: false }));
    setOpenProofId(null);
  };

  // 루틴 완료 취소 핸들러 - confirm 후 App.jsx의 onCancelComplete 호출
  const handleCancelComplete = (id) => {
    const isConfirmed = window.confirm("루틴 완료를 취소하시겠습니까?");
    if (isConfirmed) {
      onCancelComplete(id); // 완료 상태 초기화 + 피드에서 해당 게시물 제거
    }
  };

  const currentSection = getTimeTitle();

  return (
    <div className="home">
      {/* ── 이번 주 날짜 캘린더 ── */}
      <div className="week">
        {weekDates.map((weekDate, index) => (
          <div
            key={index}
            className={index === dayIndex ? "day active" : "day"} // 오늘 날짜 강조 표시
          >
            <p>{days[index]}</p>
            <p>{weekDate.getDate()}</p>
          </div>
        ))}
      </div>

      {/* ── 시간대 탭 ── */}
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

      {/* ── 루틴 목록 ── */}
      <div className="routine-content">
        {/* 현재 시간대 제목 및 시간 범위 */}
        <h2 className="home-section-title">
          {currentSection.title}
          <span className="home-section-time"> {currentSection.range}</span>
        </h2>

        {/* 해당 시간대 루틴 없을 때 안내 문구 */}
        {filteredRoutines.length === 0 ? (
          <p className="empty-routine-text">
            이 시간대에 등록된 루틴이 아직 없어요.
          </p>
        ) : (
          <div className="home-routine-list">
            {filteredRoutines.map((routine) => (
              <div
                className={`home-routine-card ${routine.completed ? "home-routine-card-completed" : ""}`}
                key={routine.id} // App.jsx에서 routine_id → id 로 매핑됨
              >
                {/* 루틴 정보 (왼쪽 영역) */}
                <div className="home-routine-card-left">
                  <div className="home-routine-card-top">
                    <h3>{routine.title}</h3>
                    <span className="home-routine-badge">{routine.category}</span>
                  </div>

                  {/* 루틴 모드: App.jsx에서 routine_mode → routineMode 로 매핑됨 */}
                  <p className="home-routine-type">{getModeText(routine.routineMode)}</p>

                  <p className="home-routine-desc">
                    {routine.description || "루틴 설명이 아직 없습니다."}
                  </p>

                  <div className="home-routine-meta">
                    {routine.goal && <span>{routine.goal}</span>}
                    {/* repeat: App.jsx에서 repeat_cycle → repeat 로 매핑됨 */}
                    {routine.repeat && <span>{routine.repeat}</span>}
                  </div>
                </div>

                {/* 완료 버튼 / 인증 박스 (오른쪽 영역) */}
                <div className="home-routine-card-right">
                  {routine.completed ? (
                    // ── 완료된 루틴: 완료 정보 표시, 클릭하면 완료 취소 ──
                    <button
                      type="button"
                      className="home-complete-box"
                      onClick={() => handleCancelComplete(routine.id)}
                    >
                      <p className="home-complete-text">
                        완료 시간: {routine.completedAt}
                      </p>

                      {/* 상세 루틴 인증 글 표시 */}
                      {routine.proofText && (
                        <p className="home-proof-text">{routine.proofText}</p>
                      )}

                      {/* 첨부 파일 미리보기 (이미지/영상) */}
                      {routine.proofFiles && routine.proofFiles.length > 0 && (
                        <div className="proof-preview-list completed-proof-preview-list">
                          {routine.proofFiles.map((file, index) => (
                            <div key={index} className="proof-preview-item">
                              {file.type.startsWith("image/") ? (
                                <img src={file.url} alt="" className="proof-preview-media" />
                              ) : file.type.startsWith("video/") ? (
                                <video src={file.url} controls className="proof-preview-media" />
                              ) : (
                                <p>{file.name}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  ) : (
                    // ── 미완료 루틴: 체크 or 상세 인증 버튼 ──
                    <>
                      {routine.routineMode === "check" ? (
                        // 체크 루틴 - 버튼 하나로 즉시 완료
                        <button
                          className="routine-check-btn home-action-btn"
                          onClick={() => onCompleteCheck(routine.id)}
                        >
                          오늘 완료
                        </button>
                      ) : (
                        // 상세 루틴 - 인증 박스 토글
                        <div className="home-detail-action">
                          {/* 인증 박스가 닫혀있을 때만 인증하기 버튼 표시 */}
                          {openProofId !== routine.id && (
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
                          )}

                          {/* 인증 박스 - "인증하기" 버튼 클릭 시 열림 */}
                          {openProofId === routine.id && (
                            <div className="proof-box">
                              {/* 인증 글 textarea (최대 200자) */}
                              <textarea
                                maxLength={200}
                                placeholder="오늘 하루를 기록해보세요"
                                value={proofInputs[routine.id] || ""}
                                onChange={(e) =>
                                  handleProofChange(routine.id, e.target.value)
                                }
                              />

                              {/* 글자수 카운터 */}
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#6b7280",
                                  textAlign: "right",
                                  margin: "0",
                                }}
                              >
                                {(proofInputs[routine.id]?.length || 0)}/200
                              </p>

                              {/* 파일 첨부 버튼 (이미지/영상 다중 선택 가능) */}
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

                              {/* 피드 업로드 체크박스 */}
                              <label className="feed-upload-check">
                                <input
                                  type="checkbox"
                                  checked={uploadChecks[routine.id] || false}
                                  onChange={(e) =>
                                    handleUploadCheckChange(
                                      routine.id,
                                      e.target.checked
                                    )
                                  }
                                />
                                <span>피드에도 업로드하기</span>
                              </label>

                              {/* 첨부 파일 미리보기 */}
                              {proofFiles[routine.id]?.length > 0 && (
                                <div className="proof-preview-list">
                                  {proofFiles[routine.id].map((file, index) => (
                                    <div key={index} className="proof-preview-item">
                                      {file.type.startsWith("image/") ? (
                                        <img src={file.url} alt="" className="proof-preview-media" />
                                      ) : (
                                        <video src={file.url} controls className="proof-preview-media" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* 인증 완료 제출 버튼 */}
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
