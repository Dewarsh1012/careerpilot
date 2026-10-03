import type {
  ApplicationRecord,
  CareerPlanRecord,
  InterviewEvaluation,
  InterviewSession,
  JobRecord,
  MatchRecord,
  PlanTier,
  ResumeRecord,
  User,
  UserQuota,
} from '../types';
import { lemmaBackendEnabled, podClient } from '../lemma-client';
import {
  analyzeJobDescription,
  analyzeResumeText,
  buildInterviewQuestion,
  evaluateInterviewAnswer,
  extractTextFromFile,
  normalizeInterviewEvaluation,
} from './careerAnalysis';
import { runPodFunction } from './lemmaFunctions';

type Row = Record<string, unknown>;

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function json<T>(value: unknown, fallback: T): T {
  return (value as T) ?? fallback;
}

const TIER_LIMITS: Record<
  PlanTier,
  Pick<UserQuota, 'resumeAnalyses' | 'jobMatches' | 'tailoredResumes' | 'interviewSessions' | 'voiceInterviews'>
> = {
  free: {
    resumeAnalyses: { used: 0, limit: 3 },
    jobMatches: { used: 0, limit: 3 },
    tailoredResumes: { used: 0, limit: 1 },
    interviewSessions: { used: 0, limit: 2 },
    voiceInterviews: { used: 0, limit: 1 },
  },
  pro: {
    resumeAnalyses: { used: 0, limit: 999 },
    jobMatches: { used: 0, limit: 999 },
    tailoredResumes: { used: 0, limit: 999 },
    interviewSessions: { used: 0, limit: 999 },
    voiceInterviews: { used: 0, limit: 999 },
  },
  campus: {
    resumeAnalyses: { used: 0, limit: 9999 },
    jobMatches: { used: 0, limit: 9999 },
    tailoredResumes: { used: 0, limit: 9999 },
    interviewSessions: { used: 0, limit: 9999 },
    voiceInterviews: { used: 0, limit: 9999 },
  },
};

export function quotaForTier(tier: PlanTier, previous?: UserQuota | null): UserQuota {
  const limits = TIER_LIMITS[tier];
  const keepUsed = (key: keyof typeof limits) => ({
    used: previous?.[key]?.used ?? limits[key].used,
    limit: limits[key].limit,
  });
  return {
    plan: tier,
    resumeAnalyses: keepUsed('resumeAnalyses'),
    jobMatches: keepUsed('jobMatches'),
    tailoredResumes: keepUsed('tailoredResumes'),
    interviewSessions: keepUsed('interviewSessions'),
    voiceInterviews: keepUsed('voiceInterviews'),
  };
}

async function listRows(table: string): Promise<Row[]> {
  const client = podClient();
  const response = await client.records.list(table, { limit: 200 });
  return (response.items ?? []) as Row[];
}

async function getProfileRow(): Promise<Row | null> {
  const rows = await listRows('career_profiles');
  const client = podClient();
  let podEmail = '';
  try {
    const me = await client.users.current();
    podEmail = (me.email || '').trim().toLowerCase();
  } catch (e) {}

  let localEmail = '';
  try {
    const raw = localStorage.getItem('careerpilot_user');
    if (raw) {
      const u = JSON.parse(raw);
      localEmail = (u.email || '').trim().toLowerCase();
    }
  } catch (e) {}

  const targetEmail = localEmail || podEmail;
  if (targetEmail) {
    const match = rows.find((r) => str(r.email).trim().toLowerCase() === targetEmail);
    if (match) return match;
    // New user with no profile yet
    return null;
  }
  return rows[0] ?? null;
}

async function updateProfilePatch(patch: Record<string, unknown>): Promise<void> {
  const client = podClient();
  const profile = await getProfileRow();
  if (profile?.id) {
    await client.records.update('career_profiles', String(profile.id), patch);
    return;
  }
  let email = '';
  let name = 'CareerPilot Member';
  try {
    const raw = localStorage.getItem('careerpilot_user');
    if (raw) {
      const u = JSON.parse(raw);
      email = u.email || '';
      name = u.name || name;
    }
  } catch (e) {}
  if (!email) {
    try {
      const me = await client.users.current();
      email = me.email || '';
      name = (me as any).first_name || me.email?.split('@')[0] || name;
    } catch (e) {}
  }
  await client.records.create('career_profiles', {
    display_name: name,
    email,
    current_status: 'Student / Fresher',
    target_role: 'Full Stack Developer',
    experience_level: 'Fresher (0-1 yrs)',
    career_readiness: 0,
    onboarded: true,
    plan_tier: 'pro',
    interests: [],
    verified_skills: [],
    ...patch,
  });
}

function raceTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), ms);
    }),
  ]);
}

async function assertInterviewQuota(): Promise<void> {
  const profile = await getProfileRow();
  if (!profile) return;
  const plan = (str(profile.plan_tier, 'pro') as PlanTier) || 'pro';
  const quota = quotaForTier(plan, profile.quota ? json<UserQuota | null>(profile.quota, null) : null);
  const { used, limit } = quota.interviewSessions;
  if (used >= limit) {
    throw new Error('Interview session quota reached. Switch to Pro for unlimited practice.');
  }
}

async function bumpQuotaUsage(
  key: keyof Pick<UserQuota, 'resumeAnalyses' | 'jobMatches' | 'tailoredResumes' | 'interviewSessions' | 'voiceInterviews'>,
): Promise<void> {
  const profile = await getProfileRow();
  if (!profile?.id) return;
  const plan = (str(profile.plan_tier, 'pro') as PlanTier) || 'pro';
  const prev = profile.quota ? json<UserQuota | null>(profile.quota, null) : null;
  const quota = quotaForTier(plan, prev);
  const item = quota[key];
  if (item.used < item.limit) {
    item.used += 1;
  }
  await podClient().records.update('career_profiles', String(profile.id), { quota });
}

function profileToUser(profile: Row, lemmaUserId: string, analysis?: any): User {
  const quota = json<UserQuota | undefined>(profile.quota, undefined);
  return {
    id: lemmaUserId,
    name: str(profile.display_name, analysis?.candidateName || 'CareerPilot Member'),
    email: str(profile.email, analysis?.email || ''),
    currentStatus: str(profile.current_status, 'Student / Fresher'),
    targetRole: str(profile.target_role, 'Full Stack Developer'),
    experienceLevel: str(profile.experience_level, 'Fresher (0-1 yrs)'),
    interests: json(profile.interests, []),
    verifiedSkills: json(profile.verified_skills, analysis?.skills || []),
    summary: analysis?.summary || undefined,
    currentRole: analysis?.currentRole || undefined,
    phone: analysis?.phone || undefined,
    location: analysis?.location || undefined,
    experience: analysis?.experience || undefined,
    projects: analysis?.projects || undefined,
    education: analysis?.education || undefined,
    strengths: analysis?.strengths || undefined,
    growthAreas: analysis?.growthAreas || undefined,
    careerReadiness: num(profile.career_readiness, 0),
    onboarded: Boolean(profile.onboarded),
    activeResumeId: str(profile.active_resume_id) || undefined,
    activeJobId: str(profile.active_job_id) || undefined,
    activeMatchId: str(profile.active_match_id) || undefined,
    plan: (str(profile.plan_tier, 'pro') as PlanTier) || 'pro',
    quota,
  };
}

function rowToResume(row: Row, userId: string): ResumeRecord {
  return {
    id: str(row.id),
    userId,
    fileName: str(row.file_name),
    title: str(row.title) || undefined,
    isPrimary: Boolean(row.is_primary),
    extractedText: str(row.extracted_text),
    analysis: json(row.analysis, {
      candidateName: '',
      summary: '',
      skills: [],
      technologies: [],
      experience: [],
      projects: [],
      education: [],
      strengths: [],
      growthAreas: [],
      domains: [],
    }),
    processingStatus: str(row.processing_status, 'ready'),
    createdAt: str(row.created_at, new Date().toISOString()),
  };
}

function rowToJob(row: Row, userId: string): JobRecord {
  const analysis = json<Record<string, unknown>>(row.job_analysis, {});
  return {
    id: str(row.id),
    userId,
    roleTitle: str(row.role_title),
    company: str(row.company),
    location: str(row.location) || undefined,
    seniority: str(row.seniority),
    experienceRequired: str(row.experience_required),
    rawDescription: str(row.raw_description),
    sourceUrl: str(row.source_url) || undefined,
    analysis: {
      roleTitle: str(analysis.roleTitle ?? analysis.role_title, str(row.role_title)),
      company: str(analysis.company, str(row.company)),
      seniority: str(analysis.seniority, str(row.seniority)),
      experienceRequired: str(analysis.experienceRequired, str(row.experience_required)),
      summary: str(analysis.summary),
      requiredSkills: json(analysis.requiredSkills, [] as JobRecord['analysis']['requiredSkills']),
      preferredSkills: json(analysis.preferredSkills, [] as JobRecord['analysis']['preferredSkills']),
      responsibilities: json(analysis.responsibilities, [] as string[]),
    },
  };
}

