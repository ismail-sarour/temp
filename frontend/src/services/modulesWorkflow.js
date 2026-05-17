/**
 * Cross-module workflow (CPS modules 7–12)
 * BC → … → OP → Paiement | Virements budgétaires
 */
import {
  STORAGE_KEYS,
  AUDIT_ACTIONS,
  getData,
  setData,
  logAudit,
  createNotification,
  checkCreditAvailability,
  calculateNetAmount,
  generateId,
  linkDocument,
} from "./dataStore";

export const BC_STATUS = {
  BROUILLON: "Brouillon",
  CREE: "Créé",
  PUBLIE: "Publié",
  DEVIS_RECUS: "Devis reçus",
  ATTRIBUE: "Attribué",
  EN_COURS: "En cours d'exécution",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

export const DEVIS_STATUS = { RECU: "Reçu", RETENU: "Retenu", REJETE: "Rejeté" };

export const ENGAGEMENT_STATUS = {
  BROUILLON: "Brouillon",
  SOUMIS: "Soumis",
  VALIDE: "Validé",
  REJETE: "Rejeté",
  ANNULE: "Annulé",
  CLOTURE: "Clôturé",
};

export const OP_STATUS = {
  BROUILLON: "Brouillon",
  VALIDEE: "Validée",
  TRANSMISE: "Transmise",
  PAYEE: "Payée",
  REJETEE: "Rejetée",
  ANNULEE: "Annulée",
};

const ENGAGED_STATUSES = [ENGAGEMENT_STATUS.VALIDE, ENGAGEMENT_STATUS.SOUMIS];

/** Montant TTC d'un BC (lignes ou totaux enregistrés) */
export function getBcAmountTtc(bc) {
  if (!bc) return 0;
  if (bc.total_ttc != null && bc.total_ttc !== "") return Number(bc.total_ttc) || 0;
  if (!bc.lineItems?.length) return Number(bc.amount_ttc) || 0;
  return bc.lineItems.reduce((sum, item) => {
    const ht = Number(item.quantity || 0) * Number(item.final_unit_price_ht || 0);
    return sum + ht;
  }, 0);
}

export function getBcAmountHt(bc) {
  if (!bc) return 0;
  if (bc.total_ht != null && bc.total_ht !== "") return Number(bc.total_ht) || 0;
  if (!bc.lineItems?.length) return Number(bc.amount_ht) || 0;
  return bc.lineItems.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.final_unit_price_ht || 0),
    0,
  );
}

export function getCommandes() {
  return getData(STORAGE_KEYS.COMMANDES, []);
}

export function saveCommandes(list) {
  setData(STORAGE_KEYS.COMMANDES, list);
}

export function getDevisList() {
  return getData(STORAGE_KEYS.DEVIS, []);
}

export function saveDevisList(list) {
  setData(STORAGE_KEYS.DEVIS, list);
}

export function getEngagementsList() {
  return getData(STORAGE_KEYS.ENGAGEMENTS, []);
}

export function saveEngagementsList(list) {
  setData(STORAGE_KEYS.ENGAGEMENTS, list);
}

export function getExecutionsList() {
  return getData(STORAGE_KEYS.EXECUTIONS, []);
}

export function saveExecutionsList(list) {
  setData(STORAGE_KEYS.EXECUTIONS, list);
}

export function getReceptionsList() {
  return getData(STORAGE_KEYS.RECEPTIONS, []);
}

export function saveReceptionsList(list) {
  setData(STORAGE_KEYS.RECEPTIONS, list);
}

export function getOrdonnancesList() {
  return getData(STORAGE_KEYS.ORDONNANCES, []);
}

export function saveOrdonnancesList(list) {
  setData(STORAGE_KEYS.ORDONNANCES, list);
}

export function getAttributionsList() {
  return getData(STORAGE_KEYS.DEVIS_ATTRIBUTIONS, []);
}

export function saveAttributionsList(list) {
  setData(STORAGE_KEYS.DEVIS_ATTRIBUTIONS, list);
}

