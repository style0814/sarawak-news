'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type VoiceGender = 'male' | 'female';
type SupportedLanguage = 'en' | 'zh' | 'ms';

interface UseSpeechSynthesisOptions {
  language?: SupportedLanguage;
  gender?: VoiceGender;
  rate?: number;
  pitch?: number;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  setGender: (gender: VoiceGender) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  gender: VoiceGender;
  error: string | null;
}

// Language code mappings for voice selection
const languageCodes: Record<SupportedLanguage, string[]> = {
  en: ['en-US', 'en-GB', 'en-AU', 'en'],
  zh: ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
  ms: ['ms-MY', 'ms', 'id-ID', 'id'] // Malay, fallback to Indonesian
};

// Keywords to identify voice gender
const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'susan', 'samantha', 'karen', 'moira', 'tessa', 'fiona', 'victoria', 'ting-ting', 'mei-jia', 'sin-ji', 'google us english', 'google uk english female', 'microsoft zira', 'ava', 'emma', 'jenny', 'aria', 'sara', 'huihui', 'yaoyao', 'hanhan', 'lili'];
const maleKeywords = ['male', 'man', 'boy', 'david', 'mark', 'james', 'daniel', 'tom', 'alex', 'fred', 'junior', 'yating', 'google uk english male', 'microsoft david', 'guy', 'ryan', 'christopher', 'eric', 'kangkang', 'yunxi', 'yunyang'];

// High quality voice names (prioritize these)
const highQualityVoices = [
  // Google voices (Chrome)
  'google us english', 'google uk english',
  // Microsoft Neural voices (Edge/Windows)
  'microsoft ava', 'microsoft emma', 'microsoft jenny', 'microsoft aria',
  'microsoft guy', 'microsoft ryan', 'microsoft christopher',
  'microsoft yunxi', 'microsoft xiaoxiao', 'microsoft yunyang',
  // Apple voices (Safari/macOS/iOS)
  'samantha', 'alex', 'daniel', 'karen', 'moira', 'tessa',
  'ting-ting', 'mei-jia', 'sin-ji',
  // Other good voices
  'premium', 'enhanced', 'natural', 'neural'
];

// Low quality voice names (avoid these)
const lowQualityVoices = ['espeak', 'festival', 'compact', 'mbrola'];

function getVoiceGender(voice: SpeechSynthesisVoice): VoiceGender | null {
  const name = voice.name.toLowerCase();

  if (femaleKeywords.some(k => name.includes(k))) return 'female';
  if (maleKeywords.some(k => name.includes(k))) return 'male';

  return null;
}

// Score voice quality (higher = better)
function getVoiceQuality(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 50; // Base score

  // High quality voices get bonus
  if (highQualityVoices.some(hq => name.includes(hq))) {
    score += 30;
  }

  // Low quality voices get penalty
  if (lowQualityVoices.some(lq => name.includes(lq))) {
    score -= 40;
  }

  // Google voices are good
  if (name.includes('google')) {
    score += 25;
  }

  // Microsoft Neural voices are excellent
  if (name.includes('microsoft') && (name.includes('neural') || name.includes('online'))) {
    score += 30;
  }

  // Local/offline voices tend to be lower quality
  if (voice.localService) {
    score -= 10;
  }

  // Prefer default voices
  if (voice.default) {
    score += 5;
  }

  return score;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisReturn {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gender, setGender] = useState<VoiceGender>(options.gender || 'female');
  const [language, setLanguage] = useState<SupportedLanguage>(options.language || 'en');
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Check if speech synthesis is supported
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synthRef.current?.getVoices() || [];
      setVoices(availableVoices);
    };

    // Load voices immediately if available
    loadVoices();

    // Chrome loads voices asynchronously
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  // Select best voice based on language, gender, and quality
  useEffect(() => {
    if (voices.length === 0) return;

    const langCodes = languageCodes[language];

    // Filter voices by language
    let matchingVoices = voices.filter(voice =>
      langCodes.some(code => voice.lang.toLowerCase().startsWith(code.toLowerCase()))
    );

    // If no exact match, try broader match
    if (matchingVoices.length === 0) {
      matchingVoices = voices.filter(voice =>
        voice.lang.toLowerCase().startsWith(language)
      );
    }

    // If still no match, use default voices
    if (matchingVoices.length === 0) {
      matchingVoices = voices;
    }

    // Filter by gender preference
    const genderMatchingVoices = matchingVoices.filter(voice => {
      const voiceGender = getVoiceGender(voice);
      return voiceGender === gender || voiceGender === null;
    });

    // Sort by quality score (highest first)
    const sortedVoices = (genderMatchingVoices.length > 0 ? genderMatchingVoices : matchingVoices)
      .map(voice => ({ voice, quality: getVoiceQuality(voice) }))
      .sort((a, b) => b.quality - a.quality);

    // Select the highest quality voice
    const selectedVoice = sortedVoices.length > 0 ? sortedVoices[0].voice : null;

    // Log selected voice for debugging
    if (selectedVoice) {
      console.log('Selected voice:', selectedVoice.name, 'Quality:', getVoiceQuality(selectedVoice));
    }

    setCurrentVoice(selectedVoice);
  }, [voices, language, gender]);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!isSupported || !synthRef.current) {
      setError('Speech synthesis not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();
    setError(null);

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Set voice
    if (currentVoice) {
      utterance.voice = currentVoice;
      utterance.lang = currentVoice.lang;
    } else {
      // Fallback language setting
      utterance.lang = languageCodes[language][0];
    }

    // Set speech parameters
    utterance.rate = options.rate || 0.9; // Slightly slower for news
    utterance.pitch = gender === 'female' ? 1.1 : 0.9;
    utterance.volume = 1;

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setIsPaused(false);
      if (event.error !== 'canceled') {
        setError('Failed to play audio. Please try again.');
      }
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    // Start speaking
    synthRef.current.speak(utterance);
  }, [isSupported, currentVoice, language, gender, options.rate]);

  // Stop speaking
  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  // Pause speaking
  const pause = useCallback(() => {
    if (synthRef.current && isPlaying) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  }, [isPlaying]);

  // Resume speaking
  const resume = useCallback(() => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  return {
    speak,
    stop,
    pause,
    resume,
    isPlaying,
    isPaused,
    isSupported,
    voices,
    currentVoice,
    setGender,
    setLanguage,
    gender,
    error
  };
}
