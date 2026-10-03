import { runLemmaAgent, extractJsonFromResponse } from '../services/lemma.service.js';

/**
 * AI Interview Coach Agent
 * Generates context-aware technical screening questions based on resume projects and skill gaps,
 * and performs structured 4-pillar answer evaluation using Lemma Cloud AI Agents.
 */

export async function generateInterviewQuestion({
  targetRole = 'Software Engineer',
  focusTopic = '',
  mode = 'Technical Deep Dive',
  skillGaps = [],
  projects = [],
  previousHistory = [],
}) {
  const primaryTopic = focusTopic || (skillGaps.length > 0 ? (skillGaps[0].name || skillGaps[0]) : 'Distributed Systems & Architecture');

  // 1. Try real Lemma AI Agent question generation
  try {
    const systemPrompt = `You are the CareerPilot AI Technical Interview Coach.
Generate a realistic, deep-dive interview question tailored to the candidate's target role, focus topic, and past project experience.
CRITICAL RULES:
1. Craft an authentic, production-relevant question that tests real architectural understanding, failure modes, and trade-offs.
2. If candidate projects are provided, reference realistic scenarios aligned with their tech stack.
3. Return ONLY valid JSON with no markdown wrapping.

Schema:
{
  "question": "The interview question text",
  "topic": "${primaryTopic}",
  "difficulty": "Medium | Hard",
  "hint": "Constructive guidance for how to structure a senior-level answer",
  "expectedKeyPoints": [
    "Key architectural concept 1",
    "Key trade-off or failure scenario 2",
    "Best practice or implementation detail 3"
  ]
}`;

    const prompt = `Generate a technical interview question for:
Target Role: ${targetRole}
Interview Mode: ${mode}
Focus Topic / Gap: ${primaryTopic}
Candidate Projects: ${JSON.stringify(projects.slice(0, 3))}
Recent Question Topics to Avoid Repeating: ${JSON.stringify(previousHistory.slice(-3).map((h) => h.topic))}`;

    const rawResponse = await runLemmaAgent(prompt, systemPrompt, 'interview-coach');
    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed && parsed.question) {
      return {
        id: `q_${Date.now()}`,
        question: parsed.question,
        topic: parsed.topic || primaryTopic,
        difficulty: parsed.difficulty || 'Medium',
        mode,
        targetRole,
        hint: parsed.hint || 'Focus on architectural trade-offs, real-world constraints, and failure modes.',
        expectedKeyPoints: Array.isArray(parsed.expectedKeyPoints) && parsed.expectedKeyPoints.length > 0
          ? parsed.expectedKeyPoints
          : ['Core mechanism', 'Edge cases & trade-offs', 'Scalability implications'],
        createdAt: new Date().toISOString(),
        generationMethod: 'lemma_agent',
      };
    }
  } catch (err) {
    console.warn('Lemma AI Agent interview question generation encountered an error, falling back to dynamic generator:', err.message);
  }

  // 2. Dynamic Question Fallback
  return dynamicQuestionGenerator(targetRole, primaryTopic, mode, projects);
}

