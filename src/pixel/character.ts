// Personagem em pixel art montado por partes, quadro a quadro, com contorno automático.

import { AURAS, CLOTH_COLORS, HAIR_COLORS, Look, SKINS } from '../data/items';
import type { Grid } from './PixelSprite';

export const CHAR_W = 28;
export const CHAR_H = 40;
const OUTLINE = '#170d22';
const EYE = '#1a1020';
const MOUTH = '#8a2f45';
const BLUSH = '#ff8fa3';
const PANTS = '#3b5bab';
const PANTS_SH = '#2b4382';
const SHOE = '#f4f2ee';
const SOLE = '#9b97a8';
const PHONE = '#2b2b3a';

type Arm = 'down' | 'relax' | 'up' | 'out' | 'pump' | 'flex';
type Leg = 'stand' | 'lift' | 'step' | 'float' | 'wide';
type Face = 'neutral' | 'happy' | 'focus';

interface Pose {
  arms: [Arm, Arm];
  legs: [Leg, Leg];
  bob: 0 | 1;
  face: Face;
}

const P = (a: Arm, b: Arm, l: Leg, r: Leg, bob: 0 | 1, face: Face): Pose => ({ arms: [a, b], legs: [l, r], bob, face });

export const POSES = {
  idle0: P('relax', 'relax', 'stand', 'stand', 0, 'neutral'),
  idle1: P('relax', 'relax', 'stand', 'lift', 0, 'neutral'),
  groove0: P('relax', 'relax', 'stand', 'stand', 1, 'neutral'),
  groove1: P('relax', 'relax', 'stand', 'lift', 0, 'happy'),
  groove2: P('relax', 'relax', 'stand', 'stand', 1, 'neutral'),
  groove3: P('relax', 'relax', 'lift', 'stand', 0, 'happy'),
  dance0: P('up', 'down', 'step', 'stand', 0, 'happy'),
  dance1: P('out', 'out', 'stand', 'stand', 1, 'happy'),
  dance2: P('down', 'up', 'stand', 'step', 0, 'happy'),
  dance3: P('pump', 'pump', 'stand', 'stand', 1, 'happy'),
  hype0: P('up', 'up', 'lift', 'lift', 0, 'happy'),
  hype1: P('out', 'out', 'wide', 'wide', 1, 'happy'),
  hype2: P('pump', 'flex', 'step', 'stand', 0, 'happy'),
  hype3: P('flex', 'pump', 'stand', 'step', 1, 'happy'),
  float: P('out', 'out', 'float', 'float', 0, 'happy'),
  power0: P('flex', 'flex', 'wide', 'wide', 0, 'focus'),
  power1: P('flex', 'flex', 'wide', 'wide', 1, 'focus'),
  cheer0: P('up', 'up', 'stand', 'stand', 0, 'happy'),
  cheer1: P('pump', 'pump', 'lift', 'lift', 1, 'happy'),
  still0: P('down', 'down', 'stand', 'stand', 0, 'neutral'),
  still1: P('down', 'down', 'stand', 'stand', 1, 'neutral'),
} satisfies Record<string, Pose>;

export type PoseName = keyof typeof POSES;

const HEADS: Record<Face, string[]> = {
  neutral: [
    '..HHHHHH..',
    '.HHHHHHHHH',
    'HHHHHHHHHH',
    'HHSHHSSSHH',
    'HSSSSSSSSH',
    'HSESSSSESH',
    'SSESSSSESS',
    'SSSSSSSSSS',
    '.SSSMMSSS.',
    '..SSSSSS..',
  ],
  happy: [
    '..HHHHHH..',
    '.HHHHHHHHH',
    'HHHHHHHHHH',
    'HHSHHSSSHH',
    'HSSSSSSSSH',
    'HSSSSSSSSH',
    'SEESSSSEES',
    'SBSSSSSSBS',
    '.SSMMMMSS.',
    '..SSMMSS..',
  ],
  focus: [
    '..HHHHHH..',
    '.HHHHHHHHH',
    'HHHHHHHHHH',
    'HHSHHSSSHH',
    'HEESSSSEEH',
    'HSESSSSESH',
    'SSESSSSESS',
    'SSSSSSSSSS',
    '.SSMMMMSS.',
    '..SSSSSS..',
  ],
};

const STEPS: Record<string, [number, number]> = {
  D: [0, 1],
  U: [0, -1],
  L: [-1, 0],
  R: [1, 0],
  UL: [-1, -1],
  DL: [-1, 1],
};

