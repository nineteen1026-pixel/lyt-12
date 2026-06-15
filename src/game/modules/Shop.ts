import type { Item, BuildingType, BuildingConfig, QualityGrade } from '../types/game';
import { QUALITY_PRICE_MULTIPLIER } from '../types/game';
import { getItem, getBuyableSeeds, getBuyableAnimals } from '../data/items';
import { getCropConfig } from '../data/crops';
import { getAnimalConfig } from '../data/animals';
import { getBuildingConfig, getUnlockedBuildings } from '../data/buildings';
import type { Inventory } from './Inventory';
import type { MapGrid } from './MapGrid';
import type { Livestock } from './Livestock';
import type { Buildings } from './Buildings';

export interface InventoryAccess {
  addItem(itemId: string, quantity: number, quality?: QualityGrade): boolean;
  removeItem(itemId: string, quantity: number, quality?: QualityGrade): boolean;
  hasItem(itemId: string, quantity: number, minQuality?: QualityGrade): boolean;
  getSellableItems(): Array<{ itemId: string; quantity: number; sellPrice: number; quality: QualityGrade }>;
  getItemCount(itemId: string, minQuality?: QualityGrade): number;
}

export interface MapGridAccess {
  getNextUnlockablePlot(): { x: number; y: number } | null;
  getUnlockPrice(x: number, y: number): number;
  unlockPlot(x: number, y: number): boolean;
  getUnlockedCount(): number;
}

export interface LivestockAccess {
  addAnimal(type: 'chicken' | 'cow'): boolean;
}

export interface BuildingsAccess {
  canPlaceBuilding(type: BuildingType, x: number, y: number): { canPlace: boolean; reason?: string };
  placeBuilding(type: BuildingType, x: number, y: number): { id: string; type: BuildingType; x: number; y: number; builtAt: number } | null;
  removeBuilding(id: string): boolean;
  getBuildings(): Array<{ id: string; type: BuildingType; x: number; y: number; builtAt: number }>;
}

export class Shop {
  private inventory: InventoryAccess;
  private mapGrid: MapGridAccess;
  private livestock: LivestockAccess;
  private buildings: BuildingsAccess | null;
  private coins: number;

  constructor(
    inventory: InventoryAccess,
    mapGrid: MapGridAccess,
    livestock: LivestockAccess,
    coins: number,
    buildings: BuildingsAccess | null = null
  ) {
    this.inventory = inventory;
    this.mapGrid = mapGrid;
    this.livestock = livestock;
    this.coins = coins;
    this.buildings = buildings;
  }

