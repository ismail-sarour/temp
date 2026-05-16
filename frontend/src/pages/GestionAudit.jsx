import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  STORAGE_KEYS,
  AUDIT_ACTIONS,
  exportToCSV,
  exportToJSON,
} from "../services/dataStore";

const thStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 500,
  color: "#A8A49C",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tdStyle = (extra = {}) => ({
  padding: "13px 16px",
  color: "#6B6760",
  ...extra,
});

const ActionBadge = ({ action }) => {
  const colors = {
    CREATE: { bg: "#EAF4E2", color: "#3B6D11" },
    UPDATE: { bg: "#E8F0FA", color: "#185FA5" },
    DELETE: { bg: "#FAECE7", color: "#993C1D" },
    STATUS_CHANGE: { bg: "#F0EAF8", color: "#6B2FAD" },
    VALIDATE: { bg: "#EAF4E2", color: "#3B6D11" },
    REJECT: { bg: "#FAEEDA", color: "#854F0B" },
    APPROVE: { bg: "#EAF4E2", color: "#3B6D11" },
    PAY: { bg: "#E8F0FA", color: "#185FA5" },
    CANCEL: { bg: "#F5F0E8", color: "#6B6760" },
  };
  const style = colors[action] || colors.UPDATE;
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {action}
    </span>
  );
};

const EntityTypeBadge = ({ type }) => {
  const colors = {
    COMMANDE: { bg: "#FEF3E6", color: "#9A6A1A" },
    DEVIS: { bg: "#E8F0FA", color: "#185FA5" },
    ENGAGEMENT: { bg: "#F0EAF8", color: "#6B2FAD" },
    EXECUTION: { bg: "#EAF4E2", color: "#3B6D11" },
    ORDONNANCE: { bg: "#FAEEDA", color: "#854F0B" },
    PAIEMENT: { bg: "#E8F0FA", color: "#185FA5" },
    VIREMENT: { bg: "#E8D5A3", color: "#8B6914" },
    ATTRIBUTION: { bg: "#F0EAF8", color: "#6B2FAD" },
    DOCUMENT: { bg: "#F5F0E8", color: "#6B6760" },
    USER: { bg: "#F0EAF8", color: "#6B2FAD" },
  };
  const style = colors[type] || { bg: "#F6F5F2", color: "#A8A49C" };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {type}
    </span>
  );
};

