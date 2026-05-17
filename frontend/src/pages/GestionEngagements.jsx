import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import StatusActiveToggle from "../components/StatusActiveToggle";
import DeleteIconButton from "../components/DeleteIconButton";
import {
  logAudit,
  AUDIT_ACTIONS,
  STORAGE_KEYS,
  checkCreditAvailability,
  calculateAvailableCredit,
  getData,
  setData,
} from "../services/dataStore";
import {
  validateEngagementStatus,
  ENGAGEMENT_STATUS,
  getBcById,
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
    Brouillon: { bg: "#E8F0FA", color: "#185FA5" },
    Validé: { bg: "#EAF4E2", color: "#3B6D11" },
    Engagé: { bg: "#E8D5A3", color: "#8B6914" },
    Clôturé: { bg: "#F5F0E8", color: "#6B6760" },
    Annulé: { bg: "#F5F0E8", color: "#6B6760" },
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
export default function GestionEngagements() {
  const [tab, setTab] = useState("engagements");

  // STATE
  const [engagements, setEngagements] = useState(() => getData(STORAGE_KEYS.ENGAGEMENTS, []));
  const [commandes] = useState(() => getData(STORAGE_KEYS.COMMANDES, []));

  const saveEngagements = (list) => {
    setEngagements(list);
    setData(STORAGE_KEYS.ENGAGEMENTS, list);
  };
  const [creditInfo, setCreditInfo] = useState(null);
  const [form, setForm] = useState({
    reference: "",
    exercice_id: "",
    libelle_id: "",
    bc_id: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    status: "Brouillon",
    observation: "",
    is_partial: false,
    parent_id: null,
    linked_documents: [],
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (form.exercice_id && form.libelle_id) {
      const credit = calculateAvailableCredit(
        form.exercice_id,
        form.libelle_id,
        { excludeEngagementId: editId },
      );
      setCreditInfo(credit);
    } else {
      setCreditInfo(null);
    }
  }, [form.exercice_id, form.libelle_id, editId]);

  const [exercices] = useState(() => getData(STORAGE_KEYS.EXERCICES, []));
  const [libelles] = useState(() => getData(STORAGE_KEYS.LIBELLES, []));
  const [allocations] = useState(() => getData(STORAGE_KEYS.BUDGET_ALLOCATIONS, []));

  const getExerciceLabel = (id) => {
    const ex = exercices.find((e) => String(e._id) === String(id));
    return ex ? `${ex.year}` : "-";
  };

  const getLibelleLabel = (id) => {
    const lib = libelles.find((l) => String(l._id) === String(id));
    return lib ? lib.name_fr : "-";
  };

  const getBcLabel = (id) => {
    if (!id) return "-";
    const bc = commandes.find((b) => String(b._id) === String(id)) || getBcById(id);
    return bc ? bc.reference || "BC-" + bc._id : "-";
  };

  const onBcSelect = (bcId) => {
    const bc = getBcById(bcId);
    if (!bc) {
      setForm((f) => ({ ...f, bc_id: bcId }));
      return;
    }
    setForm((f) => ({
      ...f,
      bc_id: bcId,
      exercice_id: bc.exercice_id || f.exercice_id,
      libelle_id: bc.budget_label_id || f.libelle_id,
      amount: bc.attributed_amount_ht || f.amount,
    }));
  };

  const getActiveExercices = () =>
    exercices.filter((e) => e.status === "Actif");
  const getActiveLibelles = () => libelles.filter((l) => l.status === "Actif");

  // Get available credit for a libelle (legacy - now uses dataStore)
  const getAvailableCredit = (exerciceId, libelleId) => {
    const credit = checkCreditAvailability(exerciceId, libelleId, 0);
    return credit.remaining;
  };

  // Get detailed credit breakdown
  const getCreditBreakdown = (exerciceId, libelleId) => {
    return calculateAvailableCredit(exerciceId, libelleId);
  };

  // ═════════════════════════════════════════════════════════════════
  // CRUD
  // ═════════════════════════════════════════════════════════════════
  const submitEngagement = () => {
    if (
      !form.reference ||
      !form.exercice_id ||
      !form.libelle_id ||
      !form.amount
    )
      return;

    const amount = Number(form.amount);
    const creditCheck = checkCreditAvailability(
      form.exercice_id,
      form.libelle_id,
      amount,
      { excludeEngagementId: editId },
    );

    // Show warning if approaching credit limit
    const warningThreshold = 0.9;
    if (
      creditCheck.details.available > 0 &&
      amount / creditCheck.details.available > warningThreshold &&
      form.status === "Validé"
    ) {
      if (
        !confirm(
          `Attention: Cet engagement utilise ${warningThreshold * 100}% du crédit restant. Continuer?`,
        )
      ) {
        return;
      }
    }

    if (
      !creditCheck.available &&
      (form.status === ENGAGEMENT_STATUS.VALIDE ||
        form.status === ENGAGEMENT_STATUS.SOUMIS)
    ) {
      alert(
        `Crédit insuffisant! Montant: ${formatNumber(amount)} MAD, Disponible: ${formatNumber(creditCheck.remaining)} MAD.`,
      );
      return;
    }

    if (form.status === ENGAGEMENT_STATUS.CLOTURE && !editId) {
      alert("Un nouvel engagement ne peut pas être créé directement en clôturé.");
      return;
    }

    const entry = {
      ...form,
      _id: editId || Date.now(),
      amount: amount,
      created_by: "Admin",
      credit_check: creditCheck,
      created_at: new Date().toISOString(),
    };

    // Log audit
    if (editId) {
      saveEngagements(engagements.map((e) => (e._id === editId ? entry : e)));
      logAudit(AUDIT_ACTIONS.UPDATE, "ENGAGEMENT", editId, {
        reference: form.reference,
        amount: amount,
      });
      setEditId(null);
    } else {
      saveEngagements([...engagements, entry]);
      logAudit(AUDIT_ACTIONS.CREATE, "ENGAGEMENT", entry._id, {
        reference: form.reference,
        amount: amount,
        status: form.status,
        exercice: form.exercice_id,
        libelle: form.libelle_id,
      });
    }

    setForm({
      reference: "",
      exercice_id: "",
      libelle_id: "",
      bc_id: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      status: "Brouillon",
      observation: "",
      is_partial: false,
      parent_id: null,
      linked_documents: [],
    });
    setShowForm(false);
  };

  const editEngagement = (e) => {
    setForm(e);
    setEditId(e._id);
    setShowForm(true);
  };

  const deleteEngagement = (_id) => {
    const engagement = engagements.find((e) => e._id === _id);
    if (
      engagement?.status === ENGAGEMENT_STATUS.VALIDE ||
      engagement?.status === ENGAGEMENT_STATUS.CLOTURE
    ) {
      alert("Un engagement validé ou clôturé ne peut pas être supprimé.");
      return;
    }
    saveEngagements(engagements.filter((e) => e._id !== _id));
  };

  const updateStatus = (id, newStatus) => {
    const engagement = engagements.find((e) => e._id === id);
    if (!engagement) return;

    const oldStatus = engagement.status;

    const validation = validateEngagementStatus(id, newStatus, engagements);
    if (!validation.success) {
      alert(validation.error);
      return;
    }

    const updatedEngagements = engagements.map((e) =>
      e._id === id
        ? {
            ...e,
            status: newStatus,
            validated_at:
              newStatus === ENGAGEMENT_STATUS.VALIDE
                ? new Date().toISOString()
                : e.validated_at,
            updated_at: new Date().toISOString(),
          }
        : e,
    );
    saveEngagements(updatedEngagements);

    // Log audit
    logAudit(AUDIT_ACTIONS.STATUS_CHANGE, "ENGAGEMENT", id, {
      from: oldStatus,
      to: newStatus,
      reference: engagement.reference,
      amount: engagement.amount,
    });

    // If status changed to Annulé, notify that credit is freed
    if (newStatus === ENGAGEMENT_STATUS.ANNULE) {
      alert(
        `Engagement annulé. Le crédit de ${formatNumber(engagement.amount)} MAD a été libéré.`,
      );
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // SUMMARY STATS
  // ═════════════════════════════════════════════════════════════════
  const getSummary = () => {
    const totalEngaged = engagements
      .filter(
        (e) =>
          e.status === ENGAGEMENT_STATUS.VALIDE ||
          e.status === ENGAGEMENT_STATUS.SOUMIS,
      )
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const validated = engagements.filter(
      (e) => e.status === ENGAGEMENT_STATUS.VALIDE,
    ).length;
    const brouillons = engagements.filter(
      (e) => e.status === "Brouillon",
    ).length;

    return { totalEngaged, validated, brouillons };
  };

  const summary = getSummary();

  // TABS
  const tabs = [
    { key: "engagements", label: "Engagements", count: engagements.length },
    { key: "suivi", label: "Suivi par Ligne", count: allocations.length },
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
      <Topbar title="Gestion des Engagements Budgétaires" />

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
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
              Total Engagé
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
              {formatNumber(summary.totalEngaged)} MAD
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
              Validés / Engagés
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
              {summary.validated}
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
              Brouillons
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
              {summary.brouillons}
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
            TAB: ENGAGEMENTS
        ════════════════════════════════════════════════════════════════ */}
        {tab === "engagements" && (
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
                  Engagements Budgétaires
                </div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                  Réservation des crédits avant exécution
                </div>
              </div>
              <AddBtn
                onClick={() => setShowForm(true)}
                label="Nouvel Engagement"
              />
            </div>

            {getActiveExercices().length === 0 && (
              <Warning message="Aucun exercice actif. Veuillez créer un exercice d'abord." />
            )}
            {getActiveLibelles().length === 0 && (
              <Warning message="Aucun libellé budgétaire actif. Veuillez paramétrer la nomenclature d'abord." />
            )}

            {showForm && (
              <FormCard
                title={editId ? "Modifier l'engagement" : "Nouvel engagement"}
                onSave={submitEngagement}
                onCancel={() => {
                  setShowForm(false);
                  setEditId(null);
                  setForm({
                    reference: "",
                    exercice_id: "",
                    libelle_id: "",
                    bc_id: "",
                    amount: "",
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
                    placeholder="ex: ENG-2026-001"
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
                      setForm({
                        ...form,
                        exercice_id: e.target.value,
                        libelle_id: "",
                      })
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
                  <label style={labelStyle}>Ligne Budgétaire *</label>
                  <select
                    value={form.libelle_id}
                    onChange={(e) =>
                      setForm({ ...form, libelle_id: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {getActiveLibelles().map((lib) => (
                      <option key={lib._id} value={String(lib._id)}>
                        {lib.name_fr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Bon de Commande (optionnel)</label>
                  <select
                    value={form.bc_id}
                    onChange={(e) => onBcSelect(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">-- Aucun --</option>
                    {commandes
                      .filter(
                        (bc) =>
                          bc.statut === "Attribué" ||
                          bc.statut === "En cours d'exécution",
                      )
                      .map((bc) => (
                        <option key={bc._id} value={String(bc._id)}>
                          {bc.reference || "BC-" + bc._id}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Montant Engagé (MAD) *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    style={inputStyle}
                  />
                  {form.exercice_id && form.libelle_id && (
                    <div
                      style={{ fontSize: 11, color: "#6B6760", marginTop: 4 }}
                    >
                      Crédit disponible:{" "}
                      <strong
                        style={{
                          color:
                            getAvailableCredit(
                              form.exercice_id,
                              form.libelle_id,
                            ) < Number(form.amount)
                              ? "#854F0B"
                              : "#3B6D11",
                        }}
                      >
                        {formatNumber(
                          getAvailableCredit(form.exercice_id, form.libelle_id),
                        )}{" "}
                        MAD
                      </strong>
                    </div>
                  )}
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
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option>Brouillon</option>
                    <option>Validé</option>
                    <option>Engagé</option>
                    <option>Clôturé</option>
                    <option>Annulé</option>
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
                    style={{
                      ...inputStyle,
                      minHeight: 60,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
              </FormCard>
            )}

            {engagements.length > 0 ? (
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
                        "Ligne",
                        "BC",
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
                    {engagements.map((e, i) => (
                      <tr
                        key={e._id}
                        style={{
                          borderBottom:
                            i < engagements.length - 1
                              ? "0.5px solid #F2EFE8"
                              : "none",
                        }}
                      >
                        <td
                          style={tdStyle({ fontWeight: 600, color: "#1A1917" })}
                        >
                          {e.reference}
                        </td>
                        <td style={tdStyle()}>
                          {getExerciceLabel(e.exercice_id)}
                        </td>
                        <td style={tdStyle()}>
                          {getLibelleLabel(e.libelle_id)}
                        </td>
                        <td style={tdStyle()}>{getBcLabel(e.bc_id)}</td>
                        <td
                          style={tdStyle({ fontWeight: 500, color: "#1A1917" })}
                        >
                          {formatNumber(e.amount)} MAD
                        </td>
                        <td style={tdStyle()}>
                          {new Date(e.date).toLocaleDateString("fr-FR")}
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
                            <StatusBadge status={e.status} />
                            {e.status === "Brouillon" && (
                              <select
                                value=""
                                onChange={(ev) => {
                                  if (ev.target.value)
                                    updateStatus(e._id, ev.target.value);
                                  ev.target.value = "";
                                }}
                                style={{
                                  ...inputStyle,
                                  width: "auto",
                                  padding: "4px 8px",
                                  fontSize: 11,
                                }}
                              >
                                <option value="">Valider...</option>
                                <option value="Validé">Valider</option>
                                <option value="Annulé">Annuler</option>
                              </select>
                            )}
                            {e.status === "Validé" && (
                              <button
                                onClick={() => updateStatus(e._id, "Engagé")}
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
                                Engager
                              </button>
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
                              onClick={() => editEngagement(e)}
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
                              onConfirm={() => deleteEngagement(e._id)}
                              message="Êtes-vous sûr de vouloir supprimer cet engagement ?"
                              disabled={
                                e.status === "Validé" || e.status === "Engagé"
                              }
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
                <EmptyState message='Aucun engagement. Cliquez sur "Nouvel Engagement" pour commencer.' />
              )
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: SUIVI PAR LIGNE
        ════════════════════════════════════════════════════════════════ */}
        {tab === "suivi" && (
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
                  Suivi par Ligne Budgétaire
                </div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
                  Crédit alloué vs engagé par ligne
                </div>
              </div>
            </div>

            {allocations.length > 0 ? (
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
                        "Exercice",
                        "Ligne Budgétaire",
                        "Crédit Alloué",
                        "Crédit Engagé",
                        "Solde Disponible",
                        "Taux Engagement",
                        "Statut",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((alloc, i) => {
                      const engaged = engagements
                        .filter(
                          (e) =>
                            String(e.exercice_id) ===
                              String(alloc.exercice_id) &&
                            String(e.libelle_id) === String(alloc.libelle_id) &&
                            e.status !== "Annulé",
                        )
                        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

                      const allocated = Number(alloc.credit_alloue) || 0;
                      const available = allocated - engaged;
                      const rate =
                        allocated > 0
                          ? ((engaged / allocated) * 100).toFixed(1)
                          : 0;

                      return (
                        <tr
                          key={alloc._id || i}
                          style={{
                            borderBottom:
                              i < allocations.length - 1
                                ? "0.5px solid #F2EFE8"
                                : "none",
                          }}
                        >
                          <td style={tdStyle()}>
                            {getExerciceLabel(alloc.exercice_id)}
                          </td>
                          <td style={tdStyle()}>
                            {getLibelleLabel(alloc.libelle_id)}
                          </td>
                          <td
                            style={tdStyle({
                              fontWeight: 500,
                              color: "#1A1917",
                            })}
                          >
                            {formatNumber(allocated)} MAD
                          </td>
                          <td
                            style={tdStyle({
                              fontWeight: 500,
                              color: "#8B6914",
                            })}
                          >
                            {formatNumber(engaged)} MAD
                          </td>
                          <td
                            style={tdStyle({
                              fontWeight: 500,
                              color: available < 0 ? "#854F0B" : "#3B6D11",
                            })}
                          >
                            {formatNumber(available)} MAD
                          </td>
                          <td style={tdStyle()}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  width: 60,
                                  height: 6,
                                  background: "#F2EFE8",
                                  borderRadius: 3,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(rate, 100)}%`,
                                    height: "100%",
                                    background:
                                      rate > 80 ? "#854F0B" : "#3B6D11",
                                    borderRadius: 3,
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 11, color: "#6B6760" }}>
                                {rate}%
                              </span>
                            </div>
                          </td>
                          <td style={tdStyle()}>
                            {available < 0 ? (
                              <span
                                style={{
                                  background: "#FAEEDA",
                                  color: "#854F0B",
                                  padding: "2px 8px",
                                  borderRadius: 20,
                                  fontSize: 11.5,
                                  fontWeight: 500,
                                }}
                              >
                                Dépassé
                              </span>
                            ) : rate > 80 ? (
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
                                Élevé
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: "#EAF4E2",
                                  color: "#3B6D11",
                                  padding: "2px 8px",
                                  borderRadius: 20,
                                  fontSize: 11.5,
                                  fontWeight: 500,
                                }}
                              >
                                Normal
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
              <EmptyState message="Aucune allocation budgétaire. Veuillez d'abord effectuer l'affectation budgétaire." />
            )}
          </>
        )}
      </div>
    </div>
  );
}
