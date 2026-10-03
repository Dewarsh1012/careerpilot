import express from 'express';
import { db } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { generateApplicationPrep } from '../lemma/application.agent.js';

const router = express.Router();

// List applications
router.get('/', authMiddleware, async (req, res) => {
  try {
    let apps = await db.applications.find({ userId: req.user.id });
    if (apps.length === 0) {
      // Seed default real-world applications
      const sampleApps = [
        {
          userId: req.user.id,
          company: 'Stripe',
          role: 'Full Stack Engineer',
          status: 'interview', // saved, applied, interview, offer, rejected
          matchScore: 82,
          appliedDate: '2026-09-15',
          interviewDate: '2026-10-04',
          salary: '$140k - $175k',
          location: 'San Francisco, CA / Hybrid',
          notes: 'Completed technical screen. Next round is system design and coding deep-dive.',
          prepPack: null,
        },
        {
          userId: req.user.id,
          company: 'Vercel',
          role: 'Frontend Infrastructure Engineer',
          status: 'applied',
          matchScore: 88,
          appliedDate: '2026-09-22',
          salary: '$150k - $185k',
          location: 'Remote',
          notes: 'Referral submitted via engineering alum.',
          prepPack: null,
        },
        {
          userId: req.user.id,
          company: 'Datadog',
          role: 'Cloud Platform Engineer',
          status: 'saved',
          matchScore: 74,
          appliedDate: null,
          salary: '$145k - $180k',
          location: 'New York, NY',
          notes: 'Targeting after completing Docker and AWS career plan milestones.',
          prepPack: null,
        },
      ];

      for (const a of sampleApps) {
        await db.applications.create(a);
      }
      apps = await db.applications.find({ userId: req.user.id });
    }
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Create application
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { company, role, status = 'saved', matchScore = 75, salary, location, notes, interviewDate } = req.body;
    if (!company || !role) {
      return res.status(400).json({ error: 'Company and role are required' });
    }

    const newApp = await db.applications.create({
      userId: req.user.id,
      company,
      role,
      status,
      matchScore: Number(matchScore) || 75,
      salary: salary || 'Competitive',
      location: location || 'Remote',
      notes: notes || '',
      appliedDate: status !== 'saved' ? new Date().toISOString().split('T')[0] : null,
      interviewDate: interviewDate || null,
      prepPack: null,
    });

    res.status(201).json(newApp);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update application (e.g. drag-and-drop status or notes)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await db.applications.findByIdAndUpdate(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Application not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete application
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await db.applications.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Application not found' });
    res.json({ success: true, message: 'Application deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Generate company-specific preparation pack
router.post('/:id/prep', authMiddleware, async (req, res) => {
  try {
    const app = await db.applications.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const match = await db.matches.findOne({ userId: req.user.id });
    const resume = await db.resumes.findOne({ userId: req.user.id });

    const prepPack = await generateApplicationPrep({
      company: app.company,
      role: app.role,
      matchScore: app.matchScore,
      missingSkills: match?.missingSkills || [{ name: 'Docker' }, { name: 'AWS' }],
      projects: resume?.analysis?.projects || [],
    });

    const updated = await db.applications.findByIdAndUpdate(app.id, { prepPack });
    res.json(updated);
  } catch (err) {
    console.error('Prep pack error:', err);
    res.status(500).json({ error: 'Failed to generate prep pack' });
  }
});

export default router;
