import type {
  FarmHireState,
  HireWorkerSlot,
  HireWorkerResult,
  DismissWorkerResult,
  WageSettleResult,
  WorkerHarvestShare,
  FarmWorkerTaskType,
  QualityGrade,
  Plot
} from '../types/game';
import {
  getMaxHireSlots,
  getAvailableTasksForStage,
  getDailyWage,
  getYieldShareRate,
  canHireVillager
} from '../data/farmWorkers';

export interface FarmHireMapAccess {
  tillPlot(x: number, y: number): boolean;
  getPlotGrid(): Plot[][];
}

export interface FarmHireCropAccess {
  waterPlot(x: number, y: number): boolean;
  harvest(x: number, y: number): { itemId: string; quantity: number; quality: QualityGrade } | null;
}

export interface FarmHireVillagerAccess {
  getStage(villagerId: string): number;
}

export interface FarmHireCoinAccess {
  getCoins(): number;
  spendCoins(amount: number): boolean;
}

export interface FarmHireInventoryAccess {
  addItem(itemId: string, quantity: number, quality?: QualityGrade): boolean;
}

export function createInitialFarmHireState(): FarmHireState {
  return {
    slots: [],
    totalWagesPaid: 0,
    totalYieldShared: 0,
    lastWageSettleDay: 0,
    maxSlots: 0
  };
}

export class FarmHire {
  private state: FarmHireState;
  private mapAccess: FarmHireMapAccess | null = null;
  private cropAccess: FarmHireCropAccess | null = null;
  private villagerAccess: FarmHireVillagerAccess | null = null;
  private coinAccess: FarmHireCoinAccess | null = null;
  private inventoryAccess: FarmHireInventoryAccess | null = null;

  constructor(savedState: FarmHireState | null) {
    this.state = savedState ?? createInitialFarmHireState();
    this.migrateOldSave();
  }

  private migrateOldSave(): void {
    if (this.state.maxSlots === undefined) {
      this.state.maxSlots = 0;
    }
    if (this.state.lastWageSettleDay === undefined) {
      this.state.lastWageSettleDay = 0;
    }
    if (this.state.totalWagesPaid === undefined) {
      this.state.totalWagesPaid = 0;
    }
    if (this.state.totalYieldShared === undefined) {
      this.state.totalYieldShared = 0;
    }
    if (!Array.isArray(this.state.slots)) {
      this.state.slots = [];
    }
  }

  setMapAccess(access: FarmHireMapAccess): void {
    this.mapAccess = access;
  }

  setCropAccess(access: FarmHireCropAccess): void {
    this.cropAccess = access;
  }

  setVillagerAccess(access: FarmHireVillagerAccess): void {
    this.villagerAccess = access;
  }

  setCoinAccess(access: FarmHireCoinAccess): void {
    this.coinAccess = access;
  }

  setInventoryAccess(access: FarmHireInventoryAccess): void {
    this.inventoryAccess = access;
  }

  getState(): FarmHireState {
    return { ...this.state, slots: this.state.slots.map(s => ({ ...s, tasks: s.tasks.map(t => ({ ...t })) })) };
  }

  getActiveSlots(): HireWorkerSlot[] {
    return this.state.slots.filter(s => s.active);
  }

  getMaxSlots(): number {
    return this.state.maxSlots;
  }

  getUsedSlots(): number {
    return this.state.slots.filter(s => s.active).length;
  }

  getAvailableSlots(): number {
    return this.state.maxSlots - this.getUsedSlots();
  }

  getTotalDailyWage(): number {
    return this.state.slots
      .filter(s => s.active)
      .reduce((sum, s) => sum + s.dailyWage, 0);
  }

  updateReputationLevel(level: number): void {
    this.state.maxSlots = getMaxHireSlots(level);
    while (this.getUsedSlots() > this.state.maxSlots) {
      const lastActive = [...this.state.slots].reverse().find(s => s.active);
      if (lastActive) {
        lastActive.active = false;
      } else {
        break;
      }
    }
  }

  hireWorker(villagerId: string): HireWorkerResult {
    if (!this.villagerAccess) {
      return { success: false, message: '系统未初始化' };
    }

    const stage = this.villagerAccess.getStage(villagerId);
    if (!canHireVillager(stage as any)) {
      return { success: false, message: '好感度不足，至少需要初识阶段' };
    }

    const existingSlot = this.state.slots.find(s => s.villagerId === villagerId && s.active);
    if (existingSlot) {
      return { success: false, message: '该村民已被雇佣' };
    }

    if (this.getAvailableSlots() <= 0) {
      return { success: false, message: '雇工名额已满，请提升声望等级解锁更多' };
    }

    const availableTasks = getAvailableTasksForStage(stage as any);
    if (availableTasks.length === 0) {
      return { success: false, message: '该村民尚无可执行的农活任务' };
    }

    const dailyWage = getDailyWage(stage as any);
    const yieldShareRate = getYieldShareRate(stage as any);

    const slot: HireWorkerSlot = {
      villagerId,
      tasks: availableTasks.map(t => ({ type: t, enabled: true })),
      hiredAt: Date.now(),
      dailyWage,
      yieldShareRate,
      active: true
    };

    const inactiveSlot = this.state.slots.find(s => s.villagerId === villagerId && !s.active);
    if (inactiveSlot) {
      Object.assign(inactiveSlot, slot);
    } else {
      this.state.slots.push(slot);
    }

    return {
      success: true,
      message: `雇佣成功！日薪${dailyWage}金币，产量分成${Math.round(yieldShareRate * 100)}%`,
      dailyWage,
      yieldShareRate
    };
  }

