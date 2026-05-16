/**
 * API-backed data store (PostgreSQL via Flask).
 * Module 1: dedicated REST endpoints. Modules 2–17: JSON collections API.
 */
import { apiFetch } from "../hooks/useApiData";

export const STORAGE_KEYS = {
  EXERCICES: "exercices",
  NATURES: "natures",
  LIBELLES: "libelles",
  FOURNISSEURS: "fournisseurs",
  COMMANDES: "commandes",
  DEVIS: "devis",
  DEVIS_COMPARAISONS: "devisComparaisons",
  DEVIS_ATTRIBUTIONS: "devisAttributions",
  ENGAGEMENTS: "engagements",
  EXECUTIONS: "executions",
  EXECUTION: "executions",
  RECEPTIONS: "receptions",
  PENALITES: "penalites",
  ORDONNANCES: "ordonnances",
  PAIEMENTS: "paiements",
  PAYMENT_REJECTIONS: "rejets_paiements",
  VIREMENTS: "virements",
  DOCUMENTS: "documents",
  GED_DOCUMENTS: "ged_documents",
  GED_VERSIONS: "ged_versions",
  AUDIT_LOGS: "auditLogs",
  USERS: "users",
  NOTIFICATIONS: "notifications",
  VAT_RATES: "vatRates",
  RAS_RATES: "rasRates",
  BUDGET_ALLOCATIONS: "budgetAllocations",
  SETTINGS: "settings",
};

/** Keys persisted via PUT /api/collections/{name} */
export const COLLECTION_KEYS = [
  "familles",
  "categories",
  "natures",
  "libelles",
  "vatRates",
  "rasRates",
  "taxRules",
  "nomenclatureTaxRules",
  "procurementMethods",
  "procurementThresholds",
  "documentTypes",
  "paymentMethods",
  "financialInstitutions",
  "procurementRequiredDocs",
  "operationStatuses",
  "beneficiaryTypes",
  "beneficiaryTaxRules",
  "budgetAllocations",
  "fournisseurs",
  "supplierBankAccounts",
  "supplierDocuments",
  "commandes",
  "bcStatusHistory",
  "devis",
  "devisComparaisons",
  "devisAttributions",
  "devisHistory",
  "engagements",
  "executions",
  "receptions",
  "penalites",
  "ordonnances",
  "paiements",
  "rejets_paiements",
  "virements",
  "documents",
  "ged_documents",
  "ged_versions",
  "auditLogs",
  "users",
  "notifications",
  "currentUser",
  STORAGE_KEYS.DEVIS,
  STORAGE_KEYS.DEVIS_COMPARAISONS,
  STORAGE_KEYS.DEVIS_ATTRIBUTIONS,
  STORAGE_KEYS.ENGAGEMENTS,
  STORAGE_KEYS.EXECUTIONS,
  STORAGE_KEYS.RECEPTIONS,
  STORAGE_KEYS.PENALITES,
  STORAGE_KEYS.ORDONNANCES,
  STORAGE_KEYS.PAIEMENTS,
  STORAGE_KEYS.PAYMENT_REJECTIONS,
  STORAGE_KEYS.VIREMENTS,
  STORAGE_KEYS.DOCUMENTS,
  STORAGE_KEYS.GED_DOCUMENTS,
  STORAGE_KEYS.GED_VERSIONS,
  STORAGE_KEYS.AUDIT_LOGS,
  STORAGE_KEYS.USERS,
  STORAGE_KEYS.NOTIFICATIONS,
  STORAGE_KEYS.VAT_RATES,
  STORAGE_KEYS.RAS_RATES,
  STORAGE_KEYS.BUDGET_ALLOCATIONS,
  STORAGE_KEYS.FOURNISSEURS,
  STORAGE_KEYS.COMMANDES,
  STORAGE_KEYS.LIBELLES,
  STORAGE_KEYS.NATURES,
];

