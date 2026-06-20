import type {
  AuctionState,
  AuctionItem,
  AuctionBidResult,
  AuctionSettleResult,
  AuctionStatus,
  QualityGrade,
  Rarity
} from '../types/game';
import {
  AUCTION_DURATION,
  AUCTION_ITEMS_PER_SESSION,
  AUCTION_WEEKEND_DAYS,
  AUCTION_MIN_BID_INCREMENT,
  AUCTION_ECONOMIC_BALANCE_BASE,
  AUCTION_ECONOMIC_BALANCE_MAX,
  AUCTION_ECONOMIC_BALANCE_MIN,
  AUCTION_REPUTATION_BONUS_BASE,
  AUCTION_REPUTATION_PENALTY_BASE
} from '../types/game';
import {
  getRandomAuctionItems,
  createInitialAuctionState,
  getAuctionRarityName
} from '../data/auction';

export interface CoinAccess {
  getCoins(): number;
  spendCoins(amount: number): boolean;
  addCoins(amount: number): void;
}

export interface InventoryAccess {
  addItem(itemId: string, quantity: number, quality?: QualityGrade): boolean;
}

export interface ReputationAccess {
  addReputation(amount: number): void;
  getReputationScore(): number;
}

export interface VillagerAccess {
  addAffinity(villagerId: string, amount: number): {
    stageAdvanced: boolean;
    newStage: number;
    stageCodexTriggers: string[];
    stageAchievementTriggers: string[];
  };
}

export class AuctionSystem {
  private state: AuctionState;
  private coinAccess: CoinAccess;
  private inventoryAccess: InventoryAccess;
  private reputationAccess: ReputationAccess;
  private villagerAccess: VillagerAccess | null;
  private playerBidOnCurrent: boolean = false;
  private currentBidderIsPlayer: boolean = false;

  constructor(
    savedState: AuctionState | null,
    coinAccess: CoinAccess,
    inventoryAccess: InventoryAccess,
    reputationAccess: ReputationAccess,
    villagerAccess: VillagerAccess | null = null
  ) {
    this.state = savedState || createInitialAuctionState();
    this.coinAccess = coinAccess;
    this.inventoryAccess = inventoryAccess;
    this.reputationAccess = reputationAccess;
    this.villagerAccess = villagerAccess;
  }

  getState(): AuctionState {
    return { ...this.state };
  }

  getStatus(): AuctionStatus {
    return this.state.status;
  }

  getCurrentItem(): AuctionItem | null {
    if (this.state.items.length === 0) return null;
    return { ...this.state.items[this.state.currentItemIndex] };
  }

  getItems(): AuctionItem[] {
    return this.state.items.map(item => ({ ...item }));
  }

  getCurrentItemIndex(): number {
    return this.state.currentItemIndex;
  }

  getTimeRemaining(): number {
    if (this.state.status !== 'active') return 0;
    const remaining = this.state.endTime - Date.now();
    return Math.max(0, remaining);
  }

  getEconomicBalanceFactor(): number {
    return this.state.economicBalanceFactor;
  }

  isWeekend(day: number): boolean {
    const dayOfWeek = ((day - 1) % 7) + 1;
    return AUCTION_WEEKEND_DAYS.includes(dayOfWeek);
  }

  canStartAuction(day: number): boolean {
    if (!this.isWeekend(day)) return false;
    if (this.state.lastAuctionDay === day) return false;
    if (this.state.status === 'active') return false;
    return true;
  }

  startAuction(day: number): { success: boolean; message: string; items?: AuctionItem[] } {
    if (!this.isWeekend(day)) {
      return { success: false, message: '只有周末才有拍卖会哦！' };
    }
    if (this.state.lastAuctionDay === day) {
      return { success: false, message: '今天的拍卖会已经结束了' };
    }
    if (this.state.status === 'active') {
      return { success: false, message: '拍卖会正在进行中' };
    }

    const items = getRandomAuctionItems(AUCTION_ITEMS_PER_SESSION, day);
    const adjustedItems = items.map(item => ({
      ...item,
      startingPrice: Math.floor(item.startingPrice * this.state.economicBalanceFactor),
      currentBid: Math.floor(item.startingPrice * this.state.economicBalanceFactor),
      minBidIncrement: Math.floor(item.minBidIncrement * this.state.economicBalanceFactor)
    }));

    const now = Date.now();
    const auctionId = `auction_${day}_${now}`;

    this.state.currentAuctionId = auctionId;
    this.state.status = 'active';
    this.state.items = adjustedItems;
    this.state.currentItemIndex = 0;
    this.state.startTime = now;
    this.state.endTime = now + AUCTION_DURATION;
    this.state.lastAuctionDay = day;
    this.state.totalAuctionsHeld++;
    this.playerBidOnCurrent = false;
    this.currentBidderIsPlayer = false;

    return { success: true, message: '拍卖会开始！', items: adjustedItems };
  }