  setBuildings(buildings: BuildingsAccess): void {
    this.buildings = buildings;
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

  getSellableItems(): Array<{ item: Item; quantity: number; sellPrice: number; quality: QualityGrade }> {
    const sellable = this.inventory.getSellableItems();
    
    return sellable.map(({ itemId, quantity, sellPrice, quality }) => {
      const item = getItem(itemId);
      const adjustedPrice = Math.max(1, Math.floor(sellPrice * QUALITY_PRICE_MULTIPLIER[quality]));
      return {
        item: item!,
        quantity,
        sellPrice: adjustedPrice,
        quality
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

  sellItem(itemId: string, quantity: number = 1, quality?: QualityGrade): { success: boolean; message?: string; earned?: number } {
    if (quantity <= 0) {
      return { success: false, message: '数量必须大于0' };
    }

    const item = getItem(itemId);
    if (!item) {
      return { success: false, message: '物品不存在' };
    }

    if (!this.inventory.hasItem(itemId, quantity, quality)) {
      return { success: false, message: '库存不足' };
    }

    const effectiveQuality = quality || (3 as QualityGrade);
    const adjustedSellPrice = Math.max(1, Math.floor(item.sellPrice * QUALITY_PRICE_MULTIPLIER[effectiveQuality]));
    const totalEarned = adjustedSellPrice * quantity;

    if (!this.inventory.removeItem(itemId, quantity, quality)) {
      return { success: false, message: '出售失败' };
    }

    this.addCoins(totalEarned);
    return { success: true, earned: totalEarned };
  }

  sellAllItems(): { success: boolean; totalEarned: number; sold: Array<{ itemId: string; quantity: number; earned: number; quality: QualityGrade }> } {
    const sellable = this.inventory.getSellableItems();
    const sold: Array<{ itemId: string; quantity: number; earned: number; quality: QualityGrade }> = [];
    let totalEarned = 0;

    for (const { itemId, quantity, sellPrice, quality } of sellable) {
      if (this.inventory.removeItem(itemId, quantity, quality)) {
        const adjustedPrice = Math.max(1, Math.floor(sellPrice * QUALITY_PRICE_MULTIPLIER[quality]));
        const earned = adjustedPrice * quantity;
        totalEarned += earned;
        sold.push({ itemId, quantity, earned, quality });
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

  getBuyableBuildings(): Array<{ building: BuildingConfig; unlocked: boolean; canAfford: boolean }> {
    const unlockedCount = this.mapGrid.getUnlockedCount();
    const unlockedBuildings = getUnlockedBuildings(unlockedCount);
    const allBuildings: BuildingConfig[] = [];
    
    for (const type of ['sprinkler', 'greenhouse', 'barn'] as BuildingType[]) {
      const config = getBuildingConfig(type);
      if (config) allBuildings.push(config);
    }

    return allBuildings.map(building => ({
      building,
      unlocked: unlockedBuildings.some(b => b.id === building.id),
      canAfford: this.coins >= building.price
    }));
  }

  canPlaceBuilding(type: BuildingType, x: number, y: number): { canPlace: boolean; reason?: string } {
    if (!this.buildings) {
      return { canPlace: false, reason: '建筑系统未初始化' };
    }

    const config = getBuildingConfig(type);
    if (!config) {
      return { canPlace: false, reason: '建筑类型不存在' };
    }

    const unlockedCount = this.mapGrid.getUnlockedCount();
    if (unlockedCount < config.unlockPlotCount) {
      return { canPlace: false, reason: `需要解锁${config.unlockPlotCount}块地块后才能建造` };
    }

    if (this.coins < config.price) {
      return { canPlace: false, reason: '金币不足' };
    }

    return this.buildings.canPlaceBuilding(type, x, y);
  }

  buyBuilding(type: BuildingType, x: number, y: number): { success: boolean; message?: string; buildingId?: string } {
    if (!this.buildings) {
      return { success: false, message: '建筑系统未初始化' };
    }

    const canPlace = this.canPlaceBuilding(type, x, y);
    if (!canPlace.canPlace) {
      return { success: false, message: canPlace.reason };
    }

    const config = getBuildingConfig(type);
    if (!config) {
      return { success: false, message: '建筑类型不存在' };
    }

    if (!this.spendCoins(config.price)) {
      return { success: false, message: '金币不足' };
    }

    const building = this.buildings.placeBuilding(type, x, y);
    if (!building) {
      this.addCoins(config.price);
      return { success: false, message: '建造失败' };
    }

    return { success: true, buildingId: building.id };
  }

  demolishBuilding(buildingId: string): { success: boolean; message?: string; refund?: number } {
    if (!this.buildings) {
      return { success: false, message: '建筑系统未初始化' };
    }

    const buildings = this.buildings.getBuildings();
    const building = buildings.find(b => b.id === buildingId);
    if (!building) {
      return { success: false, message: '建筑不存在' };
    }

    if (!this.buildings.removeBuilding(buildingId)) {
      return { success: false, message: '拆除失败' };
    }

    const config = getBuildingConfig(building.type);
    const refund = config ? Math.floor(config.price * 0.5) : 0;
    this.addCoins(refund);

    return { success: true, refund };
  }

  getBuildingPrice(type: BuildingType): number {
    const config = getBuildingConfig(type);
    return config?.price ?? -1;
  }

  canBuyBuilding(type: BuildingType, x: number, y: number): boolean {
    return this.canPlaceBuilding(type, x, y).canPlace;
  }
}
