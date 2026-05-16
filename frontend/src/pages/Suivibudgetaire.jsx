import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";

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

const summaryCard = {
  background: "#FEFCF9",
  border: "0.5px solid #E8E4DC",
  borderRadius: 12,
  padding: 20,
};

const formatNumber = (value) => Number(value || 0).toLocaleString("fr-FR");

export default function SuiviBudgetaire() {
  const [exercices, setExercices] = useState([]);
  const [budgetTypes, setBudgetTypes] = useState([]);
  const [annualBudgets, setAnnualBudgets] = useState([]);
  const [libelles, setLibelles] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [commandes, setCommandes] = useState([]);

  const [selectedExercice, setSelectedExercice] = useState("");
  const [selectedBudgetType, setSelectedBudgetType] = useState("");
  const [selectedLibelle, setSelectedLibelle] = useState("");

  useEffect(() => {
    const load = (key) => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    };
    setExercices(load("exercices"));
    setBudgetTypes(load("budgetTypes"));
    setAnnualBudgets(load("annualBudgets"));
    setLibelles(load("libelles"));
    setAllocations(load("budgetAllocations"));
    setCommandes(load("commandes"));
  }, []);

  const getExercice = (id) => exercices.find(ex => String(ex._id) === String(id));
  const getBudgetType = (id) => budgetTypes.find(bt => String(bt._id) === String(id));
  const getLibelle = (id) => libelles.find(l => String(l._id) === String(id));

  const allocationRows = allocations
    .filter(a => (!selectedExercice || String(a.exercice_id) === String(selectedExercice))
      && (!selectedBudgetType || String(a.budget_type_id) === String(selectedBudgetType))
      && (!selectedLibelle || String(a.libelle_id) === String(selectedLibelle)))
    .reduce((map, alloc) => {
      const key = `${alloc.exercice_id}__${alloc.budget_type_id}__${alloc.libelle_id}`;
      if (!map[key]) {
        map[key] = { ...alloc, amount: 0 };
      }
      map[key].amount += Number(alloc.amount || 0);
      return map;
    }, {});

  const rows = Object.values(allocationRows).map(entry => {
    const consumed = commandes
      .filter(bc => String(bc.budget_label_id) === String(entry.libelle_id) && bc.statut !== "Annulé")
      .reduce((sum, bc) => sum + (bc.lineItems?.reduce((sub, item) => sub + Number(item.amount_ht || 0), 0) || 0), 0);
    return {
      ...entry,
      consumed,
      remaining: Number(entry.amount || 0) - consumed,
    };
  });

  const totalAllocated = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalConsumed = rows.reduce((sum, row) => sum + Number(row.consumed || 0), 0);
  const totalRemaining = rows.reduce((sum, row) => sum + Number(row.remaining || 0), 0);

  const activeExercices = exercices.filter(ex => ex.status === "Actif");
  const activeBudgetTypes = budgetTypes.filter(bt => bt.status === "Actif");

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Topbar title="Suivi Budgétaire" />
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#F6F5F2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 600, color: "#1A1917" }}>Suivi Budgétaire</div>
            <div style={{ fontSize: 12.5, color: "#A8A49C", marginTop: 2 }}>Analyse des crédits alloués, consommations BC et restes par libellé.</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>Exercice</label>
            <select value={selectedExercice} onChange={e => setSelectedExercice(e.target.value)} style={inputStyle}>
              <option value="">Tous les exercices</option>
              {activeExercices.map(ex => <option key={ex._id} value={String(ex._id)}>{ex.year} — {ex.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Type de budget</label>
            <select value={selectedBudgetType} onChange={e => setSelectedBudgetType(e.target.value)} style={inputStyle}>
              <option value="">Tous les types</option>
              {activeBudgetTypes.map(bt => <option key={bt._id} value={String(bt._id)}>{bt.code} — {bt.name_fr}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Libellé</label>
            <select value={selectedLibelle} onChange={e => setSelectedLibelle(e.target.value)} style={inputStyle}>
              <option value="">Tous les libellés</option>
              {libelles.map(l => <option key={l._id} value={String(l._id)}>{l.libelle_fr}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={summaryCard}>
            <div style={{ fontSize: 12, color: "#A8A49C", textTransform: "uppercase", letterSpacing: "0.08em" }}>Crédits alloués</div>
            <div style={{ marginTop: 10, fontSize: 26, fontWeight: 700, color: "#1A1917" }}>{formatNumber(totalAllocated)} MAD</div>
          </div>
          <div style={summaryCard}>
            <div style={{ fontSize: 12, color: "#A8A49C", textTransform: "uppercase", letterSpacing: "0.08em" }}>Consommation BC</div>
            <div style={{ marginTop: 10, fontSize: 26, fontWeight: 700, color: "#1A1917" }}>{formatNumber(totalConsumed)} MAD</div>
          </div>
          <div style={summaryCard}>
            <div style={{ fontSize: 12, color: "#A8A49C", textTransform: "uppercase", letterSpacing: "0.08em" }}>Restant</div>
            <div style={{ marginTop: 10, fontSize: 26, fontWeight: 700, color: totalRemaining < 0 ? "#993C1D" : "#1A1917" }}>{formatNumber(totalRemaining)} MAD</div>
          </div>
        </div>

        {rows.length > 0 ? (
          <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                  {['Exercice', 'Type budget', 'Libellé', 'Allocation', 'Consommé', 'Disponible'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                    <td style={tdStyle()}>{getExercice(row.exercice_id)?.year || "-"}</td>
                    <td style={tdStyle()}>{getBudgetType(row.budget_type_id)?.code || "-"}</td>
                    <td style={tdStyle()}>{getLibelle(row.libelle_id)?.libelle_fr || "-"}</td>
                    <td style={tdStyle({ fontWeight: 600 })}>{formatNumber(row.amount)} MAD</td>
                    <td style={tdStyle({ fontWeight: 600 })}>{formatNumber(row.consumed)} MAD</td>
                    <td style={tdStyle({ fontWeight: 600, color: row.remaining < 0 ? "#993C1D" : "#1A1917" })}>{formatNumber(row.remaining)} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 13.5, color: "#A8A49C" }}>Aucune allocation correspondante. Ajoutez des allocations dans Affectation Budgétaire ou mettez à jour les budgets.</div>
          </div>
        )}
      </div>
    </div>
  );
}
