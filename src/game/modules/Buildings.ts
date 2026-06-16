import type { Building, BuildingType, BuildingConfig, Plot, Season } from '../types/game';
import { GRID_WIDTH, GRID_HEIGHT } from '../types/game';
import { getBuildingConfig } from '../data/buildings';

export interface BuildingOccupiedPlot {
  x: number;
  y: number;
  buildingId: string;
}

export class Buildings {
  private buildings: Map<string, Building>;
  private plotOccupancy: Map<string, string>;
  private plots: Plot[][];

  constructor(buildingsList: Building[], plots: Plot[][]) {
    this.buildings = new Map();
    this.plotOccupancy = new Map();
    this.plots = plots;

    for (const building of buildingsList) {
      this.buildings.set(building.id, building);
      this.registerOccupancy(building);
    }
  }

  private registerOccupancy(building: Building): void {
    const config = getBuildingConfig(building.type);
    if (!config) return;

    for (let dy = 0; dy < config.footprint.height; dy++) {
      for (let dx = 0; dx < config.footprint.width; dx++) {
        const x = building.x + dx;
        const y = building.y + dy;
        const key = `${x},${y}`;
        this.plotOccupancy.set(key, building.id);

        const plot = this.getPlot(x, y);
        if (plot) {
          plot.buildingId = building.id;
        }
      }
    }
  }

  private unregisterOccupancy(building: Building): void {
    const config = getBuildingConfig(building.type);
    if (!config) return;

    for (let dy = 0; dy < config.footprint.height; dy++) {
      for (let dx = 0; dx < config.footprint.width; dx++) {
        const x = building.x + dx;
        const y = building.y + dy;
        const key = `${x},${y}`;
        this.plotOccupancy.delete(key);

        const plot = this.getPlot(x, y);
        if (plot && plot.buildingId === building.id) {
          delete plot.buildingId;
        }
      }
    }
  }

