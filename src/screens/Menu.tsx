import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Stage } from '../components/Stage';
import { PxButton, PxText, useTicker } from '../components/ui';
import { SaveData } from '../save';
import { C } from '../theme';

const MENU_BPM = 100;

export function Menu({
  save,
  onPlay,
  onCustomize,
  onToggleSound,
}: {
  save: SaveData;
  onPlay: () => void;
  onCustomize: () => void;
  onToggleSound: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const time = useTicker(12);
  const beat = (time * MENU_BPM) / 60;
  const landscape = width >= height * 1.05 && width >= 640;
  const stageH = landscape ? height : Math.round(height * 0.55);

  const menu = (
    <View style={[styles.menu, landscape ? styles.menuSide : styles.menuBottom]}>
      <PxText size={landscape ? 30 : 24} color={C.gold} style={styles.center}>
        AURA{'\n'}CLICKER
      </PxText>
      <PxText size={9} color={C.dim} style={[styles.center, { marginTop: 8, marginBottom: 18 }]}>
        Oficina EEEP · ritmo + clicker
      </PxText>
      <View style={styles.total}>
        <PxText size={10} color={C.text}>
          Aura total: <PxText size={10} color={C.gold}>{save.totalAura}</PxText>
        </PxText>
      </View>
      <PxButton label="Jogar" size={16} onPress={onPlay} style={styles.btn} />
      <PxButton label="Personalizar" color={C.pink} onPress={onCustomize} style={styles.btn} />
      <PxButton
        label={save.soundOn ? 'Som: ligado' : 'Som: desligado'}
        color={C.cyan}
        size={11}
        onPress={onToggleSound}
        style={styles.btn}
      />
    </View>
  );

  return (
    <View style={[styles.root, { flexDirection: landscape ? 'row' : 'column' }]}>
      <Stage
        level="patio"
        width={landscape ? width - 380 : width}
        height={stageH}
        look={save.look}
        pose={beat % 1 < 0.5 ? 'idle0' : 'idle1'}
        aura={1.2}
        time={time}
        beat={beat}
      />
      {menu}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  menu: { backgroundColor: '#140c24ee', borderColor: C.ink, padding: 20, alignItems: 'stretch' },
  menuSide: { width: 380, borderLeftWidth: 4, justifyContent: 'center', paddingHorizontal: 28 },
  menuBottom: { flex: 1, borderTopWidth: 4, justifyContent: 'center', paddingHorizontal: 32 },
  center: { textAlign: 'center' },
  total: { alignItems: 'center', marginBottom: 8 },
  btn: { marginTop: 12 },
});
