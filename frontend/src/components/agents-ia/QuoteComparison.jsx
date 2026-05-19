import React, { useState, useEffect, useMemo } from "react";
import agentsIAService from "../../services/agentsIAService";
import "./AIDashboard.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: "All", label: "Tous" },
  { key: "Anomaly", label: "Anomalies" },
  { key: "Incomplete", label: "Incomplets" },
  { key: "Normal", label: "Conformes" },
];

const CATEGORIES = [
  { key: "All", label: "Toutes catégories" },
  { key: "Informatique", label: "Informatique" },
  { key: "Services", label: "Services" },
  { key: "Équipements", label: "Équipements" },
  { key: "Travaux", label: "Travaux" },
  { key: "Formation", label: "Formation" },
];

const SORT_OPTIONS = [
  { key: "aiRiskScore", label: "Score de risque IA" },
  { key: "estimatedBudget", label: "Budget estimé" },
  { key: "priceSpread", label: "Écart de prix" },
  { key: "closeDate", label: "Date de clôture" },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────
const getTenderStatusConfig = (status) => {
  switch (status) {
    case "Anomaly":
      return {
        color: "#dc3545",
        bg: "#fff0f0",
        border: "#f5c6cb",
        label: "Anomalie détectée",
        icon: "⚠️",
      };
    case "Incomplete":
      return {
        color: "#fd7e14",
        bg: "#fff4ec",
        border: "#ffd8a8",
        label: "Dossiers incomplets",
        icon: "📋",
      };
    case "Normal":
      return {
        color: "#28a745",
        bg: "#e9f7ef",
        border: "#c3e6cb",
        label: "Conforme",
        icon: "✓",
      };
    default:
      return {
        color: "#6c757d",
        bg: "#f8f9fa",
        border: "#dee2e6",
        label: status,
        icon: "•",
      };
  }
};

const getQuoteStatusConfig = (status) => {
  switch (status) {
    case "Recommended":
      return {
        color: "#28a745",
        bg: "#e9f7ef",
        border: "#c3e6cb",
        label: "Recommandé",
      };
    case "Suspicious":
      return {
        color: "#dc3545",
        bg: "#fff0f0",
        border: "#f5c6cb",
        label: "Suspect",
      };
    case "AbnormallyLow":
      return {
        color: "#dc3545",
        bg: "#fff0f0",
        border: "#f5c6cb",
        label: "Offre anorm. basse",
      };
    case "Inconsistent":
      return {
        color: "#fd7e14",
        bg: "#fff4ec",
        border: "#ffd8a8",
        label: "Incohérent",
      };
    case "Incomplete":
      return {
        color: "#6c757d",
        bg: "#f8f9fa",
        border: "#dee2e6",
        label: "Incomplet",
      };
    case "Normal":
      return {
        color: "#007bff",
        bg: "#e8f4ff",
        border: "#b8daff",
        label: "Normal",
      };
    default:
      return {
        color: "#6c757d",
        bg: "#f8f9fa",
        border: "#dee2e6",
        label: status,
      };
  }
};

const getRiskScoreColor = (score) => {
  if (score >= 80) return "#dc3545";
  if (score >= 60) return "#fd7e14";
  if (score >= 40) return "#ffc107";
  return "#28a745";
};

const getRiskScoreBg = (score) => {
  if (score >= 80) return "#fff0f0";
  if (score >= 60) return "#fff4ec";
  if (score >= 40) return "#fffbec";
  return "#e9f7ef";
};

const formatAmount = (amount) => amount.toLocaleString("fr-MA") + " MAD";

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("fr-MA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ─── Risk Score Badge ─────────────────────────────────────────────────────────
const RiskScoreBadge = ({ score, size = "normal" }) => {
  const color = getRiskScoreColor(score);
  const bg = getRiskScoreBg(score);
  const isLarge = size === "large";

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: isLarge ? 64 : 48,
        height: isLarge ? 64 : 48,
        borderRadius: "50%",
        background: bg,
        border: `2px solid ${color}40`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: isLarge ? 18 : 14,
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}
      >
        {score}
      </span>
      <span style={{ fontSize: 9, color, fontWeight: 600, marginTop: 1 }}>
        /100
      </span>
    </div>
  );
};

