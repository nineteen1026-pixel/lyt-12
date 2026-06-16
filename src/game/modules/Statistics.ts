import type { GameStats, Season, OrderTier, QualityGrade, WeatherType, BuildingType, PetType } from '../types/game';
import { EXPERIENCE_REWARDS } from '../types/game';
import type { SkillExperienceGain } from './SkillTree';

export interface SkillExperienceAccess {
  addExperience(amount: number, reason: string): SkillExperienceGain;
}

export const INITIAL_STATS: GameStats = {
  totalCropsHarvested: 0,
  cropsHarvested: {},
  totalSeedsPlanted: 0,
  seedsPlanted: {},
  totalProductsCollected: 0,
  productsCollected: {},
  totalAnimalsOwned: 0,
  animalsOwned: {},
  totalPetsAdopted: 0,
  petsAdopted: { cat: 0, dog: 0, rabbit: 0, bird: 0, fox: 0 },
  totalBuildingsBuilt: 0,
  buildingsBuilt: {},
  totalOrdersCompleted: 0,
  ordersCompletedByTier: {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  },
  totalCoinsEarned: 0,
  totalCoinsSpent: 0,
  totalItemsSold: 0,
  totalItemsBought: 0,
  totalDaysPlayed: 0,
  seasonsExperienced: {
    spring: 0,
    summer: 0,
    autumn: 0,
    winter: 0
  },
  totalPlayTime: 0,
  plotsUnlocked: 9,
  highestReputationLevel: 1,
  rareSeedsFound: 0,
  legendaryOrdersCompleted: 0,
  perfectDays: 0,
  stormsSurvived: 0,
  itemsDiscovered: {},
  totalFishCaught: 0,
  fishCaught: {},
  artifactsFound: 0,
  artifactsDiscovered: {},
  cropsByQuality: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  highestQualityHarvested: 1 as QualityGrade,
  totalQualityBonusCoins: 0,
  totalMineExplored: 0,
  minesCleared: 0,
  totalMineralsMined: 0,
  mineralsMined: {},
  mineHighestFloorReached: 0,
  totalOresMined: {},
  mineExplorations: 0,
  weatherWarningsReceived: 0,
  weatherWarningsActed: 0,
  disastersByType: {
    sunny: 0,
    rainy: 0,
    snowy: 0,
    stormy: 0,
    drought: 0,
    heatwave: 0
  },
  severeDisastersSurvived: 0,
  droughtsSurvived: 0,
  heatwavesSurvived: 0,
  severeStormsSurvived: 0,
  severeFrostsSurvived: 0,
  cropsSavedByGreenhouse: 0,
  cropsSavedBySprinkler: 0,
  cropsSavedByLightningRod: 0,
  cropsSavedByHeater: 0,
  cropsSavedByDrainage: 0,
  totalCropsSavedByBuildings: 0,
  perfectDisasterDefense: 0,
  cropsLostToStorms: 0,
  cropsLostToFrost: 0,
  cropsLostToDrought: 0,
  cropsLostToHeatwave: 0,
  totalCropsLostToDisasters: 0
};

export type StatEventType =
  | 'crop_harvested'
  | 'seed_planted'
  | 'product_collected'
  | 'animal_bought'
  | 'animal_sold'
  | 'pet_adopted'
  | 'building_built'
  | 'building_demolished'
  | 'order_completed'
  | 'coins_earned'
  | 'coins_spent'
  | 'items_sold'
  | 'items_bought'
  | 'day_advanced'
  | 'season_changed'
  | 'plots_unlocked'
  | 'reputation_level_up'
  | 'rare_seed_found'
  | 'storm_occurred'
  | 'perfect_day'
  | 'item_discovered'
  | 'fish_caught'
  | 'artifact_found'
  | 'play_time'
  | 'quality_harvest'
  | 'quality_bonus_coins'
  | 'mineral_mined'
  | 'mine_floor_reached'
  | 'mine_cleared'
  | 'mine_exploration'
  | 'weather_warning_received'
  | 'weather_warning_acted'
  | 'disaster_occurred'
  | 'severe_disaster_survived'
  | 'crops_saved_by_building'
  | 'crops_lost_to_disaster'
  | 'perfect_disaster_defense';

export interface StatEvent {
  type: StatEventType;
  data?: any;
  timestamp: number;
}

export class Statistics {
  private stats: GameStats;
  private listeners: Array<(stats: GameStats, event: StatEvent) => void> = [];
  private skillExperienceAccess: SkillExperienceAccess | null = null;

