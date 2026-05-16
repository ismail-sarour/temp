import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import StatusActiveToggle from "../components/StatusActiveToggle";
import DeleteIconButton from "../components/DeleteIconButton";
import {
  logAudit,
  AUDIT_ACTIONS,
  STORAGE_KEYS,
  getData,
} from "../services/dataStore";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  onDevisRecorded,
  processAttribution,
  buildComparaisons,
  getBcsForDevis,
  getBcsForAttribution,
  computeDevisTtc,
  DEVIS_STATUS,
} from "../services/modulesWorkflow";

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "0.5px solid #DDD9D0",
  background: "#FEFCF9",
  fontSize: 13.5,
  fontFamily: "'DM Sans', sans-serif",
  color: "#1A1917",
  outline: "none",
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 500,
  color: "#6B6760",
  marginBottom: 6,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

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

// ─── Small components ────────────────────────────────────────────────────────
const AddBtn = ({ onClick, label }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "#1A1917",
      color: "#F5F0E8",
      border: "none",
      borderRadius: 8,
      padding: "8px 14px",
      fontSize: 12.5,
      fontFamily: "'DM Sans', sans-serif",
      cursor: "pointer",
      fontWeight: 500,
    }}
  >
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1v10M1 6h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
    {label}
  </button>
);

const EmptyState = ({ message }) => (
  <div
    style={{
      background: "#FEFCF9",
      border: "0.5px solid #E8E4DC",
      borderRadius: 12,
      padding: "48px 24px",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: 13.5, color: "#A8A49C" }}>{message}</div>
  </div>
);

const Warning = ({ message }) => (
  <div
    style={{
      background: "#FAEEDA",
      border: "0.5px solid #F5D99A",
      borderRadius: 10,
      padding: "12px 16px",
      marginBottom: 16,
      fontSize: 13,
      color: "#854F0B",
    }}
  >
    {message}
  </div>
);

const FormCard = ({ title, onSave, onCancel, saveLabel, children }) => (
  <div
    style={{
      background: "#FEFCF9",
      border: "0.5px solid #E8E4DC",
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
    }}
  >
    <div
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 14,
        fontWeight: 600,
        color: "#1A1917",
        marginBottom: 20,
      }}
    >
      {title}
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <button
        onClick={onSave}
        style={{
          background: "#1A1917",
          color: "#F5F0E8",
          border: "none",
          borderRadius: 8,
          padding: "10px 20px",
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        {saveLabel}
      </button>
      <button
        onClick={onCancel}
        style={{
          background: "transparent",
          color: "#6B6760",
          border: "0.5px solid #DDD9D0",
          borderRadius: 8,
          padding: "10px 20px",
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          cursor: "pointer",
        }}
      >
        Annuler
      </button>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    Reçu: { bg: "#E8F0FA", color: "#185FA5" },
    Retenu: { bg: "#EAF4E2", color: "#3B6D11" },
    Rejeté: { bg: "#F5F0E8", color: "#6B6760" },
    Actif: { bg: "#EAF4E2", color: "#3B6D11" },
    Inactif: { bg: "#F5F0E8", color: "#6B6760" },
  };
  const style = colors[status] || colors["Inactif"];
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      {status}
    </span>
  );
};

