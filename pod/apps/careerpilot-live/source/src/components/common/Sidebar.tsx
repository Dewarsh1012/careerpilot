import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  FileText,
  Briefcase,
  GitCompare,
  Milestone,
  MessageSquareCode,
  KanbanSquare,
  Settings,
  Sparkles,
  ArrowUpRight,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { useCareer } from '../../context/CareerContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { activeMatch, careerPlan } = useCareer();
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Career Profile', icon: UserCheck },
    { id: 'resume', label: 'Resume Intelligence', icon: FileText, badge: 'AI' },
    { id: 'jobs', label: 'Target Jobs', icon: Briefcase },
    {
      id: 'match',
      label: 'Match & Skill Gaps',
      icon: GitCompare,
      badge: activeMatch ? `${activeMatch.matchScore}%` : undefined,
      badgeColor: 'bg-[#16A34A]/10 text-[#16A34A]',
    },
    {
      id: 'roadmap',
      label: 'Career Plan',
      icon: Milestone,
      badge: careerPlan ? `${careerPlan.progressPercent}%` : undefined,
      badgeColor: 'bg-[#62A7FF]/10 text-[#62A7FF]',
    },
    { id: 'interview', label: 'AI Interview Coach', icon: MessageSquareCode, badge: 'Practice' },
    { id: 'applications', label: 'Job Tracker', icon: KanbanSquare },
    {
      id: 'campus',
      label: 'Campus & Recruiters',
      icon: GraduationCap,
      badge: 'B2B',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border-subtle)] flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none shrink-0">
      {/* Navigation Links */}
      <div className="p-3.5 space-y-1">
        <div className="px-3 py-2 text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
          Career Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold group ${
                isActive ? 'ui-nav-btn ui-nav-btn--active' : 'ui-nav-btn'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeColor || 'bg-[#F8F8F6] border border-[#E7E7E4] text-[#6B6B6B]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Persistent Bottom Promo / Info Card */}
      <div className="ui-divider p-3.5 border-t">
        <div className="p-3 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] space-y-2">
          <div className="flex items-center space-x-2 text-[#62A7FF]">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold font-heading">Lemma Agent Layer</span>
          </div>
          <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
            Connected workflows: Resume → Job → Skill Gap → Plan → Interview.
          </p>
          <button
            onClick={() => setCurrentTab('match')}
            className="ui-sidebar-promo-btn w-full flex items-center justify-center space-x-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg"
          >
            <span>View Journey Map</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={logout}
          title="Sign out of CareerPilot"
          className="w-full mt-2 flex items-center justify-center space-x-2 py-2 px-3 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
