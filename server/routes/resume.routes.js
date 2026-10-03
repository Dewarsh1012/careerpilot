import express from 'express';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { db, checkAndIncrementQuota } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { analyzeResume } from '../lemma/resume.agent.js';

const router = express.Router();

// Upload and analyze resume
router.post('/upload', authMiddleware, upload.single('resume'), async (req, res) => {
  let filePath = null;
  try {
    // Check SaaS quota
    const quotaCheck = await checkAndIncrementQuota(req.user.id, 'resumeAnalyses');
    if (!quotaCheck.allowed) {
      return res.status(403).json({ error: quotaCheck.reason, quota: quotaCheck.quota });
    }

    let extractedText = '';
    let fileName = 'Uploaded Resume.txt';

    if (req.file) {
      fileName = req.file.originalname;
      filePath = req.file.path;
      const ext = path.extname(fileName).toLowerCase();
      console.log(`[Resume Upload] Processing file: ${fileName} (${ext}) at ${filePath}`);

      if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        extractedText = pdfData.text || '';
      } else if (ext === '.docx' || ext === '.doc') {
        const docxResult = await mammoth.extractRawText({ path: filePath });
        extractedText = docxResult.value || '';
      } else {
        extractedText = fs.readFileSync(filePath, 'utf-8');
      }
    } else if (req.body.resumeText) {
      extractedText = req.body.resumeText;
      fileName = req.body.fileName || 'Pasted Resume.txt';
      console.log(`[Resume Upload] Processing pasted text (${extractedText.length} chars)`);
    } else {
      return res.status(400).json({ error: 'No resume file or text provided' });
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(400).json({
        error: 'Could not extract readable text from the uploaded file. Please ensure the document is not an image-only scan or try pasting the text directly.'
      });
    }

    console.log(`[Resume Upload] Extracted ${extractedText.length} characters of raw text. Running Lemma Resume Agent...`);

    // Run Lemma Resume Agent
    const analysis = await analyzeResume(extractedText, req.user.targetRole);
    console.log(`[Resume Upload] Analysis complete for: ${analysis.candidateName} with ${analysis.skills?.length || 0} skills`);

    // Save Resume Record
    const resumeRecord = await db.resumes.create({
      userId: req.user.id,
      fileName,
      extractedText,
      analysis,
      processingStatus: 'completed',
    });

    // Update user profile skills and name from genuine extraction
    const candidateName = analysis.candidateName && analysis.candidateName !== 'Candidate'
      ? analysis.candidateName
      : req.user.name;

    const dynamicReadiness = Math.min(95, Math.max(55, Math.round(50 + (analysis.skills?.length || 0) * 2.5)));

    await db.users.findByIdAndUpdate(req.user.id, {
      resumeId: resumeRecord.id,
      activeResumeId: resumeRecord.id,
      name: candidateName,
      email: analysis.email || req.user.email,
      phone: analysis.phone || req.user.phone,
      location: analysis.location || req.user.location,
      summary: analysis.summary || req.user.summary,
      currentRole: analysis.currentRole || req.user.currentRole,
      verifiedSkills: analysis.skills || [],
      projects: analysis.projects || [],
      experience: analysis.experience || [],
      education: analysis.education || [],
      strengths: analysis.strengths || [],
      growthAreas: analysis.growthAreas || [],
      careerReadiness: dynamicReadiness,
      onboarded: true,
    });

    // Auto-compute skill gap match against active target job if available
    let autoMatch = null;
    let targetJob = null;
    try {
      const userJobs = await db.jobs.find({ userId: req.user.id });
      targetJob = req.user.activeJobId
        ? await db.jobs.findById(req.user.activeJobId)
        : (userJobs.length > 0 ? userJobs[0] : null);

      if (targetJob) {
        const { matchProfileToJob } = await import('../lemma/matching.agent.js');
        const matchResult = await matchProfileToJob(analysis, targetJob.analysis || targetJob);
        autoMatch = await db.matches.create({
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

        await db.users.findByIdAndUpdate(req.user.id, {
          activeMatchId: autoMatch.id,
          activeJobId: targetJob.id,
          careerReadiness: matchResult.matchScore,
        });
      }
    } catch (matchErr) {
      console.warn('[Resume Upload] Auto match computation non-fatal warning:', matchErr.message);
    }

    const freshUser = await db.users.findById(req.user.id);

    res.json({
      success: true,
      resume: resumeRecord,
      analysis,
      match: autoMatch,
      job: targetJob,
      quota: quotaCheck.quota,
      user: freshUser || {
        id: req.user.id,
        name: candidateName,
        careerReadiness: autoMatch ? autoMatch.matchScore : dynamicReadiness,
      },
    });
  } catch (err) {
    console.error('Resume processing error:', err);
    res.status(500).json({ error: 'Failed to parse and analyze resume' });
  }
});

// Get user resumes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const resumes = await db.resumes.find({ userId: req.user.id });
    if (resumes.length === 0) {
      return res.json([]);
    }
    // Return newest first so index 0 is always the latest uploaded resume
    const sorted = [...resumes].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// Switch active resume track
router.patch('/:id/active', authMiddleware, async (req, res) => {
  try {
    const resume = await db.resumes.findById(req.params.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    await db.users.findByIdAndUpdate(req.user.id, {
      activeResumeId: resume.id,
      resumeId: resume.id,
      verifiedSkills: resume.analysis?.skills || [],
      projects: resume.analysis?.projects || [],
    });

    res.json({ success: true, activeResumeId: resume.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to switch active resume' });
  }
});

// Delete resume track
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const resume = await db.resumes.findById(req.params.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    await db.resumes.findByIdAndDelete(req.params.id);

    const user = await db.users.findById(req.user.id);
    if (user?.activeResumeId === req.params.id || user?.resumeId === req.params.id) {
      await db.users.findByIdAndUpdate(req.user.id, { activeResumeId: null, resumeId: null });
    }

    res.json({ success: true, message: 'Resume track deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// Load sample resume for instant testing
router.post('/sample', authMiddleware, async (req, res) => {
  try {
    const { sampleType = 'fullstack' } = req.body;
    let sampleText = '';
    let fileName = '';

    if (sampleType === 'frontend') {
      fileName = 'Sample_Frontend_Engineer.pdf';
      sampleText = `Alex Rivera - Senior Frontend Engineer
Specialized in React, Next.js, TypeScript, Tailwind CSS, Redux Toolkit, and GraphQL.
Led frontend migration to Next.js 14 App Router, cutting LCP by 45%. Built reusable component library.`;
    } else if (sampleType === 'backend') {
      fileName = 'Sample_Backend_Engineer.pdf';
      sampleText = `Jordan Lee - Backend Systems Engineer
Skills: Node.js, Python, Express, FastAPI, PostgreSQL, Redis, Kafka, System Design, REST APIs.
Engineered real-time transaction processing microservices handling 12,000 requests/sec.`;
    } else {
      fileName = 'Archi_Jain_FullStack_Resume.pdf';
      sampleText = `Archi Jain
Full Stack Developer | archi@careerpilot.io
Experienced in React, TypeScript, Node.js, Express, MongoDB, PostgreSQL, Git, REST APIs.
Projects:
- Cloud Workspace Hub: React 18, Node.js, WebSocket collaboration, MongoDB.
- Microservices E-Commerce: Express, JWT auth, Stripe integration, PostgreSQL.
Education: B.S. in Computer Science (2024)`;
    }

    const analysis = await analyzeResume(sampleText, req.user.targetRole);
    const resumeRecord = await db.resumes.create({
      userId: req.user.id,
      fileName,
      extractedText: sampleText,
      analysis,
      processingStatus: 'completed',
    });

    const candidateName = analysis.candidateName && analysis.candidateName !== 'Candidate'
      ? analysis.candidateName
      : (req.user.name || 'Archi Jain');

    await db.users.findByIdAndUpdate(req.user.id, {
      resumeId: resumeRecord.id,
      activeResumeId: resumeRecord.id,
      name: candidateName,
      email: analysis.email || req.user.email,
      phone: analysis.phone || req.user.phone,
      location: analysis.location || req.user.location,
      summary: analysis.summary || req.user.summary,
      currentRole: analysis.currentRole || req.user.currentRole,
      verifiedSkills: analysis.skills || [],
      projects: analysis.projects || [],
      experience: analysis.experience || [],
      education: analysis.education || [],
      strengths: analysis.strengths || [],
      growthAreas: analysis.growthAreas || [],
      careerReadiness: 78,
      onboarded: true,
    });

    const freshUser = await db.users.findById(req.user.id);

    res.json({ success: true, resume: resumeRecord, analysis, user: freshUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load sample resume' });
  }
});

export default router;
