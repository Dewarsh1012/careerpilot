import express from 'express';
import { db, checkAndIncrementQuota } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { tailorResumeForJob } from '../lemma/tailor.agent.js';

const router = express.Router();

// Generate ATS Tailored Resume & Outreach Pitch
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    let { jobId, resumeId } = req.body;

    // Resolve Job
    let job = null;
    if (jobId) {
      job = await db.jobs.findById(jobId);
    } else if (req.user.activeJobId) {
      job = await db.jobs.findById(req.user.activeJobId);
    }
    if (!job) {
      const userJobs = await db.jobs.find({ userId: req.user.id });
      job = userJobs[0];
    }
    if (!job) {
      return res.status(400).json({ error: 'Please select or add a target job first.' });
    }

    // Resolve Resume
    let resume = null;
    if (resumeId) {
      resume = await db.resumes.findById(resumeId);
    } else if (req.user.activeResumeId) {
      resume = await db.resumes.findById(req.user.activeResumeId);
    }
    if (!resume) {
      const userResumes = await db.resumes.find({ userId: req.user.id });
      resume = userResumes[0];
    }
    if (!resume) {
      return res.status(400).json({ error: 'Please upload or select a resume first.' });
    }

    // Check SaaS quota
    const quotaCheck = await checkAndIncrementQuota(req.user.id, 'tailoredResumes');
    if (!quotaCheck.allowed) {
      return res.status(403).json({ error: quotaCheck.reason, quota: quotaCheck.quota });
    }

    // Run Tailor Agent
    const tailoredData = await tailorResumeForJob(resume.analysis, job.analysis);

    // Save Tailored Resume Document
    const tailoredRecord = await db.tailoredResumes.create({
      userId: req.user.id,
      resumeId: resume.id,
      jobId: job.id,
      jobTitle: job.roleTitle,
      company: job.company,
      atsScore: tailoredData.atsScore,
      previousScore: tailoredData.previousScore,
      tailoredSummary: tailoredData.tailoredSummary,
      keywordMatches: tailoredData.keywordMatches,
      tailoredExperience: tailoredData.tailoredExperience,
      tailoredSkills: tailoredData.tailoredSkills,
      coverLetter: tailoredData.coverLetter,
      coldInMail: tailoredData.coldInMail,
      generationMethod: tailoredData.generationMethod,
    });

    res.status(201).json({
      success: true,
      tailoredResume: tailoredRecord,
      quota: quotaCheck.quota,
    });
  } catch (err) {
    console.error('Resume tailoring error:', err);
    res.status(500).json({ error: 'Failed to generate tailored resume' });
  }
});

// Get tailored resume for a specific job
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  try {
    const list = await db.tailoredResumes.find({
      userId: req.user.id,
      jobId: req.params.jobId,
    });
    if (list.length === 0) {
      return res.json({ tailoredResume: null });
    }
    // Return newest
    const sorted = [...list].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json({ tailoredResume: sorted[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve tailored resume' });
  }
});

// Get all tailored resumes for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await db.tailoredResumes.find({ userId: req.user.id });
    const sorted = [...list].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tailored resumes' });
  }
});

export default router;
