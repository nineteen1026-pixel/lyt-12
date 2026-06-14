import type { GameState, Plot, Animal, InventoryItem, Order, ReputationState } from '../types/game';

export const DB_CONFIG = {
  name: 'PixelFarmDB',
  version: 2
};

export interface DBStores {
  gameState: GameState;
  plots: Plot;
  animals: Animal;
  inventory: InventoryItem;
  orders: Order;
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
  },
  {
    name: 'orders',
    keyPath: 'id',
    indexes: [
      { name: 'status', keyPath: 'status' }
    ]
  }
];

export const INITIAL_REPUTATION: ReputationState = {
  score: 0,
  level: 1,
  completedOrders: 0,
  failedOrders: 0,
  rareSeedDropBoost: 0
};

export const INITIAL_GAME_STATE: GameState = {
  id: 'main',
  coins: 100,
  season: 'spring',
  day: 1,
  lastSaveTime: Date.now(),
  lastSeasonAdvance: Date.now(),
  weather: {
    current: 'sunny',
    forecast: [],
    lastWeatherChange: Date.now(),
    lastDayWeather: Date.now()
  },
  reputation: INITIAL_REPUTATION,
  lastOrderRefreshDay: 0
};
