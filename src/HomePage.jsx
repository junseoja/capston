import { useState, useEffect } from "react"; // ✅ useEffect 추가 - 페이지 로딩 시 데이터 가져오기

function HomePage() { // ✅ props 제거 - 백엔드에서 직접 데이터 가져오도록 변경
    const today = new Date(); // 오늘 날짜
    const dayIndex = today.getDay(); // 오늘 요일 인덱스 (0: 일요일 ~ 6: 토요일)
    const days = ["일", "월", "화", "수", "목", "금", "토"]; // 요일 배열

    // 이번 주 날짜 배열 생성 (일요일부터 토요일까지)
    const weekDates = days.map((_, index) => {
        const newDate = new Date(today);
        newDate.setDate(today.getDate() - dayIndex + index);
        return newDate;
    });

    // 현재 선택된 시간대 상태 (morning: 아침, lunch: 점심, dinner: 저녁)
    const [time, setTime] = useState("morning");

    // 상세 루틴 인증 글 입력값 상태 (루틴 id별로 관리)
    const [proofInputs, setProofInputs] = useState({});

    // 상세 루틴 인증 파일 상태 (루틴 id별로 관리)
    const [proofFiles, setProofFiles] = useState({});

    // 피드 업로드 체크박스 상태 (루틴 id별로 관리)
    const [uploadChecks, setUploadChecks] = useState({});

    // 현재 열려있는 인증 박스의 루틴 id
    const [openProofId, setOpenProofId] = useState(null);

    // ✅ 추가 - 백엔드에서 가져온 루틴 목록 상태
    const [routines, setRoutines] = useState([]);

    // ✅ 추가 - 페이지 로딩 시 루틴 목록 가져오기
    useEffect(() => {
        fetchRoutines();
    }, []);

    // ✅ 추가 - 백엔드 /routine API 호출하여 루틴 목록 가져오기
    const fetchRoutines = async () => {
        try {
            const res = await fetch("http://localhost:3000/routine", {
                credentials: "include" // 쿠키 포함 (로그인 세션 확인용)
            });
            const data = await res.json();
            if (data.success) setRoutines(data.routines); // 루틴 목록 상태 업데이트
        } catch (error) {
            console.error("루틴 목록 가져오기 실패:", error);
        }
    };

    // ✅ 변경 - time_slot으로 필터링 (DB 컬럼명에 맞게 변경)
    // 선택된 시간대에 해당하는 루틴만 필터링
    const filteredRoutines = routines.filter((routine) => routine.time_slot === time);

    // 시간대별 제목과 시간 범위 반환
    const getTimeTitle = () => {
        if (time === "morning") return { title: "🌅 아침 루틴", range: "06:00 ~ 11:59" };
        if (time === "lunch") return { title: "🍱 점심 루틴", range: "12:00 ~ 17:59" };
        return { title: "🌙 저녁 루틴", range: "18:00 ~ 05:59" };
    };

    // 루틴 모드 텍스트 반환 (check: 체크 루틴, detail: 상세 루틴)
    const getModeText = (mode) => {
        return mode === "check" ? "체크 루틴" : "상세 루틴";
    };

    // 상세 루틴 인증 글 입력값 변경 핸들러
    const handleProofChange = (id, value) => {
        setProofInputs((prev) => ({
            ...prev,
            [id]: value, // 해당 루틴 id의 입력값만 업데이트
        }));
    };

    // 피드 업로드 체크박스 변경 핸들러
    const handleUploadCheckChange = (id, checked) => {
        setUploadChecks((prev) => ({
            ...prev,
            [id]: checked, // 해당 루틴 id의 체크 상태만 업데이트
        }));
    };

    // 파일 선택 핸들러 - 선택한 파일을 미리보기 URL과 함께 저장
    const handleFileChange = (id, fileList) => {
        const selectedFiles = Array.from(fileList);

        // 파일 미리보기 URL 생성
        const previewFiles = selectedFiles.map((file) => ({
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file), // 브라우저에서 미리보기 가능한 임시 URL 생성
        }));

        setProofFiles((prev) => ({
            ...prev,
            [id]: previewFiles, // 해당 루틴 id의 파일 목록만 업데이트
        }));
    };

    // ✅ 변경 - routine_id 사용 (DB 컬럼명에 맞게 변경)
    // 체크 루틴 완료 처리 - 현재 시간을 완료 시간으로 저장
    const completeCheckRoutine = (id) => {
        const now = new Date();
        const timeText = now.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });

        // 해당 루틴의 completed 상태를 true로 변경
        setRoutines((prev) =>
            prev.map((r) => r.routine_id === id
                ? { ...r, completed: true, completedAt: timeText }
                : r
            )
        );
    };

    // ✅ 변경 - routine_id 사용
    // 상세 루틴 완료 처리 - 인증 글, 파일, 피드 업로드 여부 저장
    const completeDetailRoutine = (id, proofText, proofFiles, uploadToFeed) => {
        const now = new Date();
        const timeText = now.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });

        // 해당 루틴의 완료 상태 및 인증 데이터 업데이트
        setRoutines((prev) =>
            prev.map((r) => r.routine_id === id
                ? { ...r, completed: true, completedAt: timeText, proofText, proofFiles }
                : r
            )
        );

        // 피드 업로드 체크 시 피드에 게시글 추가 (나중에 백엔드 연결 예정)
        // if (uploadToFeed) { ... }
    };

    // ✅ 변경 - routine_id 사용
    // 루틴 완료 취소 처리 - 완료 상태 초기화
    const cancelRoutineCompletion = (id) => {
        const isConfirmed = window.confirm("루틴 완료를 취소하시겠습니까?");
        if (!isConfirmed) return;

        // 해당 루틴의 completed 상태를 false로 초기화
        setRoutines((prev) =>
            prev.map((r) => r.routine_id === id
                ? { ...r, completed: false, completedAt: "", proofText: "", proofFiles: [] }
                : r
            )
        );
    };

    // ✅ 변경 - routine_id 사용
    // 상세 루틴 인증 완료 제출 핸들러
    const handleDetailSubmit = (id) => {
        const proofText = proofInputs[id]?.trim() || "";
        const selectedFiles = proofFiles[id] || [];
        const uploadToFeed = uploadChecks[id] || false;

        // 인증 글이나 파일 중 하나는 있어야 함
        if (!proofText && selectedFiles.length === 0) {
            alert("인증 글이나 사진/영상을 추가해주세요.");
            return;
        }

        // 인증 글 200자 제한
        if (proofText.length > 200) {
            alert("200자 이하로 입력해주세요.");
            return;
        }

        // 상세 루틴 완료 처리
        completeDetailRoutine(id, proofText, selectedFiles, uploadToFeed);

        // 입력값 초기화
        setProofInputs((prev) => ({ ...prev, [id]: "" }));
        setProofFiles((prev) => ({ ...prev, [id]: [] }));
        setUploadChecks((prev) => ({ ...prev, [id]: false }));
        setOpenProofId(null); // 인증 박스 닫기
    };

    const currentSection = getTimeTitle(); // 현재 시간대 제목과 범위

    return (
        <div className="home">
            {/* 이번 주 날짜 표시 */}
            <div className="week">
                {weekDates.map((weekDate, index) => (
                    <div
                        key={index}
                        className={index === dayIndex ? "day active" : "day"} // 오늘 날짜 강조
                    >
                        <p>{days[index]}</p>
                        <p>{weekDate.getDate()}</p>
                    </div>
                ))}
            </div>

            {/* 시간대 탭 (아침 / 점심 / 저녁) */}
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
                {/* 현재 시간대 제목 및 시간 범위 */}
                <h2 className="home-section-title">
                    {currentSection.title}
                    <span className="home-section-time"> {currentSection.range}</span>
                </h2>

                {/* 해당 시간대 루틴이 없을 때 */}
                {filteredRoutines.length === 0 ? (
                    <p className="empty-routine-text">
                        이 시간대에 등록된 루틴이 아직 없어요.
                    </p>
                ) : (
                    <div className="home-routine-list">
                        {/* ✅ 변경 - routine_id를 key로 사용 */}
                        {filteredRoutines.map((routine) => (
                            <div
                                className={`home-routine-card ${routine.completed ? "home-routine-card-completed" : ""}`}
                                key={routine.routine_id} // ✅ id → routine_id
                            >
                                <div className="home-routine-card-left">
                                    <div className="home-routine-card-top">
                                        <h3>{routine.title}</h3>
                                        <span className="home-routine-badge">{routine.category}</span>
                                    </div>

                                    {/* ✅ 변경 - routineMode → routine_mode (DB 컬럼명) */}
                                    <p className="home-routine-type">{getModeText(routine.routine_mode)}</p>

                                    <p className="home-routine-desc">
                                        {routine.description || "루틴 설명이 아직 없습니다."}
                                    </p>

                                    <div className="home-routine-meta">
                                        {routine.goal && <span>{routine.goal}</span>}
                                        {/* ✅ 변경 - repeat → repeat_cycle (DB 컬럼명) */}
                                        {routine.repeat_cycle && <span>{routine.repeat_cycle}</span>}
                                    </div>
                                </div>

                                <div className="home-routine-card-right">
                                    {/* 루틴 완료 여부에 따라 다른 UI 표시 */}
                                    {routine.completed ? (
                                        // 완료된 루틴 - 완료 정보 표시 및 취소 버튼
                                        <button
                                            type="button"
                                            className="home-complete-box"
                                            onClick={() => cancelRoutineCompletion(routine.routine_id)} // ✅ id → routine_id
                                        >
                                            <p className="home-complete-text">
                                                완료 시간: {routine.completedAt}
                                            </p>

                                            {/* 인증 글 표시 */}
                                            {routine.proofText && (
                                                <p className="home-proof-text">{routine.proofText}</p>
                                            )}

                                            {/* 인증 파일 미리보기 */}
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
                                        // 미완료 루틴 - 체크 or 상세 인증 버튼
                                        <>
                                            {/* ✅ 변경 - routineMode → routine_mode */}
                                            {routine.routine_mode === "check" ? (
                                                // 체크 루틴 - 완료 버튼
                                                <button
                                                    className="routine-check-btn home-action-btn"
                                                    onClick={() => completeCheckRoutine(routine.routine_id)} // ✅ id → routine_id
                                                >
                                                    오늘 완료
                                                </button>
                                            ) : (
                                                // 상세 루틴 - 인증하기 버튼 및 인증 박스
                                                <div className="home-detail-action">
                                                    {/* 인증 박스가 닫혀있을 때 인증하기 버튼 표시 */}
                                                    {openProofId !== routine.routine_id && ( // ✅ id → routine_id
                                                        <button
                                                            className="routine-detail-btn home-action-btn"
                                                            onClick={() => setOpenProofId(
                                                                openProofId === routine.routine_id ? null : routine.routine_id // ✅ id → routine_id
                                                            )}
                                                        >
                                                            인증하기
                                                        </button>
                                                    )}

                                                    {/* 인증 박스 - 인증하기 버튼 클릭 시 열림 */}
                                                    {openProofId === routine.routine_id && ( // ✅ id → routine_id
                                                        <div className="proof-box">
                                                            {/* 인증 글 입력 */}
                                                            <textarea
                                                                maxLength={200}
                                                                placeholder="오늘 하루를 기록해보세요"
                                                                value={proofInputs[routine.routine_id] || ""}
                                                                onChange={(e) => handleProofChange(routine.routine_id, e.target.value)} // ✅ id → routine_id
                                                            />

                                                            {/* 글자수 카운터 */}
                                                            <p style={{ fontSize: "12px", color: "#6b7280", textAlign: "right", margin: "0" }}>
                                                                {(proofInputs[routine.routine_id]?.length || 0)}/200
                                                            </p>

                                                            {/* 사진/영상 파일 첨부 */}
                                                            <label className="proof-file-label">
                                                                사진 / 영상 추가
                                                                <input
                                                                    type="file"
                                                                    accept="image/*,video/*"
                                                                    multiple
                                                                    onChange={(e) => handleFileChange(routine.routine_id, e.target.files)} // ✅ id → routine_id
                                                                />
                                                            </label>

                                                            {/* 피드 업로드 체크박스 */}
                                                            <label className="feed-upload-check">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={uploadChecks[routine.routine_id] || false}
                                                                    onChange={(e) => handleUploadCheckChange(routine.routine_id, e.target.checked)} // ✅ id → routine_id
                                                                />
                                                                <span>피드에도 업로드하기</span>
                                                            </label>

                                                            {/* 첨부 파일 미리보기 */}
                                                            {proofFiles[routine.routine_id]?.length > 0 && (
                                                                <div className="proof-preview-list">
                                                                    {proofFiles[routine.routine_id].map((file, index) => (
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
                                                                onClick={() => handleDetailSubmit(routine.routine_id)} // ✅ id → routine_id
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