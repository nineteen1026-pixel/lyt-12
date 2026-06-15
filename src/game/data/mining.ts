import type { MineralConfig, MineTile, MineFloor, MineSession, MineTileType, Rarity } from '../types/game';

export const MINERAL_CONFIGS: MineralConfig[] = [
  { id: 'coal', name: '煤矿', rarity: 'common', icon: '⬛', sellPrice: 8, hardness: 1, minFloor: 1, weight: 40, description: '最常见的矿石，可用于燃料' },
  { id: 'copper', name: '铜矿', rarity: 'common', icon: '🟫', sellPrice: 15, hardness: 1, minFloor: 1, weight: 30, description: '常见的金属矿石，呈红棕色' },
  { id: 'iron', name: '铁矿', rarity: 'uncommon', icon: '⬜', sellPrice: 35, hardness: 2, minFloor: 2, weight: 25, description: '坚硬的金属矿石，工业必备' },
  { id: 'silver', name: '银矿', rarity: 'uncommon', icon: '🔘', sellPrice: 60, hardness: 2, minFloor: 3, weight: 18, description: '闪亮的贵金属矿石' },
  { id: 'gold', name: '金矿', rarity: 'rare', icon: '🟨', sellPrice: 120, hardness: 3, minFloor: 4, weight: 12, description: '珍贵的黄金矿石' },
  { id: 'mithril', name: '秘银矿', rarity: 'rare', icon: '🔷', sellPrice: 200, hardness: 3, minFloor: 5, weight: 8, description: '传说中的魔法金属' },
  { id: 'adamantite', name: '精金矿', rarity: 'epic', icon: '💠', sellPrice: 400, hardness: 4, minFloor: 7, weight: 5, description: '极其坚硬的稀有金属' },
  { id: 'ruby', name: '红宝石', rarity: 'epic', icon: '🔴', sellPrice: 350, hardness: 4, minFloor: 6, weight: 4, description: '璀璨的红色宝石' },
  { id: 'sapphire', name: '蓝宝石', rarity: 'epic', icon: '🔵', sellPrice: 350, hardness: 4, minFloor: 6, weight: 4, description: '深邃的蓝色宝石' },
  { id: 'emerald', name: '祖母绿', rarity: 'epic', icon: '🟢', sellPrice: 350, hardness: 4, minFloor: 6, weight: 4, description: '翠绿的珍贵宝石' },
  { id: 'diamond', name: '钻石', rarity: 'legendary', icon: '💎', sellPrice: 1000, hardness: 5, minFloor: 8, weight: 2, description: '最坚硬的珍贵宝石' },
  { id: 'dragonstone', name: '龙晶石', rarity: 'legendary', icon: '🔮', sellPrice: 2500, hardness: 5, minFloor: 10, weight: 1, description: '蕴含远古龙之力量的神秘晶石' }
];

export const TOTAL_MINE_FLOORS = 12;
export const BASE_FLOOR_WIDTH = 9;
export const BASE_FLOOR_HEIGHT = 7;
export const BASE_STAMINA_PER_FLOOR = 30;
export const STAMINA_PER_HARDNESS = 5;
export const STAMINA_COOLDOWN = 60000;

export function getMineralConfig(id: string): MineralConfig | undefined {
  return MINERAL_CONFIGS.find(m => m.id === id);
}

export function getMineralsByFloor(floor: number): MineralConfig[] {
  return MINERAL_CONFIGS.filter(m => floor >= m.minFloor);
}

export function rollMineral(floor: number, luckBoost: number = 0): MineralConfig | null {
  const available = getMineralsByFloor(floor);
  if (available.length === 0) return null;

  const adjusted = available.map(m => {
    let weight = m.weight;
    if (m.rarity !== 'common') {
      weight += luckBoost;
      weight += floor * 0.5;
    }
    return { mineral: m, weight };
  });

  const totalWeight = adjusted.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const { mineral, weight } of adjusted) {
    roll -= weight;
    if (roll <= 0) return mineral;
  }

  return available[0];
}

function generateFloorWidth(floor: number): number {
  return BASE_FLOOR_WIDTH + Math.min(5, Math.floor(floor / 2));
}

function generateFloorHeight(floor: number): number {
  return BASE_FLOOR_HEIGHT + Math.min(5, Math.floor(floor / 3));
}

function createTile(x: number, y: number, type: MineTileType, hardness: number = 0): MineTile {
  return { x, y, type, hardness, mined: false, revealed: false };
}

