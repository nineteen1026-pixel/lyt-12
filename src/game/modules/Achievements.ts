import type { Achievement, AchievementProgress, GameStats, AchievementCondition, AchievementReward, WeatherType } from '../types/game';
import { ACHIEVEMENTS, getAchievementById } from '../data/achievements';

export interface AchievementUnlockResult {
  achievement: Achievement;
  reward: AchievementReward;
}

export class AchievementSystem {
  private progress: Record<string, AchievementProgress> = {};
  private unlockedCount: number = 0;
  private listeners: Array<(result: AchievementUnlockResult) => void> = [];

  constructor(savedProgress?: Record<string, AchievementProgress>) {
    this.initializeProgress(savedProgress);
  }

  private initializeProgress(savedProgress?: Record<string, AchievementProgress>) {
    this.progress = {};
    this.unlockedCount = 0;

    for (const achievement of ACHIEVEMENTS) {
      if (savedProgress && savedProgress[achievement.id]) {
        const saved = savedProgress[achievement.id];
        this.progress[achievement.id] = { ...saved };
        if (saved.unlocked) {
          this.unlockedCount++;
        }
      } else {
        this.progress[achievement.id] = {
          achievementId: achievement.id,
          unlocked: false,
          progress: 0
        };
      }
    }
  }

