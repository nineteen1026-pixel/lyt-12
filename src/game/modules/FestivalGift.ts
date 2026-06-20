import type {
  FestivalType,
  FestivalGiftState,
  FestivalGiftResult,
  FestivalGiftRecord,
  FestivalDialogueNode,
  FestivalExclusiveOrder,
  AffinityStage,
  QualityGrade,
  OrderTier,
  StorylineReward,
  DialogueChoice,
  OrderItem,
  OrderReward
} from '../types/game';
import { FESTIVAL_AFFINITY_GAIN, DAY_DURATION } from '../types/game';
import {
  FESTIVALS,
  FESTIVAL_VILLAGER_PREFERENCES,
  FESTIVAL_EXCLUSIVE_ORDERS,
  FESTIVAL_DIALOGUES,
  getFestivalBySeason,
  getVillagerFestivalPreference,
  getFestivalDialogueMap,
  getStartFestivalDialogue,
  getFestivalOrderById
} from '../data/festivalGifts';
import { getVillagerDetail } from '../data/villagers';
import { getItem } from '../data/items';

export interface FestivalVillagerAccess {
  getStage(villagerId: string): AffinityStage;
  getAffinity(villagerId: string): number;
  addAffinity(villagerId: string, amount: number): {
    stageAdvanced: boolean;
    newStage: AffinityStage;
    stageCodexTriggers: string[];
    stageAchievementTriggers: string[];
  };
}

export interface FestivalInventoryAccess {
  hasItem(itemId: string, quantity: number, minQuality?: QualityGrade): boolean;
  removeItem(itemId: string, quantity: number, quality?: QualityGrade): boolean;
  getItemQuality(itemId: string): QualityGrade;
  getBestQuality(itemId: string): QualityGrade;
  getItemCount(itemId: string, minQuality?: QualityGrade): number;
}

export interface FestivalRewardAccess {
  addCoins(amount: number): void;
  addReputation(amount: number): void;
  addItem(itemId: string, quantity: number, quality?: QualityGrade): boolean;
}

export interface FestivalStatisticsAccess {
  recordFestivalGiftGiven(villagerId: string, itemId: string, festivalId: FestivalType): void;
  recordFestivalOrderCompleted(villagerId: string, orderId: string): void;
  recordFestivalDialogueCompleted(villagerId: string, festivalId: FestivalType): void;
  recordFestivalParticipated(): void;
  recordAffinityGained(amount: number): void;
}

export interface FestivalDialogueAdvanceResult {
  nextNode: FestivalDialogueNode | null;
  affinityDelta: number;
  ended: boolean;
  stageAdvanced: boolean;
  newStage: AffinityStage;
  unlockedOrders: string[];
  codexTriggers: string[];
  achievementTriggers: string[];
  claimedReward: StorylineReward | null;
}

export function createInitialFestivalGiftState(): FestivalGiftState {
  return {
    id: 'festival_gift',
    currentFestival: null,
    festivalDay: 0,
    giftsGivenThisFestival: [],
    completedFestivalOrders: [],
    unlockedFestivalOrders: [],
    completedFestivalDialogues: [],
    festivalsCompleted: 0,
    totalFestivalGiftsGiven: 0,
    lastFestivalDay: 0
  };
}

export class FestivalGift {
  private state: FestivalGiftState;
  private villagerAccess: FestivalVillagerAccess | null = null;
  private inventoryAccess: FestivalInventoryAccess | null = null;
  private rewardAccess: FestivalRewardAccess | null = null;
  private statisticsAccess: FestivalStatisticsAccess | null = null;
  private dialogueMaps: Record<string, Map<string, FestivalDialogueNode>> = {};
  private currentDialogueStates: Record<string, string> = {};

  constructor(savedState: FestivalGiftState | null) {
    this.state = savedState || createInitialFestivalGiftState();
    this.initializeDialogueMaps();
  }

  private initializeDialogueMaps(): void {
    for (const villagerId of Object.keys(FESTIVAL_DIALOGUES)) {
      this.dialogueMaps[villagerId] = getFestivalDialogueMap(villagerId);
    }
  }

  setVillagerAccess(access: FestivalVillagerAccess): void {
    this.villagerAccess = access;
  }

  setInventoryAccess(access: FestivalInventoryAccess): void {
    this.inventoryAccess = access;
  }

  setRewardAccess(access: FestivalRewardAccess): void {
    this.rewardAccess = access;
  }

  setStatisticsAccess(access: FestivalStatisticsAccess): void {
    this.statisticsAccess = access;
  }

