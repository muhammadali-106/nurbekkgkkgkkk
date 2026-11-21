import React from 'react';
import { PlatformView, UserProfile } from '../types/platform';

interface NavbarProps {
  profile: UserProfile;
  currentView: PlatformView;
  onNavigate: (view: PlatformView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  currentView,
  onNavigate,
}) => {
  const navItems: { id: PlatformView; label: string }[] = [
    { id: 'lobby', label: 'Bosh sahifa' },
    { id: 'lobby', label: 'O‘yinlar' },
    { id: 'achievements', label: 'Yutuqlar' },
    { id: 'settings', label: 'Sozlamalar' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('lobby')}
          className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          UZBEK <span className="text-teal-600 dark:text-teal-400">GAMES</span>
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Asosiy menyu"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {navItems.map((item, idx) => {
            const isActive =
              (idx === 0 && currentView === 'lobby') ||
              (idx === 2 && currentView === 'achievements') ||
              (idx === 3 && currentView === 'settings');
            return (
              <button
                key={`${item.label}-${idx}`}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                  isActive
                    ? 'border-teal-600 text-slate-900 dark:text-white dark:border-teal-400'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer max-w-[180px] truncate"
          >
            {profile.nickname} ({profile.ageGroup})
          </button>
        </div>
      </div>

      {/* Compact mobile nav row */}
      <nav
        aria-label="Mobil menyu"
        className="flex md:hidden items-center justify-around border-t border-slate-100 dark:border-slate-800 py-2 px-2 text-xs font-medium text-slate-600 dark:text-slate-300"
      >
        <button
          type="button"
          onClick={() => onNavigate('lobby')}
          className={`px-3 py-1.5 whitespace-nowrap shrink-0 ${
            currentView === 'lobby'
              ? 'text-teal-700 dark:text-teal-400 font-semibold'
              : ''
          }`}
        >
          O‘yinlar
        </button>
        <button
          type="button"
          onClick={() => onNavigate('achievements')}
          className={`px-3 py-1.5 whitespace-nowrap shrink-0 ${
            currentView === 'achievements'
              ? 'text-teal-700 dark:text-teal-400 font-semibold'
              : ''
          }`}
        >
          Yutuqlar
        </button>
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`px-3 py-1.5 whitespace-nowrap shrink-0 ${
            currentView === 'settings'
              ? 'text-teal-700 dark:text-teal-400 font-semibold'
              : ''
          }`}
        >
          Sozlamalar
        </button>
      </nav>
    </header>
  );
};
