import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import './App.css';

function App() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');
    if (room) {
      setCurrentRoom(room);
    }
  }, []);

  const joinRoom = () => {
    if (roomId.trim() && username.trim()) {
      setCurrentRoom(roomId.trim());
      setCurrentUsername(username.trim());
      window.history.pushState({}, '', `?room=${roomId.trim()}`);
    }
  };

  const createNewRoom = () => {
    if (username.trim()) {
      const newRoomId = Math.random().toString(36).substring(2, 15);
      setCurrentRoom(newRoomId);
      setCurrentUsername(username.trim());
      window.history.pushState({}, '', `?room=${newRoomId}`);
    }
  };

  if (!currentRoom || !currentUsername) {
    return (
      <div className="app">
        <div className="room-selector">
          <h1>オンラインチャット</h1>
          <div className="room-controls">
            <input
              type="text"
              placeholder="ユーザー名を入力"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && document.getElementById('roomInput').focus()}
            />
            <input
              id="roomInput"
              type="text"
              placeholder="ルームIDを入力（任意）"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            />
            <button onClick={joinRoom} disabled={!username.trim()}>参加</button>
            <button onClick={createNewRoom} disabled={!username.trim()}>新しいルーム作成</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Chat roomId={currentRoom} username={currentUsername} />
    </div>
  );
}

export default App;