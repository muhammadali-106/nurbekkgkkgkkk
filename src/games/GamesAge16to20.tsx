import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, ArrowRight, ArrowUp, Play, RotateCcw, Shield, Swords } from 'lucide-react';
import { GameEngineProps } from '../types/platform';
import { soundFX } from '../utils/sound';
import { buildCompositeExplorer, buildCompositeStarfighter, createThreeEngine } from './ThreeDCore';

// ==========================================
// 31. GRANDMASTER SHAXMAT (CHESS VS AI)
// ==========================================
type PieceColor = 'w' | 'b';
type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
interface ChessPiece {
  color: PieceColor;
  type: PieceType;
}

const PIECE_UNICODE: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};
const PIECE_VALUE: Record<PieceType, number> = {
  P: 10, N: 30, B: 30, R: 50, Q: 90, K: 900,
};

function createInitialChessBoard(): (ChessPiece | null)[][] {
  const back: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  const board: (ChessPiece | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = { color: 'b', type: back[c] };
    board[1][c] = { color: 'b', type: 'P' };
    board[6][c] = { color: 'w', type: 'P' };
    board[7][c] = { color: 'w', type: back[c] };
  }
  return board;
}

function getPseudoMoves(
  board: (ChessPiece | null)[][],
  r: number,
  c: number
): [number, number][] {
  const p = board[r][c];
  if (!p) return [];
  const moves: [number, number][] = [];
  const inBounds = (rr: number, cc: number) => rr >= 0 && rr < 8 && cc >= 0 && cc < 8;

  const slide = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc)) {
        const target = board[nr][nc];
        if (!target) {
          moves.push([nr, nc]);
        } else {
          if (target.color !== p.color) moves.push([nr, nc]);
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  };

  if (p.type === 'P') {
    const dir = p.color === 'w' ? -1 : 1;
    const startRow = p.color === 'w' ? 6 : 1;
    if (inBounds(r + dir, c) && !board[r + dir][c]) {
      moves.push([r + dir, c]);
      if (r === startRow && !board[r + dir * 2][c]) {
        moves.push([r + dir * 2, c]);
      }
    }
    for (const dc of [-1, 1]) {
      if (inBounds(r + dir, c + dc) && board[r + dir][c + dc]?.color === (p.color === 'w' ? 'b' : 'w')) {
        moves.push([r + dir, c + dc]);
      }
    }
  } else if (p.type === 'R') {
    slide([[1, 0], [-1, 0], [0, 1], [0, -1]]);
  } else if (p.type === 'B') {
    slide([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  } else if (p.type === 'Q') {
    slide([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
  } else if (p.type === 'N') {
    [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc]?.color !== p.color) moves.push([nr, nc]);
    });
  } else if (p.type === 'K') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc) && board[nr][nc]?.color !== p.color) moves.push([nr, nc]);
      }
    }
  }
  return moves;
}

