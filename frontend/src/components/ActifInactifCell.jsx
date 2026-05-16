import StatusActiveToggle from "./StatusActiveToggle";

/** Badge + toggle pour lignes Actif / Inactif (ex. Gestion budget, Paramétrage). */
export default function ActifInactifCell({ status, onToggle, disabled, children }) {
  const binary = status === "Actif" || status === "Inactif";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {children}
      {binary && (
        <StatusActiveToggle
          isActive={status === "Actif"}
          disabled={disabled}
          onToggle={onToggle}
          title={status === "Actif" ? "Passer en Inactif" : "Passer en Actif"}
        />
      )}
    </div>
  );
}
