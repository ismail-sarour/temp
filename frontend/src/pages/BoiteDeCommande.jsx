import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import DeleteIconButton from "../components/DeleteIconButton";

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
  whiteSpace: "nowrap",
};

const tdStyle = (extra = {}) => ({
  padding: "13px 16px",
  color: "#6B6760",
  ...extra,
});

const STATUS_WORKFLOW = [
  "Brouillon",
  "Créé",
  "Publié",
  "Attribué",
  "En cours d'exécution",
  "Terminé",
  "Annulé",
];

/** Champs publication / limite devis visibles dès ce statut */
const STATUS_SHOW_PUBLICATION_FIELDS = ["Publié", "Attribué", "En cours d'exécution", "Terminé", "Annulé"];
/** Fournisseur attribué : saisie dès ce statut */
const STATUS_SHOW_AWARDED_SUPPLIER = ["Attribué", "En cours d'exécution", "Terminé", "Annulé"];
const STATUSES_REQUIRING_PUBLICATION_DATES = ["Publié", "Attribué", "En cours d'exécution", "Terminé"];
const STATUSES_REQUIRING_SUPPLIER = ["Attribué", "En cours d'exécution", "Terminé"];

const canEnterLineUnitPrice = (form) =>
  STATUSES_REQUIRING_SUPPLIER.includes(form.statut) && Boolean(String(form.awarded_supplier_id || "").trim());

const units = ["Unité", "Lot", "KG", "Jour", "Mètre", "Mois"];

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

const StatusBadge = ({ statut }) => {
  const colors = {
    Brouillon: { bg: "#F6F5F2", color: "#A8A49C", border: "#DDD9D0" },
    Créé: { bg: "#EEF3FC", color: "#185FA5", border: "#C2D8F5" },
    Publié: { bg: "#EAF4E2", color: "#3B6D11", border: "#B6DFA0" },
    Attribué: { bg: "#FEF3E6", color: "#9A6A1A", border: "#F5D1A6" },
    "En cours d'exécution": { bg: "#F0EAF8", color: "#6B2FAD", border: "#CEB8EE" },
    Terminé: { bg: "#EAF4E2", color: "#3B6D11", border: "#B6DFA0" },
    Annulé: { bg: "#FAECE7", color: "#993C1D", border: "#F5C7BB" },
  };
  const style = colors[statut] || colors.Brouillon;
  return (
    <span style={{
      background: style.bg,
      color: style.color,
      border: `0.5px solid ${style.border}`,
      padding: "4px 12px",
      borderRadius: 20,
      fontSize: 11.5,
      fontWeight: 500,
      fontFamily: "'DM Sans', sans-serif",
      whiteSpace: "nowrap",
      display: "inline-block",
    }}>{statut}</span>
  );
};