  getState(): FestivalGiftState {
    return { ...this.state };
  }

  getCurrentFestival(): FestivalType | null {
    return this.state.currentFestival;
  }

  getCurrentFestivalConfig() {
    if (!this.state.currentFestival) return null;
    return FESTIVALS[this.state.currentFestival];
  }

  isFestivalActive(): boolean {
    return this.state.currentFestival !== null;
  }

  checkAndStartFestival(season: string, day: number): FestivalType | null {
    const festival = getFestivalBySeason(season as any, day);
    if (!festival) return null;

    if (this.state.currentFestival === festival.id && this.state.festivalDay === day) {
      return festival.id;
    }

    this.state.currentFestival = festival.id;
    this.state.festivalDay = day;
    this.state.giftsGivenThisFestival = [];

    for (const villagerId of Object.keys(FESTIVAL_DIALOGUES)) {
      const stage = this.villagerAccess?.getStage(villagerId) ?? 0;
      const startNode = getStartFestivalDialogue(villagerId, festival.id, stage);
      if (startNode) {
        this.currentDialogueStates[villagerId] = startNode.id;
      }
    }

    this.unlockFestivalOrdersForStage(festival.id);

    if (this.statisticsAccess) {
      this.statisticsAccess.recordFestivalParticipated();
    }

    return festival.id;
  }

  endFestival(): void {
    if (this.state.currentFestival) {
      this.state.festivalsCompleted++;
      this.state.lastFestivalDay = this.state.festivalDay;
    }
    this.state.currentFestival = null;
    this.state.festivalDay = 0;
    this.state.giftsGivenThisFestival = [];
    this.currentDialogueStates = {};
  }

  private unlockFestivalOrdersForStage(festivalId: FestivalType): void {
    if (!this.villagerAccess) return;

    for (const [villagerId, orders] of Object.entries(FESTIVAL_EXCLUSIVE_ORDERS)) {
      const stage = this.villagerAccess.getStage(villagerId);
      for (const order of orders) {
        if (order.festivalId === festivalId && order.unlockStage <= stage) {
          if (!this.state.unlockedFestivalOrders.includes(order.id)) {
            this.state.unlockedFestivalOrders.push(order.id);
          }
        }
      }
    }
  }

  giveFestivalGift(
    villagerId: string,
    itemId: string,
    quality: QualityGrade
  ): FestivalGiftResult {
    if (!this.state.currentFestival) {
      return this.createResult(false, '当前没有节日活动', 0, false, false, 0);
    }

    if (!this.villagerAccess || !this.inventoryAccess) {
      return this.createResult(false, '系统未初始化', 0, false, false, 0);
    }

    const alreadyGifted = this.state.giftsGivenThisFestival.some(
      g => g.villagerId === villagerId && g.itemId === itemId
    );
    if (alreadyGifted) {
      return this.createResult(false, '本次节日已经赠送过此物品', 0, false, false, 0);
    }

    if (!this.inventoryAccess.hasItem(itemId, 1, quality)) {
      return this.createResult(false, '物品数量或品质不足', 0, false, false, 0);
    }

    if (!this.inventoryAccess.removeItem(itemId, 1, quality)) {
      return this.createResult(false, '扣除物品失败', 0, false, false, 0);
    }

    const festivalId = this.state.currentFestival;
    const festival = FESTIVALS[festivalId];
    const preference = getVillagerFestivalPreference(villagerId, festivalId);
    const detail = getVillagerDetail(villagerId);

    let baseAffinity = FESTIVAL_AFFINITY_GAIN.gift_festival_normal;
    let isFavorite = false;
    let isDisliked = false;

    if (preference) {
      if (preference.preferredItems.includes(itemId)) {
        baseAffinity = FESTIVAL_AFFINITY_GAIN.gift_festival_liked;
        isFavorite = true;
      } else if (preference.dislikedItems.includes(itemId)) {
        baseAffinity = FESTIVAL_AFFINITY_GAIN.gift_festival_disliked;
        isDisliked = true;
      }
    }

    const qualityBonus = festival.qualityBonusAffinity[quality] || 0;
    const totalAffinity = Math.floor((baseAffinity + qualityBonus) * festival.giftAffinityMultiplier);

    const addResult = this.villagerAccess.addAffinity(villagerId, totalAffinity);

    const record: FestivalGiftRecord = {
      villagerId,
      festivalId,
      itemId,
      quality,
      affinityGained: totalAffinity,
      timestamp: Date.now()
    };
    this.state.giftsGivenThisFestival.push(record);
    this.state.totalFestivalGiftsGiven++;

    if (this.statisticsAccess) {
      this.statisticsAccess.recordFestivalGiftGiven(villagerId, itemId, festivalId);
      if (totalAffinity > 0) {
        this.statisticsAccess.recordAffinityGained(totalAffinity);
      }
    }

    if (addResult.stageAdvanced) {
      this.unlockFestivalOrdersForStage(festivalId);
    }

    const unlockedOrders: string[] = [];
    if (addResult.stageAdvanced) {
      const newStage = addResult.newStage;
      const villagerOrders = FESTIVAL_EXCLUSIVE_ORDERS[villagerId] || [];
      for (const order of villagerOrders) {
        if (order.festivalId === festivalId && order.unlockStage <= newStage) {
          if (!this.state.unlockedFestivalOrders.includes(order.id)) {
            this.state.unlockedFestivalOrders.push(order.id);
            unlockedOrders.push(order.id);
          }
        }
      }

      const startNode = getStartFestivalDialogue(villagerId, festivalId, newStage);
      if (startNode) {
        this.currentDialogueStates[villagerId] = startNode.id;
      }
    }

    const message = isFavorite
      ? `${detail?.name || '村民'}在节日里非常喜欢这份礼物！品质加成 +${qualityBonus}`
      : isDisliked
        ? `${detail?.name || '村民'}在节日里似乎不太喜欢这个...`
        : `${detail?.name || '村民'}在节日里收下了礼物。品质加成 +${qualityBonus}`;

    return {
      success: true,
      message,
      affinityDelta: totalAffinity,
      isFavorite,
      isDisliked,
      qualityBonus,
      stageAdvanced: addResult.stageAdvanced,
      newStage: addResult.newStage,
      unlockedOrders,
      unlockedDialogues: addResult.stageAdvanced ? [villagerId] : [],
      codexTriggers: addResult.stageCodexTriggers,
      achievementTriggers: addResult.stageAchievementTriggers
    };
  }

