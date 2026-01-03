
import React, { useState, useEffect, useRef } from 'react';
import { Rotation } from '../types';

interface Cube3DProps {
  image: string | null;
  rotation: Rotation;
  onRotationChange: (rot: Rotation) => void;
}

const Cube3D: React.FC<Cube3DProps> = ({ image, rotation, onRotationChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const startDragging = (clientX: number, clientY: number) => {
    setIsDragging(true);
    lastPos.current = { x: clientX, y: clientY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startDragging(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startDragging(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;

      const deltaX = clientX - lastPos.current.x;
      const deltaY = clientY - lastPos.current.y;

      // 灵敏度从 0.4 提升至 0.6，使拖拽感觉更轻快
      onRotationChange({
        x: rotation.x - deltaY * 0.6,
        y: rotation.y + deltaX * 0.6,
      });

      lastPos.current = { x: clientX, y: clientY };
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const stopDragging = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', stopDragging);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', stopDragging);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging, rotation, onRotationChange]);

  const cubeStyle = {
    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
  };

  const faces = [
    { className: 'face-front', label: 'FRONT' },
    { className: 'face-back', label: 'BACK' },
    { className: 'face-right', label: 'RIGHT' },
    { className: 'face-left', label: 'LEFT' },
    { className: 'face-top', label: 'TOP' },
    { className: 'face-bottom', label: 'BOTTOM' },
  ];

  return (
    <div className="scene flex items-center justify-center p-20 cursor-grab active:cursor-grabbing relative select-none">
      {/* 视角对准线 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className={`w-64 h-64 border rounded-full transition-all duration-300 ${isDragging ? 'border-indigo-500/40 scale-110' : 'border-indigo-500/20'}`}></div>
        <div className="absolute w-[1px] h-48 bg-gradient-to-t from-transparent via-indigo-500/20 to-transparent"></div>
        <div className="absolute h-[1px] w-48 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
      </div>

      {/* 3D 容器 */}
      <div 
        className="cube" 
        style={cubeStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {faces.map((face, i) => (
          <div 
            key={i} 
            className={`cube-face ${face.className} transition-all duration-300 ${isDragging ? 'border-indigo-500/40 bg-slate-800/80' : 'border-white/10'}`}
          >
            {i === 0 && image ? (
              <div className="relative w-full h-full group">
                <img src={image} alt="Target" className="w-full h-full object-cover" />
                <div className={`absolute inset-0 border-2 transition-colors duration-300 ${isDragging ? 'border-indigo-400' : 'border-indigo-500/30'}`}></div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex flex-col items-center">
                 <span className="opacity-40 mb-2">{face.label}</span>
                 {image && <div className="w-8 h-px bg-slate-800"></div>}
              </div>
            )}
            {/* 辅助网格线 */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-5 pointer-events-none">
              {[...Array(16)].map((_, j) => (
                <div key={j} className="border-[0.5px] border-white"></div>
              ))}
            </div>
          </div>
        ))}
        
        {/* 核心光点 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className={`w-1.5 h-1.5 bg-indigo-500 rounded-full transition-shadow duration-300 ${isDragging ? 'shadow-[0_0_20px_rgba(99,102,241,1)]' : 'shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}></div>
        </div>
      </div>

      {/* 底部 3D 网格平面 */}
      <div className="absolute bottom-[-100px] w-[1200px] h-[1200px] opacity-10 pointer-events-none"
           style={{ 
             transform: 'rotateX(90deg) translateZ(-150px)',
             backgroundImage: 'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>
    </div>
  );
};

export default Cube3D;
