// src/mayaworld/three/WorldScene.tsx
// Main Three.js scene — replaces the 2D canvas renderer entirely.
// All game logic (agentEngine, sessionController, etc.) stays unchanged.

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Html, Fog } from '@react-three/drei';
import * as THREE from 'three';
import { World, Sage } from '../types';
import { TILE_COLORS, SAGE_DEFINITIONS } from '../constants';

// ── Tile height map ───────────────────────────────────────────────────────
// Higher value = taller block. Gives the world real topography.
export const TILE_HEIGHTS: Record<string, number> = {
  water:      0.06,
  lake:       0.06,
  river:      0.10,
  sand:       0.14,
  beach:      0.16,
  grass:      0.22,
  tall_grass: 0.28,
  clearing:   0.22,
  flower:     0.24,
  garden:     0.26,
  stone:      0.36,
  stone_path: 0.30,
  bridge:     0.28,
  forest:     0.32,
  grove:      0.34,
  ruins:      0.38,
  hut:        0.40,
  village:    0.42,
  temple:     0.46,
  shrine:     0.44,
  cave:       0.44,
  mountain:   0.80,
};

export function getTileHeight(type: string): number {
  return TILE_HEIGHTS[type] ?? 0.22;
}

// ── Instanced tile mesh ───────────────────────────────────────────────────
// One draw call per tile TYPE. 6400 tiles → ~20 draw calls total.
function TileInstances({
  tiles, color, height,
}: {
  tiles: Array<{ x: number; y: number }>;
  color: string;
  height: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    tiles.forEach(({ x, y }, i) => {
      dummy.position.set(x, height / 2, y);
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [tiles, height, dummy]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, tiles.length]} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshToonMaterial color={color} />
    </instancedMesh>
  );
}

// ── Water plane with animated shader ─────────────────────────────────────
function AnimatedWater({ tiles }: { tiles: Array<{ x: number; y: number }> }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const matRef = useRef<THREE.MeshToonMaterial>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    tiles.forEach(({ x, y }, i) => {
      dummy.position.set(x, 0.06, y);
      dummy.scale.set(1, 0.02, 1);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [tiles, dummy]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      const t = clock.getElapsedTime();
      // Subtle color oscillation for shimmer effect
      const shift = Math.sin(t * 0.8) * 0.04;
      (matRef.current as any).color?.setRGB(0.20 + shift, 0.38 + shift, 0.55 + shift);
    }
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, Math.max(1, tiles.length)]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshToonMaterial ref={matRef} color="#3A6282" transparent opacity={0.82} />
    </instancedMesh>
  );
}

// ── Terrain ───────────────────────────────────────────────────────────────
export function Terrain({ world }: { world: World }) {
  const groups = useMemo(() => {
    const map = new Map<string, Array<{ x: number; y: number }>>();
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const tile = world.tiles[y]?.[x];
        if (!tile) continue;
        if (!map.has(tile.type)) map.set(tile.type, []);
        map.get(tile.type)!.push({ x, y });
      }
    }
    return map;
  }, [world]);

  const waterTypes = new Set(['water', 'lake', 'river']);

  return (
    <group>
      {/* Ground plane under everything */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[world.width / 2, -0.01, world.height / 2]} receiveShadow>
        <planeGeometry args={[world.width + 4, world.height + 4]} />
        <meshToonMaterial color="#1A2A1A" />
      </mesh>

      {/* Tile instances per type */}
      {Array.from(groups.entries()).map(([type, tiles]) => {
        if (waterTypes.has(type)) return null; // handled separately
        const color = TILE_COLORS[type] ?? '#888';
        const height = getTileHeight(type);
        return <TileInstances key={type} tiles={tiles} color={color} height={height} />;
      })}

      {/* Animated water */}
      {(() => {
        const waterTiles: Array<{ x: number; y: number }> = [];
        for (const type of ['water', 'lake', 'river']) {
          waterTiles.push(...(groups.get(type) ?? []));
        }
        return waterTiles.length > 0 ? <AnimatedWater tiles={waterTiles} /> : null;
      })()}
    </group>
  );
}

