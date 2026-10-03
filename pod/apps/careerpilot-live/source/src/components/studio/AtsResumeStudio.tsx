import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TailoredResume } from '../../types';
import { useCareer } from '../../context/CareerContext';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  Download,
  Send,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AtsResumeStudioProps {
  jobId?: string;
  resumeId?: string;
  className?: string;
}

export const AtsResumeStudio: React.FC<AtsResumeStudioProps> = ({ jobId, resumeId, className = '' }) => {
  const { activeJob, activeResume, refreshQuota, quota } = useCareer();
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'keywords' | 'outreach'>('resume');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const targetJobId = jobId || activeJob?.id;

  const loadExistingTailored = async () => {
    if (!targetJobId) return;
    try {
      const existing = await api.tailor.getForJob(targetJobId);
      if (existing) {
        setTailoredResume(existing);
      }
    } catch (err) {
      console.warn('Failed to load existing tailored resume:', err);
    }
  };

  useEffect(() => {
    loadExistingTailored();
  }, [targetJobId]);

  const handleGenerateTailored = async () => {
    if (!activeJob) {
      setErrorMsg('Please select a target job first.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.tailor.generate({
        jobId: activeJob.id,
        resumeId: resumeId || activeResume?.id,
      });

      if (res.success && res.tailoredResume) {
        setTailoredResume(res.tailoredResume);
        await refreshQuota();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#62A7FF', '#16A34A', '#62A7FF'],
        });
      } else {
        setErrorMsg(res.error || 'Failed to tailor resume for this job.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with Lemma Tailor Agent.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-6 ${className}`}>
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#62A7FF] uppercase tracking-wider">
              ATS Optimization Studio
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#171717] text-white">
              Google XYZ Formula
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-xl text-[#171717] tracking-tight mt-1">
            ATS Tailored Resume & Outreach Architect
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            Transforms your baseline resume into an ATS-aligned, keyword-dense submission tailored specifically for{' '}
            <strong className="text-[#171717]">{activeJob?.roleTitle || 'Target Role'}</strong> at{' '}
            <strong className="text-[#171717]">{activeJob?.company || 'Target Company'}</strong>.
          </p>
        </div>

        <button
          onClick={handleGenerateTailored}
          disabled={loading || !activeJob}
          className="px-5 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Optimizing with Lemma AI...' : tailoredResume ? 'Re-Tailor Resume' : '1-Click ATS Tailor'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* When Tailored Resume Exists */}
      {tailoredResume ? (
        <div className="space-y-6">
          {/* Top Score Comparison Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#F8F8F6] p-4 rounded-2xl border border-[#E7E7E4]">
            {/* ATS Score Improvement */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E7E7E4] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">ATS Compatibility</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xs text-[#6B6B6B] line-through font-semibold">
                    {tailoredResume.previousScore || 64}%
                  </span>
                  <span className="font-heading font-extrabold text-2xl text-[#16A34A]">
                    {tailoredResume.atsScore}%
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-xs font-bold text-[#16A34A]">
                +{tailoredResume.atsScore - (tailoredResume.previousScore || 64)}%
              </div>
            </div>

            {/* Keyword Density */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E7E7E4]">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Keywords Aligned</span>
              <p className="font-heading font-extrabold text-2xl text-[#171717] mt-0.5">
                {tailoredResume.keywordMatches?.filter((k) => k.matched).length || 0} /{' '}
                {tailoredResume.keywordMatches?.length || 0}
              </p>
            </div>

            {/* Bullets Rewritten */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E7E7E4]">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Bullets Optimized</span>
              <p className="font-heading font-extrabold text-2xl text-[#171717] mt-0.5">
                {tailoredResume.tailoredExperience?.reduce((acc, curr) => acc + curr.tailoredBullets.length, 0) || 0}
              </p>
            </div>

            {/* Target Role & Quick Actions */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E7E7E4] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Target Match</span>
              <p className="text-xs font-bold text-[#171717] truncate">
                {tailoredResume.company} · {tailoredResume.jobTitle}
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handlePrint}
                  className="text-[10px] font-bold text-[#171717] hover:text-[#62A7FF] flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Print PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-Tabs Navigation */}
          <div className="flex border-b border-[#E7E7E4] gap-2">
            {[
              { id: 'resume', label: 'ATS Tailored Resume & Diffs', icon: FileText },
              { id: 'keywords', label: 'Keyword Alignment Matrix', icon: ShieldCheck },
              { id: 'outreach', label: 'Cover Letter & Cold InMail', icon: Send },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                    isActive
                      ? 'border-[#62A7FF] text-[#62A7FF]'
                      : 'border-transparent text-[#6B6B6B] hover:text-[#171717]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: ATS Tailored Resume & Diffs */}
          {activeTab === 'resume' && (
            <div className="space-y-6">
              {/* Tailored Professional Summary */}
              <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[#E7E7E4] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#62A7FF]" />
                    Optimized Professional Summary
                  </span>
                  <button
                    onClick={() => copyToClipboard(tailoredResume.tailoredSummary, 'summary')}
                    className="text-xs font-bold text-[#62A7FF] hover:text-[#4B92F0] flex items-center gap-1"
                  >
                    {copiedKey === 'summary' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'summary' ? 'Copied' : 'Copy Summary'}</span>
                  </button>
                </div>
                <p className="text-xs text-[#171717] leading-relaxed font-sans">
                  {tailoredResume.tailoredSummary}
                </p>
              </div>

              {/* Side-by-Side Experience Diff Viewer */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-[#171717]">
                    Experience & Project Bullet Optimization (Original vs. Tailored XYZ)
                  </h3>
                  <button
                    onClick={() => {
                      const allBullets = tailoredResume.tailoredExperience
                        .map((exp) => `${exp.title} - ${exp.company}\n${exp.tailoredBullets.map((b) => `• ${b}`).join('\n')}`)
                        .join('\n\n');
                      copyToClipboard(allBullets, 'allBullets');
                    }}
                    className="text-xs font-bold text-[#62A7FF] hover:text-[#4B92F0] flex items-center gap-1"
                  >
                    {copiedKey === 'allBullets' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'allBullets' ? 'Copied All' : 'Copy All Bullets'}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {tailoredResume.tailoredExperience.map((exp, idx) => (
                    <div key={idx} className="border border-[#E7E7E4] rounded-2xl overflow-hidden">
                      <div className="bg-[#F8F8F6] px-4 py-2.5 border-b border-[#E7E7E4] flex items-center justify-between">
                        <span className="text-xs font-bold text-[#171717]">
                          {exp.title} <span className="text-[#6B6B6B] font-normal">at {exp.company}</span>
                        </span>
                        <div className="flex gap-1.5">
                          {(exp.diffHighlights || []).map((h, i) => (
                            <span key={i} className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                              ✓ {h}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E7E7E4]">
                        {/* Original Bullets */}
                        <div className="p-4 bg-white/50 space-y-2">
                          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                            Original Baseline
                          </span>
                          <ul className="space-y-2 text-xs text-[#6B6B6B]">
                            {exp.originalBullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-[#6B6B6B] shrink-0">•</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Tailored XYZ Bullets */}
                        <div className="p-4 bg-green-50/20 space-y-2">
                          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#62A7FF]" />
                            Tailored XYZ Impact (ATS Optimized)
                          </span>
                          <ul className="space-y-2 text-xs text-[#171717] font-medium">
                            {exp.tailoredBullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-[#62A7FF] shrink-0">•</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Keyword Alignment Matrix */}
          {activeTab === 'keywords' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[#E7E7E4]">
                <h4 className="font-heading font-bold text-xs text-[#171717] uppercase tracking-wider mb-1">
                  ATS Keyword Heatmap
                </h4>
                <p className="text-xs text-[#6B6B6B]">
                  ATS scanners parse your document for exact skill strings. Below is how this tailored version covers the target role's competencies.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {tailoredResume.keywordMatches.map((kw, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      kw.matched
                        ? 'bg-green-50/50 border-green-200 text-green-900'
                        : 'bg-red-50/50 border-red-200 text-red-900'
                    }`}
                  >
                    <span className="text-xs font-bold">{kw.keyword}</span>
                    {kw.matched ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <span className="text-[9px] font-bold bg-white text-red-600 px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                        Gap
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Cover Letter & Cold InMail */}
          {activeTab === 'outreach' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Letter */}
              <div className="bg-[#F8F8F6] p-5 rounded-2xl border border-[#E7E7E4] flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#62A7FF]" />
                      Tailored Cover Letter
                    </span>
                    <button
                      onClick={() => copyToClipboard(tailoredResume.coverLetter || '', 'coverLetter')}
                      className="text-xs font-bold text-[#62A7FF] hover:text-[#4B92F0] flex items-center gap-1"
                    >
                      {copiedKey === 'coverLetter' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'coverLetter' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-xs text-[#171717] font-sans whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-xl border border-[#E7E7E4] max-h-96 overflow-y-auto">
                    {tailoredResume.coverLetter}
                  </pre>
                </div>
              </div>

              {/* Cold InMail */}
              <div className="bg-[#F8F8F6] p-5 rounded-2xl border border-[#E7E7E4] flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#62A7FF]" />
                      Recruiter InMail Pitch (150 Words)
                    </span>
                    <button
                      onClick={() => copyToClipboard(tailoredResume.coldInMail || '', 'coldInMail')}
                      className="text-xs font-bold text-[#62A7FF] hover:text-[#4B92F0] flex items-center gap-1"
                    >
                      {copiedKey === 'coldInMail' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'coldInMail' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-xs text-[#171717] font-sans whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-xl border border-[#E7E7E4] max-h-96 overflow-y-auto">
                    {tailoredResume.coldInMail}
                  </pre>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                  💡 <strong>Pro-Tip:</strong> Send this note directly to the Engineering Manager or Talent Lead on LinkedIn within 2 hours of submitting your application.
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State before generation */
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#62A7FF]/10 text-[#62A7FF] flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-[#171717]">
              Ready to Tailor Your Resume for {activeJob?.company || 'Target Company'}
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Click the button above to let Lemma rewrite your experience bullets into Google XYZ impact achievements, calculate your ATS score, and generate your custom cover letter.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
