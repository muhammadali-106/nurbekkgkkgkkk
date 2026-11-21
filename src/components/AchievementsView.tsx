import React, { useMemo } from 'react';
import { Award, Medal, Play, Trophy } from 'lucide-react';
import { GAMES_CATALOG } from '../data/gamesCatalog';
import { GameMetadata, GameScoreEntry, UserProfile } from '../types/platform';

interface AchievementsViewProps {
  profile: UserProfile;
  scores: Record<string, GameScoreEntry>;
  onLaunchGame: (game: GameMetadata) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  profile,
  scores,
  onLaunchGame,
}) => {
  const ageGames = useMemo(
    () => GAMES_CATALOG.filter((g) => g.ageGroup === profile.ageGroup),
    [profile.ageGroup]
  );

  const stats = useMemo(() => {
    let totalScore = 0;
    let totalPlays = 0;
    let gamesTried = 0;
    ageGames.forEach((g) => {
      const entry = scores[g.id];
      if (entry) {
        totalScore += entry.bestScore;
        totalPlays += entry.playsCount;
        if (entry.playsCount > 0) gamesTried += 1;
      }
    });
    return { totalScore, totalPlays, gamesTried };
  }, [ageGames, scores]);

  const milestones = [
    {
      title: 'Ilk qadam',
      desc: 'Kamida 1 ta o‘yinni yakunlash',
      unlocked: stats.totalPlays >= 1,
    },
    {
      title: 'Faol o‘yinchi',
      desc: '5 xil o‘yinni sinab ko‘rish',
      unlocked: stats.gamesTried >= 5,
    },
    {
      title: 'To‘liq kashfiyotchi',
      desc: 'Yosh toifasidagi barcha 10 ta o‘yinni o‘ynash',
      unlocked: stats.gamesTried >= 10,
    },
    {
      title: 'Oltin rekordchi',
      desc: 'Umumiy ballni 500 dan oshirish',
      unlocked: stats.totalScore >= 500,
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
          Shaxsiy statistika · {profile.nickname}
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-slate-900 dark:text-white">
          Yutuqlar va natijalar
        </h1>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="text-sm text-slate-500 dark:text-slate-400">Umumiy rekord ball</div>
          <div className="mt-2 font-display text-3xl font-extrabold text-slate-900 dark:text-white font-mono-tabular">
            {stats.totalScore}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="text-sm text-slate-500 dark:text-slate-400">O‘ynalgan o‘yinlar</div>
          <div className="mt-2 font-display text-3xl font-extrabold text-slate-900 dark:text-white font-mono-tabular">
            {stats.gamesTried} / {ageGames.length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="text-sm text-slate-500 dark:text-slate-400">Jami urinishlar</div>
          <div className="mt-2 font-display text-3xl font-extrabold text-slate-900 dark:text-white font-mono-tabular">
            {stats.totalPlays}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Nishonlar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestones.map((m) => (
            <div
              key={m.title}
              className={`rounded-2xl border p-5 transition-colors ${
                m.unlocked
                  ? 'bg-white dark:bg-slate-900 border-teal-500/50 dark:border-teal-500/40'
                  : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  m.unlocked
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {m.unlocked ? <Trophy className="w-5 h-5" /> : <Award className="w-5 h-5" />}
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {m.title}
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{m.desc}</p>
              <p className="mt-3 text-xs font-semibold text-teal-700 dark:text-teal-400">
                {m.unlocked ? 'Ochilgan' : 'Hali ochilmagan'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Game Score Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            {profile.ageGroup} yosh o‘yinlari natijalari
          </h2>
          <Medal className="w-5 h-5 text-amber-500" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {ageGames.map((game) => {
            const entry = scores[game.id];
            return (
              <div
                key={game.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-display font-bold text-slate-900 dark:text-white truncate">
                    {game.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {game.category} · {entry ? `${entry.playsCount} marta o‘ynalgan` : 'Hali o‘ynalmagan'}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Eng yuqori</div>
                    <div className="font-mono-tabular font-bold text-base text-slate-900 dark:text-white">
                      {entry?.bestScore ?? 0}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onLaunchGame(game)}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-teal-600 hover:text-white dark:bg-slate-800 dark:hover:bg-teal-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    aria-label={`${game.title} o'yinini boshlash`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};
