// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockBudgetAlerts = [
  {
    id: "ba1",
    title: "Dépassement budgétaire : Campagne Marketing Q2",
    description:
      "La campagne marketing du 2ème trimestre a dépassé son budget alloué de 23 % en raison d'une augmentation imprévue des dépenses publicitaires numériques.",
    severity: "Critical",
    category: "Overrun",
    badge: "Urgent",
    recommendation:
      "Réviser les analyses de dépenses publicitaires et réaffecter le budget depuis les campagnes sous-performantes. Envisager une demande de fonds d'urgence auprès de la direction financière.",
    financialSummary: "MAD 87 500 au-dessus du budget",
    financialAmount: 87500,
    trend: "up",
    trendLabel: "Hausse de 23 % ce mois",
    details:
      "Répartition détaillée des dépenses publicitaires par plateforme (Google Ads +18 %, Meta +31 %, LinkedIn +12 %). Analyse du ROI par canal. Comparaison avec le budget initial approuvé en janvier.",
    date: "2026-05-15",
    department: "Marketing",
  },
  {
    id: "ba2",
    title: "Dépenses suspectes : Abonnements logiciels non approuvés",
    description:
      "Plusieurs nouveaux abonnements logiciels détectés sans processus d'approbation approprié. Licences potentiellement en double identifiées dans 3 départements.",
    severity: "High",
    category: "Suspicious",
    badge: "Nouveau",
    recommendation:
      "Lancer un audit interne des licences logicielles et consolider les abonnements redondants. Mettre en place un processus d'approbation obligatoire pour tout nouvel abonnement.",
    financialSummary: "MAD 9 200/mois d'économies potentielles",
    financialAmount: 9200,
    trend: "stable",
    trendLabel: "Stable depuis 2 mois",
    details:
      "Liste des nouveaux abonnements : Salesforce (×2), Adobe Creative Cloud (×4 non utilisés), Zoom Pro (×8 doublons). Coûts associés et départements concernés. Comparaison avec les licences existantes.",
    date: "2026-05-12",
    department: "IT / DSI",
  },
  {
    id: "ba3",
    title: "Alerte seuil : Budget Infrastructure IT à 89 %",
    description:
      "Le budget alloué à l'infrastructure IT a atteint 89 % de consommation à mi-exercice. À ce rythme, le dépassement est prévu dans 6 semaines.",
    severity: "High",
    category: "Threshold",
    badge: "Attention",
    recommendation:
      "Geler les nouvelles acquisitions matérielles non critiques jusqu'à la révision budgétaire. Prioriser les dépenses selon le plan de continuité d'activité.",
    financialSummary: "MAD 142 000 restants sur MAD 1 280 000",
    financialAmount: 142000,
    trend: "up",
    trendLabel: "Consommation accélérée +15 %",
    details:
      "Détail de consommation : Serveurs (94 %), Licences OS (78 %), Maintenance réseau (91 %), Cloud Azure (87 %). Projection de dépassement basée sur la tendance des 3 derniers mois.",
    date: "2026-05-10",
    department: "DSI",
  },
  {
    id: "ba4",
    title: "Anomalie de paiement : Fournisseur TECHNO MAROC",
    description:
      "Un paiement de MAD 340 000 a été émis vers le fournisseur TECHNO MAROC sans bon de commande associé validé. Risque de fraude ou d'erreur administrative.",
    severity: "Critical",
    category: "Suspicious",
    badge: "Critique",
    recommendation:
      "Suspendre immédiatement tout paiement supplémentaire à ce fournisseur. Initier une vérification d'urgence avec le département des achats et l'audit interne.",
    financialSummary: "MAD 340 000 à risque",
    financialAmount: 340000,
    trend: "up",
    trendLabel: "Incident isolé détecté",
    details:
      "Référence paiement : PAY-2026-04821. Date : 08/05/2026. Aucun BC correspondant dans le système. Fournisseur actif depuis 2019 — historique de paiements normal jusqu'à présent. Nécessite vérification croisée avec la comptabilité.",
    date: "2026-05-08",
    department: "Achats",
  },
  {
    id: "ba5",
    title: "Révision budgétaire annuelle : Dépenses départementales",
    description:
      "Rappel : La révision budgétaire annuelle des dépenses départementales est prévue la semaine prochaine. Les rapports doivent être soumis avant le 25 mai.",
    severity: "Low",
    category: "Reminder",
    badge: null,
    recommendation:
      "Préparer des rapports de dépenses détaillés avec justifications pour la réunion de révision. Consulter les directives de soumission budgétaire mises à jour.",
    financialSummary: "Échéance : 25 mai 2026",
    financialAmount: null,
    trend: "stable",
    trendLabel: "Planifié",
    details:
      "Directives de soumission budgétaire disponibles sur l'intranet. Accès aux rapports de l'année précédente. Formulaires de justification à compléter par chaque chef de département.",
    date: "2026-05-05",
    department: "Finance",
  },
  {
    id: "ba6",
    title: "Retard de validation : Engagements budgétaires en attente",
    description:
      "14 engagements budgétaires d'une valeur totale de MAD 2,1M sont en attente de validation depuis plus de 10 jours ouvrables, bloquant l'exécution des projets.",
    severity: "Medium",
    category: "Delay",
    badge: "En retard",
    recommendation:
      "Escalader les validations en attente aux responsables hiérarchiques concernés. Mettre en place des rappels automatiques pour les validations dépassant 5 jours ouvrables.",
    financialSummary: "MAD 2 100 000 bloqués",
    financialAmount: 2100000,
    trend: "up",
    trendLabel: "Délai moyen +3 jours vs mois dernier",
    details:
      "Répartition par département : RH (3 engagements), Travaux (5 engagements), Logistique (4 engagements), Formation (2 engagements). Validateurs concernés identifiés. Délai moyen actuel : 13 jours ouvrables.",
    date: "2026-05-14",
    department: "Multi-départements",
  },
];

