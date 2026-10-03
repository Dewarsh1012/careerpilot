import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ResumeRecord } from '../types';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Sparkles,
  Layers,
  Code2,
  FolderGit2,
  GraduationCap,
  Briefcase,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Mail,
  MapPin,
  Phone,
  Check,
  Award,
} from 'lucide-react';
import { useCareer } from '../context/CareerContext';
import { useAuth } from '../context/AuthContext';

export const ResumePage: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [activeResume, setActiveResume] = useState<ResumeRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressStage, setUploadProgressStage] = useState<number>(0);
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { refreshCareer, setActiveResumeTrack, activeResume: contextActiveResume, switchTier } = useCareer();
  const { refreshUser } = useAuth();

  const loadResumes = async () => {
    try {
      const data = await api.resume.getResumes();
      setResumes(data);
      if (data.length > 0) {
        setActiveResume((prev) => {
          if (prev && data.some((r) => r.id === prev.id)) {
            return data.find((r) => r.id === prev.id) || prev;
          }
          return data[0];
        });
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  useEffect(() => {
    if (!activeResume && contextActiveResume) {
      setActiveResume(contextActiveResume);
    }
  }, [contextActiveResume]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setUploading(true);
    setUploadProgressStage(1);

    const stageTimer1 = setTimeout(() => setUploadProgressStage(2), 600);
    const stageTimer2 = setTimeout(() => setUploadProgressStage(3), 1400);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.resume.uploadResume(formData);
      if (res.success && res.resume) {
        setActiveResume(res.resume);
        await loadResumes();
        await refreshUser();
        await refreshCareer();
      } else {
        setErrorMessage(res.error || 'Failed to extract resume telemetry. Please ensure the document is readable or paste the text.');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Error uploading resume. Supported formats: PDF, DOCX, TXT.');
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setUploading(false);
      setUploadProgressStage(0);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) return;
    setErrorMessage(null);
    setUploading(true);
    setUploadProgressStage(2);

    try {
      const res = await api.resume.uploadText(pastedText, 'Pasted_Resume.txt');
      if (res.success && res.resume) {
        setActiveResume(res.resume);
        setPastedText('');
        setPasteMode(false);
        await loadResumes();
        await refreshUser();
        await refreshCareer();
      } else {
        setErrorMessage(res.error || 'Failed to extract resume telemetry.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing pasted text.');
    } finally {
      setUploading(false);
      setUploadProgressStage(0);
    }
  };

  const loadSample = async (type: 'fullstack' | 'frontend' | 'backend') => {
    setErrorMessage(null);
    setUploading(true);
    setUploadProgressStage(3);
    try {
      const res = await api.resume.loadSample(type);
      if (res.success && res.resume) {
        setActiveResume(res.resume);
      }
      await loadResumes();
      await refreshUser();
      await refreshCareer();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load sample preset.');
    } finally {
      setUploading(false);
      setUploadProgressStage(0);
    }
  };

  const analysis = activeResume?.analysis;

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#62A7FF] uppercase tracking-wider">
              Career Telemetry
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-[#171717] tracking-tight">
            Resume Intelligence & Extraction
          </h1>
          <p className="text-xs text-[#6B6B6B]">
            Upload your resume to extract skills, project evidence, work history, and verified experience.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-semibold text-[#6B6B6B]">Load Sample:</span>
          <button
            onClick={() => loadSample('fullstack')}
            className="px-2.5 py-1 text-xs font-semibold bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] rounded-lg transition-colors cursor-pointer"
          >
            Full Stack
          </button>
          <button
            onClick={() => loadSample('frontend')}
            className="px-2.5 py-1 text-xs font-semibold bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] rounded-lg transition-colors cursor-pointer"
          >
            Frontend
          </button>
          <button
            onClick={() => loadSample('backend')}
            className="px-2.5 py-1 text-xs font-semibold bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] rounded-lg transition-colors cursor-pointer"
          >
            Backend
          </button>
        </div>
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="flex items-start justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800">
          <div className="flex items-start gap-2.5 flex-1">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Extraction Notice:</strong> {errorMessage}
              {errorMessage.toLowerCase().includes('quota') && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await switchTier('pro');
                      setErrorMessage(null);
                    }}
                    className="px-3 py-1.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Unlock Pro Plan (Unlimited Analyses)
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Zone / Multi-step Progress */}
      <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle">
        {uploading ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#62A7FF]/10 text-[#62A7FF] flex items-center justify-center animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-[#171717]">
                Lemma Resume Agent Processing
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Extracting structured career telemetry from your document...
              </p>
            </div>

            {/* 3 Step Status Flow */}
            <div className="w-full space-y-2 pt-2 text-left">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#F8F8F6]">
                <span className="font-medium text-[#171717]">1. Reading file format (PDF/DOCX/TXT)</span>
                {uploadProgressStage >= 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                ) : (
                  <span className="text-[10px] text-[#6B6B6B]">Pending</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#F8F8F6]">
                <span className="font-medium text-[#171717]">2. Extracting raw text & structure</span>
                {uploadProgressStage >= 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                ) : (
                  <span className="text-[10px] text-[#6B6B6B]">Pending</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#F8F8F6]">
                <span className="font-medium text-[#171717]">3. Lemma AI Cloud Agent Analysis</span>
                {uploadProgressStage >= 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-[#62A7FF] animate-spin" />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {!pasteMode ? (
              <div className="border-2 border-dashed border-[#D5D5D0] hover:border-[#62A7FF] rounded-xl p-8 text-center transition-all bg-[#F8F8F6]/50">
                <UploadCloud className="w-10 h-10 text-[#6B6B6B] mx-auto mb-3" />
                <h3 className="font-heading font-bold text-sm text-[#171717] mb-1">
                  Upload your resume to extract career telemetry
                </h3>
                <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto mb-4">
                  Drag and drop your PDF, DOCX, DOC, or TXT file here, or browse from your computer (Max 10MB).
                </p>

                <div className="flex items-center justify-center gap-3">
                  <label className="px-5 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all">
                    <span>Browse File</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => setPasteMode(true)}
                    className="px-4 py-2.5 bg-white hover:bg-[#F8F8F6] border border-[#E7E7E4] text-xs font-bold text-[#171717] rounded-xl transition-all cursor-pointer"
                  >
                    Paste Text Instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#171717]">Paste Resume Text</label>
                  <button
                    onClick={() => setPasteMode(false)}
                    className="text-xs text-[#6B6B6B] hover:text-[#171717] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your full resume content, work experience, projects, education, and technical skills here..."
                  className="w-full p-3 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
                />
                <button
                  onClick={handlePasteSubmit}
                  className="px-5 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Analyze Pasted Text with Lemma AI
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Uploaded Resumes Switcher if multiple exist */}
      {resumes.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-[#6B6B6B] shrink-0">Analyzed Resumes:</span>
          {resumes.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setActiveResume(r);
                setActiveResumeTrack(r.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeResume?.id === r.id
                  ? 'bg-[#171717] text-white shadow-xs'
                  : 'bg-white border border-[#E7E7E4] text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              📄 {r.analysis?.candidateName || r.fileName || 'Resume'}
            </button>
          ))}
        </div>
      )}

      {/* Structured Resume Analysis View */}
      {analysis && (
        <div className="space-y-6">
          {/* Top Summary Banner */}
          <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#62A7FF] tracking-wider">
                    Extracted Candidate Profile
                  </span>
                  <span className="text-[10px] font-semibold text-[#16A34A] bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Lemma AI Verified
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-[#171717]">
                  {analysis.candidateName || 'Candidate Profile'}
                </h3>
                {analysis.currentRole && (
                  <p className="text-sm font-semibold text-[#171717]/80">
                    {analysis.currentRole}
                  </p>
                )}
              </div>

              {/* Contact Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B6B]">
                {analysis.email && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8F8F6] border border-[#E7E7E4]">
                    <Mail className="w-3 h-3 text-[#62A7FF]" /> {analysis.email}
                  </span>
                )}
                {analysis.phone && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8F8F6] border border-[#E7E7E4]">
                    <Phone className="w-3 h-3 text-[#62A7FF]" /> {analysis.phone}
                  </span>
                )}
                {analysis.location && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8F8F6] border border-[#E7E7E4]">
                    <MapPin className="w-3 h-3 text-[#62A7FF]" /> {analysis.location}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-[#6B6B6B] leading-relaxed bg-[#F8F8F6] p-4 rounded-xl border border-[#E7E7E4]">
              {analysis.summary}
            </p>
          </div>

          {/* Grid: Extracted Skills & Domains */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Skills */}
            <div className="md:col-span-2 bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
                <div className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-[#62A7FF]" />
                  <h4 className="font-heading font-bold text-sm text-[#171717]">
                    Verified Technical Skills ({analysis.skills?.length || 0})
                  </h4>
                </div>
                <span className="text-[10px] text-[#6B6B6B] font-semibold">Indexed for Role Matching</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(analysis.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] text-xs font-bold text-[#171717] hover:border-[#62A7FF] hover:text-[#62A7FF] transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Domains */}
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#E7E7E4]">
                <Layers className="w-4 h-4 text-[#62A7FF]" />
                <h4 className="font-heading font-bold text-sm text-[#171717]">Career Domains</h4>
              </div>

              <div className="space-y-2">
                {(analysis.domains || []).map((domain) => (
                  <div key={domain} className="p-2.5 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] text-xs font-semibold text-[#171717]">
                    {domain}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Work Experience Timeline */}
          {Array.isArray(analysis.experience) && analysis.experience.length > 0 && (
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#E7E7E4]">
                <Briefcase className="w-4 h-4 text-[#62A7FF]" />
                <h4 className="font-heading font-bold text-sm text-[#171717]">
                  Work Experience & Track Record ({analysis.experience.length})
                </h4>
              </div>

              <div className="space-y-4">
                {analysis.experience.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-[#E7E7E4] bg-[#F8F8F6] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h5 className="font-bold text-sm text-[#171717]">{exp.title}</h5>
                        {exp.company && (
                          <span className="text-xs font-semibold text-[#62A7FF]">{exp.company}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {exp.duration && (
                          <span className="text-[10px] font-semibold bg-white border border-[#E7E7E4] px-2.5 py-1 rounded-full text-[#6B6B6B]">
                            {exp.duration}
                          </span>
                        )}
                        {exp.location && (
                          <span className="text-[10px] text-[#6B6B6B]">{exp.location}</span>
                        )}
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-[#6B6B6B] leading-relaxed pt-1">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects & Evidence */}
          {Array.isArray(analysis.projects) && analysis.projects.length > 0 && (
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#E7E7E4]">
                <FolderGit2 className="w-4 h-4 text-[#62A7FF]" />
                <h4 className="font-heading font-bold text-sm text-[#171717]">
                  Extracted Project Evidence ({analysis.projects.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-[#E7E7E4] bg-[#F8F8F6] space-y-2">
                    <h5 className="font-bold text-xs text-[#171717]">{proj.title}</h5>
                    <p className="text-[11px] text-[#6B6B6B] leading-relaxed">{proj.description}</p>
                    {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.technologies.map((t) => (
                          <span key={t} className="text-[10px] font-semibold bg-white border border-[#E7E7E4] px-2 py-0.5 rounded text-[#171717]">
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

          {/* Education & Strengths Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education */}
            {Array.isArray(analysis.education) && analysis.education.length > 0 && (
              <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-[#E7E7E4]">
                  <GraduationCap className="w-4 h-4 text-[#62A7FF]" />
                  <h4 className="font-heading font-bold text-sm text-[#171717]">Education</h4>
                </div>

                <div className="space-y-3">
                  {analysis.education.map((edu, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs text-[#171717]">{edu.degree}</h5>
                        {edu.year && (
                          <span className="text-[10px] font-semibold text-[#6B6B6B] bg-white border border-[#E7E7E4] px-2 py-0.5 rounded">
                            {edu.year}
                          </span>
                        )}
                      </div>
                      {edu.institution && (
                        <p className="text-[11px] font-semibold text-[#6B6B6B]">{edu.institution}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Growth Areas */}
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#E7E7E4]">
                <Award className="w-4 h-4 text-[#62A7FF]" />
                <h4 className="font-heading font-bold text-sm text-[#171717]">Strengths & Key Depth</h4>
              </div>

              <div className="space-y-2">
                {(analysis.strengths || []).map((strength, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-green-50/50 border border-green-200/60 text-xs text-[#171717]">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                    <span>{strength}</span>
                  </div>
                ))}
              </div>

              {Array.isArray(analysis.growthAreas) && analysis.growthAreas.length > 0 && (
                <div className="pt-2 space-y-2 border-t border-[#E7E7E4]">
                  <h5 className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">Identified Growth Areas</h5>
                  {analysis.growthAreas.map((area, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-[#171717]">
                      <TrendingUp className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
