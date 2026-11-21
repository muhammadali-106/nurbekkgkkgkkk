import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { GameEngineProps, GameMetadata } from '../types/platform';
import { soundFX } from '../utils/sound';
import {
  GameDengizSarguzashti,
  GameHayvonlarniTop,
  GameKichkinaMashinalar,
  GameMevalarniSarala,
  GamePufakchalarniYor,
  GameQuvnoqPazl,
  GameRanglarniTop,
  GameRaqamlarniOrgan,
  GameSehrliYulduzchalar,
  GameShakllarDunyosi,
} from '../games/GamesAge3to5';
import {
  GameKamalakMinorasi,
  GameKosmikQutqaruv,
  GameMatematikPoyga,
  GameMevaKesuvchi,
  GameOltinXazinaOvchisi,
  GameOrmonLabirinti,
  GameQutiSurish,
  GameRitmBarabani,
  GameSozZanjiri,
  GameXotiraSaroyi,
} from '../games/GamesAge6to9';
import {
  Game2048,
  Game3DCholPoygasi,
  Game3DIlonchaArenasi,
  GameKiberBloklar,
  GameMinaTozalovchi,
  GameQalaHimoyasi,
  GameRekordArkanoid,
  GameSamolyotJangchisi,
  GameSozTopish,
  GameTraektoriyaUstasi,
} from '../games/GamesAge10to15';
import {
  Game3DFazoKreyseri,
  Game3DFazoviyMantiq,
  Game3DPlatformerParkur,
  GameAlgoritmikLabirint,
  GameGrandmasterShaxmat,
  GameIqtisodiyImperiya,
  GameKriptografikKod,
  GameReaksiyaAimArena,
  GameStrategikKartaDuellari,
  GameSudokuMaster,
} from '../games/GamesAge16to20';

interface GameModalPlayerProps {
  game: GameMetadata;
  bestScore: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSaveScore: (gameId: string, finalScore: number) => void;
  onClose: () => void;
}

const GAME_REGISTRY: Record<string, React.FC<GameEngineProps>> = {
  // 3-5 yosh
  '3-5-ranglarni-top': GameRanglarniTop,
  '3-5-hayvonlarni-top': GameHayvonlarniTop,
  '3-5-shakllar-dunyosi': GameShakllarDunyosi,
  '3-5-pufakchalarni-yor': GamePufakchalarniYor,
  '3-5-mevalarni-sarala': GameMevalarniSarala,
  '3-5-kichkina-mashinalar': GameKichkinaMashinalar,
  '3-5-sehrli-yulduzchalar': GameSehrliYulduzchalar,
  '3-5-raqamlarni-organ': GameRaqamlarniOrgan,
  '3-5-dengiz-sarguzashti': GameDengizSarguzashti,
  '3-5-quvnoq-pazl': GameQuvnoqPazl,
  // 6-9 yosh
  '6-9-oltin-xazina-ovchisi': GameOltinXazinaOvchisi,
  '6-9-matematik-poyga': GameMatematikPoyga,
  '6-9-xotira-saroyi': GameXotiraSaroyi,
  '6-9-soz-zanjiri': GameSozZanjiri,
  '6-9-kosmik-qutqaruv': GameKosmikQutqaruv,
  '6-9-ormon-labirinti': GameOrmonLabirinti,
  '6-9-ritm-barabani': GameRitmBarabani,
  '6-9-meva-kesuvchi': GameMevaKesuvchi,
  '6-9-minoalar-boshqotirmasi': GameQutiSurish,
  '6-9-kamalak-minorasi': GameKamalakMinorasi,
  // 10-15 yosh
  '10-15-3d-chol-poygasi': Game3DCholPoygasi,
  '10-15-3d-iloncha-arenasi': Game3DIlonchaArenasi,
  '10-15-qala-himoyasi': GameQalaHimoyasi,
  '10-15-kiber-bloklar': GameKiberBloklar,
  '10-15-neon-tennis': GameRekordArkanoid,
  '10-15-mantiqiy-zanjir-2048': Game2048,
  '10-15-soz-topish': GameSozTopish,
  '10-15-samolyot-jangchisi': GameSamolyotJangchisi,
  '10-15-fizika-koprigi': GameTraektoriyaUstasi,
  '10-15-mina-tozalovchi': GameMinaTozalovchi,
  // 16-20 yosh
  '16-20-grandmaster-shaxmat': GameGrandmasterShaxmat,
  '16-20-3d-fazo-kreyseri': Game3DFazoKreyseri,
  '16-20-3d-fazoviy-mantiq': Game3DFazoviyMantiq,
  '16-20-strategik-karta-duellari': GameStrategikKartaDuellari,
  '16-20-algoritmik-labirint': GameAlgoritmikLabirint,
  '16-20-reaksiya-aim-arena': GameReaksiyaAimArena,
  '16-20-sudoku-master': GameSudokuMaster,
  '16-20-iqtisodiy-imperiya': GameIqtisodiyImperiya,
  '16-20-kriptografik-kod': GameKriptografikKod,
  '16-20-3d-platformer-parkur': Game3DPlatformerParkur,
};

export const GameModalPlayer: React.FC<GameModalPlayerProps> = ({
  game,
  bestScore,
  soundEnabled,
  onToggleSound,
  onSaveScore,
  onClose,
}) => {
  const [liveScore, setLiveScore] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  const GameComponent = GAME_REGISTRY[game.id];

  const handleComplete = (finalScore: number) => {
    onSaveScore(game.id, finalScore);
  };

  const handleBack = () => {
    if (liveScore > 0) {
      onSaveScore(game.id, liveScore);
    }
    soundFX.playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex flex-col overflow-y-auto p-3 sm:p-6">
      <div className="max-w-5xl w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Game Arena Top Bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-semibold cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Orqaga
            </button>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
                {game.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {game.category} · {game.ageGroup} yosh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono-tabular">
              <span className="text-slate-500 dark:text-slate-400">Ball: </span>
              <span className="font-bold text-slate-900 dark:text-white">{liveScore}</span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-500 dark:text-slate-400">Rekord: </span>
              <span className="font-bold text-teal-600 dark:text-teal-400">
                {Math.max(bestScore, liveScore)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp((h) => !h)}
              aria-label="O‘yin qoidalari"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Ovozni o‘chirish' : 'Ovozni yoqish'}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setLiveScore(0);
                setInstanceKey((k) => k + 1);
              }}
              aria-label="O‘yinni qayta boshlash"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Qayta boshlash</span>
            </button>
          </div>
        </div>

        {/* Instructions Banner */}
        {showHelp && (
          <div className="px-6 py-4 bg-teal-50 dark:bg-teal-950/40 border-b border-teal-200 dark:border-teal-900 text-sm text-slate-800 dark:text-slate-200 space-y-1">
            <p>
              <span className="font-bold">Qoida:</span> {game.instructions}
            </p>
            <p>
              <span className="font-bold">Boshqaruv:</span> {game.controls}
            </p>
          </div>
        )}

        {/* Active Game Stage */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/60">
          {GameComponent ? (
            <GameComponent
              key={instanceKey}
              soundEnabled={soundEnabled}
              onScoreChange={setLiveScore}
              onGameComplete={handleComplete}
            />
          ) : (
            <div className="p-12 text-center text-slate-500">
              O‘yin yuklanmoqda...
            </div>
          )}
        </div>

        {/* Subtle Control Guide Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>Boshqaruv: {game.controls}</span>
          <span>{game.instructions}</span>
        </div>
      </div>
    </div>
  );
};
