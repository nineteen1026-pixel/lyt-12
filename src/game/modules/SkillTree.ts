import type { SkillTreeState, SkillEffectBonus, LevelUpResult, SkillNode } from '../types/game';
import { EXPERIENCE_PER_LEVEL, EXPERIENCE_GROWTH_MULTIPLIER, SKILL_POINTS_PER_LEVEL } from '../types/game';
import { SKILL_NODES, getSkillNode } from '../data/skillTree';

export interface SkillExperienceGain {
  amount: number;
  reason: string;
}

export const INITIAL_SKILL_TREE_STATE: SkillTreeState = {
  id: 'main',
  level: 1,
  experience: 0,
  totalExperience: 0,
  skillPoints: 0,
  unlockedNodes: {}
};

export class SkillTree {
  private state: SkillTreeState;
  private listeners: Array<(state: SkillTreeState, bonus: SkillEffectBonus) => void> = [];

  constructor(initialState?: Partial<SkillTreeState>) {
    this.state = {
      ...INITIAL_SKILL_TREE_STATE,
      ...initialState,
      unlockedNodes: { ...INITIAL_SKILL_TREE_STATE.unlockedNodes, ...initialState?.unlockedNodes }
    };
  }

  getState(): SkillTreeState {
    return { ...this.state };
  }

  getLevel(): number {
    return this.state.level;
  }

  getExperience(): number {
    return this.state.experience;
  }

  getTotalExperience(): number {
    return this.state.totalExperience;
  }

  getSkillPoints(): number {
    return this.state.skillPoints;
  }

  getExperienceForCurrentLevel(): number {
    return this.calculateExperienceForLevel(this.state.level);
  }

  getExperienceForNextLevel(): number {
    return this.calculateExperienceForLevel(this.state.level + 1);
  }

  getExperienceProgress(): number {
    const currentLevelExp = this.getExperienceForCurrentLevel();
    const nextLevelExp = this.getExperienceForNextLevel();
    const progress = this.state.experience - currentLevelExp;
    const required = nextLevelExp - currentLevelExp;
    return required > 0 ? Math.min(1, progress / required) : 1;
  }

  private calculateExperienceForLevel(level: number): number {
    if (level <= 1) return 0;
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += Math.floor(EXPERIENCE_PER_LEVEL * Math.pow(EXPERIENCE_GROWTH_MULTIPLIER, i - 1));
    }
    return total;
  }

  addExperience(amount: number, reason: string = ''): SkillExperienceGain {
    const actualGain = Math.max(0, amount);
    this.state.experience += actualGain;
    this.state.totalExperience += actualGain;

    const levelUpResults = this.checkLevelUp();

    this.notify();

    return {
      amount: actualGain,
      reason
    };
  }

  private checkLevelUp(): LevelUpResult[] {
    const results: LevelUpResult[] = [];

    while (this.state.experience >= this.getExperienceForNextLevel()) {
      this.state.level++;
      const pointsGained = SKILL_POINTS_PER_LEVEL;
      this.state.skillPoints += pointsGained;

      const unlockedSkills = SKILL_NODES
        .filter(n => n.unlockAtLevel === this.state.level)
        .map(n => n.id);

      results.push({
        newLevel: this.state.level,
        skillPointsGained: pointsGained,
        unlockedSkills
      });
    }

    return results;
  }

  canUnlockNode(nodeId: string): { canUnlock: boolean; reason: string } {
    const node = getSkillNode(nodeId);
    if (!node) {
      return { canUnlock: false, reason: '技能不存在' };
    }

    const currentLevel = this.state.unlockedNodes[nodeId] || 0;
    if (currentLevel >= node.maxLevel) {
      return { canUnlock: false, reason: '技能已满级' };
    }

    if (this.state.level < node.unlockAtLevel) {
      return { canUnlock: false, reason: `需要等级 ${node.unlockAtLevel}` };
    }

    for (const reqId of node.requires) {
      const reqLevel = this.state.unlockedNodes[reqId] || 0;
      const reqNode = getSkillNode(reqId);
      if (!reqNode || reqLevel < reqNode.maxLevel) {
        return { canUnlock: false, reason: `需要先解锁 ${reqNode?.name || reqId}` };
      }
    }

    if (this.state.skillPoints < 1) {
      return { canUnlock: false, reason: '天赋点不足' };
    }

    return { canUnlock: true, reason: '' };
  }

  unlockNode(nodeId: string): { success: boolean; message: string; node?: SkillNode } {
    const check = this.canUnlockNode(nodeId);
    if (!check.canUnlock) {
      return { success: false, message: check.reason };
    }

    const node = getSkillNode(nodeId);
    if (!node) {
      return { success: false, message: '技能不存在' };
    }

    this.state.skillPoints -= 1;
    this.state.unlockedNodes[nodeId] = (this.state.unlockedNodes[nodeId] || 0) + 1;

    this.notify();

    return {
      success: true,
      message: `成功解锁 ${node.name} Lv.${this.state.unlockedNodes[nodeId]}！`,
      node
    };
  }

  getNodeLevel(nodeId: string): number {
    return this.state.unlockedNodes[nodeId] || 0;
  }

  isNodeMaxed(nodeId: string): boolean {
    const node = getSkillNode(nodeId);
    if (!node) return false;
    return this.getNodeLevel(nodeId) >= node.maxLevel;
  }

  getAvailableNodes(): SkillNode[] {
    return SKILL_NODES.filter(node => {
      if (this.state.level < node.unlockAtLevel) return false;
      if (this.isNodeMaxed(node.id)) return false;
      return node.requires.every(reqId => this.isNodeMaxed(reqId));
    });
  }

  getSkillBonus(): SkillEffectBonus {
    return this.getEffectBonus();
  }

  getEffectBonus(): SkillEffectBonus {
    const bonus: SkillEffectBonus = {
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

    for (const [nodeId, level] of Object.entries(this.state.unlockedNodes)) {
      if (level <= 0) continue;

      const node = getSkillNode(nodeId);
      if (!node) continue;

      for (const effect of node.effects) {
        const value = effect.perLevel ? effect.value * level : effect.value;

        switch (effect.type) {
          case 'crop_growth_speed':
            bonus.cropGrowthSpeed += value;
            break;
          case 'crop_yield':
            bonus.cropYield += value;
            break;
          case 'crop_quality':
            bonus.cropQuality += value;
            break;
          case 'animal_production_speed':
            bonus.animalProductionSpeed += value;
            break;
          case 'animal_yield':
            bonus.animalYield += value;
            break;
          case 'animal_quality':
            bonus.animalQuality += value;
            break;
          case 'water_bonus':
            bonus.waterBonus += value;
            break;
          case 'feed_bonus':
            bonus.feedBonus += value;
            break;
          case 'greenhouse_boost':
            bonus.greenhouseBoost += value;
            break;
          case 'rare_chance':
            bonus.rareChance += value;
            break;
        }
      }
    }

    return bonus;
  }

  getTotalNodesUnlocked(): number {
    return Object.values(this.state.unlockedNodes).reduce((sum, level) => sum + (level > 0 ? 1 : 0), 0);
  }

  getTotalSkillLevels(): number {
    return Object.values(this.state.unlockedNodes).reduce((sum, level) => sum + level, 0);
  }

  subscribe(callback: (state: SkillTreeState, bonus: SkillEffectBonus) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(): void {
    const bonus = this.getEffectBonus();
    for (const listener of this.listeners) {
      listener(this.getState(), bonus);
    }
  }
}
