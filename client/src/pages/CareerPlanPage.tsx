import React, { useState } from 'react';
import { useCareer } from '../context/CareerContext';
import { JourneyBar } from '../components/common/JourneyBar';
import { NextMoveCard } from '../components/common/NextMoveCard';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Milestone,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CareerPlanPageProps {
  setCurrentTab: (tab: string) => void;
}

export const CareerPlanPage: React.FC<CareerPlanPageProps> = ({ setCurrentTab }) => {
  const { careerPlan, readinessScore, toggleTask, reanalyzeReadiness, activeJob } = useCareer();
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeMsg, setReanalyzeMsg] = useState('');
  const [expandedPhase, setExpandedPhase] = useState<string>('phase_2');

  const handleReanalyze = async () => {
    setReanalyzing(true);
    setReanalyzeMsg('');
    try {
      const msg = await reanalyzeReadiness();
      setReanalyzeMsg(msg);
    } finally {
      setReanalyzing(false);
    }
  };

  const phases = careerPlan?.phases || [];

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#62A7FF] uppercase tracking-wider">
              Preparation Roadmap
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-[#171717] tracking-tight">
            Personalized Career Roadmap
          </h1>
          <p className="text-xs text-[#6B6B6B]">
            5-phase milestone plan tailored for <strong className="text-[#171717]">{careerPlan?.targetRole || activeJob?.roleTitle || 'Full Stack Engineer'}</strong>.
          </p>
        </div>

        {/* Re-analyze Readiness CTA */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="px-4 py-2.5 bg-[#171717] hover:bg-[#62A7FF] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
            <span>{reanalyzing ? 'Recalculating Telemetry...' : 'Re-Analyze My Readiness'}</span>
          </button>
        </div>
      </div>

      {reanalyzeMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-900 flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-green-700" />
            {reanalyzeMsg}
          </span>
          <span className="font-extrabold text-green-800 text-sm">New Score: {readinessScore}%</span>
        </div>
      )}

      {/* Signature Journey Bar */}
      <JourneyBar currentStage="plan" onStageClick={(tab) => setCurrentTab(tab)} />

      {/* Standout Feature: "Next Move" */}
      <NextMoveCard
        title={careerPlan?.nextTask || 'Build Multi-Stage Dockerfile for Microservices'}
        actionText="Current Roadmap Task"
        category="Phase 2 Milestone"
        description="Check off tasks as you finish projects to automatically increase your verified readiness index."
        ctaLabel="Practice Interview on Docker"
        onAction={() => setCurrentTab('interview')}
      />

      {/* Overall Progress Gauge Card */}
      <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
              Roadmap Velocity
            </span>
            <h3 className="font-heading font-bold text-base text-[#171717]">
              {careerPlan?.completedTasks || 2} of {careerPlan?.totalTasks || 8} Milestones Completed
            </h3>
          </div>
          <div className="text-right">
            <span className="font-heading font-extrabold text-2xl text-[#62A7FF]">
              {careerPlan?.progressPercent || 25}%
            </span>
            <p className="text-[10px] text-[#16A34A] font-semibold">On Track</p>
          </div>
        </div>

        <div className="ui-progress-track w-full h-3 rounded-full overflow-hidden">
          <div
            className="bg-[#62A7FF] h-full rounded-full transition-all duration-500"
            style={{ width: `${careerPlan?.progressPercent || 25}%` }}
          />
        </div>
      </div>

      {/* 5 Phases Interactive Accordions / Timelines (PRD Section 14 & 20) */}
      <div className="space-y-4">
        {phases.map((phase, pIdx) => {
          const isExpanded = expandedPhase === phase.id || pIdx === 1;
          const allCompleted = phase.tasks.every((t) => t.status === 'completed');

          return (
            <div
              key={phase.id}
              className={`bg-white border rounded-2xl card-subtle overflow-hidden transition-all ${
                allCompleted ? 'border-green-200' : 'border-[#E7E7E4]'
              }`}
            >
              {/* Phase Header */}
              <div
                onClick={() => setExpandedPhase(isExpanded ? '' : phase.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#F8F8F6]/60 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      allCompleted
                        ? 'bg-[#16A34A] text-white'
                        : 'bg-[#F8F8F6] border border-[#E7E7E4] text-[#171717]'
                    }`}
                  >
                    {allCompleted ? <Check className="w-4 h-4" /> : pIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#171717]">
                      {phase.title}
                    </h3>
                    <p className="text-[11px] text-[#6B6B6B]">{phase.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-semibold bg-[#F8F8F6] border border-[#E7E7E4] px-2.5 py-1 rounded-lg text-[#6B6B6B]">
                    {phase.estimatedWeeks}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#6B6B6B]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />
                  )}
                </div>
              </div>

              {/* Tasks List */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 space-y-3 border-t border-[#E7E7E4]/60">
                  {phase.tasks.map((task) => {
                    const isDone = task.status === 'completed';

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isDone
                            ? 'bg-green-50/30 border-green-200 text-green-950'
                            : 'bg-[#F8F8F6]/80 border-[#E7E7E4] text-[#171717]'
                        }`}
                      >
                        {/* Left Checkbox & Title */}
                        <div className="flex items-start space-x-3">
                          <button
                            onClick={() => toggleTask(task.id, task.status)}
                            className="mt-0.5 shrink-0 focus:outline-none"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-[#16A34A] fill-green-100" />
                            ) : (
                              <Circle className="w-5 h-5 text-[#D5D5D0] hover:text-[#62A7FF]" />
                            )}
                          </button>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4
                                className={`text-xs font-bold ${
                                  isDone ? 'line-through text-[#6B6B6B]' : 'text-[#171717]'
                                }`}
                              >
                                {task.title}
                              </h4>
                              <span className="text-[9px] font-bold uppercase bg-white border border-[#E7E7E4] px-1.5 py-0.2 rounded text-[#6B6B6B]">
                                {task.skill}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                              {task.description}
                            </p>

                            {task.deliverable && (
                              <p className="text-[10px] text-[#62A7FF] font-semibold">
                                📌 Deliverable: {task.deliverable}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Priority & Estimated Hours */}
                        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                          <span className="text-[10px] font-semibold text-[#6B6B6B] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#6B6B6B]" />
                            {task.estimatedHours}h
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              task.priority === 'High'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {task.priority} Priority
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
