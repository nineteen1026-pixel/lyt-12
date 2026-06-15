import type { QualityGrade } from '../types/game';
import { QUALITY_WEIGHTS, QUALITY_PRICE_MULTIPLIER } from '../types/game';

export function rollQuality(waterCount: number = 0, isGreenhouse: boolean = false): QualityGrade {
  const weights: Record<QualityGrade, number> = { ...QUALITY_WEIGHTS };

  const waterBonus = Math.min(waterCount, 5) * 3;
  weights[4] += waterBonus;
  weights[5] += waterBonus;

  if (isGreenhouse) {
    weights[3] += 5;
    weights[4] += 5;
    weights[5] += 3;
  }

  const totalWeight = (weights[1] + weights[2] + weights[3] + weights[4] + weights[5]);
  let roll = Math.random() * totalWeight;

  const grades: QualityGrade[] = [1, 2, 3, 4, 5];
  for (const grade of grades) {
    roll -= weights[grade];
    if (roll <= 0) {
      return grade;
    }
  }

  return 1;
}

export function getQualitySellPrice(baseSellPrice: number, quality: QualityGrade): number {
  const multiplier = QUALITY_PRICE_MULTIPLIER[quality];
  return Math.max(1, Math.floor(baseSellPrice * multiplier));
}

export function meetsQualityRequirement(itemQuality: QualityGrade, minRequired: QualityGrade): boolean {
  return itemQuality >= minRequired;
}

export function getQualityStars(quality: QualityGrade): string {
  return '★'.repeat(quality) + '☆'.repeat(5 - quality);
}
