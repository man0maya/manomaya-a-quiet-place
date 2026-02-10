import { useState, useRef, useEffect, useCallback } from "react";
import { ACCESS_CODES, TILE_SIZE, CO_CONSCIOUS_TIMEOUT } from "@/mayaworld/constants";
import { CoConsciousPrompt, World } from "@/mayaworld/types";
import { createSession, startSession, stopSession, Session } from "@/mayaworld/sessionController";
import { renderWorld } from "@/mayaworld/renderer";

const Mayaworld = () => {
  const [phase, setPhase] = useState<'entry' | 'world' | 'fading'>('entry');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState<CoConsciousPrompt | null>(null);
  const [promptTimer, setPromptTimer] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<Session | null>(null);
  const animFrameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const boundNameRef = useRef('');

  const handleEnter = useCallback(() => {
    const sageName = ACCESS_CODES[code];
    if (!sageName) {
      setError('The path is not yet open.');
      setTimeout(() => setError(''), 2500);
      return;
    }
    boundNameRef.current = sageName;
    setPhase('world');
  }, [code]);

  // Start session when entering world
  useEffect(() => {
    if (phase !== 'world') return;

    const session = createSession(boundNameRef.current);
    sessionRef.current = session;

    startSession(
      session,
      () => {}, // onTick — rendering handled by rAF
      (p) => {
        setPrompt(p);
        setPromptTimer(CO_CONSCIOUS_TIMEOUT);
      }
    );

    return () => {
      stopSession(session);
    };
  }, [phase]);

  // Render loop
  useEffect(() => {
    if (phase !== 'world') return;

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
      if (!session || !session.running) return;

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
  }, [phase]);

  // Prompt auto-dismiss timer
  useEffect(() => {
    if (!prompt || promptTimer <= 0) return;
    const id = setInterval(() => {
      setPromptTimer(prev => {
        if (prev <= 1) {
          setPrompt(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000 / 4); // tick rate
    return () => clearInterval(id);
  }, [prompt, promptTimer]);

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

  const handleChoice = (action: () => void) => {
    action();
    setPrompt(null);
  };

  const handleExit = () => {
    setPhase('fading');
    setTimeout(() => {
      if (sessionRef.current) stopSession(sessionRef.current);
      sessionRef.current = null;
    }, 1500);
  };

  // Entry screen
  if (phase === 'entry') {
    return (
      <div className="fixed inset-0 bg-[#0E2E2C] flex items-center justify-center z-50">
        <div className="text-center max-w-md px-8">
          <p className="font-serif text-primary/60 text-lg mb-2 tracking-widest uppercase">
            Mayaworld
          </p>
          <p className="font-serif text-foreground/50 text-sm mb-10 leading-relaxed italic">
            A world is already unfolding.<br />
            Enter to briefly share its stillness.
          </p>
          <div className="flex flex-col items-center gap-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleEnter()}
              placeholder="· · · ·"
              className="w-36 text-center text-2xl tracking-[0.5em] bg-transparent border-b border-primary/20 text-foreground/80 py-3 focus:outline-none focus:border-primary/50 font-serif placeholder:text-foreground/20"
              autoFocus
            />
            {error && (
              <p className="text-foreground/40 text-xs font-serif italic animate-pulse">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fading out
  if (phase === 'fading') {
    return <div className="fixed inset-0 bg-black z-50 animate-fade-in" />;
  }

  // World view
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute top-4 right-4 text-foreground/20 hover:text-foreground/50 text-xs font-serif tracking-wider transition-colors"
      >
        leave
      </button>

      {/* Bound sage name */}
      <div className="absolute top-4 left-4 text-primary/40 text-xs font-serif tracking-widest">
        {boundNameRef.current}
      </div>

      {/* Co-conscious prompt */}
      {prompt && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm border-t border-primary/10 px-6 py-5">
          <div className="max-w-lg mx-auto flex flex-col gap-3">
            {prompt.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleChoice(opt.action)}
                className="text-left font-serif text-foreground/70 hover:text-primary text-sm py-2 px-4 rounded-lg hover:bg-primary/5 transition-all duration-300 border border-transparent hover:border-primary/10"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mayaworld;
