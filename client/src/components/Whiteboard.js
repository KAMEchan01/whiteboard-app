import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import './Whiteboard.css';

const Whiteboard = ({ roomId }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [socket, setSocket] = useState(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(3);
  const [strokes, setStrokes] = useState([]);

  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.emit('join-room', roomId);

    newSocket.on('room-state', (receivedStrokes) => {
      setStrokes(receivedStrokes);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        receivedStrokes.forEach(stroke => {
          drawStroke(ctx, stroke);
        });
      }
    });

    newSocket.on('new-stroke', (stroke) => {
      setStrokes(prev => [...prev, stroke]);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        drawStroke(ctx, stroke);
      }
    });

    newSocket.on('board-cleared', () => {
      setStrokes([]);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 60;
      
      const ctx = canvas.getContext('2d');
      ctx.putImageData(imageData, 0, 0);
      
      strokes.forEach(stroke => {
        drawStroke(ctx, stroke);
      });
    };

    const initialResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 60;
    };

    initialResize();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [strokes]);

  const drawStroke = (ctx, stroke) => {
    if (stroke.points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    currentStroke = {
      tool,
      color: tool === 'eraser' ? '#FFFFFF' : color,
      size: tool === 'eraser' ? size * 3 : size,
      points: [{ x, y }]
    };
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStroke.points.push({ x, y });

    const ctx = canvas.getContext('2d');
    drawStroke(ctx, currentStroke);
  };

  const stopDrawing = () => {
    if (isDrawing && socket && currentStroke.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke]);
      socket.emit('draw-stroke', {
        roomId,
        stroke: currentStroke
      });
    }
    setIsDrawing(false);
  };

  const clearBoard = () => {
    if (socket) {
      socket.emit('clear-board', roomId);
    }
  };

  let currentStroke = null;

  return (
    <div className="whiteboard-container">
      <div className="toolbar">
        <div className="tool-group">
          <button 
            className={tool === 'pen' ? 'active' : ''}
            onClick={() => setTool('pen')}
          >
            ペン
          </button>
          <button 
            className={tool === 'eraser' ? 'active' : ''}
            onClick={() => setTool('eraser')}
          >
            消しゴム
          </button>
        </div>
        
        <div className="tool-group">
          <label>色:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={tool === 'eraser'}
          />
        </div>
        
        <div className="tool-group">
          <label>サイズ:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
          />
          <span>{size}</span>
        </div>
        
        <div className="tool-group">
          <button onClick={clearBoard} className="clear-btn">
            すべてクリア
          </button>
        </div>

        <div className="room-info">
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
      </div>
      
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ cursor: tool === 'eraser' ? 'crosshair' : 'crosshair' }}
      />
    </div>
  );
};

export default Whiteboard;