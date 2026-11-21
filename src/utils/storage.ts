import { GameScoreEntry, PlatformSettings, UserProfile } from '../types/platform';

const PROFILE_KEY = 'uzbek_games_profile_v1';
const SETTINGS_KEY = 'uzbek_games_settings_v1';
const SCORES_KEY = 'uzbek_games_scores_v1';
const FAVORITES_KEY = 'uzbek_games_favorites_v1';

export function loadUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (parsed && parsed.nickname && parsed.ageGroup) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage quota errors
  }
}

export function loadSettings(): PlatformSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { soundEnabled: true, darkMode: false };
    const parsed = JSON.parse(raw) as Partial<PlatformSettings>;
    return {
      soundEnabled: parsed.soundEnabled ?? true,
      darkMode: parsed.darkMode ?? false,
    };
  } catch {
    return { soundEnabled: true, darkMode: false };
  }
}

export function saveSettings(settings: PlatformSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadScores(): Record<string, GameScoreEntry> {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, GameScoreEntry>;
  } catch {
    return {};
  }
}

export function recordGameScore(
  gameId: string,
  score: number
): Record<string, GameScoreEntry> {
  const scores = loadScores();
  const prev = scores[gameId];
  const updated: Record<string, GameScoreEntry> = {
    ...scores,
    [gameId]: {
      bestScore: Math.max(prev?.bestScore ?? 0, score),
      playsCount: (prev?.playsCount ?? 0) + 1,
      lastPlayedAt: new Date().toISOString(),
    },
  };
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteGame(gameId: string): string[] {
  const current = loadFavorites();
  const next = current.includes(gameId)
    ? current.filter((id) => id !== gameId)
    : [...current, gameId];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function resetAllLocalData(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(SCORES_KEY);
    localStorage.removeItem(FAVORITES_KEY);
  } catch {
    // ignore
  }
}
