// ============================================================
// RoutinePage.jsx - 루틴 관리 페이지 컴포넌트
// ============================================================
// 역할:
//   - 내 루틴 목록 조회 (GET /routine - DB 컬럼명 그대로 사용)
//   - 새 루틴 추가 폼 표시 및 POST /routine 요청
//   - 루틴 삭제 (confirm 후 DELETE /routine/:id)
//   - 루틴 추가/삭제 후 App.jsx의 routines 상태도 동기화
//     (onRoutineChange 콜백 → fetchRoutines 호출 → HomePage도 자동 갱신)
//
// Props:
//   onRoutineChange - 루틴 변경(추가/삭제) 후 App.jsx의 fetchRoutines 함수
//                     이 콜백 호출로 App.jsx의 routines 상태가 갱신되어
//                     HomePage의 루틴 목록도 자동으로 최신화됨
//
// 데이터 흐름:
//   이 페이지 자체의 루틴 목록: 로컬 상태(routines) - DB 컬럼명 그대로 사용
//   App.jsx의 routines 상태:  onRoutineChange() 호출로 별도 갱신
//   (동일 API를 두 번 호출하는 이유: 필드 매핑이 다르기 때문 - DB 원본 vs 매핑됨)
// ============================================================

import { useState, useEffect, useCallback } from "react";

