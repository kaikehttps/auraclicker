import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { AURAS, Look } from '../data/items';
import { AURA_H, AURA_W, buildAura, buildCharacter, CHAR_W, PoseName, ResolvedLook, resolveLook } from '../pixel/character';
import { PixelSprite } from '../pixel/PixelSprite';

const GOLD_OUTER = ['#ffb300', '#ff9500', '#ffc928', '#ff9f1a'];
const GOLD_INNER = ['#fff4a8', '#ffe066', '#fffbe0', '#ffe680'];

/** Linha (em pixels da grade da aura) onde ficam os pés. */
export const FEET_ROW = 48;
const CHAR_TOP = FEET_ROW - 35;

const Body = memo(function Body({ pose, look, scale }: { pose: PoseName; look: ResolvedLook; scale: number }) {
  return <PixelSprite grid={buildCharacter(pose, look)} scale={scale} />;
});

const AuraFlame = memo(function AuraFlame({
  level,
  frame,
  outer,
  inner,
  scale,
}: {
  level: number;
  frame: number;
  outer: string;
  inner: string;
  scale: number;
}) {
  return <PixelSprite grid={buildAura(level, frame, outer, inner, '#ffffff')} scale={scale} opacity={0.55 + level * 0.08} />;
});

/**
 * Personagem com aura animada e partículas.
 * `aura` vai de 0 (só um brilho) a 4 (aura máxima). `time` em segundos guia a animação.
 */
export function Hero({
  look,
  pose,
  scale,
  aura,
  time,
  lift = 0,
  particles = 6,
}: {
  look: Look;
  pose: PoseName;
  scale: number;
  aura: number;
  time: number;
  lift?: number; // levitação em pixels da grade
  particles?: number;
}) {
  const resolved = useMemo(() => resolveLook(look), [look]);
  const def = AURAS.find((a) => a.id === look.aura) ?? AURAS[0];
  const gold = look.aura === 'dourada';
  const frame = Math.floor(time * (6 + aura * 2)) % 4;
  const outer = gold ? GOLD_OUTER[frame] : def.outer;
  const inner = gold ? GOLD_INNER[frame] : def.inner;
  const level = Math.max(0, Math.min(4, Math.round(aura)));

  const w = AURA_W * scale;
  const h = AURA_H * scale;
  const feetY = FEET_ROW * scale;

  const dots: React.ReactNode[] = [];
  const count = Math.round(particles * (0.5 + aura / 2)) + (gold ? 4 : 0);
  for (let i = 0; i < count; i++) {
    const speed = 0.35 + ((i * 0.37) % 0.4);
    const phase = (time * speed + i * 0.618) % 1;
    const spread = (10 + aura * 3) * scale;
    const x = w / 2 + Math.sin(i * 12.3) * spread + Math.sin(time * 2 + i) * scale * 2;
    const y = feetY - phase * (30 + aura * 6) * scale;
    const size = scale * (i % 3 === 0 ? 2 : 1);
    const sparkle = gold && i % 4 === 0;
    dots.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          left: Math.round(x / scale) * scale,
          top: Math.round(y / scale) * scale,
          width: size,
          height: size,
          backgroundColor: sparkle ? '#ffffff' : i % 2 ? outer : inner,
          opacity: 1 - phase,
        }}
      />,
    );
  }

  return (
    <View style={{ width: w, height: h, transform: [{ translateY: -Math.round(lift) * scale }] }} pointerEvents="none">
      <View style={{ position: 'absolute', left: 0, top: 0 }}>
        <AuraFlame level={level} frame={frame} outer={outer} inner={inner} scale={scale} />
      </View>
      <View style={{ position: 'absolute', left: ((AURA_W - CHAR_W) / 2) * scale, top: CHAR_TOP * scale }}>
        <Body pose={pose} look={resolved} scale={scale} />
      </View>
      {dots}
    </View>
  );
}

/** Colega de turma (sem aura). */
export const Buddy = memo(function Buddy({ look, pose, scale }: { look: ResolvedLook; pose: PoseName; scale: number }) {
  return <PixelSprite grid={buildCharacter(pose, look)} scale={scale} />;
});

export const BUDDY_LOOKS: Look[] = [
  { outfit: 'camiseta', outfitColor: 'verde', accessory: 'nenhum', aura: 'azul', skin: 'p4', hair: 'preto', hairStyle: 'cacheado' },
  { outfit: 'moletom', outfitColor: 'cinza', accessory: 'nenhum', aura: 'verde', skin: 'p1', hair: 'loiro', hairStyle: 'longo' },
  { outfit: 'camiseta', outfitColor: 'azul', accessory: 'fones', aura: 'roxa', skin: 'p2', hair: 'castanho', hairStyle: 'curto' },
  { outfit: 'moletom', outfitColor: 'roxo', accessory: 'nenhum', aura: 'azul', skin: 'p5', hair: 'preto', hairStyle: 'raspado' },
  { outfit: 'camiseta', outfitColor: 'amarelo', accessory: 'nenhum', aura: 'roxa', skin: 'p3', hair: 'ruivo', hairStyle: 'longo' },
  { outfit: 'camiseta', outfitColor: 'vermelho', accessory: 'fones', aura: 'verde', skin: 'p2', hair: 'rosa', hairStyle: 'cacheado' },
].map((l) => l as Look);
