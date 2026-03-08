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

  // Cloud transition - cinematic pixel art clouds
  useEffect(() => {
    if (phase !== 'clouds') return;
    const session = createSession(boundNameRef.current);
    sessionRef.current = session;

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

    // Generate cloud particles
    const particles: { x: number; y: number; size: number; speed: number; opacity: number; drift: number }[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 8 + Math.random() * 40,
        speed: 0.5 + Math.random() * 1.5,
        opacity: 0.05 + Math.random() * 0.15,
        drift: (Math.random() - 0.5) * 0.8,
      });
    }

    const start = performance.now();
    const duration = 4000;
    let raf: number;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCloudProgress(progress);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep background
      const bgAlpha = 1 - progress * 0.9;
      ctx.fillStyle = `rgba(5, 8, 15, ${bgAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Moving cloud particles
      for (const p of particles) {
        const verticalDispersal = progress * progress * (p.y < canvas.height / 2 ? -300 : 300);
        const horizontalDrift = Math.sin(now * 0.001 * p.speed + p.drift * 3) * 15 + p.drift * progress * 100;
        const alpha = p.opacity * (1 - progress);
        if (alpha <= 0.01) continue;

        const px = p.x + horizontalDrift;
        const py = p.y + verticalDispersal;

        // Soft cloud shape
        const g = ctx.createRadialGradient(px, py, 0, px, py, p.size);
        g.addColorStop(0, `rgba(180, 200, 220, ${alpha})`);
        g.addColorStop(0.4, `rgba(160, 185, 210, ${alpha * 0.7})`);
        g.addColorStop(0.7, `rgba(140, 170, 200, ${alpha * 0.3})`);
        g.addColorStop(1, `rgba(130, 160, 190, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Light rays breaking through
      if (progress > 0.3) {
        const rayAlpha = Math.min(0.06, (progress - 0.3) * 0.1);
        const rayG = ctx.createLinearGradient(canvas.width / 2, 0, canvas.width / 2, canvas.height);
        rayG.addColorStop(0, `rgba(255, 220, 150, ${rayAlpha})`);
        rayG.addColorStop(0.5, `rgba(255, 220, 150, ${rayAlpha * 0.5})`);
        rayG.addColorStop(1, `rgba(255, 220, 150, 0)`);
        ctx.fillStyle = rayG;
        ctx.fillRect(canvas.width * 0.3, 0, canvas.width * 0.4, canvas.height);
      }

      // Entering text
      if (progress > 0.2 && progress < 0.7) {
        const textAlpha = Math.min(1, (progress - 0.2) / 0.15) * (1 - Math.max(0, (progress - 0.55) / 0.15));
        ctx.font = '13px serif';
        ctx.fillStyle = `rgba(200, 215, 225, ${textAlpha * 0.5})`;
        ctx.textAlign = 'center';
        ctx.fillText('The world was always here.', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '10px serif';
        ctx.fillStyle = `rgba(200, 215, 225, ${textAlpha * 0.3})`;
        ctx.fillText(`You are ${boundNameRef.current}.`, canvas.width / 2, canvas.height / 2 + 10);
      }

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setPhase('world');
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
    const timer = setTimeout(() => { setShowModePrompt(true); }, 8000);
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

  const getWeatherIcon = (w: string) => {
    if (w === 'rain') return '🌧';
    if (w === 'mist') return '🌫';
    if (w === 'wind') return '🍃';
    return '☀';
  };

  const getTimeIcon = (t: string) => {
    if (t === 'morning') return '🌅';
    if (t === 'evening') return '🌇';
    if (t === 'night') return '🌙';
    return '☀';
  };

  // === ENTRY SCREEN ===
  if (phase === 'entry') {
    return (
      <div className="fixed inset-0 bg-[#030608] flex items-center justify-center z-50 overflow-y-auto">
        <div className="text-center max-w-lg px-8 py-12">
          {/* Title */}
          <div className="mb-8">
            <h1 className="font-mono text-[hsl(var(--primary))]/30 text-lg tracking-[0.4em] uppercase mb-1">
              MAYAWORLD
            </h1>
            <div className="w-16 h-px bg-[hsl(var(--primary))]/10 mx-auto" />
          </div>

          <div className="mb-10 space-y-2">
            {POETIC_LINES.map((line, i) => (
              <p key={i} className="font-serif text-[hsl(var(--foreground))]/35 text-sm leading-relaxed transition-all duration-1000"
                style={{ opacity: i < visibleLines ? 1 : 0, transform: i < visibleLines ? 'translateY(0)' : 'translateY(8px)' }}>
                {line || '\u00A0'}
              </p>
            ))}
          </div>

          <div className="mb-10 space-y-1" style={{ opacity: visibleLines >= POETIC_LINES.length ? 1 : 0, transition: 'opacity 1.2s ease' }}>
            <p className="font-mono text-[hsl(var(--primary))]/20 text-[9px] tracking-[0.4em] uppercase mb-3">THE NINE SAGES</p>
            <div className="grid gap-0.5">
              {SAGE_DEFINITIONS.map(sage => (
                <div key={sage.name} className="flex items-center justify-center gap-3 py-0.5 hover:bg-[hsl(var(--primary))]/3 rounded transition-colors cursor-default group">
                  <span className="font-mono text-[hsl(var(--foreground))]/15 w-10 text-right text-[11px] group-hover:text-[hsl(var(--primary))]/25 transition-colors">
                    {Object.entries(ACCESS_CODES).find(([, n]) => n === sage.name)?.[0]}
                  </span>
                  <span className="w-2 h-2 rounded-full ring-1 ring-white/5" style={{ backgroundColor: sage.color, opacity: 0.5 }} />
                  <span className="font-serif text-[hsl(var(--foreground))]/45 w-20 text-left text-[12px] group-hover:text-[hsl(var(--foreground))]/60 transition-colors">{sage.name}</span>
                  <span className="text-[hsl(var(--foreground))]/15 italic text-[10px] w-32 text-left">{sage.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4" style={{ opacity: visibleLines >= POETIC_LINES.length ? 1 : 0, transition: 'opacity 1.5s ease 0.5s' }}>
            <input type="text" inputMode="numeric" maxLength={4} value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleEnter()}
              placeholder="· · · ·"
              className="w-36 text-center text-xl tracking-[0.5em] bg-transparent border-b-2 border-[hsl(var(--primary))]/10 text-[hsl(var(--foreground))]/70 py-3 focus:outline-none focus:border-[hsl(var(--primary))]/30 font-mono placeholder:text-[hsl(var(--foreground))]/8 placeholder:tracking-[0.3em] placeholder:text-lg transition-colors"
              autoFocus />
            <button onClick={handleEnter}
              className="mt-3 px-10 py-3 font-mono text-[10px] tracking-[0.3em] uppercase text-[hsl(var(--primary))]/50 border border-[hsl(var(--primary))]/12 rounded-sm hover:border-[hsl(var(--primary))]/30 hover:text-[hsl(var(--primary))]/80 hover:bg-[hsl(var(--primary))]/5 transition-all duration-500 hover:shadow-[0_0_20px_rgba(212,175,106,0.08)]">
              ENTER MAYAWORLD
            </button>
            {error && <p className="text-red-400/40 text-xs font-serif italic animate-pulse mt-2">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'fading') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-fade-in">
        <p className="font-serif text-[hsl(var(--foreground))]/15 text-sm italic">The world dissolves.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#030608]">
      {/* Cloud transition canvas */}
      {phase === 'clouds' && (
        <canvas ref={cloudCanvasRef} className="absolute inset-0 w-full h-full z-10" />
      )}

      {/* Main world canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" onClick={handleCanvasTap} onTouchStart={handleCanvasTap}
        style={{ opacity: phase === 'clouds' ? cloudProgress * cloudProgress : 1 }} />

      {/* World UI */}
      {phase === 'world' && (
        <>
          {/* Top-left HUD */}
          <div className="absolute top-3 left-3 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm border border-[hsl(var(--primary))]/8 rounded px-3 py-2 min-w-[140px]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: SAGE_DEFINITIONS.find(s => s.name === boundNameRef.current)?.color || '#D4AF6A' }} />
                <span className="text-[hsl(var(--primary))]/50 text-[11px] font-mono tracking-wider">
                  {boundNameRef.current}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[hsl(var(--foreground))]/20 text-[9px] font-mono">
                <span>{getTimeIcon(timeOfDay)}</span>
                <span>{timeOfDay}</span>
                <span className="text-[hsl(var(--foreground))]/8">|</span>
                <span>{getWeatherIcon(weather)}</span>
                <span>{weather}</span>
              </div>
              {stats && (
                <div className="flex items-center gap-1.5 text-[9px] font-mono mt-1">
                  <span className="text-[hsl(var(--primary))]/30">Lv.{stats.level}</span>
                  <span className="text-[hsl(var(--foreground))]/8">|</span>
                  <span className={`${stats.karma >= 50 ? 'text-green-400/40' : stats.karma < 0 ? 'text-red-400/40' : 'text-[hsl(var(--foreground))]/20'}`}>
                    K:{stats.karma > 0 ? '+' : ''}{stats.karma}
                  </span>
                  <span className="text-[hsl(var(--foreground))]/8">|</span>
                  <span className="text-[hsl(var(--foreground))]/15">{mode === 'observe' ? '👁 observe' : '✋ authority'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats overlay */}
          {showStats && stats && (
            <div className="absolute top-20 left-3 bg-black/80 backdrop-blur-sm border border-[hsl(var(--primary))]/10 rounded px-4 py-3 min-w-[180px] z-20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[hsl(var(--primary))]/40 text-[9px] font-mono tracking-[0.2em] uppercase">STATS</span>
                <div className="flex-1 h-px bg-[hsl(var(--primary))]/8" />
              </div>
              {[
                ['Level', stats.level],
                ['XP', `${stats.xp}/${stats.xpToNext}`],
                ['Karma', `${stats.karma} · ${getKarmaLabel(stats.karma)}`],
                ['Wisdom', stats.wisdom],
                ['Insight', stats.insight],
                ['Bond', stats.bond],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between text-[10px] font-mono text-[hsl(var(--foreground))]/25 py-0.5">
                  <span>{label}</span>
                  <span className="text-[hsl(var(--primary))]/25 ml-3">{value}</span>
                </div>
              ))}
              {/* XP bar */}
              <div className="mt-2 h-1.5 bg-black/40 rounded-full overflow-hidden border border-[hsl(var(--primary))]/8">
                <div className="h-full bg-[hsl(var(--primary))]/25 rounded-full transition-all duration-500" style={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }} />
              </div>
              {stats.level > 1 && LEVEL_UNLOCKS[stats.level] && (
                <p className="text-[hsl(var(--primary))]/20 text-[9px] font-mono italic mt-2">✦ {LEVEL_UNLOCKS[stats.level]}</p>
              )}
            </div>
          )}

          {/* Inventory */}
          {showInventory && (
            <div className="absolute top-20 left-3 bg-black/80 backdrop-blur-sm border border-[hsl(var(--primary))]/10 rounded px-4 py-3 min-w-[160px] z-20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[hsl(var(--primary))]/40 text-[9px] font-mono tracking-[0.2em] uppercase">INVENTORY</span>
                <div className="flex-1 h-px bg-[hsl(var(--primary))]/8" />
              </div>
              {inventoryItems.length === 0 ? (
                <p className="text-[hsl(var(--foreground))]/12 text-[10px] font-mono italic">Empty</p>
              ) : inventoryItems.map((item, i) => (
                <div key={i} className="flex justify-between text-[10px] font-mono text-[hsl(var(--foreground))]/30 py-0.5">
                  <span>· {item.name}</span>
                  <span className="text-[hsl(var(--primary))]/20 ml-3">×{item.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Moments (journal) */}
          {showMoments && (
            <div className="absolute top-20 right-3 bg-black/80 backdrop-blur-sm border border-[hsl(var(--primary))]/10 rounded px-4 py-3 min-w-[200px] max-w-[260px] z-20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[hsl(var(--primary))]/40 text-[9px] font-mono tracking-[0.2em] uppercase">MOMENTS</span>
                <div className="flex-1 h-px bg-[hsl(var(--primary))]/8" />
              </div>
              {moments.map(m => (
                <div key={m.id} className={`text-[10px] font-mono mb-1.5 ${m.completed ? 'text-[hsl(var(--primary))]/35' : 'text-[hsl(var(--foreground))]/22'}`}>
                  <span>{m.completed ? '✦ ' : '○ '}</span>
                  <span className={m.completed ? 'line-through' : ''}>{m.title}</span>
                  <p className="text-[hsl(var(--foreground))]/10 text-[9px] ml-3">{m.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Top right controls */}
          <div className="absolute top-3 right-3 flex gap-2 items-center">
            <button onClick={handleModeToggle}
              className="text-[hsl(var(--foreground))]/20 hover:text-[hsl(var(--foreground))]/50 text-[9px] font-mono tracking-wider transition-colors bg-black/40 px-2 py-1 rounded border border-white/5 hover:border-white/10">
              {mode === 'observe' ? 'take authority' : 'observe'}
            </button>
            <button onClick={handleExit}
              className="text-[hsl(var(--foreground))]/15 hover:text-red-400/40 text-[9px] font-mono tracking-wider transition-colors bg-black/40 px-2 py-1 rounded border border-white/5 hover:border-red-400/15">
              leave
            </button>
          </div>

          {/* Mode prompt */}
          {showModePrompt && mode === 'observe' && (
            <div className="absolute bottom-20 left-0 right-0 text-center animate-fade-in">
              <div className="inline-block bg-black/70 backdrop-blur-sm border border-[hsl(var(--primary))]/12 rounded-lg px-8 py-5 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <p className="font-serif text-[hsl(var(--foreground))]/35 text-sm mb-4">Would you like to walk this world?</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setShowModePrompt(false)}
                    className="text-[hsl(var(--foreground))]/25 hover:text-[hsl(var(--foreground))]/50 text-[10px] font-mono py-2 px-4 border border-[hsl(var(--foreground))]/8 rounded transition-all hover:bg-white/3">
                    Continue observing
                  </button>
                  <button onClick={() => handleModeSelect('authority')}
                    className="text-[hsl(var(--primary))]/60 hover:text-[hsl(var(--primary))] text-[10px] font-mono py-2 px-4 border border-[hsl(var(--primary))]/20 rounded hover:bg-[hsl(var(--primary))]/8 transition-all hover:shadow-[0_0_15px_rgba(212,175,106,0.1)]">
                    ✋ Take authority
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
              <div className="inline-block bg-black/40 backdrop-blur-sm px-6 py-2 rounded">
                <p className="font-serif text-[hsl(var(--foreground))]/30 text-sm italic tracking-wide">{narration}</p>
              </div>
            </div>
          )}

          {/* Moment notification */}
          {momentNotif && (
            <div className="absolute top-20 left-0 right-0 text-center pointer-events-none animate-fade-in z-30">
              <span className="inline-block bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/25 rounded px-5 py-2.5 font-mono text-[hsl(var(--primary))]/60 text-[11px] tracking-wider shadow-[0_0_20px_rgba(212,175,106,0.1)]">
                {momentNotif}
              </span>
            </div>
          )}

          {/* Level up notification */}
          {levelUpNotif && (
            <div className="absolute top-28 left-0 right-0 text-center pointer-events-none animate-fade-in z-30">
              <span className="inline-block bg-[hsl(var(--primary))]/15 border border-[hsl(var(--primary))]/30 rounded px-5 py-2.5 font-mono text-[hsl(var(--primary))]/70 text-[11px] tracking-wider">
                {levelUpNotif}
              </span>
            </div>
          )}

          {/* Interaction dialog - RPG style bottom panel */}
          {nearbySage && (
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <div className="bg-black/85 backdrop-blur-sm border-t-2 border-[hsl(var(--primary))]/15 px-6 py-5">
                <div className="max-w-lg mx-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SAGE_DEFINITIONS.find(s => s.name === nearbySage.name)?.color }} />
                    <span className="font-mono text-[hsl(var(--primary))]/60 text-[12px] tracking-wider">{nearbySage.name}</span>
                    <span className="text-[hsl(var(--foreground))]/15 text-[9px] font-mono">· {nearbySage.mood}</span>
                    <span className="text-red-300/20 text-[9px] font-mono ml-auto">♡ {nearbySage.relationship}</span>
                  </div>
                  <p className="font-serif text-[hsl(var(--foreground))]/35 text-xs italic mb-4 pl-4 border-l border-[hsl(var(--primary))]/10">
                    "{nearbySage.thought}"
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {['sit', 'listen', 'ask', 'silent'].map(act => (
                      <button key={act} onClick={() => handleInteraction(act)}
                        className="text-[hsl(var(--foreground))]/40 hover:text-[hsl(var(--primary))]/80 text-[10px] font-mono py-1.5 px-3 border border-[hsl(var(--foreground))]/8 rounded hover:border-[hsl(var(--primary))]/20 hover:bg-[hsl(var(--primary))]/5 transition-all">
                        {act === 'sit' ? '🧘 Sit' : act === 'listen' ? '👂 Listen' : act === 'ask' ? '❓ Ask' : '🤫 Silent'}
                      </button>
                    ))}
                    <button onClick={() => handleAction('gift')}
                      className="text-[hsl(var(--foreground))]/40 hover:text-[hsl(var(--primary))]/80 text-[10px] font-mono py-1.5 px-3 border border-[hsl(var(--foreground))]/8 rounded hover:border-[hsl(var(--primary))]/20 hover:bg-[hsl(var(--primary))]/5 transition-all">
                      🎁 Gift
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action menu - RPG bottom panel */}
          {showActionMenu && !nearbySage && (
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <div className="bg-black/85 backdrop-blur-sm border-t-2 border-[hsl(var(--primary))]/15 px-6 py-4">
                <div className="max-w-lg mx-auto">
                  <p className="text-[hsl(var(--primary))]/30 text-[9px] font-mono tracking-[0.3em] uppercase mb-3">ACTIONS</p>
                  <div className="flex gap-2 flex-wrap">
                    {actionMenu.map(a => (
                      <button key={a.action} onClick={() => handleAction(a.action)}
                        className="text-[hsl(var(--foreground))]/40 hover:text-[hsl(var(--primary))]/80 text-[10px] font-mono py-2 px-4 border border-[hsl(var(--foreground))]/8 rounded hover:border-[hsl(var(--primary))]/20 hover:bg-[hsl(var(--primary))]/5 transition-all"
                        title={a.description}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          {(interactionResponse || actionFeedback) && !nearbySage && !showActionMenu && (
            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
              <div className="inline-block bg-black/50 backdrop-blur-sm px-5 py-2 rounded border border-[hsl(var(--primary))]/8">
                <p className="font-serif text-[hsl(var(--foreground))]/35 text-sm italic tracking-wide">
                  {interactionResponse || actionFeedback}
                </p>
              </div>
            </div>
          )}

          {/* Controls hint */}
          {mode === 'authority' && (
            <div className="absolute bottom-2 left-3 text-[hsl(var(--foreground))]/8 text-[8px] font-mono tracking-wider">
              WASD move · E action · I inv · J journal · P stats
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
    <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
      <div className="inline-block bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded border border-[hsl(var(--primary))]/10">
        <p className="font-mono text-[hsl(var(--primary))]/30 text-[10px] tracking-wide animate-pulse">
          Press E to speak with {nearbyName}
        </p>
      </div>
    </div>
  );
}

export default Mayaworld;