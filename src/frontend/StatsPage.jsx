// ============================================================
// StatsPage.jsx - 상세 분석 리포트 페이지
// ============================================================
// 역할:
//   - 마이페이지에서 진입하는 상세 통계/분석 화면
//   - 주간/월간 달성률, 시간대별 성취도, 카테고리별 분석 표시
//
// [수정 2026-05-10]
// 현재는 Express GET /stats 를 호출해 DB 기반 실제 통계를 표시한다.
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EXPRESS_URL } from "./config";

const createWeekRange = (baseDate = new Date()) => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
};

const createMonthRange = (baseDate = new Date()) => {
    return {
        start: new Date(baseDate.getFullYear(), baseDate.getMonth(), 1),
        end: new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0),
    };
};

const formatDateForApi = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

function StatsPage() {
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState("weekly");
    const [timeSlot, setTimeSlot] = useState("morning");
    const [showPicker, setShowPicker] = useState(false);
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    // 날짜 및 데이터 상태
    const [weeklyRange, setWeeklyRange] = useState(createWeekRange);
    const [monthlyRange, setMonthlyRange] = useState(createMonthRange);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const activeRange = viewMode === "weekly" ? weeklyRange : monthlyRange;
    const routineStats = statsData?.routine_stats || { morning: [], lunch: [], dinner: [] };
    const categoryStats = statsData?.category_stats || [];
    const chartData = statsData?.chart || [];
    const totalRate = statsData?.total || 0;
    const bestStreak = statsData?.best_streak || 0;

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // [추가 2026-05-10] 상세 분석 실제 통계 API 연결.
                // 이유: 기존 고정 mock 값을 제거하고, 사용자가 선택한 기간의
                // routine_completions 기반 달성률을 표시하기 위함.
                const params = new URLSearchParams({
                    mode: viewMode,
                    start: formatDateForApi(activeRange.start),
                    end: formatDateForApi(activeRange.end),
                });
                const res = await fetch(`${EXPRESS_URL}/stats?${params.toString()}`, {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success) {
                    setStatsData(data.stats);
                }
            } catch (error) {
                console.error("상세 통계 로딩 실패:", error);
                setStatsData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [activeRange.end, activeRange.start, viewMode]);

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
                        ? `${activeRange.start.getMonth() + 1}월 ${Math.ceil(activeRange.start.getDate() / 7)}주차 통합 달성률`
                        : `${activeRange.start.getMonth() + 1}월 통합 달성률`}
                </h3>
                <p style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>
                    {`${activeRange.start.toLocaleDateString()} ~ ${activeRange.end.toLocaleDateString()}`}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ flex: 1, height: "12px", background: "#f3f4f6", borderRadius: "6px", overflow: "hidden" }}>
                        <div style={{ width: `${totalRate}%`, height: "100%", background: "#4f46e5" }}></div>
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: "800", color: "#4f46e5" }}>
                        {loading ? "..." : `${totalRate}%`}
                    </span>
                </div>
            </div>

            {/* 4. 요일별/주차별 분석 그래프 */}
            <div style={{ padding: "25px 20px", background: "#fff", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "15px", color: "#374151", marginBottom: "30px", fontWeight: "700" }}>
                    {viewMode === "weekly" ? "요일별" : "주차별"} 목표 달성률
                </h3>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "140px" }}>
                    {chartData.map((item, i) => (
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
                    {!loading && chartData.length === 0 && (
                        <p style={{ width: "100%", textAlign: "center", color: "#9ca3af", fontWeight: "700" }}>
                            표시할 통계가 아직 없어요.
                        </p>
                    )}
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
                {(routineStats[timeSlot] || []).map((item, i) => (
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
                {!loading && (routineStats[timeSlot] || []).length === 0 && (
                    <p style={{ color: "#9ca3af", fontSize: "14px", fontWeight: "700" }}>
                        이 시간대에 등록된 루틴이 없어요.
                    </p>
                )}
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
                {!loading && categoryStats.length === 0 && (
                    <p style={{ color: "#9ca3af", fontSize: "14px", fontWeight: "700" }}>
                        표시할 카테고리 통계가 아직 없어요.
                    </p>
                )}
            </div>

            {/* 7. 최다 연속 갓생 카드 */}
            <div style={{ margin: "10px 20px", padding: "25px", background: "linear-gradient(135deg, #4f46e5, #818cf8)", borderRadius: "20px", color: "#fff", textAlign: "center" }}>
                <span style={{ fontSize: "14px", opacity: 0.9 }}>최다 연속 갓생 달성</span>
                <div style={{ fontSize: "32px", fontWeight: "900", marginTop: "5px" }}>{bestStreak}일 연속 🔥</div>
            </div>
        </div>
    );
}

export default StatsPage;