const mockComplianceAlerts = [
  {
    id: "ca1",
    title: "Expiration documents fournisseur : AL MAGHRIB SUPPLIES",
    description:
      "Les documents réglementaires du fournisseur AL MAGHRIB SUPPLIES (attestation fiscale, RC, CNSS) expirent dans 12 jours. Tout paiement sera bloqué après expiration.",
    severity: "High",
    category: "Document",
    badge: "Expire bientôt",
    recommendation:
      "Contacter immédiatement le fournisseur pour obtenir les documents renouvelés. Mettre en place une alerte automatique 30 jours avant toute expiration documentaire.",
    complianceType: "Documents fournisseur",
    daysUntilExpiry: 12,
    affectedEntity: "AL MAGHRIB SUPPLIES",
    details:
      "Documents concernés : Attestation fiscale (expire 31/05/2026), Registre de commerce (expire 28/05/2026), Attestation CNSS (expire 02/06/2026). Contrat actif : 3 commandes en cours pour MAD 780 000.",
    date: "2026-05-19",
    status: "Pending",
  },
  {
    id: "ca2",
    title: "Non-conformité réglementaire : Seuil de passation de marchés",
    description:
      "3 commandes directes dépassent le seuil réglementaire de MAD 500 000 sans appel d'offres préalable, en violation du décret n°2-12-349 sur les marchés publics.",
    severity: "Critical",
    category: "Regulatory",
    badge: "Violation",
    recommendation:
      "Suspendre immédiatement les commandes concernées et lancer les procédures d'appel d'offres conformes. Consulter le service juridique pour évaluer les risques de contentieux.",
    complianceType: "Marchés publics",
    daysUntilExpiry: null,
    affectedEntity: "Service Achats",
    details:
      "Commandes concernées : BC-2026-0412 (MAD 620 000), BC-2026-0398 (MAD 540 000), BC-2026-0445 (MAD 890 000). Fournisseurs : ATLAS TECH, MAROC SERVICES, CASABLANCA INFRA. Risque juridique élevé.",
    date: "2026-05-16",
    status: "Active",
  },
  {
    id: "ca3",
    title: "Validation retardée : Devis en attente depuis 18 jours",
    description:
      "7 devis soumis par des fournisseurs qualifiés sont en attente de validation depuis plus de 18 jours, dépassant le délai réglementaire de 10 jours ouvrables.",
    severity: "Medium",
    category: "Process",
    badge: "Retard",
    recommendation:
      "Identifier les goulots d'étranglement dans le processus de validation. Assigner des validateurs de remplacement pour les devis bloqués. Réviser le workflow d'approbation.",
    complianceType: "Délais réglementaires",
    daysUntilExpiry: null,
    affectedEntity: "Commission d'appel d'offres",
    details:
      "Devis en attente : DEV-2026-0234 à DEV-2026-0240. Valeur totale estimée : MAD 1 450 000. Fournisseurs en attente de réponse. Risque de perte de fournisseurs qualifiés.",
    date: "2026-05-13",
    status: "Pending",
  },
  {
    id: "ca4",
    title: "Anomalie devis : Écart de prix suspect entre soumissionnaires",
    description:
      "Analyse IA détecte un écart de prix anormalement faible (2,3 %) entre les 3 soumissionnaires pour l'appel d'offres AO-2026-018, suggérant une possible entente.",
    severity: "Critical",
    category: "Fraud",
    badge: "Suspect",
    recommendation:
      "Annuler l'appel d'offres et relancer avec un cahier des charges révisé. Signaler l'anomalie au Conseil de la Concurrence. Élargir la liste des soumissionnaires invités.",
    complianceType: "Intégrité des marchés",
    daysUntilExpiry: null,
    affectedEntity: "AO-2026-018",
    details:
      "Soumissionnaires : MAROC BUILD (MAD 2 340 000), ATLAS CONSTRUCT (MAD 2 394 000), CASABLANCA WORKS (MAD 2 287 000). Écart max : 4,7 %. Probabilité d'entente calculée par IA : 87 %. Historique : 2 des 3 soumissionnaires ont déjà soumis ensemble sur AO-2025-031.",
    date: "2026-05-17",
    status: "Active",
  },
  {
    id: "ca5",
    title: "Retard de paiement : Fournisseur DIGITAL SOLUTIONS MAROC",
    description:
      "La facture FAC-2026-1892 de DIGITAL SOLUTIONS MAROC est en retard de paiement de 22 jours, dépassant les conditions contractuelles de 30 jours et exposant à des pénalités.",
    severity: "Medium",
    category: "Payment",
    badge: "En retard",
    recommendation:
      "Traiter le paiement en urgence pour éviter les pénalités contractuelles. Vérifier les causes du retard (validation manquante, problème bancaire) et corriger le processus.",
    complianceType: "Conditions de paiement",
    daysUntilExpiry: null,
    affectedEntity: "DIGITAL SOLUTIONS MAROC",
    details:
      "Facture : FAC-2026-1892. Montant : MAD 185 000. Date d'échéance : 27/04/2026. Pénalités contractuelles : 1,5 %/mois soit MAD 2 775 déjà accumulées. Contrat-cadre : CC-2025-047.",
    date: "2026-05-19",
    status: "Overdue",
  },
  {
    id: "ca6",
    title: "Mise à jour réglementaire : Nouveau décret sur les marchés publics",
    description:
      "Le décret n°2-26-112 modifiant les seuils de passation des marchés publics est entré en vigueur le 01/05/2026. Mise à jour des procédures internes requise.",
    severity: "Low",
    category: "Regulatory",
    badge: "Info",
    recommendation:
      "Organiser une session de formation pour les équipes achats et finance. Mettre à jour les modèles de documents et les workflows d'approbation selon les nouveaux seuils.",
    complianceType: "Veille réglementaire",
    daysUntilExpiry: null,
    affectedEntity: "Tous les services",
    details:
      "Principaux changements : Seuil appel d'offres ouvert relevé à MAD 750 000 (vs 500 000). Nouveau formulaire de déclaration d'intérêts obligatoire. Délai de publication des résultats réduit à 5 jours. Entrée en vigueur : 01/05/2026.",
    date: "2026-05-01",
    status: "Info",
  },
];

