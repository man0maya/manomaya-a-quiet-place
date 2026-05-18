// src/mayaworld/three/MayaworldThree.tsx
// Drop-in replacement for the <canvas> element in Mayaworld.tsx.
// Keeps ALL existing React UI overlays (journal, stats, action panels, etc.)
// Only the renderer changes from 2D canvas to Three.js.

import { useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { WorldScene } from './WorldScene';
import { World } from '../types';

interface MayaworldThreeProps {
  world: World;
  boundSageName: string;
  zoom?: number;
  onTouch?: (action: 'up' | 'down' | 'left' | 'right' | 'action') => void;
}

export function MayaworldThree({ world, boundSageName, zoom = 1, onTouch }: MayaworldThreeProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={canvasContainerRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <Canvas
        camera={{ position: [25, 18, 25], fov: 48 }}
        gl={{
          antialias: typeof window !== 'undefined' && window.devicePixelRatio < 2,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : 1}
        shadows="soft"
        style={{ width: '100%', height: '100%' }}
      >
        <WorldScene world={world} boundSageName={boundSageName} zoom={zoom} />
      </Canvas>

      {/* Mobile touch D-pad — only on touch devices */}
      {onTouch && <TouchControls onTouch={onTouch} />}
    </div>
  );
}

// ── Mobile virtual D-pad ─────────────────────────────────────────────────
function TouchControls({ onTouch }: { onTouch: (action: 'up' | 'down' | 'left' | 'right' | 'action') => void }) {
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPress = useCallback((action: 'up' | 'down' | 'left' | 'right' | 'action') => {
    onTouch(action);
    holdRef.current = setInterval(() => onTouch(action), 140);
  }, [onTouch]);

  const endPress = useCallback(() => {
    if (holdRef.current) { clearInterval(holdRef.current); holdRef.current = null; }
  }, []);

  const DPadBtn = ({
    dir, style, label,
  }: {
    dir: 'up' | 'down' | 'left' | 'right';
    style: React.CSSProperties;
    label: string;
  }) => (
    <button
      onPointerDown={e => { e.preventDefault(); startPress(dir); }}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      style={{
        position: 'absolute',
        width: 48, height: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        border: '0.5px solid rgba(255,255,255,0.15)',
        borderRadius: 10,
        color: 'rgba(255,255,255,0.70)',
        fontSize: 18,
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        ...style,
      }}>
      {label}
    </button>
  );

  return (
    <>
      {/* D-pad — bottom left */}
      <div style={{ position: 'absolute', bottom: 90, left: 20, width: 152, height: 152 }}>
        <DPadBtn dir="up"    style={{ top: 0,   left: 52 }} label="↑" />
        <DPadBtn dir="down"  style={{ top: 104, left: 52 }} label="↓" />
        <DPadBtn dir="left"  style={{ top: 52,  left: 0  }} label="←" />
        <DPadBtn dir="right" style={{ top: 52,  left: 104 }} label="→" />
        {/* Center D-pad pad */}
        <div style={{
          position: 'absolute', top: 52, left: 52, width: 48, height: 48,
          background: 'rgba(0,0,0,0.35)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
        }} />
      </div>

      {/* Action button — bottom right */}
      <button
        onPointerDown={e => { e.preventDefault(); onTouch('action'); }}
        style={{
          position: 'absolute',
          bottom: 110, right: 28,
          width: 62, height: 62,
          borderRadius: '50%',
          background: 'rgba(212,175,106,0.20)',
          border: '1.5px solid rgba(212,175,106,0.50)',
          color: 'rgba(212,175,106,0.90)',
          fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          boxShadow: '0 0 16px rgba(212,175,106,0.15)',
        }}>
        E
      </button>
    </>
  );
}
