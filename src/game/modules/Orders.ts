import type { Order, OrderItem, OrderTier, OrderReward, ReputationState, Season, QualityGrade, ExclusiveOrderTemplate } from '../types/game';
import { DAY_DURATION } from '../types/game';
import {
  TIER_CONFIG,
  DAILY_ORDER_COUNT,
  FAILURE_PENALTY,
  getRandomVillager,
  getReputationLevel,
  getOrderItemsBySeason,
  pickWeightedTier,
  pickRareSeed
} from '../data/orders';
import { getItem } from '../data/items';
import { getCropConfig } from '../data/crops';

export interface InventoryAccess {
  hasItem(itemId: string, quantity: number, minQuality?: QualityGrade): boolean;
  removeItem(itemId: string, quantity: number, quality?: QualityGrade): boolean;
  addItem(itemId: string, quantity: number, quality?: QualityGrade): boolean;
  getItemCount(itemId: string, minQuality?: QualityGrade): number;
}

export interface ShopAccess {
  addCoins(amount: number): void;
  spendCoins(amount: number): boolean;
  getCoins(): number;
}

export class Orders {
  private orders: Map<string, Order>;
  private reputation: ReputationState;
  private inventory: InventoryAccess;
  private shop: ShopAccess;
  private currentSeason: Season;
  private currentDay: number;

  constructor(
    savedOrders: Order[],
    reputation: ReputationState,
    inventory: InventoryAccess,
    shop: ShopAccess,
    currentSeason: Season,
    currentDay: number
  ) {
    this.orders = new Map();
    for (const order of savedOrders) {
      this.orders.set(order.id, order);
    }
    this.reputation = { ...reputation };
    this.inventory = inventory;
    this.shop = shop;
    this.currentSeason = currentSeason;
    this.currentDay = currentDay;
    this.updateReputationLevel();
  }

  getOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  getActiveOrders(): Order[] {
    return Array.from(this.orders.values()).filter(o => o.status === 'active');
  }

  getCompletedOrders(): Order[] {
    return Array.from(this.orders.values()).filter(o => o.status === 'completed');
  }

