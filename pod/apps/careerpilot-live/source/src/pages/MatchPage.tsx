import React, { useState } from 'react';
import { useCareer } from '../context/CareerContext';
import { JourneyBar } from '../components/common/JourneyBar';
import { NextMoveCard } from '../components/common/NextMoveCard';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Briefcase,
  GitCompare,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Milestone,
  Check,
  RefreshCw,
} from 'lucide-react';
import { AtsResumeStudio } from '../components/studio/AtsResumeStudio';

interface MatchPageProps {
  setCurrentTab: (tab: string) => void;
}

export const MatchPage: React.FC<MatchPageProps> = ({ setCurrentTab }) => {
  const { activeJob, activeMatch, readinessScore, selectJobAndMatch, loading } = useCareer();
  const [recomputing, setRecomputing] = useState(false);

  const matched = activeMatch?.matchedSkills || [];
  const partial = activeMatch?.partialSkills || [];
  const missing = activeMatch?.missingSkills || [];

  const handleRefreshMatch = async () => {
    if (!activeJob) return;
    setRecomputing(true);
    try {
      await selectJobAndMatch(activeJob.id);
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#62A7FF] uppercase tracking-wider">
              Profile ↔ Job Comparison
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-[#171717] tracking-tight">
            Match Intelligence & Skill Gap Analysis
          </h1>
          <p className="text-xs text-[#6B6B6B]">
            Comparing your resume telemetry against <strong className="text-[#171717]">{activeJob?.roleTitle || 'Target Role'}</strong> at <strong className="text-[#171717]">{activeJob?.company || 'Stripe'}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefreshMatch}
            disabled={recomputing}
            className="px-3 py-2 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-xs font-bold text-[#171717] rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
            <span>Re-evaluate Match</span>
          </button>
          <button
            onClick={() => setCurrentTab('roadmap')}
            className="px-4 py-2 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            <span>Build Career Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Signature Journey Bar */}
      <JourneyBar currentStage="gap" onStageClick={(tab) => setCurrentTab(tab)} />

      {/* Standout Feature: "Next Move" */}
      <NextMoveCard
        title={activeMatch?.nextMove || 'Address Docker & Containerization Gap'}
        actionText="Immediate Next Move"
        category="Highest Weight Missing Skill"
        description="Closing this gap increases your match score from 78% to 84% and prepares you for Stripe's technical review."
        ctaLabel="Go to Career Plan"
        onAction={() => setCurrentTab('roadmap')}
      />

      {/* Animated Skill Match Visualization (PRD Section 36 & 18) */}
      <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4]">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-[#62A7FF]" />
            <div>
              <h3 className="font-heading font-bold text-base text-[#171717]">
                Live Side-by-Side Skill Match Matrix
              </h3>
              <p className="text-[11px] text-[#6B6B6B]">
                Resume Telemetry (Left) mapped against Job Requirements (Right).
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-heading font-extrabold text-2xl text-[#171717]">
              {readinessScore}% Match
            </span>
            <p className="text-[10px] text-[#16A34A] font-semibold">Competitive Applicant</p>
          </div>
        </div>

        {/* Visual Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Left Column: Your Profile */}
          <div className="p-4 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
              <span>YOUR CAREER PROFILE</span>
              <span className="text-[10px] text-[#6B6B6B]">Parsed Resume</span>
            </div>
            <div className="space-y-2">
              {matched.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E7E7E4] text-xs font-semibold">
                  <span className="text-[#171717]">{s.name}</span>
                  <span className="text-[10px] text-[#16A34A] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              ))}
              {partial.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-200 text-xs font-semibold">
                  <span className="text-amber-900">{s.name}</span>
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Related Stack
                  </span>
                </div>
              ))}
              {missing.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2 rounded-lg bg-red-50/40 border border-red-200 text-xs font-semibold">
                  <span className="text-red-900">{s.name}</span>
                  <span className="text-[10px] text-red-700 font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Missing
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Job Requirements */}
          <div className="p-4 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
              <span>TARGET JOB REQUIREMENTS</span>
              <span className="text-[10px] text-[#6B6B6B]">{activeJob?.company || 'Stripe'} Criteria</span>
            </div>
            <div className="space-y-2">
              {matched.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200 text-xs font-semibold">
                  <span className="text-green-950">{s.name}</span>
                  <span className="text-[10px] text-green-700 font-bold">Requirement Met ✓</span>
                </div>
              ))}
              {partial.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold">
                  <span className="text-amber-950">{s.name}</span>
                  <span className="text-[10px] text-amber-800 font-bold">Needs Production Depth ⚠</span>
                </div>
              ))}
              {missing.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold">
                  <span className="text-red-950">{s.name}</span>
                  <span className="text-[10px] text-red-800 font-bold">Mandatory Skill Gate ❌</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Skill Breakdown Tabs (PRD Section 13 & 19) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Matched Skills */}
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
            <h4 className="font-heading font-bold text-xs text-[#16A34A] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Matched Skills ({matched.length})
            </h4>
          </div>
          <div className="space-y-2">
            {matched.map((s) => (
              <div key={s.name} className="p-3 rounded-xl bg-green-50/40 border border-green-200/60 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-green-950">{s.name}</strong>
                  <span className="text-[9px] font-bold text-green-700 bg-white px-1.5 py-0.5 rounded border border-green-200">
                    {s.category}
                  </span>
                </div>
                <p className="text-[11px] text-green-900/80 leading-relaxed">{s.evidence}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partial Skills */}
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
            <h4 className="font-heading font-bold text-xs text-[#D97706] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Partial Matches ({partial.length})
            </h4>
          </div>
          <div className="space-y-2">
            {partial.map((s) => (
              <div key={s.name} className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/60 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-amber-950">{s.name}</strong>
                  <span className="text-[9px] font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded border border-amber-200">
                    {s.requiredLevel}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6B6B] leading-relaxed">{s.gapExplanation}</p>
                <p className="text-[10px] text-amber-800 font-semibold pt-1">
                  💡 {s.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
            <h4 className="font-heading font-bold text-xs text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              Missing Skills ({missing.length})
            </h4>
          </div>
          <div className="space-y-2">
            {missing.map((s) => (
              <div key={s.name} className="p-3 rounded-xl bg-red-50/40 border border-red-200/60 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-red-950">{s.name}</strong>
                  <span className="text-[9px] font-bold text-red-700 bg-white px-1.5 py-0.5 rounded border border-red-200">
                    {s.importance} Priority
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6B6B] leading-relaxed">{s.impactOnRole}</p>
                <p className="text-[10px] text-red-800 font-semibold pt-1">
                  🎯 {s.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ATS Tailored Resume & Outreach Studio */}
      <AtsResumeStudio jobId={activeJob?.id} />
    </div>
  );
};
