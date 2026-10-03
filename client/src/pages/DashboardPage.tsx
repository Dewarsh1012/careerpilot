import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCareer } from '../context/CareerContext';
import { JourneyBar } from '../components/common/JourneyBar';
import { NextMoveCard } from '../components/common/NextMoveCard';
import { api } from '../services/api';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Briefcase,
  Milestone,
  MessageSquareCode,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  ChevronRight,
  UploadCloud,
  FileText,
  Check,
  Mail,
  MapPin,
  Phone,
  GraduationCap,
  FolderGit2,
  Code2,
  Target,
  Award,
  RefreshCw,
  Zap,
  Upload,
  UserCheck,
} from 'lucide-react';

interface DashboardPageProps {
  setCurrentTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setCurrentTab }) => {
  const { user, refreshUser } = useAuth();
  const {
    activeJob,
    activeMatch,
    careerPlan,
    readinessScore,
    activeResume,
    allResumes,
    hasResume,
    refreshCareer,
  } = useCareer();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.resume.uploadResume(formData);
      if (res.success) {
        await refreshUser();
        await refreshCareer();
      } else {
        setUploadError(res.error || 'Failed to extract resume telemetry.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload error. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const analysis = activeResume?.analysis;
  const missingSkills = activeMatch?.missingSkills || [];
  const candidateDisplayName =
    analysis?.candidateName && analysis.candidateName !== 'Candidate'
      ? analysis.candidateName
      : user?.name || user?.email?.split('@')[0] || 'Candidate';

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* Hidden file input for fast resume upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
      />

      {/* Upload Error Banner */}
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

      {/* CASE 1: NO RESUME UPLOADED YET (ZERO PROFILE STATE) */}
      {!activeResume && allResumes.length === 0 ? (
        <div className="space-y-6">
          {/* Welcome Banner for Fresh ID */}
          <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#62A7FF] uppercase tracking-wider">
                  Career Workspace Ready
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#171717] tracking-tight">
                Welcome, {candidateDisplayName}
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6B6B]">
                Upload your resume to dynamically generate your candidate profile and skill benchmarks.
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-5 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Telemetry...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Resume</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Resume Upload Hero Card */}
          <div className="bg-gradient-to-br from-white via-white to-blue-50/30 border-2 border-dashed border-[#62A7FF]/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 card-subtle">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 border border-blue-200 text-[#62A7FF] flex items-center justify-center shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#62A7FF] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Step 1 of Your Career Journey
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#171717]">
                Upload Your Resume to Build Your Dynamic Profile
              </h2>
              <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
                In CareerPilot, all data is generated dynamically. Upload your resume to extract candidate telemetry, verify skills, calculate target job readiness scores, and build your personalized career roadmap.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-3 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Telemetry...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Resume (.PDF / .DOCX / .TXT)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCurrentTab('resume')}
                className="px-5 py-3 border border-[#E7E7E4] hover:bg-[#F8F8F6] text-[#171717] text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#6B6B6B]" />
                <span>Open Resume Intelligence</span>
              </button>
            </div>

            {/* 4 Feature Unlocks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 max-w-5xl mx-auto text-left">
              <div className="p-4 rounded-2xl bg-white border border-[#E7E7E4] space-y-1.5 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#62A7FF] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="font-bold text-xs text-[#171717]">Dynamic Profile Telemetry</h4>
                <p className="text-[11px] text-[#6B6B6B]">
                  Extract verified skills, employment history, featured projects, and education.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E7E7E4] space-y-1.5 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="font-bold text-xs text-[#171717]">Target Job Gap Audit</h4>
                <p className="text-[11px] text-[#6B6B6B]">
                  Compare your verified skills against company job descriptions to uncover exact missing gaps.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E7E7E4] space-y-1.5 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h4 className="font-bold text-xs text-[#171717]">Adaptive Career Plan</h4>
                <p className="text-[11px] text-[#6B6B6B]">
                  Get multi-phase milestone tasks with deliverable proof to bridge requirements.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E7E7E4] space-y-1.5 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <h4 className="font-bold text-xs text-[#171717]">AI Interview Coach</h4>
                <p className="text-[11px] text-[#6B6B6B]">
                  Simulate technical screenings and receive instant scoring across correctness, depth, and clarity.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: RESUME UPLOADED - DYNAMIC DASHBOARD */
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#62A7FF] uppercase tracking-wider">
                  Career Workspace Active
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              </div>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#171717] tracking-tight">
                Welcome back, {candidateDisplayName}
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6B6B]">
                {activeJob ? (
                  <>
                    Preparing for <span className="font-semibold text-[#171717]">{activeJob.roleTitle}</span> at <span className="font-semibold text-[#171717]">{activeJob.company}</span>.
                  </>
                ) : (
                  'Resume analyzed. Next, add or select a target job to calculate skill alignment.'
                )}
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setCurrentTab('resume')}
                className="px-4 py-2 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-xs font-bold text-[#171717] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-[#6B6B6B]" />
                <span>Update Resume</span>
              </button>
              <button
                onClick={() => setCurrentTab(activeJob ? 'match' : 'jobs')}
                className="px-4 py-2 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{activeJob ? 'View Skill Gaps' : 'Select Target Job'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Extracted Resume Intelligence & Candidate Profile Telemetry */}
          <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-6">
            {/* Header Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E7E7E4]">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#62A7FF] to-[#2563EB] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                  {candidateDisplayName.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-[#62A7FF] tracking-wider">
                      Extracted Candidate Telemetry
                    </span>
                    <span className="text-[10px] font-bold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Lemma AI Verified
                    </span>
                    {activeResume?.fileName && (
                      <span className="text-[10px] text-[#6B6B6B] bg-[#F8F8F6] border border-[#E7E7E4] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#62A7FF]" />
                        {activeResume.fileName}
                      </span>
                    )}
                  </div>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#171717]">
                    {candidateDisplayName}
                  </h2>
                  <p className="text-xs text-[#6B6B6B]">
                    Target Track: <strong className="text-[#171717]">{activeJob?.roleTitle || user?.targetRole || 'Software Engineering'}</strong>
                  </p>
                </div>
              </div>

              {/* Contact Pills & Action */}
              <div className="flex flex-wrap items-center gap-2">
                {(analysis?.email || user?.email) && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F8F6] border border-[#E7E7E4] text-[11px] text-[#6B6B6B]">
                    <Mail className="w-3.5 h-3.5 text-[#62A7FF]" />
                    <span>{analysis?.email || user?.email}</span>
                  </div>
                )}
                {analysis?.phone && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F8F6] border border-[#E7E7E4] text-[11px] text-[#6B6B6B]">
                    <Phone className="w-3.5 h-3.5 text-[#62A7FF]" />
                    <span>{analysis.phone}</span>
                  </div>
                )}
                {analysis?.location && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F8F6] border border-[#E7E7E4] text-[11px] text-[#6B6B6B]">
                    <MapPin className="w-3.5 h-3.5 text-[#62A7FF]" />
                    <span>{analysis.location}</span>
                  </div>
                )}
                <button
                  onClick={() => setCurrentTab('resume')}
                  className="px-3 py-1.5 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-xs font-bold text-[#171717] rounded-xl transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span>Manage Resume</span>
                </button>
              </div>
            </div>

            {/* Executive Summary */}
            {analysis?.summary && (
              <div className="p-4 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#62A7FF]" />
                    Executive Professional Summary
                  </span>
                  {analysis.domains && analysis.domains.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {analysis.domains.map((dom: string) => (
                        <span key={dom} className="text-[10px] font-semibold bg-white border border-[#E7E7E4] px-2 py-0.5 rounded-full text-[#171717]">
                          {dom}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#171717]/90 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            )}

            {/* Extracted Skills Cloud */}
            {((analysis?.skills && analysis.skills.length > 0) || (user?.verifiedSkills && user.verifiedSkills.length > 0)) && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#62A7FF]" />
                    <h3 className="font-heading font-bold text-sm text-[#171717]">
                      Extracted & Verified Skills ({((analysis?.skills || user?.verifiedSkills) ?? []).length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#62A7FF] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    Resume Telemetry
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {((analysis?.skills || user?.verifiedSkills) ?? []).map((skill: string) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-[#E7E7E4] text-[#171717] hover:border-[#62A7FF] transition-colors"
                    >
                      <Check className="w-3 h-3 text-[#16A34A]" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 2-Column: Work Experience & Key Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Work Experience */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E7E7E4]">
                  <Briefcase className="w-4 h-4 text-[#62A7FF]" />
                  <h3 className="font-heading font-bold text-sm text-[#171717]">
                    Work Experience & History
                  </h3>
                </div>
                {analysis?.experience && analysis.experience.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.experience.map((exp: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-[#E7E7E4] bg-[#F8F8F6] space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-xs text-[#171717]">{exp.title}</h4>
                            <p className="text-[11px] font-semibold text-[#62A7FF]">{exp.company}</p>
                          </div>
                          {exp.duration && (
                            <span className="text-[10px] font-medium bg-white border border-[#E7E7E4] px-2 py-0.5 rounded text-[#6B6B6B] shrink-0">
                              {exp.duration}
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-[#E7E7E4] text-center text-xs text-[#6B6B6B]">
                    Academic or early-career profile extracted.
                  </div>
                )}
              </div>

              {/* Featured Projects */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E7E7E4]">
                  <FolderGit2 className="w-4 h-4 text-[#62A7FF]" />
                  <h3 className="font-heading font-bold text-sm text-[#171717]">
                    Featured Technical Projects
                  </h3>
                </div>
                {analysis?.projects && analysis.projects.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.projects.map((proj: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-[#E7E7E4] bg-[#F8F8F6] space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-[#171717]">{proj.title}</h4>
                        </div>
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {proj.technologies.map((t: string) => (
                              <span key={t} className="text-[9px] font-semibold bg-white border border-[#E7E7E4] px-1.5 py-0.5 rounded text-[#171717]">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {proj.description && (
                          <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-[#E7E7E4] text-center text-xs text-[#6B6B6B]">
                    No separate technical projects extracted.
                  </div>
                )}
              </div>
            </div>

            {/* Education & Strengths / Growth Areas Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#E7E7E4]">
              {/* Education */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#62A7FF]" />
                  Education
                </span>
                {analysis?.education && analysis.education.length > 0 ? (
                  analysis.education.map((edu: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E7E7E4] text-xs">
                      <p className="font-bold text-[#171717]">{edu.degree}</p>
                      <p className="text-[11px] text-[#6B6B6B]">{edu.institution} {edu.year ? `(${edu.year})` : ''}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#6B6B6B] italic">Not specified in resume</p>
                )}
              </div>

              {/* Strengths */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#16A34A] tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  Verified Strengths
                </span>
                {analysis?.strengths && analysis.strengths.length > 0 ? (
                  <div className="space-y-1.5">
                    {analysis.strengths.map((s: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-green-950 bg-green-50/70 border border-green-200/80 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6B6B6B] italic">Extracted from code & architecture proficiency</p>
                )}
              </div>

              {/* Growth Areas */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#62A7FF] tracking-wider flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  Target Growth Areas
                </span>
                {analysis?.growthAreas && analysis.growthAreas.length > 0 ? (
                  <div className="space-y-1.5">
                    {analysis.growthAreas.map((g: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-blue-950 bg-blue-50/70 border border-blue-200/80 px-2.5 py-1 rounded-lg">
                        <ChevronRight className="w-3.5 h-3.5 text-[#62A7FF] shrink-0" />
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6B6B6B] italic">Identified from target job requirements</p>
                )}
              </div>
            </div>
          </div>

          {/* Signature Career Journey Bar */}
          <JourneyBar currentStage={activeMatch ? 'match' : 'resume'} onStageClick={(tab) => setCurrentTab(tab)} />

          {/* Dynamic Next Move Card */}
          <NextMoveCard
            title={activeMatch?.nextMove || (activeJob ? `Run Match against ${activeJob.roleTitle}` : 'Add or Select a Target Job')}
            actionText="What You Should Do Next"
            category="Strategic Career Action"
            description={
              activeMatch
                ? `Your target role alignment is currently at ${readinessScore}%. Follow this next move to close identified skill gaps.`
                : activeJob
                  ? `Compare your resume against ${activeJob.roleTitle} at ${activeJob.company} to compute your exact readiness score.`
                  : 'Select a target job from curated listings or paste your dream job description to start gap analysis.'
            }
            ctaLabel={activeMatch ? 'Open Career Plan' : activeJob ? 'Run Skill Gap Audit' : 'Pick Target Job'}
            onAction={() => setCurrentTab(activeMatch ? 'roadmap' : activeJob ? 'match' : 'jobs')}
          />

          {/* The Core PRD Questions Hierarchy (100% Dynamic) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. WHERE AM I? Career Readiness */}
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
                  1. Where Am I?
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  readinessScore >= 80 ? 'text-[#16A34A] bg-green-50 border-green-200' : 'text-[#62A7FF] bg-blue-50 border-blue-200'
                }`}>
                  {activeMatch ? 'Active Benchmark' : 'Pending Match'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-heading font-extrabold text-3xl text-[#171717]">
                    {readinessScore}%
                  </h3>
                  {readinessScore > 0 && (
                    <span className="text-xs font-bold text-[#16A34A] flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Live Score
                    </span>
                  )}
                </div>
                <div className="w-full bg-[#F8F8F6] h-2.5 rounded-full overflow-hidden border border-[#E7E7E4]">
                  <div
                    className="bg-[#62A7FF] h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(readinessScore, 5)}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#6B6B6B] pt-1">
                  Readiness level: <strong className="text-[#171717]">{activeMatch?.readinessLevel || 'Pending Target Match'}</strong>.
                </p>
              </div>

              <button
                onClick={() => setCurrentTab(activeMatch ? 'match' : 'jobs')}
                className="w-full py-2 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-[11px] font-bold text-[#171717] rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>{activeMatch ? 'See Gap Breakdown' : 'Select Target Job to Match'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
              </button>
            </div>

            {/* 2. WHERE AM I GOING? Target Role */}
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
                  2. Where Am I Going?
                </span>
                <Briefcase className="w-4 h-4 text-[#62A7FF]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-heading font-bold text-lg text-[#171717]">
                  {activeJob?.roleTitle || 'No Target Job Selected'}
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Company: <strong className="text-[#171717]">{activeJob?.company || 'Select Target Company'}</strong> {activeJob?.location ? `(${activeJob.location})` : ''}
                </p>
                {activeJob ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeJob.seniority && (
                      <span className="text-[10px] font-semibold bg-[#F8F8F6] border border-[#E7E7E4] px-2 py-0.5 rounded-md text-[#6B6B6B]">
                        {activeJob.seniority}
                      </span>
                    )}
                    {activeJob.experienceRequired && (
                      <span className="text-[10px] font-semibold bg-[#F8F8F6] border border-[#E7E7E4] px-2 py-0.5 rounded-md text-[#6B6B6B]">
                        {activeJob.experienceRequired}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#6B6B6B] italic">
                    Choose from curated roles or paste a job posting to begin.
                  </p>
                )}
              </div>

              <button
                onClick={() => setCurrentTab('jobs')}
                className="w-full py-2 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-[11px] font-bold text-[#171717] rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>{activeJob ? 'Switch or Add Target Job' : 'Select Target Job'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
              </button>
            </div>

            {/* 3. HOW AM I IMPROVING? Career Plan Progress */}
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
                  3. How Am I Improving?
                </span>
                <Milestone className="w-4 h-4 text-[#62A7FF]" />
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-heading font-bold text-lg text-[#171717]">
                    {careerPlan?.currentPhase || (activeMatch ? 'Phase 1: Foundations' : 'Plan Ready to Generate')}
                  </h3>
                  <span className="text-xs font-bold text-[#62A7FF]">
                    {careerPlan?.progressPercent || 0}% complete
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B]">
                  Active milestone: <strong className="text-[#171717]">{careerPlan?.nextTask || (activeMatch ? 'Review identified gaps' : 'Link target role')}</strong>
                </p>
                <p className="text-[11px] text-[#6B6B6B]">
                  {careerPlan?.completedTasks || 0} of {careerPlan?.totalTasks || 0} milestones verified.
                </p>
              </div>

              <button
                onClick={() => setCurrentTab('roadmap')}
                className="w-full py-2 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-[11px] font-bold text-[#171717] rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>Open Career Plan</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
              </button>
            </div>
          </div>

          {/* Bottom 2 Columns: Skill Gaps vs Interview Coach Readiness */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 4. WHAT AM I MISSING? High-Impact Skill Gaps */}
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
                    4. What Am I Missing?
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#171717]">
                    Identified Skill Gaps for {activeJob?.roleTitle || 'Target Role'}
                  </h3>
                </div>
                <span className="text-xs font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  {missingSkills.length} Actionable Gaps
                </span>
              </div>

              <div className="space-y-3">
                {missingSkills.length > 0 ? (
                  missingSkills.slice(0, 3).map((gap: any) => (
                    <div
                      key={gap.name}
                      className="p-3.5 rounded-xl border border-red-200/70 bg-red-50/40 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                          <h4 className="font-bold text-xs text-red-950">{gap.name}</h4>
                          <span className="text-[9px] font-bold uppercase bg-white border border-red-200 px-1.5 py-0.2 rounded text-red-700">
                            {gap.importance || 'High'} Impact
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B6B6B]">
                          {gap.recommendation || 'Complete targeted implementation project.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setCurrentTab('roadmap')}
                        className="shrink-0 text-[10px] font-bold text-[#62A7FF] hover:underline cursor-pointer"
                      >
                        View Task →
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-[#E7E7E4] text-center space-y-1.5">
                    <CheckCircle2 className="w-6 h-6 text-[#16A34A] mx-auto" />
                    <p className="text-xs font-bold text-[#171717]">
                      {activeJob ? 'No Missing Skill Gaps Identified' : 'Target Job Required'}
                    </p>
                    <p className="text-[11px] text-[#6B6B6B]">
                      {activeJob
                        ? 'Your verified skills meet the requirements for this role.'
                        : 'Match your profile with a target job to uncover gaps.'}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setCurrentTab(activeJob ? 'match' : 'jobs')}
                className="w-full py-2.5 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-xs font-bold text-[#171717] rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>{activeJob ? 'View Full Skill Comparison Matrix' : 'Select Target Job'}</span>
                <ChevronRight className="w-4 h-4 text-[#6B6B6B]" />
              </button>
            </div>

            {/* 6. AM I READY? AI Interview Coach Readiness */}
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
                    6. Am I Ready?
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#171717]">
                    AI Interview Coach Performance
                  </h3>
                </div>
                <MessageSquareCode className="w-5 h-5 text-[#62A7FF]" />
              </div>

              <div className="p-4 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#6B6B6B]">Practice Benchmark</span>
                    <h4 className="text-xs font-bold text-[#171717]">
                      {analysis?.skills?.[0] ? `${analysis.skills[0]} & System Architecture` : 'Technical Screening'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="font-heading font-bold text-lg text-[#62A7FF]">Ready</span>
                    <p className="text-[10px] font-semibold text-[#6B6B6B]">Interactive AI Coach</p>
                  </div>
                </div>

                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  Practice simulated interview rounds based on your extracted resume skills and target job criteria.
                </p>
              </div>

              <button
                onClick={() => setCurrentTab('interview')}
                className="w-full py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Start AI Interview Practice Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
