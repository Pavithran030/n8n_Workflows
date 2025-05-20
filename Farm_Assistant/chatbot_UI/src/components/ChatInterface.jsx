import React, { useState, useEffect, useRef } from 'react';
import './ChatInterface.css';

const ChatInterface = () => {
  const [messages, setMessages] = useState([{
    text: "👋 Welcome to Farm Assistant! I'm here to help you with your farming questions. How can I assist you today?",
    sender: 'bot',
    timestamp: new Date().toISOString(),
    icon: '🤖'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format the bot message with selective emojis and text styling
  const formatBotMessage = (text) => {
    // First, try to parse if it's a JSON string
    let parsedText = text;
    try {
      if (typeof text === 'string' && text.startsWith('{')) {
        const parsed = JSON.parse(text);
        // Check for common response fields
        parsedText = parsed.output || parsed.response || parsed.message || parsed.text || text;
      }
    } catch (e) {
      // If parsing fails, use the original text
      parsedText = text;
    }

    // Apply text styling
    parsedText = parsedText
      // Convert markdown to HTML styling
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Highlight important points
      .replace(/(!\s?Important:.*?\.|Warning:.*?\.|Note:.*?\.)/g, '<span class="highlight">$1</span>');

    // Add selective emoji for key farming terms
    const formattedText = parsedText
      // Essential farming terms with emojis
      .replace(/\b(crops|harvest)\b/gi, '🌾 $1')
      .replace(/\b(water)\b/gi, '💧 $1')
      .replace(/\b(pests|disease)\b/gi, '⚠️ $1')
      // Error and help messages
      .replace(/\b(error|failed|cannot)\b/gi, '❌ $1')
      .replace(/\b(help|tip)\b/gi, '💡 $1');
    
    return formattedText;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    
    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
      icon: '👨‍🌾'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('http://localhost:5678/webhook/e805f259-dcee-4166-a7e0-92c5cf527d5d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response from n8n:', data); // For debugging
      
      // Improved response handling
      let botResponse;
      if (typeof data === 'string') {
        botResponse = data;
      } else if (data.output) {
        botResponse = data.output;
      } else if (data.response) {
        botResponse = data.response;
      } else if (data.message) {
        botResponse = data.message;
      } else {
        botResponse = JSON.stringify(data);
      }
      
      const botMessage = {
        text: formatBotMessage(botResponse),
        sender: 'bot',
        timestamp: new Date().toISOString(),
        icon: '🤖'
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        text: '⚠️ The workflow appears to be inactive. Please ensure your n8n workflow is active and try again.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        icon: '⚠️'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>🌾 Farm Assistant</h2>
        {isLoading && <div className="loading-indicator">🔄 Processing...</div>}
      </div>
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-icon">{message.icon}</div>
            <div className="message-bubble">
              <div className="message-content" dangerouslySetInnerHTML={{ __html: message.text }} />
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your farming question here... 🌱"
          className="chat-input"
          disabled={isLoading}
        />
        <button type="submit" className="send-button" disabled={isLoading}>
          {isLoading ? '🔄 Sending...' : '📤 Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;