function RoutinePage({ onRoutineChange }) {
    // 이 페이지에서 표시할 루틴 목록
    // App.jsx의 routines와 별개로 관리 (DB 컬럼명 그대로: routine_id, time_slot 등)
    const [routines, setRoutines] = useState([]);

    // 루틴 추가 폼 표시 여부 (true: 폼 열림, false: 폼 닫힘)
    const [showForm, setShowForm] = useState(false);

    // ── 루틴 추가 폼 입력값 상태 ──────────────────────────────────────────────
    const [title, setTitle] = useState("");              // 루틴 제목 (필수)
    const [category, setCategory] = useState("");        // 카테고리 (필수)
    const [goal, setGoal] = useState("");                // 목표 시간 "HH:MM" 형식 (필수)
    const [repeat, setRepeat] = useState([]);            // 반복 요일 배열 ["월", "수", "금"]
    const [description, setDescription] = useState(""); // 루틴 설명 (선택)
    const [routineMode, setRoutineMode] = useState("check"); // 완료 방식 (check/detail)

    // 요일 선택 버튼 목록 (월요일부터 시작)
    const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

    // ── API 호출 함수 ─────────────────────────────────────────────────────────

    /**
     * fetchRoutines - Express /routine에서 루틴 목록 fetch
     *
     * App.jsx의 fetchRoutines와 거의 동일하지만,
     * 여기서는 DB 컬럼명 그대로 저장 (필드 매핑 없음)
     * 이 페이지에서는 routine_id, time_slot 등 원본 컬럼명으로 렌더링
     */
    const fetchRoutines = useCallback(async () => {
        try {
            const res = await fetch("http://localhost:3000/routine", {
                credentials: "include", // 세션 쿠키 포함 → 로그인한 유저의 루틴만 반환
            });
            const data = await res.json();
            if (data.success) {
                setRoutines(data.routines); // DB 원본 데이터 그대로 저장
            }
        } catch (error) {
            console.error("루틴 목록 조회 실패:", error);
        }
    }, []);

    // ── 초기 데이터 로드 ──────────────────────────────────────────────────────

    // [수정] fetchRoutines 선언 이후에 useEffect에서 호출하도록 순서를 정리
    // React Hooks lint에서 "선언 전 참조" 경고가 나지 않도록 배치 변경
    useEffect(() => {
        // [수정] effect 본문에서 직접 setState가 일어나는 함수를 즉시 호출하지 않고,
        // 비동기 초기화 함수 안에서 루틴 로드를 수행하여 React Hooks lint 규칙에 맞춤
        const loadInitialRoutines = async () => {
            await fetchRoutines();
        };

        loadInitialRoutines();
    }, [fetchRoutines]);

    // ── 유틸리티 함수 ─────────────────────────────────────────────────────────

    /**
     * getTimeSection - 목표 시간(HH:MM)으로 time_slot 자동 분류
     *
     * 루틴 추가 시 사용자가 목표 시간을 선택하면 자동으로 시간대 분류
     *
     * 분류 기준:
     *   아침(morning): 06:00 ~ 11:59 (360분 ~ 719분)
     *   점심(lunch):   12:00 ~ 17:59 (720분 ~ 1079분)
     *   저녁(dinner):  18:00 ~ 05:59 (나머지)
     *
     * @param {string} goalTime - "HH:MM" 형식 목표 시간
     * @returns {"morning"|"lunch"|"dinner"}
     */
    const getTimeSection = (goalTime) => {
        const [hour] = goalTime.split(":").map(Number);
        const totalMinutes = hour * 60;
        if (totalMinutes >= 360 && totalMinutes <= 719)  return "morning";
        if (totalMinutes >= 720 && totalMinutes <= 1079) return "lunch";
        return "dinner"; // 18시 이후 또는 자정~05시 59분 (새벽 포함)
    };

    /**
     * getTimeText - time_slot 영문 값을 한글 텍스트로 변환 (목록 표시용)
     * @param {"morning"|"lunch"|"dinner"} time
     * @returns {string}
     */
    const getTimeText = (time) => {
        if (time === "morning") return "아침";
        if (time === "lunch")   return "점심";
        return "저녁";
    };

    /**
     * getModeText - routine_mode 영문 값을 한글 텍스트로 변환
     * @param {"check"|"detail"} mode
     * @returns {string}
     */
    const getModeText = (mode) => {
        return mode === "check" ? "체크 루틴" : "상세 루틴";
    };

    // ── 이벤트 핸들러 ─────────────────────────────────────────────────────────

    /**
     * handleRepeatDayClick - 요일 버튼 토글 핸들러
     *
     * 이미 선택된 요일이면 배열에서 제거(filter), 없으면 추가(spread)
     * @param {string} day - 요일 이름 (예: "월", "화")
     */
    const handleRepeatDayClick = (day) => {
        setRepeat((prev) =>
            prev.includes(day)
                ? prev.filter((item) => item !== day) // 이미 선택됨 → 제거
                : [...prev, day]                      // 미선택 → 추가
        );
    };

    /**
     * handleSelectEveryday - "매일" 버튼 토글 핸들러
     *
     * 7일 전체 선택 상태면 전체 해제, 아니면 전체 선택 (weekDays 배열)
     */
    const handleSelectEveryday = () => {
        if (repeat.length === weekDays.length) {
            setRepeat([]); // 전체 선택 → 전체 해제
            return;
        }
        setRepeat(weekDays); // 전체 선택
    };

    /**
     * handleSave - 루틴 저장 핸들러
     *
     * 처리 순서:
     *   1. 필수값 유효성 검사 (제목, 카테고리, 목표시간, 반복주기)
     *   2. 목표 시간으로 time_slot 자동 분류
     *   3. 반복 요일 배열 → 텍스트 변환 (["월","수"] → "월, 수" 또는 "매일")
     *   4. Express POST /routine 요청
     *   5. 성공 시 이 페이지 + App.jsx 루틴 목록 갱신 + 폼 초기화
     */
    const handleSave = async () => {
        // ── 필수값 유효성 검사 ──
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

        // 목표 시간(HH:MM)으로 time_slot 자동 분류
        const autoTime = getTimeSection(goal);

        // 반복 요일 배열을 텍스트로 변환
        // 7일 전체 선택 → "매일", 부분 선택 → "월, 수, 금" 형식
        const repeatText = repeat.length === 7 ? "매일" : repeat.join(", ");

        try {
            const res = await fetch("http://localhost:3000/routine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    title,
                    category,
                    time_slot: autoTime,       // 목표 시간으로 자동 분류된 시간대
                    routine_mode: routineMode, // "check" 또는 "detail"
                    goal,                      // 목표 시간 문자열 (예: "07:30")
                    repeat_cycle: repeatText,  // 반복 주기 텍스트
                    description,
                    // user_id는 Express에서 세션으로 자동 주입 (여기서 전달 불필요)
                }),
            });
            const result = await res.json();

            if (result.success) {
                await fetchRoutines();     // 이 페이지의 루틴 목록 갱신
                await onRoutineChange();   // App.jsx의 routines 상태도 갱신 → HomePage 동기화

                // 폼 입력값 전체 초기화
                setTitle("");
                setCategory("");
                setGoal("");
                setRepeat([]);
                setDescription("");
                setRoutineMode("check");
                setShowForm(false); // 폼 닫기
            }
        } catch (error) {
            console.error("루틴 저장 실패:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    /**
     * handleDelete - 루틴 삭제 핸들러
     *
     * confirm 확인 후 Express DELETE /routine/:routine_id 요청
     * 성공 시 이 페이지 + App.jsx 루틴 목록 갱신
     *
     * @param {string} routine_id - 삭제할 루틴의 UUID v7
     */
    const handleDelete = async (routine_id) => {
        const isConfirmed = window.confirm("이 루틴을 삭제하시겠습니까?");
        if (!isConfirmed) return; // 취소 시 아무 것도 하지 않음

        try {
            const res = await fetch(`http://localhost:3000/routine/${routine_id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const result = await res.json();

            if (result.success) {
                await fetchRoutines();   // 이 페이지 목록 갱신
                await onRoutineChange(); // App.jsx의 routines 상태도 갱신
            }
        } catch (error) {
            console.error("루틴 삭제 실패:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    // ── 렌더링 ────────────────────────────────────────────────────────────────

    return (
        <div className="routine-page">
            {/* ── 헤더: 페이지 제목 + 루틴 추가 버튼 ── */}
            <div className="routine-header">
                <div>
                    <h1 className="routine-title">내 루틴 관리</h1>
                    <p className="routine-subtitle">
                        오늘 실천할 루틴을 확인하고 꾸준히 관리해보세요.
                    </p>
                </div>

                {/* 클릭 시 showForm 토글 - 버튼 텍스트도 상태에 따라 변경 */}
                <button
                    className="routine-add-btn"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? "닫기" : "+ 루틴 추가"}
                </button>
            </div>

            {/* ── 루틴 추가 폼 (showForm = true 일 때만 렌더링) ── */}
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

                        {/* 카테고리 선택 드롭다운 */}
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

                        {/* 완료 방식 선택
                            check:  버튼 클릭으로 즉시 완료 (체크 루틴)
                            detail: 인증 글 + 사진/영상 첨부 후 완료 (상세 루틴) */}
                        <select
                            value={routineMode}
                            onChange={(e) => setRoutineMode(e.target.value)}
                        >
                            <option value="check">체크 루틴</option>
                            <option value="detail">상세 루틴</option>
                        </select>

                        {/* 목표 시간 입력 (HH:MM)
                            이 값을 기반으로 getTimeSection()이 time_slot을 자동 분류 */}
                        <input
                            type="time"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                        />

                        {/* 반복 요일 선택 버튼 그룹 */}
                        <div className="repeat-select-box">
                            <p className="repeat-select-label">반복 주기</p>
                            <div className="repeat-day-list">
                                {/* "매일" 버튼: 7일 전체 선택/해제 토글
                                    repeat.length === weekDays.length(7)일 때 active 스타일 */}
                                <button
                                    type="button"
                                    className={`repeat-day-btn ${
                                        repeat.length === weekDays.length ? "active-repeat-day" : ""
                                    }`}
                                    onClick={handleSelectEveryday}
                                >
                                    매일
                                </button>

                                {/* 개별 요일 버튼 (월~일)
                                    repeat 배열에 포함된 요일에 active 스타일 적용 */}
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

                        {/* 루틴 설명 textarea (선택사항) */}
                        <textarea
                            placeholder="루틴 설명을 입력하세요"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        {/* 저장 버튼 - handleSave에서 유효성 검사 후 API 호출 */}
                        <button className="routine-save-btn" onClick={handleSave}>
                            저장하기
                        </button>
                    </div>
                </div>
            )}

            {/* ── 루틴 목록 ── */}
            <div className="routine-list">
                {routines.map((routine) => (
                    // DB 컬럼명 그대로 사용 (routine_id, time_slot 등)
                    <div className="routine-card" key={routine.routine_id}>

                        {/* ── 루틴 정보 (왼쪽) ── */}
                        <div className="routine-card-left">
                            <div className="routine-card-top">
                                <h3>{routine.title}</h3>
                                <span className="routine-badge">{routine.category}</span>
                            </div>

                            {/* 완료 방식 텍스트 */}
                            <p className="routine-card-type">
                                {getModeText(routine.routine_mode)}
                            </p>

                            {/* 루틴 설명 (없으면 기본 문구) */}
                            <p className="routine-card-desc">
                                {routine.description || "루틴 설명이 아직 없습니다."}
                            </p>

                            {/* 메타 정보: 시간대, 목표 시간, 반복 주기 */}
                            <div className="routine-card-meta">
                                <span>{getTimeText(routine.time_slot)}</span>
                                {routine.goal && <span>{routine.goal}</span>}
                                {routine.repeat_cycle && <span>{routine.repeat_cycle}</span>}
                            </div>
                        </div>

                        {/* ── 버튼 영역 (오른쪽) ── */}
                        <div className="routine-card-right">
                            <div className="routine-card-actions">
                                {/* 완료 버튼: 이 페이지에서는 완료 기능 없음 (홈에서 처리)
                                    disabled 처리하여 클릭 불가, 현재 모드 이름만 표시 */}
                                <button
                                    className={`routine-check-btn ${routine.completed ? "completed-btn" : ""}`}
                                    disabled
                                >
                                    {routine.completed
                                        ? `완료 ${routine.completedAt}`
                                        : routine.routine_mode === "check"
                                            ? "체크 루틴"
                                            : "상세 루틴"}
                                </button>

                                {/* 삭제 버튼: confirm 후 handleDelete 호출 */}
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
