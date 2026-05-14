// ============================================================
// [신규 2026-05-13 / frontend 머지 Stage 2-2]
// 출처: origin/frontend src/NoticeDetail.jsx (commits adde39d + 98693c1)
// 사유: 공지사항 상세 페이지 신규 추가. dev 경로 규칙(src/frontend/*)으로 이전.
// 기대효과: NoticeList 에서 카드 클릭 → 본문 + 카테고리 배지 + 날짜 + 목록 버튼 표시.
// 장점:
//   - 단순 표시 컴포넌트 (notice props 만 받음, API 호출 없음).
//   - notice == null 가드로 직접 진입 시 빈 화면 처리.
//   - 인라인 스타일 자체완결 → 5단계 App.css 의존 최소.
// 주의 (Stage 2-7 에서 처리):
//   - setPage 는 frontend 측 page-state 기반 네비게이션. dev 의 react-router 와 다름.
// ============================================================
import React from "react";

function NoticeDetail({ notice, setPage }) {
  if (!notice) return null;

  return (
    <div className="page-container" style={{ 
      padding: "20px", 
      maxWidth: "800px", 
      margin: "0 auto", 
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
    }}>
    
      <div style={{ 
        borderBottom: "2px solid #f0f0f0", 
        paddingBottom: "15px", 
        marginBottom: "20px" 
      }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ 
            fontSize: "11px", padding: "3px 8px", borderRadius: "4px", fontWeight: "900",
            background: notice.category === "점검" ? "#fff1f0" : "#f0f5ff",
            color: notice.category === "점검" ? "#ff4d4f" : "var(--primary)"
          }}>
            {notice.category}
          </span>
          <span style={{ color: "#aaa", fontSize: "13px" }}>{notice.date}</span>
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#111", margin: 0, lineHeight: "1.4" }}>
          {notice.title}
        </h2>
      </div>

    
      <div style={{ 
        minHeight: "200px", 
        fontSize: "15px", 
        lineHeight: "1.7", 
        color: "#444", 
        whiteSpace: "pre-wrap", 
        paddingBottom: "30px" 
      }}>
        {notice.content}
      </div>

      <div style={{ 
        textAlign: "center", 
        borderTop: "1px solid #f5f5f5", 
        paddingTop: "25px",
        marginBottom: "10px"
      }}>
        <button
          onClick={() => setPage("notice_list")}
          style={{
            padding: "10px 40px",
            borderRadius: "8px",
            border: "none",
            background: "#333",
            color: "#fff",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.target.style.background = "#111"}
          onMouseOut={(e) => e.target.style.background = "#333"}
        >
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default NoticeDetail;