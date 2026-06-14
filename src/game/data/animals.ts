import type { AnimalConfig } from '../types/game';

export const ANIMALS: Record<string, AnimalConfig> = {
  chicken: {
    id: 'chicken',
    type: 'chicken',
    name: '小鸡',
    price: 100,
    produceTime: 45000,
    productId: 'egg',
    productAmount: 1
  },
  cow: {
    id: 'cow',
    type: 'cow',
    name: '奶牛',
    price: 300,
    produceTime: 90000,
    productId: 'milk',
    productAmount: 1
  }
};

export const getAnimalConfig = (animalType: string): AnimalConfig | undefined => {
  return ANIMALS[animalType];
};
