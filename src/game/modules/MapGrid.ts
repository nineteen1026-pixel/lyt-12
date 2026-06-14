import type { Plot, Season, PlotState } from '../types/game';
import { GRID_WIDTH, GRID_HEIGHT, SEASON_DURATION } from '../types/game';

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export class MapGrid {
  private plots: Plot[][];
  private season: Season;
  private day: number;
  private lastSeasonAdvance: number;

  constructor(plots: Plot[], season: Season, day: number, lastSeasonAdvance: number) {
    this.plots = this.initPlotGrid(plots);
    this.season = season;
    this.day = day;
    this.lastSeasonAdvance = lastSeasonAdvance;
  }

  private initPlotGrid(plots: Plot[]): Plot[][] {
    const grid: Plot[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        const plot = plots.find(p => p.x === x && p.y === y);
        grid[y][x] = plot || {
          x,
          y,
          state: 'empty' as PlotState,
          unlocked: false
        };
      }
    }
    return grid;
  }

  getPlot(x: number, y: number): Plot | undefined {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
      return undefined;
    }
    return this.plots[y][x];
  }

  getAllPlots(): Plot[] {
    return this.plots.flat();
  }

  getPlotGrid(): Plot[][] {
    return this.plots;
  }

  tillPlot(x: number, y: number): boolean {
    const plot = this.getPlot(x, y);
    if (!plot || !plot.unlocked || plot.state !== 'empty') {
      return false;
    }
    plot.state = 'tilled';
    return true;
  }

  setPlotState(x: number, y: number, state: PlotState): boolean {
    const plot = this.getPlot(x, y);
    if (!plot || !plot.unlocked) {
      return false;
    }
    plot.state = state;
    return true;
  }

  canUnlock(x: number, y: number): boolean {
    const plot = this.getPlot(x, y);
    if (!plot || plot.unlocked) {
      return false;
    }
    const neighbors = [
      this.getPlot(x - 1, y),
      this.getPlot(x + 1, y),
      this.getPlot(x, y - 1),
      this.getPlot(x, y + 1)
    ];
    return neighbors.some(n => n && n.unlocked);
  }

  unlockPlot(x: number, y: number): boolean {
    if (!this.canUnlock(x, y)) {
      return false;
    }
    const plot = this.getPlot(x, y);
    if (plot) {
      plot.unlocked = true;
      return true;
    }
    return false;
  }

  getUnlockPrice(x: number, y: number): number {
    const unlockedCount = this.getUnlockedCount();
    return Math.floor(50 * Math.pow(1.5, unlockedCount - 9));
  }

  getUnlockedCount(): number {
    return this.plots.flat().filter(p => p.unlocked).length;
  }

  getSeason(): Season {
    return this.season;
  }

  getDay(): number {
    return this.day;
  }

  updateSeason(currentTime: number): { advanced: boolean; newSeason?: Season; newDay?: number } {
    const elapsed = currentTime - this.lastSeasonAdvance;
    if (elapsed >= SEASON_DURATION) {
      const advanceCount = Math.floor(elapsed / SEASON_DURATION);
      this.lastSeasonAdvance += advanceCount * SEASON_DURATION;
      
      const totalAdvance = (SEASONS.indexOf(this.season) + advanceCount) % SEASONS.length;
      const dayAdvance = Math.floor(advanceCount / SEASONS.length);
      
      this.season = SEASONS[totalAdvance];
      this.day += dayAdvance + 1;
      
      return {
        advanced: true,
        newSeason: this.season,
        newDay: this.day
      };
    }
    return { advanced: false };
  }

  getLastSeasonAdvance(): number {
    return this.lastSeasonAdvance;
  }

  getSeasonProgress(currentTime: number): number {
    const elapsed = currentTime - this.lastSeasonAdvance;
    return Math.min(1, elapsed / SEASON_DURATION);
  }

  getNextUnlockablePlot(): { x: number; y: number } | null {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (this.canUnlock(x, y)) {
          return { x, y };
        }
      }
    }
    return null;
  }

  getAdjacentPlots(x: number, y: number): Plot[] {
    const adjacent: Plot[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of directions) {
      const plot = this.getPlot(x + dx, y + dy);
      if (plot) {
        adjacent.push(plot);
      }
    }
    return adjacent;
  }
}
