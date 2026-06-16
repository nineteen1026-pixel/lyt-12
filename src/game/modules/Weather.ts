import type { WeatherType, WeatherState, WeatherSeverity, Season, Plot, Crop, BuildingType, WeatherWarning } from '../types/game';
import { DAY_DURATION, STORM_DESTROY_CHANCE } from '../types/game';

const WEATHER_TYPES: WeatherType[] = ['sunny', 'rainy', 'snowy', 'stormy', 'drought', 'heatwave'];

const SEASON_WEATHER_WEIGHTS: Record<Season, Record<WeatherType, number>> = {
  spring: { sunny: 4, rainy: 4, snowy: 1, stormy: 1, drought: 1, heatwave: 0 },
  summer: { sunny: 3, rainy: 2, snowy: 0, stormy: 2, drought: 2, heatwave: 2 },
  autumn: { sunny: 3, rainy: 3, snowy: 1, stormy: 2, drought: 1, heatwave: 0 },
  winter: { sunny: 3, rainy: 1, snowy: 3, stormy: 1, drought: 0, heatwave: 0 }
};

const SEVERITY_WEIGHTS: Record<WeatherSeverity, number> = {
  light: 5,
  normal: 3,
  severe: 1
};

const DANGEROUS_WEATHER: WeatherType[] = ['stormy', 'snowy', 'drought', 'heatwave'];

export interface WeatherBuildingsAccess {
  getSprinklerWateredPlots(): Array<{ x: number; y: number }>;
  isGreenhousePlot(x: number, y: number): boolean;
  getProtectionReduce(x: number, y: number, kind: 'storm' | 'frost' | 'drought' | 'heatwave'): number;
  isPlotProtected(x: number, y: number, kind: 'storm' | 'frost'): { protected: boolean; source: 'greenhouse' | 'lightning_rod' | 'heater' | 'drainage' | null };
  hasBarn(): boolean;
}

export interface WeatherEffects {
  wateredPlots: number;
  frozenCrops: number;
  destroyedCrops: number;
  sprinklerWatered: number;
  greenhouseProtected: number;
  lightningRodProtected: number;
  heaterProtected: number;
  drainageProtected: number;
  witheredCrops: number;
  scorchedCrops: number;
  totalCropsLost: number;
  totalCropsSaved: number;
  severity: WeatherSeverity;
}

export interface WeatherEventResult {
  warning?: WeatherWarning;
  effects: WeatherEffects;
  isSevere: boolean;
  isDangerous: boolean;
}

export class Weather {
  private state: WeatherState;
  private season: Season;
  private buildings: WeatherBuildingsAccess | null = null;
  private lastIssuedWarning: WeatherWarning | null = null;
  private currentDay: number = 1;

  constructor(weatherState: WeatherState, season: Season, buildings: WeatherBuildingsAccess | null = null) {
    this.state = {
      ...weatherState,
      currentSeverity: weatherState.currentSeverity ?? 'normal',
      forecastSeverities: weatherState.forecastSeverities ?? []
    };
    this.season = season;
    this.buildings = buildings;

    if (this.state.lastIssuedWarningTargetDay != null) {
      this.lastIssuedWarning = {
        weather: this.state.forecast[0] ?? 'sunny',
        severity: 'severe',
        message: '',
        issuedAt: 0,
        targetDay: this.state.lastIssuedWarningTargetDay
      };
    }
  }

  setBuildings(buildings: WeatherBuildingsAccess): void {
    this.buildings = buildings;
  }

  setCurrentDay(day: number): void {
    this.currentDay = day;
  }

  getCurrent(): WeatherType {
    return this.state.current;
  }

  getCurrentSeverity(): WeatherSeverity {
    return this.state.currentSeverity;
  }

  getForecast(): WeatherType[] {
    return this.state.forecast;
  }

  getForecastSeverities(): WeatherSeverity[] {
    return this.state.forecastSeverities;
  }

  getState(): WeatherState {
    return this.state;
  }

  setSeason(season: Season): void {
    this.season = season;
  }

  getWeatherName(weather: WeatherType): string {
    const names: Record<WeatherType, string> = {
      sunny: '晴天',
      rainy: '雨天',
      snowy: '雪天',
      stormy: '雷暴',
      drought: '干旱',
      heatwave: '热浪'
    };
    return names[weather];
  }