export function getComparaisonsList() {
  return getData(STORAGE_KEYS.DEVIS_COMPARAISONS, []);
}

export function saveComparaisonsList(list) {
  setData(STORAGE_KEYS.DEVIS_COMPARAISONS, list);
}

export function getBcById(bcId) {
  return getCommandes().find((b) => String(b._id) === String(bcId));
}

export function getSupplierById(supplierId) {
  return getData(STORAGE_KEYS.FOURNISSEURS, []).find(
    (s) => String(s._id) === String(supplierId),
  );
}

/** BC éligibles à la réception de devis */
export function getBcsForDevis() {
  return getCommandes().filter(
    (bc) =>
      bc.statut !== BC_STATUS.ANNULE &&
      bc.statut !== BC_STATUS.TERMINE &&
      [BC_STATUS.PUBLIE, BC_STATUS.DEVIS_RECUS, BC_STATUS.CREE].includes(bc.statut),
  );
}

/** BC éligibles à l'attribution */
export function getBcsForAttribution() {
  return getCommandes().filter(
    (bc) =>
      bc.statut === BC_STATUS.DEVIS_RECUS ||
      bc.statut === BC_STATUS.PUBLIE,
  );
}

/** BC en cours d'exécution */
export function getBcsForExecution() {
  return getCommandes().filter(
    (bc) =>
      bc.statut === BC_STATUS.ATTRIBUE || bc.statut === BC_STATUS.EN_COURS,
  );
}

/** Après enregistrement d'un devis : passer le BC en « Devis reçus » */
export function onDevisRecorded(bcId) {
  const bcs = getCommandes();
  const updated = bcs.map((bc) => {
    if (String(bc._id) !== String(bcId)) return bc;
    if (bc.statut === BC_STATUS.PUBLIE || bc.statut === BC_STATUS.CREE) {
      return { ...bc, statut: BC_STATUS.DEVIS_RECUS };
    }
    return bc;
  });
  saveCommandes(updated);
}

/** Comparaison des devis par BC */
export function buildComparaisons(devis, getBcLabel, getSupplierLabel) {
  const grouped = {};
  devis.forEach((d) => {
    if (!grouped[d.bc_id]) grouped[d.bc_id] = [];
    grouped[d.bc_id].push(d);
  });

  return Object.entries(grouped)
    .filter(([, list]) => list.length >= 1)
    .map(([bcId, devisList]) => {
      const sorted = [...devisList].sort((a, b) => a.amount_ht - b.amount_ht);
      const min = sorted[0]?.amount_ht || 0;
      const max = sorted[sorted.length - 1]?.amount_ht || 0;
      return {
        _id: generateId(),
        bc_id: bcId,
        bc_label: getBcLabel(bcId),
        devis_count: devisList.length,
        min_amount: min,
        max_amount: max,
        ecart: max - min,
        ecart_percent: min ? (((max - min) / min) * 100).toFixed(2) : "0",
        lowest_supplier: getSupplierLabel(sorted[0]?.supplier_id),
        date_comparaison: new Date().toISOString().split("T")[0],
        devis_ids: devisList.map((d) => d._id),
      };
    });
}

/**
 * Attribution : devis retenu, BC attribué, engagement brouillon créé
 */
