import type { Season } from '../types/game';

export interface FishConfig {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  seasons: Season[];
  weight: number;
  coinValue: number;
}

export interface ArtifactConfig {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  weight: number;
  coinValue: number;
  minDay: number;
}

export const FISH_CONFIGS: FishConfig[] = [
  { id: 'carp', name: '鲤鱼', rarity: 'common', seasons: ['spring', 'summer', 'autumn', 'winter'], weight: 50, coinValue: 10 },
  { id: 'bass', name: '鲈鱼', rarity: 'uncommon', seasons: ['spring', 'summer', 'autumn'], weight: 30, coinValue: 25 },
  { id: 'salmon', name: '三文鱼', rarity: 'rare', seasons: ['autumn'], weight: 15, coinValue: 50 },
  { id: 'angelfish', name: '神仙鱼', rarity: 'epic', seasons: ['summer'], weight: 4, coinValue: 120 },
  { id: 'legendary_carp', name: '锦鲤王', rarity: 'legendary', seasons: ['spring'], weight: 1, coinValue: 500 }
];

export const ARTIFACT_CONFIGS: ArtifactConfig[] = [
  { id: 'old_coin', name: '古币', rarity: 'common', weight: 45, coinValue: 15, minDay: 1 },
  { id: 'fossil', name: '化石', rarity: 'uncommon', weight: 30, coinValue: 40, minDay: 5 },
  { id: 'ancient_pot', name: '古陶罐', rarity: 'rare', weight: 18, coinValue: 100, minDay: 15 },
  { id: 'magic_crystal', name: '魔法水晶', rarity: 'epic', weight: 6, coinValue: 250, minDay: 30 },
  { id: 'golden_idol', name: '黄金神像', rarity: 'legendary', weight: 1, coinValue: 1000, minDay: 50 }
];

export function rollFish(season: Season, dayBoost: number = 0): FishConfig | null {
  const available = FISH_CONFIGS.filter(f => f.seasons.includes(season));
  if (available.length === 0) return null;

  const adjusted = available.map(f => ({
    fish: f,
    weight: f.weight + (f.rarity !== 'common' ? dayBoost : 0)
  }));

  const totalWeight = adjusted.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const { fish } of adjusted) {
    roll -= (fish.weight + (fish.rarity !== 'common' ? dayBoost : 0));
    if (roll <= 0) return fish;
  }

  return available[0];
}

export function rollArtifact(currentDay: number, dayBoost: number = 0): ArtifactConfig | null {
  const available = ARTIFACT_CONFIGS.filter(a => currentDay >= a.minDay);
  if (available.length === 0) return null;

  const adjusted = available.map(a => ({
    artifact: a,
    weight: a.weight + (a.rarity !== 'common' ? dayBoost : 0)
  }));

  const totalWeight = adjusted.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const { artifact } of adjusted) {
    roll -= (artifact.weight + (artifact.rarity !== 'common' ? dayBoost : 0));
    if (roll <= 0) return artifact;
  }

  return available[0];
}

export const FISH_COOLDOWN = 30000;
export const DIG_COOLDOWN = 45000;
