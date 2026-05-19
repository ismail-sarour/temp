import React, { useState, useEffect, useMemo } from "react";
import agentsIAService from "../../services/agentsIAService";
import "./AIDashboard.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "All", label: "Tous" },
  { key: "Informatique", label: "Informatique" },
  { key: "Travaux", label: "Travaux" },
  { key: "Infrastructure", label: "Infrastructure" },
  { key: "Fournitures", label: "Fournitures" },
  { key: "Équipements", label: "Équipements" },
  { key: "Logistique", label: "Logistique" },
  { key: "Services", label: "Services" },
];

const RISK_LEVELS = [
  { key: "All", label: "Tous les risques" },
  { key: "Critical", label: "Critique" },
  { key: "High", label: "Élevé" },
  { key: "Medium", label: "Moyen" },
  { key: "Low", label: "Faible" },
];

const STATUS_OPTIONS = [
  { key: "All", label: "Tous les statuts" },
  { key: "Active", label: "Actif" },
  { key: "Suspended", label: "Suspendu" },
  { key: "Blacklisted", label: "Blacklisté" },
];

const SORT_OPTIONS = [
  { key: "reliabilityScore", label: "Score de fiabilité" },
  { key: "riskLevel", label: "Niveau de risque" },
  { key: "totalAmount", label: "Montant total" },
  { key: "dominanceRate", label: "Taux de dominance" },
  { key: "name", label: "Nom" },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────
const getRiskColor = (level) => {
  switch (level) {
    case "Critical":
      return "#dc3545";
    case "High":
      return "#fd7e14";
    case "Medium":
      return "#ffc107";
    case "Low":
      return "#28a745";
    default:
      return "#6c757d";
  }
};

const getRiskBg = (level) => {
  switch (level) {
    case "Critical":
      return "#fff0f0";
    case "High":
      return "#fff4ec";
    case "Medium":
      return "#fffbec";
    case "Low":
      return "#e9f7ef";
    default:
      return "#f8f9fa";
  }
};

const getDocStatusConfig = (status) => {
  switch (status) {
    case "Valid":
      return {
        color: "#28a745",
        bg: "#e9f7ef",
        border: "#c3e6cb",
        label: "Valide",
      };
    case "Expiring":
      return {
        color: "#fd7e14",
        bg: "#fff4ec",
        border: "#ffd8a8",
        label: "Expire bientôt",
      };
    case "Expired":
      return {
        color: "#dc3545",
        bg: "#fff0f0",
        border: "#f5c6cb",
        label: "Expiré",
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

const getStatusConfig = (status) => {
  switch (status) {
    case "Active":
      return {
        color: "#28a745",
        bg: "#e9f7ef",
        border: "#c3e6cb",
        label: "Actif",
      };
    case "Suspended":
      return {
        color: "#fd7e14",
        bg: "#fff4ec",
        border: "#ffd8a8",
        label: "Suspendu",
      };
    case "Blacklisted":
      return {
        color: "#dc3545",
        bg: "#fff0f0",
        border: "#f5c6cb",
        label: "Blacklisté",
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

const getBadgeConfig = (badge) => {
  const map = {
    "Top Fournisseur": { bg: "#e9f7ef", color: "#28a745", border: "#c3e6cb" },
    Fiable: { bg: "#e8f4ff", color: "#007bff", border: "#b8daff" },
    Attention: { bg: "#fff4ec", color: "#fd7e14", border: "#ffd8a8" },
    "Expire bientôt": { bg: "#fff4ec", color: "#fd7e14", border: "#ffd8a8" },
    Critique: { bg: "#fff0f0", color: "#dc3545", border: "#f5c6cb" },
    Surveillance: { bg: "#f3f0ff", color: "#6f42c1", border: "#d6c8f5" },
  };
  return map[badge] || { bg: "#f8f9fa", color: "#6c757d", border: "#dee2e6" };
};

const formatAmount = (amount) => amount.toLocaleString("fr-MA") + " MAD";

const getRiskRank = (level) => {
  const ranks = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  return ranks[level] || 0;
};

// ─── Score Ring (SVG circular progress) ──────────────────────────────────────
const ScoreRing = ({ score, size = 56, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "#28a745"
      : score >= 60
        ? "#007bff"
        : score >= 40
          ? "#fd7e14"
          : "#dc3545";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#eee"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: "rotate(90deg)",
          transformOrigin: "center",
          fontSize: size < 50 ? 10 : 13,
          fontWeight: 700,
          fill: color,
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        {score}
      </text>
    </svg>
  );
};

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
const MiniBar = ({ value, max = 100, color = "#007bff", label }) => (
  <div style={{ marginBottom: 6 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 11,
        color: "#888",
        marginBottom: 3,
      }}
    >
      <span>{label}</span>
      <span style={{ fontWeight: 600, color: "#555" }}>{value}%</span>
    </div>
    <div
      style={{
        height: 5,
        background: "#eee",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${(value / max) * 100}%`,
          background: color,
          borderRadius: 3,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  </div>
);

// ─── Anomaly List ─────────────────────────────────────────────────────────────
const AnomalyList = ({ anomalies }) => {
  if (!anomalies || anomalies.length === 0) return null;
  return (
    <div
      style={{
        background: "#fff8f8",
        border: "1px solid #f5c6cb",
        borderRadius: 8,
        padding: "10px 12px",
        marginTop: 10,
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: "#dc3545",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2L14 13H2L8 2Z"
            stroke="#dc3545"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M8 7v3M8 11.5v.5"
            stroke="#dc3545"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Anomalies détectées ({anomalies.length})
      </div>
      {anomalies.map((a, i) => (
        <div
          key={i}
          style={{
            fontSize: 12,
            color: "#721c24",
            padding: "3px 0",
            borderTop: i > 0 ? "1px solid #f5c6cb" : "none",
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
          }}
        >
          <span style={{ color: "#dc3545", flexShrink: 0, marginTop: 1 }}>
            •
          </span>
          {a}
        </div>
      ))}
    </div>
  );
};

// ─── Supplier Card ────────────────────────────────────────────────────────────
const SupplierCard = ({ supplier, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const docConfig = getDocStatusConfig(supplier.documentStatus);
  const statusConfig = getStatusConfig(supplier.status);
  const riskColor = getRiskColor(supplier.riskLevel);
  const riskBg = getRiskBg(supplier.riskLevel);

  const scoreColor =
    supplier.reliabilityScore >= 80
      ? "#28a745"
      : supplier.reliabilityScore >= 60
        ? "#007bff"
        : supplier.reliabilityScore >= 40
          ? "#fd7e14"
          : "#dc3545";

  return (
    <div
      className="alert-card"
      style={{
        borderLeftColor: riskColor,
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
        {/* Rank + Score Ring */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: rank <= 3 ? "#007bff" : "#e9ecef",
              color: rank <= 3 ? "#fff" : "#555",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {rank}
          </div>
          <ScoreRing
            score={supplier.reliabilityScore}
            size={52}
            strokeWidth={4}
          />
          <span style={{ fontSize: 10, color: "#888", textAlign: "center" }}>
            Fiabilité
          </span>
        </div>

        {/* Supplier Info */}
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
                background: riskBg,
                color: riskColor,
                border: `1px solid ${riskColor}30`,
              }}
            >
              {supplier.riskLevel === "Critical"
                ? "Critique"
                : supplier.riskLevel === "High"
                  ? "Élevé"
                  : supplier.riskLevel === "Medium"
                    ? "Moyen"
                    : "Faible"}
            </span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                background: statusConfig.bg,
                color: statusConfig.color,
                border: `1px solid ${statusConfig.border}`,
              }}
            >
              {statusConfig.label}
            </span>
            {supplier.badge &&
              (() => {
                const bc = getBadgeConfig(supplier.badge);
                return (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: bc.bg,
                      color: bc.color,
                      border: `1px solid ${bc.border}`,
                    }}
                  >
                    {supplier.badge}
                  </span>
                );
              })()}
          </div>

          <h4
            style={{
              margin: "0 0 2px",
              fontSize: 14.5,
              fontWeight: 700,
              color: "#1a1917",
              lineHeight: 1.3,
            }}
          >
            {supplier.name}
          </h4>
          <div style={{ fontSize: 12, color: "#888" }}>
            {supplier.category} · {supplier.totalContracts} contrats ·{" "}
            {formatAmount(supplier.totalAmount)}
          </div>
        </div>
      </div>

      {/* Performance Bars */}
      <div style={{ marginBottom: 10 }}>
        <MiniBar
          value={supplier.onTimeDelivery}
          label="Livraison à temps"
          color={
            supplier.onTimeDelivery >= 85
              ? "#28a745"
              : supplier.onTimeDelivery >= 70
                ? "#007bff"
                : "#fd7e14"
          }
        />
        <MiniBar
          value={supplier.qualityScore}
          label="Score qualité"
          color={
            supplier.qualityScore >= 80
              ? "#28a745"
              : supplier.qualityScore >= 60
                ? "#007bff"
                : "#fd7e14"
          }
        />
        <MiniBar
          value={supplier.dominanceRate}
          label="Taux de dominance"
          color={
            supplier.dominanceRate >= 50
              ? "#dc3545"
              : supplier.dominanceRate >= 35
                ? "#fd7e14"
                : "#28a745"
          }
        />
      </div>

      {/* Document Status + Price Diff */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 10,
          alignItems: "center",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 9px",
            borderRadius: 12,
            fontSize: 11.5,
            fontWeight: 600,
            background: docConfig.bg,
            color: docConfig.color,
            border: `1px solid ${docConfig.border}`,
          }}
        >
          📄 Docs : {docConfig.label}
          {supplier.daysUntilExpiry < 0
            ? ` (expiré il y a ${Math.abs(supplier.daysUntilExpiry)}j)`
            : supplier.daysUntilExpiry <= 30
              ? ` (dans ${supplier.daysUntilExpiry}j)`
              : ""}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 9px",
            borderRadius: 12,
            fontSize: 11.5,
            fontWeight: 600,
            background:
              Math.abs(supplier.avgPriceDiff) > 20
                ? "#fff0f0"
                : Math.abs(supplier.avgPriceDiff) > 10
                  ? "#fff4ec"
                  : "#f8f9fa",
            color:
              Math.abs(supplier.avgPriceDiff) > 20
                ? "#dc3545"
                : Math.abs(supplier.avgPriceDiff) > 10
                  ? "#fd7e14"
                  : "#6c757d",
            border: "1px solid #dee2e6",
          }}
        >
          💰 Prix :{" "}
          {supplier.avgPriceDiff > 0
            ? `+${supplier.avgPriceDiff}%`
            : `${supplier.avgPriceDiff}%`}{" "}
          vs moy.
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 9px",
            borderRadius: 12,
            fontSize: 11.5,
            fontWeight: 500,
            background: "#f0f7ff",
            color: "#007bff",
            border: "1px solid #cce5ff",
          }}
        >
          🏷️ {supplier.category}
        </span>
      </div>

      {/* Anomalies */}
      {supplier.anomalies && supplier.anomalies.length > 0 && (
        <AnomalyList anomalies={supplier.anomalies} />
      )}

      {/* AI Recommendation */}
      {supplier.aiRecommendation && (
        <div className="ai-recommendation" style={{ marginTop: 10 }}>
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
          <strong>Recommandation IA :</strong> {supplier.aiRecommendation}
        </div>
      )}

      {/* Expandable Details */}
      <button
        className="expandable-panel-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "▲ Masquer les détails" : "▼ Voir les détails"}
      </button>
      {expanded && (
        <div className="expandable-panel-content">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 16px",
              fontSize: 12.5,
            }}
          >
            <div>
              <span style={{ color: "#888" }}>Dernier audit :</span>{" "}
              <strong>
                {new Date(supplier.lastAudit).toLocaleDateString("fr-MA", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </div>
            <div>
              <span style={{ color: "#888" }}>Pays :</span>{" "}
              <strong>{supplier.country}</strong>
            </div>
            <div>
              <span style={{ color: "#888" }}>Expiration certif. :</span>{" "}
              <strong>
                {new Date(supplier.certificationExpiry).toLocaleDateString(
                  "fr-MA",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  },
                )}
              </strong>
            </div>
            <div>
              <span style={{ color: "#888" }}>Tendance :</span>{" "}
              <strong
                style={{
                  color:
                    supplier.trend === "up"
                      ? "#28a745"
                      : supplier.trend === "down"
                        ? "#dc3545"
                        : "#6c757d",
                }}
              >
                {supplier.trendLabel}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Supplier Table Row ───────────────────────────────────────────────────────
const SupplierTableRow = ({ supplier, rank, onSelect, isSelected }) => {
  const riskColor = getRiskColor(supplier.riskLevel);
  const docConfig = getDocStatusConfig(supplier.documentStatus);
  const statusConfig = getStatusConfig(supplier.status);
  const scoreColor =
    supplier.reliabilityScore >= 80
      ? "#28a745"
      : supplier.reliabilityScore >= 60
        ? "#007bff"
        : supplier.reliabilityScore >= 40
          ? "#fd7e14"
          : "#dc3545";

  return (
    <tr
      onClick={() => onSelect(supplier)}
      style={{
        cursor: "pointer",
        background: isSelected ? "#f0f7ff" : "transparent",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = "#fafafa";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = "transparent";
      }}
    >
      <td
        style={{
          padding: "10px 12px",
          fontSize: 12,
          color: "#888",
          fontWeight: 600,
        }}
      >
        #{rank}
      </td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1a1917" }}>
          {supplier.name}
        </div>
        <div style={{ fontSize: 11.5, color: "#888" }}>{supplier.category}</div>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `${scoreColor}15`,
            color: scoreColor,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {supplier.reliabilityScore}
        </span>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <span
          style={{
            padding: "3px 9px",
            borderRadius: 12,
            fontSize: 11.5,
            fontWeight: 700,
            background: `${riskColor}15`,
            color: riskColor,
          }}
        >
          {supplier.riskLevel === "Critical"
            ? "Critique"
            : supplier.riskLevel === "High"
              ? "Élevé"
              : supplier.riskLevel === "Medium"
                ? "Moyen"
                : "Faible"}
        </span>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <span
          style={{
            padding: "3px 9px",
            borderRadius: 12,
            fontSize: 11.5,
            fontWeight: 600,
            background: docConfig.bg,
            color: docConfig.color,
            border: `1px solid ${docConfig.border}`,
          }}
        >
          {docConfig.label}
        </span>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center", fontSize: 13 }}>
        <span
          style={{
            color:
              supplier.dominanceRate >= 50
                ? "#dc3545"
                : supplier.dominanceRate >= 35
                  ? "#fd7e14"
                  : "#28a745",
            fontWeight: 600,
          }}
        >
          {supplier.dominanceRate}%
        </span>
      </td>
      <td
        style={{
          padding: "10px 12px",
          textAlign: "right",
          fontSize: 12.5,
          color: "#555",
        }}
      >
        {formatAmount(supplier.totalAmount)}
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <span
          style={{
            padding: "3px 9px",
            borderRadius: 12,
            fontSize: 11.5,
            fontWeight: 600,
            background: statusConfig.bg,
            color: statusConfig.color,
            border: `1px solid ${statusConfig.border}`,
          }}
        >
          {statusConfig.label}
        </span>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        {supplier.anomalies && supplier.anomalies.length > 0 ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#dc3545",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {supplier.anomalies.length}
          </span>
        ) : (
          <span style={{ color: "#28a745", fontSize: 14 }}>✓</span>
        )}
      </td>
    </tr>
  );
};

// ─── Summary Stats ────────────────────────────────────────────────────────────
const SupplierSummaryStats = ({ suppliers }) => {
  const critical = suppliers.filter((s) => s.riskLevel === "Critical").length;
  const withAnomalies = suppliers.filter(
    (s) => s.anomalies && s.anomalies.length > 0,
  ).length;
  const expiring = suppliers.filter(
    (s) => s.documentStatus === "Expiring" || s.documentStatus === "Expired",
  ).length;
  const avgScore =
    suppliers.length > 0
      ? Math.round(
          suppliers.reduce((sum, s) => sum + s.reliabilityScore, 0) /
            suppliers.length,
        )
      : 0;

  return (
    <div className="summary-stats">
      <div className="stat-card stat-card--critical">
        <div className="stat-number">{critical}</div>
        <div className="stat-label">Risques critiques</div>
      </div>
      <div className="stat-card stat-card--high">
        <div className="stat-number">{withAnomalies}</div>
        <div className="stat-label">Avec anomalies</div>
      </div>
      <div className="stat-card stat-card--warning">
        <div className="stat-number">{expiring}</div>
        <div className="stat-label">Docs expirés/expirant</div>
      </div>
      <div className="stat-card stat-card--ai">
        <div className="stat-number">{avgScore}/100</div>
        <div className="stat-label">Score moyen fiabilité</div>
      </div>
    </div>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="alerts-grid">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-shimmer">
          <div className="skeleton-line header" />
          <div className="skeleton-line title" />
          <div className="skeleton-line description" />
          <div className="skeleton-line description" />
          <div className="skeleton-line short" />
          <div className="skeleton-line medium" />
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
          d="M16 24h16M24 16v16"
          stroke="#dee2e6"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
    <h3>Aucun fournisseur trouvé</h3>
    <p>Aucun fournisseur ne correspond à vos critères de filtrage.</p>
    <button className="empty-state-reset" onClick={onReset}>
      Réinitialiser les filtres
    </button>
  </div>
);

// ─── SupplierAnalysis Component ───────────────────────────────────────────────
const SupplierAnalysis = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("reliabilityScore");
  const [sortDir, setSortDir] = useState("desc");
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    setLoading(true);
    agentsIAService
      .getSupplierAnalysis()
      .then((data) => {
        setSuppliers(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger l'analyse des fournisseurs.");
        setLoading(false);
      });
  }, []);

  const resetFilters = () => {
    setCategoryFilter("All");
    setRiskFilter("All");
    setStatusFilter("All");
    setSearchQuery("");
    setSortBy("reliabilityScore");
    setSortDir("desc");
  };

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = suppliers.filter((s) => {
      const matchCat =
        categoryFilter === "All" || s.category === categoryFilter;
      const matchRisk = riskFilter === "All" || s.riskLevel === riskFilter;
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      const matchSearch =
        searchQuery === "" ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchRisk && matchStatus && matchSearch;
    });

    result.sort((a, b) => {
      let valA, valB;
      if (sortBy === "reliabilityScore") {
        valA = a.reliabilityScore;
        valB = b.reliabilityScore;
      } else if (sortBy === "riskLevel") {
        valA = getRiskRank(a.riskLevel);
        valB = getRiskRank(b.riskLevel);
      } else if (sortBy === "totalAmount") {
        valA = a.totalAmount;
        valB = b.totalAmount;
      } else if (sortBy === "dominanceRate") {
        valA = a.dominanceRate;
        valB = b.dominanceRate;
      } else if (sortBy === "name") {
        return sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        valA = a[sortBy];
        valB = b[sortBy];
      }
      return sortDir === "desc" ? valB - valA : valA - valB;
    });

    return result;
  }, [
    suppliers,
    categoryFilter,
    riskFilter,
    statusFilter,
    searchQuery,
    sortBy,
    sortDir,
  ]);

  const SortIcon = ({ field }) => {
    if (sortBy !== field)
      return <span style={{ color: "#ccc", marginLeft: 4 }}>↕</span>;
    return (
      <span style={{ color: "#007bff", marginLeft: 4 }}>
        {sortDir === "desc" ? "↓" : "↑"}
      </span>
    );
  };

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header">
        <div className="module-header-left">
          <div
            className="module-icon"
            style={{ background: "#fff4ec", color: "#fd7e14" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2L3 6v8l7 4 7-4V6L10 2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M10 2v12M3 6l7 4 7-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="module-title">Analyse des Fournisseurs</h2>
            <p className="module-subtitle">
              Scoring IA, détection d'anomalies et gestion des risques
              fournisseurs
            </p>
          </div>
        </div>
        <div className="module-header-right">
          {/* View Toggle */}
          <div
            style={{
              display: "flex",
              border: "1px solid #ddd",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setViewMode("cards")}
              style={{
                padding: "6px 12px",
                border: "none",
                background: viewMode === "cards" ? "#007bff" : "#fff",
                color: viewMode === "cards" ? "#fff" : "#666",
                cursor: "pointer",
                fontSize: 12.5,
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 500,
                transition: "all 0.15s",
              }}
            >
              ⊞ Cartes
            </button>
            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "6px 12px",
                border: "none",
                background: viewMode === "table" ? "#007bff" : "#fff",
                color: viewMode === "table" ? "#fff" : "#666",
                cursor: "pointer",
                fontSize: 12.5,
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 500,
                transition: "all 0.15s",
              }}
            >
              ☰ Tableau
            </button>
          </div>
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
      {!loading && !error && <SupplierSummaryStats suppliers={suppliers} />}

      {/* Category Tabs */}
      <div className="category-tabs">
        {CATEGORIES.map((cat) => {
          const count =
            cat.key === "All"
              ? suppliers.length
              : suppliers.filter((s) => s.category === cat.key).length;
          return (
            <button
              key={cat.key}
              className={`category-tab ${categoryFilter === cat.key ? "active" : ""}`}
              onClick={() => setCategoryFilter(cat.key)}
            >
              {cat.label}
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
            placeholder="Rechercher un fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          {RISK_LEVELS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
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
        {(categoryFilter !== "All" ||
          riskFilter !== "All" ||
          statusFilter !== "All" ||
          searchQuery !== "") && (
          <button className="reset-btn" onClick={resetFilters}>
            ✕ Réinitialiser
          </button>
        )}
        <span className="results-count">
          {filteredAndSorted.length} fournisseur
          {filteredAndSorted.length !== 1 ? "s" : ""}
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
      ) : viewMode === "cards" ? (
        <div className="alerts-grid">
          {filteredAndSorted.map((supplier, idx) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              rank={idx + 1}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div
          style={{
            background: "#fff",
            border: "1px solid #e8e6e1",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "#f8f9fa",
                    borderBottom: "2px solid #e8e6e1",
                  }}
                >
                  {[
                    { key: null, label: "#" },
                    { key: "name", label: "Fournisseur" },
                    { key: "reliabilityScore", label: "Score" },
                    { key: "riskLevel", label: "Risque" },
                    { key: null, label: "Documents" },
                    { key: "dominanceRate", label: "Dominance" },
                    { key: "totalAmount", label: "Montant total" },
                    { key: null, label: "Statut" },
                    { key: null, label: "Anomalies" },
                  ].map((col, i) => (
                    <th
                      key={i}
                      onClick={col.key ? () => toggleSort(col.key) : undefined}
                      style={{
                        padding: "11px 12px",
                        textAlign:
                          i === 0 ? "left" : i >= 6 ? "right" : "center",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#555",
                        cursor: col.key ? "pointer" : "default",
                        userSelect: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.label}
                      {col.key && <SortIcon field={col.key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((supplier, idx) => (
                  <React.Fragment key={supplier.id}>
                    <SupplierTableRow
                      supplier={supplier}
                      rank={idx + 1}
                      onSelect={(s) =>
                        setSelectedSupplier(
                          selectedSupplier?.id === s.id ? null : s,
                        )
                      }
                      isSelected={selectedSupplier?.id === supplier.id}
                    />
                    {selectedSupplier?.id === supplier.id && (
                      <tr>
                        <td
                          colSpan={9}
                          style={{
                            padding: "0 12px 12px",
                            background: "#f0f7ff",
                            borderBottom: "1px solid #e8e6e1",
                          }}
                        >
                          <div style={{ paddingTop: 10 }}>
                            {supplier.anomalies &&
                              supplier.anomalies.length > 0 && (
                                <AnomalyList anomalies={supplier.anomalies} />
                              )}
                            {supplier.aiRecommendation && (
                              <div
                                className="ai-recommendation"
                                style={{ marginTop: 8 }}
                              >
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
                                  <circle
                                    cx="8"
                                    cy="8"
                                    r="5"
                                    stroke="#28a745"
                                    strokeWidth="1.5"
                                  />
                                  <path
                                    d="M5.5 8c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5"
                                    stroke="#28a745"
                                    strokeWidth="1.3"
                                    strokeLinecap="round"
                                  />
                                  <circle
                                    cx="8"
                                    cy="9.5"
                                    r="0.8"
                                    fill="#28a745"
                                  />
                                </svg>
                                <strong>Recommandation IA :</strong>{" "}
                                {supplier.aiRecommendation}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierAnalysis;
