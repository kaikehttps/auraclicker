// Catálogo de visuais, níveis e recompensas.

export type Outfit = 'camiseta' | 'moletom';
export type Accessory = 'nenhum' | 'fones';
export type AuraId = 'azul' | 'verde' | 'roxa' | 'dourada';
export type HairStyle = 'curto' | 'cacheado' | 'longo' | 'raspado';

export interface Look {
  outfit: Outfit;
  outfitColor: string; // id de CLOTH_COLORS
  accessory: Accessory;
  aura: AuraId;
  skin: string; // id de SKINS
  hair: string; // id de HAIR_COLORS
  hairStyle: HairStyle;
}

export const DEFAULT_LOOK: Look = {
  outfit: 'camiseta',
  outfitColor: 'branco',
  accessory: 'nenhum',
  aura: 'azul',
  skin: 'p3',
  hair: 'preto',
  hairStyle: 'curto',
};

export const OUTFITS: { id: Outfit; name: string }[] = [
  { id: 'camiseta', name: 'Camiseta' },
  { id: 'moletom', name: 'Moletom' },
];

export const ACCESSORIES: { id: Accessory; name: string }[] = [
  { id: 'nenhum', name: 'Nenhum' },
  { id: 'fones', name: 'Fones' },
];

export const AURAS: { id: AuraId; name: string; outer: string; inner: string }[] = [
  { id: 'azul', name: 'Azul', outer: '#3d7bff', inner: '#a8d8ff' },
  { id: 'verde', name: 'Verde', outer: '#22c766', inner: '#b8ffd0' },
  { id: 'roxa', name: 'Roxa', outer: '#9b4dff', inner: '#e4c4ff' },
  { id: 'dourada', name: 'Dourada', outer: '#ffb300', inner: '#fff4a8' },
];

export const CLOTH_COLORS: { id: string; name: string; main: string; shade: string }[] = [
  { id: 'branco', name: 'Branco', main: '#f2f0ea', shade: '#c4bfb4' },
  { id: 'verde', name: 'Verde EEEP', main: '#2fa65a', shade: '#1e7340' },
  { id: 'azul', name: 'Azul', main: '#3f6fe0', shade: '#2a4ba0' },
  { id: 'preto', name: 'Preto', main: '#3a3446', shade: '#231f2c' },
  { id: 'cinza', name: 'Cinza', main: '#9a98a6', shade: '#6c6a78' },
  { id: 'roxo', name: 'Roxo', main: '#8a4fd8', shade: '#5e3299' },
  { id: 'amarelo', name: 'Amarelo', main: '#ffcf3a', shade: '#c99a12' },
  { id: 'vermelho', name: 'Vermelho', main: '#e0434f', shade: '#9e2632' },
];

export const SKINS: { id: string; main: string; shade: string }[] = [
  { id: 'p1', main: '#ffdcbf', shade: '#e8b896' },
  { id: 'p2', main: '#f0b88a', shade: '#cf9165' },
  { id: 'p3', main: '#c98b5e', shade: '#a06a42' },
  { id: 'p4', main: '#8d5a3b', shade: '#6c4129' },
  { id: 'p5', main: '#5e3a26', shade: '#43281a' },
];

export const HAIR_COLORS: { id: string; name: string; main: string }[] = [
  { id: 'preto', name: 'Preto', main: '#241712' },
  { id: 'castanho', name: 'Castanho', main: '#6b3e26' },
  { id: 'loiro', name: 'Loiro', main: '#e3b94e' },
  { id: 'ruivo', name: 'Ruivo', main: '#c4502a' },
  { id: 'azul', name: 'Azul', main: '#3a6df0' },
  { id: 'rosa', name: 'Rosa', main: '#ff7ab6' },
];

export const HAIR_STYLES: { id: HairStyle; name: string }[] = [
  { id: 'curto', name: 'Curto' },
  { id: 'cacheado', name: 'Cacheado' },
  { id: 'longo', name: 'Longo' },
  { id: 'raspado', name: 'Raspado' },
];

export type LevelId = 'patio' | 'lab' | 'festival' | 'palco';

export interface LevelInfo {
  id: LevelId;
  number: string;
  name: string;
  subtitle: string;
  unlockAt: number; // aura total necessária
}

export const LEVELS: LevelInfo[] = [
  { id: 'patio', number: 'Nível 1', name: 'Pátio da EEEP', subtitle: 'Fim de tarde', unlockAt: 0 },
  { id: 'lab', number: 'Nível 2', name: 'Laboratório', subtitle: 'Informática à noite', unlockAt: 800 },
  { id: 'festival', number: 'Nível 3', name: 'Festival', subtitle: 'Festa da escola', unlockAt: 2500 },
  { id: 'palco', number: 'Desafio final', name: 'Palco do Festival', subtitle: 'Alcance a Aura Máxima!', unlockAt: 5000 },
];

/** Recompensas liberadas por aura total acumulada (em ordem). */
export interface Reward {
  at: number;
  title: string;
  items: string[]; // ids no formato "categoria:id"
}

export const REWARDS: Reward[] = [
  {
    at: 0,
    title: 'Pátio da EEEP + camiseta + aura azul',
    items: ['level:patio', 'outfit:camiseta', 'aura:azul', 'color:branco', 'color:verde', 'color:azul', 'acc:nenhum'],
  },
  {
    at: 800,
    title: 'Laboratório + moletom + aura verde',
    items: ['level:lab', 'outfit:moletom', 'aura:verde', 'color:preto', 'color:cinza'],
  },
  {
    at: 2500,
    title: 'Festival + fones de ouvido + aura roxa',
    items: ['level:festival', 'acc:fones', 'aura:roxa', 'color:roxo', 'color:amarelo'],
  },
  {
    at: 5000,
    title: 'Desafio final no palco + roupa vermelha',
    items: ['level:palco', 'color:vermelho'],
  },
];

export const GOLD_ITEM = 'aura:dourada';

/** Nome leg�vel de um item no formato "categoria:id". */
export function itemName(item: string): string {
  const [cat, id] = item.split(':');
  switch (cat) {
    case 'level': {
      const l = LEVELS.find((x) => x.id === id);
      return l ? `${l.number}: ${l.name}` : id;
    }
    case 'outfit':
      return OUTFITS.find((x) => x.id === id)?.name ?? id;
    case 'acc':
      return id === 'fones' ? 'Fones de ouvido' : 'Sem acess�rio';
    case 'aura':
      return `Aura ${AURAS.find((x) => x.id === id)?.name.toLowerCase() ?? id}`;
    case 'color':
      return `Cor de roupa: ${CLOTH_COLORS.find((x) => x.id === id)?.name ?? id}`;
  }
  return item;
}

/** Texto curto explicando como liberar um item. */
export function unlockHint(item: string): string {
  if (item === GOLD_ITEM) return 'Aura M�xima no Desafio final';
  const r = REWARDS.find((x) => x.items.includes(item));
  return r ? `${r.at} de aura` : '';
}
