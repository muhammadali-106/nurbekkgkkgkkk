import React, { useState } from 'react';
import { Check, Moon, RotateCcw, Sun, Volume2, VolumeX } from 'lucide-react';
import { AGE_GROUPS } from '../data/gamesCatalog';
import { AgeGroup, PlatformSettings, UserProfile } from '../types/platform';
import { soundFX } from '../utils/sound';

interface SettingsViewProps {
  profile: UserProfile;
  settings: PlatformSettings;
  onUpdateProfile: (next: UserProfile) => void;
  onUpdateSettings: (next: PlatformSettings) => void;
  onResetAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onResetAll,
}) => {
  const [nickname, setNickname] = useState(profile.nickname);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(profile.ageGroup);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nickname.trim();
    if (clean.length < 2) {
      soundFX.playError();
      return;
    }
    soundFX.playSuccess();
    onUpdateProfile({
      ...profile,
      nickname: clean,
      ageGroup,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
          Profil va platforma boshqaruvi
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-slate-900 dark:text-white">
          Sozlamalar
        </h1>
      </div>

      {/* Profile & Age Group Change */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Profil va yosh toifasi
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Yosh toifasini o‘zgartirsangiz, o‘yinlar kutubxonasi darhol shu yoshga moslanadi.
          </p>
        </div>

        <div>
          <label
            htmlFor="settings-nickname"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Foydalanuvchi ismi (taxallus)
          </label>
          <input
            id="settings-nickname"
            type="text"
            maxLength={24}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">
            Yosh toifasini tanlang
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGE_GROUPS.map((g) => {
              const active = ageGroup === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setAgeGroup(g.id);
                  }}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 dark:border-teal-400'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-slate-900 dark:text-white">
                      {g.label}
                    </span>
                    {active && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {g.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          >
            O‘zgarishlarni saqlash
          </button>
          {savedNotice && (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Profil muvaffaqiyatli yangilandi!
            </span>
          )}
        </div>
      </form>

      {/* Sound & Theme Preferences */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Ovoz va ko‘rinish
        </h2>

        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <div className="font-medium text-slate-900 dark:text-white">
                O‘yin tovushlari
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Tugma va g‘alaba tovush effektlarini yoqish yoki o‘chirish
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !settings.soundEnabled;
              soundFX.setEnabled(next);
              if (next) soundFX.playPop(580);
              onUpdateSettings({ ...settings, soundEnabled: next });
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              settings.soundEnabled
                ? 'bg-teal-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {settings.soundEnabled ? 'Yoqilgan' : 'O‘chirilgan'}
          </button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            {settings.darkMode ? (
              <Moon className="w-5 h-5 text-amber-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <div className="font-medium text-slate-900 dark:text-white">
                Tungi rejim (Dark Mode)
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Kechki paytda ko‘zga qulay qorong‘u fon
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onUpdateSettings({ ...settings, darkMode: !settings.darkMode });
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              settings.darkMode
                ? 'bg-slate-800 text-amber-300 border border-slate-700'
                : 'bg-slate-200 text-slate-800'
            }`}
          >
            {settings.darkMode ? 'Tungi rejim' : 'Kunduzgi rejim'}
          </button>
        </div>
      </section>

      {/* Reset Local Profile */}
      <section className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Barcha ma’lumotlarni tozalash
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Joriy ism, yosh toifasi va barcha o‘yin rekordlarini o‘chirib, boshidan boshlash.
          </p>
        </div>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            Qayta boshlash
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onResetAll();
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Ha, tozalash
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Bekor qilish
            </button>
          </div>
        )}
      </section>
    </main>
  );
};