  subscribe(callback: (result: AchievementUnlockResult) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(result: AchievementUnlockResult) {
    for (const listener of this.listeners) {
      listener(result);
    }
  }

  getProgress(achievementId: string): AchievementProgress | undefined {
    return this.progress[achievementId];
  }

  getAllProgress(): Record<string, AchievementProgress> {
    return { ...this.progress };
  }

  getUnlockedCount(): number {
    return this.unlockedCount;
  }

  getTotalCount(): number {
    return ACHIEVEMENTS.length;
  }

  getUnlockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => this.progress[a.id]?.unlocked);
  }

  isUnlocked(achievementId: string): boolean {
    return this.progress[achievementId]?.unlocked ?? false;
  }

  checkAchievements(stats: GameStats, codexCompletion?: number): AchievementUnlockResult[] {
    const newlyUnlocked: AchievementUnlockResult[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (this.progress[achievement.id]?.unlocked) {
        continue;
      }

      const progress = this.calculateProgress(achievement, stats, codexCompletion);
      this.progress[achievement.id].progress = progress;

      if (progress >= 100) {
        this.unlockAchievement(achievement, newlyUnlocked);
      }
    }

    return newlyUnlocked;
  }

  private unlockAchievement(achievement: Achievement, results: AchievementUnlockResult[]) {
    if (this.progress[achievement.id]?.unlocked) {
      return;
    }

    this.progress[achievement.id] = {
      ...this.progress[achievement.id],
      unlocked: true,
      unlockedAt: Date.now(),
      progress: 100
    };

    this.unlockedCount++;

    const result: AchievementUnlockResult = {
      achievement,
      reward: achievement.reward
    };

    results.push(result);
    this.notify(result);
  }

  private calculateProgress(achievement: Achievement, stats: GameStats, codexCompletion?: number): number {
    const conditionProgresses = achievement.conditions.map(condition => 
      this.getConditionProgress(condition, stats, codexCompletion)
    );

    if (achievement.conditionLogic === 'all') {
      const minProgress = Math.min(...conditionProgresses);
      return minProgress;
    } else {
      const maxProgress = Math.max(...conditionProgresses);
      return maxProgress;
    }
  }

  private getConditionProgress(condition: AchievementCondition, stats: GameStats, codexCompletion?: number): number {
    const { type, target, itemId, tier, season } = condition;
    let current = 0;

    switch (type) {
      case 'totalCropsHarvested':
        current = stats.totalCropsHarvested;
        break;
      case 'cropsHarvested':
        current = itemId ? (stats.cropsHarvested[itemId] || 0) : 0;
        break;
      case 'totalSeedsPlanted':
        current = stats.totalSeedsPlanted;
        break;
      case 'seedsPlanted':
        current = itemId ? (stats.seedsPlanted[itemId] || 0) : 0;
        break;
      case 'totalProductsCollected':
        current = stats.totalProductsCollected;
        break;
      case 'productsCollected':
        current = itemId ? (stats.productsCollected[itemId] || 0) : 0;
        break;
      case 'totalAnimalsOwned':
        current = stats.totalAnimalsOwned;
        break;
      case 'animalsOwned':
        current = itemId ? (stats.animalsOwned[itemId] || 0) : 0;
        break;
      case 'totalBuildingsBuilt':
        current = stats.totalBuildingsBuilt;
        break;
      case 'buildingsBuilt':
        current = itemId ? (stats.buildingsBuilt[itemId] || 0) : 0;
        break;
      case 'totalOrdersCompleted':
        current = stats.totalOrdersCompleted;
        break;
      case 'ordersCompletedByTier':
        current = tier ? (stats.ordersCompletedByTier[tier] || 0) : 0;
        break;
      case 'totalCoinsEarned':
        current = stats.totalCoinsEarned;
        break;
      case 'totalCoinsSpent':
        current = stats.totalCoinsSpent;
        break;
      case 'totalItemsSold':
        current = stats.totalItemsSold;
        break;
      case 'totalItemsBought':
        current = stats.totalItemsBought;
        break;
      case 'totalDaysPlayed':
        current = stats.totalDaysPlayed;
        break;
      case 'seasonsExperienced':
        current = season ? (stats.seasonsExperienced[season] || 0) : 0;
        break;
      case 'totalPlayTime':
        current = stats.totalPlayTime;
        break;
      case 'plotsUnlocked':
        current = stats.plotsUnlocked;
        break;
      case 'highestReputationLevel':
        current = stats.highestReputationLevel;
        break;
      case 'rareSeedsFound':
        current = stats.rareSeedsFound;
        break;
      case 'legendaryOrdersCompleted':
        current = stats.legendaryOrdersCompleted;
        break;
      case 'perfectDays':
        current = stats.perfectDays;
        break;
      case 'stormsSurvived':
        current = stats.stormsSurvived;
        break;
      case 'itemsDiscovered':
        current = itemId ? (stats.itemsDiscovered[itemId] || 0) : 0;
        break;
      case 'totalFishCaught':
        current = stats.totalFishCaught;
        break;
      case 'fishCaught':
        current = itemId ? (stats.fishCaught[itemId] || 0) : 0;
        break;
      case 'artifactsFound':
        current = stats.artifactsFound;
        break;
      case 'artifactsDiscovered':
        current = itemId ? (stats.artifactsDiscovered[itemId] || 0) : 0;
        break;
      case 'codexCompletion':
        current = codexCompletion || 0;
        break;
      case 'mineExplorations':
        current = stats.mineExplorations || 0;
        break;
      case 'totalMineralsMined':
        current = stats.totalMineralsMined || 0;
        break;
      case 'mineralsMined':
        current = itemId ? (stats.mineralsMined?.[itemId] || 0) : 0;
        break;
      case 'mineHighestFloorReached':
        current = stats.mineHighestFloorReached || 0;
        break;
      case 'minesCleared':
        current = stats.minesCleared || 0;
        break;
      case 'totalMineExplored':
        current = stats.totalMineExplored || 0;
        break;
      case 'totalOresMined':
        current = itemId ? (stats.totalOresMined?.[itemId] || 0) : 0;
        break;
      case 'weatherWarningsReceived':
        current = stats.weatherWarningsReceived || 0;
        break;
      case 'weatherWarningsActed':
        current = stats.weatherWarningsActed || 0;
        break;
      case 'disastersByType':
        current = itemId ? (stats.disastersByType?.[itemId as WeatherType] || 0) : 0;
        break;
      case 'severeDisastersSurvived':
        current = stats.severeDisastersSurvived || 0;
        break;
      case 'droughtsSurvived':
        current = stats.droughtsSurvived || 0;
        break;
      case 'heatwavesSurvived':
        current = stats.heatwavesSurvived || 0;
        break;
      case 'severeStormsSurvived':
        current = stats.severeStormsSurvived || 0;
        break;
      case 'severeFrostsSurvived':
        current = stats.severeFrostsSurvived || 0;
        break;
      case 'cropsSavedByGreenhouse':
        current = stats.cropsSavedByGreenhouse || 0;
        break;
      case 'cropsSavedBySprinkler':
        current = stats.cropsSavedBySprinkler || 0;
        break;
      case 'cropsSavedByLightningRod':
        current = stats.cropsSavedByLightningRod || 0;
        break;
      case 'cropsSavedByHeater':
        current = stats.cropsSavedByHeater || 0;
        break;
      case 'cropsSavedByDrainage':
        current = stats.cropsSavedByDrainage || 0;
        break;
      case 'totalCropsSavedByBuildings':
        current = stats.totalCropsSavedByBuildings || 0;
        break;
      case 'perfectDisasterDefense':
        current = stats.perfectDisasterDefense || 0;
        break;
      case 'cropsLostToStorms':
        current = stats.cropsLostToStorms || 0;
        break;
      case 'cropsLostToFrost':
        current = stats.cropsLostToFrost || 0;
        break;
      case 'cropsLostToDrought':
        current = stats.cropsLostToDrought || 0;
        break;
      case 'cropsLostToHeatwave':
        current = stats.cropsLostToHeatwave || 0;
        break;
      case 'totalCropsLostToDisasters':
        current = stats.totalCropsLostToDisasters || 0;
        break;
      case 'totalAffinityGained':
        current = stats.totalAffinityGained || 0;
        break;
      case 'villagersWithMaxAffinity':
        current = stats.villagersWithMaxAffinity || 0;
        break;
      case 'storyDialoguesCompleted':
        current = stats.storyDialoguesCompleted || 0;
        break;
      case 'exclusiveOrdersCompleted':
        current = stats.exclusiveOrdersCompleted || 0;
        break;
      case 'giftsGivenToVillagers':
        current = stats.giftsGivenToVillagers || 0;
        break;
      case 'villagerStorylinesCompleted':
        current = stats.villagerStorylinesCompleted || 0;
        break;
      default:
        if (type.startsWith('villagersAtStage.stage_')) {
          const stageStr = type.replace('villagersAtStage.stage_', '');
          const stage = parseInt(stageStr, 10) as 0 | 1 | 2 | 3 | 4 | 5;
          current = stats.villagersAtStage?.[stage] || 0;
        } else if (type.startsWith('ordersCompletedForVillagers.')) {
          const vid = type.replace('ordersCompletedForVillagers.', '');
          current = stats.ordersCompletedForVillagers?.[vid] || 0;
        } else {
          current = 0;
        }
    }

    if (target <= 0) return 0;
    return Math.min(100, (current / target) * 100);
  }

  getAchievementProgress(achievementId: string, stats: GameStats, codexCompletion?: number): number {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return 0;
    
    if (this.progress[achievementId]?.unlocked) {
      return 100;
    }

    return this.calculateProgress(achievement, stats, codexCompletion);
  }

  getVisibleAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => !a.hidden && !a.secret);
  }

  getHiddenAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => a.hidden || a.secret);
  }
}
