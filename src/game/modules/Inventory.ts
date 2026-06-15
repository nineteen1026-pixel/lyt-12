import type { InventoryItem, QualityGrade } from '../types/game';
import { DEFAULT_INVENTORY_CAPACITY, SPOILAGE_DURATION, QUALITY_PRICE_MULTIPLIER } from '../types/game';
import { getItem } from '../data/items';

export interface InventoryBuildingsAccess {
  getBarnCapacityBonus(): number;
  preventSpoilage(): boolean;
}

export interface SpoiledItem {
  itemId: string;
  quantity: number;
}

export class Inventory {
  private items: Map<string, { quantity: number; addedAt: number; quality: QualityGrade }>;
  private buildings: InventoryBuildingsAccess | null = null;
  private baseCapacity: number = DEFAULT_INVENTORY_CAPACITY;

  private makeKey(itemId: string, quality?: QualityGrade): string {
    return quality ? `${itemId}_q${quality}` : itemId;
  }

  private parseKey(key: string): { itemId: string; quality: QualityGrade } {
    const match = key.match(/^(.+)_q([1-5])$/);
    if (match) {
      return { itemId: match[1], quality: parseInt(match[2]) as QualityGrade };
    }
    return { itemId: key, quality: 3 as QualityGrade };
  }

  constructor(inventoryItems: InventoryItem[], buildings: InventoryBuildingsAccess | null = null) {
    this.items = new Map();
    this.buildings = buildings;
    const now = Date.now();
    for (const item of inventoryItems) {
      if (item.quantity > 0) {
        const quality = item.quality || (3 as QualityGrade);
        const key = this.makeKey(item.itemId, quality);
        this.items.set(key, {
          quantity: item.quantity,
          addedAt: item.addedAt ?? now,
          quality
        });
      }
    }
  }

  setBuildings(buildings: InventoryBuildingsAccess): void {
    this.buildings = buildings;
  }

  getCapacity(): number {
    const bonus = this.buildings?.getBarnCapacityBonus() ?? 0;
    return this.baseCapacity + bonus;
  }

  getBaseCapacity(): number {
    return this.baseCapacity;
  }

  getTotalQuantity(): number {
    let total = 0;
    this.items.forEach(entry => {
      total += entry.quantity;
    });
    return total;
  }

  getAvailableSpace(): number {
    return this.getCapacity() - this.getTotalQuantity();
  }

  getItems(): Map<string, number> {
    const result = new Map<string, number>();
    this.items.forEach((entry, key) => {
      if (entry.quantity > 0) {
        const { itemId } = this.parseKey(key);
        result.set(itemId, (result.get(itemId) || 0) + entry.quantity);
      }
    });
    return result;
  }

  getInventoryItems(): InventoryItem[] {
    const items: InventoryItem[] = [];
    this.items.forEach((entry, key) => {
      if (entry.quantity > 0) {
        const { itemId, quality } = this.parseKey(key);
        items.push({
          itemId,
          quantity: entry.quantity,
          addedAt: entry.addedAt,
          quality
        });
      }
    });
    return items;
  }

  addItem(itemId: string, quantity: number, quality?: QualityGrade): boolean {
    if (quantity <= 0) {
      return false;
    }

    const item = getItem(itemId);
    if (!item) {
      return false;
    }

    const available = this.getAvailableSpace();
    if (quantity > available) {
      return false;
    }

    const now = Date.now();
    const q = quality || (3 as QualityGrade);
    const key = this.makeKey(itemId, q);
    const current = this.items.get(key);
    if (current) {
      current.quantity += quantity;
      current.addedAt = now;
    } else {
      this.items.set(key, { quantity, addedAt: now, quality: q });
    }
    return true;
  }

