/**
 * CPS modules 13–17 : GED, reporting, alertes système
 */
import {
  STORAGE_KEYS,
  getData,
  setData,
  createNotification,
  calculateAvailableCredit,
  exportToCSV,
} from "./dataStore";
import {
  BC_STATUS,
  OP_STATUS,
  PAYMENT_STATUS,
  getCommandes,
  getOrdonnancesList,
  getPaiementsList,
  getEngagementsList,
  getExecutionsList,
} from "./modulesWorkflow";

export const GED_DOC_TYPES = [
  "BC",
  "Devis",
  "Marché",
  "Convention",
  "Facture",
  "Bon de livraison",
  "PV",
  "OP",
  "Attestation",
  "Attestation fiscale",
  "Attestation CNSS",
  "RIB",
  "CPS",
  "Autre",
];

export const USER_PROFILES = [
  { id: "super_admin", label: "Super Administrateur", level: 10 },
  { id: "admin", label: "Administrateur", level: 9 },
  { id: "budget", label: "Responsable budget", level: 8 },
  { id: "achats", label: "Responsable achat", level: 7 },
  { id: "demandeur", label: "Service demandeur", level: 5 },
  { id: "ordonnateur", label: "Ordonnateur", level: 8 },
  { id: "comptable", label: "Comptable", level: 7 },
  { id: "controleur", label: "Contrôleur", level: 7 },
  { id: "auditeur", label: "Auditeur", level: 6 },
  { id: "consultation", label: "Consultation", level: 1 },
];

export const MODULE_RIGHTS = [
  "exercices",
  "nomenclature",
  "reglementaire",
  "affectation",
  "fournisseurs",
  "commandes",
  "devis",
  "engagements",
  "execution",
  "ordonnances",
  "paiements",
  "virements",
  "ged",
  "reporting",
  "audit",
  "utilisateurs",
];

const DEFAULT_PERMISSIONS = {
  super_admin: Object.fromEntries(MODULE_RIGHTS.map((m) => [m, "admin"])),
  admin: Object.fromEntries(
    MODULE_RIGHTS.map((m) => [m, m === "utilisateurs" ? "read" : "write"]),
  ),
  budget: {
    exercices: "write",
    nomenclature: "read",
    reglementaire: "read",
    affectation: "write",
    fournisseurs: "read",
    commandes: "read",
    devis: "read",
    engagements: "write",
    execution: "read",
    ordonnances: "read",
    paiements: "read",
    virements: "write",
    ged: "read",
    reporting: "read",
    audit: "read",
    utilisateurs: "none",
  },
  achats: {
    exercices: "read",
    fournisseurs: "write",
    commandes: "write",
    devis: "write",
    engagements: "read",
    execution: "read",
    ged: "write",
    reporting: "read",
  },
  demandeur: {
    commandes: "write",
    execution: "read",
    ged: "read",
  },
  ordonnateur: {
    engagements: "validate",
    ordonnances: "validate",
    reporting: "read",
    audit: "read",
  },
  comptable: {
    ordonnances: "write",
    paiements: "write",
    virements: "read",
    ged: "read",
    reporting: "read",
  },
  controleur: {
    reglementaire: "read",
    engagements: "read",
    ordonnances: "read",
    paiements: "read",
    reporting: "read",
    audit: "read",
  },
  auditeur: {
    reporting: "read",
    audit: "read",
    ged: "read",
  },
  consultation: Object.fromEntries(
    MODULE_RIGHTS.map((m) => [m, m === "reporting" ? "read" : "none"]),
  ),
};

export function getDefaultPermissions(profileId) {
  return (
    DEFAULT_PERMISSIONS[profileId] ||
    DEFAULT_PERMISSIONS.consultation
  );
}

export function getGedDocuments() {
  const ged = getData(STORAGE_KEYS.GED_DOCUMENTS, []);
  const linked = getData(STORAGE_KEYS.DOCUMENTS, []);
  const byId = new Map();
  [...ged, ...linked].forEach((d) => {
    const key = String(d._id);
    if (!byId.has(key)) byId.set(key, d);
  });
  return Array.from(byId.values());
}

export function saveGedDocuments(list) {
  setData(STORAGE_KEYS.GED_DOCUMENTS, list);
}

export function getGedVersions() {
  return getData(STORAGE_KEYS.GED_VERSIONS, {});
}

export function saveGedVersions(versions) {
  setData(STORAGE_KEYS.GED_VERSIONS, versions);
}