const mockAuditInsights = [
  {
    id: "ai1",
    title: "Incohérence comptable : Écart de réconciliation Q1",
    description:
      "L'analyse IA a détecté un écart de MAD 47 300 entre les écritures comptables et les relevés bancaires pour le 1er trimestre 2026. 3 transactions non réconciliées identifiées.",
    severity: "High",
    category: "Accounting",
    badge: "Écart détecté",
    recommendation:
      "Lancer une réconciliation manuelle des 3 transactions suspectes. Vérifier les journaux de saisie pour identifier d'éventuelles erreurs de double comptabilisation ou d'omission.",
    insightType: "Réconciliation",
    confidence: 94,
    affectedPeriod: "Q1 2026",
    details:
      "Transactions non réconciliées : TXN-2026-0234 (MAD 18 500), TXN-2026-0287 (MAD 21 800), TXN-2026-0312 (MAD 7 000). Comptes concernés : 512100, 401200. Dernière réconciliation complète : 31/12/2025.",
    date: "2026-05-18",
    riskScore: 78,
  },
  {
    id: "ai2",
    title: "Accès non autorisé : Modifications de données sensibles",
    description:
      "Le système a détecté 12 modifications de données financières sensibles effectuées en dehors des heures ouvrables (22h-06h) par 2 comptes utilisateurs au cours des 30 derniers jours.",
    severity: "Critical",
    category: "Security",
    badge: "Critique",
    recommendation:
      "Suspendre immédiatement les comptes concernés et lancer une investigation de sécurité. Activer l'authentification multi-facteurs pour tous les accès aux données financières. Réviser les politiques d'accès.",
    insightType: "Sécurité des accès",
    confidence: 97,
    affectedPeriod: "Avril-Mai 2026",
    details:
      "Comptes concernés : USR-0089 (7 modifications), USR-0134 (5 modifications). Données modifiées : Engagements budgétaires, Ordres de paiement. Adresses IP : 196.12.45.78 (externe), 10.0.2.45 (interne). Logs disponibles.",
    date: "2026-05-17",
    riskScore: 95,
  },
  {
    id: "ai3",
    title: "Tendance inhabituelle : Pic de dépenses en fin de période",
    description:
      "Analyse IA révèle un pattern récurrent de dépenses concentrées dans les 5 derniers jours de chaque trimestre, représentant 34 % du budget trimestriel total — indicateur classique de 'window dressing'.",
    severity: "Medium",
    category: "Pattern",
    badge: "Anomalie",
    recommendation:
      "Mettre en place des contrôles de dépenses en fin de période. Exiger des justifications supplémentaires pour toute dépense dépassant MAD 50 000 dans les 5 derniers jours d'un trimestre.",
    insightType: "Analyse comportementale",
    confidence: 82,
    affectedPeriod: "2025-2026",
    details:
      "Pattern détecté sur 6 trimestres consécutifs. Départements concernés : Achats (42 % des dépenses fin de période), IT (28 %), Logistique (18 %). Montant moyen concentré : MAD 1 240 000/trimestre. Comparaison sectorielle : moyenne nationale 18 %.",
    date: "2026-05-15",
    riskScore: 65,
  },
  {
    id: "ai4",
    title: "Audit trail incomplet : Transactions sans justificatifs",
    description:
      "23 transactions d'une valeur totale de MAD 890 000 ne disposent pas de pièces justificatives attachées dans le système GED, en violation de la politique de documentation interne.",
    severity: "High",
    category: "Documentation",
    badge: "Non-conforme",
    recommendation:
      "Envoyer des demandes de justificatifs aux responsables des transactions concernées avec délai de 5 jours ouvrables. Bloquer les futures transactions sans pièce jointe obligatoire.",
    insightType: "Conformité documentaire",
    confidence: 100,
    affectedPeriod: "Jan-Mai 2026",
    details:
      "Répartition : Paiements fournisseurs (14 transactions, MAD 620 000), Remboursements frais (6 transactions, MAD 180 000), Virements internes (3 transactions, MAD 90 000). Responsables identifiés pour chaque transaction.",
    date: "2026-05-14",
    riskScore: 72,
  },
  {
    id: "ai5",
    title: "Optimisation détectée : Consolidation des contrats fournisseurs",
    description:
      "L'IA a identifié 8 fournisseurs offrant des services similaires avec des contrats séparés. La consolidation pourrait générer des économies d'échelle significatives.",
    severity: "Low",
    category: "Optimization",
    badge: "Opportunité",
    recommendation:
      "Lancer une analyse comparative des offres fournisseurs et négocier des contrats-cadres consolidés. Potentiel d'économies estimé à MAD 340 000/an.",
    insightType: "Optimisation des coûts",
    confidence: 76,
    affectedPeriod: "2026",
    details:
      "Fournisseurs concernés : Services de nettoyage (3 contrats), Maintenance informatique (2 contrats), Fournitures de bureau (3 contrats). Valeur totale actuelle : MAD 2 180 000/an. Économies potentielles : 15-18 % par consolidation.",
    date: "2026-05-10",
    riskScore: 20,
  },
];

