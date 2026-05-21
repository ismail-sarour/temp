import React from "react";
import "./AIChatInterface.css";

const AIChatInterface = () => {
  const handleOpenGlobalChat = () => {
    // Dispatch a custom event to open the global widget
    window.dispatchEvent(new CustomEvent("openAIChatWidget"));
  };

  return (
    <div className="ai-chat-redirect-container">
      <div className="ai-card">
        <div className="ai-card-header">
          <div className="ai-card-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z" fill="#E8D5A3" />
              <path d="M12 6a3 3 0 00-3 3h2a1 1 0 011-1 1 1 0 011 1c0 1-1.5 1.5-1.5 2.5v1.5h1.5v-1c0-.8 1.5-1.3 1.5-2.5a3 3 0 00-3-3zM11.25 15h1.5v1.5h-1.5z" fill="#E8D5A3" />
            </svg>
          </div>
          <div>
            <h3 className="ai-card-title">Copilote IA Global</h3>
            <p className="ai-card-subtitle">Disponible sur toute la plateforme CASM</p>
          </div>
        </div>
        
        <p className="ai-card-description">
          L'Assistant IA de CASM n'est plus limité à ce module. Il a été transformé en un <strong>widget flottant persistant</strong> disponible sur tous les onglets (Fournisseurs, Budgets, Devis, Audit, Notifications, etc.).
        </p>

        <div className="ai-features-grid">
          <div className="ai-feature-card">
            <span className="feature-badge">✨ Persistance</span>
            <p>Votre historique de chat reste intact lorsque vous naviguez d'une page à l'autre.</p>
          </div>
          <div className="ai-feature-card">
            <span className="feature-badge">🔍 Contexte Réel</span>
            <p>L'IA analyse automatiquement le module ouvert (ex. fournisseurs actifs, alertes budgétaires, anomalies d'audit).</p>
          </div>
          <div className="ai-feature-card">
            <span className="feature-badge">🚀 Groq LLM</span>
            <p>Propulsé en tâche de fond par Groq API (Llama-3.3-70b-versatile) avec accès direct à vos données.</p>
          </div>
        </div>

        <div className="ai-card-action">
          <button className="ai-open-button" onClick={handleOpenGlobalChat}>
            <span className="btn-icon">💬</span>
            Activer l'Assistant IA
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface;