export function generateMineFloor(floor: number): MineFloor {
  const width = generateFloorWidth(floor);
  const height = generateFloorHeight(floor);
  const tiles: MineTile[][] = [];

  const entryX = 0;
  const entryY = Math.floor(height / 2);
  const exitX = width - 1;
  const exitY = Math.floor(height / 2) + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2);

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      let tile: MineTile;
      if (x === entryX && y === entryY) {
        tile = createTile(x, y, 'entry', 0);
        tile.revealed = true;
      } else if (x === exitX && y === Math.min(height - 1, Math.max(0, exitY))) {
        tile = createTile(x, y, 'exit', 0);
      } else if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        tile = createTile(x, y, 'wall', 99);
      } else {
        const roll = Math.random();
        if (roll < 0.35) {
          tile = createTile(x, y, 'empty', 0);
        } else if (roll < 0.55) {
          tile = createTile(x, y, 'rock', 1 + Math.floor(floor / 4));
        } else if (roll < 0.80) {
          const mineral = rollMineral(floor);
          tile = createTile(x, y, 'ore', mineral?.hardness || 1);
          tile.mineralId = mineral?.id;
        } else if (roll < 0.92) {
          const mineral = rollMineral(floor + 2);
          tile = createTile(x, y, 'rare_ore', mineral?.hardness || 2);
          tile.mineralId = mineral?.id;
        } else if (roll < 0.96) {
          tile = createTile(x, y, 'mushroom', 1);
          tile.reward = { itemId: 'mushroom', quantity: 1 + Math.floor(Math.random() * 3) };
        } else {
          tile = createTile(x, y, 'treasure', 3);
          tile.reward = { coins: 50 + Math.floor(Math.random() * (floor * 50)) };
        }
      }
      tiles[y][x] = tile;
    }
  }

  revealAround(tiles, entryX, entryY);

  return {
    floor,
    width,
    height,
    tiles,
    playerX: entryX,
    playerY: entryY,
    entryX,
    entryY,
    exitX,
    exitY: Math.min(height - 1, Math.max(0, exitY)),
    stamina: BASE_STAMINA_PER_FLOOR + floor * 5,
    maxStamina: BASE_STAMINA_PER_FLOOR + floor * 5,
    explored: false,
    cleared: false
  };
}

export function revealAround(tiles: MineTile[][], x: number, y: number) {
  const height = tiles.length;
  const width = tiles[0].length;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        tiles[ny][nx].revealed = true;
      }
    }
  }
}

export function canMoveTo(floor: MineFloor, x: number, y: number): boolean {
  if (x < 0 || x >= floor.width || y < 0 || y >= floor.height) return false;
  const tile = floor.tiles[y][x];
  if (tile.type === 'wall') return false;
  if ((tile.type === 'rock' || tile.type === 'ore' || tile.type === 'rare_ore' || tile.type === 'treasure' || tile.type === 'mushroom') && !tile.mined) {
    return false;
  }
  return true;
}

export function getStaminaCost(tile: MineTile): number {
  return STAMINA_PER_HARDNESS * Math.max(1, tile.hardness);
}

export function isAdjacent(ax: number, ay: number, bx: number, by: number): boolean {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
}

export function createMineSession(maxFloor: number = TOTAL_MINE_FLOORS): MineSession {
  const firstFloor = generateMineFloor(1);
  return {
    id: `mine_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    currentFloor: 1,
    maxFloor,
    floors: { 1: firstFloor },
    stamina: firstFloor.maxStamina,
    maxStamina: firstFloor.maxStamina,
    startedAt: Date.now(),
    totalCoinsGained: 0,
    totalItemsGained: [],
    active: true
  };
}

export function addItemsToSession(session: MineSession, itemId: string, quantity: number) {
  const existing = session.totalItemsGained.find(i => i.itemId === itemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    session.totalItemsGained.push({ itemId, quantity });
  }
}

export const MINE_ENTRY_COST = 20;
export const MINE_STAMINA_POTION_COST = 50;
export const MINE_STAMINA_POTION_AMOUNT = 30;

export const RARITY_BASE_COLORS: Record<Rarity, string> = {
  common: '#555555',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800'
};

export const TILE_ICONS: Record<MineTileType, string> = {
  empty: '·',
  rock: '🪨',
  ore: '⛏️',
  rare_ore: '✨',
  treasure: '📦',
  exit: '🚪',
  entry: '🏁',
  wall: '🧱',
  mushroom: '🍄',
  crystal: '💎'
};
