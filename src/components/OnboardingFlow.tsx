import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { AGE_GROUPS } from '../data/gamesCatalog';
import { AgeGroup, AgeGroupInfo, UserProfile } from '../types/platform';
import { soundFX } from '../utils/sound';

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'age' | 'name' | 'welcome'>('age');
  const [selectedAge, setSelectedAge] = useState<AgeGroupInfo | null>(null);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSelectAge = (group: AgeGroupInfo) => {
    soundFX.playPop(540);
    setSelectedAge(group);
    setStep('name');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 2) {
      soundFX.playError();
      setError('Iltimos, kamida 2 ta harfdan iborat ism kiriting.');
      return;
    }
    soundFX.playVictory();
    setError('');
    setStep('welcome');
    window.setTimeout(() => {
      if (selectedAge) {
        onComplete({
          nickname: trimmed,
          ageGroup: selectedAge.id as AgeGroup,
          createdAt: new Date().toISOString(),
        });
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between px-4 py-8 sm:px-8">
      <div className="max-w-6xl w-full mx-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 mb-8">
          <div className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            UZBEK <span className="text-teal-600 dark:text-teal-400">GAMES</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            O‘zbekistonning zamonaviy 3D o‘yinlar maydoni
          </div>
        </div>

        {step === 'age' && (
          <div className="animate-gentle-pop">
            <div className="max-w-2xl mb-8">
              <p className="text-sm font-semibold text-teal-700 dark:text-teal-400 mb-2">
                1-qadam · Yosh toifasini tanlash
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight text-balance">
                Siz necha yoshdasiz?
              </h1>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Har bir yosh toifasi uchun maxsus tanlangan, xavfsiz va qiziqarli 10 tadan o‘yin kutubxonasi ochiladi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {AGE_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleSelectAge(group)}
                  className="group relative text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 cursor-pointer flex flex-col"
                >
                  {/* Animated subtle aura layer */}
                  <div
                    className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800"
                    style={{
                      backgroundImage: `radial-gradient(circle at 20% 20%, ${group.accentColor}28, transparent 70%)`,
                    }}
                  >
                    <img
                      src={group.imagePath}
                      alt={group.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <span className="font-display text-2xl font-extrabold text-white tracking-tight">
                        {group.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        {group.subtitle}
                      </h2>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {group.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-700 dark:text-teal-400">
                      <span>{group.badgeText}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'name' && selectedAge && (
          <div className="max-w-lg mx-auto my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm animate-gentle-pop">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setStep('age');
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Yoshni qayta tanlash ({selectedAge.label})
            </button>

            <p className="text-sm font-semibold text-teal-700 dark:text-teal-400 mb-1">
              2-qadam · O‘yinchi profili
            </p>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
              Ismingiz nima?
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Natijalaringiz va yutuqlaringiz shu nom bilan qurilmangizda saqlanadi.
            </p>

            <form onSubmit={handleNameSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="nickname-input"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Ismingiz yoki o‘yin taxallusingiz
                </label>
                <input
                  id="nickname-input"
                  type="text"
                  maxLength={24}
                  autoFocus
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Masalan: Jasurbek"
                  className="w-full px-4 py-3 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                {error && (
                  <p className="mt-2 text-sm text-rose-600 dark:text-rose-400 font-medium">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <span>
                  Bolalar xavfsizligi: telefon raqami, elektron pochta yoki uy manzili so‘ralmaydi. Faqat taxallus kiritiladi.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-display font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Davom etish
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {step === 'welcome' && selectedAge && (
          <div className="max-w-lg mx-auto my-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-10 shadow-sm animate-gentle-pop">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-5">
              <Check className="w-8 h-8" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white text-balance">
              Xush kelibsiz, {nickname.trim()}!
            </h1>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
              {selectedAge.label} toifasidagi 10 ta maxsus o‘yin siz uchun tayyorlanmoqda...
            </p>
          </div>
        )}
      </div>

      <footer className="max-w-6xl w-full mx-auto pt-8 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <span>UZBEK GAMES · O‘zbek tilidagi onlayn o‘yinlar platformasi</span>
        <span>Xavfsiz va bepul o‘yin kutubxonasi</span>
      </footer>
    </div>
  );
};
