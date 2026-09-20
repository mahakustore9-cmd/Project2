/**
 * High-Quality Audio & Hindi Voice Synthesis Engine
 * 1. Web Audio API Super Tune: Harmonic 4-tone chime (G5 -> C6 -> E6 -> G6)
 * 2. Hindi Speech Synthesis: "Aapka bachcha {Name} school pahunch gaya hai", etc.
 * 3. Continuous looping tune until user acknowledges / taps OK.
 */

import { TransitStage } from '../types';

let audioCtx: AudioContext | null = null;
let alertLoopIntervalId: number | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let isCurrentlyAlerting = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a beautiful, crystal-clear 4-bell chime sequence
 * Frequency progression inspired by high-end school notification bells
 */
export function playSuperTuneChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Harmonic chime notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
      const notes = [
        { freq: 523.25, time: now + 0.0, duration: 0.6 },
        { freq: 659.25, time: now + 0.18, duration: 0.7 },
        { freq: 783.99, time: now + 0.36, duration: 0.8 },
        { freq: 1046.50, time: now + 0.54, duration: 1.2 },
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, note.time);

        // Bell envelope: instant rise, musical exponential decay
        gain.gain.setValueAtTime(0.001, note.time);
        gain.gain.exponentialRampToValueAtTime(0.35, note.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, note.time + note.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(note.time);
        osc.stop(note.time + note.duration);
      });

      setTimeout(() => {
        resolve();
      }, 1600);
    } catch (err) {
      console.warn('AudioContext playback error:', err);
      resolve();
    }
  });
}

/**
 * Returns Hindi voice message for a student transit stage
 */
export function getHindiTransitMessage(studentName: string, stage: TransitStage): string {
  switch (stage) {
    case 'LEFT_HOME':
      return `Dhyan dein, aapka bachcha ${studentName} ghar se nikal chuka hai.`;
    case 'REACHED_SCHOOL_GATE':
      return `Dhyan dein, aapka bachcha ${studentName} school pahunch gaya hai. Gate guard ne scan kar liya hai.`;
    case 'ENTERED_CLASS':
      return `Dhyan dein, aapka bachcha ${studentName} class me pahunch gaya hai. Teacher ne attendance scan kar li hai.`;
    case 'EXIT_SCHOOL_GATE':
      return `Dhyan dein, aapka bachcha ${studentName} school se nikal chuka hai. Gate guard ne exit scan kiya hai.`;
    case 'REACHED_HOME':
      return `Shukriya, aapka bachcha ${studentName} surakshit ghar pahunch gaya hai.`;
    default:
      return `Aapke bachche ${studentName} ki sthiti update ho gayi hai.`;
  }
}

/**
 * Speaks message in Hindi using SpeechSynthesis with fallback
 */
export function speakHindiVoice(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported on this device');
      return resolve();
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly measured, clear pacing
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      // Look for Hindi voice or Indian English
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(
        (v) => v.lang.startsWith('hi') || v.lang.includes('IN') || v.name.toLowerCase().includes('hindi')
      );
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }

      utterance.onend = () => {
        currentUtterance = null;
        resolve();
      };
      utterance.onerror = () => {
        currentUtterance = null;
        resolve();
      };

      currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
      resolve();
    }
  });
}

/**
 * Starts continuous alert loop (Tune + Voice) that repeats until stopContinuousAlert() is called
 * User requirement: "voice notification parents ke mobile me jab tak bajti rhe bo Ok nhi kar deta"
 */
export async function startContinuousAlert(
  studentName: string,
  stage: TransitStage,
  onCycle?: () => void
): Promise<void> {
  stopContinuousAlert(); // Clear previous if any
  isCurrentlyAlerting = true;

  const hindiText = getHindiTransitMessage(studentName, stage);

  const runCycle = async () => {
    if (!isCurrentlyAlerting) return;
    if (onCycle) onCycle();

    // 1. Play super melodic tune
    await playSuperTuneChime();
    if (!isCurrentlyAlerting) return;

    // 2. Speak Hindi notification
    await speakHindiVoice(hindiText);
  };

  // Immediate first run
  await runCycle();

  // If still not stopped by user pressing OK, repeat every 4.5 seconds
  alertLoopIntervalId = window.setInterval(async () => {
    if (isCurrentlyAlerting) {
      await runCycle();
    }
  }, 4500);
}

/**
 * Stops the continuous alert loop when parent taps OK button
 */
export function stopContinuousAlert(): void {
  isCurrentlyAlerting = false;
  if (alertLoopIntervalId !== null) {
    clearInterval(alertLoopIntervalId);
    alertLoopIntervalId = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isAlertActive(): boolean {
  return isCurrentlyAlerting;
}
