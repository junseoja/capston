// ============================================================
// HomePage.jsx - 홈 페이지 컴포넌트
// ============================================================
// 역할:
//   - 이번 주 날짜 캘린더 표시 (일~토, 오늘 날짜 강조)
//   - 아침/점심/저녁 탭으로 시간대별 루틴 목록 필터링 및 표시
//   - 체크 루틴: 버튼 클릭 한 번으로 즉시 완료 처리
//   - 상세 루틴: 인증 글 + 사진/영상 첨부 후 완료 처리 (피드 업로드 옵션 포함)
//   - 완료된 루틴 클릭 시 완료 취소 (confirm 후 처리)
//
// Props:
//   routines         - App.jsx에서 fetch + 필드 매핑된 루틴 배열
//                      (routine_id→id, time_slot→time, routine_mode→routineMode, repeat_cycle→repeat)
//   onCompleteCheck  - 체크 루틴 완료 처리 함수 (App.jsx의 completeCheckRoutine)
//   onCompleteDetail - 상세 루틴 완료 처리 함수 (App.jsx의 completeDetailRoutine)
//   onCancelComplete - 루틴 완료 취소 함수 (App.jsx의 cancelRoutineCompletion)
//
// 주의:
//   routines 데이터는 App.jsx에서 중앙 관리
//   (RoutinePage와 동일 데이터 공유 → 루틴 추가/삭제 시 자동 동기화)
// ============================================================

import { useState, useEffect, useRef } from "react";

