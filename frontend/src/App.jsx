import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import GestionBudget from "./pages/GestionBudget";
import SuiviBudgetaire from "./pages/Suivibudgetaire";
import ParametrageLibelle from "./pages/ParametrageLibelle";
import ParametrageReglementaire from "./pages/ParametrageReglementaire";
import AffectationBudgetaire from "./pages/AffectationBudgetaire";
import GestionFournisseurs from "./pages/GestionFournisseurs";
import BoiteDeCommande from "./pages/BoiteDeCommande";
import GestionDevis from "./pages/GestionDevis";
import GestionEngagements from "./pages/GestionEngagements";
import GestionExecution from "./pages/GestionExecution";
import GestionOrdonnancement from "./pages/GestionOrdonnancement";
import GestionPaiements from "./pages/GestionPaiements";
import GestionVirements from "./pages/GestionVirements";
import GestionGED from "./pages/GestionGED";
import GestionAudit from "./pages/GestionAudit";
import GestionUtilisateurs from "./pages/GestionUtilisateurs";
import GestionNotifications from "./pages/GestionNotifications";

const pages = {
  "Tableau de bord": <Dashboard />,
  "Exercices & Budget": <GestionBudget />,
  "Nomenclature Budgétaire": <ParametrageLibelle />,
  "Paramétrage Réglementaire": <ParametrageReglementaire />,
  "Affectation Budgétaire": <AffectationBudgetaire />,
  Fournisseurs: <GestionFournisseurs />,
  "Boîte de Commande": <BoiteDeCommande />,
  "Devis & Attributions": <GestionDevis />,
  "Engagements Budgétaires": <GestionEngagements />,
  "Exécution des Prestations": <GestionExecution />,
  "Ordonnances de Paiement": <GestionOrdonnancement />,
  Paiements: <GestionPaiements />,
  "Virements Budgétaires": <GestionVirements />,
  GED: <GestionGED />,
  "Audit & Traçabilité": <GestionAudit />,
  Utilisateurs: <GestionUtilisateurs />,
  Notifications: <GestionNotifications />,
  "Suivi Budgétaire": <SuiviBudgetaire />,
};

export default function App() {
  const [active, setActive] = useState("Tableau de bord");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <Sidebar active={active} setActive={setActive} />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {pages[active]}
      </main>
    </div>
  );
}
