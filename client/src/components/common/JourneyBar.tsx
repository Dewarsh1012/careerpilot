import React from 'react';
import { Check } from 'lucide-react';

interface JourneyBarProps {
  currentStage?: 'profile' | 'resume' | 'match' | 'gap' | 'plan' | 'interview';
  onStageClick?: (stage: string) => void;
}

export const JourneyBar: React.FC<JourneyBarProps> = ({
  currentStage = 'match',
  onStageClick,
}) => {
  const stages = [
    { id: 'profile', label: 'PROFILE', tab: 'profile' },
    { id: 'resume', label: 'RESUME', tab: 'resume' },
    { id: 'match', label: 'MATCH', tab: 'match' },
    { id: 'gap', label: 'GAP', tab: 'match' },
    { id: 'plan', label: 'PLAN', tab: 'roadmap' },
    { id: 'interview', label: 'INTERVIEW', tab: 'interview' },
  ];

  const stageOrder = ['profile', 'resume', 'match', 'gap', 'plan', 'interview'];
  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <div className="cp-panel w-full rounded-2xl p-4 sm:p-5 card-subtle">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider cp-text-muted">
            Your Career Pipeline
          </span>
          <h4 className="text-xs font-bold cp-text font-heading">
            End-to-End Preparation Journey
          </h4>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold cp-accent bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)] px-2.5 py-0.5 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_28%,var(--border-subtle))]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-ping" />
          <span>Stage: {currentStage.toUpperCase()}</span>
        </div>
      </div>

      {/* Horizontal Pipeline */}
      <div className="relative flex items-center justify-between pt-2 pb-1">
        {/* Continuous Connecting Line */}
        <div className="ui-pipeline-line absolute top-1/2 left-4 right-4 -translate-y-1/2 z-0" />

        {stages.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div
              key={stage.id}
              onClick={() => onStageClick && onStageClick(stage.tab)}
              className="relative z-10 flex flex-col items-center cursor-pointer group"
            >
              {/* Node Icon */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCurrent
                    ? 'ui-journey-current'
                    : isCompleted
                      ? 'ui-journey-done'
                      : 'ui-journey-future'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-[10px] sm:text-[11px] font-bold tracking-wider transition-colors ${
                  isCurrent
                    ? 'cp-accent'
                    : isCompleted
                      ? 'cp-text'
                      : 'cp-text-muted'
                }`}
              >
                {stage.label}
              </span>

              {/* "YOU ARE HERE" Indicator */}
              {isCurrent && (
                <div className="absolute -bottom-5 flex flex-col items-center">
                  <span className="ui-journey-here text-[9px] font-extrabold uppercase tracking-tight whitespace-nowrap px-1.5 py-0.5 rounded">
                    ▲ YOU ARE HERE
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