export function getNextGedReference() {
  const docs = getGedDocuments();
  const nums = docs
    .map((d) => {
      const m = String(d.reference || "").match(/DOC-(\d+)/i);
      return m ? Number(m[1]) : null;
    })
    .filter(Number.isFinite);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `DOC-${String(next).padStart(4, "0")}`;
}

/** KPIs tableau de bord (CPS art. 18) depuis le data store API */
export function buildDashboardKpis() {
  const allocations = getData(STORAGE_KEYS.BUDGET_ALLOCATIONS, []);
  const engagements = getEngagementsList().filter(
    (e) => e.status === "Validé" || e.status === "Soumis",
  );
  const ordonnances = getOrdonnancesList();
  const paiements = getPaiementsList().filter(
    (p) =>
      p.status === PAYMENT_STATUS.EFFECTUE ||
      p.status === PAYMENT_STATUS.PARTIEL,
  );
  const commandes = getCommandes();
  const fournisseurs = getData(STORAGE_KEYS.FOURNISSEURS, []);
  const exercices = getData(STORAGE_KEYS.EXERCICES, []);
  const documents = getGedDocuments();

  const budgetAlloue = allocations.reduce(
    (s, a) => s + Number(a.amount || 0),
    0,
  );
  const budgetEngage = engagements.reduce(
    (s, e) => s + Number(e.amount || 0),
    0,
  );
  const budgetConsomme = paiements.reduce(
    (s, p) => s + Number(p.amount || 0),
    0,
  );
  const budgetDisponible = budgetAlloue - budgetEngage - budgetConsomme;

  const bcByStatus = {};
  commandes.forEach((bc) => {
    const st = bc.statut || "Inconnu";
    bcByStatus[st] = (bcByStatus[st] || 0) + 1;
  });

  const opEnAttente = ordonnances.filter(
    (o) =>
      o.status === OP_STATUS.BROUILLON ||
      o.status === OP_STATUS.VALIDEE ||
      o.status === "Validée",
  ).length;

  const paiementsEnAttente = getPaiementsList().filter(
    (p) => p.status === PAYMENT_STATUS.EN_ATTENTE,
  ).length;

  const bcAttenteAttribution = commandes.filter(
    (bc) =>
      bc.statut === BC_STATUS.DEVIS_RECUS ||
      bc.statut === BC_STATUS.PUBLIE,
  ).length;

  const docsExpires = documents.filter((d) => {
    if (!d.expiry_date) return false;
    return new Date(d.expiry_date) < new Date();
  }).length;

  const depensesParFournisseur = {};
  paiements.forEach((p) => {
    const name =
      fournisseurs.find((f) => String(f._id) === String(p.fournisseur_id))
        ?.company_name || "Inconnu";
    depensesParFournisseur[name] =
      (depensesParFournisseur[name] || 0) + Number(p.amount || 0);
  });

  const topFournisseurs = Object.entries(depensesParFournisseur)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  const lignesCreditFaible = allocations
    .map((a) => {
      const credit = calculateAvailableCredit(a.exercice_id, a.libelle_id);
      return {
        exercice_id: a.exercice_id,
        libelle_id: a.libelle_id,
        allocated: credit.allocated,
        available: credit.available,
        pct:
          credit.allocated > 0
            ? Math.round((credit.available / credit.allocated) * 100)
            : 100,
      };
    })
    .filter((l) => l.allocated > 0 && l.pct < 15)
    .slice(0, 8);

  const activeExercises = exercices.filter(
    (e) => e.status === "Actif" || e.status === "active",
  ).length;

  return {
    budgetAlloue,
    budgetEngage,
    budgetConsomme,
    budgetDisponible,
    bcByStatus,
    opEnAttente,
    paiementsEnAttente,
    bcAttenteAttribution,
    docsExpires,
    topFournisseurs,
    lignesCreditFaible,
    activeExercises,
    totalBc: commandes.length,
    totalOp: ordonnances.length,
    totalPaiements: paiements.length,
    totalDocuments: documents.length,
    exercices,
  };
}

function alertKey(category, entityId) {
  return `${category}:${entityId || "global"}`;
}