// ── Tree decoration ───────────────────────────────────────────────────────
function TreeInstances({ tiles, isGrove }: { tiles: Array<{ x: number; y: number }>; isGrove: boolean }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null!);
  const canopyRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    tiles.forEach(({ x, y }, i) => {
      const seed = (x * 7 + y * 13) % 100;
      const height = getTileHeight(isGrove ? 'grove' : 'forest');
      const treeH  = 0.5 + (seed % 4) * 0.12;
      const ox = ((seed % 7) - 3) * 0.1;
      const oz = ((seed * 3) % 5 - 2) * 0.08;

      // Trunk
      dummy.position.set(x + ox, height + treeH * 0.5, y + oz);
      dummy.scale.set(0.07, treeH, 0.07);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);

      // Canopy
      const canopySize = 0.32 + (seed % 5) * 0.06;
      dummy.position.set(x + ox, height + treeH + canopySize * 0.7, y + oz);
      dummy.scale.set(canopySize, canopySize * 1.2, canopySize);
      dummy.updateMatrix();
      canopyRef.current.setMatrixAt(i, dummy.matrix);
    });
    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
  }, [tiles, isGrove, dummy]);

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, Math.max(1, tiles.length)]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshToonMaterial color="#5A3A1A" />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, Math.max(1, tiles.length)]} castShadow>
        <coneGeometry args={[1, 1, 7]} />
        <meshToonMaterial color={isGrove ? '#2A4A1E' : '#2E4A22'} />
      </instancedMesh>
    </>
  );
}

// ── Mountain peaks ────────────────────────────────────────────────────────
function MountainInstances({ tiles }: { tiles: Array<{ x: number; y: number }> }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    tiles.forEach(({ x, y }, i) => {
      const seed = (x * 7 + y * 13) % 100;
      const h = getTileHeight('mountain');
      const peakH  = 0.5 + (seed % 4) * 0.15;
      const peakW  = 0.45 + (seed % 3) * 0.08;
      dummy.position.set(x, h + peakH / 2, y);
      dummy.scale.set(peakW, peakH, peakW);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [tiles, dummy]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, Math.max(1, tiles.length)]} castShadow>
      <coneGeometry args={[1, 1, 6]} />
      <meshToonMaterial color="#8A8478" />
    </instancedMesh>
  );
}

// ── Temple structures ─────────────────────────────────────────────────────
function TempleInstances({ tiles }: { tiles: Array<{ x: number; y: number }> }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null!);
  const roofRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    tiles.forEach(({ x, y }, i) => {
      const h = getTileHeight('temple');
      dummy.position.set(x, h + 0.2, y);
      dummy.scale.set(0.55, 0.4, 0.55);
      dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, h + 0.55, y);
      dummy.scale.set(0.45, 0.35, 0.45);
      dummy.updateMatrix();
      roofRef.current.setMatrixAt(i, dummy.matrix);
    });
    bodyRef.current.instanceMatrix.needsUpdate = true;
    roofRef.current.instanceMatrix.needsUpdate = true;
  }, [tiles, dummy]);

  return (
    <>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, Math.max(1, tiles.length)]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#B8A070" />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[undefined, undefined, Math.max(1, tiles.length)]} castShadow>
        <coneGeometry args={[1, 1, 4]} />
        <meshToonMaterial color="#A07840" />
      </instancedMesh>
    </>
  );
}

// ── Decorations ───────────────────────────────────────────────────────────
export function Decorations({ world }: { world: World }) {
  const groups = useMemo(() => {
    const map = new Map<string, Array<{ x: number; y: number }>>();
    const decorTypes = ['forest', 'grove', 'mountain', 'temple', 'shrine'];
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const tile = world.tiles[y]?.[x];
        if (!tile || !decorTypes.includes(tile.type)) continue;
        if (!map.has(tile.type)) map.set(tile.type, []);
        map.get(tile.type)!.push({ x, y });
      }
    }
    return map;
  }, [world]);

  return (
    <group>
      {(groups.get('forest')?.length ?? 0) > 0 && (
        <TreeInstances tiles={groups.get('forest')!} isGrove={false} />
      )}
      {(groups.get('grove')?.length ?? 0) > 0 && (
        <TreeInstances tiles={groups.get('grove')!} isGrove={true} />
      )}
      {(groups.get('mountain')?.length ?? 0) > 0 && (
        <MountainInstances tiles={groups.get('mountain')!} />
      )}
      {(groups.get('temple')?.length ?? 0) > 0 && (
        <TempleInstances tiles={groups.get('temple')!} />
      )}
    </group>
  );
}

