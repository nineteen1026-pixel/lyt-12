import type { CropConfig } from '../types/game';

export const CROPS: Record<string, CropConfig> = {
  turnip: {
    id: 'turnip',
    name: '白萝卜',
    growthTime: 30000,
    stages: 4,
    sellPrice: 15,
    seedPrice: 5,
    seasons: ['spring', 'autumn'],
    productId: 'turnip_product',
    color: '#ffffff'
  },
  potato: {
    id: 'potato',
    name: '土豆',
    growthTime: 45000,
    stages: 4,
    sellPrice: 25,
    seedPrice: 10,
    seasons: ['spring', 'summer', 'autumn'],
    productId: 'potato_product',
    color: '#d4a574'
  },
  tomato: {
    id: 'tomato',
    name: '番茄',
    growthTime: 60000,
    stages: 5,
    sellPrice: 40,
    seedPrice: 15,
    seasons: ['summer'],
    productId: 'tomato_product',
    color: '#e53935'
  },
  corn: {
    id: 'corn',
    name: '玉米',
    growthTime: 75000,
    stages: 5,
    sellPrice: 55,
    seedPrice: 20,
    seasons: ['summer', 'autumn'],
    productId: 'corn_product',
    color: '#ffd54f'
  },
  pumpkin: {
    id: 'pumpkin',
    name: '南瓜',
    growthTime: 90000,
    stages: 5,
    sellPrice: 80,
    seedPrice: 30,
    seasons: ['autumn'],
    productId: 'pumpkin_product',
    color: '#ff9800'
  },
  strawberry: {
    id: 'strawberry',
    name: '草莓',
    growthTime: 120000,
    stages: 6,
    sellPrice: 120,
    seedPrice: 50,
    seasons: ['spring'],
    productId: 'strawberry_product',
    color: '#e91e63'
  }
};

export const getCropConfig = (cropId: string): CropConfig | undefined => {
  return CROPS[cropId];
};

export const getCropsBySeason = (season: string): CropConfig[] => {
  return Object.values(CROPS).filter(crop => crop.seasons.includes(season as any));
};
