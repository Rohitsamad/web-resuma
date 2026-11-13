import { ChapterId } from '../types/resume';

interface ChapterSoundProfile {
  freqs: [number, number, number, number];
  filterCutoff: number;
  lfoRate: number;
  lfoDepth: number;
  chimeFreq: number;
}

const CHAPTER_PROFILES: Record<ChapterId, ChapterSoundProfile> = {
  overview: {
    freqs: [73.42, 110.0, 185.0, 329.63], // D2 - A2 - F#3 - E4 (warm architectural pad)
    filterCutoff: 420,
    lfoRate: 0.08,
    lfoDepth: 85,
    chimeFreq: 587.33, // D5
  },
  cloud: {
    freqs: [55.0, 82.41, 123.47, 277.18], // A1 - E2 - B2 - C#4 (expansive cloud orbital chord)
    filterCutoff: 510,
    lfoRate: 0.12,
    lfoDepth: 120,
    chimeFreq: 554.37, // C#5
  },
  cicd: {
    freqs: [92.5, 138.59, 220.0, 329.63], // F#2 - C#3 - A3 - E4 (rhythmic DevSecOps shimmer)
    filterCutoff: 620,
    lfoRate: 0.2,
    lfoDepth: 145,
    chimeFreq: 659.25, // E5
  },
  observability: {
    freqs: [65.41, 98.0, 146.83, 293.66], // C2 - G2 - D3 - D4 (steady telemetry fifths)
    filterCutoff: 490,
    lfoRate: 0.16,
    lfoDepth: 115,
    chimeFreq: 523.25, // C5
  },
  security: {
    freqs: [61.74, 92.5, 146.83, 246.94], // B1 - F#2 - D3 - B3 (vault resonance)
    filterCutoff: 390,
    lfoRate: 0.09,
    lfoDepth: 80,
    chimeFreq: 493.88, // B4
  },
  career: {
    freqs: [49.0, 73.42, 123.47, 185.0], // G1 - D2 - B2 - F#3 (grounded resolving chord)
    filterCutoff: 400,
    lfoRate: 0.07,
    lfoDepth: 75,
    chimeFreq: 587.33, // D5
  },
};

const TARGET_MASTER_GAIN = 0.075;

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private enabled = false;
  private currentChapter: ChapterId = 'overview';
  private disposed = false;

  private ensureContext(): AudioContext | null {
    if (this.disposed) return null;
    if (this.ctx) return this.ctx;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;

    const ctx = new AudioCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.1, ctx.currentTime);

    const profile = CHAPTER_PROFILES[this.currentChapter];
    filter.frequency.setValueAtTime(profile.filterCutoff, ctx.currentTime);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Subtle breathing LFO modulating filter cutoff
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(profile.lfoRate, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(profile.lfoDepth, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // 4-voice harmonic drone (warm triangle bass + sine upper partials)
    const voiceTypes: OscillatorType[] = [
      'triangle',
      'sine',
      'sine',
      'sine',
    ];
    const voiceWeights = [0.34, 0.28, 0.22, 0.14];
    const detunes = [-4, 3, -2, 5];

    const oscillators = profile.freqs.map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = voiceTypes[i];
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime(detunes[i], ctx.currentTime);

      const voiceGain = ctx.createGain();
      voiceGain.gain.setValueAtTime(voiceWeights[i], ctx.currentTime);

      osc.connect(voiceGain);
      voiceGain.connect(filter);
      osc.start();
      return osc;
    });

    this.ctx = ctx;
    this.masterGain = masterGain;
    this.filter = filter;
    this.lfo = lfo;
    this.lfoGain = lfoGain;
    this.oscillators = oscillators;
    return ctx;
  }

  private playTransitionChime(freq: number): void {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const now = this.ctx.currentTime;

    const chimeOsc = this.ctx.createOscillator();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(freq, now);

    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(0.0001, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.14, now + 0.04);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    chimeOsc.start(now);
    chimeOsc.stop(now + 0.8);
  }

  public async setEnabled(nextEnabled: boolean): Promise<boolean> {
    if (this.disposed) return false;
    this.enabled = nextEnabled;

    if (nextEnabled) {
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) {
        this.enabled = false;
        return false;
      }
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const now = ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(TARGET_MASTER_GAIN, now, 0.25);
      this.playTransitionChime(CHAPTER_PROFILES[this.currentChapter].chimeFreq);
      return true;
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0, now, 0.08);
    }
    return false;
  }

  public setChapter(chapter: ChapterId): void {
    if (this.currentChapter === chapter) return;
    this.currentChapter = chapter;

    if (!this.ctx || !this.filter || !this.lfo || !this.lfoGain) return;

    const profile = CHAPTER_PROFILES[chapter];
    const now = this.ctx.currentTime;

    this.oscillators.forEach((osc, i) => {
      osc.frequency.setTargetAtTime(profile.freqs[i], now, 0.45);
    });
    this.filter.frequency.setTargetAtTime(profile.filterCutoff, now, 0.5);
    this.lfo.frequency.setTargetAtTime(profile.lfoRate, now, 0.5);
    this.lfoGain.gain.setTargetAtTime(profile.lfoDepth, now, 0.5);

    if (this.enabled) {
      this.playTransitionChime(profile.chimeFreq);
    }
  }

  public dispose(): void {
    this.disposed = true;
    this.enabled = false;
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already-stopped oscillators
      }
    });
    this.oscillators = [];
    if (this.lfo) {
      try {
        this.lfo.stop();
        this.lfo.disconnect();
      } catch {
        // Ignore
      }
      this.lfo = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
