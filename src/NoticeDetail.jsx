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