import type { Pet, PetType, PetCompanionBonus, SkillEffectBonus } from '../types/game';
import { getPetConfig } from '../data/pets';

export interface PetCompanionSkillAccess {
  getSkillBonus(): SkillEffectBonus;
}

export const HAPPINESS_DECAY_INTERVAL = 60000;
export const PET_COOLDOWN = 30000;
export const HAPPINESS_PER_PET = 10;
export const HAPPINESS_PER_FEED = 15;
export const MAX_HAPPINESS = 100;

export class PetCompanion {
  private pets: Pet[];
  private skillAccess: PetCompanionSkillAccess | null = null;
  private lastDecayCheck: number;

  constructor(pets: Pet[], skillAccess: PetCompanionSkillAccess | null = null) {
    this.pets = pets.map(p => ({
      ...p,
      feedCount: p.feedCount ?? 0,
      happiness: p.happiness ?? 50
    }));
    this.skillAccess = skillAccess;
    this.lastDecayCheck = Date.now();
  }

  setSkillAccess(skillAccess: PetCompanionSkillAccess): void {
    this.skillAccess = skillAccess;
  }

  getPets(): Pet[] {
    return this.pets;
  }

  getActivePet(): Pet | undefined {
    return this.pets.find(p => p.isActive);
  }

  getPet(petId: string): Pet | undefined {
    return this.pets.find(p => p.id === petId);
  }