  getFailedOrders(): Order[] {
    return Array.from(this.orders.values()).filter(o => o.status === 'failed');
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  getReputation(): ReputationState {
    return { ...this.reputation };
  }

  getReputationLevelInfo() {
    return getReputationLevel(this.reputation.score);
  }

  setCurrentSeason(season: Season): void {
    this.currentSeason = season;
  }

  setCurrentDay(day: number): void {
    this.currentDay = day;
  }

  shouldRefreshOrders(lastRefreshDay: number): boolean {
    return this.currentDay !== lastRefreshDay;
  }

  refreshOrders(): { newOrders: Order[]; failedOrders: Order[] } {
    const failedOrders: Order[] = [];
    
    for (const order of this.orders.values()) {
      if (order.status === 'active') {
        const isExpired = this.isOrderExpired(order);
        if (isExpired) {
          this.processFailure(order);
          failedOrders.push(order);
        }
      }
    }

    const activeCount = this.getActiveOrders().length;
    const newOrders: Order[] = [];
    
    for (let i = activeCount; i < DAILY_ORDER_COUNT; i++) {
      const order = this.generateOrder();
      this.orders.set(order.id, order);
      newOrders.push(order);
    }

    this.cleanupOldOrders();

    return { newOrders, failedOrders };
  }

  forceRefreshAll(): { newOrders: Order[]; failedOrders: Order[] } {
    const failedOrders: Order[] = [];
    
    for (const order of this.orders.values()) {
      if (order.status === 'active') {
        this.processFailure(order);
        failedOrders.push(order);
      }
    }

    this.orders.clear();
    const newOrders: Order[] = [];

    for (let i = 0; i < DAILY_ORDER_COUNT; i++) {
      const order = this.generateOrder();
      this.orders.set(order.id, order);
      newOrders.push(order);
    }

    return { newOrders, failedOrders };
  }

  private generateOrder(): Order {
    const villager = getRandomVillager();
    const tier = pickWeightedTier(this.reputation.level);
    const tierConfig = TIER_CONFIG[tier];

    const availableItems = getOrderItemsBySeason(this.currentSeason);
    const itemCount = tier === 'legendary' ? 3 : tier === 'epic' ? 2 : 1;
    const items: OrderItem[] = [];
    const usedItemIds = new Set<string>();

    for (let i = 0; i < itemCount && usedItemIds.size < availableItems.length; i++) {
      const available = availableItems.filter(it => !usedItemIds.has(it.itemId));
      const template = available[Math.floor(Math.random() * available.length)];
      usedItemIds.add(template.itemId);

      const quantityRange = template.maxQuantity - template.minQuantity;
      const baseQty = template.minQuantity + Math.floor(Math.random() * (quantityRange + 1));
      const tierMultiplier = tier === 'common' ? 1 : tier === 'rare' ? 1.3 : tier === 'epic' ? 1.6 : 2;
      const quantity = Math.max(1, Math.floor(baseQty * tierMultiplier));

      const minQuality: QualityGrade | undefined = tier === 'epic' ? 2 : tier === 'legendary' ? 3 : undefined;

      items.push({ itemId: template.itemId, quantity, minQuality });
    }

    let totalBaseValue = 0;
    for (const item of items) {
      const itemData = getItem(item.itemId);
      totalBaseValue += (itemData?.sellPrice || 10) * item.quantity;
    }
    const coins = Math.floor(totalBaseValue * tierConfig.coinMultiplier);

    const deadlineDays = tierConfig.deadlineDays[0] + 
      Math.floor(Math.random() * (tierConfig.deadlineDays[1] - tierConfig.deadlineDays[0] + 1));
    const now = Date.now();
    const deadline = now + deadlineDays * DAY_DURATION;

    const reward: OrderReward = {
      coins,
      reputation: tierConfig.repReward
    };

    const rareSeed = pickRareSeed(tier, this.reputation.rareSeedDropBoost);
    if (rareSeed) {
      reward.rareSeedId = rareSeed.seedId;
      reward.rareSeedQuantity = rareSeed.quantity;
    }

    return {
      id: `order_${now}_${Math.random().toString(36).substr(2, 9)}`,
      villagerId: villager.id,
      tier,
      items,
      reward,
      createdAt: now,
      deadline,
      status: 'active'
    };
  }

  isOrderExpired(order: Order): boolean {
    return Date.now() > order.deadline;
  }

  getRemainingTime(order: Order): number {
    return Math.max(0, order.deadline - Date.now());
  }

  getRemainingDays(order: Order): number {
    return Math.ceil(this.getRemainingTime(order) / DAY_DURATION);
  }

  canSubmitOrder(order: Order): { canSubmit: boolean; missingItems: OrderItem[] } {
    if (order.status !== 'active') {
      return { canSubmit: false, missingItems: [] };
    }

    const missingItems: OrderItem[] = [];
    for (const item of order.items) {
      const minQ = item.minQuality;
      const currentQty = this.inventory.getItemCount(item.itemId, minQ);
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

  submitOrder(orderId: string): {
    success: boolean;
    message?: string;
    coins?: number;
    reputation?: number;
    rareSeedId?: string;
    rareSeedQuantity?: number;
  } {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, message: '订单不存在' };
    }

    if (order.status !== 'active') {
      return { success: false, message: '订单已完成或失败' };
    }

    if (this.isOrderExpired(order)) {
      this.processFailure(order);
      return { success: false, message: '订单已超时，信誉扣除！' };
    }

    const { canSubmit, missingItems } = this.canSubmitOrder(order);
    if (!canSubmit) {
      const missingNames = missingItems.map(m => {
        const item = getItem(m.itemId);
        return `${item?.name || m.itemId} x${m.quantity}`;
      }).join('，');
      return { success: false, message: `物品不足：${missingNames}` };
    }

    for (const item of order.items) {
      if (!this.inventory.removeItem(item.itemId, item.quantity, item.minQuality)) {
        return { success: false, message: '扣除物品失败' };
      }
    }

    this.shop.addCoins(order.reward.coins);
    this.addReputation(order.reward.reputation);
    order.status = 'completed';
    this.reputation.completedOrders++;

    let rareSeedId: string | undefined;
    let rareSeedQuantity: number | undefined;

    if (order.reward.rareSeedId && order.reward.rareSeedQuantity) {
      if (this.inventory.addItem(order.reward.rareSeedId, order.reward.rareSeedQuantity)) {
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

  checkAndProcessExpiredOrders(): Order[] {
    const newlyFailed: Order[] = [];
    for (const order of this.orders.values()) {
      if (order.status === 'active' && this.isOrderExpired(order)) {
        this.processFailure(order);
        newlyFailed.push(order);
      }
    }
    return newlyFailed;
  }

  private processFailure(order: Order): void {
    order.status = 'failed';
    this.reputation.failedOrders++;
    this.loseReputation(FAILURE_PENALTY.reputationLoss);

    const penaltyCoins = Math.floor(order.reward.coins * FAILURE_PENALTY.coinPenaltyPercent);
    if (this.shop.getCoins() >= penaltyCoins) {
      this.shop.spendCoins(penaltyCoins);
    } else {
      this.shop.spendCoins(this.shop.getCoins());
    }
  }

  addReputation(amount: number): void {
    this.reputation.score += amount;
    this.updateReputationLevel();
  }

  loseReputation(amount: number): void {
    this.reputation.score = Math.max(0, this.reputation.score - amount);
    this.updateReputationLevel();
  }

  private updateReputationLevel(): void {
    const levelInfo = getReputationLevel(this.reputation.score);
    this.reputation.level = levelInfo.level;
    this.reputation.rareSeedDropBoost = levelInfo.seedBoost;
  }

  private cleanupOldOrders(): void {
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const [id, order] of this.orders.entries()) {
      if ((order.status === 'completed' || order.status === 'failed') && 
          order.createdAt < cutoffTime) {
        this.orders.delete(id);
      }
    }
  }

  getOrderEstimatedValue(order: Order): number {
    let total = 0;
    for (const item of order.items) {
      const itemData = getItem(item.itemId);
      total += (itemData?.sellPrice || 0) * item.quantity;
    }
    return total;
  }

  getTierConfig(tier: OrderTier) {
    return TIER_CONFIG[tier];
  }

  getActiveOrderCount(): number {
    return this.getActiveOrders().length;
  }

  getCompletedCount(): number {
    return this.reputation.completedOrders;
  }

  getFailedCount(): number {
    return this.reputation.failedOrders;
  }

  generateExclusiveOrder(template: ExclusiveOrderTemplate): Order {
    const now = Date.now();
    const deadline = now + template.deadlineDays * DAY_DURATION;
    return {
      id: `exclusive_${template.id}_${now}_${Math.random().toString(36).substr(2, 9)}`,
      villagerId: template.villagerId,
      tier: 'epic',
      items: template.items.map(item => ({ ...item })),
      reward: { ...template.reward },
      createdAt: now,
      deadline,
      status: 'active',
      isExclusive: true,
      exclusiveTemplateId: template.id,
      exclusiveName: template.name,
      exclusiveDescription: template.description
    };
  }

  addExclusiveOrder(template: ExclusiveOrderTemplate): Order | null {
    if (this.hasExclusiveOrder(template.id)) {
      return null;
    }
    const order = this.generateExclusiveOrder(template);
    this.orders.set(order.id, order);
    return order;
  }

  hasExclusiveOrder(templateId: string): boolean {
    for (const order of this.orders.values()) {
      if (order.exclusiveTemplateId === templateId && order.status === 'active') {
        return true;
      }
    }
    return false;
  }

  getExclusiveOrders(): Order[] {
    return Array.from(this.orders.values()).filter(o => o.isExclusive);
  }

  getActiveExclusiveOrders(): Order[] {
    return this.getExclusiveOrders().filter(o => o.status === 'active');
  }

  isExclusiveOrderCompleted(templateId: string): boolean {
    for (const order of this.orders.values()) {
      if (order.exclusiveTemplateId === templateId && order.status === 'completed') {
        return true;
      }
    }
    return false;
  }

  submitExclusiveOrder(orderId: string): {
    success: boolean;
    message?: string;
    coins?: number;
    reputation?: number;
    rareSeedId?: string;
    rareSeedQuantity?: number;
    templateId?: string;
  } {
    const result = this.submitOrder(orderId);
    if (result.success) {
      const order = this.orders.get(orderId);
      return {
        ...result,
        templateId: order?.exclusiveTemplateId
      };
    }
    return result;
  }
}
