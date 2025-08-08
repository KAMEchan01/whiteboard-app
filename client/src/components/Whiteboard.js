import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import './Whiteboard.css';

const Whiteboard = ({ roomId }) => {
  const canvasRef = useRef(null);
  const currentStrokeRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [socket, setSocket] = useState(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(3);
  const [strokes, setStrokes] = useState([]);

  const drawStroke = (ctx, stroke) => {
    if (!stroke || !stroke.points || stroke.points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color || '#000000';
    ctx.lineWidth = stroke.size || 3;
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

  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.emit('join-room', roomId);

    newSocket.on('room-state', (receivedStrokes) => {
      const validStrokes = Array.isArray(receivedStrokes) ? receivedStrokes.filter(stroke => stroke && stroke.points) : [];
      setStrokes(validStrokes);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        validStrokes.forEach(stroke => {
          drawStroke(ctx, stroke);
        });
      }
    });

    newSocket.on('new-stroke', (stroke) => {
      if (stroke && stroke.points) {
        setStrokes(prev => [...prev, stroke]);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          drawStroke(ctx, stroke);
        }
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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 60;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      strokes.filter(stroke => stroke && stroke.points).forEach(stroke => {
        drawStroke(ctx, stroke);
      });
    };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60;
    
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    strokes.filter(stroke => stroke && stroke.points).forEach(stroke => {
      drawStroke(ctx, stroke);
    });
  }, [strokes]);

  const getEventPosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getEventPosition(e);
    
    currentStrokeRef.current = {
      tool,
      color: tool === 'eraser' ? '#FFFFFF' : color,
      size: tool === 'eraser' ? size * 3 : size,
      points: [{ x, y }]
    };
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || !currentStrokeRef.current) return;

    const { x, y } = getEventPosition(e);
    const prevPoint = currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1];
    currentStrokeRef.current.points.push({ x, y });

    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = currentStrokeRef.current.color;
    ctx.lineWidth = currentStrokeRef.current.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (currentStrokeRef.current.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.beginPath();
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    if (isDrawing && socket && currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      setStrokes(prev => [...prev, currentStrokeRef.current]);
      socket.emit('draw-stroke', {
        roomId,
        stroke: currentStrokeRef.current
      });
    }
    setIsDrawing(false);
    currentStrokeRef.current = null;
  };

  const clearBoard = () => {
    if (socket) {
      socket.emit('clear-board', roomId);
    }
  };

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
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ 
          cursor: tool === 'eraser' ? 'crosshair' : 'crosshair',
          touchAction: 'none'
        }}
      />
    </div>
  );
};

export default Whiteboard;