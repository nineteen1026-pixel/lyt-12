import type { Achievement, AchievementCategory } from '../types/game';

export const ACHIEVEMENT_CATEGORY_NAMES: Record<AchievementCategory, string> = {
  farming: '农耕',
  animal: '畜牧',
  building: '建筑',
  order: '订单',
  economy: '经济',
  exploration: '探索',
  seasonal: '季节'
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_harvest',
    name: '初尝收获',
    description: '收获你的第一株作物',
    icon: '🌱',
    category: 'farming',
    rarity: 'common',
    conditions: [{ type: 'totalCropsHarvested', target: 1 }],
    conditionLogic: 'all',
    reward: { coins: 50, reputation: 5 }
  },
  {
    id: 'green_thumb',
    name: '绿手指',
    description: '累计收获100株作物',
    icon: '🌿',
    category: 'farming',
    rarity: 'uncommon',
    conditions: [{ type: 'totalCropsHarvested', target: 100 }],
    conditionLogic: 'all',
    reward: { coins: 200, reputation: 15 }
  },
  {
    id: 'master_farmer',
    name: '农业大师',
    description: '累计收获500株作物',
    icon: '👨‍🌾',
    category: 'farming',
    rarity: 'rare',
    conditions: [{ type: 'totalCropsHarvested', target: 500 }],
    conditionLogic: 'all',
    reward: { coins: 500, reputation: 30, title: '农业大师' }
  },
  {
    id: 'crop_collector',
    name: '作物收藏家',
    description: '种植所有种类的作物',
    icon: '🌾',
    category: 'farming',
    rarity: 'epic',
    conditions: [
      { type: 'seedsPlanted', itemId: 'turnip', target: 1 },
      { type: 'seedsPlanted', itemId: 'potato', target: 1 },
      { type: 'seedsPlanted', itemId: 'tomato', target: 1 },
      { type: 'seedsPlanted', itemId: 'corn', target: 1 },
      { type: 'seedsPlanted', itemId: 'pumpkin', target: 1 },
      { type: 'seedsPlanted', itemId: 'strawberry', target: 1 }
    ],
    conditionLogic: 'all',
    reward: { coins: 800, reputation: 50 }
  },
  {
    id: 'strawberry_lover',
    name: '草莓爱好者',
    description: '收获50颗草莓',
    icon: '🍓',
    category: 'farming',
    rarity: 'rare',
    conditions: [{ type: 'cropsHarvested', itemId: 'strawberry', target: 50 }],
    conditionLogic: 'all',
    reward: { coins: 300, reputation: 20 }
  },
  {
    id: 'pumpkin_king',
    name: '南瓜之王',
    description: '收获100个南瓜',
    icon: '🎃',
    category: 'farming',
    rarity: 'epic',
    conditions: [{ type: 'cropsHarvested', itemId: 'pumpkin', target: 100 }],
    conditionLogic: 'all',
    reward: { coins: 600, reputation: 40, title: '南瓜之王' }
  },
  {
    id: 'first_egg',
    name: '第一枚鸡蛋',
    description: '收集第一枚鸡蛋',
    icon: '🥚',
    category: 'animal',
    rarity: 'common',
    conditions: [{ type: 'productsCollected', itemId: 'egg', target: 1 }],
    conditionLogic: 'all',
    reward: { coins: 30, reputation: 5 }
  },
  {
    id: 'dairy_farmer',
    name: '奶农',
    description: '收集50桶牛奶',
    icon: '🥛',
    category: 'animal',
    rarity: 'uncommon',
    conditions: [{ type: 'productsCollected', itemId: 'milk', target: 50 }],
    conditionLogic: 'all',
    reward: { coins: 200, reputation: 15 }
  },
  {
    id: 'animal_lover',
    name: '动物爱好者',
    description: '拥有5只以上的动物',
    icon: '🐾',
    category: 'animal',
    rarity: 'uncommon',
    conditions: [{ type: 'totalAnimalsOwned', target: 5 }],
    conditionLogic: 'all',
    reward: { coins: 150, reputation: 10 }
  },
  {
    id: 'livestock_magnate',
    name: '畜牧大亨',
    description: '拥有20只以上的动物',
    icon: '🏆',
    category: 'animal',
    rarity: 'epic',
    conditions: [{ type: 'totalAnimalsOwned', target: 20 }],
    conditionLogic: 'all',
    reward: { coins: 800, reputation: 40, title: '畜牧大亨' }
  },
  {
    id: 'first_building',
    name: '奠基者',
    description: '建造第一座建筑',
    icon: '🏗️',
    category: 'building',
    rarity: 'common',
    conditions: [{ type: 'totalBuildingsBuilt', target: 1 }],
    conditionLogic: 'all',
    reward: { coins: 50, reputation: 5 }
  },
  {
    id: 'architect',
    name: '建筑师',
    description: '建造所有类型的建筑',
    icon: '🏛️',
    category: 'building',
    rarity: 'rare',
    conditions: [
      { type: 'buildingsBuilt', itemId: 'sprinkler', target: 1 },
      { type: 'buildingsBuilt', itemId: 'greenhouse', target: 1 },
      { type: 'buildingsBuilt', itemId: 'barn', target: 1 }
    ],
    conditionLogic: 'all',
    reward: { coins: 400, reputation: 25 }
  },
  {
    id: 'first_order',
    name: '初次交易',
    description: '完成第一个订单',
    icon: '📋',
    category: 'order',
    rarity: 'common',
    conditions: [{ type: 'totalOrdersCompleted', target: 1 }],
    conditionLogic: 'all',
    reward: { coins: 30, reputation: 10 }
  },
  {
    id: 'order_master',
    name: '订单达人',
    description: '完成50个订单',
    icon: '📦',
    category: 'order',
    rarity: 'rare',
    conditions: [{ type: 'totalOrdersCompleted', target: 50 }],
    conditionLogic: 'all',
    reward: { coins: 300, reputation: 30 }
  },
  {
    id: 'legendary_trader',
    name: '传奇商人',
    description: '完成10个传说级订单',
    icon: '⭐',
    category: 'order',
    rarity: 'legendary',
    conditions: [{ type: 'ordersCompletedByTier', tier: 'legendary', target: 10 }],
    conditionLogic: 'all',
    reward: { coins: 1000, reputation: 80, title: '传奇商人' }
  },
  {
    id: 'first_coin',
    name: '第一桶金',
    description: '累计赚取100金币',
    icon: '💰',
    category: 'economy',
    rarity: 'common',
    conditions: [{ type: 'totalCoinsEarned', target: 100 }],
    conditionLogic: 'all',
    reward: { coins: 20, reputation: 3 }
  },
  {
    id: 'wealthy_farmer',
    name: '富裕农夫',
    description: '累计赚取5000金币',
    icon: '💎',
    category: 'economy',
    rarity: 'rare',
    conditions: [{ type: 'totalCoinsEarned', target: 5000 }],
    conditionLogic: 'all',
    reward: { coins: 500, reputation: 25 }
  },
  {
    id: 'millionaire',
    name: '百万富翁',
    description: '累计赚取100000金币',
    icon: '👑',
    category: 'economy',
    rarity: 'legendary',
    conditions: [{ type: 'totalCoinsEarned', target: 100000 }],
    conditionLogic: 'all',
    reward: { coins: 5000, reputation: 100, title: '百万富翁' }
  },
  {
    id: 'shopaholic',
    name: '购物狂',
    description: '累计花费3000金币',
    icon: '🛒',
    category: 'economy',
    rarity: 'uncommon',
    conditions: [{ type: 'totalCoinsSpent', target: 3000 }],
    conditionLogic: 'all',
    reward: { coins: 200, reputation: 10 }
  },
  {
    id: 'land_owner',
    name: '地主',
    description: '解锁所有地块',
    icon: '🗺️',
    category: 'exploration',
    rarity: 'epic',
    conditions: [{ type: 'plotsUnlocked', target: 96 }],
    conditionLogic: 'all',
    reward: { coins: 600, reputation: 40, title: '大地主' }
  },
  {
    id: 'seasoned_farmer',
    name: '四季农夫',
    description: '经历所有季节',
    icon: '🌍',
    category: 'seasonal',
    rarity: 'uncommon',
    conditions: [
      { type: 'seasonsExperienced', season: 'spring', target: 1 },
      { type: 'seasonsExperienced', season: 'summer', target: 1 },
      { type: 'seasonsExperienced', season: 'autumn', target: 1 },
      { type: 'seasonsExperienced', season: 'winter', target: 1 }
    ],
    conditionLogic: 'all',
    reward: { coins: 200, reputation: 15 }
  },
  {
    id: 'winter_survivor',
    name: '冬日幸存者',
    description: '在冬季存活5天',
    icon: '❄️',
    category: 'seasonal',
    rarity: 'rare',
    conditions: [{ type: 'seasonsExperienced', season: 'winter', target: 5 }],
    conditionLogic: 'all',
    reward: { coins: 300, reputation: 20 }
  },
  {
    id: 'storm_survivor',
    name: '风暴幸存者',
    description: '经历10次暴风雨',
    icon: '⛈️',
    category: 'seasonal',
    rarity: 'rare',
    conditions: [{ type: 'stormsSurvived', target: 10 }],
    conditionLogic: 'all',
    reward: { coins: 250, reputation: 20 }
  },
  {
    id: 'reputation_5',
    name: '小有名气',
    description: '达到5级声望',
    icon: '🌟',
    category: 'order',
    rarity: 'epic',
    conditions: [{ type: 'highestReputationLevel', target: 5 }],
    conditionLogic: 'all',
    reward: { coins: 500, reputation: 50 }
  },
  {
    id: 'rare_seed_hunter',
    name: '稀有种子猎人',
    description: '获得20颗稀有种子',
    icon: '🌰',
    category: 'farming',
    rarity: 'rare',
    conditions: [{ type: 'rareSeedsFound', target: 20 }],
    conditionLogic: 'all',
    reward: { coins: 400, reputation: 25 }
  },
  {
    id: 'perfect_day',
    name: '完美一天',
    description: '一天内完成所有订单且作物全部浇灌',
    icon: '☀️',
    category: 'exploration',
    rarity: 'epic',
    conditions: [{ type: 'perfectDays', target: 1 }],
    conditionLogic: 'all',
    reward: { coins: 300, reputation: 30 }
  },
  {
    id: 'veteran_farmer',
    name: '资深农夫',
    description: '游戏时长超过1小时',
    icon: '⏰',
    category: 'exploration',
    rarity: 'uncommon',
    conditions: [{ type: 'totalPlayTime', target: 3600000 }],
    conditionLogic: 'all',
    reward: { coins: 200, reputation: 15 }
  },
  {
    id: 'cornucopia',
    name: '五谷丰登',
    description: '同时拥有所有种类的农产品',
    icon: '🧺',
    category: 'farming',
    rarity: 'legendary',
    hidden: true,
    conditions: [
      { type: 'itemsDiscovered', itemId: 'turnip_product', target: 1 },
      { type: 'itemsDiscovered', itemId: 'potato_product', target: 1 },
      { type: 'itemsDiscovered', itemId: 'tomato_product', target: 1 },
      { type: 'itemsDiscovered', itemId: 'corn_product', target: 1 },
      { type: 'itemsDiscovered', itemId: 'pumpkin_product', target: 1 },
      { type: 'itemsDiscovered', itemId: 'strawberry_product', target: 1 },
      { type: 'itemsDiscovered', itemId: 'egg', target: 1 },
      { type: 'itemsDiscovered', itemId: 'milk', target: 1 }
    ],
    conditionLogic: 'all',
    reward: { coins: 2000, reputation: 100, title: '五谷丰登' }
  },
  {
    id: 'collection_complete',
    name: '图鉴大师',
    description: '解锁图鉴中所有条目',
    icon: '📖',
    category: 'exploration',
    rarity: 'legendary',
    secret: true,
    conditions: [{ type: 'codexCompletion', target: 100 }],
    conditionLogic: 'all',
    reward: { coins: 5000, reputation: 200, title: '图鉴大师' }
  }
];

export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

export const getAchievementsByCategory = (category: AchievementCategory): Achievement[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

export const getTotalAchievementCount = (): number => {
  return ACHIEVEMENTS.length;
};
