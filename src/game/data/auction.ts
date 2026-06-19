import type { AuctionItem, AuctionState, Rarity } from '../types/game';
import { AUCTION_ECONOMIC_BALANCE_BASE } from '../types/game';

export const AUCTION_ITEMS: AuctionItem[] = [
  {
    id: 'rare_gem',
    name: '稀有宝石包',
    icon: '💎',
    description: '包含各种珍贵宝石的收藏套装',
    rarity: 'rare',
    startingPrice: 500,
    currentBid: 500,
    minBidIncrement: 50,
    itemId: 'diamond',
    itemQuantity: 2,
    itemQuality: 4,
    bonusReputation: 10
  },
  {
    id: 'gold_ore_pack',
    name: '金矿石大包',
    icon: '🟨',
    description: '一整包精选金矿石，纯度极高',
    rarity: 'rare',
    startingPrice: 300,
    currentBid: 300,
    minBidIncrement: 30,
    itemId: 'gold',
    itemQuantity: 5,
    itemQuality: 3,
    bonusReputation: 5
  },
  {
    id: 'mithril_ingot',
    name: '秘银锭',
    icon: '🔷',
    description: '传说中的魔法金属锭',
    rarity: 'epic',
    startingPrice: 800,
    currentBid: 800,
    minBidIncrement: 80,
    itemId: 'mithril',
    itemQuantity: 3,
    itemQuality: 4,
    bonusReputation: 15
  },
  {
    id: 'dragonstone_shard',
    name: '龙晶石碎片',
    icon: '🔮',
    description: '蕴含远古龙之力量的神秘碎片',
    rarity: 'legendary',
    startingPrice: 2000,
    currentBid: 2000,
    minBidIncrement: 200,
    itemId: 'dragonstone',
    itemQuantity: 1,
    itemQuality: 5,
    bonusReputation: 30
  },
  {
    id: 'strawberry_seed_pack',
    name: '草莓种子大礼包',
    icon: '🍓',
    description: '高品质草莓种子，产量丰厚',
    rarity: 'uncommon',
    startingPrice: 150,
    currentBid: 150,
    minBidIncrement: 15,
    itemId: 'strawberry_seed',
    itemQuantity: 10,
    bonusReputation: 3
  },
  {
    id: 'pumpkin_seed_pack',
    name: '南瓜种子大礼包',
    icon: '🎃',
    description: '秋季专属的优质南瓜种子',
    rarity: 'uncommon',
    startingPrice: 120,
    currentBid: 120,
    minBidIncrement: 12,
    itemId: 'pumpkin_seed',
    itemQuantity: 8,
    bonusReputation: 3
  },
  {
    id: 'villager_gift_box',
    name: '村民心意礼盒',
    icon: '🎁',
    description: '所有村民都喜欢的神秘礼盒，可提升全体好感度',
    rarity: 'epic',
    startingPrice: 600,
    currentBid: 600,
    minBidIncrement: 60,
    bonusReputation: 20,
    bonusAffinity: [
      { villagerId: 'villager_1', amount: 10 },
      { villagerId: 'villager_2', amount: 10 },
      { villagerId: 'villager_3', amount: 10 },
      { villagerId: 'villager_4', amount: 10 },
      { villagerId: 'villager_5', amount: 10 },
      { villagerId: 'villager_6', amount: 10 },
      { villagerId: 'villager_7', amount: 10 },
      { villagerId: 'villager_8', amount: 10 }
    ]
  },
  {
    id: 'lucky_coin_bag',
    name: '幸运金币袋',
    icon: '💰',
    description: '装满金币的幸运袋子',
    rarity: 'rare',
    startingPrice: 400,
    currentBid: 400,
    minBidIncrement: 40,
    bonusCoins: 800,
    bonusReputation: 8
  },
  {
    id: 'adamantite_ore',
    name: '精金矿石',
    icon: '💠',
    description: '极其坚硬的稀有金属矿石',
    rarity: 'epic',
    startingPrice: 1200,
    currentBid: 1200,
    minBidIncrement: 120,
    itemId: 'adamantite',
    itemQuantity: 2,
    itemQuality: 4,
    bonusReputation: 18
  },
  {
    id: 'ruby_collection',
    name: '红宝石收藏',
    icon: '🔴',
    description: '璀璨的红宝石收藏套装',
    rarity: 'rare',
    startingPrice: 700,
    currentBid: 700,
    minBidIncrement: 70,
    itemId: 'ruby',
    itemQuantity: 3,
    itemQuality: 4,
    bonusReputation: 12
  },
  {
    id: 'sapphire_collection',
    name: '蓝宝石收藏',
    icon: '🔵',
    description: '深邃的蓝宝石收藏套装',
    rarity: 'rare',
    startingPrice: 700,
    currentBid: 700,
    minBidIncrement: 70,
    itemId: 'sapphire',
    itemQuantity: 3,
    itemQuality: 4,
    bonusReputation: 12
  },
  {
    id: 'emerald_collection',
    name: '祖母绿收藏',
    icon: '🟢',
    description: '翠绿的珍贵宝石收藏',
    rarity: 'rare',
    startingPrice: 700,
    currentBid: 700,
    minBidIncrement: 70,
    itemId: 'emerald',
    itemQuantity: 3,
    itemQuality: 4,
    bonusReputation: 12
  },
  {
    id: 'silver_ore_pack',
    name: '银矿石包',
    icon: '⚪',
    description: '闪亮的贵金属矿石包',
    rarity: 'uncommon',
    startingPrice: 200,
    currentBid: 200,
    minBidIncrement: 20,
    itemId: 'silver',
    itemQuantity: 5,
    itemQuality: 3,
    bonusReputation: 5
  },
  {
    id: 'iron_ore_pack',
    name: '铁矿石包',
    icon: '⬜',
    description: '坚硬的金属矿石包',
    rarity: 'common',
    startingPrice: 80,
    currentBid: 80,
    minBidIncrement: 8,
    itemId: 'iron',
    itemQuantity: 10,
    itemQuality: 3,
    bonusReputation: 2
  },
  {
    id: 'mushroom_feast',
    name: '蘑菇盛宴',
    icon: '🍄',
    description: '从矿洞深处采集的珍稀蘑菇',
    rarity: 'uncommon',
    startingPrice: 100,
    currentBid: 100,
    minBidIncrement: 10,
    itemId: 'mushroom',
    itemQuantity: 15,
    itemQuality: 3,
    bonusReputation: 4
  }
];

