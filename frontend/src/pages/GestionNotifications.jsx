import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import { STORAGE_KEYS, getData, setData } from "../services/dataStore";
import { runSystemAlertsScan } from "../services/modulesReporting";

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

export default function GestionNotifications() {
  const [notifications, setNotifications] = useState(() => getData(STORAGE_KEYS.NOTIFICATIONS, []));
  const [filter, setFilter] = useState("all");

  const saveNotifications = (list) => {
    setNotifications(list);
    setData(STORAGE_KEYS.NOTIFICATIONS, list);
  };

  useEffect(() => {
    runSystemAlertsScan();
  }, []);

  const refreshAlerts = () => {
    const added = runSystemAlertsScan();
    if (added > 0) {
      const fresh = getData(STORAGE_KEYS.NOTIFICATIONS, []);
      setNotifications(fresh);
    }
  };

  const markAsRead = (id) => {
    saveNotifications(
      notifications.map((n) => (n._id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    saveNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.read);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeColor = (type) => {
    const t = String(type || "").toLowerCase();
    if (t.includes("succ") || t === "success") {
      return { bg: "#EAF4E2", color: "#3B6D11" };
    }
    if (t.includes("err")) {
      return { bg: "#FAECE7", color: "#993C1D" };
    }
    if (t.includes("att") || t === "warning") {
      return { bg: "#FAEEDA", color: "#854F0B" };
    }
    return { bg: "#E8F0FA", color: "#185FA5" };
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
      <Topbar title="Notifications et Alertes" />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          background: "#F6F5F2",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
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
              Notifications
            </div>
            <div style={{ fontSize: 12, color: "#A8A49C" }}>
              Centre de notifications et alertes système
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={refreshAlerts}
              style={{
                background: "#1A1917",
                color: "#F5F0E8",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Analyser les alertes
            </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                background: "#F2EFE8",
                border: "0.5px solid #DDD9D0",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                color: "#1A1917",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Tout marquer comme lu ({unreadCount})
            </button>
          )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["all", "unread", "read"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                background: filter === f ? "#1A1917" : "#FEFCF9",
                color: filter === f ? "#F5F0E8" : "#6B6760",
                fontSize: 12,
                fontFamily: "'DM Sans', sans-serif",
                border: filter === f ? "none" : "0.5px solid #DDD9D0",
              }}
            >
              {f === "all"
                ? "Toutes"
                : f === "unread"
                  ? `Non lues (${unreadCount})`
                  : "Lues"}
            </button>
          ))}
        </div>
        {filteredNotifications.length > 0 ? (
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
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F6F5F2",
                    borderBottom: "0.5px solid #E8E4DC",
                  }}
                >
                  {["Type", "Titre", "Message", "Date", "Statut"].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((n, i) => {
                  const tc = getTypeColor(n.type);
                  return (
                    <tr
                      key={n._id}
                      style={{
                        borderBottom:
                          i < filteredNotifications.length - 1
                            ? "0.5px solid #F2EFE8"
                            : "none",
                        opacity: n.read ? 0.6 : 1,
                      }}
                    >
                      <td style={tdStyle()}>
                        <span
                          style={{
                            background: tc.bg,
                            color: tc.color,
                            padding: "2px 8px",
                            borderRadius: 20,
                            fontSize: 11.5,
                            fontWeight: 500,
                          }}
                        >
                          {n.type}
                        </span>
                      </td>
                      <td
                        style={tdStyle({ fontWeight: 600, color: "#1A1917" })}
                      >
                        {n.title}
                      </td>
                      <td
                        style={{
                          ...tdStyle(),
                          maxWidth: 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={n.message}
                      >
                        {n.message}
                      </td>
                      <td style={tdStyle()}>
                        {new Date(n.date).toLocaleString("fr-FR")}
                      </td>
                      <td style={tdStyle()}>
                        {!n.read ? (
                          <button
                            onClick={() => markAsRead(n._id)}
                            style={{
                              background: "#E8F0FA",
                              border: "none",
                              borderRadius: 6,
                              padding: "4px 10px",
                              fontSize: 11,
                              color: "#185FA5",
                              cursor: "pointer",
                              fontFamily: "'DM Sans',sans-serif",
                            }}
                          >
                            Marquer lu
                          </button>
                        ) : (
                          <span style={{ color: "#A8A49C", fontSize: 11 }}>
                            Lu
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            <div style={{ fontSize: 13.5, color: "#A8A49C" }}>
              Aucune notification
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