  removeItem(itemId: string, quantity: number, quality?: QualityGrade): boolean {
    if (quantity <= 0) {
      return false;
    }

    if (quality) {
      const matchingKeys: string[] = [];
      this.items.forEach((entry, key) => {
        const parsed = this.parseKey(key);
        if (parsed.itemId === itemId && entry.quality >= quality && entry.quantity > 0) {
          matchingKeys.push(key);
        }
      });

      const totalAvailable = matchingKeys.reduce((sum, key) => sum + this.items.get(key)!.quantity, 0);
      if (totalAvailable < quantity) {
        return false;
      }

      matchingKeys.sort((a, b) => {
        const aEntry = this.items.get(a)!;
        const bEntry = this.items.get(b)!;
        return aEntry.quality - bEntry.quality;
      });

      let remaining = quantity;
      for (const key of matchingKeys) {
        if (remaining <= 0) break;
        const entry = this.items.get(key)!;
        const toRemove = Math.min(entry.quantity, remaining);
        entry.quantity -= toRemove;
        remaining -= toRemove;
        if (entry.quantity <= 0) {
          this.items.delete(key);
        }
      }

      return remaining === 0;
    }

    const totalAvailable = this.getItemCount(itemId);
    if (totalAvailable < quantity) {
      return false;
    }

    let remaining = quantity;
    const keys: string[] = [];
    this.items.forEach((entry, key) => {
      const parsed = this.parseKey(key);
      if (parsed.itemId === itemId && entry.quantity > 0) {
        keys.push(key);
      }
    });

    keys.sort((a, b) => {
      const aEntry = this.items.get(a)!;
      const bEntry = this.items.get(b)!;
      return aEntry.quality - bEntry.quality;
    });

    for (const key of keys) {
      if (remaining <= 0) break;
      const entry = this.items.get(key)!;
      const toRemove = Math.min(entry.quantity, remaining);
      entry.quantity -= toRemove;
      remaining -= toRemove;
      if (entry.quantity <= 0) {
        this.items.delete(key);
      }
    }

    return remaining === 0;
  }

  hasItem(itemId: string, quantity: number = 1, minQuality?: QualityGrade): boolean {
    return this.getItemCount(itemId, minQuality) >= quantity;
  }

  getItemCount(itemId: string, minQuality?: QualityGrade): number {
    let total = 0;
    this.items.forEach((entry, key) => {
      const parsed = this.parseKey(key);
      if (parsed.itemId === itemId && entry.quantity > 0) {
        if (!minQuality || entry.quality >= minQuality) {
          total += entry.quantity;
        }
      }
    });
    return total;
  }

  processSpoilage(currentTime: number): SpoiledItem[] {
    const spoiled: SpoiledItem[] = [];
    const preventSpoilage = this.buildings?.preventSpoilage() ?? false;

    if (preventSpoilage) {
      return spoiled;
    }

    const toDelete: string[] = [];

    this.items.forEach((entry, key) => {
      const { itemId } = this.parseKey(key);
      const item = getItem(itemId);
      if (!item || item.type !== 'product') {
        return;
      }

      if (itemId === 'egg' || itemId === 'milk') {
        return;
      }

      const age = currentTime - entry.addedAt;
      if (age >= SPOILAGE_DURATION && entry.quantity > 0) {
        spoiled.push({
          itemId,
          quantity: entry.quantity
        });
        toDelete.push(key);
      }
    });

    for (const key of toDelete) {
      this.items.delete(key);
    }

    return spoiled;
  }

  getSeeds(): Array<{ itemId: string; quantity: number; cropType: string }> {
    const seeds: Array<{ itemId: string; quantity: number; cropType: string }> = [];
    
    this.items.forEach((entry, key) => {
      const { itemId } = this.parseKey(key);
      if (itemId.endsWith('_seed') && entry.quantity > 0) {
        const cropType = itemId.replace('_seed', '');
        seeds.push({ itemId, quantity: entry.quantity, cropType });
      }
    });

    return seeds;
  }

  getProducts(): Array<{ itemId: string; quantity: number; quality: QualityGrade }> {
    const products: Array<{ itemId: string; quantity: number; quality: QualityGrade }> = [];
    
    this.items.forEach((entry, key) => {
      const { itemId } = this.parseKey(key);
      if (itemId.endsWith('_product') || itemId === 'egg' || itemId === 'milk') {
        if (entry.quantity > 0) {
          products.push({ itemId, quantity: entry.quantity, quality: entry.quality });
        }
      }
    });

    return products;
  }

  getSellableItems(): Array<{ itemId: string; quantity: number; sellPrice: number; quality: QualityGrade }> {
    const sellable: Array<{ itemId: string; quantity: number; sellPrice: number; quality: QualityGrade }> = [];

    this.items.forEach((entry, key) => {
      const { itemId } = this.parseKey(key);
      const item = getItem(itemId);
      if (item && entry.quantity > 0 && item.sellPrice > 0) {
        sellable.push({
          itemId,
          quantity: entry.quantity,
          sellPrice: item.sellPrice,
          quality: entry.quality
        });
      }
    });

    return sellable;
  }

  getTotalValue(): number {
    let total = 0;
    this.items.forEach((entry, key) => {
      const { itemId } = this.parseKey(key);
      const item = getItem(itemId);
      if (item) {
        const multiplier = QUALITY_PRICE_MULTIPLIER[entry.quality];
        total += Math.floor(item.sellPrice * multiplier) * entry.quantity;
      }
    });
    return total;
  }

  clear(): void {
    this.items.clear();
  }

  getSize(): number {
    return this.items.size;
  }

  isEmpty(): boolean {
    return this.items.size === 0;
  }
}