const MODULE1_KEYS = new Set(["exercices", "budgetTypes", "annualBudgets"]);

const cache = Object.create(null);
let ready = false;

function notify(key, data) {
  window.dispatchEvent(new CustomEvent("dataStoreChange", { detail: { key, data } }));
  window.dispatchEvent(new CustomEvent("localStorageChange", { detail: { key, value: data } }));
}

async function loadCollection(name) {
  try {
    const data = await apiFetch(`/collections/${encodeURIComponent(name)}`);
    cache[name] = Array.isArray(data) ? data : [];
  } catch {
    cache[name] = [];
  }
}

export async function initDataStore() {
  const [exercices, budgetTypes, annualBudgets] = await Promise.all([
    apiFetch("/exercises"),
    apiFetch("/budget-types"),
    apiFetch("/annual-budgets"),
  ]);
  cache.exercices = exercices;
  cache.budgetTypes = budgetTypes;
  cache.annualBudgets = annualBudgets;

  const uniqueKeys = [...new Set(COLLECTION_KEYS)];
  await Promise.all(uniqueKeys.map((k) => loadCollection(k)));

  const cu = cache.currentUser;
  const hasUser = Array.isArray(cu) ? cu.length > 0 : Boolean(cu?.id);
  if (!hasUser) {
    const defaultUser = { id: 1, name: "Superviseur", role: "Admin" };
    cache.currentUser = [defaultUser];
    persistCollection("currentUser", cache.currentUser).catch(console.error);
  }

  ready = true;
  notify("__ready__", true);
}

export function isDataStoreReady() {
  return ready;
}

export function updateModule1Cache(partial) {
  if (partial.exercices !== undefined) {
    cache.exercices = partial.exercices;
    notify("exercices", partial.exercices);
  }
  if (partial.budgetTypes !== undefined) {
    cache.budgetTypes = partial.budgetTypes;
    notify("budgetTypes", partial.budgetTypes);
  }
  if (partial.annualBudgets !== undefined) {
    cache.annualBudgets = partial.annualBudgets;
    notify("annualBudgets", partial.annualBudgets);
  }
}

