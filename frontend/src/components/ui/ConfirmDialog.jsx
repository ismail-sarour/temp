import { useEffect, useRef } from "react";

// ─── Shared ConfirmDialog ──────────────────────────────────────────────────────
// Accessible modal confirmation dialog — replaces window.confirm() calls.
// Traps focus within the dialog and closes on Escape key.
//
// Usage:
//   const [confirmState, setConfirmState] = useState(null);
//   <ConfirmDialog
//     open={!!confirmState}
//     title="Supprimer ?"
//     message="Cette action est irréversible."
//     onConfirm={() => { doDelete(); setConfirmState(null); }}
//     onCancel={() => setConfirmState(null)}
//   />

/**
 * @param {{
 *   open: boolean,
 *   title?: string,
 *   message?: string,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   danger?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export default function ConfirmDialog({
  open,
  title = "Confirmer",
  message = "Êtes-vous sûr de vouloir continuer ?",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = true,
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null);

  // Auto-focus confirm button on open; close on Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    confirmBtnRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    // Overlay
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(26, 25, 23, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.12s ease",
      }}
    >
      {/* Dialog panel */}
      <div
        style={{
          background: "#FEFCF9",
          border: "0.5px solid #E8E4DC",
          borderRadius: 14,
          padding: "28px 28px 22px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 8px 40px rgba(26,25,23,0.14)",
          animation: "slideUp 0.15s ease",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: danger ? "#FDECEA" : "#E8F0FA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {danger ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 6v4M9 12h.01M3.07 15h11.86c1.17 0 1.9-1.27 1.31-2.28L10.31 3.5a1.5 1.5 0 0 0-2.62 0L1.76 12.72C1.17 13.73 1.9 15 3.07 15z"
                stroke="#9B1C1C"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="#185FA5" strokeWidth="1.5" />
              <path d="M9 8v4M9 6h.01" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {/* Title */}
        <div
          id="confirm-dialog-title"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: "#1A1917",
            marginBottom: 8,
          }}
        >
          {title}
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: 13.5,
            color: "#6B6760",
            lineHeight: 1.55,
            marginBottom: 22,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {message}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              color: "#6B6760",
              border: "0.5px solid #DDD9D0",
              borderRadius: 8,
              padding: "9px 18px",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            style={{
              background: danger ? "#9B1C1C" : "#1A1917",
              color: "#FEFCF9",
              border: "none",
              borderRadius: 8,
              padding: "9px 18px",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      {/* Keyframe animations (injected once via style tag) */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}
