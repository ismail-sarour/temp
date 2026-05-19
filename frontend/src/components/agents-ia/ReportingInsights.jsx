import React, { useState, useEffect } from "react";
import AlertCard from "./AlertCard";
import agentsIAService from "../../services/agentsIAService";
import "./AIDashboard.css";

// ─── Category tabs config ─────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "All", label: "Tous" },
  { key: "Performance", label: "Performance" },
  { key: "Payment", label: "Paiements" },
  { key: "Forecast", label: "Prévisions IA" },
  { key: "Savings", label: "Économies" },
  { key: "Compliance", label: "Conformité" },
  { key: "Benchmark", label: "Benchmark" },
];

// ─── Reporting Summary ────────────────────────────────────────────────────────
const ReportingSummary = ({ insights }) => {
  const forecasts = insights.filter((i) => i.category === "Forecast").length;
  const positives = insights.filter(
    (i) => i.severity === "Low" && i.trend === "up",
  ).length;
  const highPriority = insights.filter(
    (i) => i.severity === "High" || i.severity === "Critical",
  ).length;

  return (
    <div className="summary-stats">
      <div className="stat-card stat-card--high">
        <div className="stat-number">{highPriority}</div>
        <div className="stat-label">Priorité haute</div>
      </div>
      <div className="stat-card stat-card--ai">
        <div className="stat-number">{forecasts}</div>
        <div className="stat-label">Prévisions IA</div>
      </div>
      <div className="stat-card stat-card--success">
        <div className="stat-number">{positives}</div>
        <div className="stat-label">Indicateurs positifs</div>
      </div>
      <div className="stat-card stat-card--total">
        <div className="stat-number">{insights.length}</div>
        <div className="stat-label">Total insights</div>
      </div>
    </div>
  );
};

// ─── KPI Summary Panel ────────────────────────────────────────────────────────
const KPISummaryPanel = ({ insights }) => {
  const kpiInsights = insights.filter((i) => i.kpi);
  if (kpiInsights.length === 0) return null;

  return (
    <div className="kpi-summary-panel">
      <h3 className="kpi-summary-title">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ marginRight: 6, verticalAlign: "middle" }}
        >
          <path
            d="M2 12L5 8L8 10L11 5L14 7"
            stroke="#007bff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Tableau de bord KPI
      </h3>
      <div className="kpi-summary-grid">
        {kpiInsights.map((insight) => {
          const isPositive =
            insight.category === "Savings" ||
            (insight.trend === "up" && insight.category === "Savings");
          const isNegative =
            insight.trend === "down" ||
            (insight.trend === "up" && insight.category !== "Savings");
          const trendColor = isPositive
            ? "#28a745"
            : isNegative
              ? "#dc3545"
              : "#6c757d";

          return (
            <div key={insight.id} className="kpi-summary-item">
              <div className="kpi-summary-label">{insight.kpi}</div>
              <div className="kpi-summary-value" style={{ color: trendColor }}>
                {insight.kpiValue}
              </div>
              <div className="kpi-summary-variance">{insight.kpiVariance}</div>
              <div className="kpi-summary-period">{insight.period}</div>
            </div>
          );
        })}
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
          d="M14 32L20 22L26 26L32 16"
          stroke="#dee2e6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <h3>Aucun insight de reporting trouvé</h3>
    <p>
      Aucun insight ne correspond à vos critères. Tous les indicateurs sont dans
      les normes !
    </p>
    <button className="empty-state-reset" onClick={onReset}>
      Réinitialiser les filtres
    </button>
  </div>
);

// ─── ReportingInsights Component ──────────────────────────────────────────────
const ReportingInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showKPIPanel, setShowKPIPanel] = useState(true);

  useEffect(() => {
    setLoading(true);
    agentsIAService
      .getReportingInsights()
      .then((data) => {
        setInsights(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger les insights de reporting.");
        setLoading(false);
      });
  }, []);

  const resetFilters = () => {
    setCategoryFilter("All");
    setSeverityFilter("All");
    setSearchQuery("");
  };

  const filteredInsights = insights.filter((insight) => {
    const matchCategory =
      categoryFilter === "All" || insight.category === categoryFilter;
    const matchSeverity =
      severityFilter === "All" || insight.severity === severityFilter;
    const matchSearch =
      searchQuery === "" ||
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (insight.kpi &&
        insight.kpi.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSeverity && matchSearch;
  });

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header">
        <div className="module-header-left">
          <div className="module-icon module-icon--reporting">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 15L7 9L11 12L15 5L18 8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 17h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="module-title">Insights de Reporting</h2>
            <p className="module-subtitle">
              Analyse IA des KPIs financiers, tendances et prévisions
            </p>
          </div>
        </div>
        <div className="module-header-right">
          <button
            className={`kpi-toggle-btn ${showKPIPanel ? "active" : ""}`}
            onClick={() => setShowKPIPanel(!showKPIPanel)}
          >
            {showKPIPanel ? "Masquer KPIs" : "Afficher KPIs"}
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
      {!loading && !error && <ReportingSummary insights={insights} />}

      {/* KPI Summary Panel */}
      {!loading && !error && showKPIPanel && (
        <KPISummaryPanel insights={insights} />
      )}

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
            placeholder="Rechercher un insight, KPI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="All">Toutes les sévérités</option>
          <option value="Critical">Critique</option>
          <option value="High">Élevé</option>
          <option value="Medium">Moyen</option>
          <option value="Low">Faible</option>
        </select>
        {(categoryFilter !== "All" ||
          severityFilter !== "All" ||
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
                  {insight.period && (
                    <span className="meta-tag meta-tag--period">
                      📅 {insight.period}
                    </span>
                  )}
                  {insight.category === "Forecast" && (
                    <span className="meta-tag meta-tag--ai">
                      🤖 Prévision IA
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

export default ReportingInsights;