const ARMS: Record<Arm, string[]> = {
  down: ['D', 'D', 'D', 'D', 'D', 'D', 'D'],
  relax: ['D', 'D', 'D', 'DL', 'D', 'D'],
  up: ['UL', 'U', 'U', 'U', 'U', 'U', 'U'],
  out: ['L', 'L', 'L', 'L', 'L'],
  pump: ['UL', 'UL', 'U', 'U', 'U'],
  flex: ['L', 'L', 'L', 'U', 'U', 'U'],
};

export interface ResolvedLook {
  skin: string;
  skinSh: string;
  hair: string;
  cloth: string;
  clothSh: string;
  accent: string;
  outfit: Look['outfit'];
  hairStyle: Look['hairStyle'];
  phones: boolean;
}

export function resolveLook(look: Look): ResolvedLook {
  const skin = SKINS.find((s) => s.id === look.skin) ?? SKINS[0];
  const cloth = CLOTH_COLORS.find((c) => c.id === look.outfitColor) ?? CLOTH_COLORS[0];
  const hair = HAIR_COLORS.find((h) => h.id === look.hair) ?? HAIR_COLORS[0];
  const aura = AURAS.find((a) => a.id === look.aura) ?? AURAS[0];
  return {
    skin: skin.main,
    skinSh: skin.shade,
    hair: hair.main,
    cloth: cloth.main,
    clothSh: cloth.shade,
    accent: aura.outer,
    outfit: look.outfit,
    hairStyle: look.hairStyle,
    phones: look.accessory === 'fones',
  };
}

const cache = new Map<string, Grid>();

export function buildCharacter(poseName: PoseName, look: ResolvedLook): Grid {
  const key = poseName + JSON.stringify(look);
  const hit = cache.get(key);
  if (hit) return hit;

  const pose = POSES[poseName];
  const g: Grid = Array.from({ length: CHAR_H }, () => Array<string | null>(CHAR_W).fill(null));
  const put = (x: number, y: number, c: string) => {
    if (x >= 1 && y >= 1 && x < CHAR_W - 1 && y < CHAR_H - 1) g[y][x] = c;
  };
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c);
  };
  const mirror = (x: number, w: number) => CHAR_W - x - w;
  const both = (x: number, y: number, w: number, h: number, c: string) => {
    rect(x, y, w, h, c);
    rect(mirror(x, w), y, w, h, c);
  };

  const b = pose.bob;
  const hoodie = look.outfit === 'moletom';
  const tL = hoodie ? 9 : 10; // borda esquerda do tronco
  const tW = CHAR_W - 2 * tL;
  const lift = pose.legs[0] === 'lift' && pose.legs[1] === 'lift' ? -1 : 0; // pulinho

  // Cabelo de trás
  if (look.hairStyle === 'cacheado') {
    rect(8, 1 + b + lift, 12, 7, look.hair);
    rect(7, 3 + b + lift, 14, 4, look.hair);
  } else if (look.hairStyle === 'longo') {
    rect(8, 5 + b + lift, 12, 10, look.hair);
  }

  // Pernas
  const legs = (side: 0 | 1, leg: Leg) => {
    const L = (x: number, y: number, w: number, h: number, c: string) =>
      side === 0 ? rect(x, y + lift, w, h, c) : rect(mirror(x, w), y + lift, w, h, c);
    switch (leg) {
      case 'stand':
        L(10, 25, 3, 8, PANTS);
        L(9, 33, 4, 1, SHOE);
        L(9, 34, 4, 1, SOLE);
        break;
      case 'lift':
        L(10, 25, 3, 7, PANTS);
        L(9, 32, 4, 1, SHOE);
        L(9, 33, 4, 1, SOLE);
        break;
      case 'step':
        L(10, 25, 3, 4, PANTS);
        L(9, 29, 3, 4, PANTS);
        L(8, 33, 4, 1, SHOE);
        L(8, 34, 4, 1, SOLE);
        break;
      case 'wide':
        L(10, 25, 3, 4, PANTS);
        L(8, 29, 3, 4, PANTS);
        L(7, 33, 4, 1, SHOE);
        L(7, 34, 4, 1, SOLE);
        break;
      case 'float':
        L(11, 25, 3, 9, PANTS);
        L(11, 34, 3, 1, SHOE);
        L(12, 35, 2, 1, SOLE);
        break;
    }
  };
  legs(0, pose.legs[0]);
  legs(1, pose.legs[1]);
  rect(10, 23 + lift, 8, 2, PANTS);
  rect(13, 24 + lift, 2, 1, PANTS_SH);

  const y0 = b + lift; // deslocamento da parte de cima

  // Capuz atrás do pescoço
  if (hoodie) rect(9, 11 + y0, 10, 3, look.clothSh);

  // Tronco
  const tH = hoodie ? 10 : 9;
  rect(tL, 14 + y0, tW, tH, look.cloth);
  rect(tL, 14 + y0 + tH - 1, tW, 1, look.clothSh);
  rect(tL + tW - 1, 14 + y0, 1, tH, look.clothSh);
  if (hoodie) {
    rect(11, 19 + y0, 6, 3, look.clothSh);
    rect(12, 15 + y0, 1, 3, '#f4f2ee');
    rect(15, 15 + y0, 1, 3, '#f4f2ee');
  } else {
    // gola e emblema com a cor da aura
    rect(12, 14 + y0, 4, 1, look.skinSh);
    put(15, 16 + y0, look.accent);
    rect(14, 17 + y0, 3, 1, look.accent);
    put(15, 18 + y0, look.accent);
  }

  // Braços: blocos 2x2 seguindo passos a partir do ombro
  const sleeveLen = hoodie ? 99 : 2;
  const arm = (side: 0 | 1, a: Arm) => {
    const steps = ARMS[a];
    let x = tL - 2;
    let y = 14 + y0;
    const blocks: [number, number][] = [[x, y]];
    for (const s of steps) {
      const [dx, dy] = STEPS[s];
      x += dx;
      y += dy;
      blocks.push([x, y]);
    }
    blocks.forEach(([bx, by], i) => {
      const isHand = i === blocks.length - 1;
      const c = isHand ? look.skin : i < sleeveLen || (hoodie && !isHand) ? look.cloth : look.skin;
      const fx = side === 0 ? bx : mirror(bx, 2);
      rect(fx, by, 2, 2, c);
    });
  };

  // Pescoço e cabeça
  rect(12, 13 + y0, 4, 1, look.skinSh);
  const head = HEADS[pose.face];
  head.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      let c: string | null = null;
      if (ch === 'H') c = look.hair;
      else if (ch === 'S') c = look.skin;
      else if (ch === 'E') c = EYE;
      else if (ch === 'M') c = MOUTH;
      else if (ch === 'B') c = BLUSH;
      if (look.hairStyle === 'raspado' && ch === 'H' && j >= 2) c = look.skin;
      if (c) put(9 + i, 3 + y0 + j, c);
    }
  });

  if (look.phones) {
    rect(10, 2 + y0, 8, 1, PHONE);
    both(9, 3 + y0, 1, 1, PHONE);
    both(8, 4 + y0, 1, 2, PHONE);
    both(7, 6 + y0, 3, 4, PHONE);
    both(7, 7 + y0, 1, 2, look.accent);
  }

  arm(0, pose.arms[0]);
  arm(1, pose.arms[1]);

  // Contorno nítido
  const filled = g.map((row) => row.map((c) => c !== null));
  for (let y = 0; y < CHAR_H; y++)
    for (let x = 0; x < CHAR_W; x++) {
      if (filled[y][x]) continue;
      if (
        (y > 0 && filled[y - 1][x]) ||
        (y < CHAR_H - 1 && filled[y + 1][x]) ||
        (x > 0 && filled[y][x - 1]) ||
        (x < CHAR_W - 1 && filled[y][x + 1])
      )
        g[y][x] = OUTLINE;
    }

  cache.set(key, g);
  return g;
}

