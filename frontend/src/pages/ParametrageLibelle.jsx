import { useState, useEffect, useMemo } from "react";
import Topbar from "../components/Topbar";
import ActifInactifCell from "../components/ActifInactifCell";
import DeleteIconButton from "../components/DeleteIconButton";

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

// ─── Small reusable components ────────────────────────────────────────────────
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
    "Actif": { bg: "#EAF4E2", color: "#3B6D11" },
    "Inactif": { bg: "#F5F0E8", color: "#6B6760" },
  };
  const style = colors[status] || colors["Inactif"];
  return (
    <span style={{ background: style.bg, color: style.color, padding: "2px 8px", borderRadius: 20, fontSize: 11.5, fontWeight: 500 }}>
      {status}
    </span>
  );
};

/** Flat list of <option> data (nested <optgroup> inside <optgroup> is invalid HTML and breaks selection). */
function buildFlatNatureOptions(familles, categories, natures) {
  const rows = [];
  for (const f of familles) {
    if (f.status !== "Actif") continue;
    for (const c of categories) {
      if (String(c.familleId) !== String(f._id) || c.status !== "Actif") continue;
      for (const n of natures) {
        if (String(n.categorieId) !== String(c._id) || n.status !== "Actif") continue;
        rows.push({
          value: String(n._id),
          label: `${f.code} › ${c.code} › ${n.code} – ${n.nom_fr}`,
        });
      }
    }
  }
  return rows;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ParametrageLibelle() {
  const [tab, setTab] = useState("familles");

  const [familles, setFamilles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [natures, setNatures] = useState([]);
  const [libelles, setLibelles] = useState([]);

  const emptyFam = { code: "", nom_fr: "", nom_ar: "", description: "", display_order: 0, status: "Actif" };
  const emptyCat = { code: "", nom_fr: "", nom_ar: "", description: "", display_order: 0, status: "Actif", familleId: "" };
  const emptyNat = { code: "", nom_fr: "", nom_ar: "", description: "", display_order: 0, status: "Actif", categorieId: "" };
  const emptyLib = { code: "", libelle_fr: "", libelle_ar: "", description: "", display_order: 0, status: "Actif", natureId: "" };

  const [famForm, setFamForm] = useState(emptyFam);
  const [catForm, setCatForm] = useState(emptyCat);
  const [natForm, setNatForm] = useState(emptyNat);
  const [libForm, setLibForm] = useState(emptyLib);

  const [editFamId, setEditFamId] = useState(null);
  const [editCatId, setEditCatId] = useState(null);
  const [editNatId, setEditNatId] = useState(null);
  const [editLibId, setEditLibId] = useState(null);

  const [showFamForm, setShowFamForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showNatForm, setShowNatForm] = useState(false);
  const [showLibForm, setShowLibForm] = useState(false);

  useEffect(() => {
    const f = localStorage.getItem("familles");
    const c = localStorage.getItem("categories");
    const n = localStorage.getItem("natures");
    const l = localStorage.getItem("libelles");
    if (f) setFamilles(JSON.parse(f));
    if (c) setCategories(JSON.parse(c));
    if (n) setNatures(JSON.parse(n));
    if (l) setLibelles(JSON.parse(l));
  }, []);

  const libelleNatureOptions = useMemo(
    () => buildFlatNatureOptions(familles, categories, natures),
    [familles, categories, natures]
  );

  const saveFamilles = (list) => { setFamilles(list); localStorage.setItem("familles", JSON.stringify(list)); };
  const saveCategories = (list) => { setCategories(list); localStorage.setItem("categories", JSON.stringify(list)); };
  const saveNatures = (list) => { setNatures(list); localStorage.setItem("natures", JSON.stringify(list)); };
  const saveLibelles = (list) => { setLibelles(list); localStorage.setItem("libelles", JSON.stringify(list)); };

  const getFamLabel = (id) => familles.find(f => String(f._id) === String(id))?.nom_fr || "-";
  const getCatLabel = (id) => {
    const c = categories.find(c => String(c._id) === String(id));
    return c ? `${c.code} – ${c.nom_fr}` : "-";
  };
  const getNatLabel = (id) => {
    const n = natures.find(n => String(n._id) === String(id));
    return n ? `${n.code} – ${n.nom_fr}` : "-";
  };

  // FAMILLE CRUD
  const submitFam = () => {
    if (!famForm.code?.trim() || !famForm.nom_fr?.trim()) return;
    if (!editFamId && familles.some(f => f.code === famForm.code)) {
      alert("Ce code de famille existe déjà!");
      return;
    }
    const entry = { ...famForm, _id: editFamId || Date.now() };
    if (editFamId) {
      saveFamilles(familles.map(f => f._id === editFamId ? entry : f));
      setEditFamId(null);
    } else {
      saveFamilles([...familles, entry]);
    }
    setFamForm(emptyFam);
    setShowFamForm(false);
  };
  const editFam = (f) => { setFamForm(f); setEditFamId(f._id); setShowFamForm(true); };
  const deleteFam = (_id) => {
    const catIds = categories.filter(c => String(c.familleId) === String(_id)).map(c => c._id);
    saveFamilles(familles.filter(f => f._id !== _id));
    saveCategories(categories.filter(c => String(c.familleId) !== String(_id)));
    saveNatures(natures.filter(n => !catIds.includes(Number(n.categorieId)) && !catIds.map(String).includes(n.categorieId)));
    saveLibelles(libelles.filter(l => {
      const nat = natures.find(n => String(n._id) === String(l.natureId));
      return !catIds.includes(Number(nat?.categorieId)) && !catIds.map(String).includes(nat?.categorieId);
    }));
  };

  // CATEGORIE CRUD
  const submitCat = () => {
    if (!catForm.code?.trim() || !catForm.nom_fr?.trim() || !catForm.familleId) return;
    if (!editCatId && categories.some(c => c.code === catForm.code)) {
      alert("Ce code de catégorie existe déjà!");
      return;
    }
    const entry = { ...catForm, _id: editCatId || Date.now() };
    if (editCatId) {
      saveCategories(categories.map(c => c._id === editCatId ? entry : c));
      setEditCatId(null);
    } else {
      saveCategories([...categories, entry]);
    }
    setCatForm(emptyCat);
    setShowCatForm(false);
  };
  const editCat = (c) => { setCatForm(c); setEditCatId(c._id); setShowCatForm(true); };
  const deleteCat = (_id) => {
    const natIds = natures.filter(n => String(n.categorieId) === String(_id)).map(n => n._id);
    saveCategories(categories.filter(c => c._id !== _id));
    saveNatures(natures.filter(n => String(n.categorieId) !== String(_id)));
    saveLibelles(libelles.filter(l => !natIds.includes(Number(l.natureId)) && !natIds.map(String).includes(l.natureId)));
  };

  // NATURE CRUD
  const submitNat = () => {
    if (!natForm.code?.trim() || !natForm.nom_fr?.trim() || !natForm.categorieId) return;
    if (!editNatId && natures.some(n => n.code === natForm.code)) {
      alert("Ce code de nature existe déjà!");
      return;
    }
    const entry = { ...natForm, _id: editNatId || Date.now() };
    if (editNatId) {
      saveNatures(natures.map(n => n._id === editNatId ? entry : n));
      setEditNatId(null);
    } else {
      saveNatures([...natures, entry]);
    }
    setNatForm(emptyNat);
    setShowNatForm(false);
  };
  const editNat = (n) => { setNatForm(n); setEditNatId(n._id); setShowNatForm(true); };
  const deleteNat = (_id) => {
    saveNatures(natures.filter(n => n._id !== _id));
    saveLibelles(libelles.filter(l => String(l.natureId) !== String(_id)));
  };

  // LIBELLE CRUD
  const submitLib = () => {
    if (!libForm.code?.trim() || !libForm.libelle_fr?.trim() || !libForm.natureId) return;
    if (!editLibId && libelles.some(l => l.code === libForm.code)) {
      alert("Ce code de libellé existe déjà!");
      return;
    }
    const entry = { ...libForm, _id: editLibId || Date.now() };
    if (editLibId) {
      saveLibelles(libelles.map(l => l._id === editLibId ? entry : l));
      setEditLibId(null);
    } else {
      saveLibelles([...libelles, entry]);
    }
    setLibForm(emptyLib);
    setShowLibForm(false);
  };
  const editLib = (l) => { setLibForm(l); setEditLibId(l._id); setShowLibForm(true); };
  const deleteLib = (_id) => saveLibelles(libelles.filter(l => l._id !== _id));

  const toggleFamStatus = (f) => {
    const next = f.status === "Actif" ? "Inactif" : "Actif";
    saveFamilles(familles.map(x => (x._id === f._id ? { ...x, status: next } : x)));
  };
  const toggleCatStatus = (c) => {
    const next = c.status === "Actif" ? "Inactif" : "Actif";
    saveCategories(categories.map(x => (x._id === c._id ? { ...x, status: next } : x)));
  };
  const toggleNatStatus = (n) => {
    const next = n.status === "Actif" ? "Inactif" : "Actif";
    saveNatures(natures.map(x => (x._id === n._id ? { ...x, status: next } : x)));
  };
  const toggleLibStatus = (lib) => {
    const next = lib.status === "Actif" ? "Inactif" : "Actif";
    saveLibelles(libelles.map(x => (x._id === lib._id ? { ...x, status: next } : x)));
  };

  const tabs = [
    { key: "familles", label: "Familles", count: familles.length },
    { key: "categories", label: "Catégories", count: categories.length },
    { key: "natures", label: "Natures", count: natures.length },
    { key: "libelles", label: "Libellés", count: libelles.length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Topbar title="Nomenclature Budgétaire" />

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#F6F5F2" }}>

        {/* Breadcrumb hint */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 12, color: "#A8A49C", flexWrap: "wrap" }}>
          <span style={{ color: "#1A1917", fontWeight: 500 }}>Famille</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#DDD9D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ color: "#1A1917", fontWeight: 500 }}>Catégorie</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#DDD9D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ color: "#1A1917", fontWeight: 500 }}>Nature</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#DDD9D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ color: "#1A1917", fontWeight: 500 }}>Libellé</span>
          <span style={{ marginLeft: 4 }}>— 4 niveaux de hiérarchie</span>
        </div>

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

        {/* TAB: FAMILLES */}
        {tab === "familles" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Familles</div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Premier niveau de la hiérarchie</div>
              </div>
              {!showFamForm && <AddBtn onClick={() => setShowFamForm(true)} label="Nouvelle Famille" />}
            </div>

            {showFamForm && (
              <FormCard
                title={editFamId ? "Modifier la famille" : "Nouvelle famille"}
                onSave={submitFam}
                onCancel={() => { setShowFamForm(false); setEditFamId(null); setFamForm(emptyFam); }}
                saveLabel={editFamId ? "Mettre à jour" : "Enregistrer"}
              >
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: FCT" value={famForm.code} onChange={e => setFamForm({ ...famForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Statut</label><select value={famForm.status} onChange={e => setFamForm({ ...famForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
                <div><label style={labelStyle}>Nom (FR) *</label><input type="text" placeholder="ex: Fonctionnement" value={famForm.nom_fr} onChange={e => setFamForm({ ...famForm, nom_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom (AR)</label><input type="text" placeholder="ex: التسيير" value={famForm.nom_ar} onChange={e => setFamForm({ ...famForm, nom_ar: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Description</label><textarea placeholder="Notes supplémentaires..." value={famForm.description} onChange={e => setFamForm({ ...famForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 60, fontFamily: "'DM Sans', sans-serif" }} /></div>
              </FormCard>
            )}

            {familles.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                      {["Code", "Nom FR", "Nom AR", "Statut", "Catégories", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {familles.map((f, i) => {
                      const nbCats = categories.filter(c => String(c.familleId) === String(f._id)).length;
                      return (
                        <tr key={f._id} style={{ borderBottom: i < familles.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                          <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{f.code}</td>
                          <td style={tdStyle()}>{f.nom_fr}</td>
                          <td style={tdStyle()}>{f.nom_ar || "-"}</td>
                          <td style={tdStyle()}>
                            <ActifInactifCell status={f.status} onToggle={() => toggleFamStatus(f)}>
                              <StatusBadge status={f.status} />
                            </ActifInactifCell>
                          </td>
                          <td style={tdStyle()}><span style={{ background: "#F2EFE8", padding: "2px 10px", borderRadius: 20, fontSize: 12 }}>{nbCats}</span></td>
                          <td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => editFam(f)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteFam(f._id)} message="Êtes-vous sûr de vouloir supprimer cette famille ? Les catégories et données liées seront supprimées." /></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : !showFamForm && <EmptyState message='Aucune famille. Cliquez sur "Nouvelle Famille" pour commencer.' />}
          </>
        )}

        {/* TAB: CATEGORIES */}
        {tab === "categories" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Catégories</div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Deuxième niveau - appartiennent à une Famille</div>
              </div>
              {!showCatForm && <AddBtn onClick={() => setShowCatForm(true)} label="Nouvelle Catégorie" />}
            </div>

            {familles.length === 0 && <Warning message="Créez d'abord des familles." />}

            {showCatForm && (
              <FormCard
                title={editCatId ? "Modifier la catégorie" : "Nouvelle catégorie"}
                onSave={submitCat}
                onCancel={() => { setShowCatForm(false); setEditCatId(null); setCatForm(emptyCat); }}
                saveLabel={editCatId ? "Mettre à jour" : "Enregistrer"}
              >
                <div><label style={labelStyle}>Famille *</label><select value={catForm.familleId} onChange={e => setCatForm({ ...catForm, familleId: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{familles.filter(f => f.status === "Actif").map(f => <option key={f._id} value={String(f._id)}>{f.code} – {f.nom_fr}</option>)}</select></div>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: CAT001" value={catForm.code} onChange={e => setCatForm({ ...catForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Statut</label><select value={catForm.status} onChange={e => setCatForm({ ...catForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
                <div><label style={labelStyle}>Nom (FR) *</label><input type="text" placeholder="ex: Personnel" value={catForm.nom_fr} onChange={e => setCatForm({ ...catForm, nom_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom (AR)</label><input type="text" placeholder="ex: الموارد البشرية" value={catForm.nom_ar} onChange={e => setCatForm({ ...catForm, nom_ar: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Description</label><textarea placeholder="Notes..." value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 60, fontFamily: "'DM Sans', sans-serif" }} /></div>
              </FormCard>
            )}

            {categories.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                      {["Famille", "Code", "Nom FR", "Nom AR", "Statut", "Natures", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c, i) => {
                      const nbNats = natures.filter(n => String(n.categorieId) === String(c._id)).length;
                      return (
                        <tr key={c._id} style={{ borderBottom: i < categories.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                          <td style={tdStyle()}>{getFamLabel(c.familleId)}</td>
                          <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{c.code}</td>
                          <td style={tdStyle()}>{c.nom_fr}</td>
                          <td style={tdStyle()}>{c.nom_ar || "-"}</td>
                          <td style={tdStyle()}>
                            <ActifInactifCell status={c.status} onToggle={() => toggleCatStatus(c)}>
                              <StatusBadge status={c.status} />
                            </ActifInactifCell>
                          </td>
                          <td style={tdStyle()}><span style={{ background: "#F2EFE8", padding: "2px 10px", borderRadius: 20, fontSize: 12 }}>{nbNats}</span></td>
                          <td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => editCat(c)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteCat(c._id)} message="Êtes-vous sûr de vouloir supprimer cette catégorie ? Les natures et libellés liés seront supprimés." /></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : !showCatForm && <EmptyState message='Aucune catégorie. Cliquez sur "Nouvelle Catégorie" pour commencer.' />}
          </>
        )}

        {/* TAB: NATURES */}
        {tab === "natures" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Natures de Prestation</div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Troisième niveau - appartiennent à une Catégorie</div>
              </div>
              {!showNatForm && <AddBtn onClick={() => setShowNatForm(true)} label="Nouvelle Nature" />}
            </div>

            {categories.length === 0 && <Warning message="Créez d'abord des catégories." />}

            {showNatForm && (
              <FormCard
                title={editNatId ? "Modifier la nature" : "Nouvelle nature"}
                onSave={submitNat}
                onCancel={() => { setShowNatForm(false); setEditNatId(null); setNatForm(emptyNat); }}
                saveLabel={editNatId ? "Mettre à jour" : "Enregistrer"}
              >
                <div><label style={labelStyle}>Catégorie *</label><select value={natForm.categorieId} onChange={e => setNatForm({ ...natForm, categorieId: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{familles.filter(f => f.status === "Actif").map(f => {const cats = categories.filter(c => String(c.familleId) === String(f._id) && c.status === "Actif"); if (cats.length === 0) return null; return <optgroup key={f._id} label={f.nom_fr}>{cats.map(c => <option key={c._id} value={String(c._id)}>{c.code} – {c.nom_fr}</option>)}</optgroup>;})}</select></div>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: NAT001" value={natForm.code} onChange={e => setNatForm({ ...natForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Statut</label><select value={natForm.status} onChange={e => setNatForm({ ...natForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
                <div><label style={labelStyle}>Nom (FR) *</label><input type="text" placeholder="ex: Fournitures de bureau" value={natForm.nom_fr} onChange={e => setNatForm({ ...natForm, nom_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom (AR)</label><input type="text" placeholder="ex: المستلزمات المكتبية" value={natForm.nom_ar} onChange={e => setNatForm({ ...natForm, nom_ar: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Description</label><textarea placeholder="Notes..." value={natForm.description} onChange={e => setNatForm({ ...natForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 60, fontFamily: "'DM Sans', sans-serif" }} /></div>
              </FormCard>
            )}

            {natures.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                      {["Catégorie", "Famille", "Code", "Nom FR", "Nom AR", "Statut", "Libellés", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {natures.map((n, i) => {
                      const cat = categories.find(c => String(c._id) === String(n.categorieId));
                      const nbLibs = libelles.filter(l => String(l.natureId) === String(n._id)).length;
                      return (
                        <tr key={n._id} style={{ borderBottom: i < natures.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                          <td style={tdStyle()}>{getCatLabel(n.categorieId)}</td>
                          <td style={tdStyle()}>{cat ? getFamLabel(cat.familleId) : "-"}</td>
                          <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{n.code}</td>
                          <td style={tdStyle()}>{n.nom_fr}</td>
                          <td style={tdStyle()}>{n.nom_ar || "-"}</td>
                          <td style={tdStyle()}>
                            <ActifInactifCell status={n.status} onToggle={() => toggleNatStatus(n)}>
                              <StatusBadge status={n.status} />
                            </ActifInactifCell>
                          </td>
                          <td style={tdStyle()}><span style={{ background: "#F2EFE8", padding: "2px 10px", borderRadius: 20, fontSize: 12 }}>{nbLibs}</span></td>
                          <td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => editNat(n)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteNat(n._id)} message="Êtes-vous sûr de vouloir supprimer cette nature ? Les libellés liés seront supprimés." /></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : !showNatForm && <EmptyState message='Aucune nature. Cliquez sur "Nouvelle Nature" pour commencer.' />}
          </>
        )}

        {/* TAB: LIBELLES */}
        {tab === "libelles" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Libellés</div>
                <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Quatrième niveau - appartiennent à une Nature</div>
              </div>
              {!showLibForm && <AddBtn onClick={() => setShowLibForm(true)} label="Nouveau Libellé" />}
            </div>

            {natures.length === 0 && <Warning message="Créez d'abord des natures." />}

            {showLibForm && (
              <FormCard
                title={editLibId ? "Modifier le libellé" : "Nouveau libellé"}
                onSave={submitLib}
                onCancel={() => { setShowLibForm(false); setEditLibId(null); setLibForm(emptyLib); }}
                saveLabel={editLibId ? "Mettre à jour" : "Enregistrer"}
              >
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Nature *</label>
                  <select
                    value={libForm.natureId != null && libForm.natureId !== "" ? String(libForm.natureId) : ""}
                    onChange={(e) => setLibForm({ ...libForm, natureId: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    {libelleNatureOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: LIB001" value={libForm.code} onChange={e => setLibForm({ ...libForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Statut</label><select value={libForm.status} onChange={e => setLibForm({ ...libForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
                <div><label style={labelStyle}>Libellé (FR) *</label><input type="text" placeholder="ex: Stylos et crayons" value={libForm.libelle_fr} onChange={e => setLibForm({ ...libForm, libelle_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Libellé (AR)</label><input type="text" placeholder="ex: أقلام" value={libForm.libelle_ar} onChange={e => setLibForm({ ...libForm, libelle_ar: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Description</label><textarea placeholder="Notes..." value={libForm.description} onChange={e => setLibForm({ ...libForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 60, fontFamily: "'DM Sans', sans-serif" }} /></div>
              </FormCard>
            )}

            {libelles.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                      {["Code", "Libellé FR", "Libellé AR", "Nature", "Catégorie", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {libelles.map((l, i) => {
                      const nat = natures.find(n => String(n._id) === String(l.natureId));
                      const cat = nat ? categories.find(c => String(c._id) === String(nat.categorieId)) : null;
                      return (
                        <tr key={l._id} style={{ borderBottom: i < libelles.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                          <td style={tdStyle({ fontWeight: 600, color: "#185FA5" })}>{l.code}</td>
                          <td style={tdStyle()}>{l.libelle_fr}</td>
                          <td style={tdStyle()}>{l.libelle_ar || "-"}</td>
                          <td style={tdStyle()}>{getNatLabel(l.natureId)}</td>
                          <td style={tdStyle()}>{cat ? getCatLabel(cat._id) : "-"}</td>
                          <td style={tdStyle()}>
                            <ActifInactifCell status={l.status} onToggle={() => toggleLibStatus(l)}>
                              <StatusBadge status={l.status} />
                            </ActifInactifCell>
                          </td>
                          <td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => editLib(l)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteLib(l._id)} message="Êtes-vous sûr de vouloir supprimer ce libellé ?" /></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : !showLibForm && <EmptyState message='Aucun libellé. Cliquez sur "Nouveau Libellé" pour commencer.' />}
          </>
        )}
      </div>
    </div>
  );
}