export async function evaluateInterviewAnswer({
  question,
  answer,
  topic = 'General Engineering',
  targetRole = 'Software Engineer',
  isVoiceSession = false,
  audioMetrics = null,
}) {
  const cleanAnswer = (answer || '').trim();
  const voiceTelemetry = isVoiceSession ? computeVoiceTelemetry(cleanAnswer, audioMetrics) : null;

  // 1. Try real Lemma AI Agent evaluation
  try {
    const voiceContext = voiceTelemetry
      ? `\nCandidate delivered this answer via live spoken audio.
Speaking Pace: ${voiceTelemetry.wpm} WPM (${voiceTelemetry.pacingRating})
Filler Word Count: ${voiceTelemetry.fillerWordCount}
Spoken Duration: ${voiceTelemetry.durationSeconds}s`
      : '';

    const systemPrompt = `You are a Senior Staff Engineer evaluating a candidate's technical interview answer.
Evaluate their answer objectively across the 4 core pillars:
1. Technical Depth (0-100): Did they show deep understanding beyond surface keywords?
2. Correctness (0-100): Are the technical assertions accurate without misconceptions?
3. Completeness (0-100): Did they cover trade-offs, failure scenarios, and key mechanisms?
4. Communication Clarity (0-100): Was the explanation structured, clear, and professional?

CRITICAL RULES:
- Provide honest, constructive feedback reflecting what the candidate actually said.
- If the answer is brief or misses critical concepts, explain clearly what was missing.
- Provide a concise Senior Model Answer demonstrating an exemplary response.
- Return ONLY valid JSON with no markdown wrapping.

Schema:
{
  "depthScore": number (0-100),
  "correctnessScore": number (0-100),
  "completenessScore": number (0-100),
  "clarityScore": number (0-100),
  "overallScore": number (0-100),
  "feedback": "2-3 sentences of direct qualitative feedback",
  "strengths": ["Specific points or concepts they explained well"],
  "missingPoints": ["Key concepts, trade-offs, or nuances they missed"],
  "modelAnswer": "An exemplary senior-level model answer to this question"
}`;

    const prompt = `Evaluate this candidate's interview answer:

Target Role: ${targetRole}
Topic: ${topic}${voiceContext}

Question:
${question}

Candidate Answer:
"${cleanAnswer}"`;

    const rawResponse = await runLemmaAgent(prompt, systemPrompt, 'interview-evaluator');
    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed && typeof parsed.overallScore === 'number') {
      const overall = Math.min(100, Math.max(0, Math.round(parsed.overallScore)));
      return {
        overallScore: Math.round(overall / 10 * 10) / 10,
        grade: overall >= 85 ? 'Senior Staff Level' : overall >= 75 ? 'Strong Answer' : overall >= 60 ? 'Competent' : 'Needs Practice',
        breakdown: {
          technicalDepth: Math.min(10, Math.max(1, Math.round((parsed.depthScore || overall) / 10))),
          correctness: Math.min(10, Math.max(1, Math.round((parsed.correctnessScore || overall) / 10))),
          completeness: Math.min(10, Math.max(1, Math.round((parsed.completenessScore || overall) / 10))),
          clarity: Math.min(10, Math.max(1, Math.round((parsed.clarityScore || overall) / 10))),
        },
        pillars: {
          depth: Math.min(100, Math.max(0, Math.round(parsed.depthScore || overall))),
          correctness: Math.min(100, Math.max(0, Math.round(parsed.correctnessScore || overall))),
          completeness: Math.min(100, Math.max(0, Math.round(parsed.completenessScore || overall))),
          clarity: Math.min(100, Math.max(0, Math.round(parsed.clarityScore || overall))),
        },
        feedback: parsed.feedback || 'Good attempt covering core principles.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear intent and technical vocabulary'],
        missingConcepts: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : ['Consider discussing edge cases and scale limits'],
        suggestedImprovement: Array.isArray(parsed.missingPoints) && parsed.missingPoints[0]
          ? `Strengthen focus on: ${parsed.missingPoints[0]}`
          : 'Expand on failure state handling and production latency constraints.',
        modelAnswer: parsed.modelAnswer || 'A comprehensive answer highlights internal mechanisms and operational trade-offs.',
        voiceTelemetry,
        evaluatedAt: new Date().toISOString(),
        evaluationMethod: 'lemma_agent',
      };
    }
  } catch (err) {
    console.warn('Lemma AI Agent interview evaluation encountered an error, falling back to dynamic evaluator:', err.message);
  }

  // 2. Dynamic Evaluator Fallback
  return dynamicAnswerEvaluator(question, cleanAnswer, topic, voiceTelemetry);
}