  getCurrentFestivalDialogue(villagerId: string): FestivalDialogueNode | null {
    if (!this.state.currentFestival) return null;
    const dialogueId = this.currentDialogueStates[villagerId];
    if (!dialogueId) return null;
    const map = this.dialogueMaps[villagerId];
    return map?.get(dialogueId) || null;
  }

  advanceFestivalDialogue(
    villagerId: string,
    choiceIndex?: number
  ): FestivalDialogueAdvanceResult {
    const empty: FestivalDialogueAdvanceResult = {
      nextNode: null,
      affinityDelta: 0,
      ended: true,
      stageAdvanced: false,
      newStage: 0,
      unlockedOrders: [],
      codexTriggers: [],
      achievementTriggers: [],
      claimedReward: null
    };

    if (!this.state.currentFestival || !this.villagerAccess) return empty;

    const map = this.dialogueMaps[villagerId];
    if (!map) return empty;

    const dialogueId = this.currentDialogueStates[villagerId];
    if (!dialogueId) return empty;

    let currentNode: FestivalDialogueNode | null = map.get(dialogueId) ?? null;
    if (!currentNode) return empty;

    let totalAffinityDelta = 0;
    const unlockedOrders: string[] = [];
    const codexTriggers: string[] = [];
    const achievementTriggers: string[] = [];
    let claimedReward: StorylineReward | null = null;

    if (currentNode.choices && currentNode.choices.length > 0) {
      const idx = choiceIndex ?? 0;
      const choice: DialogueChoice | undefined = currentNode.choices[idx];
      if (choice) {
        totalAffinityDelta += choice.affinityDelta;
        if (choice.nextNodeId) {
          currentNode = map.get(choice.nextNodeId) || null;
        } else {
          currentNode = null;
        }
      } else {
        currentNode = null;
      }
    } else if (currentNode.autoNext) {
      currentNode = map.get(currentNode.autoNext) || null;
    } else {
      currentNode = null;
    }

    while (currentNode) {
      if (currentNode.unlockOrderId && !this.state.unlockedFestivalOrders.includes(currentNode.unlockOrderId)) {
        this.state.unlockedFestivalOrders.push(currentNode.unlockOrderId);
        unlockedOrders.push(currentNode.unlockOrderId);
      }

      if (currentNode.triggerCodexId) {
        codexTriggers.push(currentNode.triggerCodexId);
      }

      if (currentNode.triggerAchievementId) {
        achievementTriggers.push(currentNode.triggerAchievementId);
      }

      if (!this.state.completedFestivalDialogues.includes(currentNode.id)) {
        this.state.completedFestivalDialogues.push(currentNode.id);
        if (this.statisticsAccess) {
          this.statisticsAccess.recordFestivalDialogueCompleted(villagerId, this.state.currentFestival);
        }
      }

      if (currentNode.isEnding) {
        this.currentDialogueStates[villagerId] = currentNode.id;
        const addResult = this.villagerAccess.addAffinity(villagerId, totalAffinityDelta);
        codexTriggers.push(...addResult.stageCodexTriggers);
        achievementTriggers.push(...addResult.stageAchievementTriggers);

        return {
          nextNode: currentNode,
          affinityDelta: totalAffinityDelta,
          ended: true,
          stageAdvanced: addResult.stageAdvanced,
          newStage: addResult.newStage,
          unlockedOrders,
          codexTriggers,
          achievementTriggers,
          claimedReward
        };
      }

      this.currentDialogueStates[villagerId] = currentNode.id;

      if (currentNode.choices && currentNode.choices.length > 0) {
        const addResult = this.villagerAccess.addAffinity(villagerId, totalAffinityDelta);
        codexTriggers.push(...addResult.stageCodexTriggers);
        achievementTriggers.push(...addResult.stageAchievementTriggers);

        return {
          nextNode: currentNode,
          affinityDelta: totalAffinityDelta,
          ended: false,
          stageAdvanced: addResult.stageAdvanced,
          newStage: addResult.newStage,
          unlockedOrders,
          codexTriggers,
          achievementTriggers,
          claimedReward
        };
      }

      if (currentNode.autoNext) {
        currentNode = map.get(currentNode.autoNext) || null;
      } else {
        break;
      }
    }

    const addResult = this.villagerAccess.addAffinity(villagerId, totalAffinityDelta);
    codexTriggers.push(...addResult.stageCodexTriggers);
    achievementTriggers.push(...addResult.stageAchievementTriggers);

    return {
      nextNode: null,
      affinityDelta: totalAffinityDelta,
      ended: true,
      stageAdvanced: addResult.stageAdvanced,
      newStage: addResult.newStage,
      unlockedOrders,
      codexTriggers,
      achievementTriggers,
      claimedReward
    };
  }