export const getAuctionItemById = (id: string): AuctionItem | undefined => {
  return AUCTION_ITEMS.find(item => item.id === id);
};

export const getRandomAuctionItems = (count: number, day: number): AuctionItem[] => {
  const selected: AuctionItem[] = [];
  const addedIds = new Set<string>();

  const rarityWeights: Record<Rarity, number> = {
    common: 30,
    uncommon: 35,
    rare: 20,
    epic: 12,
    legendary: 3
  };

  const dayBonus = Math.min(day * 0.5, 10);
  rarityWeights.rare += dayBonus;
  rarityWeights.epic += dayBonus * 0.5;

  const weightedItems = AUCTION_ITEMS.flatMap(item => 
    Array(rarityWeights[item.rarity] || 1).fill(item)
  );

  while (selected.length < count && weightedItems.length > 0) {
    const randomIndex = Math.floor(Math.random() * weightedItems.length);
    const item = weightedItems[randomIndex];
    if (!addedIds.has(item.id)) {
      addedIds.add(item.id);
      selected.push({
        ...item,
        currentBid: item.startingPrice
      });
    }
    weightedItems.splice(randomIndex, 1);
  }

  return selected;
};

export const createInitialAuctionState = (): AuctionState => {
  return {
    id: 'main',
    currentAuctionId: null,
    status: 'upcoming',
    items: [],
    currentItemIndex: 0,
    startTime: 0,
    endTime: 0,
    lastAuctionDay: 0,
    totalAuctionsHeld: 0,
    totalAuctionsWon: 0,
    totalCoinsSpent: 0,
    wonItems: [],
    economicBalanceFactor: AUCTION_ECONOMIC_BALANCE_BASE
  };
};

export const getAuctionRarityColor = (rarity: Rarity): string => {
  const colors: Record<Rarity, string> = {
    common: '#9e9e9e',
    uncommon: '#4caf50',
    rare: '#2196f3',
    epic: '#9c27b0',
    legendary: '#ff9800'
  };
  return colors[rarity];
};

export const getAuctionRarityName = (rarity: Rarity): string => {
  const names: Record<Rarity, string> = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  };
  return names[rarity];
};
