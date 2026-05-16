import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import DeleteIconButton from "../components/DeleteIconButton";
import ActifInactifCell from "../components/ActifInactifCell";
import { createDefaultBeneficiaryTypes } from "../data/defaultBeneficiaryTypes";

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
    Actif: { bg: "#EAF4E2", color: "#3B6D11" },
    Inactif: { bg: "#F5F0E8", color: "#6B6760" },
  };
  const style = colors[status] || colors.Actif;
  return (
    <span style={{ background: style.bg, color: style.color, padding: "2px 8px", borderRadius: 20, fontSize: 11.5, fontWeight: 500 }}>
      {status}
    </span>
  );
};

const tabs = ["Fournisseurs", "Comptes Bancaires", "Documents"];

const LEGACY_BENEFICIARY_LABEL_TO_CODE = {
  Société: "PM",
  "Auto-entrepreneur": "AE",
  "Personne physique": "PP",
  Coopérative: "COOP",
  Association: "ASSOC",
  Administration: "ADMIN",
  "Établissement public": "EP",
};

function seedBeneficiaryTypesIfMissing() {
  if (localStorage.getItem("beneficiaryTypes") !== null) return;
  const defaults = createDefaultBeneficiaryTypes(Date.now());
  localStorage.setItem("beneficiaryTypes", JSON.stringify(defaults));
}

function resolveBeneficiaryTypeId(supplier, types) {
  if (!types.length) return "";
  const byStoredId = supplier.beneficiary_type_id && types.find((t) => String(t._id) === String(supplier.beneficiary_type_id));
  if (byStoredId) return String(byStoredId._id);
  const legacyCode = LEGACY_BENEFICIARY_LABEL_TO_CODE[supplier.beneficiary_type];
  if (legacyCode) {
    const t = types.find((x) => x.code === legacyCode);
    if (t) return String(t._id);
  }
  const byName = types.find((t) => t.name_fr === supplier.beneficiary_type);
  if (byName) return String(byName._id);
  const first = types.find((t) => t.status === "Actif") || types[0];
  return first ? String(first._id) : "";
}

const getExpiryColor = (expiry) => {
  if (!expiry) return "#F6F5F2";
  const days = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "#FDEDED";
  if (days <= 30) return "#FFF3CD";
  return "#EAF4E2";
};

