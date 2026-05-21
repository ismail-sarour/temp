// ─── Shared FormCard ───────────────────────────────────────────────────────────
// Styled container for CRUD forms. Wraps children in a 2-col grid by default,
// and renders Save / Cancel buttons at the bottom.
// Pass `columns` to override the grid template, e.g. columns="1fr 1fr 1fr".

/**
 * @param {{
 *   title: string,
 *   onSave: () => void,
 *   onCancel: () => void,
 *   saveLabel?: string,
 *   loading?: boolean,
 *   columns?: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function FormCard({
  title,
  onSave,
  onCancel,
  saveLabel = "Enregistrer",
  loading = false,
  columns = "1fr 1fr",
  children,
}) {
  return (
    <div
      style={{
        background: "#FEFCF9",
        border: "0.5px solid #E8E4DC",
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "#1A1917",
          marginBottom: 20,
        }}
      >
        {title}
      </div>

      {/* Fields grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: columns,
          gap: 16,
          marginBottom: 16,
        }}
      >
        {children}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onSave}
          disabled={loading}
          style={{
            background: "#1A1917",
            color: "#F5F0E8",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            cursor: loading ? "default" : "pointer",
            fontWeight: 500,
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {loading ? "En cours…" : saveLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            background: "transparent",
            color: "#6B6760",
            border: "0.5px solid #DDD9D0",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            cursor: loading ? "default" : "pointer",
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ─── Re-exported shared input styles ───────────────────────────────────────────
// Co-locate so consuming pages import ONE place for both FormCard and style tokens.
export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "0.5px solid #DDD9D0",
  background: "#FEFCF9",
  fontSize: 13.5,
  fontFamily: "'DM Sans', sans-serif",
  color: "#1A1917",
  outline: "none",
  boxSizing: "border-box",
};

export const labelStyle = {
  fontSize: 12,
  fontWeight: 500,
  color: "#6B6760",
  marginBottom: 6,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  fontFamily: "'DM Sans', sans-serif",
};

export const thStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 500,
  color: "#A8A49C",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

export const tdStyle = (extra = {}) => ({
  padding: "13px 16px",
  color: "#6B6760",
  fontSize: 13,
  ...extra,
});