const formatNumber = (value) => Number(value || 0).toLocaleString("fr-FR");

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function GestionDevis() {
  const [tab, setTab] = useState("devis");

  const [devis, setDevis] = useLocalStorage(STORAGE_KEYS.DEVIS, []);
  const [comparaisons, setComparaisons] = useLocalStorage(
    STORAGE_KEYS.DEVIS_COMPARAISONS,
    [],
  );
  const [attributions, setAttributions] = useLocalStorage(
    STORAGE_KEYS.DEVIS_ATTRIBUTIONS,
    [],
  );
  const [devisHistory, setDevisHistory] = useLocalStorage("devisHistory", []);
  const [commandes] = useLocalStorage(STORAGE_KEYS.COMMANDES, []);
  const [suppliers] = useLocalStorage(STORAGE_KEYS.FOURNISSEURS, []);

  // FORMS
  const [devisForm, setDevisForm] = useState({
    bc_id: "",
    supplier_id: "",
    reference: "",
    date: new Date().toISOString().split("T")[0],
    amount_ht: "",
    amount_ttc: "",
    tva_rate: 20,
    document_path: "",
    status: DEVIS_STATUS.RECU,
    observation: "",
  });
  const [editDevisId, setEditDevisId] = useState(null);
  const [showDevisForm, setShowDevisForm] = useState(false);

  const getBcLabel = (id) => {
    const bc = commandes.find((b) => String(b._id) === String(id));
    return bc ? `${bc.reference || "BC-" + bc._id}` : "-";
  };

  const getSupplierLabel = (id) => {
    const s = suppliers.find((sup) => String(sup._id) === String(id));
    return s ? s.company_name : "-";
  };

  const getActiveSuppliers = () =>
    suppliers.filter((s) => s.status === "Actif");

  const applyTvaToForm = (ht, rate) => {
    const { amount_ttc, tva_amount } = computeDevisTtc(ht, rate);
    setDevisForm((prev) => ({
      ...prev,
      amount_ht: ht,
      amount_ttc: amount_ttc ? String(amount_ttc) : "",
      tva_amount,
    }));
  };

  // ═════════════════════════════════════════════════════════════════
  // DEVIS CRUD
  // ═════════════════════════════════════════════════════════════════
  const submitDevis = () => {
    if (
      !devisForm.bc_id ||
      !devisForm.supplier_id ||
      !devisForm.reference ||
      !devisForm.amount_ht
    ) {
      alert("Renseignez le BC, le fournisseur, la référence et le montant HT.");
      return;
    }

    const dup = devis.find(
      (d) =>
        String(d.bc_id) === String(devisForm.bc_id) &&
        String(d.supplier_id) === String(devisForm.supplier_id) &&
        String(d._id) !== String(editDevisId || ""),
    );
    if (dup) {
      alert("Un devis existe déjà pour ce fournisseur sur ce BC.");
      return;
    }

    const ht = Number(devisForm.amount_ht);
    const calc = computeDevisTtc(ht, devisForm.tva_rate || 20);
    const entry = {
      ...devisForm,
      _id: editDevisId || Date.now(),
      amount_ht: calc.amount_ht,
      amount_ttc: Number(devisForm.amount_ttc) || calc.amount_ttc,
      tva_amount: calc.tva_amount,
      status: devisForm.status || DEVIS_STATUS.RECU,
      created_at: new Date().toISOString(),
    };

    if (editDevisId) {
      setDevis(devis.map((d) => (d._id === editDevisId ? entry : d)));
      logAudit(AUDIT_ACTIONS.UPDATE, "DEVIS", editDevisId, {
        reference: entry.reference,
      });
      setEditDevisId(null);
    } else {
      setDevis([...devis, entry]);
      onDevisRecorded(devisForm.bc_id);
      logAudit(AUDIT_ACTIONS.CREATE, "DEVIS", entry._id, {
        reference: entry.reference,
        bc_id: entry.bc_id,
      });
    }
    setDevisForm({
      bc_id: "",
      supplier_id: "",
      reference: "",
      date: new Date().toISOString().split("T")[0],
      amount_ht: "",
      amount_ttc: "",
      tva_rate: 20,
      document_path: "",
      status: DEVIS_STATUS.RECU,
      observation: "",
    });
    setShowDevisForm(false);
  };

  const editDevis = (d) => {
    setDevisForm(d);
    setEditDevisId(d._id);
    setShowDevisForm(true);
  };

  const deleteDevis = (_id) => {
    const item = devis.find((d) => d._id === _id);
    if (item?.status === DEVIS_STATUS.RETENU) {
      alert("Impossible de supprimer un devis retenu.");
      return;
    }
    setDevis(devis.filter((d) => d._id !== _id));
    logAudit(AUDIT_ACTIONS.DELETE, "DEVIS", _id, { reference: item?.reference });
  };

  const updateDevisStatus = (id, status) => {
    const oldDevis = devis.find((d) => d._id === id);
    const updatedDevis = devis.map((d) =>
      d._id === id ? { ...d, status } : d,
    );
    setDevis(updatedDevis);

    // Log history
    if (oldDevis && oldDevis.status !== status) {
      const historyEntry = {
        _id: Date.now(),
        devis_id: id,
        devis_reference: oldDevis.reference,
        bc_id: oldDevis.bc_id,
        from_status: oldDevis.status,
        to_status: status,
        date: new Date().toISOString(),
        user: "Superviseur",
      };
      setDevisHistory([...devisHistory, historyEntry]);

      // Log audit
      logAudit(AUDIT_ACTIONS.STATUS_CHANGE, "DEVIS", id, {
        from: oldDevis.status,
        to: status,
        reference: oldDevis.reference,
      });
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // COMPARAISON DES DEVIS
  // ═════════════════════════════════════════════════════════════════
  const generateComparaison = () => {
    if (devis.length === 0) {
      alert("Aucun devis à comparer.");
      return;
    }
    setComparaisons(buildComparaisons(devis, getBcLabel, getSupplierLabel));
  };

  // ═════════════════════════════════════════════════════════════════
  // ATTRIBUTION
  // ═════════════════════════════════════════════════════════════════
  const [attributionForm, setAttributionForm] = useState({
    bc_id: "",
    devis_id: "",
    justification: "",
    date_attribution: "",
  });
  const [showAttributionForm, setShowAttributionForm] = useState(false);

  const submitAttribution = () => {
    if (!attributionForm.bc_id || !attributionForm.devis_id) {
      alert("Sélectionnez le BC et le devis retenu.");
      return;
    }

    const result = processAttribution({
      bcId: attributionForm.bc_id,
      devisId: attributionForm.devis_id,
      justification: attributionForm.justification,
      dateAttribution: attributionForm.date_attribution,
      devisList: devis,
      getBcLabel,
      getSupplierLabel,
    });

    if (!result.success) {
      alert(result.error);
      return;
    }

    const freshDevis = getData(STORAGE_KEYS.DEVIS, []);
    setDevis(freshDevis);

    const historyEntry = {
      _id: Date.now(),
      type: "ATTRIBUTION",
      bc_id: attributionForm.bc_id,
      bc_reference: getBcLabel(attributionForm.bc_id),
      devis_id: attributionForm.devis_id,
      engagement_id: result.engagement?._id,
      date: new Date().toISOString(),
      user: "Superviseur",
    };
    setDevisHistory([...devisHistory, historyEntry]);

    const freshAttr = getData(STORAGE_KEYS.DEVIS_ATTRIBUTIONS, []);
    setAttributions(freshAttr);

    setAttributionForm({
      bc_id: "",
      devis_id: "",
      justification: "",
      date_attribution: "",
    });
    setShowAttributionForm(false);
    alert(
      `Attribution enregistrée. Engagement ${result.engagement?.reference} créé en brouillon — validez-le dans le module Engagements.`,
    );
  };

  // TABS
  const tabs = [
    { key: "devis", label: "Devis Reçus", count: devis.length },
    { key: "comparaison", label: "Comparaison", count: comparaisons.length },
    { key: "attribution", label: "Attributions", count: attributions.length },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      <Topbar title="Gestion des Devis et Attributions" />

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          background: "#F6F5F2",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 24,
            background: "#FEFCF9",
            border: "0.5px solid #E8E4DC",
            borderRadius: 10,
            padding: 4,
            width: "fit-content",
            flexWrap: "wrap",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: tab === t.key ? "#1A1917" : "transparent",
                color: tab === t.key ? "#F5F0E8" : "#6B6760",
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 7,
                transition: "background 0.15s",
              }}
            >
              {t.label}
              <span
                style={{
                  fontSize: 10.5,
                  padding: "1px 6px",
                  borderRadius: 20,
                  background:
                    tab === t.key ? "rgba(255,255,255,0.15)" : "#F2EFE8",
                  color: tab === t.key ? "#F5F0E8" : "#A8A49C",
                }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB: DEVIS REÇUS
        ════════════════════════════════════════════════════════════════ */}
        {tab === "devis" && (
          <>
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
                  Devis Reçus
                </div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                  Offres reçues pour les bons de commande
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <AddBtn
                  onClick={() => setShowDevisForm(true)}
                  label="Nouveau Devis"
                />
                <button
                  onClick={generateComparaison}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#3C3489",
                    color: "#F5F0E8",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12.5,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6h8M6 2v8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  Générer Comparaison
                </button>
              </div>
            </div>

            {getBcsForDevis(commandes).length === 0 && (
              <Warning message="Aucun BC publié ou en attente de devis. Publiez un bon de commande d'abord." />
            )}
            {getActiveSuppliers().length === 0 && (
              <Warning message="Aucun fournisseur actif. Veuillez créer des fournisseurs d'abord." />
            )}

            {showDevisForm && (
              <FormCard
                title={editDevisId ? "Modifier le devis" : "Nouveau devis"}
                onSave={submitDevis}
                onCancel={() => {
                  setShowDevisForm(false);
                  setEditDevisId(null);
                  setDevisForm({
                    bc_id: "",
                    supplier_id: "",
                    reference: "",
                    date: "",
                    amount_ht: "",
                    amount_ttc: "",
                    document_path: "",
                    status: "Reçu",
                    observation: "",
                  });
                }}
                saveLabel={editDevisId ? "Mettre à jour" : "Enregistrer"}
              >
                <div>
                  <label style={labelStyle}>Bon de Commande *</label>
                  <select
                    value={devisForm.bc_id}
                    onChange={(e) =>
                      setDevisForm({ ...devisForm, bc_id: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {getBcsForDevis(commandes).map((bc) => (
                      <option key={bc._id} value={String(bc._id)}>
                        {getBcLabel(bc._id)} ({bc.statut})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fournisseur *</label>
                  <select
                    value={devisForm.supplier_id}
                    onChange={(e) =>
                      setDevisForm({
                        ...devisForm,
                        supplier_id: e.target.value,
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {getActiveSuppliers().map((s) => (
                      <option key={s._id} value={String(s._id)}>
                        {s.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Référence Devis *</label>
                  <input
                    type="text"
                    placeholder="ex: DEV-2026-001"
                    value={devisForm.reference}
                    onChange={(e) =>
                      setDevisForm({ ...devisForm, reference: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Date Devis</label>
                  <input
                    type="date"
                    value={devisForm.date}
                    onChange={(e) =>
                      setDevisForm({ ...devisForm, date: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Montant HT (MAD) *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={devisForm.amount_ht}
                    onChange={(e) =>
                      applyTvaToForm(e.target.value, devisForm.tva_rate || 20)
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Montant TTC (MAD)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={devisForm.amount_ttc}
                    onChange={(e) =>
                      setDevisForm({ ...devisForm, amount_ttc: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Chemin Document</label>
                  <input
                    type="text"
                    placeholder="ex: /documents/devis-001.pdf"
                    value={devisForm.document_path}
                    onChange={(e) =>
                      setDevisForm({
                        ...devisForm,
                        document_path: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Observation</label>
                  <textarea
                    placeholder="Notes..."
                    value={devisForm.observation}
                    onChange={(e) =>
                      setDevisForm({
                        ...devisForm,
                        observation: e.target.value,
                      })
                    }
                    style={{
                      ...inputStyle,
                      minHeight: 60,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
              </FormCard>
            )}

            {devis.length > 0 ? (
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
                      {[
                        "Référence",
                        "BC",
                        "Fournisseur",
                        "Date",
                        "HT (MAD)",
                        "TTC (MAD)",
                        "Statut",
                        "Actions",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {devis.map((d, i) => (
                      <tr
                        key={d._id}
                        style={{
                          borderBottom:
                            i < devis.length - 1
                              ? "0.5px solid #F2EFE8"
                              : "none",
                        }}
                      >
                        <td
                          style={tdStyle({ fontWeight: 600, color: "#1A1917" })}
                        >
                          {d.reference}
                        </td>
                        <td style={tdStyle()}>{getBcLabel(d.bc_id)}</td>
                        <td style={tdStyle()}>
                          {getSupplierLabel(d.supplier_id)}
                        </td>
                        <td style={tdStyle()}>
                          {d.date
                            ? new Date(d.date).toLocaleDateString("fr-FR")
                            : "-"}
                        </td>
                        <td
                          style={tdStyle({ fontWeight: 500, color: "#1A1917" })}
                        >
                          {formatNumber(d.amount_ht)}
                        </td>
                        <td
                          style={tdStyle({ fontWeight: 500, color: "#1A1917" })}
                        >
                          {formatNumber(d.amount_ttc)}
                        </td>
                        <td style={tdStyle()}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <StatusBadge status={d.status} />
                            {d.status === "Reçu" && (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value)
                                    updateDevisStatus(d._id, e.target.value);
                                  e.target.value = "";
                                }}
                                style={{
                                  ...inputStyle,
                                  width: "auto",
                                  padding: "4px 8px",
                                  fontSize: 11,
                                }}
                              >
                                <option value="">Changer...</option>
                                <option value="Retenu">Retenu</option>
                                <option value="Rejeté">Rejeté</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td style={tdStyle()}>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            <button
                              onClick={() => editDevis(d)}
                              style={{
                                background: "#F2EFE8",
                                border: "0.5px solid #DDD9D0",
                                borderRadius: 6,
                                padding: "5px 12px",
                                fontSize: 12,
                                color: "#1A1917",
                                cursor: "pointer",
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            >
                              Modifier
                            </button>
                            <DeleteIconButton
                              onConfirm={() => deleteDevis(d._id)}
                              message="Êtes-vous sûr de vouloir supprimer ce devis ?"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !showDevisForm && (
                <EmptyState message='Aucun devis. Cliquez sur "Nouveau Devis" pour commencer.' />
              )
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: COMPARAISON
        ════════════════════════════════════════════════════════════════ */}
        {tab === "comparaison" && (
          <>
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
                  Comparaison des Devis
                </div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                  Analyse comparative des offres par bon de commande
                </div>
              </div>
              <AddBtn onClick={generateComparaison} label="Rafraîchir" />
            </div>

            {comparaisons.length > 0 ? (
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
                      {[
                        "BC",
                        "Nb Devis",
                        "Offre Min",
                        "Offre Max",
                        "Écart (MAD)",
                        "Écart (%)",
                        "Meilleur Offre",
                        "Date",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparaisons.map((c, i) => (
                      <tr
                        key={c._id}
                        style={{
                          borderBottom:
                            i < comparaisons.length - 1
                              ? "0.5px solid #F2EFE8"
                              : "none",
                        }}
                      >
                        <td
                          style={tdStyle({ fontWeight: 600, color: "#1A1917" })}
                        >
                          {c.bc_label}
                        </td>
                        <td style={tdStyle()}>
                          <span
                            style={{
                              background: "#E8F0FA",
                              color: "#185FA5",
                              padding: "2px 8px",
                              borderRadius: 20,
                              fontSize: 11.5,
                              fontWeight: 500,
                            }}
                          >
                            {c.devis_count}
                          </span>
                        </td>
                        <td
                          style={tdStyle({ fontWeight: 500, color: "#3B6D11" })}
                        >
                          {formatNumber(c.min_amount)} MAD
                        </td>
                        <td
                          style={tdStyle({ fontWeight: 500, color: "#854F0B" })}
                        >
                          {formatNumber(c.max_amount)} MAD
                        </td>
                        <td style={tdStyle()}>{formatNumber(c.ecart)} MAD</td>
                        <td style={tdStyle()}>
                          <span
                            style={{
                              background:
                                c.ecart_percent > 20 ? "#FAEEDA" : "#EAF4E2",
                              color:
                                c.ecart_percent > 20 ? "#854F0B" : "#3B6D11",
                              padding: "2px 8px",
                              borderRadius: 20,
                              fontSize: 11.5,
                              fontWeight: 500,
                            }}
                          >
                            {c.ecart_percent}%
                          </span>
                        </td>
                        <td style={tdStyle({ fontSize: 12, color: "#6B6760" })}>
                          {c.lowest_supplier}
                        </td>
                        <td style={tdStyle()}>
                          {new Date(c.date_comparaison).toLocaleDateString(
                            "fr-FR",
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message='Aucune comparaison disponible. Cliquez sur "Rafraîchir" pour générer les comparaisons à partir des devis reçus.' />
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: ATTRIBUTIONS
        ════════════════════════════════════════════════════════════════ */}
        {tab === "attribution" && (
          <>
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
                  Décisions d'Attribution
                </div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                  Historique des attributions de marchés
                </div>
              </div>
              <AddBtn
                onClick={() => setShowAttributionForm(true)}
                label="Nouvelle Attribution"
              />
            </div>

            {showAttributionForm && (
              <FormCard
                title="Nouvelle attribution"
                onSave={submitAttribution}
                onCancel={() => {
                  setShowAttributionForm(false);
                  setAttributionForm({
                    bc_id: "",
                    devis_id: "",
                    justification: "",
                    date_attribution: "",
                  });
                }}
                saveLabel="Enregistrer"
              >
                <div>
                  <label style={labelStyle}>Bon de Commande *</label>
                  <select
                    value={attributionForm.bc_id}
                    onChange={(e) => {
                      setAttributionForm({
                        ...attributionForm,
                        bc_id: e.target.value,
                        devis_id: "",
                      });
                    }}
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {getBcsForAttribution(commandes).map((bc) => (
                      <option key={bc._id} value={String(bc._id)}>
                        {getBcLabel(bc._id)} ({bc.statut})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Devis Retenu *</label>
                  <select
                    value={attributionForm.devis_id}
                    onChange={(e) =>
                      setAttributionForm({
                        ...attributionForm,
                        devis_id: e.target.value,
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {devis
                      .filter(
                        (d) =>
                          String(d.bc_id) === String(attributionForm.bc_id) &&
                          d.status === DEVIS_STATUS.RECU,
                      )
                      .map((d) => (
                        <option key={d._id} value={String(d._id)}>
                          {d.reference} - {getSupplierLabel(d.supplier_id)} (
                          {formatNumber(d.amount_ht)} MAD)
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date d'Attribution</label>
                  <input
                    type="date"
                    value={attributionForm.date_attribution}
                    onChange={(e) =>
                      setAttributionForm({
                        ...attributionForm,
                        date_attribution: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Justification du Choix</label>
                  <textarea
                    placeholder="Expliquez les raisons du choix..."
                    value={attributionForm.justification}
                    onChange={(e) =>
                      setAttributionForm({
                        ...attributionForm,
                        justification: e.target.value,
                      })
                    }
                    style={{
                      ...inputStyle,
                      minHeight: 80,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
              </FormCard>
            )}

            {attributions.length > 0 ? (
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
                      {[
                        "Date",
                        "BC",
                        "Fournisseur",
                        "Montant HT",
                        "Montant TTC",
                        "Justification",
                        "Actions",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attributions.map((a, i) => (
                      <tr
                        key={a._id}
                        style={{
                          borderBottom:
                            i < attributions.length - 1
                              ? "0.5px solid #F2EFE8"
                              : "none",
                        }}
                      >
                        <td style={tdStyle()}>
                          {new Date(a.date_attribution).toLocaleDateString(
                            "fr-FR",
                          )}
                        </td>
                        <td
                          style={tdStyle({ fontWeight: 600, color: "#1A1917" })}
                        >
                          {a.bc_label}
                        </td>
                        <td style={tdStyle()}>{a.supplier_name}</td>
                        <td
                          style={tdStyle({ fontWeight: 500, color: "#1A1917" })}
                        >
                          {formatNumber(a.amount_ht)} MAD
                        </td>
                        <td
                          style={tdStyle({ fontWeight: 500, color: "#1A1917" })}
                        >
                          {formatNumber(a.amount_ttc)} MAD
                        </td>
                        <td
                          style={{
                            ...tdStyle(),
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={a.justification}
                        >
                          {a.justification || "-"}
                        </td>
                        <td style={tdStyle()}>
                          <button
                            onClick={() => {}}
                            style={{
                              background: "#F2EFE8",
                              border: "0.5px solid #DDD9D0",
                              borderRadius: 6,
                              padding: "5px 12px",
                              fontSize: 12,
                              color: "#1A1917",
                              cursor: "pointer",
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !showAttributionForm && (
                <EmptyState message="Aucune attribution enregistrée." />
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