export async function processAttribution({
  bcId,
  devisId,
  justification,
  dateAttribution,
  devisList,
  getBcLabel,
  getSupplierLabel,
}) {
  if (!justification?.trim()) {
    return { success: false, error: "La justification du choix est obligatoire." };
  }

  const selectedDevis = devisList.find((d) => String(d._id) === String(devisId));
  if (!selectedDevis) {
    return { success: false, error: "Devis introuvable." };
  }
  if (selectedDevis.status !== DEVIS_STATUS.RECU) {
    return { success: false, error: "Seul un devis au statut « Reçu » peut être attribué." };
  }

  const bc = getBcById(bcId);
  if (!bc) {
    return { success: false, error: "Bon de commande introuvable." };
  }

  const amountHt = Number(selectedDevis.amount_ht) || 0;
  const creditCheck = checkCreditAvailability(
    bc.exercice_id,
    bc.budget_label_id,
    amountHt,
  );
  if (!creditCheck.available) {
    return {
      success: false,
      error: `Crédit insuffisant. Disponible : ${creditCheck.remaining.toLocaleString("fr-FR")} MAD, requis : ${amountHt.toLocaleString("fr-FR")} MAD.`,
    };
  }

  const existingAttr = getAttributionsList().find(
    (a) => String(a.bc_id) === String(bcId),
  );
  if (existingAttr) {
    return {
      success: false,
      error: "Ce bon de commande a déjà une décision d'attribution.",
    };
  }

  const updatedDevis = devisList.map((d) => {
    if (String(d.bc_id) !== String(bcId)) return d;
    if (String(d._id) === String(devisId)) {
      return { ...d, status: DEVIS_STATUS.RETENU };
    }
    return { ...d, status: DEVIS_STATUS.REJETE };
  });
  saveDevisList(updatedDevis);

  const amountTtc = Number(selectedDevis.amount_ttc) || amountHt;
  const updatedBcs = getCommandes().map((b) => {
    if (String(b._id) !== String(bcId)) return b;
    return {
      ...b,
      statut: BC_STATUS.ATTRIBUE,
      awarded_supplier_id: selectedDevis.supplier_id,
      attributed_amount_ht: amountHt,
      attributed_amount_ttc: amountTtc,
      attribution_date: dateAttribution || new Date().toISOString().split("T")[0],
    };
  });
  saveCommandes(updatedBcs);

  await logAudit(AUDIT_ACTIONS.STATUS_CHANGE, "COMMANDE", bcId, {
    from: bc.statut,
    to: BC_STATUS.ATTRIBUE,
    devis_id: devisId,
  });

  const refEng = `ENG-${bc.reference || bcId}-${Date.now().toString(36).slice(-4)}`;
  const engagement = {
    _id: generateId(),
    reference: refEng,
    exercice_id: bc.exercice_id,
    libelle_id: bc.budget_label_id,
    bc_id: bcId,
    amount: amountHt,
    date: dateAttribution || new Date().toISOString().split("T")[0],
    status: ENGAGEMENT_STATUS.BROUILLON,
    observation: `Engagement auto — attribution devis ${selectedDevis.reference}`,
    devis_id: devisId,
    supplier_id: selectedDevis.supplier_id,
    created_at: new Date().toISOString(),
    created_by: "Système (attribution)",
  };
  saveEngagementsList([...getEngagementsList(), engagement]);

  const attribution = {
    _id: generateId(),
    bc_id: bcId,
    bc_label: getBcLabel(bcId),
    devis_id: devisId,
    devis_reference: selectedDevis.reference,
    supplier_id: selectedDevis.supplier_id,
    supplier_name: getSupplierLabel(selectedDevis.supplier_id),
    amount_ht: amountHt,
    amount_ttc: amountTtc,
    justification: justification.trim(),
    date_attribution:
      dateAttribution || new Date().toISOString().split("T")[0],
    engagement_id: engagement._id,
    created_at: new Date().toISOString(),
  };
  saveAttributionsList([...getAttributionsList(), attribution]);

  if (selectedDevis.document_path) {
    await linkDocument("ATTRIBUTION", attribution._id, {
      fileName: selectedDevis.document_path,
      type: "Devis retenu",
    });
  }

  await createNotification(
    "Attribution enregistrée",
    `${getBcLabel(bcId)} — ${getSupplierLabel(selectedDevis.supplier_id)} (${amountHt.toLocaleString("fr-FR")} MAD HT). Engagement ${refEng} créé en brouillon.`,
    "success",
  );

  await logAudit(AUDIT_ACTIONS.APPROVE, "ATTRIBUTION", attribution._id, {
    bc_id: bcId,
    devis_id: devisId,
    engagement_id: engagement._id,
    amount: amountHt,
  });

  return { success: true, attribution, engagement };
}

