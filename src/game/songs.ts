// Músicas chiptune originais e mapas de notas.
// Música e notas nascem da mesma estrutura de seções, então as notas caem
// nas batidas, nas síncopes e nas frases da melodia.

import type { MusicEvent } from '../audio/engine';
import type { LevelId } from '../data/items';

type Pat = 'half' | 'quarter' | 'qplus' | 'eighth' | 'sync' | 'dense' | 'melody';
export type HintKey = 'ready' | 'lane0' | 'lane1' | 'lane23' | 'mix';

interface Section {
  bars: number;
  drums: 0 | 1 | 2 | 3;
  bass: 0 | 1 | 2;
  lead: 0 | 1 | 2;
  arp: 0 | 1;
  chart: Pat;
  lanes?: number[];
  doubles?: boolean;
  maxPerBar?: number;
  hint?: HintKey;
}

interface SongDef {
  bpm: number;
  key: number; // MIDI da tônica (oitava 4)
  minor: boolean;
  prog: number[]; // graus da escala, 1 acorde por compasso
  countIn: number; // compassos de contagem
  travel: number; // segundos que a nota leva para descer
  seed: number;
  sections: Section[];
}

const S = (
  bars: number,
  drums: Section['drums'],
  bass: Section['bass'],
  lead: Section['lead'],
  arp: Section['arp'],
  chart: Pat,
  extra: Partial<Section> = {},
): Section => ({ bars, drums, bass, lead, arp, chart, ...extra });

const SONGS: Record<LevelId, SongDef> = {
  patio: {
    bpm: 96,
    key: 60,
    minor: false,
    prog: [0, 4, 5, 3],
    countIn: 2,
    travel: 1.8,
    seed: 11,
    sections: [
      S(4, 1, 1, 0, 0, 'half', { lanes: [0], hint: 'lane0' }),
      S(2, 1, 1, 0, 1, 'half', { lanes: [1], hint: 'lane1' }),
      S(2, 2, 1, 0, 1, 'half', { lanes: [2, 3], hint: 'lane23' }),
      S(4, 2, 1, 1, 0, 'quarter', { lanes: [0, 1, 2, 3, 3, 2, 1, 0], hint: 'mix' }),
      S(3, 2, 2, 1, 1, 'quarter'),
      S(4, 2, 2, 2, 1, 'qplus'),
      S(3, 3, 2, 2, 1, 'melody', { maxPerBar: 6 }),
    ],
  },
  lab: {
    bpm: 112,
    key: 57,
    minor: true,
    prog: [0, 5, 2, 6],
    countIn: 1,
    travel: 1.6,
    seed: 23,
    sections: [
      S(4, 1, 1, 0, 1, 'quarter'),
      S(4, 2, 2, 1, 1, 'qplus'),
      S(4, 2, 2, 1, 1, 'melody', { maxPerBar: 5 }),
      S(4, 3, 2, 2, 1, 'sync'),
      S(4, 2, 2, 2, 1, 'eighth'),
      S(4, 3, 2, 2, 1, 'melody', { maxPerBar: 7 }),
      S(2, 3, 2, 2, 1, 'sync'),
    ],
  },
  festival: {
    bpm: 124,
    key: 65,
    minor: false,
    prog: [3, 4, 2, 5],
    countIn: 1,
    travel: 1.45,
    seed: 37,
    sections: [
      S(4, 2, 1, 1, 0, 'quarter'),
      S(4, 2, 2, 1, 1, 'qplus'),
      S(4, 2, 2, 1, 1, 'sync'),
      S(4, 3, 2, 2, 1, 'eighth', { doubles: true }),
      S(4, 3, 2, 2, 1, 'melody', { maxPerBar: 7 }),
      S(4, 3, 2, 2, 1, 'sync', { doubles: true }),
      S(4, 3, 2, 2, 1, 'dense'),
    ],
  },
  palco: {
    bpm: 136,
    key: 64,
    minor: true,
    prog: [0, 5, 3, 6],
    countIn: 1,
    travel: 1.3,
    seed: 53,
    sections: [
      S(4, 2, 2, 1, 1, 'qplus'),
      S(4, 2, 2, 1, 1, 'eighth'),
      S(4, 3, 2, 2, 1, 'sync', { doubles: true }),
      S(4, 3, 2, 2, 1, 'melody', { maxPerBar: 8 }),
      S(4, 3, 2, 2, 1, 'eighth', { doubles: true }),
      S(4, 3, 2, 2, 1, 'dense'),
      S(4, 3, 2, 2, 1, 'sync', { doubles: true }),
      S(4, 3, 2, 2, 1, 'dense', { doubles: true }),
    ],
  },
};

