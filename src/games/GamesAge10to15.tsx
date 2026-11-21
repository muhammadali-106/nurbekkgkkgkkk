import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Flag, RotateCcw } from 'lucide-react';
import { GameEngineProps } from '../types/platform';
import { soundFX } from '../utils/sound';
import { buildCompositeCar, createThreeEngine } from './ThreeDCore';

// ==========================================
// 21. 3D CHO‘L POYGASI (THREE.JS 3D RACING)
// ==========================================
export const Game3DCholPoygasi: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const steerRef = useRef(0);
  const [speedKmh, setSpeedKmh] = useState(110);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') steerRef.current = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') steerRef.current = 1;
    };
    const up = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
        steerRef.current = 0;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el || over) return;

    const engine = createThreeEngine(el, {
      skyColor: 0xfde68a,
      fogNear: 20,
      fogFar: 85,
      cameraPos: [0, 3.8, 7.2],
      fov: 58,
    });

    const desert = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 200),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 })
    );
    desert.rotation.x = -Math.PI / 2;
    desert.receiveShadow = true;
    engine.scene.add(desert);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 200),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.02;
    road.receiveShadow = true;
    engine.scene.add(road);

    const playerCar = buildCompositeCar(0x0d9488, 0xfacc15);
    playerCar.position.set(0, 0, 2);
    engine.scene.add(playerCar);

    // Canyon rocks on sides
    const rockGeo = new THREE.DodecahedronGeometry(1.6, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9 });
    const rocks: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const r = new THREE.Mesh(rockGeo, rockMat);
      const side = i % 2 === 0 ? -9 : 9;
      r.position.set(side + (Math.random() - 0.5) * 2, 1.1, -i * 10);
      engine.scene.add(r);
      rocks.push(r);
    }

    // Rival traffic cars
    const rivals: THREE.Group[] = [
      buildCompositeCar(0xef4444, 0xffffff),
      buildCompositeCar(0x2563eb, 0xfacc15),
      buildCompositeCar(0xf97316, 0x0f172a),
    ];
    rivals.forEach((rv, idx) => {
      rv.position.set((idx - 1) * 3.2, 0, -24 - idx * 18);
      engine.scene.add(rv);
    });

    // Turbo pad
    const turboPad = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.06, 3.2),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.8,
      })
    );
    turboPad.position.set(0, 0.04, -35);
    engine.scene.add(turboPad);

    let speed = 18;
    let turboTimer = 0;

    const stop = engine.startLoop((delta) => {
      speed = Math.min(34, speed + delta * 0.6);
      if (turboTimer > 0) turboTimer -= delta;
      const effSpeed = turboTimer > 0 ? speed * 1.45 : speed;
      setSpeedKmh(Math.round(effSpeed * 5.2));

      playerCar.position.x = THREE.MathUtils.clamp(
        playerCar.position.x + steerRef.current * delta * 8.5,
        -4.2,
        4.2
      );
      playerCar.rotation.z = -steerRef.current * 0.09;

      const targetFov = turboTimer > 0 ? 72 : 58;
      engine.camera.fov = THREE.MathUtils.damp(engine.camera.fov, targetFov, 5, delta);
      engine.camera.updateProjectionMatrix();
      engine.camera.position.x = THREE.MathUtils.damp(engine.camera.position.x, playerCar.position.x * 0.55, 6, delta);
      engine.camera.lookAt(playerCar.position.x * 0.4, 0.8, -6);

      rocks.forEach((rk) => {
        rk.position.z += effSpeed * delta;
        if (rk.position.z > 10) rk.position.z = -105;
      });

      turboPad.position.z += effSpeed * delta;
      if (
        Math.abs(turboPad.position.z - playerCar.position.z) < 2.1 &&
        Math.abs(turboPad.position.x - playerCar.position.x) < 1.6
      ) {
        if (turboTimer <= 0) soundFX.playPop(820);
        turboTimer = 2.2;
        scoreRef.current += 25;
      }
      if (turboPad.position.z > 10) {
        turboPad.position.z = -48 - Math.random() * 20;
        turboPad.position.x = (Math.floor(Math.random() * 3) - 1) * 3.1;
      }

      for (const rv of rivals) {
        rv.position.z += effSpeed * 0.85 * delta;
        if (
          Math.abs(rv.position.z - playerCar.position.z) < 2.4 &&
          Math.abs(rv.position.x - playerCar.position.x) < 1.45
        ) {
          soundFX.playError();
          setOver(true);
          onGameComplete(scoreRef.current);
          return;
        }
        if (rv.position.z > 10) {
          rv.position.z = -52 - Math.random() * 26;
          rv.position.x = (Math.floor(Math.random() * 3) - 1) * 3.2;
          scoreRef.current += 15;
          setScore(scoreRef.current);
          onScoreChange(scoreRef.current);
        }
      }
    });

    return () => {
      stop();
      engine.dispose();
    };
  }, [over, onGameComplete, onScoreChange]);

  return (
    <div className="p-4 bg-slate-950 text-white rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between mb-3">
        <span className="font-mono-tabular font-bold text-amber-400">
          Tezlik: {speedKmh} km/soat
        </span>
        <span className="font-mono-tabular font-bold text-teal-400">Ball: {score}</span>
      </div>

      {over ? (
        <div className="w-full max-w-2xl h-80 bg-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">To‘qnashuv!</h3>
          <p className="font-mono-tabular text-lg text-amber-400">Yakuniy ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              steerRef.current = 0;
              setScore(0);
              setOver(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-amber-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta poyga
          </button>
        </div>
      ) : (
        <>
          <div
            ref={mountRef}
            className="w-full max-w-2xl h-80 rounded-2xl overflow-hidden border border-slate-800"
          />
          <div className="flex gap-6 mt-4">
            <button
              type="button"
              onPointerDown={() => (steerRef.current = -1)}
              onPointerUp={() => (steerRef.current = 0)}
              onPointerLeave={() => (steerRef.current = 0)}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" /> Chapga
            </button>
            <button
              type="button"
              onPointerDown={() => (steerRef.current = 1)}
              onPointerUp={() => (steerRef.current = 0)}
              onPointerLeave={() => (steerRef.current = 0)}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
            >
              O‘ngga <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 22. 3D ILONCHA ARENASI (THREE.JS)
// ==========================================
export const Game3DIlonchaArenasi: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const dirRef = useRef<{ x: number; z: number }>({ x: 1, z: 0 });
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const scoreRef = useRef(0);

  const changeDir = useCallback((x: number, z: number) => {
    if (dirRef.current.x === -x && dirRef.current.z === -z) return;
    dirRef.current = { x, z };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') changeDir(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's') changeDir(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') changeDir(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') changeDir(1, 0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [changeDir]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el || over) return;

    const engine = createThreeEngine(el, {
      skyColor: 0x0f172a,
      cameraPos: [0, 14, 13],
      fov: 48,
    });
    engine.camera.lookAt(0, 0, 0);

    const gridSize = 14;
    const arena = new THREE.Mesh(
      new THREE.BoxGeometry(gridSize, 0.5, gridSize),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    arena.position.y = -0.25;
    arena.receiveShadow = true;
    engine.scene.add(arena);

    const gridHelper = new THREE.GridHelper(gridSize, gridSize, 0x0d9488, 0x334155);
    gridHelper.position.y = 0.02;
    engine.scene.add(gridHelper);

    const segGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.25, metalness: 0.4 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.35, metalness: 0.3 });

    const snakeCells: { x: number; z: number }[] = [
      { x: 0, z: 0 },
      { x: -1, z: 0 },
      { x: -2, z: 0 },
    ];
    const segMeshes: THREE.Mesh[] = snakeCells.map((cell, i) => {
      const m = new THREE.Mesh(segGeo, i === 0 ? headMat : bodyMat);
      m.position.set(cell.x, 0.45, cell.z);
      engine.scene.add(m);
      return m;
    });

    const food = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45, 0),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 0.6 })
    );
    let foodCell = { x: 3, z: -2 };
    food.position.set(foodCell.x, 0.55, foodCell.z);
    engine.scene.add(food);

    let accum = 0;
    const half = 6;

    const stop = engine.startLoop((delta) => {
      food.rotation.y += delta * 3;
      accum += delta;
      if (accum >= 0.16) {
        accum = 0;
        const nextHead = {
          x: snakeCells[0].x + dirRef.current.x,
          z: snakeCells[0].z + dirRef.current.z,
        };
        if (
          Math.abs(nextHead.x) > half ||
          Math.abs(nextHead.z) > half ||
          snakeCells.some((s) => s.x === nextHead.x && s.z === nextHead.z)
        ) {
          soundFX.playError();
          setOver(true);
          onGameComplete(scoreRef.current);
          return;
        }
        snakeCells.unshift(nextHead);
        if (nextHead.x === foodCell.x && nextHead.z === foodCell.z) {
          soundFX.playPop(700);
          scoreRef.current += 20;
          setScore(scoreRef.current);
          onScoreChange(scoreRef.current);
          const m = new THREE.Mesh(segGeo, bodyMat);
          engine.scene.add(m);
          segMeshes.push(m);
          foodCell = {
            x: Math.floor(Math.random() * 13) - 6,
            z: Math.floor(Math.random() * 13) - 6,
          };
          food.position.set(foodCell.x, 0.55, foodCell.z);
        } else {
          snakeCells.pop();
        }
        snakeCells.forEach((c, i) => {
          segMeshes[i].position.set(c.x, 0.45, c.z);
        });
      }
    });

    return () => {
      stop();
      engine.dispose();
    };
  }, [over, onGameComplete, onScoreChange]);

  return (
    <div className="p-4 bg-slate-950 text-white rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between mb-3">
        <span className="font-display font-bold">3D Arenada oltin kristallarni yig‘ing</span>
        <span className="font-mono-tabular font-bold text-teal-400">Ball: {score}</span>
      </div>
      {over ? (
        <div className="w-full max-w-2xl h-80 bg-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">O‘yin yakunlandi!</h3>
          <p className="font-mono-tabular text-lg text-teal-400">Ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              dirRef.current = { x: 1, z: 0 };
              setScore(0);
              setOver(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-teal-600 font-bold rounded-xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <>
          <div ref={mountRef} className="w-full max-w-2xl h-72 rounded-2xl overflow-hidden border border-slate-800" />
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div />
            <button type="button" onClick={() => changeDir(0, -1)} className="p-3 bg-slate-800 rounded-xl cursor-pointer"><ArrowUp className="w-5 h-5" /></button>
            <div />
            <button type="button" onClick={() => changeDir(-1, 0)} className="p-3 bg-slate-800 rounded-xl cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
            <button type="button" onClick={() => changeDir(0, 1)} className="p-3 bg-slate-800 rounded-xl cursor-pointer"><ArrowDown className="w-5 h-5" /></button>
            <button type="button" onClick={() => changeDir(1, 0)} className="p-3 bg-slate-800 rounded-xl cursor-pointer"><ArrowRight className="w-5 h-5" /></button>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 23. QAL’A HIMOYASI (TOWER DEFENSE)
// ==========================================
export const GameQalaHimoyasi: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gold, setGold] = useState(110);
  const [hp, setHp] = useState(10);
  const [score, setScore] = useState(0);
  const [towerType, setTowerType] = useState<'archer' | 'cannon'>('archer');
  const [over, setOver] = useState(false);

  const stateRef = useRef({
    gold: 110,
    hp: 10,
    score: 0,
    towerType: 'archer' as 'archer' | 'cannon',
    towers: [] as { x: number; y: number; type: 'archer' | 'cannon'; cd: number }[],
  });

  useEffect(() => {
    stateRef.current.towerType = towerType;
  }, [towerType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || over) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const waypoints = [
      { x: 0, y: 90 },
      { x: 460, y: 90 },
      { x: 460, y: 200 },
      { x: 140, y: 200 },
      { x: 140, y: 310 },
      { x: 640, y: 310 },
    ];
    const pads = [
      { x: 200, y: 40 },
      { x: 360, y: 145 },
      { x: 250, y: 255 },
      { x: 420, y: 255 },
      { x: 540, y: 145 },
    ];
    const enemies: { x: number; y: number; wp: number; hp: number; maxHp: number; speed: number }[] = [];
    const bullets: { x: number; y: number; tx: number; ty: number; dmg: number }[] = [];
    let tick = 0;
    let animId = 0;

    const onClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * canvas.width;
      const py = ((e.clientY - r.top) / r.height) * canvas.height;
      const pad = pads.find((p) => Math.hypot(p.x - px, p.y - py) < 28);
      if (!pad) return;
      if (stateRef.current.towers.some((t) => t.x === pad.x && t.y === pad.y)) return;
      const cost = stateRef.current.towerType === 'archer' ? 40 : 70;
      if (stateRef.current.gold < cost) {
        soundFX.playError();
        return;
      }
      soundFX.playPop(560);
      stateRef.current.gold -= cost;
      setGold(stateRef.current.gold);
      stateRef.current.towers.push({ x: pad.x, y: pad.y, type: stateRef.current.towerType, cd: 0 });
    };
    canvas.addEventListener('click', onClick);

    const loop = () => {
      tick += 1;
      if (tick % 95 === 0) {
        const hpScale = 3 + Math.floor(tick / 400);
        enemies.push({ x: 0, y: 90, wp: 1, hp: hpScale, maxHp: hpScale, speed: 1.35 });
      }

      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Path
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 36;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(waypoints[0].x, waypoints[0].y);
      waypoints.slice(1).forEach((w) => ctx.lineTo(w.x, w.y));
      ctx.stroke();

      // Pads
      pads.forEach((p) => {
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
        ctx.fill();
      });

      // Towers
      stateRef.current.towers.forEach((tw) => {
        ctx.fillStyle = tw.type === 'archer' ? '#0284c7' : '#b91c1c';
        ctx.beginPath();
        ctx.arc(tw.x, tw.y, 17, 0, Math.PI * 2);
        ctx.fill();
        if (tw.cd > 0) tw.cd -= 1;
        else {
          const target = enemies.find((en) => Math.hypot(en.x - tw.x, en.y - tw.y) < 155);
          if (target) {
            tw.cd = tw.type === 'archer' ? 28 : 48;
            bullets.push({
              x: tw.x,
              y: tw.y,
              tx: target.x,
              ty: target.y,
              dmg: tw.type === 'archer' ? 1 : 2.5,
            });
          }
        }
      });

      // Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const dx = b.tx - b.x;
        const dy = b.ty - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 10) {
          const hit = enemies.find((en) => Math.hypot(en.x - b.tx, en.y - b.ty) < 28);
          if (hit) hit.hp -= b.dmg;
          bullets.splice(i, 1);
          continue;
        }
        b.x += (dx / d) * 8;
        b.y += (dy / d) * 8;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        if (en.hp <= 0) {
          enemies.splice(i, 1);
          stateRef.current.gold += 15;
          stateRef.current.score += 20;
          setGold(stateRef.current.gold);
          setScore(stateRef.current.score);
          onScoreChange(stateRef.current.score);
          continue;
        }
        const target = waypoints[en.wp];
        const dx = target.x - en.x;
        const dy = target.y - en.y;
        const d = Math.hypot(dx, dy);
        if (d < 3) {
          en.wp += 1;
          if (en.wp >= waypoints.length) {
            enemies.splice(i, 1);
            stateRef.current.hp -= 1;
            setHp(stateRef.current.hp);
            soundFX.playError();
            if (stateRef.current.hp <= 0) {
              setOver(true);
              onGameComplete(stateRef.current.score);
              return;
            }
            continue;
          }
        } else {
          en.x += (dx / d) * en.speed;
          en.y += (dy / d) * en.speed;
        }

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(en.x, en.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', onClick);
    };
  }, [over, onGameComplete, onScoreChange]);

  return (
    <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTowerType('archer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              towerType === 'archer' ? 'bg-sky-600' : 'bg-slate-800'
            }`}
          >
            Kamonchi (40 oltin)
          </button>
          <button
            type="button"
            onClick={() => setTowerType('cannon')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              towerType === 'cannon' ? 'bg-rose-600' : 'bg-slate-800'
            }`}
          >
            To‘pchi (70 oltin)
          </button>
        </div>
        <span className="font-mono-tabular text-sm font-bold text-amber-300">
          Oltin: {gold} · Qal’a joni: {hp} · Ball: {score}
        </span>
      </div>

      {over ? (
        <div className="w-full max-w-2xl h-80 bg-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">Qal’a jangi yakunlandi!</h3>
          <p className="font-mono-tabular text-lg text-amber-300">Ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              stateRef.current = { gold: 110, hp: 10, score: 0, towerType: 'archer', towers: [] };
              setGold(110);
              setHp(10);
              setScore(0);
              setOver(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-teal-600 font-bold rounded-xl cursor-pointer"
          >
            Qayta himoya qilish
          </button>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full max-w-2xl rounded-2xl border border-slate-700 cursor-pointer"
        />
      )}
    </div>
  );
};