// ─── Price Spread Visualizer ──────────────────────────────────────────────────
const PriceSpreadBar = ({ quotes, avgAmount, minAmount, maxAmount }) => {
  if (!quotes || quotes.length === 0) return null;
  const range = maxAmount - minAmount;
  const safeRange = range === 0 ? 1 : range;

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontSize: 11.5,
          color: "#888",
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        Répartition des offres
      </div>
      <div
        style={{
          position: "relative",
          height: 8,
          background: "#eee",
          borderRadius: 4,
          marginBottom: 4,
        }}
      >
        {/* Average marker */}
        <div
          style={{
            position: "absolute",
            left: `${((avgAmount - minAmount) / safeRange) * 100}%`,
            top: -4,
            width: 2,
            height: 16,
            background: "#007bff",
            borderRadius: 1,
            transform: "translateX(-50%)",
          }}
          title={`Moyenne: ${formatAmount(avgAmount)}`}
        />
        {/* Quote dots */}
        {quotes.map((q, i) => {
          const pos = ((q.amount - minAmount) / safeRange) * 100;
          const cfg = getQuoteStatusConfig(q.status);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${pos}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: cfg.color,
                border: "2px solid #fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                cursor: "pointer",
                zIndex: 1,
              }}
              title={`${q.supplierName}: ${formatAmount(q.amount)}`}
            />
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10.5,
          color: "#aaa",
        }}
      >
        <span>{formatAmount(minAmount)}</span>
        <span style={{ color: "#007bff", fontWeight: 600 }}>
          Moy: {formatAmount(avgAmount)}
        </span>
        <span>{formatAmount(maxAmount)}</span>
      </div>
    </div>
  );
};

// ─── Quote Row (inside a tender card) ────────────────────────────────────────
const QuoteRow = ({ quote, avgAmount, isLowest, isHighest }) => {
  const cfg = getQuoteStatusConfig(quote.status);
  const deviationColor =
    Math.abs(quote.deviation) > 25
      ? "#dc3545"
      : Math.abs(quote.deviation) > 10
        ? "#fd7e14"
        : "#28a745";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 8,
        background: quote.status === "Recommended" ? "#f0fff4" : "#fafafa",
        border: `1px solid ${quote.status === "Recommended" ? "#c3e6cb" : "#eee"}`,
        marginBottom: 6,
        transition: "all 0.15s",
      }}
    >
      {/* Supplier Name + Status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#1a1917",
              whiteSpace: "nowrap",
            }}
          >
            {quote.supplierName}
          </span>
          <span
            style={{
              padding: "1px 7px",
              borderRadius: 10,
              fontSize: 10.5,
              fontWeight: 700,
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              whiteSpace: "nowrap",
            }}
          >
            {cfg.label}
          </span>
          {isLowest && (
            <span
              style={{
                padding: "1px 6px",
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 600,
                background: "#e8f4ff",
                color: "#007bff",
                border: "1px solid #b8daff",
              }}
            >
              Prix le plus bas
            </span>
          )}
          {isHighest && (
            <span
              style={{
                padding: "1px 6px",
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 600,
                background: "#f8f9fa",
                color: "#6c757d",
                border: "1px solid #dee2e6",
              }}
            >
              Prix le plus haut
            </span>
          )}
        </div>
        {quote.notes && (
          <div style={{ fontSize: 11.5, color: "#888", marginTop: 2 }}>
            {quote.notes}
          </div>
        )}
      </div>

      {/* Amount */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1a1917" }}>
          {formatAmount(quote.amount)}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: deviationColor,
          }}
        >
          {quote.deviation > 0 ? "+" : ""}
          {quote.deviation}% vs moy.
        </div>
      </div>

      {/* Scores */}
      {quote.globalScore > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background:
                quote.globalScore >= 80
                  ? "#e9f7ef"
                  : quote.globalScore >= 60
                    ? "#e8f4ff"
                    : "#fff4ec",
              color:
                quote.globalScore >= 80
                  ? "#28a745"
                  : quote.globalScore >= 60
                    ? "#007bff"
                    : "#fd7e14",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {quote.globalScore}
          </div>
          <span style={{ fontSize: 9.5, color: "#aaa", marginTop: 2 }}>
            Score
          </span>
        </div>
      )}

      {/* Delivery */}
      <div
        style={{
          textAlign: "center",
          flexShrink: 0,
          minWidth: 50,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>
          {quote.deliveryDays}j
        </div>
        <div style={{ fontSize: 10, color: "#aaa" }}>Délai</div>
      </div>
    </div>
  );
};

