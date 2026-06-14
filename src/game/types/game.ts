export type PlotState = 'empty' | 'tilled' | 'planted' | 'watered' | 'ready';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type ToolType = 'hoe' | 'water' | 'hand' | null;

export type WeatherType = 'sunny' | 'rainy' | 'snowy' | 'stormy';

export type BuildingType = 'sprinkler' | 'greenhouse' | 'barn';

export interface BuildingConfig {
  id: BuildingType;
  name: string;
  description: string;
  icon: string;
  price: number;
  footprint: { width: number; height: number };
  unlockPlotCount: number;
  effect: {
    sprinklerRange?: number;
    greenhouseSeasons?: Season[];
    barnCapacityBonus?: number;
    barnPreventSpoilage?: boolean;
  };
}

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  builtAt: number;
}

export interface Crop {
  type: string;
  plantedAt: number;
  watered: boolean;
  lastGrowthCheck: number;
  frozen?: boolean;
}

export interface Plot {
  x: number;
  y: number;
  state: PlotState;
  unlocked: boolean;
  crop?: Crop;
  buildingId?: string;
}

export interface WeatherState {
  current: WeatherType;
  forecast: WeatherType[];
  lastWeatherChange: number;
  lastDayWeather: number;
}

export interface Animal {
  id: string;
  type: 'chicken' | 'cow';
  lastProduceTime: number;
  hasProduct: boolean;
}

export interface Item {
  id: string;
  name: string;
  type: 'seed' | 'product' | 'animal';
  price: number;
  sellPrice: number;
  icon: string;
  description: string;
}

export interface CropConfig {
  id: string;
  name: string;
  growthTime: number;
  stages: number;
  sellPrice: number;
  seedPrice: number;
  seasons: Season[];
  productId: string;
  color: string;
}

export interface AnimalConfig {
  id: string;
  type: 'chicken' | 'cow';
  name: string;
  price: number;
  produceTime: number;
  productId: string;
  productAmount: number;
}

export type OrderStatus = 'active' | 'completed' | 'failed';

export type OrderTier = 'common' | 'rare' | 'epic' | 'legendary';

export interface Villager {
  id: string;
  name: string;
  avatar: string;
}

export interface OrderItem {
  itemId: string;
  quantity: number;
}

export interface OrderReward {
  coins: number;
  reputation: number;
  rareSeedId?: string;
  rareSeedQuantity?: number;
}

export interface Order {
  id: string;
  villagerId: string;
  tier: OrderTier;
  items: OrderItem[];
  reward: OrderReward;
  createdAt: number;
  deadline: number;
  status: OrderStatus;
}

export interface ReputationState {
  score: number;
  level: number;
  completedOrders: number;
  failedOrders: number;
  rareSeedDropBoost: number;
}

export interface GameState {
  id: string;
  coins: number;
  season: Season;
  day: number;
  lastSaveTime: number;
  lastSeasonAdvance: number;
  weather: WeatherState;
  reputation: ReputationState;
  lastOrderRefreshDay: number;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  addedAt?: number;
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type AchievementCategory = 'farming' | 'animal' | 'building' | 'order' | 'economy' | 'exploration' | 'seasonal';

export type CodexCategory = 'crop' | 'animal' | 'item' | 'building' | 'villager' | 'fish' | 'artifact';

export interface AchievementCondition {
  type: string;
  target: number;
  itemId?: string;
  tier?: OrderTier;
  season?: Season;
}

export interface AchievementReward {
  coins?: number;
  reputation?: number;
  itemId?: string;
  itemQuantity?: number;
  title?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: Rarity;
  conditions: AchievementCondition[];
  conditionLogic: 'all' | 'any';
  reward: AchievementReward;
  hidden?: boolean;
  secret?: boolean;
}

export interface AchievementProgress {
  achievementId: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
}

export interface CodexEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: CodexCategory;
  rarity: Rarity;
  discovered: boolean;
  discoveredAt?: number;
  count: number;
  hint?: string;
}

export interface GameStats {
  totalCropsHarvested: number;
  cropsHarvested: Record<string, number>;
  totalSeedsPlanted: number;
  seedsPlanted: Record<string, number>;
  totalProductsCollected: number;
  productsCollected: Record<string, number>;
  totalAnimalsOwned: number;
  animalsOwned: Record<string, number>;
  totalBuildingsBuilt: number;
  buildingsBuilt: Record<string, number>;
  totalOrdersCompleted: number;
  ordersCompletedByTier: Record<OrderTier, number>;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  totalItemsSold: number;
  totalItemsBought: number;
  totalDaysPlayed: number;
  seasonsExperienced: Record<Season, number>;
  totalPlayTime: number;
  plotsUnlocked: number;
  highestReputationLevel: number;
  rareSeedsFound: number;
  legendaryOrdersCompleted: number;
  perfectDays: number;
  stormsSurvived: number;
  itemsDiscovered: Record<string, number>;
  totalFishCaught: number;
  fishCaught: Record<string, number>;
  artifactsFound: number;
  artifactsDiscovered: Record<string, number>;
}

export interface AchievementState {
  achievements: Record<string, AchievementProgress>;
  unlockedCount: number;
  totalCount: number;
}

export interface CodexState {
  entries: Record<string, CodexEntry>;
  discoveredCount: number;
  totalCount: number;
}

export const GRID_WIDTH = 12;
export const GRID_HEIGHT = 8;
export const TILE_SIZE = 64;
export const INITIAL_UNLOCKED = 9;
export const SEASON_DURATION = 60000;
export const DAY_DURATION = 15000;
export const STORM_DESTROY_CHANCE = 0.2;
export const DEFAULT_INVENTORY_CAPACITY = 50;
export const BARN_CAPACITY_BONUS = 100;
export const SPOILAGE_DURATION = 300000;

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800'
};

export const RARITY_NAMES: Record<Rarity, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
};
