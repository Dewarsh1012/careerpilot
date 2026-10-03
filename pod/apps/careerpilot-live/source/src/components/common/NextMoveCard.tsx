import React from 'react';
import { ArrowRight, Flame, Target } from 'lucide-react';

interface NextMoveCardProps {
  title?: string;
  actionText?: string;
  category?: string;
  description?: string;
  onAction?: () => void;
  ctaLabel?: string;
}

export const NextMoveCard: React.FC<NextMoveCardProps> = ({
  title = 'Complete Docker Containerization Milestone',
  actionText = 'Next Recommended Move',
  category = 'Critical Gap Closure',
  description = 'Your target role (Stripe Full Stack) requires Docker proficiency. Complete Phase 2 task to boost readiness to 84%.',
  onAction,
  ctaLabel = 'Take Next Step',
}) => {
  return (
    <div className="bg-gradient-to-r from-white via-white to-[#62A7FF]/5 border-2 border-[#62A7FF]/30 hover:border-[#62A7FF] rounded-2xl p-5 card-subtle transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Side: Badge & Content */}
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 text-[10px] font-extrabold uppercase tracking-wider bg-[#62A7FF] text-white px-2.5 py-0.5 rounded-full shadow-xs">
              <Flame className="w-3 h-3 fill-white" />
              <span>{actionText}</span>
            </span>
            <span className="text-[11px] font-semibold text-[#6B6B6B] flex items-center gap-1">
              <Target className="w-3 h-3 text-[#62A7FF]" />
              {category}
            </span>
          </div>

          <h3 className="font-heading font-bold text-base sm:text-lg text-[#171717] tracking-tight">
            {title}
          </h3>

          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            {description}
          </p>
        </div>

        {/* Right Side: CTA Button */}
        <button
          onClick={onAction}
          className="btn-accent shrink-0 flex items-center space-x-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
