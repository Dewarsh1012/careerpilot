import express from 'express';
import { db } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { matchProfileToJob } from '../lemma/matching.agent.js';

const router = express.Router();

// Match resume profile to a job
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.body;
    let targetJob = null;

    if (jobId) {
      targetJob = await db.jobs.findById(jobId);
    }
    if (!targetJob) {
      const userJobs = await db.jobs.find({ userId: req.user.id });
      targetJob = userJobs[0];
    }
    if (!targetJob) {
      return res.status(404).json({ error: 'No job found to match against. Please create or select a job.' });
    }

    // Get user resume - prefer active resume if set, else latest
    const resumes = await db.resumes.find({ userId: req.user.id });
    const userResume = req.user.activeResumeId
      ? resumes.find((r) => r.id === req.user.activeResumeId) || resumes[resumes.length - 1]
      : resumes[resumes.length - 1];

    const profile = userResume?.analysis || {
      candidateName: req.user.name,
      currentRole: req.user.currentRole,
      skills: req.user.verifiedSkills || ['React', 'JavaScript', 'Node.js', 'PostgreSQL', 'Git'],
      projects: req.user.projects || [],
      experience: req.user.experience || [],
    };

    // Run Lemma Matching Agent
    const matchResult = await matchProfileToJob(profile, targetJob.analysis || targetJob);

    // Save match in DB
    const savedMatch = await db.matches.create({
      userId: req.user.id,
      jobId: targetJob.id,
      jobTitle: targetJob.roleTitle,
      company: targetJob.company,
      matchScore: matchResult.matchScore,
      matchedSkills: matchResult.matchedSkills,
      partialSkills: matchResult.partialSkills,
      missingSkills: matchResult.missingSkills,
      readinessLevel: matchResult.readinessLevel,
      nextMove: matchResult.nextMove,
    });

    // Update user active match and readiness
    await db.users.findByIdAndUpdate(req.user.id, {
      activeMatchId: savedMatch.id,
      activeJobId: targetJob.id,
      careerReadiness: matchResult.matchScore,
    });

    res.json({
      success: true,
      match: savedMatch,
      job: targetJob,
    });
  } catch (err) {
    console.error('Matching error:', err);
    res.status(500).json({ error: 'Failed to compute job match' });
  }
});

// Get current active match
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const matches = await db.matches.find({ userId: req.user.id });
    if (matches.length > 0) {
      const latestMatch = matches[matches.length - 1];
      const job = await db.jobs.findById(latestMatch.jobId);
      return res.json({ match: latestMatch, job });
    }

    // Fallback: auto-trigger default match
    const jobs = await db.jobs.find({ userId: req.user.id });
    if (jobs.length > 0) {
      const targetJob = (req.user.activeJobId && jobs.find((j) => j.id === req.user.activeJobId)) || jobs[0];
      const resumes = await db.resumes.find({ userId: req.user.id });
      const userResume = req.user.activeResumeId
        ? resumes.find((r) => r.id === req.user.activeResumeId) || resumes[resumes.length - 1]
        : resumes[resumes.length - 1];

      const profile = userResume?.analysis || {
        candidateName: req.user.name,
        currentRole: req.user.currentRole,
        skills: req.user.verifiedSkills || ['React', 'JavaScript', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git'],
        projects: req.user.projects || [],
        experience: req.user.experience || [],
      };
      const matchResult = await matchProfileToJob(profile, targetJob.analysis || targetJob);
      const savedMatch = await db.matches.create({
        userId: req.user.id,
        jobId: targetJob.id,
        jobTitle: targetJob.roleTitle,
        company: targetJob.company,
        matchScore: matchResult.matchScore,
        matchedSkills: matchResult.matchedSkills,
        partialSkills: matchResult.partialSkills,
        missingSkills: matchResult.missingSkills,
        readinessLevel: matchResult.readinessLevel,
        nextMove: matchResult.nextMove,
      });
      return res.json({ match: savedMatch, job: targetJob });
    }

    res.json({ match: null, job: null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

export default router;
