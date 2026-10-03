import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { JobRecord } from '../types';
import { useCareer } from '../context/CareerContext';
import {
  Briefcase,
  Plus,
  Sparkles,
  CheckCircle2,
  Building,
  MapPin,
  Clock,
  ArrowRight,
  Code,
  Globe,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface JobsPageProps {
  setCurrentTab: (tab: string) => void;
}

export const JobsPage: React.FC<JobsPageProps> = ({ setCurrentTab }) => {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<'url' | 'manual'>('url');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('Remote / Hybrid');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { activeJob, selectJobAndMatch, scrapeAndSelectJob, quota, plan, switchTier } = useCareer();

  const loadJobs = async () => {
    try {
      const data = await api.jobs.getJobs();
      setJobs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleScrapeJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await scrapeAndSelectJob(scrapeUrl);
      if (res.success) {
        await loadJobs();
        setShowAddForm(false);
        setScrapeUrl('');
        setCurrentTab('match');
      } else {
        setErrorMsg(res.error || 'Failed to extract job posting from URL.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobText.trim() && !roleTitle.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const newJob = await api.jobs.createJob({
        jobText,
        roleTitle,
        company,
        location,
      });

      // Synchronize immediately into Job Tracker
      await api.applications.createApplication({
        company: newJob.company || company || 'Target Company',
        role: newJob.roleTitle || roleTitle || 'Target Role',
        status: 'saved',
        location: newJob.location || location || 'Remote',
        salary: '$135k - $175k',
        matchScore: 82,
        notes: `Target job created in Studio (${newJob.seniority || 'Full Time'}).`,
      }).catch((err) => console.warn('Job tracker auto-sync:', err));

      await loadJobs();
      await selectJobAndMatch(newJob.id);
      setShowAddForm(false);
      setJobText('');
      setRoleTitle('');
      setCompany('');
      setCurrentTab('match');
    } catch (err: any) {
      setErrorMsg(err.message || 'Job analysis failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectJob = async (jobId: string) => {
    await selectJobAndMatch(jobId);
    setCurrentTab('match');
  };

  const handleDeleteJob = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!confirm('Remove this job from your target tracks?')) return;
    try {
      await api.jobs.delete(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* Header with SaaS Quota Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#62A7FF] uppercase tracking-wider">
              Multi-Target Workspace
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#171717] text-white">
              {plan === 'pro' ? 'Pro Plan' : plan === 'campus' ? 'Campus Tier' : 'Free Tier'}
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-[#171717] tracking-tight mt-1">
            Target Job Intelligence & Tracking
          </h1>
          <p className="text-xs text-[#6B6B6B]">
            Scrape any live job posting URL or paste custom job specs to power real-time gap matching and interview simulations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {quota && (
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Matches Used</span>
              <span className="text-xs font-bold text-[#171717]">
                {quota.jobMatches.used} / {quota.jobMatches.limit > 100 ? '∞' : quota.jobMatches.limit}
              </span>
            </div>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Studio' : 'Add Target Job'}</span>
          </button>
        </div>
      </div>

      {/* Add Job Modal / Collapsible Form */}
      {showAddForm && (
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#62A7FF]" />
              <h3 className="font-heading font-bold text-sm text-[#171717]">
                Lemma Job Ingestion Engine
              </h3>
            </div>

            {/* Toggle Modes */}
            <div className="flex bg-[#F8F8F6] p-1 rounded-xl border border-[#E7E7E4]">
              <button
                type="button"
                onClick={() => setAddMode('url')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  addMode === 'url' ? 'bg-white shadow-xs text-[#171717]' : 'text-[#6B6B6B]'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#62A7FF]" />
                <span>1-Click URL Auto-Scraper</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('manual')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  addMode === 'manual' ? 'bg-white shadow-xs text-[#171717]' : 'text-[#6B6B6B]'
                }`}
              >
                <Code className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Manual Paste</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Mode 1: URL Auto-Scraper */}
          {addMode === 'url' ? (
            <form onSubmit={handleScrapeJob} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">
                  Live Job Posting URL (Greenhouse, Lever, LinkedIn, Indeed, etc.)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 absolute left-3 top-3 text-[#6B6B6B]" />
                    <input
                      type="url"
                      required
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      placeholder="https://jobs.lever.co/stripe/software-engineer or https://boards.greenhouse.io/vercel/..."
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>{submitting ? 'Scraping with AI...' : 'Auto-Scrape & Match'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-[#6B6B6B] mt-1.5">
                  Lemma will automatically fetch the page, strip web noise, extract required tech skills, and update your career match.
                </p>
              </div>
            </form>
          ) : (
            /* Mode 2: Manual Form */
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Target Role Title</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full p-2.5 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Stripe"
                    className="w-full p-2.5 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Remote / Hybrid"
                    className="w-full p-2.5 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">
                  Job Description or Requirements Bullet Points
                </label>
                <textarea
                  rows={5}
                  required
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder="Paste the full job description or list of required skills here..."
                  className="w-full p-3 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-[#E7E7E4] text-xs font-semibold text-[#6B6B6B] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <span>{submitting ? 'Analyzing with AI...' : 'Analyze Job & Match Profile'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Target Job Tracks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {jobs.map((job) => {
          const isSelected = activeJob?.id === job.id;
          const reqSkills = job.analysis?.requiredSkills || [];

          return (
            <div
              key={job.id}
              className={`bg-white border rounded-2xl p-5 card-subtle flex flex-col justify-between space-y-4 transition-all ${
                isSelected
                  ? 'border-[#62A7FF] ring-2 ring-[#62A7FF]/15 shadow-md'
                  : 'border-[#E7E7E4] hover:border-[#D5D5D0]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
                        {job.company}
                      </span>
                      {job.sourceUrl && (
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#62A7FF] hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>Link</span>
                        </a>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-base text-[#171717] leading-tight mt-0.5">
                      {job.roleTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSelected ? (
                      <span className="text-[10px] font-bold text-[#62A7FF] bg-[#62A7FF]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#62A7FF]" />
                        Active
                      </span>
                    ) : null}
                    <button
                      onClick={(e) => handleDeleteJob(e, job.id)}
                      title="Remove job track"
                      className="p-1 text-[#6B6B6B] hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-[#6B6B6B]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location || 'Remote'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {job.seniority}
                  </span>
                </div>

                <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-2">
                  {job.analysis?.summary || job.rawDescription}
                </p>

                {/* Required Skills Badges */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                    Core Skills ({reqSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {reqSkills.slice(0, 5).map((s) => (
                      <span
                        key={s.name}
                        className="text-[10px] font-semibold bg-[#F8F8F6] border border-[#E7E7E4] px-2 py-0.5 rounded-md text-[#171717]"
                      >
                        {s.name}
                      </span>
                    ))}
                    {reqSkills.length > 5 && (
                      <span className="text-[10px] font-semibold text-[#6B6B6B] self-center">
                        +{reqSkills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectJob(job.id)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#171717] text-white hover:bg-[#62A7FF]'
                    : 'bg-[#F8F8F6] hover:bg-[#62A7FF] hover:text-white border border-[#E7E7E4] text-[#171717]'
                }`}
              >
                <span>{isSelected ? 'View Match & Skill Gaps' : 'Select Target & Match'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