// ==========================================
// 24. KIBER BLOKLAR (TETRIS)
// ==========================================
const TETRO_SHAPES = [
  { shape: [[1, 1, 1, 1]], color: '#06b6d4' },
  { shape: [[1, 1], [1, 1]], color: '#eab308' },
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#8b5cf6' },
  { shape: [[1, 0, 0], [1, 1, 1]], color: '#2563eb' },
  { shape: [[0, 0, 1], [1, 1, 1]], color: '#f97316' },
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#10b981' },
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#ef4444' },
];

export const GameKiberBloklar: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const ROWS = 16;
  const COLS = 10;
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [piece, setPiece] = useState(() => {
    const t = TETRO_SHAPES[Math.floor(Math.random() * TETRO_SHAPES.length)];
    return { shape: t.shape, color: t.color, r: 0, c: 3 };
  });
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);

  const collides = useCallback(
    (shp: number[][], nr: number, nc: number, brd: (string | null)[][]) => {
      for (let r = 0; r < shp.length; r++) {
        for (let c = 0; c < shp[r].length; c++) {
          if (!shp[r][c]) continue;
          const tr = nr + r;
          const tc = nc + c;
          if (tc < 0 || tc >= COLS || tr >= ROWS) return true;
          if (tr >= 0 && brd[tr][tc]) return true;
        }
      }
      return false;
    },
    []
  );

  const lockAndSpawn = useCallback(
    (curPiece: typeof piece, curBoard: (string | null)[][]) => {
      const next = curBoard.map((row) => [...row]);
      curPiece.shape.forEach((row, r) =>
        row.forEach((v, c) => {
          if (v && curPiece.r + r >= 0) {
            next[curPiece.r + r][curPiece.c + c] = curPiece.color;
          }
        })
      );
      const remaining = next.filter((row) => row.some((cell) => cell === null));
      const cleared = ROWS - remaining.length;
      while (remaining.length < ROWS) remaining.unshift(Array(COLS).fill(null));
      if (cleared > 0) {
        soundFX.playSuccess();
        const pts = score + cleared * 50;
        setScore(pts);
        onScoreChange(pts);
      }
      setBoard(remaining);
      const t = TETRO_SHAPES[Math.floor(Math.random() * TETRO_SHAPES.length)];
      const spawn = { shape: t.shape, color: t.color, r: 0, c: 3 };
      if (collides(spawn.shape, spawn.r, spawn.c, remaining)) {
        soundFX.playError();
        setOver(true);
        onGameComplete(score + cleared * 50);
      } else {
        setPiece(spawn);
      }
    },
    [collides, onGameComplete, onScoreChange, score]
  );

  const movePiece = useCallback(
    (dr: number, dc: number) => {
      if (over) return;
      if (!collides(piece.shape, piece.r + dr, piece.c + dc, board)) {
        setPiece((p) => ({ ...p, r: p.r + dr, c: p.c + dc }));
      } else if (dr === 1) {
        lockAndSpawn(piece, board);
      }
    },
    [board, collides, lockAndSpawn, over, piece]
  );

  const rotatePiece = useCallback(() => {
    if (over) return;
    const rotated = piece.shape[0].map((_, idx) => piece.shape.map((row) => row[idx]).reverse());
    if (!collides(rotated, piece.r, piece.c, board)) {
      soundFX.playClick();
      setPiece((p) => ({ ...p, shape: rotated }));
    }
  }, [board, collides, over, piece]);

  useEffect(() => {
    if (over) return;
    const t = window.setInterval(() => movePiece(1, 0), 480);
    return () => clearInterval(t);
  }, [movePiece, over]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') movePiece(0, -1);
      if (e.key === 'ArrowRight') movePiece(0, 1);
      if (e.key === 'ArrowDown') movePiece(1, 0);
      if (e.key === 'ArrowUp') rotatePiece();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [movePiece, rotatePiece]);

  return (
    <div className="p-5 bg-slate-950 text-white rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-xs flex justify-between mb-3 font-mono-tabular font-bold">
        <span>Kiber Bloklar</span>
        <span className="text-cyan-400">Ball: {score}</span>
      </div>

      {over ? (
        <div className="py-12 text-center space-y-4">
          <h3 className="font-display text-2xl font-bold">O‘yin tugadi!</h3>
          <p className="font-mono-tabular text-cyan-400">Ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
              setScore(0);
              setOver(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-cyan-600 font-bold rounded-xl cursor-pointer"
          >
            Qayta boshlash
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-10 gap-0.5 p-2 bg-slate-900 border border-slate-800 rounded-xl">
            {board.map((row, r) =>
              row.map((cell, c) => {
                let color = cell;
                const pr = r - piece.r;
                const pc = c - piece.c;
                if (pr >= 0 && pr < piece.shape.length && pc >= 0 && pc < piece.shape[0].length && piece.shape[pr][pc]) {
                  color = piece.color;
                }
                return (
                  <div
                    key={`${r}-${c}`}
                    style={{ backgroundColor: color || '#0f172a' }}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-[3px]"
                  />
                );
              })
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => movePiece(0, -1)} className="px-4 py-2 bg-slate-800 rounded-lg cursor-pointer">◀</button>
            <button type="button" onClick={rotatePiece} className="px-4 py-2 bg-cyan-700 rounded-lg font-bold text-xs cursor-pointer">Aylantirish</button>
            <button type="button" onClick={() => movePiece(1, 0)} className="px-4 py-2 bg-slate-800 rounded-lg cursor-pointer">▼</button>
            <button type="button" onClick={() => movePiece(0, 1)} className="px-4 py-2 bg-slate-800 rounded-lg cursor-pointer">▶</button>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 25. REKORD ARKANOID (BRICK BREAKER)
// ==========================================
export const GameRekordArkanoid: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || over || won) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paddle = { x: 260, w: 110 };
    const ball = { x: 320, y: 260, vx: 3.6, vy: -3.8 };
    const bricks: { x: number; y: number; w: number; h: number; alive: boolean; color: string }[] = [];
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4'];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        bricks.push({ x: 24 + c * 75, y: 34 + r * 28, w: 66, h: 20, alive: true, color: colors[r] });
      }
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, px - paddle.w / 2));
    };
    canvas.addEventListener('pointermove', onMove);

    let animId = 0;
    const loop = () => {
      ball.x += ball.vx;
      ball.y += ball.vy;
      if (ball.x < 8 || ball.x > canvas.width - 8) ball.vx *= -1;
      if (ball.y < 8) ball.vy *= -1;

      if (ball.y > canvas.height - 28 && ball.y < canvas.height - 14 && ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
        soundFX.playClick();
        ball.vy = -Math.abs(ball.vy);
        ball.vx += (ball.x - (paddle.x + paddle.w / 2)) * 0.04;
      }

      if (ball.y > canvas.height + 15) {
        soundFX.playError();
        setOver(true);
        onGameComplete(scoreRef.current);
        return;
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;
      bricks.forEach((b) => {
        if (!b.alive) return;
        aliveCount += 1;
        if (ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
          b.alive = false;
          ball.vy *= -1;
          soundFX.playPop(600);
          scoreRef.current += 15;
          setScore(scoreRef.current);
          onScoreChange(scoreRef.current);
        } else {
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.w, b.h);
        }
      });

      if (aliveCount === 0) {
        setWon(true);
        soundFX.playVictory();
        onGameComplete(scoreRef.current + 100);
        return;
      }

      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(paddle.x, canvas.height - 24, paddle.w, 12);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointermove', onMove);
    };
  }, [over, won, onGameComplete, onScoreChange]);

  return (
    <div className="p-4 bg-slate-950 text-white rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between mb-3">
        <span className="font-display font-bold">Sichqoncha bilan platformani boshqaring</span>
        <span className="font-mono-tabular font-bold text-teal-400">Ball: {score}</span>
      </div>
      {over || won ? (
        <div className="w-full max-w-2xl h-80 bg-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">
            {won ? 'Barcha bloklar parchalandi!' : 'To‘p tushib ketdi!'}
          </h3>
          <p className="font-mono-tabular text-lg text-teal-400">Ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              setScore(0);
              setOver(false);
              setWon(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-teal-600 font-bold rounded-xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <canvas ref={canvasRef} width={640} height={360} className="w-full max-w-2xl rounded-2xl border border-slate-800 cursor-none touch-none" />
      )}
    </div>
  );
};

