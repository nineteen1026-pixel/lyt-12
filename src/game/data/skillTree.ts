import type { SkillNode, SkillBranchConfig } from '../types/game';

export const SKILL_BRANCHES: SkillBranchConfig[] = [
  {
    id: 'farming',
    name: '农耕之道',
    description: '提升作物生长速度与产量',
    icon: '🌱',
    color: '#4caf50'
  },
  {
    id: 'livestock',
    name: '畜牧之术',
    description: '提升动物产出速度与数量',
    icon: '🐄',
    color: '#ff9800'
  },
  {
    id: 'quality',
    name: '品质之心',
    description: '提升高品质产出概率',
    icon: '💎',
    color: '#9c27b0'
  }
];

export const SKILL_NODES: SkillNode[] = [
  {
    id: 'farming_basic_1',
    name: '勤劳农夫',
    description: '作物生长速度提升5%',
    icon: '🌾',
    branch: 'farming',
    maxLevel: 5,
    currentLevel: 0,
    effects: [{ type: 'crop_growth_speed', value: 0.05, perLevel: true }],
    requires: [],
    unlockAtLevel: 1
  },
  {
    id: 'farming_basic_2',
    name: '丰饶土壤',
    description: '作物收获时产量+1概率提升5%',
    icon: '🌿',
    branch: 'farming',
    maxLevel: 5,
    currentLevel: 0,
    effects: [{ type: 'crop_yield', value: 0.05, perLevel: true }],
    requires: ['farming_basic_1'],
    unlockAtLevel: 2
  },
  {
    id: 'farming_water_1',
    name: '润物无声',
    description: '浇水对品质的额外加成提升5%',
    icon: '💧',
    branch: 'farming',
    maxLevel: 3,
    currentLevel: 0,
    effects: [{ type: 'water_bonus', value: 0.05, perLevel: true }],
    requires: ['farming_basic_1'],
    unlockAtLevel: 3
  },
  {
    id: 'farming_advanced_1',
    name: '四季耕种',
    description: '作物生长速度额外提升8%',
    icon: '🌻',
    branch: 'farming',
    maxLevel: 5,
    currentLevel: 0,
    effects: [{ type: 'crop_growth_speed', value: 0.08, perLevel: true }],
    requires: ['farming_basic_2'],
    unlockAtLevel: 5
  },
  {
    id: 'farming_advanced_2',
    name: '硕果累累',
    description: '额外收获概率提升8%',
    icon: '🍅',
    branch: 'farming',
    maxLevel: 5,
    currentLevel: 0,
    effects: [{ type: 'crop_yield', value: 0.08, perLevel: true }],
    requires: ['farming_advanced_1'],
    unlockAtLevel: 8
  },
  {
    id: 'farming_master',
    name: '农神庇护',
    description: '稀有品质概率提升10%',
    icon: '🌳',
    branch: 'farming',
    maxLevel: 3,
    currentLevel: 0,
    effects: [{ type: 'rare_chance', value: 0.10, perLevel: true }],
    requires: ['farming_advanced_2'],
    unlockAtLevel: 12
  },
  {
    id: 'farming_greenhouse',
    name: '温室精通',
    description: '温室效果额外提升15%',
    icon: '🏡',
    branch: 'farming',
    maxLevel: 3,
    currentLevel: 0,
    effects: [{ type: 'greenhouse_boost', value: 0.15, perLevel: true }],
    requires: ['farming_water_1'],
    unlockAtLevel: 6
  },
  {
    id: 'livestock_basic_1',
    name: '细心牧者',
    description: '动物产出速度提升5%',
    icon: '🐔',
    branch: 'livestock',
    maxLevel: 5,
    currentLevel: 0,
    effects: [{ type: 'animal_production_speed', value: 0.05, perLevel: true }],
    requires: [],
    unlockAtLevel: 1
  },
  {
    id: 'livestock_basic_2',
    name: '丰沛乳汁',
    description: '动物产出数量+1概率提升5%',
    icon: '🥛',
    branch: 'livestock',
    maxLevel: 5,
    currentLevel: 0,
    effects: [{ type: 'animal_yield', value: 0.05, perLevel: true }],
    requires: ['livestock_basic_1'],
    unlockAtLevel: 2
  },
  {
    id: 'livestock_feed_1',
    name: '营养均衡',
    description: '喂养对品质的额外加成提升5%',
    icon: '🌾',
    branch: 'livestock',
    maxLevel: 3,
    currentLevel: 0,
    effects: [{ type: 'feed_bonus', value: 0.05, perLevel: true }],
    requires: ['livestock_basic_1'],
    unlockAtLevel: 3
  },
  {
    id: 'livestock_advanced_1',
    name: '茁壮生长',
    description: '动物产出速度额外提升8%',
    icon: '🐑',
    branch: 'livestock',
    maxLevel: 5,
    currentLevel: 0,
    effects: [{ type: 'animal_production_speed', value: 0.08, perLevel: true }],
    requires: ['livestock_basic_2'],
    unlockAtLevel: 5
  },
  {
    id: 'livestock_advanced_2',
    name: '源源不断',
    description: '额外产出概率提升8%',
    icon: '🥚',
    branch: 'livestock',
    maxLevel: 5,
    currentLevel: 0,
    effects: [{ type: 'animal_yield', value: 0.08, perLevel: true }],
    requires: ['livestock_advanced_1'],
    unlockAtLevel: 8
  },
  {
    id: 'livestock_master',
    name: '牧神祝福',
    description: '稀有品质概率提升10%',
    icon: '🐂',
    branch: 'livestock',
    maxLevel: 3,
    currentLevel: 0,
    effects: [{ type: 'rare_chance', value: 0.10, perLevel: true }],
    requires: ['livestock_advanced_2'],
    unlockAtLevel: 12
  },
  {
    id: 'quality_basic_1',
    name: '追求卓越',
    description: '收获时高品质概率提升3%',
    icon: '⭐',
    branch: 'quality',
    maxLevel: 5,
    currentLevel: 0,
    effects: [{ type: 'crop_quality', value: 0.03, perLevel: true }],
    requires: [],
    unlockAtLevel: 1
  },
  {
    id: 'quality_basic_2',
    name: '精益求精',
    description: '动物产品高品质概率提升3%',
    icon: '🌟',
    branch: 'quality',
    maxLevel: 5,
    currentLevel: 0,
    effects: [{ type: 'animal_quality', value: 0.03, perLevel: true }],
    requires: ['quality_basic_1'],
    unlockAtLevel: 2
  },
  {
    id: 'quality_advanced_1',
    name: '匠心独运',
    description: '所有产出高品质概率额外提升5%',
    icon: '💫',
    branch: 'quality',
    maxLevel: 5,
    currentLevel: 0,
    effects: [
      { type: 'crop_quality', value: 0.05, perLevel: true },
      { type: 'animal_quality', value: 0.05, perLevel: true }
    ],
    requires: ['quality_basic_2'],
    unlockAtLevel: 5
  },
  {
    id: 'quality_rare_1',
    name: '稀世珍宝',
    description: '稀有(4星)品质概率提升6%',
    icon: '💎',
    branch: 'quality',
    maxLevel: 3,
    currentLevel: 0,
    effects: [{ type: 'rare_chance', value: 0.06, perLevel: true }],
    requires: ['quality_advanced_1'],
    unlockAtLevel: 7
  },
  {
    id: 'quality_legendary',
    name: '传说造物',
    description: '传说(5星)品质概率提升3%',
    icon: '👑',
    branch: 'quality',
    maxLevel: 3,
    currentLevel: 0,
    effects: [{ type: 'rare_chance', value: 0.03, perLevel: true }],
    requires: ['quality_rare_1'],
    unlockAtLevel: 10
  },
  {
    id: 'quality_master',
    name: '品质大师',
    description: '所有品质权重额外增加15%',
    icon: '🏆',
    branch: 'quality',
    maxLevel: 1,
    currentLevel: 0,
    effects: [
      { type: 'crop_quality', value: 0.15, perLevel: false },
      { type: 'animal_quality', value: 0.15, perLevel: false },
      { type: 'rare_chance', value: 0.15, perLevel: false }
    ],
    requires: ['quality_legendary'],
    unlockAtLevel: 15
  }
];

export function getSkillNode(id: string): SkillNode | undefined {
  return SKILL_NODES.find(n => n.id === id);
}

export function getBranchConfig(branch: string): SkillBranchConfig | undefined {
  return SKILL_BRANCHES.find(b => b.id === branch);
}

export function getSkillsByBranch(branch: string): SkillNode[] {
  return SKILL_NODES.filter(n => n.branch === branch);
}
