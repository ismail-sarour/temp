/** Actif / Inactif switch (used next to status badge in tables). */
export default function StatusActiveToggle({ isActive, disabled, onToggle, title }) {
  const resolvedTitle =
    title ??
    (disabled ? "Non modifiable" : isActive ? "Passer en Inactif" : "Passer en Actif");
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={resolvedTitle}
      title={resolvedTitle}
      disabled={disabled}
      onClick={() => !disabled && onToggle()}
      style={{
        position: "relative",
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#E8E4DC" : isActive ? "#3B6D11" : "#C9C4BC",
        transition: "background 0.2s",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: isActive ? 22 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#FEFCF9",
          boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}