  constructor(initialStats?: Partial<GameStats>, skillExperienceAccess?: SkillExperienceAccess) {
    this.stats = {
      ...INITIAL_STATS,
      ...initialStats,
      cropsHarvested: { ...INITIAL_STATS.cropsHarvested, ...initialStats?.cropsHarvested },
      seedsPlanted: { ...INITIAL_STATS.seedsPlanted, ...initialStats?.seedsPlanted },
      productsCollected: { ...INITIAL_STATS.productsCollected, ...initialStats?.productsCollected },
      animalsOwned: { ...INITIAL_STATS.animalsOwned, ...initialStats?.animalsOwned },
      buildingsBuilt: { ...INITIAL_STATS.buildingsBuilt, ...initialStats?.buildingsBuilt },
      ordersCompletedByTier: { ...INITIAL_STATS.ordersCompletedByTier, ...initialStats?.ordersCompletedByTier },
      seasonsExperienced: { ...INITIAL_STATS.seasonsExperienced, ...initialStats?.seasonsExperienced },
      itemsDiscovered: { ...INITIAL_STATS.itemsDiscovered, ...initialStats?.itemsDiscovered },
      fishCaught: { ...INITIAL_STATS.fishCaught, ...initialStats?.fishCaught },
      artifactsDiscovered: { ...INITIAL_STATS.artifactsDiscovered, ...initialStats?.artifactsDiscovered },
      cropsByQuality: { ...INITIAL_STATS.cropsByQuality, ...initialStats?.cropsByQuality },
      mineralsMined: { ...INITIAL_STATS.mineralsMined, ...initialStats?.mineralsMined },
      totalOresMined: { ...INITIAL_STATS.totalOresMined, ...initialStats?.totalOresMined },
      disastersByType: { ...INITIAL_STATS.disastersByType, ...initialStats?.disastersByType },
      petsAdopted: { ...INITIAL_STATS.petsAdopted, ...initialStats?.petsAdopted }
    };
    this.skillExperienceAccess = skillExperienceAccess || null;
  }

  setSkillExperienceAccess(access: SkillExperienceAccess): void {
    this.skillExperienceAccess = access;
  }

