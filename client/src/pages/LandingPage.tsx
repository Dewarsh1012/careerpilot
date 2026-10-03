import React from 'react';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Milestone,
  MessageSquareCode,
  KanbanSquare,
  ShieldCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="cp-page min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="h-20 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#62A7FF] flex items-center justify-center text-white shadow-sm shadow-[#62A7FF]/25">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl tracking-tight flex items-center gap-2">
              CareerPilot
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#62A7FF]/10 text-[#62A7FF]">
                Lemma AI
              </span>
            </span>
            <p className="text-[11px] text-[#6B6B6B] -mt-0.5">Your career, finally with a plan.</p>
          </div>
        </div>

        {/* Links & CTA */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-[#6B6B6B]">
            <a href="#how-it-works" className="hover:text-[#171717] transition-colors">How It Works</a>
            <a href="#pipeline" className="hover:text-[#171717] transition-colors">The Pipeline</a>
            <a href="#preview" className="hover:text-[#171717] transition-colors">Preview</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={onLogin}
              className="text-xs font-bold text-[#171717] hover:text-[#62A7FF] px-3 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-4 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#62A7FF]/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (PRD Section 5) */}
      <section className="py-16 md:py-24 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="max-w-2xl space-y-6 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#62A7FF]/10 border border-[#62A7FF]/20 text-[#62A7FF] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Career Companion Powered by Lemma SDK</span>
          </div>

          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#171717] tracking-tight leading-[1.1]">
            YOUR CAREER, <br />
            <span className="text-[#62A7FF]">FINALLY WITH A PLAN.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#6B6B6B] leading-relaxed max-w-xl">
            Upload your resume. Add a target job. CareerPilot analyzes your real gaps, builds a custom milestone roadmap, and coaches you through technical interviews.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              onClick={onGetStarted}
              className="px-6 py-3.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-sm font-bold rounded-xl shadow-md shadow-[#62A7FF]/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Analyze My Career Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="px-6 py-3.5 bg-white hover:bg-[#F8F8F6] border border-[#E7E7E4] text-[#171717] text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>See How It Works</span>
              <ChevronRight className="w-4 h-4 text-[#6B6B6B]" />
            </a>
          </div>

          <div className="flex items-center space-x-6 pt-4 text-xs font-semibold text-[#6B6B6B]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              No endless chatbot prompts
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              Measurable progress tracking
            </span>
          </div>
        </div>

        {/* Hero Interactive Preview Card (PRD Section 5 & 7) */}
        <div className="w-full lg:w-[480px] bg-white border border-[#E7E7E4] rounded-3xl p-6 shadow-xl card-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
                Career Readiness Index
              </span>
              <h3 className="font-heading font-bold text-lg text-[#171717]">
                Full Stack Developer
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-heading text-[#62A7FF]">78%</span>
              <p className="text-[10px] text-[#16A34A] font-semibold">+6% this week</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#F8F8F6] h-3 rounded-full overflow-hidden border border-[#E7E7E4]">
            <div className="bg-[#62A7FF] h-full rounded-full w-[78%] transition-all duration-1000" />
          </div>

          {/* Skill Comparison Preview */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Live Target Match Analysis (Stripe)
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200 text-xs">
                <span className="font-semibold text-green-900">React & TypeScript</span>
                <span className="flex items-center gap-1 text-green-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified in Resume
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                <span className="font-semibold text-amber-900">Docker Containerization</span>
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Partial Match (In Progress)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200 text-xs">
                <span className="font-semibold text-red-900">AWS Cloud (EC2 / S3)</span>
                <span className="flex items-center gap-1 text-red-700 font-bold">
                  <XCircle className="w-3.5 h-3.5" /> Missing Requirement
                </span>
              </div>
            </div>
          </div>

          {/* Next Move Callout */}
          <div className="p-3 bg-[#F8F8F6] border border-[#62A7FF]/30 rounded-xl space-y-1 text-left">
            <span className="text-[9px] uppercase font-extrabold text-[#62A7FF] tracking-wider">
              Your Next Move
            </span>
            <p className="text-xs font-bold text-[#171717]">
              Complete Multi-Stage Dockerfile Milestone (Phase 2)
            </p>
            <p className="text-[11px] text-[#6B6B6B]">
              Closes your primary containerization gap for Stripe.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works (PRD Section 6) */}
      <section id="how-it-works" className="py-20 bg-white border-y border-[#E7E7E4] px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#62A7FF]">
              The 4-Step Pipeline
            </span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#171717]">
              How CareerPilot Works
            </h2>
            <p className="text-sm sm:text-base text-[#6B6B6B]">
              A continuous, structured journey from where you stand today to where you want to be.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Upload & Parse',
                desc: 'Upload your PDF or text resume. Lemma extracts skills, projects, and evidence into a structured profile.',
                icon: Layers,
              },
              {
                step: '02',
                title: 'Target & Match',
                desc: 'Paste any target job description. The Match Agent performs a side-by-side gap analysis (✓, ⚠, ❌).',
                icon: ShieldCheck,
              },
              {
                step: '03',
                title: 'Execute Roadmap',
                desc: 'Receive a personalized 5-phase career plan with concrete milestones. Check off tasks to re-analyze readiness.',
                icon: Milestone,
              },
              {
                step: '04',
                title: 'Practice & Land',
                desc: 'Simulate role-specific technical rounds with the AI Interview Coach and track applications in the Kanban board.',
                icon: MessageSquareCode,
              },
            ].map((col) => {
              const Icon = col.icon;
              return (
                <div key={col.step} className="p-6 bg-[#F8F8F6] rounded-2xl border border-[#E7E7E4] space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#62A7FF]">{col.step}</span>
                    <Icon className="w-5 h-5 text-[#6B6B6B]" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#171717]">{col.title}</h3>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">{col.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-[#F8F8F6] border-t border-[#E7E7E4] px-6 text-center text-xs text-[#6B6B6B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CareerPilot. Powered by Lemma SDK & Multi-Agent Architecture.</p>
          <div className="flex items-center space-x-6">
            <span className="cursor-pointer hover:text-[#171717]">Privacy</span>
            <span className="cursor-pointer hover:text-[#171717]">Terms</span>
            <span className="cursor-pointer hover:text-[#171717]">Lemma Documentation</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
