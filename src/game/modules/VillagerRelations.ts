import type {
  VillagerRelationsState,
  VillagerRelationState,
  DialogueNode,
  DialogueResult,
  AffinityStage,
  StageProgress,
  StorylineReward,
  ExclusiveOrderTemplate,
  DialogueChoice,
  OrderTier,
  QualityGrade
} from '../types/game';
import { DAY_DURATION } from '../types/game';
import {
  VILLAGER_DIALOGUES,
  VILLAGER_EXCLUSIVE_ORDERS,
  getAffinityStage,
  getStageProgress,
  getDialogueMap,
  getStartDialogueForStage,
  getExclusiveOrdersForStage,
  getRewardById,
  getVillagerDetail,
  getAllVillagerIds,
  createInitialVillagerRelations,
  AFFINITY_GAIN,
  STAGE_NAMES,
  STAGE_COLORS
} from '../data/villagers';
import { VILLAGERS } from '../data/orders';

export interface RewardAccess {
  addCoins(amount: number): void;
  addReputation(amount: number): void;
  addItem(itemId: string, quantity: number): boolean;
}

export interface StatisticsAccess {
  recordAffinityGained(amount: number): void;
  recordStageUp(villagerId: string, newStage: AffinityStage, oldStage: AffinityStage): void;
  recordDialogueCompleted(villagerId: string): void;
  recordExclusiveOrderCompleted(villagerId: string, orderId: string): void;
  recordGiftGiven(villagerId: string, itemId: string): void;
  recordVillagerStorylineCompleted(villagerId: string): void;
}

export interface DialogueAdvanceResult {
  nextNode: DialogueNode | null;
  affinityDelta: number;
  ended: boolean;
  stageAdvanced: boolean;
  newStage: AffinityStage;
  unlockedOrders: string[];
  unlockedRewards: string[];
  codexTriggers: string[];
  achievementTriggers: string[];
  claimedReward: StorylineReward | null;
}

export class VillagerRelations {
  private state: VillagerRelationsState;
  private dialogueMaps: Record<string, Map<string, DialogueNode>> = {};
  private rewardAccess: RewardAccess;
  private statisticsAccess: StatisticsAccess | null;
  private listeners: Array<(result: DialogueResult) => void> = [];

  constructor(
    savedState: VillagerRelationsState | null,
    rewardAccess: RewardAccess,
    statisticsAccess: StatisticsAccess | null = null
  ) {
    this.state = savedState || createInitialVillagerRelations();
    this.rewardAccess = rewardAccess;
    this.statisticsAccess = statisticsAccess;
    this.initializeDialogueMaps();
  }

  private initializeDialogueMaps(): void {
    for (const villagerId of getAllVillagerIds()) {
      const dialogues = VILLAGER_DIALOGUES[villagerId] || [];
      this.dialogueMaps[villagerId] = getDialogueMap(dialogues);
    }
  }

