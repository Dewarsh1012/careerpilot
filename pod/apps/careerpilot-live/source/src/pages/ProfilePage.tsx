import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCareer } from '../context/CareerContext';
import { api } from '../services/api';
import {
  UserCheck,
  Code2,
  Briefcase,
  Sparkles,
  Plus,
  Pencil,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  GraduationCap,
  FolderGit2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Upload,
  RefreshCw,
  Award,
  Target,
  ChevronDown,
  Layers,
  Zap,
  ExternalLink,
  Link2,
  Globe,
} from 'lucide-react';
import {
  ProfileEditorModal,
  userToProfileForm,
  type ProfileFormValues,
} from '../components/profile/ProfileEditorModal';
import type { SkillItem, ProjectItem, ConnectorAccount } from '../types';

interface ProfilePageProps {
  setCurrentTab?: (tab: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ setCurrentTab }) => {
  const { user, updateOnboarding, refreshUser } = useAuth();
  const {
    activeJob,
    activeResume,
    allResumes,
    allJobs,
    activeMatch,
    readinessScore,
    refreshCareer,
    selectJobAndMatch,
    setActiveResumeTrack,
  } = useCareer();

  const [editorOpen, setEditorOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeGapTab, setActiveGapTab] = useState<'all' | 'matched' | 'partial' | 'missing'>('all');
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
  const [switchingJob, setSwitchingJob] = useState(false);
  const [connectorAccounts, setConnectorAccounts] = useState<ConnectorAccount[]>([]);
  const [connectingTool, setConnectingTool] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Lemma Connectors
  useEffect(() => {
    api.connectors.getAccounts().then((res) => {
      if (res?.accounts) setConnectorAccounts(res.accounts);
    }).catch(() => {});
  }, []);

  const handleConnectTool = async (connectorId: string) => {
    setConnectingTool(connectorId);
    try {
      const res = await api.connectors.createConnectRequest(connectorId);
      if (res.authorizationUrl) {
        window.open(res.authorizationUrl, '_blank', 'width=620,height=750');
      }
    } catch (e) {
      console.warn('Failed to connect tool:', e);
    } finally {
      setConnectingTool(null);
    }
  };

  // Sync skills from resume intelligence or user
  useEffect(() => {
    const resumeSkills = activeResume?.analysis?.skills;
    const userSkills = user?.verifiedSkills;
    if (resumeSkills && resumeSkills.length > 0) {
      setSkills(resumeSkills);
    } else if (userSkills && userSkills.length > 0) {
      setSkills(userSkills);
    } else {
      setSkills([]);
    }
  }, [activeResume, user?.verifiedSkills]);

  // Candidate Data from resume analysis or user profile
  const candidateName =
    activeResume?.analysis?.candidateName && activeResume.analysis.candidateName !== 'Candidate'
      ? activeResume.analysis.candidateName
      : user?.name || 'Professional Member';

  const candidateEmail = activeResume?.analysis?.email || user?.email || '';
  const candidatePhone = activeResume?.analysis?.phone || user?.phone || '';
  const candidateLocation = activeResume?.analysis?.location || user?.location || '';
  const candidateRole =
    activeResume?.analysis?.currentRole || user?.currentRole || user?.currentStatus || 'Software Engineer';
  const candidateSummary = activeResume?.analysis?.summary || user?.summary || '';

  const experienceList =
    (activeResume?.analysis?.experience && activeResume.analysis.experience.length > 0
      ? activeResume.analysis.experience
      : user?.experience) || [];

  const projectsList: ProjectItem[] =
    (activeResume?.analysis?.projects && activeResume.analysis.projects.length > 0
      ? activeResume.analysis.projects
      : user?.projects) || [];

  const educationList =
    (activeResume?.analysis?.education && activeResume.analysis.education.length > 0
      ? activeResume.analysis.education
      : user?.education) || [];

  const strengthsList =
    (activeResume?.analysis?.strengths && activeResume.analysis.strengths.length > 0
      ? activeResume.analysis.strengths
      : user?.strengths) || [];

  const growthAreasList =
    (activeResume?.analysis?.growthAreas && activeResume.analysis.growthAreas.length > 0
      ? activeResume.analysis.growthAreas
      : user?.growthAreas) || [];

  // Skill Gap Data from active match
  const matchedSkills = activeMatch?.matchedSkills || [];
  const partialSkills = activeMatch?.partialSkills || [];
  const missingSkills = activeMatch?.missingSkills || [];
  const matchScore = activeMatch?.matchScore ?? readinessScore ?? 78;
  const readinessLevel =
    activeMatch?.readinessLevel ||
    (matchScore >= 80 ? 'Interview Ready' : matchScore >= 60 ? 'Needs Target Prep' : 'Foundational Gap');
  const nextMove =
    activeMatch?.nextMove ||
    (missingSkills.length > 0
      ? `Focus on mastering ${missingSkills[0].name} to boost job match alignment.`
      : 'Practice full technical interviews for your target position.');

  const targetJobTitle = activeJob?.roleTitle || activeMatch?.jobTitle || user?.targetRole || 'Full Stack Engineer';
  const targetCompany = activeJob?.company || activeMatch?.company || 'Target Company';

  const profileFormInitial = useMemo(() => userToProfileForm(user), [user]);

  const handleSaveProfile = async (values: ProfileFormValues) => {
    await updateOnboarding({
      name: values.name,
      email: values.email,
      currentStatus: values.currentStatus,
      experienceLevel: values.experienceLevel,
      targetRole: values.targetRole,
      interests: values.interests,
      verifiedSkills: values.verifiedSkills,
      onboarded: true,
    });
    setSkills(values.verifiedSkills);
    await refreshUser();
    await refreshCareer();
    setSaveMessage('Profile changes successfully saved.');
    window.setTimeout(() => setSaveMessage(''), 3500);
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;

    const updated = [...skills, newSkill.trim()];
    setSkills(updated);
    setNewSkill('');
    await updateOnboarding({ verifiedSkills: updated });
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);
    await updateOnboarding({ verifiedSkills: updated });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadingResume(true);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.resume.uploadResume(formData);
      if (res.success && res.resume) {
        await refreshUser();
        await refreshCareer();
        setSaveMessage(`Resume "${file.name}" extracted & profile updated!`);
        window.setTimeout(() => setSaveMessage(''), 4000);
      } else {
        setUploadError(res.error || 'Failed to extract resume telemetry. Please check file format.');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Error uploading resume. Supported formats: PDF, DOCX, TXT.');
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSwitchTargetJob = async (jobId: string) => {
    setSwitchingJob(true);
    setJobDropdownOpen(false);
    try {
      await selectJobAndMatch(jobId);
      await refreshCareer();
    } catch (err) {
      console.error('Job match failed:', err);
    } finally {
      setSwitchingJob(false);
    }
  };

  // Group technologies if available
  const categorizedTechnologies = useMemo(() => {
    const techList: SkillItem[] = activeResume?.analysis?.technologies || [];
    if (techList.length === 0) return null;

    const groups: Record<string, string[]> = {};
    techList.forEach((item) => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item.name);
    });
    return groups;
  }, [activeResume]);

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-16">
      {/* Hidden File Input for Resume Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
      />

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-800 text-xs">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Save Success Alert */}
      {saveMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center space-x-2 text-green-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* 1. HERO PROFILE CARD */}
      <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 md:p-8 card-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-start md:items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#171717] to-[#333333] text-white flex items-center justify-center font-heading font-extrabold text-2xl uppercase shadow-lg border border-black/10 shrink-0">
            {candidateName.charAt(0) || 'P'}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#62A7FF] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                <UserCheck className="w-3 h-3 text-[#62A7FF]" />
                Resume Intelligence Verified
              </span>
              {activeResume && (
                <span className="text-[10px] font-semibold text-[#6B6B6B] bg-[#F8F8F6] border border-[#E7E7E4] px-2 py-0.5 rounded-md">
                  Active: {activeResume.fileName}
                </span>
              )}
            </div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#171717] leading-tight">
              {candidateName}
            </h1>
            <p className="text-xs font-semibold text-[#4B5563]">{candidateRole}</p>

            {/* Contact metadata pills */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#6B6B6B]">
              {candidateEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  {candidateEmail}
                </span>
              )}
              {candidatePhone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  {candidatePhone}
                </span>
              )}
              {candidateLocation && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  {candidateLocation}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons & Readiness Score */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingResume}
              className="px-4 py-2.5 bg-[#171717] hover:bg-[#2b2b2b] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
            >
              {uploadingResume ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Resume…</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Resume</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="px-3.5 py-2.5 border border-[#E7E7E4] hover:bg-[#F8F8F6] text-[#171717] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <Pencil className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2 w-full">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Readiness Index</span>
              <span className="text-sm font-extrabold text-[#16A34A]">{readinessScore}%</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-[#16A34A]">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE RESUME STATUS & SWITCHER BANNER */}
      {activeResume ? (
        <div className="bg-[#F8F8F6] border border-[#E7E7E4] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E7E7E4] flex items-center justify-center text-[#62A7FF] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#171717]">
                Active Resume: <span className="font-extrabold text-[#62A7FF]">{activeResume.fileName}</span>
              </p>
              <p className="text-[11px] text-[#6B6B6B]">
                {skills.length} skills extracted • {experienceList.length} roles • {projectsList.length} projects •
                Extracted on {new Date(activeResume.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allResumes.length > 1 && (
              <select
                value={activeResume.id}
                onChange={(e) => setActiveResumeTrack(e.target.value)}
                className="bg-white border border-[#E7E7E4] text-xs font-semibold text-[#171717] rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                {allResumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fileName} {r.id === activeResume.id ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            )}
            {setCurrentTab && (
              <button
                type="button"
                onClick={() => setCurrentTab('resume')}
                className="text-xs font-bold text-[#62A7FF] hover:underline flex items-center gap-1"
              >
                <span>Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-sm text-[#1E3A8A]">
              Upload Your Resume to Auto-Extract Complete Profile Intelligence
            </h3>
            <p className="text-xs text-[#3B82F6]">
              Instantly extract candidate contact info, executive summary, verified tech skills, projects, work history,
              and calculate your skill gap against {targetJobTitle}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Resume File</span>
          </button>
        </div>
      )}

      {/* 3. TARGET JOB SKILL GAP DIAGNOSTICS CARD (PROMINENT REQUIREMENT) */}
      <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 md:p-7 card-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#62A7FF]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#62A7FF]">
                  Skill Gap Intelligence
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    readinessLevel === 'Interview Ready'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : readinessLevel === 'Needs Target Prep'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {readinessLevel}
                </span>
              </div>
              <h2 className="font-heading font-extrabold text-xl text-[#171717]">
                Skill Gap Matrix: Candidate vs. Target Job
              </h2>
            </div>
          </div>

          {/* Target Job Selector Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B6B6B] font-semibold">Target:</span>
              <button
                type="button"
                onClick={() => setJobDropdownOpen(!jobDropdownOpen)}
                disabled={switchingJob}
                className="px-3.5 py-2 bg-[#F8F8F6] border border-[#E7E7E4] hover:border-[#62A7FF] rounded-xl text-xs font-bold text-[#171717] flex items-center gap-2 transition-all"
              >
                <span>
                  {targetJobTitle} @ {targetCompany}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
              </button>
            </div>

            {jobDropdownOpen && allJobs.length > 0 && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E7E7E4] rounded-2xl shadow-xl z-30 p-2 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] border-b border-[#E7E7E4]">
                  Select Target Job for Skill Gap
                </div>
                {allJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleSwitchTargetJob(job.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#F8F8F6] text-xs transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-[#171717]">{job.roleTitle}</p>
                      <p className="text-[11px] text-[#6B6B6B]">{job.company}</p>
                    </div>
                    {job.id === activeJob?.id && (
                      <span className="text-[10px] font-bold text-[#62A7FF] bg-blue-50 px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Match Score Meter & Next Move Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#6B6B6B]">Overall Match Score</span>
              <div className="flex items-baseline space-x-2">
                <span className="font-heading font-extrabold text-2xl text-[#171717]">{matchScore}%</span>
                <span className="text-xs font-semibold text-[#16A34A]">calculated</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E7E7E4] flex items-center justify-center font-bold text-sm text-[#62A7FF]">
              {matchScore}
            </div>
          </div>

          <div className="p-4 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl md:col-span-2 flex flex-col justify-center space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#171717]">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>AI Tactical Next Move</span>
            </div>
            <p className="text-xs text-[#4B5563] leading-relaxed">{nextMove}</p>
          </div>
        </div>

        {/* 3-Way Skill Breakdown Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E7E7E4] pb-2">
          <button
            type="button"
            onClick={() => setActiveGapTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeGapTab === 'all'
                ? 'bg-[#171717] text-white shadow-xs'
                : 'text-[#6B6B6B] hover:text-[#171717] hover:bg-[#F8F8F6]'
            }`}
          >
            All Skills ({matchedSkills.length + partialSkills.length + missingSkills.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveGapTab('matched')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeGapTab === 'matched'
                ? 'bg-green-700 text-white shadow-xs'
                : 'text-green-700 hover:bg-green-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Matched ({matchedSkills.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveGapTab('partial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeGapTab === 'partial'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Partial ({partialSkills.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveGapTab('missing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeGapTab === 'missing'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Missing Gaps ({missingSkills.length})</span>
          </button>
        </div>

        {/* Detailed Skill Gap Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* MATCHED SKILLS COLUMN */}
          {(activeGapTab === 'all' || activeGapTab === 'matched') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-green-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Matched Skills ({matchedSkills.length})</span>
                </span>
                <span className="text-[10px] text-[#6B6B6B]">Verified on resume</span>
              </div>

              {matchedSkills.length > 0 ? (
                <div className="space-y-2">
                  {matchedSkills.map((m, i) => (
                    <div
                      key={`${m.name}-${i}`}
                      className="p-3 bg-green-50/60 border border-green-200 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#171717]">{m.name}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-green-700 bg-green-100/80 px-2 py-0.5 rounded">
                          {m.category || 'Core'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed">
                        {m.evidence || 'Proven in candidate projects & work history.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl text-center text-xs text-[#6B6B6B]">
                  No exact matched skills identified yet.
                </div>
              )}
            </div>
          )}

          {/* PARTIAL SKILLS COLUMN */}
          {(activeGapTab === 'all' || activeGapTab === 'partial') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Partial Skills ({partialSkills.length})</span>
                </span>
                <span className="text-[10px] text-[#6B6B6B]">Depth needed</span>
              </div>

              {partialSkills.length > 0 ? (
                <div className="space-y-2">
                  {partialSkills.map((p, i) => (
                    <div
                      key={`${p.name}-${i}`}
                      className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#171717]">{p.name}</span>
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                          {p.currentLevel || 'Familiar'} → {p.requiredLevel || 'Production'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed">
                        {p.gapExplanation || 'Candidate has related exposure; needs hands-on production depth.'}
                      </p>
                      {p.recommendation && (
                        <p className="text-[11px] font-semibold text-amber-800 bg-amber-100/50 p-1.5 rounded-md">
                          Action: {p.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl text-center text-xs text-[#6B6B6B]">
                  No partial skill gaps identified.
                </div>
              )}
            </div>
          )}

          {/* MISSING SKILLS COLUMN */}
          {(activeGapTab === 'all' || activeGapTab === 'missing') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Missing Gaps ({missingSkills.length})</span>
                </span>
                <span className="text-[10px] text-[#6B6B6B]">Required for role</span>
              </div>

              {missingSkills.length > 0 ? (
                <div className="space-y-2">
                  {missingSkills.map((m, i) => (
                    <div
                      key={`${m.name}-${i}`}
                      className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#171717]">{m.name}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded">
                          {m.importance || 'High'} Priority
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4B5563] leading-relaxed">
                        {m.impactOnRole || 'Expected requirement for technical screening.'}
                      </p>
                      {m.recommendation && (
                        <p className="text-[11px] font-semibold text-rose-800 bg-rose-100/50 p-1.5 rounded-md">
                          Task: {m.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl text-center text-xs text-[#6B6B6B]">
                  Outstanding! Zero missing skills identified for this position.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Skill Gap Navigation CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E7E7E4]">
          <span className="text-xs text-[#6B6B6B]">
            Turn these skill gaps into scheduled roadmap milestones or mock interview drills.
          </span>
          <div className="flex items-center gap-2">
            {setCurrentTab && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentTab('roadmap')}
                  className="px-3.5 py-2 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <span>Open 5-Phase Roadmap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('interview')}
                  className="px-3.5 py-2 border border-[#E7E7E4] hover:bg-[#F8F8F6] text-[#171717] text-xs font-bold rounded-xl transition-all"
                >
                  <span>Practice Questions</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. EXECUTIVE PROFESSIONAL SUMMARY */}
      {candidateSummary && (
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#62A7FF]" />
              <h3 className="font-heading font-bold text-sm text-[#171717]">Professional Executive Summary</h3>
            </div>
            <span className="text-[10px] font-bold text-[#62A7FF] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              Extracted from Resume
            </span>
          </div>
          <p className="text-xs text-[#4B5563] leading-relaxed">{candidateSummary}</p>
        </div>
      )}

      {/* 5. VERIFIED TECHNICAL SKILLS */}
      <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-[#62A7FF]" />
            <h3 className="font-heading font-bold text-sm text-[#171717]">
              Verified Technical Skills ({skills.length})
            </h3>
          </div>
          <span className="text-[11px] text-[#6B6B6B]">Extracted via Resume Intelligence</span>
        </div>

        {/* Categorized View if available */}
        {categorizedTechnologies ? (
          <div className="space-y-3">
            {Object.entries(categorizedTechnologies).map(([category, items]) => (
              <div key={category} className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
                  {category}
                </span>
                <div className="flex flex-wrap gap-2">
                  {items.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] text-xs font-bold text-[#171717]"
                    >
                      <span>{tech}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(tech)}
                        className="text-[#9CA3AF] hover:text-red-600 transition-colors ml-1 font-bold"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] text-xs font-bold text-[#171717]"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-[#9CA3AF] hover:text-red-600 transition-colors ml-1 font-bold"
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Quick Add Skill Form */}
        <form onSubmit={handleAddSkill} className="flex gap-2 pt-2 border-t border-[#E7E7E4]">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add additional skill (e.g. GraphQL, Tailwind, Redis, Docker)..."
            className="flex-1 p-2.5 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add skill</span>
          </button>
        </form>
      </div>

      {/* 6. WORK EXPERIENCE TIMELINE */}
      {experienceList.length > 0 && (
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#E7E7E4]">
            <Briefcase className="w-4 h-4 text-[#62A7FF]" />
            <h3 className="font-heading font-bold text-sm text-[#171717]">
              Professional Experience ({experienceList.length})
            </h3>
          </div>

          <div className="space-y-4">
            {experienceList.map((exp, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl space-y-2 relative"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="font-bold text-sm text-[#171717]">{exp.title}</h4>
                    <p className="text-xs font-semibold text-[#62A7FF]">{exp.company}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-[#6B6B6B] bg-white border border-[#E7E7E4] px-2.5 py-1 rounded-md">
                      {exp.duration}
                    </span>
                    {exp.location && (
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">{exp.location}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed pt-1">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. VERIFIED PROJECTS SHOWCASE */}
      {projectsList.length > 0 && (
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#E7E7E4]">
            <FolderGit2 className="w-4 h-4 text-[#62A7FF]" />
            <h3 className="font-heading font-bold text-sm text-[#171717]">
              Extracted Project Experience ({projectsList.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectsList.map((proj, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-[#171717]">{proj.title}</h4>
                  <p className="text-xs text-[#4B5563] leading-relaxed">{proj.description}</p>
                </div>
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {proj.technologies.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-bold text-[#62A7FF] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. EDUCATION & CREDENTIALS */}
      {educationList.length > 0 && (
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#E7E7E4]">
            <GraduationCap className="w-4 h-4 text-[#62A7FF]" />
            <h3 className="font-heading font-bold text-sm text-[#171717]">
              Education & Academic Credentials
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {educationList.map((edu, idx) => (
              <div key={idx} className="p-4 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#62A7FF] uppercase tracking-wider block">
                  {edu.year || 'Degree'}
                </span>
                <h4 className="font-bold text-xs text-[#171717]">{edu.degree}</h4>
                <p className="text-xs text-[#6B6B6B]">{edu.institution}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. AI STRATEGIC ASSESSMENT: STRENGTHS & GROWTH AREAS */}
      {(strengthsList.length > 0 || growthAreasList.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strengthsList.length > 0 && (
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#E7E7E4]">
                <Award className="w-4 h-4 text-green-600" />
                <h3 className="font-heading font-bold text-sm text-[#171717]">Key Candidate Strengths</h3>
              </div>
              <ul className="space-y-2 text-xs text-[#4B5563]">
                {strengthsList.map((strItem, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                    <span>{strItem}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {growthAreasList.length > 0 && (
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#E7E7E4]">
                <Target className="w-4 h-4 text-amber-600" />
                <h3 className="font-heading font-bold text-sm text-[#171717]">Strategic Growth Targets</h3>
              </div>
              <ul className="space-y-2 text-xs text-[#4B5563]">
                {growthAreasList.map((gItem, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{gItem}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 10. LEMMA AI AGENT POD TELEMETRY */}
      <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#E7E7E4]">
          <Sparkles className="w-4 h-4 text-[#62A7FF]" />
          <h3 className="font-heading font-bold text-sm text-[#171717]">Lemma AI Agent Status</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {[
            { name: 'Resume Analyst', desc: 'Extraction & ATS Telemetry', active: true },
            { name: 'Job Analyst', desc: 'JD Parsing & Gap Engine', active: true },
            { name: 'Career Coach', desc: '5-Phase Milestone Engine', active: true },
            { name: 'Interview Coach', desc: 'STAR Audio & Code Eval', active: true },
          ].map((agent) => (
            <div
              key={agent.name}
              className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] flex flex-col justify-between space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#171717]">{agent.name}</span>
                <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                  Ready
                </span>
              </div>
              <span className="text-[10px] text-[#6B6B6B]">{agent.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 11. LEMMA CONNECTED TOOLS & INTEGRATIONS */}
      <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
          <div className="flex items-center space-x-2">
            <Link2 className="w-4 h-4 text-[#62A7FF]" />
            <h3 className="font-heading font-bold text-sm text-[#171717]">Connected Tools & Connectors</h3>
          </div>
          <span className="text-[11px] text-[#6B6B6B]">Managed via Lemma Pod</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {[
            {
              id: 'google_calendar',
              name: 'Google Calendar & Identity',
              desc: 'Sync interview schedules & calendar availability',
              icon: 'https://logos.composio.dev/api/googlecalendar',
              match: connectorAccounts.find((a) => a.connector_id === 'google_calendar'),
            },
            {
              id: 'googlemeet',
              name: 'Google Meet',
              desc: 'Live video interview room generation',
              icon: 'https://logos.composio.dev/api/googlemeet',
              match: connectorAccounts.find((a) => a.connector_id === 'googlemeet'),
            },
            {
              id: 'github',
              name: 'GitHub',
              desc: 'Portfolio repos, PRs & commit analysis',
              icon: 'https://logos.composio.dev/api/github',
              match: connectorAccounts.find((a) => a.connector_id === 'github'),
            },
            {
              id: 'linkedin',
              name: 'LinkedIn',
              desc: 'Professional profile & endorsement sync',
              icon: 'https://logos.composio.dev/api/linkedin',
              match: connectorAccounts.find((a) => a.connector_id === 'linkedin'),
            },
          ].map((tool) => (
            <div
              key={tool.id}
              className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] flex flex-col justify-between space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <img src={tool.icon} alt="" className="w-5 h-5 rounded-full shrink-0" />
                  <div>
                    <p className="font-bold text-[#171717]">{tool.name}</p>
                    <p className="text-[10px] text-[#6B6B6B]">{tool.desc}</p>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                {tool.match ? (
                  <div className="flex items-center space-x-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span>Connected</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnectTool(tool.id)}
                    disabled={connectingTool === tool.id}
                    className="text-[10px] font-bold text-[#62A7FF] hover:underline flex items-center gap-1"
                  >
                    <span>Connect</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
                {tool.match?.display_name && (
                  <span className="text-[9px] text-[#6B6B6B] truncate max-w-[100px]">
                    {tool.match.display_name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <ProfileEditorModal
        open={editorOpen}
        initial={profileFormInitial}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveProfile}
      />
    </div>
  );
};
