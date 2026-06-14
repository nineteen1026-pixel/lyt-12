import type { WeatherType, WeatherState, Season, Plot, Crop } from '../types/game';
import { DAY_DURATION, STORM_DESTROY_CHANCE } from '../types/game';

const WEATHER_TYPES: WeatherType[] = ['sunny', 'rainy', 'snowy', 'stormy'];

const SEASON_WEATHER_WEIGHTS: Record<Season, Record<WeatherType, number>> = {
  spring: { sunny: 4, rainy: 4, snowy: 1, stormy: 1 },
  summer: { sunny: 5, rainy: 3, snowy: 0, stormy: 2 },
  autumn: { sunny: 4, rainy: 3, snowy: 1, stormy: 2 },
  winter: { sunny: 3, rainy: 2, snowy: 4, stormy: 1 }
};

export interface WeatherBuildingsAccess {
  getSprinklerWateredPlots(): Array<{ x: number; y: number }>;
  isGreenhousePlot(x: number, y: number): boolean;
}

export interface WeatherEffects {
  wateredPlots: number;
  frozenCrops: number;
  destroyedCrops: number;
  sprinklerWatered: number;
  greenhouseProtected: number;
}

export class Weather {
  private state: WeatherState;
  private season: Season;
  private buildings: WeatherBuildingsAccess | null = null;

  constructor(weatherState: WeatherState, season: Season, buildings: WeatherBuildingsAccess | null = null) {
    this.state = weatherState;
    this.season = season;
    this.buildings = buildings;
  }

  setBuildings(buildings: WeatherBuildingsAccess): void {
    this.buildings = buildings;
  }

  getCurrent(): WeatherType {
    return this.state.current;
  }

  getForecast(): WeatherType[] {
    return this.state.forecast;
  }

  getState(): WeatherState {
    return this.state;
  }

  setSeason(season: Season): void {
    this.season = season;
  }

  private pickWeatherBySeason(): WeatherType {
    const weights = SEASON_WEATHER_WEIGHTS[this.season];
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (const type of WEATHER_TYPES) {
      random -= weights[type];
      if (random <= 0) {
        return type;
      }
    }
    return 'sunny';
  }

  generateForecast(count: number = 3): WeatherType[] {
    const forecast: WeatherType[] = [];
    for (let i = 0; i < count; i++) {
      forecast.push(this.pickWeatherBySeason());
    }
    return forecast;
  }

  advanceDay(currentTime: number): { changed: boolean; newWeather?: WeatherType } {
    const elapsed = currentTime - this.state.lastDayWeather;
    if (elapsed >= DAY_DURATION) {
      const dayCount = Math.floor(elapsed / DAY_DURATION);
      this.state.lastDayWeather += dayCount * DAY_DURATION;
      this.state.lastWeatherChange = currentTime;

      const previousWeather = this.state.current;
      if (this.state.forecast.length > 0) {
        this.state.current = this.state.forecast.shift()!;
      } else {
        this.state.current = this.pickWeatherBySeason();
      }

      while (this.state.forecast.length < 3) {
        this.state.forecast.push(this.pickWeatherBySeason());
      }

      return {
        changed: previousWeather !== this.state.current,
        newWeather: this.state.current
      };
    }
    return { changed: false };
  }

  processOfflineWeather(offlineMs: number, currentTime: number): WeatherType[] {
    const elapsed = Math.max(0, offlineMs);
    const dayCount = Math.floor(elapsed / DAY_DURATION);
    const weatherHistory: WeatherType[] = [];

    for (let i = 0; i < dayCount; i++) {
      const simulatedTime = this.state.lastDayWeather + (i + 1) * DAY_DURATION;
      const result = this.advanceDay(simulatedTime);
      if (result.newWeather) {
        weatherHistory.push(result.newWeather);
      }
    }

    this.advanceDay(currentTime);
    return weatherHistory;
  }