  canStartFestivalDialogue(villagerId: string): boolean {
    return this.getCurrentFestivalDialogue(villagerId) !== null;
  }

  getAvailableFestivalOrders(villagerId: string): FestivalExclusiveOrder[] {
    if (!this.state.currentFestival) return [];

    const stage = this.villagerAccess?.getStage(villagerId) ?? 0;
    const orders = FESTIVAL_EXCLUSIVE_ORDERS[villagerId] || [];
    const festivalId = this.state.currentFestival;

    return orders
      .filter(o => o.festivalId === festivalId && o.unlockStage <= stage)
      .filter(o => !this.state.completedFestivalOrders.includes(o.id))
      .sort((a, b) => a.priority - b.priority);
  }

  getAvailableFestivalOrdersForCurrentFestival(): FestivalExclusiveOrder[] {
    if (!this.state.currentFestival) return [];

    const results: FestivalExclusiveOrder[] = [];
    for (const [villagerId, orders] of Object.entries(FESTIVAL_EXCLUSIVE_ORDERS)) {
      const stage = this.villagerAccess?.getStage(villagerId) ?? 0;
      for (const order of orders) {
        if (order.festivalId === this.state.currentFestival &&
            order.unlockStage <= stage &&
            !this.state.completedFestivalOrders.includes(order.id)) {
          results.push(order);
        }
      }
    }
    return results.sort((a, b) => a.priority - b.priority);
  }

  canSubmitFestivalOrder(orderId: string): { canSubmit: boolean; missingItems: OrderItem[] } {
    const order = getFestivalOrderById(orderId);
    if (!order) {
      return { canSubmit: false, missingItems: [] };
    }

    if (this.state.completedFestivalOrders.includes(orderId)) {
      return { canSubmit: false, missingItems: [] };
    }

    if (!this.state.unlockedFestivalOrders.includes(orderId)) {
      return { canSubmit: false, missingItems: [] };
    }

    const missingItems: OrderItem[] = [];
    for (const item of order.items) {
      const minQ = item.minQuality;
      const currentQty = this.inventoryAccess?.getItemCount(item.itemId, minQ) || 0;
      if (currentQty < item.quantity) {
        missingItems.push({
          itemId: item.itemId,
          quantity: item.quantity - currentQty,
          minQuality: minQ
        });
      }
    }

    return { canSubmit: missingItems.length === 0, missingItems };
  }

