// 루틴 관리 페이지 컴포넌트
// - 내 루틴 목록 조회 (GET /routine)
// - 새 루틴 추가 (POST /routine)
// - 루틴 삭제 (DELETE /routine/:id)
// - 루틴 추가/삭제 후 App.jsx의 routines 상태도 동기화 (onRoutineChange 콜백)

import { useState, useEffect } from "react";

// props:
//   onRoutineChange - 루틴 변경(추가/삭제) 후 App.jsx의 fetchRoutines를 호출하는 콜백
//                     → HomePage의 루틴 목록도 자동으로 갱신됨
function RoutinePage({ onRoutineChange }) {
    // 이 페이지에서 표시할 루틴 목록 (DB에서 직접 fetch, DB 컬럼명 그대로 사용)
    const [routines, setRoutines] = useState([]);

    // 루틴 추가 폼 표시 여부
    const [showForm, setShowForm] = useState(false);

    // ── 루틴 추가 폼 입력값 상태들 ──
    const [title, setTitle] = useState("");           // 루틴 제목
    const [category, setCategory] = useState("");     // 카테고리
    const [goal, setGoal] = useState("");             // 목표 시간 (HH:MM 형식)
    const [repeat, setRepeat] = useState([]);         // 반복 요일 배열 (예: ["월", "수", "금"])
    const [description, setDescription] = useState(""); // 루틴 설명
    const [routineMode, setRoutineMode] = useState("check"); // 완료 방식 (check / detail)

    const weekDays = ["월", "화", "수", "목", "금", "토", "일"]; // 요일 선택 버튼용

    // 컴포넌트 마운트 시 루틴 목록 로드
    useEffect(() => {
        fetchRoutines();
    }, []);

    // 백엔드에서 내 루틴 목록 가져오기
    // Express → FastAPI → MySQL 순으로 조회
    const fetchRoutines = async () => {
        try {
            const res = await fetch("http://localhost:3000/routine", {
                credentials: "include", // 세션 쿠키 포함 → 로그인한 유저의 루틴만 반환
            });
            const data = await res.json();
            if (data.success) setRoutines(data.routines); // DB 원본 데이터 그대로 저장
        } catch (error) {
            console.error("루틴 목록 조회 실패:", error);
        }
    };

    // 목표 시간(HH:MM)으로 time_slot 자동 분류
    // 아침: 06:00~11:59 / 점심: 12:00~17:59 / 저녁: 나머지
    const getTimeSection = (goalTime) => {
        const [hour] = goalTime.split(":").map(Number);
        const totalMinutes = hour * 60;
        if (totalMinutes >= 360 && totalMinutes <= 719)  return "morning"; // 6시 ~ 11시 59분
        if (totalMinutes >= 720 && totalMinutes <= 1079) return "lunch";   // 12시 ~ 17시 59분
        return "dinner"; // 18시 ~ 5시 59분 (새벽 포함)
    };

    // 요일 버튼 토글 핸들러
    // 이미 선택된 요일이면 제거, 아니면 추가
    const handleRepeatDayClick = (day) => {
        setRepeat((prev) =>
            prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
        );
    };

    // "매일" 버튼 토글 핸들러
    // 전체 선택 상태면 전체 해제, 아니면 전체 선택
    const handleSelectEveryday = () => {
        if (repeat.length === weekDays.length) {
            setRepeat([]);
            return;
        }
        setRepeat(weekDays);
    };

    // 루틴 저장 핸들러
    // 유효성 검사 → POST /routine → 목록 갱신 → 폼 초기화
    const handleSave = async () => {
        // 필수값 유효성 검사
        if (!title.trim()) {
            alert("루틴 제목을 입력해주세요.");
            return;
        }
        if (!category) {
            alert("카테고리를 선택해주세요.");
            return;
        }
        if (!goal) {
            alert("목표 시간을 선택해주세요.");
            return;
        }
        if (repeat.length === 0) {
            alert("반복 주기를 선택해주세요.");
            return;
        }

        // 목표 시간으로 time_slot 자동 분류
        const autoTime = getTimeSection(goal);
        // 7일 전체 선택 시 "매일", 아니면 "월, 수, 금" 형식 문자열로 변환
        const repeatText = repeat.length === 7 ? "매일" : repeat.join(", ");

        try {
            const res = await fetch("http://localhost:3000/routine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    title,
                    category,
                    time_slot: autoTime,       // 자동 분류된 시간대
                    routine_mode: routineMode,
                    goal,                      // 목표 시간 문자열 (예: "07:30")
                    repeat_cycle: repeatText,  // 반복 주기 텍스트
                    description,
                }),
            });
            const result = await res.json();

            if (result.success) {
                await fetchRoutines();       // 이 페이지의 루틴 목록 갱신
                await onRoutineChange();     // App.jsx의 routines 상태도 갱신 → HomePage 동기화
                // 폼 입력값 초기화
                setTitle("");
                setCategory("");
                setGoal("");
                setRepeat([]);
                setDescription("");
                setRoutineMode("check");
                setShowForm(false);
            }
        } catch (error) {
            console.error("루틴 저장 실패:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    // 루틴 삭제 핸들러
    // confirm 후 DELETE /routine/:id → 목록 갱신
    const handleDelete = async (routine_id) => {
        const isConfirmed = window.confirm("이 루틴을 삭제하시겠습니까?");
        if (!isConfirmed) return;

        try {
            const res = await fetch(`http://localhost:3000/routine/${routine_id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const result = await res.json();
            if (result.success) {
                await fetchRoutines();   // 이 페이지 목록 갱신
                await onRoutineChange(); // App.jsx의 routines 상태도 갱신 → HomePage 동기화
            }
        } catch (error) {
            console.error("루틴 삭제 실패:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    // time_slot 값을 한글 텍스트로 변환
    const getTimeText = (time) => {
        if (time === "morning") return "아침";
        if (time === "lunch")   return "점심";
        return "저녁";
    };

    // routine_mode 값을 한글 텍스트로 변환
    const getModeText = (mode) => {
        return mode === "check" ? "체크 루틴" : "상세 루틴";
    };

    return (
        <div className="routine-page">
            {/* ── 헤더: 제목 + 루틴 추가 버튼 ── */}
            <div className="routine-header">
                <div>
                    <h1 className="routine-title">내 루틴 관리</h1>
                    <p className="routine-subtitle">
                        오늘 실천할 루틴을 확인하고 꾸준히 관리해보세요.
                    </p>
                </div>
                {/* 클릭 시 폼 토글 */}
                <button className="routine-add-btn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "닫기" : "+ 루틴 추가"}
                </button>
            </div>

            {/* ── 루틴 추가 폼 (showForm = true 일 때만 표시) ── */}
            {showForm && (
                <div className="routine-form-box">
                    <h2>새 루틴 추가</h2>
                    <div className="routine-form">
                        {/* 루틴 제목 입력 */}
                        <input
                            type="text"
                            placeholder="루틴 제목을 입력하세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        {/* 카테고리 선택 */}
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="">루틴 카테고리 선택</option>
                            <option value="기상">기상</option>
                            <option value="운동">운동</option>
                            <option value="공부">공부</option>
                            <option value="식단">식단</option>
                            <option value="독서">독서</option>
                            <option value="물 마시기">물 마시기</option>
                            <option value="건강">건강</option>
                            <option value="자기계발">자기계발</option>
                            <option value="기타">기타</option>
                        </select>

                        {/* 완료 방식 선택 (체크 루틴 / 상세 루틴) */}
                        <select value={routineMode} onChange={(e) => setRoutineMode(e.target.value)}>
                            <option value="check">체크 루틴</option>
                            <option value="detail">상세 루틴</option>
                        </select>

                        {/* 목표 시간 입력 (HH:MM) - 입력값으로 time_slot 자동 분류 */}
                        <input
                            type="time"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                        />

                        {/* 반복 요일 선택 버튼 그룹 */}
                        <div className="repeat-select-box">
                            <p className="repeat-select-label">반복 주기</p>
                            <div className="repeat-day-list">
                                {/* 매일 버튼: 7일 전체 선택/해제 토글 */}
                                <button
                                    type="button"
                                    className={`repeat-day-btn ${repeat.length === weekDays.length ? "active-repeat-day" : ""}`}
                                    onClick={handleSelectEveryday}
                                >
                                    매일
                                </button>
                                {/* 개별 요일 버튼 */}
                                {weekDays.map((day) => (
                                    <button
                                        key={day}
                                        type="button"
                                        className={`repeat-day-btn ${repeat.includes(day) ? "active-repeat-day" : ""}`}
                                        onClick={() => handleRepeatDayClick(day)}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 루틴 설명 입력 */}
                        <textarea
                            placeholder="루틴 설명을 입력하세요"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>

                        <button className="routine-save-btn" onClick={handleSave}>저장하기</button>
                    </div>
                </div>
            )}

            {/* ── 루틴 목록 ── */}
            <div className="routine-list">
                {routines.map((routine) => (
                    <div className="routine-card" key={routine.routine_id}>
                        {/* 루틴 정보 (왼쪽) */}
                        <div className="routine-card-left">
                            <div className="routine-card-top">
                                <h3>{routine.title}</h3>
                                <span className="routine-badge">{routine.category}</span>
                            </div>
                            <p className="routine-card-type">{getModeText(routine.routine_mode)}</p>
                            <p className="routine-card-desc">{routine.description || "루틴 설명이 아직 없습니다."}</p>
                            <div className="routine-card-meta">
                                <span>{getTimeText(routine.time_slot)}</span>
                                {routine.goal && <span>{routine.goal}</span>}
                                {routine.repeat_cycle && <span>{routine.repeat_cycle}</span>}
                            </div>
                        </div>

                        {/* 완료 상태 표시 + 삭제 버튼 (오른쪽) */}
                        <div className="routine-card-right">
                            <div className="routine-card-actions">
                                {/* 완료 버튼: 이 페이지에서는 완료 기능 없음 (홈에서 처리), disabled 처리 */}
                                <button
                                    className={`routine-check-btn ${routine.completed ? "completed-btn" : ""}`}
                                    disabled
                                >
                                    {routine.completed
                                        ? `완료 ${routine.completedAt}`
                                        : routine.routine_mode === "check" ? "체크 루틴" : "상세 루틴"}
                                </button>

                                {/* 삭제 버튼 */}
                                <button
                                    className="routine-delete-btn"
                                    onClick={() => handleDelete(routine.routine_id)}
                                >
                                    루틴 삭제
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RoutinePage;
