// ─── Shared PageHeader ─────────────────────────────────────────────────────────
// A titled flex header with an optional subtitle and right-aligned actions slot.
// Mirrors the repeated pattern: title + subtitle + AddBtn (or custom actions).

/**
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   actions?: React.ReactNode,
 *   style?: React.CSSProperties,
 * }} props
 */
export default function PageHeader({ title, subtitle, actions, style }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        flexWrap: "wrap",
        gap: 12,
        ...style,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: "#1A1917",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 12,
              color: "#A8A49C",
              marginTop: 2,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {actions}
        </div>
      )}
    </div>
  );
}

// ─── Re-exported AddBtn convenience ────────────────────────────────────────────
// Many pages use an identical "+ Label" button. Export it here for co-location.
export function AddBtn({ onClick, label, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: disabled ? "#DDD9D0" : "#1A1917",
        color: "#F5F0E8",
        border: "none",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 12.5,
        fontFamily: "'DM Sans', sans-serif",
        cursor: disabled ? "default" : "pointer",
        fontWeight: 500,
        opacity: disabled ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 1v10M1 6h10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      {label}
    </button>
  );
}
