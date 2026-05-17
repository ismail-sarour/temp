import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import DeleteIconButton from "../components/DeleteIconButton";
import {
  logAudit,
  AUDIT_ACTIONS,
  STORAGE_KEYS,
  getData,
  setData,
  calculateNetAmount,
  getFiscalRates,
} from "../services/dataStore";
import {
  validateOrdonnancePayload,
  getNextOpReference,
  getBcsForOrdonnance,
  hasServiceFaitForBc,
  OP_STATUS,
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
    Brouillon: { bg: "#E8F0FA", color: "#185FA5" },
    Validée: { bg: "#EAF4E2", color: "#3B6D11" },
    Transmise: { bg: "#E8D5A3", color: "#8B6914" },
    Payée: { bg: "#F5F0E8", color: "#6B6760" },
  };
  const s = c[status] || c["Brouillon"];
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

export default function GestionOrdonnancement() {
  const [ordonnances, setOrdonnances] = useState(() => getData(STORAGE_KEYS.ORDONNANCES, []));
  const [commandes] = useState(() => getData(STORAGE_KEYS.COMMANDES, []));
  const [suppliers] = useState(() => getData(STORAGE_KEYS.FOURNISSEURS, []));

  const saveOrdonnances = (list) => {
    setOrdonnances(list);
    setData(STORAGE_KEYS.ORDONNANCES, list);
  };
  const [fiscalRates, setFiscalRates] = useState({
    vatRates: [],
    rasRates: [],
  });
  const [form, setForm] = useState({
    reference: getNextOpReference(),
    fournisseur_id: "",
    bc_id: "",
    execution_id: "",
    amount_ht: "",
    tva_rate: 20,
    tva: "",
    ras_rate: 0,
    ras: "",
    other_retenues: "",
    invoice_ref: "",
    date: new Date().toISOString().split("T")[0],
    status: OP_STATUS.BROUILLON,
    observation: "",
    linked_documents: [],
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setFiscalRates(getFiscalRates());
  }, []);

  // Calculate net amount when form values change
  useEffect(() => {
    if (form.amount_ht) {
      const ht = Number(form.amount_ht);
      const tvaRate = Number(form.tva_rate);
      const rasRate = Number(form.ras_rate);
      const otherRetenues = Number(form.other_retenues) || 0;

      const calculation = calculateNetAmount(ht, {
        tvaRate,
        rasRate,
        otherRetenues,
      });

      setForm((prev) => ({
        ...prev,
        tva_amount: calculation.tvaAmount,
        ras_amount: calculation.rasAmount,
        amount_ttc: calculation.amountTTC,
        net_amount: calculation.netAmount,
      }));
    }
  }, [form.amount_ht, form.tva_rate, form.ras_rate, form.other_retenues]);

  const getSupplier = (id) => {
    const s = suppliers.find((x) => String(x._id) === String(id));
    return s ? s.company_name : "-";
  };
  const getBc = (id) => {
    const b = commandes.find((x) => String(x._id) === String(id));
    return b ? b.reference || "BC-" + b._id : "-";
  };

  const onBcSelectForOp = (bcId) => {
    const bc = commandes.find((b) => String(b._id) === String(bcId));
    if (!bc) {
      setForm((f) => ({ ...f, bc_id: bcId }));
      return;
    }
    if (!hasServiceFaitForBc(bcId)) {
      alert(
        "Ce BC n'a pas de service fait validé. Enregistrez une réception définitive dans Exécution.",
      );
    }
    setForm((f) => ({
      ...f,
      bc_id: bcId,
      fournisseur_id: bc.awarded_supplier_id || f.fournisseur_id,
      amount_ht: bc.attributed_amount_ht || f.amount_ht,
    }));
  };

  // Get total amount already paid for a BC
  const getPaidAmount = (bcId) => {
    const payments = getData(STORAGE_KEYS.PAIEMENTS, []);
    return payments
      .filter((p) => String(p.bc_id) === String(bcId) && p.status !== "Annulé")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  };

  // Get total amount of ordonnances for a BC
  const getOrdonnancedAmount = (bcId) => {
    return ordonnances
      .filter((o) => String(o.bc_id) === String(bcId) && o.status !== "Annulée")
      .reduce((sum, o) => sum + (Number(o.net_amount) || 0), 0);
  };

  const submit = () => {
    const validation = validateOrdonnancePayload({
      reference: form.reference,
      fournisseur_id: form.fournisseur_id,
      bc_id: form.bc_id,
      amount_ht: form.amount_ht,
      invoice_ref: form.invoice_ref,
      status: form.status,
    });
    if (!validation.valid) {
      alert(validation.errors.join("\n"));
      return;
    }

    const ht = Number(form.amount_ht);
    const tvaRate = Number(form.tva_rate);
    const rasRate = Number(form.ras_rate);
    const otherRetenues = Number(form.other_retenues) || 0;

    const calculation = calculateNetAmount(ht, {
      tvaRate,
      rasRate,
      otherRetenues,
    });

    const entry = {
      ...form,
      _id: editId || Date.now(),
      amount_ht: ht,
      tva_rate: tvaRate,
      tva_amount: calculation.tvaAmount,
      ras_rate: rasRate,
      ras_amount: calculation.rasAmount,
      other_retenues: otherRetenues,
      amount_ttc: calculation.amountTTC,
      net_amount: calculation.netAmount,
      created_at: new Date().toISOString(),
    };

    if (editId) {
      saveOrdonnances(ordonnances.map((o) => (o._id === editId ? entry : o)));
      logAudit(AUDIT_ACTIONS.UPDATE, "ORDONNANCE", editId, {
        reference: form.reference,
        net_amount: calculation.netAmount,
      });
      setEditId(null);
    } else {
      saveOrdonnances([...ordonnances, entry]);
      logAudit(AUDIT_ACTIONS.CREATE, "ORDONNANCE", entry._id, {
        reference: form.reference,
        net_amount: calculation.netAmount,
        bc_id: form.bc_id,
      });
    }

    setForm({
      reference: getNextOpReference(),
      fournisseur_id: "",
      bc_id: "",
      execution_id: "",
      amount_ht: "",
      tva_rate: 20,
      tva: "",
      ras_rate: 0,
      ras: "",
      other_retenues: "",
      invoice_ref: "",
      date: new Date().toISOString().split("T")[0],
      status: OP_STATUS.BROUILLON,
      observation: "",
      linked_documents: [],
    });
    setShowForm(false);
  };

  const updateStatus = (id, newStatus) => {
    const ordonnance = ordonnances.find((o) => o._id === id);
    if (!ordonnance) return;

    const oldStatus = ordonnance.status;
    const updatedOrdonnances = ordonnances.map((o) =>
      o._id === id
        ? { ...o, status: newStatus, updated_at: new Date().toISOString() }
        : o,
    );
    const validation = validateOrdonnancePayload({
      reference: ordonnance.reference,
      fournisseur_id: ordonnance.fournisseur_id,
      bc_id: ordonnance.bc_id,
      amount_ht: ordonnance.amount_ht,
      invoice_ref: ordonnance.invoice_ref,
      status: newStatus,
    });
    if (
      !validation.valid &&
      newStatus !== OP_STATUS.BROUILLON &&
      newStatus !== OP_STATUS.ANNULEE
    ) {
      alert(validation.errors.join("\n"));
      return;
    }

    saveOrdonnances(updatedOrdonnances);

    logAudit(AUDIT_ACTIONS.STATUS_CHANGE, "ORDONNANCE", id, {
      from: oldStatus,
      to: newStatus,
      reference: ordonnance.reference,
    });

    if (newStatus === OP_STATUS.PAYEE) {
      const bcList = getData(STORAGE_KEYS.COMMANDES, []);
      const updatedBcs = bcList.map((bc) => {
        if (String(bc._id) === String(ordonnance.bc_id)) {
          return { ...bc, statut: "Terminé", payment_status: "Payé" };
        }
        return bc;
      });
      setData(STORAGE_KEYS.COMMANDES, updatedBcs);
    }
  };

  const tabs = [
    { key: "all", label: "Toutes", count: ordonnances.length },
    {
      key: "Brouillon",
      label: "Brouillons",
      count: ordonnances.filter((o) => o.status === "Brouillon").length,
    },
    {
      key: "Validée",
      label: "Validées",
      count: ordonnances.filter((o) => o.status === "Validée").length,
    },
    {
      key: "Payée",
      label: "Payées",
      count: ordonnances.filter((o) => o.status === "Payée").length,
    },
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
      <Topbar title="Gestion des Ordonnances de Paiement" />
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
              Ordonnances de Paiement
            </div>
            <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
              Émission des ordonnances après service fait
            </div>
          </div>
          <AddBtn onClick={() => setShowForm(true)} label="Nouvelle OP" />
        </div>
        {suppliers.length === 0 && (
          <Warning message="Aucun fournisseur. Veuillez en créer d'abord." />
        )}
        {showForm && (
          <FormCard
            title={editId ? "Modifier l'OP" : "Nouvelle ordonnance"}
            onSave={submit}
            onCancel={() => {
              setShowForm(false);
              setEditId(null);
              setForm({
                reference: "",
                fournisseur_id: "",
                bc_id: "",
                amount_ht: "",
                tva: "",
                ras: "",
                date: new Date().toISOString().split("T")[0],
                status: "Brouillon",
                observation: "",
              });
            }}
            saveLabel={editId ? "Mettre à jour" : "Enregistrer"}
          >
            <div>
              <label style={labelStyle}>Référence *</label>
              <input
                type="text"
                placeholder="ex: OP-2026-001"
                value={form.reference}
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Fournisseur *</label>
              <select
                value={form.fournisseur_id}
                onChange={(e) =>
                  setForm({ ...form, fournisseur_id: e.target.value })
                }
                style={inputStyle}
              >
                <option value="">-- Sélectionner --</option>
                {suppliers
                  .filter((s) => s.status === "Actif")
                  .map((s) => (
                    <option key={s._id} value={String(s._id)}>
                      {s.company_name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Bon de Commande</label>
              <select
                value={form.bc_id}
                onChange={(e) => onBcSelectForOp(e.target.value)}
                style={inputStyle}
              >
                <option value="">-- Aucun --</option>
                {getBcsForOrdonnance(commandes).map((bc) => (
                  <option key={bc._id} value={String(bc._id)}>
                    {bc.reference || "BC-" + bc._id}
                    {bc.service_fait || hasServiceFaitForBc(bc._id)
                      ? " ✓ service fait"
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Réf. facture *</label>
              <input
                type="text"
                placeholder="ex: FAC-2026-042"
                value={form.invoice_ref}
                onChange={(e) =>
                  setForm({ ...form, invoice_ref: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Montant HT (MAD) *</label>
              <input
                type="number"
                placeholder="0"
                value={form.amount_ht}
                onChange={(e) =>
                  setForm({ ...form, amount_ht: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>TVA (MAD)</label>
              <input
                type="number"
                placeholder="0"
                value={form.tva}
                onChange={(e) => setForm({ ...form, tva: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>RAS (MAD)</label>
              <input
                type="number"
                placeholder="0"
                value={form.ras}
                onChange={(e) => setForm({ ...form, ras: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={inputStyle}
              >
                <option>Brouillon</option>
                <option>Validée</option>
                <option>Transmise</option>
                <option>Payée</option>
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
        {ordonnances.length > 0 ? (
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
                    "Fournisseur",
                    "BC",
                    "HT",
                    "TTC",
                    "Net",
                    "Date",
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
                {ordonnances.map((o, i) => (
                  <tr
                    key={o._id}
                    style={{
                      borderBottom:
                        i < ordonnances.length - 1
                          ? "0.5px solid #F2EFE8"
                          : "none",
                    }}
                  >
                    <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>
                      {o.reference}
                    </td>
                    <td style={tdStyle()}>{getSupplier(o.fournisseur_id)}</td>
                    <td style={tdStyle()}>{getBc(o.bc_id)}</td>
                    <td style={tdStyle({ fontWeight: 500 })}>
                      {formatNumber(o.amount_ht)}
                    </td>
                    <td style={tdStyle({ fontWeight: 500 })}>
                      {formatNumber(o.amount_ttc)}
                    </td>
                    <td style={tdStyle({ fontWeight: 500, color: "#1A1917" })}>
                      {formatNumber(o.net)}
                    </td>
                    <td style={tdStyle()}>
                      {new Date(o.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td style={tdStyle()}>
                      <StatusBadge status={o.status} />
                    </td>
                    <td style={tdStyle()}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => {
                            setForm(o);
                            setEditId(o._id);
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
                        <DeleteIconButton
                          onConfirm={() =>
                            save(ordonnances.filter((x) => x._id !== o._id))
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
            <EmptyState message='Aucune ordonnance. Cliquez sur "Nouvelle OP" pour commencer.' />
          )
        )}
      </div>
    </div>
  );
}