/** Valider / soumettre un engagement avec contrôle crédit */
export async function validateEngagementStatus(engagementId, newStatus, engagements) {
  const engagement = engagements.find((e) => String(e._id) === String(engagementId));
  if (!engagement) return { success: false, error: "Engagement introuvable." };

  if (engagement.status === ENGAGEMENT_STATUS.CLOTURE) {
    return { success: false, error: "Un engagement clôturé ne peut plus être modifié." };
  }

  if (
    newStatus === ENGAGEMENT_STATUS.VALIDE ||
    newStatus === ENGAGEMENT_STATUS.SOUMIS
  ) {
    const others = engagements.filter(
      (e) =>
        String(e._id) !== String(engagementId) &&
        ENGAGED_STATUSES.includes(e.status) &&
        String(e.exercice_id) === String(engagement.exercice_id) &&
        String(e.libelle_id) === String(engagement.libelle_id),
    );
    const othersSum = others.reduce((s, e) => s + Number(e.amount || 0), 0);
    const credit = checkCreditAvailability(
      engagement.exercice_id,
      engagement.libelle_id,
      Number(engagement.amount || 0),
    );
    const allocated = credit.details.allocated;
    const consumed = credit.details.consumed;
    const availableForThis =
      allocated - othersSum - consumed;

    if (Number(engagement.amount) > availableForThis + 0.01) {
      return {
        success: false,
        error: `Crédit insuffisant. Disponible : ${availableForThis.toLocaleString("fr-FR")} MAD.`,
      };
    }
  }

  if (newStatus === ENGAGEMENT_STATUS.ANNULE) {
    await createNotification(
      "Engagement annulé",
      `Réf. ${engagement.reference} — crédit libéré.`,
      "info",
    );
  }

  return { success: true };
}

/** Service fait : réception définitive validée */
export function hasServiceFaitForBc(bcId) {
  const executions = getExecutionsList();
  const receptions = getReceptionsList();
  return executions.some((ex) => {
    if (String(ex.bc_id) !== String(bcId)) return false;
    if (ex.service_fait === true) return true;
    if (ex.status === "Réception définitive" || ex.status === "Clôturé") {
      return true;
    }
    return receptions.some(
      (r) =>
        String(r.execution_id) === String(ex._id) &&
        (r.type === "Définitive" || r.reception_type === "Définitive"),
    );
  });
}

export function markServiceFait(executionId) {
  const list = getExecutionsList().map((ex) =>
    String(ex._id) === String(executionId)
      ? {
          ...ex,
          service_fait: true,
          service_fait_date: new Date().toISOString().split("T")[0],
          status: "Clôturé",
        }
      : ex,
  );
  saveExecutionsList(list);
  const ex = list.find((e) => String(e._id) === String(executionId));
  if (ex?.bc_id) {
    const bcs = getCommandes().map((bc) =>
      String(bc._id) === String(ex.bc_id)
        ? { ...bc, statut: BC_STATUS.EN_COURS, service_fait: true }
        : bc,
    );
    saveCommandes(bcs);
  }
}

/** Contrôles OP (CPS art. 14) */
export function validateOrdonnancePayload({
  reference,
  fournisseur_id,
  bc_id,
  amount_ht,
  invoice_ref,
  status,
}) {
  const errors = [];
  if (!reference?.trim()) errors.push("Référence OP obligatoire.");
  if (!fournisseur_id) errors.push("Fournisseur obligatoire.");
  if (!amount_ht || Number(amount_ht) <= 0) errors.push("Montant HT invalide.");

  const supplier = getSupplierById(fournisseur_id);
  if (!supplier) {
    errors.push("Fournisseur introuvable.");
  } else {
    if (supplier.status !== "Actif") errors.push("Fournisseur inactif — OP bloquée.");
    const rib = supplier.bank_accounts?.[0]?.rib || supplier.rib;
    if (!rib?.trim()) errors.push("RIB fournisseur absent — OP bloquée.");
  }

  if (bc_id) {
    if (!hasServiceFaitForBc(bc_id)) {
      errors.push("Service fait non validé pour ce BC (réception définitive requise).");
    }
    const bc = getBcById(bc_id);
    if (
      bc?.awarded_supplier_id &&
      String(bc.awarded_supplier_id) !== String(fournisseur_id)
    ) {
      errors.push("Le fournisseur ne correspond pas au fournisseur attributaire du BC.");
    }
  }

  if (
    status &&
    status !== OP_STATUS.BROUILLON &&
    !invoice_ref?.trim()
  ) {
    errors.push("Référence facture obligatoire pour valider l'OP.");
  }

  return { valid: errors.length === 0, errors };
}

