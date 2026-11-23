import { PressStart2P_400Regular, useFonts } from '@expo-google-fonts/press-start-2p';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { audio } from './src/audio/engine';
import { LevelId, Look } from './src/data/items';
import { applyRewards, loadSave, SaveData, unlockGold, writeSave } from './src/save';
import { Customize } from './src/screens/Customize';
import { Game, GameResult } from './src/screens/Game';
import { LevelSelect } from './src/screens/LevelSelect';
import { Menu } from './src/screens/Menu';
import { Results } from './src/screens/Results';
import { C } from './src/theme';

type Screen =
  | { name: 'menu' }
  | { name: 'levels' }
  | { name: 'custom'; back: Screen }
  | { name: 'game'; level: LevelId; run: number }
  | { name: 'results'; result: GameResult; fresh: string[] };

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.title = 'Aura Clicker';
  const st = document.body.style as any;
  st.backgroundColor = C.bg;
  st.overscrollBehavior = 'none';
  st.userSelect = 'none';
  st.webkitUserSelect = 'none';
  st.touchAction = 'manipulation';
  st.webkitTapHighlightColor = 'transparent';
}

export default function App() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  const [save, setSave] = useState<SaveData | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });

  useEffect(() => {
    loadSave().then((s) => {
      setSave(s);
      audio.setMuted(!s.soundOn);
    });
  }, []);

  const update = useCallback((fn: (s: SaveData) => SaveData) => {
    setSave((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      writeSave(next);
      return next;
    });
  }, []);

  const toggleSound = useCallback(() => {
    update((s) => {
      audio.setMuted(s.soundOn);
      return { ...s, soundOn: !s.soundOn };
    });
  }, [update]);

  const finish = useCallback(
    (result: GameResult) => {
      if (!save) return;
      let next: SaveData = {
        ...save,
        totalAura: save.totalAura + result.aura,
        tutorialDone: true,
        best: {
          ...save.best,
          [result.level]: {
            aura: Math.max(result.aura, save.best[result.level]?.aura ?? 0),
            combo: Math.max(result.maxCombo, save.best[result.level]?.combo ?? 0),
          },
        },
      };
      const rewarded = applyRewards(next);
      next = rewarded.save;
      const fresh = [...rewarded.fresh];
      if (result.level === 'palco' && result.auraMax) {
        const g = unlockGold(next);
        next = g.save;
        if (g.fresh) fresh.push('aura:dourada');
      }
      setSave(next);
      writeSave(next);
      setScreen({ name: 'results', result, fresh });
    },
    [save],
  );

  if (!fontsLoaded || !save) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  let body: React.ReactNode;
  switch (screen.name) {
    case 'menu':
      body = (
        <Menu
          save={save}
          onPlay={() => setScreen({ name: 'levels' })}
          onCustomize={() => setScreen({ name: 'custom', back: { name: 'menu' } })}
          onToggleSound={toggleSound}
        />
      );
      break;
    case 'levels':
      body = (
        <LevelSelect
          save={save}
          onBack={() => setScreen({ name: 'menu' })}
          onPick={(level) => setScreen({ name: 'game', level, run: Date.now() })}
        />
      );
      break;
    case 'custom':
      body = (
        <Customize
          save={save}
          onChange={(look: Look) => update((s) => ({ ...s, look }))}
          onBack={() => setScreen(screen.back)}
        />
      );
      break;
    case 'game':
      body = (
        <Game
          key={screen.run}
          level={screen.level}
          look={save.look}
          soundOn={save.soundOn}
          onToggleSound={toggleSound}
          onFinish={finish}
          onQuit={() => setScreen({ name: 'levels' })}
        />
      );
      break;
    case 'results': {
      const { result } = screen;
      body = (
        <Results
          result={result}
          fresh={screen.fresh}
          save={save}
          onRetry={() => setScreen({ name: 'game', level: result.level, run: Date.now() })}
          onCustomize={() => setScreen({ name: 'custom', back: { name: 'levels' } })}
          onMenu={() => setScreen({ name: 'menu' })}
        />
      );
      break;
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden={screen.name === 'game'} />
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});
