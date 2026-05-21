import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AiChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    // Load conversation history from local storage or backend API
  }, []);

  const handleSendMessage = async () => {
    // Send message to backend API and update conversation history
    try {
      const response = await axios.post('/api/ai-chat', {
        message: currentMessage,
      });
      setConversationHistory([...conversationHistory, response.data]);
      setCurrentMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="ai-chat-widget">
      {isOpen ? (
        <div className="chat-panel">
          <div className="chat-header">
            <h2>AI Assistant</h2>
            <button onClick={() => setIsOpen(false)}>Minimize</button>
          </div>
          <div className="chat-body">
            {conversationHistory.map((message, index) => (
              <div key={index} className="message">
                {message}
              </div>
            ))}
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)}>Open AI Chat</button>
      )}
    </div>
  );
};

export default AiChatWidget;