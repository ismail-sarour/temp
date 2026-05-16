import { useState, useEffect, useCallback } from "react";
import Topbar from "../components/Topbar";
import StatusActiveToggle from "../components/StatusActiveToggle";
import DeleteIconButton from "../components/DeleteIconButton";
import { apiFetch } from "../hooks/useApiData";

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

// ─── Small components ─────────────────────────────────────────────────────────
const AddBtn = ({ onClick, label }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 6,
    background: "#1A1917", color: "#F5F0E8",
    border: "none", borderRadius: 8,
    padding: "8px 14px", fontSize: 12.5,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", fontWeight: 500,
  }}>
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
    {label}
  </button>
);

const EmptyState = ({ message }) => (
  <div style={{
    background: "#FEFCF9", border: "0.5px solid #E8E4DC",
    borderRadius: 12, padding: "48px 24px", textAlign: "center",
  }}>
    <div style={{ fontSize: 13.5, color: "#A8A49C" }}>{message}</div>
  </div>
);

const Warning = ({ message }) => (
  <div style={{
    background: "#FAEEDA", border: "0.5px solid #F5D99A",
    borderRadius: 10, padding: "12px 16px", marginBottom: 16,
    fontSize: 13, color: "#854F0B",
  }}>
    {message}
  </div>
);

const ErrBanner = ({ message }) => (
  <div style={{
    background: "#FDECEA", border: "0.5px solid #F5B8B8",
    borderRadius: 10, padding: "12px 16px", marginBottom: 16,
    fontSize: 13, color: "#9B1C1C",
  }}>
    {message}
  </div>
);

