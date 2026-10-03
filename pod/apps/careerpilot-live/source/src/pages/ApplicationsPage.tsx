import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ApplicationRecord } from '../types';
import {
  KanbanSquare,
  Plus,
  Sparkles,
  Building,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  FileText,
  X,
  Copy,
  Check,
  Send,
} from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activePrepModal, setActivePrepModal] = useState<ApplicationRecord | null>(null);
  const [generatingPrepId, setGeneratingPrepId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'prep' | 'outreach'>('prep');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form fields
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Full Stack Engineer');
  const [status, setStatus] = useState<'saved' | 'applied' | 'interview' | 'offer' | 'rejected'>('applied');
  const [salary, setSalary] = useState('$145k - $175k');
  const [location, setLocation] = useState('Remote');
  const [matchScore, setMatchScore] = useState(82);

  const loadApplications = async () => {
    try {
      const [data, targetJobs] = await Promise.all([
        api.applications.getApplications(),
        api.jobs.getJobs().catch(() => []),
      ]);

      // Normalize keys to deduplicate
      const existingKeys = new Set(
        data.map((a) => `${a.company.toLowerCase().trim()}___${a.role.toLowerCase().trim()}`)
      );

      const syncedApps = [...data];
      for (const job of targetJobs) {
        const key = `${job.company.toLowerCase().trim()}___${job.roleTitle.toLowerCase().trim()}`;
        if (!existingKeys.has(key)) {
          try {
            const newApp = await api.applications.createApplication({
              company: job.company,
              role: job.roleTitle,
              status: 'saved',
              salary: '$135k - $175k',
              location: job.location || 'Remote',
              matchScore: 82,
              notes: `Target job track from Studio (${job.seniority || 'Full Time'}).`,
            });
            existingKeys.add(key);
            syncedApps.push(newApp);
          } catch (e) {
            const localApp: ApplicationRecord = {
              id: `app_sync_${job.id}`,
              userId: 'member',
              company: job.company,
              role: job.roleTitle,
              status: 'saved',
              salary: '$135k - $175k',
              location: job.location || 'Remote',
              matchScore: 82,
              notes: `Target job track from Studio (${job.seniority || 'Full Time'}).`,
            };
            syncedApps.push(localApp);
          }
        }
      }

      setApplications(syncedApps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    await api.applications.createApplication({
      company,
      role,
      status,
      salary,
      location,
      matchScore,
    });

    await loadApplications();
    setShowAddModal(false);
    setCompany('');
  };

  const handleStatusChange = async (id: string, newStatus: any) => {
    await api.applications.updateApplication(id, { status: newStatus });
    await loadApplications();
  };

  const handleDelete = async (id: string) => {
    await api.applications.deleteApplication(id);
    await loadApplications();
  };

  const handleGeneratePrep = async (app: ApplicationRecord) => {
    setGeneratingPrepId(app.id);
    try {
      const updated = await api.applications.generatePrepPack(app.id);
      setActivePrepModal(updated);
      await loadApplications();
    } finally {
      setGeneratingPrepId(null);
    }
  };

  const columns: Array<{ id: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'; label: string; color: string }> = [
    { id: 'saved', label: 'Saved (Targeting)', color: 'bg-zinc-100 text-zinc-800' },
    { id: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
    { id: 'interview', label: 'Interview Scheduled', color: 'bg-[#62A7FF]/15 text-[#62A7FF]' },
    { id: 'offer', label: 'Offers Received', color: 'bg-green-100 text-green-800' },
  ];

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#62A7FF] uppercase tracking-wider">
              Application Telemetry
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-[#171717] tracking-tight">
            Job Application Tracker & Company Prep
          </h1>
          <p className="text-xs text-[#6B6B6B]">
            Connect your target applications with custom interview preparation packs powered by Lemma AI.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Opportunity</span>
        </button>
      </div>

      {/* Kanban Board Grid (PRD Section 16 & 25) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colApps = applications.filter((a) => a.status === col.id);

          return (
            <div key={col.id} className="bg-white border border-[#E7E7E4] rounded-2xl p-4 flex flex-col space-y-3 card-subtle min-h-[480px]">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-xs font-bold text-[#6B6B6B]">{colApps.length}</span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-[#F8F8F6] border border-[#E7E7E4] hover:border-[#62A7FF]/50 rounded-xl space-y-3 transition-all text-left shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                          {app.company}
                        </span>
                        <h4 className="font-heading font-bold text-xs text-[#171717] mt-0.5">
                          {app.role}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold bg-white border border-[#E7E7E4] px-1.5 py-0.5 rounded text-[#16A34A]">
                        {app.matchScore}% Match
                      </span>
                    </div>

                    <div className="text-[11px] text-[#6B6B6B] space-y-1">
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {app.location || 'Remote'}
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {app.salary || '$140k+'}
                      </p>
                    </div>

                    {/* AI Prep Pack Button */}
                    <button
                      onClick={() =>
                        app.prepPack ? setActivePrepModal(app) : handleGeneratePrep(app)
                      }
                      className="w-full py-1.5 px-2 bg-white hover:bg-[#62A7FF]/5 border border-[#E7E7E4] text-[#171717] hover:text-[#62A7FF] rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-[#62A7FF]" />
                      <span>
                        {generatingPrepId === app.id
                          ? 'Generating Pack...'
                          : app.prepPack
                          ? 'View Company Prep Pack'
                          : 'Generate AI Prep Pack'}
                      </span>
                    </button>

                    {/* Move Column Switcher */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#E7E7E4]/60 text-[10px]">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className="bg-transparent font-semibold text-[#6B6B6B] hover:text-[#171717] focus:outline-none cursor-pointer"
                      >
                        <option value="saved">Move: Saved</option>
                        <option value="applied">Move: Applied</option>
                        <option value="interview">Move: Interview</option>
                        <option value="offer">Move: Offer</option>
                      </select>

                      <button
                        onClick={() => handleDelete(app.id)}
                        className="text-[#6B6B6B] hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E7E7E4] rounded-3xl p-6 max-w-md w-full card-subtle shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
              <h3 className="font-heading font-bold text-base text-[#171717]">
                Track New Job Application
              </h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-4 h-4 text-[#6B6B6B]" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Company</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, Linear, Figma"
                  className="w-full p-2.5 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Full Stack Engineer"
                  className="w-full p-2.5 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs text-[#171717] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Stage</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full p-2.5 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl text-xs text-[#171717] focus:outline-none"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#171717] mb-1">Estimated Match %</label>
                  <input
                    type="number"
                    value={matchScore}
                    onChange={(e) => setMatchScore(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#F8F8F6] border border-[#E7E7E4] rounded-xl text-xs text-[#171717] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E7E7E4] text-xs font-semibold text-[#6B6B6B] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Prep Pack Modal (PRD Section 17 & 26) */}
      {activePrepModal && activePrepModal.prepPack && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E7E7E4] rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto card-subtle shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#62A7FF] tracking-wider">
                  Lemma Interview Intelligence
                </span>
                <h3 className="font-heading font-extrabold text-xl text-[#171717]">
                  {activePrepModal.company} — Custom Interview Prep Pack
                </h3>
              </div>
              <button
                onClick={() => setActivePrepModal(null)}
                className="p-1.5 hover:bg-[#F8F8F6] rounded-xl"
              >
                <X className="w-5 h-5 text-[#6B6B6B]" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#E7E7E4] gap-4">
              <button
                type="button"
                onClick={() => setModalTab('prep')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 ${
                  modalTab === 'prep'
                    ? 'border-[#62A7FF] text-[#62A7FF]'
                    : 'border-transparent text-[#6B6B6B] hover:text-[#171717]'
                }`}
              >
                Interview Intelligence & Checklist
              </button>
              <button
                type="button"
                onClick={() => setModalTab('outreach')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  modalTab === 'outreach'
                    ? 'border-[#62A7FF] text-[#62A7FF]'
                    : 'border-transparent text-[#6B6B6B] hover:text-[#171717]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Cover Letter & InMail Pitch</span>
              </button>
            </div>

            {modalTab === 'prep' ? (
              <div className="space-y-5">
                {/* Key Skills to Revise */}
                <div className="space-y-2">
                  <h4 className="font-heading font-bold text-xs text-[#171717] uppercase tracking-wider">
                    1. High-Priority Technical Focus Areas
                  </h4>
                  <div className="space-y-2">
                    {activePrepModal.prepPack.keySkillsToRevise.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-[#171717]">{item.skill}</strong>
                          <span className="text-[9px] font-bold text-[#62A7FF] bg-[#62A7FF]/10 px-2 py-0.5 rounded">
                            {item.priority} Priority
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B6B6B]">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Projects to Highlight */}
                <div className="space-y-2">
                  <h4 className="font-heading font-bold text-xs text-[#171717] uppercase tracking-wider">
                    2. Resume Projects to Emphasize
                  </h4>
                  <div className="space-y-2">
                    {activePrepModal.prepPack.recommendedProjectsToHighlight.map((proj, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1">
                        <strong className="text-xs text-blue-950">{proj.name}</strong>
                        <p className="text-[11px] text-blue-900/80 leading-relaxed">{proj.talkingPoint}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Specific Questions */}
                <div className="space-y-2">
                  <h4 className="font-heading font-bold text-xs text-[#171717] uppercase tracking-wider">
                    3. Company-Specific Screening Questions
                  </h4>
                  <div className="space-y-2">
                    {activePrepModal.prepPack.companySpecificQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] text-xs text-[#171717] font-medium">
                        {idx + 1}. {q}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prep Checklist */}
                <div className="space-y-2">
                  <h4 className="font-heading font-bold text-xs text-[#171717] uppercase tracking-wider">
                    4. Preparation Checklist
                  </h4>
                  <div className="space-y-1.5">
                    {activePrepModal.prepPack.prepChecklist.map((c, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs text-[#171717]">
                        <CheckCircle2 className={`w-4 h-4 ${c.done ? 'text-[#16A34A]' : 'text-[#D5D5D0]'}`} />
                        <span>{c.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: Outreach */
              <div className="space-y-5">
                {/* Cover Letter */}
                <div className="bg-[#F8F8F6] p-4 rounded-2xl border border-[#E7E7E4] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#62A7FF]" />
                      Tailored Cover Letter for {activePrepModal.company}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activePrepModal.prepPack?.coverLetter || '');
                        setCopiedKey('appCover');
                        setTimeout(() => setCopiedKey(null), 2500);
                      }}
                      className="text-xs font-bold text-[#62A7FF] hover:text-[#4B92F0] flex items-center gap-1"
                    >
                      {copiedKey === 'appCover' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'appCover' ? 'Copied' : 'Copy Letter'}</span>
                    </button>
                  </div>
                  <pre className="text-xs text-[#171717] font-sans whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-xl border border-[#E7E7E4] max-h-64 overflow-y-auto">
                    {activePrepModal.prepPack.coverLetter || `Dear Hiring Team at ${activePrepModal.company},\n\nI am excited to apply for the ${activePrepModal.role} position. With my background in modern full-stack development and distributed systems, I am eager to contribute to your engineering organization.\n\nWarm regards.`}
                  </pre>
                </div>

                {/* Cold InMail */}
                <div className="bg-[#F8F8F6] p-4 rounded-2xl border border-[#E7E7E4] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-[#62A7FF]" />
                      Recruiter InMail Outreach Pitch
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activePrepModal.prepPack?.coldInMail || '');
                        setCopiedKey('appInMail');
                        setTimeout(() => setCopiedKey(null), 2500);
                      }}
                      className="text-xs font-bold text-[#62A7FF] hover:text-[#4B92F0] flex items-center gap-1"
                    >
                      {copiedKey === 'appInMail' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'appInMail' ? 'Copied' : 'Copy Pitch'}</span>
                    </button>
                  </div>
                  <pre className="text-xs text-[#171717] font-sans whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-xl border border-[#E7E7E4] max-h-48 overflow-y-auto">
                    {activePrepModal.prepPack.coldInMail || `Hi [Name] — I noticed ${activePrepModal.company}'s opening for ${activePrepModal.role}. Having recently built production applications with modern stacks, I'd love to connect and share a brief overview of my work.\n\nBest regards.`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