// ---------- Aura ----------

export const AURA_W = 46;
export const AURA_H = 52;

const auraCache = new Map<string, Grid>();
const hash = (a: number, b: number) => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Chama de aura em pixel art; `level` de 0 a 4 (tamanho), `frame` de 0 a 3. */
export function buildAura(level: number, frame: number, outer: string, inner: string, core: string): Grid {
  const key = `${level}|${frame}|${outer}|${inner}|${core}`;
  const hit = auraCache.get(key);
  if (hit) return hit;
  const g: Grid = Array.from({ length: AURA_H }, () => Array<string | null>(AURA_W).fill(null));
  const cx = (AURA_W - 1) / 2;
  const bottom = AURA_H - 5;
  const k = level / 4;
  const layers: [number, number, string][] = [
    [1, 1, outer],
    [0.78, 0.8, inner],
    [0.5, 0.55, core],
  ];
  for (const [ws, hs, color] of layers) {
    const halfW = (9 + 12 * k) * ws;
    for (let x = 0; x < AURA_W; x++) {
      const dx = Math.abs(x - cx) / halfW;
      if (dx >= 1) continue;
      const flick = hash(x, frame) * (2 + 5 * k);
      const tongue = hash(x * 3, frame + 7) > 0.82 ? 3 + 5 * k : 0;
      const h = (22 + 22 * k) * hs * (1 - Math.pow(dx, 1.8)) + flick + tongue;
      const top = Math.max(1, Math.round(bottom - h));
      const foot = dx > 0.55 ? bottom - 3 : bottom;
      for (let y = top; y <= foot; y++) g[y][x] = color;
    }
  }
  auraCache.set(key, g);
  return g;
}