function rowToMatch(row: Row, userId: string): MatchRecord {
  const payload = json<Record<string, unknown>>(row.match_payload, {});
  return {
    id: str(row.id),
    userId,
    jobId: str(row.job_id),
    jobTitle: str(row.job_title),
    company: str(row.company),
    matchScore: num(row.match_score),
    matchedSkills: json(payload.matchedSkills, []),
    partialSkills: json(payload.partialSkills, []),
    missingSkills: json(payload.missingSkills, []),
    readinessLevel: str(row.readiness_level, str(payload.readinessLevel)),
    nextMove: str(row.next_move, str(payload.nextMove)),
    analyzedAt: str(row.updated_at, new Date().toISOString()),
  };
}

function rowToPlan(row: Row, userId: string): CareerPlanRecord {
  const payload = json<Record<string, unknown>>(row.plan_payload, {});
  return {
    id: str(row.id),
    userId,
    targetRole: str(row.target_role),
    targetJobId: str(row.target_job_id) || undefined,
    skillGaps: json(payload.skill_gaps, []),
    phases: json(payload.phases, []),
    totalTasks: num(payload.total_tasks, 0),
    completedTasks: num(payload.completed_tasks, 0),
    progressPercent: num(row.progress_percent),
    currentPhase: str(row.current_phase),
    nextTask: str(row.next_task),
    createdAt: str(row.created_at, new Date().toISOString()),
    updatedAt: str(row.updated_at, new Date().toISOString()),
  };
}

function rowToInterview(row: Row, userId: string): InterviewSession {
  const payload = json<Record<string, unknown>>(row.session_payload, {});
  const evaluation =
    normalizeInterviewEvaluation(payload.evaluation) ??
    json<InterviewEvaluation>(payload.evaluation, {
      overallScore: 0,
      grade: 'N/A',
      breakdown: { correctness: 0, completeness: 0, technicalDepth: 0, clarity: 0 },
      strengths: [],
      missingConcepts: [],
      suggestedImprovement: '',
      modelAnswer: '',
      evaluatedAt: new Date().toISOString(),
    });
  return {
    id: str(row.id),
    userId,
    question: str(row.question),
    answer: str(row.answer),
    topic: str(row.topic),
    mode: str(row.mode, 'text'),
    evaluation,
    createdAt: str(row.created_at, new Date().toISOString()),
  };
}

function rowToApplication(row: Row, userId: string): ApplicationRecord {
  return {
    id: str(row.id),
    userId,
    company: str(row.company),
    role: str(row.role),
    status: str(row.status, 'saved') as ApplicationRecord['status'],
    matchScore: num(row.match_score),
    salary: str(row.salary) || undefined,
    location: str(row.location) || undefined,
    appliedDate: str(row.applied_date) || null,
    notes: str(row.notes) || undefined,
    prepPack: json(row.prep_payload, null),
  };
}