  subscribe(callback: (result: DialogueResult) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(result: DialogueResult): void {
    for (const listener of this.listeners) {
      listener(result);
    }
  }

  getState(): VillagerRelationsState {
    return {
      ...this.state,
      relations: { ...this.state.relations }
    };
  }

  getVillagerRelation(villagerId: string): VillagerRelationState | null {
    return this.state.relations[villagerId] ? { ...this.state.relations[villagerId] } : null;
  }

  getAllRelations(): VillagerRelationState[] {
    return Object.values(this.state.relations).map(r => ({ ...r }));
  }

  getAffinity(villagerId: string): number {
    return this.state.relations[villagerId]?.affinity ?? 0;
  }

  getStage(villagerId: string): AffinityStage {
    return this.state.relations[villagerId]?.stage ?? 0;
  }

  getStageProgress(villagerId: string): StageProgress {
    const affinity = this.getAffinity(villagerId);
    return getStageProgress(affinity);
  }

  getStageName(stage: AffinityStage): string {
    return STAGE_NAMES[stage];
  }

  getStageColor(stage: AffinityStage): string {
    return STAGE_COLORS[stage];
  }

  getCurrentDialogue(villagerId: string): DialogueNode | null {
    const relation = this.state.relations[villagerId];
    if (!relation) return null;
    const map = this.dialogueMaps[villagerId];
    if (!map) return null;
    return map.get(relation.currentDialogueId) || null;
  }

  getDialogueById(villagerId: string, nodeId: string): DialogueNode | null {
    const map = this.dialogueMaps[villagerId];
    return map?.get(nodeId) || null;
  }

  canInteract(villagerId: string): boolean {
    return !!this.getCurrentDialogue(villagerId);
  }

  addAffinity(villagerId: string, amount: number): { stageAdvanced: boolean; newStage: AffinityStage; stageCodexTriggers: string[]; stageAchievementTriggers: string[] } {
    const relation = this.state.relations[villagerId];
    if (!relation) return { stageAdvanced: false, newStage: 0, stageCodexTriggers: [], stageAchievementTriggers: [] };

    const oldStage = relation.stage;
    relation.affinity = Math.max(0, relation.affinity + amount);
    const newStage = getAffinityStage(relation.affinity);
    relation.stage = newStage;

    if (this.statisticsAccess && amount > 0) {
      this.statisticsAccess.recordAffinityGained(amount);
    }

    this.state.totalAffinity += amount;
    let stageAdvanced = false;
    const stageCodexTriggers: string[] = [];
    const stageAchievementTriggers: string[] = [];

    if (newStage > oldStage) {
      stageAdvanced = true;
      const triggers = this.handleStageAdvance(villagerId, oldStage, newStage);
      stageCodexTriggers.push(...triggers.codexTriggers);
      stageAchievementTriggers.push(...triggers.achievementTriggers);
      if (this.statisticsAccess) {
        this.statisticsAccess.recordStageUp(villagerId, newStage, oldStage);
      }
    }

    if (newStage > this.state.highestStage) {
      this.state.highestStage = newStage;
    }

    relation.lastInteractTime = Date.now();
    return { stageAdvanced, newStage, stageCodexTriggers, stageAchievementTriggers };
  }

  private handleStageAdvance(villagerId: string, oldStage: AffinityStage, newStage: AffinityStage): { codexTriggers: string[]; achievementTriggers: string[] } {
    const relation = this.state.relations[villagerId];
    const codexTriggers: string[] = [];
    const achievementTriggers: string[] = [];
    if (!relation) return { codexTriggers, achievementTriggers };

    for (let s = oldStage + 1; s <= newStage; s++) {
      const startNode = getStartDialogueForStage(villagerId, s as AffinityStage);
      if (startNode) {
        relation.currentDialogueId = startNode.id;
        break;
      }
    }

    for (let s = oldStage + 1; s <= newStage; s++) {
      const orders = getExclusiveOrdersForStage(villagerId, s as AffinityStage);
      for (const order of orders) {
        if (!relation.unlockedExclusiveOrderIds.includes(order.id)) {
          relation.unlockedExclusiveOrderIds.push(order.id);
        }
      }
      if (s === 3) {
        codexTriggers.push(`villager_${villagerId}_story`);
      }
      if (s === 5) {
        codexTriggers.push(`villager_${villagerId}_soulmate`);
      }
    }

    return { codexTriggers, achievementTriggers };
  }

  advanceDialogue(
    villagerId: string,
    choiceIndex?: number
  ): DialogueAdvanceResult {
    const relation = this.state.relations[villagerId];
    if (!relation) {
      const empty: DialogueAdvanceResult = {
        nextNode: null,
        affinityDelta: 0,
        ended: true,
        stageAdvanced: false,
        newStage: 0,
        unlockedOrders: [],
        unlockedRewards: [],
        codexTriggers: [],
        achievementTriggers: [],
        claimedReward: null
      };
      this.notifyDialogueResult(villagerId, null, empty);
      return empty;
    }

    const map = this.dialogueMaps[villagerId];
    if (!map) {
      const empty: DialogueAdvanceResult = {
        nextNode: null,
        affinityDelta: 0,
        ended: true,
        stageAdvanced: false,
        newStage: relation.stage,
        unlockedOrders: [],
        unlockedRewards: [],
        codexTriggers: [],
        achievementTriggers: [],
        claimedReward: null
      };
      this.notifyDialogueResult(villagerId, null, empty);
      return empty;
    }

    let currentNode: DialogueNode | null = map.get(relation.currentDialogueId) || null;
    if (!currentNode) {
      const empty: DialogueAdvanceResult = {
        nextNode: null,
        affinityDelta: 0,
        ended: true,
        stageAdvanced: false,
        newStage: relation.stage,
        unlockedOrders: [],
        unlockedRewards: [],
        codexTriggers: [],
        achievementTriggers: [],
        claimedReward: null
      };
      this.notifyDialogueResult(villagerId, null, empty);
      return empty;
    }

    let totalAffinityDelta = 0;
    const unlockedOrders: string[] = [];
    const unlockedRewards: string[] = [];
    const codexTriggers: string[] = [];
    const achievementTriggers: string[] = [];
    let claimedReward: StorylineReward | null = null;

    if (currentNode.choices && currentNode.choices.length > 0) {
      const idx = choiceIndex ?? 0;
      const choice: DialogueChoice | undefined = currentNode.choices[idx];
      if (choice) {
        totalAffinityDelta += choice.affinityDelta;

        if (choice.unlockRewardId && !relation.claimedRewardIds.includes(choice.unlockRewardId)) {
          relation.claimedRewardIds.push(choice.unlockRewardId);
          const reward = getRewardById(choice.unlockRewardId);
          if (reward) {
            claimedReward = this.claimStorylineReward(reward);
            unlockedRewards.push(choice.unlockRewardId);
          }
        }

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
      if (currentNode.unlockOrderId && !relation.unlockedExclusiveOrderIds.includes(currentNode.unlockOrderId)) {
        relation.unlockedExclusiveOrderIds.push(currentNode.unlockOrderId);
        unlockedOrders.push(currentNode.unlockOrderId);
      }

      if (currentNode.unlockRewardId && !relation.claimedRewardIds.includes(currentNode.unlockRewardId)) {
        relation.claimedRewardIds.push(currentNode.unlockRewardId);
        const reward = getRewardById(currentNode.unlockRewardId);
        if (reward) {
          claimedReward = this.claimStorylineReward(reward);
          unlockedRewards.push(currentNode.unlockRewardId);
        }
      }

      if (currentNode.triggerCodexId) {
        codexTriggers.push(currentNode.triggerCodexId);
      }

      if (currentNode.triggerAchievementId) {
        achievementTriggers.push(currentNode.triggerAchievementId);
      }

      if (!relation.completedDialogueIds.includes(relation.currentDialogueId)) {
        relation.completedDialogueIds.push(relation.currentDialogueId);
        if (this.statisticsAccess) {
          this.statisticsAccess.recordDialogueCompleted(villagerId);
        }
      }

      if (currentNode.isEnding) {
        relation.currentDialogueId = currentNode.id;
        const advanceResult = this.addAffinity(villagerId, totalAffinityDelta);
        codexTriggers.push(...advanceResult.stageCodexTriggers);
        achievementTriggers.push(...advanceResult.stageAchievementTriggers);

        const isStage5Ending = currentNode.id.endsWith('_s5_end');
        if (isStage5Ending && !relation.storylineCompleted) {
          relation.storylineCompleted = true;
          this.state.storylinesCompleted++;
          if (this.statisticsAccess) {
            this.statisticsAccess.recordVillagerStorylineCompleted(villagerId);
          }
        }

        const result: DialogueAdvanceResult = {
          nextNode: currentNode,
          affinityDelta: totalAffinityDelta,
          ended: true,
          stageAdvanced: advanceResult.stageAdvanced,
          newStage: advanceResult.newStage,
          unlockedOrders,
          unlockedRewards,
          codexTriggers,
          achievementTriggers,
          claimedReward
        };

        this.notifyDialogueResult(villagerId, currentNode, result);
        return result;
      }

      relation.currentDialogueId = currentNode.id;

      if (currentNode.choices && currentNode.choices.length > 0) {
        const advanceResult = this.addAffinity(villagerId, totalAffinityDelta);
        codexTriggers.push(...advanceResult.stageCodexTriggers);
        achievementTriggers.push(...advanceResult.stageAchievementTriggers);

        const result: DialogueAdvanceResult = {
          nextNode: currentNode,
          affinityDelta: totalAffinityDelta,
          ended: false,
          stageAdvanced: advanceResult.stageAdvanced,
          newStage: advanceResult.newStage,
          unlockedOrders,
          unlockedRewards,
          codexTriggers,
          achievementTriggers,
          claimedReward
        };

        this.notifyDialogueResult(villagerId, currentNode, result);
        return result;
      }

      if (currentNode.autoNext) {
        currentNode = map.get(currentNode.autoNext) || null;
      } else {
        break;
      }
    }

    if (!relation.completedDialogueIds.includes(relation.currentDialogueId)) {
      relation.completedDialogueIds.push(relation.currentDialogueId);
      if (this.statisticsAccess) {
        this.statisticsAccess.recordDialogueCompleted(villagerId);
      }
    }

    const finalAdvanceResult = this.addAffinity(villagerId, totalAffinityDelta);
    codexTriggers.push(...finalAdvanceResult.stageCodexTriggers);
    achievementTriggers.push(...finalAdvanceResult.stageAchievementTriggers);

    const finalResult: DialogueAdvanceResult = {
      nextNode: null,
      affinityDelta: totalAffinityDelta,
      ended: true,
      stageAdvanced: finalAdvanceResult.stageAdvanced,
      newStage: finalAdvanceResult.newStage,
      unlockedOrders,
      unlockedRewards,
      codexTriggers,
      achievementTriggers,
      claimedReward
    };

    this.notifyDialogueResult(villagerId, null, finalResult);
    return finalResult;
  }

  private notifyDialogueResult(
    villagerId: string,
    finalNode: DialogueNode | null,
    result: DialogueAdvanceResult
  ): void {
    const dialogueResult: DialogueResult = {
      villagerId,
      nodeId: finalNode?.id || '',
      affinityGained: result.affinityDelta,
      stageAdvanced: result.stageAdvanced,
      newStage: result.newStage,
      unlockedOrders: result.unlockedOrders,
      unlockedRewards: result.unlockedRewards,
      codexTriggers: result.codexTriggers,
      achievementTriggers: result.achievementTriggers
    };
    this.notify(dialogueResult);
  }

  private claimStorylineReward(reward: StorylineReward): StorylineReward {
    switch (reward.type) {
      case 'coins':
        this.rewardAccess.addCoins(reward.amount || 0);
        break;
      case 'reputation':
        this.rewardAccess.addReputation(reward.amount || 0);
        break;
      case 'seed':
      case 'item':
        if (reward.itemId) {
          this.rewardAccess.addItem(reward.itemId, reward.amount || 1);
        }
        break;
    }
    return reward;
  }

  recordOrderCompleted(villagerId: string, tier: OrderTier, isExclusive: boolean = false): number {
    const relation = this.state.relations[villagerId];
    if (!relation) return 0;

    relation.ordersCompletedFor++;

    let gain = 0;
    if (isExclusive) {
      gain = AFFINITY_GAIN.exclusive_order_completed;
      this.state.exclusiveOrdersCompleted++;
      if (this.statisticsAccess) {
        this.statisticsAccess.recordExclusiveOrderCompleted(villagerId, '');
      }
    } else {
      switch (tier) {
        case 'common': gain = AFFINITY_GAIN.order_completed_common; break;
        case 'rare': gain = AFFINITY_GAIN.order_completed_rare; break;
        case 'epic': gain = AFFINITY_GAIN.order_completed_epic; break;
        case 'legendary': gain = AFFINITY_GAIN.order_completed_legendary; break;
      }
    }

    if (this.statisticsAccess) {
      this.statisticsAccess.recordAffinityGained(gain);
    }

    const result = this.addAffinity(villagerId, gain);
    relation.lastInteractTime = Date.now();
    if (result.stageAdvanced) {
      this.emitRelationChange(villagerId, gain, result);
    }
    return gain;
  }

  giveGift(villagerId: string, itemId: string, quality?: QualityGrade): VillagerInteractionResult {
    const relation = this.state.relations[villagerId];
    const detail = getVillagerDetail(villagerId);
    if (!relation || !detail) {
      return { success: false, message: '村民不存在' };
    }

    let affinityDelta = AFFINITY_GAIN.gift_normal;
    let message = '';

    if (detail.favoriteItems.includes(itemId)) {
      affinityDelta = AFFINITY_GAIN.gift_liked;
      const qualityBonus = quality ? (quality - 3) * 2 : 0;
      affinityDelta += Math.max(0, qualityBonus);
      message = `${detail.name}非常喜欢这份礼物！`;
    } else if (detail.hatedItems.includes(itemId)) {
      affinityDelta = AFFINITY_GAIN.gift_disliked;
      message = `${detail.name}似乎不太喜欢这个...`;
    } else {
      message = `${detail.name}收下了礼物。`;
    }

    relation.giftsGiven++;
    if (this.statisticsAccess) {
      this.statisticsAccess.recordGiftGiven(villagerId, itemId);
      if (affinityDelta > 0) {
        this.statisticsAccess.recordAffinityGained(affinityDelta);
      }
    }

    const result = this.addAffinity(villagerId, affinityDelta);
    relation.lastInteractTime = Date.now();
    if (result.stageAdvanced || result.stageCodexTriggers.length > 0) {
      this.emitRelationChange(villagerId, affinityDelta, result);
    }

    return {
      success: true,
      message,
      affinityDelta,
      newStage: result.newStage
    };
  }

  private emitRelationChange(
    villagerId: string,
    affinityGained: number,
    addResult: ReturnType<VillagerRelations['addAffinity']>
  ): void {
    const relation = this.state.relations[villagerId];
    const unlockedOrders: string[] = [];
    if (relation && addResult.stageAdvanced) {
      for (const orderId of relation.unlockedExclusiveOrderIds) {
        if (!relation.completedExclusiveOrderIds.includes(orderId)) {
          unlockedOrders.push(orderId);
        }
      }
    }
    const dialogueResult: DialogueResult = {
      villagerId,
      nodeId: '',
      affinityGained,
      stageAdvanced: addResult.stageAdvanced,
      newStage: addResult.newStage,
      unlockedOrders,
      unlockedRewards: [],
      codexTriggers: addResult.stageCodexTriggers,
      achievementTriggers: addResult.stageAchievementTriggers
    };
    this.notify(dialogueResult);
  }

  completeExclusiveOrder(villagerId: string, orderId: string): boolean {
    const relation = this.state.relations[villagerId];
    if (!relation) return false;

    if (!relation.completedExclusiveOrderIds.includes(orderId)) {
      relation.completedExclusiveOrderIds.push(orderId);
    }
    return true;
  }

  isExclusiveOrderUnlocked(orderId: string): boolean {
    for (const relation of Object.values(this.state.relations)) {
      if (relation.unlockedExclusiveOrderIds.includes(orderId)) {
        return true;
      }
    }
    return false;
  }

  isExclusiveOrderCompleted(orderId: string): boolean {
    for (const relation of Object.values(this.state.relations)) {
      if (relation.completedExclusiveOrderIds.includes(orderId)) {
        return true;
      }
    }
    return false;
  }

  getAvailableExclusiveOrders(): ExclusiveOrderTemplate[] {
    const results: ExclusiveOrderTemplate[] = [];
    for (const [villagerId, relation] of Object.entries(this.state.relations)) {
      const allOrders = VILLAGER_EXCLUSIVE_ORDERS[villagerId] || [];
      for (const orderId of relation.unlockedExclusiveOrderIds) {
        const template = allOrders.find(o => o.id === orderId);
        if (!template) continue;
        if (template.oneTimeOnly && relation.completedExclusiveOrderIds.includes(orderId)) {
          continue;
        }
        results.push(template);
      }
    }
    return results.sort((a, b) => a.priority - b.priority);
  }

  getAvailableExclusiveOrdersForVillager(villagerId: string): ExclusiveOrderTemplate[] {
    const relation = this.state.relations[villagerId];
    if (!relation) return [];

    const allOrders = VILLAGER_EXCLUSIVE_ORDERS[villagerId] || [];
    return relation.unlockedExclusiveOrderIds
      .map(id => allOrders.find(o => o.id === id))
      .filter((o): o is ExclusiveOrderTemplate => {
        if (!o) return false;
        if (o.oneTimeOnly && relation.completedExclusiveOrderIds.includes(o.id)) return false;
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }

  generateExclusiveOrder(villagerId: string, templateId: string): {
    id: string;
    villagerId: string;
    tier: OrderTier;
    items: { itemId: string; quantity: number; minQuality?: QualityGrade }[];
    reward: { coins: number; reputation: number; rareSeedId?: string; rareSeedQuantity?: number };
    createdAt: number;
    deadline: number;
    status: 'active';
    name: string;
    description: string;
    isExclusive: true;
    templateId: string;
  } | null {
    const available = this.getAvailableExclusiveOrdersForVillager(villagerId);
    const template = available.find(o => o.id === templateId);
    if (!template) return null;

    const now = Date.now();
    const tier: OrderTier = template.unlockStage >= 4 ? 'legendary' : template.unlockStage >= 3 ? 'epic' : template.unlockStage >= 2 ? 'rare' : 'common';

    return {
      id: `exclusive_${templateId}_${now}_${Math.random().toString(36).substr(2, 9)}`,
      villagerId: template.villagerId,
      tier,
      items: template.items.map(i => ({ ...i })),
      reward: { ...template.reward },
      createdAt: now,
      deadline: now + template.deadlineDays * DAY_DURATION,
      status: 'active',
      name: template.name,
      description: template.description,
      isExclusive: true,
      templateId
    };
  }

  getVillagerInfo(villagerId: string) {
    const relation = this.getVillagerRelation(villagerId);
    const detail = getVillagerDetail(villagerId);
    const villager = VILLAGERS.find(v => v.id === villagerId);
    const stage = relation?.stage ?? 0;
    const progress = this.getStageProgress(villagerId);
    const exclusiveOrders = this.getAvailableExclusiveOrdersForVillager(villagerId);
    const currentDialogue = this.getCurrentDialogue(villagerId);

    return {
      villager,
      detail,
      relation,
      stage,
      stageName: STAGE_NAMES[stage as AffinityStage],
      stageColor: STAGE_COLORS[stage as AffinityStage],
      progress,
      exclusiveOrders,
      currentDialogue,
      canInteract: this.canInteract(villagerId),
      affinity: relation?.affinity ?? 0
    };
  }

  getAllVillagersInfo() {
    return getAllVillagerIds().map(id => this.getVillagerInfo(id));
  }

  getTotalAffinity(): number {
    return this.state.totalAffinity;
  }

  getHighestStage(): AffinityStage {
    return this.state.highestStage;
  }

  getStorylinesCompleted(): number {
    return this.state.storylinesCompleted;
  }

  getExclusiveOrdersCompleted(): number {
    return this.state.exclusiveOrdersCompleted;
  }

  getVillagersAtOrAboveStage(stage: AffinityStage): number {
    return Object.values(this.state.relations).filter(r => r.stage >= stage).length;
  }

  getMaxAffinityVillagers(): number {
    return Object.values(this.state.relations).filter(r => r.stage === 5).length;
  }

  resetVillagerDialogue(villagerId: string): boolean {
    const relation = this.state.relations[villagerId];
    if (!relation) return false;

    const startNode = getStartDialogueForStage(villagerId, relation.stage);
    if (startNode) {
      relation.currentDialogueId = startNode.id;
      return true;
    }
    return false;
  }
}

export interface VillagerInteractionResult {
  success: boolean;
  message?: string;
  affinityDelta?: number;
  newStage?: AffinityStage;
  unlockedOrder?: string;
  reward?: StorylineReward;
}