const TEMPLATES: Record<Exclude<Pat, 'melody'>, number[][]> = {
  half: [[0, 4]],
  quarter: [[0, 2, 4, 6]],
  qplus: [
    [0, 2, 4, 6],
    [0, 2, 3, 4, 6],
    [0, 2, 4, 6],
    [0, 1, 2, 4, 6],
  ],
  eighth: [
    [0, 1, 2, 4, 5, 6],
    [0, 2, 3, 4, 6, 7],
    [0, 1, 2, 3, 4, 6],
    [0, 2, 4, 5, 6, 7],
  ],
  sync: [
    [0, 3, 4, 6],
    [0, 3, 6, 7],
    [0, 2, 3, 5, 6],
    [0, 3, 4, 7],
  ],
  dense: [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [0, 1, 2, 4, 5, 6, 7],
    [0, 1, 2, 3, 4, 6, 7],
    [0, 2, 3, 4, 5, 6, 7],
  ],
};

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Frase de 4 compassos em colcheias: grau da escala ou null (pausa). */
function makePhrase(r: () => number, prog: number[]): (number | null)[] {
  const out: (number | null)[] = [];
  let prev = 7;
  for (let b = 0; b < 4; b++) {
    const chord = prog[b];
    for (let s = 0; s < 8; s++) {
      const strong = s % 2 === 0;
      const last = b === 3 && s >= 4;
      let play = s === 0 || r() < (strong ? 0.72 : 0.42);
      if (last && s > 4) play = false;
      if (!play) {
        out.push(null);
        continue;
      }
      let deg: number;
      if (strong || last) {
        const cands = [chord, chord + 2, chord + 4, chord + 7, chord + 9].filter((d) => d >= 4 && d <= 13);
        cands.sort((x, y) => Math.abs(x - prev) - Math.abs(y - prev) + (r() - 0.5) * 3);
        deg = last ? (prog[0] < 4 ? prog[0] + 7 : prog[0]) : cands[0];
      } else {
        deg = prev + (r() < 0.5 ? -1 : 1);
      }
      deg = Math.max(3, Math.min(14, deg));
      out.push(deg);
      prev = deg;
    }
  }
  return out;
}

export interface Note {
  id: number;
  time: number; // segundos desde o início da música
  lane: number;
  // estado durante a partida
  judged?: 'perfect' | 'good' | 'miss';
  removed?: boolean;
}

export interface Hint {
  from: number; // segundos
  to: number;
  key: HintKey;
  lane: number;
}

export interface Song {
  level: LevelId;
  bpm: number;
  spb: number; // segundos por batida
  travel: number;
  notes: Note[];
  events: MusicEvent[];
  hints: Hint[];
  countInEnd: number; // segundos
  end: number; // segundos (fim da partida)
}

