// Motor de áudio chiptune com Web Audio.
// O mesmo relógio (AudioContext.currentTime) agenda a música, posiciona as notas
// e julga os acertos — assim o jogo segue a batida de verdade.

export type Inst = 'lead' | 'harm' | 'bass' | 'arp' | 'kick' | 'snare' | 'hat';

export interface MusicEvent {
  t: number; // segundos desde o início da música
  inst: Inst;
  midi?: number;
  dur: number;
  vel: number;
}

export type Sfx = 'perfect' | 'good' | 'miss' | 'farm' | 'auraMode' | 'auraMax' | 'click' | 'unlock';

type Ctx = AudioContext;

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class AudioEngine {
  private ctx: Ctx | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfxBus!: GainNode;
  private noise!: AudioBuffer;
  private pulses = new Map<number, PeriodicWave>();
  private muted = false;
  private paused = false;

  // Relógio reserva quando não há Web Audio (ex.: app nativo sem módulo de áudio).
  private fbBase = 0;
  private fbPausedAt: number | null = null;

  private events: MusicEvent[] = [];
  private evIdx = 0;
  private songStart = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private live: AudioScheduledSourceNode[] = [];

  get hasAudio() {
    return this.ctx !== null;
  }

  /** Precisa ser chamado a partir de um gesto do usuário (toque/clique/tecla). */
  unlock() {
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        (globalThis as any).AudioContext ?? (globalThis as any).webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC({ latencyHint: 'interactive' });
      } catch {
        return;
      }
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(ctx.destination);
      this.music = ctx.createGain();
      this.music.gain.value = 0.55;
      this.music.connect(this.master);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.35;
      this.sfxBus.connect(this.master);
      const len = ctx.sampleRate;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended' && !this.paused) this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.02);
  }

  /** Relógio mestre em segundos. */
  now(): number {
    if (this.ctx) return this.ctx.currentTime;
    if (this.fbPausedAt !== null) return this.fbPausedAt;
    return performance.now() / 1000 - this.fbBase;
  }

  /** Atraso entre agendar um som e ele sair da caixa de som. */
  private latency(): number {
    if (!this.ctx) return 0;
    const c = this.ctx as any;
    return (c.outputLatency || 0) + (c.baseLatency || 0);
  }

  /** Tempo da música (s) tal como o jogador está ouvindo agora. */
  songTime(): number {
    return this.now() - this.songStart - this.latency();
  }

  startSong(events: MusicEvent[], lead = 0.35) {
    this.stopSong();
    this.events = events;
    this.evIdx = 0;
    this.songStart = this.now() + lead;
    this.pump();
    this.timer = setInterval(() => this.pump(), 25);
  }

  stopSong() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const t = this.ctx?.currentTime ?? 0;
    for (const n of this.live) {
      try {
        n.stop(t);
      } catch {}
    }
    this.live = [];
    this.events = [];
  }

  pause() {
    this.paused = true;
    if (this.ctx) this.ctx.suspend();
    else if (this.fbPausedAt === null) this.fbPausedAt = this.now();
  }

  resume() {
    this.paused = false;
    if (this.ctx) this.ctx.resume();
    else if (this.fbPausedAt !== null) {
      this.fbBase = performance.now() / 1000 - this.fbPausedAt;
      this.fbPausedAt = null;
    }
  }

  private pump() {
    if (!this.ctx) {
      this.evIdx = this.events.length;
      return;
    }
    const horizon = this.ctx.currentTime + 0.15;
    while (this.evIdx < this.events.length) {
      const ev = this.events[this.evIdx];
      const at = this.songStart + ev.t;
      if (at > horizon) break;
      this.evIdx++;
      if (at < this.ctx.currentTime - 0.05) continue;
      this.play(ev, Math.max(at, this.ctx.currentTime));
    }
    this.live = this.live.filter((n) => (n as any)._end > this.ctx!.currentTime);
  }

  private pulse(duty: number): PeriodicWave {
    let w = this.pulses.get(duty);
    if (!w) {
      const n = 32;
      const real = new Float32Array(n);
      const imag = new Float32Array(n);
      for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
      w = this.ctx!.createPeriodicWave(real, imag);
      this.pulses.set(duty, w);
    }
    return w;
  }

  private track(node: AudioScheduledSourceNode, end: number) {
    (node as any)._end = end;
    this.live.push(node);
  }

  private tone(
    out: AudioNode,
    t: number,
    hz: number,
    dur: number,
    vel: number,
    wave: OscillatorType | number,
    slideTo?: number,
  ) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    if (typeof wave === 'number') o.setPeriodicWave(this.pulse(wave));
    else o.type = wave;
    o.frequency.setValueAtTime(hz, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.004);
    g.gain.setValueAtTime(vel, t + Math.max(0.005, dur * 0.6));
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
    this.track(o, t + dur + 0.02);
  }

  private noiseHit(out: AudioNode, t: number, dur: number, vel: number, type: BiquadFilterType, freq: number) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(out);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.01);
    this.track(s, t + dur + 0.01);
  }

  private play(ev: MusicEvent, t: number) {
    const out = this.music;
    switch (ev.inst) {
      case 'lead':
        this.tone(out, t, midiHz(ev.midi!), ev.dur, 0.16 * ev.vel, 0.25);
        break;
      case 'harm':
        this.tone(out, t, midiHz(ev.midi!), ev.dur, 0.09 * ev.vel, 0.5);
        break;
      case 'arp':
        this.tone(out, t, midiHz(ev.midi!), ev.dur, 0.06 * ev.vel, 0.125);
        break;
      case 'bass':
        this.tone(out, t, midiHz(ev.midi!), ev.dur, 0.38 * ev.vel, 'triangle');
        break;
      case 'kick':
        this.tone(out, t, 150, 0.13, 0.9 * ev.vel, 'sine', 42);
        break;
      case 'snare':
        this.noiseHit(out, t, 0.14, 0.42 * ev.vel, 'highpass', 1400);
        this.tone(out, t, 190, 0.07, 0.25 * ev.vel, 'triangle', 120);
        break;
      case 'hat':
        this.noiseHit(out, t, 0.035, 0.18 * ev.vel, 'highpass', 7500);
        break;
    }
  }

  sfx(kind: Sfx, n = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.005;
    const o = this.sfxBus;
    switch (kind) {
      case 'perfect':
        this.tone(o, t, midiHz(88), 0.05, 0.35, 0.25);
        this.tone(o, t + 0.04, midiHz(95), 0.06, 0.3, 0.25);
        break;
      case 'good':
        this.tone(o, t, midiHz(84), 0.06, 0.3, 0.25);
        break;
      case 'miss':
        this.tone(o, t, 140, 0.15, 0.45, 'triangle', 70);
        break;
      case 'farm': {
        const m = 76 + ((n * 2) % 14);
        this.tone(o, t, midiHz(m), 0.05, 0.3, 0.125);
        this.tone(o, t + 0.03, midiHz(m + 7), 0.05, 0.22, 0.125);
        break;
      }
      case 'auraMode':
        [72, 76, 79, 84].forEach((m, i) => this.tone(o, t + i * 0.05, midiHz(m), 0.08, 0.35, 0.5));
        break;
      case 'auraMax':
        [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => this.tone(o, t + i * 0.06, midiHz(m), 0.14, 0.4, 0.25));
        this.noiseHit(o, t, 0.6, 0.15, 'highpass', 5000);
        break;
      case 'unlock':
        [79, 84, 88, 91].forEach((m, i) => this.tone(o, t + i * 0.08, midiHz(m), 0.12, 0.35, 0.5));
        break;
      case 'click':
        this.tone(o, t, midiHz(81), 0.04, 0.25, 0.5);
        break;
    }
  }
}

export const audio = new AudioEngine();