  getSeverityName(severity: WeatherSeverity): string {
    const names: Record<WeatherSeverity, string> = {
      light: '轻度',
      normal: '中度',
      severe: '剧烈'
    };
    return names[severity];
  }

  getSeverityColor(severity: WeatherSeverity): string {
    const colors: Record<WeatherSeverity, string> = {
      light: '#4caf50',
      normal: '#ff9800',
      severe: '#f44336'
    };
    return colors[severity];
  }

  isSevereWeather(): boolean {
    return this.state.currentSeverity === 'severe' && DANGEROUS_WEATHER.includes(this.state.current);
  }

  isDangerousWeather(): boolean {
    return DANGEROUS_WEATHER.includes(this.state.current);
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

  private pickSeverity(): WeatherSeverity {
    const totalWeight = Object.values(SEVERITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (const sev of Object.keys(SEVERITY_WEIGHTS) as WeatherSeverity[]) {
      random -= SEVERITY_WEIGHTS[sev];
      if (random <= 0) {
        return sev;
      }
    }
    return 'normal';
  }

  generateForecast(count: number = 3): WeatherType[] {
    this.state.forecast = [];
    this.state.forecastSeverities = [];
    for (let i = 0; i < count; i++) {
      this.state.forecast.push(this.pickWeatherBySeason());
      this.state.forecastSeverities.push(this.pickSeverity());
    }
    return [...this.state.forecast];
  }

  checkAndIssueInitialWarning(currentDay: number = 1): WeatherWarning | null {
    const nextWeather = this.state.forecast[0];
    const nextSeverity = this.state.forecastSeverities[0] ?? 'normal';
    if (!nextWeather) return null;
    if (!DANGEROUS_WEATHER.includes(nextWeather)) return null;
    if (nextSeverity !== 'severe') return null;
    return this.issueWarning(currentDay + 1);
  }

  issueWarning(targetDay: number): WeatherWarning | null {
    if (this.state.forecast.length === 0) {
      this.generateForecast(3);
    }
    const nextWeather = this.state.forecast[0];
    const nextSeverity = this.state.forecastSeverities[0] ?? 'normal';
    if (!nextWeather) return null;
    if (!DANGEROUS_WEATHER.includes(nextWeather)) return null;
    if (nextSeverity !== 'severe') return null;
    if (this.lastIssuedWarning && this.lastIssuedWarning.targetDay === targetDay) return null;

    const message = this.buildWarningMessage(nextWeather, nextSeverity);
    const warning: WeatherWarning = {
      weather: nextWeather,
      severity: nextSeverity,
      message,
      issuedAt: Date.now(),
      targetDay
    };

    this.lastIssuedWarning = warning;
    this.state.lastIssuedWarningTargetDay = targetDay;
    return warning;
  }

  getLastWarning(): WeatherWarning | null {
    return this.lastIssuedWarning;
  }

  clearLastWarning(): void {
    this.lastIssuedWarning = null;
    this.state.lastIssuedWarningTargetDay = undefined;
  }

  private buildWarningMessage(weather: WeatherType, severity: WeatherSeverity): string {
    const sevText = this.getSeverityName(severity);
    const wText = this.getWeatherName(weather);
    if (weather === 'stormy') {
      return `⚠️ 灾害预警：明日将有${sevText}${wText}！建议建造防雷针/排水沟/温室保护作物。`;
    }
    if (weather === 'snowy') {
      return `❄️ 寒潮预警：明日将有${sevText}${wText}！建议建造加热器/温室避免作物冻伤。`;
    }
    if (weather === 'drought') {
      return `🌵 干旱预警：明日将有${sevText}${wText}！建议提前收获成熟作物并保证洒水器供水。`;
    }
    if (weather === 'heatwave') {
      return `🔥 热浪预警：明日将有${sevText}${wText}！请及时收获并避免作物被灼伤。`;
    }
    return `天气预警：明日将有${sevText}${wText}。`;
  }

  getSuggestedBuildings(weather: WeatherType): BuildingType[] {
    switch (weather) {
      case 'stormy':
        return ['greenhouse', 'lightning_rod', 'drainage'];
      case 'snowy':
        return ['greenhouse', 'heater'];
      case 'drought':
        return ['sprinkler', 'barn'];
      case 'heatwave':
        return ['greenhouse', 'sprinkler'];
      default:
        return [];
    }
  }

  advanceDay(currentTime: number, currentDay: number = 1): { changed: boolean; newWeather?: WeatherType; newSeverity?: WeatherSeverity; warning?: WeatherWarning; isSevere: boolean } {
    this.currentDay = currentDay;
    const elapsed = currentTime - this.state.lastDayWeather;
    if (elapsed >= DAY_DURATION) {
      const dayCount = Math.floor(elapsed / DAY_DURATION);
      this.state.lastDayWeather += dayCount * DAY_DURATION;
      this.state.lastWeatherChange = currentTime;

      const previousWeather = this.state.current;
      const previousSeverity = this.state.currentSeverity;

      if (this.state.forecast.length > 0) {
        this.state.current = this.state.forecast.shift()!;
        this.state.currentSeverity = this.state.forecastSeverities.shift() ?? 'normal';
      } else {
        this.state.current = this.pickWeatherBySeason();
        this.state.currentSeverity = this.pickSeverity();
      }

      while (this.state.forecast.length < 3) {
        this.state.forecast.push(this.pickWeatherBySeason());
        this.state.forecastSeverities.push(this.pickSeverity());
      }

      if (this.state.lastIssuedWarningTargetDay != null && this.state.lastIssuedWarningTargetDay <= currentDay) {
        this.lastIssuedWarning = null;
        this.state.lastIssuedWarningTargetDay = undefined;
      }

      let warning: WeatherWarning | undefined;
      const nextWeather = this.state.forecast[0];
      const nextSeverity = this.state.forecastSeverities[0] ?? 'normal';
      if (DANGEROUS_WEATHER.includes(nextWeather) && nextSeverity === 'severe') {
        const w = this.issueWarning(currentDay + 1);
        if (w) warning = w;
      }

      return {
        changed: previousWeather !== this.state.current || previousSeverity !== this.state.currentSeverity,
        newWeather: this.state.current,
        newSeverity: this.state.currentSeverity,
        warning,
        isSevere: this.isSevereWeather()
      };
    }
    return { changed: false, isSevere: this.isSevereWeather() };
  }

  processOfflineWeather(offlineMs: number, currentTime: number, currentDay: number = 1): WeatherType[] {
    const elapsed = Math.max(0, offlineMs);
    const dayCount = Math.floor(elapsed / DAY_DURATION);
    const weatherHistory: WeatherType[] = [];

    for (let i = 0; i < dayCount; i++) {
      const simulatedTime = this.state.lastDayWeather + (i + 1) * DAY_DURATION;
      const result = this.advanceDay(simulatedTime, currentDay);
      if (result.newWeather) {
        weatherHistory.push(result.newWeather);
      }
    }

    this.advanceDay(currentTime, currentDay);
    return weatherHistory;
  }

  applyWeatherEffects(plots: Plot[][], currentTime: number): WeatherEffects {
    const effects: WeatherEffects = {
      wateredPlots: 0,
      frozenCrops: 0,
      destroyedCrops: 0,
      sprinklerWatered: 0,
      greenhouseProtected: 0,
      lightningRodProtected: 0,
      heaterProtected: 0,
      drainageProtected: 0,
      witheredCrops: 0,
      scorchedCrops: 0,
      totalCropsLost: 0,
      totalCropsSaved: 0,
      severity: this.state.currentSeverity
    };

    const weather = this.state.current;
    const sevMult = this.state.currentSeverity === 'severe' ? 1.6 : this.state.currentSeverity === 'light' ? 0.6 : 1;

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
              effects.totalCropsSaved++;
            } else {
              const heaterCheck = this.buildings?.isPlotProtected(x, y, 'frost');
              if (heaterCheck?.protected) {
                effects.heaterProtected++;
                effects.totalCropsSaved++;
              } else {
                const baseChance = 0.5 * sevMult;
                if (Math.random() < Math.min(1, baseChance)) {
                  plot.crop.frozen = true;
                  plot.crop.lastGrowthCheck = currentTime;
                  effects.frozenCrops++;
                  effects.totalCropsLost++;
                }
              }
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
              effects.totalCropsSaved++;
            }
          } else {
            const protection = this.buildings?.isPlotProtected(x, y, 'storm');
            if (protection?.protected && protection.source === 'lightning_rod') {
              const reduce = this.buildings?.getProtectionReduce(x, y, 'storm') ?? 0;
              const adjustedChance = STORM_DESTROY_CHANCE * sevMult * (1 - reduce);
              if (Math.random() < adjustedChance) {
                const destroyed = this.tryDestroyCrop(plot, currentTime);
                if (destroyed) {
                  effects.destroyedCrops++;
                  effects.totalCropsLost++;
                }
              } else {
                effects.lightningRodProtected++;
                effects.totalCropsSaved++;
              }
            } else if (protection?.protected && protection.source === 'drainage') {
              const reduce = this.buildings?.getProtectionReduce(x, y, 'storm') ?? 0;
              const adjustedChance = STORM_DESTROY_CHANCE * sevMult * (1 - reduce);
              if (Math.random() < adjustedChance) {
                const destroyed = this.tryDestroyCrop(plot, currentTime);
                if (destroyed) {
                  effects.destroyedCrops++;
                  effects.totalCropsLost++;
                }
              } else {
                effects.drainageProtected++;
                effects.totalCropsSaved++;
              }
            } else {
              const destroyed = this.tryDestroyCrop(plot, currentTime);
              if (destroyed) {
                effects.destroyedCrops++;
                effects.totalCropsLost++;
              }
            }
          }
        }

