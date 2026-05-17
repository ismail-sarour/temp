import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import DeleteIconButton from "../components/DeleteIconButton";
import {
  logAudit,
  AUDIT_ACTIONS,
  STORAGE_KEYS,
  getData,
  setData,
  linkDocument,
} from "../services/dataStore";
import {
  getBcsForExecution,
  markServiceFait,
  BC_STATUS,
} from "../services/modulesWorkflow";

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
    Planifié: { bg: "#E8F0FA", color: "#185FA5" },
    "En cours": { bg: "#E8D5A3", color: "#8B6914" },
    "Partiellement Reçu": { bg: "#FAEEDA", color: "#854F0B" },
    "Totalement Reçu": { bg: "#EAF4E2", color: "#3B6D11" },
    Clôturé: { bg: "#F5F0E8", color: "#6B6760" },
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

export default function GestionExecution() {
  const [tab, setTab] = useState("executions");
  const [executions, setExecutions] = useState(() => getData(STORAGE_KEYS.EXECUTIONS, []));
  const [receptions, setReceptions] = useState(() => getData(STORAGE_KEYS.RECEPTIONS, []));
  const [penalites, setPenalites] = useState(() => getData(STORAGE_KEYS.PENALITES, []));
  const [commandes, setCommandes] = useState(() => getData(STORAGE_KEYS.COMMANDES, []));

  const saveExecutions = (list) => {
    setExecutions(list);
    setData(STORAGE_KEYS.EXECUTIONS, list);
  };

  const saveReceptions = (list) => {
    setReceptions(list);
    setData(STORAGE_KEYS.RECEPTIONS, list);
  };

  const savePenalites = (list) => {
    setPenalites(list);
    setData(STORAGE_KEYS.PENALITES, list);
  };
  const [form, setForm] = useState({
    bc_id: "",
    date: new Date().toISOString().split("T")[0],
    type: "Partielle",
    quantite: "",
    observation: "",
    status: "En cours",
    advancement_pct: 0,
    date_prevue: "",
    reserved_amount: "",
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [receptionForm, setReceptionForm] = useState({
    execution_id: "",
    date: new Date().toISOString().split("T")[0],
    type: "Provisoire",
    quantite: "",
    pv_number: "",
    delivery_note_ref: "",
    observation: "",
    conformite: "Conforme",
  });
  const [showReceptionForm, setShowReceptionForm] = useState(false);

  const getBcLabel = (id) => {
    const bc = commandes.find((b) => String(b._id) === String(id));
    return bc ? bc.reference || "BC-" + bc._id : "-";
  };
  const getActiveBcs = () => getBcsForExecution(commandes);

  const submitExecution = () => {
    if (!form.bc_id || !form.date) return;
    const entry = {
      ...form,
      _id: editId || Date.now(),
      advancement_pct: Number(form.advancement_pct) || 0,
      reserved_amount: Number(form.reserved_amount) || 0,
      created_at: new Date().toISOString(),
    };

    if (editId) {
      saveExecutions(executions.map((e) => (e._id === editId ? entry : e)));
      logAudit(AUDIT_ACTIONS.UPDATE, "EXECUTION", editId, {
        advancement: entry.advancement_pct,
        status: entry.status,
      });
      setEditId(null);
    } else {
      saveExecutions([...executions, entry]);
      const bcs = commandes.map((bc) =>
        String(bc._id) === String(form.bc_id)
          ? { ...bc, statut: BC_STATUS.EN_COURS }
          : bc,
      );
      setCommandes(bcs);
      logAudit(AUDIT_ACTIONS.CREATE, "EXECUTION", entry._id, {
        bc_id: form.bc_id,
        advancement: entry.advancement_pct,
      });
    }
    setForm({
      bc_id: "",
      date: new Date().toISOString().split("T")[0],
      type: "Partielle",
      quantite: "",
      observation: "",
      status: "En cours",
      advancement_pct: 0,
      date_prevue: "",
      reserved_amount: "",
    });
    setShowForm(false);
  };

  const editExecution = (e) => {
    setForm(e);
    setEditId(e._id);
    setShowForm(true);
  };
  const deleteExecution = (_id) => {
    const ex = executions.find((e) => e._id === _id);
    if (ex?.service_fait) {
      alert("Impossible de supprimer une exécution avec service fait validé.");
      return;
    }
    saveExecutions(executions.filter((e) => e._id !== _id));
  };
  const updateExecutionStatus = (id, status) => {
    const execution = executions.find((e) => e._id === id);
    const oldStatus = execution?.status;

    saveExecutions(
      executions.map((e) =>
        e._id === id
          ? { ...e, status, updated_at: new Date().toISOString() }
          : e,
      ),
    );

    if (status === "Réception définitive" || status === "Clôturé") {
      markServiceFait(id);
    }

    // Log audit
    logAudit(AUDIT_ACTIONS.STATUS_CHANGE, "EXECUTION", id, {
      from: oldStatus,
      to: status,
    });

    // Update BC status if needed
    if (
      status === "Réception provisoire" ||
      status === "Réception définitive"
    ) {
      const bcList = getData(STORAGE_KEYS.COMMANDES, []);
      const updatedBcs = bcList.map((bc) => {
        if (String(bc._id) === String(execution?.bc_id)) {
          return { ...bc, statut: "En cours d'exécution" };
        }
        return bc;
      });
      setData(STORAGE_KEYS.COMMANDES, updatedBcs);
    }
  };

  const submitReception = () => {
    if (!receptionForm.execution_id || !receptionForm.date) {
      alert("Exécution et date de réception obligatoires.");
      return;
    }
    if (!receptionForm.pv_number?.trim()) {
      alert("Le numéro de PV est obligatoire.");
      return;
    }
    const entry = {
      ...receptionForm,
      _id: Date.now(),
      reception_type: receptionForm.type,
      quantite: Number(receptionForm.quantite) || 0,
      conformite: receptionForm.conformite || "Conforme",
      created_at: new Date().toISOString(),
    };
    saveReceptions([...receptions, entry]);

    if (receptionForm.type === "Définitive") {
      updateExecutionStatus(
        receptionForm.execution_id,
        "Réception définitive",
      );
      markServiceFait(receptionForm.execution_id);
    } else if (receptionForm.type === "Provisoire") {
      updateExecutionStatus(
        receptionForm.execution_id,
        "Réception provisoire",
      );
    }

    if (receptionForm.pv_number) {
      linkDocument("EXECUTION", receptionForm.execution_id, {
        fileName: receptionForm.pv_number,
        type: "PV de réception",
      });
    }

    // Log audit
    logAudit(AUDIT_ACTIONS.CREATE, "RECEPTION", entry._id, {
      execution_id: receptionForm.execution_id,
      type: receptionForm.type,
      pv_number: receptionForm.pv_number,
    });

    setReceptionForm({
      execution_id: "",
      date: new Date().toISOString().split("T")[0],
      type: "Provisoire",
      quantite: "",
      pv_number: "",
      delivery_note_ref: "",
      observation: "",
      conformite: "Conforme",
    });
    setShowReceptionForm(false);
  };

  const getReceptionsForExecution = (execId) =>
    receptions.filter((r) => String(r.execution_id) === String(execId));

  // Calculate advancement percentage for an execution
  const calculateAdvancement = (execId) => {
    const execution = executions.find((e) => String(e._id) === String(execId));
    if (!execution) return 0;

    const receptions = getReceptionsForExecution(execId);
    if (receptions.length === 0) return execution.advancement_pct || 0;

    // Calculate based on quantities received vs expected
    const totalReceived = receptions.reduce(
      (sum, r) => sum + (Number(r.quantite) || 0),
      0,
    );
    const expected = execution.quantite ? Number(execution.quantite) : 100;

    return expected > 0
      ? Math.min(100, Math.round((totalReceived / expected) * 100))
      : 0;
  };

  // Calculate penalty for delay
  const calculatePenalty = (execId) => {
    const execution = executions.find((e) => String(e._id) === String(execId));
    if (!execution || !execution.date_prevue) return 0;

    const today = new Date();
    const dueDate = new Date(execution.date_prevue);
    const delayDays = Math.max(
      0,
      Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)),
    );

    if (delayDays === 0) return 0;

    // Penalty rate: 0.5% per day of delay, max 10%
    const penaltyRate = Math.min(10, delayDays * 0.5);
    const bc = commandes.find(
      (b) => String(b._id) === String(execution.bc_id),
    );
    const bcAmount = bc?.total_ttc || 0;

    return (bcAmount * penaltyRate) / 100;
  };

  // Add a penalty
  const addPenalty = (execId, amount, reason) => {
    const penalty = {
      _id: Date.now(),
      execution_id: execId,
      amount: Number(amount),
      reason: reason || "Pénalité de retard",
      date: new Date().toISOString(),
      status: "Appliquée",
    };
    savePenalites([...penalites, penalty]);

    logAudit(AUDIT_ACTIONS.CREATE, "PENALITE", penalty._id, {
      execution_id: execId,
      amount: amount,
      reason: reason,
    });
  };

  const tabs = [
    { key: "executions", label: "Exécutions", count: executions.length },
    { key: "receptions", label: "Réceptions / PV", count: receptions.length },
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
      <Topbar title="Gestion de l'Exécution des Prestations" />
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
            gap: 4,
            marginBottom: 24,
            background: "#FEFCF9",
            border: "0.5px solid #E8E4DC",
            borderRadius: 10,
            padding: 4,
            width: "fit-content",
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

        {tab === "executions" && (
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
                  Suivi d'Exécution
                </div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                  Déclaration de service fait et réceptions
                </div>
              </div>
              <AddBtn
                onClick={() => setShowForm(true)}
                label="Nouvelle Exécution"
              />
            </div>
            {getActiveBcs().length === 0 && (
              <Warning message="Aucun bon de commande en exécution." />
            )}
            {showForm && (
              <FormCard
                title={editId ? "Modifier l'exécution" : "Nouvelle exécution"}
                onSave={submitExecution}
                onCancel={() => {
                  setShowForm(false);
                  setEditId(null);
                  setForm({
                    bc_id: "",
                    date: new Date().toISOString().split("T")[0],
                    type: "Partielle",
                    quantite: "",
                    observation: "",
                    status: "En cours",
                  });
                }}
                saveLabel={editId ? "Mettre à jour" : "Enregistrer"}
              >
                <div>
                  <label style={labelStyle}>Bon de Commande *</label>
                  <select
                    value={form.bc_id}
                    onChange={(e) =>
                      setForm({ ...form, bc_id: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {getActiveBcs().map((bc) => (
                      <option key={bc._id} value={String(bc._id)}>
                        {getBcLabel(bc._id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date Début *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    style={inputStyle}
                  >
                    <option>Partielle</option>
                    <option>Totale</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option>En cours</option>
                    <option>Planifié</option>
                    <option>Clôturé</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Observation</label>
                  <textarea
                    placeholder="Notes..."
                    value={form.observation}
                    onChange={(e) =>
                      setForm({ ...form, observation: e.target.value })
                    }
                    style={{ ...inputStyle, minHeight: 60 }}
                  />
                </div>
              </FormCard>
            )}
            {executions.length > 0 ? (
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
                        "Date Début",
                        "Type",
                        "Statut",
                        "Réceptions",
                        "Actions",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((e, i) => {
                      const recs = getReceptionsForExecution(e._id);
                      return (
                        <tr
                          key={e._id}
                          style={{
                            borderBottom:
                              i < executions.length - 1
                                ? "0.5px solid #F2EFE8"
                                : "none",
                          }}
                        >
                          <td
                            style={tdStyle({
                              fontWeight: 600,
                              color: "#1A1917",
                            })}
                          >
                            {getBcLabel(e.bc_id)}
                          </td>
                          <td style={tdStyle()}>
                            {new Date(e.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td style={tdStyle()}>{e.type}</td>
                          <td style={tdStyle()}>
                            <StatusBadge status={e.status} />
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
                              {recs.length} PV(s)
                            </span>
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
                                onClick={() => {
                                  setReceptionForm({
                                    ...receptionForm,
                                    execution_id: e._id,
                                  });
                                  setShowReceptionForm(true);
                                }}
                                style={{
                                  background: "#3C3489",
                                  color: "#F5F0E8",
                                  border: "none",
                                  borderRadius: 6,
                                  padding: "5px 12px",
                                  fontSize: 12,
                                  cursor: "pointer",
                                  fontFamily: "'DM Sans', sans-serif",
                                }}
                              >
                                + PV
                              </button>
                              <button
                                onClick={() => editExecution(e)}
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
                                onConfirm={() => deleteExecution(e._id)}
                                message="Supprimer cette exécution ?"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              !showForm && (
                <EmptyState message='Aucune exécution. Cliquez sur "Nouvelle Exécution" pour commencer.' />
              )
            )}
          </>
        )}

        {tab === "receptions" && (
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
                  Procès-Verbaux de Réception
                </div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                  PV de réception et bons de livraison
                </div>
              </div>
              <AddBtn
                onClick={() => setShowReceptionForm(true)}
                label="Nouveau PV"
              />
            </div>
            {showReceptionForm && (
              <FormCard
                title="Nouveau PV de réception"
                onSave={submitReception}
                onCancel={() => {
                  setShowReceptionForm(false);
                  setReceptionForm({
                    execution_id: "",
                    date: new Date().toISOString().split("T")[0],
                    quantite: "",
                    pv_number: "",
                    observation: "",
                  });
                }}
                saveLabel="Enregistrer"
              >
                <div>
                  <label style={labelStyle}>Exécution *</label>
                  <select
                    value={receptionForm.execution_id}
                    onChange={(e) =>
                      setReceptionForm({
                        ...receptionForm,
                        execution_id: e.target.value,
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {executions.map((e) => (
                      <option key={e._id} value={String(e._id)}>
                        {getBcLabel(e.bc_id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Type de réception *</label>
                  <select
                    value={receptionForm.type}
                    onChange={(e) =>
                      setReceptionForm({
                        ...receptionForm,
                        type: e.target.value,
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="Provisoire">Réception provisoire</option>
                    <option value="Définitive">Réception totale / définitive</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date Réception *</label>
                  <input
                    type="date"
                    value={receptionForm.date}
                    onChange={(e) =>
                      setReceptionForm({
                        ...receptionForm,
                        date: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>N° PV *</label>
                  <input
                    type="text"
                    placeholder="ex: PV-2026-001"
                    value={receptionForm.pv_number}
                    onChange={(e) =>
                      setReceptionForm({
                        ...receptionForm,
                        pv_number: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Quantité Reçue</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={receptionForm.quantite}
                    onChange={(e) =>
                      setReceptionForm({
                        ...receptionForm,
                        quantite: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Observation</label>
                  <textarea
                    placeholder="Réserves, observations..."
                    value={receptionForm.observation}
                    onChange={(e) =>
                      setReceptionForm({
                        ...receptionForm,
                        observation: e.target.value,
                      })
                    }
                    style={{ ...inputStyle, minHeight: 60 }}
                  />
                </div>
              </FormCard>
            )}
            {receptions.length > 0 ? (
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
                        "N° PV",
                        "BC",
                        "Date",
                        "Quantité",
                        "Observation",
                        "Actions",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {receptions.map((r, i) => {
                      const exec = executions.find(
                        (e) => String(e._id) === String(r.execution_id),
                      );
                      return (
                        <tr
                          key={r._id}
                          style={{
                            borderBottom:
                              i < receptions.length - 1
                                ? "0.5px solid #F2EFE8"
                                : "none",
                          }}
                        >
                          <td
                            style={tdStyle({
                              fontWeight: 600,
                              color: "#1A1917",
                            })}
                          >
                            {r.pv_number || "-"}
                          </td>
                          <td style={tdStyle()}>
                            {exec ? getBcLabel(exec.bc_id) : "-"}
                          </td>
                          <td style={tdStyle()}>
                            {new Date(r.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td style={tdStyle()}>{r.quantite || "-"}</td>
                          <td
                            style={{
                              ...tdStyle(),
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={r.observation}
                          >
                            {r.observation || "-"}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              !showReceptionForm && (
                <EmptyState message="Aucun PV de réception." />
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
