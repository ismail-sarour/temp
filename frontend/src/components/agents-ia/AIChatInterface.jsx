import React, { useState, useEffect } from "react";
import "./AIChatInterface.css";

const AIChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      setIsTyping(true);
      setMessages([...messages, { text: newMessage, sender: "user" }]);

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = getAIResponse(newMessage);
        setMessages([
          ...messages,
          { text: newMessage, sender: "user" },
          { text: aiResponse, sender: "ai" },
        ]);
        setIsTyping(false);
        setNewMessage("");
      }, 2000);
    }
  };

  const getAIResponse = (message) => {
    // Mock AI response based on the message
    if (message.includes("budget")) {
      return "I can help you with budget control. Please provide the budget name and the time period you are interested in.";
    } else if (message.includes("supplier")) {
      return "I can help you verify a supplier. Please provide the supplier's name, location, and contact information.";
    } else if (message.includes("audit")) {
      return "I can help you with audit analysis. Which area are you interested in?";
    } else if (message.includes("quote")) {
      return "I can help you with quote comparison. Please provide the quote details.";
    } else {
      return "I'm sorry, I don't have information on that topic. Please try a different question.";
    }
  };

  const quickPrompts = [
    "Budget control",
    "Supplier verification",
    "Audit analysis",
    "Quote comparison",
    "Compliance checks",
    "Reporting insights",
  ];

  const handleQuickPromptClick = (prompt) => {
    setNewMessage(prompt);
    handleSendMessage();
  };

  return (
    <div className="ai-chat-interface">
      <div className="chat-history">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-container ${message.sender === "user" ? "user-message-container" : "ai-message-container"}`}
          >
            <div
              className={`message-bubble ${message.sender === "user" ? "user-message-bubble" : "ai-message-bubble"}`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isTyping && <div className="typing-indicator">AI is typing...</div>}
      </div>
      <div className="quick-prompts">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            className="quick-prompt-button"
            onClick={() => handleQuickPromptClick(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          className="message-input"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
        />
        <button className="send-button" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default AIChatInterface;