  placeBid(bidAmount: number): AuctionBidResult {
    if (this.state.status !== 'active') {
      return { success: false, message: '拍卖会未开始或已结束' };
    }

    const currentItem = this.state.items[this.state.currentItemIndex];
    if (!currentItem) {
      return { success: false, message: '没有正在拍卖的物品' };
    }

    const minBid = currentItem.currentBid + currentItem.minBidIncrement;
    if (bidAmount < minBid) {
      return { success: false, message: `出价至少需要 ${minBid} 金币` };
    }

    if (!this.coinAccess.spendCoins(bidAmount)) {
      return { success: false, message: '金币不足' };
    }

    if (this.currentBidderIsPlayer && currentItem.currentBid > 0) {
      this.coinAccess.addCoins(currentItem.currentBid);
    }

    currentItem.currentBid = bidAmount;
    this.playerBidOnCurrent = true;
    this.currentBidderIsPlayer = true;

    return { success: true, message: '出价成功！', newBid: bidAmount };
  }

  placeQuickBid(): AuctionBidResult {
    const currentItem = this.getCurrentItem();
    if (!currentItem) {
      return { success: false, message: '没有正在拍卖的物品' };
    }
    const nextBid = currentItem.currentBid + currentItem.minBidIncrement;
    return this.placeBid(nextBid);
  }

  simulateNPCBid(): boolean {
    if (this.state.status !== 'active') return false;

    const currentItem = this.state.items[this.state.currentItemIndex];
    if (!currentItem) return false;

    const npcBidChance = this.getNPBidChance(currentItem);
    if (Math.random() > npcBidChance) return false;

    const increment = currentItem.minBidIncrement * (1 + Math.floor(Math.random() * 3));
    const npcBid = currentItem.currentBid + increment;

    if (this.currentBidderIsPlayer && currentItem.currentBid > 0) {
      this.coinAccess.addCoins(currentItem.currentBid);
    }

    currentItem.currentBid = npcBid;
    this.currentBidderIsPlayer = false;

    return true;
  }

  private getNPBidChance(item: AuctionItem): number {
    const baseChance: Record<Rarity, number> = {
      common: 0.3,
      uncommon: 0.5,
      rare: 0.7,
      epic: 0.6,
      legendary: 0.4
    };

    const timeRatio = this.getTimeRemaining() / AUCTION_DURATION;
    const timeBoost = (1 - timeRatio) * 0.3;

    let chance = baseChance[item.rarity] + timeBoost;
    chance = Math.min(0.9, chance);

    return chance;
  }

