import type { Animal } from '../types/game';
import { getAnimalConfig } from '../data/animals';

export class Livestock {
  private animals: Animal[];

  constructor(animals: Animal[]) {
    this.animals = animals;
  }

  getAnimals(): Animal[] {
    return this.animals;
  }

  addAnimal(type: 'chicken' | 'cow'): boolean {
    const config = getAnimalConfig(type);
    if (!config) {
      return false;
    }

    const now = Date.now();
    const animal: Animal = {
      id: `${type}_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      lastProduceTime: now,
      hasProduct: false
    };

    this.animals.push(animal);
    return true;
  }

  removeAnimal(animalId: string): boolean {
    const index = this.animals.findIndex(a => a.id === animalId);
    if (index === -1) {
      return false;
    }
    this.animals.splice(index, 1);
    return true;
  }

  getAnimal(animalId: string): Animal | undefined {
    return this.animals.find(a => a.id === animalId);
  }

  collectProduct(animalId: string): { itemId: string; quantity: number } | null {
    const animal = this.getAnimal(animalId);
    if (!animal || !animal.hasProduct) {
      return null;
    }

    const config = getAnimalConfig(animal.type);
    if (!config) {
      return null;
    }

    const result = {
      itemId: config.productId,
      quantity: config.productAmount
    };

    animal.hasProduct = false;
    animal.lastProduceTime = Date.now();

    return result;
  }

  checkProduction(animal: Animal, currentTime: number): boolean {
    const config = getAnimalConfig(animal.type);
    if (!config || animal.hasProduct) {
      return false;
    }

    const elapsed = currentTime - animal.lastProduceTime;
    if (elapsed >= config.produceTime) {
      animal.hasProduct = true;
      return true;
    }

    return false;
  }

  updateAllProduction(currentTime: number): Animal[] {
    const newlyProduced: Animal[] = [];

    for (const animal of this.animals) {
      if (this.checkProduction(animal, currentTime)) {
        newlyProduced.push(animal);
      }
    }

    return newlyProduced;
  }

  processOfflineProduction(offlineMs: number, currentTime: number): Animal[] {
    const newlyProduced: Animal[] = [];

    for (const animal of this.animals) {
      if (animal.hasProduct) {
        continue;
      }

      const config = getAnimalConfig(animal.type);
      if (!config) {
        continue;
      }

      const elapsed = currentTime - animal.lastProduceTime;
      const produceCount = Math.floor(elapsed / config.produceTime);

      if (produceCount > 0) {
        animal.hasProduct = true;
        newlyProduced.push(animal);
      }
    }

    return newlyProduced;
  }

  getAnimalPrice(type: 'chicken' | 'cow'): number {
    const config = getAnimalConfig(type);
    return config?.price || 0;
  }

  getProductProgress(animal: Animal, currentTime: number): number {
    if (animal.hasProduct) {
      return 1;
    }

    const config = getAnimalConfig(animal.type);
    if (!config) {
      return 0;
    }

    const elapsed = currentTime - animal.lastProduceTime;
    return Math.min(1, elapsed / config.produceTime);
  }

  getAnimalsByType(type: 'chicken' | 'cow'): Animal[] {
    return this.animals.filter(a => a.type === type);
  }

  getAnimalCount(): { chickens: number; cows: number } {
    return {
      chickens: this.animals.filter(a => a.type === 'chicken').length,
      cows: this.animals.filter(a => a.type === 'cow').length
    };
  }
}
