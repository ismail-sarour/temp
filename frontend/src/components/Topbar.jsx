export default function Topbar({ title }) {
  return (
    <div style={{
      background: "#FEFCF9",
      borderBottom: "0.5px solid #E8E4DC",
      padding: "0 24px",
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 600, color: "#1A1917" }}>
        {title}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "#F2EFE8", border: "0.5px solid #DDD9D0",
          borderRadius: 8, padding: "6px 12px",
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="#A8A49C" strokeWidth="1.5"/>
            <path d="M9 9l2.5 2.5" stroke="#A8A49C" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher..."
            style={{
              background: "none", border: "none", outline: "none",
              fontSize: 12.5, color: "#1A1917", width: 130,
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>

        {/* Filter btn */}
        <button style={{
          width: 32, height: 32, borderRadius: 8,
          background: "#F2EFE8", border: "0.5px solid #DDD9D0",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M4 7h6M6 10h2" stroke="#1A1917" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Notif btn */}
        <button style={{
          width: 32, height: 32, borderRadius: 8,
          background: "#F2EFE8", border: "0.5px solid #DDD9D0",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2a4 4 0 014 4v1l1 2H2l1-2V6a4 4 0 014-4z" stroke="#1A1917" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M5.5 10.5a1.5 1.5 0 003 0" stroke="#1A1917" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>
    </div>
  );
}