  applyWeatherEffects(plots: Plot[][], currentTime: number): WeatherEffects {
    const effects: WeatherEffects = {
      wateredPlots: 0,
      frozenCrops: 0,
      destroyedCrops: 0,
      sprinklerWatered: 0,
      greenhouseProtected: 0
    };

    const weather = this.state.current;

    const sprinklerPlots = this.buildings?.getSprinklerWateredPlots() ?? [];
    for (const { x, y } of sprinklerPlots) {
      const plot = plots[y]?.[x];
      if (plot && plot.unlocked) {
        const watered = this.waterPlot(plot);
        if (watered) effects.sprinklerWatered++;
      }
    }

    for (let y = 0; y < plots.length; y++) {
      for (let x = 0; x < plots[y].length; x++) {
        const plot = plots[y][x];
        if (!plot.unlocked) continue;

        const isGreenhouseProtected = this.buildings?.isGreenhousePlot(x, y) ?? false;

        if (weather === 'rainy' || weather === 'stormy') {
          const watered = this.waterPlot(plot);
          if (watered) effects.wateredPlots++;
        }

        if (weather === 'snowy') {
          if (plot.crop && !plot.crop.frozen) {
            if (isGreenhouseProtected) {
              effects.greenhouseProtected++;
            } else {
              plot.crop.frozen = true;
              plot.crop.lastGrowthCheck = currentTime;
              effects.frozenCrops++;
            }
          }
        } else {
          if (plot.crop && plot.crop.frozen) {
            plot.crop.frozen = false;
            plot.crop.lastGrowthCheck = currentTime;
          }
        }

        if (weather === 'stormy') {
          if (isGreenhouseProtected) {
            if (plot.crop && plot.state !== 'ready') {
              effects.greenhouseProtected++;
            }
          } else {
            const destroyed = this.tryDestroyCrop(plot, currentTime);
            if (destroyed) effects.destroyedCrops++;
          }
        }
      }
    }

    return effects;
  }

  applyWeatherHistory(
    plots: Plot[][],
    weatherHistory: WeatherType[],
    startTime: number,
    endTime: number
  ): WeatherEffects {
    const totalEffects: WeatherEffects = {
      wateredPlots: 0,
      frozenCrops: 0,
      destroyedCrops: 0,
      sprinklerWatered: 0,
      greenhouseProtected: 0
    };

    if (weatherHistory.length === 0) {
      return totalEffects;
    }

    const originalWeather = this.state.current;
    const interval = weatherHistory.length > 0
      ? (endTime - startTime) / weatherHistory.length
      : 0;

    weatherHistory.forEach((weather, index) => {
      this.state.current = weather;
      const simulatedTime = startTime + (index + 1) * interval;
      const effects = this.applyWeatherEffects(plots, simulatedTime);
      totalEffects.wateredPlots += effects.wateredPlots;
      totalEffects.frozenCrops += effects.frozenCrops;
      totalEffects.destroyedCrops += effects.destroyedCrops;
      totalEffects.sprinklerWatered += effects.sprinklerWatered;
      totalEffects.greenhouseProtected += effects.greenhouseProtected;
    });

    this.state.current = originalWeather;

    return totalEffects;
  }

  private waterPlot(plot: Plot): boolean {
    if (plot.state === 'tilled') {
      plot.state = 'watered';
      return true;
    }

    if ((plot.state === 'planted' || plot.state === 'watered') && plot.crop) {
      if (!plot.crop.watered) {
        plot.crop.watered = true;
        plot.state = 'watered';
        return true;
      }
    }

    return false;
  }

  private tryDestroyCrop(plot: Plot, currentTime: number): boolean {
    if (!plot.crop || plot.state === 'ready') {
      return false;
    }

    if (Math.random() < STORM_DESTROY_CHANCE) {
      delete plot.crop;
      plot.state = 'tilled';
      return true;
    }

    return false;
  }

  isGrowthPaused(crop: Crop): boolean {
    return crop.frozen === true;
  }

  getWeatherName(weather: WeatherType): string {
    const names: Record<WeatherType, string> = {
      sunny: '晴天',
      rainy: '雨天',
      snowy: '雪天',
      stormy: '雷暴'
    };
    return names[weather];
  }

  getDayProgress(currentTime: number): number {
    const elapsed = currentTime - this.state.lastDayWeather;
    return Math.min(1, elapsed / DAY_DURATION);
  }
}
