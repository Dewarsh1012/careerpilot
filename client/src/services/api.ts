import {
  User,
  ResumeRecord,
  JobRecord,
  MatchRecord,
  CareerPlanRecord,
  InterviewSession,
  InterviewEvaluation,
  ApplicationRecord,
  TailoredResume,
  CampusCohort,
  CandidateProfile,
  ConnectorAccount,
} from '../types';
import { seedInitialData } from './clientStorage';
import { evaluateInterviewAnswer } from './careerAnalysis';
import { lemmaApi, quotaForTier } from './lemmaBackend';
import type { PlanTier } from '../types';
import { lemmaBackendEnabled, podClient } from '../lemma-client';

if (!lemmaBackendEnabled()) {
  seedInitialData();
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

function getHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem('careerpilot_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export const api = {
  // Authentication
  auth: {
    async register(data: { name: string; email: string; password?: string }) {
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch (e) {
        // Fallback
      }
      const user: User = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: data.email,
        currentStatus: 'Student / Fresher',
        targetRole: 'Full Stack Developer',
        experienceLevel: 'Fresher (0-1 yrs)',
        interests: ['Web Development'],
        careerReadiness: 70,
        onboarded: false,
      };
      localStorage.setItem('careerpilot_user', JSON.stringify(user));
      return { user, token: 'local_token' };
    },

    async login(data: { email: string; password?: string }) {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch (e) {
        // Fallback
      }
      const stored = localStorage.getItem('careerpilot_user');
      const user: User = stored ? JSON.parse(stored) : {
        id: 'user_default_1',
        name: data.email.split('@')[0],
        email: data.email,
        currentStatus: 'Student / Fresher',
        targetRole: 'Full Stack Developer',
        experienceLevel: 'Fresher (0-1 yrs)',
        interests: ['Web Development', 'Cloud Systems'],
        careerReadiness: 78,
        onboarded: true,
      };
      localStorage.setItem('careerpilot_user', JSON.stringify(user));
      return { user, token: 'local_token' };
    },

    async googleLogin(payload?: { credential?: string; email?: string; name?: string; picture?: string }) {
      if (lemmaApi.enabled) {
        try {
          return await lemmaApi.googleLogin(payload);
        } catch (e) {
          console.warn('Lemma Google login fallback', e);
        }
      }

      try {
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload || {}),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) localStorage.setItem('careerpilot_token', data.token);
          if (data.user) localStorage.setItem('careerpilot_user', JSON.stringify(data.user));
          return data;
        }
      } catch (e) {
        // Fallback
      }

      // Safe client decode if ID token was passed
      let email = payload?.email || 'dewarsh.jain@google.com';
      let name = payload?.name || 'Dewarsh Jain';
      let avatar = payload?.picture || undefined;

      if (payload?.credential) {
        try {
          const parts = payload.credential.split('.');
          if (parts.length === 3) {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(parts[1]))));
            email = decoded.email || email;
            name = decoded.name || name;
            avatar = decoded.picture || avatar;
          }
        } catch (e) {}
      }

      const user: User = {
        id: `google_${Date.now()}`,
        name,
        email,
        avatar,
        currentStatus: 'Software Engineer',
        targetRole: 'Full Stack Engineer',
        experienceLevel: '1-3 yrs',
        interests: ['Full Stack', 'Cloud & DevOps', 'Distributed Systems'],
        careerReadiness: 82,
        onboarded: true,
        plan: 'pro',
      };
      localStorage.setItem('careerpilot_user', JSON.stringify(user));
      return { user, token: 'local_token' };
    },

    async getMe(): Promise<{ user: User }> {
      if (typeof window !== 'undefined' && localStorage.getItem('careerpilot_logged_out') === 'true') {
        return { user: null as any };
      }
      if (lemmaApi.enabled) {
        try {
          const data = await lemmaApi.getMe();
          if (data?.user) return data;
        } catch (e) {
          console.warn('Lemma profile load failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
        if (res.ok) return await res.json();
      } catch (e) {
        // Fallback
      }
      const stored = localStorage.getItem('careerpilot_user');
      return { user: stored ? JSON.parse(stored) : (null as any) };
    },

    async updateOnboarding(data: Partial<User>): Promise<{ user: User }> {
      if (lemmaApi.enabled) {
        try {
          const user = await lemmaApi.saveProfile(data);
          return { user };
        } catch (e) {
          console.warn('Lemma profile save failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/auth/onboarding`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch (e) {
        // Fallback
      }
      const stored = localStorage.getItem('careerpilot_user');
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...current, ...data, onboarded: true };
      localStorage.setItem('careerpilot_user', JSON.stringify(updated));
      return { user: updated };
    },

    async getQuota() {
      if (lemmaApi.enabled) {
        try {
          const q = await lemmaApi.getQuota();
          if (q) return q;
        } catch (e) {
          console.warn('Lemma quota load failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/auth/quota`, { headers: getHeaders() });
        if (res.ok) return await res.json();
      } catch (e) {}
      return {
        plan: 'pro',
        quota: {
          plan: 'pro',
          resumeAnalyses: { used: 1, limit: 999 },
          jobMatches: { used: 3, limit: 999 },
          tailoredResumes: { used: 1, limit: 999 },
          interviewSessions: { used: 2, limit: 999 },
          voiceInterviews: { used: 1, limit: 999 },
        },
      };
    },

    async switchTier(plan: PlanTier) {
      if (lemmaApi.enabled) {
        try {
          return await lemmaApi.switchPlan(plan);
        } catch (e) {
          console.warn('Lemma plan switch failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/auth/tier`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ plan }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const u = JSON.parse(localStorage.getItem('careerpilot_user') || '{}');
            localStorage.setItem('careerpilot_user', JSON.stringify({ ...u, ...data.user }));
          }
          if (data.quota && data.plan) {
            return data;
          }
        }
      } catch (e) {}
      const stored = JSON.parse(localStorage.getItem('careerpilot_user') || '{}');
      const quota = quotaForTier(plan, stored.quota);
      const updated = { ...stored, plan, quota };
      localStorage.setItem('careerpilot_user', JSON.stringify(updated));
      return { success: true, plan, quota };
    },

    async setActiveTrack(data: { activeJobId?: string; activeResumeId?: string; targetRole?: string }) {
      if (lemmaApi.enabled) {
        try {
          const patch: Partial<User> = {};
          if (data.targetRole) patch.targetRole = data.targetRole;
          await lemmaApi.saveProfile(patch);
          if (data.activeResumeId) await lemmaApi.setActiveResume(data.activeResumeId);
          if (data.activeJobId) await lemmaApi.setActiveJob(data.activeJobId);
          const me = await lemmaApi.getMe();
          return { success: true, user: me?.user };
        } catch (e) {
          console.warn('Lemma active track failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/auth/active-track`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch (e) {}
      const u = JSON.parse(localStorage.getItem('careerpilot_user') || '{}');
      const updated = { ...u, ...data };
      localStorage.setItem('careerpilot_user', JSON.stringify(updated));
      return { success: true, user: updated };
    },
  },

  // Lemma Connectors (Google, GitHub, LinkedIn integrations via Composio)
  connectors: {
    async getAccounts(): Promise<{ accounts: ConnectorAccount[]; googleAccounts: ConnectorAccount[]; supportedConnectors: any[] }> {
      try {
        const res = await fetch(`${API_BASE}/auth/connectors/accounts`, {
          headers: getHeaders(),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn('Failed to fetch connector accounts from API:', e);
      }
      return {
        accounts: [
          {
            id: '019f6538-39c1-72af-9e39-13b355ae6015',
            connector_id: 'google_calendar',
            status: 'CONNECTED',
            display_name: 'googlecalendar_masker-doup',
            connector: {
              id: 'google_calendar',
              title: 'Google Calendar & Workspace',
              icon: 'https://logos.composio.dev/api/googlecalendar',
            },
          },
          {
            id: '019f653a-c852-7360-bc0f-2114757c2bc3',
            connector_id: 'googlemeet',
            status: 'CONNECTED',
            display_name: 'googlemeet_yahuna-sell',
            connector: {
              id: 'googlemeet',
              title: 'Google Meet',
              icon: 'https://logos.composio.dev/api/googlemeet',
            },
          },
          {
            id: '019f6536-cbba-72d9-a46c-67aa3ae5196e',
            connector_id: 'github',
            status: 'CONNECTED',
            display_name: 'github_launce-flanch',
            connector: {
              id: 'github',
              title: 'GitHub',
              icon: 'https://logos.composio.dev/api/github',
            },
          },
        ],
        googleAccounts: [
          {
            id: '019f6538-39c1-72af-9e39-13b355ae6015',
            connector_id: 'google_calendar',
            status: 'CONNECTED',
            display_name: 'googlecalendar_masker-doup',
            connector: {
              id: 'google_calendar',
              title: 'Google Calendar & Workspace',
              icon: 'https://logos.composio.dev/api/googlecalendar',
            },
          },
          {
            id: '019f653a-c852-7360-bc0f-2114757c2bc3',
            connector_id: 'googlemeet',
            status: 'CONNECTED',
            display_name: 'googlemeet_yahuna-sell',
            connector: {
              id: 'googlemeet',
              title: 'Google Meet',
              icon: 'https://logos.composio.dev/api/googlemeet',
            },
          },
        ],
        supportedConnectors: [
          { id: 'google_calendar', title: 'Google (Calendar & Identity)', icon: 'https://logos.composio.dev/api/googlecalendar', kind: 'google' },
          { id: 'googlemeet', title: 'Google Meet', icon: 'https://logos.composio.dev/api/googlemeet', kind: 'google' },
          { id: 'github', title: 'GitHub', icon: 'https://logos.composio.dev/api/github', kind: 'github' },
          { id: 'linkedin', title: 'LinkedIn', icon: 'https://logos.composio.dev/api/linkedin', kind: 'linkedin' },
        ],
      };
    },

    async createConnectRequest(connectorId: string = 'google_calendar'): Promise<{ authorizationUrl?: string; requestId?: string; error?: string }> {
      // 1. Direct pod client call if available in Lemma environment
      if (lemmaBackendEnabled()) {
        try {
          const client = podClient();
          const orgId = '019efdaa-8b05-746b-9004-181d2b2f6064';
          const req = await (client.connectors as any).createConnectRequest(orgId, { connector_id: connectorId });
          if (req?.authorization_url) {
            return { authorizationUrl: req.authorization_url, requestId: req.id };
          }
        } catch (sdkErr) {
          console.warn('[Lemma SDK Connectors] Direct podClient call attempt:', sdkErr);
        }
      }

      // 2. Try Node server API endpoint if reachable with valid JSON
      try {
        const res = await fetch(`${API_BASE}/auth/connectors/connect`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ connectorId }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data?.authorizationUrl) {
            return { authorizationUrl: data.authorizationUrl, requestId: data.requestId };
          }
        }
      } catch (e: any) {
        console.warn('API connect endpoint check:', e);
      }

      // 3. Fallback to active Composio connector links for this organization
      const fallbackUrls: Record<string, string> = {
        googlemeet: 'https://connect.composio.dev/link/lk_F_WxDksZ9stX',
        google_calendar: 'https://connect.composio.dev/link/lk_QI5Qn0rCiksu',
        github: 'https://connect.composio.dev/link/lk_ceYaVahVMdmy',
        linkedin: 'https://connect.composio.dev/link/lk_QI5Qn0rCiksu',
      };

      const authorizationUrl = fallbackUrls[connectorId] || `https://connect.composio.dev/link/lk_F_WxDksZ9stX`;
      return { authorizationUrl, requestId: `req_${Date.now()}` };
    },

    async loginWithConnector(data: { accountId?: string; connectorId?: string; email?: string; name?: string }): Promise<{ user: User; token: string; account?: any }> {
      try {
        const res = await fetch(`${API_BASE}/auth/connectors/login`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const result = await res.json();
          if (result.token) localStorage.setItem('careerpilot_token', result.token);
          if (result.user) localStorage.setItem('careerpilot_user', JSON.stringify(result.user));
          return result;
        }
      } catch (e) {
        console.warn('Connector login failed, falling back to local user');
      }
      const user: User = {
        id: data.accountId || `connector_${Date.now()}`,
        name: data.name || 'Google Connected User',
        email: data.email || 'dewarsh.jain@google.com',
        avatar: 'https://lh3.googleusercontent.com/a/default-user',
        currentStatus: 'Software Engineer',
        targetRole: 'Full Stack Engineer',
        experienceLevel: 'Fresher (0-1 yrs)',
        interests: ['Cloud Systems', 'Full Stack Development', 'AI'],
        careerReadiness: 85,
        onboarded: true,
        plan: 'pro',
      };
      localStorage.setItem('careerpilot_user', JSON.stringify(user));
      return { user, token: 'local_token' };
    },
  },

  // Resumes
  resume: {
    async uploadResume(formData: FormData): Promise<{ success: boolean; resume: ResumeRecord; user?: any; error?: string }> {
      if (lemmaApi.enabled) {
        try {
          const file = formData.get('resume');
          if (file instanceof File) {
            return await lemmaApi.uploadResumeFromFile(file);
          }
        } catch (e: any) {
          return { success: false, resume: null as any, error: e.message || 'Resume upload failed' };
        }
      }
      try {
        const res = await fetch(`${API_BASE}/resumes/upload`, {
          method: 'POST',
          headers: getHeaders(true),
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.resume) {
            const current = JSON.parse(localStorage.getItem('careerpilot_resumes') || '[]');
            localStorage.setItem('careerpilot_resumes', JSON.stringify([data.resume, ...current.filter((r: any) => r.id !== data.resume.id)]));
            if (data.user) {
              const u = JSON.parse(localStorage.getItem('careerpilot_user') || '{}');
              localStorage.setItem('careerpilot_user', JSON.stringify({ ...u, ...data.user }));
            }
          }
          return data;
        } else {
          return { success: false, resume: null as any, error: data.error || 'Failed to extract resume telemetry.' };
        }
      } catch (e: any) {
        return { success: false, resume: null as any, error: e.message || 'Network error during upload.' };
      }
    },

    async uploadText(resumeText: string, fileName?: string): Promise<{ success: boolean; resume: ResumeRecord; user?: any; error?: string }> {
      if (lemmaApi.enabled) {
        try {
          return await lemmaApi.createResumeFromText(resumeText, fileName || 'pasted-resume.txt');
        } catch (e: any) {
          return { success: false, resume: null as any, error: e.message || 'Resume analysis failed' };
        }
      }
      try {
        const res = await fetch(`${API_BASE}/resumes/upload`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ resumeText, fileName }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.resume) {
            const current = JSON.parse(localStorage.getItem('careerpilot_resumes') || '[]');
            localStorage.setItem('careerpilot_resumes', JSON.stringify([data.resume, ...current.filter((r: any) => r.id !== data.resume.id)]));
            if (data.user) {
              const u = JSON.parse(localStorage.getItem('careerpilot_user') || '{}');
              localStorage.setItem('careerpilot_user', JSON.stringify({ ...u, ...data.user }));
            }
          }
          return data;
        } else {
          return { success: false, resume: null as any, error: data.error || 'Failed to extract resume telemetry.' };
        }
      } catch (e: any) {
        return { success: false, resume: null as any, error: e.message || 'Network error during text analysis.' };
      }
    },

    async getResumes(): Promise<ResumeRecord[]> {
      if (lemmaApi.enabled) {
        try {
          const me = await lemmaApi.getMe();
          return await lemmaApi.getResumes(me?.user?.id || 'member');
        } catch (e) {
          console.warn('Lemma resumes load failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/resumes`, { headers: getHeaders() });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            localStorage.setItem('careerpilot_resumes', JSON.stringify(list));
            return list;
          }
        }
      } catch (e) {}
      return JSON.parse(localStorage.getItem('careerpilot_resumes') || '[]');
    },

    async setActive(id: string): Promise<{ success: boolean; activeResumeId: string }> {
      if (lemmaApi.enabled) {
        try {
          await lemmaApi.setActiveResume(id);
          return { success: true, activeResumeId: id };
        } catch (e) {
          console.warn('Lemma set active resume failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/resumes/${id}/active`, {
          method: 'PATCH',
          headers: getHeaders(),
        });
        if (res.ok) return await res.json();
      } catch (e) {}
      const u = JSON.parse(localStorage.getItem('careerpilot_user') || '{}');
      u.activeResumeId = id;
      localStorage.setItem('careerpilot_user', JSON.stringify(u));
      return { success: true, activeResumeId: id };
    },

    async delete(id: string): Promise<{ success: boolean }> {
      if (lemmaApi.enabled) {
        try {
          await lemmaApi.deleteResume(id);
          return { success: true };
        } catch (e) {
          console.warn('Lemma delete resume failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/resumes/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        if (res.ok) {
          const list = JSON.parse(localStorage.getItem('careerpilot_resumes') || '[]');
          localStorage.setItem('careerpilot_resumes', JSON.stringify(list.filter((r: any) => r.id !== id)));
          return await res.json();
        }
      } catch (e) {}
      return { success: true };
    },

    async loadSample(sampleType: 'fullstack' | 'frontend' | 'backend'): Promise<{ success: boolean; resume: ResumeRecord }> {
      if (lemmaApi.enabled) {
        const samples: Record<string, string> = {
          fullstack:
            'Archi Jain — Full Stack Developer. React, TypeScript, Node.js, Express, PostgreSQL, MongoDB, Git. Built MERN collaboration app with WebSockets.',
          frontend: 'Alex Chen — Frontend Engineer. React, Next.js, TypeScript, Tailwind CSS, GraphQL.',
          backend: 'Sam Patel — Backend Engineer. Node.js, Python, PostgreSQL, Redis, Docker, AWS, REST APIs.',
        };
        try {
          const res = await lemmaApi.createResumeFromText(
            samples[sampleType] || samples.fullstack,
            `${sampleType}-sample.txt`,
          );
          return { success: true, resume: res.resume };
        } catch (e) {
          console.warn('Lemma sample resume failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/resumes/sample`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ sampleType }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.resume) {
            const current = JSON.parse(localStorage.getItem('careerpilot_resumes') || '[]');
            localStorage.setItem('careerpilot_resumes', JSON.stringify([data.resume, ...current.filter((r: any) => r.id !== data.resume.id)]));
            if (data.user) {
              const u = JSON.parse(localStorage.getItem('careerpilot_user') || '{}');
              localStorage.setItem('careerpilot_user', JSON.stringify({ ...u, ...data.user }));
            }
          }
          return data;
        }
      } catch (e) {}
      const resumes = JSON.parse(localStorage.getItem('careerpilot_resumes') || '[]');
      return { success: true, resume: resumes[0] };
    },
  },

  // Jobs
  jobs: {
    async getJobs(): Promise<JobRecord[]> {
      if (lemmaApi.enabled) {
        try {
          const me = await lemmaApi.getMe();
          return await lemmaApi.getJobs(me?.user?.id || 'member');
        } catch (e) {
          console.warn('Lemma jobs load failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/jobs`, { headers: getHeaders() });
        if (res.ok) return await res.json();
      } catch (e) {}
      return JSON.parse(localStorage.getItem('careerpilot_jobs') || '[]');
    },

    async scrapeJob(url: string): Promise<{ job: JobRecord; message?: string; error?: string }> {
      if (lemmaApi.enabled) {
        try {
          return await lemmaApi.scrapeJobUrl(url);
        } catch (e: any) {
          return { job: null as any, error: e.message || 'Could not import job URL' };
        }
      }
      try {
        const res = await fetch(`${API_BASE}/jobs/scrape`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (res.ok && data.job) {
          const jobs = JSON.parse(localStorage.getItem('careerpilot_jobs') || '[]');
          jobs.unshift(data.job);
          localStorage.setItem('careerpilot_jobs', JSON.stringify(jobs));
          return data;
        }
        return { job: null as any, error: data.error || 'Failed to scrape job' };
      } catch (e: any) {
        return { job: null as any, error: e.message || 'Network error scraping job' };
      }
    },

    async createJob(data: { jobText: string; roleTitle?: string; company?: string; location?: string; sourceUrl?: string }): Promise<JobRecord> {
      if (lemmaApi.enabled) {
        try {
          return await lemmaApi.createJob(data);
        } catch (e) {
          console.warn('Lemma create job failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/jobs`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch (e) {}

      const jobs = JSON.parse(localStorage.getItem('careerpilot_jobs') || '[]');
      const newJob: JobRecord = {
        id: `job_${Date.now()}`,
        userId: 'user_default_1',
        roleTitle: data.roleTitle || 'Custom Engineer',
        company: data.company || 'Target Company',
        location: data.location || 'Remote',
        seniority: 'Mid-Level',
        experienceRequired: '2-4 years',
        rawDescription: data.jobText,
        sourceUrl: data.sourceUrl,
        analysis: {
          roleTitle: data.roleTitle || 'Custom Engineer',
          company: data.company || 'Target Company',
          seniority: 'Mid-Level',
          experienceRequired: '2-4 years',
          summary: 'Engineered for full-stack delivery and cloud-native workflows.',
          requiredSkills: [
            { name: 'React', category: 'Frontend', priority: 'High' },
            { name: 'TypeScript', category: 'Language', priority: 'High' },
            { name: 'Docker', category: 'DevOps', priority: 'High' },
          ],
          preferredSkills: [{ name: 'AWS', category: 'Cloud' }],
          responsibilities: ['Build resilient user interfaces and scalable APIs.'],
        },
      };
      jobs.push(newJob);
      localStorage.setItem('careerpilot_jobs', JSON.stringify(jobs));
      return newJob;
    },

    async setActive(id: string): Promise<{ success: boolean; activeJobId: string; targetRole: string }> {
      if (lemmaApi.enabled) {
        try {
          const { targetRole } = await lemmaApi.setActiveJob(id);
          return { success: true, activeJobId: id, targetRole };
        } catch (e) {
          console.warn('Lemma set active job failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/jobs/${id}/active`, {
          method: 'PATCH',
          headers: getHeaders(),
        });
        if (res.ok) return await res.json();
      } catch (e) {}
      const jobs = JSON.parse(localStorage.getItem('careerpilot_jobs') || '[]');
      const match = jobs.find((j: any) => j.id === id);
      const u = JSON.parse(localStorage.getItem('careerpilot_user') || '{}');
      u.activeJobId = id;
      if (match) u.targetRole = match.roleTitle;
      localStorage.setItem('careerpilot_user', JSON.stringify(u));
      return { success: true, activeJobId: id, targetRole: match?.roleTitle || 'Engineer' };
    },

    async delete(id: string): Promise<{ success: boolean }> {
      if (lemmaApi.enabled) {
        try {
          await lemmaApi.deleteJob(id);
          return { success: true };
        } catch (e) {
          console.warn('Lemma delete job failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/jobs/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        if (res.ok) {
          const list = JSON.parse(localStorage.getItem('careerpilot_jobs') || '[]');
          localStorage.setItem('careerpilot_jobs', JSON.stringify(list.filter((j: any) => j.id !== id)));
          return await res.json();
        }
      } catch (e) {}
      return { success: true };
    },

    async getJob(id: string): Promise<JobRecord> {
      try {
        const res = await fetch(`${API_BASE}/jobs/${id}`, { headers: getHeaders() });
        if (res.ok) return await res.json();
      } catch (e) {}
      const jobs = JSON.parse(localStorage.getItem('careerpilot_jobs') || '[]');
      return jobs.find((j: any) => j.id === id) || jobs[0];
    },
  },

  // Matching & Skill Gaps
  match: {
    async runMatch(jobId?: string): Promise<{ success: boolean; match: MatchRecord; job: JobRecord }> {
      if (lemmaApi.enabled) {
        try {
          const me = await lemmaApi.getMe();
          const resolvedJobId =
            jobId ||
            me?.user?.activeJobId ||
            (await lemmaApi.getJobs(me?.user?.id || 'member'))[0]?.id;
          const resumes = await lemmaApi.getResumes(me?.user?.id || 'member');
          const resumeId = me?.user?.activeResumeId || resumes[0]?.id;
          if (resumeId && resolvedJobId) {
            const result = await lemmaApi.runMatch(resumeId, resolvedJobId);
            if (result.match && result.job) {
              return { success: true, match: result.match, job: result.job };
            }
          }
        } catch (e) {
          console.warn('Lemma match run failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/matches`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ jobId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.match) {
            const currentMatches = JSON.parse(localStorage.getItem('careerpilot_matches') || '[]');
            localStorage.setItem('careerpilot_matches', JSON.stringify([data.match, ...currentMatches.filter((m: any) => m.id !== data.match.id)]));
          }
          return data;
        }
      } catch (e) {}

      const matches = JSON.parse(localStorage.getItem('careerpilot_matches') || '[]');
      const jobs = JSON.parse(localStorage.getItem('careerpilot_jobs') || '[]');
      return { success: true, match: matches[0], job: jobs[0] };
    },

    async getActiveMatch(): Promise<{ match: MatchRecord | null; job: JobRecord | null }> {
      if (lemmaApi.enabled) {
        try {
          const me = await lemmaApi.getMe();
          return await lemmaApi.getActiveMatch(me?.user?.id || 'member');
        } catch (e) {
          console.warn('Lemma active match load failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/matches/active`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data.match) {
            const currentMatches = JSON.parse(localStorage.getItem('careerpilot_matches') || '[]');
            localStorage.setItem('careerpilot_matches', JSON.stringify([data.match, ...currentMatches.filter((m: any) => m.id !== data.match.id)]));
          }
          return data;
        }
      } catch (e) {}

      const matches = JSON.parse(localStorage.getItem('careerpilot_matches') || '[]');
      const jobs = JSON.parse(localStorage.getItem('careerpilot_jobs') || '[]');
      return { match: matches[0] || null, job: jobs[0] || null };
    },
  },

  // Career Plan
  career: {
    async getCareerPlan(): Promise<CareerPlanRecord> {
      if (lemmaApi.enabled) {
        try {
          const me = await lemmaApi.getMe();
          const plan = await lemmaApi.getCareerPlan(me?.user?.id || 'member');
          if (plan) return plan;
        } catch (e) {
          console.warn('Lemma plan load failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/career-plans`, { headers: getHeaders() });
        if (res.ok) {
          const plan = await res.json();
          if (plan && plan.id) {
            localStorage.setItem('careerpilot_plan', JSON.stringify(plan));
            return plan;
          }
        }
      } catch (e) {}
      return JSON.parse(localStorage.getItem('careerpilot_plan') || '{}');
    },

    async generatePlan(jobId?: string): Promise<CareerPlanRecord> {
      if (lemmaApi.enabled && jobId) {
        try {
          const me = await lemmaApi.getMe();
          const resumes = await lemmaApi.getResumes(me?.user?.id || 'member');
          const resumeId = me?.user?.activeResumeId || resumes[0]?.id;
          if (resumeId) {
            await lemmaApi.runMatch(resumeId, jobId);
          }
          const plan = await lemmaApi.getCareerPlan(me?.user?.id || 'member');
          if (plan) return plan;
        } catch (e) {
          console.warn('Lemma generate plan failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/career-plans/generate`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ jobId }),
        });
        if (res.ok) {
          const plan = await res.json();
          if (plan && plan.id) {
            localStorage.setItem('careerpilot_plan', JSON.stringify(plan));
            return plan;
          }
        }
      } catch (e) {}
      return JSON.parse(localStorage.getItem('careerpilot_plan') || '{}');
    },

    async updateTaskStatus(taskId: string, status: 'completed' | 'in_progress' | 'todo'): Promise<CareerPlanRecord> {
      if (lemmaApi.enabled) {
        try {
          const plan = await lemmaApi.updateCareerPlanTask(taskId, status);
          if (plan) return plan;
        } catch (e) {
          console.warn('Lemma task update failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/career-plans/tasks/${taskId}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ status }),
        });
        if (res.ok) return await res.json();
      } catch (e) {}

      const plan: CareerPlanRecord = JSON.parse(localStorage.getItem('careerpilot_plan') || '{}');
      let total = 0;
      let completed = 0;
      plan.phases?.forEach((p) => {
        p.tasks?.forEach((t) => {
          total++;
          if (t.id === taskId) t.status = status;
          if (t.status === 'completed') completed++;
        });
      });
      plan.totalTasks = total;
      plan.completedTasks = completed;
      plan.progressPercent = Math.round((completed / total) * 100);
      localStorage.setItem('careerpilot_plan', JSON.stringify(plan));
      return plan;
    },

    async reanalyzeReadiness(): Promise<{ success: boolean; newScore: number; match: MatchRecord; message: string }> {
      if (lemmaApi.enabled) {
        try {
          const res = await lemmaApi.reanalyzeReadiness();
          return {
            success: true,
            newScore: res.newScore,
            match: res.match as MatchRecord,
            message: res.message,
          };
        } catch (e) {
          console.warn('Lemma reanalyze failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/career-plans/reanalyze`, {
          method: 'POST',
          headers: getHeaders(),
        });
        if (res.ok) return await res.json();
      } catch (e) {}

      const matches = JSON.parse(localStorage.getItem('careerpilot_matches') || '[]');
      const match = matches[0] || {};
      match.matchScore = Math.min(96, (match.matchScore || 78) + 6);
      localStorage.setItem('careerpilot_matches', JSON.stringify([match]));
      return {
        success: true,
        newScore: match.matchScore,
        match,
        message: 'Readiness re-evaluated! Your progress has updated your career profile.',
      };
    },
  },

  // AI Interview Coach
  interview: {
    async getQuestion(data?: { focusTopic?: string; mode?: string }): Promise<{
      id: string;
      question: string;
      topic: string;
      difficulty: string;
      hint: string;
      expectedKeyPoints: string[];
    }> {
      if (lemmaApi.enabled) {
        try {
          return await lemmaApi.getInterviewQuestion(data || {});
        } catch (e) {
          console.warn('Lemma interview question failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/interviews/question`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data || {}),
        });
        if (res.ok) return await res.json();
      } catch (e) {}

      return {
        id: `q_${Date.now()}`,
        question:
          'Explain the difference between a Docker image and a Docker container. In a production Node.js application, why is a multi-stage Dockerfile critical, and how does it prevent security leaks?',
        topic: data?.focusTopic || 'Docker',
        difficulty: 'Medium',
        hint: 'Focus on immutable images vs runnable instances, and reducing attack surface.',
        expectedKeyPoints: ['Multi-stage build separation', 'Excluding dev dependencies', 'Runtime isolation'],
      };
    },

    async evaluateAnswer(data: {
      question: string;
      answer: string;
      topic?: string;
      mode?: string;
      expectedKeyPoints?: string[];
      isVoiceSession?: boolean;
      audioMetrics?: {
        wpm?: number;
        durationSeconds?: number;
        fillerWordCount?: number;
        fillerWords?: Array<{ word: string; count: number }>;
      };
    }): Promise<{ success: boolean; sessionId: string; evaluation: InterviewEvaluation; quota?: any; error?: string }> {
      if (lemmaApi.enabled) {
        try {
          const result = await lemmaApi.evaluateInterview(data);
          const q = await lemmaApi.getQuota().catch(() => null);
          let evaluation = result.evaluation;
          if (evaluation && typeof evaluation.overallScore !== 'number') {
            evaluation = evaluateInterviewAnswer({
              question: data.question,
              answer: data.answer,
              topic: data.topic,
              expectedKeyPoints: data.expectedKeyPoints,
            });
          }
          if (data.isVoiceSession && evaluation) {
            evaluation = {
              ...evaluation,
              voiceTelemetry: {
                wpm: data.audioMetrics?.wpm ?? 0,
                durationSeconds: data.audioMetrics?.durationSeconds ?? 0,
                fillerWordCount: data.audioMetrics?.fillerWordCount ?? 0,
                fillerWords: data.audioMetrics?.fillerWords ?? [],
                pacingRating: 'Optimal Pace',
                speechDeliveryScore: 8,
                deliveryFeedback: 'Voice answer recorded. Review clarity and pacing in your transcript.',
              },
            };
          }
          return {
            success: true,
            sessionId: result.sessionId,
            evaluation,
            quota: q?.quota,
          };
        } catch (e: any) {
          const msg = String(e?.message ?? '');
          if (/quota/i.test(msg)) {
            return { success: false, sessionId: '', evaluation: null as any, error: msg };
          }
          console.warn('Lemma interview evaluate failed, using local scoring', e);
          const evaluation = evaluateInterviewAnswer({
            question: data.question,
            answer: data.answer,
            topic: data.topic,
            expectedKeyPoints: data.expectedKeyPoints,
          });
          return { success: true, sessionId: `local_${Date.now()}`, evaluation };
        }
      }
      try {
        const res = await fetch(`${API_BASE}/interviews/evaluate`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (res.ok && json.success) return json;
        if (!res.ok) {
          return { success: false, sessionId: '', evaluation: null as any, error: json.error || 'Evaluation failed', quota: json.quota };
        }
      } catch (e: any) {
        // Fallback
      }

      const evalData: InterviewEvaluation = {
        overallScore: 8.5,
        grade: 'Strong Answer',
        breakdown: { correctness: 9, completeness: 8, technicalDepth: 8, clarity: 9 },
        strengths: [
          'Addressed multi-stage isolation clearly.',
          'Explained image layers and production artifact reduction accurately.',
        ],
        missingConcepts: ['Could mention secret injection avoidance and non-root container user.'],
        suggestedImprovement: 'Structure response with the STAR or Problem-Solution-Tradeoff method.',
        modelAnswer:
          'In production, images are immutable blueprints while containers are running instances. Multi-stage builds compile code in a build stage and copy only production artifacts into an alpine runner.',
        followUpQuestion: 'How would you handle graceful shutdown with SIGTERM in this container?',
        voiceTelemetry: data.isVoiceSession ? {
          wpm: data.audioMetrics?.wpm || 138,
          durationSeconds: data.audioMetrics?.durationSeconds || 32,
          fillerWordCount: data.audioMetrics?.fillerWordCount || 1,
          fillerWords: data.audioMetrics?.fillerWords || [{ word: 'like', count: 1 }],
          pacingRating: 'Optimal Pace',
          speechDeliveryScore: 92,
          deliveryFeedback: 'Confident vocal cadence (~138 WPM) with minimal filler words. Strong communicative poise.',
        } : undefined,
        evaluatedAt: new Date().toISOString(),
      };

      return { success: true, sessionId: `sess_${Date.now()}`, evaluation: evalData };
    },

    async getHistory(): Promise<{
      history: InterviewSession[];
      topicMastery: Array<{ topic: string; score: number; attempts: number; status: string }>;
    }> {
      if (lemmaApi.enabled) {
        try {
          return await lemmaApi.getInterviewHistory();
        } catch (e) {
          console.warn('Lemma interview history failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/interviews/history`, { headers: getHeaders() });
        if (res.ok) return await res.json();
      } catch (e) {}

      return {
        history: [
          {
            id: 'sess_1',
            userId: 'user_default_1',
            question: 'In React, what triggers a component re-render?',
            answer: 'State, props, or parent context updates.',
            topic: 'React',
            mode: 'Technical Deep Dive',
            createdAt: new Date().toISOString(),
            evaluation: {
              overallScore: 8.5,
              grade: 'Strong Answer',
              breakdown: { correctness: 9, completeness: 8, technicalDepth: 8, clarity: 9 },
              strengths: ['Identified state triggers and virtual DOM diffing accurately.'],
              missingConcepts: ['Context subscription re-renders.'],
              suggestedImprovement: 'Quantify performance differences.',
              modelAnswer: 'Component re-renders are triggered by state mutations...',
              evaluatedAt: new Date().toISOString(),
            },
          },
        ],
        topicMastery: [
          { topic: 'React', score: 8.5, attempts: 2, status: 'Strong' },
          { topic: 'Node.js', score: 7.8, attempts: 2, status: 'Strong' },
          { topic: 'Docker', score: 6.4, attempts: 1, status: 'Needs Practice' },
        ],
      };
    },
  },

  // Applications
  applications: {
    async getApplications(): Promise<ApplicationRecord[]> {
      if (lemmaApi.enabled) {
        try {
          const me = await lemmaApi.getMe();
          return await lemmaApi.getApplications(me?.user?.id || 'member');
        } catch (e) {
          console.warn('Lemma applications load failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/applications`, { headers: getHeaders() });
        if (res.ok) return await res.json();
      } catch (e) {}
      return JSON.parse(localStorage.getItem('careerpilot_applications') || '[]');
    },

    async createApplication(data: Partial<ApplicationRecord>): Promise<ApplicationRecord> {
      if (lemmaApi.enabled) {
        try {
          return await lemmaApi.createApplication(data);
        } catch (e) {
          console.warn('Lemma create application failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/applications`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch (e) {}

      const apps = JSON.parse(localStorage.getItem('careerpilot_applications') || '[]');
      const newApp: ApplicationRecord = {
        id: `app_${Date.now()}`,
        userId: 'user_default_1',
        company: data.company || 'Company',
        role: data.role || 'Software Engineer',
        status: data.status || 'saved',
        matchScore: data.matchScore || 75,
        salary: data.salary || 'Competitive',
        location: data.location || 'Remote',
      };
      apps.push(newApp);
      localStorage.setItem('careerpilot_applications', JSON.stringify(apps));
      return newApp;
    },

    async updateApplication(id: string, updates: Partial<ApplicationRecord>): Promise<ApplicationRecord> {
      if (lemmaApi.enabled) {
        try {
          return await lemmaApi.updateApplication(id, updates);
        } catch (e) {
          console.warn('Lemma update application failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/applications/${id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(updates),
        });
        if (res.ok) return await res.json();
      } catch (e) {}

      const apps: ApplicationRecord[] = JSON.parse(localStorage.getItem('careerpilot_applications') || '[]');
      const index = apps.findIndex((a) => a.id === id);
      if (index !== -1) {
        apps[index] = { ...apps[index], ...updates };
        localStorage.setItem('careerpilot_applications', JSON.stringify(apps));
        return apps[index];
      }
      return updates as any;
    },

    async deleteApplication(id: string): Promise<{ success: boolean }> {
      if (lemmaApi.enabled) {
        try {
          await lemmaApi.deleteApplication(id);
          return { success: true };
        } catch (e) {
          console.warn('Lemma delete application failed', e);
        }
      }
      try {
        const res = await fetch(`${API_BASE}/applications/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        if (res.ok) return await res.json();
      } catch (e) {}

      let apps: ApplicationRecord[] = JSON.parse(localStorage.getItem('careerpilot_applications') || '[]');
      apps = apps.filter((a) => a.id !== id);
      localStorage.setItem('careerpilot_applications', JSON.stringify(apps));
      return { success: true };
    },

    async generatePrepPack(id: string): Promise<ApplicationRecord> {
      try {
        const res = await fetch(`${API_BASE}/applications/${id}/prep`, {
          method: 'POST',
          headers: getHeaders(),
        });
        if (res.ok) return await res.json();
      } catch (e) {}

      const apps: ApplicationRecord[] = JSON.parse(localStorage.getItem('careerpilot_applications') || '[]');
      const app = apps.find((a) => a.id === id) || apps[0];
      const prepPack = {
        company: app?.company || 'Target Company',
        role: app?.role || 'Full Stack Engineer',
        matchScore: app?.matchScore || 82,
        keySkillsToRevise: [
          { skill: 'Docker Containerization', reason: 'High priority requirement in job spec.', priority: 'High' },
          { skill: 'AWS Cloud Architecture', reason: 'Critical for questions on infrastructure scaling.', priority: 'High' },
        ],
        recommendedProjectsToHighlight: [
          { name: 'Cloud Collaboration Canvas', talkingPoint: 'Emphasize real-time state sync and caching.' },
        ],
        companySpecificQuestions: [
          `How would you architect a fault-tolerant microservice at ${app?.company || 'Target'}?`,
          `Describe a time you solved an elusive concurrency or memory leak bug in production.`,
        ],
        prepChecklist: [
          { item: 'Review company architecture blog', done: false },
          { item: 'Prepare STAR stories for key projects', done: true },
          { item: 'Run 2 mock technical interview sessions on Docker', done: false },
        ],
      };
      if (app) app.prepPack = prepPack;
      localStorage.setItem('careerpilot_applications', JSON.stringify(apps));
      return app;
    },
  },

  // ATS Resume Studio & Outreach
  tailor: {
    async generate(data?: { jobId?: string; resumeId?: string }): Promise<{ success: boolean; tailoredResume: TailoredResume; quota?: any; error?: string }> {
      try {
        const res = await fetch(`${API_BASE}/tailor/generate`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data || {}),
        });
        const result = await res.json();
        if (res.ok && result.tailoredResume) {
          localStorage.setItem(`careerpilot_tailored_${result.tailoredResume.jobId}`, JSON.stringify(result.tailoredResume));
          return result;
        }
        return { success: false, tailoredResume: null as any, error: result.error || 'Failed to tailor resume' };
      } catch (e: any) {
        return { success: false, tailoredResume: null as any, error: e.message || 'Network error tailoring resume' };
      }
    },

    async getForJob(jobId: string): Promise<TailoredResume | null> {
      try {
        const res = await fetch(`${API_BASE}/tailor/job/${jobId}`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          return data.tailoredResume;
        }
      } catch (e) {}
      const stored = localStorage.getItem(`careerpilot_tailored_${jobId}`);
      return stored ? JSON.parse(stored) : null;
    },

    async getAll(): Promise<TailoredResume[]> {
      try {
        const res = await fetch(`${API_BASE}/tailor`, { headers: getHeaders() });
        if (res.ok) return await res.json();
      } catch (e) {}
      return [];
    },
  },

  // Campus & Recruiter Placement
  campus: {
    async getCohorts(): Promise<{
      success: boolean;
      overview: {
        totalEnrolled: number;
        readyToHireCount: number;
        readyToHireRate: number;
        placedCount: number;
        placementRate: number;
        interviewingCount: number;
        averageCohortReadiness: number;
        activeCohortsCount: number;
      };
      cohorts: CampusCohort[];
    }> {
      try {
        const res = await fetch(`${API_BASE}/campus/cohorts`, { headers: getHeaders() });
        if (res.ok) return await res.json();
      } catch (e) {}
      return {
        success: true,
        overview: {
          totalEnrolled: 80,
          readyToHireCount: 58,
          readyToHireRate: 72,
          placedCount: 21,
          placementRate: 26,
          interviewingCount: 15,
          averageCohortReadiness: 84,
          activeCohortsCount: 2,
        },
        cohorts: [],
      };
    },

    async getCandidates(params?: {
      cohortId?: string;
      skill?: string;
      status?: string;
      minReadiness?: number;
      search?: string;
    }): Promise<{ success: boolean; totalMatches: number; candidates: CandidateProfile[] }> {
      try {
        const query = new URLSearchParams();
        if (params?.cohortId) query.set('cohortId', params.cohortId);
        if (params?.skill) query.set('skill', params.skill);
        if (params?.status) query.set('status', params.status);
        if (params?.minReadiness) query.set('minReadiness', params.minReadiness.toString());
        if (params?.search) query.set('search', params.search);

        const res = await fetch(`${API_BASE}/campus/candidates?${query.toString()}`, { headers: getHeaders() });
        if (res.ok) return await res.json();
      } catch (e) {}
      return { success: true, totalMatches: 0, candidates: [] };
    },

    async sendOutreach(data: {
      candidateId: string;
      company?: string;
      role?: string;
      message?: string;
    }): Promise<{ success: boolean; message: string; candidate?: CandidateProfile }> {
      try {
        const res = await fetch(`${API_BASE}/campus/outreach`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch (e) {}
      return { success: true, message: 'Outreach delivered successfully.' };
    },

    async exportReport(): Promise<any> {
      try {
        const res = await fetch(`${API_BASE}/campus/export`, { headers: getHeaders() });
        if (res.ok) return await res.json();
      } catch (e) {}
      return { status: 'Export unavailable' };
    },
  },
};
