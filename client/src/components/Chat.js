import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import './Chat.css';

const Chat = ({ roomId, username }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      const joinData = { roomId, username };
      console.log('Joining room:', joinData);
      newSocket.emit('join-room', joinData);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('room-state', (chatHistory) => {
      console.log('Received room state:', chatHistory);
      setMessages(Array.isArray(chatHistory) ? chatHistory : []);
    });

    newSocket.on('new-message', (message) => {
      console.log('Received new message:', message);
      if (message && message.content) {
        setMessages(prev => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(m => 
            m.id === message.id || 
            (m.content === message.content && 
             m.username === message.username && 
             Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 1000)
          );
          
          if (exists) {
            console.log('Duplicate message ignored');
            return prev;
          }
          
          return [...prev, message];
        });
      }
    });

    newSocket.on('chat-cleared', () => {
      setMessages([]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, username]);

  const sendMessage = (e) => {
    e.preventDefault();
    
    const messageText = inputMessage.trim();
    if (!messageText || !socket) {
      console.log('Cannot send message:', { hasText: !!messageText, hasSocket: !!socket });
      return;
    }

    console.log('Sending message to room:', roomId, 'message:', messageText);

    // Send to server first
    socket.emit('send-message', {
      roomId,
      message: messageText,
      username
    });

    setInputMessage('');
  };

  const clearChat = () => {
    if (socket && window.confirm('チャット履歴をクリアしますか？')) {
      socket.emit('clear-chat', roomId);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-info">
          <span className="room-label">ルーム番号:</span>
          <span className="room-id">{roomId}</span>
          <button 
            className="copy-btn" 
            onClick={() => navigator.clipboard.writeText(roomId)}
            title="ルーム番号をコピー"
          >
            📋
          </button>
        </div>
        <div className="chat-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '接続中' : '切断中'}
          </span>
          <button onClick={clearChat} className="clear-btn" title="チャットをクリア">
            🗑️
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-header">
              <span className="username">{message.username}</span>
              <span className="timestamp">{formatTime(message.timestamp)}</span>
            </div>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="メッセージを入力..."
          className="message-input"
          disabled={!isConnected}
        />
        <button 
          type="submit" 
          className="send-btn"
          disabled={!inputMessage.trim() || !isConnected}
        >
          送信
        </button>
      </form>
    </div>
  );
};

export default Chat;