import type { InventoryItem } from '../types/game';
import { getItem } from '../data/items';

export class Inventory {
  private items: Map<string, number>;

  constructor(inventoryItems: InventoryItem[]) {
    this.items = new Map();
    for (const item of inventoryItems) {
      if (item.quantity > 0) {
        this.items.set(item.itemId, item.quantity);
      }
    }
  }

  getItems(): Map<string, number> {
    return new Map(this.items);
  }

  getInventoryItems(): InventoryItem[] {
    const items: InventoryItem[] = [];
    this.items.forEach((quantity, itemId) => {
      if (quantity > 0) {
        items.push({ itemId, quantity });
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

    const current = this.items.get(itemId) || 0;
    this.items.set(itemId, current + quantity);
    return true;
  }

  removeItem(itemId: string, quantity: number): boolean {
    if (quantity <= 0) {
      return false;
    }

    const current = this.items.get(itemId) || 0;
    if (current < quantity) {
      return false;
    }

    const newQuantity = current - quantity;
    if (newQuantity <= 0) {
      this.items.delete(itemId);
    } else {
      this.items.set(itemId, newQuantity);
    }

    return true;
  }

  hasItem(itemId: string, quantity: number = 1): boolean {
    const current = this.items.get(itemId) || 0;
    return current >= quantity;
  }

  getItemCount(itemId: string): number {
    return this.items.get(itemId) || 0;
  }

  getSeeds(): Array<{ itemId: string; quantity: number; cropType: string }> {
    const seeds: Array<{ itemId: string; quantity: number; cropType: string }> = [];
    
    this.items.forEach((quantity, itemId) => {
      if (itemId.endsWith('_seed') && quantity > 0) {
        const cropType = itemId.replace('_seed', '');
        seeds.push({ itemId, quantity, cropType });
      }
    });

    return seeds;
  }

  getProducts(): Array<{ itemId: string; quantity: number }> {
    const products: Array<{ itemId: string; quantity: number }> = [];
    
    this.items.forEach((quantity, itemId) => {
      if (itemId.endsWith('_product') || itemId === 'egg' || itemId === 'milk') {
        if (quantity > 0) {
          products.push({ itemId, quantity });
        }
      }
    });

    return products;
  }

  getSellableItems(): Array<{ itemId: string; quantity: number; sellPrice: number }> {
    const sellable: Array<{ itemId: string; quantity: number; sellPrice: number }> = [];

    this.items.forEach((quantity, itemId) => {
      const item = getItem(itemId);
      if (item && quantity > 0 && item.sellPrice > 0) {
        sellable.push({
          itemId,
          quantity,
          sellPrice: item.sellPrice
        });
      }
    });

    return sellable;
  }

  getTotalValue(): number {
    let total = 0;
    this.items.forEach((quantity, itemId) => {
      const item = getItem(itemId);
      if (item) {
        total += item.sellPrice * quantity;
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
