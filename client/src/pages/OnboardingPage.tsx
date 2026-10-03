import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Compass, ArrowRight, CheckCircle2, ChevronLeft, Sparkles, User, Briefcase, Code } from 'lucide-react';

interface OnboardingPageProps {
  onComplete: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { user, updateOnboarding } = useAuth();
  const [step, setStep] = useState(1);

  const [currentStatus, setCurrentStatus] = useState('Student / Fresher');
  const [experienceLevel, setExperienceLevel] = useState('Fresher (0-1 yrs)');
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [interests, setInterests] = useState<string[]>([
    'Web Development',
    'Backend Systems',
    'Cloud Systems',
  ]);
  const [submitting, setSubmitting] = useState(false);

  const toggleInterest = (item: string) => {
    if (interests.includes(item)) {
      setInterests(interests.filter((i) => i !== item));
    } else {
      setInterests([...interests, item]);
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await updateOnboarding({
        currentStatus,
        experienceLevel,
        targetRole,
        interests,
      });
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cp-page min-h-screen flex flex-col justify-center items-center px-4 py-12">
      <div className="cp-panel w-full max-w-xl rounded-3xl p-8 card-subtle shadow-xl space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#62A7FF] flex items-center justify-center text-white font-bold text-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#62A7FF] tracking-wider">
                Step {step} of 3
              </span>
              <h3 className="font-heading font-bold text-sm text-[#171717]">
                Personalize Your Career Journey
              </h3>
            </div>
          </div>
          <div className="flex space-x-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-6 h-1.5 rounded-full transition-all ${
                  s === step ? 'bg-[var(--accent-primary)] w-8' : s < step ? 'bg-[var(--text-primary)]' : 'bg-[var(--line-divider)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Career Status & Level */}
        {step === 1 && (
          <div className="space-y-5 text-left">
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#171717]">
                What is your current career standing?
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-1">
                This helps the AI benchmark your baseline readiness expectations.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#171717]">Current Status</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Student / Fresher',
                  'Early Career Engineer',
                  'Experienced Developer',
                  'Career Switcher',
                ].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setCurrentStatus(status)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      currentStatus === status
                        ? 'border-[#62A7FF] bg-[#62A7FF]/5 text-[#62A7FF]'
                        : 'border-[#E7E7E4] hover:bg-[#F8F8F6] text-[#171717]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#171717]">Years of Coding Experience</label>
              <div className="grid grid-cols-3 gap-3">
                {['Fresher (0-1 yrs)', '1 - 3 years', '3+ years'].map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => setExperienceLevel(exp)}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                      experienceLevel === exp
                        ? 'border-[#62A7FF] bg-[#62A7FF]/5 text-[#62A7FF]'
                        : 'border-[#E7E7E4] hover:bg-[#F8F8F6] text-[#171717]'
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Target Role */}
        {step === 2 && (
          <div className="space-y-5 text-left">
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#171717]">
                What role are you targeting next?
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Your roadmap and interview simulations will tailor directly to this position.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { title: 'Full Stack Developer', desc: 'React, Node.js, TypeScript, PostgreSQL, and Cloud Deployment' },
                { title: 'Frontend Engineer', desc: 'React, Next.js, Web Performance, Core Web Vitals, and UI Engineering' },
                { title: 'Backend Systems Engineer', desc: 'Node.js, Express, Microservices, Redis Caching, and High-Scale APIs' },
                { title: 'Cloud & DevOps Engineer', desc: 'Docker, Kubernetes, AWS Infrastructure, and CI/CD Automation' },
                { title: 'AI Application Engineer', desc: 'Python, LLM Agents, Vector Databases, and Full Stack AI Apps' },
              ].map((role) => (
                <div
                  key={role.title}
                  onClick={() => setTargetRole(role.title)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    targetRole === role.title
                      ? 'border-[#62A7FF] bg-[#62A7FF]/5 text-[#171717]'
                      : 'border-[#E7E7E4] hover:bg-[#F8F8F6] text-[#6B6B6B]'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs text-[#171717]">{role.title}</h4>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">{role.desc}</p>
                  </div>
                  {targetRole === role.title && (
                    <CheckCircle2 className="w-4 h-4 text-[#62A7FF] shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-[#6B6B6B] hover:text-[#171717] flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Core Interests & Finish */}
        {step === 3 && (
          <div className="space-y-5 text-left">
            <div>
              <h2 className="font-heading font-extrabold text-xl text-[#171717]">
                Select your primary technical interests
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Choose the domains you enjoy working in.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                'Web Development',
                'Backend Systems',
                'Cloud Systems',
                'AI Applications',
                'System Architecture',
                'Database Optimization',
                'DevOps & CI/CD',
                'Mobile Interfaces',
              ].map((item) => {
                const selected = interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                      selected
                        ? 'border-[#62A7FF] bg-[#62A7FF]/5 text-[#62A7FF]'
                        : 'border-[#E7E7E4] hover:bg-[#F8F8F6] text-[#171717]'
                    }`}
                  >
                    <span>{item}</span>
                    {selected && <CheckCircle2 className="w-3.5 h-3.5 text-[#62A7FF]" />}
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#6B6B6B]">Ready to generate profile</span>
              <p className="text-xs text-[#171717] font-semibold">
                Your AI Career Workspace will be configured for <span className="text-[#62A7FF]">{targetRole}</span>.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-[#6B6B6B] hover:text-[#171717] flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="px-6 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <span>{submitting ? 'Setting up workspace...' : 'Enter Workspace'}</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
