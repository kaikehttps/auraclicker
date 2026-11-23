import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { audio } from '../audio/engine';
import { Stage } from '../components/Stage';
import { PxButton, PxText } from '../components/ui';
import { AURAS, LevelId, LEVELS, Look } from '../data/items';
import { buildSong, Hint, Note } from '../game/songs';
import { PoseName } from '../pixel/character';
import { arrowGrid, symbolGrid } from '../pixel/icons';
import { PixelSprite } from '../pixel/PixelSprite';
import { C, LANES } from '../theme';

export interface GameResult {
  level: LevelId;
  aura: number;
  maxCombo: number;
  perfect: number;
  good: number;
  miss: number;
  auraMax: boolean;
}

const PERFECT_WIN = 0.05;
const GOOD_WIN = 0.11;
const HITS_PER_AURA_MODE = 16;
const AURA_MODE_BEATS = 4;
const AURA_MAX_SHOW = 3.2; // segundos de levitação/comemoração

/** Demonstração automática: abra o jogo com ?autoplay no endereço. */
const AUTOPLAY = Platform.OS === 'web' && typeof location !== 'undefined' && location.search.includes('autoplay');

const multFor = (combo: number) => (combo >= 50 ? 4 : combo >= 25 ? 3 : combo >= 10 ? 2 : 1);

interface AuraMode {
  trigger: number;
  start: number;
  end: number;
  taps: number;
  gained: number;
}

interface GameState {
  notes: Note[];
  scan: number;
  score: number;
  combo: number;
  maxCombo: number;
  hits: number;
  perfect: number;
  good: number;
  miss: number;
  energy: number;
  auraMaxAt: number | null;
  auraMode: AuraMode | null;
  judgment: { kind: 'perfect' | 'good' | 'miss'; t: number } | null;
  laneFlash: number[];
  bursts: { lane: number; t: number; perfect: boolean }[];
  floats: { text: string; t: number; color: string }[];
  held: Set<string>;
  paused: boolean;
  ended: boolean;
}

const initState = (notes: Note[]): GameState => ({
  notes: notes.map((n) => ({ ...n })),
  scan: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  hits: 0,
  perfect: 0,
  good: 0,
  miss: 0,
  energy: 0,
  auraMaxAt: null,
  auraMode: null,
  judgment: null,
  laneFlash: [-9, -9, -9, -9],
  bursts: [],
  floats: [],
  held: new Set(),
  paused: false,
  ended: false,
});

