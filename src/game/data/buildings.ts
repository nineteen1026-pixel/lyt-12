import type { BuildingConfig, BuildingType, Season } from '../types/game';

const ALL_SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  sprinkler: {
    id: 'sprinkler',
    name: '洒水器',
    description: '自动为周围范围内的地块浇水，维持湿润状态',
    icon: '💧',
    price: 200,
    footprint: { width: 1, height: 1 },
    unlockPlotCount: 12,
    effect: {
      sprinklerRange: 1
    }
  },
  greenhouse: {
    id: 'greenhouse',
    name: '温室',
    description: '覆盖范围内的地块突破季节限制，全年可种植任意作物',
    icon: '🏠',
    price: 500,
    footprint: { width: 2, height: 2 },
    unlockPlotCount: 16,
    effect: {
      greenhouseSeasons: ALL_SEASONS
    }
  },
  barn: {
    id: 'barn',
    name: '谷仓',
    description: '扩展库存容量，并防止农产品腐坏',
    icon: '🏚️',
    price: 350,
    footprint: { width: 2, height: 1 },
    unlockPlotCount: 12,
    effect: {
      barnCapacityBonus: 100,
      barnPreventSpoilage: true
    }
  },
  lightning_rod: {
    id: 'lightning_rod',
    name: '防雷针',
    description: '吸引雷电并保护周围2格内的作物免受雷暴摧毁',
    icon: '⚡',
    price: 280,
    footprint: { width: 1, height: 1 },
    unlockPlotCount: 14,
    effect: {
      lightningRodRange: 2,
      lightningRodReduce: 0.7
    }
  },
  heater: {
    id: 'heater',
    name: '加热器',
    description: '为周围1格内的作物供暖，防止雪天冻结与冰霜伤害',
    icon: '🔥',
    price: 260,
    footprint: { width: 1, height: 1 },
    unlockPlotCount: 14,
    effect: {
      heaterRange: 1,
      heaterReduce: 1
    }
  },
  drainage: {
    id: 'drainage',
    name: '排水沟',
    description: '快速排出雨水，减弱雷暴对周围2格内作物的破坏',
    icon: '🌊',
    price: 220,
    footprint: { width: 1, height: 1 },
    unlockPlotCount: 14,
    effect: {
      drainageRange: 2,
      drainageReduce: 0.5
    }
  }
};

export const getBuildingConfig = (type: BuildingType): BuildingConfig | undefined => {
  return BUILDINGS[type];
};

export const getAllBuildingConfigs = (): BuildingConfig[] => {
  return Object.values(BUILDINGS);
};

export const getUnlockedBuildings = (unlockedPlotCount: number): BuildingConfig[] => {
  return Object.values(BUILDINGS).filter(b => unlockedPlotCount >= b.unlockPlotCount);
};