  private addSkillExperience(eventType: string, quantity: number = 1): SkillExperienceGain | null {
    if (!this.skillExperienceAccess) return null;
    
    const expPerUnit = EXPERIENCE_REWARDS[eventType] || 0;
    if (expPerUnit > 0) {
      const totalExp = expPerUnit * quantity;
      return this.skillExperienceAccess.addExperience(totalExp, eventType);
    }
    return null;
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  subscribe(callback: (stats: GameStats, event: StatEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(event: StatEvent) {
    for (const listener of this.listeners) {
      listener(this.getStats(), event);
    }
  }

  private createEvent(type: StatEventType, data?: any): StatEvent {
    return {
      type,
      data,
      timestamp: Date.now()
    };
  }

  recordCropHarvested(cropId: string, quantity: number = 1): SkillExperienceGain | null {
    this.stats.totalCropsHarvested += quantity;
    this.stats.cropsHarvested[cropId] = (this.stats.cropsHarvested[cropId] || 0) + quantity;
    const expGain = this.addSkillExperience('crop_harvested', quantity);
    this.notify(this.createEvent('crop_harvested', { cropId, quantity, expGain }));
    return expGain;
  }

  recordSeedPlanted(cropId: string, quantity: number = 1): SkillExperienceGain | null {
    this.stats.totalSeedsPlanted += quantity;
    this.stats.seedsPlanted[cropId] = (this.stats.seedsPlanted[cropId] || 0) + quantity;
    const expGain = this.addSkillExperience('seed_planted', quantity);
    this.notify(this.createEvent('seed_planted', { cropId, quantity, expGain }));
    return expGain;
  }

  recordProductCollected(productId: string, quantity: number = 1): SkillExperienceGain | null {
    this.stats.totalProductsCollected += quantity;
    this.stats.productsCollected[productId] = (this.stats.productsCollected[productId] || 0) + quantity;
    this.recordItemDiscovered(productId, quantity);
    const expGain = this.addSkillExperience('product_collected', quantity);
    this.notify(this.createEvent('product_collected', { productId, quantity, expGain }));
    return expGain;
  }

  recordAnimalBought(animalType: string, quantity: number = 1): SkillExperienceGain | null {
    this.stats.totalAnimalsOwned += quantity;
    this.stats.animalsOwned[animalType] = (this.stats.animalsOwned[animalType] || 0) + quantity;
    const expGain = this.addSkillExperience('animal_bought', quantity);
    this.notify(this.createEvent('animal_bought', { animalType, quantity, expGain }));
    return expGain;
  }

  recordAnimalSold(animalType: string, quantity: number = 1) {
    this.stats.totalAnimalsOwned = Math.max(0, this.stats.totalAnimalsOwned - quantity);
    this.stats.animalsOwned[animalType] = Math.max(0, (this.stats.animalsOwned[animalType] || 0) - quantity);
    this.notify(this.createEvent('animal_sold', { animalType, quantity }));
  }

  recordPetAdopted(petType: PetType, quantity: number = 1): SkillExperienceGain | null {
    this.stats.totalPetsAdopted += quantity;
    this.stats.petsAdopted[petType] = (this.stats.petsAdopted[petType] || 0) + quantity;
    const expGain = this.addSkillExperience('pet_adopted', quantity);
    this.notify(this.createEvent('pet_adopted', { petType, quantity, expGain }));
    return expGain;
  }

  recordBuildingBuilt(buildingType: string) {
    this.stats.totalBuildingsBuilt += 1;
    this.stats.buildingsBuilt[buildingType] = (this.stats.buildingsBuilt[buildingType] || 0) + 1;
    this.notify(this.createEvent('building_built', { buildingType }));
  }

  recordBuildingDemolished(buildingType: string) {
    this.stats.buildingsBuilt[buildingType] = Math.max(0, (this.stats.buildingsBuilt[buildingType] || 0) - 1);
    this.notify(this.createEvent('building_demolished', { buildingType }));
  }

  recordOrderCompleted(tier: OrderTier) {
    this.stats.totalOrdersCompleted += 1;
    this.stats.ordersCompletedByTier[tier] = (this.stats.ordersCompletedByTier[tier] || 0) + 1;
    if (tier === 'legendary') {
      this.stats.legendaryOrdersCompleted += 1;
    }
    this.notify(this.createEvent('order_completed', { tier }));
  }

  recordCoinsEarned(amount: number) {
    this.stats.totalCoinsEarned += amount;
    this.notify(this.createEvent('coins_earned', { amount }));
  }

  recordCoinsSpent(amount: number) {
    this.stats.totalCoinsSpent += amount;
    this.notify(this.createEvent('coins_spent', { amount }));
  }

  recordItemsSold(quantity: number) {
    this.stats.totalItemsSold += quantity;
    this.notify(this.createEvent('items_sold', { quantity }));
  }

  recordItemsBought(quantity: number) {
    this.stats.totalItemsBought += quantity;
    this.notify(this.createEvent('items_bought', { quantity }));
  }

  recordDayAdvanced() {
    this.stats.totalDaysPlayed += 1;
    this.notify(this.createEvent('day_advanced'));
  }

  recordSeasonChanged(season: Season) {
    this.stats.seasonsExperienced[season] = (this.stats.seasonsExperienced[season] || 0) + 1;
    this.notify(this.createEvent('season_changed', { season }));
  }

  recordPlotsUnlocked(count: number) {
    this.stats.plotsUnlocked = Math.max(this.stats.plotsUnlocked, count);
    this.notify(this.createEvent('plots_unlocked', { count }));
  }

  recordReputationLevelUp(level: number) {
    if (level > this.stats.highestReputationLevel) {
      this.stats.highestReputationLevel = level;
      this.notify(this.createEvent('reputation_level_up', { level }));
    }
  }

  recordRareSeedFound(quantity: number = 1) {
    this.stats.rareSeedsFound += quantity;
    this.notify(this.createEvent('rare_seed_found', { quantity }));
  }

  recordStormOccurred() {
    this.stats.stormsSurvived += 1;
    this.notify(this.createEvent('storm_occurred'));
  }

  recordPerfectDay() {
    this.stats.perfectDays += 1;
    this.notify(this.createEvent('perfect_day'));
  }

  recordItemDiscovered(itemId: string, quantity: number = 1) {
    this.stats.itemsDiscovered[itemId] = (this.stats.itemsDiscovered[itemId] || 0) + quantity;
    this.notify(this.createEvent('item_discovered', { itemId, quantity }));
  }

  recordFishCaught(fishId: string, quantity: number = 1) {
    this.stats.totalFishCaught += quantity;
    this.stats.fishCaught[fishId] = (this.stats.fishCaught[fishId] || 0) + quantity;
    this.notify(this.createEvent('fish_caught', { fishId, quantity }));
  }

  recordArtifactFound(artifactId: string) {
    this.stats.artifactsFound += 1;
    this.stats.artifactsDiscovered[artifactId] = (this.stats.artifactsDiscovered[artifactId] || 0) + 1;
    this.notify(this.createEvent('artifact_found', { artifactId }));
  }

  recordPlayTime(durationMs: number) {
    this.stats.totalPlayTime += durationMs;
    this.notify(this.createEvent('play_time', { durationMs }));
  }

  getStatValue(path: string): number {
    const parts = path.split('.');
    let value: any = this.stats;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return 0;
      }
    }
    
    return typeof value === 'number' ? value : 0;
  }

  recordQualityHarvest(quality: QualityGrade): SkillExperienceGain | null {
    this.stats.cropsByQuality[quality] = (this.stats.cropsByQuality[quality] || 0) + 1;
    if (quality > this.stats.highestQualityHarvested) {
      this.stats.highestQualityHarvested = quality;
    }
    const expGain = this.addSkillExperience(`quality_harvest_${quality}`, 1);
    this.notify(this.createEvent('quality_harvest', { quality, expGain }));
    return expGain;
  }

  recordQualityBonusCoins(amount: number) {
    this.stats.totalQualityBonusCoins += amount;
    this.notify(this.createEvent('quality_bonus_coins', { amount }));
  }

  recordMineralMined(mineralId: string, quantity: number = 1) {
    this.stats.totalMineralsMined += quantity;
    this.stats.mineralsMined[mineralId] = (this.stats.mineralsMined[mineralId] || 0) + quantity;
    this.stats.totalOresMined[mineralId] = (this.stats.totalOresMined[mineralId] || 0) + quantity;
    this.recordItemDiscovered(mineralId, quantity);
    this.notify(this.createEvent('mineral_mined', { mineralId, quantity }));
  }

  recordMineFloorReached(floor: number) {
    if (floor > this.stats.mineHighestFloorReached) {
      this.stats.mineHighestFloorReached = floor;
    }
    this.stats.totalMineExplored++;
    this.notify(this.createEvent('mine_floor_reached', { floor }));
  }

  recordMineCleared() {
    this.stats.minesCleared++;
    this.notify(this.createEvent('mine_cleared', {}));
  }

  recordMineExploration() {
    this.stats.mineExplorations++;
    this.notify(this.createEvent('mine_exploration', {}));
  }

  recordWeatherWarningReceived() {
    this.stats.weatherWarningsReceived += 1;
    this.notify(this.createEvent('weather_warning_received', {}));
  }

  recordWeatherWarningActed() {
    this.stats.weatherWarningsActed += 1;
    this.notify(this.createEvent('weather_warning_acted', {}));
  }

  recordDisasterOccurred(weather: WeatherType, isSevere: boolean) {
    this.stats.disastersByType[weather] = (this.stats.disastersByType[weather] || 0) + 1;
    this.notify(this.createEvent('disaster_occurred', { weather, isSevere }));

    if (isSevere) {
      this.stats.severeDisastersSurvived += 1;
      if (weather === 'stormy') this.stats.severeStormsSurvived += 1;
      if (weather === 'snowy') this.stats.severeFrostsSurvived += 1;
      if (weather === 'drought') this.stats.droughtsSurvived += 1;
      if (weather === 'heatwave') this.stats.heatwavesSurvived += 1;
      this.notify(this.createEvent('severe_disaster_survived', { weather }));
    } else {
      if (weather === 'drought') this.stats.droughtsSurvived += 1;
      if (weather === 'heatwave') this.stats.heatwavesSurvived += 1;
    }
  }

  recordCropsSavedByBuilding(building: BuildingType, count: number) {
    if (count <= 0) return;
    switch (building) {
      case 'greenhouse':
        this.stats.cropsSavedByGreenhouse += count;
        break;
      case 'sprinkler':
        this.stats.cropsSavedBySprinkler += count;
        break;
      case 'lightning_rod':
        this.stats.cropsSavedByLightningRod += count;
        break;
      case 'heater':
        this.stats.cropsSavedByHeater += count;
        break;
      case 'drainage':
        this.stats.cropsSavedByDrainage += count;
        break;
    }
    this.stats.totalCropsSavedByBuildings += count;
    this.notify(this.createEvent('crops_saved_by_building', { building, count }));
  }

  recordCropsLostToDisaster(weather: WeatherType, count: number) {
    if (count <= 0) return;
    switch (weather) {
      case 'stormy':
        this.stats.cropsLostToStorms += count;
        break;
      case 'snowy':
        this.stats.cropsLostToFrost += count;
        break;
      case 'drought':
        this.stats.cropsLostToDrought += count;
        break;
      case 'heatwave':
        this.stats.cropsLostToHeatwave += count;
        break;
    }
    this.stats.totalCropsLostToDisasters += count;
    this.notify(this.createEvent('crops_lost_to_disaster', { weather, count }));
  }

  recordPerfectDisasterDefense() {
    this.stats.perfectDisasterDefense += 1;
    this.notify(this.createEvent('perfect_disaster_defense', {}));
  }
}