// ── Sage 3D object ────────────────────────────────────────────────────────
export function SageObject({
  sage, isBound, showDialogue,
}: {
  sage: Sage;
  isBound: boolean;
  showDialogue: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const def = SAGE_DEFINITIONS.find(d => d.name === sage.name);
  const color = def?.color ?? '#D4AF6A';

  // Lerp position each frame
  useFrame(() => {
    if (!groupRef.current) return;
    const pos = groupRef.current.position;
    pos.x += (sage.x - pos.x) * 0.12;
    pos.z += (sage.y - pos.z) * 0.12;

    // Set y to tile height
    // We approximate — in full impl, look up world tile at sage position
    pos.y += (0 - pos.y) * 0.1;

    // Idle bob
    if (sage.state === 'meditating') {
      groupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.02;
    }

    // Face movement direction
    if (sage.state === 'walking') {
      const dx = sage.targetX - sage.x;
      const dz = sage.targetY - sage.y;
      if (Math.abs(dx) + Math.abs(dz) > 0.1) {
        groupRef.current.rotation.y = Math.atan2(dx, dz);
      }
    }
  });

  const isMediating = sage.state === 'meditating';

  return (
    <group ref={groupRef} position={[sage.x, 0, sage.y]}>
      {/* Meditation glow */}
      {isMediating && (
        <pointLight color={color} intensity={0.4} distance={3} decay={2} />
      )}

      {/* Robe body */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.20, 0.60, 8]} />
        <meshToonMaterial color={def?.robeColor ?? color} />
      </mesh>

      {/* Robe bottom flare */}
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.18, 8]} />
        <meshToonMaterial color={def?.robeColor ?? color} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.76, 0]} castShadow>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshToonMaterial color="#E8D0A8" />
      </mesh>

      {/* White beard for elder sages */}
      <mesh position={[0, 0.63, 0.06]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshToonMaterial color="#F0EDE8" />
      </mesh>

      {/* Bound sage indicator ring */}
      {isBound && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.30, 0.36, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Name label */}
      <Html position={[0, 1.1, 0]} center distanceFactor={12} zIndexRange={[10, 20]}>
        <div style={{
          color: color,
          fontSize: 11,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {sage.name}
        </div>
      </Html>

      {/* Dialogue bubble */}
      {showDialogue && sage.dialogue && (
        <Html position={[0, 1.35, 0]} center distanceFactor={10} zIndexRange={[30, 40]}>
          <div style={{
            background: 'rgba(246,243,237,0.97)',
            padding: '7px 11px',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            maxWidth: 160,
            color: '#1C2828',
            lineHeight: 1.4,
            boxShadow: '0 3px 12px rgba(0,0,0,0.5)',
            borderLeft: `2.5px solid ${color}`,
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            {sage.dialogue}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Camera rig ────────────────────────────────────────────────────────────
function CameraRig({
  targetX, targetZ, zoom,
}: {
  targetX: number;
  targetZ: number;
  zoom: number;
}) {
  const { camera } = useThree();
  const smoothPos = useRef({ x: targetX, z: targetZ });

  useFrame(() => {
    smoothPos.current.x += (targetX - smoothPos.current.x) * 0.08;
    smoothPos.current.z += (targetZ - smoothPos.current.z) * 0.08;

    const cx = smoothPos.current.x;
    const cz = smoothPos.current.z;
    const dist = 18 / zoom;
    const elevation = 13 / zoom;

    // Isometric-ish angle — matches Pokemon 3DS feel
    camera.position.set(cx + dist, elevation, cz + dist);
    camera.lookAt(cx, 0, cz);
  });

  return null;
}

// ── Day/night lighting ────────────────────────────────────────────────────
function DayNightLighting({ dayPhase }: { dayPhase: number }) {
  const dirRef = useRef<THREE.DirectionalLight>(null!);
  const ambRef = useRef<THREE.AmbientLight>(null!);

  useFrame(() => {
    if (!dirRef.current || !ambRef.current) return;
    const phase = dayPhase;

    // Day: warm gold. Dawn/dusk: orange-rose. Night: deep blue.
    let ambI = 0.4, dirI = 1.0;
    let dirColor = '#FFE8C0';

    if (phase < 0.18 || phase > 0.82) {
      // Night
      ambI = 0.08; dirI = 0.15;
      dirColor = '#8090C0';
      dirRef.current.position.set(-8, 5, -8);
    } else if (phase < 0.28) {
      // Dawn
      const t = (phase - 0.18) / 0.10;
      ambI = 0.08 + t * 0.35; dirI = 0.15 + t * 0.85;
      dirColor = '#FF9060';
      dirRef.current.position.set(-10 + t * 20, 5 + t * 15, -8 + t * 18);
    } else if (phase > 0.72) {
      // Dusk
      const t = (phase - 0.72) / 0.10;
      ambI = 0.43 - t * 0.35; dirI = 1.0 - t * 0.85;
      dirColor = '#FF7040';
      dirRef.current.position.set(10 - t * 18, 20 - t * 15, 10 - t * 18);
    } else {
      // Day
      dirRef.current.position.set(10, 20, 10);
    }

    dirRef.current.intensity = dirI;
    dirRef.current.color.set(dirColor);
    ambRef.current.intensity = ambI;
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.4} color="#FFF5E8" />
      <directionalLight
        ref={dirRef}
        position={[10, 20, 10]}
        intensity={1.0}
        color="#FFE8C0"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      {/* Night stars fill light */}
      <pointLight
        position={[20, 30, 20]}
        intensity={(dayPhase < 0.18 || dayPhase > 0.82) ? 0.15 : 0}
        color="#A0B0E0"
      />
    </>
  );
}

// ── Main exported scene ───────────────────────────────────────────────────
export function WorldScene({
  world,
  boundSageName,
  zoom = 1,
}: {
  world: World;
  boundSageName: string;
  zoom?: number;
}) {
  const bound = world.sages.find(s => s.name === boundSageName);
  const targetX = bound?.x ?? world.width / 2;
  const targetZ = bound?.y ?? world.height / 2;

  // Dialogue visibility — max 2 sages show bubbles
  const camX = bound?.x ?? targetX;
  const camZ = bound?.y ?? targetZ;
  let nearestName: string | null = null;
  let nearestDist = Infinity;
  for (const s of world.sages) {
    if (s.name === boundSageName || !s.dialogue) continue;
    const d = Math.abs(s.x - camX) + Math.abs(s.y - camZ);
    if (d < nearestDist && d < 7) { nearestDist = d; nearestName = s.name; }
  }

  return (
    <>
      {/* Lighting */}
      <DayNightLighting dayPhase={world.dayPhase} />

      {/* Sky — responds to day phase */}
      <Sky
        distance={450}
        sunPosition={[
          Math.cos(world.dayPhase * Math.PI * 2) * 10,
          Math.sin(world.dayPhase * Math.PI * 2) * 5,
          5,
        ]}
        turbidity={world.weather === 'rain' ? 12 : world.weather === 'mist' ? 8 : 4}
        rayleigh={world.weather === 'clear' ? 1.5 : 2.5}
      />

      {/* Atmospheric fog — thicker in mist weather */}
      <fog
        attach="fog"
        color={world.dayPhase < 0.18 || world.dayPhase > 0.82 ? '#0A0E1A' : '#C8D8E0'}
        near={world.weather === 'mist' ? 10 : 25}
        far={world.weather === 'mist' ? 30 : 65}
      />

      {/* Terrain */}
      <Terrain world={world} />

      {/* Decorations */}
      <Decorations world={world} />

      {/* Sages */}
      {world.sages.map((sage, i) => (
        <SageObject
          key={sage.name}
          sage={sage}
          isBound={sage.name === boundSageName}
          showDialogue={sage.name === boundSageName || sage.name === nearestName}
        />
      ))}

      {/* Camera */}
      <CameraRig targetX={targetX} targetZ={targetZ} zoom={zoom} />
    </>
  );
}
