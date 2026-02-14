import { useState, useRef, useEffect, useCallback } from "react";
import { ACCESS_CODES, TILE_SIZE, SAGE_DEFINITIONS, NARRATION_INTERVAL_MIN, NARRATION_INTERVAL_MAX, LEVEL_UNLOCKS, KARMA_THRESHOLDS } from "@/mayaworld/constants";
import { SimMode, World, SageAction, Moment, PlayerStats } from "@/mayaworld/types";
import { createSession, startSession, stopSession, setMode, getNearestSage, getAvailableActions, executeAction, checkMoments, addKarma, Session } from "@/mayaworld/sessionController";
import { renderWorld } from "@/mayaworld/renderer";
import { getNarration, getMoodThought, getInteractionResponse, getActionNarration } from "@/mayaworld/dialogueBank";

type Phase = 'entry' | 'clouds' | 'world' | 'fading';

const POETIC_LINES = [
  "You arrive in a world already breathing.",
  "",
  "Nine sages walk this land.",
  "Their thoughts are in motion.",
  "Their paths are unfolding.",
  "",
  "Every action leaves an imprint.",
  "The world remembers how you walk.",
];

const Mayaworld = () => {
  const [phase, setPhase] = useState<Phase>('entry');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [visibleLines, setVisibleLines] = useState(0);
  const [mode, setModeState] = useState<SimMode>('observe');
  const [narration, setNarration] = useState('');
  const [narrationOpacity, setNarrationOpacity] = useState(0);
  const [cloudProgress, setCloudProgress] = useState(0);
  const [nearbySage, setNearbySage] = useState<{ name: string; mood: string; thought: string; relationship: number } | null>(null);
  const [interactionResponse, setInteractionResponse] = useState('');
  const [interactionResponseTimer, setInteractionResponseTimer] = useState(0);
  const [actionMenu, setActionMenu] = useState<{ action: SageAction; label: string; description: string }[]>([]);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<{ name: string; count: number }[]>([]);
  const [actionFeedback, setActionFeedback] = useState('');
  const [actionFeedbackTimer, setActionFeedbackTimer] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [momentNotif, setMomentNotif] = useState<string | null>(null);
  const [levelUpNotif, setLevelUpNotif] = useState<string | null>(null);
  const [showMoments, setShowMoments] = useState(false);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [weather, setWeather] = useState('clear');
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [showModePrompt, setShowModePrompt] = useState(false);
  const [observeTimer, setObserveTimer] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<Session | null>(null);
  const animFrameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const boundNameRef = useRef('');
  const cloudCanvasRef = useRef<HTMLCanvasElement>(null);

  // Stagger poetic lines
  useEffect(() => {
    if (phase !== 'entry') return;
    const timer = setInterval(() => {
      setVisibleLines(prev => {
        if (prev >= POETIC_LINES.length) { clearInterval(timer); return prev; }
        return prev + 1;
      });
    }, 500);
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

  // Cloud transition - canvas-based animated clouds
  useEffect(() => {
    if (phase !== 'clouds') return;
    const session = createSession(boundNameRef.current);
    sessionRef.current = session;

    // Start session in observe mode immediately
    startSession(session, (world) => {
      setWeather(world.weather);
      setTimeOfDay(world.timeOfDay);
      syncStats(session);
    });

    const canvas = cloudCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const clouds: { x: number; y: number; rx: number; ry: number; speed: number; opacity: number }[] = [];
    for (let i = 0; i < 20; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.2 + Math.random() * canvas.height * 0.6,
        rx: 60 + Math.random() * 120,
        ry: 20 + Math.random() * 40,
        speed: 0.3 + Math.random() * 0.5,
        opacity: 0.15 + Math.random() * 0.2,
      });
    }

    const start = performance.now();
    const duration = 5000;
    let raf: number;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCloudProgress(progress);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background fade
      ctx.fillStyle = `rgba(10, 20, 25, ${1 - progress})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animate clouds parting
      for (const c of clouds) {
        const yOffset = progress * (c.y < canvas.height / 2 ? -200 : 200);
        const xDrift = Math.sin(now * 0.001 * c.speed) * 10;
        const alpha = c.opacity * (1 - progress * 0.8);
        if (alpha <= 0) continue;

        const g = ctx.createRadialGradient(c.x + xDrift, c.y + yOffset, 0, c.x + xDrift, c.y + yOffset, c.rx);
        g.addColorStop(0, `rgba(180, 200, 215, ${alpha})`);
        g.addColorStop(0.5, `rgba(160, 180, 200, ${alpha * 0.6})`);
        g.addColorStop(1, `rgba(140, 160, 180, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(c.x + xDrift, c.y + yOffset, c.rx, c.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Text fade in
      if (progress > 0.3 && progress < 0.8) {
        const textAlpha = Math.min(1, (progress - 0.3) / 0.2) * (1 - Math.max(0, (progress - 0.6) / 0.2));
        ctx.font = '14px serif';
        ctx.fillStyle = `rgba(200, 210, 220, ${textAlpha * 0.6})`;
        ctx.textAlign = 'center';
        ctx.fillText('The world was always here.', canvas.width / 2, canvas.height / 2);
      }

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setPhase('world');
        // Start in observe mode, show mode prompt after 8 seconds
        setModeState('observe');
        setObserveTimer(Date.now());
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Show mode prompt after 8 seconds of observing
  useEffect(() => {
    if (phase !== 'world' || observeTimer === 0) return;
    const timer = setTimeout(() => {
      setShowModePrompt(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [phase, observeTimer]);

  // Start render loop when entering world
  useEffect(() => {
    if (phase !== 'world') return;
    startRenderLoop();
  }, [phase]);

  const syncStats = (session: Session) => {
    setStats({ ...session.stats });
    setMoments(session.moments.map(m => ({ ...m })));
  };

  const startRenderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const session = sessionRef.current;
      if (!session || !session.running) { rafRef.current = requestAnimationFrame(draw); return; }
      animFrameRef.current++;
      const bound = session.world.sages.find(s => s.name === session.boundSageName);
      const camX = bound ? bound.x : session.world.width / 2;
      const camY = bound ? bound.y : session.world.height / 2;
      renderWorld(ctx, session.world, { x: camX, y: camY }, canvas.width, canvas.height, session.boundSageName, animFrameRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(rafRef.current); };
  }, []);

  const handleModeSelect = useCallback((selectedMode: SimMode) => {
    setModeState(selectedMode);
    const session = sessionRef.current;
    if (session) setMode(session, selectedMode);
    setShowModePrompt(false);
    if (selectedMode === 'authority') {
      // Switching to authority costs a bit of karma if done hastily
      // (removed: karma penalty is only for rushing dialogs or forcing)
    }
  }, []);

  // Keyboard handling
  useEffect(() => {
    if (phase !== 'world') return;
    const session = sessionRef.current;
    if (!session) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
        session.keysDown.add(e.key);
      }
      if ((e.key === 'e' || e.key === 'E') && session.mode === 'authority') {
        e.preventDefault();
        if (showActionMenu) { setShowActionMenu(false); return; }
        const near = getNearestSage(session);
        if (near) {
          setNearbySage({ name: near.name, mood: near.mood, thought: getMoodThought(near.mood, session.stats.karma), relationship: near.relationship });
          return;
        }
        const actions = getAvailableActions(session);
        if (actions.length > 0) { setActionMenu(actions); setShowActionMenu(true); }
      }
      if ((e.key === 'i' || e.key === 'I')) { e.preventDefault(); updateInventory(); setShowInventory(prev => !prev); }
      if ((e.key === 'j' || e.key === 'J')) { e.preventDefault(); setShowMoments(prev => !prev); }
      if ((e.key === 'p' || e.key === 'P')) { e.preventDefault(); syncStats(session); setShowStats(prev => !prev); }
      if (e.key === 'Escape') { setNearbySage(null); setShowActionMenu(false); setShowInventory(false); setShowStats(false); setShowMoments(false); }
    };
    const onKeyUp = (e: KeyboardEvent) => { session.keysDown.delete(e.key); };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [phase, showActionMenu]);

  // Narration for observe mode
  useEffect(() => {
    if (phase !== 'world' || mode !== 'observe') return;
    const interval = setInterval(() => {
      const session = sessionRef.current;
      if (!session) return;
      const bound = session.world.sages.find(s => s.name === session.boundSageName);
      if (!bound) return;
      const tileType = session.world.tiles[bound.y]?.[bound.x]?.type;
      setNarration(getNarration(bound.name, tileType, session.world.weather, session.world.timeOfDay));
      setNarrationOpacity(1);
      setTimeout(() => setNarrationOpacity(0), 5000);
    }, (NARRATION_INTERVAL_MIN + Math.random() * (NARRATION_INTERVAL_MAX - NARRATION_INTERVAL_MIN)) * 250);
    return () => clearInterval(interval);
  }, [phase, mode]);

  // Moment checking loop
  useEffect(() => {
    if (phase !== 'world' || mode !== 'authority') return;
    const interval = setInterval(() => {
      const session = sessionRef.current;
      if (!session) return;
      const completed = checkMoments(session);
      if (completed) {
        setMomentNotif(`✦ ${completed.title}`);
        syncStats(session);
        setTimeout(() => setMomentNotif(null), 4000);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [phase, mode]);

  // Timers
  useEffect(() => {
    if (interactionResponseTimer <= 0) return;
    const t = setTimeout(() => { setInteractionResponseTimer(0); setInteractionResponse(''); }, interactionResponseTimer);
    return () => clearTimeout(t);
  }, [interactionResponseTimer]);

  useEffect(() => {
    if (actionFeedbackTimer <= 0) return;
    const t = setTimeout(() => { setActionFeedbackTimer(0); setActionFeedback(''); }, actionFeedbackTimer);
    return () => clearTimeout(t);
  }, [actionFeedbackTimer]);

  // Cleanup
  useEffect(() => {
    const handleUnload = () => { if (sessionRef.current) stopSession(sessionRef.current); };
    window.addEventListener('beforeunload', handleUnload);
    return () => { window.removeEventListener('beforeunload', handleUnload); handleUnload(); };
  }, []);

  const updateInventory = () => {
    const session = sessionRef.current;
    if (!session) return;
    const bound = session.world.sages.find(s => s.name === session.boundSageName);
    if (!bound) return;
    const counts: Record<string, number> = {};
    for (const item of bound.inventory) counts[item.name] = (counts[item.name] || 0) + 1;
    setInventoryItems(Object.entries(counts).map(([name, count]) => ({ name, count })));
  };

  const handleInteraction = (action: string) => {
    const session = sessionRef.current;
    if (!session) return;
    const response = getInteractionResponse(action);
    // Listening gives positive karma
    const karmaMap: Record<string, number> = { listen: 3, sit: 4, silent: 2, walk: 1, ask: 1 };
    addKarma(session, karmaMap[action] || 1);
    syncStats(session);
    setNearbySage(null);
    setInteractionResponse(response);
    setInteractionResponseTimer(4000);
  };

  const handleAction = (action: SageAction) => {
    const session = sessionRef.current;
    if (!session) return;
    const result = executeAction(session, action);
    const text = result.item
      ? `${getActionNarration(result.narrationKey)} (${result.item.name})`
      : getActionNarration(result.narrationKey);
    setShowActionMenu(false);
    setNearbySage(null);
    setActionFeedback(text);
    setActionFeedbackTimer(4000);
    updateInventory();
    syncStats(session);

    // Check moments after action
    const completed = checkMoments(session);
    if (completed) {
      setMomentNotif(`✦ ${completed.title}`);
      syncStats(session);
      setTimeout(() => setMomentNotif(null), 4000);
    }
  };

  const handleModeToggle = () => {
    const newMode = mode === 'observe' ? 'authority' : 'observe';
    setModeState(newMode);
    const session = sessionRef.current;
    if (session) setMode(session, newMode);
    setNearbySage(null);
    setShowActionMenu(false);
    setShowInventory(false);
    setShowModePrompt(false);
  };

  const handleExit = () => {
    setPhase('fading');
    setTimeout(() => { if (sessionRef.current) stopSession(sessionRef.current); sessionRef.current = null; }, 1500);
  };

  const handleCanvasTap = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'authority' || phase !== 'world') return;
    const session = sessionRef.current;
    if (!session) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let clientX: number, clientY: number;
    if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    else { clientX = e.clientX; clientY = e.clientY; }
    const bound = session.world.sages.find(s => s.name === session.boundSageName);
    if (!bound) return;
    const offsetX = canvas.width / 2 - bound.x * TILE_SIZE;
    const offsetY = canvas.height / 2 - bound.y * TILE_SIZE;
    const dx = (clientX - offsetX) / TILE_SIZE - bound.x;
    const dy = (clientY - offsetY) / TILE_SIZE - bound.y;
    session.keysDown.clear();
    if (Math.abs(dx) > Math.abs(dy)) session.keysDown.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    else session.keysDown.add(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    setTimeout(() => session.keysDown.clear(), 250);
  };

  const getKarmaLabel = (karma: number): string => {
    if (karma >= KARMA_THRESHOLDS.luminous) return 'Luminous';
    if (karma >= KARMA_THRESHOLDS.sacred) return 'Sacred';
    if (karma >= KARMA_THRESHOLDS.warm) return 'Warm';
    if (karma >= KARMA_THRESHOLDS.neutral) return 'Neutral';
    if (karma >= KARMA_THRESHOLDS.cold) return 'Cold';
    return 'Frozen';
  };

  // === ENTRY SCREEN ===
  if (phase === 'entry') {
    return (
      <div className="fixed inset-0 bg-[#050A0D] flex items-center justify-center z-50 overflow-y-auto">
        <div className="text-center max-w-lg px-8 py-12">
          <div className="mb-10 space-y-2">
            {POETIC_LINES.map((line, i) => (
              <p key={i} className="font-serif text-[hsl(var(--foreground))]/40 text-sm leading-relaxed transition-all duration-1000"
                style={{ opacity: i < visibleLines ? 1 : 0, transform: i < visibleLines ? 'translateY(0)' : 'translateY(8px)' }}>
                {line || '\u00A0'}
              </p>
            ))}
          </div>

          <div className="mb-10 space-y-1.5" style={{ opacity: visibleLines >= POETIC_LINES.length ? 1 : 0, transition: 'opacity 1.2s ease' }}>
            <p className="font-serif text-[hsl(var(--primary))]/30 text-[10px] tracking-[0.3em] uppercase mb-4">The Nine Sages</p>
            {SAGE_DEFINITIONS.map(sage => (
              <div key={sage.name} className="flex items-center justify-center gap-3 text-xs">
                <span className="font-mono text-[hsl(var(--foreground))]/20 w-10 text-right">
                  {Object.entries(ACCESS_CODES).find(([, n]) => n === sage.name)?.[0]}
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sage.color, opacity: 0.6 }} />
                <span className="font-serif text-[hsl(var(--foreground))]/50 w-20 text-left">{sage.name}</span>
                <span className="text-[hsl(var(--foreground))]/20 italic text-[11px] w-36 text-left">{sage.description}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4" style={{ opacity: visibleLines >= POETIC_LINES.length ? 1 : 0, transition: 'opacity 1.5s ease 0.5s' }}>
            <input type="text" inputMode="numeric" maxLength={4} value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleEnter()}
              placeholder="Enter Code"
              className="w-40 text-center text-lg tracking-[0.3em] bg-transparent border-b border-[hsl(var(--primary))]/15 text-[hsl(var(--foreground))]/70 py-3 focus:outline-none focus:border-[hsl(var(--primary))]/40 font-serif placeholder:text-[hsl(var(--foreground))]/10 placeholder:tracking-[0.15em] placeholder:text-sm"
              autoFocus />
            <button onClick={handleEnter}
              className="mt-2 px-8 py-3 font-serif text-sm tracking-[0.2em] uppercase text-[hsl(var(--primary))]/60 border border-[hsl(var(--primary))]/15 rounded hover:border-[hsl(var(--primary))]/30 hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5 transition-all duration-500">
              Enter Mayaworld
            </button>
            {error && <p className="text-[hsl(var(--foreground))]/30 text-xs font-serif italic animate-pulse mt-2">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'fading') {
    return <div className="fixed inset-0 bg-black z-50 animate-fade-in" />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#050A0D]">
      {/* Cloud transition canvas */}
      {phase === 'clouds' && (
        <canvas ref={cloudCanvasRef} className="absolute inset-0 w-full h-full z-10" />
      )}

      {/* Main world canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" onClick={handleCanvasTap} onTouchStart={handleCanvasTap}
        style={{ opacity: phase === 'clouds' ? cloudProgress : 1 }} />

      {/* World UI */}
      {phase === 'world' && (
        <>
          {/* Top left: sage + mode + weather/time */}
          <div className="absolute top-4 left-4 space-y-1">
            <div className="text-[hsl(var(--primary))]/40 text-xs font-serif tracking-widest">
              {boundNameRef.current}
              <span className="ml-2 text-[hsl(var(--foreground))]/15 text-[10px]">
                · {mode === 'observe' ? 'observing' : 'authority'}
              </span>
            </div>
            <div className="text-[hsl(var(--foreground))]/15 text-[9px] font-serif flex gap-2">
              <span>{timeOfDay}</span>
              <span>·</span>
              <span>{weather}</span>
              {stats && (
                <>
                  <span>·</span>
                  <span>Lv.{stats.level}</span>
                  <span>·</span>
                  <span>K:{stats.karma > 0 ? '+' : ''}{stats.karma}</span>
                </>
              )}
            </div>
          </div>

          {/* Stats overlay */}
          {showStats && stats && (
            <div className="absolute top-12 left-4 bg-black/80 backdrop-blur-sm border border-[hsl(var(--primary))]/10 rounded px-4 py-3 min-w-[160px] z-20">
              <p className="text-[hsl(var(--primary))]/40 text-[9px] font-serif tracking-[0.2em] uppercase mb-2">Stats</p>
              {[
                ['Level', stats.level],
                ['XP', `${stats.xp}/${stats.xpToNext}`],
                ['Karma', `${stats.karma} (${getKarmaLabel(stats.karma)})`],
                ['Wisdom', stats.wisdom],
                ['Insight', stats.insight],
                ['Bond', stats.bond],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between text-[10px] font-serif text-[hsl(var(--foreground))]/30">
                  <span>{label}</span>
                  <span className="text-[hsl(var(--primary))]/25 ml-3">{value}</span>
                </div>
              ))}
              {stats.level > 1 && LEVEL_UNLOCKS[stats.level] && (
                <p className="text-[hsl(var(--primary))]/20 text-[9px] font-serif italic mt-2">
                  ✦ {LEVEL_UNLOCKS[stats.level]}
                </p>
              )}
            </div>
          )}

          {/* Inventory */}
          {showInventory && (
            <div className="absolute top-12 left-4 bg-black/80 backdrop-blur-sm border border-[hsl(var(--primary))]/10 rounded px-4 py-3 min-w-[140px] z-20">
              <p className="text-[hsl(var(--primary))]/40 text-[9px] font-serif tracking-[0.2em] uppercase mb-2">Inventory</p>
              {inventoryItems.length === 0 ? (
                <p className="text-[hsl(var(--foreground))]/15 text-[10px] font-serif italic">Empty</p>
              ) : inventoryItems.map((item, i) => (
                <div key={i} className="flex justify-between text-[10px] font-serif text-[hsl(var(--foreground))]/30">
                  <span>{item.name}</span>
                  <span className="text-[hsl(var(--primary))]/20 ml-3">×{item.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Moments (journal) */}
          {showMoments && (
            <div className="absolute top-12 right-4 bg-black/80 backdrop-blur-sm border border-[hsl(var(--primary))]/10 rounded px-4 py-3 min-w-[200px] max-w-[260px] z-20">
              <p className="text-[hsl(var(--primary))]/40 text-[9px] font-serif tracking-[0.2em] uppercase mb-2">Moments</p>
              {moments.map(m => (
                <div key={m.id} className={`text-[10px] font-serif mb-1.5 ${m.completed ? 'text-[hsl(var(--primary))]/30' : 'text-[hsl(var(--foreground))]/25'}`}>
                  <span>{m.completed ? '✦ ' : '○ '}</span>
                  <span className={m.completed ? 'line-through' : ''}>{m.title}</span>
                  <p className="text-[hsl(var(--foreground))]/12 text-[9px] ml-3">{m.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Top right controls */}
          <div className="absolute top-4 right-4 flex gap-3 items-center">
            <button onClick={handleModeToggle}
              className="text-[hsl(var(--foreground))]/15 hover:text-[hsl(var(--foreground))]/40 text-[10px] font-serif tracking-wider transition-colors">
              {mode === 'observe' ? 'take authority' : 'observe'}
            </button>
            <button onClick={handleExit}
              className="text-[hsl(var(--foreground))]/15 hover:text-[hsl(var(--foreground))]/40 text-xs font-serif tracking-wider transition-colors">
              leave
            </button>
          </div>

          {/* Mode prompt (appears after 8s of observing) */}
          {showModePrompt && mode === 'observe' && (
            <div className="absolute bottom-20 left-0 right-0 text-center animate-fade-in">
              <div className="inline-block bg-black/60 backdrop-blur-sm border border-[hsl(var(--primary))]/10 rounded px-6 py-3">
                <p className="font-serif text-[hsl(var(--foreground))]/30 text-xs mb-3">Would you like to walk this world?</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setShowModePrompt(false)}
                    className="text-[hsl(var(--foreground))]/30 hover:text-[hsl(var(--foreground))]/50 text-[10px] font-serif py-1 px-3 border border-[hsl(var(--foreground))]/8 rounded transition-all">
                    Continue observing
                  </button>
                  <button onClick={() => handleModeSelect('authority')}
                    className="text-[hsl(var(--primary))]/50 hover:text-[hsl(var(--primary))] text-[10px] font-serif py-1 px-3 border border-[hsl(var(--primary))]/15 rounded hover:bg-[hsl(var(--primary))]/5 transition-all">
                    Take authority
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nearby sage indicator */}
          {mode === 'authority' && !nearbySage && !interactionResponse && !showActionMenu && (
            <NearbyIndicator session={sessionRef.current} />
          )}

          {/* Observe narration */}
          {mode === 'observe' && narration && !showModePrompt && (
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none"
              style={{ opacity: narrationOpacity, transition: 'opacity 1.5s ease' }}>
              <p className="font-serif text-[hsl(var(--foreground))]/30 text-sm italic tracking-wide">{narration}</p>
            </div>
          )}

          {/* Moment notification */}
          {momentNotif && (
            <div className="absolute top-16 left-0 right-0 text-center pointer-events-none animate-fade-in z-30">
              <span className="inline-block bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 rounded px-4 py-2 font-serif text-[hsl(var(--primary))]/60 text-xs tracking-wider">
                {momentNotif}
              </span>
            </div>
          )}

          {/* Level up notification */}
          {levelUpNotif && (
            <div className="absolute top-24 left-0 right-0 text-center pointer-events-none animate-fade-in z-30">
              <span className="inline-block bg-[hsl(var(--primary))]/15 border border-[hsl(var(--primary))]/25 rounded px-4 py-2 font-serif text-[hsl(var(--primary))]/70 text-xs tracking-wider">
                {levelUpNotif}
              </span>
            </div>
          )}

          {/* Interaction dialog */}
          {nearbySage && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-[hsl(var(--primary))]/10 px-6 py-5 z-20">
              <div className="max-w-md mx-auto">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-serif text-[hsl(var(--primary))]/50 text-sm">{nearbySage.name}</span>
                  <span className="text-[hsl(var(--foreground))]/15 text-[10px] italic">· {nearbySage.mood}</span>
                  <span className="text-[hsl(var(--foreground))]/10 text-[9px]">♡ {nearbySage.relationship}</span>
                </div>
                <p className="font-serif text-[hsl(var(--foreground))]/30 text-xs italic mb-4">"{nearbySage.thought}"</p>
                <div className="flex gap-2 flex-wrap">
                  {['sit', 'listen', 'ask', 'silent'].map(act => (
                    <button key={act} onClick={() => handleInteraction(act)}
                      className="text-[hsl(var(--foreground))]/40 hover:text-[hsl(var(--primary))] text-xs font-serif py-1.5 px-3 border border-[hsl(var(--foreground))]/8 rounded hover:border-[hsl(var(--primary))]/15 transition-all">
                      {act === 'sit' ? 'Sit together' : act === 'listen' ? 'Listen' : act === 'ask' ? 'Ask' : 'Remain silent'}
                    </button>
                  ))}
                  <button onClick={() => handleAction('gift')}
                    className="text-[hsl(var(--foreground))]/40 hover:text-[hsl(var(--primary))] text-xs font-serif py-1.5 px-3 border border-[hsl(var(--foreground))]/8 rounded hover:border-[hsl(var(--primary))]/15 transition-all">
                    Gift item
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action menu */}
          {showActionMenu && !nearbySage && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-[hsl(var(--primary))]/10 px-6 py-4 z-20">
              <div className="max-w-md mx-auto">
                <p className="text-[hsl(var(--primary))]/30 text-[9px] font-serif tracking-[0.2em] uppercase mb-3">Actions</p>
                <div className="flex gap-2 flex-wrap">
                  {actionMenu.map(a => (
                    <button key={a.action} onClick={() => handleAction(a.action)}
                      className="text-[hsl(var(--foreground))]/40 hover:text-[hsl(var(--primary))] text-xs font-serif py-1.5 px-3 border border-[hsl(var(--foreground))]/8 rounded hover:border-[hsl(var(--primary))]/15 transition-all"
                      title={a.description}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          {(interactionResponse || actionFeedback) && !nearbySage && !showActionMenu && (
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="font-serif text-[hsl(var(--foreground))]/30 text-sm italic tracking-wide">
                {interactionResponse || actionFeedback}
              </p>
            </div>
          )}

          {/* Controls hint */}
          {mode === 'authority' && (
            <div className="absolute bottom-3 right-4 text-[hsl(var(--foreground))]/8 text-[9px] font-serif">
              WASD move · E action · I inv · J moments · P stats
            </div>
          )}
        </>
      )}
    </div>
  );
};

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
      <p className="font-serif text-[hsl(var(--primary))]/25 text-xs tracking-wide animate-pulse">
        Press E to speak with {nearbyName}
      </p>
    </div>
  );
}

export default Mayaworld;