const mockReportingInsights = [
  {
    id: "ri1",
    title: "Taux d'exécution budgétaire : En dessous des objectifs",
    description:
      "Le taux d'exécution budgétaire global atteint 41 % à mi-exercice, contre un objectif de 50 %. 6 départements présentent un taux inférieur à 30 %.",
    severity: "Medium",
    category: "Performance",
    badge: "Sous-objectif",
    recommendation:
      "Organiser des réunions de suivi avec les chefs de département sous-performants. Identifier les blocages opérationnels et accélérer les procédures d'engagement.",
    kpi: "Taux d'exécution",
    kpiValue: "41 %",
    kpiTarget: "50 %",
    kpiVariance: "-9 pts",
    trend: "down",
    trendLabel: "Baisse de 3 pts vs mois dernier",
    details:
      "Départements sous 30 % : Travaux publics (24 %), Formation (18 %), R&D (27 %), Communication (29 %), Environnement (22 %), Sécurité (31 %). Causes identifiées : retards de validation, problèmes de passation de marchés.",
    date: "2026-05-19",
    period: "Jan-Mai 2026",
  },
  {
    id: "ri2",
    title: "Délai moyen de paiement : Dégradation continue",
    description:
      "Le délai moyen de paiement des fournisseurs a augmenté à 47 jours en avril 2026, contre 38 jours en janvier. Risque de détérioration des relations fournisseurs.",
    severity: "High",
    category: "Payment",
    badge: "Dégradation",
    recommendation:
      "Revoir le processus de validation des factures pour réduire les délais. Mettre en place un tableau de bord de suivi des paiements en temps réel. Objectif : revenir à 30 jours.",
    kpi: "Délai moyen paiement",
    kpiValue: "47 jours",
    kpiTarget: "30 jours",
    kpiVariance: "+17 jours",
    trend: "up",
    trendLabel: "Hausse de 9 jours en 4 mois",
    details:
      "Évolution mensuelle : Jan (38j), Fév (40j), Mar (43j), Avr (47j). Principaux retards : validation comptable (+8j), signature ordonnancement (+5j), traitement bancaire (+4j). Fournisseurs les plus impactés : PME locales.",
    date: "2026-05-18",
    period: "Jan-Avr 2026",
  },
  {
    id: "ri3",
    title: "Économies réalisées : Négociations fournisseurs Q1",
    description:
      "Les négociations fournisseurs du Q1 2026 ont généré des économies de MAD 1 240 000 par rapport aux prix de référence, soit 8,3 % d'économies sur les marchés renégociés.",
    severity: "Low",
    category: "Savings",
    badge: "Positif",
    recommendation:
      "Capitaliser sur les bonnes pratiques de négociation identifiées. Étendre la démarche aux contrats arrivant à renouvellement au Q3. Former les acheteurs aux techniques de négociation avancées.",
    kpi: "Économies réalisées",
    kpiValue: "MAD 1 240 000",
    kpiTarget: "MAD 900 000",
    kpiVariance: "+MAD 340 000",
    trend: "up",
    trendLabel: "Dépassement objectif de 38 %",
    details:
      "Économies par catégorie : Fournitures IT (MAD 420 000), Services de maintenance (MAD 380 000), Logistique (MAD 290 000), Consulting (MAD 150 000). Top négociateurs : Équipe Achats Stratégiques. Méthodes : appels d'offres compétitifs, négociations groupées.",
    date: "2026-05-15",
    period: "Q1 2026",
  },
  {
    id: "ri4",
    title: "Prévision de dépassement : Budget Travaux H2 2026",
    description:
      "Le modèle prédictif IA projette un dépassement de 18 % du budget Travaux pour le 2ème semestre 2026, basé sur les tendances actuelles et les engagements en cours.",
    severity: "High",
    category: "Forecast",
    badge: "Prévision IA",
    recommendation:
      "Réviser le plan de travaux H2 et prioriser les projets critiques. Négocier des avenants de réduction de périmètre avec les prestataires. Demander une révision budgétaire anticipée.",
    kpi: "Prévision dépassement",
    kpiValue: "+18 %",
    kpiTarget: "0 %",
    kpiVariance: "+18 pts",
    trend: "up",
    trendLabel: "Projection basée sur 6 mois de données",
    details:
      "Facteurs de risque : Hausse des matériaux de construction (+12 %), Retards de livraison fournisseurs, Travaux supplémentaires non budgétés (3 chantiers). Budget H2 actuel : MAD 8 400 000. Dépassement projeté : MAD 1 512 000. Confiance du modèle : 79 %.",
    date: "2026-05-17",
    period: "H2 2026 (prévision)",
  },
  {
    id: "ri5",
    title: "Rapport de conformité : Score global 73/100",
    description:
      "Le score de conformité global de l'organisation atteint 73/100 pour le mois de mai 2026, en amélioration de 5 points par rapport à avril. 4 axes d'amélioration prioritaires identifiés.",
    severity: "Medium",
    category: "Compliance",
    badge: "Rapport mensuel",
    recommendation:
      "Concentrer les efforts sur les 4 axes prioritaires : documentation des marchés, délais de validation, gestion des accès, et formation réglementaire. Objectif : atteindre 85/100 d'ici septembre.",
    kpi: "Score conformité",
    kpiValue: "73/100",
    kpiTarget: "85/100",
    kpiVariance: "-12 pts",
    trend: "up",
    trendLabel: "Amélioration de +5 pts vs avril",
    details:
      "Scores par axe : Documentation (68/100), Délais réglementaires (71/100), Sécurité des accès (79/100), Formation (74/100), Marchés publics (72/100). Évolution : Jan (61), Fév (64), Mar (67), Avr (68), Mai (73).",
    date: "2026-05-19",
    period: "Mai 2026",
  },
  {
    id: "ri6",
    title: "Analyse comparative : Performance vs organismes similaires",
    description:
      "Le benchmarking sectoriel révèle que l'organisation se situe dans le 3ème quartile pour l'efficacité des dépenses et le 2ème quartile pour les délais de paiement parmi 24 organismes comparables.",
    severity: "Low",
    category: "Benchmark",
    badge: "Benchmark",
    recommendation:
      "Étudier les pratiques des organisations du 1er quartile pour identifier les leviers d'amélioration. Mettre en place un programme d'amélioration continue sur 18 mois.",
    kpi: "Rang sectoriel",
    kpiValue: "Q3 (efficacité)",
    kpiTarget: "Q1",
    kpiVariance: "2 quartiles d'écart",
    trend: "stable",
    trendLabel: "Position stable depuis 6 mois",
    details:
      "Panel de comparaison : 24 organismes publics de taille similaire. Indicateurs évalués : taux d'exécution, délais de paiement, taux de conformité, économies réalisées, digitalisation. Points forts : digitalisation (Q1), gestion des risques (Q2). Points faibles : délais de paiement (Q3), taux d'exécution (Q4).",
    date: "2026-05-12",
    period: "2025-2026",
  },
];

