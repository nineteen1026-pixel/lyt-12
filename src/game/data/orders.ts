import type { Villager, OrderTier, Season } from '../types/game';

export const VILLAGERS: Villager[] = [
  { id: 'villager_1', name: '李大叔', avatar: '👴' },
  { id: 'villager_2', name: '王奶奶', avatar: '👵' },
  { id: 'villager_3', name: '张小妹', avatar: '👧' },
  { id: 'villager_4', name: '陈大哥', avatar: '👨' },
  { id: 'villager_5', name: '刘阿姨', avatar: '👩' },
  { id: 'villager_6', name: '赵爷爷', avatar: '🧓' },
  { id: 'villager_7', name: '孙小美', avatar: '👱‍♀️' },
  { id: 'villager_8', name: '周老板', avatar: '🧔' }
];

export interface OrderTemplate {
  itemId: string;
  minQuantity: number;
  maxQuantity: number;
  seasons: Season[];
}

export const ORDER_ITEMS: OrderTemplate[] = [
  { itemId: 'turnip_product', minQuantity: 3, maxQuantity: 8, seasons: ['spring', 'autumn', 'winter'] },
  { itemId: 'potato_product', minQuantity: 2, maxQuantity: 6, seasons: ['spring', 'summer', 'autumn', 'winter'] },
  { itemId: 'tomato_product', minQuantity: 2, maxQuantity: 5, seasons: ['summer', 'autumn'] },
  { itemId: 'corn_product', minQuantity: 2, maxQuantity: 5, seasons: ['summer', 'autumn'] },
  { itemId: 'pumpkin_product', minQuantity: 1, maxQuantity: 4, seasons: ['autumn', 'winter'] },
  { itemId: 'strawberry_product', minQuantity: 2, maxQuantity: 6, seasons: ['spring'] },
  { itemId: 'egg', minQuantity: 2, maxQuantity: 10, seasons: ['spring', 'summer', 'autumn', 'winter'] },
  { itemId: 'milk', minQuantity: 1, maxQuantity: 5, seasons: ['spring', 'summer', 'autumn', 'winter'] }
];

export const TIER_CONFIG: Record<OrderTier, {
  name: string;
  color: string;
  coinMultiplier: number;
  repReward: number;
  deadlineDays: [number, number];
  rareSeedChance: number;
  rarityWeight: number;
}> = {
  common: {
    name: '普通',
    color: '#9e9e9e',
    coinMultiplier: 1.2,
    repReward: 5,
    deadlineDays: [2, 3],
    rareSeedChance: 0,
    rarityWeight: 60
  },
  rare: {
    name: '稀有',
    color: '#2196f3',
    coinMultiplier: 1.6,
    repReward: 12,
    deadlineDays: [3, 4],
    rareSeedChance: 0.15,
    rarityWeight: 28
  },
  epic: {
    name: '史诗',
    color: '#9c27b0',
    coinMultiplier: 2.2,
    repReward: 25,
    deadlineDays: [4, 5],
    rareSeedChance: 0.4,
    rarityWeight: 10
  },
  legendary: {
    name: '传说',
    color: '#ff9800',
    coinMultiplier: 3.0,
    repReward: 50,
    deadlineDays: [5, 7],
    rareSeedChance: 0.8,
    rarityWeight: 2
  }
};

export const RARE_SEEDS = [
  { seedId: 'strawberry_seed', name: '草莓种子', minTier: 'rare' as OrderTier, weight: 40 },
  { seedId: 'pumpkin_seed', name: '南瓜种子', minTier: 'rare' as OrderTier, weight: 35 },
  { seedId: 'corn_seed', name: '玉米种子', minTier: 'epic' as OrderTier, weight: 20 },
  { seedId: 'tomato_seed', name: '番茄种子', minTier: 'epic' as OrderTier, weight: 5 }
];

export const REPUTATION_LEVELS = [
  { level: 1, minScore: 0, name: '新村民', tierBonus: 0, seedBoost: 0 },
  { level: 2, minScore: 50, name: '热心农夫', tierBonus: 5, seedBoost: 0.05 },
  { level: 3, minScore: 150, name: '知名农户', tierBonus: 12, seedBoost: 0.1 },
  { level: 4, minScore: 350, name: '农场达人', tierBonus: 20, seedBoost: 0.18 },
  { level: 5, minScore: 700, name: '传奇农场主', tierBonus: 30, seedBoost: 0.3 }
];

export const FAILURE_PENALTY = {
  reputationLoss: 15,
  coinPenaltyPercent: 0.05
};

export const DAILY_ORDER_COUNT = 3;

export function getVillagerById(id: string): Villager | undefined {
  return VILLAGERS.find(v => v.id === id);
}

export function getRandomVillager(): Villager {
  return VILLAGERS[Math.floor(Math.random() * VILLAGERS.length)];
}

export function getReputationLevel(score: number) {
  let current = REPUTATION_LEVELS[0];
  for (const level of REPUTATION_LEVELS) {
    if (score >= level.minScore) {
      current = level;
    }
  }
  return current;
}

export function getOrderItemsBySeason(season: Season): OrderTemplate[] {
  return ORDER_ITEMS.filter(item => item.seasons.includes(season));
}

export function pickWeightedTier(repLevel: number): OrderTier {
  const tiers: OrderTier[] = ['common', 'rare', 'epic', 'legendary'];
  const repBonus = getReputationLevel(repLevel * 50).tierBonus;
  
  const weights = tiers.map(tier => {
    const baseWeight = TIER_CONFIG[tier].rarityWeight;
    const bonus = tier !== 'common' ? repBonus : 0;
    return baseWeight + bonus;
  });
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < tiers.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return tiers[i];
    }
  }
  
  return 'common';
}

export function pickRareSeed(tier: OrderTier, seedBoost: number): { seedId: string; quantity: number } | null {
  const config = TIER_CONFIG[tier];
  const chance = config.rareSeedChance + seedBoost;
  
  if (Math.random() > chance) {
    return null;
  }
  
  const tierOrder: OrderTier[] = ['common', 'rare', 'epic', 'legendary'];
  const minTierIndex = tierOrder.indexOf(tier);
  
  const available = RARE_SEEDS.filter(seed => 
    tierOrder.indexOf(seed.minTier) <= minTierIndex
  );
  
  const totalWeight = available.reduce((a, b) => a + b.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const seed of available) {
    random -= seed.weight;
    if (random <= 0) {
      const quantity = tier === 'legendary' ? 3 : tier === 'epic' ? 2 : 1;
      return { seedId: seed.seedId, quantity };
    }
  }
  
  return null;
}
