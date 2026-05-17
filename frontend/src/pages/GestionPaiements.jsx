import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import DeleteIconButton from "../components/DeleteIconButton";
import { logAudit, AUDIT_ACTIONS, STORAGE_KEYS, getData, setData } from "../services/dataStore";
import {
  PAYMENT_STATUS,
  PAYMENT_MODES,
  getNextPaymentReference,
  getOrdonnancesForPayment,
  getOpRemainingToPay,
  getOpNetAmount,
  getSupplierRib,
  validatePaymentPayload,
  syncOrdonnanceAfterPayment,
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
  const c = {
    "En attente": { bg: "#E8F0FA", color: "#185FA5" },
    Effectué: { bg: "#EAF4E2", color: "#3B6D11" },
    Partiel: { bg: "#FAEEDA", color: "#854F0B" },
    Annulé: { bg: "#F5F0E8", color: "#6B6760" },
    Rejeté: { bg: "#F5F0E8", color: "#6B6760" },
  };
  const s = c[status] || c["En attente"];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
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
const formatNumber = (v) => Number(v || 0).toLocaleString("fr-FR");

export default function GestionPaiements() {
  const [paiements, setPaiements] = useState(() => getData(STORAGE_KEYS.PAIEMENTS, []));
  const [fournisseurs] = useState(() => getData(STORAGE_KEYS.FOURNISSEURS, []));
  const [ordonnances] = useState(() => getData(STORAGE_KEYS.ORDONNANCES, []));
  const [rejets, setRejets] = useState(() => getData(STORAGE_KEYS.PAYMENT_REJECTIONS, []));

  const savePaiements = (list) => {
    setPaiements(list);
    setData(STORAGE_KEYS.PAIEMENTS, list);
  };

  const saveRejets = (list) => {
    setRejets(list);
    setData(STORAGE_KEYS.PAYMENT_REJECTIONS, list);
  };
  const [summary, setSummary] = useState({
    total: 0,
    enAttente: 0,
    effectue: 0,
    partiel: 0,
  });
  const [tab, setTab] = useState("payments");
  const emptyForm = () => ({
    reference: getNextPaymentReference(),
    op_id: "",
    fournisseur_id: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    mode: "Virement",
    bank: "",
    operation_number: "",
    rib: "",
    justificatif: "",
    status: PAYMENT_STATUS.EN_ATTENTE,
    observation: "",
    is_partial: false,
    parent_id: null,
    linked_documents: [],
  });
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showRejetForm, setShowRejetForm] = useState(false);
  const [rejetForm, setRejetForm] = useState({
    payment_id: "",
    reason: "",
    amount: "",
  });

  useEffect(() => {
    const total = paiements
      .filter(
        (p) =>
          p.status === PAYMENT_STATUS.EFFECTUE ||
          p.status === PAYMENT_STATUS.PARTIEL,
      )
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const enAttente = paiements.filter(
      (p) => p.status === PAYMENT_STATUS.EN_ATTENTE,
    ).length;
    const effectue = paiements.filter(
      (p) => p.status === PAYMENT_STATUS.EFFECTUE,
    ).length;
    const partiel = paiements.filter(
      (p) => p.status === PAYMENT_STATUS.PARTIEL,
    ).length;
    setSummary({ total, enAttente, effectue, partiel });
  }, [paiements]);

  const getSupplier = (id) => {
    const s = fournisseurs.find((x) => String(x._id) === String(id));
    return s ? s.company_name : "-";
  };
  const getOp = (id) => {
    const o = ordonnances.find((x) => String(x._id) === String(id));
    return o ? o.reference : "-";
  };

  const getAvailableAmount = (opId) => {
    const op = ordonnances.find((o) => String(o._id) === String(opId));
    if (!op) return 0;
    return getOpRemainingToPay(opId, op, paiements, editId);
  };

  const onOpSelect = (opId) => {
    const op = ordonnances.find((o) => String(o._id) === String(opId));
    if (!op) {
      setForm((f) => ({ ...f, op_id: opId }));
      return;
    }
    const supplier = fournisseurs.find(
      (s) => String(s._id) === String(op.fournisseur_id),
    );
    const remaining = getOpRemainingToPay(opId, op, paiements, editId);
    setForm((f) => ({
      ...f,
      op_id: opId,
      fournisseur_id: op.fournisseur_id || "",
      amount: remaining > 0 ? String(remaining) : f.amount,
      rib: getSupplierRib(supplier) || f.rib,
    }));
  };

  const submit = () => {
    let status = form.status;
    const amount = Number(form.amount);
    const op = ordonnances.find((o) => String(o._id) === String(form.op_id));
    const remaining = op
      ? getOpRemainingToPay(form.op_id, op, paiements, editId)
      : 0;

    if (
      status === PAYMENT_STATUS.EFFECTUE &&
      amount > 0 &&
      amount < remaining - 0.01
    ) {
      status = PAYMENT_STATUS.PARTIEL;
    }

    const validation = validatePaymentPayload({
      reference: form.reference,
      op_id: form.op_id,
      fournisseur_id: form.fournisseur_id,
      amount: form.amount,
      mode: form.mode,
      operation_number: form.operation_number,
      justificatif: form.justificatif,
      status,
      ordonnances,
      paiements,
      fournisseurs,
      excludePaymentId: editId,
    });
    if (!validation.valid) {
      alert(validation.errors.join("\n"));
      return;
    }

    const entry = {
      ...form,
      _id: editId || Date.now(),
      amount,
      status,
      is_partial: status === PAYMENT_STATUS.PARTIEL,
      created_at: new Date().toISOString(),
      payment_date:
        status === PAYMENT_STATUS.EFFECTUE ||
        status === PAYMENT_STATUS.PARTIEL
          ? form.date
          : null,
    };

    let nextList;
    if (editId) {
      nextList = paiements.map((p) => (p._id === editId ? entry : p));
      savePaiements(nextList);
      logAudit(AUDIT_ACTIONS.UPDATE, "PAIEMENT", editId, {
        reference: form.reference,
        amount,
      });
      setEditId(null);
    } else {
      nextList = [...paiements, entry];
      savePaiements(nextList);
      logAudit(AUDIT_ACTIONS.CREATE, "PAIEMENT", entry._id, {
        reference: form.reference,
        amount,
        op_id: form.op_id,
      });
    }

    if (
      status === PAYMENT_STATUS.EFFECTUE ||
      status === PAYMENT_STATUS.PARTIEL
    ) {
      syncOrdonnanceAfterPayment(form.op_id, nextList);
    }

    setForm(emptyForm());
    setShowForm(false);
  };

  // Add a rejection
  const addRejet = () => {
    if (!rejetForm.payment_id || !rejetForm.reason) return;

    const payment = paiements.find((p) => p._id === rejetForm.payment_id);
    if (!payment) return;

    const rejet = {
      _id: Date.now(),
      payment_id: rejetForm.payment_id,
      reason: rejetForm.reason,
      amount: Number(rejetForm.amount) || payment.amount,
      date: new Date().toISOString(),
      status: "Enregistré",
    };

    saveRejets([...rejets, rejet]);

    // Update payment status
    const updatedPaiements = paiements.map((p) =>
      p._id === rejetForm.payment_id
        ? {
            ...p,
            status: PAYMENT_STATUS.REJETE,
            observation: `Rejet: ${rejetForm.reason}`,
          }
        : p,
    );
    savePaiements(updatedPaiements);

    // Log audit
    logAudit(AUDIT_ACTIONS.STATUS_CHANGE, "PAIEMENT", rejetForm.payment_id, {
      from: payment.status,
      to: "Rejeté",
      reason: rejetForm.reason,
    });

    setRejetForm({ payment_id: "", reason: "", amount: "" });
    setShowRejetForm(false);
  };

  const tabs = [
    { key: "payments", label: "Paiements", count: paiements.length },
    { key: "rejets", label: "Rejets", count: rejets.length },
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
      <Topbar title="Gestion des Paiements" />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          background: "#F6F5F2",
        }}
      >
        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#A8A49C",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Total Payé
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#1A1917",
                marginTop: 8,
              }}
            >
              {formatNumber(summary.total)} MAD
            </div>
          </div>
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#A8A49C",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              En attente
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#185FA5",
                marginTop: 8,
              }}
            >
              {summary.enAttente}
            </div>
          </div>
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#A8A49C",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Effectués
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#3B6D11",
                marginTop: 8,
              }}
            >
              {summary.effectue}
            </div>
          </div>
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#A8A49C",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Partiels
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#854F0B",
                marginTop: 8,
              }}
            >
              {summary.partiel}
            </div>
          </div>
        </div>

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

        {/* TAB: PAIEMENTS */}
        {tab === "payments" && (
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
                  Paiements
                </div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                  Suivi des paiements effectués
                </div>
              </div>
              <AddBtn
                onClick={() => setShowForm(true)}
                label="Nouveau Paiement"
              />
            </div>
            {showForm && (
              <FormCard
                title={editId ? "Modifier" : "Nouveau paiement"}
                onSave={submit}
                onCancel={() => {
                  setShowForm(false);
                  setEditId(null);
                  setForm(emptyForm());
                }}
                saveLabel={editId ? "Mettre à jour" : "Enregistrer"}
              >
                <div>
                  <label style={labelStyle}>Référence *</label>
                  <input
                    type="text"
                    placeholder="ex: PAI-2026-001"
                    value={form.reference}
                    onChange={(e) =>
                      setForm({ ...form, reference: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Ordonnance *</label>
                  <select
                    value={form.op_id}
                    onChange={(e) => onOpSelect(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {getOrdonnancesForPayment(ordonnances).map((o) => (
                      <option key={o._id} value={String(o._id)}>
                        {o.reference} — reste{" "}
                        {formatNumber(
                          getOpRemainingToPay(o._id, o, paiements, editId),
                        )}{" "}
                        / {formatNumber(getOpNetAmount(o))} MAD
                      </option>
                    ))}
                  </select>
                  {form.op_id && (
                    <div
                      style={{ fontSize: 11, color: "#6B6760", marginTop: 4 }}
                    >
                      Montant disponible:{" "}
                      <strong style={{ color: "#3B6D11" }}>
                        {formatNumber(getAvailableAmount(form.op_id))} MAD
                      </strong>
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Fournisseur</label>
                  <input
                    type="text"
                    value={getSupplier(form.fournisseur_id)}
                    disabled
                    style={{ ...inputStyle, background: "#F2EFE8" }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Montant (MAD) *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Mode</label>
                  <select
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value })}
                    style={inputStyle}
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Banque</label>
                  <input
                    type="text"
                    placeholder="ex: BMCE"
                    value={form.bank}
                    onChange={(e) => setForm({ ...form, bank: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>N° Opération</label>
                  <input
                    type="text"
                    placeholder="ex: VIR-12345"
                    value={form.operation_number}
                    onChange={(e) =>
                      setForm({ ...form, operation_number: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>RIB</label>
                  <input
                    type="text"
                    placeholder="ex: 0011234567890123456789012"
                    value={form.rib}
                    onChange={(e) => setForm({ ...form, rib: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Justificatif *</label>
                  <input
                    type="text"
                    placeholder="Réf. ordre de paiement / bordereau"
                    value={form.justificatif}
                    onChange={(e) =>
                      setForm({ ...form, justificatif: e.target.value })
                    }
                    style={inputStyle}
                  />
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
                    <option value={PAYMENT_STATUS.EN_ATTENTE}>
                      En attente
                    </option>
                    <option value={PAYMENT_STATUS.EFFECTUE}>Effectué</option>
                    <option value={PAYMENT_STATUS.PARTIEL}>Partiel</option>
                    <option value={PAYMENT_STATUS.ANNULE}>Annulé</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Paiement partiel (auto)</label>
                  <select
                    value={form.is_partial ? "true" : "false"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        is_partial: e.target.value === "true",
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="false">Non</option>
                    <option value="true">Oui</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
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
            {paiements.length > 0 ? (
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
                        "Réf",
                        "OP",
                        "Fournisseur",
                        "Montant",
                        "Date",
                        "Mode",
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
                    {paiements.map((p, i) => (
                      <tr
                        key={p._id}
                        style={{
                          borderBottom:
                            i < paiements.length - 1
                              ? "0.5px solid #F2EFE8"
                              : "none",
                        }}
                      >
                        <td
                          style={tdStyle({ fontWeight: 600, color: "#1A1917" })}
                        >
                          {p.reference}
                        </td>
                        <td style={tdStyle()}>{getOp(p.op_id)}</td>
                        <td style={tdStyle()}>
                          {getSupplier(p.fournisseur_id)}
                        </td>
                        <td
                          style={tdStyle({ fontWeight: 500, color: "#1A1917" })}
                        >
                          {formatNumber(p.amount)} MAD
                        </td>
                        <td style={tdStyle()}>
                          {new Date(p.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td style={tdStyle()}>{p.mode}</td>
                        <td style={tdStyle()}>
                          <StatusBadge status={p.status} />
                        </td>
                        <td style={tdStyle()}>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              onClick={() => {
                                setForm(p);
                                setEditId(p._id);
                                setShowForm(true);
                              }}
                              style={{
                                background: "#F2EFE8",
                                border: "0.5px solid #DDD9D0",
                                borderRadius: 6,
                                padding: "5px 12px",
                                fontSize: 12,
                                color: "#1A1917",
                                cursor: "pointer",
                                fontFamily: "'DM Sans',sans-serif",
                              }}
                            >
                              Modifier
                            </button>
                            {p.status !== "Annulé" && p.status !== "Rejeté" && (
                              <button
                                onClick={() => {
                                  setRejetForm({
                                    ...rejetForm,
                                    payment_id: p._id,
                                  });
                                  setShowRejetForm(true);
                                }}
                                style={{
                                  background: "#FAEEDA",
                                  border: "0.5px solid #F5D99A",
                                  borderRadius: 6,
                                  padding: "5px 12px",
                                  fontSize: 12,
                                  color: "#854F0B",
                                  cursor: "pointer",
                                  fontFamily: "'DM Sans',sans-serif",
                                }}
                              >
                                Rejeter
                              </button>
                            )}
                            <DeleteIconButton
                              onConfirm={() =>
                                savePaiements(
                                  paiements.filter((x) => x._id !== p._id),
                                )
                              }
                              message="Supprimer ?"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !showForm && (
                <EmptyState message='Aucun paiement. Cliquez sur "Nouveau Paiement" pour commencer.' />
              )
            )}
          </>
        )}

        {/* TAB: REJETS */}
        {tab === "rejets" && (
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
                  Rejets de Paiement
                </div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                  Historique des rejets bancaires
                </div>
              </div>
            </div>
            {rejets.length > 0 ? (
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
                      {["Date", "Paiement", "Montant", "Motif", "Statut"].map(
                        (h) => (
                          <th key={h} style={thStyle}>
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rejets.map((r, i) => {
                      const payment = paiements.find(
                        (p) => p._id === r.payment_id,
                      );
                      return (
                        <tr
                          key={r._id}
                          style={{
                            borderBottom:
                              i < rejets.length - 1
                                ? "0.5px solid #F2EFE8"
                                : "none",
                          }}
                        >
                          <td style={tdStyle()}>
                            {new Date(r.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td style={tdStyle()}>
                            {payment ? payment.reference : "-"}
                          </td>
                          <td style={tdStyle({ fontWeight: 500 })}>
                            {formatNumber(r.amount)} MAD
                          </td>
                          <td style={tdStyle()}>{r.reason}</td>
                          <td style={tdStyle()}>
                            <span
                              style={{
                                background: "#F5F0E8",
                                color: "#6B6760",
                                padding: "2px 8px",
                                borderRadius: 20,
                                fontSize: 11.5,
                                fontWeight: 500,
                              }}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="Aucun rejet enregistré." />
            )}

            {showRejetForm && (
              <FormCard
                title="Enregistrer un rejet"
                onSave={addRejet}
                onCancel={() => {
                  setShowRejetForm(false);
                  setRejetForm({ payment_id: "", reason: "", amount: "" });
                }}
                saveLabel="Enregistrer"
              >
                <div>
                  <label style={labelStyle}>Motif du rejet *</label>
                  <select
                    value={rejetForm.reason}
                    onChange={(e) =>
                      setRejetForm({ ...rejetForm, reason: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="Provision insuffisante">
                      Provision insuffisante
                    </option>
                    <option value="Compte clôturé">Compte clôturé</option>
                    <option value="RIB invalide">RIB invalide</option>
                    <option value="Opposition">Opposition</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Montant rejeté</label>
                  <input
                    type="number"
                    placeholder="Laisser vide pour le montant total"
                    value={rejetForm.amount}
                    onChange={(e) =>
                      setRejetForm({ ...rejetForm, amount: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
              </FormCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