// ─── Mock Supplier Data ───────────────────────────────────────────────────────

const mockSuppliers = [
  {
    id: "sup1",
    name: "ATLAS TECH SOLUTIONS",
    category: "Informatique",
    reliabilityScore: 87,
    riskLevel: "Low",
    totalContracts: 14,
    totalAmount: 3420000,
    onTimeDelivery: 93,
    qualityScore: 89,
    documentStatus: "Valid",
    certificationExpiry: "2027-03-15",
    daysUntilExpiry: 300,
    dominanceRate: 28,
    avgPriceDiff: -4.2,
    anomalies: [],
    aiRecommendation:
      "Fournisseur fiable avec un excellent historique de livraison. Recommandé pour les contrats IT stratégiques.",
    trend: "up",
    trendLabel: "Performance en hausse +5 pts ce trimestre",
    lastAudit: "2026-03-10",
    country: "Maroc",
    status: "Active",
    badge: "Fiable",
  },
  {
    id: "sup2",
    name: "MAROC BUILD & CONSTRUCT",
    category: "Travaux",
    reliabilityScore: 61,
    riskLevel: "Medium",
    totalContracts: 8,
    totalAmount: 7850000,
    onTimeDelivery: 72,
    qualityScore: 68,
    documentStatus: "Expiring",
    certificationExpiry: "2026-06-02",
    daysUntilExpiry: 14,
    dominanceRate: 41,
    avgPriceDiff: -2.1,
    anomalies: [
      "Certificat qualité expire dans 14 jours",
      "Retards récurrents sur 3 chantiers",
    ],
    aiRecommendation:
      "Documents fournisseur expirent dans 14 jours. Renouvellement urgent requis avant tout nouveau contrat.",
    trend: "down",
    trendLabel: "Baisse de performance -8 pts",
    lastAudit: "2026-01-22",
    country: "Maroc",
    status: "Active",
    badge: "Attention",
  },
  {
    id: "sup3",
    name: "CASABLANCA INFRA GROUP",
    category: "Infrastructure",
    reliabilityScore: 44,
    riskLevel: "High",
    totalContracts: 19,
    totalAmount: 12300000,
    onTimeDelivery: 58,
    qualityScore: 52,
    documentStatus: "Expired",
    certificationExpiry: "2026-04-01",
    daysUntilExpiry: -48,
    dominanceRate: 67,
    avgPriceDiff: -18.5,
    anomalies: [
      "Attestation fiscale expirée depuis 48 jours",
      "Dominance suspecte sur 67 % des marchés infrastructure",
      "Prix 18.5 % en dessous de la moyenne du marché",
    ],
    aiRecommendation:
      "ALERTE : Documents expirés + dominance de marché anormale (67 %). Suspendre les nouveaux contrats et lancer un audit de conformité immédiat.",
    trend: "down",
    trendLabel: "Dégradation continue depuis 6 mois",
    lastAudit: "2025-11-05",
    country: "Maroc",
    status: "Suspended",
    badge: "Critique",
  },
  {
    id: "sup4",
    name: "DIGITAL SOLUTIONS MAROC",
    category: "Informatique",
    reliabilityScore: 79,
    riskLevel: "Low",
    totalContracts: 11,
    totalAmount: 1980000,
    onTimeDelivery: 88,
    qualityScore: 82,
    documentStatus: "Valid",
    certificationExpiry: "2026-12-20",
    daysUntilExpiry: 215,
    dominanceRate: 18,
    avgPriceDiff: 3.7,
    anomalies: [],
    aiRecommendation:
      "Bon fournisseur IT avec des prix légèrement au-dessus de la moyenne. Négocier un contrat-cadre pour optimiser les coûts.",
    trend: "stable",
    trendLabel: "Performance stable",
    lastAudit: "2026-02-14",
    country: "Maroc",
    status: "Active",
    badge: null,
  },
  {
    id: "sup5",
    name: "AL MAGHRIB SUPPLIES",
    category: "Fournitures",
    reliabilityScore: 55,
    riskLevel: "High",
    totalContracts: 23,
    totalAmount: 890000,
    onTimeDelivery: 64,
    qualityScore: 59,
    documentStatus: "Expiring",
    certificationExpiry: "2026-05-31",
    daysUntilExpiry: 12,
    dominanceRate: 52,
    avgPriceDiff: 1.2,
    anomalies: [
      "RC et attestation CNSS expirent dans 12 jours",
      "Taux de dominance élevé sur fournitures (52 %)",
    ],
    aiRecommendation:
      "Documents fournisseur expirent dans 12 jours. Dominance de 52 % sur le segment fournitures — diversifier les sources d'approvisionnement.",
    trend: "down",
    trendLabel: "Baisse de fiabilité -12 pts en 3 mois",
    lastAudit: "2026-01-08",
    country: "Maroc",
    status: "Active",
    badge: "Expire bientôt",
  },
  {
    id: "sup6",
    name: "TECHNO MAROC SARL",
    category: "Équipements",
    reliabilityScore: 32,
    riskLevel: "Critical",
    totalContracts: 6,
    totalAmount: 2100000,
    onTimeDelivery: 41,
    qualityScore: 38,
    documentStatus: "Expired",
    certificationExpiry: "2026-02-15",
    daysUntilExpiry: -93,
    dominanceRate: 15,
    avgPriceDiff: -37.0,
    anomalies: [
      "Prix 37 % en dessous de la moyenne — offre anormalement basse",
      "Documents expirés depuis 93 jours",
      "Paiement suspect de MAD 340 000 sans BC validé",
      "Taux de livraison à temps : seulement 41 %",
    ],
    aiRecommendation:
      "CRITIQUE : Fournisseur présente un prix 37 % inférieur à la moyenne du marché — offre anormalement basse. Documents expirés + incident de paiement suspect. Blacklister en attente d'investigation.",
    trend: "down",
    trendLabel: "Dégradation critique",
    lastAudit: "2025-09-20",
    country: "Maroc",
    status: "Blacklisted",
    badge: "Critique",
  },
  {
    id: "sup7",
    name: "ATLAS LOGISTICS & TRANSPORT",
    category: "Logistique",
    reliabilityScore: 91,
    riskLevel: "Low",
    totalContracts: 17,
    totalAmount: 4560000,
    onTimeDelivery: 96,
    qualityScore: 93,
    documentStatus: "Valid",
    certificationExpiry: "2027-08-10",
    daysUntilExpiry: 448,
    dominanceRate: 34,
    avgPriceDiff: 0.8,
    anomalies: [],
    aiRecommendation:
      "Fournisseur logistique de référence. Excellent taux de livraison (96 %). Recommandé pour extension de contrat-cadre.",
    trend: "up",
    trendLabel: "Meilleure performance du portefeuille",
    lastAudit: "2026-04-05",
    country: "Maroc",
    status: "Active",
    badge: "Top Fournisseur",
  },
  {
    id: "sup8",
    name: "MAROC SERVICES GÉNÉRAUX",
    category: "Services",
    reliabilityScore: 68,
    riskLevel: "Medium",
    totalContracts: 31,
    totalAmount: 2340000,
    onTimeDelivery: 77,
    qualityScore: 71,
    documentStatus: "Valid",
    certificationExpiry: "2026-09-30",
    daysUntilExpiry: 134,
    dominanceRate: 48,
    avgPriceDiff: -8.3,
    anomalies: [
      "Dominance de 48 % sur le segment services généraux",
      "Prix 8.3 % en dessous de la moyenne — vérifier la qualité",
    ],
    aiRecommendation:
      "Dominance de marché à surveiller (48 %). Prix bas suspects — vérifier la qualité des prestations. Recommander un audit qualité avant renouvellement.",
    trend: "stable",
    trendLabel: "Performance stable mais dominance croissante",
    lastAudit: "2026-02-28",
    country: "Maroc",
    status: "Active",
    badge: "Surveillance",
  },
];

