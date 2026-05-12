import React from "react";

function NoticeDetail({ notice, setPage }) {
  if (!notice) return null;

  return (
    <div className="page-container" style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto", backgroundColor: "#fff" }}>
      {/* 상단 제목부 */}
      <div style={{ borderBottom: "2px solid #333", paddingBottom: "20px", marginBottom: "30px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px" }}>
          <span style={{ 
            fontSize: "12px", padding: "4px 10px", borderRadius: "4px", fontWeight: "900",
            background: notice.category === "점검" ? "#fff1f0" : "#f0f5ff",
            color: notice.category === "점검" ? "#ff4d4f" : "var(--primary)"
          }}>
            {notice.category}
          </span>
          <span style={{ color: "#999", fontSize: "14px" }}>{notice.date}</span>
        </div>
        <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#111", margin: 0, lineHeight: "1.4" }}>
          {notice.title}
        </h2>
      </div>

      {/* 본문 내용 */}
      <div style={{ 
        minHeight: "400px", 
        fontSize: "16px", 
        lineHeight: "1.8", 
        color: "#444", 
        whiteSpace: "pre-wrap", 
        paddingBottom: "50px" 
      }}>
        {notice.content}
      </div>

      {/* 목록 버튼 */}
      <div style={{ textAlign: "center", borderTop: "1px solid #eee", paddingTop: "40px" }}>
        <button
          onClick={() => setPage("notice_list")}
          style={{
            padding: "12px 50px",
            borderRadius: "4px",
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default NoticeDetail;