import type { CodexEntry, CodexCategory } from '../types/game';
import { CROPS } from './crops';
import { ITEMS } from './items';
import { ANIMALS } from './animals';
import { BUILDINGS } from './buildings';
import { VILLAGERS } from './orders';

export const CODEX_CATEGORY_NAMES: Record<CodexCategory, string> = {
  crop: '作物',
  animal: '动物',
  item: '物品',
  building: '建筑',
  villager: '村民',
  fish: '鱼类',
  artifact: '文物'
};

export const CODEX_CATEGORY_ICONS: Record<CodexCategory, string> = {
  crop: '🌾',
  animal: '🐾',
  item: '📦',
  building: '🏠',
  villager: '👥',
  fish: '🐟',
  artifact: '🏺'
};

function createCropCodexEntries(): CodexEntry[] {
  return Object.values(CROPS).map(crop => ({
    id: `crop_${crop.id}`,
    name: crop.name,
    description: `生长时间: ${crop.growthTime / 1000}秒，季节: ${crop.seasons.join('、')}`,
    icon: ITEMS[`${crop.id}_product`]?.icon || '🌱',
    category: 'crop' as const,
    rarity: crop.id === 'strawberry' ? 'rare' : crop.id === 'pumpkin' ? 'uncommon' : 'common',
    discovered: false,
    count: 0,
    hint: '通过种植并收获来发现'
  }));
}

function createAnimalCodexEntries(): CodexEntry[] {
  return Object.values(ANIMALS).map(animal => ({
    id: `animal_${animal.id}`,
    name: animal.name,
    description: `产出: ${ITEMS[animal.productId]?.name || '未知'}，产出间隔: ${animal.produceTime / 1000}秒`,
    icon: ITEMS[animal.id]?.icon || '🐾',
    category: 'animal' as const,
    rarity: animal.type === 'cow' ? 'uncommon' : 'common',
    discovered: false,
    count: 0,
    hint: '从商店购买动物来发现'
  }));
}

function createItemCodexEntries(): CodexEntry[] {
  const entries: CodexEntry[] = [];
  
  Object.values(ITEMS).forEach(item => {
    let rarity: CodexEntry['rarity'] = 'common';
    if (item.id.includes('strawberry')) rarity = 'rare';
    else if (item.id.includes('pumpkin') || item.id.includes('corn')) rarity = 'uncommon';
    else if (item.id.includes('milk')) rarity = 'uncommon';
    
    entries.push({
      id: `item_${item.id}`,
      name: item.name,
      description: item.description,
      icon: item.icon,
      category: 'item' as const,
      rarity,
      discovered: false,
      count: 0,
      hint: item.type === 'seed' ? '从商店购买或完成订单获得' : '通过种植或收集获得'
    });
  });
  
  return entries;
}

function createBuildingCodexEntries(): CodexEntry[] {
  return Object.values(BUILDINGS).map(building => ({
    id: `building_${building.id}`,
    name: building.name,
    description: building.description,
    icon: building.icon,
    category: 'building' as const,
    rarity: building.id === 'greenhouse' ? 'rare' : building.id === 'barn' ? 'uncommon' : 'common',
    discovered: false,
    count: 0,
    hint: '解锁足够地块后可建造'
  }));
}

function createVillagerCodexEntries(): CodexEntry[] {
  return VILLAGERS.map((villager, index) => ({
    id: `villager_${villager.id}`,
    name: villager.name,
    description: `一位友善的村民，会经常来农场下订单`,
    icon: villager.avatar,
    category: 'villager' as const,
    rarity: index < 4 ? 'common' : index < 7 ? 'uncommon' : 'rare',
    discovered: false,
    count: 0,
    hint: '完成订单时会遇到不同的村民'
  }));
}

function createFishCodexEntries(): CodexEntry[] {
  const fishList = [
    { id: 'carp', name: '鲤鱼', icon: '🐟', rarity: 'common' as const, description: '最常见的淡水鱼', hint: '在池塘边可以钓到' },
    { id: 'bass', name: '鲈鱼', icon: '🐠', rarity: 'uncommon' as const, description: '味道鲜美的食用鱼', hint: '在湖泊中可以钓到' },
    { id: 'salmon', name: '三文鱼', icon: '🐟', rarity: 'rare' as const, description: '营养丰富的洄游鱼类', hint: '秋季在河流中可以钓到' },
    { id: 'angelfish', name: '神仙鱼', icon: '🐠', rarity: 'epic' as const, description: '美丽的观赏鱼', hint: '在神秘的地方才能发现' },
    { id: 'legendary_carp', name: '锦鲤王', icon: '🐉', rarity: 'legendary' as const, description: '传说中的锦鲤之王', hint: '只有幸运的人才能遇见' }
  ];
  
  return fishList.map(fish => ({
    id: `fish_${fish.id}`,
    name: fish.name,
    description: fish.description,
    icon: fish.icon,
    category: 'fish' as const,
    rarity: fish.rarity,
    discovered: false,
    count: 0,
    hint: fish.hint
  }));
}

function createArtifactCodexEntries(): CodexEntry[] {
  const artifacts = [
    { id: 'old_coin', name: '古币', icon: '🪙', rarity: 'common' as const, description: '一枚锈迹斑斑的古币', hint: '挖掘时有概率发现' },
    { id: 'fossil', name: '化石', icon: '🦴', rarity: 'uncommon' as const, description: '远古生物的化石', hint: '在地底深处可能找到' },
    { id: 'ancient_pot', name: '古陶罐', icon: '🏺', rarity: 'rare' as const, description: '精美的古代陶罐', hint: '在特定地点挖掘' },
    { id: 'magic_crystal', name: '魔法水晶', icon: '💎', rarity: 'epic' as const, description: '散发着神秘光芒的水晶', hint: '传说中蕴含魔力' },
    { id: 'golden_idol', name: '黄金神像', icon: '🗿', rarity: 'legendary' as const, description: '失落文明的黄金神像', hint: '极其稀有的宝藏' }
  ];
  
  return artifacts.map(artifact => ({
    id: `artifact_${artifact.id}`,
    name: artifact.name,
    description: artifact.description,
    icon: artifact.icon,
    category: 'artifact' as const,
    rarity: artifact.rarity,
    discovered: false,
    count: 0,
    hint: artifact.hint
  }));
}

export const CODEX_ENTRIES: CodexEntry[] = [
  ...createCropCodexEntries(),
  ...createAnimalCodexEntries(),
  ...createItemCodexEntries(),
  ...createBuildingCodexEntries(),
  ...createVillagerCodexEntries(),
  ...createFishCodexEntries(),
  ...createArtifactCodexEntries()
];

export const getCodexEntryById = (id: string): CodexEntry | undefined => {
  return CODEX_ENTRIES.find(e => e.id === id);
};

export const getCodexEntriesByCategory = (category: CodexCategory): CodexEntry[] => {
  return CODEX_ENTRIES.filter(e => e.category === category);
};

export const getTotalCodexCount = (): number => {
  return CODEX_ENTRIES.length;
};

export const getCodexCountByCategory = (category: CodexCategory): number => {
  return CODEX_ENTRIES.filter(e => e.category === category).length;
};
