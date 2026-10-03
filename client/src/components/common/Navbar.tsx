import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCareer } from '../../context/CareerContext';
import { Compass, ChevronRight, CheckCircle2, Shield, LogOut } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const { readinessScore, activeJob, plan, switchTier, quota, hasResume } = useCareer();
  const isPro = plan === 'pro' || plan === 'campus';

  return (
    <header className="h-16 bg-[var(--surface)] border-b border-[var(--border-subtle)] px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-6">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center space-x-2.5 text-left focus:outline-none group"
        >
          <div className="btn-accent w-9 h-9 rounded-xl flex items-center justify-center text-white group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-bold text-lg text-[#171717] tracking-tight flex items-center gap-1.5">
              CareerPilot
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-[#62A7FF]/10 text-[#62A7FF]">
                Lemma SaaS
              </span>
            </span>
            <p className="text-[11px] text-[#6B6B6B] -mt-0.5 hidden sm:block">
              Your career, finally with a plan.
            </p>
          </div>
        </button>

        {hasResume && activeJob && (
          <div
            onClick={() => setCurrentTab('jobs')}
            className="ui-chip hidden md:flex items-center space-x-2 rounded-full px-3 py-1 cursor-pointer"
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B6B6B]">Target:</span>
            <span className="text-xs font-semibold text-[#171717]">{activeJob.roleTitle}</span>
            <span className="text-xs text-[#6B6B6B]">at {activeJob.company}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {plan === 'campus' && (
          <button
            onClick={() => setCurrentTab('campus')}
            className={`hidden sm:flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              currentTab === 'campus'
                ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>Campus Hub</span>
          </button>
        )}

        <ThemeToggle />

        <ToggleSwitch
          checked={isPro}
          labelOff="Free"
          labelOn="Pro"
          ariaLabel="Toggle Pro plan"
          onChange={(next) => {
            void switchTier(next ? 'pro' : 'free');
          }}
        />

        <div
          onClick={() => setCurrentTab(hasResume ? 'match' : 'resume')}
          className="ui-chip ui-chip--accent flex items-center space-x-2.5 rounded-xl px-3.5 py-1.5 cursor-pointer group"
        >
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
              Readiness
            </span>
            <span className="ui-accent-hover-text font-heading font-bold text-sm">
              {hasResume && readinessScore > 0 ? `${readinessScore}%` : 'Pending'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white border border-[#E7E7E4] flex items-center justify-center text-xs font-bold text-[#16A34A] shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
        </div>

        {quota && (
          <div className="hidden xl:block text-[10px] text-[#6B6B6B]">
            Matches {quota.jobMatches.used}/{quota.jobMatches.limit > 100 ? '∞' : quota.jobMatches.limit}
          </div>
        )}

        <div className="ui-divider flex items-center space-x-2 pl-2 border-l">
          <div
            onClick={() => setCurrentTab('profile')}
            className="ui-icon-btn flex items-center space-x-2 p-1.5 rounded-lg cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs uppercase">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <p className="font-semibold text-[#171717] leading-tight">{user?.name || 'Archi Jain'}</p>
              <p className="text-[11px] text-[#6B6B6B] leading-tight">{user?.targetRole || 'Full Stack'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="flex items-center space-x-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer border border-transparent hover:border-red-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
