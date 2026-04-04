import { useState, useEffect } from "react"; // ✅ useEffect 추가

function RoutinePage() {
    // ✅ 변경 - props 대신 직접 상태 관리
    const [routines, setRoutines] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [goal, setGoal] = useState("");
    const [repeat, setRepeat] = useState("");
    const [description, setDescription] = useState("");
    const [time, setTime] = useState("morning");
    const [routineMode, setRoutineMode] = useState("check");

    // ✅ 추가 - 페이지 로딩 시 루틴 목록 가져오기
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

    // ✅ 변경 - 백엔드로 루틴 저장
    const handleSave = async () => {
        if (!title.trim()) {
            alert("루틴 제목을 입력해주세요.");
            return;
        }
        if (!category) {
            alert("카테고리를 선택해주세요.");
            return;
        }

        try {
            const res = await fetch("http://localhost:3000/routine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ title, category, time_slot: time, routine_mode: routineMode, goal, repeat_cycle: repeat, description }),
            });
            const result = await res.json();

            if (result.success) {
                await fetchRoutines(); // 목록 새로고침
                setTitle("");
                setCategory("");
                setGoal("");
                setRepeat("");
                setDescription("");
                setTime("morning");
                setRoutineMode("check");
                setShowForm(false);
            }
        } catch (error) {
            console.error(error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    // ✅ 변경 - 백엔드로 루틴 삭제
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
                await fetchRoutines(); // 목록 새로고침
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
                        <input type="text" placeholder="루틴 제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                        </select>
                        <select value={time} onChange={(e) => setTime(e.target.value)}>
                            <option value="morning">아침</option>
                            <option value="lunch">점심</option>
                            <option value="dinner">저녁</option>
                        </select>
                        <select value={routineMode} onChange={(e) => setRoutineMode(e.target.value)}>
                            <option value="check">체크 루틴</option>
                            <option value="detail">상세 루틴</option>
                        </select>
                        <input type="text" placeholder="목표 시간을 입력하세요" value={goal} onChange={(e) => setGoal(e.target.value)} />
                        <input type="text" placeholder="반복 주기를 입력하세요 (예: 매일, 월수금)" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
                        <textarea placeholder="루틴 설명을 입력하세요" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
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
                                <button className={`routine-check-btn ${routine.completed ? "completed-btn" : ""}`} disabled>
                                    {routine.completed ? `완료 ${routine.completedAt}` : routine.routine_mode === "check" ? "체크 루틴" : "상세 루틴"}
                                </button>
                                <button className="routine-delete-btn" onClick={() => handleDelete(routine.routine_id)}>
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