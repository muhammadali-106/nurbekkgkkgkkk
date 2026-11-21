import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from 'lucide-react';
import { GameEngineProps } from '../types/platform';
import { soundFX } from '../utils/sound';
import { buildCompositeExplorer, createThreeEngine } from './ThreeDCore';

// ==========================================
// 11. OLTIN XAZINA OVCHISI (3D THREE.JS)
// ==========================================
export const GameOltinXazinaOvchisi: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const dpadRef = useRef({ x: 0, z: 0 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [done, setDone] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
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
    if (done) return;
    const t = window.setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          clearInterval(t);
          setDone(true);
          soundFX.playVictory();
          onGameComplete(scoreRef.current);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [done, onGameComplete]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el || done) return;

    const engine = createThreeEngine(el, {
      skyColor: 0xfef3c7,
      cameraPos: [0, 9, 11],
      fov: 50,
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({ color: 0xe7d3b0, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    engine.scene.add(floor);

    // Turquoise courtyard pillars
    const pillarGeo = new THREE.CylinderGeometry(0.45, 0.55, 3.2, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.45 });
    [
      [-7, -7],
      [7, -7],
      [-7, 7],
      [7, 7],
    ].forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(px, 1.6, pz);
      p.castShadow = true;
      engine.scene.add(p);
    });

    const hero = buildCompositeExplorer(0x0284c7);
    engine.scene.add(hero);

    const coinGeo = new THREE.OctahedronGeometry(0.48, 0);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
      metalness: 0.85,
      roughness: 0.2,
    });
    const coins: THREE.Mesh[] = Array.from({ length: 7 }, () => {
      const m = new THREE.Mesh(coinGeo, coinMat);
      m.position.set((Math.random() - 0.5) * 14, 0.7, (Math.random() - 0.5) * 14);
      m.castShadow = true;
      engine.scene.add(m);
      return m;
    });

    const stop = engine.startLoop((delta, elapsed) => {
      let vx = dpadRef.current.x;
      let vz = dpadRef.current.z;
      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) vx -= 1;
      if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) vx += 1;
      if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) vz -= 1;
      if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) vz += 1;

      if (vx !== 0 || vz !== 0) {
        const len = Math.hypot(vx, vz);
        vx /= len;
        vz /= len;
        hero.position.x = THREE.MathUtils.clamp(hero.position.x + vx * delta * 6.8, -9.5, 9.5);
        hero.position.z = THREE.MathUtils.clamp(hero.position.z + vz * delta * 6.8, -9.5, 9.5);
        hero.rotation.y = Math.atan2(vx, vz);
      }

      coins.forEach((c) => {
        c.rotation.y += delta * 2.8;
        c.position.y = 0.7 + Math.sin(elapsed * 3 + c.position.x) * 0.15;
        if (Math.hypot(c.position.x - hero.position.x, c.position.z - hero.position.z) < 1.15) {
          soundFX.playPop(720);
          scoreRef.current += 15;
          setScore(scoreRef.current);
          onScoreChange(scoreRef.current);
          c.position.x = (Math.random() - 0.5) * 15;
          c.position.z = (Math.random() - 0.5) * 15;
        }
      });

      engine.camera.position.x = THREE.MathUtils.damp(engine.camera.position.x, hero.position.x * 0.5, 5, delta);
      engine.camera.lookAt(hero.position.x * 0.6, 0.8, hero.position.z * 0.6);
    });

    return () => {
      stop();
      engine.dispose();
    };
  }, [done, onScoreChange]);

  return (
    <div className="flex flex-col items-center p-4 bg-amber-50 dark:bg-slate-900 rounded-2xl">
      <div className="w-full max-w-2xl flex items-center justify-between mb-3">
        <span className="font-display font-bold text-slate-900 dark:text-white">
          Oltin kristallarni yig‘ing!
        </span>
        <span className="font-mono-tabular font-bold text-amber-700 dark:text-amber-400">
          Vaqt: {timeLeft}s · Ball: {score}
        </span>
      </div>

      {done ? (
        <div className="w-full max-w-2xl h-72 bg-white dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Xazina ovlandi!
          </h3>
          <p className="font-mono-tabular text-lg font-bold text-teal-600 dark:text-teal-400">
            Natija: {score} ball
          </p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              setScore(0);
              setTimeLeft(40);
              setDone(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-amber-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <>
          <div
            ref={mountRef}
            className="w-full max-w-2xl h-72 rounded-2xl overflow-hidden border border-amber-200 dark:border-slate-700"
          />
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div />
            <button
              type="button"
              onPointerDown={() => (dpadRef.current.z = -1)}
              onPointerUp={() => (dpadRef.current.z = 0)}
              onPointerLeave={() => (dpadRef.current.z = 0)}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer"
              aria-label="Oldinga"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div />
            <button
              type="button"
              onPointerDown={() => (dpadRef.current.x = -1)}
              onPointerUp={() => (dpadRef.current.x = 0)}
              onPointerLeave={() => (dpadRef.current.x = 0)}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer"
              aria-label="Chapga"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onPointerDown={() => (dpadRef.current.z = 1)}
              onPointerUp={() => (dpadRef.current.z = 0)}
              onPointerLeave={() => (dpadRef.current.z = 0)}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer"
              aria-label="Orqaga"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              type="button"
              onPointerDown={() => (dpadRef.current.x = 1)}
              onPointerUp={() => (dpadRef.current.x = 0)}
              onPointerLeave={() => (dpadRef.current.x = 0)}
              className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer"
              aria-label="O‘ngga"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 12. MATEMATIK POYGA
// ==========================================
export const GameMatematikPoyga: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [playerPos, setPlayerPos] = useState(0);
  const [botPos, setBotPos] = useState(0);
  const [question, setQuestion] = useState({ text: '4 + 5 = ?', ans: 9, opts: [8, 9, 10, 11] });
  const [score, setScore] = useState(0);
  const [winner, setWinner] = useState<'player' | 'bot' | null>(null);

  const genQuestion = useCallback(() => {
    const type = Math.floor(Math.random() * 3);
    let a = 0, b = 0, ans = 0, op = '+';
    if (type === 0) {
      a = Math.floor(Math.random() * 18) + 3;
      b = Math.floor(Math.random() * 18) + 2;
      ans = a + b;
      op = '+';
    } else if (type === 1) {
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * 9) + 1;
      ans = a - b;
      op = '−';
    } else {
      a = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * 8) + 2;
      ans = a * b;
      op = '×';
    }
    const set = new Set<number>([ans]);
    while (set.size < 4) {
      const offset = Math.floor(Math.random() * 7) - 3;
      if (ans + offset > 0) set.add(ans + offset);
    }
    setQuestion({
      text: `${a} ${op} ${b} = ?`,
      ans,
      opts: Array.from(set).sort(() => Math.random() - 0.5),
    });
  }, []);

  useEffect(() => {
    genQuestion();
  }, [genQuestion]);

  useEffect(() => {
    if (winner) return;
    const t = window.setInterval(() => {
      setBotPos((p) => {
        const next = p + 3.2;
        if (next >= 100) {
          setWinner('bot');
          soundFX.playError();
          onGameComplete(score);
          return 100;
        }
        return next;
      });
    }, 650);
    return () => clearInterval(t);
  }, [winner, onGameComplete, score]);

  const handleAnswer = (val: number) => {
    if (winner) return;
    if (val === question.ans) {
      soundFX.playSuccess();
      const nextScore = score + 20;
      setScore(nextScore);
      onScoreChange(nextScore);
      setPlayerPos((p) => {
        const next = Math.min(100, p + 14);
        if (next >= 100) {
          setWinner('player');
          soundFX.playVictory();
          onGameComplete(nextScore + 50);
        }
        return next;
      });
      genQuestion();
    } else {
      soundFX.playError();
    }
  };

  const reset = () => {
    setPlayerPos(0);
    setBotPos(0);
    setScore(0);
    setWinner(null);
    onScoreChange(0);
    genQuestion();
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-6">
      {/* Track */}
      <div className="bg-slate-800 rounded-2xl p-5 space-y-4 border border-slate-700">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-teal-400">Sizning mashinangiz</span>
            <span className="font-mono-tabular">{Math.round(playerPos)}%</span>
          </div>
          <div className="h-8 bg-slate-950 rounded-xl relative overflow-hidden flex items-center px-2">
            <div
              className="h-5 bg-teal-500 rounded-lg transition-all duration-200 flex items-center justify-end pr-2 text-xs font-bold"
              style={{ width: `${Math.max(10, playerPos)}%` }}
            >
              🏎️
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-amber-400">Raqib robot</span>
            <span className="font-mono-tabular">{Math.round(botPos)}%</span>
          </div>
          <div className="h-8 bg-slate-950 rounded-xl relative overflow-hidden flex items-center px-2">
            <div
              className="h-5 bg-amber-500 rounded-lg transition-all duration-200 flex items-center justify-end pr-2 text-xs font-bold"
              style={{ width: `${Math.max(10, botPos)}%` }}
            >
              🚙
            </div>
          </div>
        </div>
      </div>

      {winner ? (
        <div className="text-center py-6 space-y-4">
          <h3 className="font-display text-3xl font-extrabold">
            {winner === 'player' ? 'G‘alaba! Siz finishga birinchi keldingiz!' : 'Raqib o‘zib ketdi!'}
          </h3>
          <p className="font-mono-tabular text-teal-400 text-lg font-bold">
            Ball: {winner === 'player' ? score + 50 : score}
          </p>
          <button
            type="button"
            onClick={reset}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta poyga
          </button>
        </div>
      ) : (
        <div className="text-center space-y-5">
          <div className="font-mono-tabular text-4xl sm:text-5xl font-extrabold text-amber-300">
            {question.text}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {question.opts.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => handleAnswer(o)}
                className="py-4 bg-slate-800 hover:bg-teal-600 border border-slate-700 rounded-xl font-mono-tabular text-2xl font-bold transition-colors cursor-pointer"
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 13. XOTIRA SAROYI
// ==========================================
const MEMORY_ICONS = ['🏺', '🍉', '🐪', '🕌', '🎸', '🍇', '🌙', '🦚'];

export const GameXotiraSaroyi: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [cards, setCards] = useState<{ id: number; symbol: string; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const init = useCallback(() => {
    const deck = [...MEMORY_ICONS, ...MEMORY_ICONS]
      .sort(() => Math.random() - 0.5)
      .map((symbol, id) => ({ id, symbol, matched: false }));
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    setWon(false);
    onScoreChange(0);
  }, [onScoreChange]);

  useEffect(() => {
    init();
  }, [init]);

  const handleFlip = (idx: number) => {
    if (won || flipped.length === 2 || flipped.includes(idx) || cards[idx].matched) return;
    soundFX.playClick();
    const nextFlipped = [...flipped, idx];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const [a, b] = nextFlipped;
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      if (cards[a].symbol === cards[b].symbol) {
        soundFX.playSuccess();
        const updated = cards.map((c, i) =>
          i === a || i === b ? { ...c, matched: true } : c
        );
        setCards(updated);
        setFlipped([]);
        const matchedCount = updated.filter((c) => c.matched).length;
        const pts = matchedCount * 10;
        onScoreChange(pts);
        if (matchedCount === updated.length) {
          const bonus = Math.max(40, 220 - nextMoves * 5);
          setWon(true);
          soundFX.playVictory();
          onScoreChange(bonus);
          onGameComplete(bonus);
        }
      } else {
        setTimeout(() => setFlipped([]), 650);
      }
    }
  };

  return (
    <div className="p-6 bg-teal-50/70 dark:bg-slate-900 rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <span className="font-mono-tabular text-sm font-bold text-slate-700 dark:text-slate-300">
          Urinishlar: {moves}
        </span>
        <button
          type="button"
          onClick={init}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Qayta boshlash
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 w-full max-w-md">
        {cards.map((c, idx) => {
          const open = flipped.includes(idx) || c.matched;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleFlip(idx)}
              className={`h-20 rounded-xl border-2 text-3xl flex items-center justify-center transition-all cursor-pointer ${
                c.matched
                  ? 'bg-emerald-100 border-emerald-500 dark:bg-emerald-950/60'
                  : open
                  ? 'bg-white border-teal-500 dark:bg-slate-800'
                  : 'bg-teal-700 hover:bg-teal-600 border-teal-800 text-teal-200'
              }`}
            >
              {open ? c.symbol : '?'}
            </button>
          );
        })}
      </div>

      {won && (
        <div className="mt-5 text-center space-y-3">
          <p className="font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            Xotira saroyi zabt etildi! ({moves} urinish)
          </p>
          <button
            type="button"
            onClick={init}
            className="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Yana o‘ynash
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 14. SO‘Z ZANJIRI
// ==========================================
const UZ_WORDS_EASY = [
  { word: 'QUYOSH', hint: 'Osmonimizni yoritadigan issiq yulduz' },
  { word: 'KITOB', hint: 'Bilim manbai, o‘qish uchun do‘st' },
  { word: 'BAHOR', hint: 'Gullash va Navro‘z fasli' },
  { word: 'VATAN', hint: 'Tug‘ilib o‘sgan ona yurtimiz' },
  { word: 'DARAXT', hint: 'Shoxlari va yashil barglari bor o‘simlik' },
  { word: 'MARS', hint: 'Qizil sayyora nomi' },
];

export const GameSozZanjiri: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [idx, setIdx] = useState(0);
  const [pool, setPool] = useState<{ ch: string; used: boolean }[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  const loadWord = useCallback((i: number) => {
    const w = UZ_WORDS_EASY[i].word;
    const chars = w.split('').sort(() => Math.random() - 0.5).map((ch) => ({ ch, used: false }));
    setPool(chars);
    setPicked([]);
    setMsg('');
  }, []);

  useEffect(() => {
    loadWord(0);
  }, [loadWord]);

  const currentItem = UZ_WORDS_EASY[idx];

  const handlePickChar = (charIdx: number) => {
    if (done || pool[charIdx].used) return;
    soundFX.playClick();
    const nextPool = pool.map((p, i) => (i === charIdx ? { ...p, used: true } : p));
    const nextPicked = [...picked, charIdx];
    setPool(nextPool);
    setPicked(nextPicked);

    const formed = nextPicked.map((pi) => nextPool[pi].ch).join('');
    if (formed.length === currentItem.word.length) {
      if (formed === currentItem.word) {
        soundFX.playSuccess();
        const s = score + 25;
        setScore(s);
        onScoreChange(s);
        setMsg('Barakalla! To‘g‘ri topdingiz!');
        if (idx + 1 >= UZ_WORDS_EASY.length) {
          setTimeout(() => {
            setDone(true);
            soundFX.playVictory();
            onGameComplete(s);
          }, 700);
        } else {
          setTimeout(() => {
            setIdx(idx + 1);
            loadWord(idx + 1);
          }, 800);
        }
      } else {
        soundFX.playError();
        setMsg('Xato tartib! Qaytadan terib ko‘ring.');
        setTimeout(() => loadWord(idx), 650);
      }
    }
  };

  return (
    <div className="p-6 bg-emerald-50/70 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center min-h-[400px]">
      {done ? (
        <div className="text-center space-y-4">
          <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Barcha so‘zlar tuzildi!
          </h3>
          <p className="font-mono-tabular text-lg font-bold text-emerald-700 dark:text-emerald-400">
            Ball: {score}
          </p>
          <button
            type="button"
            onClick={() => {
              setIdx(0);
              setScore(0);
              setDone(false);
              onScoreChange(0);
              loadWord(0);
            }}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <>
          <div className="text-xs font-mono-tabular font-semibold text-emerald-700 dark:text-emerald-400">
            So‘z {idx + 1} / {UZ_WORDS_EASY.length}
          </div>
          <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white text-center">
            {currentItem.hint}
          </h3>

          <div className="flex gap-2 my-6">
            {currentItem.word.split('').map((_, slotIdx) => {
              const ch = picked[slotIdx] !== undefined ? pool[picked[slotIdx]].ch : '';
              return (
                <div
                  key={slotIdx}
                  className="w-12 h-14 rounded-xl border-2 border-emerald-500 bg-white dark:bg-slate-800 flex items-center justify-center font-display text-2xl font-extrabold text-slate-900 dark:text-white"
                >
                  {ch}
                </div>
              );
            })}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 min-h-[20px] mb-4">
            {msg || 'Harflarni ketma-ket bosing'}
          </p>

          <div className="flex flex-wrap justify-center gap-2.5">
            {pool.map((item, i) => (
              <button
                key={i}
                type="button"
                disabled={item.used}
                onClick={() => handlePickChar(i)}
                className={`w-12 h-12 rounded-xl font-display text-xl font-bold transition-all cursor-pointer ${
                  item.used
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-40'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                }`}
              >
                {item.ch}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 15. KOSMIK QUTQARUV (CANVAS)
// ==========================================
export const GameKosmikQutqaruv: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameOver) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ship = { x: 90, y: 180, ty: 180 };
    const items = Array.from({ length: 6 }, (_, i) => ({
      x: 680 + i * 130,
      y: 40 + Math.random() * 280,
      isCrystal: i % 2 === 0,
      speed: 3.4 + Math.random() * 1.6,
    }));
    let animId = 0;

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ship.ty = ((e.clientY - r.top) / r.height) * canvas.height;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') ship.ty = Math.max(30, ship.ty - 32);
      if (e.key === 'ArrowDown' || e.key === 's') ship.ty = Math.min(330, ship.ty + 32);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);
    window.addEventListener('keydown', onKey);

    const loop = () => {
      ship.y += (ship.ty - ship.y) * 0.16;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = '#94a3b8';
      for (let i = 0; i < 20; i++) {
        ctx.fillRect((i * 73 + Date.now() * 0.05) % canvas.width, (i * 47) % canvas.height, 2, 2);
      }

      // Ship
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(ship.x + 22, ship.y);
      ctx.lineTo(ship.x - 16, ship.y - 14);
      ctx.lineTo(ship.x - 10, ship.y);
      ctx.lineTo(ship.x - 16, ship.y + 14);
      ctx.closePath();
      ctx.fill();

      for (const it of items) {
        it.x -= it.speed;
        if (it.x < -30) {
          it.x = canvas.width + 40;
          it.y = 35 + Math.random() * 290;
          it.speed = Math.min(6.5, it.speed + 0.08);
        }

        if (it.isCrystal) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(it.x, it.y, 12, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(it.x, it.y, 16, 0, Math.PI * 2);
          ctx.fill();
        }

        if (Math.hypot(ship.x - it.x, ship.y - it.y) < 28) {
          if (it.isCrystal) {
            soundFX.playPop(740);
            scoreRef.current += 15;
            setScore(scoreRef.current);
            onScoreChange(scoreRef.current);
            it.x = canvas.width + 50;
            it.y = 35 + Math.random() * 290;
          } else {
            soundFX.playError();
            setGameOver(true);
            onGameComplete(scoreRef.current);
            return;
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [gameOver, onGameComplete, onScoreChange]);

  return (
    <div className="p-4 bg-slate-950 rounded-2xl text-white flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between mb-3">
        <span className="font-display font-bold">Sariq kristallarni yig‘ing, qizil meteorlardan qoching!</span>
        <span className="font-mono-tabular font-bold text-sky-400">Ball: {score}</span>
      </div>
      {gameOver ? (
        <div className="w-full max-w-2xl h-80 bg-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">Kema shikastlandi!</h3>
          <p className="font-mono-tabular text-lg text-sky-400">Ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              setScore(0);
              setGameOver(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-sky-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta uchish
          </button>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full max-w-2xl rounded-2xl border border-slate-800 cursor-pointer touch-none"
        />
      )}
    </div>
  );
};

// ==========================================
// 16. O‘RMON LABIRINTI
// ==========================================
const MAZES = [
  [
    '########',
    '#P..#..#',
    '#.#.#.##',
    '#.#...K#',
    '#.####.#',
    '#......#',
    '#####.E#',
    '########',
  ],
  [
    '#########',
    '#P..#...#',
    '###.#.#.#',
    '#...#.#K#',
    '#.###.###',
    '#.......#',
    '#.#####.#',
    '#......E#',
    '#########',
  ],
];

export const GameOrmonLabirinti: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [lvl, setLvl] = useState(0);
  const [pos, setPos] = useState({ r: 1, c: 1 });
  const [hasKey, setHasKey] = useState(false);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  const grid = MAZES[lvl];

  const loadLevel = useCallback((l: number) => {
    const g = MAZES[l];
    for (let r = 0; r < g.length; r++) {
      for (let c = 0; c < g[r].length; c++) {
        if (g[r][c] === 'P') setPos({ r, c });
      }
    }
    setHasKey(false);
  }, []);

  useEffect(() => {
    loadLevel(0);
  }, [loadLevel]);

  const move = useCallback(
    (dr: number, dc: number) => {
      if (won) return;
      const nr = pos.r + dr;
      const nc = pos.c + dc;
      const cell = grid[nr]?.[nc];
      if (!cell || cell === '#') {
        soundFX.playError();
        return;
      }
      soundFX.playClick();
      setPos({ r: nr, c: nc });
      if (cell === 'K' && !hasKey) {
        setHasKey(true);
        soundFX.playSuccess();
      }
      if (cell === 'E') {
        if (hasKey) {
          const nextScore = score + 60;
          setScore(nextScore);
          onScoreChange(nextScore);
          if (lvl + 1 >= MAZES.length) {
            setWon(true);
            soundFX.playVictory();
            onGameComplete(nextScore);
          } else {
            soundFX.playSuccess();
            const nextL = lvl + 1;
            setLvl(nextL);
            loadLevel(nextL);
          }
        } else {
          soundFX.playError();
        }
      }
    },
    [grid, hasKey, loadLevel, lvl, onGameComplete, onScoreChange, pos, score, won]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') move(-1, 0);
      if (e.key === 'ArrowDown' || e.key === 's') move(1, 0);
      if (e.key === 'ArrowLeft' || e.key === 'a') move(0, -1);
      if (e.key === 'ArrowRight' || e.key === 'd') move(0, 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  return (
    <div className="p-6 bg-emerald-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between mb-3 text-sm font-bold">
        <span className="text-emerald-800 dark:text-emerald-300">
          Bosqich {lvl + 1} / {MAZES.length} · Kalit: {hasKey ? 'Topildi 🔑' : 'Kerak 🔒'}
        </span>
        <span className="font-mono-tabular text-slate-700 dark:text-slate-300">Ball: {score}</span>
      </div>

      {won ? (
        <div className="py-10 text-center space-y-4">
          <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Labirintdan chiqdingiz!
          </h3>
          <button
            type="button"
            onClick={() => {
              setLvl(0);
              setScore(0);
              setWon(false);
              onScoreChange(0);
              loadLevel(0);
            }}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-1 p-3 bg-emerald-900 rounded-2xl">
            {grid.map((row, r) => (
              <div key={r} className="flex gap-1">
                {row.split('').map((cell, c) => {
                  const isPlayer = pos.r === r && pos.c === c;
                  return (
                    <div
                      key={c}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center text-lg ${
                        cell === '#'
                          ? 'bg-emerald-700'
                          : 'bg-amber-100 dark:bg-slate-800'
                      }`}
                    >
                      {isPlayer
                        ? '🦊'
                        : cell === 'K' && !hasKey
                        ? '🔑'
                        : cell === 'E'
                        ? hasKey
                          ? '🚪'
                          : '🔒'
                        : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div />
            <button type="button" onClick={() => move(-1, 0)} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowUp className="w-5 h-5" /></button>
            <div />
            <button type="button" onClick={() => move(0, -1)} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
            <button type="button" onClick={() => move(1, 0)} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowDown className="w-5 h-5" /></button>
            <button type="button" onClick={() => move(0, 1)} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowRight className="w-5 h-5" /></button>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 17. RITM BARABANI
// ==========================================
export const GameRitmBarabani: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [notes, setNotes] = useState<{ id: number; lane: number; y: number }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [done, setDone] = useState(false);
  const scoreRef = useRef(0);

  const hitLane = useCallback(
    (lane: number) => {
      if (done) return;
      soundFX.playDrum(lane);
      setNotes((prev) => {
        const idx = prev.findIndex((n) => n.lane === lane && n.y >= 68 && n.y <= 96);
        if (idx !== -1) {
          scoreRef.current += 20;
          setScore(scoreRef.current);
          onScoreChange(scoreRef.current);
          return prev.filter((_, i) => i !== idx);
        }
        return prev;
      });
    },
    [done, onScoreChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'd') hitLane(0);
      if (k === 'f') hitLane(1);
      if (k === 'j') hitLane(2);
      if (k === 'k') hitLane(3);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hitLane]);

  useEffect(() => {
    if (done) return;
    const moveTimer = window.setInterval(() => {
      setNotes((prev) => {
        const moved = prev.map((n) => ({ ...n, y: n.y + 4.5 })).filter((n) => n.y <= 104);
        if (Math.random() < 0.25) {
          moved.push({ id: Date.now() + Math.random(), lane: Math.floor(Math.random() * 4), y: 0 });
        }
        return moved;
      });
    }, 65);

    const secTimer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(moveTimer);
          clearInterval(secTimer);
          setDone(true);
          soundFX.playVictory();
          onGameComplete(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(moveTimer);
      clearInterval(secTimer);
    };
  }, [done, onGameComplete]);

  const laneColors = ['bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-sky-500'];
  const laneKeys = ['D', 'F', 'J', 'K'];

  return (
    <div className="p-5 bg-slate-950 text-white rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between mb-3">
        <span className="font-display font-bold">Doira ritmini tuting!</span>
        <span className="font-mono-tabular text-amber-300 font-bold">
          {timeLeft}s · Ball: {score}
        </span>
      </div>

      {done ? (
        <div className="h-72 flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">Ajoyib ijro!</h3>
          <p className="font-mono-tabular text-lg text-amber-300">Ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              setScore(0);
              setNotes([]);
              setTimeLeft(30);
              setDone(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-rose-600 font-bold rounded-xl cursor-pointer"
          >
            Qayta chalish
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="relative h-64 grid grid-cols-4 gap-2 bg-slate-900 rounded-2xl p-2 border border-slate-800 overflow-hidden">
            {[0, 1, 2, 3].map((lane) => (
              <div key={lane} className="relative bg-slate-950/60 rounded-xl">
                {notes
                  .filter((n) => n.lane === lane)
                  .map((n) => (
                    <div
                      key={n.id}
                      style={{ top: `${n.y}%` }}
                      className={`absolute left-1 right-1 h-6 rounded-lg ${laneColors[lane]} -translate-y-1/2`}
                    />
                  ))}
              </div>
            ))}
            <div className="absolute left-2 right-2 bottom-7 h-1 bg-white/40 pointer-events-none" />
          </div>

          <div className="grid grid-cols-4 gap-2 mt-3">
            {[0, 1, 2, 3].map((lane) => (
              <button
                key={lane}
                type="button"
                onClick={() => hitLane(lane)}
                className={`py-4 rounded-xl font-display font-extrabold text-xl ${laneColors[lane]} active:scale-95 transition-transform cursor-pointer`}
              >
                {laneKeys[lane]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 18. MEVA KESUVCHI (CANVAS)
// ==========================================
export const GameMevaKesuvchi: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [over, setOver] = useState(false);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || over) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface Toss {
      x: number;
      y: number;
      vx: number;
      vy: number;
      emoji: string;
      isBomb: boolean;
      sliced: boolean;
    }

    const emojis = ['🍉', '🍊', '🍎', '🍍', '🥝'];
    const items: Toss[] = [];
    let animId = 0;

    const spawn = () => {
      const isBomb = Math.random() < 0.2;
      items.push({
        x: 80 + Math.random() * (canvas.width - 160),
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -(8.5 + Math.random() * 2.5),
        emoji: isBomb ? '💣' : emojis[Math.floor(Math.random() * emojis.length)],
        isBomb,
        sliced: false,
      });
    };

    const sliceAt = (px: number, py: number) => {
      for (const it of items) {
        if (!it.sliced && Math.hypot(px - it.x, py - it.y) < 34) {
          it.sliced = true;
          if (it.isBomb) {
            soundFX.playError();
            livesRef.current -= 1;
            setLives(livesRef.current);
            if (livesRef.current <= 0) {
              setOver(true);
              onGameComplete(scoreRef.current);
            }
          } else {
            soundFX.playPop(620);
            scoreRef.current += 10;
            setScore(scoreRef.current);
            onScoreChange(scoreRef.current);
          }
        }
      }
    };

    let dragging = false;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      const r = canvas.getBoundingClientRect();
      sliceAt(((e.clientX - r.left) / r.width) * canvas.width, ((e.clientY - r.top) / r.height) * canvas.height);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const r = canvas.getBoundingClientRect();
      sliceAt(((e.clientX - r.left) / r.width) * canvas.width, ((e.clientY - r.top) / r.height) * canvas.height);
    };
    const onUp = () => {
      dragging = false;
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    const loop = () => {
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (items.length < 4 && Math.random() < 0.04) spawn();

      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.x += it.vx;
        it.y += it.vy;
        it.vy += 0.22;
        if (!it.sliced) {
          ctx.font = '38px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(it.emoji, it.x, it.y);
        }
        if (it.y > canvas.height + 50 || it.sliced) {
          items.splice(i, 1);
        }
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [over, onGameComplete, onScoreChange]);

  return (
    <div className="p-4 bg-amber-950 rounded-2xl text-white flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between mb-3">
        <span className="font-display font-bold">Mevalarni bosing/siling, bombalarga tegmang!</span>
        <span className="font-mono-tabular font-bold text-amber-300">
          Jon: {'❤️'.repeat(Math.max(0, lives))} · Ball: {score}
        </span>
      </div>
      {over ? (
        <div className="w-full max-w-2xl h-80 bg-amber-900 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">O‘yin tugadi!</h3>
          <p className="font-mono-tabular text-lg text-amber-300">Ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              livesRef.current = 3;
              setScore(0);
              setLives(3);
              setOver(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full max-w-2xl rounded-2xl border border-amber-800 cursor-crosshair touch-none"
        />
      )}
    </div>
  );
};

// ==========================================
// 19. QUTI SURISH USTASI (SOKOBAN)
// ==========================================
const SOKO_LEVELS = [
  ['######', '#....#', '#.PB.#', '#..T.#', '#....#', '######'],
  ['#######', '#.....#', '#.P.B.#', '#..#T.#', '#.B.T.#', '#.....#', '#######'],
];

export const GameQutiSurish: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [lvl, setLvl] = useState(0);
  const [player, setPlayer] = useState({ r: 2, c: 2 });
  const [boxes, setBoxes] = useState<{ r: number; c: number }[]>([]);
  const [targets, setTargets] = useState<{ r: number; c: number }[]>([]);
  const [walls, setWalls] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);

  const load = useCallback((l: number) => {
    const map = SOKO_LEVELS[l];
    setWalls(map);
    const bx: { r: number; c: number }[] = [];
    const tg: { r: number; c: number }[] = [];
    map.forEach((row, r) =>
      row.split('').forEach((ch, c) => {
        if (ch === 'P') setPlayer({ r, c });
        if (ch === 'B') bx.push({ r, c });
        if (ch === 'T') tg.push({ r, c });
      })
    );
    setBoxes(bx);
    setTargets(tg);
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  const step = useCallback(
    (dr: number, dc: number) => {
      if (won) return;
      const nr = player.r + dr;
      const nc = player.c + dc;
      if (walls[nr]?.[nc] === '#') return;

      const boxIdx = boxes.findIndex((b) => b.r === nr && b.c === nc);
      let nextBoxes = boxes;
      if (boxIdx !== -1) {
        const br = nr + dr;
        const bc = nc + dc;
        if (walls[br]?.[bc] === '#' || boxes.some((b) => b.r === br && b.c === bc)) {
          soundFX.playError();
          return;
        }
        nextBoxes = boxes.map((b, i) => (i === boxIdx ? { r: br, c: bc } : b));
        setBoxes(nextBoxes);
      }
      soundFX.playClick();
      setPlayer({ r: nr, c: nc });

      const allDone = targets.every((t) => nextBoxes.some((b) => b.r === t.r && b.c === t.c));
      if (allDone && targets.length > 0) {
        const s = score + 80;
        setScore(s);
        onScoreChange(s);
        if (lvl + 1 >= SOKO_LEVELS.length) {
          setWon(true);
          soundFX.playVictory();
          onGameComplete(s);
        } else {
          soundFX.playSuccess();
          setLvl(lvl + 1);
          load(lvl + 1);
        }
      }
    },
    [boxes, load, lvl, onGameComplete, onScoreChange, player, score, targets, walls, won]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') step(-1, 0);
      if (e.key === 'ArrowDown' || e.key === 's') step(1, 0);
      if (e.key === 'ArrowLeft' || e.key === 'a') step(0, -1);
      if (e.key === 'ArrowRight' || e.key === 'd') step(0, 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  return (
    <div className="p-6 bg-amber-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between mb-3 text-sm font-bold">
        <span>Bosqich {lvl + 1} / {SOKO_LEVELS.length}</span>
        <button type="button" onClick={() => load(lvl)} className="text-amber-700 dark:text-amber-400 cursor-pointer">
          Qayta qo‘yish
        </button>
      </div>

      {won ? (
        <div className="py-10 text-center space-y-4">
          <h3 className="font-display text-3xl font-bold">Barcha qutilar joylandi!</h3>
          <button
            type="button"
            onClick={() => {
              setLvl(0);
              setScore(0);
              setWon(false);
              onScoreChange(0);
              load(0);
            }}
            className="px-6 py-3 bg-amber-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-1 p-3 bg-slate-800 rounded-2xl">
            {walls.map((row, r) => (
              <div key={r} className="flex gap-1">
                {row.split('').map((ch, c) => {
                  const isP = player.r === r && player.c === c;
                  const isB = boxes.some((b) => b.r === r && b.c === c);
                  const isT = targets.some((t) => t.r === r && t.c === c);
                  return (
                    <div
                      key={c}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                        ch === '#' ? 'bg-slate-600' : isT ? 'bg-emerald-200 dark:bg-emerald-900' : 'bg-amber-100 dark:bg-slate-700'
                      }`}
                    >
                      {isP ? '👷' : isB ? '📦' : isT ? '🎯' : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div />
            <button type="button" onClick={() => step(-1, 0)} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowUp className="w-5 h-5" /></button>
            <div />
            <button type="button" onClick={() => step(0, -1)} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
            <button type="button" onClick={() => step(1, 0)} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowDown className="w-5 h-5" /></button>
            <button type="button" onClick={() => step(0, 1)} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"><ArrowRight className="w-5 h-5" /></button>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 20. KAMALAK MINORASI (STACKER)
// ==========================================
export const GameKamalakMinorasi: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [blocks, setBlocks] = useState<{ x: number; w: number; color: string }[]>([
    { x: 35, w: 30, color: '#0d9488' },
  ]);
  const [active, setActive] = useState({ x: 0, w: 30, dir: 1, color: '#0284c7' });
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);

  const palette = ['#0284c7', '#10b981', '#f59e0b', '#e11d48', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    if (over) return;
    const t = window.setInterval(() => {
      setActive((prev) => {
        let nx = prev.x + prev.dir * 2.2;
        let nd = prev.dir;
        if (nx + prev.w >= 100) {
          nx = 100 - prev.w;
          nd = -1;
        } else if (nx <= 0) {
          nx = 0;
          nd = 1;
        }
        return { ...prev, x: nx, dir: nd };
      });
    }, 30);
    return () => clearInterval(t);
  }, [over]);

  const dropBlock = useCallback(() => {
    if (over) return;
    const top = blocks[blocks.length - 1];
    const left = Math.max(top.x, active.x);
    const right = Math.min(top.x + top.w, active.x + active.w);
    const overlap = right - left;
    if (overlap <= 1.5) {
      soundFX.playError();
      setOver(true);
      onGameComplete(score);
      return;
    }
    soundFX.playPop(500 + blocks.length * 30);
    const placed = { x: left, w: overlap, color: active.color };
    const nextBlocks = [...blocks, placed];
    setBlocks(nextBlocks);
    const s = score + 15;
    setScore(s);
    onScoreChange(s);
    setActive({
      x: 0,
      w: overlap,
      dir: 1,
      color: palette[nextBlocks.length % palette.length],
    });
  }, [active, blocks, onGameComplete, onScoreChange, over, score]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        dropBlock();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dropBlock]);

  return (
    <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between mb-3">
        <span className="font-display font-bold">Qavat: {blocks.length}</span>
        <span className="font-mono-tabular font-bold text-cyan-400">Ball: {score}</span>
      </div>

      <div
        onClick={dropBlock}
        className="relative w-full max-w-md h-72 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden cursor-pointer"
      >
        {blocks.slice(-9).map((b, idx, arr) => (
          <div
            key={idx}
            style={{
              left: `${b.x}%`,
              width: `${b.w}%`,
              bottom: `${idx * 24}px`,
              backgroundColor: b.color,
            }}
            className="absolute h-6 rounded-sm border-b border-black/20"
          />
        ))}
        {!over && (
          <div
            style={{
              left: `${active.x}%`,
              width: `${active.w}%`,
              bottom: `${Math.min(blocks.length, 9) * 24}px`,
              backgroundColor: active.color,
            }}
            className="absolute h-6 rounded-sm"
          />
        )}
      </div>

      {over ? (
        <div className="mt-4 text-center space-y-3">
          <p className="font-display text-2xl font-bold text-amber-300">
            Minora balandligi: {blocks.length} qavat!
          </p>
          <button
            type="button"
            onClick={() => {
              setBlocks([{ x: 35, w: 30, color: '#0d9488' }]);
              setActive({ x: 0, w: 30, dir: 1, color: '#0284c7' });
              setScore(0);
              setOver(false);
              onScoreChange(0);
            }}
            className="px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta qurish
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={dropBlock}
          className="mt-4 px-8 py-3 bg-cyan-600 hover:bg-cyan-700 font-display font-bold rounded-xl cursor-pointer"
        >
          Blokni qo‘yish (Space)
        </button>
      )}
    </div>
  );
};
