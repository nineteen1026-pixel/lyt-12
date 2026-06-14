import type { GameState, Plot, Animal, InventoryItem } from '../types/game';

export const DB_CONFIG = {
  name: 'PixelFarmDB',
  version: 1
};

export interface DBStores {
  gameState: GameState;
  plots: Plot;
  animals: Animal;
  inventory: InventoryItem;
}

export const STORE_CONFIGS = [
  {
    name: 'gameState',
    keyPath: 'id'
  },
  {
    name: 'plots',
    keyPath: ['x', 'y']
  },
  {
    name: 'animals',
    keyPath: 'id'
  },
  {
    name: 'inventory',
    keyPath: 'itemId'
  }
];

export const INITIAL_GAME_STATE: GameState = {
  id: 'main',
  coins: 100,
  season: 'spring',
  day: 1,
  lastSaveTime: Date.now(),
  lastSeasonAdvance: Date.now()
};