// ==========================================
// 26. MANTIQIY ZANJIR 2048
// ==========================================
export const Game2048: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const spawnTile = (g: number[][]) => {
    const empty: [number, number][] = [];
    g.forEach((row, r) => row.forEach((v, c) => v === 0 && empty.push([r, c])));
    if (empty.length === 0) return g;
    const [rr, cc] = empty[Math.floor(Math.random() * empty.length)];
    const copy = g.map((r) => [...r]);
    copy[rr][cc] = Math.random() < 0.85 ? 2 : 4;
    return copy;
  };

  const initGrid = useCallback(() => {
    let g = Array.from({ length: 4 }, () => Array(4).fill(0));
    g = spawnTile(g);
    g = spawnTile(g);
    return g;
  }, []);

  const [grid, setGrid] = useState<number[][]>(() => initGrid());
  const [score, setScore] = useState(0);

  const slideRow = (row: number[]) => {
    const arr = row.filter((v) => v !== 0);
    let gained = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        gained += arr[i];
        arr[i + 1] = 0;
      }
    }
    const merged = arr.filter((v) => v !== 0);
    while (merged.length < 4) merged.push(0);
    return { merged, gained };
  };

  const move = useCallback(
    (dir: 'L' | 'R' | 'U' | 'D') => {
      let g = grid.map((r) => [...r]);
      let totalGain = 0;

      const rotateCW = (m: number[][]) => m[0].map((_, i) => m.map((row) => row[i]).reverse());

      if (dir === 'R') g = g.map((r) => [...r].reverse());
      if (dir === 'U') g = rotateCW(rotateCW(rotateCW(g)));
      if (dir === 'D') g = rotateCW(g);

      const nextG = g.map((row) => {
        const res = slideRow(row);
        totalGain += res.gained;
        return res.merged;
      });

      let restored = nextG;
      if (dir === 'R') restored = nextG.map((r) => [...r].reverse());
      if (dir === 'U') restored = rotateCW(nextG);
      if (dir === 'D') restored = rotateCW(rotateCW(rotateCW(nextG)));

      const changed = JSON.stringify(restored) !== JSON.stringify(grid);
      if (changed) {
        soundFX.playClick();
        const withNew = spawnTile(restored);
        setGrid(withNew);
        const s = score + totalGain;
        setScore(s);
        onScoreChange(s);
        if (withNew.some((r) => r.includes(2048))) {
          soundFX.playVictory();
          onGameComplete(s);
        }
      }
    },
    [grid, onGameComplete, onScoreChange, score]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); move('L'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); move('R'); }
      if (e.key === 'ArrowUp') { e.preventDefault(); move('U'); }
      if (e.key === 'ArrowDown') { e.preventDefault(); move('D'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  const tileColor = (v: number) => {
    if (v === 0) return 'bg-slate-200 dark:bg-slate-800 text-transparent';
    if (v === 2) return 'bg-amber-100 text-slate-900';
    if (v === 4) return 'bg-amber-200 text-slate-900';
    if (v === 8) return 'bg-orange-400 text-white';
    if (v === 16) return 'bg-orange-500 text-white';
    if (v === 32) return 'bg-rose-500 text-white';
    if (v === 64) return 'bg-rose-600 text-white';
    return 'bg-teal-600 text-white';
  };

  return (
    <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-xs flex justify-between items-center mb-4">
        <span className="font-mono-tabular font-bold text-slate-900 dark:text-white">
          Ball: {score}
        </span>
        <button
          type="button"
          onClick={() => {
            onGameComplete(score);
            setGrid(initGrid());
            setScore(0);
            onScoreChange(0);
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-400 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Yangilash
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2.5 p-3 bg-slate-300 dark:bg-slate-950 rounded-2xl">
        {grid.flat().map((v, idx) => (
          <div
            key={idx}
            className={`w-16 h-16 rounded-xl flex items-center justify-center font-mono-tabular text-xl font-extrabold ${tileColor(v)}`}
          >
            {v || ''}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div />
        <button type="button" onClick={() => move('U')} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowUp className="w-5 h-5" /></button>
        <div />
        <button type="button" onClick={() => move('L')} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
        <button type="button" onClick={() => move('D')} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowDown className="w-5 h-5" /></button>
        <button type="button" onClick={() => move('R')} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowRight className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

// ==========================================
// 27. SO‘Z TOPISH MATRITSASI
// ==========================================
const WS_MATRIX = [
  ['B', 'U', 'X', 'O', 'R', 'O', 'K', 'T'],
  ['A', 'X', 'I', 'V', 'A', 'Q', 'I', 'O'],
  ['H', 'N', 'A', 'V', 'O', 'I', 'Y', 'S'],
  ['O', 'R', 'E', 'G', 'I', 'S', 'T', 'H'],
  ['R', 'Q', 'U', 'Y', 'O', 'S', 'H', 'K'],
  ['M', 'A', 'K', 'T', 'A', 'B', 'L', 'E'],
  ['P', 'A', 'X', 'T', 'A', 'Z', 'U', 'N'],
  ['K', 'I', 'T', 'O', 'B', 'M', 'A', 'T'],
];
const WS_TARGETS = ['BUXORO', 'XIVA', 'NAVOIY', 'QUYOSH', 'MAKTAB', 'KITOB'];

export const GameSozTopish: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());

  const toggleCell = (r: number, c: number) => {
    const key = `${r}-${c}`;
    soundFX.playClick();
    const next = selected.includes(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    setSelected(next);

    const word = next
      .map((k) => {
        const [rr, cc] = k.split('-').map(Number);
        return WS_MATRIX[rr][cc];
      })
      .join('');

    if (WS_TARGETS.includes(word) && !foundWords.includes(word)) {
      soundFX.playSuccess();
      const updatedWords = [...foundWords, word];
      setFoundWords(updatedWords);
      const nextFoundCells = new Set(foundCells);
      next.forEach((k) => nextFoundCells.add(k));
      setFoundCells(nextFoundCells);
      setSelected([]);
      const pts = updatedWords.length * 30;
      onScoreChange(pts);
      if (updatedWords.length === WS_TARGETS.length) {
        soundFX.playVictory();
        onGameComplete(pts + 50);
      }
    }
  };

  return (
    <div className="p-5 bg-emerald-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center">
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {WS_TARGETS.map((w) => (
          <span
            key={w}
            className={`px-3 py-1 rounded-lg text-xs font-bold ${
              foundWords.includes(w)
                ? 'bg-emerald-600 text-white line-through'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-8 gap-1.5">
        {WS_MATRIX.map((row, r) =>
          row.map((ch, c) => {
            const key = `${r}-${c}`;
            const isSel = selected.includes(key);
            const isFound = foundCells.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCell(r, c)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-display font-bold text-sm sm:text-base cursor-pointer transition-colors ${
                  isFound
                    ? 'bg-emerald-600 text-white'
                    : isSel
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                }`}
              >
                {ch}
              </button>
            );
          })
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setSelected([])}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          Tanlovni tozalash
        </button>
        {foundWords.length === WS_TARGETS.length && (
          <span className="font-display font-bold text-emerald-700 dark:text-emerald-400">
            Barcha so‘zlar topildi!
          </span>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 28. SAMOLYOT JANGCHISI (CANVAS SHOOTER)
// ==========================================
export const GameSamolyotJangchisi: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || over) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const jet = { x: 320, tx: 320 };
    const bullets: { x: number; y: number }[] = [];
    const drones: { x: number; y: number; speed: number }[] = [];
    let tick = 0;
    let animId = 0;

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      jet.tx = ((e.clientX - r.left) / r.width) * canvas.width;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);

    const loop = () => {
      tick += 1;
      jet.x += (jet.tx - jet.x) * 0.2;
      if (tick % 14 === 0) {
        bullets.push({ x: jet.x, y: 310 });
      }
      if (tick % 40 === 0) {
        drones.push({ x: 40 + Math.random() * (canvas.width - 80), y: -20, speed: 2.2 + Math.random() * 1.4 });
      }

      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Player Jet
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(jet.x, 305);
      ctx.lineTo(jet.x - 18, 340);
      ctx.lineTo(jet.x + 18, 340);
      ctx.closePath();
      ctx.fill();

      // Bullets
      ctx.fillStyle = '#facc15';
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= 8;
        ctx.fillRect(bullets[i].x - 2, bullets[i].y, 4, 12);
        if (bullets[i].y < -15) bullets.splice(i, 1);
      }

      // Drones
      for (let i = drones.length - 1; i >= 0; i--) {
        const d = drones[i];
        d.y += d.speed;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 14, 0, Math.PI * 2);
        ctx.fill();

        const bIdx = bullets.findIndex((b) => Math.hypot(b.x - d.x, b.y - d.y) < 18);
        if (bIdx !== -1) {
          bullets.splice(bIdx, 1);
          drones.splice(i, 1);
          soundFX.playPop(540);
          scoreRef.current += 15;
          setScore(scoreRef.current);
          onScoreChange(scoreRef.current);
          continue;
        }
        if (d.y > canvas.height + 10) {
          soundFX.playError();
          setOver(true);
          onGameComplete(scoreRef.current);
          return;
        }
      }

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
    };
  }, [over, onGameComplete, onScoreChange]);

  return (
    <div className="p-4 bg-sky-950 text-white rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between mb-3">
        <span className="font-display font-bold">Samolyotni boshqarib dronlarni to‘xtating</span>
        <span className="font-mono-tabular font-bold text-amber-300">Ball: {score}</span>
      </div>
      {over ? (
        <div className="w-full max-w-2xl h-80 bg-sky-900 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">Dron o‘tib ketdi!</h3>
          <p className="font-mono-tabular text-lg text-amber-300">Ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              setScore(0);
              setOver(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer"
          >
            Qayta uchish
          </button>
        </div>
      ) : (
        <canvas ref={canvasRef} width={640} height={360} className="w-full max-w-2xl rounded-2xl border border-sky-800 cursor-pointer touch-none" />
      )}
    </div>
  );
};

// ==========================================
// 29. TRAEKTORIYA USTASI (PHYSICS CANNON)
// ==========================================
export const GameTraektoriyaUstasi: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(65);
  const [targetX, setTargetX] = useState(460);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [msg, setMsg] = useState('Burchak va kuchni tanlab o‘q uzing!');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  const drawScene = useCallback(
    (ballPos?: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground & Wall
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 310, canvas.width, 50);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(260, 200, 24, 110);

      // Cannon
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.arc(50, 300, 18, 0, Math.PI * 2);
      ctx.fill();

      // Target
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(targetX, 294, 16, 0, Math.PI * 2);
      ctx.fill();

      if (ballPos) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(ballPos.x, ballPos.y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [targetX]
  );

  useEffect(() => {
    drawScene();
  }, [drawScene]);

  const fire = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    soundFX.playLaser();
    const rad = (angle * Math.PI) / 180;
    const speed = power * 0.16;
    let x = 50;
    let y = 296;
    let vx = Math.cos(rad) * speed;
    let vy = -Math.sin(rad) * speed;

    const step = () => {
      x += vx;
      y += vy;
      vy += 0.25;
      drawScene({ x, y });

      // Check wall hit
      if (x > 256 && x < 288 && y > 200) {
        soundFX.playError();
        setMsg('To‘siqqa urildi! Burchakni balandroq qiling.');
        return;
      }

      // Check target hit
      if (Math.hypot(x - targetX, y - 294) < 24) {
        soundFX.playSuccess();
        const s = score + 40;
        const nextShots = shots + 1;
        setScore(s);
        setShots(nextShots);
        onScoreChange(s);
        setMsg('Aniq zarba! Yangi nishon joylashtirildi.');
        setTargetX(340 + Math.floor(Math.random() * 230));
        if (nextShots >= 5) {
          soundFX.playVictory();
          onGameComplete(s);
        }
        return;
      }

      if (y > 310 || x > 640) {
        soundFX.playError();
        setMsg('O‘q nishonga yetmadi yoki o‘tib ketdi.');
        return;
      }

      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  };

  return (
    <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col items-center space-y-4">
      <div className="w-full max-w-2xl flex justify-between text-sm font-bold">
        <span>{msg}</span>
        <span className="font-mono-tabular text-amber-400">Nishon: {shots}/5 · Ball: {score}</span>
      </div>
      <canvas ref={canvasRef} width={640} height={360} className="w-full max-w-2xl rounded-2xl border border-slate-800" />
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <label className="text-xs font-semibold">
          Burchak: {angle}°
          <input type="range" min={15} max={80} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full accent-teal-500" />
        </label>
        <label className="text-xs font-semibold">
          Kuch: {power}%
          <input type="range" min={25} max={100} value={power} onChange={(e) => setPower(Number(e.target.value))} className="w-full accent-amber-500" />
        </label>
        <button
          type="button"
          onClick={fire}
          className="py-3 bg-teal-600 hover:bg-teal-700 font-display font-bold rounded-xl cursor-pointer"
        >
          Otish
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 30. MINA TOZALOVCHI PRO (MINESWEEPER)
// ==========================================
export const GameMinaTozalovchi: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const SIZE = 8;
  const MINES = 9;

  interface Cell {
    mine: boolean;
    open: boolean;
    flag: boolean;
    adj: number;
  }

  const createBoard = useCallback(() => {
    const b: Cell[][] = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => ({ mine: false, open: false, flag: false, adj: 0 }))
    );
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * SIZE);
      const c = Math.floor(Math.random() * SIZE);
      if (!b[r][c].mine) {
        b[r][c].mine = true;
        placed++;
      }
    }
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (b[r + dr]?.[c + dc]?.mine) count++;
          }
        }
        b[r][c].adj = count;
      }
    }
    return b;
  }, []);

  const [board, setBoard] = useState<Cell[][]>(() => createBoard());
  const [flagMode, setFlagMode] = useState(false);
  const [status, setStatus] = useState<'play' | 'lost' | 'won'>('play');

  const clickCell = (r: number, c: number) => {
    if (status !== 'play') return;
    const next = board.map((row) => row.map((cell) => ({ ...cell })));
    const target = next[r][c];

    if (flagMode) {
      if (!target.open) {
        soundFX.playClick();
        target.flag = !target.flag;
        setBoard(next);
      }
      return;
    }

    if (target.flag || target.open) return;

    if (target.mine) {
      soundFX.playError();
      next.forEach((row) => row.forEach((cl) => cl.mine && (cl.open = true)));
      setBoard(next);
      setStatus('lost');
      return;
    }

    const reveal = (rr: number, cc: number) => {
      const cl = next[rr]?.[cc];
      if (!cl || cl.open || cl.mine || cl.flag) return;
      cl.open = true;
      if (cl.adj === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            reveal(rr + dr, cc + dc);
          }
        }
      }
    };
    soundFX.playClick();
    reveal(r, c);
    setBoard(next);

    const openSafe = next.flat().filter((cl) => cl.open && !cl.mine).length;
    onScoreChange(openSafe * 3);
    if (openSafe === SIZE * SIZE - MINES) {
      setStatus('won');
      soundFX.playVictory();
      onGameComplete(openSafe * 3 + 50);
    }
  };

  return (
    <div className="p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setFlagMode((f) => !f)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            flagMode
              ? 'bg-rose-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
          }`}
        >
          <Flag className="w-3.5 h-3.5" /> {flagMode ? 'Bayroq rejimi: Yoqilgan' : 'Bayroq rejimi'}
        </button>

        <button
          type="button"
          onClick={() => {
            setBoard(createBoard());
            setStatus('play');
            onScoreChange(0);
          }}
          className="text-xs font-bold text-teal-700 dark:text-teal-400 cursor-pointer"
        >
          Qayta boshlash
        </button>
      </div>

      <div className="grid grid-cols-8 gap-1 bg-slate-300 dark:bg-slate-950 p-2 rounded-xl">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              type="button"
              onClick={() => clickCell(r, c)}
              className={`w-9 h-9 rounded-md font-mono font-bold text-sm flex items-center justify-center cursor-pointer ${
                cell.open
                  ? cell.mine
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'bg-slate-400 hover:bg-slate-500 dark:bg-slate-700 text-white'
              }`}
            >
              {cell.open
                ? cell.mine
                  ? '💣'
                  : cell.adj || ''
                : cell.flag
                ? '🚩'
                : ''}
            </button>
          ))
        )}
      </div>

      {status !== 'play' && (
        <p className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-white">
          {status === 'won' ? 'Tabriklaymiz! Barcha minalar topildi!' : 'Mina portladi! Qayta urinib ko‘ring.'}
        </p>
      )}
    </div>
  );
};
