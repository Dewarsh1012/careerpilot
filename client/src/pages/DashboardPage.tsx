import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCareer } from '../context/CareerContext';
import { JourneyBar } from '../components/common/JourneyBar';
import { NextMoveCard } from '../components/common/NextMoveCard';
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
} from 'lucide-react';

interface DashboardPageProps {
  setCurrentTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setCurrentTab }) => {
  const { user } = useAuth();
  const { activeJob, activeMatch, careerPlan, readinessScore, activeResume } = useCareer();

  const analysis = activeResume?.analysis;

  const missingSkills = activeMatch?.missingSkills || (activeResume ? [
    { name: 'Docker', importance: 'High', recommendation: 'Complete containerization milestone in Phase 2' },
    { name: 'AWS Cloud', importance: 'High', recommendation: 'Deploy test microservice with S3 and EC2' },
  ] : []);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
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
            Welcome back, {user?.name || analysis?.candidateName || 'Candidate'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B]">
            Preparing for <span className="font-semibold text-[#171717]">{activeJob?.roleTitle || user?.targetRole || 'Full Stack Developer'}</span>
            {activeJob?.company ? (
              <> at <span className="font-semibold text-[#171717]">{activeJob.company}</span></>
            ) : null}.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setCurrentTab('resume')}
            className="px-4 py-2 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-xs font-bold text-[#171717] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#6B6B6B]" />
            <span>{activeResume ? 'Update Resume' : 'Upload Resume'}</span>
          </button>
          <button
            onClick={() => setCurrentTab('match')}
            className="px-4 py-2 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Skill Gaps</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Extracted Resume Intelligence & Candidate Profile Telemetry */}
      {activeResume && (
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-6">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E7E7E4]">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#62A7FF] to-[#2563EB] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                {(analysis?.candidateName || user?.name || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-[#62A7FF] tracking-wider">
                    Extracted Candidate Telemetry
                  </span>
                  <span className="text-[10px] font-bold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Lemma AI Verified
                  </span>
                  <span className="text-[10px] text-[#6B6B6B] bg-[#F8F8F6] border border-[#E7E7E4] px-2 py-0.5 rounded-md flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#62A7FF]" />
                    {activeResume.fileName}
                  </span>
                </div>
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#171717]">
                  {analysis?.candidateName || user?.name || 'Candidate Profile'}
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Target Track: <strong className="text-[#171717]">{user?.targetRole || activeJob?.roleTitle || 'Full Stack Developer'}</strong>
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
                  <span>{analysis?.phone}</span>
                </div>
              )}
              {analysis?.location && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F8F6] border border-[#E7E7E4] text-[11px] text-[#6B6B6B]">
                  <MapPin className="w-3.5 h-3.5 text-[#62A7FF]" />
                  <span>{analysis?.location}</span>
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
      )}

      {/* Zero State if No Resume Uploaded Yet */}
      {!activeResume && (
        <div className="bg-gradient-to-br from-white to-[#F8F8F6] border-2 border-dashed border-[#62A7FF]/40 rounded-2xl p-8 text-center space-y-4 card-subtle">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#62A7FF]/10 text-[#62A7FF] flex items-center justify-center">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-lg mx-auto">
            <h3 className="font-heading font-extrabold text-xl text-[#171717]">
              Upload Your Resume to Unlock Career Intelligence
            </h3>
            <p className="text-xs sm:text-sm text-[#6B6B6B]">
              Upload your resume to extract candidate telemetry, verify skills, calculate target job readiness scores, and generate your custom career plan.
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('resume')}
            className="px-6 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Upload Resume Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Signature Career Journey Bar (PRD Section 43) */}
      <JourneyBar currentStage="match" onStageClick={(tab) => setCurrentTab(tab)} />

      {/* Standout Feature: "Next Move" (PRD Section 42) */}
      <NextMoveCard
        title={activeMatch?.nextMove || 'Complete Docker Containerization Milestone'}
        actionText="What You Should Do Next"
        category="High Priority Action"
        description="Your target job requires containerized deployment proficiency. Complete this Phase 2 task to boost interview readiness."
        ctaLabel="Jump to Career Plan"
        onAction={() => setCurrentTab('roadmap')}
      />

      {/* The 6 Core PRD Questions Hierarchy (PRD Section 40) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. WHERE AM I? Career Readiness */}
        <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
              1. Where Am I?
            </span>
            <span className="text-[10px] font-bold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              Active Benchmark
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h3 className="font-heading font-extrabold text-3xl text-[#171717]">
                {readinessScore}%
              </h3>
              <span className="text-xs font-bold text-[#16A34A] flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +6% this week
              </span>
            </div>
            <div className="w-full bg-[#F8F8F6] h-2.5 rounded-full overflow-hidden border border-[#E7E7E4]">
              <div
                className="bg-[#62A7FF] h-full rounded-full transition-all duration-700"
                style={{ width: `${readinessScore}%` }}
              />
            </div>
            <p className="text-[11px] text-[#6B6B6B] pt-1">
              Readiness level: <strong className="text-[#171717]">{activeMatch?.readinessLevel || 'Needs Target Prep'}</strong>.
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('match')}
            className="w-full py-2 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-[11px] font-bold text-[#171717] rounded-xl flex items-center justify-center gap-1 transition-colors"
          >
            <span>See Gap Breakdown</span>
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
              {activeJob?.roleTitle || 'Full Stack Engineer'}
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Company: <strong className="text-[#171717]">{activeJob?.company || 'Stripe'}</strong> ({activeJob?.location || 'Remote / Hybrid'})
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-semibold bg-[#F8F8F6] border border-[#E7E7E4] px-2 py-0.5 rounded-md text-[#6B6B6B]">
                {activeJob?.seniority || 'Mid-Level'}
              </span>
              <span className="text-[10px] font-semibold bg-[#F8F8F6] border border-[#E7E7E4] px-2 py-0.5 rounded-md text-[#6B6B6B]">
                {activeJob?.experienceRequired || '2-4 years'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setCurrentTab('jobs')}
            className="w-full py-2 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-[11px] font-bold text-[#171717] rounded-xl flex items-center justify-center gap-1 transition-colors"
          >
            <span>Switch or Add Target Job</span>
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
                Phase 2 of 5
              </h3>
              <span className="text-xs font-bold text-[#62A7FF]">
                {careerPlan?.progressPercent || 33}% complete
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B]">
              Active milestone: <strong className="text-[#171717]">Containerization & DevOps</strong>
            </p>
            <p className="text-[11px] text-[#6B6B6B]">
              {careerPlan?.completedTasks || 2} of {careerPlan?.totalTasks || 8} milestones verified.
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('roadmap')}
            className="w-full py-2 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-[11px] font-bold text-[#171717] rounded-xl flex items-center justify-center gap-1 transition-colors"
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
            {missingSkills.slice(0, 3).map((gap: any) => (
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
                  className="shrink-0 text-[10px] font-bold text-[#62A7FF] hover:underline"
                >
                  View Task →
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCurrentTab('match')}
            className="w-full py-2.5 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] text-xs font-bold text-[#171717] rounded-xl flex items-center justify-center gap-1 transition-colors"
          >
            <span>View Full Skill Comparison Matrix</span>
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
                <span className="text-[10px] uppercase font-bold text-[#6B6B6B]">Recent Evaluation</span>
                <h4 className="text-xs font-bold text-[#171717]">React & System Architecture</h4>
              </div>
              <div className="text-right">
                <span className="font-heading font-bold text-lg text-[#16A34A]">8.2 / 10</span>
                <p className="text-[10px] font-semibold text-[#16A34A]">Strong Performance</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[#E7E7E4] text-center">
              <div>
                <p className="text-[10px] text-[#6B6B6B]">Depth</p>
                <p className="text-xs font-bold text-[#171717]">8/10</p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B6B6B]">Correctness</p>
                <p className="text-xs font-bold text-[#171717]">9/10</p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B6B6B]">Completeness</p>
                <p className="text-xs font-bold text-[#171717]">8/10</p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B6B6B]">Clarity</p>
                <p className="text-xs font-bold text-[#171717]">8/10</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase text-amber-800">Coach Recommendation</span>
            <p className="text-[11px] text-amber-950">
              Practice weak topic: <strong className="underline">Docker container security & networking</strong> before your next screening round.
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('interview')}
            className="w-full py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Start AI Interview Practice Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