export default function GestionFournisseurs() {
  const [activeTab, setActiveTab] = useState("Fournisseurs");
  const [suppliers, setSuppliers] = useState([]);
  const [supplierForm, setSupplierForm] = useState({
    code: "", beneficiary_type_id: "", company_name: "", trade_name: "", ice: "", if_number: "", rc_number: "", cnss_number: "", cin: "", phone: "", email: "", address: "", city: "", country: "Maroc", is_subject_to_vat: false, vat_rate_id: "", is_subject_to_ras: false, ras_rate_id: "", status: "Actif",
  });
  const [editSupplierId, setEditSupplierId] = useState(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [vatRates, setVatRates] = useState([]);
  const [rasRates, setRasRates] = useState([]);
  const [beneficiaryTypes, setBeneficiaryTypes] = useState([]);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankAccountForm, setBankAccountForm] = useState({ supplier_id: "", bank_name: "", account_number: "", iban: "", swift: "", currency: "MAD", status: "Actif" });
  const [editBankAccountId, setEditBankAccountId] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [documentForm, setDocumentForm] = useState({ supplier_id: "", document_type: "", document_name: "", issue_date: "", expiry_date: "" });
  const [editDocumentId, setEditDocumentId] = useState(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);

  useEffect(() => {
    seedBeneficiaryTypesIfMissing();
    const bt = JSON.parse(localStorage.getItem("beneficiaryTypes") || "[]");
    setBeneficiaryTypes(bt);

    const storedSuppliers = localStorage.getItem("fournisseurs");
    if (storedSuppliers) {
      const parsed = JSON.parse(storedSuppliers);
      let migrated = false;
      const normalized = parsed.map((s) => {
        const id = resolveBeneficiaryTypeId(s, bt);
        const sel = bt.find((t) => String(t._id) === id);
        const next = {
          ...s,
          beneficiary_type_id: id,
          beneficiary_type: sel?.name_fr || s.beneficiary_type,
        };
        if (String(s.beneficiary_type_id || "") !== id) migrated = true;
        return next;
      });
      setSuppliers(normalized);
      if (migrated) localStorage.setItem("fournisseurs", JSON.stringify(normalized));
    }
    const vat = localStorage.getItem("vatRates");
    const ras = localStorage.getItem("rasRates");
    const banks = localStorage.getItem("supplierBankAccounts");
    const docs = localStorage.getItem("supplierDocuments");
    if (vat) setVatRates(JSON.parse(vat));
    if (ras) setRasRates(JSON.parse(ras));
    if (banks) setBankAccounts(JSON.parse(banks));
    if (docs) setDocuments(JSON.parse(docs));
  }, []);

  const defaultBeneficiaryTypeId = () => {
    const first = beneficiaryTypes.find((t) => t.status === "Actif");
    return first ? String(first._id) : "";
  };

  const emptySupplierForm = () => ({
    code: "",
    beneficiary_type_id: defaultBeneficiaryTypeId(),
    company_name: "",
    trade_name: "",
    ice: "",
    if_number: "",
    rc_number: "",
    cnss_number: "",
    cin: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "Maroc",
    is_subject_to_vat: false,
    vat_rate_id: "",
    is_subject_to_ras: false,
    ras_rate_id: "",
    status: "Actif",
  });

  const saveSuppliers = (list) => { setSuppliers(list); localStorage.setItem("fournisseurs", JSON.stringify(list)); };
  const saveBankAccounts = (list) => { setBankAccounts(list); localStorage.setItem("supplierBankAccounts", JSON.stringify(list)); };
  const saveDocuments = (list) => { setDocuments(list); localStorage.setItem("supplierDocuments", JSON.stringify(list)); };

  const getSupplierLabel = (id) => suppliers.find(s => String(s._id) === String(id))?.company_name || "-";

  const submitSupplier = () => {
    if (!supplierForm.company_name.trim() || !supplierForm.code.trim() || !supplierForm.ice.trim()) return;
    if (beneficiaryTypes.length > 0 && !supplierForm.beneficiary_type_id) {
      alert("Sélectionnez un type de bénéficiaire (Paramétrage réglementaire → Types bénéficiaires).");
      return;
    }
    if (!editSupplierId && suppliers.some(s => s.ice === supplierForm.ice)) { alert("ICE déjà utilisé!"); return; }
    if (!editSupplierId && suppliers.some(s => s.code === supplierForm.code)) { alert("Code fournisseur déjà utilisé!"); return; }

    const selType = beneficiaryTypes.find((t) => String(t._id) === String(supplierForm.beneficiary_type_id));
    const entry = {
      ...supplierForm,
      beneficiary_type: selType?.name_fr || "",
      _id: editSupplierId || Date.now(),
    };
    if (editSupplierId) {
      saveSuppliers(suppliers.map(s => s._id === editSupplierId ? entry : s));
      setEditSupplierId(null);
    } else {
      saveSuppliers([...suppliers, entry]);
    }
    setSupplierForm(emptySupplierForm());
    setShowSupplierForm(false);
  };

  const editSupplier = (supplier) => { setSupplierForm(supplier); setEditSupplierId(supplier._id); setShowSupplierForm(true); setActiveTab("Fournisseurs"); };
  const deleteSupplier = (_id) => { saveSuppliers(suppliers.filter(s => s._id !== _id)); };

  const submitBankAccount = () => {
    if (!bankAccountForm.supplier_id || !bankAccountForm.bank_name || !bankAccountForm.account_number) return;
    const entry = { ...bankAccountForm, _id: editBankAccountId || Date.now() };
    if (editBankAccountId) {
      saveBankAccounts(bankAccounts.map(a => a._id === editBankAccountId ? entry : a));
      setEditBankAccountId(null);
    } else {
      saveBankAccounts([...bankAccounts, entry]);
    }
    setBankAccountForm({ supplier_id: "", bank_name: "", account_number: "", iban: "", swift: "", currency: "MAD", status: "Actif" });
    setShowBankForm(false);
  };

  const editBankAccount = (account) => { setBankAccountForm(account); setEditBankAccountId(account._id); setShowBankForm(true); setActiveTab("Comptes Bancaires"); };
  const deleteBankAccount = (_id) => saveBankAccounts(bankAccounts.filter(a => a._id !== _id));

  const submitDocument = () => {
    if (!documentForm.supplier_id || !documentForm.document_type || !documentForm.document_name) return;
    const entry = { ...documentForm, _id: editDocumentId || Date.now() };
    if (editDocumentId) {
      saveDocuments(documents.map(d => d._id === editDocumentId ? entry : d));
      setEditDocumentId(null);
    } else {
      saveDocuments([...documents, entry]);
    }
    setDocumentForm({ supplier_id: "", document_type: "", document_name: "", issue_date: "", expiry_date: "" });
    setShowDocumentForm(false);
  };

  const editDocument = (doc) => { setDocumentForm(doc); setEditDocumentId(doc._id); setShowDocumentForm(true); setActiveTab("Documents"); };
  const deleteDocument = (_id) => saveDocuments(documents.filter(d => d._id !== _id));

  const flipActif = (s) => (s === "Actif" ? "Inactif" : "Actif");
  const toggleSupplierStatus = (supplier) =>
    saveSuppliers(suppliers.map((s) => (s._id === supplier._id ? { ...s, status: flipActif(s.status) } : s)));
  const toggleBankAccountStatus = (account) =>
    saveBankAccounts(bankAccounts.map((a) => (a._id === account._id ? { ...a, status: flipActif(a.status) } : a)));

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Topbar title="Gestion des Fournisseurs" />
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#F6F5F2" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Fournisseurs</div>
            <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Gérez les fournisseurs, leurs comptes bancaires et documents.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "8px 14px", borderRadius: 8,
                border: activeTab === tab ? "1px solid #1A1917" : "1px solid #DDD9D0",
                background: activeTab === tab ? "#1A1917" : "#FEFCF9",
                color: activeTab === tab ? "#F5F0E8" : "#6B6760",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12.5,
              }}>{tab}</button>
            ))}
          </div>
        </div>

        {activeTab === "Fournisseurs" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13.5, color: "#6B6760" }}>{suppliers.length} fournisseur{suppliers.length > 1 ? "s" : ""}</div>
              {!showSupplierForm && <AddBtn onClick={() => { setShowSupplierForm(true); setEditSupplierId(null); setSupplierForm(emptySupplierForm()); }} label="Nouveau Fournisseur" />}
            </div>

            {showSupplierForm && (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A1917", marginBottom: 20 }}>{editSupplierId ? "Modifier le fournisseur" : "Nouveau fournisseur"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: FRN001" value={supplierForm.code} onChange={e => setSupplierForm({ ...supplierForm, code: e.target.value })} style={inputStyle} /></div>
                  <div style={{ gridColumn: beneficiaryTypes.length === 0 ? "1 / -1" : undefined }}>
                    <label style={labelStyle}>Type de bénéficiaire</label>
                    {beneficiaryTypes.length === 0 ? (
                      <div style={{ ...inputStyle, color: "#854F0B", background: "#FAEEDA", border: "0.5px solid #F5D99A" }}>Aucun type configuré. Ajoutez-en dans Paramétrage réglementaire → Types bénéficiaires.</div>
                    ) : (
                      <select value={supplierForm.beneficiary_type_id} onChange={e => setSupplierForm({ ...supplierForm, beneficiary_type_id: e.target.value })} style={inputStyle}>
                        <option value="">-- Sélectionner --</option>
                        {(() => {
                          const actifs = beneficiaryTypes.filter((t) => t.status === "Actif");
                          const cur = beneficiaryTypes.find((t) => String(t._id) === String(supplierForm.beneficiary_type_id));
                          const opts = [...actifs];
                          if (cur && cur.status !== "Actif" && !opts.some((t) => String(t._id) === String(cur._id))) opts.unshift(cur);
                          return opts.map((t) => <option key={t._id} value={String(t._id)}>{t.name_fr} ({t.code}){t.status !== "Actif" ? " — Inactif" : ""}</option>);
                        })()}
                      </select>
                    )}
                  </div>
                  <div><label style={labelStyle}>Raison sociale *</label><input type="text" value={supplierForm.company_name} onChange={e => setSupplierForm({ ...supplierForm, company_name: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Nom commercial</label><input type="text" value={supplierForm.trade_name} onChange={e => setSupplierForm({ ...supplierForm, trade_name: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>ICE *</label><input type="text" value={supplierForm.ice} onChange={e => setSupplierForm({ ...supplierForm, ice: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>IF</label><input type="text" value={supplierForm.if_number} onChange={e => setSupplierForm({ ...supplierForm, if_number: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>RC</label><input type="text" value={supplierForm.rc_number} onChange={e => setSupplierForm({ ...supplierForm, rc_number: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>CNSS</label><input type="text" value={supplierForm.cnss_number} onChange={e => setSupplierForm({ ...supplierForm, cnss_number: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>CIN</label><input type="text" value={supplierForm.cin} onChange={e => setSupplierForm({ ...supplierForm, cin: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Téléphone</label><input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Email</label><input type="text" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Adresse</label><input type="text" value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Ville</label><input type="text" value={supplierForm.city} onChange={e => setSupplierForm({ ...supplierForm, city: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Pays</label><input type="text" value={supplierForm.country} onChange={e => setSupplierForm({ ...supplierForm, country: e.target.value })} style={inputStyle} /></div>
                  <div><label style={{ ...labelStyle, marginBottom: 8 }}><input type="checkbox" checked={supplierForm.is_subject_to_vat} onChange={e => setSupplierForm({ ...supplierForm, is_subject_to_vat: e.target.checked })} style={{ marginRight: 8 }} />Assujetti à la TVA</label></div>
                  {supplierForm.is_subject_to_vat && <div><label style={labelStyle}>Taux TVA</label><select value={supplierForm.vat_rate_id} onChange={e => setSupplierForm({ ...supplierForm, vat_rate_id: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{vatRates.filter(v => v.status === "Actif").map(v => <option key={v._id} value={String(v._id)}>{v.code} - {v.label_fr}</option>)}</select></div>}
                  <div><label style={{ ...labelStyle, marginBottom: 8 }}><input type="checkbox" checked={supplierForm.is_subject_to_ras} onChange={e => setSupplierForm({ ...supplierForm, is_subject_to_ras: e.target.checked })} style={{ marginRight: 8 }} />Assujetti au RAS</label></div>
                  {supplierForm.is_subject_to_ras && <div><label style={labelStyle}>Taux RAS</label><select value={supplierForm.ras_rate_id} onChange={e => setSupplierForm({ ...supplierForm, ras_rate_id: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{rasRates.filter(r => r.status === "Actif").map(r => <option key={r._id} value={String(r._id)}>{r.code} - {r.label_fr}</option>)}</select></div>}
                  <div><label style={labelStyle}>Statut</label><select value={supplierForm.status} onChange={e => setSupplierForm({ ...supplierForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={submitSupplier} style={{ background: "#1A1917", color: "#F5F0E8", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500 }}>{editSupplierId ? "Mettre à jour" : "Enregistrer"}</button>
                  <button onClick={() => { setShowSupplierForm(false); setEditSupplierId(null); setSupplierForm(emptySupplierForm()); }} style={{ background: "transparent", color: "#6B6760", border: "0.5px solid #DDD9D0", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>Annuler</button>
                </div>
              </div>
            )}

            {suppliers.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                      {['Code', 'Raison sociale', 'ICE', 'Téléphone', 'Statut', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier, i) => (
                      <tr key={supplier._id} style={{ borderBottom: i < suppliers.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                        <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{supplier.code}</td>
                        <td style={tdStyle()}>{supplier.company_name}</td>
                        <td style={tdStyle()}>{supplier.ice}</td>
                        <td style={tdStyle()}>{supplier.phone || "-"}</td>
                        <td style={tdStyle()}><ActifInactifCell status={supplier.status} onToggle={() => toggleSupplierStatus(supplier)}><StatusBadge status={supplier.status} /></ActifInactifCell></td>
                        <td style={tdStyle()}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button onClick={() => editSupplier(supplier)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button>
                            <DeleteIconButton onConfirm={() => deleteSupplier(supplier._id)} message="Êtes-vous sûr de vouloir supprimer ce fournisseur ?" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !showSupplierForm && <EmptyState message="Aucun fournisseur. Cliquez sur 'Nouveau Fournisseur' pour commencer." />}
          </>
        )}

        {activeTab === "Comptes Bancaires" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13.5, color: "#6B6760" }}>{bankAccounts.length} compte{bankAccounts.length > 1 ? "s" : ""} bancaire{bankAccounts.length > 1 ? "s" : ""}</div>
              {!showBankForm && <AddBtn onClick={() => { setShowBankForm(true); setEditBankAccountId(null); setBankAccountForm({ supplier_id: "", bank_name: "", account_number: "", iban: "", swift: "", currency: "MAD", status: "Actif" }); }} label="Nouveau compte" />}
            </div>

            {showBankForm && (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A1917", marginBottom: 20 }}>{editBankAccountId ? "Modifier le compte bancaire" : "Nouveau compte bancaire"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Fournisseur</label>
                    <select value={bankAccountForm.supplier_id} onChange={e => setBankAccountForm({ ...bankAccountForm, supplier_id: e.target.value })} style={inputStyle}>
                      <option value="">-- Sélectionner --</option>
                      {suppliers.map(s => <option key={s._id} value={String(s._id)}>{s.company_name}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Banque</label><input type="text" value={bankAccountForm.bank_name} onChange={e => setBankAccountForm({ ...bankAccountForm, bank_name: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Numéro de compte</label><input type="text" value={bankAccountForm.account_number} onChange={e => setBankAccountForm({ ...bankAccountForm, account_number: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>IBAN</label><input type="text" value={bankAccountForm.iban} onChange={e => setBankAccountForm({ ...bankAccountForm, iban: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>SWIFT</label><input type="text" value={bankAccountForm.swift} onChange={e => setBankAccountForm({ ...bankAccountForm, swift: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Devise</label><input type="text" value={bankAccountForm.currency} onChange={e => setBankAccountForm({ ...bankAccountForm, currency: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Statut</label><select value={bankAccountForm.status} onChange={e => setBankAccountForm({ ...bankAccountForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={submitBankAccount} style={{ background: "#1A1917", color: "#F5F0E8", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500 }}>{editBankAccountId ? "Mettre à jour" : "Enregistrer"}</button>
                  <button onClick={() => { setShowBankForm(false); setEditBankAccountId(null); setBankAccountForm({ supplier_id: "", bank_name: "", account_number: "", iban: "", swift: "", currency: "MAD", status: "Actif" }); }} style={{ background: "transparent", color: "#6B6760", border: "0.5px solid #DDD9D0", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>Annuler</button>
                </div>
              </div>
            )}

            {bankAccounts.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                      {['Fournisseur', 'Banque', 'Compte', 'IBAN', 'SWIFT', 'Devise', 'Statut', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {bankAccounts.map((account, i) => (
                      <tr key={account._id} style={{ borderBottom: i < bankAccounts.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                        <td style={tdStyle()}>{getSupplierLabel(account.supplier_id)}</td>
                        <td style={tdStyle()}>{account.bank_name}</td>
                        <td style={tdStyle()}>{account.account_number}</td>
                        <td style={tdStyle()}>{account.iban || "-"}</td>
                        <td style={tdStyle()}>{account.swift || "-"}</td>
                        <td style={tdStyle()}>{account.currency}</td>
                        <td style={tdStyle()}><ActifInactifCell status={account.status} onToggle={() => toggleBankAccountStatus(account)}><StatusBadge status={account.status} /></ActifInactifCell></td>
                        <td style={tdStyle()}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button onClick={() => editBankAccount(account)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button>
                            <DeleteIconButton onConfirm={() => deleteBankAccount(account._id)} message="Êtes-vous sûr de vouloir supprimer ce compte bancaire ?" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !showBankForm && <EmptyState message="Aucun compte bancaire. Cliquez sur 'Nouveau compte' pour commencer." />}
          </>
        )}

        {activeTab === "Documents" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13.5, color: "#6B6760" }}>{documents.length} document{documents.length > 1 ? "s" : ""}</div>
              {!showDocumentForm && <AddBtn onClick={() => { setShowDocumentForm(true); setEditDocumentId(null); setDocumentForm({ supplier_id: "", document_type: "", document_name: "", issue_date: "", expiry_date: "" }); }} label="Nouveau document" />}
            </div>

            {showDocumentForm && (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A1917", marginBottom: 20 }}>{editDocumentId ? "Modifier le document" : "Nouveau document"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Fournisseur</label>
                    <select value={documentForm.supplier_id} onChange={e => setDocumentForm({ ...documentForm, supplier_id: e.target.value })} style={inputStyle}>
                      <option value="">-- Sélectionner --</option>
                      {suppliers.map(s => <option key={s._id} value={String(s._id)}>{s.company_name}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Type de document</label><input type="text" value={documentForm.document_type} onChange={e => setDocumentForm({ ...documentForm, document_type: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Nom du document</label><input type="text" value={documentForm.document_name} onChange={e => setDocumentForm({ ...documentForm, document_name: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Date d'émission</label><input type="date" value={documentForm.issue_date} onChange={e => setDocumentForm({ ...documentForm, issue_date: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Date d'expiration</label><input type="date" value={documentForm.expiry_date} onChange={e => setDocumentForm({ ...documentForm, expiry_date: e.target.value })} style={inputStyle} /></div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={submitDocument} style={{ background: "#1A1917", color: "#F5F0E8", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500 }}>{editDocumentId ? "Mettre à jour" : "Enregistrer"}</button>
                  <button onClick={() => { setShowDocumentForm(false); setEditDocumentId(null); setDocumentForm({ supplier_id: "", document_type: "", document_name: "", issue_date: "", expiry_date: "" }); }} style={{ background: "transparent", color: "#6B6760", border: "0.5px solid #DDD9D0", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>Annuler</button>
                </div>
              </div>
            )}

            {documents.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>
                      {['Fournisseur', 'Type', 'Nom', 'Émis', 'Expire', 'Statut', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc, i) => {
                      const expiryColor = getExpiryColor(doc.expiry_date);
                      const daysLeft = doc.expiry_date ? Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                      return (
                        <tr key={doc._id} style={{ borderBottom: i < documents.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                          <td style={tdStyle()}>{getSupplierLabel(doc.supplier_id)}</td>
                          <td style={tdStyle()}>{doc.document_type}</td>
                          <td style={tdStyle()}>{doc.document_name}</td>
                          <td style={tdStyle()}>{doc.issue_date || "-"}</td>
                          <td style={tdStyle()}>{doc.expiry_date || "-"}</td>
                          <td style={tdStyle()}>
                            <span style={{ background: expiryColor, borderRadius: 12, padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: expiryColor === "#FDEDED" ? "#D9534F" : expiryColor === "#FFF3CD" ? "#E0A800" : "#3B6D11" }} />
                              {daysLeft === null ? "Sans date" : daysLeft < 0 ? `Expiré (${Math.abs(daysLeft)}j)` : `${daysLeft}j restants`}
                            </span>
                          </td>
                          <td style={tdStyle()}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <button onClick={() => editDocument(doc)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button>
                              <DeleteIconButton onConfirm={() => deleteDocument(doc._id)} message="Êtes-vous sûr de vouloir supprimer ce document ?" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : !showDocumentForm && <EmptyState message="Aucun document. Cliquez sur 'Nouveau document' pour commencer." />}
          </>
        )}
      </div>
    </div>
  );
}
