import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LOOK, GOLD_ITEM, LevelId, Look, REWARDS } from './data/items';

const KEY = 'auraclicker:save:v1';

export interface SaveData {
  totalAura: number;
  soundOn: boolean;
  look: Look;
  unlocked: string[];
  best: Partial<Record<LevelId, { aura: number; combo: number }>>;
  tutorialDone: boolean;
}

export function freshSave(): SaveData {
  return {
    totalAura: 0,
    soundOn: true,
    look: { ...DEFAULT_LOOK },
    unlocked: [...REWARDS[0].items],
    best: {},
    tutorialDone: false,
  };
}

export async function loadSave(): Promise<SaveData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return freshSave();
    const data = { ...freshSave(), ...JSON.parse(raw) } as SaveData;
    data.look = { ...DEFAULT_LOOK, ...data.look };
    return applyRewards(data).save;
  } catch {
    return freshSave();
  }
}

export async function writeSave(data: SaveData): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Sem armazenamento disponível (ex.: janela privada): o jogo segue sem salvar.
  }
}

export const isUnlocked = (save: SaveData, item: string) => save.unlocked.includes(item);

/** Libera tudo que a aura total já alcançou. Retorna os itens novos. */
export function applyRewards(save: SaveData): { save: SaveData; fresh: string[] } {
  const set = new Set(save.unlocked);
  const fresh: string[] = [];
  for (const r of REWARDS) {
    if (save.totalAura < r.at) continue;
    for (const it of r.items) {
      if (!set.has(it)) {
        set.add(it);
        fresh.push(it);
      }
    }
  }
  return { save: { ...save, unlocked: [...set] }, fresh };
}

export function unlockGold(save: SaveData): { save: SaveData; fresh: boolean } {
  if (save.unlocked.includes(GOLD_ITEM)) return { save, fresh: false };
  return { save: { ...save, unlocked: [...save.unlocked, GOLD_ITEM] }, fresh: true };
}

export function nextReward(total: number) {
  return REWARDS.find((r) => r.at > total) ?? null;
}
