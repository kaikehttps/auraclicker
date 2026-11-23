import type { LaneSymbol } from '../theme';
import type { Grid } from './PixelSprite';

const SHAPES: Record<LaneSymbol, string[]> = {
  tri: ['...#...', '...#...', '..###..', '..###..', '.#####.', '.#####.', '#######'],
  circle: ['..###..', '.#####.', '#######', '#######', '#######', '.#####.', '..###..'],
  diamond: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
  square: ['#######', '#######', '##...##', '##...##', '##...##', '#######', '#######'],
};

const cache = new Map<string, Grid>();

export function symbolGrid(sym: LaneSymbol, color: string): Grid {
  const key = sym + color;
  let g = cache.get(key);
  if (!g) {
    g = SHAPES[sym].map((row) => [...row].map((ch) => (ch === '#' ? color : null)));
    cache.set(key, g);
  }
  return g;
}

const ARROW = ['#######', '.#####.', '..###..', '...#...'];

export function arrowGrid(color: string): Grid {
  const key = 'arrow' + color;
  let g = cache.get(key);
  if (!g) {
    g = ARROW.map((row) => [...row].map((ch) => (ch === '#' ? color : null)));
    cache.set(key, g);
  }
  return g;
}
