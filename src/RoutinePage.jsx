import { useState } from "react";

function RoutinePage({ routines, onAddRoutine, onDeleteRoutine }) {
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("");
  const [repeat, setRepeat] = useState([]);
  const [description, setDescription] = useState("");
  const [routineMode, setRoutineMode] = useState("check");

  const [selectedTitle, setSelectedTitle] = useState("");

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  const getTimeSection = (goalTime) => {
    const [hour, minute] = goalTime.split(":").map(Number);
    const totalMinutes = hour * 60 + minute;

    if (totalMinutes >= 360 && totalMinutes <= 719) return "morning";
    if (totalMinutes >= 720 && totalMinutes <= 1079) return "lunch";
    return "dinner";
  };

  const handleRepeatDayClick = (day) => {
    setRepeat((prev) =>
      prev.includes(day)
        ? prev.filter((item) => item !== day)
        : [...prev, day]
    );
  };

  const handleSelectEveryday = () => {
    if (repeat.length === weekDays.length) {
      setRepeat([]);
      return;
    }

    setRepeat(weekDays);
  };

  const handleSave = () => {
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

    const autoTime = getTimeSection(goal);

    onAddRoutine({
      title,
      category,
      goal,
      repeat: repeat.length === 7 ? "매일" : repeat.join(", "),
      description,
      time: autoTime,
      routineMode,
    });

    setTitle("");
    setCategory("");
    setGoal("");
    setRepeat([]);
    setDescription("");
    setRoutineMode("check");
    setShowForm(false);
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

        <button
          className="routine-add-btn"
          onClick={() => setShowForm(!showForm)}
        >
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

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
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

            <select
              value={routineMode}
              onChange={(e) => setRoutineMode(e.target.value)}
            >
              <option value="check">체크 루틴</option>
              <option value="detail">상세 루틴</option>
            </select>

            <input
              type="time"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />

            <div className="repeat-select-box">
              <p className="repeat-select-label">반복 주기</p>

              <div className="repeat-day-list">
                <button
                  type="button"
                  className={`repeat-day-btn ${
                    repeat.length === weekDays.length ? "active-repeat-day" : ""
                  }`}
                  onClick={handleSelectEveryday}
                >
                  매일
                </button>

                {weekDays.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`repeat-day-btn ${
                      repeat.includes(day) ? "active-repeat-day" : ""
                    }`}
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

            <button className="routine-save-btn" onClick={handleSave}>
              저장하기
            </button>
          </div>
        </div>
      )}

      <div className="routine-list">
        {routines.map((routine) => (
          <div className="routine-card" key={routine.id}>
            <div className="routine-card-left">
              <div className="routine-card-top">
                <h3
                  title={routine.title}
                  onClick={() => setSelectedTitle(routine.title)}
                >
                  {routine.title}
                </h3>

                <span className="routine-badge">{routine.category}</span>
              </div>

              <p className="routine-card-type">
                {getModeText(routine.routineMode)}
              </p>

              <p className="routine-card-desc">
                {routine.description || "루틴 설명이 아직 없습니다."}
              </p>

              <div className="routine-card-meta">
                <span>{getTimeText(routine.time)}</span>
                {routine.goal && <span>{routine.goal}</span>}
                {routine.repeat && <span>{routine.repeat}</span>}
              </div>
            </div>

            <div className="routine-card-right">
              <div className="routine-card-actions">
                <button
                  className={`routine-check-btn ${
                    routine.completed ? "completed-btn" : ""
                  }`}
                  disabled
                >
                  {routine.completed
                    ? `완료 ${routine.completedAt}`
                    : routine.routineMode === "check"
                    ? "체크 루틴"
                    : "상세 루틴"}
                </button>

                <button
                  className="routine-delete-btn"
                  onClick={() => {
                    const isConfirmed =
                      window.confirm("이 루틴을 삭제하시겠습니까?");
                    if (isConfirmed) {
                      onDeleteRoutine(routine.id);
                    }
                  }}
                >
                  루틴 삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTitle && (
        <div
          className="title-modal-overlay"
          onClick={() => setSelectedTitle("")}
        >
          <div
            className="title-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <p>{selectedTitle}</p>
            <button onClick={() => setSelectedTitle("")}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoutinePage;