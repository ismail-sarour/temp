import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import DeleteIconButton from "../components/DeleteIconButton";
import ActifInactifCell from "../components/ActifInactifCell";
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function ParametrageReglementaire() {
  const [tab, setTab] = useState("tva");

  // STATE FOR ALL SECTIONS
  const [vatRates, setVatRates] = useState([]);
  const [rasRates, setRasRates] = useState([]);
  const [taxRules, setTaxRules] = useState([]);
  const [nomenclatureTaxRules, setNomenclatureTaxRules] = useState([]);
  const [procurementMethods, setProcurementMethods] = useState([]);
  const [procurementThresholds, setProcurementThresholds] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [financialInstitutions, setFinancialInstitutions] = useState([]);
  const [procurementRequiredDocs, setProcurementRequiredDocs] = useState([]);
  const [operationStatuses, setOperationStatuses] = useState([]);
  const [beneficiaryTypes, setBeneficiaryTypes] = useState([]);
  const [beneficiaryTaxRules, setBeneficiaryTaxRules] = useState([]);

  const [tvaForm, setTvaForm] = useState({ code: "", label_fr: "", rate: "", is_default: false, status: "Actif" });
  const [editTvaId, setEditTvaId] = useState(null);
  const [showTvaForm, setShowTvaForm] = useState(false);
  const [rasForm, setRasForm] = useState({ code: "", label_fr: "", rate: "", calculation_base: "HT", status: "Actif" });
  const [editRasId, setEditRasId] = useState(null);
  const [showRasForm, setShowRasForm] = useState(false);
  const [taxRuleForm, setTaxRuleForm] = useState({ code: "", name_fr: "", applies_vat: false, vat_rate_id: "", applies_ras: false, ras_rate_id: "", is_default: false, status: "Actif" });
  const [editTaxRuleId, setEditTaxRuleId] = useState(null);
  const [showTaxRuleForm, setShowTaxRuleForm] = useState(false);
  const [nomTaxForm, setNomTaxForm] = useState({ niveau: "", target_id: "", tax_rule_id: "", start_date: "", end_date: "", status: "Actif" });
  const [editNomTaxId, setEditNomTaxId] = useState(null);
  const [showNomTaxForm, setShowNomTaxForm] = useState(false);
  const [pmForm, setPmForm] = useState({ code: "", name_fr: "", name_ar: "", status: "Actif" });
  const [editPmId, setEditPmId] = useState(null);
  const [showPmForm, setShowPmForm] = useState(false);
  const [thresholdForm, setThresholdForm] = useState({
    exercice_id: "", procurement_method_id: "", min_amount: "", max_amount: "", amount_type: "HT",
    threshold_scope: "", controle: "", status: "Actif",
  });
  const [editThresholdId, setEditThresholdId] = useState(null);
  const [showThresholdForm, setShowThresholdForm] = useState(false);
  const [exercices, setExercices] = useState([]);
  const [payForm, setPayForm] = useState({ code: "", name_fr: "", name_ar: "", requires_bank_account: false, status: "Actif" });
  const [editPayId, setEditPayId] = useState(null);
  const [showPayForm, setShowPayForm] = useState(false);
  const [finForm, setFinForm] = useState({ code: "", name_fr: "", name_ar: "", institution_type: "Banque", city: "", address: "", status: "Actif" });
  const [editFinId, setEditFinId] = useState(null);
  const [showFinForm, setShowFinForm] = useState(false);
  const [reqDocForm, setReqDocForm] = useState({ procurement_method_id: "", document_type_id: "", is_required: true, display_order: "0" });
  const [editReqDocId, setEditReqDocId] = useState(null);
  const [showReqDocForm, setShowReqDocForm] = useState(false);
  const [opStatForm, setOpStatForm] = useState({
    code: "", name_fr: "", name_ar: "", status_group: "draft", display_order: "1", is_final: false, status: "Actif",
  });
  const [editOpStatId, setEditOpStatId] = useState(null);
  const [showOpStatForm, setShowOpStatForm] = useState(false);
  const [benTypeForm, setBenTypeForm] = useState({ code: "", name_fr: "", name_ar: "", status: "Actif" });
  const [editBenTypeId, setEditBenTypeId] = useState(null);
  const [showBenTypeForm, setShowBenTypeForm] = useState(false);
  const [benTaxForm, setBenTaxForm] = useState({
    beneficiary_type_id: "", is_vat_applicable: true, is_ras_applicable: false, vat_rate_id: "", ras_rate_id: "", status: "Actif",
  });
  const [editBenTaxId, setEditBenTaxId] = useState(null);
  const [showBenTaxForm, setShowBenTaxForm] = useState(false);
  const [docForm, setDocForm] = useState({ code: "", name_fr: "", name_ar: "", is_required: false, status: "Actif" });
  const [editDocId, setEditDocId] = useState(null);
  const [showDocForm, setShowDocForm] = useState(false);

  // LOAD FROM DATA STORE
  useEffect(() => {
    const vat = getData("vatRates");
    const ras = getData("rasRates");
    const tax = getData("taxRules");
    const nomTax = getData("nomenclatureTaxRules");
    const pm = getData("procurementMethods");
    const pt = getData("procurementThresholds");
    const dt = getData("documentTypes");
    const pay = getData("paymentMethods");
    const fin = getData("financialInstitutions");
    const prd = getData("procurementRequiredDocs");
    const ops = getData("operationStatuses");
    const bt = getData("beneficiaryTypes");
    const btr = getData("beneficiaryTaxRules");

    setVatRates((vat || []).map((v) => { const { start_date, end_date, ...rest } = v; return rest; }));
    setRasRates((ras || []).map((r) => { const { start_date, end_date, ...rest } = r; return rest; }));
    setTaxRules(tax || []);
    setNomenclatureTaxRules(nomTax || []);
    setProcurementMethods(pm || []);
    setProcurementThresholds(
      (pt || []).map((t) => ({
        ...t,
        threshold_scope: t.threshold_scope ?? "",
        controle: t.controle ?? "",
      })),
    );
    setDocumentTypes((dt || []).map((d) => ({ ...d, name_ar: d.name_ar ?? "" })));
    setPaymentMethods(pay || []);
    setFinancialInstitutions(fin || []);
    setProcurementRequiredDocs(prd || []);
    setOperationStatuses(ops || []);
    setBeneficiaryTypes(bt || []);
    setBeneficiaryTaxRules(btr || []);
    setExercices(getData("exercices", []));
  }, []);

  // INITIALIZE DEFAULTS
  useEffect(() => {
    if (getData("procurementMethods", []).length === 0) {
      const defaults = [
        { _id: Date.now() + 1, code: "BC", name_fr: "Bon de commande", name_ar: "أمر شراء", status: "Actif" },
        { _id: Date.now() + 2, code: "MAR", name_fr: "Marché", name_ar: "العطاء", status: "Actif" },
        { _id: Date.now() + 3, code: "CONV", name_fr: "Convention", name_ar: "اتفاقية", status: "Actif" },
        { _id: Date.now() + 4, code: "REGIE", name_fr: "Régie", name_ar: "رقابة", status: "Actif" },
      ];
      setProcurementMethods(defaults);
      setData("procurementMethods", defaults);
    }
    if (getData("documentTypes", []).length === 0) {
      const defaults = [
        { _id: Date.now() + 11, code: "FACTURE", name_fr: "Facture", name_ar: "فاتورة", is_required: true, status: "Actif" },
        { _id: Date.now() + 12, code: "DEVIS", name_fr: "Devis", name_ar: "عرض أسعار", is_required: false, status: "Actif" },
        { _id: Date.now() + 13, code: "PV", name_fr: "Procès-verbal", name_ar: "محضر", is_required: false, status: "Actif" },
        { _id: Date.now() + 14, code: "BL", name_fr: "Bon de livraison", name_ar: "وصل التسليم", is_required: false, status: "Actif" },
        { _id: Date.now() + 15, code: "RIB", name_fr: "RIB", name_ar: "ر.ب.ب", is_required: true, status: "Actif" },
        { _id: Date.now() + 16, code: "ATTEST_FISC", name_fr: "Attestation fiscale", name_ar: "شهادة ضريبية", is_required: true, status: "Actif" },
        { _id: Date.now() + 17, code: "CNSS", name_fr: "CNSS", name_ar: "الضمان الاجتماعي", is_required: true, status: "Actif" },
      ];
      setDocumentTypes(defaults);
      setData("documentTypes", defaults);
    }
    if (getData("paymentMethods", []).length === 0) {
      const defaults = [
        { _id: Date.now() + 20, code: "VIR", name_fr: "Virement", name_ar: "تحويل بنكي", requires_bank_account: true, status: "Actif" },
        { _id: Date.now() + 21, code: "CHQ", name_fr: "Chèque", name_ar: "شيك", requires_bank_account: false, status: "Actif" },
        { _id: Date.now() + 22, code: "ESP", name_fr: "Espèces", name_ar: "نقداً", requires_bank_account: false, status: "Actif" },
      ];
      setPaymentMethods(defaults);
      setData("paymentMethods", defaults);
    }
    if (getData("financialInstitutions", []).length === 0) {
      const defaults = [
        { _id: Date.now() + 30, code: "TGR", name_fr: "Trésorerie Générale du Royaume", name_ar: "الخزينة العامة للمملكة", institution_type: "TGR", city: "Rabat", address: "", status: "Actif" },
        { _id: Date.now() + 31, code: "BANK_DEMO", name_fr: "Banque (exemple)", name_ar: "بنك (مثال)", institution_type: "Banque", city: "", address: "", status: "Actif" },
      ];
      setFinancialInstitutions(defaults);
      setData("financialInstitutions", defaults);
    }
    if (getData("operationStatuses", []).length === 0) {
      const ts = Date.now();
      const defaults = [
        { _id: ts + 1, code: "DRAFT", name_fr: "Brouillon", name_ar: "مسودة", status_group: "draft", display_order: 1, is_final: false, status: "Actif" },
        { _id: ts + 2, code: "CREATED", name_fr: "Créé", name_ar: "مُنشأ", status_group: "validation", display_order: 2, is_final: false, status: "Actif" },
        { _id: ts + 3, code: "PUBLISHED", name_fr: "Publié", name_ar: "منشور", status_group: "execution", display_order: 3, is_final: false, status: "Actif" },
        { _id: ts + 4, code: "AWARDED", name_fr: "Attribué", name_ar: "مُسند", status_group: "execution", display_order: 4, is_final: false, status: "Actif" },
        { _id: ts + 5, code: "IN_EXECUTION", name_fr: "En cours d'exécution", name_ar: "قيد التنفيذ", status_group: "execution", display_order: 5, is_final: false, status: "Actif" },
        { _id: ts + 6, code: "COMPLETED", name_fr: "Terminé", name_ar: "منتهي", status_group: "closed", display_order: 6, is_final: true, status: "Actif" },
        { _id: ts + 7, code: "CANCELLED", name_fr: "Annulé", name_ar: "ملغى", status_group: "cancelled", display_order: 99, is_final: true, status: "Actif" },
      ];
      setOperationStatuses(defaults);
      setData("operationStatuses", defaults);
    }
    if (getData("beneficiaryTypes", []).length === 0) {
      const defaults = [];
      setBeneficiaryTypes(defaults);
      setData("beneficiaryTypes", defaults);
    }
  }, []);

  const saveTaxRates = (list) => { setVatRates(list); setData("vatRates", list); };
  const saveRasRates = (list) => { setRasRates(list); setData("rasRates", list); };
  const saveTaxRules = (list) => { setTaxRules(list); setData("taxRules", list); };
  const saveNomenclatureTaxRules = (list) => { setNomenclatureTaxRules(list); setData("nomenclatureTaxRules", list); };
  const saveProcurementMethods = (list) => { setProcurementMethods(list); setData("procurementMethods", list); };
  const saveProcurementThresholds = (list) => { setProcurementThresholds(list); setData("procurementThresholds", list); };
  const saveDocumentTypes = (list) => { setDocumentTypes(list); setData("documentTypes", list); };
  const savePaymentMethods = (list) => { setPaymentMethods(list); setData("paymentMethods", list); };
  const saveFinancialInstitutions = (list) => { setFinancialInstitutions(list); setData("financialInstitutions", list); };
  const saveProcurementRequiredDocs = (list) => { setProcurementRequiredDocs(list); setData("procurementRequiredDocs", list); };
  const saveOperationStatuses = (list) => { setOperationStatuses(list); setData("operationStatuses", list); };
  const saveBeneficiaryTypes = (list) => { setBeneficiaryTypes(list); setData("beneficiaryTypes", list); };
  const saveBeneficiaryTaxRules = (list) => { setBeneficiaryTaxRules(list); setData("beneficiaryTaxRules", list); };

  const flipActif = (s) => (s === "Actif" ? "Inactif" : "Actif");
  const toggleVatStatus = (v) => saveTaxRates(vatRates.map((x) => (x._id === v._id ? { ...x, status: flipActif(x.status) } : x)));
  const toggleRasStatus = (r) => saveRasRates(rasRates.map((x) => (x._id === r._id ? { ...x, status: flipActif(x.status) } : x)));
  const toggleTaxRuleStatus = (t) => saveTaxRules(taxRules.map((x) => (x._id === t._id ? { ...x, status: flipActif(x.status) } : x)));
  const toggleNomTaxStatus = (n) => saveNomenclatureTaxRules(nomenclatureTaxRules.map((x) => (x._id === n._id ? { ...x, status: flipActif(x.status) } : x)));
  const togglePmStatus = (p) => saveProcurementMethods(procurementMethods.map((x) => (x._id === p._id ? { ...x, status: flipActif(x.status) } : x)));
  const toggleThresholdStatus = (t) => saveProcurementThresholds(procurementThresholds.map((x) => (x._id === t._id ? { ...x, status: flipActif(x.status) } : x)));
  const toggleDocTypeStatus = (d) => saveDocumentTypes(documentTypes.map((x) => (x._id === d._id ? { ...x, status: flipActif(x.status) } : x)));
  const togglePayStatus = (p) => savePaymentMethods(paymentMethods.map((x) => (x._id === p._id ? { ...x, status: flipActif(x.status) } : x)));
  const toggleFinStatus = (f) => saveFinancialInstitutions(financialInstitutions.map((x) => (x._id === f._id ? { ...x, status: flipActif(x.status) } : x)));
  const toggleOpStatStatus = (s) => saveOperationStatuses(operationStatuses.map((x) => (x._id === s._id ? { ...x, status: flipActif(x.status) } : x)));
  const toggleBenTypeStatus = (b) => saveBeneficiaryTypes(beneficiaryTypes.map((x) => (x._id === b._id ? { ...x, status: flipActif(x.status) } : x)));
  const toggleBenTaxStatus = (r) => saveBeneficiaryTaxRules(beneficiaryTaxRules.map((x) => (x._id === r._id ? { ...x, status: flipActif(x.status) } : x)));

  // ═════════════════════════════════════════════════════════════════
  // TAB 1: TAUX TVA
  // ═════════════════════════════════════════════════════════════════
  const submitTva = () => {
    if (!tvaForm.code?.trim() || !tvaForm.label_fr?.trim() || tvaForm.rate === "") return;
    if (!editTvaId && vatRates.some(v => v.code === tvaForm.code)) { alert("Ce code TVA existe déjà!"); return; }

    const { start_date: _sd, end_date: _ed, ...tvaRest } = tvaForm;
    const entry = { ...tvaRest, rate: Number(tvaForm.rate), _id: editTvaId || Date.now() };
    if (tvaForm.is_default) saveTaxRates(vatRates.map(v => ({ ...v, is_default: false })));
    if (editTvaId) {
      saveTaxRates(vatRates.map(v => v._id === editTvaId ? entry : v));
      setEditTvaId(null);
    } else {
      saveTaxRates([...vatRates, entry]);
    }
    setTvaForm({ code: "", label_fr: "", rate: "", is_default: false, status: "Actif" });
    setShowTvaForm(false);
  };
  const editTva = (v) => {
    const { start_date: _s, end_date: _e, ...rest } = v;
    setTvaForm(rest);
    setEditTvaId(v._id);
    setShowTvaForm(true);
  };
  const deleteTva = (_id) => { saveTaxRates(vatRates.filter(v => v._id !== _id)); };

  // ═════════════════════════════════════════════════════════════════
  // TAB 2: TAUX RAS
  // ═════════════════════════════════════════════════════════════════
  const submitRas = () => {
    if (!rasForm.code?.trim() || !rasForm.label_fr?.trim() || rasForm.rate === "") return;
    if (!editRasId && rasRates.some(r => r.code === rasForm.code)) { alert("Ce code RAS existe déjà!"); return; }

    const { start_date: _sdr, end_date: _edr, ...rasRest } = rasForm;
    const entry = { ...rasRest, rate: Number(rasForm.rate), _id: editRasId || Date.now() };
    if (editRasId) {
      saveRasRates(rasRates.map(r => r._id === editRasId ? entry : r));
      setEditRasId(null);
    } else {
      saveRasRates([...rasRates, entry]);
    }
    setRasForm({ code: "", label_fr: "", rate: "", calculation_base: "HT", status: "Actif" });
    setShowRasForm(false);
  };
  const editRas = (r) => {
    const { start_date: _s, end_date: _e, ...rest } = r;
    setRasForm(rest);
    setEditRasId(r._id);
    setShowRasForm(true);
  };
  const deleteRas = (_id) => { saveRasRates(rasRates.filter(r => r._id !== _id)); };

  // ═════════════════════════════════════════════════════════════════
  // TAB 3: RÈGLES FISCALES
  // ═════════════════════════════════════════════════════════════════
  const submitTaxRule = () => {
    if (!taxRuleForm.code?.trim() || !taxRuleForm.name_fr?.trim()) return;
    if (!editTaxRuleId && taxRules.some(t => t.code === taxRuleForm.code)) { alert("Ce code existe déjà!"); return; }

    const entry = { ...taxRuleForm, _id: editTaxRuleId || Date.now() };
    if (taxRuleForm.is_default) saveTaxRules(taxRules.map(t => ({ ...t, is_default: false })));
    if (editTaxRuleId) {
      saveTaxRules(taxRules.map(t => t._id === editTaxRuleId ? entry : t));
      setEditTaxRuleId(null);
    } else {
      saveTaxRules([...taxRules, entry]);
    }
    setTaxRuleForm({ code: "", name_fr: "", applies_vat: false, vat_rate_id: "", applies_ras: false, ras_rate_id: "", is_default: false, status: "Actif" });
    setShowTaxRuleForm(false);
  };
  const editTaxRule = (t) => { setTaxRuleForm(t); setEditTaxRuleId(t._id); setShowTaxRuleForm(true); };
  const deleteTaxRule = (_id) => { saveTaxRules(taxRules.filter(t => t._id !== _id)); };

  const getTaxRuleDisplay = (rule) => {
    const vat = vatRates.find(v => String(v._id) === String(rule.vat_rate_id));
    const ras = rasRates.find(r => String(r._id) === String(rule.ras_rate_id));
    return `${rule.applies_vat ? vat?.label_fr || "-" : "-"} | ${rule.applies_ras ? ras?.label_fr || "-" : "-"}`;
  };

  // ═════════════════════════════════════════════════════════════════
  // TAB 4: AFFECTATION FISCALE PAR NOMENCLATURE
  // ═════════════════════════════════════════════════════════════════
  const submitNomTax = () => {
    if (!nomTaxForm.niveau || !nomTaxForm.target_id || !nomTaxForm.tax_rule_id) return;

    const entry = { ...nomTaxForm, _id: editNomTaxId || Date.now() };
    if (editNomTaxId) {
      saveNomenclatureTaxRules(nomenclatureTaxRules.map(n => n._id === editNomTaxId ? entry : n));
      setEditNomTaxId(null);
    } else {
      saveNomenclatureTaxRules([...nomenclatureTaxRules, entry]);
    }
    setNomTaxForm({ niveau: "", target_id: "", tax_rule_id: "", start_date: "", end_date: "", status: "Actif" });
    setShowNomTaxForm(false);
  };
  const editNomTax = (n) => { setNomTaxForm(n); setEditNomTaxId(n._id); setShowNomTaxForm(true); };
  const deleteNomTax = (_id) => { saveNomenclatureTaxRules(nomenclatureTaxRules.filter(n => n._id !== _id)); };

  // ═════════════════════════════════════════════════════════════════
  // TAB 5: MODES DE PASSATION
  // ═════════════════════════════════════════════════════════════════
  const submitPm = () => {
    if (!pmForm.code?.trim() || !pmForm.name_fr?.trim()) return;
    if (!editPmId && procurementMethods.some(p => p.code === pmForm.code)) { alert("Ce code existe déjà!"); return; }

    const entry = { ...pmForm, _id: editPmId || Date.now() };
    if (editPmId) {
      saveProcurementMethods(procurementMethods.map(p => p._id === editPmId ? entry : p));
      setEditPmId(null);
    } else {
      saveProcurementMethods([...procurementMethods, entry]);
    }
    setPmForm({ code: "", name_fr: "", name_ar: "", status: "Actif" });
    setShowPmForm(false);
  };
  const editPm = (p) => { setPmForm(p); setEditPmId(p._id); setShowPmForm(true); };
  const deletePm = (_id) => { saveProcurementMethods(procurementMethods.filter(p => p._id !== _id)); };

  // ═════════════════════════════════════════════════════════════════
  // TAB 6: SEUILS RÉGLEMENTAIRES
  // ═════════════════════════════════════════════════════════════════
  const submitThreshold = () => {
    if (!thresholdForm.exercice_id || !thresholdForm.procurement_method_id) return;

    const minNum = thresholdForm.min_amount === "" || thresholdForm.min_amount == null ? 0 : Number(thresholdForm.min_amount);
    const entry = {
      ...thresholdForm,
      min_amount: minNum,
      max_amount: thresholdForm.max_amount === "" || thresholdForm.max_amount == null ? null : Number(thresholdForm.max_amount),
      threshold_scope: thresholdForm.threshold_scope || "",
      controle: (thresholdForm.controle || "").trim(),
      _id: editThresholdId || Date.now(),
    };
    if (editThresholdId) {
      saveProcurementThresholds(procurementThresholds.map(t => t._id === editThresholdId ? entry : t));
      setEditThresholdId(null);
    } else {
      saveProcurementThresholds([...procurementThresholds, entry]);
    }
    setThresholdForm({ exercice_id: "", procurement_method_id: "", min_amount: "", max_amount: "", amount_type: "HT", threshold_scope: "", controle: "", status: "Actif" });
    setShowThresholdForm(false);
  };
  const editThreshold = (t) => {
    setThresholdForm({
      ...t,
      threshold_scope: t.threshold_scope ?? "",
      controle: t.controle ?? "",
      min_amount: t.min_amount != null ? String(t.min_amount) : "",
      max_amount: t.max_amount != null ? String(t.max_amount) : "",
    });
    setEditThresholdId(t._id);
    setShowThresholdForm(true);
  };
  const deleteThreshold = (_id) => { saveProcurementThresholds(procurementThresholds.filter(t => t._id !== _id)); };

  const getExerciceLabel = (id) => { const ex = exercices.find(e => String(e._id) === String(id)); return ex ? `${ex.year}` : "-"; };
  const getPmLabel = (id) => { const pm = procurementMethods.find(p => String(p._id) === String(id)); return pm ? pm.code : "-"; };
  const getDocumentTypeLabel = (id) => {
    const d = documentTypes.find((x) => String(x._id) === String(id));
    return d ? `${d.code} — ${d.name_fr}` : "-";
  };
  const getBeneficiaryTypeLabel = (id) => {
    const b = beneficiaryTypes.find((x) => String(x._id) === String(id));
    return b ? `${b.name_fr} (${b.code})` : "-";
  };
  const thresholdScopeLabel = (v) => {
    if (!v || v === "") return "—";
    if (v === "global") return "Global";
    if (v === "by_nature") return "Par nature";
    if (v === "by_category") return "Par catégorie";
    return String(v);
  };

  // --- Modes de paiement (2.6) ---
  const submitPay = () => {
    if (!payForm.code?.trim() || !payForm.name_fr?.trim()) return;
    if (!editPayId && paymentMethods.some((p) => p.code === payForm.code)) { alert("Ce code existe déjà!"); return; }
    const entry = { ...payForm, _id: editPayId || Date.now() };
    if (editPayId) {
      savePaymentMethods(paymentMethods.map((p) => (p._id === editPayId ? entry : p)));
      setEditPayId(null);
    } else {
      savePaymentMethods([...paymentMethods, entry]);
    }
    setPayForm({ code: "", name_fr: "", name_ar: "", requires_bank_account: false, status: "Actif" });
    setShowPayForm(false);
  };
  const editPay = (p) => { setPayForm(p); setEditPayId(p._id); setShowPayForm(true); };
  const deletePay = (_id) => savePaymentMethods(paymentMethods.filter((p) => p._id !== _id));

  // --- Organismes financiers (2.7) ---
  const submitFin = () => {
    if (!finForm.code?.trim() || !finForm.name_fr?.trim()) return;
    if (!editFinId && financialInstitutions.some((f) => f.code === finForm.code)) { alert("Ce code existe déjà!"); return; }
    const entry = { ...finForm, _id: editFinId || Date.now() };
    if (editFinId) {
      saveFinancialInstitutions(financialInstitutions.map((f) => (f._id === editFinId ? entry : f)));
      setEditFinId(null);
    } else {
      saveFinancialInstitutions([...financialInstitutions, entry]);
    }
    setFinForm({ code: "", name_fr: "", name_ar: "", institution_type: "Banque", city: "", address: "", status: "Actif" });
    setShowFinForm(false);
  };
  const editFin = (f) => { setFinForm(f); setEditFinId(f._id); setShowFinForm(true); };
  const deleteFin = (_id) => saveFinancialInstitutions(financialInstitutions.filter((f) => f._id !== _id));

  // --- Pièces obligatoires par type d'acte (2.9) ---
  const submitReqDoc = () => {
    if (!reqDocForm.procurement_method_id || !reqDocForm.document_type_id) return;
    const entry = {
      ...reqDocForm,
      display_order: Number(reqDocForm.display_order) || 0,
      _id: editReqDocId || Date.now(),
    };
    if (editReqDocId) {
      saveProcurementRequiredDocs(procurementRequiredDocs.map((r) => (r._id === editReqDocId ? entry : r)));
      setEditReqDocId(null);
    } else {
      saveProcurementRequiredDocs([...procurementRequiredDocs, entry]);
    }
    setReqDocForm({ procurement_method_id: "", document_type_id: "", is_required: true, display_order: "0" });
    setShowReqDocForm(false);
  };
  const editReqDoc = (r) => { setReqDocForm({ ...r, display_order: String(r.display_order ?? 0) }); setEditReqDocId(r._id); setShowReqDocForm(true); };
  const deleteReqDoc = (_id) => saveProcurementRequiredDocs(procurementRequiredDocs.filter((r) => r._id !== _id));

  // --- Statuts d'opération (2.10) ---
  const submitOpStat = () => {
    if (!opStatForm.code?.trim() || !opStatForm.name_fr?.trim()) return;
    if (!editOpStatId && operationStatuses.some((s) => s.code === opStatForm.code)) { alert("Ce code existe déjà!"); return; }
    const entry = {
      ...opStatForm,
      display_order: Number(opStatForm.display_order) || 0,
      _id: editOpStatId || Date.now(),
    };
    if (editOpStatId) {
      saveOperationStatuses(operationStatuses.map((s) => (s._id === editOpStatId ? entry : s)));
      setEditOpStatId(null);
    } else {
      saveOperationStatuses([...operationStatuses, entry]);
    }
    setOpStatForm({ code: "", name_fr: "", name_ar: "", status_group: "draft", display_order: "1", is_final: false, status: "Actif" });
    setShowOpStatForm(false);
  };
  const editOpStat = (s) => { setOpStatForm({ ...s, display_order: String(s.display_order ?? 0) }); setEditOpStatId(s._id); setShowOpStatForm(true); };
  const deleteOpStat = (_id) => saveOperationStatuses(operationStatuses.filter((s) => s._id !== _id));

  // --- Types de bénéficiaires (2.12) ---
  const submitBenType = () => {
    if (!benTypeForm.code?.trim() || !benTypeForm.name_fr?.trim()) return;
    if (!editBenTypeId && beneficiaryTypes.some((b) => b.code === benTypeForm.code)) { alert("Ce code existe déjà!"); return; }
    const entry = { ...benTypeForm, _id: editBenTypeId || Date.now() };
    if (editBenTypeId) {
      saveBeneficiaryTypes(beneficiaryTypes.map((b) => (b._id === editBenTypeId ? entry : b)));
      setEditBenTypeId(null);
    } else {
      saveBeneficiaryTypes([...beneficiaryTypes, entry]);
    }
    setBenTypeForm({ code: "", name_fr: "", name_ar: "", status: "Actif" });
    setShowBenTypeForm(false);
  };
  const editBenType = (b) => { setBenTypeForm(b); setEditBenTypeId(b._id); setShowBenTypeForm(true); };
  const deleteBenType = (_id) => {
    saveBeneficiaryTypes(beneficiaryTypes.filter((b) => b._id !== _id));
    saveBeneficiaryTaxRules(beneficiaryTaxRules.filter((r) => String(r.beneficiary_type_id) !== String(_id)));
  };

  // --- Règles fiscales par type de bénéficiaire ---
  const submitBenTax = () => {
    if (!benTaxForm.beneficiary_type_id) return;
    const entry = { ...benTaxForm, _id: editBenTaxId || Date.now() };
    if (editBenTaxId) {
      saveBeneficiaryTaxRules(beneficiaryTaxRules.map((r) => (r._id === editBenTaxId ? entry : r)));
      setEditBenTaxId(null);
    } else {
      if (beneficiaryTaxRules.some((r) => String(r.beneficiary_type_id) === String(benTaxForm.beneficiary_type_id))) {
        alert("Une règle existe déjà pour ce type de bénéficiaire. Modifiez-la ou supprimez-la d'abord.");
        return;
      }
      saveBeneficiaryTaxRules([...beneficiaryTaxRules, entry]);
    }
    setBenTaxForm({ beneficiary_type_id: "", is_vat_applicable: true, is_ras_applicable: false, vat_rate_id: "", ras_rate_id: "", status: "Actif" });
    setShowBenTaxForm(false);
  };
  const editBenTax = (r) => { setBenTaxForm(r); setEditBenTaxId(r._id); setShowBenTaxForm(true); };
  const deleteBenTax = (_id) => saveBeneficiaryTaxRules(beneficiaryTaxRules.filter((r) => r._id !== _id));

  const submitDoc = () => {
    if (!docForm.code?.trim() || !docForm.name_fr?.trim()) return;
    if (!editDocId && documentTypes.some(d => d.code === docForm.code)) { alert("Ce code existe déjà!"); return; }

    const entry = { ...docForm, _id: editDocId || Date.now() };
    if (editDocId) {
      saveDocumentTypes(documentTypes.map(d => d._id === editDocId ? entry : d));
      setEditDocId(null);
    } else {
      saveDocumentTypes([...documentTypes, entry]);
    }
    setDocForm({ code: "", name_fr: "", name_ar: "", is_required: false, status: "Actif" });
    setShowDocForm(false);
  };
  const editDoc = (d) => { setDocForm(d); setEditDocId(d._id); setShowDocForm(true); };
  const deleteDoc = (_id) => { saveDocumentTypes(documentTypes.filter(d => d._id !== _id)); };

  const tabs = [
    { key: "tva", label: "Taux TVA", count: vatRates.length },
    { key: "ras", label: "Taux RAS", count: rasRates.length },
    { key: "taxrules", label: "Règles Fiscales", count: taxRules.length },
    { key: "nomtax", label: "Affectation Fiscale", count: nomenclatureTaxRules.length },
    { key: "methods", label: "Modes de Passation", count: procurementMethods.length },
    { key: "thresholds", label: "Seuils", count: procurementThresholds.length },
    { key: "payments", label: "Paiements", count: paymentMethods.length },
    { key: "institutions", label: "Organismes fin.", count: financialInstitutions.length },
    { key: "documents", label: "Types de Pièces", count: documentTypes.length },
    { key: "reqdocs", label: "Pièces / acte", count: procurementRequiredDocs.length },
    { key: "opstatus", label: "Statuts opération", count: operationStatuses.length },
    { key: "bentypes", label: "Types bénéficiaires", count: beneficiaryTypes.length },
    { key: "bentax", label: "Fiscalité / bénéficiaire", count: beneficiaryTaxRules.length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Topbar title="Paramétrage Réglementaire & Fiscal" />

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#F6F5F2" }}>

        <div style={{ background: "#E8F0FA", border: "0.5px solid #C5D9EF", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#185FA5" }}>
          Les référentiels ci-dessous sont stockés localement : l’administrateur peut les faire évoluer chaque année ou lors de changements réglementaires, sans modifier le code source. Ajoutez des lignes (modes d’achat, statuts, types de bénéficiaires, etc.) selon les besoins de l’établissement.
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 24,
          background: "#FEFCF9", border: "0.5px solid #E8E4DC",
          borderRadius: 10, padding: 4, width: "fit-content", flexWrap: "wrap", maxWidth: "100%", overflowX: "auto",
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: tab === t.key ? "#1A1917" : "transparent",
              color: tab === t.key ? "#F5F0E8" : "#6B6760",
              fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 6,
              transition: "background 0.15s",
            }}>
              {t.label}
              <span style={{
                fontSize: 10, padding: "1px 5px", borderRadius: 20,
                background: tab === t.key ? "rgba(255,255,255,0.15)" : "#F2EFE8",
                color: tab === t.key ? "#F5F0E8" : "#A8A49C",
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* TAB: TAUX TVA */}
        {tab === "tva" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Taux TVA</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Taxe sur la valeur ajoutée</div></div>
              {!showTvaForm && <AddBtn onClick={() => setShowTvaForm(true)} label="Nouveau Taux" />}
            </div>
            {showTvaForm && (
              <FormCard title={editTvaId ? "Modifier le taux TVA" : "Nouveau taux TVA"} onSave={submitTva} onCancel={() => { setShowTvaForm(false); setEditTvaId(null); setTvaForm({ code: "", label_fr: "", rate: "", is_default: false, status: "Actif" }); }} saveLabel={editTvaId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: TVA_20" value={tvaForm.code} onChange={e => setTvaForm({ ...tvaForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Taux (%) *</label><input type="number" placeholder="ex: 20" value={tvaForm.rate} onChange={e => setTvaForm({ ...tvaForm, rate: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Libellé FR *</label><input type="text" placeholder="ex: TVA 20%" value={tvaForm.label_fr} onChange={e => setTvaForm({ ...tvaForm, label_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Statut</label><select value={tvaForm.status} onChange={e => setTvaForm({ ...tvaForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ ...labelStyle, marginBottom: 8 }}>
                  <input type="checkbox" checked={tvaForm.is_default} onChange={e => setTvaForm({ ...tvaForm, is_default: e.target.checked })} style={{ marginRight: 8 }} />
                  Par défaut
                </label></div>
              </FormCard>
            )}
            {vatRates.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Code", "Taux", "Libellé", "Défaut", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{vatRates.map((v, i) => (<tr key={v._id} style={{ borderBottom: i < vatRates.length - 1 ? "0.5px solid #F2EFE8" : "none" }}><td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{v.code}</td><td style={tdStyle()}>{v.rate}%</td><td style={tdStyle()}>{v.label_fr}</td><td style={tdStyle()}>{v.is_default ? "✓" : "-"}</td><td style={tdStyle()}><ActifInactifCell status={v.status} onToggle={() => toggleVatStatus(v)}><StatusBadge status={v.status} /></ActifInactifCell></td><td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => editTva(v)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteTva(v._id)} message="Êtes-vous sûr de vouloir supprimer ce taux TVA ?" /></div></td></tr>))}</tbody>
                </table>
              </div>
            ) : !showTvaForm && <EmptyState message="Aucun taux TVA." />}
          </>
        )}

        {/* TAB: TAUX RAS */}
        {tab === "ras" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Taux RAS</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Redevance audiovisuelle et sportive</div></div>
              {!showRasForm && <AddBtn onClick={() => setShowRasForm(true)} label="Nouveau Taux" />}
            </div>
            {showRasForm && (
              <FormCard title={editRasId ? "Modifier le taux RAS" : "Nouveau taux RAS"} onSave={submitRas} onCancel={() => { setShowRasForm(false); setEditRasId(null); setRasForm({ code: "", label_fr: "", rate: "", calculation_base: "HT", status: "Actif" }); }} saveLabel={editRasId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: RAS_10" value={rasForm.code} onChange={e => setRasForm({ ...rasForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Taux (%) *</label><input type="number" placeholder="ex: 10" value={rasForm.rate} onChange={e => setRasForm({ ...rasForm, rate: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Libellé FR *</label><input type="text" placeholder="ex: RAS 10%" value={rasForm.label_fr} onChange={e => setRasForm({ ...rasForm, label_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Base de calcul</label><select value={rasForm.calculation_base} onChange={e => setRasForm({ ...rasForm, calculation_base: e.target.value })} style={inputStyle}><option>HT</option><option>TTC</option></select></div>
                <div><label style={labelStyle}>Statut</label><select value={rasForm.status} onChange={e => setRasForm({ ...rasForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
              </FormCard>
            )}
            {rasRates.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Code", "Taux", "Libellé", "Base", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{rasRates.map((r, i) => (<tr key={r._id} style={{ borderBottom: i < rasRates.length - 1 ? "0.5px solid #F2EFE8" : "none" }}><td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{r.code}</td><td style={tdStyle()}>{r.rate}%</td><td style={tdStyle()}>{r.label_fr}</td><td style={tdStyle()}>{r.calculation_base}</td><td style={tdStyle()}><ActifInactifCell status={r.status} onToggle={() => toggleRasStatus(r)}><StatusBadge status={r.status} /></ActifInactifCell></td><td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => editRas(r)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteRas(r._id)} message="Êtes-vous sûr de vouloir supprimer ce taux RAS ?" /></div></td></tr>))}</tbody>
                </table>
              </div>
            ) : !showRasForm && <EmptyState message="Aucun taux RAS." />}
          </>
        )}

        {/* TAB: RÈGLES FISCALES */}
        {tab === "taxrules" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Règles Fiscales</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Combinaisons TVA + RAS</div></div>
              {!showTaxRuleForm && <AddBtn onClick={() => setShowTaxRuleForm(true)} label="Nouvelle Règle" />}
            </div>
            {showTaxRuleForm && (
              <FormCard title={editTaxRuleId ? "Modifier la règle" : "Nouvelle règle fiscale"} onSave={submitTaxRule} onCancel={() => { setShowTaxRuleForm(false); setEditTaxRuleId(null); setTaxRuleForm({ code: "", name_fr: "", applies_vat: false, vat_rate_id: "", applies_ras: false, ras_rate_id: "", is_default: false, status: "Actif" }); }} saveLabel={editTaxRuleId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: RULE_1" value={taxRuleForm.code} onChange={e => setTaxRuleForm({ ...taxRuleForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom FR *</label><input type="text" placeholder="ex: Règle standard" value={taxRuleForm.name_fr} onChange={e => setTaxRuleForm({ ...taxRuleForm, name_fr: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ ...labelStyle, marginBottom: 8 }}><input type="checkbox" checked={taxRuleForm.applies_vat} onChange={e => setTaxRuleForm({ ...taxRuleForm, applies_vat: e.target.checked })} style={{ marginRight: 8 }} />Appliquer TVA</label></div>
                {taxRuleForm.applies_vat && <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Taux TVA</label><select value={taxRuleForm.vat_rate_id} onChange={e => setTaxRuleForm({ ...taxRuleForm, vat_rate_id: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{vatRates.map(v => <option key={v._id} value={String(v._id)}>{v.label_fr}</option>)}</select></div>}
                <div style={{ gridColumn: "1 / -1" }}><label style={{ ...labelStyle, marginBottom: 8 }}><input type="checkbox" checked={taxRuleForm.applies_ras} onChange={e => setTaxRuleForm({ ...taxRuleForm, applies_ras: e.target.checked })} style={{ marginRight: 8 }} />Appliquer RAS</label></div>
                {taxRuleForm.applies_ras && <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Taux RAS</label><select value={taxRuleForm.ras_rate_id} onChange={e => setTaxRuleForm({ ...taxRuleForm, ras_rate_id: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{rasRates.map(r => <option key={r._id} value={String(r._id)}>{r.label_fr}</option>)}</select></div>}
                <div style={{ gridColumn: "1 / -1" }}><label style={{ ...labelStyle, marginBottom: 8 }}><input type="checkbox" checked={taxRuleForm.is_default} onChange={e => setTaxRuleForm({ ...taxRuleForm, is_default: e.target.checked })} style={{ marginRight: 8 }} />Par défaut</label></div>
                <div><label style={labelStyle}>Statut</label><select value={taxRuleForm.status} onChange={e => setTaxRuleForm({ ...taxRuleForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
              </FormCard>
            )}
            {taxRules.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Code", "Nom", "TVA | RAS", "Défaut", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{taxRules.map((t, i) => (<tr key={t._id} style={{ borderBottom: i < taxRules.length - 1 ? "0.5px solid #F2EFE8" : "none" }}><td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{t.code}</td><td style={tdStyle()}>{t.name_fr}</td><td style={tdStyle({ fontSize: 11 })}>{getTaxRuleDisplay(t)}</td><td style={tdStyle()}>{t.is_default ? "✓" : "-"}</td><td style={tdStyle()}><ActifInactifCell status={t.status} onToggle={() => toggleTaxRuleStatus(t)}><StatusBadge status={t.status} /></ActifInactifCell></td><td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => editTaxRule(t)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteTaxRule(t._id)} message="Êtes-vous sûr de vouloir supprimer cette règle fiscale ?" /></div></td></tr>))}</tbody>
                </table>
              </div>
            ) : !showTaxRuleForm && <EmptyState message="Aucune règle fiscale." />}
          </>
        )}

        {/* TAB: AFFECTATION FISCALE PAR NOMENCLATURE */}
        {tab === "nomtax" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Affectation Fiscale</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Lier des règles fiscales à la nomenclature</div></div>
              {!showNomTaxForm && <AddBtn onClick={() => setShowNomTaxForm(true)} label="Nouvelle Affectation" />}
            </div>
            {showNomTaxForm && (
              <FormCard title={editNomTaxId ? "Modifier l'affectation" : "Nouvelle affectation fiscale"} onSave={submitNomTax} onCancel={() => { setShowNomTaxForm(false); setEditNomTaxId(null); setNomTaxForm({ niveau: "", target_id: "", tax_rule_id: "", start_date: "", end_date: "", status: "Actif" }); }} saveLabel={editNomTaxId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Niveau *</label><select value={nomTaxForm.niveau} onChange={e => setNomTaxForm({ ...nomTaxForm, niveau: e.target.value, target_id: "" })} style={inputStyle}><option value="">-- Sélectionner --</option><option>Catégorie</option><option>Nature</option><option>Libellé</option></select></div>
                <div><label style={labelStyle}>Élément *</label><input type="text" placeholder="ID de l'élément" value={nomTaxForm.target_id} onChange={e => setNomTaxForm({ ...nomTaxForm, target_id: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Règle Fiscale *</label><select value={nomTaxForm.tax_rule_id} onChange={e => setNomTaxForm({ ...nomTaxForm, tax_rule_id: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{taxRules.map(t => <option key={t._id} value={String(t._id)}>{t.code} - {t.name_fr}</option>)}</select></div>
                <div><label style={labelStyle}>Date début</label><input type="date" value={nomTaxForm.start_date} onChange={e => setNomTaxForm({ ...nomTaxForm, start_date: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Date fin</label><input type="date" value={nomTaxForm.end_date} onChange={e => setNomTaxForm({ ...nomTaxForm, end_date: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Statut</label><select value={nomTaxForm.status} onChange={e => setNomTaxForm({ ...nomTaxForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
              </FormCard>
            )}
            {nomenclatureTaxRules.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Niveau", "Cible", "Règle Fiscale", "Début", "Fin", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{nomenclatureTaxRules.map((n, i) => (<tr key={n._id} style={{ borderBottom: i < nomenclatureTaxRules.length - 1 ? "0.5px solid #F2EFE8" : "none" }}><td style={tdStyle()}>{n.niveau}</td><td style={tdStyle({ fontFamily: "monospace", fontSize: 12 })}>{n.target_id}</td><td style={tdStyle()}>{taxRules.find(t => String(t._id) === String(n.tax_rule_id))?.code || "-"}</td><td style={tdStyle({ fontSize: 12 })}>{n.start_date ? new Date(n.start_date).toLocaleDateString("fr-FR") : "-"}</td><td style={tdStyle({ fontSize: 12 })}>{n.end_date ? new Date(n.end_date).toLocaleDateString("fr-FR") : "-"}</td><td style={tdStyle()}><ActifInactifCell status={n.status} onToggle={() => toggleNomTaxStatus(n)}><StatusBadge status={n.status} /></ActifInactifCell></td><td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => editNomTax(n)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteNomTax(n._id)} message="Êtes-vous sûr de vouloir supprimer cette affectation fiscale ?" /></div></td></tr>))}</tbody>
                </table>
              </div>
            ) : !showNomTaxForm && <EmptyState message="Aucune affectation fiscale." />}
          </>
        )}

        {/* TAB: MODES DE PASSATION */}
        {tab === "methods" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Modes de Passation</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Types d'actes (BC, Marché, Convention, Régie)</div></div>
              {!showPmForm && <AddBtn onClick={() => setShowPmForm(true)} label="Nouveau Mode" />}
            </div>
            {showPmForm && (
              <FormCard title={editPmId ? "Modifier le mode" : "Nouveau mode de passation"} onSave={submitPm} onCancel={() => { setShowPmForm(false); setEditPmId(null); setPmForm({ code: "", name_fr: "", name_ar: "", status: "Actif" }); }} saveLabel={editPmId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: BC" value={pmForm.code} onChange={e => setPmForm({ ...pmForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom FR *</label><input type="text" placeholder="ex: Bon de commande" value={pmForm.name_fr} onChange={e => setPmForm({ ...pmForm, name_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom AR</label><input type="text" placeholder="ex: أمر شراء" value={pmForm.name_ar} onChange={e => setPmForm({ ...pmForm, name_ar: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Statut</label><select value={pmForm.status} onChange={e => setPmForm({ ...pmForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
              </FormCard>
            )}
            {procurementMethods.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Code", "Nom FR", "Nom AR", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{procurementMethods.map((p, i) => (<tr key={p._id} style={{ borderBottom: i < procurementMethods.length - 1 ? "0.5px solid #F2EFE8" : "none" }}><td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{p.code}</td><td style={tdStyle()}>{p.name_fr}</td><td style={tdStyle()}>{p.name_ar || "-"}</td><td style={tdStyle()}><ActifInactifCell status={p.status} onToggle={() => togglePmStatus(p)}><StatusBadge status={p.status} /></ActifInactifCell></td><td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => editPm(p)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button><DeleteIconButton onConfirm={() => deletePm(p._id)} message="Êtes-vous sûr de vouloir supprimer ce mode de passation ?" /></div></td></tr>))}</tbody>
                </table>
              </div>
            ) : !showPmForm && <EmptyState message="Aucun mode de passation." />}
          </>
        )}

        {/* TAB: SEUILS RÉGLEMENTAIRES */}
        {tab === "thresholds" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Seuils Réglementaires</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Montants limites par mode d'achat</div></div>
              {!showThresholdForm && <AddBtn onClick={() => setShowThresholdForm(true)} label="Nouveau Seuil" />}
            </div>
            {exercices.length === 0 && <Warning message="Créez d'abord des exercices budgétaires." />}
            {showThresholdForm && (
              <FormCard title={editThresholdId ? "Modifier le seuil" : "Nouveau seuil réglementaire"} onSave={submitThreshold} onCancel={() => { setShowThresholdForm(false); setEditThresholdId(null); setThresholdForm({ exercice_id: "", procurement_method_id: "", min_amount: "", max_amount: "", amount_type: "HT", threshold_scope: "", controle: "", status: "Actif" }); }} saveLabel={editThresholdId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Exercice *</label><select value={thresholdForm.exercice_id} onChange={e => setThresholdForm({ ...thresholdForm, exercice_id: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{exercices.map(ex => <option key={ex._id} value={String(ex._id)}>{ex.year}</option>)}</select></div>
                <div><label style={labelStyle}>Mode de Passation *</label><select value={thresholdForm.procurement_method_id} onChange={e => setThresholdForm({ ...thresholdForm, procurement_method_id: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{procurementMethods.map(p => <option key={p._id} value={String(p._id)}>{p.code} - {p.name_fr}</option>)}</select></div>
                <div><label style={labelStyle}>Montant min (MAD)</label><input type="number" placeholder="ex: 0 (optionnel, défaut 0)" value={thresholdForm.min_amount} onChange={e => setThresholdForm({ ...thresholdForm, min_amount: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Montant max (MAD)</label><input type="number" placeholder="ex: 500000 (optionnel)" value={thresholdForm.max_amount} onChange={e => setThresholdForm({ ...thresholdForm, max_amount: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Type montant</label><select value={thresholdForm.amount_type} onChange={e => setThresholdForm({ ...thresholdForm, amount_type: e.target.value })} style={inputStyle}><option>HT</option><option>TTC</option></select></div>
                <div><label style={labelStyle}>Périmètre du seuil (optionnel)</label><select value={thresholdForm.threshold_scope} onChange={e => setThresholdForm({ ...thresholdForm, threshold_scope: e.target.value })} style={inputStyle}><option value="">— Non défini —</option><option value="global">Global</option><option value="by_nature">Par nature de prestation</option><option value="by_category">Par catégorie</option></select></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Contrôle / commentaire (optionnel)</label><textarea placeholder="ex: Obligatoire au-delà du seuil ; contrôle par nature / exercice…" value={thresholdForm.controle} onChange={e => setThresholdForm({ ...thresholdForm, controle: e.target.value })} style={{ ...inputStyle, minHeight: 72, fontFamily: "'DM Sans', sans-serif" }} /></div>
                <div><label style={labelStyle}>Statut</label><select value={thresholdForm.status} onChange={e => setThresholdForm({ ...thresholdForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
              </FormCard>
            )}
            {procurementThresholds.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Exercice", "Mode", "Min", "Max", "Type", "Périmètre", "Contrôle", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{procurementThresholds.map((t, i) => (<tr key={t._id} style={{ borderBottom: i < procurementThresholds.length - 1 ? "0.5px solid #F2EFE8" : "none" }}><td style={tdStyle()}>{getExerciceLabel(t.exercice_id)}</td><td style={tdStyle()}>{getPmLabel(t.procurement_method_id)}</td><td style={tdStyle()}>{t.min_amount != null ? t.min_amount.toLocaleString("fr-FR") : "—"}</td><td style={tdStyle()}>{t.max_amount != null ? t.max_amount.toLocaleString("fr-FR") : "—"}</td><td style={tdStyle()}>{t.amount_type}</td><td style={tdStyle()}>{thresholdScopeLabel(t.threshold_scope)}</td><td style={tdStyle({ fontSize: 12, maxWidth: 220 })}>{t.controle ? t.controle : "—"}</td><td style={tdStyle()}><ActifInactifCell status={t.status} onToggle={() => toggleThresholdStatus(t)}><StatusBadge status={t.status} /></ActifInactifCell></td><td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => editThreshold(t)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteThreshold(t._id)} message="Êtes-vous sûr de vouloir supprimer ce seuil ?" /></div></td></tr>))}</tbody>
                </table>
              </div>
            ) : !showThresholdForm && <EmptyState message="Aucun seuil réglementaire." />}
          </>
        )}

        {/* TAB: TYPES DE PIÈCES JUSTIFICATIVES */}
        {tab === "documents" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Types de Pièces</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Justificatifs requis (Facture, Devis, etc.)</div></div>
              {!showDocForm && <AddBtn onClick={() => setShowDocForm(true)} label="Nouveau Type" />}
            </div>
            {showDocForm && (
              <FormCard title={editDocId ? "Modifier le type" : "Nouveau type de pièce"} onSave={submitDoc} onCancel={() => { setShowDocForm(false); setEditDocId(null); setDocForm({ code: "", name_fr: "", name_ar: "", is_required: false, status: "Actif" }); }} saveLabel={editDocId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: FACTURE" value={docForm.code} onChange={e => setDocForm({ ...docForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom FR *</label><input type="text" placeholder="ex: Facture" value={docForm.name_fr} onChange={e => setDocForm({ ...docForm, name_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom AR</label><input type="text" placeholder="ex: فاتورة" value={docForm.name_ar} onChange={e => setDocForm({ ...docForm, name_ar: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ ...labelStyle, marginBottom: 8 }}><input type="checkbox" checked={docForm.is_required} onChange={e => setDocForm({ ...docForm, is_required: e.target.checked })} style={{ marginRight: 8 }} />Obligatoire</label></div>
                <div><label style={labelStyle}>Statut</label><select value={docForm.status} onChange={e => setDocForm({ ...docForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
              </FormCard>
            )}
            {documentTypes.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Code", "Nom FR", "Nom AR", "Obligatoire", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{documentTypes.map((d, i) => (<tr key={d._id} style={{ borderBottom: i < documentTypes.length - 1 ? "0.5px solid #F2EFE8" : "none" }}><td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>{d.code}</td><td style={tdStyle()}>{d.name_fr}</td><td style={tdStyle()}>{d.name_ar || "—"}</td><td style={tdStyle()}>{d.is_required ? "✓" : "-"}</td><td style={tdStyle()}><ActifInactifCell status={d.status} onToggle={() => toggleDocTypeStatus(d)}><StatusBadge status={d.status} /></ActifInactifCell></td><td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => editDoc(d)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "#1A1917", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteDoc(d._id)} message="Êtes-vous sûr de vouloir supprimer ce type de pièce ?" /></div></td></tr>))}</tbody>
                </table>
              </div>
            ) : !showDocForm && <EmptyState message="Aucun type de pièce." />}
          </>
        )}

        {/* TAB: MODES DE PAIEMENT (2.6) */}
        {tab === "payments" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Modes de paiement</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Virement, chèque, etc. — utilisables dans les écrans de paiement</div></div>
              {!showPayForm && <AddBtn onClick={() => setShowPayForm(true)} label="Nouveau mode" />}
            </div>
            {showPayForm && (
              <FormCard title={editPayId ? "Modifier le mode de paiement" : "Nouveau mode de paiement"} onSave={submitPay} onCancel={() => { setShowPayForm(false); setEditPayId(null); setPayForm({ code: "", name_fr: "", name_ar: "", requires_bank_account: false, status: "Actif" }); }} saveLabel={editPayId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: VIR" value={payForm.code} onChange={e => setPayForm({ ...payForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom FR *</label><input type="text" placeholder="ex: Virement" value={payForm.name_fr} onChange={e => setPayForm({ ...payForm, name_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom AR</label><input type="text" placeholder="ex: تحويل بنكي" value={payForm.name_ar} onChange={e => setPayForm({ ...payForm, name_ar: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ ...labelStyle, marginBottom: 8 }}><input type="checkbox" checked={payForm.requires_bank_account} onChange={e => setPayForm({ ...payForm, requires_bank_account: e.target.checked })} style={{ marginRight: 8 }} />Exige un compte bancaire (RIB)</label></div>
                <div><label style={labelStyle}>Statut</label><select value={payForm.status} onChange={e => setPayForm({ ...payForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
              </FormCard>
            )}
            {paymentMethods.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Code", "Nom FR", "Nom AR", "RIB requis", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{paymentMethods.map((p, i) => (<tr key={p._id} style={{ borderBottom: i < paymentMethods.length - 1 ? "0.5px solid #F2EFE8" : "none" }}><td style={tdStyle({ fontWeight: 600 })}>{p.code}</td><td style={tdStyle()}>{p.name_fr}</td><td style={tdStyle()}>{p.name_ar || "—"}</td><td style={tdStyle()}>{p.requires_bank_account ? "✓" : "—"}</td><td style={tdStyle()}><ActifInactifCell status={p.status} onToggle={() => togglePayStatus(p)}><StatusBadge status={p.status} /></ActifInactifCell></td><td style={tdStyle()}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><button type="button" onClick={() => editPay(p)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Modifier</button><DeleteIconButton onConfirm={() => deletePay(p._id)} message="Supprimer ce mode de paiement ?" /></div></td></tr>))}</tbody>
                </table>
              </div>
            ) : !showPayForm && <EmptyState message="Aucun mode de paiement." />}
          </>
        )}

        {/* TAB: ORGANISMES FINANCIERS (2.7) */}
        {tab === "institutions" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Organismes financiers</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>TGR, trésoreries, banques — référentiel pour les ordres de paiement et virements</div></div>
              {!showFinForm && <AddBtn onClick={() => setShowFinForm(true)} label="Nouvel organisme" />}
            </div>
            {showFinForm && (
              <FormCard title={editFinId ? "Modifier l'organisme" : "Nouvel organisme financier"} onSave={submitFin} onCancel={() => { setShowFinForm(false); setEditFinId(null); setFinForm({ code: "", name_fr: "", name_ar: "", institution_type: "Banque", city: "", address: "", status: "Actif" }); }} saveLabel={editFinId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: TGR" value={finForm.code} onChange={e => setFinForm({ ...finForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Type</label><select value={finForm.institution_type} onChange={e => setFinForm({ ...finForm, institution_type: e.target.value })} style={inputStyle}><option>TGR</option><option>Banque</option><option>Trésorerie</option><option>Autre</option></select></div>
                <div><label style={labelStyle}>Nom FR *</label><input type="text" value={finForm.name_fr} onChange={e => setFinForm({ ...finForm, name_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom AR</label><input type="text" placeholder="ex: الخزينة" value={finForm.name_ar} onChange={e => setFinForm({ ...finForm, name_ar: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Ville</label><input type="text" value={finForm.city} onChange={e => setFinForm({ ...finForm, city: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Adresse</label><textarea value={finForm.address} onChange={e => setFinForm({ ...finForm, address: e.target.value })} style={{ ...inputStyle, minHeight: 56 }} /></div>
                <div><label style={labelStyle}>Statut</label><select value={finForm.status} onChange={e => setFinForm({ ...finForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
              </FormCard>
            )}
            {financialInstitutions.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Code", "Type", "Nom FR", "Ville", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{financialInstitutions.map((f, i) => (<tr key={f._id} style={{ borderBottom: i < financialInstitutions.length - 1 ? "0.5px solid #F2EFE8" : "none" }}><td style={tdStyle({ fontWeight: 600 })}>{f.code}</td><td style={tdStyle()}>{f.institution_type}</td><td style={tdStyle()}>{f.name_fr}</td><td style={tdStyle()}>{f.city || "—"}</td><td style={tdStyle()}><ActifInactifCell status={f.status} onToggle={() => toggleFinStatus(f)}><StatusBadge status={f.status} /></ActifInactifCell></td><td style={tdStyle()}><div style={{ display: "flex", gap: 8 }}><button type="button" onClick={() => editFin(f)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteFin(f._id)} message="Supprimer cet organisme ?" /></div></td></tr>))}</tbody>
                </table>
              </div>
            ) : !showFinForm && <EmptyState message="Aucun organisme financier." />}
          </>
        )}

        {/* TAB: PIÈCES OBLIGATOIRES PAR TYPE D'ACTE (2.9) */}
        {tab === "reqdocs" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Pièces par type d'acte</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Pour chaque mode de passation, indiquez quelles pièces sont exigées</div></div>
              {!showReqDocForm && <AddBtn onClick={() => setShowReqDocForm(true)} label="Nouvelle liaison" />}
            </div>
            {documentTypes.length === 0 && <Warning message="Créez d'abord des types de pièces (onglet Types de Pièces)." />}
            {showReqDocForm && (
              <FormCard title={editReqDocId ? "Modifier la liaison" : "Nouvelle pièce obligatoire"} onSave={submitReqDoc} onCancel={() => { setShowReqDocForm(false); setEditReqDocId(null); setReqDocForm({ procurement_method_id: "", document_type_id: "", is_required: true, display_order: "0" }); }} saveLabel={editReqDocId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Type d'acte *</label><select value={reqDocForm.procurement_method_id} onChange={e => setReqDocForm({ ...reqDocForm, procurement_method_id: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{procurementMethods.map(p => <option key={p._id} value={String(p._id)}>{p.code} — {p.name_fr}</option>)}</select></div>
                <div><label style={labelStyle}>Type de pièce *</label><select value={reqDocForm.document_type_id} onChange={e => setReqDocForm({ ...reqDocForm, document_type_id: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{documentTypes.map(d => <option key={d._id} value={String(d._id)}>{d.code} — {d.name_fr}</option>)}</select></div>
                <div><label style={labelStyle}>Ordre d'affichage</label><input type="number" value={reqDocForm.display_order} onChange={e => setReqDocForm({ ...reqDocForm, display_order: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ ...labelStyle, marginBottom: 8 }}><input type="checkbox" checked={reqDocForm.is_required} onChange={e => setReqDocForm({ ...reqDocForm, is_required: e.target.checked })} style={{ marginRight: 8 }} />Pièce obligatoire pour ce type d'acte</label></div>
              </FormCard>
            )}
            {procurementRequiredDocs.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Type d'acte", "Pièce", "Obligatoire", "Ordre", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{[...procurementRequiredDocs].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((r, i, arr) => (
                    <tr key={r._id} style={{ borderBottom: i < arr.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                      <td style={tdStyle()}>{getPmLabel(r.procurement_method_id)}</td>
                      <td style={tdStyle()}>{getDocumentTypeLabel(r.document_type_id)}</td>
                      <td style={tdStyle()}>{r.is_required ? "Oui" : "Non"}</td>
                      <td style={tdStyle()}>{r.display_order ?? 0}</td>
                      <td style={tdStyle()}><div style={{ display: "flex", gap: 8 }}><button type="button" onClick={() => editReqDoc(r)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteReqDoc(r._id)} message="Supprimer cette liaison ?" /></div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : !showReqDocForm && <EmptyState message="Aucune pièce liée aux types d'acte." />}
          </>
        )}

        {/* TAB: STATUTS D'OPÉRATION (2.10) */}
        {tab === "opstatus" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Statuts d'opération</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Cycle de vie (BC, marchés, etc.) — valeurs par défaut modifiables</div></div>
              {!showOpStatForm && <AddBtn onClick={() => setShowOpStatForm(true)} label="Nouveau statut" />}
            </div>
            {showOpStatForm && (
              <FormCard title={editOpStatId ? "Modifier le statut" : "Nouveau statut"} onSave={submitOpStat} onCancel={() => { setShowOpStatForm(false); setEditOpStatId(null); setOpStatForm({ code: "", name_fr: "", name_ar: "", status_group: "draft", display_order: "1", is_final: false, status: "Actif" }); }} saveLabel={editOpStatId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: EN_VALIDATION" value={opStatForm.code} onChange={e => setOpStatForm({ ...opStatForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom FR *</label><input type="text" value={opStatForm.name_fr} onChange={e => setOpStatForm({ ...opStatForm, name_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom AR</label><input type="text" placeholder="ex: قيد المصادقة" value={opStatForm.name_ar} onChange={e => setOpStatForm({ ...opStatForm, name_ar: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Groupe</label><select value={opStatForm.status_group} onChange={e => setOpStatForm({ ...opStatForm, status_group: e.target.value })} style={inputStyle}><option value="draft">Brouillon</option><option value="validation">Validation</option><option value="execution">Exécution</option><option value="payment">Paiement</option><option value="closed">Clôturé</option><option value="cancelled">Annulé</option></select></div>
                <div><label style={labelStyle}>Ordre</label><input type="number" value={opStatForm.display_order} onChange={e => setOpStatForm({ ...opStatForm, display_order: e.target.value })} style={inputStyle} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ ...labelStyle, marginBottom: 8 }}><input type="checkbox" checked={opStatForm.is_final} onChange={e => setOpStatForm({ ...opStatForm, is_final: e.target.checked })} style={{ marginRight: 8 }} />Statut final (plus de modification libre)</label></div>
                <div><label style={labelStyle}>Statut</label><select value={opStatForm.status} onChange={e => setOpStatForm({ ...opStatForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
              </FormCard>
            )}
            {operationStatuses.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Code", "Libellé FR", "Groupe", "Ordre", "Final", "Actif", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{[...operationStatuses].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((s, i, arr) => (
                    <tr key={s._id} style={{ borderBottom: i < arr.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                      <td style={tdStyle({ fontWeight: 600 })}>{s.code}</td>
                      <td style={tdStyle()}>{s.name_fr}</td>
                      <td style={tdStyle({ fontSize: 12 })}>{s.status_group}</td>
                      <td style={tdStyle()}>{s.display_order}</td>
                      <td style={tdStyle()}>{s.is_final ? "✓" : "—"}</td>
                      <td style={tdStyle()}><ActifInactifCell status={s.status} onToggle={() => toggleOpStatStatus(s)}><StatusBadge status={s.status} /></ActifInactifCell></td>
                      <td style={tdStyle()}><div style={{ display: "flex", gap: 8 }}><button type="button" onClick={() => editOpStat(s)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteOpStat(s._id)} message="Supprimer ce statut ?" /></div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : !showOpStatForm && <EmptyState message="Aucun statut." />}
          </>
        )}

        {/* TAB: TYPES BÉNÉFICIAIRES (2.12) */}
        {tab === "bentypes" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Types de bénéficiaires / fournisseurs</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>Utilisés dans la fiche fournisseur et la fiscalité</div></div>
              {!showBenTypeForm && <AddBtn onClick={() => setShowBenTypeForm(true)} label="Nouveau type" />}
            </div>
            {showBenTypeForm && (
              <FormCard title={editBenTypeId ? "Modifier le type" : "Nouveau type de bénéficiaire"} onSave={submitBenType} onCancel={() => { setShowBenTypeForm(false); setEditBenTypeId(null); setBenTypeForm({ code: "", name_fr: "", name_ar: "", status: "Actif" }); }} saveLabel={editBenTypeId ? "Mettre à jour" : "Enregistrer"}>
                <div><label style={labelStyle}>Code *</label><input type="text" placeholder="ex: PM" value={benTypeForm.code} onChange={e => setBenTypeForm({ ...benTypeForm, code: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom FR *</label><input type="text" value={benTypeForm.name_fr} onChange={e => setBenTypeForm({ ...benTypeForm, name_fr: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Nom AR</label><input type="text" placeholder="ex: شركة" value={benTypeForm.name_ar} onChange={e => setBenTypeForm({ ...benTypeForm, name_ar: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Statut</label><select value={benTypeForm.status} onChange={e => setBenTypeForm({ ...benTypeForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
              </FormCard>
            )}
            {beneficiaryTypes.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Code", "Nom FR", "Nom AR", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{beneficiaryTypes.map((b, i) => (<tr key={b._id} style={{ borderBottom: i < beneficiaryTypes.length - 1 ? "0.5px solid #F2EFE8" : "none" }}><td style={tdStyle({ fontWeight: 600 })}>{b.code}</td><td style={tdStyle()}>{b.name_fr}</td><td style={tdStyle()}>{b.name_ar || "—"}</td><td style={tdStyle()}><ActifInactifCell status={b.status} onToggle={() => toggleBenTypeStatus(b)}><StatusBadge status={b.status} /></ActifInactifCell></td><td style={tdStyle()}><div style={{ display: "flex", gap: 8 }}><button type="button" onClick={() => editBenType(b)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteBenType(b._id)} message="Supprimer ce type ? Les règles fiscales liées seront supprimées." /></div></td></tr>))}</tbody>
                </table>
              </div>
            ) : !showBenTypeForm && <EmptyState message="Aucun type de bénéficiaire." />}
          </>
        )}

        {/* TAB: FISCALITÉ PAR TYPE BÉNÉFICIAIRE */}
        {tab === "bentax" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: "#1A1917" }}>Fiscalité par type de bénéficiaire</div><div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>TVA / RAS par défaut selon le type (une ligne par type)</div></div>
              {!showBenTaxForm && <AddBtn onClick={() => setShowBenTaxForm(true)} label="Nouvelle règle" />}
            </div>
            {beneficiaryTypes.length === 0 && <Warning message="Créez d'abord des types de bénéficiaires." />}
            {showBenTaxForm && (
              <FormCard title={editBenTaxId ? "Modifier la règle" : "Nouvelle règle fiscale"} onSave={submitBenTax} onCancel={() => { setShowBenTaxForm(false); setEditBenTaxId(null); setBenTaxForm({ beneficiary_type_id: "", is_vat_applicable: true, is_ras_applicable: false, vat_rate_id: "", ras_rate_id: "", status: "Actif" }); }} saveLabel={editBenTaxId ? "Mettre à jour" : "Enregistrer"}>
                <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Type de bénéficiaire *</label><select value={benTaxForm.beneficiary_type_id} onChange={e => setBenTaxForm({ ...benTaxForm, beneficiary_type_id: e.target.value })} style={inputStyle}><option value="">-- Sélectionner --</option>{beneficiaryTypes.filter(b => b.status === "Actif").map(b => <option key={b._id} value={String(b._id)}>{b.name_fr} ({b.code})</option>)}</select></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ ...labelStyle, marginBottom: 8 }}><input type="checkbox" checked={benTaxForm.is_vat_applicable} onChange={e => setBenTaxForm({ ...benTaxForm, is_vat_applicable: e.target.checked })} style={{ marginRight: 8 }} />TVA applicable</label></div>
                {benTaxForm.is_vat_applicable && <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Taux TVA par défaut</label><select value={benTaxForm.vat_rate_id} onChange={e => setBenTaxForm({ ...benTaxForm, vat_rate_id: e.target.value })} style={inputStyle}><option value="">-- Aucun --</option>{vatRates.filter(v => v.status === "Actif").map(v => <option key={v._id} value={String(v._id)}>{v.code} — {v.label_fr}</option>)}</select></div>}
                <div style={{ gridColumn: "1 / -1" }}><label style={{ ...labelStyle, marginBottom: 8 }}><input type="checkbox" checked={benTaxForm.is_ras_applicable} onChange={e => setBenTaxForm({ ...benTaxForm, is_ras_applicable: e.target.checked })} style={{ marginRight: 8 }} />RAS applicable</label></div>
                {benTaxForm.is_ras_applicable && <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Taux RAS par défaut</label><select value={benTaxForm.ras_rate_id} onChange={e => setBenTaxForm({ ...benTaxForm, ras_rate_id: e.target.value })} style={inputStyle}><option value="">-- Aucun --</option>{rasRates.filter(r => r.status === "Actif").map(r => <option key={r._id} value={String(r._id)}>{r.code} — {r.label_fr}</option>)}</select></div>}
                <div><label style={labelStyle}>Statut</label><select value={benTaxForm.status} onChange={e => setBenTaxForm({ ...benTaxForm, status: e.target.value })} style={inputStyle}><option>Actif</option><option>Inactif</option></select></div>
              </FormCard>
            )}
            {beneficiaryTaxRules.length > 0 ? (
              <div style={{ background: "#FEFCF9", border: "0.5px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#F6F5F2", borderBottom: "0.5px solid #E8E4DC" }}>{["Type bénéficiaire", "TVA", "Taux TVA", "RAS", "Taux RAS", "Statut", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>{beneficiaryTaxRules.map((r, i) => {
                    const vr = vatRates.find(v => String(v._id) === String(r.vat_rate_id));
                    const rr = rasRates.find(x => String(x._id) === String(r.ras_rate_id));
                    return (
                      <tr key={r._id} style={{ borderBottom: i < beneficiaryTaxRules.length - 1 ? "0.5px solid #F2EFE8" : "none" }}>
                        <td style={tdStyle()}>{getBeneficiaryTypeLabel(r.beneficiary_type_id)}</td>
                        <td style={tdStyle()}>{r.is_vat_applicable ? "Oui" : "Non"}</td>
                        <td style={tdStyle()}>{vr ? `${vr.rate}%` : "—"}</td>
                        <td style={tdStyle()}>{r.is_ras_applicable ? "Oui" : "Non"}</td>
                        <td style={tdStyle()}>{rr ? `${rr.rate}%` : "—"}</td>
                        <td style={tdStyle()}><ActifInactifCell status={r.status} onToggle={() => toggleBenTaxStatus(r)}><StatusBadge status={r.status} /></ActifInactifCell></td>
                        <td style={tdStyle()}><div style={{ display: "flex", gap: 8 }}><button type="button" onClick={() => editBenTax(r)} style={{ background: "#F2EFE8", border: "0.5px solid #DDD9D0", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Modifier</button><DeleteIconButton onConfirm={() => deleteBenTax(r._id)} message="Supprimer cette règle ?" /></div></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            ) : !showBenTaxForm && <EmptyState message="Aucune règle fiscale par type de bénéficiaire." />}
          </>
        )}
      </div>
    </div>
  );
}