  adoptPet(type: PetType): Pet | null {
    const config = getPetConfig(type);
    if (!config) {
      return null;
    }

    const now = Date.now();
    const pet: Pet = {
      id: `${type}_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: config.name,
      adoptedAt: now,
      isActive: this.pets.filter(p => p.isActive).length === 0,
      happiness: 50,
      lastPetTime: now,
      feedCount: 0
    };

    this.pets.push(pet);
    return pet;
  }

  releasePet(petId: string): boolean {
    const index = this.pets.findIndex(p => p.id === petId);
    if (index === -1) {
      return false;
    }
    this.pets.splice(index, 1);
    return true;
  }

  setActivePet(petId: string): boolean {
    const pet = this.getPet(petId);
    if (!pet) {
      return false;
    }

    for (const p of this.pets) {
      p.isActive = false;
    }
    pet.isActive = true;
    return true;
  }

  deactivateAllPets(): void {
    for (const p of this.pets) {
      p.isActive = false;
    }
  }

  petAnimal(petId: string): { success: boolean; happinessGained: number; remainingCooldown: number } {
    const pet = this.getPet(petId);
    if (!pet) {
      return { success: false, happinessGained: 0, remainingCooldown: 0 };
    }

    const now = Date.now();
    const elapsed = now - pet.lastPetTime;

    if (elapsed < PET_COOLDOWN) {
      return {
        success: false,
        happinessGained: 0,
        remainingCooldown: Math.ceil((PET_COOLDOWN - elapsed) / 1000)
      };
    }

    const skillBonus = this.skillAccess?.getSkillBonus();
    let happinessGain = HAPPINESS_PER_PET;
    if (skillBonus?.feedBonus) {
      happinessGain = Math.floor(happinessGain * (1 + skillBonus.feedBonus));
    }

    pet.happiness = Math.min(MAX_HAPPINESS, pet.happiness + happinessGain);
    pet.lastPetTime = now;

    return {
      success: true,
      happinessGained: happinessGain,
      remainingCooldown: 0
    };
  }

  feedPet(petId: string): boolean {
    const pet = this.getPet(petId);
    if (!pet) {
      return false;
    }

    pet.feedCount = (pet.feedCount || 0) + 1;

    const skillBonus = this.skillAccess?.getSkillBonus();
    let happinessGain = HAPPINESS_PER_FEED;
    if (skillBonus?.feedBonus) {
      happinessGain = Math.floor(happinessGain * (1 + skillBonus.feedBonus));
    }

    pet.happiness = Math.min(MAX_HAPPINESS, pet.happiness + happinessGain);
    return true;
  }

  getPetCooldown(petId: string): number {
    const pet = this.getPet(petId);
    if (!pet) return 0;

    const now = Date.now();
    const elapsed = now - pet.lastPetTime;
    if (elapsed >= PET_COOLDOWN) return 0;
    return Math.ceil((PET_COOLDOWN - elapsed) / 1000);
  }

  getActiveBonuses(): PetCompanionBonus {
    const activePet = this.getActivePet();
    const baseBonus: PetCompanionBonus = {
      cropGrowthSpeed: 0,
      cropYield: 0,
      cropQuality: 0,
      animalProductionSpeed: 0,
      animalYield: 0,
      animalQuality: 0,
      waterBonus: 0,
      feedBonus: 0,
      greenhouseBoost: 0,
      rareChance: 0
    };

    if (!activePet) {
      return baseBonus;
    }

    const config = getPetConfig(activePet.type);
    if (!config) {
      return baseBonus;
    }

    const happinessMultiplier = 1 + (activePet.happiness / MAX_HAPPINESS) * config.maxHappinessBonus;

    for (const bonus of config.bonuses) {
      const value = bonus.value * happinessMultiplier;
      switch (bonus.type) {
        case 'crop_growth_speed':
          baseBonus.cropGrowthSpeed += value;
          break;
        case 'crop_yield':
          baseBonus.cropYield += value;
          break;
        case 'crop_quality':
          baseBonus.cropQuality += value;
          break;
        case 'animal_production_speed':
          baseBonus.animalProductionSpeed += value;
          break;
        case 'animal_yield':
          baseBonus.animalYield += value;
          break;
        case 'animal_quality':
          baseBonus.animalQuality += value;
          break;
        case 'water_bonus':
          baseBonus.waterBonus += value;
          break;
        case 'feed_bonus':
          baseBonus.feedBonus += value;
          break;
        case 'rare_chance':
          baseBonus.rareChance += value;
          break;
      }
    }

    return baseBonus;
  }

  combineWithSkillBonus(skillBonus: SkillEffectBonus | null): PetCompanionBonus {
    const petBonus = this.getActiveBonuses();
    if (!skillBonus) {
      return petBonus;
    }

    return {
      cropGrowthSpeed: petBonus.cropGrowthSpeed + (skillBonus.cropGrowthSpeed || 0),
      cropYield: petBonus.cropYield + (skillBonus.cropYield || 0),
      cropQuality: petBonus.cropQuality + (skillBonus.cropQuality || 0),
      animalProductionSpeed: petBonus.animalProductionSpeed + (skillBonus.animalProductionSpeed || 0),
      animalYield: petBonus.animalYield + (skillBonus.animalYield || 0),
      animalQuality: petBonus.animalQuality + (skillBonus.animalQuality || 0),
      waterBonus: petBonus.waterBonus + (skillBonus.waterBonus || 0),
      feedBonus: petBonus.feedBonus + (skillBonus.feedBonus || 0),
      greenhouseBoost: petBonus.greenhouseBoost + (skillBonus.greenhouseBoost || 0),
      rareChance: petBonus.rareChance + (skillBonus.rareChance || 0)
    };
  }

  updateAll(currentTime: number): void {
    this.checkHappinessDecay(currentTime);
  }

  private checkHappinessDecay(currentTime: number): void {
    const elapsed = currentTime - this.lastDecayCheck;
    if (elapsed < HAPPINESS_DECAY_INTERVAL) {
      return;
    }

    const decayCycles = Math.floor(elapsed / HAPPINESS_DECAY_INTERVAL);
    this.lastDecayCheck += decayCycles * HAPPINESS_DECAY_INTERVAL;

    for (const pet of this.pets) {
      const config = getPetConfig(pet.type);
      if (config) {
        const decayAmount = config.happinessDecayRate * decayCycles;
        pet.happiness = Math.max(0, pet.happiness - decayAmount);
      }
    }
  }

  processOfflineTime(offlineMs: number, currentTime: number): void {
    this.checkHappinessDecay(currentTime);
  }

  getPetCount(): Record<PetType, number> {
    const counts: Record<string, number> = {
      cat: 0,
      dog: 0,
      rabbit: 0,
      bird: 0,
      fox: 0
    };

    for (const pet of this.pets) {
      counts[pet.type] = (counts[pet.type] || 0) + 1;
    }

    return counts as Record<PetType, number>;
  }

  getTotalPetCount(): number {
    return this.pets.length;
  }

  renamePet(petId: string, newName: string): boolean {
    const pet = this.getPet(petId);
    if (!pet) {
      return false;
    }
    pet.name = newName;
    return true;
  }
}
