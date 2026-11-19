/**
 * Procedural Web Audio API Sound Engine for Outbreak: Dead Zone.
 * Zero external audio files; all sound effects are synthesized procedurally in real-time.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private heartbeatNode: OscillatorNode | null = null;
  private heartbeatGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Gunshot sounds tailored by weapon type
   */
  public playGunshot(type: 'PISTOL' | 'SHOTGUN' | 'RIFLE' | 'WONDER' | 'HEAVY', isPap: boolean = false) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    if (type === 'WONDER') {
      // Ray Gun / Wonder weapon laser zap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isPap ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isPap ? 1600 : 1200, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.22);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.25);
      return;
    }

    // Standard gunpowder weapon: Noise burst + low boom punch
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * (type === 'SHOTGUN' ? 0.35 : 0.18)));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to shape tone
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'SHOTGUN' ? 2400 : type === 'RIFLE' ? 3800 : 3200, t);

    const noiseGain = this.ctx.createGain();
    const volume = type === 'SHOTGUN' ? 0.6 : type === 'HEAVY' ? 0.55 : 0.45;
    noiseGain.gain.setValueAtTime(volume * (isPap ? 1.25 : 1), t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + (type === 'SHOTGUN' ? 0.28 : 0.16));

    // Low sub-kick punch
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(type === 'SHOTGUN' ? 140 : 180, t);
    sub.frequency.exponentialRampToValueAtTime(35, t + 0.12);

    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);

    noise.start(t);
    sub.start(t);
    sub.stop(t + 0.15);
  }

  public playReload() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Click 1: Mag out
    this.playClick(t, 600, 0.05);
    // Click 2: Mag in
    this.playClick(t + 0.25, 850, 0.06);
    // Click 3: Chamber slide
    this.playClick(t + 0.5, 1200, 0.08);
  }

  private playClick(t: number, freq: number, dur: number) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + dur);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  public playHitMarker(isHeadshot: boolean = false) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isHeadshot ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(isHeadshot ? 1800 : 700, t);
    if (isHeadshot) {
      osc.frequency.exponentialRampToValueAtTime(2400, t + 0.06);
    }

    gain.gain.setValueAtTime(isHeadshot ? 0.35 : 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playZombieGrowl(type: string = 'WALKER') {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const baseFreq = type === 'BRUTE_BOSS' ? 70 : type === 'HELLHOUND' ? 320 : 120;
    osc.frequency.setValueAtTime(baseFreq + Math.random() * 30, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.7, t + 0.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.Q.value = 3.0;

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  public playRoundStart() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Ominous bell + brass synth
    [130.81, 164.81, 196.0, 246.94].forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t + i * 0.12);
      gain.gain.setValueAtTime(0.25, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 1.25);
    });
  }

  public playPowerUp(type: string) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    if (type === 'NUKE') {
      // Massive explosion + rumble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 1.2);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.5);
    } else {
      // Ascending celebratory chime
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((f, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + idx * 0.08);
        gain.gain.setValueAtTime(0.28, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.36);
      });
    }
  }

  public playPerkJingle(perkId?: string) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    let notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 default

    if (perkId === 'JUGGERNOG') {
      // Heavier bold triumphant fanfare
      notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    } else if (perkId === 'SPEED_COLA') {
      // Super fast ascending jazzy arpeggio
      notes = [440.0, 554.37, 659.25, 880.0, 1108.73];
    } else if (perkId === 'QUICK_REVIVE') {
      // Celestial harmonic chime
      notes = [392.0, 493.88, 587.33, 783.99, 987.77];
    } else if (perkId === 'DOUBLE_TAP') {
      // Driving rock brass intervals
      notes = [220.0, 329.63, 440.0, 659.25];
    } else if (perkId === 'STAMIN_UP') {
      // Fast rhythmic sprint cadence
      notes = [349.23, 440.0, 523.25, 698.46, 880.0];
    }

    notes.forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = perkId === 'JUGGERNOG' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f, t + i * 0.09);
      gain.gain.setValueAtTime(0.24, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.38);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.4);
    });
  }

  public playPerkDrink() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // 1. Bottle Cap Pop & Fizz
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(800, t);
    popOsc.frequency.exponentialRampToValueAtTime(160, t + 0.05);
    popGain.gain.setValueAtTime(0.35, t);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    popOsc.connect(popGain);
    popGain.connect(this.sfxGain);
    popOsc.start(t);
    popOsc.stop(t + 0.07);

    // 2. Liquid Gulping Bubbles
    [0.12, 0.24, 0.36].forEach((timeOffset, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const gulpOsc = this.ctx.createOscillator();
      const gulpGain = this.ctx.createGain();
      gulpOsc.type = 'triangle';
      gulpOsc.frequency.setValueAtTime(280 + idx * 40, t + timeOffset);
      gulpOsc.frequency.exponentialRampToValueAtTime(140 + idx * 30, t + timeOffset + 0.07);
      gulpGain.gain.setValueAtTime(0.22, t + timeOffset);
      gulpGain.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + 0.08);
      gulpOsc.connect(gulpGain);
      gulpGain.connect(this.sfxGain);
      gulpOsc.start(t + timeOffset);
      gulpOsc.stop(t + timeOffset + 0.09);
    });

    // 3. Glass bottle toss clink
    const clinkOsc = this.ctx.createOscillator();
    const clinkGain = this.ctx.createGain();
    clinkOsc.type = 'sine';
    clinkOsc.frequency.setValueAtTime(1800, t + 0.52);
    clinkOsc.frequency.exponentialRampToValueAtTime(600, t + 0.62);
    clinkGain.gain.setValueAtTime(0.18, t + 0.52);
    clinkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    clinkOsc.connect(clinkGain);
    clinkGain.connect(this.sfxGain);
    clinkOsc.start(t + 0.52);
    clinkOsc.stop(t + 0.66);
  }

  public playRepairPlank() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Wood thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playElectricTrap() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(240, t + 0.3);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playMysteryBox() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 8; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + Math.random() * 400, t + i * 0.07);
      gain.gain.setValueAtTime(0.18, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.06);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.07);
    }
  }

  public updateLowHealthHeartbeat(isLowHealth: boolean) {
    if (this.isMuted || !isLowHealth) {
      if (this.heartbeatNode) {
        this.heartbeatGain?.gain.linearRampToValueAtTime(0, (this.ctx?.currentTime || 0) + 0.3);
        setTimeout(() => {
          this.heartbeatNode?.stop();
          this.heartbeatNode = null;
        }, 350);
      }
      return;
    }

    this.initCtx();
    if (!this.ctx || !this.sfxGain || this.heartbeatNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, t);

    gain.gain.setValueAtTime(0.3, t);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);

    this.heartbeatNode = osc;
    this.heartbeatGain = gain;
  }
}

export const sound = new SoundEngine();
