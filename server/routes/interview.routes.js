import express from 'express';
import { db, checkAndIncrementQuota } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { generateInterviewQuestion, evaluateInterviewAnswer } from '../lemma/interview.agent.js';

const router = express.Router();

// Start new question session
router.post('/question', authMiddleware, async (req, res) => {
  try {
    const { focusTopic, mode } = req.body;
    const match = await db.matches.findOne({ userId: req.user.id });
    const resume = await db.resumes.findOne({ userId: req.user.id });
    const history = await db.interviewSessions.find({ userId: req.user.id });

    const skillGaps = (match?.missingSkills || []).map((s) => s.name);
    const projects = resume?.analysis?.projects || [];

    const questionData = await generateInterviewQuestion({
      targetRole: req.user.targetRole || 'Full Stack Developer',
      focusTopic,
      mode: mode || 'Technical Deep Dive',
      skillGaps,
      projects,
      previousHistory: history,
    });

    res.json(questionData);
  } catch (err) {
    console.error('Question generation error:', err);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

// Submit answer and evaluate
router.post('/evaluate', authMiddleware, async (req, res) => {
  try {
    const { question, answer, topic, mode, isVoiceSession, audioMetrics } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    // Check SaaS quota
    const quotaKey = isVoiceSession ? 'voiceInterviews' : 'interviewSessions';
    const quotaCheck = await checkAndIncrementQuota(req.user.id, quotaKey);
    if (!quotaCheck.allowed) {
      return res.status(403).json({ error: quotaCheck.reason, quota: quotaCheck.quota });
    }

    const evaluation = await evaluateInterviewAnswer({
      question,
      answer,
      topic: topic || 'General Engineering',
      targetRole: req.user.targetRole || 'Full Stack Developer',
      isVoiceSession: Boolean(isVoiceSession),
      audioMetrics: audioMetrics || null,
    });

    const sessionRecord = await db.interviewSessions.create({
      userId: req.user.id,
      question,
      answer,
      topic: topic || 'Engineering',
      mode: mode || (isVoiceSession ? 'Voice AI Interview' : 'Technical Deep Dive'),
      isVoiceSession: Boolean(isVoiceSession),
      voiceTelemetry: evaluation.voiceTelemetry || null,
      evaluation,
    });

    res.json({
      success: true,
      sessionId: sessionRecord.id,
      evaluation,
      quota: quotaCheck.quota,
    });
  } catch (err) {
    console.error('Answer evaluation error:', err);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// Get interview history and topic mastery
router.get('/history', authMiddleware, async (req, res) => {
  try {
    let history = await db.interviewSessions.find({ userId: req.user.id });

    // Seed default historical sessions if empty
    if (history.length === 0) {
      const defaultSessions = [
        {
          userId: req.user.id,
          question: 'In React, what triggers a component re-render and how does the reconciliation algorithm work?',
          answer: 'State and prop changes trigger re-renders. React uses the virtual DOM to compute diffs using element keys.',
          topic: 'React',
          mode: 'Technical Deep Dive',
          evaluation: {
            overallScore: 8.5,
            grade: 'Strong Answer',
            breakdown: { correctness: 9, completeness: 8, technicalDepth: 8, clarity: 9 },
            strengths: ['Identified virtual DOM diffing and state trigger mechanisms accurately.'],
            missingConcepts: ['Could mention context subscription re-renders and batching.'],
            modelAnswer: 'Component re-renders are triggered by state mutations, prop updates, or context changes...',
            evaluatedAt: new Date(Date.now() - 86400000).toISOString(),
          },
        },
        {
          userId: req.user.id,
          question: 'How do you structure database queries in Node.js to avoid connection exhaustion under load?',
          answer: 'We use a connection pool in PostgreSQL/pg or Mongoose and ensure client.release() or pooled query execution.',
          topic: 'Node.js',
          mode: 'Technical Deep Dive',
          evaluation: {
            overallScore: 7.8,
            grade: 'Strong Answer',
            breakdown: { correctness: 8, completeness: 8, technicalDepth: 7, clarity: 8 },
            strengths: ['Addressed connection pool management and client release patterns.'],
            missingConcepts: ['Mentioning statement timeouts, max pool size sizing formula, and queue wait timeouts.'],
            modelAnswer: 'Connection pools manage a fixed set of open sockets...',
            evaluatedAt: new Date(Date.now() - 43200000).toISOString(),
          },
        },
      ];

      for (const s of defaultSessions) {
        await db.interviewSessions.create(s);
      }
      history = await db.interviewSessions.find({ userId: req.user.id });
    }

    // Compute topic mastery
    const topicStats = {};
    history.forEach((h) => {
      const t = h.topic || 'General';
      if (!topicStats[t]) topicStats[t] = { total: 0, count: 0 };
      topicStats[t].total += h.evaluation?.overallScore || 7;
      topicStats[t].count += 1;
    });

    const topicMastery = Object.keys(topicStats).map((topic) => ({
      topic,
      score: Math.round((topicStats[topic].total / topicStats[topic].count) * 10) / 10,
      attempts: topicStats[topic].count,
      status: (topicStats[topic].total / topicStats[topic].count) >= 8 ? 'Strong' : 'Needs Practice',
    }));

    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.createdAt || b.evaluation?.evaluatedAt || 0).getTime() - new Date(a.createdAt || a.evaluation?.evaluatedAt || 0).getTime()
    );

    res.json({ history: sortedHistory, topicMastery });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve interview history' });
  }
});

export default router;
