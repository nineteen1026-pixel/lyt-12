import type {
  FestivalType,
  FestivalConfig,
  FestivalVillagerPreference,
  FestivalExclusiveOrder,
  FestivalDialogueNode,
  AffinityStage,
  Season,
  QualityGrade
} from '../types/game';

export const FESTIVALS: Record<FestivalType, FestivalConfig> = {
  spring_planting: {
    id: 'spring_planting',
    name: '春耕节',
    icon: '🌱',
    season: 'spring',
    festivalDay: 10,
    description: '春天播种的希望',
    giftAffinityMultiplier: 1.5,
    qualityBonusAffinity: { 1: 0, 2: 2, 3: 5, 4: 10, 5: 18 } as Record<QualityGrade, number>
  },
  summer_solstice: {
    id: 'summer_solstice',
    name: '夏至节',
    icon: '☀️',
    season: 'summer',
    festivalDay: 10,
    description: '盛夏的热情庆典',
    giftAffinityMultiplier: 1.5,
    qualityBonusAffinity: { 1: 0, 2: 2, 3: 5, 4: 10, 5: 18 } as Record<QualityGrade, number>
  },
  harvest: {
    id: 'harvest',
    name: '丰收节',
    icon: '🌾',
    season: 'autumn',
    festivalDay: 10,
    description: '金秋的丰收喜悦',
    giftAffinityMultiplier: 2.0,
    qualityBonusAffinity: { 1: 0, 2: 3, 3: 8, 4: 15, 5: 25 } as Record<QualityGrade, number>
  },
  winter_solstice: {
    id: 'winter_solstice',
    name: '冬至节',
    icon: '❄️',
    season: 'winter',
    festivalDay: 10,
    description: '寒冬的温暖相聚',
    giftAffinityMultiplier: 1.5,
    qualityBonusAffinity: { 1: 0, 2: 2, 3: 5, 4: 10, 5: 18 } as Record<QualityGrade, number>
  }
};

export const FESTIVAL_VILLAGER_PREFERENCES: Record<string, Record<FestivalType, FestivalVillagerPreference>> = {
  villager_1: {
    spring_planting: { villagerId: 'villager_1', preferredItems: ['turnip_product', 'potato_product'], dislikedItems: ['strawberry_product'] },
    summer_solstice: { villagerId: 'villager_1', preferredItems: ['potato_product', 'corn_product'], dislikedItems: ['strawberry_product'] },
    harvest: { villagerId: 'villager_1', preferredItems: ['turnip_product', 'potato_product', 'pumpkin_product'], dislikedItems: ['strawberry_product'] },
    winter_solstice: { villagerId: 'villager_1', preferredItems: ['turnip_product', 'potato_product'], dislikedItems: ['strawberry_product'] }
  },
  villager_2: {
    spring_planting: { villagerId: 'villager_2', preferredItems: ['strawberry_product', 'milk'], dislikedItems: ['corn_product'] },
    summer_solstice: { villagerId: 'villager_2', preferredItems: ['strawberry_product', 'egg'], dislikedItems: ['corn_product'] },
    harvest: { villagerId: 'villager_2', preferredItems: ['pumpkin_product', 'milk', 'strawberry_product'], dislikedItems: ['corn_product'] },
    winter_solstice: { villagerId: 'villager_2', preferredItems: ['milk', 'egg', 'strawberry_product'], dislikedItems: ['corn_product'] }
  },
  villager_3: {
    spring_planting: { villagerId: 'villager_3', preferredItems: ['strawberry_product', 'tomato_product'], dislikedItems: ['turnip_product'] },
    summer_solstice: { villagerId: 'villager_3', preferredItems: ['tomato_product', 'corn_product'], dislikedItems: ['turnip_product'] },
    harvest: { villagerId: 'villager_3', preferredItems: ['strawberry_product', 'tomato_product', 'corn_product'], dislikedItems: ['turnip_product'] },
    winter_solstice: { villagerId: 'villager_3', preferredItems: ['tomato_product', 'strawberry_product'], dislikedItems: ['turnip_product'] }
  },
  villager_4: {
    spring_planting: { villagerId: 'villager_4', preferredItems: ['corn_product', 'pumpkin_product'], dislikedItems: ['strawberry_product'] },
    summer_solstice: { villagerId: 'villager_4', preferredItems: ['corn_product', 'tomato_product'], dislikedItems: ['strawberry_product'] },
    harvest: { villagerId: 'villager_4', preferredItems: ['pumpkin_product', 'corn_product'], dislikedItems: ['strawberry_product'] },
    winter_solstice: { villagerId: 'villager_4', preferredItems: ['corn_product', 'pumpkin_product', 'potato_product'], dislikedItems: ['strawberry_product'] }
  },
  villager_5: {
    spring_planting: { villagerId: 'villager_5', preferredItems: ['tomato_product', 'egg'], dislikedItems: ['potato_product'] },
    summer_solstice: { villagerId: 'villager_5', preferredItems: ['tomato_product', 'milk'], dislikedItems: ['potato_product'] },
    harvest: { villagerId: 'villager_5', preferredItems: ['tomato_product', 'egg', 'milk'], dislikedItems: ['potato_product'] },
    winter_solstice: { villagerId: 'villager_5', preferredItems: ['egg', 'milk', 'tomato_product'], dislikedItems: ['potato_product'] }
  },
  villager_6: {
    spring_planting: { villagerId: 'villager_6', preferredItems: ['strawberry_product', 'pumpkin_product'], dislikedItems: [] },
    summer_solstice: { villagerId: 'villager_6', preferredItems: ['strawberry_product', 'tomato_product'], dislikedItems: [] },
    harvest: { villagerId: 'villager_6', preferredItems: ['pumpkin_product', 'strawberry_product', 'corn_product'], dislikedItems: [] },
    winter_solstice: { villagerId: 'villager_6', preferredItems: ['strawberry_product', 'pumpkin_product'], dislikedItems: [] }
  },
  villager_7: {
    spring_planting: { villagerId: 'villager_7', preferredItems: ['milk', 'egg'], dislikedItems: [] },
    summer_solstice: { villagerId: 'villager_7', preferredItems: ['milk', 'strawberry_product'], dislikedItems: [] },
    harvest: { villagerId: 'villager_7', preferredItems: ['egg', 'milk', 'pumpkin_product'], dislikedItems: [] },
    winter_solstice: { villagerId: 'villager_7', preferredItems: ['milk', 'egg', 'corn_product'], dislikedItems: [] }
  },
  villager_8: {
    spring_planting: { villagerId: 'villager_8', preferredItems: ['pumpkin_product', 'corn_product', 'tomato_product'], dislikedItems: [] },
    summer_solstice: { villagerId: 'villager_8', preferredItems: ['tomato_product', 'corn_product'], dislikedItems: [] },
    harvest: { villagerId: 'villager_8', preferredItems: ['pumpkin_product', 'corn_product', 'tomato_product'], dislikedItems: [] },
    winter_solstice: { villagerId: 'villager_8', preferredItems: ['pumpkin_product', 'corn_product', 'tomato_product'], dislikedItems: [] }
  }
};

