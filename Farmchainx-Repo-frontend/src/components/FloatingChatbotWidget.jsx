import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const THEME_COLOR = '#108544'; 

const MessageBubble = ({ message }) => {
  const { sender, text, data } = message;
  const isUser = sender === 'user';
  const IMAGE_BASE_URL = 'http://127.0.0.1:5001/result/';

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 15 }}>
      <div style={{
        maxWidth: '85%', padding: '12px 16px', borderRadius: '16px',
        background: isUser ? THEME_COLOR : '#f1f5f9', color: isUser ? '#fff' : '#1e293b',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: isUser ? 'none' : '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{text}</div>
        {data?.detections && (
          <div style={{ marginTop: 10, padding: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px' }}>
            {data.detections.map((d, i) => (
              <div key={i} style={{ fontSize: '12px', fontWeight: 'bold' }}>🟢 {d.label}: {(d.confidence * 100).toFixed(1)}%</div>
            ))}
          </div>
        )}
        {data?.result_image && (
          <img src={IMAGE_BASE_URL + encodeURIComponent(data.result_image)} alt="Scan" style={{ width: '100%', marginTop: 12, borderRadius: 10 }} />
        )}
      </div>
    </div>
  );
};

const FloatingChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hello! Upload a fruit photo or ask a question.' }]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatboxRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (chatboxRef.current) chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (file = null) => {
    const text = inputText.trim();
    if (!text && !file) return;
    setIsSending(true);
    setMessages(prev => [...prev, { sender: 'user', text: file ? `📸 Analyzing: ${file.name}` : text }]);
    setInputText('');

    try {
      const fd = new FormData();
      if (file) fd.append('image', file);
      fd.append('message', text || 'Analyze fruit');
      const res = await axios.post('http://127.0.0.1:5001/api/v1/chat', fd);
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply, data: res.data.data }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Server error. Check chatbot.py' }]);
    } finally {
      setIsSending(false);
    }
  };

  // --- REUSABLE FLEX CENTER STYLE ---
  const flexCenter = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
    border: 'none',
    outline: 'none'
  };

  return (
    <div style={{ position: 'fixed', bottom: 25, right: 25, zIndex: 9999 }}>
      {isOpen && (
        <div style={{ width: 380, height: 550, background: '#fff', borderRadius: 24, display: 'flex', flexDirection: 'column', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', overflow: 'hidden', marginBottom: 15 }}>
          <div style={{ padding: '20px', background: THEME_COLOR, color: '#fff', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>🍎 Fruit Quality AI</span>
            <button onClick={() => setIsOpen(false)} style={{ ...flexCenter, background: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}>×</button>
          </div>

          <div ref={chatboxRef} style={{ flex: 1, overflowY: 'auto', padding: 15, background: '#f8fafc' }}>
            {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
          </div>

          <div style={{ padding: '15px', display: 'flex', gap: 10, alignItems: 'center', background: '#fff', borderTop: '1px solid #eee' }}>
            {/* UPLOAD BUTTON - CENTERED */}
            <button 
              onClick={() => fileInputRef.current.click()} 
              style={{ ...flexCenter, background: '#f1f5f9', borderRadius: '50%', width: 42, height: 42, cursor: 'pointer' }}
            >
              <span style={{ lineHeight: 0, display: 'block', fontSize: '20px' }}>🖼️</span>
            </button>
            <input type="file" ref={fileInputRef} hidden onChange={e => handleSendMessage(e.target.files[0])} />
            
            <input 
              value={inputText} 
              onChange={e => setInputText(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
              placeholder="Ask a question..." 
              style={{ flex: 1, padding: '10px 15px', borderRadius: '25px', border: '1px solid #e2e8f0', outline: 'none' }} 
            />

            {/* SEND BUTTON - CENTERED */}
            <button 
              onClick={() => handleSendMessage()} 
              disabled={isSending} 
              style={{ ...flexCenter, background: THEME_COLOR, color: '#fff', borderRadius: '50%', width: 42, height: 42, cursor: 'pointer', opacity: isSending ? 0.6 : 1 }}
            >
              <span style={{ lineHeight: 0, display: 'block', fontSize: '18px', marginLeft: '2px' }}>➤</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN TOGGLE BUTTON - CENTERED */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          ...flexCenter,
          width: 70, height: 70, borderRadius: '50%', 
          backgroundColor: THEME_COLOR, 
          cursor: 'pointer', boxShadow: '0 8px 16px rgba(16, 133, 68, 0.4)'
        }}
      >
        {isOpen ? (
          <span style={{ color: '#fff', fontSize: '36px', lineHeight: 0, display: 'block', marginTop: '-4px' }}>×</span>
        ) : (
          <img 
            src="/icons8-chatbot-32.png" 
            alt="Chat" 
            style={{ width: 38, height: 38, display: 'block', filter: 'brightness(0) invert(1)', margin: 0, padding: 0 }} 
          />
        )}
      </button>
    </div>
  );
};

export default FloatingChatbotWidget;