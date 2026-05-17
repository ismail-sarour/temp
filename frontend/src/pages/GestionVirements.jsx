import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import DeleteIconButton from "../components/DeleteIconButton";
import { logAudit, AUDIT_ACTIONS } from "../services/dataStore";
import { apiFetch } from "../hooks/useApiData";
import {
  VIREMENT_STATUS,
  getNextVirementReference,
  getLineTransferableCredit,
  getAllocatedAmount,
  validateVirementPayload,
  validateVirementStatusChange,
  applyVirementToBudget,
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
    "En attente validation": { bg: "#FAEEDA", color: "#854F0B" },
    Validé: { bg: "#EAF4E2", color: "#3B6D11" },
    Appliqué: { bg: "#E8D5A3", color: "#8B6914" },
    Rejeté: { bg: "#F5F0E8", color: "#6B6760" },
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

export default function GestionVirements() {
  const [virements, setVirements] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [exercices, setExercices] = useState([]);
  const [libelles, setLibelles] = useState([]);

  useEffect(() => {
    Promise.all([
      apiFetch("/virements"),
      apiFetch("/budget-allocations"),
      apiFetch("/exercises"),
      apiFetch("/budget-types"),
    ])
      .then(([virementsData, allocationsData, exercicesData, libellesData]) => {
        setVirements(virementsData || []);
        setAllocations(allocationsData || []);
        setExercices(exercicesData || []);
        setLibelles(libellesData || []);
      })
      .catch((err) => console.error("Failed to load data:", err));
  }, []);

  const [summary, setSummary] = useState({
    total: 0,
    enAttente: 0,
    valides: 0,
    appliques: 0,
  });
  const [tab, setTab] = useState("virements");

  const emptyForm = () => ({
    reference: getNextVirementReference(),
    exercice_id: "",
    from_libelle: "",
    to_libelle: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    status: VIREMENT_STATUS.BROUILLON,
    justification: "",
    approval_level: "Chef de Division",
    validator_id: "",
  });

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const total = virements
      .filter((v) => v.status === VIREMENT_STATUS.APPLIQUE)
      .reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
    const enAttente = virements.filter(
      (v) => v.status === VIREMENT_STATUS.EN_ATTENTE,
    ).length;
    const valides = virements.filter(
      (v) => v.status === VIREMENT_STATUS.VALIDE,
    ).length;
    const appliques = virements.filter(
      (v) => v.status === VIREMENT_STATUS.APPLIQUE,
    ).length;
    setSummary({ total, enAttente, valides, appliques });
  }, [virements]);

  const getExercice = (id) => {
    const e = exercices.find((x) => String(x._id) === String(id));
    return e ? e.year : "-";
  };
  const getLibelle = (id) => {
    const l = libelles.find((x) => String(x._id) === String(id));
    return l ? l.name_fr : "-";
  };
  const getActiveExercices = () =>
    exercices.filter((e) => e.status === "Actif");
  const getActiveLibelles = () => libelles.filter((l) => l.status === "Actif");

  const getCurrentCredit = (exerciceId, libelleId) => {
    if (!exerciceId || !libelleId) return 0;
    return getLineTransferableCredit(exerciceId, libelleId);
  };

  const submit = async () => {
    const validation = validateVirementPayload({
      reference: form.reference,
      exercice_id: form.exercice_id,
      from_libelle: form.from_libelle,
      to_libelle: form.to_libelle,
      amount: form.amount,
      justification: form.justification,
      status: form.status,
      exercices,
      excludeVirementId: editId,
    });
    if (!validation.valid) {
      alert(validation.errors.join("\n"));
      return;
    }

    const amount = Number(form.amount);
    let entry = {
      ...form,
      source_allocation_id: form.from_libelle,
      target_allocation_id: form.to_libelle,
      amount,
      date: form.date,
      justification: form.justification,
      status: form.status,
    };

    if (form.status === VIREMENT_STATUS.APPLIQUE) {
      const result = applyVirementToBudget(entry);
      if (!result.success) {
        alert(result.error);
        return;
      }
      entry = {
        ...entry,
        status: VIREMENT_STATUS.APPLIQUE,
      };
    }

    try {
      let result;
      if (editId) {
        result = await apiFetch(`/virements/${editId}`, {
          method: "PUT",
          body: JSON.stringify(entry),
        });
        await logAudit(AUDIT_ACTIONS.UPDATE, "VIREMENT", editId, {
          reference: form.reference,
          amount,
        });
        setEditId(null);
      } else {
        result = await apiFetch("/virements", {
          method: "POST",
          body: JSON.stringify(entry),
        });
        await logAudit(AUDIT_ACTIONS.CREATE, "VIREMENT", result.id, {
          reference: form.reference,
          amount,
        });
      }

      const fresh = await apiFetch("/virements");
      setVirements(fresh || []);
      setData(STORAGE_KEYS.VIREMENTS, fresh || []);

      setForm(emptyForm());
      setShowForm(false);
    } catch (error) {
      console.error("Failed to save virement:", error);
      alert("Erreur lors de l'enregistrement du virement");
    }
  };

  const updateStatus = async (id, newStatus) => {
    const virement = virements.find((v) => v._id === id);
    if (!virement) return;

    const check = validateVirementStatusChange(virement, newStatus, virements);
    if (!check.success) {
      alert(check.error);
      return;
    }

    const oldStatus = virement.status;
    let updated = {
      ...virement,
      status: newStatus,
    };

    if (newStatus === VIREMENT_STATUS.APPLIQUE) {
      const result = applyVirementToBudget(updated);
      if (!result.success) {
        alert(result.error);
        return;
      }
      updated = {
        ...updated,
      };
    }

    try {
      await apiFetch(`/virements/${id}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });

      await logAudit(AUDIT_ACTIONS.STATUS_CHANGE, "VIREMENT", id, {
        from: oldStatus,
        to: newStatus,
        reference: virement.reference,
      });

      const fresh = await apiFetch("/virements");
      setVirements(fresh || []);
      setData(STORAGE_KEYS.VIREMENTS, fresh || []);
    } catch (error) {
      console.error("Failed to update virement status:", error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const tabs = [
    { key: "virements", label: "Virements", count: virements.length },
    {
      key: "enAttente",
      label: "En attente",
      count: virements.filter(
        (v) => v.status === VIREMENT_STATUS.EN_ATTENTE,
      ).length,
    },
    {
      key: "appliques",
      label: "Appliqués",
      count: virements.filter((v) => v.status === VIREMENT_STATUS.APPLIQUE)
        .length,
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
      <Topbar title="Gestion des Virements Budgétaires" />
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
              Total Virements
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
                color: "#854F0B",
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
              Validés
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
              {summary.valides}
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
              Appliqués
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "#8B6914",
                marginTop: 8,
              }}
            >
              {summary.appliques}
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

        {/* TAB: VIREMENTS */}
        {tab === "virements" && (
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
                  Virements Budgétaires
                </div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                  Transfert de crédits entre lignes budgétaires
                </div>
              </div>
              <AddBtn
                onClick={() => setShowForm(true)}
                label="Nouveau Virement"
              />
            </div>

            {getActiveExercices().length === 0 && (
              <Warning message="Aucun exercice actif. Veuillez créer un exercice d'abord." />
            )}
            {getActiveLibelles().length < 2 && (
              <Warning message="Au moins 2 lignes budgétaires actives sont nécessaires pour un virement." />
            )}

            {showForm && (
              <FormCard
                title={editId ? "Modifier" : "Nouveau virement"}
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
                    placeholder="ex: VIR-2026-001"
                    value={form.reference}
                    onChange={(e) =>
                      setForm({ ...form, reference: e.target.value })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Exercice *</label>
                  <select
                    value={form.exercice_id}
                    onChange={(e) =>
                      setForm({ ...form, exercice_id: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {getActiveExercices().map((ex) => (
                      <option key={ex._id} value={String(ex._id)}>
                        {ex.year} – {ex.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ligne Source (Débit) *</label>
                  <select
                    value={form.from_libelle}
                    onChange={(e) =>
                      setForm({ ...form, from_libelle: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {getActiveLibelles().map((lib) => (
                      <option key={lib._id} value={String(lib._id)}>
                        {lib.name_fr} -{" "}
                        {formatNumber(
                          getCurrentCredit(form.exercice_id, lib._id),
                        )}{" "}
                        MAD disp. — affecté{" "}
                        {formatNumber(
                          getAllocatedAmount(
                            form.exercice_id,
                            lib._id,
                            allocations,
                          ),
                        )}
                      </option>
                    ))}
                  </select>
                  {form.exercice_id && form.from_libelle && (
                    <div
                      style={{ fontSize: 11, color: "#6B6760", marginTop: 4 }}
                    >
                      Crédit disponible:{" "}
                      <strong style={{ color: "#3B6D11" }}>
                        {formatNumber(
                          getCurrentCredit(form.exercice_id, form.from_libelle),
                        )}{" "}
                        MAD
                      </strong>
                    </div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Ligne Destination (Crédit) *</label>
                  <select
                    value={form.to_libelle}
                    onChange={(e) =>
                      setForm({ ...form, to_libelle: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {getActiveLibelles()
                      .filter(
                        (lib) => String(lib._id) !== String(form.from_libelle),
                      )
                      .map((lib) => (
                        <option key={lib._id} value={String(lib._id)}>
                          {lib.name_fr}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Montant à Virer (MAD) *</label>
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
                  <label style={labelStyle}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Niveau d'Appro bation</label>
                  <select
                    value={form.approval_level}
                    onChange={(e) =>
                      setForm({ ...form, approval_level: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="Chef de Division">Chef de Division</option>
                    <option value="Ordonnateur">Ordonnateur</option>
                    <option value="Ministre">Ministre</option>
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
                    <option value="Brouillon">Brouillon</option>
                    <option value="En attente validation">
                      En attente validation
                    </option>
                    <option value="Validé">Validé</option>
                    <option value="Appliqué">Appliqué</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Justification *</label>
                  <textarea
                    placeholder="Motif du virement..."
                    value={form.justification}
                    onChange={(e) =>
                      setForm({ ...form, justification: e.target.value })
                    }
                    style={{ ...inputStyle, minHeight: 60 }}
                  />
                </div>
              </FormCard>
            )}

            {virements.length > 0 ? (
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
                        "Exercice",
                        "De",
                        "Vers",
                        "Montant",
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
                    {virements.map((v, i) => (
                      <tr
                        key={v._id}
                        style={{
                          borderBottom:
                            i < virements.length - 1
                              ? "0.5px solid #F2EFE8"
                              : "none",
                        }}
                      >
                        <td
                          style={tdStyle({ fontWeight: 600, color: "#1A1917" })}
                        >
                          {v.reference}
                        </td>
                        <td style={tdStyle()}>{getExercice(v.exercice_id)}</td>
                        <td style={tdStyle()}>{getLibelle(v.from_libelle)}</td>
                        <td style={tdStyle()}>{getLibelle(v.to_libelle)}</td>
                        <td
                          style={tdStyle({ fontWeight: 500, color: "#1A1917" })}
                        >
                          {formatNumber(v.amount)} MAD
                        </td>
                        <td style={tdStyle()}>
                          {new Date(v.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td style={tdStyle()}>
                          <StatusBadge status={v.status} />
                        </td>
                        <td style={tdStyle()}>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {v.status === VIREMENT_STATUS.BROUILLON && (
                              <button
                                onClick={() =>
                                  updateStatus(
                                    v._id,
                                    VIREMENT_STATUS.EN_ATTENTE,
                                  )
                                }
                                style={{
                                  background: "#E8F0FA",
                                  border: "none",
                                  borderRadius: 4,
                                  padding: "4px 8px",
                                  fontSize: 11,
                                  color: "#185FA5",
                                  cursor: "pointer",
                                  fontFamily: "'DM Sans', sans-serif",
                                }}
                              >
                                Soumettre
                              </button>
                            )}
                            {v.status === VIREMENT_STATUS.EN_ATTENTE && (
                              <>
                                <button
                                  onClick={() =>
                                    updateStatus(v._id, VIREMENT_STATUS.VALIDE)
                                  }
                                  style={{
                                    background: "#EAF4E2",
                                    border: "none",
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                    fontSize: 11,
                                    color: "#3B6D11",
                                    cursor: "pointer",
                                    fontFamily: "'DM Sans', sans-serif",
                                  }}
                                >
                                  Valider
                                </button>
                                <button
                                  onClick={() =>
                                    updateStatus(v._id, VIREMENT_STATUS.REJETE)
                                  }
                                  style={{
                                    background: "#F5F0E8",
                                    border: "none",
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                    fontSize: 11,
                                    color: "#6B6760",
                                    cursor: "pointer",
                                    fontFamily: "'DM Sans', sans-serif",
                                  }}
                                >
                                  Rejeter
                                </button>
                              </>
                            )}
                            {v.status === VIREMENT_STATUS.VALIDE && (
                              <button
                                onClick={() =>
                                  updateStatus(v._id, VIREMENT_STATUS.APPLIQUE)
                                }
                                style={{
                                  background: "#E8D5A3",
                                  border: "none",
                                  borderRadius: 4,
                                  padding: "4px 8px",
                                  fontSize: 11,
                                  color: "#8B6914",
                                  cursor: "pointer",
                                  fontFamily: "'DM Sans', sans-serif",
                                }}
                              >
                                Appliquer
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setForm(v);
                                setEditId(v._id);
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
                              onConfirm={async () => {
                                if (v.status === VIREMENT_STATUS.APPLIQUE) {
                                  alert(
                                    "Un virement appliqué ne peut pas être supprimé.",
                                  );
                                  return;
                                }
                                try {
                                  await apiFetch(`/virements/${v._id}`, {
                                    method: "DELETE",
                                  });
                                  const fresh = await apiFetch("/virements");
                                  setVirements(fresh || []);
                                  setData(STORAGE_KEYS.VIREMENTS, fresh || []);
                                } catch (error) {
                                  console.error("Failed to delete virement:", error);
                                  alert("Erreur lors de la suppression du virement");
                                }
                              }}
                              message="Supprimer ce virement ?"
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
                <EmptyState message='Aucun virement. Cliquez sur "Nouveau Virement" pour commencer.' />
              )
            )}
          </>
        )}

        {/* TAB: EN ATTENTE */}
        {tab === "enAttente" && (
          <>
            <div
              style={{
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1A1917",
                }}
              >
                Virements en Attente de Validation
              </div>
              <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                Virements soumis nécessitant une approbation
              </div>
            </div>

            {virements.filter((v) => v.status === VIREMENT_STATUS.EN_ATTENTE)
              .length > 0 ? (
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
                        "De",
                        "Vers",
                        "Montant",
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
                    {virements
                      .filter((v) => v.status === VIREMENT_STATUS.EN_ATTENTE)
                      .map((v, i) => (
                        <tr
                          key={v._id}
                          style={{
                            borderBottom:
                              i < virements.length - 1
                                ? "0.5px solid #F2EFE8"
                                : "none",
                          }}
                        >
                          <td style={tdStyle({ fontWeight: 600 })}>
                            {v.reference}
                          </td>
                          <td style={tdStyle()}>
                            {getLibelle(v.from_libelle)}
                          </td>
                          <td style={tdStyle()}>{getLibelle(v.to_libelle)}</td>
                          <td style={tdStyle({ fontWeight: 500 })}>
                            {formatNumber(v.amount)} MAD
                          </td>
                          <td
                            style={{
                              ...tdStyle(),
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {v.justification}
                          </td>
                          <td style={tdStyle()}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() =>
                                  updateStatus(v._id, VIREMENT_STATUS.VALIDE)
                                }
                                style={{
                                  background: "#EAF4E2",
                                  border: "none",
                                  borderRadius: 4,
                                  padding: "4px 8px",
                                  fontSize: 11,
                                  color: "#3B6D11",
                                  cursor: "pointer",
                                  fontFamily: "'DM Sans', sans-serif",
                                }}
                              >
                                Valider
                              </button>
                              <button
                                onClick={() => updateStatus(v._id, "Rejeté")}
                                style={{
                                  background: "#F5F0E8",
                                  border: "none",
                                  borderRadius: 4,
                                  padding: "4px 8px",
                                  fontSize: 11,
                                  color: "#6B6760",
                                  cursor: "pointer",
                                  fontFamily: "'DM Sans', sans-serif",
                                }}
                              >
                                Rejeter
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="Aucun virement en attente." />
            )}
          </>
        )}

        {/* TAB: APPLIQUES */}
        {tab === "appliques" && (
          <>
            <div
              style={{
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1A1917",
                }}
              >
                Virements Appliqués
              </div>
              <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                Historique des virements ayant impacté le budget
              </div>
            </div>

            {virements.filter((v) => v.status === VIREMENT_STATUS.APPLIQUE)
              .length > 0 ? (
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
                        "Exercice",
                        "De",
                        "Vers",
                        "Montant",
                        "Date",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {virements
                      .filter((v) => v.status === VIREMENT_STATUS.APPLIQUE)
                      .map((v, i) => (
                        <tr
                          key={v._id}
                          style={{
                            borderBottom:
                              i < virements.length - 1
                                ? "0.5px solid #F2EFE8"
                                : "none",
                          }}
                        >
                          <td style={tdStyle({ fontWeight: 600 })}>
                            {v.reference}
                          </td>
                          <td style={tdStyle()}>
                            {getExercice(v.exercice_id)}
                          </td>
                          <td style={tdStyle()}>
                            {getLibelle(v.from_libelle)}
                          </td>
                          <td style={tdStyle()}>{getLibelle(v.to_libelle)}</td>
                          <td style={tdStyle({ fontWeight: 500 })}>
                            {formatNumber(v.amount)} MAD
                          </td>
                          <td style={tdStyle()}>
                            {new Date(v.date).toLocaleDateString("fr-FR")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="Aucun virement appliqué." />
            )}
          </>
        )}
      </div>
    </div>
  );
}
