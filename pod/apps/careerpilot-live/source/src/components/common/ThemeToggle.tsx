import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { isDark, setTheme } = useTheme();

  const base =
    'p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] active:scale-95';
  const active =
    'bg-[color-mix(in_srgb,var(--accent-primary)_18%,transparent)] text-[var(--accent-primary)]';
  const idle = 'ui-icon-btn';

  return (
    <div className="theme-control inline-flex items-center gap-0.5 rounded-xl p-1" role="group" aria-label="Theme">
      <button
        type="button"
        aria-label="Light theme"
        aria-pressed={!isDark}
        onClick={() => setTheme('light')}
        className={`${base} ${!isDark ? active : idle}`}
      >
        <Sun className="w-4 h-4" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        aria-label="Dark theme"
        aria-pressed={isDark}
        onClick={() => setTheme('dark')}
        className={`${base} ${isDark ? active : idle}`}
      >
        <Moon className="w-4 h-4" strokeWidth={2.25} />
      </button>
    </div>
  );
};
