import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelOff: string;
  labelOn: string;
  ariaLabel?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  labelOff,
  labelOn,
  ariaLabel,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel ?? `${labelOff} or ${labelOn}`}
    onClick={() => onChange(!checked)}
    className="theme-control inline-flex items-center gap-2 rounded-xl p-1 text-xs font-bold cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
  >
    <span
      className={`px-2 py-1 rounded-lg transition-colors hover:bg-[var(--control-hover)] active:bg-[var(--surface-elevated)] ${
        !checked ? 'text-[var(--text-primary,#171717)]' : 'text-[var(--text-secondary,#6B6B6B)]'
      }`}
    >
      {labelOff}
    </span>
    <span
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-[var(--accent-primary,#62A7FF)]' : 'bg-[var(--control-track,#D5D5D0)]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-[var(--surface-elevated)] shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </span>
    <span
      className={`px-2 py-1 rounded-lg transition-colors hover:bg-[var(--control-hover)] active:bg-[var(--surface-elevated)] ${
        checked ? 'text-[var(--accent-primary,#62A7FF)]' : 'text-[var(--text-secondary,#6B6B6B)]'
      }`}
    >
      {labelOn}
    </span>
  </button>
);
