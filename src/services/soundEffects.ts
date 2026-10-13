/**
 * SoundEffectsManager using the Web Audio API
 * - Generates pure real-time mathematical audio synthesis (100% offline, zero network requests, zero audio file dependencies).
 * - Plays a subtle, pleasant chime when a user selects a correct answer in the QASection.
 * - Plays a soft, calming completion tone upon quiz submission to improve user engagement.
 * - Manages audio context lifecycle, volume, and local user preference persistence.
 */

const STORAGE_SOUND_KEY = 'giao_ly_sound_effects_enabled_v2';

export class SoundEffectsManager {
  private static instance: SoundEffectsManager | null = null;
  private audioCtx: AudioContext | null = null;
  private isEnabledState: boolean = true;
  private masterVolume: number = 0.85;
  private isInitialized: boolean = false;

  private constructor() {
    this.loadPreference();
    this.setupAutoUnlock();
  }

  /**
   * Singleton accessor for global sound management
   */
  public static getInstance(): SoundEffectsManager {
    if (!SoundEffectsManager.instance) {
      SoundEffectsManager.instance = new SoundEffectsManager();
    }
    return SoundEffectsManager.instance;
  }

  /**
   * Load user preference from localStorage
   */
  private loadPreference(): void {
    if (typeof window === 'undefined') return;
    try {
      const val = localStorage.getItem(STORAGE_SOUND_KEY);
      this.isEnabledState = val === null ? true : val === 'true';
    } catch {
      this.isEnabledState = true;
    }
  }

  /**
   * Setup one-time listeners to resume AudioContext upon first user interaction (browser autoplay policy)
   */
  private setupAutoUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.resumeContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true, once: true });
    window.addEventListener('keydown', unlock, { passive: true, once: true });
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
  }

  /**
   * Lazy-initialize and return active AudioContext
   */
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    try {
      if (!this.audioCtx) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
          this.isInitialized = true;
        }
      }

      this.resumeContext();
      return this.audioCtx;
    } catch (err) {
      console.warn('[SoundEffectsManager] Could not initialize AudioContext:', err);
      return null;
    }
  }

  /**
   * Resume audio context if suspended
   */
  public resumeContext(): void {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  /**
   * Check if sound effects are enabled
   */
  public isSoundEnabled(): boolean {
    return this.isEnabledState;
  }

  /**
   * Toggle sound on/off and persist preference
   */
  public toggleSound(): boolean {
    this.isEnabledState = !this.isEnabledState;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_SOUND_KEY, String(this.isEnabledState));
      } catch {
        // LocalStorage fallback
      }
    }
    return this.isEnabledState;
  }

  /**
   * Explicitly set sound enabled state
   */
  public setSoundEnabled(enabled: boolean): void {
    this.isEnabledState = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_SOUND_KEY, String(enabled));
      } catch {
        // Fallback
      }
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Plays a subtle, pleasant chime when a user selects a correct answer in the QASection.
   * Gentle, harmonious bell chime synthesized using pure sine waves with smooth exponential decay.
   * Notes: E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.50Hz) with subtle sparkle (E6 1318.5Hz).
   */
  public playCorrectChime(): void {
    if (!this.isEnabledState) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Staggered celestial chime tones with smooth bell envelope
      const partials = [
        { freq: 659.25, timeOffset: 0.00, gain: 0.10, duration: 0.65 }, // E5
        { freq: 783.99, timeOffset: 0.06, gain: 0.12, duration: 0.70 }, // G5
        { freq: 1046.50, timeOffset: 0.12, gain: 0.10, duration: 0.80 }, // C6
        { freq: 1318.51, timeOffset: 0.18, gain: 0.04, duration: 0.45 }, // E6 (soft sparkle)
      ];

      partials.forEach(({ freq, timeOffset, gain, duration }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const start = now + timeOffset;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        // Anti-click attack (15ms) + long smooth bell exponential decay
        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.exponentialRampToValueAtTime(gain * this.masterVolume, start + 0.018);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration + 0.02);
      });
    } catch (err) {
      console.warn('[SoundEffectsManager] Error playing correct chime:', err);
    }
  }

  /**
   * Plays a soft, calming completion tone upon quiz submission.
   * Warm, celebratory cathedral arpeggio / chord (G4 -> C5 -> E5 -> G5 -> C6).
   * Evokes a peaceful sense of completion and accomplishment.
   */
  public playCompletionTone(): void {
    if (!this.isEnabledState) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Ascending peaceful chord arpeggio with warm resonant decay
      const notes = [
        { freq: 392.00, timeOffset: 0.00, gain: 0.08, duration: 1.10 }, // G4
        { freq: 523.25, timeOffset: 0.10, gain: 0.10, duration: 1.20 }, // C5
        { freq: 659.25, timeOffset: 0.20, gain: 0.10, duration: 1.25 }, // E5
        { freq: 783.99, timeOffset: 0.30, gain: 0.11, duration: 1.35 }, // G5
        { freq: 1046.50, timeOffset: 0.40, gain: 0.09, duration: 1.50 }, // C6
      ];

      notes.forEach(({ freq, timeOffset, gain, duration }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const start = now + timeOffset;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        // Very subtle micro-glide for warm acoustic presence
        osc.frequency.exponentialRampToValueAtTime(freq * 1.002, start + 0.3);

        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.exponentialRampToValueAtTime(gain * this.masterVolume, start + 0.035);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration + 0.02);
      });
    } catch (err) {
      console.warn('[SoundEffectsManager] Error playing completion tone:', err);
    }
  }

  /**
   * Subtle tactile feedback click when an option is selected
   */
  public playOptionSelectTick(): void {
    if (!this.isEnabledState) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.02);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.03 * this.masterVolume, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }

  /**
   * Soft, warm encouragement tone for an incorrect answer (non-punishing wooden tone)
   */
  public playGentleEncouragementTone(): void {
    if (!this.isEnabledState) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(293.66, now + 0.22); // D4

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.06 * this.masterVolume, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Ignore
    }
  }
}

// Global Singleton Instance
export const soundManager = SoundEffectsManager.getInstance();
export const soundEffectsManager = soundManager;

// Convenience functional exports for clean top-level imports
export const playCorrectChime = (): void => soundManager.playCorrectChime();
export const playCompletionTone = (): void => soundManager.playCompletionTone();
export const playSubmissionTone = (): void => soundManager.playCompletionTone();
export const playOptionSelectTick = (): void => soundManager.playOptionSelectTick();
export const playGentleEncouragementTone = (): void => soundManager.playGentleEncouragementTone();
export const isSoundEnabled = (): boolean => soundManager.isSoundEnabled();
export const toggleSound = (): boolean => soundManager.toggleSound();
export const setSoundEnabled = (enabled: boolean): void => soundManager.setSoundEnabled(enabled);
