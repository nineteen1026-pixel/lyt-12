import type { InsurancePlanConfig, InsurancePlanType, WeatherType } from '../types/game';

export const INSURANCE_PLANS: Record<InsurancePlanType, InsurancePlanConfig> = {
  basic: {
    id: 'basic',
    name: '基础险',
    description: '保障雷暴灾害造成的作物损失，适合新手农场主',
    icon: '📜',
    dailyPremium: 15,
    coveredWeathers: ['stormy'],
    payoutMultiplier: 0.6,
    qualityBonus: 0.2,
    unlockPlotCount: 9
  },
  standard: {
    id: 'standard',
    name: '标准险',
    description: '保障雷暴与雪灾，兼顾春夏冬三季风险',
    icon: '📋',
    dailyPremium: 30,
    coveredWeathers: ['stormy', 'snowy'],
    payoutMultiplier: 0.75,
    qualityBonus: 0.35,
    unlockPlotCount: 16
  },
  comprehensive: {
    id: 'comprehensive',
    name: '全面险',
    description: '全方位保障所有气象灾害，高品质作物额外加成',
    icon: '🛡️',
    dailyPremium: 55,
    coveredWeathers: ['stormy', 'snowy', 'drought', 'heatwave'],
    payoutMultiplier: 0.9,
    qualityBonus: 0.5,
    unlockPlotCount: 25
  }
};

export const getInsurancePlan = (planId: InsurancePlanType): InsurancePlanConfig | undefined => {
  return INSURANCE_PLANS[planId];
};

export const getAllInsurancePlans = (): InsurancePlanConfig[] => {
  return Object.values(INSURANCE_PLANS);
};

export const getUnlockedInsurancePlans = (unlockedPlotCount: number): InsurancePlanConfig[] => {
  return Object.values(INSURANCE_PLANS).filter(p => unlockedPlotCount >= p.unlockPlotCount);
};

export const isWeatherCovered = (plan: InsurancePlanType, weather: WeatherType): boolean => {
  const planConfig = INSURANCE_PLANS[plan];
  return planConfig ? planConfig.coveredWeathers.includes(weather) : false;
};
