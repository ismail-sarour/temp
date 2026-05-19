import React, { useState } from "react";
import "./AIDashboard.css";

// ─── Trend Icon ───────────────────────────────────────────────────────────────
const TrendIcon = ({ trend }) => {
  if (trend === "up") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{ display: "inline", verticalAlign: "middle" }}
      >
        <path
          d="M2 10L6 5L9 8L12 3"
          stroke="#dc3545"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 3h2v2"
          stroke="#dc3545"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (trend === "down") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{ display: "inline", verticalAlign: "middle" }}
      >
        <path
          d="M2 4L6 9L9 6L12 11"
          stroke="#28a745"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 11h2v-2"
          stroke="#28a745"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ display: "inline", verticalAlign: "middle" }}
    >
      <path
        d="M2 7h10"
        stroke="#6c757d"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

// ─── AI Brain Icon ────────────────────────────────────────────────────────────
const AIIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }}
  >
    <circle cx="8" cy="8" r="5" stroke="#28a745" strokeWidth="1.5" />
    <path
      d="M5.5 8c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5"
      stroke="#28a745"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <circle cx="8" cy="9.5" r="0.8" fill="#28a745" />
  </svg>
);

// ─── Severity Config ──────────────────────────────────────────────────────────
const getSeverityConfig = (severity) => {
  switch (severity) {
    case "Critical":
      return { className: "severity-critical", label: "Critique" };
    case "High":
      return { className: "severity-high", label: "Élevé" };
    case "Medium":
      return { className: "severity-medium", label: "Moyen" };
    case "Low":
      return { className: "severity-low", label: "Faible" };
    default:
      return { className: "", label: severity };
  }
};

// ─── Badge Config ─────────────────────────────────────────────────────────────
const getBadgeClass = (badge) => {
  if (!badge) return "";
  const map = {
    Urgent: "badge-urgent",
    Critique: "badge-critical",
    Violation: "badge-critical",
    Suspect: "badge-critical",
    "Expire bientôt": "badge-warning",
    Attention: "badge-warning",
    Retard: "badge-warning",
    "En retard": "badge-warning",
    "Non-conforme": "badge-warning",
    "Écart détecté": "badge-warning",
    Anomalie: "badge-warning",
    Nouveau: "badge-info",
    Info: "badge-info",
    "Rapport mensuel": "badge-info",
    Benchmark: "badge-info",
    "Prévision IA": "badge-ai",
    Opportunité: "badge-success",
    Positif: "badge-success",
    "Sous-objectif": "badge-neutral",
    Dégradation: "badge-warning",
  };
  return map[badge] || "badge-neutral";
};

// ─── AlertCard Component ──────────────────────────────────────────────────────
const AlertCard = ({ alert, extraMeta = null }) => {
  const [expanded, setExpanded] = useState(false);
  const severityConfig = getSeverityConfig(alert.severity);
  const badgeClass = getBadgeClass(alert.badge);

  return (
    <div className={`alert-card alert-card--${alert.severity?.toLowerCase()}`}>
      {/* Header */}
      <div className="alert-header">
        <span className={`alert-severity ${severityConfig.className}`}>
          {severityConfig.label}
        </span>
        {alert.badge && (
          <span className={`warning-badge ${badgeClass}`}>{alert.badge}</span>
        )}
        {alert.date && (
          <span className="alert-date">
            {new Date(alert.date).toLocaleDateString("fr-MA", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="alert-title">{alert.title}</h4>

      {/* Description */}
      <p className="alert-description">{alert.description}</p>

      {/* Extra meta (department, entity, period, etc.) */}
      {extraMeta && <div className="alert-meta">{extraMeta}</div>}

      {/* Financial Summary */}
      {alert.financialSummary && (
        <div className="financial-summary">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            style={{ marginRight: 5, verticalAlign: "middle" }}
          >
            <circle cx="8" cy="8" r="6" stroke="#007bff" strokeWidth="1.5" />
            <path
              d="M8 5v3l2 2"
              stroke="#007bff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <strong>Impact financier :</strong> {alert.financialSummary}
        </div>
      )}

      {/* KPI Block (for reporting insights) */}
      {alert.kpi && (
        <div className="kpi-block">
          <div className="kpi-row">
            <span className="kpi-label">{alert.kpi}</span>
            <span className="kpi-value">{alert.kpiValue}</span>
          </div>
          {alert.kpiTarget && (
            <div className="kpi-row kpi-row--sub">
              <span className="kpi-label">Objectif</span>
              <span className="kpi-target">{alert.kpiTarget}</span>
              <span
                className={`kpi-variance ${alert.trend === "up" && alert.category !== "Savings" ? "variance-negative" : alert.trend === "down" ? "variance-negative" : "variance-positive"}`}
              >
                {alert.kpiVariance}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Trend Indicator */}
      {(alert.trend || alert.trendLabel) && (
        <div className="trend-indicator">
          <TrendIcon trend={alert.trend} />
          <span style={{ marginLeft: 5 }}>{alert.trendLabel}</span>
        </div>
      )}

      {/* Confidence Score (for audit insights) */}
      {alert.confidence !== undefined && (
        <div className="confidence-bar-wrapper">
          <div className="confidence-bar-label">
            <span>Confiance IA</span>
            <span className="confidence-value">{alert.confidence} %</span>
          </div>
          <div className="confidence-bar-track">
            <div
              className="confidence-bar-fill"
              style={{
                width: `${alert.confidence}%`,
                backgroundColor:
                  alert.confidence >= 90
                    ? "#dc3545"
                    : alert.confidence >= 70
                      ? "#ffc107"
                      : "#28a745",
              }}
            />
          </div>
        </div>
      )}

      {/* Risk Score (for audit insights) */}
      {alert.riskScore !== undefined && (
        <div className="risk-score-wrapper">
          <span className="risk-score-label">Score de risque :</span>
          <span
            className={`risk-score-value ${
              alert.riskScore >= 80
                ? "risk-critical"
                : alert.riskScore >= 60
                  ? "risk-high"
                  : alert.riskScore >= 40
                    ? "risk-medium"
                    : "risk-low"
            }`}
          >
            {alert.riskScore}/100
          </span>
        </div>
      )}

      {/* AI Recommendation */}
      {alert.recommendation && (
        <div className="ai-recommendation">
          <AIIcon />
          <strong>Recommandation IA :</strong> {alert.recommendation}
        </div>
      )}

      {/* Expandable Details Panel */}
      {alert.details && (
        <>
          <button
            className="expandable-panel-toggle"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? "▲ Masquer les détails" : "▼ Voir les détails"}
          </button>
          {expanded && (
            <div className="expandable-panel-content">
              <p>{alert.details}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AlertCard;
