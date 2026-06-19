import type { AffinityStage, FarmWorkerTaskType } from '../types/game';

export const HIRE_REPUTATION_UNLOCK: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4
};

export const REPUTATION_TASK_UNLOCK: Record<number, FarmWorkerTaskType[]> = {
  1: [],
  2: ['till'],
  3: ['till', 'water'],
  4: ['till', 'water', 'harvest'],
  5: ['till', 'water', 'harvest']
};

export const VILLAGER_TASK_UNLOCK: Record<AffinityStage, FarmWorkerTaskType[]> = {
  0: [],
  1: ['till'],
  2: ['till', 'water'],
  3: ['till', 'water', 'harvest'],
  4: ['till', 'water', 'harvest'],
  5: ['till', 'water', 'harvest']
};

export const BASE_WAGE: Record<AffinityStage, number> = {
  0: 0,
  1: 50,
  2: 40,
  3: 35,
  4: 30,
  5: 25
};

export const YIELD_SHARE_RATE: Record<AffinityStage, number> = {
  0: 0,
  1: 0.3,
  2: 0.25,
  3: 0.2,
  4: 0.15,
  5: 0.1
};

export const TASK_DESCRIPTIONS: Record<FarmWorkerTaskType, string> = {
  till: '翻地：将空地翻成可种植的田地',
  water: '浇水：为作物浇水加速生长',
  harvest: '收获：自动收获成熟作物'
};

export const TASK_ICONS: Record<FarmWorkerTaskType, string> = {
  till: '⛏️',
  water: '💧',
  harvest: '🌾'
};

export function getMaxHireSlots(reputationLevel: number): number {
  return HIRE_REPUTATION_UNLOCK[reputationLevel] ?? 0;
}

export function getAvailableTasksForReputation(reputationLevel: number): FarmWorkerTaskType[] {
  return REPUTATION_TASK_UNLOCK[reputationLevel] ?? [];
}

export function getAvailableTasksForStage(stage: AffinityStage): FarmWorkerTaskType[] {
  return VILLAGER_TASK_UNLOCK[stage] ?? [];
}

export function getDailyWage(stage: AffinityStage): number {
  return BASE_WAGE[stage] ?? 50;
}

export function getYieldShareRate(stage: AffinityStage): number {
  return YIELD_SHARE_RATE[stage] ?? 0.3;
}

export function canHireVillager(stage: AffinityStage): boolean {
  return stage >= 1;
}
