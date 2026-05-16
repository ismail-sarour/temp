import Topbar from "../components/Topbar";
import { useApiData, API_BASE_URL } from "../hooks/useApiData";

const cardStyle = {
  background: "#FEFCF9",
  border: "0.5px solid #E8E4DC",
  borderRadius: 16,
  padding: 24,
  minWidth: 220,
};

const labelStyle = {
  fontSize: 12,
  color: "#6B6760",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const valueStyle = {
  fontSize: 28,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 700,
  color: "#1A1917",
  marginTop: 8,
};

const formatAmount = (value) => Number(value || 0).toLocaleString("fr-FR");

export default function Dashboard() {
  const { data: summary, loading, error } = useApiData("dashboard/summary");
  const { data: exercises } = useApiData("exercises");

  const totalAmount = summary.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const totalConsumed = summary.reduce((sum, item) => sum + Number(item.total_consumed || 0), 0);
  const totalRemaining = summary.reduce((sum, item) => sum + Number(item.total_remaining || 0), 0);
  const validatedBudgets = summary.filter(item => item.status === "validated").length;
  const activeExercises = exercises.filter(item => item.status === "active").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Topbar title="Vue d'ensemble" />
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#F6F5F2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: "#1A1917" }}>Tableau de bord</div>
            <div style={{ fontSize: 13, color: "#6B6760", marginTop: 6 }}>Données synchronisées depuis la base de données via l'API.</div>
          </div>
          {loading ? (
            <div style={{ color: "#6B6760" }}>Chargement...</div>
          ) : error ? (
            <div style={{ color: "#993C1D" }}>Erreur de connexion à l'API : {error.message}</div>
          ) : null}
        </div>

        {error && (
          <div style={{ marginTop: 20, background: "#FFF4F0", border: "0.5px solid #F5C7BB", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#993C1D", marginBottom: 8 }}>Backend non trouvé</div>
            <div style={{ color: "#6B6760", marginBottom: 8 }}>Le dashboard essaie de se connecter à : <code style={{ background: "#F5F0E8", padding: "2px 6px", borderRadius: 4 }}>{API_BASE_URL}</code></div>
            <div style={{ color: "#6B6760", marginBottom: 8 }}>Valeur VITE_API_BASE_URL chargée : <code style={{ background: "#F5F0E8", padding: "2px 6px", borderRadius: 4 }}>{import.meta.env.VITE_API_BASE_URL || "(vide)"}</code></div>
            <div style={{ color: "#6B6760" }}>Arrêtez le service utilisant ce port ou mettez à jour <code style={{ background: "#F5F0E8", padding: "2px 6px", borderRadius: 4 }}>VITE_API_BASE_URL</code> dans <code style={{ background: "#F5F0E8", padding: "2px 6px", borderRadius: 4 }}>.env</code>, puis redémarrez le serveur Vite.</div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 24 }}>
          <div style={cardStyle}>
            <div style={labelStyle}>Exercices actifs</div>
            <div style={valueStyle}>{activeExercises}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Total budget annuel</div>
            <div style={valueStyle}>{formatAmount(totalAmount)} MAD</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Consommation</div>
            <div style={valueStyle}>{formatAmount(totalConsumed)} MAD</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Reste</div>
            <div style={{ ...valueStyle, color: totalRemaining < 0 ? "#993C1D" : "#1A1917" }}>{formatAmount(totalRemaining)} MAD</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div style={cardStyle}>
            <div style={labelStyle}>Budgets validés</div>
            <div style={valueStyle}>{validatedBudgets}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Périodes</div>
            <div style={valueStyle}>{summary.length}</div>
          </div>
        </div>

        {summary.length > 0 && (
          <div style={{ marginTop: 24, background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: "#1A1917", marginBottom: 16 }}>Résumé par exercice</div>
            <div style={{ display: "grid", gap: 14 }}>
              {summary.map((item) => (
                <div key={item.year} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, padding: 16, borderRadius: 12, background: "#F6F5F2" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>Exercice</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1917" }}>{item.label || item.year}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>Total prévu</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1917" }}>{formatAmount(item.total_amount)} MAD</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>Consommé</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1917" }}>{formatAmount(item.total_consumed)} MAD</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>Restant</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: item.total_remaining < 0 ? "#993C1D" : "#1A1917" }}>{formatAmount(item.total_remaining)} MAD</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