// ─── Mock Quote/Tender Data ───────────────────────────────────────────────────

const mockQuoteComparisons = [
  {
    id: "qc1",
    tenderRef: "AO-2026-018",
    title: "Fourniture et installation de serveurs datacenter",
    category: "Informatique",
    status: "Anomaly",
    openDate: "2026-04-15",
    closeDate: "2026-05-10",
    estimatedBudget: 2500000,
    aiRiskScore: 87,
    aiSummary:
      "Écart de prix anormalement faible entre soumissionnaires (4.7 %). Probabilité d'entente calculée à 87 %. Deux soumissionnaires ont déjà soumis ensemble sur AO-2025-031.",
    anomalyType: "Entente présumée",
    recommendation:
      "Annuler l'appel d'offres et relancer avec un cahier des charges révisé. Signaler au Conseil de la Concurrence. Élargir la liste des soumissionnaires.",
    quotes: [
      {
        supplierId: "q1s1",
        supplierName: "MAROC BUILD",
        amount: 2340000,
        deliveryDays: 45,
        warrantyMonths: 24,
        technicalScore: 72,
        financialScore: 68,
        globalScore: 70,
        status: "Suspicious",
        deviation: -6.4,
        notes: "Offre suspecte — écart minimal avec concurrents",
      },
      {
        supplierId: "q1s2",
        supplierName: "ATLAS CONSTRUCT",
        amount: 2394000,
        deliveryDays: 50,
        warrantyMonths: 24,
        technicalScore: 74,
        financialScore: 65,
        globalScore: 70,
        status: "Suspicious",
        deviation: -4.2,
        notes: "Offre suspecte — historique commun avec MAROC BUILD",
      },
      {
        supplierId: "q1s3",
        supplierName: "CASABLANCA WORKS",
        amount: 2287000,
        deliveryDays: 42,
        warrantyMonths: 18,
        technicalScore: 69,
        financialScore: 71,
        globalScore: 70,
        status: "Suspicious",
        deviation: -8.5,
        notes: "Prix le plus bas mais qualité technique insuffisante",
      },
    ],
    avgAmount: 2340333,
    minAmount: 2287000,
    maxAmount: 2394000,
    priceSpread: 4.7,
    details:
      "Analyse IA : Les 3 soumissionnaires présentent des prix dans une fourchette de 4.7 %, ce qui est statistiquement improbable pour un marché de cette taille. Historique : MAROC BUILD et ATLAS CONSTRUCT ont soumis ensemble sur 3 appels d'offres en 2025. Recommandation : investigation anti-trust.",
  },
  {
    id: "qc2",
    tenderRef: "AO-2026-024",
    title: "Services de nettoyage et entretien des locaux",
    category: "Services",
    status: "Anomaly",
    openDate: "2026-04-20",
    closeDate: "2026-05-15",
    estimatedBudget: 480000,
    aiRiskScore: 74,
    aiSummary:
      "Offre de CLEAN MAROC PRO présente un prix 37 % inférieur à la moyenne des autres soumissionnaires. Offre anormalement basse — risque de sous-traitance non déclarée ou de non-respect des normes.",
    anomalyType: "Offre anormalement basse",
    recommendation:
      "Demander des justificatifs détaillés à CLEAN MAROC PRO. Vérifier la capacité financière et les références. Appliquer la procédure d'offre anormalement basse selon le règlement.",
    quotes: [
      {
        supplierId: "q2s1",
        supplierName: "CLEAN MAROC PRO",
        amount: 198000,
        deliveryDays: 7,
        warrantyMonths: 12,
        technicalScore: 61,
        financialScore: 95,
        globalScore: 74,
        status: "AbnormallyLow",
        deviation: -37.0,
        notes: "Prix 37 % sous la moyenne — offre anormalement basse",
      },
      {
        supplierId: "q2s2",
        supplierName: "MAROC SERVICES GÉNÉRAUX",
        amount: 312000,
        deliveryDays: 14,
        warrantyMonths: 12,
        technicalScore: 78,
        financialScore: 72,
        globalScore: 75,
        status: "Normal",
        deviation: -1.3,
        notes: "Offre conforme aux prix du marché",
      },
      {
        supplierId: "q2s3",
        supplierName: "PROPRETE ATLAS",
        amount: 328000,
        deliveryDays: 10,
        warrantyMonths: 12,
        technicalScore: 82,
        financialScore: 68,
        globalScore: 76,
        status: "Normal",
        deviation: 3.8,
        notes: "Meilleur score technique",
      },
      {
        supplierId: "q2s4",
        supplierName: "HYGIENE PLUS SARL",
        amount: 341000,
        deliveryDays: 12,
        warrantyMonths: 18,
        technicalScore: 75,
        financialScore: 65,
        globalScore: 71,
        status: "Normal",
        deviation: 7.9,
        notes: "Garantie étendue 18 mois",
      },
    ],
    avgAmount: 294750,
    minAmount: 198000,
    maxAmount: 341000,
    priceSpread: 72.2,
    details:
      "L'offre de CLEAN MAROC PRO est 37 % inférieure à la moyenne des autres soumissionnaires. Selon le règlement des marchés publics, une offre inférieure de plus de 25 % à la moyenne doit faire l'objet d'une procédure de vérification. La capacité financière de ce fournisseur doit être évaluée.",
  },
  {
    id: "qc3",
    tenderRef: "AO-2026-031",
    title: "Acquisition de véhicules de service",
    category: "Équipements",
    status: "Normal",
    openDate: "2026-05-01",
    closeDate: "2026-05-20",
    estimatedBudget: 1800000,
    aiRiskScore: 22,
    aiSummary:
      "Appel d'offres conforme. Bonne concurrence entre 5 soumissionnaires avec un écart de prix sain (18.3 %). Aucune anomalie détectée. ATLAS MOTORS recommandé.",
    anomalyType: null,
    recommendation:
      "Attribuer le marché à ATLAS MOTORS — meilleur rapport qualité/prix avec score global de 84/100. Négocier une extension de garantie à 36 mois.",
    quotes: [
      {
        supplierId: "q3s1",
        supplierName: "ATLAS MOTORS",
        amount: 1620000,
        deliveryDays: 30,
        warrantyMonths: 24,
        technicalScore: 88,
        financialScore: 82,
        globalScore: 85,
        status: "Recommended",
        deviation: -10.0,
        notes: "Meilleur rapport qualité/prix — recommandé",
      },
      {
        supplierId: "q3s2",
        supplierName: "AUTO MAROC FLEET",
        amount: 1750000,
        deliveryDays: 45,
        warrantyMonths: 36,
        technicalScore: 82,
        financialScore: 74,
        globalScore: 79,
        status: "Normal",
        deviation: -2.8,
        notes: "Garantie 36 mois mais délai plus long",
      },
      {
        supplierId: "q3s3",
        supplierName: "CASABLANCA AUTO GROUP",
        amount: 1820000,
        deliveryDays: 35,
        warrantyMonths: 24,
        technicalScore: 79,
        financialScore: 70,
        globalScore: 75,
        status: "Normal",
        deviation: 1.1,
        notes: "Prix dans la moyenne",
      },
      {
        supplierId: "q3s4",
        supplierName: "MAGHREB VEHICLES",
        amount: 1870000,
        deliveryDays: 40,
        warrantyMonths: 24,
        technicalScore: 76,
        financialScore: 67,
        globalScore: 72,
        status: "Normal",
        deviation: 3.9,
        notes: "Prix légèrement au-dessus",
      },
      {
        supplierId: "q3s5",
        supplierName: "TRANSPORT SOLUTIONS MA",
        amount: 1920000,
        deliveryDays: 28,
        warrantyMonths: 12,
        technicalScore: 71,
        financialScore: 63,
        globalScore: 68,
        status: "Normal",
        deviation: 6.7,
        notes: "Délai court mais garantie limitée",
      },
    ],
    avgAmount: 1796000,
    minAmount: 1620000,
    maxAmount: 1920000,
    priceSpread: 18.5,
    details:
      "Appel d'offres bien concurrentiel avec 5 soumissionnaires qualifiés. L'écart de prix de 18.5 % est dans la norme pour ce type de marché. ATLAS MOTORS présente le meilleur score global (85/100) avec un prix 10 % sous la moyenne et un délai de livraison compétitif.",
  },
  {
    id: "qc4",
    tenderRef: "AO-2026-037",
    title: "Travaux de rénovation bâtiment administratif",
    category: "Travaux",
    status: "Incomplete",
    openDate: "2026-05-05",
    closeDate: "2026-05-25",
    estimatedBudget: 5500000,
    aiRiskScore: 61,
    aiSummary:
      "2 soumissionnaires sur 4 ont des dossiers incomplets. Documents manquants : attestation fiscale (RENO MAROC), plan de charge (CONSTRUCT ATLAS). Délai de régularisation : 5 jours ouvrables.",
    anomalyType: "Dossiers incomplets",
    recommendation:
      "Accorder un délai de 5 jours ouvrables pour régularisation des dossiers incomplets. Si non régularisés, éliminer les soumissionnaires concernés et procéder avec les 2 dossiers complets.",
    quotes: [
      {
        supplierId: "q4s1",
        supplierName: "RENO MAROC SARL",
        amount: 4980000,
        deliveryDays: 120,
        warrantyMonths: 24,
        technicalScore: 0,
        financialScore: 0,
        globalScore: 0,
        status: "Incomplete",
        deviation: -9.5,
        notes: "Dossier incomplet — attestation fiscale manquante",
      },
      {
        supplierId: "q4s2",
        supplierName: "ATLAS RENOVATION",
        amount: 5250000,
        deliveryDays: 90,
        warrantyMonths: 36,
        technicalScore: 84,
        financialScore: 76,
        globalScore: 81,
        status: "Normal",
        deviation: -4.5,
        notes: "Dossier complet — meilleur score technique",
      },
      {
        supplierId: "q4s3",
        supplierName: "CONSTRUCT ATLAS",
        amount: 5480000,
        deliveryDays: 100,
        warrantyMonths: 24,
        technicalScore: 0,
        financialScore: 0,
        globalScore: 0,
        status: "Incomplete",
        deviation: -0.4,
        notes: "Dossier incomplet — plan de charge manquant",
      },
      {
        supplierId: "q4s4",
        supplierName: "MAROC TRAVAUX PUBLICS",
        amount: 5720000,
        deliveryDays: 110,
        warrantyMonths: 24,
        technicalScore: 79,
        financialScore: 71,
        globalScore: 76,
        status: "Normal",
        deviation: 4.0,
        notes: "Dossier complet",
      },
    ],
    avgAmount: 5357500,
    minAmount: 4980000,
    maxAmount: 5720000,
    priceSpread: 14.9,
    details:
      "2 soumissionnaires sur 4 ont des dossiers incomplets. RENO MAROC SARL : attestation fiscale manquante (document obligatoire). CONSTRUCT ATLAS : plan de charge non fourni. La commission doit statuer sur l'admissibilité après délai de régularisation.",
  },
  {
    id: "qc5",
    tenderRef: "AO-2026-041",
    title: "Prestation de formation professionnelle",
    category: "Formation",
    status: "Anomaly",
    openDate: "2026-05-08",
    closeDate: "2026-05-22",
    estimatedBudget: 320000,
    aiRiskScore: 68,
    aiSummary:
      "Incohérence détectée dans les devis de FORMATION ATLAS : prix unitaire varie de 15 % entre deux lots identiques. Possible erreur de calcul ou manipulation tarifaire.",
    anomalyType: "Incohérence tarifaire",
    recommendation:
      "Demander une clarification écrite à FORMATION ATLAS sur l'incohérence tarifaire. Comparer avec les prix de référence du marché de la formation. Envisager un audit des offres.",
    quotes: [
      {
        supplierId: "q5s1",
        supplierName: "FORMATION ATLAS",
        amount: 285000,
        deliveryDays: 30,
        warrantyMonths: 0,
        technicalScore: 76,
        financialScore: 82,
        globalScore: 78,
        status: "Inconsistent",
        deviation: -10.9,
        notes:
          "Incohérence tarifaire détectée entre lots — vérification requise",
      },
      {
        supplierId: "q5s2",
        supplierName: "SKILLS MAROC",
        amount: 298000,
        deliveryDays: 45,
        warrantyMonths: 0,
        technicalScore: 83,
        financialScore: 78,
        globalScore: 81,
        status: "Recommended",
        deviation: -6.9,
        notes: "Meilleur score technique — recommandé",
      },
      {
        supplierId: "q5s3",
        supplierName: "EXPERT TRAINING MA",
        amount: 334000,
        deliveryDays: 35,
        warrantyMonths: 0,
        technicalScore: 79,
        financialScore: 71,
        globalScore: 76,
        status: "Normal",
        deviation: 4.4,
        notes: "Prix légèrement au-dessus du budget",
      },
    ],
    avgAmount: 305667,
    minAmount: 285000,
    maxAmount: 334000,
    priceSpread: 17.2,
    details:
      "L'analyse IA a détecté une incohérence dans l'offre de FORMATION ATLAS : le prix unitaire par jour de formation varie de 15 % entre le lot 1 (MAD 4 200/jour) et le lot 2 (MAD 4 830/jour) pour des prestations identiques. Cette incohérence doit être clarifiée avant toute décision d'attribution.",
  },
];