function HomePage({
    routines,
    onCompleteCheck,
    onCompleteDetail,
    onCancelComplete,
}) {
    // ── 날짜 계산 ─────────────────────────────────────────────────────────────

    const today = new Date();
    const dayIndex = today.getDay(); // 0(일) ~ 6(토) - 오늘이 이번 주 몇 번째 날인지
    const days = ["일", "월", "화", "수", "목", "금", "토"];

    // 이번 주 일요일~토요일의 Date 객체 배열 생성
    // today.getDate() - dayIndex: 이번 주 일요일 날짜
    // + index: 각 요일의 날짜
    const weekDates = days.map((_, index) => {
        const newDate = new Date(today);
        newDate.setDate(today.getDate() - dayIndex + index);
        return newDate;
    });

    // ── 컴포넌트 내부 상태 ────────────────────────────────────────────────────

    // 현재 선택된 시간대 탭 (morning / lunch / dinner)
    const [time, setTime] = useState("morning");

    // 상세 루틴 인증 글 입력값
    // 구조: { [루틴id]: "입력값" } - 루틴별 독립 관리 (하나 입력해도 다른 루틴에 영향 없음)
    const [proofInputs, setProofInputs] = useState({});

    // 상세 루틴 첨부 파일
    // 구조: { [루틴id]: [{ name, type, url }] } - Object URL로 미리보기용
    const [proofFiles, setProofFiles] = useState({});

    // 피드 업로드 체크박스 상태
    // 구조: { [루틴id]: boolean }
    const [uploadChecks, setUploadChecks] = useState({});

    // 현재 열려있는 인증 박스의 루틴 id (null이면 닫힌 상태)
    // 한 번에 하나의 인증 박스만 열 수 있도록 제한
    const [openProofId, setOpenProofId] = useState(null);

    // 생성된 Object URL 목록 추적 (메모리 누수 방지용)
    // ref를 사용해 렌더링 없이 URL 목록 관리
    const objectUrlsRef = useRef([]);

    // 컴포넌트 언마운트 시 모든 Object URL 해제
    useEffect(() => {
        return () => {
            objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    // ── 필터링 ────────────────────────────────────────────────────────────────

    // 현재 선택된 시간대(time)에 해당하는 루틴만 필터링
    // App.jsx에서 time_slot → time 으로 필드 매핑 완료된 상태
    const filteredRoutines = routines.filter((routine) => routine.time === time);

    // ── 유틸리티 함수 ─────────────────────────────────────────────────────────

    /**
     * getTimeTitle - 현재 시간대의 제목과 시간 범위 반환
     * @returns {{ title: string, range: string }}
     */
    const getTimeTitle = () => {
        if (time === "morning") return { title: "🌅 아침 루틴", range: "06:00 ~ 11:59" };
        if (time === "lunch")   return { title: "🍱 점심 루틴", range: "12:00 ~ 17:59" };
        return                         { title: "🌙 저녁 루틴", range: "18:00 ~ 05:59" };
    };

    /**
     * getModeText - 루틴 모드 영문 값을 한글 텍스트로 변환
     * @param {"check"|"detail"} mode
     * @returns {string}
     */
    const getModeText = (mode) => {
        return mode === "check" ? "체크 루틴" : "상세 루틴";
    };

    // ── 이벤트 핸들러 ─────────────────────────────────────────────────────────

    /**
     * handleProofChange - 상세 루틴 인증 글 입력 핸들러
     * 해당 루틴의 입력값만 업데이트, 다른 루틴에 영향 없음 (스프레드로 기존 값 유지)
     * @param {string} id    - 루틴 UUID
     * @param {string} value - 입력된 텍스트
     */
    const handleProofChange = (id, value) => {
        setProofInputs((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    /**
     * handleUploadCheckChange - 피드 업로드 체크박스 변경 핸들러
     * @param {string}  id      - 루틴 UUID
     * @param {boolean} checked - 체크박스 상태
     */
    const handleUploadCheckChange = (id, checked) => {
        setUploadChecks((prev) => ({
            ...prev,
            [id]: checked,
        }));
    };

    /**
     * handleFileChange - 파일 선택 핸들러
     *
     * FileList → 배열로 변환 후 각 파일에 대해 Object URL 생성
     * Object URL: 메모리에 임시 저장된 파일의 URL (blob:http://...)
     * 페이지 새로고침 시 소멸, 탭 닫을 때 자동 해제됨
     *
     * TODO: URL.revokeObjectURL(file.url) 호출로 메모리 누수 방지 필요
     *       (현재 생성만 하고 해제하지 않음 → 파일을 많이 선택하면 메모리 증가)
     *
     * @param {string}   id       - 루틴 UUID
     * @param {FileList} fileList - input[type=file]의 files 속성
     */
    const handleFileChange = (id, fileList) => {
        const selectedFiles = Array.from(fileList); // FileList → Array 변환

        // 이전에 이 루틴 id로 생성된 Object URL 먼저 해제 (메모리 누수 방지)
        if (proofFiles[id]) {
            proofFiles[id].forEach((file) => {
                URL.revokeObjectURL(file.url);
                // ref 목록에서도 제거
                objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== file.url);
            });
        }

        const previewFiles = selectedFiles.map((file) => {
            const url = URL.createObjectURL(file); // 브라우저 메모리에 임시 URL 생성
            objectUrlsRef.current.push(url);       // 언마운트 시 해제하기 위해 추적
            return { name: file.name, type: file.type, url };
        });

        setProofFiles((prev) => ({
            ...prev,
            [id]: previewFiles,
        }));
    };

    /**
     * handleDetailSubmit - 상세 루틴 인증 제출 핸들러
     *
     * 유효성 검사:
     *   - 인증 글 또는 파일 중 하나 이상 필수
     *   - 인증 글 200자 이하
     *
     * 성공 시:
     *   - App.jsx의 onCompleteDetail 호출 (완료 처리 + 피드 업로드 판단)
     *   - 해당 루틴의 입력 상태 초기화 및 인증 박스 닫기
     *
     * @param {string} id - 루틴 UUID
     */
    const handleDetailSubmit = async (id) => {
        const proofText = proofInputs[id]?.trim() || "";    // 앞뒤 공백 제거
        const selectedFiles = proofFiles[id] || [];
        const uploadToFeed = uploadChecks[id] || false;

        // 유효성 검사 1: 인증 글과 파일 둘 다 없으면 제출 불가
        if (!proofText && selectedFiles.length === 0) {
            alert("인증 글이나 사진/영상을 추가해주세요.");
            return;
        }

        // 유효성 검사 2: 인증 글 200자 초과 제한
        // (textarea에 maxLength={200}도 설정되어 있지만 이중 검사)
        if (proofText.length > 200) {
            alert("200자 이하로 입력해주세요.");
            return;
        }

        // 부모(App.jsx)에 완료 처리 위임
        const isCompleted = await onCompleteDetail(id, proofText, selectedFiles, uploadToFeed);
        if (!isCompleted) return;

        // 인증 박스 입력 상태 초기화
        setProofInputs((prev) => ({ ...prev, [id]: "" }));
        setUploadChecks((prev) => ({ ...prev, [id]: false }));
        setOpenProofId(null); // 인증 박스 닫기

        // [수정] 완료된 루틴 카드와 피드(메모리 상태)가 같은 blob URL을 계속 참조하므로
        // 제출 직후 revokeObjectURL()을 호출하면 화면 표시가 깨질 수 있음.
        // 따라서 이 시점에는 proofFiles 입력 상태만 비우고, URL 해제는
        // 파일 재선택/언마운트 시점에만 수행.
        setProofFiles((prev) => ({ ...prev, [id]: [] }));
    };

    /**
     * handleCancelComplete - 루틴 완료 취소 핸들러
     *
     * confirm 다이얼로그로 확인 후 App.jsx의 onCancelComplete 호출
     * onCancelComplete: 루틴 완료 상태 초기화 + 관련 피드 게시물 삭제
     *
     * @param {string} id - 루틴 UUID
     */
    const handleCancelComplete = (id) => {
        const isConfirmed = window.confirm("루틴 완료를 취소하시겠습니까?");
        if (isConfirmed) {
            onCancelComplete(id);
        }
    };

    const currentSection = getTimeTitle();

    // ── 렌더링 ────────────────────────────────────────────────────────────────

    return (
        <div className="home">
            {/* ── 이번 주 날짜 캘린더 ── */}
            <div className="week">
                {weekDates.map((weekDate, index) => (
                    <div
                        key={index}
                        // 오늘 날짜(dayIndex)에 "active" 클래스 추가 → CSS로 강조 표시
                        className={index === dayIndex ? "day active" : "day"}
                    >
                        <p>{days[index]}</p>         {/* 요일 (일, 월, ...) */}
                        <p>{weekDate.getDate()}</p>  {/* 날짜 숫자 (1~31) */}
                    </div>
                ))}
            </div>

            {/* ── 시간대 탭 (아침 / 점심 / 저녁) ── */}
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

                {/* 해당 시간대에 루틴이 없을 때 안내 문구 */}
                {filteredRoutines.length === 0 ? (
                    <p className="empty-routine-text">
                        이 시간대에 등록된 루틴이 아직 없어요.
                    </p>
                ) : (
                    <div className="home-routine-list">
                        {filteredRoutines.map((routine) => (
                            <div
                                // 완료된 루틴에 "home-routine-card-completed" 클래스 추가 (시각적 구분)
                                className={`home-routine-card ${routine.completed ? "home-routine-card-completed" : ""}`}
                                key={routine.id} // App.jsx에서 routine_id → id 로 매핑됨
                            >
                                {/* ── 루틴 정보 (왼쪽 영역) ── */}
                                <div className="home-routine-card-left">
                                    <div className="home-routine-card-top">
                                        <h3>{routine.title}</h3>
                                        {/* 카테고리 배지 (예: "운동", "공부") */}
                                        <span className="home-routine-badge">{routine.category}</span>
                                    </div>

                                    {/* 루틴 모드: "체크 루틴" 또는 "상세 루틴" */}
                                    <p className="home-routine-type">{getModeText(routine.routineMode)}</p>

                                    {/* 루틴 설명 (없으면 기본 문구 표시) */}
                                    <p className="home-routine-desc">
                                        {routine.description || "루틴 설명이 아직 없습니다."}
                                    </p>

                                    {/* 메타 정보: 목표 시간, 반복 주기 */}
                                    <div className="home-routine-meta">
                                        {/* goal: optional이므로 있을 때만 표시 */}
                                        {routine.goal && <span>{routine.goal}</span>}
                                        {/* repeat: App.jsx에서 repeat_cycle → repeat 로 매핑 */}
                                        {routine.repeat && <span>{routine.repeat}</span>}
                                    </div>
                                </div>

                                {/* ── 완료 버튼 / 인증 박스 (오른쪽 영역) ── */}
                                <div className="home-routine-card-right">
                                    {routine.completed ? (
                                        // ── 완료된 루틴: 완료 정보 표시, 클릭 시 완료 취소 ──
                                        <button
                                            type="button"
                                            className="home-complete-box"
                                            onClick={() => handleCancelComplete(routine.id)}
                                        >
                                            {/* 완료 시간 표시 */}
                                            <p className="home-complete-text">
                                                완료 시간: {routine.completedAt}
                                            </p>

                                            {/* 상세 루틴 인증 글 (있을 때만 표시) */}
                                            {routine.proofText && (
                                                <p className="home-proof-text">{routine.proofText}</p>
                                            )}

                                            {/* 첨부 파일 미리보기 (이미지/영상) */}
                                            {routine.proofFiles && routine.proofFiles.length > 0 && (
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
                                                                // 이미지도 영상도 아닌 파일은 이름만 표시
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
                                                // 체크 루틴: 버튼 클릭 한 번으로 즉시 완료
                                                <button
                                                    className="routine-check-btn home-action-btn"
                                                    onClick={() => onCompleteCheck(routine.id)}
                                                >
                                                    오늘 완료
                                                </button>
                                            ) : (
                                                // 상세 루틴: "인증하기" 버튼 → 인증 박스 토글
                                                <div className="home-detail-action">
                                                    {/* 인증 박스가 닫혀있을 때만 "인증하기" 버튼 표시
                                                        (열려있을 때 버튼 숨김으로 UI 중복 방지) */}
                                                    {openProofId !== routine.id && (
                                                        <button
                                                            className="routine-detail-btn home-action-btn"
                                                            onClick={() =>
                                                                // 토글: 이미 열린 것이면 닫고, 닫힌 것이면 열기
                                                                setOpenProofId(
                                                                    openProofId === routine.id ? null : routine.id
                                                                )
                                                            }
                                                        >
                                                            인증하기
                                                        </button>
                                                    )}

                                                    {/* 인증 박스 (openProofId === 현재 루틴 id 일 때만 표시) */}
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

                                                            {/* 글자수 카운터 (현재 입력 길이 / 최대 200) */}
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

                                                            {/* 파일 첨부 버튼
                                                                accept="image/*,video/*": 이미지와 영상만 선택 가능
                                                                multiple: 여러 파일 동시 선택 가능 */}
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

                                                            {/* 선택된 파일 미리보기 목록 */}
                                                            {proofFiles[routine.id]?.length > 0 && (
                                                                <div className="proof-preview-list">
                                                                    {proofFiles[routine.id].map((file, index) => (
                                                                        <div key={index} className="proof-preview-item">
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
