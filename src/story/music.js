import { CONFIG } from './config.js';
import { fadeAudio } from './utils.js';

/**
 * Owns one background-audio instance for the entire story.
 * The controller deliberately never pauses the track when the ending opens.
 * Browser/OS interruptions are recovered when possible, through three
 * independent layers: the 'pause'/'ended' event handlers, the
 * visibility/focus/pageshow listeners, and a polling watchdog that
 * catches silent suspensions some mobile browsers don't emit an event for.
 */
export class MusicController {
  #audio;
  #started = false;
  #recovering = false;
  #playbackErrorReported = false;
  #retryTimer = null;
  #retryAttempts = 0;
  #watchdogTimer = null;

  constructor() {
    this.#audio = new Audio(CONFIG.music.src);
    this.#audio.preload = 'auto';
    this.#audio.loop = true;
    this.#audio.volume = 0;

    this.#audio.addEventListener('ended', () => {
      this.#restartFromBeginning();
    });

    this.#audio.addEventListener('pause', () => {
      if (this.#started && !document.hidden) {
        this.#scheduleRecovery();
      }
      this.#syncMediaSession();
    });

    this.#audio.addEventListener('play', () => this.#syncMediaSession());

    this.#audio.addEventListener('error', () => {
      const mediaError = this.#audio.error;
      this.#reportError(
        mediaError
          ? new Error(`Audio error ${mediaError.code}: ${mediaError.message || 'unknown media error'}`)
          : new Error('Unknown audio playback error')
      );
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.#started) this.#scheduleRecovery(60);
    });

    window.addEventListener('focus', () => {
      if (this.#started) this.#scheduleRecovery(60);
    }, { passive: true });

    window.addEventListener('pageshow', () => {
      if (this.#started) this.#scheduleRecovery(60);
    }, { passive: true });

    this.#setupMediaSession();
  }

  async start() {
    if (this.#started) {
      await this.#ensurePlaying();
      return;
    }

    this.#started = true;
    this.#audio.currentTime = 0;

    try {
      await this.#audio.play();
      this.#retryAttempts = 0;
      await fadeAudio(this.#audio, CONFIG.music.volume, CONFIG.music.fadeIn);
      this.#startWatchdog();
    } catch (error) {
      this.#started = false;
      this.#reportError(error);
    }
  }

  async #ensurePlaying() {
    if (!this.#started || document.hidden || !this.#audio.paused) return;

    try {
      await this.#audio.play();
      this.#retryAttempts = 0;
      this.#playbackErrorReported = false;
    } catch (error) {
      this.#scheduleRecovery();
      this.#reportError(error);
    }
  }

  #restartFromBeginning() {
    if (!this.#started) return;

    try {
      this.#audio.currentTime = 0;
    } catch {
      // Some media states do not allow seeking immediately after ended.
    }

    this.#audio.play().catch(error => {
      this.#scheduleRecovery();
      this.#reportError(error);
    });
  }

  #scheduleRecovery(delay = 180) {
    if (!this.#started || document.hidden || this.#retryTimer !== null || this.#recovering) return;

    const retryDelay = Math.min(delay * Math.max(1, this.#retryAttempts + 1), 1500);

    this.#retryTimer = window.setTimeout(async () => {
      this.#retryTimer = null;
      this.#recovering = true;
      this.#retryAttempts += 1;

      try {
        await this.#ensurePlaying();
      } finally {
        this.#recovering = false;
        if (this.#started && !document.hidden && this.#audio.paused) {
          this.#scheduleRecovery(300);
        }
      }
    }, retryDelay);
  }

  /**
   * Second line of defense: some mobile browsers silently suspend
   * background audio (e.g. after aggressive battery/power-saving
   * throttling) without ever firing a 'pause' event, so the reactive
   * listeners above never trigger. This checks every 2s and resumes
   * playback if it ever finds the track stopped while the page is
   * visible and the story is still running.
   */
  #startWatchdog() {
    if (this.#watchdogTimer !== null) return;

    this.#watchdogTimer = window.setInterval(() => {
      if (this.#started && !document.hidden && this.#audio.paused && !this.#recovering) {
        this.#ensurePlaying();
      }
    }, 2000);
  }

  #setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Spider-Man: Brand New Day',
        artist: 'Original Score'
      });

      // The story has no exposed audio controls, so the score is meant
      // to keep running for the whole experience — a 'pause' action from
      // the OS media widget resumes instead of stopping it.
      navigator.mediaSession.setActionHandler('play', () => this.#ensurePlaying());
      navigator.mediaSession.setActionHandler('pause', () => this.#ensurePlaying());
    } catch {
      // Media Session API not fully supported — safe to ignore.
    }
  }

  #syncMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = this.#audio.paused ? 'paused' : 'playing';
  }

  #reportError(error) {
    if (this.#playbackErrorReported) return;
    this.#playbackErrorReported = true;
    console.warn('Background music playback interruption:', error);
  }
}
