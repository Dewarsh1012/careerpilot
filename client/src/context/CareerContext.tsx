import React, { createContext, useContext, useState, useEffect } from 'react';
import { JobRecord, MatchRecord, CareerPlanRecord, ResumeRecord, UserQuota, PlanTier } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

interface CareerContextType {
  activeJob: JobRecord | null;
  activeResume: ResumeRecord | null;
  allJobs: JobRecord[];
  allResumes: ResumeRecord[];
  activeMatch: MatchRecord | null;
  careerPlan: CareerPlanRecord | null;
  readinessScore: number;
  readinessMoment: string;
  loading: boolean;
  quota: UserQuota | null;
  plan: PlanTier;
  /** Computed flow-state flags */
  hasResume: boolean;
  hasJob: boolean;
  hasMatch: boolean;
  hasCareerPlan: boolean;
  /** The tab a fresh sign-in should land on */
  initialTab: string;
  refreshCareer: () => Promise<void>;
  refreshQuota: () => Promise<void>;
  switchTier: (tier: PlanTier) => Promise<void>;
  selectJobAndMatch: (jobId: string) => Promise<void>;
  scrapeAndSelectJob: (url: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  setActiveResumeTrack: (resumeId: string) => Promise<void>;
  toggleTask: (taskId: string, currentStatus: string) => Promise<void>;
  reanalyzeReadiness: () => Promise<string>;
}

const CareerContext = createContext<CareerContextType | undefined>(undefined);

export const CareerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeJob, setActiveJob] = useState<JobRecord | null>(null);
  const [activeResume, setActiveResume] = useState<ResumeRecord | null>(null);
  const [allJobs, setAllJobs] = useState<JobRecord[]>([]);
  const [allResumes, setAllResumes] = useState<ResumeRecord[]>([]);
  const [activeMatch, setActiveMatch] = useState<MatchRecord | null>(null);
  const [careerPlan, setCareerPlan] = useState<CareerPlanRecord | null>(null);
  const [readinessScore, setReadinessScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [plan, setPlan] = useState<PlanTier>('pro');

  const refreshQuota = async () => {
    try {
      const qRes = await api.auth.getQuota();
      if (qRes?.quota) {
        setQuota(qRes.quota);
        setPlan(qRes.plan || 'pro');
      }
    } catch (e) {
      console.warn('Could not refresh quotas:', e);
    }
  };

  const refreshCareer = async () => {
    try {
      setLoading(true);
      const [matchRes, planRes, jobsList, resumesList] = await Promise.all([
        api.match.getActiveMatch(),
        api.career.getCareerPlan(),
        api.jobs.getJobs(),
        api.resume.getResumes(),
      ]);

      const validResumes = resumesList || [];
      const validJobs = jobsList || [];

      setAllJobs(validJobs);
      setAllResumes(validResumes);

      if (validResumes.length > 0) {
        const me = await api.auth.getMe().catch(() => null);
        const preferredId = me?.user?.activeResumeId;
        const picked =
          (preferredId && validResumes.find((r) => r.id === preferredId)) || validResumes[0];
        setActiveResume(picked);
      } else {
        setActiveResume(null);
      }

      if (matchRes?.match) {
        setActiveMatch(matchRes.match);
        setReadinessScore(matchRes.match.matchScore || 0);
      } else {
        setActiveMatch(null);
        setReadinessScore(0);
      }

      if (matchRes?.job) {
        setActiveJob(matchRes.job);
      } else if (validJobs.length > 0) {
        setActiveJob(validJobs[0]);
      } else {
        setActiveJob(null);
      }

      if (planRes && planRes.id) {
        setCareerPlan(planRes);
      } else {
        setCareerPlan(null);
      }

      await refreshQuota();
    } catch (err) {
      console.error('Failed to load career context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCareer();
  }, [user?.id]);

  const switchTier = async (newTier: PlanTier) => {
    try {
      const res = await api.auth.switchTier(newTier);
      if (res?.success === false) {
        return;
      }
      const nextPlan = (res?.plan as PlanTier | undefined) ?? newTier;
      if (res?.quota) {
        setQuota(res.quota);
      }
      setPlan(nextPlan);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#62A7FF', '#16A34A', '#62A7FF'],
      });
    } catch (e) {
      console.error('Failed to switch tier:', e);
    }
  };

  const selectJobAndMatch = async (jobId: string) => {
    setLoading(true);
    try {
      const matchRes = await api.match.runMatch(jobId);
      if (matchRes.match) {
        setActiveMatch(matchRes.match);
        setReadinessScore(matchRes.match.matchScore);
      }
      if (matchRes.job) {
        setActiveJob(matchRes.job);
      }
      let planRes: any = null;
      try {
        planRes = await api.career.generatePlan(jobId);
      } catch (planErr) {
        planRes = await api.career.getCareerPlan();
      }
      if (planRes?.id) {
        setCareerPlan(planRes);
      }
      await refreshQuota();
    } finally {
      setLoading(false);
    }
  };

  const scrapeAndSelectJob = async (url: string) => {
    setLoading(true);
    try {
      const scrapeRes = await api.jobs.scrapeJob(url);
      if (scrapeRes.job) {
        setAllJobs((prev) => [scrapeRes.job, ...prev]);

        // Auto-create in Job Tracker
        await api.applications.createApplication({
          company: scrapeRes.job.company,
          role: scrapeRes.job.roleTitle,
          status: 'saved',
          location: scrapeRes.job.location || 'Remote',
          salary: '$135k - $175k',
          matchScore: 82,
          notes: `Imported via URL: ${url}`,
        }).catch(() => undefined);

        await selectJobAndMatch(scrapeRes.job.id);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#62A7FF', '#16A34A'],
        });
        return { success: true, message: scrapeRes.message };
      }
      return { success: false, error: scrapeRes.error || 'Failed to scrape job' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Scraping failed' };
    } finally {
      setLoading(false);
    }
  };

  const setActiveResumeTrack = async (resumeId: string) => {
    try {
      await api.resume.setActive(resumeId);
      const match = allResumes.find((r) => r.id === resumeId);
      if (match) setActiveResume(match);
      if (activeJob) {
        await selectJobAndMatch(activeJob.id);
      }
    } catch (e) {
      console.error('Failed to set active resume:', e);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    const updatedPlan = await api.career.updateTaskStatus(taskId, nextStatus);
    setCareerPlan(updatedPlan);

    if (nextStatus === 'completed') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#62A7FF', '#16A34A', '#62A7FF'],
      });
      setReadinessScore((prev) => Math.min(96, prev + 3));
    }
  };

  const reanalyzeReadiness = async (): Promise<string> => {
    const res = await api.career.reanalyzeReadiness();
    if (res.success) {
      setReadinessScore(res.newScore);
      setActiveMatch(res.match);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#62A7FF', '#16A34A', '#FFD700'],
      });
      return res.message;
    }
    return 'Readiness updated.';
  };

  // --- Computed flow-state flags ---
  const hasResume = allResumes.length > 0;
  const hasJob = allJobs.length > 0;
  const hasMatch = activeMatch !== null && activeMatch.matchScore > 0;
  const hasCareerPlanFlag = careerPlan !== null && Boolean(careerPlan.id);

  // Flow starts directly on resume intelligence after sign in
  const initialTab = 'resume';

  // Readiness moment text
  const readinessMoment = hasMatch
    ? readinessScore >= 80
      ? 'strong'
      : readinessScore >= 50
        ? 'building'
        : 'early'
    : 'none';

  return (
    <CareerContext.Provider
      value={{
        activeJob,
        activeResume,
        allJobs,
        allResumes,
        activeMatch,
        careerPlan,
        readinessScore,
        readinessMoment,
        loading,
        quota,
        plan,
        hasResume,
        hasJob,
        hasMatch,
        hasCareerPlan: hasCareerPlanFlag,
        initialTab,
        refreshCareer,
        refreshQuota,
        switchTier,
        selectJobAndMatch,
        scrapeAndSelectJob,
        setActiveResumeTrack,
        toggleTask,
        reanalyzeReadiness,
      }}
    >
      {children}
    </CareerContext.Provider>
  );
};

export function useCareer() {
  const context = useContext(CareerContext);
  if (!context) throw new Error('useCareer must be used within CareerProvider');
  return context;
}
