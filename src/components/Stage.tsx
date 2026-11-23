import React, { useMemo } from 'react';
import { View } from 'react-native';
import { LevelId, Look } from '../data/items';
import { AURA_W, CHAR_W, PoseName, resolveLook } from '../pixel/character';
import { PixelScene } from '../pixel/PixelSprite';
import { CLASSMATES, GROUND_Y, SCENE_H, SCENE_W, sceneRects } from '../pixel/scenes';
import { BUDDY_LOOKS, Buddy, FEET_ROW, Hero } from './Hero';

export function heroScaleFor(width: number, height: number) {
  const byH = Math.floor((height * 0.55) / 38);
  const byW = Math.floor((width * 0.8) / AURA_W);
  return Math.max(2, Math.min(9, byH, byW));
}

/** Cenário + colegas + personagem principal. */
export function Stage({
  level,
  width,
  height,
  look,
  pose,
  aura,
  time,
  beat,
  lift = 0,
  cheer = false,
  children,
}: {
  level: LevelId;
  width: number;
  height: number;
  look: Look;
  pose: PoseName;
  aura: number;
  time: number;
  beat: number;
  lift?: number;
  cheer?: boolean;
  children?: React.ReactNode;
}) {
  const rects = sceneRects(level);
  const s = Math.max(width / SCENE_W, height / SCENE_H);
  const groundY = height - (SCENE_H - GROUND_Y[level]) * s;
  const hs = heroScaleFor(width, height);
  const bs = Math.max(1, Math.round(hs * 0.62));
  const buddies = useMemo(() => BUDDY_LOOKS.map(resolveLook), []);

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 0, top: 0 }}>
        <PixelScene rects={rects} w={SCENE_W} h={SCENE_H} width={width} height={height} />
      </View>
      {CLASSMATES[level].map((p, i) => {
        const frac = p.x / SCENE_W;
        const cx = width * (0.08 + frac * 0.84);
        const half = Math.floor(beat * (cheer ? 2 : 1) + i) % 2;
        const bp: PoseName = cheer ? (half ? 'cheer1' : 'cheer0') : half ? 'still1' : 'still0';
        return (
          <View key={i} style={{ position: 'absolute', left: cx - (CHAR_W * bs) / 2, top: groundY - 36 * bs }} pointerEvents="none">
            <Buddy look={buddies[p.look]} pose={bp} scale={bs} />
          </View>
        );
      })}
      <View style={{ position: 'absolute', left: width / 2 - (AURA_W * hs) / 2, top: groundY - FEET_ROW * hs }} pointerEvents="none">
        <Hero look={look} pose={pose} scale={hs} aura={aura} time={time} lift={lift} />
      </View>
      {children}
    </View>
  );
}
