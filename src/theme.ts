export const FONT = 'PressStart2P_400Regular';

export const C = {
  bg: '#140c24',
  panel: '#22163d',
  panel2: '#2e2052',
  ink: '#0b0614',
  outline: '#170d22',
  text: '#fff4e0',
  dim: '#a99cc8',
  gold: '#ffd23f',
  pink: '#ff5d8f',
  cyan: '#3ee6ff',
  green: '#57e389',
  red: '#ff4d5e',
  lock: '#5b5075',
};

export type LaneSymbol = 'tri' | 'circle' | 'diamond' | 'square';

export const LANES: { key: string; code: string; color: string; dark: string; symbol: LaneSymbol }[] = [
  { key: 'D', code: 'KeyD', color: '#ff5d73', dark: '#8f2236', symbol: 'tri' },
  { key: 'F', code: 'KeyF', color: '#ffd23f', dark: '#8a6a0b', symbol: 'circle' },
  { key: 'J', code: 'KeyJ', color: '#45e08a', dark: '#16703d', symbol: 'diamond' },
  { key: 'K', code: 'KeyK', color: '#4fb3ff', dark: '#1a4f86', symbol: 'square' },
];
