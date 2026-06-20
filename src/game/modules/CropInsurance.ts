import type { InsuranceState, InsurancePlanType, WeatherType, WeatherSeverity, Plot, QualityGrade, InsurancePayoutResult, InsuranceClaim, SkillEffectBonus, Season } from '../types/game';
import { QUALITY_PRICE_MULTIPLIER, QUALITY_WEIGHTS } from '../types/game';
import { getInsurancePlan, isWeatherCovered } from '../data/insurance';
import { getCropConfig } from '../data/crops';
import { rollQuality } from './Quality';

export interface InsuranceCoinAccess {
  getCoins(): number;
  spendCoins(amount: number): boolean;
  addCoins(amount: number): void;
}

export interface InsuranceBuildingsAccess {
  isGreenhousePlot(x: number, y: number): boolean;
}

export interface InsuranceSkillAccess {
  getSkillBonus(): SkillEffectBonus;
}

export class CropInsurance {
  private state: InsuranceState;
  private coinAccess: InsuranceCoinAccess | null = null;
  private buildingsAccess: InsuranceBuildingsAccess | null = null;
  private skillAccess: InsuranceSkillAccess | null = null;
  private currentSeason: Season = 'spring';

  constructor(state: InsuranceState | null, coinAccess?: InsuranceCoinAccess) {
    this.state = state ?? this.createInitialState();
    if (coinAccess) {
      this.coinAccess = coinAccess;
    }
  }

  private createInitialState(): InsuranceState {
    return {
      id: 'main',
      activePlan: null,
      insuredSince: null,
      totalPremiumsPaid: 0,
      totalClaimsPaid: 0,
      claimsCount: 0,
      lastPremiumDay: 0,
      pendingClaim: null,
      claimHistory: []
    };
  }

  setCoinAccess(access: InsuranceCoinAccess): void {
    this.coinAccess = access;
  }

  setBuildingsAccess(access: InsuranceBuildingsAccess): void {
    this.buildingsAccess = access;
  }

  setSkillAccess(access: InsuranceSkillAccess): void {
    this.skillAccess = access;
  }

  setCurrentSeason(season: Season): void {
    this.currentSeason = season;
  }

  getState(): InsuranceState {
    return { ...this.state };
  }

  getActivePlan(): InsurancePlanType | null {
    return this.state.activePlan;
  }

  getPlanConfig(planId: InsurancePlanType) {
    return getInsurancePlan(planId);
  }

  isInsured(): boolean {
    return this.state.activePlan !== null;
  }

  isWeatherCoveredByPlan(weather: WeatherType): boolean {
    if (!this.state.activePlan) return false;
    return isWeatherCovered(this.state.activePlan, weather);
  }

  subscribeToPlan(planId: InsurancePlanType, currentDay: number): { success: boolean; message: string } {
    const plan = getInsurancePlan(planId);
    if (!plan) {
      return { success: false, message: '保险计划不存在' };
    }

    if (!this.coinAccess) {
      return { success: false, message: '金币访问未初始化' };
    }

    if (this.state.activePlan === planId) {
      return { success: false, message: '已投保该计划' };
    }

    const firstPremium = plan.dailyPremium;
    if (!this.coinAccess.spendCoins(firstPremium)) {
      return { success: false, message: '金币不足，无法支付首期保费' };
    }

    const previousPlan = this.state.activePlan;
    this.state.activePlan = planId;
    this.state.insuredSince = Date.now();
    this.state.lastPremiumDay = currentDay;
    this.state.totalPremiumsPaid += firstPremium;

    if (previousPlan) {
      return { success: true, message: `已更换为${plan.name}，扣除首期保费 ${firstPremium} 金币` };
    }
    return { success: true, message: `成功投保${plan.name}，扣除首期保费 ${firstPremium} 金币` };
  }

  cancelSubscription(): { success: boolean; message: string } {
    if (!this.state.activePlan) {
      return { success: false, message: '当前没有投保' };
    }

    const plan = getInsurancePlan(this.state.activePlan);
    this.state.activePlan = null;
    this.state.insuredSince = null;

    return { success: true, message: `已取消${plan?.name || '保险'}投保` };
  }

  chargeDailyPremium(currentDay: number): { charged: boolean; amount: number; message?: string } {
    if (!this.state.activePlan) {
      return { charged: false, amount: 0 };
    }

    if (currentDay <= this.state.lastPremiumDay) {
      return { charged: false, amount: 0 };
    }

    const plan = getInsurancePlan(this.state.activePlan);
    if (!plan) {
      return { charged: false, amount: 0 };
    }

    if (!this.coinAccess) {
      return { charged: false, amount: 0, message: '金币访问未初始化' };
    }

    const daysPassed = currentDay - this.state.lastPremiumDay;
    const totalPremium = plan.dailyPremium * daysPassed;

    if (!this.coinAccess.spendCoins(totalPremium)) {
      this.cancelSubscription();
      return { charged: false, amount: 0, message: '金币不足，保险已自动取消' };
    }

    this.state.lastPremiumDay = currentDay;
    this.state.totalPremiumsPaid += totalPremium;

    return { charged: true, amount: totalPremium };
  }

