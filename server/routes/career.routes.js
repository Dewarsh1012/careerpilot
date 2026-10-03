import express from 'express';
import { db } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { generateCareerPlan } from '../lemma/career.agent.js';
import { matchProfileToJob } from '../lemma/matching.agent.js';

const router = express.Router();

// Get active career plan
router.get('/', authMiddleware, async (req, res) => {
  try {
    const plans = await db.careerPlans.find({ userId: req.user.id });
    if (plans.length > 0) {
      return res.json(plans[plans.length - 1]);
    }

    // Auto-generate plan from active match
    let match = await db.matches.findOne({ userId: req.user.id });
    let job = match ? await db.jobs.findById(match.jobId) : null;
    let resume = await db.resumes.findOne({ userId: req.user.id });

    const newPlan = await generateCareerPlan(
      resume?.analysis || {},
      job?.analysis || { roleTitle: 'Full Stack Engineer' },
      match || { missingSkills: [{ name: 'Docker' }, { name: 'AWS' }] }
    );

    const saved = await db.careerPlans.create({
      ...newPlan,
      userId: req.user.id,
    });

    res.json(saved);
  } catch (err) {
    console.error('Career plan error:', err);
    res.status(500).json({ error: 'Failed to retrieve career plan' });
  }
});

// Generate fresh plan
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.body;
    const targetJob = jobId ? await db.jobs.findById(jobId) : (await db.jobs.find({ userId: req.user.id }))[0];
    const resume = await db.resumes.findOne({ userId: req.user.id });
    const match = await db.matches.findOne({ userId: req.user.id });

    const newPlan = await generateCareerPlan(
      resume?.analysis || {},
      targetJob?.analysis || targetJob,
      match || {}
    );

    const saved = await db.careerPlans.create({
      ...newPlan,
      userId: req.user.id,
    });

    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate career plan' });
  }
});

// Toggle task status
router.patch('/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body; // 'completed' | 'in_progress' | 'todo'

    const plans = await db.careerPlans.find({ userId: req.user.id });
    if (plans.length === 0) return res.status(404).json({ error: 'No career plan found' });

    const plan = plans[plans.length - 1];
    let taskFound = false;
    let completedSkill = null;

    plan.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        if (task.id === taskId) {
          task.status = status;
          taskFound = true;
          if (status === 'completed') {
            task.completedAt = new Date().toISOString();
            completedSkill = task.skill;
          }
        }
      });
    });

    if (!taskFound) {
      return res.status(404).json({ error: 'Task not found in active career plan' });
    }

    // Recalculate progress
    let total = 0;
    let completed = 0;
    plan.phases.forEach((p) => {
      p.tasks.forEach((t) => {
        total++;
        if (t.status === 'completed') completed++;
      });
    });

    plan.totalTasks = total;
    plan.completedTasks = completed;
    plan.progressPercent = Math.round((completed / total) * 100);

    const updated = await db.careerPlans.findByIdAndUpdate(plan.id, plan);

    // If a skill was completed, increment careerReadiness
    if (completedSkill) {
      const currentReadiness = req.user.careerReadiness || 78;
      const newReadiness = Math.min(96, currentReadiness + 3);
      await db.users.findByIdAndUpdate(req.user.id, {
        careerReadiness: newReadiness,
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('Task update error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Re-Analyze Readiness (PRD section 18 & 24)
router.post('/reanalyze', authMiddleware, async (req, res) => {
  try {
    const plans = await db.careerPlans.find({ userId: req.user.id });
    const plan = plans[plans.length - 1];
    const resume = await db.resumes.findOne({ userId: req.user.id });
    const job = await db.jobs.findOne({ userId: req.user.id });

    // Gather completed skills
    const completedSkills = [];
    if (plan) {
      plan.phases.forEach((p) => {
        p.tasks.forEach((t) => {
          if (t.status === 'completed' && t.skill) completedSkills.push(t.skill);
        });
      });
    }

    const currentSkills = new Set([...(resume?.analysis?.skills || []), ...completedSkills]);
    const updatedProfile = {
      ...(resume?.analysis || {}),
      skills: Array.from(currentSkills),
    };

    const newMatch = await matchProfileToJob(updatedProfile, job?.analysis || job);

    // Boost score reflecting demonstrated progress
    newMatch.matchScore = Math.min(95, newMatch.matchScore + 8);
    newMatch.readinessLevel = newMatch.matchScore >= 80 ? 'Interview Ready' : 'Needs Target Prep';

    const savedMatch = await db.matches.create({
      userId: req.user.id,
      jobId: job?.id,
      jobTitle: job?.roleTitle,
      company: job?.company,
      matchScore: newMatch.matchScore,
      matchedSkills: newMatch.matchedSkills,
      partialSkills: newMatch.partialSkills,
      missingSkills: newMatch.missingSkills,
      readinessLevel: newMatch.readinessLevel,
      nextMove: newMatch.nextMove,
    });

    await db.users.findByIdAndUpdate(req.user.id, {
      careerReadiness: newMatch.matchScore,
      activeMatchId: savedMatch.id,
    });

    res.json({
      success: true,
      newScore: newMatch.matchScore,
      match: savedMatch,
      message: 'Readiness re-evaluated! Your progress has updated your career profile.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Re-analysis failed' });
  }
});

export default router;