const StatusStepper = ({ current, onChange }) => {
  return (
    <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
      {STATUS_WORKFLOW.map((status, index) => {
        const active = status === current;
        return (
          <button
            key={status}
            onClick={() => onChange(status)}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              border: active ? "1px solid #1A1917" : "1px solid #DDD9D0",
              background: active ? "#1A1917" : "#FEFCF9",
              color: active ? "#F5F0E8" : "#6B6760",
              borderRadius: index === 0 ? "20px 0 0 20px" : index === STATUS_WORKFLOW.length - 1 ? "0 20px 20px 0" : 0,
            }}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
};

const formatNumber = (value) => Number(value || 0).toLocaleString("fr-FR");
const parseNumber = (value) => Number(value || 0);

export default function BoiteDeCommande() {
  const [bcs, setBcs] = useState([]);
  const [exercices, setExercices] = useState([]);
  const [natures, setNatures] = useState([]);
  const [libelles, setLibelles] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [vatRates, setVatRates] = useState([]);
  const [rasRates, setRasRates] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterExercice, setFilterExercice] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const emptyForm = {
    reference: "",
    objet_fr: "",
    exercice_id: "",
    service_nature_id: "",
    budget_label_id: "",
    creation_date: today,
    publication_date: "",
    quotation_deadline: "",
    statut: "Brouillon",
    awarded_supplier_id: "",
    notes: "",
    ras_rate_id: "",
  };

  const emptyLineItem = {
    item_number: 1,
    title: "",
    description: "",
    unit: "Unité",
    quantity: "",
    final_unit_price_ht: "",
    applies_vat: false,
    vat_rate_id: "",
    applies_ras: false,
    warranty_required: false,
    warranty_description: "",
  };

  const emptyQuote = {
    supplier_id: "",
    quotation_reference: "",
    quotation_date: today,
    quotation_amount_ht: "",
    quotation_amount_ttc: "",
    is_awarded: false,
  };

  const [form, setForm] = useState(emptyForm);
  const [lineItems, setLineItems] = useState([{ ...emptyLineItem }]);
  const [quotes, setQuotes] = useState([]);
  const [quoteForm, setQuoteForm] = useState({ ...emptyQuote });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = (key) => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    };
    setBcs(load("commandes"));
    setExercices(load("exercices"));
    setNatures(load("natures"));
    setLibelles(load("libelles"));
    setSuppliers(load("fournisseurs"));
    setAllocations(load("budgetAllocations"));
    setVatRates(load("vatRates"));
    setRasRates(load("rasRates"));
    setHistory(load("bcStatusHistory"));
  }, []);

  const saveBcs = (list) => { setBcs(list); localStorage.setItem("commandes", JSON.stringify(list)); };
  const saveAllocations = (list) => { setAllocations(list); localStorage.setItem("budgetAllocations", JSON.stringify(list)); };
  const saveHistory = (list) => { setHistory(list); localStorage.setItem("bcStatusHistory", JSON.stringify(list)); };

  const getExercice = (id) => exercices.find(e => String(e._id) === String(id));
  const getNature = (id) => natures.find(n => String(n._id) === String(id));
  const getLibelle = (id) => libelles.find(l => String(l._id) === String(id));
  const getSupplier = (id) => suppliers.find(s => String(s._id) === String(id));
  const getVatRate = (id) => vatRates.find(v => String(v._id) === String(id));
  const getRasRate = (id) => rasRates.find(r => String(r._id) === String(id));

  const getActiveExercices = () => exercices.filter(ex => ex.status === "Actif");
  const getActiveSuppliers = () => suppliers.filter(s => s.status === "Actif");

  const getLibellesForNature = (natureId) => libelles.filter(l => String(l.natureId) === String(natureId) && l.status === "Actif");

  /** Crédit alloué au libellé sur l'exercice, tous types de budget confondus */
  const getAllocatedCreditFull = (exercice_id, libelle_id) => {
    return allocations
      .filter((a) => String(a.exercice_id) === String(exercice_id) && String(a.libelle_id) === String(libelle_id))
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);
  };

  const getBcConsumed = (exercice_id, libelle_id) => {
    return bcs
      .filter((bc) => String(bc.exercice_id) === String(exercice_id) && String(bc.budget_label_id) === String(libelle_id) && bc.statut !== "Annulé")
      .reduce((sum, bc) => sum + bc.lineItems.reduce((acc, item) => acc + Number(item.amount_ht || 0), 0), 0);
  };

  const getNextReference = () => {
    const existing = bcs
      .map(bc => {
        const match = String(bc.reference || "").match(/BC-(\d+)/);
        return match ? Number(match[1]) : null;
      })
      .filter(Number.isFinite);
    return `BC-${String(existing.length ? Math.max(...existing) + 1 : 1).padStart(4, "0")}`;
  };

  const getRemainingCredit = () => {
    if (!form.exercice_id || !form.budget_label_id) return 0;
    return getAllocatedCreditFull(form.exercice_id, form.budget_label_id) - getBcConsumed(form.exercice_id, form.budget_label_id);
  };

  const getLineTotals = () => {
    const rasPct = Number(getRasRate(form.ras_rate_id)?.rate || 0) / 100;
    const base = lineItems.reduce(
      (totals, item) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.final_unit_price_ht || 0);
        const amount_ht = quantity * price;
        const vatRate = item.applies_vat ? Number(getVatRate(item.vat_rate_id)?.rate || 0) : 0;
        const vat_amount = amount_ht * vatRate / 100;
        const amount_ttc = amount_ht + vat_amount;
        return {
          total_ht: totals.total_ht + amount_ht,
          total_vat: totals.total_vat + vat_amount,
          total_ttc: totals.total_ttc + amount_ttc,
        };
      },
      { total_ht: 0, total_vat: 0, total_ttc: 0 },
    );
    const legacyLineRas = lineItems.length > 0 && lineItems.every((i) => i.applies_ras === undefined);
    let total_ras = 0;
    if (legacyLineRas && form.ras_rate_id) {
      total_ras = base.total_ht * rasPct;
    } else {
      total_ras = lineItems.reduce((sum, item) => {
        const amount_ht = Number(item.quantity || 0) * Number(item.final_unit_price_ht || 0);
        return sum + (item.applies_ras === true && form.ras_rate_id ? amount_ht * rasPct : 0);
      }, 0);
    }
    return { ...base, total_ras };
  };

  const { total_ht, total_vat, total_ttc, total_ras } = getLineTotals();
  const total_net = total_ttc - total_ras;

  const selectedAllocation = getAllocatedCreditFull(form.exercice_id, form.budget_label_id);
  const selectedConsumed = getBcConsumed(form.exercice_id, form.budget_label_id);
  const selectedRemaining = selectedAllocation - selectedConsumed;

  const handleSave = () => {
    if (!form.objet_fr || !form.exercice_id || !form.service_nature_id || !form.budget_label_id) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (STATUSES_REQUIRING_PUBLICATION_DATES.includes(form.statut)) {
      if (!form.publication_date?.trim() || !form.quotation_deadline?.trim()) {
        alert("Renseignez la date de publication et la date limite des devis pour ce statut.");
        return;
      }
    }
    if (STATUSES_REQUIRING_SUPPLIER.includes(form.statut) && !String(form.awarded_supplier_id || "").trim()) {
      alert("Sélectionnez le fournisseur attribué pour ce statut.");
      return;
    }
    if (lineItems.length === 0) {
      alert("Ajoutez au moins une désignation.");
      return;
    }
    if (form.budget_label_id && selectedRemaining < 0) {
      alert("Le montant du BC dépasse le crédit disponible pour ce libellé.");
      return;
    }

    const entry = {
      ...form,
      _id: editId || Date.now(),
      lineItems: lineItems.map((item, index) => ({
        ...item,
        item_number: index + 1,
        amount_ht: Number(item.quantity || 0) * Number(item.final_unit_price_ht || 0),
      })),
      quoteLines: quotes,
      total_ht,
      total_vat,
      total_ttc,
      total_ras,
      total_net,
    };

    const previousBc = editId ? bcs.find(bc => bc._id === editId) : null;
    const updatedBcs = editId ? bcs.map(bc => bc._id === editId ? entry : bc) : [...bcs, entry];
    saveBcs(updatedBcs);

    const historyEntry = {
      _id: Date.now() + 1,
      bc_id: entry._id,
      action: editId ? "Mise à jour" : "Création",
      from: previousBc ? previousBc.statut : null,
      to: entry.statut,
      date: new Date().toISOString(),
      note: editId ? "BC mise à jour" : "Bon créé",
    };
    saveHistory(history.concat(historyEntry));

    setForm({ ...emptyForm, creation_date: today });
    setLineItems([{ ...emptyLineItem }]);
    setQuotes([]);
    setShowForm(false);
    setEditId(null);
  };

  const handleEdit = (bc) => {
    setForm({
      reference: bc.reference,
      objet_fr: bc.objet_fr,
      exercice_id: bc.exercice_id,
      service_nature_id: bc.service_nature_id,
      budget_label_id: bc.budget_label_id,
      creation_date: bc.creation_date || today,
      publication_date: bc.publication_date || "",
      quotation_deadline: bc.quotation_deadline || "",
      statut: bc.statut,
      awarded_supplier_id: bc.awarded_supplier_id || "",
      notes: bc.notes || "",
      ras_rate_id: bc.ras_rate_id || "",
    });
    setLineItems(bc.lineItems?.length ? bc.lineItems : [{ ...emptyLineItem }]);
    setQuotes(bc.quoteLines || []);
    setEditId(bc._id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    saveBcs(bcs.filter(bc => bc._id !== id));
  };

  const handleStatusChange = (id, statut) => {
    const bc = bcs.find(b => b._id === id);
    if (!bc) return;
    if (STATUSES_REQUIRING_PUBLICATION_DATES.includes(statut)) {
      if (!bc.publication_date?.trim() || !bc.quotation_deadline?.trim()) {
        alert("Ouvrez « Modifier » pour renseigner la date de publication et la date limite des devis avant ce statut.");
        return;
      }
    }
    if (STATUSES_REQUIRING_SUPPLIER.includes(statut) && !bc.awarded_supplier_id) {
      alert("Attribuez un fournisseur sur le bon (Modifier) avant ce statut.");
      return;
    }
    if (statut === "Attribué" && !bc.awarded_supplier_id) {
      alert("Attribuer un fournisseur avant de passer à ce statut.");
      return;
    }
    saveBcs(bcs.map(b => b._id === id ? { ...b, statut } : b));
    const historyEntry = {
      _id: Date.now() + 1,
      bc_id: id,
      action: "Changement de statut",
      from: bc.statut,
      to: statut,
      date: new Date().toISOString(),
      note: `Statut changé de ${bc.statut} à ${statut}`,
    };
    saveHistory(history.concat(historyEntry));
  };

  const handleLineChange = (index, field, value) => {
    const next = [...lineItems];
    next[index] = { ...next[index], [field]: value };
    setLineItems(next);
  };

  const handleAddLine = () => setLineItems([...lineItems, { ...emptyLineItem, item_number: lineItems.length + 1 }]);
  const handleRemoveLine = (index) => setLineItems(lineItems.filter((_, idx) => idx !== index));

  const handleAddQuote = () => {
    if (!quoteForm.supplier_id || !quoteForm.quotation_reference) {
      alert("Fournisseur et référence de devis sont requis.");
      return;
    }
    setQuotes([...quotes, { ...quoteForm, _id: Date.now() }]);
    setQuoteForm({ ...emptyQuote, quotation_date: today });
  };

  const handleRemoveQuote = (id) => setQuotes(quotes.filter(q => q._id !== id));

  const filteredBcs = bcs.filter(bc => {
    const statusMatch = filterStatus === "Tous" || bc.statut === filterStatus;
    const exerciceMatch = !filterExercice || String(bc.exercice_id) === String(filterExercice);
    const supplierMatch = !filterSupplier || String(bc.awarded_supplier_id) === String(filterSupplier);
    return statusMatch && exerciceMatch && supplierMatch;
  });

  const activeExercices = getActiveExercices();
  const activeSuppliers = getActiveSuppliers();
  const availableLibelles = getLibellesForNature(form.service_nature_id);
  const showPublicationFields = STATUS_SHOW_PUBLICATION_FIELDS.includes(form.statut);
  const showAwardedSupplier = STATUS_SHOW_AWARDED_SUPPLIER.includes(form.statut);
  const linePriceLocked = !canEnterLineUnitPrice(form);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Topbar title="Boîte de Commande" />
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#F6F5F2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 600, color: "#1A1917" }}>Boîte de Commande</div>
            <div style={{ fontSize: 12.5, color: "#A8A49C", marginTop: 2 }}>{bcs.length} bons de commande</div>
          </div>
          {!showForm && <AddBtn onClick={() => { setShowForm(true); setEditId(null); setForm({ ...emptyForm, creation_date: today }); setLineItems([{ ...emptyLineItem }]); setQuotes([]); }} label="Nouveau BC" />}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Filtrer par statut</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
              <option value="Tous">Tous</option>
              {STATUS_WORKFLOW.map(statut => <option key={statut} value={statut}>{statut}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Filtrer par exercice</label>
            <select value={filterExercice} onChange={e => setFilterExercice(e.target.value)} style={inputStyle}>
              <option value="">Tous</option>
              {activeExercices.map(ex => <option key={ex._id} value={String(ex._id)}>{ex.year} — {ex.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Filtrer par fournisseur</label>
            <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={inputStyle}>
              <option value="">Tous</option>
              {activeSuppliers.map(s => <option key={s._id} value={String(s._id)}>{s.company_name}</option>)}
            </select>
          </div>
        </div>

        {showForm && (
          <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A1917", marginBottom: 20 }}>{editId ? "Modifier Bon de Commande" : "Nouveau Bon de Commande"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Référence</label>
                <input type="text" value={form.reference || getNextReference()} onChange={e => setForm({ ...form, reference: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Exercice</label>
                <select value={form.exercice_id} onChange={e => setForm({ ...form, exercice_id: e.target.value, service_nature_id: "", budget_label_id: "" })} style={inputStyle}>
                  <option value="">-- Sélectionner --</option>
                  {activeExercices.map(ex => <option key={ex._id} value={String(ex._id)}>{ex.year} — {ex.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Nature de prestation</label>
                <select value={form.service_nature_id} onChange={e => setForm({ ...form, service_nature_id: e.target.value, budget_label_id: "" })} style={inputStyle}>
                  <option value="">-- Sélectionner --</option>
                  {natures.filter(n => n.status === "Actif").map(n => <option key={n._id} value={String(n._id)}>{n.nom_fr || n.code}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Libellé budgétaire</label>
                <select value={form.budget_label_id} onChange={e => setForm({ ...form, budget_label_id: e.target.value })} style={inputStyle} disabled={!form.service_nature_id}>
                  <option value="">-- Sélectionner --</option>
                  {availableLibelles.map(l => <option key={l._id} value={String(l._id)}>{l.code} — {l.libelle_fr}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Objet</label>
                <input type="text" value={form.objet_fr} onChange={e => setForm({ ...form, objet_fr: e.target.value })} placeholder="Objet du bon de commande" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Date de création</label>
                <input type="date" value={form.creation_date} readOnly style={{ ...inputStyle, background: "#F6F5F2" }} />
              </div>
              {showPublicationFields && (
                <>
                  <div>
                    <label style={labelStyle}>Date de publication</label>
                    <input type="date" value={form.publication_date} onChange={e => setForm({ ...form, publication_date: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Date limite devis</label>
                    <input type="date" value={form.quotation_deadline} onChange={e => setForm({ ...form, quotation_deadline: e.target.value })} style={inputStyle} />
                  </div>
                </>
              )}
              <div>
                <label style={labelStyle}>Statut</label>
                <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} style={inputStyle}>
                  {STATUS_WORKFLOW.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {showAwardedSupplier && (
                <div>
                  <label style={labelStyle}>Fournisseur attribué</label>
                  <select value={form.awarded_supplier_id} onChange={e => setForm({ ...form, awarded_supplier_id: e.target.value })} style={inputStyle}>
                    <option value="">-- Sélectionner --</option>
                    {activeSuppliers.map(s => <option key={s._id} value={String(s._id)}>{s.company_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={labelStyle}>Taux RAS (bon)</label>
                <select value={form.ras_rate_id} onChange={e => setForm({ ...form, ras_rate_id: e.target.value })} style={inputStyle}>
                  <option value="">-- Aucun / non applicable --</option>
                  {rasRates.filter(r => r.status === "Actif").map(r => <option key={r._id} value={String(r._id)}>{r.code} — {r.rate}%</option>)}
                </select>
                <div style={{ fontSize: 11, color: "#A8A49C", marginTop: 6 }}>Toujours disponible ; par ligne, cochez « RAS sur cette ligne » pour inclure la base HT dans le calcul.</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: 90 }} />
              </div>
            </div>

            <div style={{ background: "#F6F5F2", border: "0.5px solid #E8E4DC", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#6B6760", marginBottom: 8 }}>Contrôle budgétaire</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(140px, 1fr))", gap: 12 }}>
                <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>Crédit alloué (tous types)</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>{formatNumber(selectedAllocation)} MAD</div>
                </div>
                <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>Consommé</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>{formatNumber(selectedConsumed)} MAD</div>
                </div>
                <div style={{ background: selectedRemaining < 0 ? "#FAECE7" : "#EAF4E2", border: `0.5px solid ${selectedRemaining < 0 ? "#F5C7BB" : "#D1E9C4"}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: selectedRemaining < 0 ? "#993C1D" : "#3B6D11", marginBottom: 6 }}>Disponible</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: selectedRemaining < 0 ? "#993C1D" : "#3B6D11" }}>{formatNumber(selectedRemaining)} MAD</div>
                </div>
                <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>Statut actuel</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>{form.statut}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13.5, fontWeight: 600, color: "#1A1917", marginBottom: 12 }}>Désignations</div>
              {lineItems.map((item, index) => {
                const amount_ht = Number(item.quantity || 0) * Number(item.final_unit_price_ht || 0);
                const vatRate = item.applies_vat ? Number(getVatRate(item.vat_rate_id)?.rate || 0) : 0;
                const amount_ttc = amount_ht + amount_ht * vatRate / 100;
                return (
                  <div key={index} style={{ background: "#F6F5F2", border: "0.5px solid #E8E4DC", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1A1917" }}>Désignation {index + 1}</div>
                      {lineItems.length > 1 && (
                        <DeleteIconButton
                          onConfirm={() => handleRemoveLine(index)}
                          message="Êtes-vous sûr de vouloir supprimer cette désignation ?"
                          title="Supprimer la désignation"
                        />
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div><label style={labelStyle}>Titre</label><input type="text" value={item.title} onChange={e => handleLineChange(index, "title", e.target.value)} style={inputStyle} /></div>
                      <div><label style={labelStyle}>Unité</label><select value={item.unit} onChange={e => handleLineChange(index, "unit", e.target.value)} style={inputStyle}>{units.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                      <div><label style={labelStyle}>Quantité</label><input type="number" value={item.quantity} onChange={e => handleLineChange(index, "quantity", e.target.value)} style={inputStyle} /></div>
                      <div>
                        <label style={labelStyle}>Prix unitaire HT</label>
                        <input
                          type="number"
                          value={item.final_unit_price_ht}
                          onChange={e => handleLineChange(index, "final_unit_price_ht", e.target.value)}
                          style={{ ...inputStyle, ...(linePriceLocked ? { background: "#F6F5F2", color: "#A8A49C" } : {}) }}
                          disabled={linePriceLocked}
                          title={linePriceLocked ? "Renseignez le fournisseur attribué (statut Attribué ou suivant) pour saisir les prix." : ""}
                        />
                        {linePriceLocked && <div style={{ fontSize: 11, color: "#A8A49C", marginTop: 4 }}>Prix après attribution fournisseur.</div>}
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Description</label><textarea value={item.description} onChange={e => handleLineChange(index, "description", e.target.value)} style={{ ...inputStyle, minHeight: 60 }} /></div>
                      <div><label style={labelStyle}>Applique TVA</label><select value={item.applies_vat ? "Oui" : "Non"} onChange={e => handleLineChange(index, "applies_vat", e.target.value === "Oui")} style={inputStyle}><option>Non</option><option>Oui</option></select></div>
                      {item.applies_vat && (
                        <div><label style={labelStyle}>Taux TVA</label><select value={item.vat_rate_id} onChange={e => handleLineChange(index, "vat_rate_id", e.target.value)} style={inputStyle}><option value="">-- Sélectionner --</option>{vatRates.filter(v => v.status === "Actif").map(v => <option key={v._id} value={String(v._id)}>{v.code} — {v.rate}%</option>)}</select></div>
                      )}
                      <div><label style={labelStyle}>RAS sur cette ligne</label><select value={item.applies_ras ? "Oui" : "Non"} onChange={e => handleLineChange(index, "applies_ras", e.target.value === "Oui")} style={inputStyle}><option>Non</option><option>Oui</option></select></div>
                      <div><label style={labelStyle}>Garantie requise</label><select value={item.warranty_required ? "Oui" : "Non"} onChange={e => handleLineChange(index, "warranty_required", e.target.value === "Oui")} style={inputStyle}><option>Non</option><option>Oui</option></select></div>
                      {item.warranty_required && (
                        <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Description garantie</label><textarea value={item.warranty_description} onChange={e => handleLineChange(index, "warranty_description", e.target.value)} style={{ ...inputStyle, minHeight: 60 }} /></div>
                      )}
                    </div>
                    <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div><span style={{ fontSize: 12, color: "#A8A49C" }}>Montant HT</span><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A1917" }}>{formatNumber(amount_ht)} MAD</div></div>
                      <div><span style={{ fontSize: 12, color: "#A8A49C" }}>Montant TTC</span><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A1917" }}>{formatNumber(amount_ttc)} MAD</div></div>
                    </div>
                  </div>
                );
              })}
              <AddBtn onClick={handleAddLine} label="Ajouter une désignation" />
            </div>

            <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13.5, fontWeight: 600, color: "#1A1917", marginBottom: 14 }}>Devis fournisseurs</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Fournisseur</label>
                  <select value={quoteForm.supplier_id} onChange={e => setQuoteForm({ ...quoteForm, supplier_id: e.target.value })} style={inputStyle}>
                    <option value="">-- Sélectionner --</option>
                    {activeSuppliers.map(s => <option key={s._id} value={String(s._id)}>{s.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Référence devis</label>
                  <input type="text" value={quoteForm.quotation_reference} onChange={e => setQuoteForm({ ...quoteForm, quotation_reference: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Date devis</label>
                  <input type="date" value={quoteForm.quotation_date} onChange={e => setQuoteForm({ ...quoteForm, quotation_date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Montant HT</label>
                  <input type="number" value={quoteForm.quotation_amount_ht} onChange={e => setQuoteForm({ ...quoteForm, quotation_amount_ht: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Montant TTC</label>
                  <input type="number" value={quoteForm.quotation_amount_ttc} onChange={e => setQuoteForm({ ...quoteForm, quotation_amount_ttc: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Attribué</label>
                  <select value={quoteForm.is_awarded ? "Oui" : "Non"} onChange={e => setQuoteForm({ ...quoteForm, is_awarded: e.target.value === "Oui" })} style={inputStyle}>
                    <option>Non</option>
                    <option>Oui</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <button onClick={handleAddQuote} style={{ background: "#1A1917", color: "#F5F0E8", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500 }}>Ajouter un devis</button>
                <button onClick={() => setQuoteForm({ ...emptyQuote, quotation_date: today })} style={{ background: "transparent", color: "#6B6760", border: "0.5px solid #DDD9D0", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>Réinitialiser</button>
              </div>
              {quotes.length > 0 && (
                <div style={{ background: "#F6F5F2", border: "0.5px solid #E8E4DC", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, color: "#6B6760", marginBottom: 12 }}>Devis ajoutés</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: "#FFFFFF", borderBottom: "0.5px solid #E8E4DC" }}>
                        {['Fournisseur', 'Réf.', 'Date', 'HT', 'TTC', 'Attribué', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map((quote, i) => (
                        <tr key={quote._id} style={{ borderBottom: i < quotes.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                          <td style={tdStyle()}>{getSupplier(quote.supplier_id)?.company_name || "-"}</td>
                          <td style={tdStyle()}>{quote.quotation_reference}</td>
                          <td style={tdStyle()}>{quote.quotation_date}</td>
                          <td style={tdStyle({ textAlign: "right" })}>{formatNumber(quote.quotation_amount_ht)} MAD</td>
                          <td style={tdStyle({ textAlign: "right" })}>{formatNumber(quote.quotation_amount_ttc)} MAD</td>
                          <td style={tdStyle()}>{quote.is_awarded ? "Oui" : "Non"}</td>
                          <td style={tdStyle()}><DeleteIconButton onConfirm={() => handleRemoveQuote(quote._id)} message="Êtes-vous sûr de vouloir supprimer ce devis ?" title="Supprimer le devis" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ background: "#F6F5F2", border: "0.5px solid #E8E4DC", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(140px, 1fr))", gap: 12 }}>
                <div><div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>Total HT</div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>{formatNumber(total_ht)} MAD</div></div>
                <div><div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>Total TVA</div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>{formatNumber(total_vat)} MAD</div></div>
                <div><div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>Total TTC</div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>{formatNumber(total_ttc)} MAD</div></div>
                <div><div style={{ fontSize: 11, color: "#A8A49C", marginBottom: 6 }}>Net après RAS</div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>{formatNumber(total_net)} MAD</div></div>
              </div>
            </div>

            {editId && (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13.5, fontWeight: 600, color: "#1A1917", marginBottom: 12 }}>Historique des statuts</div>
                {history.filter(h => h.bc_id === editId).sort((a,b) => new Date(a.date) - new Date(b.date)).map((entry, idx) => (
                  <div key={entry._id} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: idx < history.filter(h => h.bc_id === editId).length - 1 ? 12 : 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", marginTop: 6, background: entry.to === "Annulé" ? "#993C1D" : entry.to === "Terminé" ? "#3B6D11" : "#185FA5" }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1917" }}>{entry.action}</div>
                      <div style={{ fontSize: 12, color: "#6B6760" }}>{entry.note} • {new Date(entry.date).toLocaleDateString("fr-FR")} {new Date(entry.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={handleSave} style={{ background: "#1A1917", color: "#F5F0E8", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500 }}>{editId ? "Mettre à jour" : "Enregistrer"}</button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm({ ...emptyForm, creation_date: today }); setLineItems([{ ...emptyLineItem }]); setQuotes([]); }} style={{ background: "transparent", color: "#6B6760", border: "0.5px solid #DDD9D0", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        )}

        {!showForm && filteredBcs.length === 0 && (
          <EmptyState message='Aucun bon de commande. Cliquez sur "Nouveau BC" pour commencer.' />
        )}

        {!showForm && filteredBcs.length > 0 && (
          <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                  {['Réf. BC', 'Exercice', 'Libellé', 'Fournisseur', 'Montant TTC', 'Statut', 'Actions'].map(h => (<th key={h} style={thStyle}>{h}</th>))}
                </tr>
              </thead>
              <tbody>
                {filteredBcs.map((bc, index) => {
                  const exercice = getExercice(bc.exercice_id);
                  const lib = getLibelle(bc.budget_label_id);
                  const supplier = getSupplier(bc.awarded_supplier_id);
                  return (
                    <tr key={bc._id} style={{ borderBottom: index < filteredBcs.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                      <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{bc.reference}</td>
                      <td style={tdStyle()}>{exercice ? `${exercice.year}` : "-"}</td>
                      <td style={tdStyle()}>{lib ? lib.libelle_fr : "-"}</td>
                      <td style={tdStyle()}>{supplier ? supplier.company_name : "-"}</td>
                      <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{formatNumber(bc.total_ttc)} MAD</td>
                      <td style={tdStyle()}><StatusBadge statut={bc.statut} /></td>
                      <td style={tdStyle()}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <StatusStepper current={bc.statut} onChange={(status) => handleStatusChange(bc._id, status)} />
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <button onClick={() => handleEdit(bc)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "6px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer" }}>Modifier</button>
                            <DeleteIconButton onConfirm={() => handleDelete(bc._id)} message="Êtes-vous sûr de vouloir supprimer ce bon de commande ?" title="Supprimer le BC" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
