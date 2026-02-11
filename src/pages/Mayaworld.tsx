import { useState, useRef, useEffect, useCallback } from "react";
import { ACCESS_CODES, TILE_SIZE, SAGE_DEFINITIONS, NARRATION_INTERVAL_MIN, NARRATION_INTERVAL_MAX, INTERACT_DISTANCE } from "@/mayaworld/constants";
import { SimMode, World } from "@/mayaworld/types";
import { createSession, startSession, stopSession, setMode, getNearestSage, Session } from "@/mayaworld/sessionController";
import { renderWorld } from "@/mayaworld/renderer";
import { getNarration, getMoodThought, getInteractionResponse } from "@/mayaworld/dialogueBank";

type Phase = 'entry' | 'clouds' | 'modeSelect' | 'world' | 'fading';

const POETIC_LINES = [
  "You are about to enter a living world.",
  "Nine sages already walk this land.",
  "Their thoughts are in motion.",
  "Their paths are unfolding.",
  "",
  "You may observe.",
  "Or you may take authority.",
];

const Mayaworld = () => {
  const [phase, setPhase] = useState<Phase>('entry');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [visibleLines, setVisibleLines] = useState(0);
  const [mode, setModeState] = useState<SimMode>('observe');
  const [narration, setNarration] = useState('');
  const [narrationOpacity, setNarrationOpacity] = useState(0);
  const [cloudOpacity, setCloudOpacity] = useState(1);
  const [nearbySage, setNearbySage] = useState<{ name: string; mood: string; thought: string } | null>(null);
  const [interactionResponse, setInteractionResponse] = useState('');
  const [interactionResponseTimer, setInteractionResponseTimer] = useState(0);
  const [showModeSwitch, setShowModeSwitch] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<Session | null>(null);
  const animFrameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const boundNameRef = useRef('');
  const narrationTimerRef = useRef(0);

  // Stagger poetic lines on mount
  useEffect(() => {
    if (phase !== 'entry') return;
    const timer = setInterval(() => {
      setVisibleLines(prev => {
        if (prev >= POETIC_LINES.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(timer);
  }, [phase]);

  const handleEnter = useCallback(() => {
    const sageName = ACCESS_CODES[code];
    if (!sageName) {
      setError('The path is not yet open.');
      setTimeout(() => setError(''), 2500);
      return;
    }
    boundNameRef.current = sageName;
    setPhase('clouds');
  }, [code]);

  // Cloud transition
  useEffect(() => {
    if (phase !== 'clouds') return;

    // Create session during cloud transition
    const session = createSession(boundNameRef.current);
    sessionRef.current = session;

    // Animate cloud fade over 4 seconds
    const start = performance.now();
    const duration = 4000;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setCloudOpacity(1 - progress);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setPhase('modeSelect');
      }
    };
    requestAnimationFrame(animate);
  }, [phase]);

  // Start session when entering modeSelect or world
  useEffect(() => {
    if (phase !== 'modeSelect') return;
    const session = sessionRef.current;
    if (!session || session.running) return;

    startSession(session, () => {});
    // Start the render loop
    startRenderLoop();

    return () => {
      // Don't stop here — we keep running into world phase
    };
  }, [phase]);

  const startRenderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const session = sessionRef.current;
      if (!session || !session.running) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      animFrameRef.current++;
      const bound = session.world.sages.find(s => s.name === session.boundSageName);
      const camX = bound ? bound.x : session.world.width / 2;
      const camY = bound ? bound.y : session.world.height / 2;

      renderWorld(ctx, session.world, { x: camX, y: camY }, canvas.width, canvas.height, session.boundSageName, animFrameRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Mode selection handler
  const handleModeSelect = useCallback((selectedMode: SimMode) => {
    setModeState(selectedMode);
    const session = sessionRef.current;
    if (session) {
      setMode(session, selectedMode);
    }
    setPhase('world');
    setShowModeSwitch(true);
  }, []);

  // Keyboard handling for authority mode
  useEffect(() => {
    if (phase !== 'world' && phase !== 'modeSelect') return;
    const session = sessionRef.current;
    if (!session) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
        session.keysDown.add(e.key);
      }
      // Interact key
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        if (session.mode === 'authority') {
          const near = getNearestSage(session);
          if (near) {
            setNearbySage({
              name: near.name,
              mood: near.mood,
              thought: getMoodThought(near.mood),
            });
          }
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      session.keysDown.delete(e.key);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [phase]);

  // Narration for observe mode
  useEffect(() => {
    if (phase !== 'world' || mode !== 'observe') return;

    const interval = setInterval(() => {
      const session = sessionRef.current;
      if (!session) return;

      const bound = session.world.sages.find(s => s.name === session.boundSageName);
      if (!bound) return;

      const text = getNarration(bound.name);
      setNarration(text);
      setNarrationOpacity(1);

      // Fade out after 5 seconds
      setTimeout(() => setNarrationOpacity(0), 5000);
    }, (NARRATION_INTERVAL_MIN + Math.random() * (NARRATION_INTERVAL_MAX - NARRATION_INTERVAL_MIN)) * 250);

    return () => clearInterval(interval);
  }, [phase, mode]);

  // Check nearby sages for authority mode interact prompt
  useEffect(() => {
    if (phase !== 'world' || mode !== 'authority') return;

    const interval = setInterval(() => {
      const session = sessionRef.current;
      if (!session) return;
      const near = getNearestSage(session);
      if (!near && !nearbySage) return;
      // Only update the floating prompt, not the dialog
    }, 500);

    return () => clearInterval(interval);
  }, [phase, mode, nearbySage]);

  // Interaction response timer
  useEffect(() => {
    if (interactionResponseTimer <= 0) return;
    const t = setTimeout(() => {
      setInteractionResponseTimer(0);
      setInteractionResponse('');
    }, interactionResponseTimer);
    return () => clearTimeout(t);
  }, [interactionResponseTimer]);

  // Cleanup on unmount / tab close
  useEffect(() => {
    const handleUnload = () => {
      if (sessionRef.current) stopSession(sessionRef.current);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, []);

  const handleInteraction = (action: string) => {
    const response = getInteractionResponse(action);
    setNearbySage(null);
    setInteractionResponse(response);
    setInteractionResponseTimer(4000);
  };

  const handleModeToggle = () => {
    const newMode = mode === 'observe' ? 'authority' : 'observe';
    setModeState(newMode);
    const session = sessionRef.current;
    if (session) {
      setMode(session, newMode);
    }
    setNearbySage(null);
  };

  const handleExit = () => {
    setPhase('fading');
    setTimeout(() => {
      if (sessionRef.current) stopSession(sessionRef.current);
      sessionRef.current = null;
    }, 1500);
  };

  // Touch/tap movement for mobile
  const handleCanvasTap = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'authority' || phase !== 'world') return;
    const session = sessionRef.current;
    if (!session) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const bound = session.world.sages.find(s => s.name === session.boundSageName);
    if (!bound) return;

    const offsetX = canvas.width / 2 - bound.x * TILE_SIZE;
    const offsetY = canvas.height / 2 - bound.y * TILE_SIZE;

    const worldX = (clientX - offsetX) / TILE_SIZE;
    const worldY = (clientY - offsetY) / TILE_SIZE;

    // Move one step toward tapped location
    const dx = worldX - bound.x;
    const dy = worldY - bound.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      session.keysDown.clear();
      session.keysDown.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    } else {
      session.keysDown.clear();
      session.keysDown.add(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    }
    // Clear after a short delay
    setTimeout(() => session.keysDown.clear(), 300);
  };

  // === ENTRY SCREEN ===
  if (phase === 'entry') {
    return (
      <div className="fixed inset-0 bg-[#0A1A18] flex items-center justify-center z-50 overflow-y-auto">
        <div className="text-center max-w-lg px-8 py-12">
          {/* Poetic text */}
          <div className="mb-10 space-y-2">
            {POETIC_LINES.map((line, i) => (
              <p
                key={i}
                className="font-serif text-[hsl(var(--foreground))]/50 text-sm leading-relaxed transition-all duration-1000"
                style={{
                  opacity: i < visibleLines ? 1 : 0,
                  transform: i < visibleLines ? 'translateY(0)' : 'translateY(8px)',
                }}
              >
                {line || '\u00A0'}
              </p>
            ))}
          </div>

          {/* Sage roster */}
          <div className="mb-10 space-y-1.5"
            style={{
              opacity: visibleLines >= POETIC_LINES.length ? 1 : 0,
              transition: 'opacity 1.2s ease',
            }}
          >
            <p className="font-serif text-[hsl(var(--primary))]/40 text-[10px] tracking-[0.3em] uppercase mb-4">
              The Nine Sages
            </p>
            {SAGE_DEFINITIONS.map(sage => (
              <div
                key={sage.name}
                className="flex items-center justify-center gap-3 text-xs"
              >
                <span className="font-mono text-[hsl(var(--foreground))]/25 w-10 text-right">
                  {Object.entries(ACCESS_CODES).find(([, n]) => n === sage.name)?.[0]}
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sage.color, opacity: 0.7 }} />
                <span className="font-serif text-[hsl(var(--foreground))]/60 w-20 text-left">
                  {sage.name}
                </span>
                <span className="text-[hsl(var(--foreground))]/25 italic text-[11px] w-36 text-left">
                  {sage.description}
                </span>
              </div>
            ))}
          </div>

          {/* Input */}
          <div
            className="flex flex-col items-center gap-4"
            style={{
              opacity: visibleLines >= POETIC_LINES.length ? 1 : 0,
              transition: 'opacity 1.5s ease 0.5s',
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleEnter()}
              placeholder="Enter Code"
              className="w-40 text-center text-lg tracking-[0.3em] bg-transparent border-b border-[hsl(var(--primary))]/20 text-[hsl(var(--foreground))]/80 py-3 focus:outline-none focus:border-[hsl(var(--primary))]/50 font-serif placeholder:text-[hsl(var(--foreground))]/15 placeholder:tracking-[0.15em] placeholder:text-sm"
              autoFocus
            />

            <button
              onClick={handleEnter}
              className="mt-2 px-8 py-3 font-serif text-sm tracking-[0.2em] uppercase text-[hsl(var(--primary))]/70 border border-[hsl(var(--primary))]/20 rounded hover:border-[hsl(var(--primary))]/40 hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5 transition-all duration-500"
            >
              Enter the Mayaworld
            </button>

            {error && (
              <p className="text-[hsl(var(--foreground))]/40 text-xs font-serif italic animate-pulse mt-2">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === FADING OUT ===
  if (phase === 'fading') {
    return <div className="fixed inset-0 bg-black z-50 animate-fade-in" />;
  }

  // === CLOUD TRANSITION / MODE SELECT / WORLD ===
  return (
    <div className="fixed inset-0 z-50 bg-[#0A1A18]">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onClick={handleCanvasTap}
        onTouchStart={handleCanvasTap}
      />

      {/* Cloud overlay */}
      {phase === 'clouds' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: cloudOpacity, transition: 'opacity 0.1s linear' }}
        >
          <div className="absolute inset-0 bg-[#0A1A18]" />
          {/* Animated cloud shapes */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {[...Array(8)].map((_, i) => (
              <ellipse
                key={i}
                cx={`${15 + i * 12}%`}
                cy={`${40 + (i % 3) * 15 - cloudOpacity * 20}%`}
                rx={`${18 + (i % 4) * 5}%`}
                ry={`${8 + (i % 3) * 4}%`}
                fill={`rgba(180, 195, 210, ${0.08 + (i % 3) * 0.03})`}
                style={{
                  transform: `translateY(${(1 - cloudOpacity) * (i % 2 === 0 ? -80 : 80)}px)`,
                  transition: 'transform 0.1s linear',
                }}
              />
            ))}
          </svg>
        </div>
      )}

      {/* Mode selection overlay */}
      {phase === 'modeSelect' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center space-y-6">
            <p className="font-serif text-[hsl(var(--foreground))]/50 text-sm tracking-wider">
              The world breathes before you.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleModeSelect('observe')}
                className="px-8 py-4 font-serif text-sm tracking-[0.15em] uppercase text-[hsl(var(--foreground))]/60 border border-[hsl(var(--foreground))]/10 rounded hover:border-[hsl(var(--primary))]/30 hover:text-[hsl(var(--primary))]/80 hover:bg-[hsl(var(--primary))]/5 transition-all duration-500"
              >
                Observe
              </button>
              <button
                onClick={() => handleModeSelect('authority')}
                className="px-8 py-4 font-serif text-sm tracking-[0.15em] uppercase text-[hsl(var(--primary))]/70 border border-[hsl(var(--primary))]/20 rounded hover:border-[hsl(var(--primary))]/40 hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5 transition-all duration-500"
              >
                Take Authority
              </button>
            </div>
          </div>
        </div>
      )}

      {/* World UI overlays */}
      {phase === 'world' && (
        <>
          {/* Top left: Sage name */}
          <div className="absolute top-4 left-4 text-[hsl(var(--primary))]/40 text-xs font-serif tracking-widest">
            {boundNameRef.current}
            <span className="ml-2 text-[hsl(var(--foreground))]/20 text-[10px]">
              {mode === 'observe' ? '· observing' : '· authority'}
            </span>
          </div>

          {/* Top right: Controls */}
          <div className="absolute top-4 right-4 flex gap-3 items-center">
            {showModeSwitch && (
              <button
                onClick={handleModeToggle}
                className="text-[hsl(var(--foreground))]/20 hover:text-[hsl(var(--foreground))]/50 text-[10px] font-serif tracking-wider transition-colors"
              >
                {mode === 'observe' ? 'take authority' : 'observe'}
              </button>
            )}
            <button
              onClick={handleExit}
              className="text-[hsl(var(--foreground))]/20 hover:text-[hsl(var(--foreground))]/50 text-xs font-serif tracking-wider transition-colors"
            >
              leave
            </button>
          </div>

          {/* Authority mode: interact prompt */}
          {mode === 'authority' && !nearbySage && !interactionResponse && (
            <NearbyIndicator session={sessionRef.current} />
          )}

          {/* Narration text (observe mode) */}
          {mode === 'observe' && narration && (
            <div
              className="absolute bottom-8 left-0 right-0 text-center pointer-events-none"
              style={{ opacity: narrationOpacity, transition: 'opacity 1.5s ease' }}
            >
              <p className="font-serif text-[hsl(var(--foreground))]/40 text-sm italic tracking-wide">
                {narration}
              </p>
            </div>
          )}

          {/* Interaction dialog (authority mode) */}
          {nearbySage && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm border-t border-[hsl(var(--primary))]/10 px-6 py-5">
              <div className="max-w-md mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-serif text-[hsl(var(--primary))]/60 text-sm">{nearbySage.name}</span>
                  <span className="text-[hsl(var(--foreground))]/20 text-[10px] italic">· {nearbySage.mood}</span>
                </div>
                <p className="font-serif text-[hsl(var(--foreground))]/40 text-xs italic mb-4">
                  "{nearbySage.thought}"
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleInteraction('sit')}
                    className="text-[hsl(var(--foreground))]/50 hover:text-[hsl(var(--primary))] text-xs font-serif py-1.5 px-3 border border-[hsl(var(--foreground))]/10 rounded hover:border-[hsl(var(--primary))]/20 transition-all"
                  >
                    Sit together
                  </button>
                  <button
                    onClick={() => handleInteraction('walk')}
                    className="text-[hsl(var(--foreground))]/50 hover:text-[hsl(var(--primary))] text-xs font-serif py-1.5 px-3 border border-[hsl(var(--foreground))]/10 rounded hover:border-[hsl(var(--primary))]/20 transition-all"
                  >
                    Walk with them
                  </button>
                  <button
                    onClick={() => handleInteraction('silent')}
                    className="text-[hsl(var(--foreground))]/50 hover:text-[hsl(var(--primary))] text-xs font-serif py-1.5 px-3 border border-[hsl(var(--foreground))]/10 rounded hover:border-[hsl(var(--primary))]/20 transition-all"
                  >
                    Remain silent
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interaction response */}
          {interactionResponse && (
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="font-serif text-[hsl(var(--foreground))]/40 text-sm italic tracking-wide">
                {interactionResponse}
              </p>
            </div>
          )}

          {/* Authority mode hint */}
          {mode === 'authority' && (
            <div className="absolute bottom-3 right-4 text-[hsl(var(--foreground))]/10 text-[9px] font-serif">
              WASD to move · E to interact
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Small component to check nearby sage for interact prompt
function NearbyIndicator({ session }: { session: Session | null }) {
  const [hasNearby, setHasNearby] = useState(false);
  const [nearbyName, setNearbyName] = useState('');

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const near = getNearestSage(session);
      setHasNearby(!!near);
      setNearbyName(near?.name || '');
    }, 300);
    return () => clearInterval(interval);
  }, [session]);

  if (!hasNearby) return null;

  return (
    <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
      <p className="font-serif text-[hsl(var(--primary))]/30 text-xs tracking-wide animate-pulse">
        Press E to speak with {nearbyName}
      </p>
    </div>
  );
}

export default Mayaworld;