export const GameGrandmasterShaxmat: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [board, setBoard] = useState<(ChessPiece | null)[][]>(() => createInitialChessBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('Sizning navbatingiz (Oq donalar)');
  const [winner, setWinner] = useState<PieceColor | null>(null);

  const applyMove = useCallback(
    (
      brd: (ChessPiece | null)[][],
      from: [number, number],
      to: [number, number]
    ) => {
      const next = brd.map((row) => [...row]);
      const piece = next[from[0]][from[1]]!;
      const captured = next[to[0]][to[1]];
      next[to[0]][to[1]] =
        piece.type === 'P' && (to[0] === 0 || to[0] === 7)
          ? { color: piece.color, type: 'Q' }
          : piece;
      next[from[0]][from[1]] = null;
      return { next, captured };
    },
    []
  );

  // Bot move
  useEffect(() => {
    if (turn !== 'b' || winner) return;
    const t = window.setTimeout(() => {
      const allMoves: { from: [number, number]; to: [number, number]; val: number }[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c]?.color === 'b') {
            getPseudoMoves(board, r, c).forEach(([tr, tc]) => {
              const target = board[tr][tc];
              const captureVal = target ? PIECE_VALUE[target.type] : 0;
              const centerBonus = (3.5 - Math.abs(3.5 - tc)) * 0.5;
              allMoves.push({ from: [r, c], to: [tr, tc], val: captureVal + centerBonus + Math.random() });
            });
          }
        }
      }
      if (allMoves.length === 0) {
        setWinner('w');
        setStatus('G‘alaba! Raqib yurish qila olmaydi.');
        soundFX.playVictory();
        onGameComplete(score + 200);
        return;
      }
      allMoves.sort((a, b) => b.val - a.val);
      const best = allMoves[0];
      const { next, captured } = applyMove(board, best.from, best.to);
      setBoard(next);
      soundFX.playClick();
      if (captured?.type === 'K') {
        setWinner('b');
        setStatus('Shohingiz mot bo‘ldi! Qayta urinib ko‘ring.');
        soundFX.playError();
        onGameComplete(score);
        return;
      }
      setTurn('w');
      setStatus('Sizning navbatingiz (Oq donalar)');
    }, 550);
    return () => clearTimeout(t);
  }, [applyMove, board, onGameComplete, score, turn, winner]);

  const handleCellClick = (r: number, c: number) => {
    if (turn !== 'w' || winner) return;
    const isValid = validMoves.some(([vr, vc]) => vr === r && vc === c);
    if (selected && isValid) {
      const { next, captured } = applyMove(board, selected, [r, c]);
      setBoard(next);
      setSelected(null);
      setValidMoves([]);
      let nextScore = score;
      if (captured) {
        soundFX.playPop(640);
        nextScore += PIECE_VALUE[captured.type];
        setScore(nextScore);
        onScoreChange(nextScore);
        if (captured.type === 'K') {
          setWinner('w');
          setStatus('Shoh va mot! Siz g‘alaba qozondingiz!');
          soundFX.playVictory();
          onGameComplete(nextScore + 200);
          return;
        }
      } else {
        soundFX.playClick();
      }
      setTurn('b');
      setStatus('Raqib o‘ylamoqda...');
      return;
    }

    const piece = board[r][c];
    if (piece?.color === 'w') {
      setSelected([r, c]);
      setValidMoves(getPseudoMoves(board, r, c));
    } else {
      setSelected(null);
      setValidMoves([]);
    }
  };

  return (
    <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-md flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-amber-300">{status}</span>
        <button
          type="button"
          onClick={() => {
            setBoard(createInitialChessBoard());
            setSelected(null);
            setValidMoves([]);
            setTurn('w');
            setScore(0);
            setWinner(null);
            setStatus('Sizning navbatingiz (Oq donalar)');
            onScoreChange(0);
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Yangi o‘yin
        </button>
      </div>

      <div className="grid grid-cols-8 border-4 border-amber-700 rounded-lg overflow-hidden">
        {board.map((row, r) =>
          row.map((piece, c) => {
            const dark = (r + c) % 2 === 1;
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const isMove = validMoves.some(([vr, vc]) => vr === r && vc === c);
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => handleCellClick(r, c)}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-2xl sm:text-3xl relative cursor-pointer ${
                  isSel
                    ? 'bg-teal-500'
                    : dark
                    ? 'bg-slate-700'
                    : 'bg-amber-100 text-slate-900'
                }`}
              >
                {piece ? (
                  <span className={piece.color === 'w' ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]' : 'text-slate-950'}>
                    {PIECE_UNICODE[piece.color + piece.type]}
                  </span>
                ) : null}
                {isMove && (
                  <span className="absolute w-3 h-3 rounded-full bg-teal-400/80 pointer-events-none" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// ==========================================
// 32. 3D FAZO KREYSERI (THREE.JS SPACE COMBAT)
// ==========================================
export const Game3DFazoKreyseri: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [shield, setShield] = useState(3);
  const [over, setOver] = useState(false);
  const scoreRef = useRef(0);
  const shieldRef = useRef(3);
  const fireFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        fireFnRef.current?.();
      }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
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
      skyColor: 0x030712,
      fogNear: 25,
      fogFar: 90,
      cameraPos: [0, 3.2, 8],
      fov: 60,
    });

    const ship = buildCompositeStarfighter();
    ship.position.set(0, 0, 2);
    engine.scene.add(ship);

    const laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8);
    laserGeo.rotateX(Math.PI / 2);
    const laserMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const lasers: THREE.Mesh[] = [];

    const enemyGeo = new THREE.IcosahedronGeometry(0.75, 0);
    const enemyMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.35,
      metalness: 0.6,
    });
    const enemies: THREE.Mesh[] = Array.from({ length: 6 }, (_, i) => {
      const m = new THREE.Mesh(enemyGeo, enemyMat);
      m.position.set((Math.random() - 0.5) * 11, (Math.random() - 0.5) * 4, -25 - i * 11);
      engine.scene.add(m);
      return m;
    });

    fireFnRef.current = () => {
      soundFX.playLaser();
      const l = new THREE.Mesh(laserGeo, laserMat);
      l.position.set(ship.position.x, ship.position.y + 0.4, ship.position.z - 1.2);
      engine.scene.add(l);
      lasers.push(l);
    };

    const stop = engine.startLoop((delta) => {
      let dx = 0, dy = 0;
      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) dx -= 1;
      if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) dx += 1;
      if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) dy += 1;
      if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) dy -= 1;

      ship.position.x = THREE.MathUtils.clamp(ship.position.x + dx * delta * 9, -5.5, 5.5);
      ship.position.y = THREE.MathUtils.clamp(ship.position.y + dy * delta * 7, -2.5, 3.2);
      ship.rotation.z = THREE.MathUtils.damp(ship.rotation.z, -dx * 0.38, 8, delta);
      engine.camera.lookAt(ship.position.x * 0.4, ship.position.y * 0.4, -10);

      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.position.z -= delta * 36;
        if (l.position.z < -65) {
          engine.scene.remove(l);
          lasers.splice(i, 1);
        }
      }

      for (const en of enemies) {
        en.position.z += delta * 13;
        en.rotation.x += delta * 2;
        en.rotation.y += delta * 1.6;

        const hitIdx = lasers.findIndex((l) => l.position.distanceTo(en.position) < 1.2);
        if (hitIdx !== -1) {
          soundFX.playPop(520);
          engine.scene.remove(lasers[hitIdx]);
          lasers.splice(hitIdx, 1);
          en.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 4, -55);
          scoreRef.current += 25;
          setScore(scoreRef.current);
          onScoreChange(scoreRef.current);
          continue;
        }

        if (en.position.distanceTo(ship.position) < 1.35) {
          soundFX.playError();
          en.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 4, -55);
          shieldRef.current -= 1;
          setShield(shieldRef.current);
          if (shieldRef.current <= 0) {
            setOver(true);
            onGameComplete(scoreRef.current);
            return;
          }
        }
        if (en.position.z > 8) {
          en.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 4, -55);
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
        <span className="font-mono-tabular font-bold text-sky-400">
          Qalqon: {'🛡️'.repeat(Math.max(0, shield))}
        </span>
        <span className="font-mono-tabular font-bold text-amber-300">Ball: {score}</span>
      </div>
      {over ? (
        <div className="w-full max-w-2xl h-80 bg-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">Kema qalqoni tugadi!</h3>
          <p className="font-mono-tabular text-lg text-sky-400">Ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              shieldRef.current = 3;
              setScore(0);
              setShield(3);
              setOver(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-sky-600 font-bold rounded-xl cursor-pointer"
          >
            Qayta jang
          </button>
        </div>
      ) : (
        <>
          <div ref={mountRef} className="w-full max-w-2xl h-72 rounded-2xl overflow-hidden border border-slate-800" />
          <div className="flex items-center gap-4 mt-4">
            <button type="button" onPointerDown={() => (keysRef.current['ArrowLeft'] = true)} onPointerUp={() => (keysRef.current['ArrowLeft'] = false)} onPointerLeave={() => (keysRef.current['ArrowLeft'] = false)} className="px-5 py-3 bg-slate-800 rounded-xl cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
            <button type="button" onClick={() => fireFnRef.current?.()} className="px-7 py-3 bg-sky-600 hover:bg-sky-700 font-display font-bold rounded-xl cursor-pointer">Lazer otish (Space)</button>
            <button type="button" onPointerDown={() => (keysRef.current['ArrowRight'] = true)} onPointerUp={() => (keysRef.current['ArrowRight'] = false)} onPointerLeave={() => (keysRef.current['ArrowRight'] = false)} className="px-5 py-3 bg-slate-800 rounded-xl cursor-pointer"><ArrowRight className="w-5 h-5" /></button>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 33. 3D FAZOVIY MANTIQ (3D VOXEL BUILDER)
// ==========================================
const VOXEL_BLUEPRINTS = [
  [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
  ],
  [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
];

export const Game3DFazoviyMantiq: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [lvl, setLvl] = useState(0);
  const [userGrid, setUserGrid] = useState<number[][]>([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const target = VOXEL_BLUEPRINTS[lvl];

  useEffect(() => {
    const el = mountRef.current;
    if (!el || done) return;
    const engine = createThreeEngine(el, {
      skyColor: 0xf1f5f9,
      cameraPos: [3.8, 3.6, 4.4],
      fov: 45,
    });

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.25, 3.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    base.position.y = -0.12;
    engine.scene.add(base);

    const group = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(0.88, 0.88, 0.88);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0d9488,
      roughness: 0.25,
      metalness: 0.35,
    });

    target.forEach((row, r) =>
      row.forEach((val, c) => {
        if (val === 1) {
          const m = new THREE.Mesh(boxGeo, mat);
          m.position.set((c - 1) * 1.0, 0.46, (r - 1) * 1.0);
          m.castShadow = true;
          group.add(m);
        }
      })
    );
    engine.scene.add(group);

    const stop = engine.startLoop((delta) => {
      group.rotation.y += delta * 0.7;
      base.rotation.y = group.rotation.y;
      engine.camera.lookAt(0, 0.4, 0);
    });

    return () => {
      stop();
      engine.dispose();
    };
  }, [done, target]);

  const toggleCell = (r: number, c: number) => {
    soundFX.playClick();
    const next = userGrid.map((row, ri) =>
      row.map((val, ci) => (ri === r && ci === c ? (val ? 0 : 1) : val))
    );
    setUserGrid(next);

    if (JSON.stringify(next) === JSON.stringify(target)) {
      soundFX.playSuccess();
      const s = score + 60;
      setScore(s);
      onScoreChange(s);
      if (lvl + 1 >= VOXEL_BLUEPRINTS.length) {
        setDone(true);
        soundFX.playVictory();
        onGameComplete(s);
      } else {
        setTimeout(() => {
          setLvl(lvl + 1);
          setUserGrid([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
        }, 650);
      }
    }
  };

  return (
    <div className="p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between mb-3 font-bold text-sm">
        <span className="text-slate-900 dark:text-white">
          Chizma {lvl + 1} / {VOXEL_BLUEPRINTS.length} — 3D namunani yuqoridan ko‘rinishda quring
        </span>
        <span className="font-mono-tabular text-teal-700 dark:text-teal-400">Ball: {score}</span>
      </div>

      {done ? (
        <div className="py-12 text-center space-y-4">
          <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Barcha 3D modellar qurildi!
          </h3>
          <button
            type="button"
            onClick={() => {
              setLvl(0);
              setScore(0);
              setDone(false);
              setUserGrid([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center w-full max-w-2xl">
          <div ref={mountRef} className="h-64 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700" />
          <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
              Kataklarni bosib kublarni joylashtiring:
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {userGrid.map((row, r) =>
                row.map((val, c) => (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => toggleCell(r, c)}
                    className={`w-16 h-16 rounded-xl border-2 font-bold cursor-pointer transition-colors ${
                      val
                        ? 'bg-teal-600 border-teal-700 text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {val ? 'KUB' : ''}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 34. STRATEGIK KARTA DUELLARI
// ==========================================
interface DuelCard {
  id: string;
  name: string;
  cost: number;
  dmg?: number;
  block?: number;
  heal?: number;
}
const DUEL_DECK: DuelCard[] = [
  { id: 'strike', name: 'Qilich Zarbasi', cost: 1, dmg: 8 },
  { id: 'shield', name: 'Temir Qalqon', cost: 1, block: 7 },
  { id: 'heavy', name: 'Ajdaho Zarbasi', cost: 2, dmg: 16 },
  { id: 'heal', name: 'Hayot Eliksiri', cost: 1, heal: 6 },
];

export const GameStrategikKartaDuellari: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [playerHp, setPlayerHp] = useState(40);
  const [playerBlock, setPlayerBlock] = useState(0);
  const [enemyHp, setEnemyHp] = useState(45);
  const [energy, setEnergy] = useState(3);
  const [log, setLog] = useState('Jang boshlandi! Kartalardan foydalaning.');
  const [over, setOver] = useState<'win' | 'lose' | null>(null);

  const playCard = (card: DuelCard) => {
    if (over || energy < card.cost) {
      soundFX.playError();
      return;
    }
    soundFX.playPop(580);
    setEnergy((e) => e - card.cost);
    if (card.dmg) {
      const nextE = Math.max(0, enemyHp - card.dmg);
      setEnemyHp(nextE);
      setLog(`Siz "${card.name}" bilan ${card.dmg} zarar yetkazdingiz!`);
      if (nextE <= 0) {
        setOver('win');
        soundFX.playVictory();
        onScoreChange(180);
        onGameComplete(180);
      }
    } else if (card.block) {
      setPlayerBlock((b) => b + card.block!);
      setLog(`+${card.block} himoya qalqoni qo‘shildi.`);
    } else if (card.heal) {
      setPlayerHp((h) => Math.min(40, h + card.heal!));
      setLog(`+${card.heal} jon tiklandi.`);
    }
  };

  const endTurn = () => {
    if (over) return;
    const enemyDmg = 7 + Math.floor(Math.random() * 6);
    const blocked = Math.min(playerBlock, enemyDmg);
    const netDmg = enemyDmg - blocked;
    const nextHp = Math.max(0, playerHp - netDmg);
    setPlayerHp(nextHp);
    setPlayerBlock(0);
    setEnergy(3);
    if (nextHp <= 0) {
      soundFX.playError();
      setOver('lose');
      onGameComplete(40);
    } else {
      soundFX.playClick();
      setLog(`Raqib ${enemyDmg} zarba berdi (${blocked} to‘sildi). Yangi yurish!`);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-800 rounded-xl border border-teal-500/40">
          <div className="text-xs text-teal-400 font-bold">Siz</div>
          <div className="font-mono-tabular text-2xl font-extrabold mt-1">
            Jon: {playerHp} / 40
          </div>
          <div className="text-xs text-sky-300 mt-1 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Qalqon: {playerBlock} · Energiya: {energy}/3
          </div>
        </div>
        <div className="p-4 bg-slate-800 rounded-xl border border-rose-500/40 text-right">
          <div className="text-xs text-rose-400 font-bold">Raqib Sarkarda</div>
          <div className="font-mono-tabular text-2xl font-extrabold mt-1">
            Jon: {enemyHp} / 45
          </div>
          <div className="text-xs text-amber-300 mt-1 flex items-center justify-end gap-1">
            <Swords className="w-3.5 h-3.5" /> Hujumga tayyor
          </div>
        </div>
      </div>

      <p className="text-center text-sm font-medium text-amber-300 bg-slate-950/60 py-2.5 rounded-xl">
        {log}
      </p>

      {over ? (
        <div className="text-center py-6 space-y-4">
          <h3 className="font-display text-3xl font-bold">
            {over === 'win' ? 'G‘alaba! Raqib mag‘lub etildi!' : 'Mag‘lubiyat! Qayta urinib ko‘ring.'}
          </h3>
          <button
            type="button"
            onClick={() => {
              setPlayerHp(40);
              setPlayerBlock(0);
              setEnemyHp(45);
              setEnergy(3);
              setOver(null);
              setLog('Yangi duel boshlandi!');
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-teal-600 font-bold rounded-xl cursor-pointer"
          >
            Qayta duel
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DUEL_DECK.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={energy < c.cost}
                onClick={() => playCard(c)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  energy >= c.cost
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-600'
                    : 'bg-slate-900 border-slate-800 opacity-40'
                }`}
              >
                <div className="text-xs font-mono text-amber-400 font-bold">
                  Energiya: {c.cost}
                </div>
                <div className="font-display font-bold mt-1">{c.name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {c.dmg ? `${c.dmg} zarar` : c.block ? `+${c.block} qalqon` : `+${c.heal} jon`}
                </div>
              </button>
            ))}
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={endTurn}
              className="px-8 py-3 bg-amber-600 hover:bg-amber-700 font-display font-bold rounded-xl cursor-pointer"
            >
              Yurishni tugatish
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 35. ALGORITMIK LABIRINT (ROBOT CODING)
// ==========================================
type Cmd = 'F' | 'L' | 'R';
const ALGO_MAP = [
  '......',
  '.##.#.',
  '....#.',
  '.#.##.',
  '.#...G',
  '......',
];

export const GameAlgoritmikLabirint: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [queue, setQueue] = useState<Cmd[]>([]);
  const [robot, setRobot] = useState({ r: 0, c: 0, dir: 1 }); // 0=N,1=E,2=S,3=W
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState('Robotni yashil nishonga (G) olib borish dasturini tuzing!');

  const dirVec = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];
  const dirArrow = ['▲', '▶', '▼', '◀'];

  const runProgram = () => {
    if (running || queue.length === 0) return;
    setRunning(true);
    let state = { r: 0, c: 0, dir: 1 };
    setRobot(state);
    let stepIdx = 0;

    const timer = window.setInterval(() => {
      if (stepIdx >= queue.length) {
        clearInterval(timer);
        setRunning(false);
        setMsg('Dastur tugadi, lekin robot manzilga yetmadi.');
        return;
      }
      const cmd = queue[stepIdx++];
      if (cmd === 'L') state = { ...state, dir: (state.dir + 3) % 4 };
      else if (cmd === 'R') state = { ...state, dir: (state.dir + 1) % 4 };
      else {
        const [dr, dc] = dirVec[state.dir];
        const nr = state.r + dr;
        const nc = state.c + dc;
        if (nr < 0 || nr >= 6 || nc < 0 || nc >= 6 || ALGO_MAP[nr][nc] === '#') {
          clearInterval(timer);
          setRunning(false);
          soundFX.playError();
          setMsg('Robot to‘siqqa urildi! Kodni tuzating.');
          return;
        }
        state = { ...state, r: nr, c: nc };
      }
      soundFX.playClick();
      setRobot(state);

      if (ALGO_MAP[state.r][state.c] === 'G') {
        clearInterval(timer);
        setRunning(false);
        soundFX.playVictory();
        const pts = Math.max(60, 220 - queue.length * 8);
        setMsg(`Algoritm muvaffaqiyatli! Ball: ${pts}`);
        onScoreChange(pts);
        onGameComplete(pts);
      }
    }, 280);
  };

  return (
    <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col items-center space-y-4">
      <p className="text-sm font-medium text-teal-300 text-center">{msg}</p>

      <div className="grid grid-cols-6 gap-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
        {ALGO_MAP.map((row, r) =>
          row.split('').map((ch, c) => {
            const isRob = robot.r === r && robot.c === c;
            return (
              <div
                key={`${r}-${c}`}
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                  ch === '#'
                    ? 'bg-rose-900/70 border border-rose-700'
                    : ch === 'G'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800'
                }`}
              >
                {isRob ? <span className="text-amber-300 text-xl">{dirArrow[robot.dir]}</span> : ch === 'G' ? '★' : ''}
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => setQueue((q) => [...q, 'F'])} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
          <ArrowUp className="w-3.5 h-3.5" /> Oldinga
        </button>
        <button type="button" onClick={() => setQueue((q) => [...q, 'L'])} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer">
          ↶ Chapga
        </button>
        <button type="button" onClick={() => setQueue((q) => [...q, 'R'])} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer">
          ↷ O‘ngga
        </button>
        <button type="button" onClick={() => { setQueue([]); setRobot({ r: 0, c: 0, dir: 1 }); }} className="px-3.5 py-2 bg-rose-900/60 hover:bg-rose-900 rounded-lg text-xs font-bold cursor-pointer">
          Tozalash
        </button>
        <button type="button" onClick={runProgram} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
          <Play className="w-3.5 h-3.5" /> Ishga tushirish
        </button>
      </div>

      <div className="w-full max-w-md min-h-[42px] p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap gap-1.5">
        {queue.length === 0 ? (
          <span className="text-xs text-slate-500">Buyruqlar navbati bo‘sh...</span>
        ) : (
          queue.map((cmd, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-teal-900 text-teal-200 text-xs font-mono font-bold">
              {cmd === 'F' ? 'Oldinga' : cmd === 'L' ? 'Chap' : 'O‘ng'}
            </span>
          ))
        )}
      </div>
    </div>
  );
};

// ==========================================
// 36. REAKSIYA & AIM ARENA
// ==========================================
export const GameReaksiyaAimArena: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [done, setDone] = useState(false);
  const hitsRef = useRef(0);

  useEffect(() => {
    if (done) return;
    const t = window.setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          clearInterval(t);
          setDone(true);
          soundFX.playVictory();
          onGameComplete(hitsRef.current * 15);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [done, onGameComplete]);

  const hitTarget = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (done) return;
    soundFX.playPop(720);
    hitsRef.current += 1;
    setHits(hitsRef.current);
    onScoreChange(hitsRef.current * 15);
    setTarget({ x: 10 + Math.random() * 80, y: 12 + Math.random() * 76 });
  };

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100;

  return (
    <div className="p-4 bg-slate-950 text-white rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between mb-3 font-mono-tabular text-sm font-bold">
        <span>Aniqlik: {accuracy}% · Urilgan: {hits}</span>
        <span className="text-rose-400">Vaqt: {timeLeft}s</span>
      </div>

      {done ? (
        <div className="w-full max-w-2xl h-80 bg-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">Natija: {hits * 15} ball</h3>
          <p className="text-slate-300 font-mono-tabular">
            Aniqlik: {accuracy}% ({hits} ta aniq zarba)
          </p>
          <button
            type="button"
            onClick={() => {
              hitsRef.current = 0;
              setHits(0);
              setMisses(0);
              setTimeLeft(25);
              setDone(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-rose-600 font-bold rounded-xl cursor-pointer"
          >
            Qayta sinash
          </button>
        </div>
      ) : (
        <div
          onClick={() => {
            soundFX.playError();
            setMisses((m) => m + 1);
          }}
          className="relative w-full max-w-2xl h-80 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-crosshair"
        >
          <button
            type="button"
            onClick={hitTarget}
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-rose-600 border-4 border-white shadow-md cursor-crosshair"
            aria-label="Nishon"
          />
        </div>
      )}
    </div>
  );
};

// ==========================================
// 37. SUDOKU MASTER (9x9)
// ==========================================
const SUDOKU_PUZZLE = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];
const SUDOKU_SOLUTION = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

export const GameSudokuMaster: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [grid, setGrid] = useState<number[][]>(() => SUDOKU_PUZZLE.map((r) => [...r]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [won, setWon] = useState(false);

  const placeNumber = (num: number) => {
    if (!selected || won || mistakes >= 3) return;
    const [r, c] = selected;
    if (SUDOKU_PUZZLE[r][c] !== 0) return;

    if (SUDOKU_SOLUTION[r][c] === num) {
      soundFX.playSuccess();
      const next = grid.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? num : v)));
      setGrid(next);
      const filled = next.flat().filter((v, idx) => v !== 0 && SUDOKU_PUZZLE.flat()[idx] === 0).length;
      onScoreChange(filled * 5);
      if (next.every((row, ri) => row.every((v, ci) => v === SUDOKU_SOLUTION[ri][ci]))) {
        setWon(true);
        soundFX.playVictory();
        onGameComplete(250 - mistakes * 30);
      }
    } else {
      soundFX.playError();
      setMistakes((m) => m + 1);
    }
  };

  return (
    <div className="p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-sm flex justify-between mb-3 text-sm font-bold">
        <span className="text-rose-600 dark:text-rose-400">Xatolar: {mistakes} / 3</span>
        <button
          type="button"
          onClick={() => {
            setGrid(SUDOKU_PUZZLE.map((r) => [...r]));
            setMistakes(0);
            setWon(false);
            onScoreChange(0);
          }}
          className="text-teal-700 dark:text-teal-400 cursor-pointer"
        >
          Qayta boshlash
        </button>
      </div>

      <div className="grid grid-cols-9 bg-slate-900 p-1 rounded-xl gap-0.5">
        {grid.map((row, r) =>
          row.map((val, c) => {
            const fixed = SUDOKU_PUZZLE[r][c] !== 0;
            const isSel = selected?.[0] === r && selected?.[1] === c;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => setSelected([r, c])}
                className={`w-8 h-8 sm:w-9 sm:h-9 font-mono font-bold text-sm flex items-center justify-center cursor-pointer ${
                  isSel
                    ? 'bg-teal-600 text-white'
                    : fixed
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300'
                }`}
              >
                {val || ''}
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => placeNumber(n)}
            className="w-9 h-9 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-mono font-bold cursor-pointer"
          >
            {n}
          </button>
        ))}
      </div>

      {(won || mistakes >= 3) && (
        <p className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">
          {won ? 'Tabriklaymiz! Sudoku yechildi!' : '3 ta xato bo‘ldi. Qayta boshlang.'}
        </p>
      )}
    </div>
  );
};

// ==========================================
// 38. IPAK YO‘LI HUKMDORI (KINGDOM SIM)
// ==========================================
const DECREES = [
  {
    text: 'Karvonsaroy savdogarlari soliqni kamaytirishni so‘ramoqda.',
    yesLabel: 'Soliqni kamaytirish',
    yes: { gold: -15, food: 10, pop: 15, trust: 15 },
    noLabel: 'Qat’iy undirish',
    no: { gold: 20, food: 0, pop: -5, trust: -15 },
  },
  {
    text: 'Yangi sug‘orish kanali qurish uchun katta mablag‘ kerak.',
    yesLabel: 'Kanal qurish',
    yes: { gold: -20, food: 25, pop: 10, trust: 10 },
    noLabel: 'Kechiktirish',
    no: { gold: 5, food: -15, pop: -5, trust: -10 },
  },
  {
    text: 'Qo‘shni shahar elchisi tinchlik va savdo bitimini taklif qildi.',
    yesLabel: 'Bitim tuzish',
    yes: { gold: 15, food: 10, pop: 5, trust: 15 },
    noLabel: 'Rad etish',
    no: { gold: -5, food: -5, pop: -10, trust: -10 },
  },
  {
    text: 'Olimlar rasadxona va kutubxona qurishga ruxsat so‘ramoqda.',
    yesLabel: 'Qo‘llab-quvvatlash',
    yes: { gold: -15, food: 0, pop: 10, trust: 20 },
    noLabel: 'Mablag‘ yo‘q',
    no: { gold: 10, food: 0, pop: -5, trust: -15 },
  },
];

export const GameIqtisodiyImperiya: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [year, setYear] = useState(1);
  const [stats, setStats] = useState({ gold: 55, food: 55, pop: 55, trust: 55 });
  const [over, setOver] = useState(false);

  const decree = DECREES[(year - 1) % DECREES.length];

  const choose = (delta: { gold: number; food: number; pop: number; trust: number }) => {
    if (over) return;
    const next = {
      gold: Math.max(0, Math.min(100, stats.gold + delta.gold)),
      food: Math.max(0, Math.min(100, stats.food + delta.food)),
      pop: Math.max(0, Math.min(100, stats.pop + delta.pop)),
      trust: Math.max(0, Math.min(100, stats.trust + delta.trust)),
    };
    setStats(next);
    const pts = year * 25;
    onScoreChange(pts);

    if (next.gold <= 0 || next.food <= 0 || next.pop <= 0 || next.trust <= 0 || year >= 10) {
      setOver(true);
      if (year >= 10) soundFX.playVictory();
      else soundFX.playError();
      onGameComplete(pts);
    } else {
      soundFX.playClick();
      setYear((y) => y + 1);
    }
  };

  return (
    <div className="p-6 bg-amber-50/70 dark:bg-slate-900 rounded-2xl space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Xazina', val: stats.gold },
          { label: 'Oziq-ovqat', val: stats.food },
          { label: 'Aholi', val: stats.pop },
          { label: 'Ishonch', val: stats.trust },
        ].map((m) => (
          <div key={m.label} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400">{m.label}</div>
            <div className="font-mono-tabular text-xl font-extrabold text-slate-900 dark:text-white">
              {m.val}%
            </div>
            <div className="mt-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-teal-600" style={{ width: `${m.val}%` }} />
            </div>
          </div>
        ))}
      </div>

      {over ? (
        <div className="text-center py-8 space-y-4 bg-white dark:bg-slate-800 rounded-2xl p-6">
          <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {year >= 10 ? '10 yillik buyuk hukmronlik yakunlandi!' : 'Saltanat muvozanati buzildi!'}
          </h3>
          <button
            type="button"
            onClick={() => {
              setYear(1);
              setStats({ gold: 55, food: 55, pop: 55, trust: 55 });
              setOver(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-amber-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Yangi saltanat
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-5">
          <div className="text-xs font-mono-tabular font-bold text-amber-700 dark:text-amber-400">
            Hukmronlik yili: {year} / 10
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {decree.text}
          </h3>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button type="button" onClick={() => choose(decree.yes)} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer">
              {decree.yesLabel}
            </button>
            <button type="button" onClick={() => choose(decree.no)} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl cursor-pointer">
              {decree.noLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 39. O‘ZBEKCHA SO‘Z KODI (WORDLE UZ)
// ==========================================
const UZ_5_WORDS = ['BAHOR', 'KITOB', 'VATAN', 'QALAM', 'PAXTA', 'OLTIN', 'OSMON', 'DUNYO', 'TARIX', 'BILIM'];

export const GameKriptografikKod: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [target, setTarget] = useState(() => UZ_5_WORDS[Math.floor(Math.random() * UZ_5_WORDS.length)]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [status, setStatus] = useState<'play' | 'win' | 'lose'>('play');

  const submitGuess = useCallback(() => {
    if (status !== 'play' || current.length !== 5) return;
    const next = [...guesses, current];
    setGuesses(next);
    setCurrent('');
    if (current === target) {
      soundFX.playVictory();
      setStatus('win');
      const pts = (7 - next.length) * 35;
      onScoreChange(pts);
      onGameComplete(pts);
    } else if (next.length >= 6) {
      soundFX.playError();
      setStatus('lose');
    } else {
      soundFX.playClick();
    }
  }, [current, guesses, onGameComplete, onScoreChange, status, target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (status !== 'play') return;
      if (e.key === 'Enter') submitGuess();
      else if (e.key === 'Backspace') setCurrent((c) => c.slice(0, -1));
      else if (/^[a-zA-Z]$/.test(e.key) && current.length < 5) {
        setCurrent((c) => c + e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current.length, status, submitGuess]);

  const getCellStyle = (guess: string, idx: number) => {
    const ch = guess[idx];
    if (target[idx] === ch) return 'bg-emerald-600 border-emerald-600 text-white';
    if (target.includes(ch)) return 'bg-amber-500 border-amber-500 text-white';
    return 'bg-slate-600 border-slate-600 text-white';
  };

  return (
    <div className="p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center space-y-4">
      <div className="grid gap-1.5">
        {Array.from({ length: 6 }).map((_, r) => {
          const word = r < guesses.length ? guesses[r] : r === guesses.length ? current : '';
          const submitted = r < guesses.length;
          return (
            <div key={r} className="flex gap-1.5">
              {Array.from({ length: 5 }).map((__, c) => (
                <div
                  key={c}
                  className={`w-11 h-11 rounded-lg border-2 flex items-center justify-center font-display text-xl font-extrabold ${
                    submitted
                      ? getCellStyle(word, c)
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                  }`}
                >
                  {word[c] || ''}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          maxLength={5}
          value={current}
          onChange={(e) => setCurrent(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
          placeholder="5 harfli so‘z"
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase w-40 text-center"
        />
        <button
          type="button"
          onClick={submitGuess}
          className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl cursor-pointer"
        >
          Tekshirish
        </button>
      </div>

      {status !== 'play' && (
        <div className="text-center space-y-2">
          <p className="font-display font-bold text-slate-900 dark:text-white">
            {status === 'win' ? 'Ajoyib! Yashirin so‘zni topdingiz!' : `Yashirin so‘z: ${target}`}
          </p>
          <button
            type="button"
            onClick={() => {
              setTarget(UZ_5_WORDS[Math.floor(Math.random() * UZ_5_WORDS.length)]);
              setGuesses([]);
              setCurrent('');
              setStatus('play');
            }}
            className="px-5 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Yangi so‘z
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 40. 3D PLATFORMER PARKUR (THREE.JS)
// ==========================================
export const Game3DPlatformerParkur: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const jumpReqRef = useRef(false);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'play' | 'win' | 'fall'>('play');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        jumpReqRef.current = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
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
    if (!el || state !== 'play') return;

    const engine = createThreeEngine(el, {
      skyColor: 0x0f172a,
      cameraPos: [0, 6, 9],
      fov: 55,
    });

    const hero = buildCompositeExplorer(0x14b8a6);
    hero.position.set(0, 0.5, 0);
    engine.scene.add(hero);

    const platforms = [
      { x: 0, y: 0, z: 0, w: 3.5, d: 3.5, moving: false },
      { x: 0, y: 0.4, z: -5.5, w: 2.8, d: 2.8, moving: false },
      { x: 2.2, y: 0.9, z: -10.5, w: 2.6, d: 2.6, moving: true },
      { x: -1.5, y: 1.4, z: -15.5, w: 2.6, d: 2.6, moving: false },
      { x: 0, y: 1.8, z: -21, w: 3.4, d: 3.4, moving: false },
    ];

    const platMeshes = platforms.map((p, idx) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(p.w, 0.5, p.d),
        new THREE.MeshStandardMaterial({
          color: idx === platforms.length - 1 ? 0xf59e0b : 0x334155,
          roughness: 0.4,
          metalness: 0.5,
        })
      );
      m.position.set(p.x, p.y - 0.25, p.z);
      m.receiveShadow = true;
      engine.scene.add(m);
      return m;
    });

    const portal = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.14, 14, 32),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 0.9 })
    );
    portal.position.set(0, 3.0, -21);
    engine.scene.add(portal);

    let vy = 0;
    let grounded = true;

    const stop = engine.startLoop((delta, elapsed) => {
      portal.rotation.y += delta * 2;
      platforms.forEach((p, idx) => {
        if (p.moving) {
          p.x = Math.sin(elapsed * 1.6) * 2.5;
          platMeshes[idx].position.x = p.x;
        }
      });

      let mx = 0, mz = 0;
      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) mx -= 1;
      if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) mx += 1;
      if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) mz -= 1;
      if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) mz += 1;

      hero.position.x += mx * delta * 6.2;
      hero.position.z += mz * delta * 6.2;

      if (jumpReqRef.current && grounded) {
        soundFX.playJump();
        vy = 8.4;
        grounded = false;
      }
      jumpReqRef.current = false;

      vy -= 19 * delta;
      hero.position.y += vy * delta;

      grounded = false;
      for (const p of platforms) {
        const insideX = Math.abs(hero.position.x - p.x) <= p.w * 0.52;
        const insideZ = Math.abs(hero.position.z - p.z) <= p.d * 0.52;
        if (insideX && insideZ && hero.position.y <= p.y + 0.15 && hero.position.y >= p.y - 0.6 && vy <= 0) {
          hero.position.y = p.y;
          vy = 0;
          grounded = true;
          break;
        }
      }

      const progressScore = Math.max(0, Math.round(-hero.position.z * 8));
      setScore(progressScore);
      onScoreChange(progressScore);

      if (hero.position.distanceTo(portal.position) < 1.5) {
        soundFX.playVictory();
        setState('win');
        onGameComplete(250);
        return;
      }

      if (hero.position.y < -5) {
        soundFX.playError();
        setState('fall');
        onGameComplete(progressScore);
        return;
      }

      engine.camera.position.x = THREE.MathUtils.damp(engine.camera.position.x, hero.position.x, 5, delta);
      engine.camera.position.y = THREE.MathUtils.damp(engine.camera.position.y, hero.position.y + 4.2, 5, delta);
      engine.camera.position.z = THREE.MathUtils.damp(engine.camera.position.z, hero.position.z + 7.5, 5, delta);
      engine.camera.lookAt(hero.position.x, hero.position.y + 0.8, hero.position.z - 2);
    });

    return () => {
      stop();
      engine.dispose();
    };
  }, [onGameComplete, onScoreChange, state]);

  return (
    <div className="p-4 bg-slate-950 text-white rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between mb-3">
        <span className="font-display font-bold">Oltin portalga sakrab yeting!</span>
        <span className="font-mono-tabular font-bold text-amber-300">Ball: {score}</span>
      </div>

      {state !== 'play' ? (
        <div className="w-full max-w-2xl h-80 bg-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">
            {state === 'win' ? 'Portal zabt etildi!' : 'Pastga tushib ketdingiz!'}
          </h3>
          <button
            type="button"
            onClick={() => {
              setScore(0);
              setState('play');
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-teal-600 font-bold rounded-xl cursor-pointer"
          >
            Qayta urinish
          </button>
        </div>
      ) : (
        <>
          <div ref={mountRef} className="w-full max-w-2xl h-72 rounded-2xl overflow-hidden border border-slate-800" />
          <div className="flex items-center gap-3 mt-4">
            <button type="button" onPointerDown={() => (keysRef.current['ArrowUp'] = true)} onPointerUp={() => (keysRef.current['ArrowUp'] = false)} onPointerLeave={() => (keysRef.current['ArrowUp'] = false)} className="px-5 py-3 bg-slate-800 rounded-xl font-bold text-sm cursor-pointer">Oldinga (W)</button>
            <button type="button" onClick={() => (jumpReqRef.current = true)} className="px-7 py-3 bg-amber-600 hover:bg-amber-700 rounded-xl font-bold text-sm cursor-pointer">Sakrash (Space)</button>
            <button type="button" onPointerDown={() => (keysRef.current['ArrowLeft'] = true)} onPointerUp={() => (keysRef.current['ArrowLeft'] = false)} onPointerLeave={() => (keysRef.current['ArrowLeft'] = false)} className="px-4 py-3 bg-slate-800 rounded-xl font-bold text-sm cursor-pointer">◀</button>
            <button type="button" onPointerDown={() => (keysRef.current['ArrowRight'] = true)} onPointerUp={() => (keysRef.current['ArrowRight'] = false)} onPointerLeave={() => (keysRef.current['ArrowRight'] = false)} className="px-4 py-3 bg-slate-800 rounded-xl font-bold text-sm cursor-pointer">▶</button>
          </div>
        </>
      )}
    </div>
  );
};
