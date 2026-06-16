export type QualityGrade = 1 | 2 | 3 | 4 | 5;

export type PlotState = 'empty' | 'tilled' | 'planted' | 'watered' | 'ready';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type ToolType = 'hoe' | 'water' | 'hand' | null;

export type WeatherType = 'sunny' | 'rainy' | 'snowy' | 'stormy' | 'drought' | 'heatwave';

export type WeatherSeverity = 'light' | 'normal' | 'severe';

export type BuildingType = 'sprinkler' | 'greenhouse' | 'barn' | 'lightning_rod' | 'heater' | 'drainage';

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
    lightningRodRange?: number;
    lightningRodReduce?: number;
    heaterRange?: number;
    heaterReduce?: number;
    drainageRange?: number;
    drainageReduce?: number;
  };
}

export interface WeatherWarning {
  weather: WeatherType;
  severity: WeatherSeverity;
  message: string;
  issuedAt: number;
  targetDay: number;
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
  waterCount?: number;
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
  currentSeverity: WeatherSeverity;
  forecast: WeatherType[];
  forecastSeverities: WeatherSeverity[];
  lastWeatherChange: number;
  lastDayWeather: number;
}

export interface Animal {
  id: string;
  type: 'chicken' | 'cow';
  lastProduceTime: number;
  hasProduct: boolean;
  feedCount?: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'seed' | 'product' | 'animal' | 'mineral' | 'resource';
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
  minQuality?: QualityGrade;
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
  quality?: QualityGrade;
  dbKey?: string;
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type AchievementCategory = 'farming' | 'animal' | 'building' | 'order' | 'economy' | 'exploration' | 'seasonal' | 'disaster';

export type CodexCategory = 'crop' | 'animal' | 'item' | 'building' | 'villager' | 'fish' | 'artifact' | 'mineral';

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
  bestQuality?: QualityGrade;
  qualityCounts?: Record<QualityGrade, number>;
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
  cropsByQuality: Record<QualityGrade, number>;
  highestQualityHarvested: QualityGrade;
  totalQualityBonusCoins: number;
  totalMineExplored: number;
  minesCleared: number;
  totalMineralsMined: number;
  mineralsMined: Record<string, number>;
  mineHighestFloorReached: number;
  totalOresMined: Record<string, number>;
  mineExplorations: number;
  weatherWarningsReceived: number;
  weatherWarningsActed: number;
  disastersByType: Record<WeatherType, number>;
  severeDisastersSurvived: number;
  droughtsSurvived: number;
  heatwavesSurvived: number;
  severeStormsSurvived: number;
  severeFrostsSurvived: number;
  cropsSavedByGreenhouse: number;
  cropsSavedBySprinkler: number;
  cropsSavedByLightningRod: number;
  cropsSavedByHeater: number;
  cropsSavedByDrainage: number;
  totalCropsSavedByBuildings: number;
  perfectDisasterDefense: number;
  cropsLostToStorms: number;
  cropsLostToFrost: number;
  cropsLostToDrought: number;
  cropsLostToHeatwave: number;
  totalCropsLostToDisasters: number;
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

export const QUALITY_NAMES: Record<QualityGrade, string> = {
  1: '一星',
  2: '二星',
  3: '三星',
  4: '四星',
  5: '五星'
};

export const QUALITY_COLORS: Record<QualityGrade, string> = {
  1: '#9e9e9e',
  2: '#4caf50',
  3: '#2196f3',
  4: '#9c27b0',
  5: '#ff9800'
};

export const QUALITY_PRICE_MULTIPLIER: Record<QualityGrade, number> = {
  1: 0.6,
  2: 0.8,
  3: 1.0,
  4: 1.5,
  5: 2.5
};

export const QUALITY_WEIGHTS: Record<QualityGrade, number> = {
  1: 40,
  2: 30,
  3: 20,
  4: 8,
  5: 2
};

export type MineTileType = 'empty' | 'rock' | 'ore' | 'rare_ore' | 'treasure' | 'exit' | 'entry' | 'wall' | 'mushroom' | 'crystal';

export interface MineTile {
  x: number;
  y: number;
  type: MineTileType;
  mineralId?: string;
  hardness: number;
  mined: boolean;
  revealed: boolean;
  reward?: { coins?: number; itemId?: string; quantity?: number };
}

export interface MineFloor {
  floor: number;
  width: number;
  height: number;
  tiles: MineTile[][];
  playerX: number;
  playerY: number;
  entryX: number;
  entryY: number;
  exitX: number;
  exitY: number;
  stamina: number;
  maxStamina: number;
  explored: boolean;
  cleared: boolean;
}

export interface MineSession {
  id: string;
  currentFloor: number;
  maxFloor: number;
  floors: Record<number, MineFloor>;
  stamina: number;
  maxStamina: number;
  startedAt: number;
  totalCoinsGained: number;
  totalItemsGained: Array<{ itemId: string; quantity: number }>;
  active: boolean;
}

export interface MineralConfig {
  id: string;
  name: string;
  rarity: Rarity;
  icon: string;
  sellPrice: number;
  hardness: number;
  minFloor: number;
  weight: number;
  description: string;
}

export interface MineExploreResult {
  sessionId: string;
  floor: number;
  mineralId?: string;
  mineralName?: string;
  quantity: number;
  coins?: number;
  staminaCost: number;
  message: string;
  tilesMined: number;
  clearedFloor?: boolean;
  advancedFloor?: boolean;
  reachedFloor: number;
  newDiscoveries: string[];
}

export type SkillBranch = 'farming' | 'livestock' | 'quality';

export type SkillEffectType = 
  | 'crop_growth_speed'
  | 'crop_yield'
  | 'crop_quality'
  | 'animal_production_speed'
  | 'animal_yield'
  | 'animal_quality'
  | 'water_bonus'
  | 'feed_bonus'
  | 'greenhouse_boost'
  | 'rare_chance';

export interface SkillEffect {
  type: SkillEffectType;
  value: number;
  perLevel: boolean;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  branch: SkillBranch;
  maxLevel: number;
  currentLevel: number;
  effects: SkillEffect[];
  requires: string[];
  unlockAtLevel: number;
}

export interface SkillBranchConfig {
  id: SkillBranch;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface SkillTreeState {
  id: string;
  level: number;
  experience: number;
  totalExperience: number;
  skillPoints: number;
  unlockedNodes: Record<string, number>;
}

export interface SkillEffectBonus {
  cropGrowthSpeed: number;
  cropYield: number;
  cropQuality: number;
  animalProductionSpeed: number;
  animalYield: number;
  animalQuality: number;
  waterBonus: number;
  feedBonus: number;
  greenhouseBoost: number;
  rareChance: number;
}

export interface LevelUpResult {
  newLevel: number;
  skillPointsGained: number;
  unlockedSkills: string[];
}

export const EXPERIENCE_PER_LEVEL = 100;
export const EXPERIENCE_GROWTH_MULTIPLIER = 1.5;
export const SKILL_POINTS_PER_LEVEL = 1;

export const EXPERIENCE_REWARDS: Record<string, number> = {
  crop_harvested: 10,
  seed_planted: 2,
  product_collected: 15,
  animal_bought: 20,
  quality_harvest_1: 1,
  quality_harvest_2: 2,
  quality_harvest_3: 4,
  quality_harvest_4: 8,
  quality_harvest_5: 16,
};
