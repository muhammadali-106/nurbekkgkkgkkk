import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { GameEngineProps } from '../types/platform';
import { soundFX } from '../utils/sound';
import { buildCompositeCar, createThreeEngine } from './ThreeDCore';

// ==========================================
// 1. RANGLARNI TOP
// ==========================================
const COLORS_LIST = [
  { name: 'Qizil', hex: '#ef4444', ring: 'ring-red-400' },
  { name: 'Ko‘k', hex: '#2563eb', ring: 'ring-blue-400' },
  { name: 'Yashil', hex: '#16a34a', ring: 'ring-green-400' },
  { name: 'Sariq', hex: '#eab308', ring: 'ring-yellow-400' },
  { name: 'Zarg‘aldoq', hex: '#f97316', ring: 'ring-orange-400' },
  { name: 'Binafsha', hex: '#9333ea', ring: 'ring-purple-400' },
];

export const GameRanglarniTop: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(COLORS_LIST[0]);
  const [options, setOptions] = useState(COLORS_LIST.slice(0, 4));
  const [feedback, setFeedback] = useState('');
  const [done, setDone] = useState(false);

  const setupRound = useCallback(() => {
    const shuffled = [...COLORS_LIST].sort(() => Math.random() - 0.5).slice(0, 4);
    const pick = shuffled[Math.floor(Math.random() * shuffled.length)];
    setOptions(shuffled);
    setTarget(pick);
  }, []);

  useEffect(() => {
    setupRound();
  }, [setupRound]);

  const handlePick = (c: (typeof COLORS_LIST)[number]) => {
    if (done) return;
    if (c.name === target.name) {
      soundFX.playSuccess();
      const nextScore = score + 10;
      setScore(nextScore);
      onScoreChange(nextScore);
      setFeedback(`Barakalla! Bu ${target.name} rang!`);
      if (round >= 10) {
        setDone(true);
        soundFX.playVictory();
        onGameComplete(nextScore);
      } else {
        setTimeout(() => {
          setFeedback('');
          setRound((r) => r + 1);
          setupRound();
        }, 700);
      }
    } else {
      soundFX.playError();
      setFeedback(`Yana urinib ko‘ring! Bizga ${target.name} kerak.`);
    }
  };

  const restart = () => {
    setRound(1);
    setScore(0);
    setDone(false);
    setFeedback('');
    onScoreChange(0);
    setupRound();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[460px] bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-2xl">
      {done ? (
        <div className="text-center space-y-4">
          <Sparkles className="w-14 h-14 text-amber-500 mx-auto" />
          <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            Ajoyib natija!
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-300 font-mono-tabular">
            To‘plangan ball: {score}
          </p>
          <button
            type="button"
            onClick={restart}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl cursor-pointer"
          >
            Yana o‘ynash
          </button>
        </div>
      ) : (
        <>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 font-mono-tabular">
            Bosqich {round} / 10
          </div>
          <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white text-center">
            <span style={{ color: target.hex }}>{target.name}</span> rangni toping!
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 min-h-[20px]">
            {feedback || 'Pastdagi katta sharlardan to‘g‘risini bosing'}
          </p>

          <div className="grid grid-cols-2 gap-5 mt-8 w-full max-w-md">
            {options.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handlePick(c)}
                className="h-32 sm:h-36 rounded-3xl shadow-md hover:scale-105 active:scale-95 transition-transform flex flex-col items-center justify-center cursor-pointer border-4 border-white dark:border-slate-800"
                style={{ backgroundColor: c.hex }}
                aria-label={c.name}
              >
                <span className="w-10 h-10 rounded-full bg-white/30 mb-2" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 2. HAYVONLARNI TOP
// ==========================================
const ANIMALS = [
  { id: 'cat', name: 'Mushuk', soundText: 'Miyov-miyov!', emoji: '🐱', bg: '#fef3c7' },
  { id: 'dog', name: 'Kuchuk', soundText: 'Vov-vov!', emoji: '🐶', bg: '#dbeafe' },
  { id: 'bear', name: 'Ayiq', soundText: 'G‘o‘r-g‘o‘r!', emoji: '🐻', bg: '#fde68a' },
  { id: 'rabbit', name: 'Quyon', soundText: 'Sakraydi!', emoji: '🐰', bg: '#fce7f3' },
  { id: 'elephant', name: 'Fil', soundText: 'Puuu-u!', emoji: '🐘', bg: '#e0f2fe' },
  { id: 'duck', name: 'O‘rdak', soundText: 'G‘aq-g‘aq!', emoji: '🦆', bg: '#dcfce7' },
  { id: 'lion', name: 'Sher', soundText: 'R-r-r!', emoji: '🦁', bg: '#ffedd5' },
];

export const GameHayvonlarniTop: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(ANIMALS[0]);
  const [choices, setChoices] = useState(ANIMALS.slice(0, 4));
  const [msg, setMsg] = useState('');
  const [finished, setFinished] = useState(false);

  const nextQuestion = useCallback(() => {
    const pool = [...ANIMALS].sort(() => Math.random() - 0.5).slice(0, 4);
    const t = pool[Math.floor(Math.random() * pool.length)];
    setChoices(pool);
    setTarget(t);
    setMsg('');
  }, []);

  useEffect(() => {
    nextQuestion();
  }, [nextQuestion]);

  const pickAnimal = (a: (typeof ANIMALS)[number]) => {
    if (finished) return;
    if (a.id === target.id) {
      soundFX.playSuccess();
      const s = score + 15;
      setScore(s);
      onScoreChange(s);
      setMsg(`To‘g‘ri! ${a.name}: "${a.soundText}"`);
      if (round >= 8) {
        setFinished(true);
        soundFX.playVictory();
        onGameComplete(s);
      } else {
        setTimeout(() => {
          setRound((r) => r + 1);
          nextQuestion();
        }, 850);
      }
    } else {
      soundFX.playError();
      setMsg(`Bu ${a.name}. Biz esa ${target.name}ni qidiryapmiz!`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[460px] bg-emerald-50/70 dark:bg-slate-900 rounded-2xl">
      {finished ? (
        <div className="text-center space-y-4">
          <div className="text-5xl">🏆</div>
          <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            Barcha hayvonlarni topdingiz!
          </h3>
          <p className="text-lg font-mono-tabular text-teal-700 dark:text-teal-400 font-bold">
            Ball: {score}
          </p>
          <button
            type="button"
            onClick={() => {
              setRound(1);
              setScore(0);
              setFinished(false);
              onScoreChange(0);
              nextQuestion();
            }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <>
          <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 font-mono-tabular">
            Savol {round} / 8
          </div>
          <h3 className="mt-1 font-display text-3xl font-extrabold text-slate-900 dark:text-white text-center">
            Qaysi biri — {target.name}?
          </h3>
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300 min-h-[22px]">
            {msg || 'Hayvonchaning ustiga bosing'}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-7 w-full max-w-md">
            {choices.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => pickAnimal(a)}
                className="p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 active:scale-95 transition-transform flex flex-col items-center justify-center cursor-pointer bg-white dark:bg-slate-800"
              >
                <span
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mb-2"
                  style={{ backgroundColor: a.bg }}
                >
                  {a.emoji}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 3. SHAKLLAR DUNYOSI (REAL 3D THREE.JS)
// ==========================================
const SHAPES_3D = [
  { id: 'cube', name: 'Kub', color: 0x3b82f6 },
  { id: 'sphere', name: 'Shar', color: 0xef4444 },
  { id: 'cone', name: 'Konus', color: 0xf59e0b },
  { id: 'cylinder', name: 'Silindr', color: 0x10b981 },
  { id: 'pyramid', name: 'Piramida', color: 0x8b5cf6 },
];

export const GameShakllarDunyosi: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [targetShape, setTargetShape] = useState(SHAPES_3D[0]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [done, setDone] = useState(false);

  const pickNext = useCallback(() => {
    const next = SHAPES_3D[Math.floor(Math.random() * SHAPES_3D.length)];
    setTargetShape(next);
  }, []);

  useEffect(() => {
    pickNext();
  }, [pickNext]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const engine = createThreeEngine(el, {
      skyColor: 0xe0f2fe,
      cameraPos: [0, 2.2, 5.2],
      fov: 45,
    });

    const stage = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.35, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1 })
    );
    stage.position.y = -1.2;
    stage.receiveShadow = true;
    engine.scene.add(stage);

    let geo: THREE.BufferGeometry;
    if (targetShape.id === 'cube') geo = new THREE.BoxGeometry(1.7, 1.7, 1.7);
    else if (targetShape.id === 'sphere') geo = new THREE.SphereGeometry(1.1, 32, 32);
    else if (targetShape.id === 'cone') geo = new THREE.ConeGeometry(1.1, 2.0, 28);
    else if (targetShape.id === 'cylinder') geo = new THREE.CylinderGeometry(0.9, 0.9, 1.8, 28);
    else geo = new THREE.ConeGeometry(1.2, 2.0, 4);

    const mat = new THREE.MeshStandardMaterial({
      color: targetShape.color,
      roughness: 0.25,
      metalness: 0.35,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.y = 0.2;
    engine.scene.add(mesh);

    const stop = engine.startLoop((delta, elapsed) => {
      mesh.rotation.y += delta * 1.15;
      mesh.rotation.x = Math.sin(elapsed * 1.2) * 0.22;
      mesh.position.y = 0.2 + Math.sin(elapsed * 2.2) * 0.14;
      engine.camera.lookAt(0, 0.1, 0);
    });

    return () => {
      stop();
      engine.dispose();
    };
  }, [targetShape]);

  const handleSelect = (shapeId: string) => {
    if (done) return;
    if (shapeId === targetShape.id) {
      soundFX.playSuccess();
      const s = score + 20;
      setScore(s);
      onScoreChange(s);
      setFeedback(`To‘g‘ri! Bu 3D ${targetShape.name}!`);
      if (round >= 8) {
        setDone(true);
        soundFX.playVictory();
        onGameComplete(s);
      } else {
        setTimeout(() => {
          setFeedback('');
          setRound((r) => r + 1);
          pickNext();
        }, 700);
      }
    } else {
      soundFX.playError();
      setFeedback('Qayta urinib ko‘ring! 3D shaklga diqqat bilan qarang.');
    }
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 bg-sky-50 dark:bg-slate-900 rounded-2xl">
      <div className="flex items-center justify-between w-full max-w-2xl mb-3">
        <span className="text-sm font-semibold text-sky-800 dark:text-sky-300 font-mono-tabular">
          Shakl {round} / 8
        </span>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {feedback || 'Aylanayotgan 3D shakl qaysi?'}
        </span>
      </div>

      <div
        ref={mountRef}
        className="w-full max-w-2xl h-64 sm:h-72 rounded-2xl overflow-hidden border border-sky-200 dark:border-slate-700 bg-sky-100"
      />

      {done ? (
        <div className="mt-5 text-center space-y-3">
          <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Siz 3D shakllar bilimdoni bo‘ldingiz! Ball: {score}
          </p>
          <button
            type="button"
            onClick={() => {
              setRound(1);
              setScore(0);
              setDone(false);
              setFeedback('');
              onScoreChange(0);
              pickNext();
            }}
            className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 w-full max-w-2xl">
          {SHAPES_3D.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s.id)}
              className="py-3.5 px-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-teal-500 font-display font-bold text-slate-900 dark:text-white shadow-sm cursor-pointer transition-transform active:scale-95"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. PUFAKCHALARNI YOR (CANVAS)
// ==========================================
export const GamePufakchalarniYor: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);
  const [finished, setFinished] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (finished) return;
    const t = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setFinished(true);
          soundFX.playVictory();
          onGameComplete(scoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [finished, onGameComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || finished) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface Bubble {
      x: number;
      y: number;
      r: number;
      vy: number;
      color: string;
      bonus: boolean;
    }

    const colors = ['#38bdf8', '#fb7185', '#4ade80', '#facc15', '#c084fc'];
    const bubbles: Bubble[] = [];
    let animId = 0;

    const spawn = () => {
      const bonus = Math.random() < 0.16;
      bubbles.push({
        x: 40 + Math.random() * (canvas.width - 80),
        y: canvas.height + 35,
        r: bonus ? 24 : 26 + Math.random() * 14,
        vy: bonus ? 2.2 : 1.2 + Math.random() * 1.1,
        color: bonus ? '#f59e0b' : colors[Math.floor(Math.random() * colors.length)],
        bonus,
      });
    };

    for (let i = 0; i < 6; i++) spawn();

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#bae6fd');
      grad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (bubbles.length < 9 && Math.random() < 0.05) spawn();

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.vy;
        b.x += Math.sin(b.y * 0.03) * 0.6;
        if (b.y < -40) {
          bubbles.splice(i, 1);
          spawn();
          continue;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color + 'cc';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.32, b.y - b.r * 0.32, b.r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fill();

        if (b.bonus) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', b.x, b.y);
        }
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const handlePointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (Math.hypot(px - b.x, py - b.y) <= b.r + 8) {
          const pts = b.bonus ? 25 : 10;
          soundFX.playPop(b.bonus ? 760 : 480);
          bubbles.splice(i, 1);
          spawn();
          scoreRef.current += pts;
          setScore(scoreRef.current);
          onScoreChange(scoreRef.current);
          break;
        }
      }
    };

    canvas.addEventListener('pointerdown', handlePointer);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerdown', handlePointer);
    };
  }, [finished, onScoreChange]);

  return (
    <div className="flex flex-col items-center p-4 bg-sky-50 dark:bg-slate-900 rounded-2xl">
      <div className="w-full max-w-2xl flex items-center justify-between mb-3 px-2">
        <span className="font-display font-bold text-slate-800 dark:text-white">
          Pufakchalarni bosing!
        </span>
        <span className="font-mono-tabular font-bold text-sky-700 dark:text-sky-300">
          Vaqt: {timeLeft}s · Ball: {score}
        </span>
      </div>
      {finished ? (
        <div className="w-full max-w-2xl h-80 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-2xl space-y-4">
          <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Vaqt tugadi!
          </h3>
          <p className="text-lg font-mono-tabular text-teal-600 dark:text-teal-400 font-bold">
            Siz {score} ball to‘pladingiz!
          </p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              setScore(0);
              setTimeLeft(35);
              setFinished(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          className="w-full max-w-2xl rounded-2xl border-2 border-sky-200 dark:border-slate-700 cursor-pointer touch-none"
        />
      )}
    </div>
  );
};

// ==========================================
// 5. MEVALARNI SARALA
// ==========================================
const FRUITS = [
  { id: 'apple', name: 'Olma', emoji: '🍎', color: 'bg-red-100 border-red-300' },
  { id: 'banana', name: 'Banan', emoji: '🍌', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'grapes', name: 'Uzum', emoji: '🍇', color: 'bg-purple-100 border-purple-300' },
  { id: 'pear', name: 'Nok', emoji: '🍐', color: 'bg-green-100 border-green-300' },
];

export const GameMevalarniSarala: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [queue, setQueue] = useState<typeof FRUITS>([]);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState('');

  const initQueue = useCallback(() => {
    const list = Array.from({ length: 12 }, () => FRUITS[Math.floor(Math.random() * FRUITS.length)]);
    setQueue(list);
    setScore(0);
    setMsg('Mevani o‘z savatchasiga bosing!');
    onScoreChange(0);
  }, [onScoreChange]);

  useEffect(() => {
    initQueue();
  }, [initQueue]);

  const current = queue[0];

  const handleSort = (basketId: string) => {
    if (!current) return;
    if (current.id === basketId) {
      soundFX.playSuccess();
      const s = score + 10;
      setScore(s);
      onScoreChange(s);
      const rest = queue.slice(1);
      setQueue(rest);
      setMsg(`Barakalla! ${current.name} savatga tushdi!`);
      if (rest.length === 0) {
        soundFX.playVictory();
        onGameComplete(s);
      }
    } else {
      soundFX.playError();
      setMsg(`Voy! Bu ${current.name} savati emas.`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[450px] bg-amber-50/70 dark:bg-slate-900 rounded-2xl">
      {!current ? (
        <div className="text-center space-y-4">
          <div className="text-5xl">🧺</div>
          <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Hamma mevalar saralandi!
          </h3>
          <p className="font-mono-tabular text-lg font-bold text-teal-600 dark:text-teal-400">
            Natija: {score} ball
          </p>
          <button
            type="button"
            onClick={initQueue}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Yana o‘ynash
          </button>
        </div>
      ) : (
        <>
          <div className="text-sm font-semibold text-amber-800 dark:text-amber-300 font-mono-tabular">
            Qolgan mevalar: {queue.length}
          </div>
          <div className="mt-4 w-32 h-32 rounded-3xl bg-white dark:bg-slate-800 border-4 border-amber-300 shadow-md flex flex-col items-center justify-center animate-float-slow">
            <span className="text-6xl">{current.emoji}</span>
            <span className="text-sm font-bold text-slate-800 dark:text-white mt-1">
              {current.name}
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300 min-h-[20px]">
            {msg}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-7 w-full max-w-xl">
            {FRUITS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSort(b.id)}
                className={`p-5 rounded-2xl border-2 ${b.color} dark:bg-slate-800 dark:border-slate-700 hover:scale-105 active:scale-95 transition-transform flex flex-col items-center cursor-pointer`}
              >
                <span className="text-4xl mb-1">{b.emoji}</span>
                <span className="font-display font-bold text-slate-900 dark:text-white text-sm">
                  {b.name} savati
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 6. KICHKINA MASHINALAR (3D THREE.JS)
// ==========================================
export const GameKichkinaMashinalar: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const laneRef = useRef(0); // -1, 0, 1
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);
  const [finished, setFinished] = useState(false);
  const scoreRef = useRef(0);

  const moveLane = useCallback((dir: -1 | 1) => {
    soundFX.playClick();
    laneRef.current = Math.max(-1, Math.min(1, laneRef.current + dir));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveLane(-1);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveLane(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moveLane]);

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setFinished(true);
          soundFX.playVictory();
          onGameComplete(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [finished, onGameComplete]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el || finished) return;

    const engine = createThreeEngine(el, {
      skyColor: 0xdbeafe,
      cameraPos: [0, 4.2, 6.8],
      fov: 52,
    });

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 120),
      new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    engine.scene.add(ground);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 120),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.02;
    road.receiveShadow = true;
    engine.scene.add(road);

    const car = buildCompositeCar(0xe11d48, 0xfacc15);
    car.position.set(0, 0, 2);
    engine.scene.add(car);

    const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.14, 18);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.35,
      metalness: 0.8,
      roughness: 0.2,
    });

    const coins: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Mesh(coinGeo, coinMat);
      const lane = (Math.floor(Math.random() * 3) - 1) * 2.5;
      c.position.set(lane, 0.65, -8 - i * 8);
      c.castShadow = true;
      engine.scene.add(c);
      coins.push(c);
    }

    const stop = engine.startLoop((delta) => {
      const targetX = laneRef.current * 2.5;
      car.position.x = THREE.MathUtils.damp(car.position.x, targetX, 10, delta);
      car.rotation.z = (car.position.x - targetX) * 0.12;
      engine.camera.lookAt(car.position.x * 0.4, 0.6, -3);

      coins.forEach((c) => {
        c.position.z += delta * 11;
        c.rotation.y += delta * 3.5;
        if (Math.abs(c.position.z - car.position.z) < 1.3 && Math.abs(c.position.x - car.position.x) < 1.2) {
          soundFX.playPop(680);
          scoreRef.current += 10;
          setScore(scoreRef.current);
          onScoreChange(scoreRef.current);
          c.position.z = -40 - Math.random() * 12;
          c.position.x = (Math.floor(Math.random() * 3) - 1) * 2.5;
        }
        if (c.position.z > 6) {
          c.position.z = -40 - Math.random() * 12;
          c.position.x = (Math.floor(Math.random() * 3) - 1) * 2.5;
        }
      });
    });

    return () => {
      stop();
      engine.dispose();
    };
  }, [finished, onScoreChange]);

  return (
    <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
      <div className="w-full max-w-2xl flex items-center justify-between mb-3">
        <span className="font-display font-bold text-slate-900 dark:text-white">
          Tangalarni yig‘ing!
        </span>
        <span className="font-mono-tabular font-bold text-rose-600 dark:text-rose-400">
          Vaqt: {timeLeft}s · Ball: {score}
        </span>
      </div>

      {finished ? (
        <div className="w-full max-w-2xl h-72 rounded-2xl bg-white dark:bg-slate-800 flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Ajoyib sayohat!
          </h3>
          <p className="font-mono-tabular text-lg font-bold text-teal-600 dark:text-teal-400">
            To‘plangan tangalar balli: {score}
          </p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              laneRef.current = 0;
              setScore(0);
              setTimeLeft(35);
              setFinished(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta haydash
          </button>
        </div>
      ) : (
        <>
          <div
            ref={mountRef}
            className="w-full max-w-2xl h-72 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
          />
          <div className="flex items-center gap-6 mt-4">
            <button
              type="button"
              onClick={() => moveLane(-1)}
              className="px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm active:scale-95 cursor-pointer flex items-center gap-2 font-bold text-slate-800 dark:text-white"
            >
              <ArrowLeft className="w-6 h-6" /> Chapga
            </button>
            <button
              type="button"
              onClick={() => moveLane(1)}
              className="px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm active:scale-95 cursor-pointer flex items-center gap-2 font-bold text-slate-800 dark:text-white"
            >
              O‘ngga <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 7. SEHRLI YULDUZCHALAR
// ==========================================
export const GameSehrliYulduzchalar: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; scale: number }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [done, setDone] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (done) return;
    const spawner = window.setInterval(() => {
      setStars((prev) => {
        const filtered = prev.slice(-5);
        return [
          ...filtered,
          {
            id: Date.now() + Math.random(),
            x: 12 + Math.random() * 76,
            y: 15 + Math.random() * 68,
            scale: 0.9 + Math.random() * 0.4,
          },
        ];
      });
    }, 850);

    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          clearInterval(spawner);
          setDone(true);
          soundFX.playVictory();
          onGameComplete(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(spawner);
      clearInterval(timer);
    };
  }, [done, onGameComplete]);

  const catchStar = (id: number) => {
    soundFX.playNote(660 + Math.random() * 240);
    setStars((prev) => prev.filter((s) => s.id !== id));
    scoreRef.current += 10;
    setScore(scoreRef.current);
    onScoreChange(scoreRef.current);
  };

  return (
    <div className="p-4 bg-slate-950 rounded-2xl text-white">
      <div className="flex items-center justify-between mb-3 px-2">
        <span className="font-display font-bold">Yulduzchalarni tutib oling!</span>
        <span className="font-mono-tabular text-amber-300 font-bold">
          Vaqt: {timeLeft}s · Ball: {score}
        </span>
      </div>

      {done ? (
        <div className="h-80 flex flex-col items-center justify-center space-y-4">
          <div className="text-5xl">✨</div>
          <h3 className="font-display text-3xl font-bold">Yulduzlar charaqladi!</h3>
          <p className="font-mono-tabular text-lg text-amber-300">Ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              setScore(0);
              setTimeLeft(30);
              setStars([]);
              setDone(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl cursor-pointer"
          >
            Yana o‘ynash
          </button>
        </div>
      ) : (
        <div className="relative w-full h-80 rounded-2xl bg-gradient-to-b from-slate-900 to-indigo-950 border border-slate-800 overflow-hidden">
          {stars.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => catchStar(s.id)}
              style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%, -50%) scale(${s.scale})` }}
              className="absolute w-14 h-14 rounded-full bg-amber-400/20 hover:bg-amber-400/40 flex items-center justify-center text-3xl cursor-pointer transition-transform active:scale-75"
              aria-label="Yulduzcha"
            >
              ⭐
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 8. RAQAMLARNI O‘RGAN
// ==========================================
const COUNT_ITEMS = ['🍎', '🐥', '🌸', '🎈', '🍓'];

export const GameRaqamlarniOrgan: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [round, setRound] = useState(1);
  const [count, setCount] = useState(3);
  const [icon, setIcon] = useState('🍎');
  const [options, setOptions] = useState<number[]>([2, 3, 4, 5]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [done, setDone] = useState(false);

  const setup = useCallback(() => {
    const c = Math.floor(Math.random() * 9) + 1;
    const set = new Set<number>([c]);
    while (set.size < 4) {
      set.add(Math.floor(Math.random() * 9) + 1);
    }
    setCount(c);
    setIcon(COUNT_ITEMS[Math.floor(Math.random() * COUNT_ITEMS.length)]);
    setOptions(Array.from(set).sort((a, b) => a - b));
    setFeedback('');
  }, []);

  useEffect(() => {
    setup();
  }, [setup]);

  const answer = (num: number) => {
    if (done) return;
    if (num === count) {
      soundFX.playSuccess();
      const s = score + 15;
      setScore(s);
      onScoreChange(s);
      setFeedback(`To‘g‘ri! Bu yerda ${count} ta!`);
      if (round >= 8) {
        setDone(true);
        soundFX.playVictory();
        onGameComplete(s);
      } else {
        setTimeout(() => {
          setRound((r) => r + 1);
          setup();
        }, 700);
      }
    } else {
      soundFX.playError();
      setFeedback('Qayta sanab ko‘raylik-chi!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[440px] bg-emerald-50 dark:bg-slate-900 rounded-2xl">
      {done ? (
        <div className="text-center space-y-4">
          <h3 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Siz juda yaxshi sanaysiz!
          </h3>
          <p className="font-mono-tabular text-lg font-bold text-emerald-700 dark:text-emerald-400">
            Ball: {score}
          </p>
          <button
            type="button"
            onClick={() => {
              setRound(1);
              setScore(0);
              setDone(false);
              onScoreChange(0);
              setup();
            }}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Qayta o‘ynash
          </button>
        </div>
      ) : (
        <>
          <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 font-mono-tabular">
            Topshiriq {round} / 8
          </div>
          <h3 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Rasmda nechta buyum bor?
          </h3>

          <div className="mt-6 p-6 bg-white dark:bg-slate-800 rounded-3xl border-2 border-emerald-200 dark:border-slate-700 flex flex-wrap items-center justify-center gap-4 max-w-md min-h-[140px]">
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} className="text-4xl sm:text-5xl">
                {icon}
              </span>
            ))}
          </div>

          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300 min-h-[20px]">
            {feedback || 'To‘g‘ri raqamni bosing'}
          </p>

          <div className="grid grid-cols-4 gap-3 mt-5 w-full max-w-md">
            {options.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => answer(n)}
                className="py-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-300 dark:border-slate-700 hover:bg-emerald-600 hover:text-white font-display text-3xl font-extrabold text-slate-900 dark:text-white cursor-pointer transition-colors"
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 9. DENGIZ SARGUZASHTI (CANVAS)
// ==========================================
export const GameDengizSarguzashti: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);
  const [done, setDone] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (done) return;
    const t = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setDone(true);
          soundFX.playVictory();
          onGameComplete(scoreRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [done, onGameComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || done) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fish = { x: 160, y: 190, tx: 160, ty: 190 };
    const pearls = Array.from({ length: 5 }, () => ({
      x: 80 + Math.random() * 500,
      y: 50 + Math.random() * 280,
    }));
    let animId = 0;

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      fish.tx = ((e.clientX - r.left) / r.width) * canvas.width;
      fish.ty = ((e.clientY - r.top) / r.height) * canvas.height;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);

    const loop = () => {
      fish.x += (fish.tx - fish.x) * 0.1;
      fish.y += (fish.ty - fish.y) * 0.1;

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Seaweed decor
      ctx.fillStyle = '#10b981';
      for (let x = 40; x < canvas.width; x += 110) {
        ctx.beginPath();
        ctx.ellipse(x, canvas.height - 20, 12, 42, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pearls
      pearls.forEach((p) => {
        if (Math.hypot(fish.x - p.x, fish.y - p.y) < 34) {
          soundFX.playPop(700);
          scoreRef.current += 10;
          setScore(scoreRef.current);
          onScoreChange(scoreRef.current);
          p.x = 60 + Math.random() * (canvas.width - 120);
          p.y = 50 + Math.random() * (canvas.height - 100);
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      });

      // Cute Fish
      ctx.save();
      ctx.translate(fish.x, fish.y);
      if (fish.tx < fish.x) ctx.scale(-1, 1);
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-38, -14);
      ctx.lineTo(-38, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(12, -5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(13, -5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
    };
  }, [done, onScoreChange]);

  return (
    <div className="flex flex-col items-center p-4 bg-sky-950 rounded-2xl text-white">
      <div className="w-full max-w-2xl flex items-center justify-between mb-3">
        <span className="font-display font-bold">Baliqchani harakatlantirib marvarid yig‘ing!</span>
        <span className="font-mono-tabular font-bold text-amber-300">
          Vaqt: {timeLeft}s · Ball: {score}
        </span>
      </div>
      {done ? (
        <div className="w-full max-w-2xl h-80 bg-sky-900 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <h3 className="font-display text-3xl font-bold">Dengiz sarguzashti yakunlandi!</h3>
          <p className="font-mono-tabular text-lg text-amber-300">Ball: {score}</p>
          <button
            type="button"
            onClick={() => {
              scoreRef.current = 0;
              setScore(0);
              setTimeLeft(35);
              setDone(false);
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer"
          >
            Yana suzish
          </button>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full max-w-2xl rounded-2xl border border-sky-700 cursor-pointer touch-none"
        />
      )}
    </div>
  );
};

// ==========================================
// 10. QUVNOQ PAZL
// ==========================================
const PUZZLE_TILES = [
  { id: 0, label: '☀️', bg: '#fef08a' },
  { id: 1, label: '☁️', bg: '#bae6fd' },
  { id: 2, label: '🌈', bg: '#fbcfe8' },
  { id: 3, label: '🌳', bg: '#bbf7d0' },
  { id: 4, label: '🏡', bg: '#fed7aa' },
  { id: 5, label: '🌻', bg: '#fde047' },
];

export const GameQuvnoqPazl: React.FC<GameEngineProps> = ({
  onScoreChange,
  onGameComplete,
}) => {
  const [tiles, setTiles] = useState<number[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);

  const shuffleTiles = useCallback(() => {
    const arr = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
    if (arr.every((v, i) => v === i)) {
      [arr[0], arr[1]] = [arr[1], arr[0]];
    }
    setTiles(arr);
    setSelectedIdx(null);
    setMoves(0);
    setSolved(false);
    onScoreChange(0);
  }, [onScoreChange]);

  useEffect(() => {
    shuffleTiles();
  }, [shuffleTiles]);

  const handleTileClick = (idx: number) => {
    if (solved) return;
    soundFX.playClick();
    if (selectedIdx === null) {
      setSelectedIdx(idx);
      return;
    }
    if (selectedIdx === idx) {
      setSelectedIdx(null);
      return;
    }
    const next = [...tiles];
    [next[selectedIdx], next[idx]] = [next[idx], next[selectedIdx]];
    setTiles(next);
    setSelectedIdx(null);
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (next.every((v, i) => v === i)) {
      const finalScore = Math.max(40, 150 - nextMoves * 5);
      setSolved(true);
      soundFX.playVictory();
      onScoreChange(finalScore);
      onGameComplete(finalScore);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-teal-50/70 dark:bg-slate-900 rounded-2xl min-h-[440px]">
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <span className="font-display font-bold text-slate-900 dark:text-white">
          Bo‘laklarni o‘z raqamiga qo‘ying (1–6)
        </span>
        <button
          type="button"
          onClick={shuffleTiles}
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Aralashtirish
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {tiles.map((tileId, idx) => {
          const item = PUZZLE_TILES[tileId];
          const isSelected = selectedIdx === idx;
          const inPlace = tileId === idx;
          return (
            <button
              key={`${tileId}-${idx}`}
              type="button"
              onClick={() => handleTileClick(idx)}
              style={{ backgroundColor: item.bg }}
              className={`h-28 rounded-2xl border-4 transition-transform flex flex-col items-center justify-center cursor-pointer ${
                isSelected
                  ? 'border-teal-600 scale-105'
                  : inPlace
                  ? 'border-emerald-500'
                  : 'border-white'
              }`}
            >
              <span className="text-4xl">{item.label}</span>
              <span className="mt-1 text-xs font-mono font-bold text-slate-800">
                #{tileId + 1}
              </span>
            </button>
          );
        })}
      </div>

      {solved && (
        <div className="mt-6 text-center space-y-3">
          <p className="font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            Tabriklaymiz! Pazl {moves} ta harakatda yig‘ildi!
          </p>
          <button
            type="button"
            onClick={shuffleTiles}
            className="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl cursor-pointer"
          >
            Yana o‘ynash
          </button>
        </div>
      )}
    </div>
  );
};
