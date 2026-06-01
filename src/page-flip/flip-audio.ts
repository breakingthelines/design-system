/**
 * Pluggable audio layer for the page-flip.
 *
 * The page-flip plays a short paper-flip sound on each turn. Audio is a
 * *pluggable strategy* keyed by spread index, so a later build can swap the
 * generic flip SFX for per-spread soundtracks (e.g. an issue with ambient beds
 * per section) without touching the renderer — it just calls
 * {@link FlipAudioSource.playFlip} with the spread it's turning to.
 *
 * Browser autoplay policy forbids sound before a user gesture, so the source is
 * armed on the first pointer/key interaction (see {@link FlipAudioSource.resume}).
 * Mute state is persisted to `localStorage` so the choice survives reloads.
 */

/** The pluggable audio contract. Default impl: {@link SynthFlipAudioSource}. */
export interface FlipAudioSource {
  /**
   * Play the flip sound for a turn arriving at `spreadIndex`. `velocity` is the
   * release speed (progress-units/ms, ≥0) so an impl can pitch/level the sound
   * to the flick — a hard flick is brighter and louder than a slow drag.
   */
  playFlip(spreadIndex: number, velocity?: number): void;
  /**
   * Resume/unlock the audio backend. MUST be called from a user-gesture handler
   * (pointerdown / keydown) at least once before the first {@link playFlip}, or
   * the browser autoplay policy will keep the context suspended. Idempotent.
   */
  resume(): void;
  /** Whether sound is currently muted. */
  readonly muted: boolean;
  /** Set mute state (persisted). */
  setMuted(muted: boolean): void;
  /** Release any audio resources. Call on unmount. */
  dispose(): void;
}

const MUTE_STORAGE_KEY = 'btl.page-flip.muted.v1';

function readMutePref(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMutePref(muted: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // Storage can throw in private mode / when disabled — non-fatal.
  }
}

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext ??
    null
  );
}

/**
 * Default {@link FlipAudioSource}: synthesises a short paper-flip from filtered
 * noise via the Web Audio API. No network, no asset to ship — a quick burst of
 * band-passed noise with a fast attack and a ~140ms decay reads convincingly as
 * a page turn, and we vary the band centre + gain by flick velocity so a fast
 * fling sounds crisper than a slow drag.
 *
 * NOTE (content task): this is a synthesised placeholder. If a designed CC0
 * folio sample is sourced later, drop in a buffer-based `FlipAudioSource` behind
 * this same interface — the renderer is agnostic.
 */
export class SynthFlipAudioSource implements FlipAudioSource {
  private ctx: AudioContext | null = null;
  private _muted: boolean;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(initialMuted = readMutePref()) {
    this._muted = initialMuted;
  }

  get muted(): boolean {
    return this._muted;
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    writeMutePref(muted);
  }

  resume(): void {
    if (this._muted) return; // don't spin up a context we won't use
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  playFlip(_spreadIndex: number, velocity = 0): void {
    if (this._muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const now = ctx.currentTime;
    const buffer = this.ensureNoiseBuffer(ctx);
    if (!buffer) return;

    // Map velocity (≈0 slow … ≈0.01+ hard flick) to brightness + level.
    const speed = Math.min(Math.max(velocity, 0) * 1000, 12); // 0..~12
    const t = Math.min(speed / 12, 1);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = 0.9 + 0.5 * t; // faster flick → shorter, higher swish

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 900 + 1700 * t; // brighter when flicked
    band.Q.value = 0.8;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 300;

    const gain = ctx.createGain();
    const peak = 0.05 + 0.12 * t; // slow drag is a whisper; flick is firmer
    const dur = 0.16 - 0.05 * t;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.012); // fast attack
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur); // paper decay

    src.connect(hp).connect(band).connect(gain).connect(ctx.destination);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  dispose(): void {
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.noiseBuffer = null;
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }

  /** One ~300ms white-noise buffer, reused for every flip. */
  private ensureNoiseBuffer(ctx: AudioContext): AudioBuffer | null {
    if (this.noiseBuffer) return this.noiseBuffer;
    const len = Math.floor(ctx.sampleRate * 0.3);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // Slightly decaying noise so the tail is softer than the onset.
      const env = 1 - i / len;
      data[i] = (Math.random() * 2 - 1) * env;
    }
    this.noiseBuffer = buf;
    return buf;
  }
}

/** A no-op source — handy for SSR, tests, or forcing silence. */
export class SilentFlipAudioSource implements FlipAudioSource {
  private _muted = true;
  get muted(): boolean {
    return this._muted;
  }
  setMuted(muted: boolean): void {
    this._muted = muted;
  }
  resume(): void {}
  playFlip(): void {}
  dispose(): void {}
}

export { MUTE_STORAGE_KEY };
