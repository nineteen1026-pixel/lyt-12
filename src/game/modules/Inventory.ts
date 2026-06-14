import type { InventoryItem } from '../types/game';
import { DEFAULT_INVENTORY_CAPACITY, SPOILAGE_DURATION } from '../types/game';
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
  private items: Map<string, { quantity: number; addedAt: number }>;
  private buildings: InventoryBuildingsAccess | null = null;
  private baseCapacity: number = DEFAULT_INVENTORY_CAPACITY;

  constructor(inventoryItems: InventoryItem[], buildings: InventoryBuildingsAccess | null = null) {
    this.items = new Map();
    this.buildings = buildings;
    const now = Date.now();
    for (const item of inventoryItems) {
      if (item.quantity > 0) {
        this.items.set(item.itemId, {
          quantity: item.quantity,
          addedAt: item.addedAt ?? now
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
    this.items.forEach((entry, itemId) => {
      if (entry.quantity > 0) {
        result.set(itemId, entry.quantity);
      }
    });
    return result;
  }

  getInventoryItems(): InventoryItem[] {
    const items: InventoryItem[] = [];
    this.items.forEach((entry, itemId) => {
      if (entry.quantity > 0) {
        items.push({
          itemId,
          quantity: entry.quantity,
          addedAt: entry.addedAt
        });
      }
    });
    return items;
  }

  addItem(itemId: string, quantity: number): boolean {
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
    const current = this.items.get(itemId);
    if (current) {
      current.quantity += quantity;
      current.addedAt = now;
    } else {
      this.items.set(itemId, { quantity, addedAt: now });
    }
    return true;
  }

  removeItem(itemId: string, quantity: number): boolean {
    if (quantity <= 0) {
      return false;
    }

    const current = this.items.get(itemId);
    if (!current || current.quantity < quantity) {
      return false;
    }

    const newQuantity = current.quantity - quantity;
    if (newQuantity <= 0) {
      this.items.delete(itemId);
    } else {
      current.quantity = newQuantity;
    }

    return true;
  }

  hasItem(itemId: string, quantity: number = 1): boolean {
    const current = this.items.get(itemId);
    return current !== undefined && current.quantity >= quantity;
  }

  getItemCount(itemId: string): number {
    return this.items.get(itemId)?.quantity ?? 0;
  }

  processSpoilage(currentTime: number): SpoiledItem[] {
    const spoiled: SpoiledItem[] = [];
    const preventSpoilage = this.buildings?.preventSpoilage() ?? false;

    if (preventSpoilage) {
      return spoiled;
    }

    const toDelete: string[] = [];

    this.items.forEach((entry, itemId) => {
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
        toDelete.push(itemId);
      }
    });

    for (const itemId of toDelete) {
      this.items.delete(itemId);
    }

    return spoiled;
  }

  getSeeds(): Array<{ itemId: string; quantity: number; cropType: string }> {
    const seeds: Array<{ itemId: string; quantity: number; cropType: string }> = [];
    
    this.items.forEach((entry, itemId) => {
      if (itemId.endsWith('_seed') && entry.quantity > 0) {
        const cropType = itemId.replace('_seed', '');
        seeds.push({ itemId, quantity: entry.quantity, cropType });
      }
    });

    return seeds;
  }

  getProducts(): Array<{ itemId: string; quantity: number }> {
    const products: Array<{ itemId: string; quantity: number }> = [];
    
    this.items.forEach((entry, itemId) => {
      if (itemId.endsWith('_product') || itemId === 'egg' || itemId === 'milk') {
        if (entry.quantity > 0) {
          products.push({ itemId, quantity: entry.quantity });
        }
      }
    });

    return products;
  }

  getSellableItems(): Array<{ itemId: string; quantity: number; sellPrice: number }> {
    const sellable: Array<{ itemId: string; quantity: number; sellPrice: number }> = [];

    this.items.forEach((entry, itemId) => {
      const item = getItem(itemId);
      if (item && entry.quantity > 0 && item.sellPrice > 0) {
        sellable.push({
          itemId,
          quantity: entry.quantity,
          sellPrice: item.sellPrice
        });
      }
    });

    return sellable;
  }

  getTotalValue(): number {
    let total = 0;
    this.items.forEach((entry, itemId) => {
      const item = getItem(itemId);
      if (item) {
        total += item.sellPrice * entry.quantity;
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
