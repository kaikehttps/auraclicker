import React from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { audio } from '../audio/engine';
import { Hero } from '../components/Hero';
import { PxButton, PxText, useTicker } from '../components/ui';
import {
  ACCESSORIES,
  AURAS,
  CLOTH_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  Look,
  OUTFITS,
  SKINS,
  unlockHint,
} from '../data/items';
import { AURA_H, AURA_W } from '../pixel/character';
import { isUnlocked, SaveData } from '../save';
import { C } from '../theme';

interface Opt {
  id: string;
  label: string;
  swatch?: string;
  item?: string; // item que precisa estar liberado
}

export function Customize({ save, onChange, onBack }: { save: SaveData; onChange: (look: Look) => void; onBack: () => void }) {
  const { width, height } = useWindowDimensions();
  const time = useTicker(12);
  const beat = (time * 100) / 60;
  const landscape = width >= height * 1.05 && width >= 640;
  const look = save.look;
  const scale = Math.max(3, Math.min(7, Math.floor((landscape ? height * 0.7 : height * 0.32) / AURA_H)));

  const groups: { title: string; key: keyof Look; opts: Opt[] }[] = [
    { title: 'Roupa', key: 'outfit', opts: OUTFITS.map((o) => ({ id: o.id, label: o.name, item: `outfit:${o.id}` })) },
    {
      title: 'Cor da roupa',
      key: 'outfitColor',
      opts: CLOTH_COLORS.map((c) => ({ id: c.id, label: c.name, swatch: c.main, item: `color:${c.id}` })),
    },
    { title: 'Acessório', key: 'accessory', opts: ACCESSORIES.map((a) => ({ id: a.id, label: a.name, item: `acc:${a.id}` })) },
    { title: 'Aura', key: 'aura', opts: AURAS.map((a) => ({ id: a.id, label: a.name, swatch: a.outer, item: `aura:${a.id}` })) },
    { title: 'Pele', key: 'skin', opts: SKINS.map((s, i) => ({ id: s.id, label: `Tom ${i + 1}`, swatch: s.main })) },
    { title: 'Cabelo', key: 'hairStyle', opts: HAIR_STYLES.map((h) => ({ id: h.id, label: h.name })) },
    { title: 'Cor do cabelo', key: 'hair', opts: HAIR_COLORS.map((h) => ({ id: h.id, label: h.name, swatch: h.main })) },
  ];

  const preview = (
    <View style={[styles.preview, landscape ? { width: AURA_W * scale + 60 } : { height: AURA_H * scale + 30 }]}>
      <View style={styles.floor} />
      <Hero
        look={look}
        pose={(['groove0', 'groove1', 'groove2', 'groove3'] as const)[Math.floor(beat) % 4]}
        scale={scale}
        aura={2.5}
        time={time}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <PxButton label="< Voltar" small size={10} color={C.panel2} textColor={C.text} onPress={onBack} />
        <PxText size={14}>Personalizar</PxText>
        <View style={{ width: 80 }} />
      </View>
      <View style={{ flex: 1, flexDirection: landscape ? 'row' : 'column' }}>
        {preview}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list}>
          {groups.map((grp) => (
            <View key={grp.title} style={styles.group}>
              <PxText size={10} color={C.cyan} style={{ marginBottom: 8 }}>
                {grp.title}
              </PxText>
              <View style={styles.chips}>
                {grp.opts.map((o) => {
                  const open = !o.item || isUnlocked(save, o.item);
                  const active = look[grp.key] === o.id;
                  return (
                    <Pressable
                      key={o.id}
                      disabled={!open}
                      accessibilityRole="button"
                      accessibilityLabel={`${grp.title}: ${o.label}${open ? '' : ', bloqueado'}`}
                      onPress={() => {
                        audio.unlock();
                        audio.sfx('click');
                        onChange({ ...look, [grp.key]: o.id });
                      }}
                      style={[
                        styles.chip,
                        active && styles.chipActive,
                        !open && styles.chipLocked,
                      ]}
                    >
                      {o.swatch && <View style={[styles.swatch, { backgroundColor: open ? o.swatch : C.lock }]} />}
                      <View>
                        <PxText size={8} color={open ? (active ? C.ink : C.text) : C.dim} shadow={!active && open}>
                          {o.label}
                        </PxText>
                        {!open && o.item && (
                          <PxText size={6} color={C.pink} shadow={false} style={{ marginTop: 4 }}>
                            {unlockHint(o.item)}
                          </PxText>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <PxText size={7} color={C.dim} style={{ marginTop: 8, lineHeight: 14 }}>
            O visual é salvo automaticamente neste navegador.
          </PxText>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  preview: { alignItems: 'center', justifyContent: 'flex-end', backgroundColor: '#1a1030', borderColor: C.ink, borderWidth: 4, margin: 12, paddingBottom: 8 },
  floor: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, backgroundColor: '#2e2052' },
  list: { padding: 16, paddingBottom: 40 },
  group: { marginBottom: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: C.panel2,
    borderWidth: 3,
    borderColor: C.ink,
  },
  chipActive: { backgroundColor: C.gold },
  chipLocked: { backgroundColor: '#1a1428', borderStyle: 'dashed', borderColor: C.lock },
  swatch: { width: 16, height: 16, borderWidth: 2, borderColor: C.ink },
});
