import React from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { audio } from '../audio/engine';
import { PxButton, PxText } from '../components/ui';
import { LevelId, LEVELS } from '../data/items';
import { PixelScene } from '../pixel/PixelSprite';
import { SCENE_H, SCENE_W, sceneRects } from '../pixel/scenes';
import { isUnlocked, SaveData } from '../save';
import { C } from '../theme';

export function LevelSelect({ save, onPick, onBack }: { save: SaveData; onPick: (l: LevelId) => void; onBack: () => void }) {
  const { width } = useWindowDimensions();
  const cols = width >= 760 ? 2 : 1;
  const cardW = Math.min(420, (Math.min(width, 900) - 32 - (cols - 1) * 16) / cols);
  const thumbH = Math.round((cardW - 6) * (SCENE_H / SCENE_W) * 0.62);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <PxButton label="< Voltar" small size={10} color={C.panel2} textColor={C.text} onPress={onBack} />
        <PxText size={10} color={C.gold}>
          Aura: {save.totalAura}
        </PxText>
      </View>
      <PxText size={18} style={styles.title}>
        Escolha a fase
      </PxText>
      <ScrollView contentContainerStyle={styles.grid}>
        {LEVELS.map((l) => {
          const open = isUnlocked(save, `level:${l.id}`);
          const best = save.best[l.id];
          return (
            <Pressable
              key={l.id}
              disabled={!open}
              accessibilityRole="button"
              accessibilityLabel={`${l.number}: ${l.name}`}
              onPress={() => {
                audio.unlock();
                audio.sfx('click');
                onPick(l.id);
              }}
              style={({ pressed }) => [
                styles.card,
                { width: cardW, transform: [{ translateY: pressed ? 3 : 0 }], borderColor: open ? C.ink : '#0b061488' },
              ]}
            >
              <View style={{ height: thumbH, overflow: 'hidden', opacity: open ? 1 : 0.35 }}>
                <PixelScene rects={sceneRects(l.id)} w={SCENE_W} h={SCENE_H} width={cardW - 6} height={thumbH} />
              </View>
              <View style={styles.cardBody}>
                <PxText size={9} color={l.id === 'palco' ? C.gold : C.cyan}>
                  {l.number}
                </PxText>
                <PxText size={13} style={{ marginTop: 6 }}>
                  {l.name}
                </PxText>
                <PxText size={8} color={C.dim} style={{ marginTop: 6 }}>
                  {l.subtitle}
                </PxText>
                {open ? (
                  <PxText size={8} color={C.green} style={{ marginTop: 10 }}>
                    {best ? `Recorde: ${best.aura} aura · combo ${best.combo}` : 'Novo! Toque para jogar'}
                  </PxText>
                ) : (
                  <PxText size={8} color={C.pink} style={{ marginTop: 10 }}>
                    Bloqueado: precisa de {l.unlockAt} de aura
                  </PxText>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { textAlign: 'center', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, padding: 16, paddingBottom: 40 },
  card: { backgroundColor: C.panel, borderWidth: 3 },
  cardBody: { padding: 12 },
});
