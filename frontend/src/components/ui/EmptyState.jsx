// ─── Shared EmptyState ─────────────────────────────────────────────────────────
// Renders an empty-list placeholder card. Optionally shows an icon and a CTA.

/**
 * @param {{
 *   message: string,
 *   icon?: React.ReactNode,
 *   action?: React.ReactNode,
 * }} props
 */
export default function EmptyState({ message, icon, action }) {
  return (
    <div
      style={{
        background: "#FEFCF9",
        border: "0.5px solid #E8E4DC",
        borderRadius: 12,
        padding: "48px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      {icon && (
        <div style={{ color: "#DDD9D0", marginBottom: 4 }}>{icon}</div>
      )}
      <div
        style={{
          fontSize: 13.5,
          color: "#A8A49C",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {message}
      </div>
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}
