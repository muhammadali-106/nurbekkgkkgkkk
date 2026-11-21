import React from 'react';
import {
  Apple,
  Box,
  Car,
  Castle,
  Code2,
  Compass,
  Crosshair,
  Crown,
  Disc,
  Fish,
  Gamepad2,
  Grid2X2,
  Hash,
  KeyRound,
  Layers,
  MapPin,
  Palette,
  Plane,
  Puzzle,
  Rocket,
  Search,
  Shapes,
  Sparkles,
  Swords,
  Target,
  Trophy,
} from 'lucide-react';
import { GameMetadata } from '../types/platform';

interface GameThumbnailProps {
  game: GameMetadata;
}

export const GameThumbnail: React.FC<GameThumbnailProps> = ({ game }) => {
  const renderIcon = () => {
    const cls = 'w-11 h-11 text-white drop-shadow-sm';
    switch (game.iconKey) {
      case 'palette':
        return <Palette className={cls} />;
      case 'paw':
        return <Sparkles className={cls} />;
      case 'shapes':
        return <Shapes className={cls} />;
      case 'bubbles':
        return <Disc className={cls} />;
      case 'apple':
        return <Apple className={cls} />;
      case 'car':
      case 'racing3d':
        return <Car className={cls} />;
      case 'star':
        return <Sparkles className={cls} />;
      case 'numbers':
        return <Hash className={cls} />;
      case 'fish':
        return <Fish className={cls} />;
      case 'puzzle':
        return <Puzzle className={cls} />;
      case 'treasure':
        return <Compass className={cls} />;
      case 'mathrace':
        return <Trophy className={cls} />;
      case 'cards':
        return <Layers className={cls} />;
      case 'letters':
      case 'wordsearch':
        return <Search className={cls} />;
      case 'rocket':
      case 'space3d':
        return <Rocket className={cls} />;
      case 'maze':
        return <MapPin className={cls} />;
      case 'drum':
        return <Disc className={cls} />;
      case 'slice':
        return <Swords className={cls} />;
      case 'box':
      case 'voxel3d':
        return <Box className={cls} />;
      case 'tower':
        return <Layers className={cls} />;
      case 'snake3d':
        return <Gamepad2 className={cls} />;
      case 'castle':
        return <Castle className={cls} />;
      case 'tetris':
      case 'grid2048':
      case 'sudoku':
        return <Grid2X2 className={cls} />;
      case 'arcade':
        return <Target className={cls} />;
      case 'jet':
        return <Plane className={cls} />;
      case 'trajectory':
        return <Crosshair className={cls} />;
      case 'mines':
        return <Target className={cls} />;
      case 'chess':
      case 'crown':
        return <Crown className={cls} />;
      case 'deck':
        return <Swords className={cls} />;
      case 'code':
        return <Code2 className={cls} />;
      case 'crosshair':
        return <Crosshair className={cls} />;
      case 'cipher':
        return <KeyRound className={cls} />;
      case 'parkour3d':
        return <Trophy className={cls} />;
      default:
        return <Gamepad2 className={cls} />;
    }
  };

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${game.accentHex} 0%, ${game.secondaryHex} 100%)`,
      }}
    >
      {/* Clean geometric architectural motif */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 320 200"
        fill="none"
      >
        <circle cx="275" cy="35" r="70" stroke="white" strokeWidth="2" />
        <circle cx="45" cy="175" r="55" stroke="white" strokeWidth="2" />
        <path d="M0 150 L120 40 L240 160 L320 75" stroke="white" strokeWidth="1.5" />
      </svg>

      <div className="relative z-10 w-20 h-20 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
        {renderIcon()}
      </div>

      {game.is3D && (
        <span className="absolute top-3 left-3 px-2 py-0.5 text-[11px] font-mono font-bold tracking-wide text-white bg-slate-950/60 rounded">
          3D
        </span>
      )}
    </div>
  );
};
