export type PlotState = 'empty' | 'tilled' | 'planted' | 'watered' | 'ready';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type ToolType = 'hoe' | 'water' | 'hand' | null;

export interface Crop {
  type: string;
  plantedAt: number;
  watered: boolean;
  lastGrowthCheck: number;
}

export interface Plot {
  x: number;
  y: number;
  state: PlotState;
  unlocked: boolean;
  crop?: Crop;
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

export interface GameState {
  id: string;
  coins: number;
  season: Season;
  day: number;
  lastSaveTime: number;
  lastSeasonAdvance: number;
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