export default function GestionAudit() {
  const [logs, setLogs] = useLocalStorage(STORAGE_KEYS.AUDIT_LOGS, []);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntityType, setFilterEntityType] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    let filtered = [...logs];

    if (filterAction !== "all") {
      filtered = filtered.filter((log) => log.action === filterAction);
    }

    if (filterEntityType !== "all") {
      filtered = filtered.filter((log) => log.entityType === filterEntityType);
    }

    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      filtered = filtered.filter((log) => new Date(log.timestamp) >= from);
    }

    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59);
      filtered = filtered.filter((log) => new Date(log.timestamp) <= to);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.entityId?.toString().includes(query) ||
          log.entityType?.toLowerCase().includes(query) ||
          log.action?.toLowerCase().includes(query) ||
          log.user?.name?.toLowerCase().includes(query) ||
          JSON.stringify(log.details).toLowerCase().includes(query),
      );
    }

    setFilteredLogs(
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    );
  }, [
    logs,
    filterAction,
    filterEntityType,
    filterDateFrom,
    filterDateTo,
    searchQuery,
  ]);

  const getActionOptions = () => {
    const actions = [...new Set(logs.map((l) => l.action))];
    return ["all", ...actions];
  };

  const getEntityTypeOptions = () => {
    const types = [...new Set(logs.map((l) => l.entityType))];
    return ["all", ...types];
  };

  const clearFilters = () => {
    setFilterAction("all");
    setFilterEntityType("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearchQuery("");
  };

  const handleExportCSV = () => {
    exportToCSV(filteredLogs, "audit_logs");
  };

  const handleExportJSON = () => {
    exportToJSON(filteredLogs, "audit_logs");
  };

  const formatDetails = (details) => {
    if (!details) return "-";
    const entries = Object.entries(details);
    if (entries.length === 0) return "-";
    return entries
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(", ");
  };

  const stats = {
    total: logs.length,
    today: logs.filter(
      (l) => new Date(l.timestamp).toDateString() === new Date().toDateString(),
    ).length,
    thisWeek: logs.filter((l) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(l.timestamp) >= weekAgo;
    }).length,
    byAction: Object.values(AUDIT_ACTIONS).reduce((acc, action) => {
      acc[action] = logs.filter((l) => l.action === action).length;
      return acc;
    }, {}),
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      <Topbar title="Audit & Traçabilité" />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          background: "#F6F5F2",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "#1A1917",
              }}
            >
              Journal des Opérations
            </div>
            <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
              {stats.total} opérations enregistrées • {stats.today} aujourd'hui
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleExportCSV}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#FEFCF9",
                color: "#1A1917",
                border: "0.5px solid #DDD9D0",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12.5,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 9v2a1 1 0 001 1h6a1 1 0 001-1v-2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M7 2v8M4 7l3 3 3-3"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export CSV
            </button>
            <button
              onClick={handleExportJSON}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#FEFCF9",
                color: "#1A1917",
                border: "0.5px solid #DDD9D0",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12.5,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 9v2a1 1 0 001 1h6a1 1 0 001-1v-2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M7 2v8M4 7l3 3 3-3"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export JSON
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>
              Total Opérations
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
                fontWeight: 600,
                color: "#1A1917",
              }}
            >
              {stats.total}
            </div>
          </div>
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>
              Aujourd'hui
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
                fontWeight: 600,
                color: "#3B6D11",
              }}
            >
              {stats.today}
            </div>
          </div>
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>
              Cette Semaine
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
                fontWeight: 600,
                color: "#185FA5",
              }}
            >
              {stats.thisWeek}
            </div>
          </div>
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>
              Créations
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
                fontWeight: 600,
                color: "#6B2FAD",
              }}
            >
              {stats.byAction.CREATE || 0}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            background: "#FEFCF9",
            border: "0.5px solid #E8E4DC",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1917" }}>
              Filtres
            </div>
            <button
              onClick={clearFilters}
              style={{
                background: "transparent",
                border: "none",
                color: "#6B6760",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                textDecoration: "underline",
              }}
            >
              Réinitialiser
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 12,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "#A8A49C",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Action
              </label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "0.5px solid #DDD9D0",
                  fontSize: 12.5,
                  fontFamily: "'DM Sans', sans-serif",
                  background: "#FEFCF9",
                }}
              >
                {getActionOptions().map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "all" ? "Toutes les actions" : opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "#A8A49C",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Type d'entité
              </label>
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "0.5px solid #DDD9D0",
                  fontSize: 12.5,
                  fontFamily: "'DM Sans', sans-serif",
                  background: "#FEFCF9",
                }}
              >
                {getEntityTypeOptions().map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === "all" ? "Tous les types" : opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "#A8A49C",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Du
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "0.5px solid #DDD9D0",
                  fontSize: 12.5,
                  fontFamily: "'DM Sans', sans-serif",
                  background: "#FEFCF9",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "#A8A49C",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Au
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "0.5px solid #DDD9D0",
                  fontSize: 12.5,
                  fontFamily: "'DM Sans', sans-serif",
                  background: "#FEFCF9",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "#A8A49C",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Recherche
              </label>
              <input
                type="text"
                placeholder="ID, type, action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "0.5px solid #DDD9D0",
                  fontSize: 12.5,
                  fontFamily: "'DM Sans', sans-serif",
                  background: "#FEFCF9",
                }}
              />
            </div>
          </div>
        </div>

        {/* Results count */}
        <div style={{ marginBottom: 12, fontSize: 12, color: "#A8A49C" }}>
          {filteredLogs.length} opération(s) trouvée(s)
        </div>

        {/* Audit Log Table */}
        {filteredLogs.length > 0 ? (
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12.5,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F6F5F2",
                    borderBottom: "0.5px solid #E8E4DC",
                  }}
                >
                  {[
                    "Date/Heure",
                    "Action",
                    "Type",
                    "ID Entité",
                    "Utilisateur",
                    "Détails",
                    "",
                  ].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => (
                  <tr
                    key={log._id}
                    style={{
                      borderBottom:
                        i < filteredLogs.length - 1
                          ? "0.5px solid #F2EFE8"
                          : "none",
                      cursor: "pointer",
                      background:
                        selectedLog?._id === log._id
                          ? "#F6F5F2"
                          : "transparent",
                    }}
                    onClick={() =>
                      setSelectedLog(selectedLog?._id === log._id ? null : log)
                    }
                  >
                    <td style={tdStyle()}>
                      {new Date(log.timestamp).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td style={tdStyle()}>
                      <ActionBadge action={log.action} />
                    </td>
                    <td style={tdStyle()}>
                      <EntityTypeBadge type={log.entityType} />
                    </td>
                    <td style={tdStyle({ fontWeight: 500, color: "#1A1917" })}>
                      {log.entityId}
                    </td>
                    <td style={tdStyle()}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 500, color: "#1A1917" }}>
                          {log.user?.name || "Système"}
                        </span>
                        <span style={{ fontSize: 10.5, color: "#A8A49C" }}>
                          {log.user?.role || "-"}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        ...tdStyle(),
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDetails(log.details)}
                    </td>
                    <td style={tdStyle()}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        style={{ color: "#A8A49C" }}
                      >
                        <path
                          d="M7 3v8M3 7h8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Detail Panel */}
            {selectedLog && (
              <div
                style={{
                  background: "#F6F5F2",
                  border: "0.5px solid #E8E4DC",
                  padding: 20,
                  borderTop: "1px solid #E8E4DC",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1A1917",
                    marginBottom: 12,
                  }}
                >
                  Détails de l'opération
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 12,
                    fontSize: 12.5,
                  }}
                >
                  <div>
                    <span style={{ color: "#A8A49C" }}>ID:</span>{" "}
                    <span style={{ color: "#1A1917", fontWeight: 500 }}>
                      {selectedLog._id}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#A8A49C" }}>Horodatage:</span>{" "}
                    <span style={{ color: "#1A1917", fontWeight: 500 }}>
                      {new Date(selectedLog.timestamp).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#A8A49C" }}>Action:</span>{" "}
                    <span style={{ color: "#1A1917", fontWeight: 500 }}>
                      {selectedLog.action}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#A8A49C" }}>Type:</span>{" "}
                    <span style={{ color: "#1A1917", fontWeight: 500 }}>
                      {selectedLog.entityType}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#A8A49C" }}>ID Entité:</span>{" "}
                    <span style={{ color: "#1A1917", fontWeight: 500 }}>
                      {selectedLog.entityId}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#A8A49C" }}>Utilisateur:</span>{" "}
                    <span style={{ color: "#1A1917", fontWeight: 500 }}>
                      {selectedLog.user?.name || "Système"} (
                      {selectedLog.user?.role || "-"})
                    </span>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "#A8A49C" }}>Détails complets:</span>
                    <pre
                      style={{
                        background: "#FEFCF9",
                        border: "0.5px solid #E8E4DC",
                        borderRadius: 8,
                        padding: 12,
                        marginTop: 6,
                        fontSize: 11.5,
                        overflow: "auto",
                        maxHeight: 150,
                      }}
                    >
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "#A8A49C" }}>User Agent:</span>
                    <div
                      style={{ fontSize: 10.5, color: "#6B6760", marginTop: 4 }}
                    >
                      {selectedLog.userAgent}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14, color: "#A8A49C" }}>
              Aucune opération trouvée pour les filtres sélectionnés.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
