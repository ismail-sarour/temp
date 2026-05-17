/**
 * API-backed data store (PostgreSQL via Flask).
 * All modules use dedicated REST endpoints.
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

const cache = Object.create(null);
let ready = false;

function notify(key, data) {
  window.dispatchEvent(new CustomEvent("dataStoreChange", { detail: { key, data } }));
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

  const cu = cache.currentUser;
  const hasUser = Array.isArray(cu) ? cu.length > 0 : Boolean(cu?.id);
  if (!hasUser) {
    const defaultUser = { id: 1, name: "Superviseur", role: "Admin" };
    cache.currentUser = [defaultUser];
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

export function getData(key, defaultValue = []) {
  if (cache[key] === undefined) return defaultValue;
  return cache[key];
}

export function setData(key, data) {
  cache[key] = data;
  notify(key, data);
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

export async function logAudit(action, entityType, entityId, details = {}, user = null) {
  try {
    const currentUser = user || getCurrentUser();
    const auditEntry = {
      action,
      entity_type: entityType,
      entity_id: String(entityId),
      user: currentUser.name || currentUser.username || "Superviseur",
      details,
      ip_address: "N/A",
      user_agent: navigator.userAgent,
    };
    
    await apiFetch("/audit-logs", {
      method: "POST",
      body: JSON.stringify(auditEntry),
    });
    
    if (["VALIDATE", "REJECT", "APPROVE", "PAY"].includes(action)) {
      await createNotification(
        `Action: ${action}`,
        `${entityType} ${entityId} - ${action.toLowerCase()}`,
        action === "REJECT" ? "error" : "success",
      );
    }
    
    return auditEntry;
  } catch (error) {
    console.error("Failed to log audit:", error);
    throw error;
  }
}

export function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

export function getCurrentUser() {
  const users = getData("currentUser", []);
  if (Array.isArray(users) && users.length > 0) return users[0];
  return { id: 1, name: "Superviseur", role: "Admin" };
}

export async function createNotification(title, message, type = "info") {
  try {
    const notification = {
      title,
      message,
      type,
    };
    
    const result = await apiFetch("/notifications", {
      method: "POST",
      body: JSON.stringify(notification),
    });
    
    return result;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

export async function calculateAvailableCredit(exerciceId, libelleId, options = {}) {
  const { excludeEngagementId } = options;
  
  try {
    const [allocations, engagements, ordonnances, commandes] = await Promise.all([
      apiFetch("/budget-allocations"),
      apiFetch("/engagements"),
      apiFetch("/ordonnances"),
      apiFetch("/commandes"),
    ]);

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
        const bc = commandes.find(
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
  } catch (error) {
    console.error("Failed to calculate available credit:", error);
    throw error;
  }
}

export async function checkCreditAvailability(exerciceId, libelleId, amount, options = {}) {
  const credit = await calculateAvailableCredit(exerciceId, libelleId, options);
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

// DEPRECATED: updateEntityStatus should be called via dedicated API endpoints for each entity type
// This function is deprecated and will be removed in a future version
// Use the specific API endpoints instead (e.g., /commandes/:id/status, /engagements/:id/status, etc.)
export function updateEntityStatus(entityType, entityId, newStatus, additionalData = {}) {
  console.warn(
    `updateEntityStatus is deprecated. Use dedicated API endpoints for ${entityType} instead.`
  );
  
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
  // NOTE: setData is only for UI cache - actual persistence should be via API
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

export async function getFiscalRates() {
  try {
    const [vatRates, rasRates] = await Promise.all([
      apiFetch("/vat-rates"),
      apiFetch("/ras-rates"),
    ]);
    return {
      vatRates: vatRates.filter((r) => r.status === "Actif"),
      rasRates: rasRates.filter((r) => r.status === "Actif"),
    };
  } catch (error) {
    console.error("Failed to fetch fiscal rates:", error);
    throw error;
  }
}

export async function linkDocument(entityType, entityId, documentData) {
  try {
    const currentUser = getCurrentUser();
    const document = {
      entity_type: entityType,
      entity_id: String(entityId),
      file_name: documentData.fileName || documentData.file_name,
      file_path: documentData.filePath || documentData.file_path,
      file_size: documentData.fileSize || documentData.file_size,
      mime_type: documentData.mimeType || documentData.mime_type,
      uploaded_by: currentUser.name || currentUser.username || "Superviseur",
    };
    
    const result = await apiFetch("/documents", {
      method: "POST",
      body: JSON.stringify(document),
    });
    
    await logAudit(AUDIT_ACTIONS.CREATE, "DOCUMENT", result.id, {
      entityType,
      entityId,
      fileName: document.file_name,
    });
    
    return result;
  } catch (error) {
    console.error("Failed to link document:", error);
    throw error;
  }
}

export async function getEntityDocuments(entityType, entityId) {
  try {
    const documents = await apiFetch(`/documents?entity_type=${entityType}&entity_id=${entityId}`);
    return documents;
  } catch (error) {
    console.error("Failed to get entity documents:", error);
    throw error;
  }
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
