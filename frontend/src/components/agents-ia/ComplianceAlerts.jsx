import React, { useState, useEffect } from "react";
import AlertCard from "./AlertCard";
import agentsIAService from "../../services/agentsIAService";
import "./AIDashboard.css";

// ─── Category tabs config ─────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "All", label: "Toutes" },
  { key: "Document", label: "Documents" },
  { key: "Regulatory", label: "Réglementaire" },
  { key: "Fraud", label: "Fraude" },
  { key: "Process", label: "Processus" },
  { key: "Payment", label: "Paiements" },
];

const STATUSES = ["All", "Active", "Pending", "Overdue", "Info"];

// ─── Compliance Summary ───────────────────────────────────────────────────────
const ComplianceSummary = ({ alerts }) => {
  const critical = alerts.filter((a) => a.severity === "Critical").length;
  const overdue = alerts.filter((a) => a.status === "Overdue").length;
  const expiringSoon = alerts.filter(
    (a) => a.daysUntilExpiry !== null && a.daysUntilExpiry <= 30,
  ).length;
  const violations = alerts.filter(
    (a) => a.category === "Fraud" || a.badge === "Violation",
  ).length;

  return (
    <div className="summary-stats">
      <div className="stat-card stat-card--critical">
        <div className="stat-number">{critical}</div>
        <div className="stat-label">Violations critiques</div>
      </div>
      <div className="stat-card stat-card--high">
        <div className="stat-number">{overdue}</div>
        <div className="stat-label">En retard</div>
      </div>
      <div className="stat-card stat-card--warning">
        <div className="stat-number">{expiringSoon}</div>
        <div className="stat-label">Expirations proches</div>
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
          d="M18 24l5 5 9-9"
          stroke="#dee2e6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <h3>Aucune alerte de conformité trouvée</h3>
    <p>
      Aucune alerte ne correspond à vos critères. La conformité est assurée !
    </p>
    <button className="empty-state-reset" onClick={onReset}>
      Réinitialiser les filtres
    </button>
  </div>
);

// ─── Expiry Countdown Badge ───────────────────────────────────────────────────
const ExpiryCountdown = ({ days }) => {
  if (days === null || days === undefined) return null;
  const color = days <= 7 ? "#dc3545" : days <= 15 ? "#fd7e14" : "#ffc107";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: color + "18",
        color,
        border: `1px solid ${color}40`,
        borderRadius: 12,
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      ⏱ Expire dans {days}j
    </span>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = {
    Active: { color: "#dc3545", label: "Actif" },
    Pending: { color: "#ffc107", label: "En attente" },
    Overdue: { color: "#fd7e14", label: "En retard" },
    Info: { color: "#17a2b8", label: "Info" },
  };
  const c = config[status] || { color: "#6c757d", label: status };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: c.color + "18",
        color: c.color,
        border: `1px solid ${c.color}40`,
        borderRadius: 12,
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {c.label}
    </span>
  );
};

// ─── ComplianceAlerts Component ───────────────────────────────────────────────
const ComplianceAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    agentsIAService
      .getComplianceAlerts()
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger les alertes de conformité.");
        setLoading(false);
      });
  }, []);

  const resetFilters = () => {
    setCategoryFilter("All");
    setStatusFilter("All");
    setSeverityFilter("All");
    setSearchQuery("");
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchCategory =
      categoryFilter === "All" || alert.category === categoryFilter;
    const matchStatus = statusFilter === "All" || alert.status === statusFilter;
    const matchSeverity =
      severityFilter === "All" || alert.severity === severityFilter;
    const matchSearch =
      searchQuery === "" ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.affectedEntity &&
        alert.affectedEntity.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchStatus && matchSeverity && matchSearch;
  });

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header">
        <div className="module-header-left">
          <div className="module-icon module-icon--compliance">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect
                x="3"
                y="2"
                width="14"
                height="16"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M7 7h6M7 10h6M7 13h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="module-title">Alertes de Conformité</h2>
            <p className="module-subtitle">
              Surveillance réglementaire et détection des non-conformités
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
      {!loading && !error && <ComplianceSummary alerts={alerts} />}

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
            placeholder="Rechercher par titre, entité..."
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
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "All"
                ? "Tous les statuts"
                : s === "Active"
                  ? "Actif"
                  : s === "Pending"
                    ? "En attente"
                    : s === "Overdue"
                      ? "En retard"
                      : "Info"}
            </option>
          ))}
        </select>
        {(severityFilter !== "All" ||
          categoryFilter !== "All" ||
          statusFilter !== "All" ||
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
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginTop: 4,
                  }}
                >
                  {alert.affectedEntity && (
                    <span className="meta-tag meta-tag--entity">
                      🏛 {alert.affectedEntity}
                    </span>
                  )}
                  {alert.complianceType && (
                    <span className="meta-tag meta-tag--type">
                      📋 {alert.complianceType}
                    </span>
                  )}
                  <StatusBadge status={alert.status} />
                  {alert.daysUntilExpiry !== null && (
                    <ExpiryCountdown days={alert.daysUntilExpiry} />
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

export default ComplianceAlerts;
