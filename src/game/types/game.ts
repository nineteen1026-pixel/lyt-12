export type PlotState = 'empty' | 'tilled' | 'planted' | 'watered' | 'ready';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type ToolType = 'hoe' | 'water' | 'hand' | null;

export type WeatherType = 'sunny' | 'rainy' | 'snowy' | 'stormy';

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
}

export const GRID_WIDTH = 12;
export const GRID_HEIGHT = 8;
export const TILE_SIZE = 64;
export const INITIAL_UNLOCKED = 9;
export const SEASON_DURATION = 60000;
export const DAY_DURATION = 15000;
export const STORM_DESTROY_CHANCE = 0.2;
