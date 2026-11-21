import React, { useMemo, useState } from 'react';
import { Heart, Play, Search, Shuffle } from 'lucide-react';
import {
  AGE_GROUPS,
  GAMES_CATALOG,
  HERO_BANNER_IMAGE,
} from '../data/gamesCatalog';
import {
  GameMetadata,
  GameScoreEntry,
  UserProfile,
} from '../types/platform';
import { soundFX } from '../utils/sound';
import { GameThumbnail } from './GameThumbnail';

interface DashboardLobbyProps {
  profile: UserProfile;
  scores: Record<string, GameScoreEntry>;
  favorites: string[];
  onToggleFavorite: (gameId: string) => void;
  onLaunchGame: (game: GameMetadata) => void;
}

export const DashboardLobby: React.FC<DashboardLobbyProps> = ({
  profile,
  scores,
  favorites,
  onToggleFavorite,
  onLaunchGame,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');

  const ageInfo = useMemo(
    () => AGE_GROUPS.find((g) => g.id === profile.ageGroup) || AGE_GROUPS[0],
    [profile.ageGroup]
  );

  // CRITICAL: Strictly filter catalog to ONLY the user's selected age group
  const ageGames = useMemo(
    () => GAMES_CATALOG.filter((game) => game.ageGroup === profile.ageGroup),
    [profile.ageGroup]
  );

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    ageGames.forEach((g) => cats.add(g.category));
    return ['Barchasi', 'Sevimlilar', ...Array.from(cats)];
  }, [ageGames]);

  const filteredGames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ageGames.filter((game) => {
      if (selectedCategory === 'Sevimlilar' && !favorites.includes(game.id)) {
        return false;
      }
      if (
        selectedCategory !== 'Barchasi' &&
        selectedCategory !== 'Sevimlilar' &&
        game.category !== selectedCategory
      ) {
        return false;
      }
      if (!q) return true;
      return (
        game.title.toLowerCase().includes(q) ||
        game.shortDesc.toLowerCase().includes(q) ||
        game.category.toLowerCase().includes(q)
      );
    });
  }, [ageGames, favorites, searchQuery, selectedCategory]);

  const handleRandomPlay = () => {
    soundFX.playPop(560);
    const pool = filteredGames.length > 0 ? filteredGames : ageGames;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) onLaunchGame(pick);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Hero Split Banner */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
              {ageInfo.label} · {ageInfo.subtitle}
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight text-balance">
              Xush kelibsiz, {profile.nickname}!
            </h1>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {ageInfo.description} Sizning yoshingizga mos {ageGames.length} ta sara o‘yin tayyor.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleRandomPlay}
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-display font-bold text-sm sm:text-base rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Shuffle className="w-4 h-4" />
              Tasodifiy o‘yinni boshlash
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-mono-tabular">
              Jami o‘yinlar: {ageGames.length}
            </span>
          </div>
        </div>

        <div className="lg:col-span-6 relative min-h-[220px] lg:min-h-[300px] bg-slate-100 dark:bg-slate-800">
          <img
            src={HERO_BANNER_IMAGE}
            alt="UZBEK GAMES o'yin olami"
            referrerPolicy="no-referrer"
            className="w-full h-full lg:h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-white/15 lg:via-transparent lg:to-transparent dark:lg:from-slate-900/35" />
        </div>
      </section>

      {/* Search & Category Filter Toolbar */}
      <section aria-label="O'yinlarni saralash" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/90 rounded-xl overflow-x-auto">
            {availableCategories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="O‘yin qidirish..."
              aria-label="O‘yin qidirish"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section aria-label="Yosh toifasi o'yinlari">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {ageInfo.label} uchun o‘yinlar kutubxonasi
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-mono-tabular">
            {filteredGames.length} ta o‘yin
          </span>
        </div>

        {filteredGames.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Bu bo‘limda o‘yin topilmadi
            </p>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Qidiruv so‘zini o‘zgartiring yoki barcha bo‘limlarni ko‘ring.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Barchasi');
              }}
              className="mt-5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl cursor-pointer"
            >
              Barchasini ko‘rsatish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game) => {
              const best = scores[game.id]?.bestScore ?? 0;
              const isFav = favorites.includes(game.id);
              return (
                <article
                  key={game.id}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      onLaunchGame(game);
                    }}
                    className="text-left focus-visible:outline-none cursor-pointer block w-full"
                  >
                    <GameThumbnail game={game} />
                  </button>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white leading-snug">
                          {game.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playPop(isFav ? 340 : 620);
                            onToggleFavorite(game.id);
                          }}
                          aria-label={
                            isFav ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish'
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>{game.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{game.duration}</span>
                        {best > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular text-teal-700 dark:text-teal-400 font-semibold">
                              Rekord: {best}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {game.shortDesc}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playPop(520);
                        onLaunchGame(game);
                      }}
                      className="mt-4 w-full py-2.5 px-4 bg-slate-900 hover:bg-teal-600 dark:bg-slate-800 dark:hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      O‘ynash
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};