const FormCard = ({ title, onSave, onCancel, saveLabel, children }) => (
  <div style={{
    background: "#FEFCF9", border: "0.5px solid #E8E4DC",
    borderRadius: 12, padding: 24, marginBottom: 20,
  }}>
    <div style={{
      fontFamily: "'Syne', sans-serif", fontSize: 14,
      fontWeight: 600, color: "#1A1917", marginBottom: 20,
    }}>
      {title}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
      {children}
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <button onClick={onSave} style={{
        background: "#1A1917", color: "#F5F0E8", border: "none",
        borderRadius: 8, padding: "10px 20px", fontSize: 13,
        fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500,
      }}>
        {saveLabel}
      </button>
      <button onClick={onCancel} style={{
        background: "transparent", color: "#6B6760",
        border: "0.5px solid #DDD9D0", borderRadius: 8,
        padding: "10px 20px", fontSize: 13,
        fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
      }}>
        Annuler
      </button>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    "Actif":     { bg: "#EAF4E2", color: "#3B6D11" },
    "Inactif":   { bg: "#F5F0E8", color: "#6B6760" },
    "Brouillon": { bg: "#E8F0FA", color: "#185FA5" },
    "Validé":    { bg: "#EAF4E2", color: "#3B6D11" },
    "Clôturé":   { bg: "#F5F0E8", color: "#6B6760" },
  };
  const style = colors[status] || colors["Inactif"];
  return (
    <span style={{ background: style.bg, color: style.color, padding: "2px 8px", borderRadius: 20, fontSize: 11.5, fontWeight: 500 }}>
      {status}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function GestionBudget() {
  const [tab, setTab] = useState("exercices");

  const [exercices, setExercices]       = useState([]);
  const [budgetTypes, setBudgetTypes]   = useState([]);
  const [annualBudgets, setAnnualBudgets] = useState([]);
  const [apiError, setApiError]         = useState(null);

  // ── Forms state ──────────────────────────────────────────────────────────────
  const emptyExercice   = { year: "", label: "", start_date: "", end_date: "", status: "Actif" };
  const emptyBudgetType = { code: "", name_fr: "", name_ar: "", status: "Actif" };
  const emptyBudget     = { exercice_id: "", visa_date: "", status: "Brouillon", observation: "" };

  const [exerciceForm,    setExerciceForm]    = useState(emptyExercice);
  const [budgetTypeForm,  setBudgetTypeForm]  = useState(emptyBudgetType);
  const [budgetForm,      setBudgetForm]      = useState(emptyBudget);
  const [budgetTypeAmounts, setBudgetTypeAmounts] = useState({});

  const [editExerciceId,   setEditExerciceId]   = useState(null);
  const [editBudgetTypeId, setEditBudgetTypeId] = useState(null);
  const [editBudgetId,     setEditBudgetId]     = useState(null);

  const [showExerciceForm,   setShowExerciceForm]   = useState(false);
  const [showBudgetTypeForm, setShowBudgetTypeForm] = useState(false);
  const [showBudgetForm,     setShowBudgetForm]     = useState(false);

  // ── Loaders ───────────────────────────────────────────────────────────────────
  const loadExercices = useCallback(async () => {
    try {
      const data = await apiFetch("/exercises");
      setExercices(data);
    } catch (e) { setApiError(e.message); }
  }, []);

  const loadBudgetTypes = useCallback(async () => {
    try {
      const data = await apiFetch("/budget-types");
      setBudgetTypes(data);
    } catch (e) { setApiError(e.message); }
  }, []);

  const loadAnnualBudgets = useCallback(async () => {
    try {
      const data = await apiFetch("/annual-budgets");
      setAnnualBudgets(data);
    } catch (e) { setApiError(e.message); }
  }, []);

  useEffect(() => {
    loadExercices();
    loadBudgetTypes();
    loadAnnualBudgets();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getExerciceLabel = (id) => {
    const ex = exercices.find(e => String(e._id) === String(id));
    return ex ? `${ex.year} – ${ex.label}` : "-";
  };
  const getActiveBudgetTypes = () => budgetTypes.filter(bt => bt.status === "Actif");
  const getActiveExercices   = () => exercices.filter(ex => ex.status === "Actif");

  // ═══════════════════════════════════════════════════════════════════
  // EXERCICES CRUD
  // ═══════════════════════════════════════════════════════════════════
  const submitExercice = async () => {
    if (!exerciceForm.year?.toString().trim() || !exerciceForm.label?.trim() ||
        !exerciceForm.start_date || !exerciceForm.end_date) return;
    try {
      if (editExerciceId) {
        await apiFetch(`/exercises/${editExerciceId}`, {
          method: "PUT",
          body: { ...exerciceForm, year: Number(exerciceForm.year) },
        });
      } else {
        await apiFetch("/exercises", {
          method: "POST",
          body: { ...exerciceForm, year: Number(exerciceForm.year) },
        });
      }
      await loadExercices();
      setExerciceForm(emptyExercice);
      setEditExerciceId(null);
      setShowExerciceForm(false);
      setApiError(null);
    } catch (e) { setApiError(e.message); }
  };

  const editExercice = (ex) => {
    setExerciceForm({
      year: ex.year,
      label: ex.label,
      start_date: ex.start_date || "",
      end_date: ex.end_date || "",
      status: ex.status,
    });
    setEditExerciceId(ex._id);
    setShowExerciceForm(true);
  };

  const deleteExercice = async (_id) => {
    try {
      await apiFetch(`/exercises/${_id}`, { method: "DELETE" });
      await loadExercices();
      await loadAnnualBudgets();
      setApiError(null);
    } catch (e) { setApiError(e.message); }
  };

  const toggleExerciceActive = async (ex) => {
    const newStatus = ex.status === "Actif" ? "Inactif" : "Actif";
    try {
      await apiFetch(`/exercises/${ex._id}`, {
        method: "PUT",
        body: {
          year: ex.year,
          label: ex.label,
          start_date: ex.start_date,
          end_date: ex.end_date,
          status: newStatus,
        },
      });
      await loadExercices();
      setApiError(null);
    } catch (e) { setApiError(e.message); }
  };

  // ═══════════════════════════════════════════════════════════════════
  // BUDGET TYPES CRUD
  // ═══════════════════════════════════════════════════════════════════
  const submitBudgetType = async () => {
    if (!budgetTypeForm.code?.trim() || !budgetTypeForm.name_fr?.trim()) return;
    try {
      if (editBudgetTypeId) {
        await apiFetch(`/budget-types/${editBudgetTypeId}`, {
          method: "PUT",
          body: budgetTypeForm,
        });
      } else {
        await apiFetch("/budget-types", {
          method: "POST",
          body: budgetTypeForm,
        });
      }
      await loadBudgetTypes();
      setBudgetTypeForm(emptyBudgetType);
      setEditBudgetTypeId(null);
      setShowBudgetTypeForm(false);
      setApiError(null);
    } catch (e) { setApiError(e.message); }
  };

  const editBudgetType = (bt) => {
    setBudgetTypeForm({ code: bt.code, name_fr: bt.name_fr, name_ar: bt.name_ar || "", status: bt.status });
    setEditBudgetTypeId(bt._id);
    setShowBudgetTypeForm(true);
  };

  const deleteBudgetType = async (_id) => {
    try {
      await apiFetch(`/budget-types/${_id}`, { method: "DELETE" });
      await loadBudgetTypes();
      setApiError(null);
    } catch (e) { setApiError(e.message); }
  };

  const toggleBudgetTypeActive = async (bt) => {
    const newStatus = bt.status === "Actif" ? "Inactif" : "Actif";
    try {
      await apiFetch(`/budget-types/${bt._id}`, {
        method: "PUT",
        body: { code: bt.code, name_fr: bt.name_fr, name_ar: bt.name_ar, status: newStatus },
      });
      await loadBudgetTypes();
      setApiError(null);
    } catch (e) { setApiError(e.message); }
  };

  // ═══════════════════════════════════════════════════════════════════
  // ANNUAL BUDGETS CRUD
  // ═══════════════════════════════════════════════════════════════════
  const submitBudget = async () => {
    if (!budgetForm.exercice_id || !budgetForm.visa_date) return;

    const lines = Object.entries(budgetTypeAmounts)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([typeId, amount]) => ({
        budget_type_id: Number(typeId),
        amount: Number(amount),
      }));

    const payload = {
      exercise_id: Number(budgetForm.exercice_id),
      visa_date: budgetForm.visa_date,
      status: budgetForm.status,
      observation: budgetForm.observation,
      lines,
    };

    try {
      if (editBudgetId) {
        await apiFetch(`/annual-budgets/${editBudgetId}`, { method: "PUT", body: payload });
      } else {
        await apiFetch("/annual-budgets", { method: "POST", body: payload });
      }
      await loadAnnualBudgets();
      setBudgetForm(emptyBudget);
      setBudgetTypeAmounts({});
      setEditBudgetId(null);
      setShowBudgetForm(false);
      setApiError(null);
    } catch (e) { setApiError(e.message); }
  };

  const editBudget = (b) => {
    setBudgetForm({
      exercice_id: String(b.exercice_id),
      visa_date: b.visa_date || "",
      status: b.status,
      observation: b.observation || "",
    });
    const amounts = {};
    b.lines?.forEach(l => { amounts[l.type_id] = l.amount; });
    setBudgetTypeAmounts(amounts);
    setEditBudgetId(b._id);
    setShowBudgetForm(true);
  };

  const deleteBudget = async (_id) => {
    try {
      await apiFetch(`/annual-budgets/${_id}`, { method: "DELETE" });
      await loadAnnualBudgets();
      setApiError(null);
    } catch (e) { setApiError(e.message); }
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────────
  const tabs = [
    { key: "exercices", label: "Exercices",       count: exercices.length },
    { key: "types",     label: "Types de Budget", count: budgetTypes.length },
    { key: "budgets",   label: "Budget Annuel",   count: annualBudgets.length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Topbar title="Exercices & Budget" />

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#F6F5F2" }}>

        {apiError && <ErrBanner message={apiError} />}

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 24,
          background: "#FEFCF9", border: "0.5px solid #E8E4DC",
          borderRadius: 10, padding: 4, width: "fit-content", flexWrap: "wrap",
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              background: tab === t.key ? "#1A1917" : "transparent",
              color: tab === t.key ? "#F5F0E8" : "#6B6760",
              fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 7,
              transition: "background 0.15s",
            }}>
              {t.label}
              <span style={{
                fontSize: 10.5, padding: "1px 6px", borderRadius: 20,
                background: tab === t.key ? "rgba(255,255,255,0.15)" : "#F2EFE8",
                color: tab === t.key ? "#F5F0E8" : "#A8A49C",
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ══════════════ TAB: EXERCICES ══════════════ */}
        {tab === "exercices" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Exercices Budgétaires</div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Années budgétaires et leurs périodes</div>
              </div>
              {!showExerciceForm && <AddBtn onClick={() => setShowExerciceForm(true)} label="Nouvel Exercice" />}
            </div>

            {showExerciceForm && (
              <FormCard
                title={editExerciceId ? "Modifier l'exercice" : "Nouvel exercice"}
                onSave={submitExercice}
                onCancel={() => { setShowExerciceForm(false); setEditExerciceId(null); setExerciceForm(emptyExercice); }}
                saveLabel={editExerciceId ? "Mettre à jour" : "Enregistrer"}
              >
                <div><label style={labelStyle}>Année *</label><input type="number" placeholder="ex: 2026" value={exerciceForm.year} onChange={e => setExerciceForm({ ...exerciceForm, year: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Libellé *</label><input type="text" placeholder="ex: Exercice 2026" value={exerciceForm.label} onChange={e => setExerciceForm({ ...exerciceForm, label: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Date de début *</label><input type="date" value={exerciceForm.start_date} onChange={e => setExerciceForm({ ...exerciceForm, start_date: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Date de fin *</label><input type="date" value={exerciceForm.end_date} onChange={e => setExerciceForm({ ...exerciceForm, end_date: e.target.value })} style={inputStyle} /></div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={labelStyle}>Statut</label>
                    <select value={exerciceForm.status} onChange={e => setExerciceForm({ ...exerciceForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option><option>Clôturé</option></select>
                  </div>
                  {exerciceForm.status !== "Clôturé" && (
                    <StatusActiveToggle
                      isActive={exerciceForm.status === "Actif"}
                      onToggle={() => setExerciceForm({ ...exerciceForm, status: exerciceForm.status === "Actif" ? "Inactif" : "Actif" })}
                      title={exerciceForm.status === "Actif" ? "Passer en Inactif" : "Passer en Actif"}
                    />
                  )}
                </div>
              </FormCard>
            )}

            {exercices.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                      {["Année", "Libellé", "Début", "Fin", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {exercices.map((ex, i) => (
                      <tr key={ex._id} style={{ borderBottom: i < exercices.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                        <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{ex.year}</td>
                        <td style={tdStyle()}>{ex.label}</td>
                        <td style={tdStyle()}>{ex.start_date ? new Date(ex.start_date).toLocaleDateString("fr-FR") : "-"}</td>
                        <td style={tdStyle()}>{ex.end_date ? new Date(ex.end_date).toLocaleDateString("fr-FR") : "-"}</td>
                        <td style={tdStyle()}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <StatusBadge status={ex.status} />
                            {ex.status !== "Clôturé" && (
                              <StatusActiveToggle
                                isActive={ex.status === "Actif"}
                                title={ex.status === "Actif" ? "Passer en Inactif" : "Passer en Actif"}
                                onToggle={() => toggleExerciceActive(ex)}
                              />
                            )}
                          </div>
                        </td>
                        <td style={tdStyle()}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button onClick={() => editExercice(ex)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button>
                            <DeleteIconButton onConfirm={() => deleteExercice(ex._id)} message="Supprimer cet exercice ? Les budgets liés seront aussi supprimés." />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !showExerciceForm && <EmptyState message='Aucun exercice. Cliquez sur "Nouvel Exercice" pour commencer.' />}
          </>
        )}

        {/* ══════════════ TAB: BUDGET TYPES ══════════════ */}
        {tab === "types" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Types de Budget</div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Catégories de dépenses (ex: FCT, INV)</div>
              </div>
              {!showBudgetTypeForm && <AddBtn onClick={() => setShowBudgetTypeForm(true)} label="Nouveau Type" />}
            </div>

            {showBudgetTypeForm && (
              <FormCard
                title={editBudgetTypeId ? "Modifier le type" : "Nouveau type"}
                onSave={submitBudgetType}
                onCancel={() => { setShowBudgetTypeForm(false); setEditBudgetTypeId(null); setBudgetTypeForm(emptyBudgetType); }}
                saveLabel={editBudgetTypeId ? "Mettre à jour" : "Enregistrer"}
              >
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: FCT" value={budgetTypeForm.code} onChange={e => setBudgetTypeForm({ ...budgetTypeForm, code: e.target.value })} style={inputStyle} /></div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={labelStyle}>Statut</label>
                    <select value={budgetTypeForm.status} onChange={e => setBudgetTypeForm({ ...budgetTypeForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select>
                  </div>
                  <StatusActiveToggle
                    isActive={budgetTypeForm.status === "Actif"}
                    onToggle={() => setBudgetTypeForm({ ...budgetTypeForm, status: budgetTypeForm.status === "Actif" ? "Inactif" : "Actif" })}
                  />
                </div>
                <div><label style={labelStyle}>Nom (FR) *</label><input type="text" placeholder="ex: Fonctionnement" value={budgetTypeForm.name_fr} onChange={e => setBudgetTypeForm({ ...budgetTypeForm, name_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom (AR)</label><input type="text" placeholder="ex: التسيير" value={budgetTypeForm.name_ar} onChange={e => setBudgetTypeForm({ ...budgetTypeForm, name_ar: e.target.value })} style={inputStyle} /></div>
              </FormCard>
            )}

            {budgetTypes.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                      {["Code", "Nom FR", "Nom AR", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {budgetTypes.map((bt, i) => (
                      <tr key={bt._id} style={{ borderBottom: i < budgetTypes.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                        <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{bt.code}</td>
                        <td style={tdStyle()}>{bt.name_fr}</td>
                        <td style={tdStyle()}>{bt.name_ar || "-"}</td>
                        <td style={tdStyle()}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <StatusBadge status={bt.status} />
                            <StatusActiveToggle
                              isActive={bt.status === "Actif"}
                              onToggle={() => toggleBudgetTypeActive(bt)}
                            />
                          </div>
                        </td>
                        <td style={tdStyle()}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button onClick={() => editBudgetType(bt)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button>
                            <DeleteIconButton onConfirm={() => deleteBudgetType(bt._id)} message="Supprimer ce type de budget ?" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !showBudgetTypeForm && <EmptyState message='Aucun type de budget. Cliquez sur "Nouveau Type" pour commencer.' />}
          </>
        )}

        {/* ══════════════ TAB: ANNUAL BUDGETS ══════════════ */}
        {tab === "budgets" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Budget Annuel</div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Répartition du budget par type pour chaque exercice</div>
              </div>
              {!showBudgetForm && <AddBtn onClick={() => setShowBudgetForm(true)} label="Nouveau Budget" />}
            </div>

            {exercices.length === 0 && <Warning message="Créez d'abord des exercices budgétaires." />}
            {getActiveBudgetTypes().length === 0 && <Warning message="Créez d'abord des types de budget actifs." />}

            {showBudgetForm && (
              <FormCard
                title={editBudgetId ? "Modifier le budget annuel" : "Nouveau budget annuel"}
                onSave={submitBudget}
                onCancel={() => { setShowBudgetForm(false); setEditBudgetId(null); setBudgetForm(emptyBudget); setBudgetTypeAmounts({}); }}
                saveLabel={editBudgetId ? "Mettre à jour" : "Enregistrer"}
              >
                <div>
                  <label style={labelStyle}>Exercice *</label>
                  <select value={budgetForm.exercice_id} onChange={e => setBudgetForm({ ...budgetForm, exercice_id: e.target.value })} style={inputStyle}>
                    <option value="">-- Sélectionner --</option>
                    {getActiveExercices().map(ex => <option key={ex._id} value={String(ex._id)}>{ex.year} – {ex.label}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Date de visa *</label><input type="date" value={budgetForm.visa_date} onChange={e => setBudgetForm({ ...budgetForm, visa_date: e.target.value })} style={inputStyle} /></div>

                {getActiveBudgetTypes().map((type) => (
                  <div key={type._id}>
                    <label style={labelStyle}>{type.code} – {type.name_fr} (MAD)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={budgetTypeAmounts[type._id] || ""}
                      onChange={e => setBudgetTypeAmounts({ ...budgetTypeAmounts, [type._id]: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                ))}

                <div style={{ gridColumn: "1 / -1", background: "#F6F5F2", border: "0.5px solid #E8E4DC", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: "#6B6760", fontWeight: 500 }}>Total automatique</span>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 600, color: "#1A1917" }}>
                    {Object.values(budgetTypeAmounts).reduce((sum, val) => sum + (Number(val) || 0), 0).toLocaleString("fr-FR")} MAD
                  </span>
                </div>

                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Statut</label><select value={budgetForm.status} onChange={e => setBudgetForm({ ...budgetForm, status: e.target.value })} style={inputStyle}><option>Brouillon</option><option>Validé</option><option>Clôturé</option></select></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Observation</label><textarea placeholder="Notes supplémentaires..." value={budgetForm.observation} onChange={e => setBudgetForm({ ...budgetForm, observation: e.target.value })} style={{ ...inputStyle, minHeight: 60, fontFamily: "'DM Sans', sans-serif" }} /></div>
              </FormCard>
            )}

            {annualBudgets.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                      {["Exercice", "Date Visa", "Montants", "Total (MAD)", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {annualBudgets.map((budget, i) => (
                      <tr key={budget._id} style={{ borderBottom: i < annualBudgets.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                        <td style={tdStyle()}>{getExerciceLabel(budget.exercice_id)}</td>
                        <td style={tdStyle()}>{budget.visa_date ? new Date(budget.visa_date).toLocaleDateString("fr-FR") : "-"}</td>
                        <td style={tdStyle({ fontSize: 12 })}>
                          {budget.lines?.map(l => {
                            const type = budgetTypes.find(bt => String(bt._id) === String(l.type_id));
                            return `${type?.code || l.type_id}: ${Number(l.amount).toLocaleString("fr-FR")}`;
                          }).join(" | ") || "-"}
                        </td>
                        <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{Number(budget.total_amount || 0).toLocaleString("fr-FR")} MAD</td>
                        <td style={tdStyle()}><StatusBadge status={budget.status} /></td>
                        <td style={tdStyle()}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button
                              onClick={() => editBudget(budget)}
                              disabled={budget.status === "Validé"}
                              style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: budget.status === "Validé" ? "#A8A49C" : "#1A1917", cursor: budget.status === "Validé" ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}
                            >
                              Modifier
                            </button>
                            <DeleteIconButton
                              onConfirm={() => deleteBudget(budget._id)}
                              disabled={budget.status === "Validé"}
                              message="Supprimer ce budget annuel ?"
                              title={budget.status === "Validé" ? "Budget validé : suppression interdite" : "Supprimer"}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !showBudgetForm && <EmptyState message='Aucun budget annuel. Cliquez sur "Nouveau Budget" pour commencer.' />}
          </>
        )}
      </div>
    </div>
  );
}