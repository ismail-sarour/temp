import React, { useState, useEffect } from "react";
import AlertCard from "./AlertCard";
import agentsIAService from "../../services/agentsIAService";
import "./AIDashboard.css";

// ─── Category tabs config ─────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "All", label: "Toutes" },
  { key: "Overrun", label: "Dépassements" },
  { key: "Suspicious", label: "Suspects" },
  { key: "Threshold", label: "Seuils" },
  { key: "Delay", label: "Retards" },
  { key: "Reminder", label: "Rappels" },
];

const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"];

// ─── Summary Stats ────────────────────────────────────────────────────────────
const SummaryStats = ({ alerts }) => {
  const critical = alerts.filter((a) => a.severity === "Critical").length;
  const high = alerts.filter((a) => a.severity === "High").length;
  const totalAtRisk = alerts
    .filter((a) => a.financialAmount)
    .reduce((sum, a) => sum + a.financialAmount, 0);

  return (
    <div className="summary-stats">
      <div className="stat-card stat-card--critical">
        <div className="stat-number">{critical}</div>
        <div className="stat-label">Alertes critiques</div>
      </div>
      <div className="stat-card stat-card--high">
        <div className="stat-number">{high}</div>
        <div className="stat-label">Alertes élevées</div>
      </div>
      <div className="stat-card stat-card--financial">
        <div className="stat-number">
          {totalAtRisk.toLocaleString("fr-MA")} MAD
        </div>
        <div className="stat-label">Montant à risque</div>
      </div>
      <div className="stat-card stat-card--total">
        <div className="stat-number">{alerts.length}</div>
        <div className="stat-label">Total alertes</div>
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
    <h3>Aucune alerte budgétaire trouvée</h3>
    <p>
      Aucune alerte ne correspond à vos critères de filtrage. Le budget semble
      sous contrôle !
    </p>
    <button className="empty-state-reset" onClick={onReset}>
      Réinitialiser les filtres
    </button>
  </div>
);

// ─── BudgetAlerts Component ───────────────────────────────────────────────────
const BudgetAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    agentsIAService
      .getBudgetAlerts()
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger les alertes budgétaires.");
        setLoading(false);
      });
  }, []);

  const resetFilters = () => {
    setSeverityFilter("All");
    setCategoryFilter("All");
    setSearchQuery("");
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchSeverity =
      severityFilter === "All" || alert.severity === severityFilter;
    const matchCategory =
      categoryFilter === "All" || alert.category === categoryFilter;
    const matchSearch =
      searchQuery === "" ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.department &&
        alert.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSeverity && matchCategory && matchSearch;
  });

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header">
        <div className="module-header-left">
          <div className="module-icon module-icon--budget">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M10 6v4l3 3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="module-title">Alertes Budgétaires</h2>
            <p className="module-subtitle">
              Surveillance IA des anomalies et dépassements budgétaires
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
      {!loading && !error && <SummaryStats alerts={alerts} />}

      {/* Category Tabs */}
      <div className="category-tabs">
        {CATEGORIES.map((cat) => {
          const count =
            cat.key === "All"
              ? alerts.length
              : alerts.filter((a) => a.category === cat.key).length;
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
            placeholder="Rechercher une alerte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s === "All"
                ? "Toutes les sévérités"
                : s === "Critical"
                  ? "Critique"
                  : s === "High"
                    ? "Élevé"
                    : s === "Medium"
                      ? "Moyen"
                      : "Faible"}
            </option>
          ))}
        </select>
        {(severityFilter !== "All" ||
          categoryFilter !== "All" ||
          searchQuery !== "") && (
          <button className="reset-btn" onClick={resetFilters}>
            ✕ Réinitialiser
          </button>
        )}
        <span className="results-count">
          {filteredAlerts.length} résultat
          {filteredAlerts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : filteredAlerts.length > 0 ? (
        <div className="alerts-grid">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              extraMeta={
                alert.department ? (
                  <span className="meta-tag meta-tag--dept">
                    🏢 {alert.department}
                  </span>
                ) : null
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

export default BudgetAlerts;