        if (weather === 'drought') {
          if (plot.crop && plot.state === 'planted' && !plot.crop.watered && !isGreenhouseProtected) {
            const sprinklerCovered = sprinklerPlots.some(p => p.x === x && p.y === y);
            if (!sprinklerCovered) {
              const baseChance = 0.25 * sevMult;
              if (Math.random() < Math.min(1, baseChance)) {
                const destroyed = this.tryDestroyCrop(plot, currentTime);
                if (destroyed) {
                  effects.witheredCrops++;
                  effects.totalCropsLost++;
                }
              }
            }
          }
        }

        if (weather === 'heatwave') {
          if (plot.crop && plot.state !== 'ready' && !isGreenhouseProtected) {
            const baseChance = 0.18 * sevMult;
            if (Math.random() < Math.min(1, baseChance)) {
              const destroyed = this.tryDestroyCrop(plot, currentTime);
              if (destroyed) {
                effects.scorchedCrops++;
                effects.totalCropsLost++;
              }
            }
          }
        }
      }
    }

    return effects;
  }

  applyWeatherHistory(
    plots: Plot[][],
    weatherHistory: WeatherType[],
    severityHistory: WeatherSeverity[],
    startTime: number,
    endTime: number
  ): WeatherEffects {
    const totalEffects: WeatherEffects = {
      wateredPlots: 0,
      frozenCrops: 0,
      destroyedCrops: 0,
      sprinklerWatered: 0,
      greenhouseProtected: 0,
      lightningRodProtected: 0,
      heaterProtected: 0,
      drainageProtected: 0,
      witheredCrops: 0,
      scorchedCrops: 0,
      totalCropsLost: 0,
      totalCropsSaved: 0,
      severity: 'normal'
    };

    if (weatherHistory.length === 0) {
      return totalEffects;
    }

    const originalWeather = this.state.current;
    const originalSeverity = this.state.currentSeverity;
    const interval = weatherHistory.length > 0
      ? (endTime - startTime) / weatherHistory.length
      : 0;

    weatherHistory.forEach((weather, index) => {
      this.state.current = weather;
      this.state.currentSeverity = severityHistory[index] ?? 'normal';
      const simulatedTime = startTime + (index + 1) * interval;
      const effects = this.applyWeatherEffects(plots, simulatedTime);
      this.accumulateEffects(totalEffects, effects);
    });

    this.state.current = originalWeather;
    this.state.currentSeverity = originalSeverity;

    return totalEffects;
  }

  private accumulateEffects(target: WeatherEffects, source: WeatherEffects): void {
    target.wateredPlots += source.wateredPlots;
    target.frozenCrops += source.frozenCrops;
    target.destroyedCrops += source.destroyedCrops;
    target.sprinklerWatered += source.sprinklerWatered;
    target.greenhouseProtected += source.greenhouseProtected;
    target.lightningRodProtected += source.lightningRodProtected;
    target.heaterProtected += source.heaterProtected;
    target.drainageProtected += source.drainageProtected;
    target.witheredCrops += source.witheredCrops;
    target.scorchedCrops += source.scorchedCrops;
    target.totalCropsLost += source.totalCropsLost;
    target.totalCropsSaved += source.totalCropsSaved;
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

  getDayProgress(currentTime: number): number {
    const elapsed = currentTime - this.state.lastDayWeather;
    return Math.min(1, elapsed / DAY_DURATION);
  }
}