  calculatePayout(
    plots: Plot[][],
    weather: WeatherType,
    severity: WeatherSeverity,
    lostCropPositions: Array<{ x: number; y: number; cropType: string; waterCount: number; growthProgress: number }>,
    currentDay: number
  ): InsurancePayoutResult {
    const result: InsurancePayoutResult = {
      plan: this.state.activePlan,
      covered: false,
      totalPayout: 0,
      cropsLost: lostCropPositions.length,
      cropsByQuality: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      breakdown: []
    };

    if (!this.state.activePlan || lostCropPositions.length === 0) {
      return result;
    }

    if (!this.isWeatherCoveredByPlan(weather)) {
      return result;
    }

    const plan = getInsurancePlan(this.state.activePlan);
    if (!plan) {
      return result;
    }

    result.covered = true;
    const skillBonus = this.skillAccess?.getSkillBonus();

    for (const lost of lostCropPositions) {
      const cropConfig = getCropConfig(lost.cropType);
      if (!cropConfig) continue;

      const isGreenhouse = this.buildingsAccess?.isGreenhousePlot(lost.x, lost.y) ?? false;
      const estimatedQuality = this.estimateQuality(lost.waterCount, isGreenhouse, lost.growthProgress, skillBonus);

      result.cropsByQuality[estimatedQuality]++;

      const basePrice = cropConfig.sellPrice;
      const qualityMultiplier = QUALITY_PRICE_MULTIPLIER[estimatedQuality];
      const qualityBonus = 1 + (plan.qualityBonus * (estimatedQuality - 1) / 4);

      const payout = Math.floor(basePrice * qualityMultiplier * plan.payoutMultiplier * qualityBonus);

      const existingBreakdown = result.breakdown.find(b => b.quality === estimatedQuality);
      if (existingBreakdown) {
        existingBreakdown.count++;
        existingBreakdown.payout += payout;
      } else {
        result.breakdown.push({ quality: estimatedQuality, count: 1, payout });
      }

      result.totalPayout += payout;
    }

    result.breakdown.sort((a, b) => b.quality - a.quality);

    return result;
  }

  private estimateQuality(
    waterCount: number,
    isGreenhouse: boolean,
    growthProgress: number,
    skillBonus?: SkillEffectBonus | null
  ): QualityGrade {
    const effectiveWaterCount = Math.floor(waterCount * Math.max(0.3, growthProgress));
    return rollQuality(effectiveWaterCount, isGreenhouse, skillBonus);
  }

  processClaim(
    plots: Plot[][],
    weather: WeatherType,
    severity: WeatherSeverity,
    lostCropPositions: Array<{ x: number; y: number; cropType: string; waterCount: number; growthProgress: number }>,
    currentDay: number
  ): InsurancePayoutResult & { claim?: InsuranceClaim } {
    const payoutResult = this.calculatePayout(plots, weather, severity, lostCropPositions, currentDay);

    if (!payoutResult.covered || payoutResult.totalPayout <= 0) {
      return payoutResult;
    }

    if (!this.coinAccess) {
      return payoutResult;
    }

    this.coinAccess.addCoins(payoutResult.totalPayout);

    const claim: InsuranceClaim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      weatherType: weather,
      weatherSeverity: severity,
      cropsLost: payoutResult.cropsLost,
      cropsByQuality: { ...payoutResult.cropsByQuality },
      payout: payoutResult.totalPayout,
      claimedAt: Date.now(),
      day: currentDay
    };

    this.state.totalClaimsPaid += payoutResult.totalPayout;
    this.state.claimsCount++;
    this.state.pendingClaim = claim;
    this.state.claimHistory.push(claim);

    return { ...payoutResult, claim };
  }

  clearPendingClaim(): void {
    this.state.pendingClaim = null;
  }

  getPendingClaim(): InsuranceClaim | null {
    return this.state.pendingClaim ?? null;
  }

  getStats() {
    return {
      activePlan: this.state.activePlan,
      insuredSince: this.state.insuredSince,
      totalPremiumsPaid: this.state.totalPremiumsPaid,
      totalClaimsPaid: this.state.totalClaimsPaid,
      claimsCount: this.state.claimsCount,
      netBalance: this.state.totalClaimsPaid - this.state.totalPremiumsPaid
    };
  }
}
