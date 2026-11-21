import { useEffect, useState } from 'react';
import { AchievementsView } from './components/AchievementsView';
import { DashboardLobby } from './components/DashboardLobby';
import { GameModalPlayer } from './components/GameModalPlayer';
import { Navbar } from './components/Navbar';
import { OnboardingFlow } from './components/OnboardingFlow';
import { SettingsView } from './components/SettingsView';
import {
  GameMetadata,
  GameScoreEntry,
  PlatformSettings,
  PlatformView,
  UserProfile,
} from './types/platform';
import { soundFX } from './utils/sound';
import {
  loadFavorites,
  loadScores,
  loadSettings,
  loadUserProfile,
  recordGameScore,
  resetAllLocalData,
  saveSettings,
  saveUserProfile,
  toggleFavoriteGame,
} from './utils/storage';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() => loadUserProfile());
  const [settings, setSettings] = useState<PlatformSettings>(() => loadSettings());
  const [scores, setScores] = useState<Record<string, GameScoreEntry>>(() => loadScores());
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [currentView, setCurrentView] = useState<PlatformView>('lobby');
  const [activeGame, setActiveGame] = useState<GameMetadata | null>(null);

  useEffect(() => {
    soundFX.setEnabled(settings.soundEnabled);
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [settings]);

  const handleCompleteOnboarding = (newProfile: UserProfile) => {
    saveUserProfile(newProfile);
    setProfile(newProfile);
    setCurrentView('lobby');
  };

  const handleUpdateProfile = (nextProfile: UserProfile) => {
    saveUserProfile(nextProfile);
    setProfile(nextProfile);
  };

  const handleUpdateSettings = (nextSettings: PlatformSettings) => {
    saveSettings(nextSettings);
    setSettings(nextSettings);
  };

  const handleSaveScore = (gameId: string, finalScore: number) => {
    const updated = recordGameScore(gameId, finalScore);
    setScores(updated);
  };

  const handleToggleFavorite = (gameId: string) => {
    const next = toggleFavoriteGame(gameId);
    setFavorites(next);
  };

  const handleResetAll = () => {
    resetAllLocalData();
    setScores({});
    setFavorites([]);
    setActiveGame(null);
    setProfile(null);
    setCurrentView('lobby');
  };

  if (!profile) {
    return <OnboardingFlow onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar
        profile={profile}
        currentView={currentView}
        onNavigate={(v) => {
          soundFX.playClick();
          setCurrentView(v);
        }}
      />

      <div className="flex-1">
        {currentView === 'lobby' && (
          <DashboardLobby
            profile={profile}
            scores={scores}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onLaunchGame={(game) => setActiveGame(game)}
          />
        )}

        {currentView === 'achievements' && (
          <AchievementsView
            profile={profile}
            scores={scores}
            onLaunchGame={(game) => setActiveGame(game)}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            profile={profile}
            settings={settings}
            onUpdateProfile={handleUpdateProfile}
            onUpdateSettings={handleUpdateSettings}
            onResetAll={handleResetAll}
          />
        )}
      </div>

      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>UZBEK GAMES · O‘zbek tilidagi zamonaviy 3D o‘yinlar platformasi</span>
          <span>Barcha natijalar qurilmangizda xavfsiz saqlanadi</span>
        </div>
      </footer>

      {activeGame && (
        <GameModalPlayer
          game={activeGame}
          bestScore={scores[activeGame.id]?.bestScore ?? 0}
          soundEnabled={settings.soundEnabled}
          onToggleSound={() => {
            const next = !settings.soundEnabled;
            handleUpdateSettings({ ...settings, soundEnabled: next });
          }}
          onSaveScore={handleSaveScore}
          onClose={() => setActiveGame(null)}
        />
      )}
    </div>
  );
}
