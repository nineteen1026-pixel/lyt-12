import type { Plot, Crop, Season } from '../types/game';
import { getCropConfig } from '../data/crops';

export interface CropGrowthBuildingsAccess {
  getGreenhouseAllowedSeasons(x: number, y: number): Season[] | null;
}

export class CropGrowth {
  private plots: Plot[][];
  private buildings: CropGrowthBuildingsAccess | null = null;

  constructor(plotGrid: Plot[][], buildings: CropGrowthBuildingsAccess | null = null) {
    this.plots = plotGrid;
    this.buildings = buildings;
  }

  setBuildings(buildings: CropGrowthBuildingsAccess): void {
    this.buildings = buildings;
  }

  plantSeed(x: number, y: number, cropType: string, season: Season): boolean {
    const plot = this.getPlot(x, y);
    if (!plot || !plot.unlocked) {
      return false;
    }
    if (plot.state !== 'tilled' && plot.state !== 'watered') {
      return false;
    }

    const config = getCropConfig(cropType);
    if (!config) {
      return false;
    }

    const allowedSeasons = this.buildings?.getGreenhouseAllowedSeasons(x, y);
    if (allowedSeasons) {
      if (!allowedSeasons.includes(season) && !config.seasons.includes(season)) {
        return false;
      }
    } else {
      if (!config.seasons.includes(season)) {
        return false;
      }
    }

    const now = Date.now();
    plot.crop = {
      type: cropType,
      plantedAt: now,
      watered: plot.state === 'watered',
      lastGrowthCheck: now
    };
    plot.state = 'planted';

    return true;
  }

  waterPlot(x: number, y: number): boolean {
    const plot = this.getPlot(x, y);
    if (!plot || !plot.unlocked) {
      return false;
    }

    if (plot.state === 'tilled') {
      plot.state = 'watered';
      return true;
    }

    if (plot.state === 'planted' && plot.crop) {
      plot.crop.watered = true;
      plot.state = 'watered';
      return true;
    }

    return false;
  }

  harvest(x: number, y: number): { itemId: string; quantity: number } | null {
    const plot = this.getPlot(x, y);
    if (!plot || !plot.unlocked || !plot.crop || plot.state !== 'ready') {
      return null;
    }

    const config = getCropConfig(plot.crop.type);
    if (!config) {
      return null;
    }

    const result = {
      itemId: config.productId,
      quantity: 1
    };

    delete plot.crop;
    plot.state = 'empty';

    return result;
  }

  calculateGrowth(crop: Crop, currentTime: number): number {
    const config = getCropConfig(crop.type);
    if (!config) {
      return 0;
    }

    if (crop.frozen) {
      const elapsed = crop.lastGrowthCheck - crop.plantedAt;
      const growthMultiplier = crop.watered ? 1 : 0.5;
      const effectiveGrowth = elapsed * growthMultiplier;
      return Math.min(1, effectiveGrowth / config.growthTime);
    }

    const elapsed = currentTime - crop.plantedAt;
    const growthMultiplier = crop.watered ? 1 : 0.5;
    const effectiveGrowth = elapsed * growthMultiplier;

    return Math.min(1, effectiveGrowth / config.growthTime);
  }

  getGrowthStage(crop: Crop, currentTime: number): number {
    const config = getCropConfig(crop.type);
    if (!config) {
      return 0;
    }

    const growth = this.calculateGrowth(crop, currentTime);
    return Math.floor(growth * config.stages);
  }

  isReadyToHarvest(crop: Crop, currentTime: number): boolean {
    return this.calculateGrowth(crop, currentTime) >= 1;
  }

  updateCropGrowth(x: number, y: number, currentTime: number): { grew: boolean; becameReady: boolean } {
    const plot = this.getPlot(x, y);
    if (!plot || !plot.crop || plot.state === 'ready') {
      return { grew: false, becameReady: false };
    }

    if (plot.crop.frozen) {
      return { grew: false, becameReady: false };
    }

    const wasReady = this.isReadyToHarvest(plot.crop, plot.crop.lastGrowthCheck);
    const isNowReady = this.isReadyToHarvest(plot.crop, currentTime);

    if (isNowReady && !wasReady) {
      plot.state = 'ready';
      plot.crop.lastGrowthCheck = currentTime;
      return { grew: true, becameReady: true };
    }

    if (!wasReady) {
      plot.crop.lastGrowthCheck = currentTime;
      return { grew: true, becameReady: false };
    }

    return { grew: false, becameReady: false };
  }

  updateAllCrops(currentTime: number): Array<{ x: number; y: number; becameReady: boolean }> {
    const updates: Array<{ x: number; y: number; becameReady: boolean }> = [];

    for (let y = 0; y < this.plots.length; y++) {
      for (let x = 0; x < this.plots[y].length; x++) {
        const plot = this.plots[y][x];
        if (plot.crop && plot.unlocked) {
          const result = this.updateCropGrowth(x, y, currentTime);
          if (result.grew) {
            updates.push({ x, y, becameReady: result.becameReady });
          }
        }
      }
    }

    return updates;
  }

  processOfflineGrowth(offlineMs: number, currentTime: number): Array<{ x: number; y: number; becameReady: boolean }> {
    return this.updateAllCrops(currentTime);
  }

  private getPlot(x: number, y: number): Plot | undefined {
    if (y < 0 || y >= this.plots.length || x < 0 || x >= this.plots[0].length) {
      return undefined;
    }
    return this.plots[y][x];
  }

  getCropAt(x: number, y: number): Crop | undefined {
    return this.getPlot(x, y)?.crop;
  }

  getPlotGrid(): Plot[][] {
    return this.plots;
  }
}
