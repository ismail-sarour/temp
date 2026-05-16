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

const pages = {
  "Tableau de bord":          <Dashboard />,
  "Exercices & Budget":       <GestionBudget />,
  "Nomenclature Budgétaire":  <ParametrageLibelle />,
  "Paramétrage Réglementaire": <ParametrageReglementaire />,
  "Affectation Budgétaire":   <AffectationBudgetaire />,
  "Fournisseurs":             <GestionFournisseurs />,
  "Boîte de Commande":        <BoiteDeCommande />,
  "Suivi Budgétaire":         <SuiviBudgetaire />,
};

export default function App() {
  const [active, setActive] = useState("Boîte de Commande");

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar active={active} setActive={setActive} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {pages[active]}
      </main>
    </div>
  );
}