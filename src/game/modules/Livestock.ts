import type { Animal, QualityGrade, SkillEffectBonus } from '../types/game';
import { getAnimalConfig } from '../data/animals';
import { rollQuality } from './Quality';

export interface LivestockSkillAccess {
  getSkillBonus(): SkillEffectBonus;
}

export class Livestock {
  private animals: Animal[];
  private skillAccess: LivestockSkillAccess | null = null;

  constructor(animals: Animal[], skillAccess: LivestockSkillAccess | null = null) {
    this.animals = animals.map(a => ({
      ...a,
      feedCount: a.feedCount ?? 0
    }));
    this.skillAccess = skillAccess;
  }

  setSkillAccess(skillAccess: LivestockSkillAccess): void {
    this.skillAccess = skillAccess;
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
      hasProduct: false,
      feedCount: 0
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

  feedAnimal(animalId: string): boolean {
    const animal = this.getAnimal(animalId);
    if (!animal) {
      return false;
    }
    animal.feedCount = (animal.feedCount || 0) + 1;
    return true;
  }

  collectProduct(animalId: string): { itemId: string; quantity: number; quality: QualityGrade } | null {
    const animal = this.getAnimal(animalId);
    if (!animal || !animal.hasProduct) {
      return null;
    }

    const config = getAnimalConfig(animal.type);
    if (!config) {
      return null;
    }

    const skillBonus = this.skillAccess?.getSkillBonus();
    const quality = rollQuality(animal.feedCount || 0, false, skillBonus, true);

    let quantity = config.productAmount;
    if (skillBonus?.animalYield) {
      if (Math.random() < skillBonus.animalYield) {
        quantity += 1;
      }
    }

    const result = {
      itemId: config.productId,
      quantity,
      quality
    };

    animal.hasProduct = false;
    animal.lastProduceTime = Date.now();
    animal.feedCount = 0;

    return result;
  }

  checkProduction(animal: Animal, currentTime: number): boolean {
    const config = getAnimalConfig(animal.type);
    if (!config || animal.hasProduct) {
      return false;
    }

    const skillBonus = this.skillAccess?.getSkillBonus();
    const speedBonus = skillBonus?.animalProductionSpeed || 0;
    const adjustedProduceTime = config.produceTime / (1 + speedBonus);

    const elapsed = currentTime - animal.lastProduceTime;
    if (elapsed >= adjustedProduceTime) {
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
    const skillBonus = this.skillAccess?.getSkillBonus();
    const speedBonus = skillBonus?.animalProductionSpeed || 0;

    for (const animal of this.animals) {
      if (animal.hasProduct) {
        continue;
      }

      const config = getAnimalConfig(animal.type);
      if (!config) {
        continue;
      }

      const adjustedProduceTime = config.produceTime / (1 + speedBonus);
      const elapsed = currentTime - animal.lastProduceTime;
      const produceCount = Math.floor(elapsed / adjustedProduceTime);

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

    const skillBonus = this.skillAccess?.getSkillBonus();
    const speedBonus = skillBonus?.animalProductionSpeed || 0;
    const adjustedProduceTime = config.produceTime / (1 + speedBonus);

    const elapsed = currentTime - animal.lastProduceTime;
    return Math.min(1, elapsed / adjustedProduceTime);
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
