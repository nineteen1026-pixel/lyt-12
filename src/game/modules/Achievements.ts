import type { Achievement, AchievementProgress, GameStats, AchievementCondition, AchievementReward } from '../types/game';
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
      default:
        current = 0;
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
