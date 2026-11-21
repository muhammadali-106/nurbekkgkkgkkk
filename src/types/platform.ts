export type AgeGroup = '3-5' | '6-9' | '10-15' | '16-20';

export type GameCategory =
  | 'Barchasi'
  | '3D O‘yinlar'
  | 'Ta’lim'
  | 'Mantiq'
  | 'Poyga'
  | 'Sarguzasht'
  | 'Strategiya'
  | 'Arkada';

export interface UserProfile {
  nickname: string;
  ageGroup: AgeGroup;
  createdAt: string;
}

export interface PlatformSettings {
  soundEnabled: boolean;
  darkMode: boolean;
}

export interface GameScoreEntry {
  bestScore: number;
  playsCount: number;
  lastPlayedAt: string;
}

export interface GameMetadata {
  id: string;
  title: string;
  ageGroup: AgeGroup;
  category: Exclude<GameCategory, 'Barchasi'>;
  shortDesc: string;
  instructions: string;
  controls: string;
  duration: string;
  is3D: boolean;
  accentHex: string;
  secondaryHex: string;
  iconKey: string;
}

export interface AgeGroupInfo {
  id: AgeGroup;
  label: string;
  subtitle: string;
  description: string;
  imagePath: string;
  accentColor: string;
  badgeText: string;
}

export type PlatformView = 'lobby' | 'achievements' | 'settings';

export interface GameEngineProps {
  onScoreChange: (score: number) => void;
  onGameComplete: (finalScore: number) => void;
  soundEnabled: boolean;
}
