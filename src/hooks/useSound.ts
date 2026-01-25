import { useCallback, useRef, useEffect } from 'react';

// Web Audio API sound generator
class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;

  init() {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.3;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = enabled ? 0.3 : 0;
    }
  }

  isEnabled() {
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'square', volume = 0.3) {
    if (!this.audioContext || !this.masterGain || !this.enabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Ball hits paddle
  paddleHit() {
    this.playTone(440, 0.1, 'sine', 0.2);
  }

  // Ball hits block
  blockHit() {
    this.playTone(520, 0.08, 'square', 0.15);
  }

  // Block destroyed
  blockDestroy() {
    this.playTone(660, 0.1, 'square', 0.2);
    setTimeout(() => this.playTone(880, 0.1, 'square', 0.15), 50);
  }

  // Reinforced block hit
  reinforcedHit() {
    this.playTone(200, 0.15, 'sawtooth', 0.2);
  }

  // Ball lost
  ballLost() {
    this.playTone(200, 0.3, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.25), 150);
  }

  // Power-up collected
  powerUp() {
    this.playTone(523, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.2), 80);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.2), 160);
  }

  // Robot completes a line (warning)
  lineComplete() {
    this.playTone(150, 0.2, 'sawtooth', 0.3);
    setTimeout(() => this.playTone(100, 0.3, 'sawtooth', 0.25), 150);
  }

  // Level up
  levelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.15, 'sine', 0.25), i * 100);
    });
  }

  // Game over
  gameOver() {
    const notes = [392, 330, 262, 196];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.3, 'sawtooth', 0.3), i * 200);
    });
  }

  // Game start
  gameStart() {
    this.playTone(262, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(330, 0.1, 'sine', 0.2), 100);
    setTimeout(() => this.playTone(392, 0.2, 'sine', 0.25), 200);
  }

  // Pause
  pause() {
    this.playTone(440, 0.05, 'sine', 0.15);
    setTimeout(() => this.playTone(330, 0.1, 'sine', 0.15), 80);
  }

  // Resume
  resume() {
    this.playTone(330, 0.05, 'sine', 0.15);
    setTimeout(() => this.playTone(440, 0.1, 'sine', 0.15), 80);
  }

  // Ball launch
  launch() {
    this.playTone(330, 0.08, 'sine', 0.2);
    setTimeout(() => this.playTone(440, 0.08, 'sine', 0.15), 60);
  }

  // Warning - line almost complete
  warning() {
    this.playTone(880, 0.05, 'square', 0.1);
  }

  // Robot places a piece
  robotPlace() {
    this.playTone(180, 0.1, 'triangle', 0.1);
  }
}

const soundGenerator = new SoundGenerator();

export function useSound() {
  const initialized = useRef(false);

  const init = useCallback(() => {
    if (!initialized.current) {
      soundGenerator.init();
      initialized.current = true;
    }
  }, []);

  // Initialize on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      init();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [init]);

  return {
    init,
    paddleHit: useCallback(() => soundGenerator.paddleHit(), []),
    blockHit: useCallback(() => soundGenerator.blockHit(), []),
    blockDestroy: useCallback(() => soundGenerator.blockDestroy(), []),
    reinforcedHit: useCallback(() => soundGenerator.reinforcedHit(), []),
    ballLost: useCallback(() => soundGenerator.ballLost(), []),
    powerUp: useCallback(() => soundGenerator.powerUp(), []),
    lineComplete: useCallback(() => soundGenerator.lineComplete(), []),
    levelUp: useCallback(() => soundGenerator.levelUp(), []),
    gameOver: useCallback(() => soundGenerator.gameOver(), []),
    gameStart: useCallback(() => soundGenerator.gameStart(), []),
    pause: useCallback(() => soundGenerator.pause(), []),
    resume: useCallback(() => soundGenerator.resume(), []),
    launch: useCallback(() => soundGenerator.launch(), []),
    warning: useCallback(() => soundGenerator.warning(), []),
    robotPlace: useCallback(() => soundGenerator.robotPlace(), []),
    setEnabled: useCallback((enabled: boolean) => soundGenerator.setEnabled(enabled), []),
    isEnabled: useCallback(() => soundGenerator.isEnabled(), []),
  };
}

export type SoundEffects = ReturnType<typeof useSound>;
