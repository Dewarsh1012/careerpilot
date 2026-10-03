import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { InterviewSession, InterviewEvaluation } from '../types';
import { useCareer } from '../context/CareerContext';
import { JourneyBar } from '../components/common/JourneyBar';
import { NextMoveCard } from '../components/common/NextMoveCard';
import { useVoiceInterview, AudioMetrics } from '../hooks/useVoiceInterview';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Square,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  HelpCircle,
  Award,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Gauge,
  Zap,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { describeMicEnvironment, isAppEmbedded, openAppInNewTab } from '../utils/micSupport';

interface InterviewPageProps {
  setCurrentTab: (tab: string) => void;
}

export const InterviewPage: React.FC<InterviewPageProps> = ({ setCurrentTab }) => {
  const { activeJob, activeMatch, switchTier, quota, plan, refreshQuota } = useCareer();
  const [interviewMode, setInterviewMode] = useState<'voice' | 'text'>('text');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [focusTopic, setFocusTopic] = useState('Docker');
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [topicMastery, setTopicMastery] = useState<any[]>([]);
  const [lastAudioMetrics, setLastAudioMetrics] = useState<AudioMetrics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(true);

  // Hook for Web Speech STT and TTS
  const {
    isListening,
    isSpeaking,
    transcript,
    durationSeconds,
    audioLevel,
    speechSupported,
    micPermissionGranted,
    speechError,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
  } = useVoiceInterview();

  // Keep answer in sync with speech transcript while listening
  useEffect(() => {
    if (isListening && transcript) {
      setAnswer(transcript);
    }
  }, [isListening, transcript]);

  const missingSkills = (activeMatch?.missingSkills || []).map((s) => s.name);
  const micEnv = describeMicEnvironment();
  const embeddedApp = isAppEmbedded();

  const fetchQuestion = async (topic?: string, speak = autoSpeakQuestion) => {
    stopSpeaking();
    if (isListening) stopListening();

    setLoadingQuestion(true);
    setEvaluation(null);
    setAnswer('');
    setShowHint(false);
    setErrorMessage(null);
    setLastAudioMetrics(null);

    try {
      const q = await api.interview.getQuestion({
        focusTopic: topic || focusTopic,
        mode: interviewMode === 'voice' ? 'Real-Time Voice AI' : 'Technical Deep Dive',
      });
      setCurrentQuestion(q);

      // Auto-speak question in voice mode if enabled
      if (interviewMode === 'voice' && speak && q?.question) {
        setTimeout(() => {
          speakText(q.question);
        }, 300);
      }
    } catch (err: any) {
      console.error('Error fetching question:', err);
      setErrorMessage('Could not generate question. Please try again.');
    } finally {
      setLoadingQuestion(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.interview.getHistory();
      setHistory(res.history || []);
      setTopicMastery(res.topicMastery || []);
    } catch (err) {
      console.error('History load error:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const topic =
      activeMatch?.missingSkills?.[0]?.name ||
      activeMatch?.partialSkills?.[0]?.name ||
      activeJob?.analysis?.requiredSkills?.[0]?.name ||
      'System Design';
    setFocusTopic(topic);
    fetchQuestion(topic, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when active job/match context changes
  }, [activeMatch?.jobId, activeJob?.id]);

  // Handle Voice Record Start/Stop Toggle
  const handleToggleVoiceRecord = async () => {
    stopSpeaking();
    if (isListening) {
      const { finalTranscript, metrics } = stopListening();
      setAnswer(finalTranscript);
      setLastAudioMetrics(metrics);
    } else {
      await startListening();
    }
  };

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    stopSpeaking();

    let finalAnswer = answer.trim();
    let currentMetrics = lastAudioMetrics;

    if (isListening) {
      const result = stopListening();
      finalAnswer = result.finalTranscript.trim();
      currentMetrics = result.metrics;
      setAnswer(finalAnswer);
      setLastAudioMetrics(currentMetrics);
    }

    if (!finalAnswer || !currentQuestion) {
      setErrorMessage('Please provide an answer before submitting for evaluation.');
      return;
    }

    setEvaluating(true);
    setErrorMessage(null);

    try {
      const res = await api.interview.evaluateAnswer({
        question: currentQuestion.question,
        answer: finalAnswer,
        topic: currentQuestion.topic,
        expectedKeyPoints: currentQuestion.expectedKeyPoints,
        mode: interviewMode === 'voice' ? 'Voice AI Interview' : 'Technical Deep Dive',
        isVoiceSession: interviewMode === 'voice',
        audioMetrics: currentMetrics
          ? {
              wpm: currentMetrics.wpm,
              durationSeconds: currentMetrics.durationSeconds,
              fillerWordCount: currentMetrics.fillerWordCount,
              fillerWords: currentMetrics.fillerWords,
            }
          : undefined,
      });

      if (res.success && res.evaluation) {
        setEvaluation(res.evaluation);
        await loadHistory();
        await refreshQuota();

        const score = Number(res.evaluation.overallScore);
        if (Number.isFinite(score) && score >= 7.5) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.65 },
            colors: ['#62A7FF', '#16A34A', '#62A7FF'],
          });
        }
      } else {
        setErrorMessage(res.error || 'Evaluation failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Evaluation error:', err);
      setErrorMessage(err.message || 'Error communicating with evaluation agent.');
    } finally {
      setEvaluating(false);
    }
  };

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#62A7FF] uppercase tracking-wider">
              Phase 3 Live Practice
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-[#171717] tracking-tight">
            AI Voice Interview Coach & Telemetry
          </h1>
          <p className="text-xs text-[#6B6B6B]">
            Practice live spoken or written screening drills with real-time speech telemetry for{' '}
            <strong className="text-[#171717]">{activeJob?.company || 'Stripe'}</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = interviewMode === 'voice' ? 'text' : 'voice';
            setInterviewMode(next);
            stopSpeaking();
            if (next === 'text' && isListening) stopListening();
          }}
          className="px-4 py-2 rounded-xl border border-[#E7E7E4] bg-[#F8F8F6] text-xs font-bold text-[#171717] hover:border-[#62A7FF]/40 cursor-pointer"
        >
          Mode: {interviewMode === 'voice' ? 'Voice' : 'Text'} (tap to switch)
        </button>
      </div>

      {/* Signature Journey Bar */}
      <JourneyBar currentStage="interview" onStageClick={(tab) => setCurrentTab(tab)} />

      {/* Standout Feature: "Next Move" */}
      <NextMoveCard
        title={`Spoken Technical Drill: ${focusTopic}`}
        actionText="Interview Recommendation"
        category="Live Audio Simulation"
        description="Deliver a verbal explanation covering architectural trade-offs, concurrency models, and failure recovery. Telemetry measures your cadence and filler count."
        ctaLabel="Generate Next Spoken Question"
        onAction={() => fetchQuestion(focusTopic, true)}
      />

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="flex items-start justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800">
          <div className="flex items-start gap-2.5 flex-1">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Notice:</strong> {errorMessage}
              {errorMessage.toLowerCase().includes('quota') && (
                <div className="mt-2">
                  <button
                    onClick={async () => {
                      await switchTier('pro');
                      setErrorMessage(null);
                    }}
                    className="px-3 py-1.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Upgrade to Pro Plan (Unlimited Audio Drills)
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Simulation Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Question Stage & Interactive Voice Booth */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Box with Voice Controls */}
          <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4]">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase bg-[#F8F8F6] border border-[#E7E7E4] px-2 py-0.5 rounded text-[#171717]">
                  {currentQuestion?.topic || focusTopic}
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  {currentQuestion?.difficulty || 'Medium'} Difficulty
                </span>
                {interviewMode === 'voice' && (
                  <span className="text-[10px] font-bold text-[#62A7FF] bg-[#62A7FF]/10 border border-[#62A7FF]/20 px-2 py-0.5 rounded flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" /> Live Speech
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {/* Audio Playback Controls for Question */}
                {interviewMode === 'voice' && (
                  <div className="flex items-center space-x-1.5">
                    {isSpeaking ? (
                      <button
                        onClick={stopSpeaking}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Stop speaking"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Mute</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => currentQuestion?.question && speakText(currentQuestion.question)}
                        className="px-2.5 py-1 bg-[#F8F8F6] hover:bg-white text-[#171717] border border-[#E7E7E4] text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Read question aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#62A7FF]" />
                        <span>Play Audio</span>
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={() => fetchQuestion(focusTopic, autoSpeakQuestion)}
                  disabled={loadingQuestion}
                  className="text-xs text-[#6B6B6B] hover:text-[#62A7FF] flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingQuestion ? 'animate-spin' : ''}`} />
                  <span>Next Drill</span>
                </button>
              </div>
            </div>

            {/* Speaking Waveform Banner */}
            {isSpeaking && (
              <div className="flex items-center gap-3 p-3 bg-[#62A7FF]/5 border border-[#62A7FF]/20 rounded-xl">
                <div className="flex items-center gap-1 h-4">
                  <span className="w-1 bg-[#62A7FF] h-3 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 bg-[#62A7FF] h-5 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-[#62A7FF] h-2 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 bg-[#62A7FF] h-4 animate-bounce" style={{ animationDelay: '450ms' }} />
                </div>
                <span className="text-xs font-semibold text-[#62A7FF]">
                  AI Interviewer is speaking question aloud...
                </span>
              </div>
            )}

            <h3 className="font-heading font-bold text-base sm:text-lg text-[#171717] leading-relaxed">
              {currentQuestion?.question ||
                'Explain the difference between a Docker image and a Docker container. In a production Node.js application, why is a multi-stage Dockerfile critical?'}
            </h3>

            {/* Hint Accordion */}
            {currentQuestion?.hint && (
              <div>
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs font-semibold text-[#6B6B6B] hover:text-[#171717] flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#62A7FF]" />
                  <span>{showHint ? 'Hide Coaching Hint' : 'Show Coaching Hint'}</span>
                </button>
                {showHint && (
                  <p className="mt-2 text-xs text-[#6B6B6B] bg-[#F8F8F6] p-3 rounded-xl border border-[#E7E7E4]">
                    💡 {currentQuestion.hint}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Interactive Voice Stage or Classic Editor */}
          {interviewMode === 'voice' ? (
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-6">
              {(embeddedApp || !micEnv.available || speechError || micPermissionGranted === false || !speechSupported) && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <div className="flex items-start gap-2 flex-1">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                    <div className="space-y-1">
                      {(speechError || !micEnv.available) && (
                        <p>{speechError || micEnv.hint}</p>
                      )}
                      {!speechSupported && !speechError && micEnv.available && (
                        <p>
                          Live transcription works best in <strong>Chrome</strong> or <strong>Edge</strong>. You can
                          still use the mic timer and type your answer below.
                        </p>
                      )}
                      {micPermissionGranted === false && !speechError && micEnv.available && (
                        <p>Allow microphone access for this site, then tap the mic again.</p>
                      )}
                    </div>
                  </div>
                  {(embeddedApp || micEnv.reason === 'embedded') && (
                    <button
                      type="button"
                      onClick={openAppInNewTab}
                      className="shrink-0 px-3 py-2 rounded-lg bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold cursor-pointer"
                    >
                      Open in new tab for mic
                    </button>
                  )}
                </div>
              )}
              {/* Mic Control Orb & Live Telemetry Meter */}
              <div className="flex flex-col items-center justify-center p-8 bg-[#F8F8F6] rounded-2xl border border-[#E7E7E4] space-y-4 text-center">
                {/* Visualizer Pulsing Ring */}
                <div className="relative">
                  {isListening && (
                    <>
                      <div
                        className="absolute inset-0 rounded-full bg-[#62A7FF]/20 animate-ping"
                        style={{ transform: `scale(${1 + audioLevel / 100})` }}
                      />
                      <div
                        className="absolute inset-0 rounded-full bg-[#62A7FF]/30 blur-md transition-all"
                        style={{ transform: `scale(${1 + audioLevel / 70})` }}
                      />
                    </>
                  )}

                  <button
                    onClick={handleToggleVoiceRecord}
                    className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg transition-all transform hover:scale-105 cursor-pointer ${
                      isListening
                        ? 'bg-red-600 text-white ring-4 ring-red-300'
                        : 'bg-[#62A7FF] text-white hover:bg-[#4B92F0]'
                    }`}
                  >
                    {isListening ? (
                      <Square className="w-7 h-7 fill-current" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                </div>

                {/* State Label & Timer */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    {isListening ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                        <span className="font-heading font-extrabold text-sm text-red-600 tracking-wider uppercase">
                          Listening... [{formatSeconds(durationSeconds)}]
                        </span>
                      </>
                    ) : (
                      <span className="font-heading font-bold text-sm text-[#171717]">
                        {answer ? 'Spoken Draft Ready' : 'Tap to Start Speaking Your Answer'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                    {isListening
                      ? 'Speak naturally. We are capturing your voice, pacing (WPM), and filler words.'
                      : 'Speak as you would in a real technical screen. Click again when finished.'}
                  </p>
                </div>

                {/* Live Real-Time Telemetry Badges */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E7E7E4] rounded-lg text-xs font-semibold text-[#171717]">
                    <Clock className="w-3.5 h-3.5 text-[#62A7FF]" />
                    <span>Duration: {formatSeconds(durationSeconds)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E7E7E4] rounded-lg text-xs font-semibold text-[#171717]">
                    <Gauge className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Words: {wordCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E7E7E4] rounded-lg text-xs font-semibold text-[#171717]">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Est. Pace: {durationSeconds > 0 ? Math.round((wordCount / (durationSeconds / 60)) || 0) : 0} WPM</span>
                  </div>
                </div>
              </div>

              {/* Live Transcript Stream & Manual Polish Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#171717]">
                    Spoken Transcript & Telemetry Input
                  </span>
                  <span className="text-[11px] text-[#6B6B6B]">You can edit transcript text before submitting</span>
                </div>

                <textarea
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Your live spoken words will stream here automatically. You can also edit or refine your response directly..."
                  className="w-full p-4 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs sm:text-sm text-[#171717] leading-relaxed focus:outline-none"
                />

                {/* Submit Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-[#6B6B6B]">
                    Evaluation grades technical depth, correctness, completeness, and speech cadence.
                  </span>

                  <div className="flex items-center gap-2">
                    {answer && (
                      <button
                        type="button"
                        onClick={() => {
                          setAnswer('');
                          setLastAudioMetrics(null);
                        }}
                        className="px-3 py-2 text-xs font-semibold text-[#6B6B6B] hover:text-[#171717] cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => handleEvaluate()}
                      disabled={evaluating || !answer.trim()}
                      className="px-6 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{evaluating ? 'Grading Spoken Telemetry...' : 'Grade Spoken Answer'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Classic Text Form */
            <form onSubmit={handleEvaluate} className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
                <span className="text-xs font-bold text-[#171717]">Written Answer</span>
                <span className="text-[11px] text-[#6B6B6B] font-mono">{wordCount} words</span>
              </div>

              <textarea
                rows={7}
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your structured answer here. Include architectural trade-offs, practical configuration details, and production failure modes..."
                className="w-full p-4 bg-[#F8F8F6] border border-[#E7E7E4] focus:border-[#62A7FF] rounded-xl text-xs sm:text-sm text-[#171717] leading-relaxed focus:outline-none"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#6B6B6B]">
                  Tip: Structure your response with the Problem-Solution-Tradeoff method.
                </span>

                <button
                  type="submit"
                  disabled={evaluating || !answer.trim()}
                  className="px-6 py-2.5 bg-[#62A7FF] hover:bg-[#4B92F0] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{evaluating ? 'Analyzing with Lemma...' : 'Submit & Evaluate'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* Structured Feedback Block & Audio Telemetry Scorecard */}
          {evaluation && (
            <div className="bg-white border border-[#E7E7E4] rounded-2xl p-6 card-subtle space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E7E7E4]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
                    Comprehensive Evaluation Scorecard
                  </span>
                  <h3 className="font-heading font-extrabold text-2xl text-[#171717] flex items-center gap-2">
                    {evaluation.overallScore} / 10
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                      {evaluation.grade}
                    </span>
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {/* Listen to Evaluation Feedback */}
                  <button
                    onClick={() => speakText(evaluation.feedback || evaluation.suggestedImprovement || 'Good attempt on the interview drill.')}
                    className="px-3 py-1.5 bg-[#F8F8F6] hover:bg-white border border-[#E7E7E4] rounded-lg text-xs font-bold text-[#171717] flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Listen to feedback"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#62A7FF]" />
                    <span>Listen to Feedback</span>
                  </button>
                  <Award className="w-8 h-8 text-[#62A7FF]" />
                </div>
              </div>

              {/* Speech Delivery Telemetry Card (If Voice Mode / Telemetry available) */}
              {evaluation.voiceTelemetry && (
                <div className="p-5 rounded-2xl bg-[#62A7FF]/5 border border-[#62A7FF]/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-[#62A7FF]" />
                      <h4 className="font-heading font-bold text-sm text-[#171717]">
                        Speech Delivery & Verbal Telemetry
                      </h4>
                    </div>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-white border border-[#62A7FF]/30 text-[#62A7FF]">
                      Delivery Score: {evaluation.voiceTelemetry.speechDeliveryScore} / 100
                    </span>
                  </div>

                  {/* 3 Telemetry Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-[#E7E7E4] space-y-1">
                      <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Speaking Pace</span>
                      <p className="font-heading font-extrabold text-base text-[#171717]">
                        {evaluation.voiceTelemetry.wpm} <span className="text-xs font-normal">WPM</span>
                      </p>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          evaluation.voiceTelemetry.pacingRating === 'Optimal Pace'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {evaluation.voiceTelemetry.pacingRating} (Ideal 120-155)
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#E7E7E4] space-y-1">
                      <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Filler Words</span>
                      <p className="font-heading font-extrabold text-base text-[#171717]">
                        {evaluation.voiceTelemetry.fillerWordCount}{' '}
                        <span className="text-xs font-normal">detected</span>
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {evaluation.voiceTelemetry.fillerWords?.length > 0 ? (
                          evaluation.voiceTelemetry.fillerWords.map((f, i) => (
                            <span key={i} className="text-[9px] font-semibold bg-red-50 text-red-700 px-1 rounded border border-red-200">
                              "{f.word}" ({f.count})
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-green-700 font-semibold">Zero fillers detected ✓</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#E7E7E4] space-y-1">
                      <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Spoken Duration</span>
                      <p className="font-heading font-extrabold text-base text-[#171717]">
                        {evaluation.voiceTelemetry.durationSeconds}s
                      </p>
                      <span className="text-[10px] text-[#6B6B6B]">
                        Concise structure
                      </span>
                    </div>
                  </div>

                  {/* Verbal Feedback Commentary */}
                  <p className="text-xs text-[#171717] bg-white p-3 rounded-xl border border-[#E7E7E4] leading-relaxed">
                    🗣️ <strong className="font-bold">Verbal Delivery Coaching:</strong>{' '}
                    {evaluation.voiceTelemetry.deliveryFeedback}
                  </p>
                </div>
              )}

              {/* 4 Technical Pillars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] text-center">
                  <p className="text-[10px] text-[#6B6B6B] font-semibold uppercase">Depth</p>
                  <p className="font-heading font-bold text-sm text-[#171717]">
                    {evaluation.breakdown.technicalDepth} / 10
                  </p>
                </div>
                <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] text-center">
                  <p className="text-[10px] text-[#6B6B6B] font-semibold uppercase">Correctness</p>
                  <p className="font-heading font-bold text-sm text-[#171717]">
                    {evaluation.breakdown.correctness} / 10
                  </p>
                </div>
                <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] text-center">
                  <p className="text-[10px] text-[#6B6B6B] font-semibold uppercase">Completeness</p>
                  <p className="font-heading font-bold text-sm text-[#171717]">
                    {evaluation.breakdown.completeness} / 10
                  </p>
                </div>
                <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] text-center">
                  <p className="text-[10px] text-[#6B6B6B] font-semibold uppercase">Clarity</p>
                  <p className="font-heading font-bold text-sm text-[#171717]">
                    {evaluation.breakdown.clarity} / 10
                  </p>
                </div>
              </div>

              {/* Qualitative Feedback */}
              <div className="p-4 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4]">
                <p className="text-xs text-[#171717] leading-relaxed">
                  <strong className="font-bold">Coach Analysis:</strong> {evaluation.feedback}
                </p>
              </div>

              {/* Strengths & Missing Concepts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-green-50/50 border border-green-200 space-y-2">
                  <h4 className="font-bold text-xs text-green-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-700" />
                    What You Explained Well
                  </h4>
                  <ul className="text-xs text-green-900 space-y-1 list-disc list-inside">
                    {evaluation.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <h4 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-700" />
                    What Was Omitted or Weak
                  </h4>
                  <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
                    {evaluation.missingConcepts.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Model Answer (How a Senior Staff Engineer would answer) */}
              <div className="p-4 rounded-xl bg-[#F8F8F6] border border-[#E7E7E4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#62A7FF] tracking-wider">
                    Model Answer (Senior Staff Engineer Benchmark)
                  </span>
                  <button
                    onClick={() => speakText(evaluation.modelAnswer)}
                    className="px-2.5 py-1 bg-white hover:bg-[#F8F8F6] border border-[#E7E7E4] rounded-lg text-xs font-bold text-[#171717] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#62A7FF]" />
                    <span>Listen to Senior Answer</span>
                  </button>
                </div>
                <p className="text-xs text-[#171717] leading-relaxed whitespace-pre-line font-mono bg-white p-3 rounded-lg border border-[#E7E7E4]">
                  {evaluation.modelAnswer}
                </p>
              </div>

              {/* Follow-up question */}
              {evaluation.followUpQuestion && (
                <div className="p-4 rounded-xl bg-[#62A7FF]/5 border border-[#62A7FF]/30 space-y-1">
                  <span className="text-[10px] font-bold text-[#62A7FF] uppercase">
                    Adaptive Follow-up Question
                  </span>
                  <p className="text-xs font-bold text-[#171717]">
                    {evaluation.followUpQuestion}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Topic Mastery & Past Sessions */}
        <div className="space-y-6">
          {/* Topic Mastery Ratings (PRD Section 15 & 21) */}
          <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
              <h4 className="font-heading font-bold text-xs text-[#171717] uppercase tracking-wider">
                Topic Mastery
              </h4>
              <span className="text-[10px] text-[#6B6B6B]">Adaptive Tracking</span>
            </div>

            <div className="space-y-3">
              {[
                { topic: 'React & Virtual DOM', score: 8.5, status: 'Strong' },
                { topic: 'Node.js Event Loop', score: 7.8, status: 'Strong' },
                { topic: 'Docker Containerization', score: 6.4, status: 'Needs Practice' },
                { topic: 'AWS Infrastructure', score: 5.2, status: 'Needs Practice' },
              ].map((item) => (
                <div key={item.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#171717]">{item.topic}</span>
                    <span className="font-bold text-[#62A7FF]">{item.score} / 10</span>
                  </div>
                  <div className="w-full bg-[#F8F8F6] h-1.5 rounded-full overflow-hidden border border-[#E7E7E4]">
                    <div
                      className={`h-full rounded-full ${
                        item.score >= 7.5 ? 'bg-[#16A34A]' : 'bg-[#D97706]'
                      }`}
                      style={{ width: `${item.score * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Sessions List */}
          <div className="bg-white border border-[#E7E7E4] rounded-2xl p-5 card-subtle space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E7E4]">
              <h4 className="font-heading font-bold text-xs text-[#171717] uppercase tracking-wider">
                Interview Logs ({history.length})
              </h4>
              <span className="text-[10px] text-[#6B6B6B]">Recent Sessions</span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((h, idx) => (
                <div key={idx} className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E7E7E4] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#62A7FF]">{h.topic}</span>
                      {h.isVoiceSession && (
                        <span className="text-[9px] font-bold bg-[#62A7FF]/10 text-[#62A7FF] px-1.5 py-0.2 rounded border border-[#62A7FF]/20 flex items-center gap-0.5">
                          <Mic className="w-2.5 h-2.5" /> Spoken
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.2 rounded border border-green-200">
                      {h.evaluation?.overallScore || 8} / 10
                    </span>
                  </div>
                  <p className="text-[11px] text-[#171717] line-clamp-2">{h.question}</p>
                  {h.voiceTelemetry && (
                    <div className="flex items-center gap-2 text-[10px] text-[#6B6B6B] pt-0.5">
                      <span>{h.voiceTelemetry.wpm} WPM</span>
                      <span>•</span>
                      <span>{h.voiceTelemetry.fillerWordCount} fillers</span>
                      <span>•</span>
                      <span>{h.voiceTelemetry.durationSeconds}s</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