// ─── Tender Card ──────────────────────────────────────────────────────────────
const TenderCard = ({ tender }) => {
  const [expanded, setExpanded] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const statusCfg = getTenderStatusConfig(tender.status);
  const riskColor = getRiskScoreColor(tender.aiRiskScore);
  const riskBg = getRiskScoreBg(tender.aiRiskScore);

  const sortedQuotes = [...tender.quotes].sort((a, b) => a.amount - b.amount);
  const lowestAmount = tender.minAmount;
  const highestAmount = tender.maxAmount;

  return (
    <div
      className="alert-card"
      style={{
        borderLeftColor: statusCfg.color,
        borderLeftWidth: 4,
        borderLeftStyle: "solid",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* Risk Score Badge */}
        <RiskScoreBadge score={tender.aiRiskScore} />

        {/* Tender Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                background: statusCfg.bg,
                color: statusCfg.color,
                border: `1px solid ${statusCfg.border}`,
              }}
            >
              {statusCfg.icon} {statusCfg.label}
            </span>
            {tender.anomalyType && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  background: "#f3f0ff",
                  color: "#6f42c1",
                  border: "1px solid #d6c8f5",
                }}
              >
                🔍 {tender.anomalyType}
              </span>
            )}
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 500,
                background: "#f0f7ff",
                color: "#007bff",
                border: "1px solid #cce5ff",
                marginLeft: "auto",
              }}
            >
              {tender.tenderRef}
            </span>
          </div>

          <h4
            style={{
              margin: "0 0 3px",
              fontSize: 14.5,
              fontWeight: 700,
              color: "#1a1917",
              lineHeight: 1.3,
            }}
          >
            {tender.title}
          </h4>
          <div
            style={{
              display: "flex",
              gap: 12,
              fontSize: 12,
              color: "#888",
              flexWrap: "wrap",
            }}
          >
            <span>🏷️ {tender.category}</span>
            <span>📅 Clôture : {formatDate(tender.closeDate)}</span>
            <span>💰 Budget : {formatAmount(tender.estimatedBudget)}</span>
            <span>👥 {tender.quotes.length} soumissionnaires</span>
          </div>
        </div>
      </div>

      {/* AI Risk Score Bar */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11.5,
            color: "#888",
            marginBottom: 4,
          }}
        >
          <span>Score de risque IA</span>
          <span style={{ fontWeight: 700, color: riskColor }}>
            {tender.aiRiskScore}/100
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: "#eee",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${tender.aiRiskScore}%`,
              background: riskColor,
              borderRadius: 3,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Price Spread */}
      <div
        style={{
          background: "#f8f9fa",
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 10,
          border: "1px solid #eee",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>
            Écart de prix entre offres
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color:
                tender.priceSpread < 10
                  ? "#dc3545"
                  : tender.priceSpread < 20
                    ? "#fd7e14"
                    : "#28a745",
            }}
          >
            {tender.priceSpread}%
          </span>
        </div>
        <PriceSpreadBar
          quotes={tender.quotes}
          avgAmount={tender.avgAmount}
          minAmount={tender.minAmount}
          maxAmount={tender.maxAmount}
        />
      </div>

      {/* AI Summary */}
      <div
        style={{
          background: tender.status === "Normal" ? "#e9f7ef" : "#fff8f8",
          borderLeft: `3px solid ${tender.status === "Normal" ? "#28a745" : "#dc3545"}`,
          padding: "10px 13px",
          borderRadius: 6,
          marginBottom: 10,
          fontSize: 13,
          color: "#333",
          lineHeight: 1.5,
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }}
        >
          <circle
            cx="8"
            cy="8"
            r="5"
            stroke={tender.status === "Normal" ? "#28a745" : "#dc3545"}
            strokeWidth="1.5"
          />
          <path
            d="M5.5 8c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5"
            stroke={tender.status === "Normal" ? "#28a745" : "#dc3545"}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle
            cx="8"
            cy="9.5"
            r="0.8"
            fill={tender.status === "Normal" ? "#28a745" : "#dc3545"}
          />
        </svg>
        <strong>Analyse IA :</strong> {tender.aiSummary}
      </div>

      {/* Recommendation */}
      {tender.recommendation && (
        <div className="ai-recommendation" style={{ marginBottom: 10 }}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            style={{
              display: "inline",
              verticalAlign: "middle",
              marginRight: 5,
            }}
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
          <strong>Recommandation IA :</strong> {tender.recommendation}
        </div>
      )}

      {/* Quotes Toggle */}
      <button
        className="expandable-panel-toggle"
        onClick={() => setShowQuotes(!showQuotes)}
        style={{ marginTop: 4 }}
      >
        {showQuotes
          ? `▲ Masquer les ${tender.quotes.length} offres`
          : `▼ Voir les ${tender.quotes.length} offres soumises`}
      </button>

      {showQuotes && (
        <div
          style={{
            marginTop: 10,
            padding: "12px 0 0",
            borderTop: "1px solid #f0f0f0",
            animation: "fadeInUp 0.2s ease",
          }}
        >
          {sortedQuotes.map((quote) => (
            <QuoteRow
              key={quote.supplierId}
              quote={quote}
              avgAmount={tender.avgAmount}
              isLowest={quote.amount === lowestAmount}
              isHighest={quote.amount === highestAmount}
            />
          ))}
        </div>
      )}

      {/* Details Toggle */}
      <button
        className="expandable-panel-toggle"
        onClick={() => setExpanded(!expanded)}
        style={{ marginTop: 6 }}
      >
        {expanded
          ? "▲ Masquer l'analyse détaillée"
          : "▼ Voir l'analyse détaillée"}
      </button>
      {expanded && (
        <div className="expandable-panel-content">
          <p style={{ margin: 0 }}>{tender.details}</p>
        </div>
      )}
    </div>
  );
};

// ─── Comparison Summary Panel ─────────────────────────────────────────────────
const ComparisonSummaryPanel = ({ tenders }) => {
  const anomalies = tenders.filter((t) => t.status === "Anomaly").length;
  const incomplete = tenders.filter((t) => t.status === "Incomplete").length;
  const normal = tenders.filter((t) => t.status === "Normal").length;
  const avgRisk =
    tenders.length > 0
      ? Math.round(
          tenders.reduce((sum, t) => sum + t.aiRiskScore, 0) / tenders.length,
        )
      : 0;
  const totalBudget = tenders.reduce((sum, t) => sum + t.estimatedBudget, 0);
  const totalQuotes = tenders.reduce((sum, t) => sum + t.quotes.length, 0);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e6e1",
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: "#333",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect
            x="2"
            y="2"
            width="5"
            height="5"
            rx="1"
            stroke="#007bff"
            strokeWidth="1.4"
          />
          <rect
            x="9"
            y="2"
            width="5"
            height="5"
            rx="1"
            stroke="#007bff"
            strokeWidth="1.4"
          />
          <rect
            x="2"
            y="9"
            width="5"
            height="5"
            rx="1"
            stroke="#007bff"
            strokeWidth="1.4"
          />
          <rect
            x="9"
            y="9"
            width="5"
            height="5"
            rx="1"
            stroke="#007bff"
            strokeWidth="1.4"
          />
        </svg>
        Résumé de la comparaison des devis
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 10,
        }}
      >
        {[
          {
            label: "Appels d'offres",
            value: tenders.length,
            color: "#007bff",
            bg: "#e8f4ff",
          },
          {
            label: "Anomalies détectées",
            value: anomalies,
            color: "#dc3545",
            bg: "#fff0f0",
          },
          {
            label: "Dossiers incomplets",
            value: incomplete,
            color: "#fd7e14",
            bg: "#fff4ec",
          },
          {
            label: "Conformes",
            value: normal,
            color: "#28a745",
            bg: "#e9f7ef",
          },
          {
            label: "Risque IA moyen",
            value: `${avgRisk}/100`,
            color: getRiskScoreColor(avgRisk),
            bg: getRiskScoreBg(avgRisk),
          },
          {
            label: "Total offres reçues",
            value: totalQuotes,
            color: "#6f42c1",
            bg: "#f3f0ff",
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: item.bg,
              borderRadius: 8,
              padding: "10px 12px",
              border: `1px solid ${item.color}20`,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: item.color,
                lineHeight: 1.2,
                marginBottom: 3,
              }}
            >
              {item.value}
            </div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
      {/* Budget total */}
      <div
        style={{
          marginTop: 12,
          padding: "10px 12px",
          background: "#e8f4ff",
          borderLeft: "3px solid #007bff",
          borderRadius: 6,
          fontSize: 13,
          color: "#333",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          style={{ verticalAlign: "middle" }}
        >
          <circle cx="8" cy="8" r="6" stroke="#007bff" strokeWidth="1.5" />
          <path
            d="M8 5v3l2 2"
            stroke="#007bff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <strong>Budget total sous analyse :</strong> {formatAmount(totalBudget)}
      </div>
    </div>
  );
};

// ─── Summary Stats ────────────────────────────────────────────────────────────
const QuoteSummaryStats = ({ tenders }) => {
  const anomalies = tenders.filter((t) => t.status === "Anomaly").length;
  const incomplete = tenders.filter((t) => t.status === "Incomplete").length;
  const highRisk = tenders.filter((t) => t.aiRiskScore >= 60).length;
  const avgRisk =
    tenders.length > 0
      ? Math.round(
          tenders.reduce((sum, t) => sum + t.aiRiskScore, 0) / tenders.length,
        )
      : 0;

  return (
    <div className="summary-stats">
      <div className="stat-card stat-card--critical">
        <div className="stat-number">{anomalies}</div>
        <div className="stat-label">Anomalies détectées</div>
      </div>
      <div className="stat-card stat-card--high">
        <div className="stat-number">{incomplete}</div>
        <div className="stat-label">Dossiers incomplets</div>
      </div>
      <div className="stat-card stat-card--warning">
        <div className="stat-number">{highRisk}</div>
        <div className="stat-label">Risque élevé (≥60)</div>
      </div>
      <div className="stat-card stat-card--ai">
        <div className="stat-number">{avgRisk}/100</div>
        <div className="stat-label">Risque IA moyen</div>
      </div>
    </div>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="alerts-grid">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-shimmer">
          <div className="skeleton-line header" />
          <div className="skeleton-line title" />
          <div className="skeleton-line description" />
          <div className="skeleton-line description" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
          <div className="skeleton-line description" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ onReset }) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" stroke="#dee2e6" strokeWidth="2" />
        <path
          d="M16 20h16M16 28h10"
          stroke="#dee2e6"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
    <h3>Aucun appel d'offres trouvé</h3>
    <p>Aucun appel d'offres ne correspond à vos critères de filtrage.</p>
    <button className="empty-state-reset" onClick={onReset}>
      Réinitialiser les filtres
    </button>
  </div>
);

// ─── QuoteComparison Component ────────────────────────────────────────────────
const QuoteComparison = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("aiRiskScore");
  const [sortDir, setSortDir] = useState("desc");
  const [showSummary, setShowSummary] = useState(true);

  useEffect(() => {
    setLoading(true);
    agentsIAService
      .getQuoteComparisons()
      .then((data) => {
        setTenders(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger les comparaisons de devis.");
        setLoading(false);
      });
  }, []);

  const resetFilters = () => {
    setStatusFilter("All");
    setCategoryFilter("All");
    setSearchQuery("");
    setSortBy("aiRiskScore");
    setSortDir("desc");
  };

  const filteredAndSorted = useMemo(() => {
    let result = tenders.filter((t) => {
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      const matchCat =
        categoryFilter === "All" || t.category === categoryFilter;
      const matchSearch =
        searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tenderRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.anomalyType &&
          t.anomalyType.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchCat && matchSearch;
    });

    result.sort((a, b) => {
      let valA, valB;
      if (sortBy === "aiRiskScore") {
        valA = a.aiRiskScore;
        valB = b.aiRiskScore;
      } else if (sortBy === "estimatedBudget") {
        valA = a.estimatedBudget;
        valB = b.estimatedBudget;
      } else if (sortBy === "priceSpread") {
        valA = a.priceSpread;
        valB = b.priceSpread;
      } else if (sortBy === "closeDate") {
        valA = new Date(a.closeDate).getTime();
        valB = new Date(b.closeDate).getTime();
      } else {
        valA = a[sortBy];
        valB = b[sortBy];
      }
      return sortDir === "desc" ? valB - valA : valA - valB;
    });

    return result;
  }, [tenders, statusFilter, categoryFilter, searchQuery, sortBy, sortDir]);

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header">
        <div className="module-header-left">
          <div
            className="module-icon"
            style={{ background: "#f3f0ff", color: "#6f42c1" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5h14M3 10h14M3 15h8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle
                cx="16"
                cy="15"
                r="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M15 15l.8.8L17.5 14"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="module-title">Comparaison des Devis</h2>
            <p className="module-subtitle">
              Analyse IA des appels d'offres, détection d'anomalies et
              recommandations d'attribution
            </p>
          </div>
        </div>
        <div className="module-header-right">
          <button
            className="kpi-toggle-btn"
            onClick={() => setShowSummary((s) => !s)}
          >
            {showSummary ? "Masquer résumé" : "Afficher résumé"}
          </button>
          <span className="ai-badge">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{ marginRight: 4 }}
            >
              <circle
                cx="6"
                cy="6"
                r="4"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <circle cx="6" cy="6" r="1.5" fill="currentColor" />
            </svg>
            IA Active
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && !error && <QuoteSummaryStats tenders={tenders} />}

      {/* Comparison Summary Panel */}
      {!loading && !error && showSummary && tenders.length > 0 && (
        <ComparisonSummaryPanel tenders={tenders} />
      )}

      {/* Status Tabs */}
      <div className="category-tabs">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === "All"
              ? tenders.length
              : tenders.filter((t) => t.status === tab.key).length;
          return (
            <button
              key={tab.key}
              className={`category-tab ${statusFilter === tab.key ? "active" : ""}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
              {count > 0 && <span className="tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <svg
            className="search-icon"
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
          >
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#999" strokeWidth="1.4" />
            <path
              d="M10 10l3 3"
              stroke="#999"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher un appel d'offres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>
              Trier : {s.label}
            </option>
          ))}
        </select>
        <button
          className="reset-btn"
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          title="Inverser l'ordre"
        >
          {sortDir === "desc" ? "↓ Desc" : "↑ Asc"}
        </button>
        {(statusFilter !== "All" ||
          categoryFilter !== "All" ||
          searchQuery !== "") && (
          <button className="reset-btn" onClick={resetFilters}>
            ✕ Réinitialiser
          </button>
        )}
        <span className="results-count">
          {filteredAndSorted.length} appel
          {filteredAndSorted.length !== 1 ? "s" : ""} d'offres
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState onReset={resetFilters} />
      ) : (
        <div className="alerts-grid">
          {filteredAndSorted.map((tender) => (
            <TenderCard key={tender.id} tender={tender} />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuoteComparison;