async function persistCollection(key, data) {
  if (MODULE1_KEYS.has(key)) return;
  await apiFetch(`/collections/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: data,
  });
}

export function getData(key, defaultValue = []) {
  if (cache[key] === undefined) return defaultValue;
  return cache[key];
}

export function setData(key, data) {
  cache[key] = data;
  notify(key, data);
  persistCollection(key, data).catch((err) => {
    console.error(`Failed to persist collection "${key}":`, err);
  });
}

export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  STATUS_CHANGE: "STATUS_CHANGE",
  VALIDATE: "VALIDATE",
  REJECT: "REJECT",
  APPROVE: "APPROVE",
  TRANSMIT: "TRANSMMIT",
  PAY: "PAY",
  CANCEL: "CANCEL",
};

export function logAudit(action, entityType, entityId, details = {}, user = null) {
  const logs = getData(STORAGE_KEYS.AUDIT_LOGS, []);
  const auditEntry = {
    _id: Date.now(),
    timestamp: new Date().toISOString(),
    action,
    entityType,
    entityId,
    user: user || getCurrentUser(),
    details,
    ipAddress: "N/A",
    userAgent: navigator.userAgent,
  };
  logs.push(auditEntry);
  setData(STORAGE_KEYS.AUDIT_LOGS, logs);
  if (["VALIDATE", "REJECT", "APPROVE", "PAY"].includes(action)) {
    createNotification(
      `Action: ${action}`,
      `${entityType} ${entityId} - ${action.toLowerCase()}`,
      action === "REJECT" ? "error" : "success",
    );
  }
  return auditEntry;
}

export function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

export function getCurrentUser() {
  const users = getData("currentUser", []);
  if (Array.isArray(users) && users.length > 0) return users[0];
  return { id: 1, name: "Superviseur", role: "Admin" };
}

export function createNotification(title, message, type = "info") {
  const notifications = getData(STORAGE_KEYS.NOTIFICATIONS, []);
  const notification = {
    _id: Date.now(),
    title,
    message,
    type,
    date: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(notification);
  setData(STORAGE_KEYS.NOTIFICATIONS, notifications);
  return notification;
}

export function calculateAvailableCredit(exerciceId, libelleId, options = {}) {
  const { excludeEngagementId } = options;
  const allocations = getData(STORAGE_KEYS.BUDGET_ALLOCATIONS, []);
  const engagements = getData(STORAGE_KEYS.ENGAGEMENTS, []);
  const ordonnances = getData(STORAGE_KEYS.ORDONNANCES, []);

  const matchLine = (exId, libId) =>
    String(exId) === String(exerciceId) && String(libId) === String(libelleId);

  const totalAllocated = allocations
    .filter((a) => matchLine(a.exercice_id, a.libelle_id))
    .reduce((sum, a) => sum + Number(a.amount || 0), 0);

  const engagedStatuses = ["Validé", "Soumis"];
  const totalEngaged = engagements
    .filter(
      (e) =>
        matchLine(e.exercice_id, e.libelle_id) &&
        engagedStatuses.includes(e.status) &&
        String(e._id) !== String(excludeEngagementId),
    )
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalConsumed = ordonnances
    .filter((o) => {
      if (o.status !== "Payée" && o.status !== "Transmise") return false;
      const bc = getData(STORAGE_KEYS.COMMANDES, []).find(
        (c) => String(c._id) === String(o.bc_id),
      );
      return bc && matchLine(bc.exercice_id, bc.budget_label_id);
    })
    .reduce((sum, o) => sum + Number(o.net_amount || o.amount_ttc || 0), 0);

  return {
    allocated: totalAllocated,
    engaged: totalEngaged,
    consumed: totalConsumed,
    available: totalAllocated - totalEngaged - totalConsumed,
  };
}

export function checkCreditAvailability(exerciceId, libelleId, amount, options = {}) {
  const credit = calculateAvailableCredit(exerciceId, libelleId, options);
  return {
    available: credit.available >= amount,
    remaining: credit.available,
    required: amount,
    details: credit,
  };
}

export const WORKFLOW_STATES = {
  COMMANDE: [
    "Brouillon",
    "Créé",
    "Publié",
    "Devis reçus",
    "Attribué",
    "En cours d'exécution",
    "Terminé",
    "Annulé",
  ],
  DEVIS: ["Reçu", "Retenu", "Rejeté"],
  ENGAGEMENT: ["Brouillon", "Soumis", "Validé", "Rejeté", "Annulé"],
  EXECUTION: [
    "Planifié",
    "En cours",
    "Réception provisoire",
    "Réception définitive",
    "Clôturé",
  ],
  ORDONNANCE: [
    "Brouillon",
    "Validé",
    "Visa",
    "Transmis",
    "Payée",
    "Rejetée",
    "Annulée",
  ],
  PAIEMENT: ["En attente", "Effectué", "Partiel", "Rejeté", "Annulé"],
};

export function canTransition(entityType, fromState, toState) {
  const states = WORKFLOW_STATES[entityType];
  if (!states) return true;
  const fromIndex = states.indexOf(fromState);
  const toIndex = states.indexOf(toState);
  if (fromIndex === -1 || toIndex === -1) return false;
  if (toState === "Annulé" || toState === "Annulée") return true;
  if (toState === "Rejeté" || toState === "Rejetée") return true;
  return toIndex >= fromIndex;
}

function getStorageKeyForType(entityType) {
  const map = {
    COMMANDE: STORAGE_KEYS.COMMANDES,
    DEVIS: STORAGE_KEYS.DEVIS,
    ENGAGEMENT: STORAGE_KEYS.ENGAGEMENTS,
    EXECUTION: STORAGE_KEYS.EXECUTIONS,
    ORDONNANCE: STORAGE_KEYS.ORDONNANCES,
    PAIEMENT: STORAGE_KEYS.PAIEMENTS,
  };
  return map[entityType];
}

export function updateEntityStatus(entityType, entityId, newStatus, additionalData = {}) {
  const key = getStorageKeyForType(entityType);
  const entities = getData(key, []);
  const entity = entities.find((e) => String(e._id) === String(entityId));
  if (!entity) return null;
  const oldStatus = entity.status || entity.statut;
  if (!canTransition(entityType, oldStatus, newStatus)) {
    return {
      success: false,
      error: `Transition from ${oldStatus} to ${newStatus} is not allowed`,
    };
  }
  const updatedEntities = entities.map((e) =>
    e._id === entityId
      ? {
          ...e,
          status: newStatus,
          statut: newStatus,
          ...additionalData,
          updated_at: new Date().toISOString(),
        }
      : e,
  );
  setData(key, updatedEntities);
  logAudit(AUDIT_ACTIONS.STATUS_CHANGE, entityType, entityId, {
    from: oldStatus,
    to: newStatus,
    ...additionalData,
  });
  return {
    success: true,
    entity: updatedEntities.find((e) => String(e._id) === String(entityId)),
  };
}

export function calculateNetAmount(amountHT, options = {}) {
  const {
    tvaRate = 0,
    rasRate = 0,
    otherRetenues = 0,
    applyTVA = true,
    applyRAS = true,
  } = options;
  const tvaAmount = applyTVA ? (amountHT * tvaRate) / 100 : 0;
  const amountTTC = amountHT + tvaAmount;
  const rasAmount = applyRAS ? (amountHT * rasRate) / 100 : 0;
  const netAmount = amountTTC - rasAmount - otherRetenues;
  return {
    amountHT,
    tvaRate: applyTVA ? tvaRate : 0,
    tvaAmount,
    amountTTC,
    rasRate: applyRAS ? rasRate : 0,
    rasAmount,
    otherRetenues,
    netAmount,
  };
}

export function getFiscalRates() {
  const vatRates = getData(STORAGE_KEYS.VAT_RATES, []);
  const rasRates = getData(STORAGE_KEYS.RAS_RATES, []);
  return {
    vatRates: vatRates.filter((r) => r.status === "Actif"),
    rasRates: rasRates.filter((r) => r.status === "Actif"),
  };
}

export function linkDocument(entityType, entityId, documentData) {
  const documents = getData(STORAGE_KEYS.DOCUMENTS, []);
  const document = {
    _id: generateId(),
    entityType,
    entityId,
    ...documentData,
    uploadedAt: new Date().toISOString(),
    uploadedBy: getCurrentUser(),
    version: 1,
  };
  documents.push(document);
  setData(STORAGE_KEYS.DOCUMENTS, documents);
  logAudit(AUDIT_ACTIONS.CREATE, "DOCUMENT", document._id, {
    entityType,
    entityId,
    fileName: documentData.fileName,
  });
  return document;
}

export function getEntityDocuments(entityType, entityId) {
  const documents = getData(STORAGE_KEYS.DOCUMENTS, []);
  return documents.filter(
    (d) =>
      d.entityType === entityType && String(d.entityId) === String(entityId),
  );
}

export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(";"),
    ...data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] || "")).join(";"),
    ),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

export function exportToJSON(data, filename) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.json`;
  link.click();
}

export default {
  STORAGE_KEYS,
  AUDIT_ACTIONS,
  WORKFLOW_STATES,
  getData,
  setData,
  generateId,
  logAudit,
  createNotification,
  calculateAvailableCredit,
  checkCreditAvailability,
  updateEntityStatus,
  canTransition,
  calculateNetAmount,
  getFiscalRates,
  linkDocument,
  getEntityDocuments,
  exportToCSV,
  exportToJSON,
  getCurrentUser,
  initDataStore,
  updateModule1Cache,
  isDataStoreReady,
};
