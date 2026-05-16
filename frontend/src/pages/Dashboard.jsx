import { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import { useApiData } from "../hooks/useApiData";
import {
  buildDashboardKpis,
  runSystemAlertsScan,
  exportDashboardCsv,
} from "../services/modulesReporting";

const cardStyle = {
  background: "#FEFCF9",
  border: "0.5px solid #E8E4DC",
  borderRadius: 16,
  padding: 24,
  minWidth: 200,
};

const labelStyle = {
  fontSize: 12,
  color: "#6B6760",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const valueStyle = {
  fontSize: 26,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 700,
  color: "#1A1917",
  marginTop: 8,
};

const formatAmount = (value) => Number(value || 0).toLocaleString("fr-FR");

export default function Dashboard() {
  const { data: apiSummary, loading, error } = useApiData("dashboard/summary");
  const [kpis, setKpis] = useState(() => buildDashboardKpis());

  const refresh = () => {
    runSystemAlertsScan();
    setKpis(buildDashboardKpis());
  };

  useEffect(() => {
    refresh();
    const onChange = () => setKpis(buildDashboardKpis());
    window.addEventListener("localStorageChange", onChange);
    window.addEventListener("dataStoreChange", onChange);
    return () => {
      window.removeEventListener("localStorageChange", onChange);
      window.removeEventListener("dataStoreChange", onChange);
    };
  }, []);

  const useApi =
    !error && apiSummary?.length > 0 && kpis.budgetAlloue === 0;

  const totalAmount = useApi
    ? apiSummary.reduce((s, i) => s + Number(i.total_amount || 0), 0)
    : kpis.budgetAlloue;
  const totalConsumed = useApi
    ? apiSummary.reduce((s, i) => s + Number(i.total_consumed || 0), 0)
    : kpis.budgetConsomme;
  const totalRemaining = useApi
    ? apiSummary.reduce((s, i) => s + Number(i.total_remaining || 0), 0)
    : kpis.budgetDisponible;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}
    >
      <Topbar title="Vue d'ensemble" />
      <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#F6F5F2" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#1A1917",
              }}
            >
              Tableau de bord
            </div>
            <div style={{ fontSize: 13, color: "#6B6760", marginTop: 6 }}>
              Situation budgétaire et indicateurs opérationnels (modules 1–12).
              {useApi ? " Données API." : " Données PostgreSQL (API)."}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={refresh}
              style={{
                background: "#F2EFE8",
                border: "0.5px solid #DDD9D0",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Actualiser
            </button>
            <button
              type="button"
              onClick={() => exportDashboardCsv(kpis)}
              style={{
                background: "#1A1917",
                color: "#F5F0E8",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ fontSize: 13, color: "#6B6760", marginBottom: 16 }}>
            Chargement API…
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={cardStyle}>
            <div style={labelStyle}>Budget alloué</div>
            <div style={valueStyle}>{formatAmount(totalAmount)} MAD</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Engagé</div>
            <div style={valueStyle}>{formatAmount(kpis.budgetEngage)} MAD</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Consommé (payé)</div>
            <div style={valueStyle}>{formatAmount(totalConsumed)} MAD</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Solde disponible</div>
            <div
              style={{
                ...valueStyle,
                color: totalRemaining < 0 ? "#993C1D" : "#1A1917",
              }}
            >
              {formatAmount(totalRemaining)} MAD
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Exercices actifs", value: kpis.activeExercises },
            { label: "BC en cours", value: kpis.totalBc },
            { label: "BC → attribution", value: kpis.bcAttenteAttribution },
            { label: "OP en attente", value: kpis.opEnAttente },
            { label: "Paiements en attente", value: kpis.paiementsEnAttente },
            { label: "Docs expirés", value: kpis.docsExpires },
          ].map((item) => (
            <div key={item.label} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ ...labelStyle, fontSize: 10 }}>{item.label}</div>
              <div style={{ ...valueStyle, fontSize: 22 }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          <div style={{ ...cardStyle, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#1A1917",
                marginBottom: 14,
              }}
            >
              BC par statut
            </div>
            {Object.keys(kpis.bcByStatus).length === 0 ? (
              <div style={{ color: "#A8A49C", fontSize: 13 }}>Aucun BC</div>
            ) : (
              Object.entries(kpis.bcByStatus).map(([status, count]) => (
                <div
                  key={status}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "0.5px solid #F2EFE8",
                    fontSize: 13,
                  }}
                >
                  <span>{status}</span>
                  <strong>{count}</strong>
                </div>
              ))
            )}
          </div>

          <div style={{ ...cardStyle, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#1A1917",
                marginBottom: 14,
              }}
            >
              Top fournisseurs (paiements)
            </div>
            {kpis.topFournisseurs.length === 0 ? (
              <div style={{ color: "#A8A49C", fontSize: 13 }}>Aucun paiement</div>
            ) : (
              kpis.topFournisseurs.map((f) => (
                <div
                  key={f.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "0.5px solid #F2EFE8",
                    fontSize: 13,
                  }}
                >
                  <span>{f.name}</span>
                  <strong>{formatAmount(f.amount)} MAD</strong>
                </div>
              ))
            )}
          </div>

          <div style={{ ...cardStyle, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#1A1917",
                marginBottom: 14,
              }}
            >
              Lignes à crédit faible (&lt; 15 %)
            </div>
            {kpis.lignesCreditFaible.length === 0 ? (
              <div style={{ color: "#3B6D11", fontSize: 13 }}>Aucune alerte</div>
            ) : (
              kpis.lignesCreditFaible.map((l) => (
                <div
                  key={`${l.exercice_id}-${l.libelle_id}`}
                  style={{
                    padding: "8px 0",
                    borderBottom: "0.5px solid #F2EFE8",
                    fontSize: 12,
                    color: "#854F0B",
                  }}
                >
                  Reste {formatAmount(l.available)} MAD ({l.pct} %)
                </div>
              ))
            )}
          </div>
        </div>

        {useApi && apiSummary.length > 0 && (
          <div
            style={{
              marginTop: 24,
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              Résumé API par exercice
            </div>
            {apiSummary.map((item) => (
              <div
                key={item.year}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 12,
                  padding: 12,
                  marginBottom: 8,
                  background: "#F6F5F2",
                  borderRadius: 10,
                  fontSize: 13,
                }}
              >
                <div>
                  <div style={{ fontSize: 10, color: "#A8A49C" }}>Exercice</div>
                  <strong>{item.label || item.year}</strong>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#A8A49C" }}>Prévu</div>
                  {formatAmount(item.total_amount)} MAD
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#A8A49C" }}>Consommé</div>
                  {formatAmount(item.total_consumed)} MAD
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#A8A49C" }}>Restant</div>
                  {formatAmount(item.total_remaining)} MAD
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
