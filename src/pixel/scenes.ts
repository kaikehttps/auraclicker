// Cenários em pixel art de baixa resolução (160x90), inspirados numa escola técnica brasileira.

import type { LevelId } from '../data/items';
import type { PxRect } from './PixelSprite';

export const SCENE_W = 160;
export const SCENE_H = 90;
/** Linha do chão onde os personagens pisam (coordenada y da cena). */
export const GROUND_Y: Record<LevelId, number> = { patio: 80, lab: 82, festival: 80, palco: 74 };

export interface ExtraPerson {
  x: number; // coordenada x da cena
  look: number; // índice do visual de colega
  flip?: boolean;
}

/** Posição dos colegas em cada cenário. */
export const CLASSMATES: Record<LevelId, ExtraPerson[]> = {
  patio: [{ x: 26, look: 0 }, { x: 136, look: 1 }],
  lab: [{ x: 22, look: 2 }, { x: 140, look: 3 }],
  festival: [{ x: 18, look: 4 }, { x: 40, look: 1 }, { x: 122, look: 0 }, { x: 144, look: 5 }],
  palco: [{ x: 16, look: 2 }, { x: 38, look: 4 }, { x: 124, look: 3 }, { x: 146, look: 5 }],
};

const FONT: Record<string, string[]> = {
  E: ['111', '100', '110', '100', '111'],
  P: ['110', '101', '110', '100', '100'],
  F: ['111', '100', '110', '100', '100'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  I: ['111', '010', '010', '010', '111'],
  V: ['101', '101', '101', '101', '010'],
  A: ['010', '101', '111', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  B: ['110', '101', '110', '101', '110'],
  '<': ['001', '010', '100', '010', '001'],
  '>': ['100', '010', '001', '010', '100'],
  '/': ['001', '001', '010', '100', '100'],
  ' ': ['000', '000', '000', '000', '000'],
};

class Painter {
  rects: PxRect[] = [];
  r(x: number, y: number, w: number, h: number, c: string, o?: number) {
    this.rects.push({ x, y, w, h, c, o });
  }
  circle(cx: number, cy: number, rad: number, c: string, o?: number) {
    for (let y = -rad; y <= rad; y++) {
      const half = Math.floor(Math.sqrt(rad * rad - y * y));
      this.r(cx - half, cy + y, half * 2 + 1, 1, c, o);
    }
  }
  bands(y0: number, h: number, colors: string[]) {
    const bh = h / colors.length;
    colors.forEach((c, i) => this.r(0, Math.round(y0 + i * bh), SCENE_W, Math.ceil(bh) + 1, c));
  }
  text(x: number, y: number, s: string, c: string) {
    for (const ch of s) {
      const glyph = FONT[ch];
      if (glyph)
        glyph.forEach((row, j) => {
          for (let i = 0; i < 3; i++) if (row[i] === '1') this.r(x + i, y + j, 1, 1, c);
        });
      x += 4;
    }
  }
  stars(n: number, maxY: number, seed: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.sin(i * 91.7 + seed) * 10000;
      const b = Math.sin(i * 37.3 + seed * 2) * 10000;
      this.r(Math.floor((a - Math.floor(a)) * SCENE_W), Math.floor((b - Math.floor(b)) * maxY), 1, 1, '#fff6d8', 0.5 + (i % 3) * 0.2);
    }
  }
  tree(x: number, ground: number, lit: string) {
    this.r(x + 8, ground - 22, 4, 22, '#5b3a26');
    this.r(x + 11, ground - 22, 1, 22, '#3f281a');
    this.circle(x + 10, ground - 30, 11, '#2f6b3a');
    this.circle(x + 6, ground - 34, 7, '#3f8a46');
    this.circle(x + 14, ground - 27, 7, '#3f8a46');
    this.circle(x + 15, ground - 35, 4, lit);
  }
}

function patio(): PxRect[] {
  const p = new Painter();
  p.bands(0, 64, ['#2a1b4f', '#43226a', '#6b2c78', '#9a3b74', '#c95468', '#ee7a5a', '#fb9f5b', '#ffc46b']);
  p.circle(124, 50, 10, '#ffd88a');
  p.circle(124, 50, 7, '#fff0bd');
  p.r(18, 14, 26, 3, '#f59a8a', 0.8);
  p.r(24, 11, 14, 3, '#f59a8a', 0.8);
  p.r(96, 20, 30, 2, '#ffb48a', 0.7);
  p.r(104, 17, 14, 3, '#ffb48a', 0.7);
  p.r(0, 52, SCENE_W, 12, '#6a2f63');
  // prédio da escola
  p.r(24, 30, 112, 2, '#8b7b6b');
  p.r(26, 32, 108, 40, '#efe6d2');
  p.r(26, 38, 108, 4, '#2e8b57');
  p.r(26, 62, 108, 10, '#d8ccb3');
  p.r(130, 32, 4, 40, '#d6c9ae');
  for (const wx of [32, 48, 102, 118]) {
    p.r(wx - 1, 46, 11, 10, '#7d6f5f');
    p.r(wx, 47, 9, 8, '#38457a');
    p.r(wx + 5, 48, 3, 2, '#f6a25a');
    p.r(wx + 4, 50, 2, 1, '#f6a25a');
  }
  // placa EEEP
  p.r(64, 33, 32, 11, '#1f6e43');
  p.r(65, 34, 30, 9, '#2e8b57');
  p.text(73, 36, 'EEEP', '#fff6d8');
  // portão
  p.r(72, 52, 16, 20, '#5a3d2b');
  p.r(74, 54, 5, 16, '#7a5a40');
  p.r(81, 54, 5, 16, '#7a5a40');
  p.tree(-2, 72, '#9aa84a');
  p.tree(140, 72, '#c3a44a');
  // banco
  p.r(46, 66, 18, 2, '#8b5a3c');
  p.r(47, 68, 2, 4, '#5b3a26');
  p.r(61, 68, 2, 4, '#5b3a26');
  // chão do pátio
  p.r(0, 72, SCENE_W, 18, '#b98d6a');
  p.r(0, 72, SCENE_W, 1, '#8f6a4f');
  for (let y = 78; y < 90; y += 6) p.r(0, y, SCENE_W, 1, '#a77c5c');
  for (let x = 4; x < SCENE_W; x += 14) p.r(x, 73, 1, 17, '#a77c5c');
  p.r(0, 84, SCENE_W, 6, '#f6a25a', 0.12);
  return p.rects;
}

function lab(): PxRect[] {
  const p = new Painter();
  p.r(0, 0, SCENE_W, 66, '#1d2340');
  p.r(0, 50, SCENE_W, 16, '#262d52');
  p.r(0, 0, SCENE_W, 3, '#141832');
  // janela
  p.r(10, 6, 42, 34, '#3c4570');
  p.r(12, 8, 38, 30, '#0d1330');
  for (let i = 0; i < 14; i++) p.r(13 + ((i * 11) % 36), 9 + ((i * 7) % 26), 1, 1, '#fff6d8', 0.7);
  p.circle(42, 15, 4, '#f2f0d0');
  p.circle(44, 14, 3, '#0d1330');
  p.r(30, 8, 2, 30, '#3c4570');
  p.r(12, 22, 38, 2, '#3c4570');
  // quadro branco
  p.r(62, 8, 58, 28, '#8a93a8');
  p.r(64, 10, 54, 24, '#dfe7ef');
  p.text(70, 14, '</>', '#3f6fe0');
  p.r(86, 15, 24, 1, '#e0434f');
  p.r(86, 19, 18, 1, '#2e8b57');
  p.r(70, 24, 34, 1, '#3f6fe0');
  p.r(70, 28, 22, 1, '#9aa4b8');
  // cartaz
  p.r(126, 12, 24, 26, '#ffd23f');
  p.r(128, 14, 20, 22, '#ffe58a');
  p.text(132, 17, 'LAB', '#2b2f3f');
  p.r(131, 26, 14, 2, '#e0434f');
  p.r(131, 30, 10, 2, '#3f6fe0');
  // bancadas com computadores
  const monitor = (x: number, y: number, s: number) => {
    p.r(x - 3, y - 3, 14 * s + 6, 10 * s + 6, '#3ee6ff', 0.1);
    p.r(x, y, 14 * s, 10 * s, '#2b2f3f');
    p.r(x + s, y + s, 12 * s, 8 * s, '#1fa9c9');
    for (let k = 0; k < 3; k++) p.r(x + 2 * s, y + (2 + k * 2) * s, (4 + ((x + k * 5) % 7)) * s, s, '#a8f4ff');
    p.r(x + 6 * s, y + 10 * s, 2 * s, 2 * s, '#2b2f3f');
  };
  for (let x = 4; x < SCENE_W; x += 26) monitor(x, 40, 1);
  p.r(0, 52, SCENE_W, 4, '#6b4f3a');
  p.r(0, 56, SCENE_W, 2, '#4a3628');
  // chão
  p.r(0, 66, SCENE_W, 24, '#2a3050');
  for (let y = 70; y < 90; y += 5) p.r(0, y, SCENE_W, 1, '#323a60');
  for (let x = 0; x < SCENE_W; x += 12) p.r(x, 66, 1, 24, '#323a60');
  p.r(40, 66, 80, 24, '#3ee6ff', 0.05);
  return p.rects;
}

const FLAG_COLORS = ['#ff5d73', '#ffd23f', '#45e08a', '#4fb3ff', '#ff8a3d', '#b56bff'];

function bunting(p: Painter, y: number, sag: number, offset: number) {
  for (let x = 0; x < SCENE_W; x += 2) {
    const yy = y + Math.round(Math.sin((x / SCENE_W) * Math.PI * 2) * sag);
    p.r(x, yy, 2, 1, '#3a2a2a');
    if ((x + offset) % 8 === 0) {
      const c = FLAG_COLORS[((x + offset) / 8) % FLAG_COLORS.length];
      p.r(x, yy + 1, 5, 1, c);
      p.r(x + 1, yy + 2, 3, 1, c);
      p.r(x + 2, yy + 3, 1, 1, c);
    }
  }
}

function festival(): PxRect[] {
  const p = new Painter();
  p.bands(0, 60, ['#141a4a', '#1b1d58', '#252066', '#332473', '#43287c', '#562d84', '#6e358a']);
  p.stars(30, 30, 3);
  p.r(0, 44, SCENE_W, 20, '#2a1f55');
  p.r(20, 38, 40, 8, '#2a1f55');
  p.r(108, 40, 36, 6, '#2a1f55');
  // palco ao fundo
  p.r(56, 42, 48, 22, '#4a2a5a');
  p.r(58, 44, 44, 16, '#6a1030');
  p.r(56, 60, 48, 4, '#2b1a14');
  for (let i = 0; i < 6; i++) p.r(60 + i * 8, 44, 2, 2, FLAG_COLORS[i]);
  // barracas
  const stall = (x: number, roof: string) => {
    p.r(x, 52, 2, 20, '#6b4a30');
    p.r(x + 34, 52, 2, 20, '#6b4a30');
    for (let i = 0; i < 9; i++) p.r(x - 2 + i * 4, 44, 4, 8, i % 2 ? '#f4f2ee' : roof);
    p.r(x - 2, 52, 40, 1, '#2b1a14');
    p.r(x + 2, 62, 32, 10, '#8b5a3c');
    p.r(x + 2, 62, 32, 2, '#a8704a');
    p.r(x + 6, 58, 4, 4, '#ffd23f');
    p.r(x + 14, 57, 5, 5, '#ff8a3d');
    p.r(x + 24, 58, 4, 4, '#f4f2ee');
    p.r(x - 4, 52, 44, 20, '#ffd23f', 0.06);
  };
  stall(4, '#e0434f');
  stall(120, '#3f6fe0');
  bunting(p, 10, 4, 0);
  bunting(p, 24, 3, 4);
  // lâmpadas
  for (let x = 6; x < SCENE_W; x += 12) {
    const y = 34 + Math.round(Math.sin(x / 20) * 2);
    p.r(x - 1, y - 1, 3, 3, '#ffe58a', 0.25);
    p.r(x, y, 1, 1, '#fff6d8');
  }
  // chão de terra batida
  p.r(0, 72, SCENE_W, 18, '#7a4f35');
  p.r(0, 72, SCENE_W, 1, '#5a3a26');
  for (let i = 0; i < 30; i++) p.r((i * 37) % SCENE_W, 74 + ((i * 13) % 15), 2, 1, '#8d5e40');
  p.r(30, 72, 100, 18, '#ffd23f', 0.05);
  return p.rects;
}

function palco(): PxRect[] {
  const p = new Painter();
  p.r(0, 0, SCENE_W, SCENE_H, '#0e0820');
  // cortina
  p.r(0, 0, SCENE_W, 64, '#6a1030');
  for (let x = 2; x < SCENE_W; x += 8) p.r(x, 0, 2, 64, '#4e0a24');
  for (let x = 5; x < SCENE_W; x += 8) p.r(x, 0, 1, 64, '#8a1a3e');
  p.r(0, 0, SCENE_W, 7, '#8a1a3e');
  for (let x = 0; x < SCENE_W; x += 10) p.r(x + 2, 7, 6, 2, '#8a1a3e');
  // faixa
  p.r(44, 14, 72, 13, '#b8860b');
  p.r(45, 15, 70, 11, '#ffd23f');
  p.text(54, 18, 'FESTIVAL EEEP', '#3a1020');
  // canhões de luz
  for (let i = 0; i < 18; i++) {
    const w = 4 + i * 2;
    p.r(26 - i, 4 + i * 4, w, 4, '#fff3b0', 0.07);
    p.r(134 - i * 1 - w + i + 4, 4 + i * 4, w, 4, '#fff3b0', 0.07);
  }
  // caixas de som
  const speaker = (x: number) => {
    p.r(x, 40, 18, 32, '#1c1c28');
    p.circle(x + 9, 50, 5, '#2e2e40');
    p.circle(x + 9, 50, 2, '#0e0e16');
    p.circle(x + 9, 63, 4, '#2e2e40');
    p.circle(x + 9, 63, 1, '#0e0e16');
  };
  speaker(2);
  speaker(140);
  // piso do palco
  p.r(0, 64, SCENE_W, 12, '#5b3a2a');
  for (let y = 67; y < 76; y += 3) p.r(0, y, SCENE_W, 1, '#4a2e20');
  p.r(0, 76, SCENE_W, 4, '#2b1a14');
  for (let x = 4; x < SCENE_W; x += 10) p.r(x, 77, 2, 2, FLAG_COLORS[(x / 10) % FLAG_COLORS.length | 0]);
  // plateia
  p.r(0, 80, SCENE_W, 10, '#140c26');
  for (let x = -2; x < SCENE_W; x += 7) {
    const y = 81 + ((x * 3) % 4);
    p.circle(x + 3, y + 2, 3, '#1f1438');
    p.r(x, y + 4, 7, 6, '#1f1438');
  }
  p.r(40, 64, 80, 12, '#fff3b0', 0.08);
  return p.rects;
}

const cache = new Map<LevelId, PxRect[]>();
export function sceneRects(level: LevelId): PxRect[] {
  let r = cache.get(level);
  if (!r) {
    r = { patio, lab, festival, palco }[level]();
    cache.set(level, r);
  }
  return r;
}
