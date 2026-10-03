import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CampusCohort, CandidateProfile, CohortSkillDeficit } from '../types';
import { useCareer } from '../context/CareerContext';
import {
  GraduationCap,
  Users,
  Award,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Briefcase,
  FileDown,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Building,
  Radio,
  BookOpen,
  ArrowRight,
  X,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CampusPageProps {
  setCurrentTab: (tab: string) => void;
}

export const CampusPage: React.FC<CampusPageProps> = ({ setCurrentTab }) => {
  const { plan, switchTier } = useCareer();
  const [overview, setOverview] = useState<any>(null);
  const [cohorts, setCohorts] = useState<CampusCohort[]>([]);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [minReadiness, setMinReadiness] = useState<number>(75);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [outreachSuccess, setOutreachSuccess] = useState<string | null>(null);
  const [outreachModalCandidate, setOutreachModalCandidate] = useState<CandidateProfile | null>(null);
  const [customOutreachMsg, setCustomOutreachMsg] = useState('');
  const [sendingOutreach, setSendingOutreach] = useState(false);

  const loadCampusData = async () => {
    setLoading(true);
    try {
      const cohortRes = await api.campus.getCohorts();
      if (cohortRes.success) {
        setOverview(cohortRes.overview);
        setCohorts(cohortRes.cohorts);
      }

      await fetchCandidates();
    } catch (err) {
      console.error('Failed to load campus data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const candRes = await api.campus.getCandidates({
        cohortId: selectedCohortId !== 'all' ? selectedCohortId : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        skill: selectedSkill !== 'all' ? selectedSkill : undefined,
        minReadiness: minReadiness > 70 ? minReadiness : undefined,
        search: searchQuery || undefined,
      });

      if (candRes.success) {
        setCandidates(candRes.candidates);
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    }
  };

  useEffect(() => {
    loadCampusData();
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [selectedCohortId, selectedStatus, selectedSkill, minReadiness, searchQuery]);

  const handleSendOutreach = async (candidate: CandidateProfile) => {
    setSendingOutreach(true);
    try {
      const res = await api.campus.sendOutreach({
        candidateId: candidate.id,
        company: 'CareerPilot Partner Network',
        role: candidate.targetRole,
        message: customOutreachMsg || `We reviewed your verified telemetry on CareerPilot and would love to schedule an interview for ${candidate.targetRole}.`,
      });

      if (res.success) {
        setOutreachSuccess(`Interview request dispatched to ${candidate.name}!`);
        setOutreachModalCandidate(null);
        setCustomOutreachMsg('');
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#8B5CF6', '#16A34A', '#62A7FF'],
        });

        // Update local candidate state
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidate.id ? { ...c, outreachSent: true, placementStatus: 'Interviewing' } : c))
        );
      }
    } finally {
      setSendingOutreach(false);
    }
  };

  const handleExport = async () => {
    const data = await api.campus.exportReport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CareerPilot_Campus_Placement_Telemetry_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCohort = cohorts.find((c) => c.id === selectedCohortId) || cohorts[0];

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* Institutional Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-purple-950 via-[#171717] to-purple-900 text-white rounded-3xl p-8 shadow-md">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
              Campus & Enterprise Hub
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Campus Placement & Recruiter Intelligence
          </h1>
          <p className="text-xs text-purple-200/80 max-w-2xl leading-relaxed">
            Monitor institutional cohort readiness, diagnose systemic curriculum skill deficits, and grant recruiters direct access to pre-verified candidate telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5 text-purple-300" />
            <span>Export Placement Report</span>
          </button>

          {plan !== 'campus' && (
            <button
              onClick={() => switchTier('campus')}
              className="px-4 py-2 bg-[#62A7FF] hover:bg-[#4B92F0] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unlock Campus Tier</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {outreachSuccess && (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 text-green-900 text-xs rounded-2xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span className="font-semibold">{outreachSuccess}</span>
          </div>
          <button onClick={() => setOutreachSuccess(null)} className="font-bold text-green-700 hover:text-green-900 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">Total Enrolled</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-[#171717]">
            {overview?.totalEnrolled || 80}
          </p>
          <p className="text-[11px] text-[#6B6B6B]">Across 2 active engineering cohorts</p>
        </div>

        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">Ready to Hire Rate</span>
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-[#16A34A]">
            {overview?.readyToHireRate || 72}%
          </p>
          <p className="text-[11px] text-[#6B6B6B]">{overview?.readyToHireCount || 58} candidates ≥ 80% readiness</p>
        </div>

        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">Active Interviews</span>
            <Radio className="w-4 h-4 text-[#62A7FF]" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-[#62A7FF]">
            {overview?.interviewingCount || 15}
          </p>
          <p className="text-[11px] text-[#6B6B6B]">Currently in screening pipelines</p>
        </div>

        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">Average Readiness</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-[#171717]">
            {overview?.averageCohortReadiness || 84}%
          </p>
          <p className="text-[11px] text-[#6B6B6B]">{overview?.placedCount || 21} placed at tech firms</p>
        </div>
      </div>

      {/* Cohort Skill Deficits Diagnostic Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cohort Skill Deficits Heatmap & Remediation */}
        <div className="lg:col-span-2 bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E7E7E4]">
            <div>
              <span className="text-[10px] font-bold text-[#62A7FF] uppercase tracking-wider">
                Curriculum Diagnostics
              </span>
              <h3 className="font-heading font-bold text-base text-[#171717]">
                Cohort Critical Skill Deficits
              </h3>
            </div>

            {/* Cohort Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCohortId('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCohortId === 'all'
                    ? 'bg-[#171717] text-white'
                    : 'bg-[#F8F8F6] text-[#6B6B6B] hover:text-[#171717]'
                }`}
              >
                All Tracks
              </button>
              {cohorts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCohortId(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCohortId === c.id
                      ? 'bg-purple-900 text-white'
                      : 'bg-[#F8F8F6] text-[#6B6B6B] hover:text-[#171717]'
                  }`}
                >
                  {c.name.split('—')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {(activeCohort?.deficits || []).map((deficit, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#171717]">{deficit.skill}</span>
                    <span className="text-[10px] text-[#6B6B6B] bg-white border border-[#E7E7E4] px-1.5 py-0.2 rounded">
                      {deficit.category}
                    </span>
                    {deficit.impactLevel === 'Critical' && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Critical Barrier
                      </span>
                    )}
                  </div>
                  <span className="font-extrabold text-[#62A7FF]">
                    {deficit.deficitPercentage}% missing ({deficit.studentsMissing} students)
                  </span>
                </div>

                {/* Deficit Progress Bar */}
                <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#E7E7E4]">
                  <div
                    className={`h-full rounded-full ${
                      deficit.deficitPercentage > 45 ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${deficit.deficitPercentage}%` }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#6B6B6B] pt-0.5 gap-1">
                  <span>💡 Recommended Bridge Workshop: <strong className="text-[#171717]">{deficit.recommendedWorkshop}</strong></span>
                  <button
                    onClick={() => {
                      confetti({ particleCount: 40, spread: 50 });
                      alert(`Remediation workshop "${deficit.recommendedWorkshop}" added to student dashboard roadmaps.`);
                    }}
                    className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded cursor-pointer self-start sm:self-auto"
                  >
                    Deploy Workshop
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Placement Conversion Funnel */}
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
          <div className="pb-3 border-b border-[#E7E7E4]">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
              Talent Pipeline
            </span>
            <h3 className="font-heading font-bold text-base text-[#171717]">
              Placement Funnel
            </h3>
          </div>

          <div className="space-y-3">
            {[
              { label: '1. Enrolled Candidates', count: activeCohort?.funnel?.enrolled || 48, pct: 100, color: 'bg-purple-900' },
              { label: '2. Resume Telemetry Extracted', count: activeCohort?.funnel?.profileExtracted || 48, pct: 100, color: 'bg-purple-700' },
              { label: '3. Target Jobs Matched', count: activeCohort?.funnel?.targetMatched || 44, pct: 92, color: 'bg-[#62A7FF]' },
              { label: '4. Active on 5-Phase Plan', count: activeCohort?.funnel?.roadmapActive || 38, pct: 79, color: 'bg-amber-500' },
              { label: '5. Technical Interview Verified', count: activeCohort?.funnel?.interviewReady || 34, pct: 71, color: 'bg-[#16A34A]' },
              { label: '6. Offers Placed', count: activeCohort?.funnel?.placed || 12, pct: 25, color: 'bg-emerald-600' },
            ].map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#171717]">{step.label}</span>
                  <span className="font-bold text-[#171717]">{step.count} ({step.pct}%)</span>
                </div>
                <div className="w-full bg-[#F8F8F6] h-2 rounded-full overflow-hidden border border-[#E7E7E4]">
                  <div className={`h-full rounded-full ${step.color}`} style={{ width: `${step.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recruiter Talent Directory (PRD Phase 4) */}
      <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                Recruiter Portal
              </span>
              <span className="text-[10px] font-semibold text-[#16A34A] bg-green-50 border border-green-200 px-2 py-0.2 rounded-full">
                ✓ Pre-Vetted Telemetry
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-xl text-[#171717]">
              Candidate Talent Directory ({candidates.length})
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Browse job-ready candidates with verified skills, ATS scores, and spoken technical interview ratings.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, role, or skill..."
              className="w-full pl-9 pr-4 py-2 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#171717]">
            <Filter className="w-3.5 h-3.5 text-[#62A7FF]" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#6B6B6B]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-[#E7E7E4] rounded-lg px-2.5 py-1 font-semibold text-xs text-[#171717] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Ready to Hire">Ready to Hire</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Placed">Placed</option>
              <option value="Upskilling">Upskilling</option>
            </select>
          </div>

          {/* Skill Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#6B6B6B]">Key Skill:</span>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="bg-white border border-[#E7E7E4] rounded-lg px-2.5 py-1 font-semibold text-xs text-[#171717] focus:outline-none"
            >
              <option value="all">All Skills</option>
              <option value="React">React</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Node.js">Node.js</option>
              <option value="Kubernetes">Kubernetes</option>
              <option value="AWS">AWS</option>
              <option value="Go">Go</option>
              <option value="Python">Python</option>
              <option value="PostgreSQL">PostgreSQL</option>
            </select>
          </div>

          {/* Minimum Readiness Slider */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] text-[#6B6B6B]">Min Readiness:</span>
            <input
              type="range"
              min={70}
              max={95}
              value={minReadiness}
              onChange={(e) => setMinReadiness(parseInt(e.target.value, 10))}
              className="w-24 accent-[#62A7FF] cursor-pointer"
            />
            <span className="font-bold text-[#62A7FF] w-8">{minReadiness}%</span>
          </div>
        </div>

        {/* Candidate Directory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="bg-white border border-[#E7E7E4] hover:border-[#62A7FF]/50 rounded-2xl p-5 card-subtle space-y-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-[#171717] text-white flex items-center justify-center font-heading font-extrabold text-base">
                    {cand.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#171717] flex items-center gap-1.5">
                      {cand.name}
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          cand.placementStatus === 'Ready to Hire'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : cand.placementStatus === 'Placed'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {cand.placementStatus}
                      </span>
                    </h4>
                    <p className="text-xs font-semibold text-[#62A7FF]">{cand.targetRole}</p>
                    <p className="text-[10px] text-[#6B6B6B]">{cand.university || 'Engineering Campus'}</p>
                  </div>
                </div>

                {/* Readiness Gauge */}
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B]">Readiness</span>
                  <div className="font-heading font-extrabold text-lg text-[#16A34A]">
                    {cand.careerReadiness}%
                  </div>
                </div>
              </div>

              {/* Badges Bar */}
              <div className="flex flex-wrap gap-1.5">
                {cand.badges.map((b, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F8F8F6] border border-[#E7E7E4] text-[#171717]"
                  >
                    {b}
                  </span>
                ))}
                {cand.voiceInterviewWpm && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5" /> {cand.voiceInterviewWpm} WPM Cadence
                  </span>
                )}
              </div>

              {/* Skills Chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Verified Technical Stack</span>
                <div className="flex flex-wrap gap-1">
                  {cand.verifiedSkills.slice(0, 6).map((s) => (
                    <span
                      key={s}
                      className="text-[10px] font-semibold bg-[#F8F8F6] border border-[#E7E7E4] px-2 py-0.5 rounded text-[#171717]"
                    >
                      {s}
                    </span>
                  ))}
                  {cand.verifiedSkills.length > 6 && (
                    <span className="text-[10px] text-[#6B6B6B] px-1 py-0.5">
                      +{cand.verifiedSkills.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {/* Capstone Project Evidence */}
              <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] text-[11px] text-[#6B6B6B] line-clamp-2">
                <strong className="text-[#171717]">Project Evidence:</strong> {cand.recentProject}
              </div>

              {/* Card Footer: Metrics & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E7E7E4]">
                <div className="flex items-center space-x-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#6B6B6B]">ATS: </span>
                    <strong className="text-[#171717]">{cand.atsScore}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6B6B]">Interview: </span>
                    <strong className="text-[#171717]">{cand.interviewScore}/10</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedCandidate(cand)}
                    className="px-3 py-1.5 bg-white hover:bg-[#F8F8F6] border border-[#E7E7E4] rounded-lg text-xs font-bold text-[#171717] transition-colors cursor-pointer"
                  >
                    Dossier
                  </button>

                  <button
                    onClick={() => setOutreachModalCandidate(cand)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      cand.outreachSent
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : 'bg-[#62A7FF] hover:bg-[#4B92F0] text-white shadow-xs'
                    }`}
                  >
                    <Send className="w-3 h-3" />
                    <span>{cand.outreachSent ? 'Invite Sent' : 'Request Interview'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Candidate Telemetry Dossier Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-6 text-left shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#E7E7E4]">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                  Verified Candidate Telemetry
                </span>
                <h3 className="font-heading font-extrabold text-2xl text-[#171717]">
                  {selectedCandidate.name}
                </h3>
                <p className="text-xs text-[#62A7FF] font-bold">{selectedCandidate.targetRole} • {selectedCandidate.university}</p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="w-8 h-8 rounded-full bg-[#F8F8F6] hover:bg-[#E7E7E4] text-[#171717] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] text-center">
                <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Career Readiness</span>
                <p className="font-heading font-extrabold text-xl text-[#16A34A]">{selectedCandidate.careerReadiness}%</p>
              </div>
              <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] text-center">
                <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">ATS Score</span>
                <p className="font-heading font-extrabold text-xl text-[#171717]">{selectedCandidate.atsScore}%</p>
              </div>
              <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] text-center">
                <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Mock Interview</span>
                <p className="font-heading font-extrabold text-xl text-purple-700">{selectedCandidate.interviewScore} / 10</p>
              </div>
            </div>

            {/* Project Deep Dive */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#171717] uppercase tracking-wider">Validated Project Accomplishments</h4>
              <p className="text-xs text-[#6B6B6B] leading-relaxed bg-[#F8F8F6] p-4 rounded-xl border border-[#E7E7E4]">
                {selectedCandidate.recentProject}
              </p>
            </div>

            {/* Technical Verification Feedback */}
            {selectedCandidate.interviewFeedback && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-[#171717] uppercase tracking-wider">Technical Screening Feedback</h4>
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-950">
                  {selectedCandidate.interviewFeedback}
                </div>
              </div>
            )}

            {/* Verified Skills Cloud */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#171717] uppercase tracking-wider">Verified Engineering Competencies</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.verifiedSkills.map((s) => (
                  <span key={s} className="px-3 py-1 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] text-xs font-bold text-[#171717]">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E7E7E4]">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 border border-[#E7E7E4] rounded-xl text-xs font-bold text-[#6B6B6B] hover:text-[#171717] cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = selectedCandidate;
                  setSelectedCandidate(null);
                  setOutreachModalCandidate(target);
                }}
                className="px-5 py-2 bg-[#62A7FF] hover:bg-[#4B92F0] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Send Interview Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recruiter Outreach Modal */}
      {outreachModalCandidate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 text-left shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4]">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase">Recruiter Fast-Track</span>
                <h3 className="font-heading font-extrabold text-lg text-[#171717]">
                  Invite {outreachModalCandidate.name} to Interview
                </h3>
              </div>
              <button
                onClick={() => setOutreachModalCandidate(null)}
                className="w-7 h-7 rounded-full bg-[#F8F8F6] hover:bg-[#E7E7E4] flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#171717] block mb-1">Target Position</label>
                <input
                  type="text"
                  defaultValue={outreachModalCandidate.targetRole}
                  className="w-full p-2.5 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl text-xs text-[#171717] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#171717] block mb-1">Personalized Outreach Message</label>
                <textarea
                  rows={4}
                  value={customOutreachMsg}
                  onChange={(e) => setCustomOutreachMsg(e.target.value)}
                  placeholder={`Hi ${outreachModalCandidate.name}, we were impressed by your verified telemetry in ${outreachModalCandidate.verifiedSkills.slice(0, 3).join(', ')} and would love to fast-track you to a technical screen...`}
                  className="w-full p-3 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7E7E4]">
              <button
                onClick={() => setOutreachModalCandidate(null)}
                className="px-4 py-2 border border-[#E7E7E4] rounded-xl text-xs font-bold text-[#6B6B6B] hover:text-[#171717] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendOutreach(outreachModalCandidate)}
                disabled={sendingOutreach}
                className="px-5 py-2 bg-[#62A7FF] hover:bg-[#4B92F0] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {sendingOutreach ? 'Dispatching...' : 'Send Interview Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