  private getPlot(x: number, y: number): Plot | undefined {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
      return undefined;
    }
    if (!this.plots[y] || !this.plots[y][x]) {
      return undefined;
    }
    return this.plots[y][x];
  }

  getBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  getBuilding(id: string): Building | undefined {
    return this.buildings.get(id);
  }

  getBuildingByPlot(x: number, y: number): Building | undefined {
    const key = `${x},${y}`;
    const buildingId = this.plotOccupancy.get(key);
    if (!buildingId) return undefined;
    return this.buildings.get(buildingId);
  }

  getPlotOccupancy(): Map<string, string> {
    return new Map(this.plotOccupancy);
  }

  isPlotOccupied(x: number, y: number): boolean {
    return this.plotOccupancy.has(`${x},${y}`);
  }

  isPlotOccupiedByBuilding(x: number, y: number, buildingType: BuildingType): boolean {
    const building = this.getBuildingByPlot(x, y);
    return building !== undefined && building.type === buildingType;
  }

  canPlaceBuilding(type: BuildingType, x: number, y: number): { canPlace: boolean; reason?: string } {
    const config = getBuildingConfig(type);
    if (!config) {
      return { canPlace: false, reason: '建筑类型不存在' };
    }

    for (let dy = 0; dy < config.footprint.height; dy++) {
      for (let dx = 0; dx < config.footprint.width; dx++) {
        const px = x + dx;
        const py = y + dy;

        if (px < 0 || px >= GRID_WIDTH || py < 0 || py >= GRID_HEIGHT) {
          return { canPlace: false, reason: '超出地块范围' };
        }

        const plot = this.getPlot(px, py);
        if (!plot) {
          return { canPlace: false, reason: '地块不存在' };
        }

        if (!plot.unlocked) {
          return { canPlace: false, reason: '地块未解锁' };
        }

        if (plot.buildingId) {
          return { canPlace: false, reason: '该位置已有建筑' };
        }

        if (plot.crop || plot.state !== 'empty') {
          return { canPlace: false, reason: '请先清理地块上的作物' };
        }
      }
    }

    return { canPlace: true };
  }

  placeBuilding(type: BuildingType, x: number, y: number): Building | null {
    const check = this.canPlaceBuilding(type, x, y);
    if (!check.canPlace) {
      return null;
    }

    const id = `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const building: Building = {
      id,
      type,
      x,
      y,
      builtAt: Date.now()
    };

    this.buildings.set(id, building);
    this.registerOccupancy(building);

    return building;
  }

  removeBuilding(id: string): boolean {
    const building = this.buildings.get(id);
    if (!building) {
      return false;
    }

    this.unregisterOccupancy(building);
    this.buildings.delete(id);

    return true;
  }

  getSprinklerWateredPlots(): Array<{ x: number; y: number }> {
    const watered: Array<{ x: number; y: number }> = [];
    const processed = new Set<string>();

    for (const building of this.buildings.values()) {
      if (building.type !== 'sprinkler') continue;

      const config = getBuildingConfig(building.type);
      const range = config?.effect.sprinklerRange ?? 1;

      const cx = building.x + Math.floor((config?.footprint.width ?? 1) / 2);
      const cy = building.y + Math.floor((config?.footprint.height ?? 1) / 2);

      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          const px = cx + dx;
          const py = cy + dy;
          const key = `${px},${py}`;

          if (processed.has(key)) continue;
          if (px < 0 || px >= GRID_WIDTH || py < 0 || py >= GRID_HEIGHT) continue;

          const plot = this.getPlot(px, py);
          if (!plot || !plot.unlocked) continue;
          if (this.isPlotOccupied(px, py)) continue;

          processed.add(key);
          watered.push({ x: px, y: py });
        }
      }
    }

    return watered;
  }

  isGreenhousePlot(x: number, y: number): boolean {
    for (const building of this.buildings.values()) {
      if (building.type !== 'greenhouse') continue;

      const config = getBuildingConfig(building.type);
      if (!config) continue;

      const range = (config.footprint.width - 1) / 2;
      const cx = building.x + Math.floor(config.footprint.width / 2);
      const cy = building.y + Math.floor(config.footprint.height / 2);

      const distX = Math.abs(x - cx);
      const distY = Math.abs(y - cy);

      if (distX <= range + 1 && distY <= range + 1) {
        return true;
      }
    }
    return false;
  }

  getGreenhouseAllowedSeasons(x: number, y: number): Season[] | null {
    for (const building of this.buildings.values()) {
      if (building.type !== 'greenhouse') continue;

      const config = getBuildingConfig(building.type);
      if (!config || !config.effect.greenhouseSeasons) continue;

      const range = (config.footprint.width - 1) / 2;
      const cx = building.x + Math.floor(config.footprint.width / 2);
      const cy = building.y + Math.floor(config.footprint.height / 2);

      const distX = Math.abs(x - cx);
      const distY = Math.abs(y - cy);

      if (distX <= range + 1 && distY <= range + 1) {
        return config.effect.greenhouseSeasons;
      }
    }
    return null;
  }

  hasBarn(): boolean {
    for (const building of this.buildings.values()) {
      if (building.type === 'barn') {
        return true;
      }
    }
    return false;
  }

  getBarnCount(): number {
    let count = 0;
    for (const building of this.buildings.values()) {
      if (building.type === 'barn') {
        count++;
      }
    }
    return count;
  }

  getBarnCapacityBonus(): number {
    let bonus = 0;
    for (const building of this.buildings.values()) {
      if (building.type === 'barn') {
        const config = getBuildingConfig(building.type);
        bonus += config?.effect.barnCapacityBonus ?? 0;
      }
    }
    return bonus;
  }

  preventSpoilage(): boolean {
    return this.hasBarn();
  }

  getBuildingCountByType(type: BuildingType): number {
    let count = 0;
    for (const building of this.buildings.values()) {
      if (building.type === type) {
        count++;
      }
    }
    return count;
  }

  getLightningRodPlots(): Array<{ x: number; y: number }> {
    return this.getProtectionPlots('lightning_rod', 'lightningRodRange');
  }

  getHeaterPlots(): Array<{ x: number; y: number }> {
    return this.getProtectionPlots('heater', 'heaterRange');
  }

  getDrainagePlots(): Array<{ x: number; y: number }> {
    return this.getProtectionPlots('drainage', 'drainageRange');
  }

  private getProtectionPlots(
    buildingType: BuildingType,
    rangeKey: 'lightningRodRange' | 'heaterRange' | 'drainageRange'
  ): Array<{ x: number; y: number }> {
    const plots: Array<{ x: number; y: number }> = [];
    const processed = new Set<string>();

    for (const building of this.buildings.values()) {
      if (building.type !== buildingType) continue;

      const config = getBuildingConfig(building.type);
      const range = config?.effect[rangeKey] ?? 1;

      const cx = building.x + Math.floor((config?.footprint.width ?? 1) / 2);
      const cy = building.y + Math.floor((config?.footprint.height ?? 1) / 2);

      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          const px = cx + dx;
          const py = cy + dy;
          const key = `${px},${py}`;

          if (processed.has(key)) continue;
          if (px < 0 || px >= GRID_WIDTH || py < 0 || py >= GRID_HEIGHT) continue;

          const plot = this.getPlot(px, py);
          if (!plot || !plot.unlocked) continue;

          processed.add(key);
          plots.push({ x: px, y: py });
        }
      }
    }

    return plots;
  }

  getProtectionReduce(x: number, y: number, kind: 'storm' | 'frost' | 'drought' | 'heatwave'): number {
    let reduce = 0;

    if (kind === 'storm' || kind === 'frost' || kind === 'drought' || kind === 'heatwave') {
      for (const building of this.buildings.values()) {
        const config = getBuildingConfig(building.type);
        if (!config) continue;

        const rangeKey = (
          building.type === 'lightning_rod' ? 'lightningRodRange' :
          building.type === 'heater' ? 'heaterRange' :
          building.type === 'drainage' ? 'drainageRange' : null
        );
        const reduceKey = (
          building.type === 'lightning_rod' ? 'lightningRodReduce' :
          building.type === 'heater' ? 'heaterReduce' :
          building.type === 'drainage' ? 'drainageReduce' : null
        );
        if (!rangeKey || !reduceKey) continue;

        const range = config.effect[rangeKey] ?? 1;
        const cx = building.x + Math.floor(config.footprint.width / 2);
        const cy = building.y + Math.floor(config.footprint.height / 2);

        if (Math.abs(x - cx) <= range && Math.abs(y - cy) <= range) {
          const contribution = config.effect[reduceKey] ?? 0;
          if (building.type === 'heater' && kind === 'frost') {
            reduce = Math.max(reduce, contribution);
          } else if (building.type === 'lightning_rod' && kind === 'storm') {
            reduce = Math.max(reduce, contribution);
          } else if (building.type === 'drainage' && kind === 'storm') {
            reduce = Math.min(1, reduce + contribution);
          }
        }
      }
    }

    return Math.min(1, reduce);
  }

  isPlotProtected(x: number, y: number, kind: 'storm' | 'frost'): { protected: boolean; source: 'greenhouse' | 'lightning_rod' | 'heater' | 'drainage' | null } {
    if (this.isGreenhousePlot(x, y) && (kind === 'storm' || kind === 'frost')) {
      return { protected: true, source: 'greenhouse' };
    }

    for (const building of this.buildings.values()) {
      const config = getBuildingConfig(building.type);
      if (!config) continue;

      if (kind === 'storm' && (building.type === 'lightning_rod' || building.type === 'drainage')) {
        const range = config.effect[(
          building.type === 'lightning_rod' ? 'lightningRodRange' : 'drainageRange'
        )] ?? 1;
        const cx = building.x + Math.floor(config.footprint.width / 2);
        const cy = building.y + Math.floor(config.footprint.height / 2);
        if (Math.abs(x - cx) <= range && Math.abs(y - cy) <= range) {
          return { protected: true, source: building.type };
        }
      }

      if (kind === 'frost' && building.type === 'heater') {
        const range = config.effect.heaterRange ?? 1;
        const cx = building.x + Math.floor(config.footprint.width / 2);
        const cy = building.y + Math.floor(config.footprint.height / 2);
        if (Math.abs(x - cx) <= range && Math.abs(y - cy) <= range) {
          return { protected: true, source: 'heater' };
        }
      }
    }

    return { protected: false, source: null };
  }

  updatePlotReference(plots: Plot[][]): void {
    this.plots = plots;
    for (const building of this.buildings.values()) {
      this.registerOccupancy(building);
    }
  }
}
