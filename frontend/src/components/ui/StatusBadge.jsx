// ─── Shared StatusBadge ────────────────────────────────────────────────────────
// Centralizes status pill rendering. Pass any known status string and it will
// render with the correct background / foreground tokens from the design system.

const STATUS_COLORS = {
  // Lifecycle
  "Actif":       { bg: "#EAF4E2", color: "#3B6D11" },
  "Inactif":     { bg: "#F5F0E8", color: "#6B6760" },
  "Clôturé":     { bg: "#F5F0E8", color: "#6B6760" },
  // Budget
  "Brouillon":   { bg: "#E8F0FA", color: "#185FA5" },
  "Validé":      { bg: "#EAF4E2", color: "#3B6D11" },
  // Engagements / Executions
  "En cours":    { bg: "#E8F0FA", color: "#185FA5" },
  "Approuvé":    { bg: "#EAF4E2", color: "#3B6D11" },
  "Rejeté":      { bg: "#FDECEA", color: "#9B1C1C" },
  "Annulé":      { bg: "#F5F0E8", color: "#6B6760" },
  "Payé":        { bg: "#EAF4E2", color: "#3B6D11" },
  "Partiellement payé": { bg: "#FFF3CD", color: "#856404" },
  "En attente":  { bg: "#FFF3CD", color: "#856404" },
  "Soumis":      { bg: "#E8F0FA", color: "#185FA5" },
  "Terminé":     { bg: "#EAF4E2", color: "#3B6D11" },
  "Suspendu":    { bg: "#FFF3CD", color: "#856404" },
};

/**
 * @param {{ status: string, size?: "sm" | "md" }} props
 */
export default function StatusBadge({ status, size = "md" }) {
  const theme = STATUS_COLORS[status] ?? STATUS_COLORS["Inactif"];
  const fontSize = size === "sm" ? 10.5 : 11.5;

  return (
    <span
      style={{
        background: theme.bg,
        color: theme.color,
        padding: size === "sm" ? "1px 7px" : "2px 9px",
        borderRadius: 20,
        fontSize,
        fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
}
