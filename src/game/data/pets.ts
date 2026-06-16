import type { PetConfig, PetType } from '../types/game';

export const PETS: Record<string, PetConfig> = {
  cat: {
    id: 'cat',
    type: 'cat',
    name: '小橘猫',
    description: '慵懒的橘猫，喜欢在阳光下打盹。它的呼噜声能让作物生长得更快。',
    price: 500,
    icon: '🐱',
    color: '#f59e0b',
    bonuses: [
      { type: 'crop_growth_speed', value: 0.15 },
      { type: 'rare_chance', value: 0.05 }
    ],
    happinessDecayRate: 0.5,
    maxHappinessBonus: 0.1
  },
  dog: {
    id: 'dog',
    type: 'dog',
    name: '小柴犬',
    description: '忠诚的柴犬，会帮你照看家畜。家畜的产量和品质都会提升。',
    price: 600,
    icon: '🐕',
    color: '#d97706',
    bonuses: [
      { type: 'animal_yield', value: 0.15 },
      { type: 'animal_quality', value: 0.1 }
    ],
    happinessDecayRate: 0.6,
    maxHappinessBonus: 0.1
  },
  rabbit: {
    id: 'rabbit',
    type: 'rabbit',
    name: '小白兔',
    description: '蹦蹦跳跳的小白兔，它会帮你留意作物的水分。作物产量更高。',
    price: 450,
    icon: '🐰',
    color: '#f3f4f6',
    bonuses: [
      { type: 'crop_yield', value: 0.15 },
      { type: 'water_bonus', value: 0.1 }
    ],
    happinessDecayRate: 0.4,
    maxHappinessBonus: 0.1
  },
  bird: {
    id: 'bird',
    type: 'bird',
    name: '小鹦鹉',
    description: '聪明的小鹦鹉，会提醒你按时喂食家畜。家畜生产速度加快。',
    price: 550,
    icon: '🦜',
    color: '#059669',
    bonuses: [
      { type: 'animal_production_speed', value: 0.2 },
      { type: 'feed_bonus', value: 0.1 }
    ],
    happinessDecayRate: 0.55,
    maxHappinessBonus: 0.1
  },
  fox: {
    id: 'fox',
    type: 'fox',
    name: '小狐狸',
    description: '神秘的小狐狸，据说能带来好运。作物品质和稀有物品几率大幅提升。',
    price: 1000,
    icon: '🦊',
    color: '#ea580c',
    bonuses: [
      { type: 'crop_quality', value: 0.15 },
      { type: 'rare_chance', value: 0.1 }
    ],
    happinessDecayRate: 0.7,
    maxHappinessBonus: 0.15
  }
};

export const getPetConfig = (petType: string): PetConfig | undefined => {
  return PETS[petType];
};

export const getAllPetConfigs = (): PetConfig[] => {
  return Object.values(PETS);
};

export const getPetPrice = (petType: PetType): number => {
  const config = getPetConfig(petType);
  return config?.price || 0;
};
