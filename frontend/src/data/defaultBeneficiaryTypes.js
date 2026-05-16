/**
 * Types bénéficiaires / fournisseurs (réf. 2.12) — défauts alignés sur le paramétrage.
 * Les _id dépendent de `ts` pour limiter les collisions si plusieurs seeds rapprochés.
 */
export function createDefaultBeneficiaryTypes(ts = Date.now()) {
  return [
    { _id: ts + 40, code: "PM", name_fr: "Société (personne morale)", name_ar: "شركة", status: "Actif" },
    { _id: ts + 41, code: "AE", name_fr: "Auto-entrepreneur", name_ar: "مقاول ذاتي", status: "Actif" },
    { _id: ts + 42, code: "PP", name_fr: "Personne physique", name_ar: "شخص طبيعي", status: "Actif" },
    { _id: ts + 43, code: "COOP", name_fr: "Coopérative", name_ar: "تعاونية", status: "Actif" },
    { _id: ts + 44, code: "ASSOC", name_fr: "Association", name_ar: "جمعية", status: "Actif" },
    { _id: ts + 45, code: "ADMIN", name_fr: "Administration", name_ar: "إدارة", status: "Actif" },
    { _id: ts + 46, code: "EP", name_fr: "Établissement public", name_ar: "مؤسسة عمومية", status: "Actif" },
    { _id: ts + 47, code: "FOREIGN", name_fr: "Fournisseur étranger", name_ar: "مورد أجنبي", status: "Actif" },
  ];
}