export const lemmaApi = {
  enabled: lemmaBackendEnabled(),

  async googleLogin(payload?: { credential?: string; email?: string; name?: string; picture?: string }): Promise<{ user: User }> {
    let email = payload?.email;
    let name = payload?.name;
    let avatar = payload?.picture;

    if (payload?.credential) {
      try {
        const parts = payload.credential.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(parts[1]))));
          email = email || decoded.email;
          name = name || decoded.name;
          avatar = avatar || decoded.picture;
        }
      } catch (e) {}
    }

    email = email || 'dewarsh.jain@google.com';
    name = name || 'Dewarsh Jain';

    const client = podClient();
    const me = await client.users.current();
    const existing = await getProfileRow();

    if (existing?.id) {
      await client.records.update('career_profiles', String(existing.id), {
        display_name: name,
        email,
      });
    }

    const res = await this.getMe();
    return {
      user: res?.user || {
        id: String(me.id),
        name,
        email,
        avatar,
        currentStatus: 'Candidate',
        targetRole: '',
        experienceLevel: '',
        careerReadiness: 0,
        onboarded: false,
        plan: 'pro',
      },
    };
  },

  async getMe(): Promise<{ user: User } | null> {
    const client = podClient();
    const me = await client.users.current();
    const profile = await getProfileRow();
    if (!profile) {
      return {
        user: {
          id: String(me.id),
          name: (me as { first_name?: string }).first_name || me.email?.split('@')[0] || 'Member',
          email: me.email || '',
          currentStatus: 'Student / Fresher',
          targetRole: 'Full Stack Developer',
          experienceLevel: 'Fresher (0-1 yrs)',
          careerReadiness: 0,
          onboarded: false,
          plan: 'pro',
        },
      };
    }
    let analysis: any = undefined;
    if (profile.active_resume_id) {
      try {
        const resumeRow = (await client.records.get('resumes', String(profile.active_resume_id))) as Row;
        if (resumeRow?.analysis) {
          analysis = json(resumeRow.analysis, undefined);
        }
      } catch (e) {}
    }
    return { user: profileToUser(profile, me.id, analysis) };
  },

  async getResumes(userId: string): Promise<ResumeRecord[]> {
    const profile = await getProfileRow();
    if (!profile) {
      return [];
    }
    const rows = await listRows('resumes');
    const matched = rows.filter((r) => {
      if (profile.active_resume_id && str(r.id) === String(profile.active_resume_id)) return true;
      if (r.user_id && (str(r.user_id) === String(profile.id) || str(r.user_id) === userId)) return true;
      return false;
    });
    return matched.map((row) => rowToResume(row, userId));
  },

  async getJobs(userId: string): Promise<JobRecord[]> {
    const rows = await listRows('target_jobs');
    return rows.map((row) => rowToJob(row, userId));
  },

  async getActiveMatch(userId: string): Promise<{ match: MatchRecord | null; job: JobRecord | null }> {
    const profile = await getProfileRow();
    if (!profile || !profile.active_resume_id) {
      return { match: null, job: null };
    }
    const matches = await listRows('job_matches');
    const userMatches = matches.filter(
      (m) =>
        (profile.active_resume_id && str(m.resume_id) === String(profile.active_resume_id)) ||
        (m.user_id && (str(m.user_id) === String(profile.id) || str(m.user_id) === userId))
    );
    const active = userMatches.find((m) => m.is_active) ?? userMatches[0];
    if (!active) {
      return { match: null, job: null };
    }
    const match = rowToMatch(active, userId);
    const jobs = await listRows('target_jobs');
    const jobRow = jobs.find((j) => str(j.id) === match.jobId);
    return { match, job: jobRow ? rowToJob(jobRow, userId) : null };
  },

  async getCareerPlan(userId: string): Promise<CareerPlanRecord | null> {
    const profile = await getProfileRow();
    if (!profile || !profile.active_resume_id) {
      return null;
    }
    const rows = await listRows('career_plans');
    const userPlans = rows.filter(
      (r) =>
        (profile.active_resume_id && str(r.resume_id) === String(profile.active_resume_id)) ||
        (r.user_id && (str(r.user_id) === String(profile.id) || str(r.user_id) === userId))
    );
    const active = userPlans.find((r) => r.is_active) ?? userPlans[0];
    return active ? rowToPlan(active, userId) : null;
  },

  async runMatch(resumeId: string, jobId: string): Promise<{ match: MatchRecord | null; job: JobRecord | null }> {
    await runPodFunction('compute_job_match', { resume_id: resumeId, job_id: jobId });
    await runPodFunction('refresh_readiness', {});
    await bumpQuotaUsage('jobMatches');
    return this.getActiveMatch('lemma-user');
  },

  async uploadResumeFromFile(file: File): Promise<{ success: true; resume: ResumeRecord; user: User }> {
    const text = await extractTextFromFile(file);
    return this.createResumeFromText(text, file.name);
  },

  async createResumeFromText(
    resumeText: string,
    fileName = 'resume.txt',
  ): Promise<{ success: true; resume: ResumeRecord; user: User }> {
    const client = podClient();
    const me = await client.users.current();
    const userId = String(me.id);
    const profile = await getProfileRow();
    const targetRole = profile ? str(profile.target_role) : undefined;

    try {
      const out = await runPodFunction(
        'analyze_resume',
        {
          resume_text: resumeText,
          file_name: fileName,
          target_role: targetRole,
          persist: true,
        },
        { timeoutMs: 240_000 },
      );
      const resumeId = str(out.resume_id);
      if (resumeId) {
        await bumpQuotaUsage('resumeAnalyses');
        const row = (await client.records.get('resumes', resumeId)) as Row;
        const analysisData = json(row.analysis, out.analysis || {});
        const patch: Record<string, unknown> = {
          active_resume_id: resumeId,
        };
        if ((analysisData as any).candidateName && (analysisData as any).candidateName !== 'Candidate') {
          patch.display_name = (analysisData as any).candidateName;
        }
        if (Array.isArray((analysisData as any).skills) && (analysisData as any).skills.length > 0) {
          patch.verified_skills = (analysisData as any).skills;
        }
        await updateProfilePatch(patch);

        // Auto-run match against active target job if available
        const jobs = await listRows('target_jobs');
        const targetJob = jobs.find((j) => str(j.id) === str(profile?.active_job_id)) || jobs[0];
        if (targetJob) {
          try {
            await runPodFunction('compute_job_match', { resume_id: resumeId, job_id: String(targetJob.id) });
            await runPodFunction('refresh_readiness', {});
          } catch (e) {
            console.warn('Auto match on resume creation non-fatal:', e);
          }
        }

        const user = (await this.getMe())!.user;
        return { success: true, resume: rowToResume(row, userId), user };
      }
    } catch (e) {
      console.warn('Lemma analyze_resume failed, using client fallback', e);
    }

    const analysis = analyzeResumeText(resumeText, fileName);
    for (const row of await listRows('resumes')) {
      if (row.is_primary) {
        await client.records.update('resumes', String(row.id), { is_primary: false });
      }
    }
    const created = (await client.records.create('resumes', {
      file_name: fileName,
      title: 'Primary resume',
      is_primary: true,
      user_id: userId,
      extracted_text: resumeText,
      analysis,
      processing_status: 'completed',
    })) as Row;

    await updateProfilePatch({
      active_resume_id: String(created.id),
      display_name: analysis.candidateName || undefined,
      verified_skills: analysis.skills || undefined,
    });

    // Auto-run match against active target job if available
    const jobs = await listRows('target_jobs');
    const targetJob = jobs.find((j) => str(j.id) === str(profile?.active_job_id)) || jobs[0];
    if (targetJob) {
      try {
        await runPodFunction('compute_job_match', { resume_id: String(created.id), job_id: String(targetJob.id) });
        await runPodFunction('refresh_readiness', {});
      } catch (e) {
        console.warn('Auto match on resume fallback non-fatal:', e);
      }
    }

    await bumpQuotaUsage('resumeAnalyses');
    const user = (await this.getMe())!.user;
    return { success: true, resume: rowToResume(created, userId), user };
  },

  async setActiveResume(resumeId: string): Promise<void> {
    const client = podClient();
    for (const row of await listRows('resumes')) {
      await client.records.update('resumes', String(row.id), { is_primary: str(row.id) === resumeId });
    }
    await updateProfilePatch({ active_resume_id: resumeId });
  },

  async deleteResume(resumeId: string): Promise<void> {
    await podClient().records.delete('resumes', resumeId);
    const profile = await getProfileRow();
    if (profile && str(profile.active_resume_id) === resumeId) {
      const remaining = (await listRows('resumes'))[0];
      await updateProfilePatch({ active_resume_id: remaining ? String(remaining.id) : null });
    }
  },

  async createJob(data: {
    jobText: string;
    roleTitle?: string;
    company?: string;
    location?: string;
    sourceUrl?: string;
  }): Promise<JobRecord> {
    const client = podClient();
    const me = await client.users.current();
    const userId = String(me.id);

    try {
      const out = await runPodFunction(
        'analyze_job',
        {
          job_text: data.jobText,
          role_title: data.roleTitle,
          company: data.company,
          location: data.location,
          source_url: data.sourceUrl,
          persist: true,
        },
        { timeoutMs: 240_000 },
      );
      const jobId = str(out.job_id);
      if (jobId) {
        const row = (await client.records.get('target_jobs', jobId)) as Row;
        const job = rowToJob(row, userId);
        await this.createApplication({
          company: job.company,
          role: job.roleTitle,
          status: 'saved',
          location: job.location,
          salary: '$135k - $175k',
          matchScore: 82,
          notes: `Target job analyzed via Lemma agent.`,
        }).catch(() => undefined);
        return job;
      }
    } catch (e) {
      console.warn('Lemma analyze_job failed, using client fallback', e);
    }

    const parsed = analyzeJobDescription(data.jobText, data);
    const created = (await client.records.create('target_jobs', {
      role_title: parsed.roleTitle,
      company: parsed.company,
      location: parsed.location,
      seniority: parsed.seniority,
      experience_required: parsed.experienceRequired,
      raw_description: parsed.rawDescription,
      source_url: parsed.sourceUrl,
      job_analysis: parsed.analysis,
    })) as Row;
    await updateProfilePatch({
      active_job_id: String(created.id),
      target_role: parsed.roleTitle,
    });
    await this.createApplication({
      company: parsed.company,
      role: parsed.roleTitle,
      status: 'saved',
      location: parsed.location,
      salary: '$135k - $175k',
      matchScore: 82,
      notes: `Target job created in CareerPilot workspace.`,
    }).catch(() => undefined);
    return rowToJob(created, userId);
  },

  async scrapeJobUrl(url: string): Promise<{ job: JobRecord; message: string }> {
    let hostname = 'Company';
    try {
      hostname = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
      hostname = hostname.charAt(0).toUpperCase() + hostname.slice(1);
    } catch {
      /* keep default */
    }
    const jobText = `Job posting imported from ${url}.\n\nPaste the full job description in Jobs → Edit to refine skill analysis.\n\nTypical requirements for software roles: React, TypeScript, Node.js, Docker, AWS, system design, and collaboration.`;
    const job = await this.createJob({
      jobText,
      roleTitle: 'Software Engineer',
      company: hostname,
      sourceUrl: url,
    });
    return {
      job,
      message: `Created a starter job from ${url}. Add the full description for accurate matching.`,
    };
  },

  async setActiveJob(jobId: string): Promise<{ targetRole: string }> {
    const client = podClient();
    const row = (await client.records.get('target_jobs', jobId)) as Row;
    await updateProfilePatch({ active_job_id: jobId, target_role: str(row.role_title) });
    return { targetRole: str(row.role_title) };
  },

  async deleteJob(jobId: string): Promise<void> {
    await podClient().records.delete('target_jobs', jobId);
  },

  async updateCareerPlanTask(
    taskId: string,
    status: 'completed' | 'in_progress' | 'todo',
  ): Promise<CareerPlanRecord | null> {
    const client = podClient();
    const rows = await listRows('career_plans');
    const active = rows.find((r) => r.is_active) ?? rows[0];
    if (!active?.id) return null;

    const payload = json<Record<string, unknown>>(active.plan_payload, {});
    const phases = json<Array<{ tasks?: Array<{ id: string; status: string }> }>>(payload.phases, []);
    let total = 0;
    let completed = 0;
    for (const phase of phases) {
      for (const task of phase.tasks ?? []) {
        total++;
        if (task.id === taskId) task.status = status;
        if (task.status === 'completed') completed++;
      }
    }
    payload.phases = phases;
    payload.total_tasks = total;
    payload.completed_tasks = completed;
    const progress = total ? Math.round((completed / total) * 100) : num(active.progress_percent, 0);

    await client.records.update('career_plans', String(active.id), {
      plan_payload: payload,
      progress_percent: progress,
    });
    await runPodFunction('refresh_readiness', {}).catch(() => undefined);
    return this.getCareerPlan('lemma-user');
  },

  async reanalyzeReadiness(): Promise<{ newScore: number; match: MatchRecord | null; message: string }> {
    const out = await runPodFunction('refresh_readiness', {});
    const score = num(out.career_readiness, 0);
    const { match } = await this.getActiveMatch('lemma-user');
    return {
      newScore: score || match?.matchScore || 0,
      match,
      message: 'Readiness re-evaluated from your plan progress and interview practice.',
    };
  },

  async getInterviewQuestion(ctx: {
    focusTopic?: string;
    mode?: string;
  }): Promise<ReturnType<typeof buildInterviewQuestion>> {
    const me = await this.getMe();
    const resumes = await this.getResumes(me?.user?.id || 'member');
    const resumeId = me?.user?.activeResumeId || resumes[0]?.id;
    const jobId = me?.user?.activeJobId;
    const { match, job } = await this.getActiveMatch(me?.user?.id || 'member');
    const resume = resumes.find((r) => r.id === resumeId) ?? resumes[0];
    const base = buildInterviewQuestion({ focusTopic: ctx.focusTopic, match, job, resume });

    try {
      const out = await raceTimeout(
        runPodFunction(
          'generate_interview_question',
          {
            focus_topic: ctx.focusTopic ?? base.topic,
            resume_id: resumeId,
            job_id: jobId,
          },
          { timeoutMs: 20_000 },
        ),
        5_000,
      );
      const question = str(out.question);
      if (!question) return base;
      const points = json<string[]>(out.expected_key_points ?? out.expectedKeyPoints, base.expectedKeyPoints);
      return {
        id: `q_${Date.now()}`,
        question,
        topic: str(out.topic, base.topic),
        difficulty: str(out.difficulty, base.difficulty),
        hint: str(out.hint, base.hint),
        expectedKeyPoints: points.length ? points : base.expectedKeyPoints,
      };
    } catch (e) {
      console.warn('Lemma generate_interview_question skipped or failed, using client question', e);
      return base;
    }
  },

  async evaluateInterview(data: {
    question: string;
    answer: string;
    topic?: string;
    mode?: string;
    expectedKeyPoints?: string[];
  }): Promise<{ sessionId: string; evaluation: InterviewEvaluation }> {
    await assertInterviewQuota();

    const me = await this.getMe();
    const resumeId = me?.user?.activeResumeId;
    const jobId = me?.user?.activeJobId;
    const fallbackEval = evaluateInterviewAnswer(data);

    try {
      const out = await raceTimeout(
        runPodFunction(
          'evaluate_interview',
          {
            question: data.question,
            answer: data.answer,
            topic: data.topic || 'General',
            resume_id: resumeId,
            job_id: jobId,
            persist: true,
          },
          { timeoutMs: 25_000 },
        ),
        8_000,
      );
      const evaluation = normalizeInterviewEvaluation(out.evaluation) ?? fallbackEval;
      await bumpQuotaUsage('interviewSessions');
      return { sessionId: str(out.session_id ?? out.sessionId, `sess_${Date.now()}`), evaluation };
    } catch (e) {
      console.warn('Lemma evaluate_interview skipped or failed, using client fallback', e);
    }

    const evaluation = fallbackEval;
    const client = podClient();
    const row = (await client.records.create('interview_sessions', {
      question: data.question,
      answer: data.answer,
      topic: data.topic || 'General',
      mode: data.mode || 'text',
      session_payload: { evaluation, expectedKeyPoints: data.expectedKeyPoints ?? [] },
    })) as Row;
    await runPodFunction('refresh_readiness', {}).catch(() => undefined);
    await bumpQuotaUsage('interviewSessions');
    return { sessionId: String(row.id), evaluation };
  },

  async getInterviewHistory(): Promise<{
    history: InterviewSession[];
    topicMastery: Array<{ topic: string; score: number; attempts: number; status: string }>;
  }> {
    const me = await this.getMe();
    const history = await this.getInterviewSessions(me?.user?.id || 'member');
    const byTopic = new Map<string, { total: number; count: number }>();
    for (const session of history) {
      const topic = session.topic || 'General';
      const prev = byTopic.get(topic) ?? { total: 0, count: 0 };
      prev.total += session.evaluation?.overallScore ?? 0;
      prev.count += 1;
      byTopic.set(topic, prev);
    }
    const topicMastery = [...byTopic.entries()].map(([topic, stats]) => {
      const score = stats.count ? Math.round((stats.total / stats.count) * 10) / 10 : 0;
      const status = score >= 8 ? 'Strong' : score >= 6.5 ? 'Building' : 'Needs Practice';
      return { topic, score, attempts: stats.count, status };
    });
    return { history, topicMastery };
  },

  async createApplication(data: Partial<ApplicationRecord>): Promise<ApplicationRecord> {
    const client = podClient();
    const me = await client.users.current();
    const userId = String(me.id);
    const { match } = await this.getActiveMatch(userId);
    const row = (await client.records.create('job_applications', {
      company: data.company || 'Company',
      role: data.role || 'Software Engineer',
      status: data.status || 'saved',
      match_score: data.matchScore ?? match?.matchScore ?? 0,
      salary: data.salary,
      location: data.location,
      applied_date: data.appliedDate,
      notes: data.notes,
      prep_payload: {
        nextMove: match?.nextMove,
        missingSkills: match?.missingSkills?.slice(0, 5),
        readinessLevel: match?.readinessLevel,
      },
    })) as Row;
    return rowToApplication(row, userId);
  },

  async updateApplication(id: string, updates: Partial<ApplicationRecord>): Promise<ApplicationRecord> {
    const client = podClient();
    const me = await client.users.current();
    const userId = String(me.id);
    const patch: Record<string, unknown> = {};
    if (updates.company !== undefined) patch.company = updates.company;
    if (updates.role !== undefined) patch.role = updates.role;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.matchScore !== undefined) patch.match_score = updates.matchScore;
    if (updates.salary !== undefined) patch.salary = updates.salary;
    if (updates.location !== undefined) patch.location = updates.location;
    if (updates.notes !== undefined) patch.notes = updates.notes;
    if (updates.appliedDate !== undefined) patch.applied_date = updates.appliedDate;
    await client.records.update('job_applications', id, patch);
    const row = (await client.records.get('job_applications', id)) as Row;
    return rowToApplication(row, userId);
  },

  async deleteApplication(id: string): Promise<void> {
    await podClient().records.delete('job_applications', id);
  },

  async getInterviewSessions(userId: string): Promise<InterviewSession[]> {
    const rows = await listRows('interview_sessions');
    return rows.map((row) => rowToInterview(row, userId));
  },

  async getApplications(userId: string): Promise<ApplicationRecord[]> {
    const rows = await listRows('job_applications');
    return rows.map((row) => rowToApplication(row, userId));
  },

  async getQuota(): Promise<{ plan: PlanTier; quota: UserQuota } | null> {
    const profile = await getProfileRow();
    if (!profile) {
      return null;
    }
    const plan = (str(profile.plan_tier, 'pro') as PlanTier) || 'pro';
    const stored = profile.quota ? json<UserQuota | null>(profile.quota, null) : null;
    const quota = stored ? { ...quotaForTier(plan, stored), plan } : quotaForTier(plan);
    return { plan, quota };
  },

  async switchPlan(tier: PlanTier): Promise<{ success: true; plan: PlanTier; quota: UserQuota }> {
    const existing = await getProfileRow();
    const prev = existing?.quota ? json<UserQuota | null>(existing.quota, null) : null;
    const quota = quotaForTier(tier, prev);
    const user = await this.saveProfile({ plan: tier, quota });
    return { success: true, plan: tier, quota: user.quota ?? quota };
  },

  async saveProfile(data: Partial<User>): Promise<User> {
    const client = podClient();
    const me = await client.users.current();
    const userId = String(me.id);
    const existing = await getProfileRow();

    const rowPatch: Record<string, unknown> = { onboarded: true };
    if (data.name !== undefined) rowPatch.display_name = data.name;
    if (data.email !== undefined) rowPatch.email = data.email;
    if (data.currentStatus !== undefined) rowPatch.current_status = data.currentStatus;
    if (data.targetRole !== undefined) rowPatch.target_role = data.targetRole;
    if (data.experienceLevel !== undefined) rowPatch.experience_level = data.experienceLevel;
    if (data.interests !== undefined) rowPatch.interests = data.interests;
    if (data.verifiedSkills !== undefined) rowPatch.verified_skills = data.verifiedSkills;
    if (data.onboarded !== undefined) rowPatch.onboarded = data.onboarded;
    if (data.plan !== undefined) rowPatch.plan_tier = data.plan;
    if (data.quota !== undefined) rowPatch.quota = data.quota;

    let recordId: string;
    if (existing?.id) {
      recordId = String(existing.id);
      await client.records.update('career_profiles', recordId, rowPatch);
    } else {
      const created = (await client.records.create('career_profiles', {
        display_name: data.name || me.email?.split('@')[0] || 'Member',
        email: data.email || me.email || '',
        current_status: data.currentStatus || 'Student / Fresher',
        target_role: data.targetRole || 'Full Stack Developer',
        experience_level: data.experienceLevel || 'Fresher (0-1 yrs)',
        career_readiness: data.careerReadiness ?? 0,
        onboarded: true,
        plan_tier: data.plan || 'pro',
        interests: data.interests || [],
        verified_skills: data.verifiedSkills || [],
        ...rowPatch,
      })) as Row;
      recordId = String(created.id);
    }

    const saved = (await client.records.get('career_profiles', recordId)) as Row;
    return profileToUser(saved, userId);
  },
};
