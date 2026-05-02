// ============================================================
// StatsPage.jsx - 상세 분석 리포트 페이지
// ============================================================
// 역할:
//   - 마이페이지에서 진입하는 상세 통계/분석 화면
//   - 주간/월간 달성률, 시간대별 성취도, 카테고리별 분석 표시
//
// 현재는 mock 데이터로 구성. 추후 백엔드 통계 API 연결 예정:
//   GET /stats/weekly, GET /stats/monthly, GET /stats/category 등
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function StatsPage() {
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState("weekly");
    const [timeSlot, setTimeSlot] = useState("morning");
    const [showPicker, setShowPicker] = useState(false);

    // 날짜 및 데이터 상태
    const [weeklyRange, setWeeklyRange] = useState({
        start: new Date(2026, 3, 27),
        end: new Date(2026, 4, 3),
    });
    const [monthlyRange, setMonthlyRange] = useState({
        start: new Date(2026, 4, 1),
        end: new Date(2026, 4, 31),
    });
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const weeklyData = {
        total: 82,
        chart: [
            { label: "월", rate: 75 },
            { label: "화", rate: 80 },
            { label: "수", rate: 60 },
            { label: "목", rate: 90 },
            { label: "금", rate: 95 },
            { label: "토", rate: 70 },
            { label: "일", rate: 85 },
        ],
    };
    const monthlyData = {
        total: 74,
        chart: [
            { label: "1주", rate: 85 },
            { label: "2주", rate: 60 },
            { label: "3주", rate: 92 },
            { label: "4주", rate: 78 },
            { label: "5주", rate: 55 },
        ],
    };

    const routineStats = {
        morning: [
            { name: "기상하기", rate: 90 },
            { name: "아침 약 먹기", rate: 75 },
            { name: "침구류 정리하기", rate: 80 },
        ],
        lunch: [
            { name: "물 1L 마시기", rate: 50 },
            { name: "비타민 먹기", rate: 100 },
        ],
        dinner: [
            { name: "독서하기", rate: 30 },
            { name: "일기 쓰기", rate: 60 },
        ],
    };

    const categoryStats = [
        { name: "운동", rate: 78, color: "#4f46e5" },
        { name: "미라클 모닝", rate: 88, color: "#fbbf24" },
        { name: "식사", rate: 72, color: "#f87171" },
    ];

    const handleDateClick = (date) => {
        if (viewMode === "weekly") {
            const endDate = new Date(date);
            endDate.setDate(date.getDate() + 6);
            setWeeklyRange({ start: date, end: endDate });
            setShowPicker(false);
        } else {
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            setMonthlyRange({ start: firstDay, end: lastDay });
            setShowPicker(false);
        }
    };

    const hoverEffect = {
        transition: "all 0.2s ease",
        cursor: "pointer",
    };

    const getDayStyle = (date) => {
        const range = viewMode === "weekly" ? weeklyRange : monthlyRange;
        const isStart = range.start && date.getTime() === range.start.getTime();
        const isEnd = range.end && date.getTime() === range.end.getTime();
        const isInRange = range.start && range.end && date > range.start && date < range.end;

        return {
            width: "14.28%",
            padding: "10px 0",
            textAlign: "center",
            fontSize: "13px",
            borderRadius: "8px",
            backgroundColor: (isStart || isEnd) ? "#4f46e5" : isInRange ? "#eef2ff" : "transparent",
            color: (isStart || isEnd) ? "#fff" : "#374151",
            ...hoverEffect,
        };
    };

    return (
        <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", paddingBottom: "80px", position: "relative" }}>
            {/* 1. 상단 헤더 */}
            <div style={{ padding: "20px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <button onClick={() => navigate("/mypage")} style={{ background: "none", border: "none", fontSize: "20px", ...hoverEffect }}>←</button>
                    <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>상세 분석 리포트</h1>
                </div>
                <button onClick={() => setShowPicker(!showPicker)} style={{ background: "#f3f4f6", border: "none", padding: "8px 12px", borderRadius: "10px", fontSize: "18px", ...hoverEffect }}>📅</button>
            </div>

            {/* 달력 팝업 */}
            {showPicker && (
                <div style={{ position: "absolute", top: "70px", right: "20px", width: "300px", background: "#fff", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 100, padding: "20px", border: "1px solid #eee" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ border: "none", background: "none", ...hoverEffect }}>◀</button>
                        <span style={{ fontWeight: "bold" }}>{currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월</span>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ border: "none", background: "none", ...hoverEffect }}>▶</button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", marginBottom: "10px" }}>
                        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                            <div key={d} style={{ width: "14.28%", textAlign: "center", fontSize: "11px", color: "#9ca3af" }}>{d}</div>
                        ))}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                        {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                            return (
                                <div key={i + 1} onClick={() => handleDateClick(date)} style={getDayStyle(date)}>
                                    {i + 1}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 2. 주간/월간 탭 */}
            <div style={{ display: "flex", background: "#fff", padding: "10px 20px", gap: "10px", borderBottom: "1px solid #f3f4f6" }}>
                {["weekly", "monthly"].map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        style={{
                            flex: 1,
                            padding: "12px",
                            borderRadius: "12px",
                            border: "none",
                            background: viewMode === mode ? "#4f46e5" : "#f3f4f6",
                            color: viewMode === mode ? "#fff" : "#9ca3af",
                            fontWeight: "bold",
                            ...hoverEffect,
                        }}
                        onMouseOver={(e) => { if (viewMode !== mode) e.target.style.background = "#e5e7eb"; }}
                        onMouseOut={(e) => { if (viewMode !== mode) e.target.style.background = "#f3f4f6"; }}
                    >
                        {mode === "weekly" ? "주간 통계" : "월간 통계"}
                    </button>
                ))}
            </div>

            {/* 3. 통합 달성률 섹션 */}
            <div style={{ padding: "25px 20px", background: "#fff", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "16px", color: "#4f46e5", marginBottom: "8px", fontWeight: "800" }}>
                    {viewMode === "weekly"
                        ? `${weeklyRange.start.getMonth() + 1}월 ${Math.ceil(weeklyRange.start.getDate() / 7)}주차 통합 달성률`
                        : `${monthlyRange.start.getMonth() + 1}월 통합 달성률`}
                </h3>
                <p style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>
                    {viewMode === "weekly"
                        ? `${weeklyRange.start.toLocaleDateString()} ~ ${weeklyRange.end.toLocaleDateString()}`
                        : `${monthlyRange.start.toLocaleDateString()} ~ ${monthlyRange.end.toLocaleDateString()}`}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ flex: 1, height: "12px", background: "#f3f4f6", borderRadius: "6px", overflow: "hidden" }}>
                        <div style={{ width: `${viewMode === "weekly" ? weeklyData.total : monthlyData.total}%`, height: "100%", background: "#4f46e5" }}></div>
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: "800", color: "#4f46e5" }}>
                        {viewMode === "weekly" ? weeklyData.total : monthlyData.total}%
                    </span>
                </div>
            </div>

            {/* 4. 요일별/주차별 분석 그래프 */}
            <div style={{ padding: "25px 20px", background: "#fff", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "15px", color: "#374151", marginBottom: "30px", fontWeight: "700" }}>
                    {viewMode === "weekly" ? "요일별" : "주차별"} 목표 달성률
                </h3>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "140px" }}>
                    {(viewMode === "weekly" ? weeklyData : monthlyData).chart.map((item, i) => (
                        <div key={i} style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#4f46e5", marginBottom: "8px" }}>
                                {item.rate}%
                            </span>
                            <div style={{
                                height: "80px",
                                width: viewMode === "weekly" ? "16px" : "28px",
                                background: "#f3f4f6",
                                borderRadius: "8px",
                                position: "relative",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-end",
                                overflow: "hidden",
                            }}>
                                <div style={{ height: `${item.rate}%`, background: "#4f46e5", borderRadius: "8px", transition: "height 0.3s ease" }}></div>
                            </div>
                            <span style={{ fontSize: "12px", color: "#9ca3af", marginTop: "10px", display: "block" }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. 시간대별 상세 성취도 */}
            <div style={{ padding: "25px 20px", background: "#fff", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "15px", color: "#374151", marginBottom: "20px", fontWeight: "700" }}>시간대별 상세 성취도</h3>
                <div style={{ display: "flex", background: "#f3f4f6", borderRadius: "10px", padding: "4px", marginBottom: "20px" }}>
                    {["morning", "lunch", "dinner"].map((slot) => (
                        <button
                            key={slot}
                            onClick={() => setTimeSlot(slot)}
                            style={{
                                flex: 1,
                                padding: "10px",
                                border: "none",
                                borderRadius: "8px",
                                background: timeSlot === slot ? "#4f46e5" : "transparent",
                                color: timeSlot === slot ? "#fff" : "#9ca3af",
                                fontSize: "13px",
                                fontWeight: "bold",
                                ...hoverEffect,
                            }}
                            onMouseOver={(e) => { if (timeSlot !== slot) e.target.style.background = "#e5e7eb"; }}
                            onMouseOut={(e) => { if (timeSlot !== slot) e.target.style.background = "transparent"; }}
                        >
                            {slot === "morning" ? "아침" : slot === "lunch" ? "점심" : "저녁"}
                        </button>
                    ))}
                </div>
                {routineStats[timeSlot].map((item, i) => (
                    <div key={i} style={{ marginBottom: "18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                            <span>{item.name}</span>
                            <span style={{ color: "#4f46e5", fontWeight: "bold" }}>{item.rate}%</span>
                        </div>
                        <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${item.rate}%`, height: "100%", background: "#4f46e5" }}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 6. 카테고리별 분석 */}
            <div style={{ padding: "25px 20px", background: "#fff", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "15px", color: "#374151", marginBottom: "20px", fontWeight: "700" }}>카테고리별 분석</h3>
                {categoryStats.map((cat, i) => (
                    <div key={i} style={{ marginBottom: "18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                            <span>{cat.name}</span>
                            <span style={{ fontWeight: "bold", color: cat.color }}>{cat.rate}%</span>
                        </div>
                        <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${cat.rate}%`, height: "100%", background: cat.color }}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 7. 최다 연속 갓생 카드 */}
            <div style={{ margin: "10px 20px", padding: "25px", background: "linear-gradient(135deg, #4f46e5, #818cf8)", borderRadius: "20px", color: "#fff", textAlign: "center" }}>
                <span style={{ fontSize: "14px", opacity: 0.9 }}>최다 연속 갓생 달성</span>
                <div style={{ fontSize: "32px", fontWeight: "900", marginTop: "5px" }}>12일 연속 🔥</div>
            </div>
        </div>
    );
}

export default StatsPage;