function detectTouch(): boolean {
  if (Platform.OS !== 'web') return true;
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

function hintText(h: Hint, touch: boolean): string {
  switch (h.key) {
    case 'ready':
      return 'As notas descem no ritmo da música. Fique de olho na linha!';
    case 'lane0':
      return touch ? 'Toque aqui quando a nota chegar' : 'Aperte D quando a nota chegar à linha';
    case 'lane1':
      return touch ? 'Agora toque aqui! Mesma ideia.' : 'Agora o F! Mesma ideia.';
    case 'lane23':
      return touch ? 'Estas duas pistas completam o time!' : 'J e K completam o time!';
    case 'mix':
      return touch ? 'Misture tudo! Siga a batida.' : 'Misture tudo! D F J K no ritmo.';
  }
}

const NoteBody = memo(function NoteBody({ lane, w, h }: { lane: number; w: number; h: number }) {
  const L = LANES[lane];
  const icon = Math.max(1, Math.floor((h - 8) / 7));
  return (
    <View style={[styles.note, { width: w, height: h, backgroundColor: L.color }]}>
      <View style={[styles.noteShine, { width: w - 10 }]} />
      <PixelSprite grid={symbolGrid(L.symbol, L.dark)} scale={icon} />
    </View>
  );
});

export function Game({
  level,
  look,
  soundOn,
  onToggleSound,
  onFinish,
  onQuit,
}: {
  level: LevelId;
  look: Look;
  soundOn: boolean;
  onToggleSound: () => void;
  onFinish: (r: GameResult) => void;
  onQuit: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const song = useMemo(() => buildSong(level), [level]);
  const g = useRef<GameState>(initState(song.notes));
  const [, setTick] = useState(0);
  const [touch, setTouch] = useState(detectTouch);
  const [paused, setPaused] = useState(false);
  const areaRef = useRef<any>(null);
  const areaPageX = useRef(0);
  const [areaSize, setAreaSize] = useState({ w: 0, h: 0 });
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const auraDef = AURAS.find((a) => a.id === look.aura) ?? AURAS[0];
  const lastNoteTime = song.notes[song.notes.length - 1].time;

  // ---------- regras ----------

  const addFloat = (text: string, color: string, t: number) => {
    const s = g.current;
    s.floats.push({ text, t, color });
    if (s.floats.length > 8) s.floats.shift();
  };

  const checkAuraMax = (t: number) => {
    const s = g.current;
    if (s.energy >= 100 && s.auraMaxAt === null) {
      s.energy = 100;
      s.auraMaxAt = t;
      s.score += 150;
      addFloat('AURA MÁXIMA! +150', C.gold, t);
      audio.sfx('auraMax');
    }
    s.energy = Math.min(100, s.energy);
  };

  const startAuraMode = (t: number) => {
    const s = g.current;
    const startBeat = Math.ceil(t / song.spb + 0.15);
    const start = startBeat * song.spb;
    const end = start + AURA_MODE_BEATS * song.spb;
    if (end + song.spb > lastNoteTime) return;
    for (const n of s.notes) if (!n.judged && n.time >= t - 0.02 && n.time < end + song.spb) n.removed = true;
    s.auraMode = { trigger: t, start, end, taps: 0, gained: 0 };
    audio.sfx('auraMode');
  };

  const farm = (t: number) => {
    const s = g.current;
    const am = s.auraMode;
    if (!am) return;
    am.taps++;
    const gain = 2 * multFor(s.combo);
    am.gained += gain;
    s.score += gain;
    s.energy += 0.6;
    addFloat(`+${gain}`, auraDef.inner, t);
    audio.sfx('farm', am.taps);
    checkAuraMax(t);
  };

  const press = useCallback(
    (lane: number) => {
      const s = g.current;
      if (s.paused || s.ended) return;
      const t = audio.songTime();
      if (s.auraMode && t >= s.auraMode.trigger && t < s.auraMode.end) {
        farm(t);
        return;
      }
      s.laneFlash[lane] = t;
      let target: Note | null = null;
      for (let i = s.scan; i < s.notes.length; i++) {
        const n = s.notes[i];
        if (n.time > t + GOOD_WIN) break;
        if (n.judged || n.removed || n.lane !== lane) continue;
        if (Math.abs(n.time - t) <= GOOD_WIN) {
          target = n;
          break;
        }
      }
      if (!target) return;
      const perfect = Math.abs(target.time - t) <= PERFECT_WIN;
      target.judged = perfect ? 'perfect' : 'good';
      s.combo++;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      s.hits++;
      if (perfect) s.perfect++;
      else s.good++;
      s.score += (perfect ? 6 : 3) * multFor(s.combo);
      s.energy += perfect ? 1.6 : 0.8;
      s.judgment = { kind: target.judged, t };
      s.bursts.push({ lane, t, perfect });
      if (s.bursts.length > 12) s.bursts.shift();
      audio.sfx(perfect ? 'perfect' : 'good');
      checkAuraMax(t);
      if (s.hits % HITS_PER_AURA_MODE === 0) startAuraMode(t);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [song],
  );

  const pressFarmOnly = useCallback(() => {
    const s = g.current;
    if (s.paused || s.ended) return;
    const t = audio.songTime();
    if (s.auraMode && t >= s.auraMode.trigger && t < s.auraMode.end) farm(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPause = useCallback((p: boolean) => {
    const s = g.current;
    if (s.ended || s.paused === p) return;
    s.paused = p;
    if (p) audio.pause();
    else audio.resume();
    setPaused(p);
  }, []);

  // ---------- ciclo de vida ----------

  useEffect(() => {
    g.current = initState(song.notes);
    audio.unlock();
    audio.setMuted(!soundOn);
    audio.startSong(song.events);
    let raf = 0;
    let lastAutoFarm = -9;
    const loop = () => {
      const s = g.current;
      const t = audio.songTime();
      if (!s.paused && !s.ended) {
        if (AUTOPLAY) {
          for (let i = s.scan; i < s.notes.length && s.notes[i].time <= t; i++) press(s.notes[i].lane);
          if (s.auraMode && t >= s.auraMode.trigger && t - lastAutoFarm > 0.12) {
            lastAutoFarm = t;
            press(0);
          }
        }
        while (s.scan < s.notes.length) {
          const n = s.notes[s.scan];
          if (n.judged || n.removed) {
            s.scan++;
            continue;
          }
          if (n.time + GOOD_WIN < t) {
            n.judged = 'miss';
            s.miss++;
            s.combo = 0;
            s.energy = Math.max(0, s.energy - 4);
            s.judgment = { kind: 'miss', t };
            audio.sfx('miss');
            s.scan++;
            continue;
          }
          break;
        }
        if (s.auraMode && t >= s.auraMode.end) s.auraMode = null;
        if (t >= song.end) {
          s.ended = true;
          audio.stopSong();
          onFinishRef.current({
            level,
            aura: s.score,
            maxCombo: s.maxCombo,
            perfect: s.perfect,
            good: s.good,
            miss: s.miss,
            auraMax: s.auraMaxAt !== null,
          });
          return;
        }
      }
      setTick((k) => (k + 1) % 1e6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      audio.stopSong();
      audio.resume();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);

  useEffect(() => {
    audio.setMuted(!soundOn);
  }, [soundOn]);

  // Teclado (navegador)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const down = (e: KeyboardEvent) => {
      const lane = LANES.findIndex((l) => l.code === e.code);
      if (lane >= 0 || e.code === 'Space') e.preventDefault();
      if (e.repeat) return; // segurar a tecla conta como um único toque
      if (e.code === 'Escape' || e.code === 'KeyP') {
        setPause(!g.current.paused);
        return;
      }
      if (lane >= 0) {
        setTouch(false);
        g.current.held.add(e.code);
        press(lane);
      } else if (e.code === 'Space') {
        setTouch(false);
        pressFarmOnly();
      }
    };
    const up = (e: KeyboardEvent) => g.current.held.delete(e.code);
    const vis = () => document.hidden && setPause(true);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [press, pressFarmOnly, setPause]);

  // App em segundo plano (nativo)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => st !== 'active' && setPause(true));
    return () => sub.remove();
  }, [setPause]);

  // Toques (navegador): pointerdown nativo para permitir vários dedos ao mesmo tempo
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = areaRef.current as unknown as HTMLElement | null;
    if (!node || !node.addEventListener) return;
    node.style.touchAction = 'none';
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      if (e.pointerType === 'touch') setTouch(true);
      const r = node.getBoundingClientRect();
      const lane = Math.max(0, Math.min(3, Math.floor(((e.clientX - r.left) / r.width) * 4)));
      press(lane);
    };
    const noMenu = (e: Event) => e.preventDefault();
    node.addEventListener('pointerdown', onDown);
    node.addEventListener('contextmenu', noMenu);
    return () => {
      node.removeEventListener('pointerdown', onDown);
      node.removeEventListener('contextmenu', noMenu);
    };
  }, [press, areaSize.w]);

  const nativeTouch =
    Platform.OS === 'web'
      ? {}
      : {
          onTouchStart: (e: any) => {
            for (const tch of e.nativeEvent.changedTouches ?? [e.nativeEvent]) {
              const lane = Math.floor(((tch.pageX - areaPageX.current) / Math.max(1, areaSize.w)) * 4);
              press(Math.max(0, Math.min(3, lane)));
            }
          },
        };

  // ---------- renderização ----------

  const s = g.current;
  const t = audio.songTime();
  const beat = Math.max(0, t / song.spb);
  const anim = performance.now() / 1000;
  const am = s.auraMode && t >= s.auraMode.trigger ? s.auraMode : null;
  const auraMaxAge = s.auraMaxAt !== null ? t - s.auraMaxAt : 99;
  const levitating = auraMaxAge >= 0 && auraMaxAge < AURA_MAX_SHOW;

  let pose: PoseName;
  let lift = 0;
  if (levitating) {
    pose = 'float';
    const k = auraMaxAge / AURA_MAX_SHOW;
    lift = Math.sin(Math.min(1, k) * Math.PI) * 9 + Math.sin(anim * 4) * 1;
  } else if (am) {
    pose = Math.floor(beat * 2) % 2 ? 'power1' : 'power0';
  } else if (t < song.countInEnd || s.combo < 8) {
    pose = beat % 1 < 0.5 ? 'idle0' : 'idle1';
  } else if (s.combo < 20) {
    pose = (['groove0', 'groove1', 'groove2', 'groove3'] as const)[Math.floor(beat) % 4];
  } else if (s.combo < 40) {
    pose = (['dance0', 'dance1', 'dance2', 'dance3'] as const)[Math.floor(beat) % 4];
  } else {
    pose = (['hype0', 'hype1', 'hype2', 'hype3'] as const)[Math.floor(beat) % 4];
  }
  const auraLevel = levitating ? 4 : Math.min(4, s.energy / 25 + Math.min(1, s.combo / 40) + (am ? 1 : 0));

  const landscape = width >= height * 1.05 && width >= 640;
  const lanesW = landscape ? Math.round(Math.min(480, Math.max(340, width * 0.4))) : width;
  const stageW = landscape ? width - lanesW : width;
  const stageH = landscape ? height : Math.max(170, Math.round(height * 0.3));

  const areaW = areaSize.w || lanesW;
  const areaH = areaSize.h || height - (landscape ? 0 : stageH) - 40;
  const laneW = areaW / 4;
  const btnH = touch ? Math.min(110, Math.max(80, areaH * 0.17)) : 70;
  const hitY = areaH - btnH - 16;
  const speed = hitY / song.travel;
  const noteW = Math.floor(laneW - 12);
  const noteH = Math.round(Math.max(20, Math.min(30, laneW * 0.3)));

  const visibleNotes: React.ReactNode[] = [];
  for (let i = Math.max(0, s.scan - 8); i < s.notes.length; i++) {
    const n = s.notes[i];
    const dt = n.time - t;
    if (dt > song.travel + 0.2) break;
    if (n.removed || (n.judged && n.judged !== 'miss')) continue;
    const y = hitY - dt * speed;
    if (y > areaH + noteH) continue;
    visibleNotes.push(
      <View
        key={n.id}
        style={{
          position: 'absolute',
          left: n.lane * laneW + (laneW - noteW) / 2,
          top: Math.round(y - noteH / 2),
          opacity: n.judged === 'miss' ? 0.3 : 1,
        }}
      >
        <NoteBody lane={n.lane} w={noteW} h={noteH} />
      </View>,
    );
  }

  const hint =
    level === 'patio' ? [...song.hints].reverse().find((h) => t >= h.from && t < h.to) ?? null : null;
  const judgeAge = s.judgment ? t - s.judgment.t : 99;
  const judgeInfo = s.judgment
    ? { perfect: { txt: 'Perfeito!', c: C.gold }, good: { txt: 'Bom!', c: C.green }, miss: { txt: 'Errou!', c: C.red } }[s.judgment.kind]
    : null;

  let countdown: string | null = null;
  if (t < song.countInEnd) {
    const left = Math.ceil((song.countInEnd - t) / song.spb);
    countdown = left <= 3 ? String(left) : 'Prepare-se!';
  } else if (t < song.countInEnd + song.spb * 0.9) countdown = 'VAI!';

  const progress = Math.max(0, Math.min(1, t / song.end));
  const levelInfo = LEVELS.find((l) => l.id === level)!;
  const mult = multFor(s.combo);

  const stage = (
    <Stage
      level={level}
      width={stageW}
      height={stageH}
      look={look}
      pose={pose}
      aura={auraLevel}
      time={anim}
      beat={beat}
      lift={lift}
      cheer={levitating || (s.auraMaxAt !== null && auraMaxAge < AURA_MAX_SHOW + 1)}
    >
      <View style={styles.hud} pointerEvents="none">
        <PxText size={landscape ? 10 : 8} color={C.dim}>
          {levelInfo.number} · {levelInfo.name}
        </PxText>
        <PxText size={landscape ? 20 : 14} color={C.gold} style={{ marginTop: 6 }}>
          +{s.score} AURA
        </PxText>
        <View style={[styles.meter, { width: landscape ? 220 : 150 }]}>
          <View
            style={{
              width: `${s.energy}%`,
              height: '100%',
              backgroundColor: s.auraMaxAt !== null ? (Math.floor(anim * 6) % 2 ? C.gold : auraDef.inner) : auraDef.outer,
            }}
          />
        </View>
        <PxText size={landscape ? 8 : 7} color={s.auraMaxAt !== null ? C.gold : C.text}>
          {s.auraMaxAt !== null ? 'AURA MÁXIMA!' : 'Energia da aura'}
        </PxText>
      </View>
      {s.floats.map((f, i) => {
        const fa = t - f.t;
        if (fa > 1 || fa < 0) return null;
        return (
          <View
            key={`${f.t}-${i}`}
            pointerEvents="none"
            style={{ position: 'absolute', left: stageW / 2 + ((i * 37) % 80) - 40, top: stageH * 0.35 - fa * 60 }}
          >
            <PxText size={f.text.length > 6 ? 12 : 14} color={f.color} style={{ opacity: 1 - fa }}>
              {f.text}
            </PxText>
          </View>
        );
      })}
    </Stage>
  );

  const lanes = (
    <View style={[styles.lanesPanel, { width: lanesW }]}>
      <View style={styles.topBar}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <PxButton label="II" small size={10} color={C.panel2} textColor={C.text} onPress={() => setPause(true)} />
      </View>
      <View
        ref={areaRef}
        style={styles.area}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          setAreaSize({ w, h });
          areaRef.current?.measure?.((_x: number, _y: number, _w: number, _h: number, px: number) => (areaPageX.current = px ?? 0));
        }}
        {...nativeTouch}
      >
        {/* pistas */}
        {LANES.map((L, i) => {
          const flash = Math.max(0, 1 - (t - s.laneFlash[i]) / 0.15);
          const held = s.held.has(L.code);
          const lit = held || flash > 0;
          const hintLane = hint && ((hint.key === 'lane23' && i >= 2) || ((hint.key === 'lane0' || hint.key === 'lane1') && hint.lane === i));
          return (
            <View
              key={i}
              pointerEvents="none"
              style={[
                styles.lane,
                {
                  left: i * laneW,
                  width: laneW,
                  backgroundColor: hintLane ? `${L.color}22` : i % 2 ? '#1a1130' : '#1d1336',
                },
              ]}
            >
              <View style={[styles.laneGlow, { backgroundColor: L.color, opacity: flash * 0.25 }]} />
              <View
                style={[
                  styles.target,
                  { top: hitY - noteH / 2 - 3, height: noteH + 6, left: (laneW - noteW) / 2 - 3, width: noteW + 6, borderColor: lit ? L.color : L.dark },
                ]}
              />
              <View
                style={[
                  styles.button,
                  {
                    top: hitY + 16,
                    height: btnH - 8,
                    backgroundColor: lit ? L.color : L.dark,
                    borderBottomWidth: lit ? 3 : 7,
                    transform: [{ translateY: lit ? 4 : 0 }],
                  },
                ]}
              >
                <PixelSprite grid={symbolGrid(L.symbol, lit ? L.dark : L.color)} scale={touch ? 4 : 3} />
                {!touch && (
                  <PxText size={12} color={lit ? C.ink : C.text} shadow={!lit} style={{ marginTop: 6 }}>
                    {L.key}
                  </PxText>
                )}
              </View>
            </View>
          );
        })}
        <View pointerEvents="none" style={[styles.hitLine, { top: hitY - 2 }]} />

        {/* explosões de acerto */}
        {s.bursts.map((b, i) => {
          const age = t - b.t;
          if (age > 0.25 || age < 0) return null;
          const k = age / 0.25;
          const size = noteW * (1 + k * 0.5);
          return (
            <View
              key={`${b.t}-${i}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: b.lane * laneW + laneW / 2 - size / 2,
                top: hitY - size * 0.4,
                width: size,
                height: size * 0.8,
                borderWidth: 4,
                borderColor: b.perfect ? C.gold : LANES[b.lane].color,
                opacity: 1 - k,
              }}
            />
          );
        })}

        {visibleNotes}

        {/* combo */}
        {s.combo >= 3 && !am && (
          <View pointerEvents="none" style={[styles.combo, { top: hitY * 0.22 }]}>
            <PxText size={28} color={`${C.text}cc`}>
              {s.combo}
            </PxText>
            <PxText size={9} color={C.dim}>
              COMBO {mult > 1 ? `· x${mult}` : ''}
            </PxText>
          </View>
        )}

        {/* julgamento */}
        {judgeInfo && judgeAge < 0.5 && !am && (
          <View pointerEvents="none" style={[styles.judge, { top: hitY - 90 }]}>
            <PxText size={Math.round(18 * (1 + Math.max(0, 0.12 - judgeAge) * 3))} color={judgeInfo.c}>
              {judgeInfo.txt}
            </PxText>
          </View>
        )}

        {/* dica do tutorial */}
        {hint && !am && (
          <>
            <View pointerEvents="none" style={[styles.hintBox, { top: hitY * 0.42 }]}>
              <PxText size={touch ? 10 : 11} style={{ textAlign: 'center' }}>
                {hintText(hint, touch)}
              </PxText>
            </View>
            {(hint.key === 'lane0' || hint.key === 'lane1' || hint.key === 'lane23') &&
              (hint.key === 'lane23' ? [2, 3] : [hint.lane]).map((ln) => (
                <View
                  key={ln}
                  pointerEvents="none"
                  style={{ position: 'absolute', left: ln * laneW + laneW / 2 - 10, top: hitY - 56 + Math.abs(Math.sin(anim * 6)) * -10 }}
                >
                  <PixelSprite grid={arrowGrid(LANES[ln].color)} scale={3} />
                </View>
              ))}
          </>
        )}

        {/* contagem */}
        {countdown && (
          <View pointerEvents="none" style={[styles.judge, { top: hitY * 0.6 }]}>
            <PxText size={countdown.length > 4 ? 16 : 34} color={C.gold}>
              {countdown}
            </PxText>
          </View>
        )}

        {/* Modo Aura: botão gigante */}
        {am && (
          <View
            pointerEvents="none"
            style={[
              styles.farm,
              { backgroundColor: auraDef.outer, borderColor: Math.floor(anim * 8) % 2 ? auraDef.inner : C.ink },
            ]}
          >
            <PxText size={touch ? 10 : 11} color={C.ink} shadow={false}>
              MODO AURA
            </PxText>
            <PxText size={Math.min(30, laneW * 0.32)} color={C.text} style={{ marginVertical: 14, textAlign: 'center' }}>
              FARME AURA!
            </PxText>
            <PxText size={touch ? 9 : 10} color={C.ink} shadow={false} style={{ textAlign: 'center' }}>
              {touch ? 'Toque sem parar!' : 'Aperte ESPAÇO sem parar!'}
            </PxText>
            <View style={styles.pips}>
              {Array.from({ length: AURA_MODE_BEATS }, (_, i) => {
                const left = am.end - t;
                const on = i < Math.ceil(left / song.spb);
                return <View key={i} style={[styles.pip, { backgroundColor: on ? C.text : '#00000044' }]} />;
              })}
            </View>
            <PxText size={12} color={C.text} style={{ marginTop: 10 }}>
              {am.taps} toques · +{am.gained}
            </PxText>
            {am.end - t < song.spb && (
              <PxText size={10} color={C.ink} shadow={false} style={{ marginTop: 10 }}>
                De volta às pistas!
              </PxText>
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { flexDirection: landscape ? 'row' : 'column' }]}>
      {landscape ? (
        <>
          {lanes}
          {stage}
        </>
      ) : (
        <>
          {stage}
          {lanes}
        </>
      )}
      {paused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseBox}>
            <PxText size={18} color={C.gold} style={{ marginBottom: 20 }}>
              Pausado
            </PxText>
            <PxButton label="Continuar" onPress={() => setPause(false)} style={styles.pauseBtn} />
            <PxButton
              label={soundOn ? 'Som: ligado' : 'Som: desligado'}
              color={C.cyan}
              onPress={onToggleSound}
              style={styles.pauseBtn}
            />
            <PxButton label="Sair" color={C.pink} onPress={onQuit} style={styles.pauseBtn} />
          </View>
        </View>
      )}
    </View>
  );
}

const FILL = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  lanesPanel: { flex: 1, backgroundColor: '#120a22', borderColor: C.ink, borderRightWidth: 4, borderLeftWidth: 4 },
  topBar: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 8 },
  progressTrack: { flex: 1, height: 12, backgroundColor: C.ink, borderWidth: 2, borderColor: C.panel2 },
  progressFill: { height: '100%', backgroundColor: C.cyan },
  area: { flex: 1, overflow: 'hidden', userSelect: 'none' } as any,
  lane: { position: 'absolute', top: 0, bottom: 0, borderRightWidth: 1, borderColor: '#2b1f48' },
  laneGlow: { ...FILL },
  target: { position: 'absolute', borderWidth: 3, borderStyle: 'dashed' },
  button: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderWidth: 3,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitLine: { position: 'absolute', left: 0, right: 0, height: 4, backgroundColor: '#fff4e0aa' },
  note: { borderWidth: 3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  noteShine: { position: 'absolute', top: 2, left: 2, height: 3, backgroundColor: '#ffffff88' },
  combo: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  judge: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  hintBox: {
    position: 'absolute',
    left: 12,
    right: 12,
    padding: 12,
    backgroundColor: '#000000cc',
    borderWidth: 3,
    borderColor: C.gold,
  },
  farm: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 10,
    bottom: 10,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  pips: { flexDirection: 'row', gap: 10, marginTop: 18 },
  pip: { width: 26, height: 26, borderWidth: 3, borderColor: C.ink },
  hud: { position: 'absolute', left: 12, top: 10 },
  meter: { height: 14, marginTop: 8, marginBottom: 4, backgroundColor: C.ink, borderWidth: 2, borderColor: C.text },
  pauseOverlay: { ...FILL, backgroundColor: '#000000aa', alignItems: 'center', justifyContent: 'center' },
  pauseBox: { backgroundColor: C.panel, borderWidth: 4, borderColor: C.ink, padding: 24, alignItems: 'stretch', minWidth: 260 },
  pauseBtn: { marginTop: 12 },
});
