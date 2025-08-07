import React, { useState, useEffect } from 'react';
import Whiteboard from './components/Whiteboard';
import './App.css';

function App() {
  const [roomId, setRoomId] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');
    if (room) {
      setCurrentRoom(room);
    }
  }, []);

  const joinRoom = () => {
    if (roomId.trim()) {
      setCurrentRoom(roomId.trim());
      window.history.pushState({}, '', `?room=${roomId.trim()}`);
    }
  };

  const createNewRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 15);
    setCurrentRoom(newRoomId);
    window.history.pushState({}, '', `?room=${newRoomId}`);
  };

  if (!currentRoom) {
    return (
      <div className="app">
        <div className="room-selector">
          <h1>オンラインホワイトボード</h1>
          <div className="room-controls">
            <input
              type="text"
              placeholder="ルームIDを入力"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            />
            <button onClick={joinRoom}>参加</button>
            <button onClick={createNewRoom}>新しいルーム作成</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Whiteboard roomId={currentRoom} />
    </div>
  );
}

export default App;