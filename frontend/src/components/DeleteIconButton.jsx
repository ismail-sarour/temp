const btnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  padding: 0,
  borderRadius: 8,
  border: "0.5px solid #F5C7BB",
  background: "#FAECE7",
  color: "#993C1D",
  cursor: "pointer",
  flexShrink: 0,
};

const defaultMessage =
  "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.";

/** Trash icon; asks for confirmation before calling onConfirm. */
export default function DeleteIconButton({ onConfirm, disabled, title = "Supprimer", message }) {
  const msg = message ?? defaultMessage;
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        if (window.confirm(msg)) onConfirm();
      }}
      style={{
        ...btnStyle,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 3h6M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