export const FESTIVAL_EXCLUSIVE_ORDERS: Record<string, FestivalExclusiveOrder[]> = {
  villager_1: [
    { id: 'fest_spring_planting_villager_1_s1', villagerId: 'villager_1', festivalId: 'spring_planting', unlockStage: 1 as AffinityStage, name: '春耕节·萝卜种苗', description: '李大叔需要萝卜种苗来准备春耕。', items: [{ itemId: 'turnip_product', quantity: 10, minQuality: 2 }], reward: { coins: 600, reputation: 15, rareSeedId: 'turnip_seed', rareSeedQuantity: 5 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'fest_summer_solstice_villager_1_s2', villagerId: 'villager_1', festivalId: 'summer_solstice', unlockStage: 2 as AffinityStage, name: '夏至节·土豆丰收', description: '李大叔想在夏至节展示最好的土豆品种。', items: [{ itemId: 'potato_product', quantity: 15, minQuality: 3 }, { itemId: 'corn_product', quantity: 8 }], reward: { coins: 900, reputation: 20, rareSeedId: 'potato_seed', rareSeedQuantity: 6 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'fest_harvest_villager_1_s3', villagerId: 'villager_1', festivalId: 'harvest', unlockStage: 3 as AffinityStage, name: '丰收节·秋季大丰收', description: '李大叔要在丰收节准备最丰盛的农产品展台。', items: [{ itemId: 'turnip_product', quantity: 20, minQuality: 4 }, { itemId: 'potato_product', quantity: 15, minQuality: 4 }, { itemId: 'pumpkin_product', quantity: 10, minQuality: 3 }], reward: { coins: 1800, reputation: 35, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 5 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'fest_winter_solstice_villager_1_s4', villagerId: 'villager_1', festivalId: 'winter_solstice', unlockStage: 4 as AffinityStage, name: '冬至节·暖心蔬菜', description: '李大叔要为冬至节的村民准备暖心蔬菜汤。', items: [{ itemId: 'turnip_product', quantity: 25, minQuality: 5 }, { itemId: 'potato_product', quantity: 25, minQuality: 5 }], reward: { coins: 3000, reputation: 50, rareSeedId: 'strawberry_seed', rareSeedQuantity: 8 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 }
  ],
  villager_2: [
    { id: 'fest_spring_planting_villager_2_s1', villagerId: 'villager_2', festivalId: 'spring_planting', unlockStage: 1 as AffinityStage, name: '春耕节·草莓花束', description: '王奶奶要在春耕节做草莓花束送给邻居们。', items: [{ itemId: 'strawberry_product', quantity: 10, minQuality: 2 }, { itemId: 'milk', quantity: 5 }], reward: { coins: 700, reputation: 15, rareSeedId: 'strawberry_seed', rareSeedQuantity: 4 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'fest_summer_solstice_villager_2_s2', villagerId: 'villager_2', festivalId: 'summer_solstice', unlockStage: 2 as AffinityStage, name: '夏至节·草莓冰沙', description: '王奶奶要为夏至节准备清凉的草莓冰沙。', items: [{ itemId: 'strawberry_product', quantity: 12, minQuality: 3 }, { itemId: 'egg', quantity: 8 }], reward: { coins: 950, reputation: 20, rareSeedId: 'strawberry_seed', rareSeedQuantity: 5 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'fest_harvest_villager_2_s3', villagerId: 'villager_2', festivalId: 'harvest', unlockStage: 3 as AffinityStage, name: '丰收节·南瓜浓汤', description: '王奶奶要在丰收节做她拿手的南瓜浓汤。', items: [{ itemId: 'pumpkin_product', quantity: 15, minQuality: 4 }, { itemId: 'milk', quantity: 10 }, { itemId: 'strawberry_product', quantity: 10, minQuality: 3 }], reward: { coins: 1900, reputation: 35, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 6 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'fest_winter_solstice_villager_2_s4', villagerId: 'villager_2', festivalId: 'winter_solstice', unlockStage: 4 as AffinityStage, name: '冬至节·温暖甜品', description: '王奶奶要为冬至节准备最温暖的甜品盛宴。', items: [{ itemId: 'milk', quantity: 20, minQuality: 4 }, { itemId: 'egg', quantity: 15, minQuality: 3 }, { itemId: 'strawberry_product', quantity: 20, minQuality: 5 }], reward: { coins: 3200, reputation: 50, rareSeedId: 'corn_seed', rareSeedQuantity: 8 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 }
  ],
  villager_3: [
    { id: 'fest_spring_planting_villager_3_s1', villagerId: 'villager_3', festivalId: 'spring_planting', unlockStage: 1 as AffinityStage, name: '春耕节·新品种实验', description: '张小妹要在春耕节测试新的草莓与番茄嫁接技术。', items: [{ itemId: 'strawberry_product', quantity: 8, minQuality: 2 }, { itemId: 'tomato_product', quantity: 8, minQuality: 2 }], reward: { coins: 600, reputation: 15, rareSeedId: 'tomato_seed', rareSeedQuantity: 4 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'fest_summer_solstice_villager_3_s2', villagerId: 'villager_3', festivalId: 'summer_solstice', unlockStage: 2 as AffinityStage, name: '夏至节·阳光实验室', description: '张小妹要在夏至节采集日照数据，需要番茄和玉米样本。', items: [{ itemId: 'tomato_product', quantity: 12, minQuality: 3 }, { itemId: 'corn_product', quantity: 10, minQuality: 3 }], reward: { coins: 900, reputation: 20, rareSeedId: 'corn_seed', rareSeedQuantity: 5 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'fest_harvest_villager_3_s3', villagerId: 'villager_3', festivalId: 'harvest', unlockStage: 3 as AffinityStage, name: '丰收节·科研成果展', description: '张小妹要在丰收节展示她的农业科研成果。', items: [{ itemId: 'strawberry_product', quantity: 15, minQuality: 4 }, { itemId: 'tomato_product', quantity: 15, minQuality: 4 }, { itemId: 'corn_product', quantity: 10, minQuality: 4 }], reward: { coins: 2000, reputation: 35, rareSeedId: 'strawberry_seed', rareSeedQuantity: 6 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'fest_winter_solstice_villager_3_s4', villagerId: 'villager_3', festivalId: 'winter_solstice', unlockStage: 4 as AffinityStage, name: '冬至节·温室计划', description: '张小妹要在冬至节启动冬季温室种植计划。', items: [{ itemId: 'tomato_product', quantity: 25, minQuality: 5 }, { itemId: 'strawberry_product', quantity: 20, minQuality: 5 }], reward: { coins: 3500, reputation: 50, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 8 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 }
  ],
  villager_4: [
    { id: 'fest_spring_planting_villager_4_s1', villagerId: 'villager_4', festivalId: 'spring_planting', unlockStage: 1 as AffinityStage, name: '春耕节·新田围栏', description: '陈大哥要在春耕节帮村民搭建新田围栏，需要玉米和南瓜作材料。', items: [{ itemId: 'corn_product', quantity: 10, minQuality: 2 }, { itemId: 'pumpkin_product', quantity: 8 }], reward: { coins: 600, reputation: 15, rareSeedId: 'corn_seed', rareSeedQuantity: 4 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'fest_summer_solstice_villager_4_s2', villagerId: 'villager_4', festivalId: 'summer_solstice', unlockStage: 2 as AffinityStage, name: '夏至节·遮阳棚架', description: '陈大哥要在夏至节搭建遮阳棚架，需要玉米和番茄。', items: [{ itemId: 'corn_product', quantity: 12, minQuality: 3 }, { itemId: 'tomato_product', quantity: 10, minQuality: 3 }], reward: { coins: 900, reputation: 20, rareSeedId: 'tomato_seed', rareSeedQuantity: 5 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'fest_harvest_villager_4_s3', villagerId: 'villager_4', festivalId: 'harvest', unlockStage: 3 as AffinityStage, name: '丰收节·粮仓修缮', description: '陈大哥要在丰收节修缮村中粮仓，需要大量南瓜和玉米。', items: [{ itemId: 'pumpkin_product', quantity: 18, minQuality: 4 }, { itemId: 'corn_product', quantity: 15, minQuality: 4 }], reward: { coins: 1700, reputation: 35, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 5 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'fest_winter_solstice_villager_4_s4', villagerId: 'villager_4', festivalId: 'winter_solstice', unlockStage: 4 as AffinityStage, name: '冬至节·防风工程', description: '陈大哥要在冬至节前完成防风工程，保护村庄过冬。', items: [{ itemId: 'corn_product', quantity: 25, minQuality: 5 }, { itemId: 'pumpkin_product', quantity: 20, minQuality: 5 }, { itemId: 'potato_product', quantity: 15, minQuality: 5 }], reward: { coins: 3300, reputation: 50, rareSeedId: 'strawberry_seed', rareSeedQuantity: 8 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 }
  ],
  villager_5: [
    { id: 'fest_spring_planting_villager_5_s1', villagerId: 'villager_5', festivalId: 'spring_planting', unlockStage: 1 as AffinityStage, name: '春耕节·开张特卖', description: '刘阿姨要在春耕节搞小卖部开张特卖，需要番茄和鸡蛋。', items: [{ itemId: 'tomato_product', quantity: 10, minQuality: 2 }, { itemId: 'egg', quantity: 8 }], reward: { coins: 550, reputation: 15, rareSeedId: 'tomato_seed', rareSeedQuantity: 3 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'fest_summer_solstice_villager_5_s2', villagerId: 'villager_5', festivalId: 'summer_solstice', unlockStage: 2 as AffinityStage, name: '夏至节·冰饮原料', description: '刘阿姨要在夏至节推出夏日冰饮系列，需要番茄和牛奶。', items: [{ itemId: 'tomato_product', quantity: 12, minQuality: 3 }, { itemId: 'milk', quantity: 8 }], reward: { coins: 850, reputation: 20, rareSeedId: 'tomato_seed', rareSeedQuantity: 5 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'fest_harvest_villager_5_s3', villagerId: 'villager_5', festivalId: 'harvest', unlockStage: 3 as AffinityStage, name: '丰收节·大促销', description: '刘阿姨要在丰收节搞年度大促销，需要大量货物。', items: [{ itemId: 'tomato_product', quantity: 18, minQuality: 4 }, { itemId: 'egg', quantity: 15, minQuality: 3 }, { itemId: 'milk', quantity: 10, minQuality: 3 }], reward: { coins: 1800, reputation: 35, rareSeedId: 'strawberry_seed', rareSeedQuantity: 5 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'fest_winter_solstice_villager_5_s4', villagerId: 'villager_5', festivalId: 'winter_solstice', unlockStage: 4 as AffinityStage, name: '冬至节·年货储备', description: '刘阿姨要在冬至节前备足年货，这是全年最大的订单。', items: [{ itemId: 'egg', quantity: 25, minQuality: 4 }, { itemId: 'milk', quantity: 20, minQuality: 4 }, { itemId: 'tomato_product', quantity: 20, minQuality: 5 }], reward: { coins: 3200, reputation: 50, rareSeedId: 'corn_seed', rareSeedQuantity: 8 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 }
  ],
  villager_6: [
    { id: 'fest_spring_planting_villager_6_s1', villagerId: 'villager_6', festivalId: 'spring_planting', unlockStage: 1 as AffinityStage, name: '春耕节·品种改良', description: '赵爷爷要在春耕节研究草莓和南瓜的品种改良。', items: [{ itemId: 'strawberry_product', quantity: 8, minQuality: 2 }, { itemId: 'pumpkin_product', quantity: 8, minQuality: 2 }], reward: { coins: 650, reputation: 15, rareSeedId: 'strawberry_seed', rareSeedQuantity: 4 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'fest_summer_solstice_villager_6_s2', villagerId: 'villager_6', festivalId: 'summer_solstice', unlockStage: 2 as AffinityStage, name: '夏至节·光照实验', description: '赵爷爷要在夏至节进行作物光照实验。', items: [{ itemId: 'strawberry_product', quantity: 10, minQuality: 3 }, { itemId: 'tomato_product', quantity: 10, minQuality: 3 }], reward: { coins: 950, reputation: 20, rareSeedId: 'strawberry_seed', rareSeedQuantity: 5 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'fest_harvest_villager_6_s3', villagerId: 'villager_6', festivalId: 'harvest', unlockStage: 3 as AffinityStage, name: '丰收节·学术报告', description: '赵爷爷要在丰收节发表他的年度学术报告，需要大量样本。', items: [{ itemId: 'pumpkin_product', quantity: 15, minQuality: 4 }, { itemId: 'strawberry_product', quantity: 12, minQuality: 4 }, { itemId: 'corn_product', quantity: 10, minQuality: 4 }], reward: { coins: 2000, reputation: 35, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 6 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'fest_winter_solstice_villager_6_s4', villagerId: 'villager_6', festivalId: 'winter_solstice', unlockStage: 4 as AffinityStage, name: '冬至节·冬季研究', description: '赵爷爷要在冬至节启动抗寒品种培育计划。', items: [{ itemId: 'strawberry_product', quantity: 25, minQuality: 5 }, { itemId: 'pumpkin_product', quantity: 20, minQuality: 5 }], reward: { coins: 3500, reputation: 50, rareSeedId: 'tomato_seed', rareSeedQuantity: 10 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 }
  ],
  villager_7: [
    { id: 'fest_spring_planting_villager_7_s1', villagerId: 'villager_7', festivalId: 'spring_planting', unlockStage: 1 as AffinityStage, name: '春耕节·动物营养餐', description: '孙小美要在春耕节给小动物们准备特别的营养餐。', items: [{ itemId: 'milk', quantity: 8 }, { itemId: 'egg', quantity: 10 }], reward: { coins: 500, reputation: 15 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'fest_summer_solstice_villager_7_s2', villagerId: 'villager_7', festivalId: 'summer_solstice', unlockStage: 2 as AffinityStage, name: '夏至节·清凉解暑', description: '孙小美要在夏至节给动物们准备清凉解暑的食物。', items: [{ itemId: 'milk', quantity: 10, minQuality: 3 }, { itemId: 'strawberry_product', quantity: 8, minQuality: 3 }], reward: { coins: 900, reputation: 20, rareSeedId: 'strawberry_seed', rareSeedQuantity: 4 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'fest_harvest_villager_7_s3', villagerId: 'villager_7', festivalId: 'harvest', unlockStage: 3 as AffinityStage, name: '丰收节·动物运动会', description: '孙小美要在丰收节举办动物运动会，需要大量补给。', items: [{ itemId: 'egg', quantity: 15, minQuality: 3 }, { itemId: 'milk', quantity: 12, minQuality: 3 }, { itemId: 'pumpkin_product', quantity: 10, minQuality: 4 }], reward: { coins: 1800, reputation: 35, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 5 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'fest_winter_solstice_villager_7_s4', villagerId: 'villager_7', festivalId: 'winter_solstice', unlockStage: 4 as AffinityStage, name: '冬至节·温暖庇护所', description: '孙小美要在冬至节为流浪动物搭建温暖庇护所。', items: [{ itemId: 'milk', quantity: 25, minQuality: 4 }, { itemId: 'egg', quantity: 20, minQuality: 4 }, { itemId: 'corn_product', quantity: 15, minQuality: 5 }], reward: { coins: 3300, reputation: 50, rareSeedId: 'corn_seed', rareSeedQuantity: 8 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 }
  ],
  villager_8: [
    { id: 'fest_spring_planting_villager_8_s1', villagerId: 'villager_8', festivalId: 'spring_planting', unlockStage: 1 as AffinityStage, name: '春耕节·新季收购', description: '周老板要在春耕节开始新一季的农产品收购。', items: [{ itemId: 'pumpkin_product', quantity: 8, minQuality: 3 }, { itemId: 'corn_product', quantity: 8, minQuality: 3 }, { itemId: 'tomato_product', quantity: 8, minQuality: 3 }], reward: { coins: 700, reputation: 15, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 4 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'fest_summer_solstice_villager_8_s2', villagerId: 'villager_8', festivalId: 'summer_solstice', unlockStage: 2 as AffinityStage, name: '夏至节·高端市场', description: '周老板要在夏至节开拓高端市场，需要优质产品。', items: [{ itemId: 'tomato_product', quantity: 15, minQuality: 4 }, { itemId: 'corn_product', quantity: 12, minQuality: 4 }], reward: { coins: 1100, reputation: 20, rareSeedId: 'tomato_seed', rareSeedQuantity: 6 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'fest_harvest_villager_8_s3', villagerId: 'villager_8', festivalId: 'harvest', unlockStage: 3 as AffinityStage, name: '丰收节·出口订单', description: '周老板在丰收节拿到了出口大订单！', items: [{ itemId: 'pumpkin_product', quantity: 18, minQuality: 4 }, { itemId: 'corn_product', quantity: 15, minQuality: 4 }, { itemId: 'tomato_product', quantity: 15, minQuality: 4 }], reward: { coins: 2200, reputation: 35, rareSeedId: 'tomato_seed', rareSeedQuantity: 8 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'fest_winter_solstice_villager_8_s4', villagerId: 'villager_8', festivalId: 'winter_solstice', unlockStage: 4 as AffinityStage, name: '冬至节·年终盘点', description: '周老板要在冬至节完成年终大客户的顶级订单。', items: [{ itemId: 'pumpkin_product', quantity: 25, minQuality: 5 }, { itemId: 'corn_product', quantity: 25, minQuality: 5 }, { itemId: 'tomato_product', quantity: 25, minQuality: 5 }], reward: { coins: 4500, reputation: 50, rareSeedId: 'strawberry_seed', rareSeedQuantity: 10 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 }
  ]
};

export const FESTIVAL_DIALOGUES: Record<string, FestivalDialogueNode[]> = {
  villager_1: [
    { id: 'fest_spring_planting_villager_1_s1', festivalId: 'spring_planting', villagerId: 'villager_1', stage: 1, speaker: 'villager', text: '春耕节到了！今年的萝卜苗长得真好。', autoNext: 'fest_spring_planting_villager_1_s1_2' },
    { id: 'fest_spring_planting_villager_1_s1_2', festivalId: 'spring_planting', villagerId: 'villager_1', stage: 1, speaker: 'villager', text: '你要是有多余的萝卜，我正需要一些好种苗呢。', unlockOrderId: 'fest_spring_planting_villager_1_s1', autoNext: 'fest_spring_planting_villager_1_s1_end' },
    { id: 'fest_spring_planting_villager_1_s1_end', festivalId: 'spring_planting', villagerId: 'villager_1', stage: 1, speaker: 'narrator', text: '李大叔望着田地，眼中满是对春耕的期待。', isEnding: true },
    { id: 'fest_summer_solstice_villager_1_s2', festivalId: 'summer_solstice', villagerId: 'villager_1', stage: 2, speaker: 'villager', text: '夏至了，地里的土豆和玉米都该收了。', autoNext: 'fest_summer_solstice_villager_1_s2_2' },
    { id: 'fest_summer_solstice_villager_1_s2_2', festivalId: 'summer_solstice', villagerId: 'villager_1', stage: 2, speaker: 'villager', text: '夏至节嘛，得展示展示咱们最好的品种！你帮我弄些来？', unlockOrderId: 'fest_summer_solstice_villager_1_s2', autoNext: 'fest_summer_solstice_villager_1_s2_end' },
    { id: 'fest_summer_solstice_villager_1_s2_end', festivalId: 'summer_solstice', villagerId: 'villager_1', stage: 2, speaker: 'narrator', text: '炎炎夏日，李大叔的热情却丝毫不减。', isEnding: true },
    { id: 'fest_harvest_villager_1_s3', festivalId: 'harvest', villagerId: 'villager_1', stage: 3, speaker: 'narrator', text: '丰收节到了，李大叔正在忙碌地整理展台。', autoNext: 'fest_harvest_villager_1_s3_2' },
    { id: 'fest_harvest_villager_1_s3_2', festivalId: 'harvest', villagerId: 'villager_1', stage: 3, speaker: 'villager', text: '这可是我等了一整年的节日！帮我多准备些好东西，让全村人都开开眼界！', unlockOrderId: 'fest_harvest_villager_1_s3', autoNext: 'fest_harvest_villager_1_s3_end' },
    { id: 'fest_harvest_villager_1_s3_end', festivalId: 'harvest', villagerId: 'villager_1', stage: 3, speaker: 'narrator', text: '金色的田野上，丰收的喜悦弥漫在空气中。', isEnding: true },
    { id: 'fest_winter_solstice_villager_1_s4', festivalId: 'winter_solstice', villagerId: 'villager_1', stage: 4, speaker: 'villager', text: '冬至了...该给乡亲们煮一锅热腾腾的蔬菜汤。', autoNext: 'fest_winter_solstice_villager_1_s4_2' },
    { id: 'fest_winter_solstice_villager_1_s4_2', festivalId: 'winter_solstice', villagerId: 'villager_1', stage: 4, speaker: 'villager', text: '好孩子，帮大叔多备些萝卜和土豆吧，让大家都能暖暖心。', unlockOrderId: 'fest_winter_solstice_villager_1_s4', autoNext: 'fest_winter_solstice_villager_1_s4_end' },
    { id: 'fest_winter_solstice_villager_1_s4_end', festivalId: 'winter_solstice', villagerId: 'villager_1', stage: 4, speaker: 'narrator', text: '寒冬中的暖汤，是最朴实的关怀。', isEnding: true }
  ],
  villager_2: [
    { id: 'fest_spring_planting_villager_2_s1', festivalId: 'spring_planting', villagerId: 'villager_2', stage: 1, speaker: 'villager', text: '春耕节快乐呀！奶奶要做草莓花束呢。', autoNext: 'fest_spring_planting_villager_2_s1_2' },
    { id: 'fest_spring_planting_villager_2_s1_2', festivalId: 'spring_planting', villagerId: 'villager_2', stage: 1, speaker: 'villager', text: '有新鲜草莓和牛奶就好了，你能帮奶奶找来吗？', unlockOrderId: 'fest_spring_planting_villager_2_s1', autoNext: 'fest_spring_planting_villager_2_s1_end' },
    { id: 'fest_spring_planting_villager_2_s1_end', festivalId: 'spring_planting', villagerId: 'villager_2', stage: 1, speaker: 'narrator', text: '王奶奶笑眯眯地开始准备她的草莓花束。', isEnding: true },
    { id: 'fest_summer_solstice_villager_2_s2', festivalId: 'summer_solstice', villagerId: 'villager_2', stage: 2, speaker: 'villager', text: '大热天的，来碗草莓冰沙吧！', autoNext: 'fest_summer_solstice_villager_2_s2_2' },
    { id: 'fest_summer_solstice_villager_2_s2_2', festivalId: 'summer_solstice', villagerId: 'villager_2', stage: 2, speaker: 'villager', text: '不过奶奶的草莓和鸡蛋不够了...能帮我补点货吗？', unlockOrderId: 'fest_summer_solstice_villager_2_s2', autoNext: 'fest_summer_solstice_villager_2_s2_end' },
    { id: 'fest_summer_solstice_villager_2_s2_end', festivalId: 'summer_solstice', villagerId: 'villager_2', stage: 2, speaker: 'narrator', text: '夏日的清凉甜品，是王奶奶最拿手的绝活。', isEnding: true },
    { id: 'fest_harvest_villager_2_s3', festivalId: 'harvest', villagerId: 'villager_2', stage: 3, speaker: 'villager', text: '丰收节到了！奶奶要做最拿手的南瓜浓汤！', autoNext: 'fest_harvest_villager_2_s3_2' },
    { id: 'fest_harvest_villager_2_s3_2', festivalId: 'harvest', villagerId: 'villager_2', stage: 3, speaker: 'villager', text: '南瓜、牛奶、再来点草莓装饰，那可就完美了！帮我准备材料吧？', unlockOrderId: 'fest_harvest_villager_2_s3', autoNext: 'fest_harvest_villager_2_s3_end' },
    { id: 'fest_harvest_villager_2_s3_end', festivalId: 'harvest', villagerId: 'villager_2', stage: 3, speaker: 'narrator', text: '丰收节的南瓜浓汤，是全村人最期待的美味。', isEnding: true },
    { id: 'fest_winter_solstice_villager_2_s4', festivalId: 'winter_solstice', villagerId: 'villager_2', stage: 4, speaker: 'villager', text: '冬至了，最冷的时候也最需要甜品的温暖。', autoNext: 'fest_winter_solstice_villager_2_s4_2' },
    { id: 'fest_winter_solstice_villager_2_s4_2', festivalId: 'winter_solstice', villagerId: 'villager_2', stage: 4, speaker: 'villager', text: '奶奶要办一场冬至甜品盛宴！牛奶、鸡蛋、草莓，缺一不可！', unlockOrderId: 'fest_winter_solstice_villager_2_s4', autoNext: 'fest_winter_solstice_villager_2_s4_end' },
    { id: 'fest_winter_solstice_villager_2_s4_end', festivalId: 'winter_solstice', villagerId: 'villager_2', stage: 4, speaker: 'narrator', text: '在寒冬中，甜蜜的温暖最能抚慰人心。', isEnding: true }
  ],
  villager_3: [
    { id: 'fest_spring_planting_villager_3_s1', festivalId: 'spring_planting', villagerId: 'villager_3', stage: 1, speaker: 'villager', text: '春耕节！这是我回村后的第一个春天，好激动！', autoNext: 'fest_spring_planting_villager_3_s1_2' },
    { id: 'fest_spring_planting_villager_3_s1_2', festivalId: 'spring_planting', villagerId: 'villager_3', stage: 1, speaker: 'villager', text: '我有个超酷的嫁接实验，需要草莓和番茄的样本，你能提供吗？', unlockOrderId: 'fest_spring_planting_villager_3_s1', autoNext: 'fest_spring_planting_villager_3_s1_end' },
    { id: 'fest_spring_planting_villager_3_s1_end', festivalId: 'spring_planting', villagerId: 'villager_3', stage: 1, speaker: 'narrator', text: '张小妹的眼中闪烁着科学的光芒。', isEnding: true },
    { id: 'fest_summer_solstice_villager_3_s2', festivalId: 'summer_solstice', villagerId: 'villager_3', stage: 2, speaker: 'villager', text: '夏至节光照最强，是做实验的最佳时机！', autoNext: 'fest_summer_solstice_villager_3_s2_2' },
    { id: 'fest_summer_solstice_villager_3_s2_2', festivalId: 'summer_solstice', villagerId: 'villager_3', stage: 2, speaker: 'villager', text: '番茄和玉米的光照数据对比，你帮我收集样本吧？', unlockOrderId: 'fest_summer_solstice_villager_3_s2', autoNext: 'fest_summer_solstice_villager_3_s2_end' },
    { id: 'fest_summer_solstice_villager_3_s2_end', festivalId: 'summer_solstice', villagerId: 'villager_3', stage: 2, speaker: 'narrator', text: '烈日下的实验数据，是最珍贵的科研资料。', isEnding: true },
    { id: 'fest_harvest_villager_3_s3', festivalId: 'harvest', villagerId: 'villager_3', stage: 3, speaker: 'villager', text: '丰收节是展示科研成果的最好舞台！', autoNext: 'fest_harvest_villager_3_s3_2' },
    { id: 'fest_harvest_villager_3_s3_2', festivalId: 'harvest', villagerId: 'villager_3', stage: 3, speaker: 'villager', text: '我的学术报告需要大量高品质样本，你是我最可靠的供应商！', unlockOrderId: 'fest_harvest_villager_3_s3', autoNext: 'fest_harvest_villager_3_s3_end' },
    { id: 'fest_harvest_villager_3_s3_end', festivalId: 'harvest', villagerId: 'villager_3', stage: 3, speaker: 'narrator', text: '科学与农业的结合，正在绽放耀眼的光芒。', isEnding: true },
    { id: 'fest_winter_solstice_villager_3_s4', festivalId: 'winter_solstice', villagerId: 'villager_3', stage: 4, speaker: 'villager', text: '冬至也能种东西！我的温室计划就要启动了！', autoNext: 'fest_winter_solstice_villager_3_s4_2' },
    { id: 'fest_winter_solstice_villager_3_s4_2', festivalId: 'winter_solstice', villagerId: 'villager_3', stage: 4, speaker: 'villager', text: '我需要番茄和草莓来验证温室种植的可行性，这可是突破性的项目！', unlockOrderId: 'fest_winter_solstice_villager_3_s4', autoNext: 'fest_winter_solstice_villager_3_s4_end' },
    { id: 'fest_winter_solstice_villager_3_s4_end', festivalId: 'winter_solstice', villagerId: 'villager_3', stage: 4, speaker: 'narrator', text: '在严冬中种下希望，是张小妹最大的梦想。', isEnding: true }
  ],
  villager_4: [
    { id: 'fest_spring_planting_villager_4_s1', festivalId: 'spring_planting', villagerId: 'villager_4', stage: 1, speaker: 'villager', text: '春耕节好！陈大哥帮你搭围栏，保准结实！', autoNext: 'fest_spring_planting_villager_4_s1_2' },
    { id: 'fest_spring_planting_villager_4_s1_2', festivalId: 'spring_planting', villagerId: 'villager_4', stage: 1, speaker: 'villager', text: '就是材料还差点，玉米杆和南瓜壳都行，帮我弄点来？', unlockOrderId: 'fest_spring_planting_villager_4_s1', autoNext: 'fest_spring_planting_villager_4_s1_end' },
    { id: 'fest_spring_planting_villager_4_s1_end', festivalId: 'spring_planting', villagerId: 'villager_4', stage: 1, speaker: 'narrator', text: '陈大哥撸起袖子，干劲十足。', isEnding: true },
    { id: 'fest_summer_solstice_villager_4_s2', festivalId: 'summer_solstice', villagerId: 'villager_4', stage: 2, speaker: 'villager', text: '夏至这么晒，得搭几个遮阳棚！', autoNext: 'fest_summer_solstice_villager_4_s2_2' },
    { id: 'fest_summer_solstice_villager_4_s2_2', festivalId: 'summer_solstice', villagerId: 'villager_4', stage: 2, speaker: 'villager', text: '玉米杆做骨架，番茄汁做防水层，你帮我想想办法！', unlockOrderId: 'fest_summer_solstice_villager_4_s2', autoNext: 'fest_summer_solstice_villager_4_s2_end' },
    { id: 'fest_summer_solstice_villager_4_s2_end', festivalId: 'summer_solstice', villagerId: 'villager_4', stage: 2, speaker: 'narrator', text: '木匠的巧手，总能让废物变宝。', isEnding: true },
    { id: 'fest_harvest_villager_4_s3', festivalId: 'harvest', villagerId: 'villager_4', stage: 3, speaker: 'villager', text: '丰收节了！村里粮仓该修缮了，我正愁材料呢。', autoNext: 'fest_harvest_villager_4_s3_2' },
    { id: 'fest_harvest_villager_4_s3_2', festivalId: 'harvest', villagerId: 'villager_4', stage: 3, speaker: 'villager', text: '南瓜和玉米都得大量用上，这可是给全村人修的，帮个忙吧！', unlockOrderId: 'fest_harvest_villager_4_s3', autoNext: 'fest_harvest_villager_4_s3_end' },
    { id: 'fest_harvest_villager_4_s3_end', festivalId: 'harvest', villagerId: 'villager_4', stage: 3, speaker: 'narrator', text: '手艺人的责任感，在这一刻闪闪发光。', isEnding: true },
    { id: 'fest_winter_solstice_villager_4_s4', festivalId: 'winter_solstice', villagerId: 'villager_4', stage: 4, speaker: 'villager', text: '冬至前必须把防风工程搞完！', autoNext: 'fest_winter_solstice_villager_4_s4_2' },
    { id: 'fest_winter_solstice_villager_4_s4_2', festivalId: 'winter_solstice', villagerId: 'villager_4', stage: 4, speaker: 'villager', text: '玉米、南瓜、土豆，都得上最好的！咱们村的安全就靠它了！', unlockOrderId: 'fest_winter_solstice_villager_4_s4', autoNext: 'fest_winter_solstice_villager_4_s4_end' },
    { id: 'fest_winter_solstice_villager_4_s4_end', festivalId: 'winter_solstice', villagerId: 'villager_4', stage: 4, speaker: 'narrator', text: '风雪将至，但有了陈大哥的防护，村民们安心许多。', isEnding: true }
  ],
  villager_5: [
    { id: 'fest_spring_planting_villager_5_s1', festivalId: 'spring_planting', villagerId: 'villager_5', stage: 1, speaker: 'villager', text: '春耕节好呀！小卖部搞开张特卖呢！', autoNext: 'fest_spring_planting_villager_5_s1_2' },
    { id: 'fest_spring_planting_villager_5_s1_2', festivalId: 'spring_planting', villagerId: 'villager_5', stage: 1, speaker: 'villager', text: '番茄和鸡蛋是今天的爆款，帮我补点货呗？', unlockOrderId: 'fest_spring_planting_villager_5_s1', autoNext: 'fest_spring_planting_villager_5_s1_end' },
    { id: 'fest_spring_planting_villager_5_s1_end', festivalId: 'spring_planting', villagerId: 'villager_5', stage: 1, speaker: 'narrator', text: '刘阿姨的小卖部总是最热闹的地方。', isEnding: true },
    { id: 'fest_summer_solstice_villager_5_s2', festivalId: 'summer_solstice', villagerId: 'villager_5', stage: 2, speaker: 'villager', text: '夏至了！我要推出夏日冰饮系列！', autoNext: 'fest_summer_solstice_villager_5_s2_2' },
    { id: 'fest_summer_solstice_villager_5_s2_2', festivalId: 'summer_solstice', villagerId: 'villager_5', stage: 2, speaker: 'villager', text: '番茄冰沙和牛奶冰饮，原料就靠你了！', unlockOrderId: 'fest_summer_solstice_villager_5_s2', autoNext: 'fest_summer_solstice_villager_5_s2_end' },
    { id: 'fest_summer_solstice_villager_5_s2_end', festivalId: 'summer_solstice', villagerId: 'villager_5', stage: 2, speaker: 'narrator', text: '刘阿姨的商业嗅觉，在夏日里格外灵敏。', isEnding: true },
    { id: 'fest_harvest_villager_5_s3', festivalId: 'harvest', villagerId: 'villager_5', stage: 3, speaker: 'villager', text: '丰收节大促销！全场五折起！', autoNext: 'fest_harvest_villager_5_s3_2' },
    { id: 'fest_harvest_villager_5_s3_2', festivalId: 'harvest', villagerId: 'villager_5', stage: 3, speaker: 'villager', text: '不过货得备足才行...番茄、鸡蛋、牛奶，统统都要！', unlockOrderId: 'fest_harvest_villager_5_s3', autoNext: 'fest_harvest_villager_5_s3_end' },
    { id: 'fest_harvest_villager_5_s3_end', festivalId: 'harvest', villagerId: 'villager_5', stage: 3, speaker: 'narrator', text: '丰收的节日，也是刘阿姨生意最红火的时候。', isEnding: true },
    { id: 'fest_winter_solstice_villager_5_s4', festivalId: 'winter_solstice', villagerId: 'villager_5', stage: 4, speaker: 'villager', text: '冬至了！年货得提前备上，这是全年最大的一单！', autoNext: 'fest_winter_solstice_villager_5_s4_2' },
    { id: 'fest_winter_solstice_villager_5_s4_2', festivalId: 'winter_solstice', villagerId: 'villager_5', stage: 4, speaker: 'villager', text: '鸡蛋、牛奶、番茄，品质必须是最好的！年底就靠这单了！', unlockOrderId: 'fest_winter_solstice_villager_5_s4', autoNext: 'fest_winter_solstice_villager_5_s4_end' },
    { id: 'fest_winter_solstice_villager_5_s4_end', festivalId: 'winter_solstice', villagerId: 'villager_5', stage: 4, speaker: 'narrator', text: '精明能干的刘阿姨，总能在节日里抓住商机。', isEnding: true }
  ],
  villager_6: [
    { id: 'fest_spring_planting_villager_6_s1', festivalId: 'spring_planting', villagerId: 'villager_6', stage: 1, speaker: 'villager', text: '春耕节，万物复苏，正是研究品种改良的好时机。', autoNext: 'fest_spring_planting_villager_6_s1_2' },
    { id: 'fest_spring_planting_villager_6_s1_2', festivalId: 'spring_planting', villagerId: 'villager_6', stage: 1, speaker: 'villager', text: '我需要一些草莓和南瓜做杂交实验，你能提供样本吗？', unlockOrderId: 'fest_spring_planting_villager_6_s1', autoNext: 'fest_spring_planting_villager_6_s1_end' },
    { id: 'fest_spring_planting_villager_6_s1_end', festivalId: 'spring_planting', villagerId: 'villager_6', stage: 1, speaker: 'narrator', text: '赵爷爷的研究笔记上，又多了一行期待的数据。', isEnding: true },
    { id: 'fest_summer_solstice_villager_6_s2', festivalId: 'summer_solstice', villagerId: 'villager_6', stage: 2, speaker: 'villager', text: '夏至日照最长，我要做光照与产量关系的实验。', autoNext: 'fest_summer_solstice_villager_6_s2_2' },
    { id: 'fest_summer_solstice_villager_6_s2_2', festivalId: 'summer_solstice', villagerId: 'villager_6', stage: 2, speaker: 'villager', text: '草莓和番茄的对比数据最关键，帮老教授一把吧？', unlockOrderId: 'fest_summer_solstice_villager_6_s2', autoNext: 'fest_summer_solstice_villager_6_s2_end' },
    { id: 'fest_summer_solstice_villager_6_s2_end', festivalId: 'summer_solstice', villagerId: 'villager_6', stage: 2, speaker: 'narrator', text: '科学研究从不止步，即便在盛夏酷暑中。', isEnding: true },
    { id: 'fest_harvest_villager_6_s3', festivalId: 'harvest', villagerId: 'villager_6', stage: 3, speaker: 'villager', text: '丰收节正适合发表我的年度学术报告。', autoNext: 'fest_harvest_villager_6_s3_2' },
    { id: 'fest_harvest_villager_6_s3_2', festivalId: 'harvest', villagerId: 'villager_6', stage: 3, speaker: 'villager', text: '南瓜、草莓、玉米的对比数据都需要补充，这是最后的关键样本！', unlockOrderId: 'fest_harvest_villager_6_s3', autoNext: 'fest_harvest_villager_6_s3_end' },
    { id: 'fest_harvest_villager_6_s3_end', festivalId: 'harvest', villagerId: 'villager_6', stage: 3, speaker: 'narrator', text: '赵爷爷的报告，将为农业研究贡献一份力量。', isEnding: true },
    { id: 'fest_winter_solstice_villager_6_s4', festivalId: 'winter_solstice', villagerId: 'villager_6', stage: 4, speaker: 'villager', text: '冬至虽冷，却是培育抗寒品种的最佳时机。', autoNext: 'fest_winter_solstice_villager_6_s4_2' },
    { id: 'fest_winter_solstice_villager_6_s4_2', festivalId: 'winter_solstice', villagerId: 'villager_6', stage: 4, speaker: 'villager', text: '如果我能培育出冬季也能生长的草莓和南瓜，那将是划时代的突破！', unlockOrderId: 'fest_winter_solstice_villager_6_s4', autoNext: 'fest_winter_solstice_villager_6_s4_end' },
    { id: 'fest_winter_solstice_villager_6_s4_end', festivalId: 'winter_solstice', villagerId: 'villager_6', stage: 4, speaker: 'narrator', text: '在严冬中播种希望，老教授的精神令人敬佩。', isEnding: true }
  ],
  villager_7: [
    { id: 'fest_spring_planting_villager_7_s1', festivalId: 'spring_planting', villagerId: 'villager_7', stage: 1, speaker: 'villager', text: '春耕节到了，小动物们也需要春天的营养！', autoNext: 'fest_spring_planting_villager_7_s1_2' },
    { id: 'fest_spring_planting_villager_7_s1_2', festivalId: 'spring_planting', villagerId: 'villager_7', stage: 1, speaker: 'villager', text: '牛奶和鸡蛋是最好的营养品，你能帮我准备一些吗？', unlockOrderId: 'fest_spring_planting_villager_7_s1', autoNext: 'fest_spring_planting_villager_7_s1_end' },
    { id: 'fest_spring_planting_villager_7_s1_end', festivalId: 'spring_planting', villagerId: 'villager_7', stage: 1, speaker: 'narrator', text: '小动物们在孙小美的照料下，个个活蹦乱跳。', isEnding: true },
    { id: 'fest_summer_solstice_villager_7_s2', festivalId: 'summer_solstice', villagerId: 'villager_7', stage: 2, speaker: 'villager', text: '夏至太热了，小动物们都需要消暑！', autoNext: 'fest_summer_solstice_villager_7_s2_2' },
    { id: 'fest_summer_solstice_villager_7_s2_2', festivalId: 'summer_solstice', villagerId: 'villager_7', stage: 2, speaker: 'villager', text: '牛奶和草莓做的冰沙，动物们一定喜欢！帮帮我吧？', unlockOrderId: 'fest_summer_solstice_villager_7_s2', autoNext: 'fest_summer_solstice_villager_7_s2_end' },
    { id: 'fest_summer_solstice_villager_7_s2_end', festivalId: 'summer_solstice', villagerId: 'villager_7', stage: 2, speaker: 'narrator', text: '孙小美对动物们的关爱，细致入微。', isEnding: true },
    { id: 'fest_harvest_villager_7_s3', festivalId: 'harvest', villagerId: 'villager_7', stage: 3, speaker: 'villager', text: '丰收节我要举办动物运动会！', autoNext: 'fest_harvest_villager_7_s3_2' },
    { id: 'fest_harvest_villager_7_s3_2', festivalId: 'harvest', villagerId: 'villager_7', stage: 3, speaker: 'villager', text: '鸡蛋、牛奶、南瓜，动物运动员们的补给全靠你了！', unlockOrderId: 'fest_harvest_villager_7_s3', autoNext: 'fest_harvest_villager_7_s3_end' },
    { id: 'fest_harvest_villager_7_s3_end', festivalId: 'harvest', villagerId: 'villager_7', stage: 3, speaker: 'narrator', text: '动物运动会即将开幕，全村人都充满期待。', isEnding: true },
    { id: 'fest_winter_solstice_villager_7_s4', festivalId: 'winter_solstice', villagerId: 'villager_7', stage: 4, speaker: 'villager', text: '冬至是最冷的时候，流浪动物们需要温暖的庇护所。', autoNext: 'fest_winter_solstice_villager_7_s4_2' },
    { id: 'fest_winter_solstice_villager_7_s4_2', festivalId: 'winter_solstice', villagerId: 'villager_7', stage: 4, speaker: 'villager', text: '牛奶、鸡蛋、玉米，有了这些，我就能让每个小生命都安然过冬！', unlockOrderId: 'fest_winter_solstice_villager_7_s4', autoNext: 'fest_winter_solstice_villager_7_s4_end' },
    { id: 'fest_winter_solstice_villager_7_s4_end', festivalId: 'winter_solstice', villagerId: 'villager_7', stage: 4, speaker: 'narrator', text: '寒冬中的温暖庇护所，是孙小美给小动物们最好的礼物。', isEnding: true }
  ],
  villager_8: [
    { id: 'fest_spring_planting_villager_8_s1', festivalId: 'spring_planting', villagerId: 'villager_8', stage: 1, speaker: 'villager', text: '春耕节好！新一年收购季正式开始！', autoNext: 'fest_spring_planting_villager_8_s1_2' },
    { id: 'fest_spring_planting_villager_8_s1_2', festivalId: 'spring_planting', villagerId: 'villager_8', stage: 1, speaker: 'villager', text: '南瓜、玉米、番茄，只要有品质好的，我全都要！', unlockOrderId: 'fest_spring_planting_villager_8_s1', autoNext: 'fest_spring_planting_villager_8_s1_end' },
    { id: 'fest_spring_planting_villager_8_s1_end', festivalId: 'spring_planting', villagerId: 'villager_8', stage: 1, speaker: 'narrator', text: '周老板的收购站，又迎来了忙碌的一天。', isEnding: true },
    { id: 'fest_summer_solstice_villager_8_s2', festivalId: 'summer_solstice', villagerId: 'villager_8', stage: 2, speaker: 'villager', text: '夏至节，我要开拓高端市场！', autoNext: 'fest_summer_solstice_villager_8_s2_2' },
    { id: 'fest_summer_solstice_villager_8_s2_2', festivalId: 'summer_solstice', villagerId: 'villager_8', stage: 2, speaker: 'villager', text: '高端客户只要最好的番茄和玉米，品质不过关可不行。', unlockOrderId: 'fest_summer_solstice_villager_8_s2', autoNext: 'fest_summer_solstice_villager_8_s2_end' },
    { id: 'fest_summer_solstice_villager_8_s2_end', festivalId: 'summer_solstice', villagerId: 'villager_8', stage: 2, speaker: 'narrator', text: '周老板对品质的要求，从未降低过。', isEnding: true },
    { id: 'fest_harvest_villager_8_s3', festivalId: 'harvest', villagerId: 'villager_8', stage: 3, speaker: 'villager', text: '丰收节，我拿到了一个出口大订单！', autoNext: 'fest_harvest_villager_8_s3_2' },
    { id: 'fest_harvest_villager_8_s3_2', festivalId: 'harvest', villagerId: 'villager_8', stage: 3, speaker: 'villager', text: '南瓜、玉米、番茄，全部要顶级品质！这可是咱村走向世界的机会！', unlockOrderId: 'fest_harvest_villager_8_s3', autoNext: 'fest_harvest_villager_8_s3_end' },
    { id: 'fest_harvest_villager_8_s3_end', festivalId: 'harvest', villagerId: 'villager_8', stage: 3, speaker: 'narrator', text: '农产品走出村庄，周老板功不可没。', isEnding: true },
    { id: 'fest_winter_solstice_villager_8_s4', festivalId: 'winter_solstice', villagerId: 'villager_8', stage: 4, speaker: 'villager', text: '冬至了，年终大客户等着交货呢！', autoNext: 'fest_winter_solstice_villager_8_s4_2' },
    { id: 'fest_winter_solstice_villager_8_s4_2', festivalId: 'winter_solstice', villagerId: 'villager_8', stage: 4, speaker: 'villager', text: '南瓜、玉米、番茄，五星品质！做到这个，你就是我的合伙人！', unlockOrderId: 'fest_winter_solstice_villager_8_s4', autoNext: 'fest_winter_solstice_villager_8_s4_end' },
    { id: 'fest_winter_solstice_villager_8_s4_end', festivalId: 'winter_solstice', villagerId: 'villager_8', stage: 4, speaker: 'narrator', text: '商人的眼光和农民的汗水，在丰收中结出了金色的果实。', isEnding: true }
  ]
};

export function getFestivalBySeason(season: Season, day: number): FestivalConfig | null {
  for (const festival of Object.values(FESTIVALS)) {
    if (festival.season === season && festival.festivalDay === day) {
      return festival;
    }
  }
  return null;
}

export function getFestivalById(id: FestivalType): FestivalConfig | undefined {
  return FESTIVALS[id];
}

export function getVillagerFestivalPreference(villagerId: string, festivalId: FestivalType): FestivalVillagerPreference | undefined {
  return FESTIVAL_VILLAGER_PREFERENCES[villagerId]?.[festivalId];
}

export function getFestivalDialogueMap(villagerId: string): Map<string, FestivalDialogueNode> {
  const map = new Map<string, FestivalDialogueNode>();
  const dialogues = FESTIVAL_DIALOGUES[villagerId];
  if (dialogues) {
    for (const node of dialogues) {
      map.set(node.id, node);
    }
  }
  return map;
}

export function getStartFestivalDialogue(villagerId: string, festivalId: FestivalType, stage: AffinityStage): FestivalDialogueNode | undefined {
  const dialogues = FESTIVAL_DIALOGUES[villagerId];
  if (!dialogues) return undefined;
  return dialogues.find(d => d.festivalId === festivalId && d.stage === stage && !d.id.endsWith('_2') && !d.id.endsWith('_end'));
}

export function getFestivalOrdersForVillager(villagerId: string, festivalId: FestivalType, stage: AffinityStage): FestivalExclusiveOrder[] {
  const orders = FESTIVAL_EXCLUSIVE_ORDERS[villagerId];
  if (!orders) return [];
  return orders.filter(o => o.festivalId === festivalId && o.unlockStage <= stage);
}

export function getFestivalOrderById(orderId: string): FestivalExclusiveOrder | undefined {
  for (const orders of Object.values(FESTIVAL_EXCLUSIVE_ORDERS)) {
    const found = orders.find(o => o.id === orderId);
    if (found) return found;
  }
  return undefined;
}