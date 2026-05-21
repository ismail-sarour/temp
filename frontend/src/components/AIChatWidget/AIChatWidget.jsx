import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../../hooks/useApiData";
import "./AIChatWidget.css";

const AIChatWidget = ({ currentModule = "Tableau de bord" }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("casm_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved chat history", e);
      }
    }
    return [
      {
        text: "Bonjour ! Je suis votre Copilote CASM, spécialisé dans la gestion budgétaire publique marocaine, le suivi des fournisseurs, les engagements de dépenses et le contrôle de conformité. Comment puis-je vous éclairer aujourd'hui ?",
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => {
    const saved = localStorage.getItem("casm_chat_history");
    return saved ? 0 : 1;
  });

  const chatMessagesRef = useRef(null);

  // Auto-save history to localStorage
  useEffect(() => {
    localStorage.setItem("casm_chat_history", JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom when new messages arrive or widget states toggle
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, chatOpen, minimized, isLoading]);

  // Listen to custom "openAIChatWidget" events dispatched from Module 18
  useEffect(() => {
    const handleOpen = () => {
      setChatOpen(true);
      setMinimized(false);
      setIsFullscreen(false);
      setUnreadCount(0);
    };
    window.addEventListener("openAIChatWidget", handleOpen);
    return () => window.removeEventListener("openAIChatWidget", handleOpen);
  }, []);

  const toggleChat = () => {
    if (!chatOpen) {
      setChatOpen(true);
      setMinimized(false);
      setUnreadCount(0);
    } else {
      setChatOpen(false);
      setIsFullscreen(false);
    }
  };

  const toggleMinimize = (e) => {
    e.stopPropagation();
    setMinimized(!minimized);
    if (minimized) {
      setUnreadCount(0);
    }
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
    setMinimized(false);
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    if (window.confirm("Voulez-vous réinitialiser l'historique de la discussion ?")) {
      const initial = [
        {
          text: "Historique réinitialisé. Comment puis-je vous aider sur le module actuel ?",
          sender: "ai",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ];
      setMessages(initial);
      setUnreadCount(0);
    }
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend || textToSend.trim() === "") return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = { text: textToSend, sender: "user", timestamp };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Use proxy or full API base URL
      const response = await fetch(`${API_BASE_URL}/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          context: { page: currentModule },
          history: messages.slice(-15) // send last 15 messages for context depth
        }),
      });

      const data = await response.json();
      
      const aiResponseText = data.response || "Désolé, je n'ai pas pu générer de réponse.";
      const aiMsg = { 
        text: aiResponseText, 
        sender: "ai", 
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
      };

      setMessages((prev) => [...prev, aiMsg]);
      
      // If widget is minimized or closed when response arrives, increment unread badge
      if (!chatOpen || minimized) {
        setUnreadCount((c) => c + 1);
      }
    } catch (error) {
      console.error("Error communicating with AI Chat backend:", error);
      const errorMsg = {
        text: "Une erreur est survenue lors de la communication avec le serveur IA. Veuillez vérifier votre connexion ou la configuration backend.",
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
      if (!chatOpen || minimized) {
        setUnreadCount((c) => c + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // context-based recommendation suggestions
  const getSuggestions = (module) => {
    switch (module) {
      case "Fournisseurs":
        return [
          "Analyser mes fournisseurs actifs",
          "Vérifier la conformité réglementaire",
          "Détails sur les types de bénéficiaires"
        ];
      case "Exercices & Budget":
      case "Suivi Budgétaire":
      case "Affectation Budgétaire":
        return [
          "Synthèse des allocations budgétaires",
          "Risques de dépassement de crédit",
          "Lister les exercices actifs"
        ];
      case "Devis & Attributions":
        return [
          "Dernières offres de devis reçues",
          "Comparer les devis retenus",
          "Montants totaux des devis"
        ];
      case "Engagements Budgétaires":
        return [
          "Vérifier l'état des engagements",
          "Total engagé sur l'exercice",
          "Engagements rejetés ou en attente"
        ];
      case "Audit & Traçabilité":
        return [
          "Signaler des activités inhabituelles",
          "Résumé des logs administratifs",
          "Analyser la conformité des actions"
        ];
      default:
        return [
          "Statistiques clés de la plateforme",
          "Calcul du reste à engager (RAE)",
          "Aide générale sur CASM"
        ];
    }
  };

  const suggestions = getSuggestions(currentModule);

  return (
    <>
      {/* Backdrop overlay for Fullscreen mode only */}
      {chatOpen && isFullscreen && (
        <div className="ai-chat-backdrop" onClick={() => setIsFullscreen(false)} />
      )}

      <div
        className={`ai-chat-widget ${chatOpen ? "open" : "closed"} ${
          minimized ? "minimized" : ""
        } ${isFullscreen ? "fullscreen" : ""}`}
      >
        {/* Launcher Button (shown when closed) */}
        {!chatOpen && (
          <button className="ai-widget-launcher" onClick={toggleChat} title="Ouvrir l'assistant CASM Copilote">
            <div className="launcher-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 2.22.723 4.267 1.94 5.931L3.06 21.06a.75.75 0 00.99.99l3.129-.88A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.5a8.455 8.455 0 01-4.227-1.127.75.75 0 00-.59-.074l-2.073.584.584-2.073a.75.75 0 00-.074-.59A8.455 8.455 0 013.5 12c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5z" fill="#E8D5A3" />
                <circle cx="9" cy="11" r="1.5" fill="#E8D5A3" />
                <circle cx="15" cy="11" r="1.5" fill="#E8D5A3" />
                <path d="M8 15a4 4 0 008 0H8z" fill="#E8D5A3" />
              </svg>
            </div>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </button>
        )}

        {/* Chat Interface Panel */}
        {chatOpen && (
          <div className="chat-panel">
            {/* Header */}
            <div className="chat-header" onClick={toggleMinimize}>
              <div className="header-info">
                <div className="header-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#E8D5A3" />
                    <path d="M8 12a1 1 0 102 0 1 1 0 00-2 0zM14 12a1 1 0 102 0 1 1 0 00-2 0z" fill="#1A1917" />
                    <path d="M10 16a2.5 2.5 0 004 0h-4z" fill="#1A1917" />
                  </svg>
                </div>
                <div>
                  <div className="header-title">Copilote CASM</div>
                  <div className="header-status">
                    <span className="status-dot"></span>
                    En ligne • Context: <strong style={{ color: "#E8D5A3" }}>{currentModule}</strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="header-actions" onClick={(e) => e.stopPropagation()}>
                {/* Clear chat history */}
                <button className="action-btn" onClick={clearHistory} title="Réinitialiser la discussion">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                {/* Maximize / Restore */}
                <button className="action-btn" onClick={toggleFullscreen} title={isFullscreen ? "Restaurer la taille" : "Plein écran"}>
                  {isFullscreen ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 14h6v6m10-10h-6V4m0 6l6-6M10 14l-6 6" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3m1-13L3 3m18 0l-6 6M3 21l6-6m12 6l-6-6" />
                    </svg>
                  )}
                </button>
                {/* Minimize */}
                <button className="action-btn" onClick={toggleMinimize} title={minimized ? "Restaurer" : "Réduire"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5" />
                  </svg>
                </button>
                {/* Close */}
                <button className="action-btn close" onClick={toggleChat} title="Masquer l'assistant">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Widget Body */}
            {!minimized && (
              <div className="chat-body">
                {/* Messages container */}
                <div className="chat-messages" ref={chatMessagesRef}>
                  {messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.sender}`}>
                      <div className={`message-bubble ${msg.isError ? "error" : ""}`}>
                        <div className="message-text">{msg.text}</div>
                        <div className="message-time">{msg.timestamp}</div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing / Loading state */}
                  {isLoading && (
                    <div className="message-wrapper ai loading">
                      <div className="message-bubble">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions Row */}
                {!isLoading && suggestions.length > 0 && (
                  <div className="suggestions-container">
                    <div className="suggestions-scroll">
                      {suggestions.map((sug, i) => (
                        <button
                          key={i}
                          className="suggestion-chip"
                          onClick={() => handleSendMessage(sug)}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Input Area */}
                <div className="chat-input-area">
                  <input
                    type="text"
                    placeholder="Écrivez votre question ici..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <button
                    className="send-button"
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputMessage.trim()}
                    title="Envoyer le message"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {/* Minimized Docker bar text (only when minimized) */}
            {minimized && (
              <div className="minimized-bar" onClick={toggleMinimize}>
                <span>Cliquez pour agrandir l'assistant IA</span>
                {unreadCount > 0 && <span className="unread-dot">{unreadCount}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AIChatWidget;
