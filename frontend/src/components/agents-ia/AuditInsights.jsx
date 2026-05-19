import React, { useState, useEffect } from "react";
import AlertCard from "./AlertCard";
import agentsIAService from "../../services/agentsIAService";
import "./AIDashboard.css";

// ─── Category tabs config ─────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "All", label: "Tous" },
  { key: "Accounting", label: "Comptabilité" },
  { key: "Security", label: "Sécurité" },
  { key: "Pattern", label: "Patterns" },
  { key: "Documentation", label: "Documentation" },
  { key: "Optimization", label: "Optimisations" },
];

// ─── Risk Level config ────────────────────────────────────────────────────────
const RISK_LEVELS = [
  { key: "All", label: "Tous les risques" },
  { key: "critical", label: "Critique (80-100)" },
  { key: "high", label: "Élevé (60-79)" },
  { key: "medium", label: "Moyen (40-59)" },
  { key: "low", label: "Faible (0-39)" },
];

// ─── Audit Summary ────────────────────────────────────────────────────────────
const AuditSummary = ({ insights }) => {
  const critical = insights.filter((i) => i.riskScore >= 80).length;
  const avgConfidence =
    insights.length > 0
      ? Math.round(
          insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length,
        )
      : 0;
  const avgRisk =
    insights.length > 0
      ? Math.round(
          insights.reduce((sum, i) => sum + i.riskScore, 0) / insights.length,
        )
      : 0;

  return (
    <div className="summary-stats">
      <div className="stat-card stat-card--critical">
        <div className="stat-number">{critical}</div>
        <div className="stat-label">Risques critiques</div>
      </div>
      <div className="stat-card stat-card--ai">
        <div className="stat-number">{avgConfidence} %</div>
        <div className="stat-label">Confiance IA moy.</div>
      </div>
      <div className="stat-card stat-card--high">
        <div className="stat-number">{avgRisk}/100</div>
        <div className="stat-label">Score risque moyen</div>
      </div>
      <div className="stat-card stat-card--total">
        <div className="stat-number">{insights.length}</div>
        <div className="stat-label">Total insights</div>
      </div>
    </div>
  );
};

// ─── Risk Gauge ───────────────────────────────────────────────────────────────
const RiskGauge = ({ score }) => {
  const color =
    score >= 80
      ? "#dc3545"
      : score >= 60
        ? "#fd7e14"
        : score >= 40
          ? "#ffc107"
          : "#28a745";
  return (
    <div className="risk-gauge">
      <div className="risk-gauge-track">
        <div
          className="risk-gauge-fill"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="risk-gauge-label" style={{ color }}>
        {score}/100
      </span>
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
          <div className="skeleton-line short" />
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
          d="M24 14v10M24 30v4"
          stroke="#dee2e6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
    <h3>Aucun insight d'audit trouvé</h3>
    <p>
      Aucun insight ne correspond à vos critères. Les données d'audit semblent
      cohérentes !
    </p>
    <button className="empty-state-reset" onClick={onReset}>
      Réinitialiser les filtres
    </button>
  </div>
);

// ─── AuditInsights Component ──────────────────────────────────────────────────
const AuditInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("riskScore");

  useEffect(() => {
    setLoading(true);
    agentsIAService
      .getAuditInsights()
      .then((data) => {
        setInsights(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger les insights d'audit.");
        setLoading(false);
      });
  }, []);

  const resetFilters = () => {
    setCategoryFilter("All");
    setRiskFilter("All");
    setSearchQuery("");
    setSortBy("riskScore");
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

  const filteredInsights = insights
    .filter((insight) => {
      const matchCategory =
        categoryFilter === "All" || insight.category === categoryFilter;
      const matchRisk =
        riskFilter === "All" || getRiskLevel(insight.riskScore) === riskFilter;
      const matchSearch =
        searchQuery === "" ||
        insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (insight.insightType &&
          insight.insightType
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));
      return matchCategory && matchRisk && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "riskScore") return b.riskScore - a.riskScore;
      if (sortBy === "confidence") return b.confidence - a.confidence;
      if (sortBy === "date") return new Date(b.date) - new Date(a.date);
      return 0;
    });

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header">
        <div className="module-header-left">
          <div className="module-icon module-icon--audit">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2v5M10 13v5M4 10h5M11 10h5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle
                cx="10"
                cy="10"
                r="7"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </div>
          <div>
            <h2 className="module-title">Insights d'Audit</h2>
            <p className="module-subtitle">
              Analyse IA des incohérences, risques et opportunités d'audit
            </p>
          </div>
        </div>
        <div className="module-header-right">
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
      {!loading && !error && <AuditSummary insights={insights} />}

      {/* Category Tabs */}
      <div className="category-tabs">
        {CATEGORIES.map((cat) => {
          const count =
            cat.key === "All"
              ? insights.length
              : insights.filter((i) => i.category === cat.key).length;
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

      {/* Filter Controls */}
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
            placeholder="Rechercher un insight..."
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
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="riskScore">Trier : Score de risque</option>
          <option value="confidence">Trier : Confiance IA</option>
          <option value="date">Trier : Date</option>
        </select>
        {(categoryFilter !== "All" ||
          riskFilter !== "All" ||
          searchQuery !== "") && (
          <button className="reset-btn" onClick={resetFilters}>
            ✕ Réinitialiser
          </button>
        )}
        <span className="results-count">
          {filteredInsights.length} résultat
          {filteredInsights.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : filteredInsights.length > 0 ? (
        <div className="alerts-grid">
          {filteredInsights.map((insight) => (
            <AlertCard
              key={insight.id}
              alert={insight}
              extraMeta={
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginTop: 4,
                    alignItems: "center",
                  }}
                >
                  {insight.insightType && (
                    <span className="meta-tag meta-tag--type">
                      🔍 {insight.insightType}
                    </span>
                  )}
                  {insight.affectedPeriod && (
                    <span className="meta-tag meta-tag--period">
                      📅 {insight.affectedPeriod}
                    </span>
                  )}
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState onReset={resetFilters} />
      )}
    </div>
  );
};

export default AuditInsights;