  submitFestivalOrder(orderId: string): {
    success: boolean;
    message?: string;
    coins?: number;
    reputation?: number;
    rareSeedId?: string;
    rareSeedQuantity?: number;
  } {
    const order = getFestivalOrderById(orderId);
    if (!order) {
      return { success: false, message: '节日订单不存在' };
    }

    if (this.state.completedFestivalOrders.includes(orderId)) {
      return { success: false, message: '节日订单已完成' };
    }

    if (!this.state.unlockedFestivalOrders.includes(orderId)) {
      return { success: false, message: '节日订单未解锁' };
    }

    const { canSubmit, missingItems } = this.canSubmitFestivalOrder(orderId);
    if (!canSubmit) {
      const missingNames = missingItems.map(m => {
        const item = getItem(m.itemId);
        return `${item?.name || m.itemId} x${m.quantity}`;
      }).join('，');
      return { success: false, message: `物品不足：${missingNames}` };
    }

    for (const item of order.items) {
      if (this.inventoryAccess) {
        if (!this.inventoryAccess.removeItem(item.itemId, item.quantity, item.minQuality)) {
          return { success: false, message: '扣除物品失败' };
        }
      }
    }

    if (this.rewardAccess) {
      this.rewardAccess.addCoins(order.reward.coins);
      this.rewardAccess.addReputation(order.reward.reputation);
    }

    this.completeFestivalOrder(orderId);

    let rareSeedId: string | undefined;
    let rareSeedQuantity: number | undefined;

    if (order.reward.rareSeedId && order.reward.rareSeedQuantity && this.rewardAccess) {
      if (this.rewardAccess.addItem(order.reward.rareSeedId, order.reward.rareSeedQuantity)) {
        rareSeedId = order.reward.rareSeedId;
        rareSeedQuantity = order.reward.rareSeedQuantity;
      }
    }

    return {
      success: true,
      coins: order.reward.coins,
      reputation: order.reward.reputation,
      rareSeedId,
      rareSeedQuantity
    };
  }

  completeFestivalOrder(orderId: string): boolean {
    if (!this.state.unlockedFestivalOrders.includes(orderId)) return false;
    if (this.state.completedFestivalOrders.includes(orderId)) return false;

    this.state.completedFestivalOrders.push(orderId);

    const order = getFestivalOrderById(orderId);
    if (order && this.villagerAccess) {
      const gain = FESTIVAL_AFFINITY_GAIN.festival_order_completed;
      this.villagerAccess.addAffinity(order.villagerId, gain);

      if (this.statisticsAccess) {
        this.statisticsAccess.recordFestivalOrderCompleted(order.villagerId, orderId);
        this.statisticsAccess.recordAffinityGained(gain);
      }
    }

    return true;
  }

  isFestivalOrderCompleted(orderId: string): boolean {
    return this.state.completedFestivalOrders.includes(orderId);
  }

  isFestivalOrderUnlocked(orderId: string): boolean {
    return this.state.unlockedFestivalOrders.includes(orderId);
  }

  getGiftsGivenThisFestival(villagerId?: string): FestivalGiftRecord[] {
    if (villagerId) {
      return this.state.giftsGivenThisFestival.filter(g => g.villagerId === villagerId);
    }
    return [...this.state.giftsGivenThisFestival];
  }

  hasGiftedThisFestival(villagerId: string, itemId: string): boolean {
    return this.state.giftsGivenThisFestival.some(
      g => g.villagerId === villagerId && g.itemId === itemId
    );
  }

  getFestivalInfo() {
    const festival = this.state.currentFestival ? FESTIVALS[this.state.currentFestival] : null;
    return {
      isActive: this.isFestivalActive(),
      festival,
      giftsGiven: this.state.giftsGivenThisFestival.length,
      ordersCompleted: this.state.completedFestivalOrders.length,
      unlockedOrders: this.state.unlockedFestivalOrders.length,
      festivalsCompleted: this.state.festivalsCompleted,
      totalGiftsGiven: this.state.totalFestivalGiftsGiven
    };
  }

  private createResult(
    success: boolean,
    message: string,
    affinityDelta: number,
    isFavorite: boolean,
    isDisliked: boolean,
    qualityBonus: number
  ): FestivalGiftResult {
    return {
      success,
      message,
      affinityDelta,
      isFavorite,
      isDisliked,
      qualityBonus,
      stageAdvanced: false,
      newStage: 0,
      unlockedOrders: [],
      unlockedDialogues: [],
      codexTriggers: [],
      achievementTriggers: []
    };
  }
}
