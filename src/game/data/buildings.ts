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