  dismissWorker(villagerId: string): DismissWorkerResult {
    const slot = this.state.slots.find(s => s.villagerId === villagerId && s.active);
    if (!slot) {
      return { success: false, message: '该村民未被雇佣' };
    }

    slot.active = false;
    return { success: true, message: '已解雇该雇工' };
  }

  toggleTask(villagerId: string, taskType: FarmWorkerTaskType): { success: boolean; enabled: boolean } {
    const slot = this.state.slots.find(s => s.villagerId === villagerId && s.active);
    if (!slot) {
      return { success: false, enabled: false };
    }

    const task = slot.tasks.find(t => t.type === taskType);
    if (!task) {
      return { success: false, enabled: false };
    }

    task.enabled = !task.enabled;
    return { success: true, enabled: task.enabled };
  }

  settleWages(currentDay: number): WageSettleResult {
    if (currentDay === this.state.lastWageSettleDay) {
      return { totalWage: 0, settledWorkers: [] };
    }

    const activeSlots = this.state.slots.filter(s => s.active);
    if (activeSlots.length === 0) {
      this.state.lastWageSettleDay = currentDay;
      return { totalWage: 0, settledWorkers: [] };
    }

    const totalWage = activeSlots.reduce((sum, s) => sum + s.dailyWage, 0);

    if (this.coinAccess) {
      if (!this.coinAccess.spendCoins(totalWage)) {
        for (const slot of activeSlots) {
          slot.active = false;
        }
        this.state.lastWageSettleDay = currentDay;
        return { totalWage: 0, settledWorkers: [] };
      }
    }

    this.state.totalWagesPaid += totalWage;
    this.state.lastWageSettleDay = currentDay;

    return {
      totalWage,
      settledWorkers: activeSlots.map(s => s.villagerId)
    };
  }

  executeWorkerTasks(): WorkerHarvestShare[] {
    const harvestShares: WorkerHarvestShare[] = [];

    if (!this.mapAccess || !this.cropAccess) {
      return harvestShares;
    }

    const activeSlots = this.state.slots.filter(s => s.active);
    if (activeSlots.length === 0) {
      return harvestShares;
    }

    const plots = this.mapAccess.getPlotGrid();

    for (const slot of activeSlots) {
      const tillEnabled = slot.tasks.find(t => t.type === 'till')?.enabled ?? false;
      const waterEnabled = slot.tasks.find(t => t.type === 'water')?.enabled ?? false;
      const harvestEnabled = slot.tasks.find(t => t.type === 'harvest')?.enabled ?? false;

      for (let y = 0; y < plots.length; y++) {
        for (let x = 0; x < plots[y].length; x++) {
          const plot = plots[y][x];
          if (!plot.unlocked || plot.buildingId) continue;

          if (harvestEnabled && plot.state === 'ready' && plot.crop) {
            const result = this.cropAccess.harvest(x, y);
            if (result) {
              const sharedQty = Math.max(1, Math.floor(result.quantity * slot.yieldShareRate));
              const keptQty = Math.max(1, result.quantity - sharedQty);

              this.state.totalYieldShared += sharedQty;

              harvestShares.push({
                villagerId: slot.villagerId,
                itemId: result.itemId,
                quantity: sharedQty,
                quality: result.quality
              });

              if (this.inventoryAccess && keptQty > 0) {
                this.inventoryAccess.addItem(result.itemId, keptQty, result.quality);
              }
            }
            continue;
          }

          if (waterEnabled && (plot.state === 'planted' || plot.state === 'tilled')) {
            this.cropAccess.waterPlot(x, y);
          } else if (tillEnabled && plot.state === 'empty') {
            this.mapAccess!.tillPlot(x, y);
          }
        }
      }
    }

    return harvestShares;
  }

  refreshWorkerStats(): void {
    if (!this.villagerAccess) return;

    for (const slot of this.state.slots) {
      if (!slot.active) continue;

      const stage = this.villagerAccess.getStage(slot.villagerId) as any;
      slot.dailyWage = getDailyWage(stage);
      slot.yieldShareRate = getYieldShareRate(stage);

      const availableTasks = getAvailableTasksForStage(stage);
      for (const taskType of availableTasks) {
        if (!slot.tasks.find(t => t.type === taskType)) {
          slot.tasks.push({ type: taskType, enabled: true });
        }
      }

      slot.tasks = slot.tasks.filter(t => availableTasks.includes(t.type));
    }
  }

  getTotalWagesPaid(): number {
    return this.state.totalWagesPaid;
  }

  getTotalYieldShared(): number {
    return this.state.totalYieldShared;
  }
}