export function getNextOpReference() {
  const ops = getOrdonnancesList();
  const nums = ops
    .map((o) => {
      const m = String(o.reference || "").match(/OP-(\d+)/i);
      return m ? Number(m[1]) : null;
    })
    .filter(Number.isFinite);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `OP-${String(next).padStart(4, "0")}`;
}

/** BC éligibles à une OP */
export function getBcsForOrdonnance() {
  return getCommandes().filter(
    (bc) =>
      bc.statut !== BC_STATUS.ANNULE &&
      (bc.service_fait || hasServiceFaitForBc(bc._id)),
  );
}

/** Calcul TVA automatique pour devis */
export function computeDevisTtc(amountHt, tvaRate = 20) {
  const ht = Number(amountHt) || 0;
  const tva = (ht * Number(tvaRate)) / 100;
  return { amount_ht: ht, tva_amount: tva, amount_ttc: ht + tva };
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 11 — PAIEMENTS
// ═══════════════════════════════════════════════════════════════════

export const PAYMENT_STATUS = {
  EN_ATTENTE: "En attente",
  EFFECTUE: "Effectué",
  PARTIEL: "Partiel",
  REJETE: "Rejeté",
  ANNULE: "Annulé",
};

export const PAYMENT_MODES = [
  "Virement",
  "Chèque",
  "Espèces",
  "Trésorerie",
  "Autre",
];

export function getPaiementsList() {
  return getData(STORAGE_KEYS.PAIEMENTS, []);
}

export function savePaiementsList(list) {
  setData(STORAGE_KEYS.PAIEMENTS, list);
}

export function getPaymentRejectionsList() {
  return getData(STORAGE_KEYS.PAYMENT_REJECTIONS, []);
}

export function savePaymentRejectionsList(list) {
  setData(STORAGE_KEYS.PAYMENT_REJECTIONS, list);
}

export function getNextPaymentReference() {
  const list = getPaiementsList();
  const nums = list
    .map((p) => {
      const m = String(p.reference || "").match(/PAI-(\d+)/i);
      return m ? Number(m[1]) : null;
    })
    .filter(Number.isFinite);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `PAI-${String(next).padStart(4, "0")}`;
}

/** OP éligibles au paiement (transmises ou validées, pas encore soldées) */
export function getOrdonnancesForPayment(ordonnances) {
  return ordonnances.filter((o) => {
    if (o.status === OP_STATUS.PAYEE || o.status === OP_STATUS.ANNULEE) {
      return false;
    }
    return (
      o.status === OP_STATUS.TRANSMISE ||
      o.status === OP_STATUS.VALIDEE ||
      o.status === "Validée" ||
      o.status === "Transmise"
    );
  });
}

export function getOpNetAmount(op) {
  return Number(op?.net_amount ?? op?.net ?? op?.amount_ttc ?? 0);
}

/** Montants déjà payés sur une OP */
export function getOpPaymentTotals(opId, paiements, excludePaymentId = null) {
  const active = paiements.filter(
    (p) =>
      String(p.op_id) === String(opId) &&
      p.status !== PAYMENT_STATUS.ANNULE &&
      p.status !== PAYMENT_STATUS.REJETE &&
      String(p._id) !== String(excludePaymentId || ""),
  );
  const paid = active.reduce((s, p) => s + Number(p.amount || 0), 0);
  return { paid, count: active.length };
}

export function getOpRemainingToPay(opId, op, paiements, excludePaymentId = null) {
  const net = getOpNetAmount(op);
  const { paid } = getOpPaymentTotals(opId, paiements, excludePaymentId);
  return Math.max(0, net - paid);
}

export function getSupplierRib(supplier) {
  if (!supplier) return "";
  return (
    supplier.rib ||
    supplier.bank_accounts?.[0]?.rib ||
    supplier.bank_accounts?.[0]?.account_number ||
    ""
  );
}

export function validatePaymentPayload({
  reference,
  op_id,
  fournisseur_id,
  amount,
  mode,
  operation_number,
  justificatif,
  status,
  ordonnances,
  paiements,
  fournisseurs,
  excludePaymentId,
}) {
  const errors = [];
  if (!reference?.trim()) errors.push("Référence paiement obligatoire.");
  if (!op_id) errors.push("Ordonnance de paiement obligatoire.");

  const op = ordonnances.find((o) => String(o._id) === String(op_id));
  if (!op) {
    errors.push("Ordonnance introuvable.");
  } else if (
    op.status !== OP_STATUS.TRANSMISE &&
    op.status !== OP_STATUS.VALIDEE &&
    op.status !== "Transmise" &&
    op.status !== "Validée"
  ) {
    errors.push(
      "Seule une OP validée ou transmise peut recevoir un paiement.",
    );
  }

  const amt = Number(amount);
  if (!amt || amt <= 0) errors.push("Montant payé invalide.");

  if (op && amt > 0) {
    const remaining = getOpRemainingToPay(
      op_id,
      op,
      paiements,
      excludePaymentId,
    );
    if (
      status === PAYMENT_STATUS.EFFECTUE &&
      amt > remaining + 0.01
    ) {
      errors.push(
        `Montant supérieur au solde OP (${remaining.toLocaleString("fr-FR")} MAD).`,
      );
    }
  }

  const supplier = fournisseurs.find(
    (s) => String(s._id) === String(fournisseur_id),
  );
  if (!supplier) {
    errors.push("Fournisseur obligatoire.");
  } else {
    if (supplier.status !== "Actif") errors.push("Fournisseur inactif.");
    if (
      (status === PAYMENT_STATUS.EFFECTUE || status === PAYMENT_STATUS.PARTIEL) &&
      !getSupplierRib(supplier)?.trim() &&
      mode === "Virement"
    ) {
      errors.push("RIB obligatoire pour un virement.");
    }
    if (
      op?.fournisseur_id &&
      String(op.fournisseur_id) !== String(fournisseur_id)
    ) {
      errors.push("Fournisseur différent de celui de l'OP.");
    }
  }

  if (
    (status === PAYMENT_STATUS.EFFECTUE || status === PAYMENT_STATUS.PARTIEL) &&
    !operation_number?.trim() &&
    mode === "Virement"
  ) {
    errors.push("Numéro d'opération bancaire obligatoire pour un virement.");
  }

  if (
    status === PAYMENT_STATUS.EFFECTUE &&
    !justificatif?.trim()
  ) {
    errors.push("Justificatif de paiement obligatoire (réf. pièce ou fichier).");
  }

  return { valid: errors.length === 0, errors };
}

/** Met à jour OP / BC après paiement */
export async function syncOrdonnanceAfterPayment(opId, paiements) {
  const ordonnances = getOrdonnancesList();
  const op = ordonnances.find((o) => String(o._id) === String(opId));
  if (!op) return;

  const net = getOpNetAmount(op);
  const { paid } = getOpPaymentTotals(opId, paiements);
  let newStatus = op.status;

  if (paid >= net - 0.01) {
    newStatus = OP_STATUS.PAYEE;
  } else if (paid > 0) {
    newStatus = OP_STATUS.TRANSMISE;
  }

  const updated = ordonnances.map((o) =>
    String(o._id) === String(opId)
      ? {
          ...o,
          status: newStatus,
          paid_amount: paid,
          updated_at: new Date().toISOString(),
        }
      : o,
  );
  saveOrdonnancesList(updated);

  if (newStatus === OP_STATUS.PAYEE && op.bc_id) {
    const bcs = getCommandes().map((bc) =>
      String(bc._id) === String(op.bc_id)
        ? { ...bc, statut: BC_STATUS.TERMINE, payment_status: "Payé" }
        : bc,
    );
    saveCommandes(bcs);
  }

  await logAudit(AUDIT_ACTIONS.STATUS_CHANGE, "ORDONNANCE", opId, {
    to: newStatus,
    paid_amount: paid,
    net_amount: net,
  });

  if (newStatus === OP_STATUS.PAYEE) {
    await createNotification(
      "OP soldée",
      `${op.reference} — paiement complet (${paid.toLocaleString("fr-FR")} MAD).`,
      "success",
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODULE 12 — VIREMENTS BUDGÉTAIRES
// ═══════════════════════════════════════════════════════════════════

export const VIREMENT_STATUS = {
  BROUILLON: "Brouillon",
  EN_ATTENTE: "En attente validation",
  VALIDE: "Validé",
  APPLIQUE: "Appliqué",
  REJETE: "Rejeté",
};

export function getVirementsList() {
  return getData(STORAGE_KEYS.VIREMENTS, []);
}

export function saveVirementsList(list) {
  setData(STORAGE_KEYS.VIREMENTS, list);
}

export function getAllocationsList() {
  return getData(STORAGE_KEYS.BUDGET_ALLOCATIONS, []);
}

export function saveAllocationsList(list) {
  setData(STORAGE_KEYS.BUDGET_ALLOCATIONS, list);
}

export function getExercicesList() {
  return getData(STORAGE_KEYS.EXERCICES, []);
}

export function getNextVirementReference() {
  const list = getVirementsList();
  const nums = list
    .map((v) => {
      const m = String(v.reference || "").match(/VIR-(\d+)/i);
      return m ? Number(m[1]) : null;
    })
    .filter(Number.isFinite);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `VIR-${String(next).padStart(4, "0")}`;
}

/** Crédit disponible sur une ligne (affectation − engagements − consommation) */
export function getLineTransferableCredit(exerciceId, libelleId) {
  return calculateAvailableCredit(exerciceId, libelleId).available;
}

export function getAllocatedAmount(exerciceId, libelleId, allocations) {
  return allocations
    .filter(
      (a) =>
        String(a.exercice_id) === String(exerciceId) &&
        String(a.libelle_id) === String(libelleId),
    )
    .reduce((s, a) => s + Number(a.amount || 0), 0);
}

export function validateVirementPayload({
  reference,
  exercice_id,
  from_libelle,
  to_libelle,
  amount,
  justification,
  status,
  exercices,
  excludeVirementId,
}) {
  const errors = [];
  if (!reference?.trim()) errors.push("Référence obligatoire.");
  if (!exercice_id) errors.push("Exercice obligatoire.");
  if (!from_libelle || !to_libelle) {
    errors.push("Lignes source et destination obligatoires.");
  }
  if (from_libelle && to_libelle && String(from_libelle) === String(to_libelle)) {
    errors.push("La ligne source et la destination doivent être différentes.");
  }
  if (!justification?.trim()) errors.push("Motif / justification obligatoire.");

  const amt = Number(amount);
  if (!amt || amt <= 0) errors.push("Montant invalide.");

  const ex = exercices.find((e) => String(e._id) === String(exercice_id));
  if (!ex) {
    errors.push("Exercice introuvable.");
  } else if (ex.status === "Clôturé" || ex.status === "closed") {
    errors.push("Virement interdit sur un exercice clôturé.");
  }

  if (
    from_libelle &&
    exercice_id &&
    amt > 0 &&
    (status === VIREMENT_STATUS.VALIDE ||
      status === VIREMENT_STATUS.APPLIQUE ||
      status === VIREMENT_STATUS.EN_ATTENTE)
  ) {
    const available = getLineTransferableCredit(exercice_id, from_libelle);
    const pendingOut = getVirementsList()
      .filter(
        (v) =>
          String(v._id) !== String(excludeVirementId || "") &&
          String(v.exercice_id) === String(exercice_id) &&
          String(v.from_libelle) === String(from_libelle) &&
          v.status !== VIREMENT_STATUS.REJETE &&
          v.status !== VIREMENT_STATUS.APPLIQUE &&
          v.status !== VIREMENT_STATUS.BROUILLON,
      )
      .reduce((s, v) => s + Number(v.amount || 0), 0);
    const remaining = available - pendingOut;
    if (amt > remaining + 0.01) {
      errors.push(
        `Solde source insuffisant. Disponible : ${remaining.toLocaleString("fr-FR")} MAD.`,
      );
    }
  }

  const allocatedDest = getAllocatedAmount(
    exercice_id,
    to_libelle,
    getAllocationsList(),
  );
  if (allocatedDest <= 0 && status === VIREMENT_STATUS.APPLIQUE) {
    errors.push(
      "La ligne destination n'a pas d'affectation budgétaire. Créez une affectation d'abord.",
    );
  }

  return { valid: errors.length === 0, errors };
}

/** Applique le virement sur les affectations */
export async function applyVirementToBudget(virement) {
  if (virement.applied_at) {
    return { success: false, error: "Virement déjà appliqué." };
  }

  const allocations = getAllocationsList();
  const amount = Number(virement.amount);

  const fromRows = allocations.filter(
    (a) =>
      String(a.exercice_id) === String(virement.exercice_id) &&
      String(a.libelle_id) === String(virement.from_libelle),
  );
  if (!fromRows.length) {
    return {
      success: false,
      error: "Aucune affectation sur la ligne source.",
    };
  }

  const fromTotal = fromRows.reduce((s, a) => s + Number(a.amount || 0), 0);
  if (fromTotal < amount - 0.01) {
    return { success: false, error: "Montant supérieur au crédit affecté source." };
  }

  let updated = allocations.map((a) => {
    if (
      String(a.exercice_id) === String(virement.exercice_id) &&
      String(a.libelle_id) === String(virement.from_libelle)
    ) {
      const share = Number(a.amount || 0) / fromTotal;
      return {
        ...a,
        amount: Number(a.amount || 0) - amount * share,
        updated_at: new Date().toISOString(),
      };
    }
    return a;
  });

  const destIdx = updated.findIndex(
    (a) =>
      String(a.exercice_id) === String(virement.exercice_id) &&
      String(a.libelle_id) === String(virement.to_libelle),
  );

  if (destIdx >= 0) {
    updated = updated.map((a, i) =>
      i === destIdx
        ? {
            ...a,
            amount: Number(a.amount || 0) + amount,
            updated_at: new Date().toISOString(),
          }
        : a,
    );
  } else {
    updated.push({
      _id: generateId(),
      exercice_id: virement.exercice_id,
      libelle_id: virement.to_libelle,
      amount,
      created_at: new Date().toISOString(),
      source: `virement:${virement.reference}`,
    });
  }

  saveAllocationsList(updated);

  await createNotification(
    "Virement appliqué",
    `${virement.reference} — ${amount.toLocaleString("fr-FR")} MAD transférés.`,
    "success",
  );

  return { success: true };
}

export function validateVirementStatusChange(virement, newStatus, virements) {
  if (virement.status === VIREMENT_STATUS.APPLIQUE) {
    return { success: false, error: "Un virement appliqué ne peut plus être modifié." };
  }

  if (
    newStatus === VIREMENT_STATUS.VALIDE ||
    newStatus === VIREMENT_STATUS.APPLIQUE
  ) {
    const check = validateVirementPayload({
      reference: virement.reference,
      exercice_id: virement.exercice_id,
      from_libelle: virement.from_libelle,
      to_libelle: virement.to_libelle,
      amount: virement.amount,
      justification: virement.justification,
      status: newStatus,
      exercices: getExercicesList(),
      excludeVirementId: virement._id,
    });
    if (!check.valid) return { success: false, error: check.errors.join("\n") };
  }

  return { success: true };
}

/** Legacy migration — no-op (data is in PostgreSQL). */
export function migrateLegacyStorage() {}