export function buildSong(level: LevelId): Song {
  const def = SONGS[level];
  const r = rng(def.seed);
  const spb = 60 / def.bpm;
  const step = spb / 2; // colcheia
  const scale = def.minor ? MINOR : MAJOR;
  const degMidi = (deg: number, base: number) =>
    base + scale[((deg % 7) + 7) % 7] + 12 * Math.floor(deg / 7);

  const phraseA = makePhrase(r, def.prog);
  const phraseB = makePhrase(r, def.prog);

  const events: MusicEvent[] = [];
  const notes: Note[] = [];
  const hints: Hint[] = [];
  const ev = (t: number, inst: MusicEvent['inst'], dur: number, vel = 1, midi?: number) =>
    events.push({ t, inst, dur, vel, midi });

  // Contagem
  for (let b = 0; b < def.countIn * 4; b++) ev(b * spb, 'hat', 0.05, b % 4 === 0 ? 1.4 : 1);
  const countInEnd = def.countIn * 4 * spb;
  hints.push({ from: 0, to: countInEnd, key: 'ready', lane: 0 });

  let bar = def.countIn;
  let lane = 0;
  let noteId = 0;
  let fixedIdx = 0;

  for (const sec of def.sections) {
    const secStart = bar * 4 * spb;
    if (sec.hint) hints.push({ from: secStart - spb, to: secStart + Math.min(sec.bars, 4) * 4 * spb, key: sec.hint, lane: sec.lanes?.[0] ?? 0 });
    fixedIdx = 0;
    for (let i = 0; i < sec.bars; i++, bar++) {
      const t0 = bar * 4 * spb;
      const pb = bar % 4; // posição na progressão/frase
      const chord = def.prog[pb];
      const phrase = sec.lead === 2 && Math.floor(bar / 4) % 2 === 1 ? phraseB : phraseA;
      const lastOfSection = i === sec.bars - 1;

      // Bateria
      if (sec.drums >= 1) {
        ev(t0, 'kick', 0.15);
        ev(t0 + 2 * spb, 'kick', 0.15);
        for (let k = 0; k < 4; k++) ev(t0 + k * spb, 'hat', 0.04, 0.8);
      }
      if (sec.drums >= 2) {
        ev(t0 + spb, 'snare', 0.15);
        ev(t0 + 3 * spb, 'snare', 0.15);
        for (let k = 0; k < 4; k++) ev(t0 + k * spb + step, 'hat', 0.04, 0.6);
        if (pb % 2 === 1) ev(t0 + 2.5 * spb, 'kick', 0.15, 0.7);
      }
      if (sec.drums >= 3) {
        ev(t0 + 3.5 * spb, 'kick', 0.15, 0.6);
        if (lastOfSection) for (let k = 0; k < 4; k++) ev(t0 + 3 * spb + k * spb * 0.25, 'snare', 0.1, 0.5 + k * 0.15);
      }

      // Baixo
      const root = degMidi(chord, def.key - 24);
      if (sec.bass === 1) for (let k = 0; k < 4; k++) ev(t0 + k * spb, 'bass', spb * 0.8, 1, root);
      if (sec.bass === 2) {
        const pat = [0, 0, 12, 0, 7, 0, 12, 7];
        for (let k = 0; k < 8; k++) ev(t0 + k * step, 'bass', step * 0.85, 1, root + pat[k]);
      }

      // Arpejo
      if (sec.arp) {
        const tones = [0, 2, 4, 7].map((d) => degMidi(chord + d, def.key + 12));
        for (let k = 0; k < 16; k++) ev(t0 + k * step * 0.5, 'arp', step * 0.45, 1, tones[[0, 1, 2, 3, 2, 1][k % 6]]);
      }

      // Melodia
      const barMel = phrase.slice(pb * 8, pb * 8 + 8);
      if (sec.lead >= 1) {
        for (let s = 0; s < 8; s++) {
          const d = barMel[s];
          if (d === null) continue;
          let len = 1;
          while (s + len < 8 && len < 3 && barMel[s + len] === null) len++;
          ev(t0 + s * step, 'lead', len * step * 0.9, 1, degMidi(d, def.key));
          if (sec.lead === 2 && s % 2 === 0) ev(t0 + s * step, 'harm', len * step * 0.9, 1, degMidi(d - 2, def.key));
        }
      }

      // Notas do mapa
      let steps: number[];
      if (sec.chart === 'melody') {
        steps = barMel.map((d, s) => (d === null ? -1 : s)).filter((s) => s >= 0);
        if (steps[0] !== 0) steps.unshift(0);
        const fill = [0, 2, 4, 6, 1, 3, 5, 7];
        for (const s of fill) if (steps.length < 4 && !steps.includes(s)) steps.push(s);
        steps.sort((a, b) => a - b);
        steps = steps.slice(0, sec.maxPerBar ?? 8);
      } else {
        const tpl = TEMPLATES[sec.chart];
        steps = tpl[i % tpl.length];
      }

      const stairs = !sec.lanes && sec.chart !== 'melody' && r() < 0.3 ? (r() < 0.5 ? 1 : -1) : 0;
      let prevStep = -9;
      let prevDeg = 7;
      for (const s of steps) {
        if (sec.lanes) {
          lane = sec.lanes[fixedIdx++ % sec.lanes.length];
        } else if (sec.chart === 'melody') {
          const d = barMel[s] ?? prevDeg;
          let next = d > prevDeg ? lane + 1 : d < prevDeg ? lane - 1 : lane + 2;
          if (next > 3) next = lane - 1;
          if (next < 0) next = lane + 1;
          lane = ((next % 4) + 4) % 4;
          prevDeg = d;
        } else if (stairs) {
          lane = (lane + stairs + 4) % 4;
        } else {
          let n = Math.floor(r() * 4);
          if (n === lane && s - prevStep <= 2) n = (n + 1 + Math.floor(r() * 3)) % 4;
          lane = n;
        }
        prevStep = s;
        const t = t0 + s * step;
        notes.push({ id: noteId++, time: t, lane });
        if (sec.doubles && s === 0 && pb % 2 === 0) notes.push({ id: noteId++, time: t, lane: (lane + 2) % 4 });
      }
    }
  }

  // Final: acorde de encerramento + nota dupla
  const tEnd = bar * 4 * spb;
  const root = degMidi(def.prog[0], def.key - 24);
  ev(tEnd, 'kick', 0.2, 1.2);
  ev(tEnd, 'snare', 0.4, 1);
  ev(tEnd, 'bass', spb * 3, 1, root);
  ev(tEnd, 'lead', spb * 3, 1, degMidi(def.prog[0] + 7, def.key));
  ev(tEnd, 'harm', spb * 3, 1, degMidi(def.prog[0] + 4, def.key));
  notes.push({ id: noteId++, time: tEnd, lane: 1 });
  notes.push({ id: noteId++, time: tEnd, lane: 2 });

  events.sort((a, b) => a.t - b.t);
  notes.sort((a, b) => a.time - b.time || a.lane - b.lane);

  return {
    level,
    bpm: def.bpm,
    spb,
    travel: def.travel,
    notes,
    events,
    hints,
    countInEnd,
    end: tEnd + spb * 4,
  };
}
