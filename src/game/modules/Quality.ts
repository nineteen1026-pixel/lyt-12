import type { QualityGrade, SkillEffectBonus } from '../types/game';
import { QUALITY_WEIGHTS, QUALITY_PRICE_MULTIPLIER } from '../types/game';

export function rollQuality(
  waterCount: number = 0,
  isGreenhouse: boolean = false,
  skillBonus?: SkillEffectBonus | null,
  isAnimal: boolean = false
): QualityGrade {
  const weights: Record<QualityGrade, number> = { ...QUALITY_WEIGHTS };

  const waterFeedCount = Math.min(waterCount, 5);
  let waterFeedBonus = waterFeedCount * 3;

  if (skillBonus) {
    if (isAnimal && skillBonus.feedBonus) {
      waterFeedBonus *= (1 + skillBonus.feedBonus);
    } else if (!isAnimal && skillBonus.waterBonus) {
      waterFeedBonus *= (1 + skillBonus.waterBonus);
    }
  }

  weights[4] += waterFeedBonus;
  weights[5] += waterFeedBonus;

  if (isGreenhouse) {
    let greenhouseBoost = 1;
    if (skillBonus?.greenhouseBoost) {
      greenhouseBoost += skillBonus.greenhouseBoost;
    }
    weights[3] += 5 * greenhouseBoost;
    weights[4] += 5 * greenhouseBoost;
    weights[5] += 3 * greenhouseBoost;
  }

  if (skillBonus) {
    const qualityBonus = isAnimal ? skillBonus.animalQuality : skillBonus.cropQuality;
    if (qualityBonus > 0) {
      weights[3] += qualityBonus * 10;
      weights[4] += qualityBonus * 10;
      weights[5] += qualityBonus * 10;
    }

    if (skillBonus.rareChance > 0) {
      weights[4] += skillBonus.rareChance * 15;
      weights[5] += skillBonus.rareChance * 10;
    }
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
