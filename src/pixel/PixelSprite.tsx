import React, { memo } from 'react';
import Svg, { Rect } from 'react-native-svg';

/** Grade de pixels: grid[y][x] = cor ou null (transparente). */
export type Grid = (string | null)[][];

export interface PxRect {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
  o?: number;
}

const runCache = new WeakMap<Grid, PxRect[]>();

/** Junta pixels vizinhos da mesma cor em retângulos (menos nós SVG). */
export function gridToRects(grid: Grid): PxRect[] {
  const hit = runCache.get(grid);
  if (hit) return hit;
  const rects: PxRect[] = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (!c) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === c) w++;
      rects.push({ x, y, w, h: 1, c });
      x += w;
    }
  }
  runCache.set(grid, rects);
  return rects;
}

const crisp = { shapeRendering: 'crispEdges' } as any;

export const PixelSprite = memo(function PixelSprite({
  grid,
  scale,
  opacity,
}: {
  grid: Grid;
  scale: number;
  opacity?: number;
}) {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const rects = gridToRects(grid);
  return (
    <Svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`} opacity={opacity} {...crisp}>
      {rects.map((r, i) => (
        <Rect key={i} x={r.x} y={r.y} width={r.w + 0.02} height={r.h + 0.02} fill={r.c} />
      ))}
    </Svg>
  );
});

/** Desenha uma lista de retângulos em baixa resolução esticada para preencher a área. */
export const PixelScene = memo(function PixelScene({
  rects,
  w,
  h,
  width,
  height,
}: {
  rects: PxRect[];
  w: number;
  h: number;
  width: number;
  height: number;
}) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMax slice" {...crisp}>
      {rects.map((r, i) => (
        <Rect key={i} x={r.x} y={r.y} width={r.w + 0.03} height={r.h + 0.03} fill={r.c} opacity={r.o} />
      ))}
    </Svg>
  );
});
