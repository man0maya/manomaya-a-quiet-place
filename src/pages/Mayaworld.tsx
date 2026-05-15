import { useState, useRef, useEffect, useCallback } from "react";
import { ACCESS_CODES, SAGE_DEFINITIONS, NARRATION_INTERVAL_MIN, NARRATION_INTERVAL_MAX, LEVEL_UNLOCKS, KARMA_THRESHOLDS } from "@/mayaworld/constants";
import { SimMode, World, SageAction, Moment, PlayerStats } from "@/mayaworld/types";
import { createSession, startSession, stopSession, setMode, getNearestSage, getAvailableActions, executeAction, checkMoments, addKarma, pauseSession, resumeSession, getRibbon, Session } from "@/mayaworld/sessionController";
import { renderWorldIso, renderIsoMinimap, screenToGrid, ISO_TILE_W, ISO_TILE_H, gridToScreen } from "@/mayaworld/renderer";
import { getNarration, getMoodThought, getInteractionResponse, getActionNarration } from "@/mayaworld/dialogueBank";
import { loadPrefs, savePrefs, prefersReducedMotion } from "@/mayaworld/prefs";
import { preloadSageSprites } from "@/mayaworld/iso/spriteAtlas";

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
  const [isPaused, setIsPaused] = useState(false);
  const [worldSeed, setWorldSeed] = useState<number | null>(null);
  const [ribbon, setRibbon] = useState<{ text: string; ts: number }[]>([]);
  const [farewell, setFarewell] = useState<string>('The world dissolves.');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<Session | null>(null);
  const animFrameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const boundNameRef = useRef('');
  const cloudCanvasRef = useRef<HTMLCanvasElement>(null);
  const initialPrefs = useRef(loadPrefs());
  const zoomRef = useRef(initialPrefs.current.zoom ?? 2);
  const cameraRef = useRef<{ x: number; y: number } | null>(null);
  const panOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapRef = useRef<number>(0);
  const [hudExpanded, setHudExpanded] = useState(initialPrefs.current.hudExpanded ?? false);
  const [showMinimap, setShowMinimap] = useState(initialPrefs.current.showMinimap ?? false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(
    initialPrefs.current.reduceMotion ?? prefersReducedMotion()
  );
  const reduceMotionRef = useRef(reduceMotion);
  useEffect(() => { reduceMotionRef.current = reduceMotion; }, [reduceMotion]);
  const [savedToast, setSavedToast] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Persist UI prefs
  useEffect(() => { savePrefs({ hudExpanded }); }, [hudExpanded]);
  useEffect(() => { savePrefs({ showMinimap }); }, [showMinimap]);
  useEffect(() => { savePrefs({ reduceMotion }); }, [reduceMotion]);

  // Preload sage sprites once on mount
  useEffect(() => { preloadSageSprites(); }, []);

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
    setWorldSeed(session.worldSeed);
    // Start paused — the world only awakens once the viewer is actually watching
    pauseSession(session);

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

  // Viewer-presence gate: world ticks only when tab is visible AND focused
  useEffect(() => {
    if (phase !== 'world') return;
    const session = sessionRef.current;
    if (!session) return;

    const evaluate = () => {
      const visible = document.visibilityState === 'visible' && document.hasFocus();
      if (visible) {
        resumeSession(session);
        setIsPaused(false);
      } else {
        pauseSession(session);
        setIsPaused(true);
      }
    };
    evaluate();
    document.addEventListener('visibilitychange', evaluate);
    window.addEventListener('focus', evaluate);
    window.addEventListener('blur', evaluate);
    return () => {
      document.removeEventListener('visibilitychange', evaluate);
      window.removeEventListener('focus', evaluate);
      window.removeEventListener('blur', evaluate);
    };
  }, [phase]);

  // Poll the ambient ribbon
  useEffect(() => {
    if (phase !== 'world') return;
    const id = setInterval(() => {
      const session = sessionRef.current;
      if (!session) return;
      setRibbon(getRibbon(session));
    }, 1500);
    return () => clearInterval(id);
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      // Only auto-pick zoom when user has no saved preference
      if (initialPrefs.current.zoom == null) {
        const auto = w < 600 ? 2.2 : w < 1024 ? 1.9 : 1.6;
        zoomRef.current = auto;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const session = sessionRef.current;
      if (!session || !session.running) { rafRef.current = requestAnimationFrame(draw); return; }
      animFrameRef.current++;
      const bound = session.world.sages.find(s => s.name === session.boundSageName);
      const targetX = bound ? bound.x : session.world.width / 2;
      const targetY = bound ? bound.y : session.world.height / 2;
      // Smooth camera follow
      if (!cameraRef.current) cameraRef.current = { x: targetX, y: targetY };
      const cam = cameraRef.current;
      const recentTap = (performance.now() - lastTapRef.current) < 400;
      const ease = recentTap ? 0.18 : 0.12;
      const dx = targetX - cam.x, dy = targetY - cam.y;
      cam.x += Math.abs(dx) < 0.02 ? dx : dx * ease;
      cam.y += Math.abs(dy) < 0.02 ? dy : dy * ease;
      // Clamp to world bounds
      cam.x = Math.max(2, Math.min(session.world.width - 2, cam.x));
      cam.y = Math.max(2, Math.min(session.world.height - 2, cam.y));

      const totalZoom = dpr * zoomRef.current;
      renderWorldIso(ctx, session.world, { x: cam.x, y: cam.y }, canvas.width, canvas.height, session.boundSageName, animFrameRef.current, totalZoom);
      if (showMinimap) renderIsoMinimap(ctx, session.world, session.boundSageName, canvas.width, canvas.height, Math.min(140, canvas.width * 0.25));
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(rafRef.current); };
  }, [showMinimap]);

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
    if (worldSeed != null) setFarewell(`World #${worldSeed} dissolves. The next will be different.`);
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
    // Convert screen tap → iso grid using same projection used in renderer
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width, cssH = rect.height;
    const z = zoomRef.current;
    const vw = cssW / z, vh = cssH / z;
    // Camera-centered iso origin in virtual (post-zoom) space
    const camIso = gridToScreen(bound.x, bound.y);
    const offX = vw / 2 - camIso.sx;
    const offY = vh / 2 - camIso.sy;
    const localX = (clientX - rect.left) / z - offX;
    const localY = (clientY - rect.top) / z - offY - ISO_TILE_H / 2;
    const { gx, gy } = screenToGrid(localX, localY);
    const dx = gx - bound.x;
    const dy = gy - bound.y;
    session.keysDown.clear();
    if (Math.abs(dx) > Math.abs(dy)) session.keysDown.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    else session.keysDown.add(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    lastTapRef.current = performance.now();
    setTimeout(() => session.keysDown.clear(), 250);
  };

  const exportPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manomaya-${boundNameRef.current.toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1800);
    }, 'image/png');
  }, []);

  // Wheel + pinch zoom
  useEffect(() => {
    if (phase !== 'world') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomRef.current = Math.max(1, Math.min(4, zoomRef.current * factor));
      savePrefs({ zoom: zoomRef.current });
    };
    let pinchStart = 0; let zoomStart = zoomRef.current;
    const dist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    };
    const onTS = (e: TouchEvent) => {
      if (e.touches.length === 2) { pinchStart = dist(e.touches); zoomStart = zoomRef.current; }
    };
    const onTM = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStart > 0) {
        e.preventDefault();
        const d = dist(e.touches);
        zoomRef.current = Math.max(1, Math.min(4, zoomStart * (d / pinchStart)));
      }
    };
    const onTE = () => { if (pinchStart > 0) savePrefs({ zoom: zoomRef.current }); pinchStart = 0; };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTS, { passive: true });
    canvas.addEventListener('touchmove', onTM, { passive: false });
    canvas.addEventListener('touchend', onTE);
    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTS);
      canvas.removeEventListener('touchmove', onTM);
      canvas.removeEventListener('touchend', onTE);
    };
  }, [phase]);

  const getKarmaLabel = (karma: number): string => {
    if (karma >= KARMA_THRESHOLDS.luminous) return 'Luminous';
    if (karma >= KARMA_THRESHOLDS.sacred) return 'Sacred';
    if (karma >= KARMA_THRESHOLDS.warm) return 'Warm';
    if (karma >= KARMA_THRESHOLDS.neutral) return 'Neutral';
    if (karma >= KARMA_THRESHOLDS.cold) return 'Cold';
    return 'Frozen';
  };

