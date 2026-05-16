import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { initDataStore } from "./services/dataStore.js";

function Bootstrap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initDataStore()
      .then(() => setReady(true))
      .catch((err) => setError(err.message || "Impossible de charger les données."));
  }, []);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "'DM Sans', sans-serif",
          color: "#9B1C1C",
          padding: 24,
          textAlign: "center",
        }}
      >
        Erreur de connexion à l&apos;API : {error}
        <br />
        <small style={{ color: "#6B6760" }}>
          Démarrez le backend Flask (port 5000) et PostgreSQL.
        </small>
      </div>
    );
  }

  if (!ready) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "'DM Sans', sans-serif",
          color: "#6B6760",
        }}
      >
        Chargement des données…
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
