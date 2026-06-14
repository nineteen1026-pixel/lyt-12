import type { Item } from '../types/game';
import { getItem, getBuyableSeeds, getBuyableAnimals } from '../data/items';
import { getCropConfig } from '../data/crops';
import { getAnimalConfig } from '../data/animals';
import type { Inventory } from './Inventory';
import type { MapGrid } from './MapGrid';
import type { Livestock } from './Livestock';

export interface InventoryAccess {
  addItem(itemId: string, quantity: number): boolean;
  removeItem(itemId: string, quantity: number): boolean;
  hasItem(itemId: string, quantity: number): boolean;
  getSellableItems(): Array<{ itemId: string; quantity: number; sellPrice: number }>;
}

export interface MapGridAccess {
  getNextUnlockablePlot(): { x: number; y: number } | null;
  getUnlockPrice(x: number, y: number): number;
  unlockPlot(x: number, y: number): boolean;
}

export interface LivestockAccess {
  addAnimal(type: 'chicken' | 'cow'): boolean;
}

export class Shop {
  private inventory: InventoryAccess;
  private mapGrid: MapGridAccess;
  private livestock: LivestockAccess;
  private coins: number;

  constructor(inventory: InventoryAccess, mapGrid: MapGridAccess, livestock: LivestockAccess, coins: number) {
    this.inventory = inventory;
    this.mapGrid = mapGrid;
    this.livestock = livestock;
    this.coins = coins;
  }

  getCoins(): number {
    return this.coins;
  }

  setCoins(coins: number): void {
    this.coins = coins;
  }

  addCoins(amount: number): void {
    this.coins += amount;
  }

  spendCoins(amount: number): boolean {
    if (this.coins < amount) {
      return false;
    }
    this.coins -= amount;
    return true;
  }

  getBuyableItems(): Array<{ item: Item; stock: number; canAfford: boolean }> {
    const seeds = getBuyableSeeds();
    const animals = getBuyableAnimals();
    const allItems = [...seeds, ...animals];

    return allItems.map(item => ({
      item,
      stock: 999,
      canAfford: this.coins >= item.price
    }));
  }

  getSellableItems(): Array<{ item: Item; quantity: number; sellPrice: number }> {
    const sellable = this.inventory.getSellableItems();
    
    return sellable.map(({ itemId, quantity, sellPrice }) => {
      const item = getItem(itemId);
      return {
        item: item!,
        quantity,
        sellPrice
      };
    }).filter(s => s.item !== undefined);
  }

  buyItem(itemId: string, quantity: number = 1): { success: boolean; message?: string } {
    if (quantity <= 0) {
      return { success: false, message: '数量必须大于0' };
    }

    const item = getItem(itemId);
    if (!item) {
      return { success: false, message: '物品不存在' };
    }

    const totalCost = item.price * quantity;
    if (!this.spendCoins(totalCost)) {
      return { success: false, message: '金币不足' };
    }

    if (item.type === 'animal') {
      const animalType = itemId as 'chicken' | 'cow';
      for (let i = 0; i < quantity; i++) {
        if (!this.livestock.addAnimal(animalType)) {
          this.addCoins(totalCost);
          return { success: false, message: '购买动物失败' };
        }
      }
    } else {
      if (!this.inventory.addItem(itemId, quantity)) {
        this.addCoins(totalCost);
        return { success: false, message: '购买失败' };
      }
    }

    return { success: true };
  }

  sellItem(itemId: string, quantity: number = 1): { success: boolean; message?: string; earned?: number } {
    if (quantity <= 0) {
      return { success: false, message: '数量必须大于0' };
    }

    const item = getItem(itemId);
    if (!item) {
      return { success: false, message: '物品不存在' };
    }

    if (!this.inventory.hasItem(itemId, quantity)) {
      return { success: false, message: '库存不足' };
    }

    const totalEarned = item.sellPrice * quantity;
    if (!this.inventory.removeItem(itemId, quantity)) {
      return { success: false, message: '出售失败' };
    }

    this.addCoins(totalEarned);
    return { success: true, earned: totalEarned };
  }

  sellAllItems(): { success: boolean; totalEarned: number; sold: Array<{ itemId: string; quantity: number; earned: number }> } {
    const sellable = this.inventory.getSellableItems();
    const sold: Array<{ itemId: string; quantity: number; earned: number }> = [];
    let totalEarned = 0;

    for (const { itemId, quantity, sellPrice } of sellable) {
      if (this.inventory.removeItem(itemId, quantity)) {
        const earned = sellPrice * quantity;
        totalEarned += earned;
        sold.push({ itemId, quantity, earned });
      }
    }

    this.addCoins(totalEarned);
    return { success: sold.length > 0, totalEarned, sold };
  }

  getExpandPlotPrice(): number {
    const nextPlot = this.mapGrid.getNextUnlockablePlot();
    if (!nextPlot) {
      return -1;
    }
    return this.mapGrid.getUnlockPrice(nextPlot.x, nextPlot.y);
  }

  expandPlot(): { success: boolean; message?: string; x?: number; y?: number } {
    const nextPlot = this.mapGrid.getNextUnlockablePlot();
    if (!nextPlot) {
      return { success: false, message: '没有可解锁的地块' };
    }

    const price = this.mapGrid.getUnlockPrice(nextPlot.x, nextPlot.y);
    if (!this.spendCoins(price)) {
      return { success: false, message: '金币不足' };
    }

    if (!this.mapGrid.unlockPlot(nextPlot.x, nextPlot.y)) {
      this.addCoins(price);
      return { success: false, message: '解锁失败' };
    }

    return { success: true, x: nextPlot.x, y: nextPlot.y };
  }

  canBuyCrop(cropType: string): boolean {
    const config = getCropConfig(cropType);
    if (!config) return false;
    return this.coins >= config.seedPrice;
  }

  canBuyAnimal(type: 'chicken' | 'cow'): boolean {
    const config = getAnimalConfig(type);
    if (!config) return false;
    return this.coins >= config.price;
  }

  canExpandPlot(): boolean {
    const price = this.getExpandPlotPrice();
    return price > 0 && this.coins >= price;
  }
}
