import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import DeleteIconButton from "../components/DeleteIconButton";
import { getData, setData } from "../services/dataStore";

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

const StatusBadge = ({ status }) => {
  const colors = {
    "Brouillon": { bg: "#E8F0FA", color: "#185FA5" },
    "Validé": { bg: "#EAF4E2", color: "#3B6D11" },
    "Clôturé": { bg: "#F5F0E8", color: "#6B6760" },
  };
  const style = colors[status] || colors["Brouillon"];
  return (
    <span style={{ background: style.bg, color: style.color, padding: "2px 8px", borderRadius: 20, fontSize: 11.5, fontWeight: 500 }}>
      {status}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function AffectationBudgetaire() {
  // STATE
  const [allocations, setAllocations] = useState([]);
  const [exercices, setExercices] = useState([]);
  const [budgetTypes, setBudgetTypes] = useState([]);
  const [annualBudgets, setAnnualBudgets] = useState([]);
  const [libelles, setLibelles] = useState([]);

  const [selectedExercice, setSelectedExercice] = useState("");
  const [selectedBudgetType, setSelectedBudgetType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedLibelle, setSelectedLibelle] = useState("");
  const [allocationAmount, setAllocationAmount] = useState("");
  const [editAllocationId, setEditAllocationId] = useState(null);

  useEffect(() => {
    setExercices(getData("exercices", []));
    setBudgetTypes(getData("budgetTypes", []));
    setAnnualBudgets(getData("annualBudgets", []));
    setLibelles(getData("libelles", []));
    setAllocations(getData("budgetAllocations", []));
  }, []);

  const saveAllocations = (list) => {
    setAllocations(list);
    setData("budgetAllocations", list);
  };

  // HELPERS
  const getActiveExercices = () => exercices.filter(e => e.status === "Actif");
  const getActiveLibelles = () => libelles.filter(l => l.status === "Actif");
  
  const getBudgetForSelection = () => {
    if (!selectedExercice || !selectedBudgetType) return null;
    const budget = annualBudgets.find(b => String(b.exercice_id) === String(selectedExercice));
    if (!budget) return null;
    const line = budget.lines?.find(l => String(l.type_id) === String(selectedBudgetType));
    return line ? line.amount : null;
  };

  const getTotalAllocated = () => {
    if (!selectedExercice || !selectedBudgetType) return 0;
    return allocations
      .filter(a => String(a.exercice_id) === String(selectedExercice) && String(a.budget_type_id) === String(selectedBudgetType))
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  };

  const getExerciceLabel = (id) => {
    const ex = exercices.find(e => String(e._id) === String(id));
    return ex ? `${ex.year} – ${ex.label}` : "-";
  };

  const getBudgetTypeLabel = (id) => {
    const bt = budgetTypes.find(b => String(b._id) === String(id));
    return bt ? `${bt.code} – ${bt.name_fr}` : "-";
  };

  const getLibelleLabel = (id) => {
    const lib = libelles.find(l => String(l._id) === String(id));
    return lib ? lib.libelle_fr : "-";
  };

  // FORM LOGIC
  const submitAllocation = () => {
    if (!selectedExercice || !selectedBudgetType || !selectedLibelle || allocationAmount === "") return;

    const budgetAmount = getBudgetForSelection();
    const totalAllocated = getTotalAllocated();
    const newAmount = Number(allocationAmount);
    const amountToAdd = editAllocationId
      ? newAmount - (allocations.find(a => a._id === editAllocationId)?.amount || 0)
      : newAmount;

    if (totalAllocated + amountToAdd > budgetAmount) {
      alert(`Dépassement de budget! Disponible: ${(budgetAmount - totalAllocated).toLocaleString("fr-FR")} MAD`);
      return;
    }

    const entry = {
      _id: editAllocationId || Date.now(),
      exercice_id: selectedExercice,
      budget_type_id: selectedBudgetType,
      libelle_id: selectedLibelle,
      amount: newAmount,
      status: "Brouillon",
    };

    if (editAllocationId) {
      saveAllocations(allocations.map(a => a._id === editAllocationId ? entry : a));
      setEditAllocationId(null);
    } else {
      saveAllocations([...allocations, entry]);
    }
    setSelectedLibelle("");
    setAllocationAmount("");
    setShowForm(false);
  };

  const editAllocation = (a) => {
    setSelectedExercice(a.exercice_id);
    setSelectedBudgetType(a.budget_type_id);
    setSelectedLibelle(a.libelle_id);
    setAllocationAmount(a.amount);
    setEditAllocationId(a._id);
    setShowForm(true);
  };

  const deleteAllocation = (_id) => {
    saveAllocations(allocations.filter(a => a._id !== _id));
  };

  const currentAllocations = allocations.filter(
    a => String(a.exercice_id) === String(selectedExercice) && String(a.budget_type_id) === String(selectedBudgetType)
  );

  const budgetAmount = getBudgetForSelection();
  const totalAllocated = getTotalAllocated();
  const remaining = budgetAmount ? budgetAmount - totalAllocated : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Topbar title="Affectation Budgétaire" />

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#F6F5F2" }}>

        {/* Selection Panel */}
        <div style={{
          background: "#FEFCF9", border: "0.5px solid #E8E4DC",
          borderRadius: 12, padding: 24, marginBottom: 24,
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A1917", marginBottom: 16 }}>
            Sélection
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Exercice *</label>
              <select
                value={selectedExercice}
                onChange={e => { setSelectedExercice(e.target.value); setSelectedBudgetType(""); }}
                style={inputStyle}
              >
                <option value="">-- Sélectionner --</option>
                {getActiveExercices().map(ex => <option key={ex._id} value={String(ex._id)}>{ex.year} – {ex.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type de Budget *</label>
              <select value={selectedBudgetType} onChange={e => setSelectedBudgetType(e.target.value)} style={inputStyle}>
                <option value="">-- Sélectionner --</option>
                {budgetTypes.filter(bt => bt.status === "Actif").map(bt => <option key={bt._id} value={String(bt._id)}>{bt.code} – {bt.name_fr}</option>)}
              </select>
            </div>
          </div>

          {/* Budget Summary */}
          {selectedExercice && selectedBudgetType && budgetAmount !== null && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <div style={{ background: "#F6F5F2", border: "0.5px solid #E8E4DC", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#A8A49C", textTransform: "uppercase", fontWeight: 500, marginBottom: 6 }}>Crédit Alloué</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A1917" }}>
                  {budgetAmount.toLocaleString("fr-FR")} MAD
                </div>
              </div>
              <div style={{ background: "#F6F5F2", border: "0.5px solid #E8E4DC", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#A8A49C", textTransform: "uppercase", fontWeight: 500, marginBottom: 6 }}>Consommé</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A1917" }}>
                  {totalAllocated.toLocaleString("fr-FR")} MAD
                </div>
              </div>
              <div style={{ background: remaining < 0 ? "#FAECE7" : "#EAF4E2", border: "0.5px solid " + (remaining < 0 ? "#F5C7BB" : "#D1E9C4"), borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: remaining < 0 ? "#A8A49C" : "#3B6D11", textTransform: "uppercase", fontWeight: 500, marginBottom: 6 }}>Disponible</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: remaining < 0 ? "#993C1D" : "#3B6D11" }}>
                  {remaining.toLocaleString("fr-FR")} MAD
                </div>
              </div>
              <div style={{ background: "#E8F0FA", border: "0.5px solid #B8D4F1", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#185FA5", textTransform: "uppercase", fontWeight: 500, marginBottom: 6 }}>% Utilisé</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#185FA5" }}>
                  {budgetAmount ? Math.round((totalAllocated / budgetAmount) * 100) : 0}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        {selectedExercice && selectedBudgetType && (
          <>
            {!showForm && (
              <div style={{ marginBottom: 24 }}>
                <AddBtn onClick={() => { setShowForm(true); setEditAllocationId(null); setSelectedLibelle(""); setAllocationAmount(""); }} label="Nouvelle Allocation" />
              </div>
            )}

            {showForm && (
              <div style={{
                background: "#FEFCF9", border: "0.5px solid #E8E4DC",
                borderRadius: 12, padding: 24, marginBottom: 20,
              }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A1917", marginBottom: 16 }}>
                  {editAllocationId ? "Modifier l'allocation" : "Nouvelle allocation"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Libellé *</label>
                    <select value={selectedLibelle} onChange={e => setSelectedLibelle(e.target.value)} style={inputStyle}>
                      <option value="">-- Sélectionner --</option>
                      {getActiveLibelles().map(lib => <option key={lib._id} value={String(lib._id)}>{lib.libelle_fr}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Montant (MAD) *</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={allocationAmount}
                      onChange={e => setAllocationAmount(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={submitAllocation} style={{
                    background: "#1A1917", color: "#F5F0E8", border: "none",
                    borderRadius: 8, padding: "10px 20px", fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500,
                  }}>
                    {editAllocationId ? "Mettre à jour" : "Enregistrer"}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditAllocationId(null); setSelectedLibelle(""); setAllocationAmount(""); }} style={{
                    background: "transparent", color: "#6B6760",
                    border: "0.5px solid #DDD9D0", borderRadius: 8,
                    padding: "10px 20px", fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                  }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Allocations Table */}
            {currentAllocations.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                      {["Libellé", "Montant (MAD)", "% du Budget", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {currentAllocations.map((alloc, i) => (
                      <tr key={alloc._id} style={{ borderBottom: i < currentAllocations.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                        <td style={tdStyle()}>{getLibelleLabel(alloc.libelle_id)}</td>
                        <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{alloc.amount.toLocaleString("fr-FR")}</td>
                        <td style={tdStyle()}>{budgetAmount ? Math.round((alloc.amount / budgetAmount) * 100) : 0}%</td>
                        <td style={tdStyle()}><StatusBadge status={alloc.status} /></td>
                        <td style={tdStyle()}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button onClick={() => editAllocation(alloc)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                              Modifier
                            </button>
                            <DeleteIconButton onConfirm={() => deleteAllocation(alloc._id)} message="Êtes-vous sûr de vouloir supprimer cette allocation ?" title="Supprimer" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !showForm && <EmptyState message="Aucune allocation. Cliquez sur 'Nouvelle Allocation' pour commencer." />}
          </>
        )}

        {(!selectedExercice || !selectedBudgetType) && (
          <Warning message="Sélectionnez un exercice et un type de budget pour commencer." />
        )}
      </div>
    </div>
  );
}
