import { useState, useEffect } from "react";

function RoutinePage({ onRoutineChange }) {
    const [routines, setRoutines] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [goal, setGoal] = useState("");
    const [repeat, setRepeat] = useState([]); // ✅ 팀원 버전 - 배열로 관리
    const [description, setDescription] = useState("");
    const [routineMode, setRoutineMode] = useState("check");

    const weekDays = ["월", "화", "수", "목", "금", "토", "일"]; // ✅ 팀원 추가

    // ✅ 내 버전 - 페이지 로딩 시 루틴 목록 가져오기
    useEffect(() => {
        fetchRoutines();
    }, []);

    const fetchRoutines = async () => {
        try {
            const res = await fetch("http://localhost:3000/routine", {
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) setRoutines(data.routines);
        } catch (error) {
            console.error(error);
        }
    };

    // ✅ 팀원 추가 - 시간으로 아침/점심/저녁 자동 분류
    const getTimeSection = (goalTime) => {
        const [hour] = goalTime.split(":").map(Number);
        const totalMinutes = hour * 60;
        if (totalMinutes >= 360 && totalMinutes <= 719) return "morning";
        if (totalMinutes >= 720 && totalMinutes <= 1079) return "lunch";
        return "dinner";
    };

    // ✅ 팀원 추가 - 반복 요일 선택
    const handleRepeatDayClick = (day) => {
        setRepeat((prev) =>
            prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
        );
    };

    const handleSelectEveryday = () => {
        if (repeat.length === weekDays.length) {
            setRepeat([]);
            return;
        }
        setRepeat(weekDays);
    };

    // ✅ 합침 - 백엔드 연결 + 팀원 유효성 검사
    const handleSave = async () => {
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

        // ✅ 팀원 추가 - 시간으로 time_slot 자동 분류
        const autoTime = getTimeSection(goal);
        // ✅ 팀원 추가 - 매일이면 "매일", 아니면 "월, 화, 수" 형식
        const repeatText = repeat.length === 7 ? "매일" : repeat.join(", ");

        try {
            const res = await fetch("http://localhost:3000/routine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    title,
                    category,
                    time_slot: autoTime,       // ✅ 자동 분류된 시간대
                    routine_mode: routineMode,
                    goal,
                    repeat_cycle: repeatText,  // ✅ 요일 텍스트로 변환
                    description,
                }),
            });
            const result = await res.json();

            if (result.success) {
                await fetchRoutines();
                await onRoutineChange();
                setTitle("");
                setCategory("");
                setGoal("");
                setRepeat([]);
                setDescription("");
                setRoutineMode("check");
                setShowForm(false);
            }
        } catch (error) {
            console.error(error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    // ✅ 내 버전 - 백엔드로 루틴 삭제
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
                await fetchRoutines();
                await onRoutineChange();
            }
        } catch (error) {
            console.error(error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    const getTimeText = (time) => {
        if (time === "morning") return "아침";
        if (time === "lunch") return "점심";
        return "저녁";
    };

    const getModeText = (mode) => {
        return mode === "check" ? "체크 루틴" : "상세 루틴";
    };

    return (
        <div className="routine-page">
            <div className="routine-header">
                <div>
                    <h1 className="routine-title">내 루틴 관리</h1>
                    <p className="routine-subtitle">
                        오늘 실천할 루틴을 확인하고 꾸준히 관리해보세요.
                    </p>
                </div>
                <button className="routine-add-btn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "닫기" : "+ 루틴 추가"}
                </button>
            </div>

            {showForm && (
                <div className="routine-form-box">
                    <h2>새 루틴 추가</h2>
                    <div className="routine-form">
                        <input
                            type="text"
                            placeholder="루틴 제목을 입력하세요"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

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
                            <option value="기타">기타</option> {/* ✅ 팀원 추가 */}
                        </select>

                        <select value={routineMode} onChange={(e) => setRoutineMode(e.target.value)}>
                            <option value="check">체크 루틴</option>
                            <option value="detail">상세 루틴</option>
                        </select>

                        {/* ✅ 팀원 변경 - 시간 직접 입력 */}
                        <input
                            type="time"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                        />

                        {/* ✅ 팀원 추가 - 요일 선택 버튼 */}
                        <div className="repeat-select-box">
                            <p className="repeat-select-label">반복 주기</p>
                            <div className="repeat-day-list">
                                <button
                                    type="button"
                                    className={`repeat-day-btn ${repeat.length === weekDays.length ? "active-repeat-day" : ""}`}
                                    onClick={handleSelectEveryday}
                                >
                                    매일
                                </button>
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

                        <textarea
                            placeholder="루틴 설명을 입력하세요"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>

                        <button className="routine-save-btn" onClick={handleSave}>저장하기</button>
                    </div>
                </div>
            )}

            <div className="routine-list">
                {routines.map((routine) => (
                    <div className="routine-card" key={routine.routine_id}>
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
                        <div className="routine-card-right">
                            <div className="routine-card-actions">
                                <button
                                    className={`routine-check-btn ${routine.completed ? "completed-btn" : ""}`}
                                    disabled
                                >
                                    {routine.completed
                                        ? `완료 ${routine.completedAt}`
                                        : routine.routine_mode === "check" ? "체크 루틴" : "상세 루틴"}
                                </button>
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