  settleCurrentItem(): AuctionSettleResult | null {
    if (this.state.items.length === 0) return null;

    const currentItem = this.state.items[this.state.currentItemIndex];
    if (!currentItem) return null;

    const won = this.currentBidderIsPlayer;
    const finalPrice = currentItem.currentBid;

    let rewards: AuctionSettleResult['rewards'] = {};
    let economicImpact = 0;
    let reputationImpact = 0;

    const priceFactor = Math.min(finalPrice / 1000, 2);

    if (won) {
      this.state.totalAuctionsWon++;
      this.state.totalCoinsSpent += finalPrice;

      if (currentItem.itemId && currentItem.itemQuantity) {
        this.inventoryAccess.addItem(
          currentItem.itemId,
          currentItem.itemQuantity,
          currentItem.itemQuality
        );
        rewards.items = [{
          itemId: currentItem.itemId,
          quantity: currentItem.itemQuantity,
          quality: currentItem.itemQuality
        }];
      }

      if (currentItem.bonusCoins) {
        const adjustedCoins = Math.floor(currentItem.bonusCoins * this.state.economicBalanceFactor);
        this.coinAccess.addCoins(adjustedCoins);
        rewards.coins = adjustedCoins;
      }

      const baseRepGain = (currentItem.bonusReputation || 0) + AUCTION_REPUTATION_BONUS_BASE;
      const priceBonusRep = Math.floor(baseRepGain * priceFactor * 0.5);
      const totalRepGain = baseRepGain + priceBonusRep;
      this.reputationAccess.addReputation(totalRepGain);
      rewards.reputation = totalRepGain;
      reputationImpact = totalRepGain;

      if (currentItem.bonusAffinity && this.villagerAccess) {
        const affinityResults: Array<{ villagerId: string; amount: number }> = [];
        for (const aff of currentItem.bonusAffinity) {
          this.villagerAccess.addAffinity(aff.villagerId, aff.amount);
          affinityResults.push({ villagerId: aff.villagerId, amount: aff.amount });
        }
        rewards.affinity = affinityResults;
      }

      this.state.wonItems.push({
        auctionId: this.state.currentAuctionId || '',
        itemId: currentItem.id,
        itemName: currentItem.name,
        finalPrice,
        wonAt: Date.now()
      });

      economicImpact = this.calculateEconomicImpact(finalPrice, true);
      this.updateEconomicBalance(economicImpact);
    } else {
      economicImpact = this.calculateEconomicImpact(finalPrice, false);
      this.updateEconomicBalance(economicImpact);

      const baseRepLoss = AUCTION_REPUTATION_PENALTY_BASE;
      const priceBonusLoss = Math.floor(baseRepLoss * priceFactor * 0.3);
      const totalRepLoss = baseRepLoss + priceBonusLoss;
      this.reputationAccess.addReputation(-totalRepLoss);
      reputationImpact = -totalRepLoss;
    }

    return {
      item: { ...currentItem },
      won,
      finalPrice,
      rewards,
      economicImpact,
      reputationImpact
    };
  }

  nextItem(): boolean {
    if (this.state.currentItemIndex >= this.state.items.length - 1) {
      return false;
    }

    this.state.currentItemIndex++;
    this.state.endTime = Date.now() + AUCTION_DURATION;
    this.playerBidOnCurrent = false;
    this.currentBidderIsPlayer = false;

    return true;
  }

  endAuction(): void {
    this.state.status = 'ended';
    this.state.currentAuctionId = null;
  }

  private calculateEconomicImpact(price: number, won: boolean): number {
    const baseImpact = price / 1000;
    return won ? -baseImpact * 0.1 : baseImpact * 0.05;
  }

  private updateEconomicBalance(impact: number): void {
    this.state.economicBalanceFactor = Math.max(
      AUCTION_ECONOMIC_BALANCE_MIN,
      Math.min(
        AUCTION_ECONOMIC_BALANCE_MAX,
        this.state.economicBalanceFactor + impact
      )
    );
  }

  rebalanceEconomy(day: number): void {
    const targetFactor = AUCTION_ECONOMIC_BALANCE_BASE;
    const currentFactor = this.state.economicBalanceFactor;
    const diff = targetFactor - currentFactor;
    const adjustment = diff * 0.1;

    this.state.economicBalanceFactor += adjustment;
    this.state.economicBalanceFactor = Math.max(
      AUCTION_ECONOMIC_BALANCE_MIN,
      Math.min(AUCTION_ECONOMIC_BALANCE_MAX, this.state.economicBalanceFactor)
    );
  }

  checkAndUpdateAuction(day: number): {
    started?: boolean;
    ended?: boolean;
    settledItems?: AuctionSettleResult[];
  } {
    const result: {
      started?: boolean;
      ended?: boolean;
      settledItems?: AuctionSettleResult[];
    } = {};

    if (this.state.status === 'active' && this.getTimeRemaining() <= 0) {
      const settled = this.settleCurrentItem();
      if (settled) {
        result.settledItems = [settled];
      }

      if (!this.nextItem()) {
        this.endAuction();
        result.ended = true;
      }
    }

    if (this.canStartAuction(day)) {
      this.startAuction(day);
      result.started = true;
    }

    return result;
  }

  getWonItems(): AuctionState['wonItems'] {
    return [...this.state.wonItems];
  }

  getTotalAuctionsHeld(): number {
    return this.state.totalAuctionsHeld;
  }

  getTotalAuctionsWon(): number {
    return this.state.totalAuctionsWon;
  }

  getTotalCoinsSpent(): number {
    return this.state.totalCoinsSpent;
  }

  hasPlayerBidOnCurrent(): boolean {
    return this.playerBidOnCurrent;
  }

  isPlayerWinning(): boolean {
    return this.currentBidderIsPlayer;
  }
}
