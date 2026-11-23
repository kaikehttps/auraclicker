import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { audio } from '../audio/engine';
import { Stage } from '../components/Stage';
import { PxButton, PxText, useTicker } from '../components/ui';
import { GOLD_ITEM, itemName, LEVELS, REWARDS } from '../data/items';
import { nextReward, SaveData } from '../save';
import { C } from '../theme';
import type { GameResult } from './Game';

export function Results({
  result,
  fresh,
  save,
  onRetry,
  onCustomize,
  onMenu,
}: {
  result: GameResult;
  fresh: string[];
  save: SaveData;
  onRetry: () => void;
  onCustomize: () => void;
  onMenu: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const time = useTicker(12);
  const beat = (time * 110) / 60;
  const landscape = width >= height * 1.05 && width >= 640;
  const level = LEVELS.find((l) => l.id === result.level)!;
  const next = nextReward(save.totalAura);
  const goldOwned = save.unlocked.includes(GOLD_ITEM);
  const total = result.perfect + result.good + result.miss;
  const accuracy = total ? Math.round(((result.perfect + result.good * 0.6) / total) * 100) : 0;

  useEffect(() => {
    if (fresh.length) setTimeout(() => audio.sfx('unlock'), 300);
  }, [fresh.length]);

  let nextText: string;
  let nextProgress = 1;
  if (next) {
    const prevAt = [...REWARDS].reverse().find((r) => r.at <= save.totalAura)?.at ?? 0;
    nextProgress = (save.totalAura - prevAt) / Math.max(1, next.at - prevAt);
    nextText = `Faltam ${next.at - save.totalAura} de aura para: ${next.title}`;
  } else if (!goldOwned) {
    nextText = 'Próxima recompensa: aura dourada animada! Alcance a Aura Máxima no Desafio final.';
  } else {
    nextText = 'Você liberou tudo! Continue farmando aura e bata seus recordes.';
  }

  const stageW = landscape ? width - 460 : width;
  const stageH = landscape ? height : Math.round(height * 0.3);

  return (
    <View style={[styles.root, { flexDirection: landscape ? 'row' : 'column' }]}>
      <Stage
        level={result.level}
        width={stageW}
        height={stageH}
        look={save.look}
        pose={(['dance0', 'dance1', 'dance2', 'dance3'] as const)[Math.floor(beat) % 4]}
        aura={result.auraMax ? 4 : 2}
        time={time}
        beat={beat}
        cheer={result.auraMax}
      />
      <ScrollView style={landscape ? { width: 460 } : { flex: 1 }} contentContainerStyle={styles.panel}>
        <PxText size={9} color={C.dim}>
          {level.number} · {level.name}
        </PxText>
        <PxText size={18} color={C.gold} style={{ marginTop: 8 }}>
          Fim da fase!
        </PxText>

        <View style={styles.big}>
          <PxText size={9} color={C.dim}>
            Aura ganha
          </PxText>
          <PxText size={26} color={C.gold} style={{ marginTop: 6 }}>
            +{result.aura}
          </PxText>
          <PxText size={8} color={C.text} style={{ marginTop: 6 }}>
            Total acumulado: {save.totalAura}
          </PxText>
        </View>

        <View style={styles.row}>
          <Stat label="Maior combo" value={String(result.maxCombo)} color={C.cyan} />
          <Stat label="Precisão" value={`${accuracy}%`} color={C.green} />
        </View>
        <View style={styles.row}>
          <Stat label="Perfeito!" value={String(result.perfect)} color={C.gold} />
          <Stat label="Bom!" value={String(result.good)} color={C.green} />
          <Stat label="Errou!" value={String(result.miss)} color={C.red} />
        </View>

        {result.auraMax && (
          <View style={[styles.badge, { borderColor: C.gold }]}>
            <PxText size={10} color={C.gold}>
              AURA MÁXIMA alcançada!
            </PxText>
          </View>
        )}

        {fresh.length > 0 && (
          <View style={[styles.badge, { borderColor: C.green }]}>
            <PxText size={10} color={C.green} style={{ marginBottom: 8 }}>
              Desbloqueado!
            </PxText>
            {fresh.map((it) => (
              <PxText key={it} size={8} style={{ marginTop: 4 }}>
                · {itemName(it)}
              </PxText>
            ))}
          </View>
        )}

        <View style={{ marginTop: 16 }}>
          <PxText size={8} color={C.text} style={{ lineHeight: 15 }}>
            {nextText}
          </PxText>
          {next && (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, nextProgress)) * 100}%` }]} />
            </View>
          )}
        </View>

        <PxButton label="Jogar de novo" onPress={onRetry} style={{ marginTop: 22 }} />
        <PxButton label="Personalizar" color={C.pink} onPress={onCustomize} style={{ marginTop: 12 }} />
        <PxButton label="Menu" color={C.cyan} onPress={onMenu} style={{ marginTop: 12 }} />
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <PxText size={7} color={C.dim}>
        {label}
      </PxText>
      <PxText size={14} color={color} style={{ marginTop: 6 }}>
        {value}
      </PxText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  panel: { padding: 20, paddingBottom: 40 },
  big: { marginTop: 16, padding: 14, backgroundColor: C.panel, borderWidth: 3, borderColor: C.ink, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  stat: { flex: 1, padding: 10, backgroundColor: C.panel, borderWidth: 3, borderColor: C.ink },
  badge: { marginTop: 12, padding: 12, borderWidth: 3, backgroundColor: C.panel },
  track: { height: 14, marginTop: 8, backgroundColor: C.ink, borderWidth: 2, borderColor: C.text },
  fill: { height: '100%', backgroundColor: C.gold },
});
