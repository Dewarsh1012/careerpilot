import { useState, useEffect, useRef, useCallback } from 'react';
import {
  describeMicEnvironment,
  micErrorMessage,
  requestMicrophoneStream,
} from '../utils/micSupport';

export interface AudioMetrics {
  durationSeconds: number;
  wordCount: number;
  wpm: number;
  fillerWordCount: number;
  fillerWords: Array<{ word: string; count: number }>;
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function userFacingSpeechError(code: string): string | null {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone blocked. Click the lock icon in the address bar, allow Microphone, then reload.';
    case 'no-speech':
      return 'No speech detected. Check your mic input device and try speaking again.';
    case 'audio-capture':
      return 'No microphone found. Plug in a mic or choose an input in system settings.';
    case 'network':
      return 'Voice transcription needs an internet connection (browser sends audio for processing).';
    case 'aborted':
      return null;
    default:
      return code ? `Speech error: ${code}` : null;
  }
}

export function useVoiceInterview() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelFrameRef = useRef<number | null>(null);
  const fullTranscriptRef = useRef('');
  const interimRef = useRef('');
  const durationRef = useRef(0);
  const listeningIntentRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const releaseMicStream = useCallback(() => {
    if (levelFrameRef.current != null) {
      cancelAnimationFrame(levelFrameRef.current);
      levelFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    setAudioLevel(0);
  }, []);

  const attachMicLevelMeter = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const bins = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!listeningIntentRef.current) return;
        analyser.getByteFrequencyData(bins);
        let sum = 0;
        for (let i = 0; i < bins.length; i += 1) sum += bins[i];
        const avg = sum / bins.length;
        setAudioLevel(Math.min(100, Math.max(8, Math.round(avg * 1.4))));
        levelFrameRef.current = requestAnimationFrame(tick);
      };
      levelFrameRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn('Audio level meter unavailable', e);
    }
  }, []);

  const safeRecognitionStart = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || !listeningIntentRef.current) return;
    try {
      rec.start();
      setIsListening(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/already started/i.test(message)) {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
        window.setTimeout(() => {
          if (!listeningIntentRef.current) return;
          try {
            rec.start();
            setIsListening(true);
          } catch (e2) {
            console.warn('SpeechRecognition restart failed', e2);
            setSpeechError('Could not start listening. Tap the mic again.');
            listeningIntentRef.current = false;
            setIsListening(false);
            releaseMicStream();
          }
        }, 120);
        return;
      }
      console.warn('SpeechRecognition start failed', err);
      setSpeechError('Could not start speech recognition. Try Chrome or Edge.');
      listeningIntentRef.current = false;
      setIsListening(false);
      releaseMicStream();
    }
  }, [releaseMicStream]);

  useEffect(() => {
    const env = describeMicEnvironment();
    if (!env.available && env.hint) {
      setSpeechError(env.hint);
      if (env.reason === 'embedded' || env.reason === 'secure-context' || env.reason === 'api-missing') {
        setMicPermissionGranted(false);
      }
    }

    const Ctor = getSpeechRecognitionCtor();
    if (Ctor) {
      setSpeechSupported(true);
      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language?.startsWith('en') ? navigator.language : 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = fullTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const item = event.results[i];
          const piece = item[0]?.transcript?.trim() ?? '';
          if (!piece) continue;
          if (item.isFinal) {
            final += (final ? ' ' : '') + piece;
          } else {
            interim += piece;
          }
        }

        fullTranscriptRef.current = final;
        interimRef.current = interim;
        setTranscript(final);
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const code = event.error ?? 'unknown';
        console.warn('SpeechRecognition error:', code);
        const msg = userFacingSpeechError(code);
        if (msg) setSpeechError(msg);
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          setMicPermissionGranted(false);
          listeningIntentRef.current = false;
          setIsListening(false);
          releaseMicStream();
        }
        if (code === 'no-speech' && listeningIntentRef.current) {
          safeRecognitionStart();
        }
      };

      recognition.onend = () => {
        if (listeningIntentRef.current) {
          safeRecognitionStart();
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      listeningIntentRef.current = false;
      recognitionRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
      releaseMicStream();
      window.speechSynthesis?.cancel();
    };
  }, [releaseMicStream, safeRecognitionStart]);

  const startListening = useCallback(async () => {
    setSpeechError(null);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    setTranscript('');
    setInterimTranscript('');
    fullTranscriptRef.current = '';
    interimRef.current = '';
    durationRef.current = 0;
    setDurationSeconds(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDurationSeconds(durationRef.current);
    }, 1000);

    const env = describeMicEnvironment();
    if (!env.available) {
      setMicPermissionGranted(false);
      setSpeechError(env.hint);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    try {
      releaseMicStream();
      const stream = await requestMicrophoneStream();
      streamRef.current = stream;
      setMicPermissionGranted(true);
      attachMicLevelMeter(stream);
    } catch (err) {
      console.warn('getUserMedia failed', err);
      setMicPermissionGranted(false);
      setSpeechError(micErrorMessage(err));
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    listeningIntentRef.current = true;

    if (!recognitionRef.current) {
      setSpeechError(
        'Mic is on, but speech-to-text needs Chrome or Edge. Speak is not transcribed — type or paste your answer below.',
      );
      setIsListening(true);
      return;
    }

    safeRecognitionStart();
  }, [attachMicLevelMeter, releaseMicStream, safeRecognitionStart]);

  const stopListening = useCallback((): { finalTranscript: string; metrics: AudioMetrics } => {
    listeningIntentRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }

    releaseMicStream();
    setIsListening(false);

    const combined = (fullTranscriptRef.current + (interimRef.current ? ` ${interimRef.current}` : '')).trim();
    const words = combined.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const dur = Math.max(1, durationRef.current);
    const wpm = Math.round(wordCount / (dur / 60) || 0);

    const fillerList = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'sort of'];
    const detectedFillers: Array<{ word: string; count: number }> = [];
    let totalFillers = 0;

    fillerList.forEach((f) => {
      const reg = new RegExp(`\\b${f}\\b`, 'gi');
      const matches = combined.match(reg);
      if (matches && matches.length > 0) {
        totalFillers += matches.length;
        detectedFillers.push({ word: f, count: matches.length });
      }
    });

    const metrics: AudioMetrics = {
      durationSeconds: dur,
      wordCount,
      wpm: wpm || (wordCount > 0 ? Math.round(wordCount * 1.5) : 0),
      fillerWordCount: totalFillers,
      fillerWords: detectedFillers,
    };

    return { finalTranscript: combined, metrics };
  }, [releaseMicStream]);

  const speakText = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    if (!text?.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      return (
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Aaron')),
        ) ?? voices.find((v) => v.lang.startsWith('en'))
      );
    };

    utterance.voice = pickVoice() ?? null;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis?.getVoices();
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript: transcript + (interimTranscript ? ` ${interimTranscript}` : ''),
    durationSeconds,
    audioLevel,
    speechSupported,
    micPermissionGranted,
    speechError,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    setTranscript,
  };
}
