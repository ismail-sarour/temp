import React, { useState } from "react";
import BudgetAlerts from "./BudgetAlerts";
import ComplianceAlerts from "./ComplianceAlerts";
import AuditInsights from "./AuditInsights";
import ReportingInsights from "./ReportingInsights";
import AIChatInterface from "./AIChatInterface";
import SupplierAnalysis from "./SupplierAnalysis";
import QuoteComparison from "./QuoteComparison";
import "./AIDashboard.css";

// ─── Tab Configuration ────────────────────────────────────────────────────────
const TABS = [
  {
    key: "budget",
    label: "Alertes Budgétaires",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 5v3l2 2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    component: <BudgetAlerts />,
    color: "#dc3545",
  },
  {
    key: "compliance",
    label: "Conformité",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect
          x="2"
          y="1"
          width="12"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M5 6h6M5 9h6M5 12h3"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    ),
    component: <ComplianceAlerts />,
    color: "#fd7e14",
  },
  {
    key: "audit",
    label: "Insights Audit",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 2v4M8 10v4M3 8h4M9 8h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    component: <AuditInsights />,
    color: "#6f42c1",
  },
  {
    key: "reporting",
    label: "Reporting IA",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 12L5 8L8 10L11 5L14 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 14h12"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    ),
    component: <ReportingInsights />,
    color: "#007bff",
  },
  {
    key: "chat",
    label: "Assistant IA",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 2a6 6 0 00-6 6v6h12V8a6 6 0 00-6-6z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M5 10h6"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    ),
    component: <AIChatInterface />,
    color: "#28a745",
  },
  {
    key: "suppliers",
    label: "Fournisseurs",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1L2 4.5v7L8 15l6-3.5v-7L8 1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8 1v6M2 4.5l6 2.5 6-2.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
    component: <SupplierAnalysis />,
    color: "#fd7e14",
  },
  {
    key: "quotes",
    label: "Comparaison Devis",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 4h12M2 8h12M2 12h7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle
          cx="13"
          cy="12"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path
          d="M12.3 12l.5.5 1.2-1.2"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    component: <QuoteComparison />,
    color: "#6f42c1",
  },
];

// ─── AIDashboard Component ────────────────────────────────────────────────────
const AIDashboard = () => {
  const [activeTab, setActiveTab] = useState("budget");

  const currentTab = TABS.find((t) => t.key === activeTab);

  return (
    <div className="ai-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              color: "#1A1917",
              fontWeight: 600,
            }}
          >
            Système d'Alertes & Insights IA
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "#888" }}>
            Surveillance intelligente en temps réel — Module 18
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#e9f7ef",
              color: "#28a745",
              border: "1px solid #c3e6cb",
              borderRadius: 20,
              padding: "5px 12px",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#28a745",
                display: "inline-block",
                animation: "pulse 2s infinite",
              }}
            />
            Moteur IA opérationnel
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`dashboard-tab-button ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...(activeTab === tab.key
                ? { color: tab.color, borderBottomColor: tab.color }
                : {}),
              position: "relative",
              zIndex: activeTab === tab.key ? 1 : 0,
            }}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">{currentTab?.component}</div>
    </div>
  );
};

export default AIDashboard;