const getRibbonIcon = (text: string): string => {
  if (/rain|storm|cloud/i.test(text)) return '🌧';
  if (/rainbow/i.test(text)) return '🌈';
  if (/river|lake|water|flood/i.test(text)) return '💧';
  if (/fire|flame|burn/i.test(text)) return '🔥';
  if (/flower|bloom|lotus/i.test(text)) return '🌸';
  if (/wind|breeze/i.test(text)) return '🍃';
  if (/star|moon|night/i.test(text)) return '✦';
  if (/sun|dawn|light/i.test(text)) return '☀';
  if (/sage|speak|voice|speak/i.test(text)) return '·';
  return '·';
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
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-fade-in px-6 text-center">
        <p className="font-serif text-[hsl(var(--foreground))]/85 text-base italic">{farewell}</p>
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
        style={{ opacity: phase === 'clouds' ? cloudProgress * cloudProgress : 1, imageRendering: 'pixelated' as const, touchAction: 'none' }} />

      {/* World UI */}
      {phase === 'world' && (
        <>
          {/* Top-left HUD — collapsible compact chip */}
          <div className="absolute top-3 left-3 z-30">
            <button
              onClick={() => setHudExpanded(v => !v)}
              aria-label="Toggle status"
              className="bg-black/80 backdrop-blur-md border border-[hsl(var(--primary))]/30 rounded-full pl-2 pr-3 py-1.5 shadow-lg flex items-center gap-2 hover:border-[hsl(var(--primary))]/60 transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: SAGE_DEFINITIONS.find(s => s.name === boundNameRef.current)?.color || '#D4AF6A' }} />
              <span className="text-[hsl(var(--primary))] text-[13px] font-serif tracking-wide">{boundNameRef.current}</span>
              {stats && <span className="text-[hsl(var(--foreground))]/65 text-[11px] font-mono">Lv.{stats.level}</span>}
            </button>
            {hudExpanded && (
              <div className="mt-2 bg-black/85 backdrop-blur-md border border-[hsl(var(--primary))]/30 rounded-lg px-3 py-2 shadow-lg min-w-[180px] space-y-1">
                <div className="flex items-center gap-2 text-[hsl(var(--foreground))]/85 text-[12px] font-mono">
                  <span>{getTimeIcon(timeOfDay)} {timeOfDay}</span>
                  <span className="text-[hsl(var(--foreground))]/40">·</span>
                  <span>{getWeatherIcon(weather)} {weather}</span>
                </div>
                {stats && (
                  <div className="flex items-center gap-2 text-[12px] font-mono">
                    <span className={stats.karma >= 50 ? 'text-green-400' : stats.karma < 0 ? 'text-red-400' : 'text-[hsl(var(--foreground))]/85'}>K:{stats.karma > 0 ? '+' : ''}{stats.karma}</span>
                    <span className="text-[hsl(var(--foreground))]/40">·</span>
                    <span className="text-[hsl(var(--foreground))]/85">{mode === 'observe' ? '👁 observe' : '✋ authority'}</span>
                  </div>
                )}
                {worldSeed != null && (
                  <div className="text-[hsl(var(--foreground))]/55 text-[10px] font-mono tracking-wider">✦ World #{worldSeed}</div>
                )}
              </div>
            )}
          </div>

          {/* Stats overlay */}
          {showStats && stats && (
            <div className="absolute top-28 left-3 bg-black/85 backdrop-blur-md border border-[hsl(var(--primary))]/30 rounded px-4 py-3 min-w-[200px] z-20 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[hsl(var(--primary))] text-[10px] font-mono tracking-[0.2em] uppercase">STATS</span>
                <div className="flex-1 h-px bg-[hsl(var(--primary))]/30" />
              </div>
              {[
                ['Level', stats.level],
                ['XP', `${stats.xp}/${stats.xpToNext}`],
                ['Karma', `${stats.karma} · ${getKarmaLabel(stats.karma)}`],
                ['Wisdom', stats.wisdom],
                ['Insight', stats.insight],
                ['Bond', stats.bond],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between text-[11px] font-mono text-[hsl(var(--foreground))]/85 py-0.5">
                  <span>{label}</span>
                  <span className="text-[hsl(var(--primary))] ml-3">{value}</span>
                </div>
              ))}
              {/* XP bar */}
              <div className="mt-2 h-1.5 bg-black/60 rounded-full overflow-hidden border border-[hsl(var(--primary))]/30">
                <div className="h-full bg-[hsl(var(--primary))] rounded-full transition-all duration-500" style={{ width: `${(stats.xp / stats.xpToNext) * 100}%` }} />
              </div>
              {stats.level > 1 && LEVEL_UNLOCKS[stats.level] && (
                <p className="text-[hsl(var(--primary))] text-[10px] font-mono italic mt-2">✦ {LEVEL_UNLOCKS[stats.level]}</p>
              )}
            </div>
          )}

          {/* Inventory */}
          {showInventory && (
            <div className="absolute top-28 left-3 bg-black/85 backdrop-blur-md border border-[hsl(var(--primary))]/30 rounded px-4 py-3 min-w-[180px] z-20 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[hsl(var(--primary))] text-[10px] font-mono tracking-[0.2em] uppercase">INVENTORY</span>
                <div className="flex-1 h-px bg-[hsl(var(--primary))]/30" />
              </div>
              {inventoryItems.length === 0 ? (
                <p className="text-[hsl(var(--foreground))]/60 text-[11px] font-mono italic">Empty</p>
              ) : inventoryItems.map((item, i) => (
                <div key={i} className="flex justify-between text-[11px] font-mono text-[hsl(var(--foreground))]/85 py-0.5">
                  <span>· {item.name}</span>
                  <span className="text-[hsl(var(--primary))] ml-3">×{item.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Moments (journal) */}
          {showMoments && (
            <div className="absolute top-20 right-3 bg-black/85 backdrop-blur-md border border-[hsl(var(--primary))]/30 rounded px-4 py-3 min-w-[220px] max-w-[280px] z-20 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[hsl(var(--primary))] text-[10px] font-mono tracking-[0.2em] uppercase">MOMENTS</span>
                <div className="flex-1 h-px bg-[hsl(var(--primary))]/30" />
              </div>
              {moments.map(m => (
                <div key={m.id} className={`text-[11px] font-mono mb-1.5 ${m.completed ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--foreground))]/85'}`}>
                  <span>{m.completed ? '✦ ' : '○ '}</span>
                  <span className={m.completed ? 'line-through' : ''}>{m.title}</span>
                  <p className="text-[hsl(var(--foreground))]/55 text-[10px] ml-3">{m.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Top right controls — icon buttons, 40x40 touch targets */}
          <div className="absolute top-3 right-3 flex gap-2 items-center z-30">
            <button onClick={() => { zoomRef.current = Math.min(4, zoomRef.current * 1.15); savePrefs({ zoom: zoomRef.current }); }}
              aria-label="Zoom in"
              className="w-10 h-10 flex items-center justify-center text-[hsl(var(--foreground))]/85 hover:text-[hsl(var(--primary))] text-lg bg-black/80 backdrop-blur-md rounded-full border border-[hsl(var(--primary))]/30 hover:border-[hsl(var(--primary))] transition-colors">+</button>
            <button onClick={() => { zoomRef.current = Math.max(1, zoomRef.current / 1.15); savePrefs({ zoom: zoomRef.current }); }}
              aria-label="Zoom out"
              className="w-10 h-10 flex items-center justify-center text-[hsl(var(--foreground))]/85 hover:text-[hsl(var(--primary))] text-lg bg-black/80 backdrop-blur-md rounded-full border border-[hsl(var(--primary))]/30 hover:border-[hsl(var(--primary))] transition-colors">−</button>
            <button onClick={exportPng}
              aria-label="Save view as PNG"
              className="w-10 h-10 flex items-center justify-center text-base text-[hsl(var(--foreground))]/85 hover:text-[hsl(var(--primary))] bg-black/80 backdrop-blur-md rounded-full border border-[hsl(var(--primary))]/30 hover:border-[hsl(var(--primary))] transition-colors">⤓</button>
            <button onClick={() => setShowMinimap(v => !v)}
              aria-label="Toggle minimap"
              className={`w-10 h-10 flex items-center justify-center text-base bg-black/80 backdrop-blur-md rounded-full border transition-colors ${showMinimap ? 'text-[hsl(var(--primary))] border-[hsl(var(--primary))]' : 'text-[hsl(var(--foreground))]/85 border-[hsl(var(--primary))]/30 hover:border-[hsl(var(--primary))]'}`}>◔</button>
            <button onClick={handleModeToggle}
              aria-label={mode === 'observe' ? 'Take authority' : 'Observe'}
              className="w-10 h-10 flex items-center justify-center text-base text-[hsl(var(--foreground))]/85 hover:text-[hsl(var(--primary))] bg-black/80 backdrop-blur-md rounded-full border border-[hsl(var(--primary))]/30 hover:border-[hsl(var(--primary))] transition-colors">
              {mode === 'observe' ? '✋' : '👁'}
            </button>
            <button onClick={handleExit}
              aria-label="Leave"
              className="w-10 h-10 flex items-center justify-center text-base text-[hsl(var(--foreground))]/85 hover:text-red-400 bg-black/80 backdrop-blur-md rounded-full border border-[hsl(var(--primary))]/30 hover:border-red-400/60 transition-colors">↩</button>
          </div>

          {/* Ambient ribbon — what's happening in the world */}
{ribbon.length > 0 && (
  <div className="absolute top-16 right-3 max-w-[270px] pointer-events-none z-10 space-y-1.5">
    {ribbon.map((r, i) => (
      <div
        key={r.ts + '-' + i}
        className="bg-black/75 backdrop-blur-md border border-[hsl(var(--primary))]/25 rounded-lg px-3 py-2"
        style={{
          opacity: 1 - i * 0.30,
          transform: `translateX(${i * 4}px)`,
          animation: i === 0 ? 'ribbonIn 0.4s ease-out' : 'none',
        }}>
        <p className="font-serif text-[hsl(var(--foreground))]/90 text-[12px] leading-snug">
          {getRibbonIcon(r.text)} {r.text}
        </p>
      </div>
    ))}
  </div>
)}

          {/* Paused (viewer absent) overlay */}
          {savedToast && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/85 border border-[hsl(var(--primary))]/40 rounded-full px-4 py-1.5 text-[hsl(var(--primary))] text-[12px] font-mono tracking-wider z-40 pointer-events-none">
              ✦ View saved
            </div>
          )}
          {isPaused && (
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none">
              <div className="text-center px-8 py-6 bg-black/80 border border-[hsl(var(--primary))]/30 rounded-lg shadow-xl">
                <p className="font-serif text-[hsl(var(--foreground))] text-lg mb-2">✦ The world rests</p>
                <p className="font-serif text-[hsl(var(--foreground))]/75 text-sm italic">It will continue when you return your gaze.</p>
              </div>
            </div>
          )}

          {/* Mode prompt */}
          {showModePrompt && mode === 'observe' && (
            <div className="absolute bottom-20 left-0 right-0 text-center animate-fade-in px-4">
              <div className="inline-block bg-black/90 backdrop-blur-md border border-[hsl(var(--primary))]/40 rounded-lg px-8 py-5 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
                <p className="font-serif text-[hsl(var(--foreground))] text-base mb-4">Would you like to walk this world?</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={() => setShowModePrompt(false)}
                    className="text-[hsl(var(--foreground))]/85 hover:text-[hsl(var(--foreground))] text-[12px] font-mono py-2 px-4 border border-[hsl(var(--foreground))]/30 rounded transition-all hover:bg-white/10">
                    Continue observing
                  </button>
                  <button onClick={() => handleModeSelect('authority')}
                    className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] text-[12px] font-mono py-2 px-4 border border-[hsl(var(--primary))]/60 rounded hover:bg-[hsl(var(--primary))]/15 transition-all">
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
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none px-4"
              style={{ opacity: narrationOpacity, transition: 'opacity 1.5s ease' }}>
              <div className="inline-block bg-black/85 backdrop-blur-md px-6 py-3 rounded-lg border border-[hsl(var(--primary))]/25 shadow-lg max-w-xl">
                <p className="font-serif text-[hsl(var(--foreground))] text-[15px] leading-relaxed">{narration}</p>
              </div>
            </div>
          )}

          {/* Moment notification */}
          {momentNotif && (
            <div className="absolute top-20 left-0 right-0 text-center pointer-events-none animate-fade-in z-30">
              <span className="inline-block bg-[hsl(var(--primary))]/25 border border-[hsl(var(--primary))]/60 rounded px-5 py-2.5 font-mono text-[hsl(var(--primary))] text-[12px] tracking-wider shadow-[0_0_20px_rgba(212,175,106,0.25)]">
                {momentNotif}
              </span>
            </div>
          )}

          {/* Level up notification */}
          {levelUpNotif && (
            <div className="absolute top-32 left-0 right-0 text-center pointer-events-none animate-fade-in z-30">
              <span className="inline-block bg-[hsl(var(--primary))]/25 border border-[hsl(var(--primary))]/60 rounded px-5 py-2.5 font-mono text-[hsl(var(--primary))] text-[12px] tracking-wider">
                {levelUpNotif}
              </span>
            </div>
          )}

          {/* Interaction dialog - RPG style bottom panel */}
          {nearbySage && (
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <div className="bg-black/92 backdrop-blur-md border-t-2 border-[hsl(var(--primary))]/50 px-6 py-5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <div className="max-w-xl mx-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SAGE_DEFINITIONS.find(s => s.name === nearbySage.name)?.color }} />
                    <span className="font-mono text-[hsl(var(--primary))] text-[14px] tracking-wider font-semibold">{nearbySage.name}</span>
                    <span className="text-[hsl(var(--foreground))]/65 text-[11px] font-mono">· {nearbySage.mood}</span>
                    <span className="text-red-300/80 text-[11px] font-mono ml-auto">♡ {nearbySage.relationship}</span>
                  </div>
                  <p className="font-serif text-[hsl(var(--foreground))] text-[15px] leading-relaxed mb-4 pl-4 border-l-2 border-[hsl(var(--primary))]/40">
                    "{nearbySage.thought}"
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {['sit', 'listen', 'ask', 'silent'].map(act => (
                      <button key={act} onClick={() => handleInteraction(act)}
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] text-[12px] font-mono py-2 px-3.5 border border-[hsl(var(--foreground))]/30 rounded hover:border-[hsl(var(--primary))]/60 hover:bg-[hsl(var(--primary))]/10 transition-all">
                        {act === 'sit' ? '🧘 Sit' : act === 'listen' ? '👂 Listen' : act === 'ask' ? '❓ Ask' : '🤫 Silent'}
                      </button>
                    ))}
                    <button onClick={() => handleAction('gift')}
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] text-[12px] font-mono py-2 px-3.5 border border-[hsl(var(--foreground))]/30 rounded hover:border-[hsl(var(--primary))]/60 hover:bg-[hsl(var(--primary))]/10 transition-all">
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
              <div className="bg-black/92 backdrop-blur-md border-t-2 border-[hsl(var(--primary))]/50 px-6 py-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <div className="max-w-xl mx-auto">
                  <p className="text-[hsl(var(--primary))] text-[10px] font-mono tracking-[0.3em] uppercase mb-3">ACTIONS</p>
                  <div className="flex gap-2 flex-wrap">
                    {actionMenu.map(a => (
                      <button key={a.action} onClick={() => handleAction(a.action)}
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] text-[12px] font-mono py-2 px-4 border border-[hsl(var(--foreground))]/30 rounded hover:border-[hsl(var(--primary))]/60 hover:bg-[hsl(var(--primary))]/10 transition-all"
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
<div className="absolute inset-x-0 bottom-16 flex justify-center pointer-events-none px-4 z-30">
    <div
      className="bg-black/80 backdrop-blur-md border border-[hsl(var(--primary))]/35 rounded-2xl px-6 py-5 max-w-sm w-full shadow-2xl"
      style={{ animation: 'sageIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}
    >
      {/* Sage name + mood */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: SAGE_DEFINITIONS.find(s => s.name === nearbySage.name)?.color || '#D4AF6A' }}
        />
        <span className="font-serif text-[hsl(var(--primary))] text-[15px] tracking-wide">
          {nearbySage.name}
        </span>
        <span className="text-[hsl(var(--foreground))]/40 text-[11px] font-mono ml-auto italic">
          {nearbySage.mood}
        </span>
      </div>
      {/* Divider */}
      <div className="h-px bg-[hsl(var(--primary))]/15 mb-3" />
      {/* Thought */}
      <p className="font-serif text-[hsl(var(--foreground))]/85 text-[13px] leading-relaxed italic text-center">
        "{nearbySage.thought}"
      </p>
      {/* Relationship bar */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[hsl(var(--foreground))]/35 text-[10px] font-mono">bond</span>
        <div className="flex-1 h-0.5 bg-black/60 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, Math.max(0, (nearbySage.relationship + 100) / 2))}%`,
              backgroundColor: nearbySage.relationship >= 0
                ? 'hsl(var(--primary))'
                : '#ef4444',
            }}
          />
        </div>
        <span className="text-[hsl(var(--foreground))]/35 text-[10px] font-mono">
          {nearbySage.relationship > 50 ? 'deep' : nearbySage.relationship > 0 ? 'warm' : 'distant'}
        </span>
      </div>
      {/* Hint */}
      <p className="text-center text-[hsl(var(--foreground))]/30 text-[10px] font-mono mt-3 tracking-wide">
        press E again to speak · ESC to step back
      </p>
    </div>
  </div>
          )}

          {/* Controls hint */}
          {mode === 'authority' && (
<div className="absolute bottom-3 left-3 text-[hsl(var(--foreground))]/75 text-[11px] font-mono tracking-wide bg-black/72 backdrop-blur-sm border border-[hsl(var(--primary))]/18 px-3 py-1.5 rounded-full">
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
        <p className="font-mono text-[hsl(var(--primary))]/80 text-[12px] tracking-wide animate-pulse">
          · speak with {nearbyName}
        </p>
      </div>
    </div>
  );
}

export default Mayaworld;