function computeVoiceTelemetry(answer, audioMetrics) {
  const words = (answer || '').split(/\s+/).filter(Boolean).length;
  const durationSeconds = audioMetrics?.durationSeconds || Math.max(12, Math.round(words / 2.2));
  const wpm = audioMetrics?.wpm || Math.round((words / (durationSeconds / 60)) || 135);

  const fillerList = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'sort of'];
  let fillerCount = 0;
  const detectedFillers = [];

  fillerList.forEach((f) => {
    const reg = new RegExp(`\\b${f}\\b`, 'gi');
    const matches = (answer || '').match(reg);
    if (matches && matches.length > 0) {
      fillerCount += matches.length;
      detectedFillers.push({ word: f, count: matches.length });
    }
  });

  const pacingRating = wpm > 165 ? 'Too Fast' : wpm < 110 ? 'Too Slow' : 'Optimal Pace';
  let speechDeliveryScore = 90;
  if (pacingRating !== 'Optimal Pace') speechDeliveryScore -= 12;
  speechDeliveryScore -= Math.min(25, fillerCount * 4);
  speechDeliveryScore = Math.max(50, Math.min(98, speechDeliveryScore));

  let deliveryFeedback = '';
  if (pacingRating === 'Optimal Pace' && fillerCount <= 2) {
    deliveryFeedback = `Exceptional verbal cadence (~${wpm} WPM) with minimal filler words. Strong conversational presence.`;
  } else if (pacingRating === 'Too Fast') {
    deliveryFeedback = `Your speaking rate (~${wpm} WPM) is rapid. Take deliberate pauses between architectural trade-offs so key points sink in.`;
  } else if (pacingRating === 'Too Slow') {
    deliveryFeedback = `Speaking cadence was slower than average (~${wpm} WPM). Practice condensing architectural explanations to keep interview momentum.`;
  } else {
    deliveryFeedback = `Solid flow. Cutting down filler phrases (${detectedFillers.map((d) => `"${d.word}"`).join(', ') || '"like", "basically"'}) will elevate your executive presence.`;
  }

  return {
    wpm,
    durationSeconds,
    fillerWordCount: fillerCount,
    fillerWords: detectedFillers,
    pacingRating,
    speechDeliveryScore,
    deliveryFeedback,
  };
}

function dynamicQuestionGenerator(targetRole, topic, mode, projects) {
  const pName = projects[0]?.title ? ` In the context of projects like ${projects[0].title},` : '';
  const question = `${pName} How would you design a resilient architecture using ${topic} for a ${targetRole}? Discuss how you would handle network latency, data consistency, and graceful degradation during partial outages.`;

  return {
    id: `q_${Date.now()}`,
    question,
    topic,
    difficulty: 'Medium',
    mode,
    targetRole,
    hint: 'Cover data boundaries, synchronization strategy, and how services recover from intermittent failures.',
    expectedKeyPoints: [
      'Architectural separation of concerns',
      'Handling failure states and retry policies',
      'Performance and latency trade-offs',
    ],
    createdAt: new Date().toISOString(),
    generationMethod: 'dynamic_heuristic',
  };
}

function dynamicAnswerEvaluator(question, answer, topic, voiceTelemetry = null) {
  const words = (answer || '').split(/\s+/).filter(Boolean).length;
  let score100 = Math.min(92, Math.max(45, Math.round(55 + words * 0.4)));
  const score10 = Math.round((score100 / 10) * 10) / 10;

  return {
    overallScore: score10,
    grade: score100 >= 85 ? 'Senior Staff Level' : score100 >= 75 ? 'Strong Answer' : score100 >= 60 ? 'Competent' : 'Needs Practice',
    breakdown: {
      technicalDepth: Math.min(10, Math.max(1, Math.round((score100 + 2) / 10))),
      correctness: Math.min(10, Math.max(1, Math.round(score100 / 10))),
      completeness: Math.min(10, Math.max(1, Math.round((score100 - 5) / 10))),
      clarity: Math.min(10, Math.max(1, Math.round((score100 + 4) / 10))),
    },
    pillars: {
      depth: Math.min(95, score100 + 2),
      correctness: score100,
      completeness: Math.max(40, score100 - 5),
      clarity: Math.min(95, score100 + 4),
    },
    feedback: words > 30
      ? `Solid response covering foundational principles in ${topic}. To achieve top marks, emphasize failure modes and concrete production metrics.`
      : `Answer is on the right track, but needs more depth on architecture, edge cases, and real-world trade-offs.`,
    strengths: ['Identified primary concepts', 'Directly addressed the question prompt'],
    missingConcepts: [
      'Deeper explanation of error recovery mechanisms',
      'Quantitative benchmarks or performance metrics',
    ],
    suggestedImprovement: 'Expand on failure state handling and production latency constraints.',
    modelAnswer: `A senior answer to '${question.slice(0, 80)}...' clearly articulates the technical mechanisms, compares alternative solutions, and explains how to monitor and scale the architecture under heavy production load.`,
    voiceTelemetry,
    evaluatedAt: new Date().toISOString(),
    evaluationMethod: 'dynamic_heuristic',
  };
}