/** Scan métier → notifications (CPS art. 21) */
export function runSystemAlertsScan() {
  const kpis = buildDashboardKpis();
  const notifications = getData(STORAGE_KEYS.NOTIFICATIONS, []);
  const existingKeys = new Set(
    notifications.map((n) => n.alert_key).filter(Boolean),
  );
  const newAlerts = [];

  const pushAlert = (category, title, message, type = "Attention", entityId) => {
    const key = alertKey(category, entityId);
    if (existingKeys.has(key)) return;
    newAlerts.push({
      _id: Date.now() + Math.random(),
      alert_key: key,
      category,
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false,
      source: "system_scan",
    });
    existingKeys.add(key);
  };

  if (kpis.budgetDisponible < 0) {
    pushAlert(
      "budget_overrun",
      "Dépassement budgétaire",
      `Le solde global disponible est négatif (${kpis.budgetDisponible.toLocaleString("fr-FR")} MAD).`,
      "Erreur",
    );
  }

  kpis.lignesCreditFaible.forEach((l) => {
    pushAlert(
      "credit_low",
      "Crédit insuffisant",
      `Ligne budgétaire sous 15 % de crédit restant (${l.available.toLocaleString("fr-FR")} MAD).`,
      "Attention",
      `${l.exercice_id}-${l.libelle_id}`,
    );
  });

  if (kpis.bcAttenteAttribution > 0) {
    pushAlert(
      "bc_attribution",
      "BC en attente d'attribution",
      `${kpis.bcAttenteAttribution} bon(s) de commande en attente d'attribution.`,
      "Attention",
    );
  }

  if (kpis.opEnAttente > 0) {
    pushAlert(
      "op_pending",
      "OP en attente de validation",
      `${kpis.opEnAttente} ordonnance(s) en attente de traitement.`,
      "Information",
    );
  }

  if (kpis.paiementsEnAttente > 0) {
    pushAlert(
      "payment_pending",
      "Paiements en attente",
      `${kpis.paiementsEnAttente} paiement(s) en attente d'exécution.`,
      "Information",
    );
  }

  const fournisseurs = getData(STORAGE_KEYS.FOURNISSEURS, []);
  fournisseurs.forEach((f) => {
    const docs = f.documents || [];
    docs.forEach((doc) => {
      if (!doc.expiry_date) return;
      const exp = new Date(doc.expiry_date);
      const today = new Date();
      if (exp < today) {
        pushAlert(
          "supplier_doc_expired",
          "Document fournisseur expiré",
          `${f.company_name} — ${doc.type || "document"} expiré.`,
          "Erreur",
          `${f._id}-${doc.type}`,
        );
      }
    });
    if (f.status !== "Actif" && f.status) {
      pushAlert(
        "supplier_inactive",
        "Fournisseur inactif",
        `Le fournisseur ${f.company_name} est inactif.`,
        "Attention",
        String(f._id),
      );
    }
  });

  getGedDocuments().forEach((doc) => {
    if (!doc.expiry_date) return;
    const exp = new Date(doc.expiry_date);
    const today = new Date();
    const days = Math.ceil((exp - today) / (86400000));
    if (days >= 0 && days <= 30) {
      pushAlert(
        "ged_expiring",
        "Document GED expirant",
        `"${doc.title}" expire dans ${days} jour(s).`,
        "Attention",
        String(doc._id),
      );
    }
  });

  const exercices = getData(STORAGE_KEYS.EXERCICES, []);
  exercices.forEach((ex) => {
    if (!ex.end_date) return;
    const end = new Date(ex.end_date);
    const today = new Date();
    const days = Math.ceil((end - today) / 86400000);
    if (
      (ex.status === "Actif" || ex.status === "active") &&
      days >= 0 &&
      days <= 60
    ) {
      pushAlert(
        "exercise_closing",
        "Exercice proche de clôture",
        `L'exercice ${ex.year || ex.label} se clôture dans ${days} jour(s).`,
        "Attention",
        String(ex._id),
      );
    }
  });

  if (newAlerts.length) {
    setData(STORAGE_KEYS.NOTIFICATIONS, [...newAlerts, ...notifications]);
  }

  return newAlerts.length;
}

export function exportDashboardCsv(kpis) {
  const rows = [
    { indicateur: "Budget alloué", valeur: kpis.budgetAlloue },
    { indicateur: "Budget engagé", valeur: kpis.budgetEngage },
    { indicateur: "Budget consommé", valeur: kpis.budgetConsomme },
    { indicateur: "Solde disponible", valeur: kpis.budgetDisponible },
    { indicateur: "BC total", valeur: kpis.totalBc },
    { indicateur: "OP total", valeur: kpis.totalOp },
    { indicateur: "Documents GED", valeur: kpis.totalDocuments },
  ];
  exportToCSV(rows, "situation_budgetaire");
}

export function exportGedListCsv(documents) {
  exportToCSV(
    documents.map((d) => ({
      reference: d.reference,
      titre: d.title,
      type: d.type,
      entite: d.entity_type,
      date: d.date,
      expiration: d.expiry_date,
    })),
    "ged_documents",
  );
}
