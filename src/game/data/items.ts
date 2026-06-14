import type { Item } from '../types/game';

export const ITEMS: Record<string, Item> = {
  turnip_seed: {
    id: 'turnip_seed',
    name: '白萝卜种子',
    type: 'seed',
    price: 5,
    sellPrice: 2,
    icon: '🌱',
    description: '春季和秋季可种植'
  },
  potato_seed: {
    id: 'potato_seed',
    name: '土豆种子',
    type: 'seed',
    price: 10,
    sellPrice: 5,
    icon: '🥔',
    description: '春夏秋三季可种植'
  },
  tomato_seed: {
    id: 'tomato_seed',
    name: '番茄种子',
    type: 'seed',
    price: 15,
    sellPrice: 7,
    icon: '🍅',
    description: '夏季可种植'
  },
  corn_seed: {
    id: 'corn_seed',
    name: '玉米种子',
    type: 'seed',
    price: 20,
    sellPrice: 10,
    icon: '🌽',
    description: '夏秋两季可种植'
  },
  pumpkin_seed: {
    id: 'pumpkin_seed',
    name: '南瓜种子',
    type: 'seed',
    price: 30,
    sellPrice: 15,
    icon: '🎃',
    description: '秋季可种植'
  },
  strawberry_seed: {
    id: 'strawberry_seed',
    name: '草莓种子',
    type: 'seed',
    price: 50,
    sellPrice: 25,
    icon: '🍓',
    description: '春季可种植'
  },
  turnip_product: {
    id: 'turnip_product',
    name: '白萝卜',
    type: 'product',
    price: 0,
    sellPrice: 15,
    icon: '🥕',
    description: '新鲜的白萝卜'
  },
  potato_product: {
    id: 'potato_product',
    name: '土豆',
    type: 'product',
    price: 0,
    sellPrice: 25,
    icon: '🥔',
    description: '饱满的土豆'
  },
  tomato_product: {
    id: 'tomato_product',
    name: '番茄',
    type: 'product',
    price: 0,
    sellPrice: 40,
    icon: '🍅',
    description: '成熟的番茄'
  },
  corn_product: {
    id: 'corn_product',
    name: '玉米',
    type: 'product',
    price: 0,
    sellPrice: 55,
    icon: '🌽',
    description: '金黄的玉米'
  },
  pumpkin_product: {
    id: 'pumpkin_product',
    name: '南瓜',
    type: 'product',
    price: 0,
    sellPrice: 80,
    icon: '🎃',
    description: '大大的南瓜'
  },
  strawberry_product: {
    id: 'strawberry_product',
    name: '草莓',
    type: 'product',
    price: 0,
    sellPrice: 120,
    icon: '🍓',
    description: '香甜的草莓'
  },
  egg: {
    id: 'egg',
    name: '鸡蛋',
    type: 'product',
    price: 0,
    sellPrice: 20,
    icon: '🥚',
    description: '母鸡下的新鲜鸡蛋'
  },
  milk: {
    id: 'milk',
    name: '牛奶',
    type: 'product',
    price: 0,
    sellPrice: 50,
    icon: '🥛',
    description: '新鲜的牛奶'
  },
  chicken: {
    id: 'chicken',
    name: '小鸡',
    type: 'animal',
    price: 100,
    sellPrice: 50,
    icon: '🐤',
    description: '会下蛋的小鸡'
  },
  cow: {
    id: 'cow',
    name: '奶牛',
    type: 'animal',
    price: 300,
    sellPrice: 150,
    icon: '🐄',
    description: '会产奶的奶牛'
  }
};

export const getItem = (itemId: string): Item | undefined => {
  return ITEMS[itemId];
};

export const getBuyableSeeds = () => {
  return Object.values(ITEMS).filter(item => item.type === 'seed');
};

export const getBuyableAnimals = () => {
  return Object.values(ITEMS).filter(item => item.type === 'animal');
};