// ─── Service Functions ─────────────────────────────────────────────────────────

const simulateDelay = (ms = 1200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getBudgetAlerts = async () => {
  await simulateDelay();
  return mockBudgetAlerts;
};

const getComplianceAlerts = async () => {
  await simulateDelay(1400);
  return mockComplianceAlerts;
};

const getAuditInsights = async () => {
  await simulateDelay(1600);
  return mockAuditInsights;
};

const getReportingInsights = async () => {
  await simulateDelay(1300);
  return mockReportingInsights;
};

const getAIAssistants = async () => {
  await simulateDelay(800);
  return [
    {
      id: 1,
      name: "Budget Assistant",
      description: "Helps with budget management tasks.",
      status: "active",
    },
    {
      id: 2,
      name: "Compliance Assistant",
      description: "Ensures compliance with regulations.",
      status: "active",
    },
    {
      id: 3,
      name: "Audit Assistant",
      description: "Analyzes audit trails and inconsistencies.",
      status: "active",
    },
    {
      id: 4,
      name: "Reporting Assistant",
      description: "Generates financial insights and forecasts.",
      status: "active",
    },
  ];
};

const getSupplierAnalysis = async () => {
  await simulateDelay(1500);
  return mockSuppliers;
};

const getQuoteComparisons = async () => {
  await simulateDelay(1700);
  return mockQuoteComparisons;
};

export default {
  getBudgetAlerts,
  getComplianceAlerts,
  getAuditInsights,
  getReportingInsights,
  getAIAssistants,
  getSupplierAnalysis,
  getQuoteComparisons,
};
