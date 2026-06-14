import Phaser from 'phaser';
import { useGameStore } from '../../stores/gameStore';
import type { Plot, WeatherType } from '../../types/game';
import { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE, DAY_DURATION } from '../../types/game';
import { getCropConfig } from '../../data/crops';

export class FarmScene extends Phaser.Scene {
  private gameStore!: ReturnType<typeof useGameStore>;
  private plotSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private animalSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private highlightSprite!: Phaser.GameObjects.Image;
  private seasonOverlay!: Phaser.GameObjects.Image;
  private weatherBarContainer!: Phaser.GameObjects.Container;
  private weatherIcons: Map<string, Phaser.GameObjects.Container> = new Map();
  private dayProgressBar!: Phaser.GameObjects.Graphics;
  private weatherLabel!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private currentTime: number = 0;
  private lastUpdate: number = 0;
  private lastSave: number = 0;
  private lastWeatherType: WeatherType | null = null;
  private lastForecast: WeatherType[] = [];

  constructor() {
    super('FarmScene');
  }

  create() {
    this.gameStore = useGameStore();
    
    this.setupScene();
    this.renderPlots();
    this.renderAnimals();
    this.setupInput();
    this.setupEventListeners();
    this.renderWeatherBar();
    
    this.time.addEvent({
      delay: 1000,
      callback: this.onSecondTick,
      callbackScope: this,
      loop: true
    });
    
    this.time.addEvent({
      delay: 500,
      callback: this.updateWeatherBar,
      callbackScope: this,
      loop: true
    });
    
    this.lastUpdate = Date.now();
    this.lastSave = Date.now();
  }

  private setupScene() {
    const season = this.gameStore.season;
    
    const bgColor = this.getSeasonBgColor(season);
    this.cameras.main.setBackgroundColor(bgColor);
    
    this.seasonOverlay = this.add.image(0, 0, `season_${season}`);
    this.seasonOverlay.setOrigin(0, 0);
    this.seasonOverlay.setDepth(100);
    
    this.highlightSprite = this.add.image(0, 0, 'plot_highlight');
    this.highlightSprite.setVisible(false);
    this.highlightSprite.setDepth(10);
  }

  private getSeasonBgColor(season: string): number {
    const colors: Record<string, number> = {
      spring: 0x8bc34a,
      summer: 0x689f38,
      autumn: 0xf9a825,
      winter: 0xb0bec5
    };
    return colors[season] || 0x7cb342;
  }

  private renderPlots() {
    if (!this.gameStore.mapGrid) return;

    const plots = this.gameStore.mapGrid.getAllPlots();
    
    plots.forEach(plot => {
      this.renderPlot(plot);
    });
  }

  private renderPlot(plot: Plot) {
    const key = `${plot.x},${plot.y}`;
    const x = plot.x * TILE_SIZE;
    const y = plot.y * TILE_SIZE;

    let container = this.plotSprites.get(key);
    if (!container) {
      container = this.add.container(x, y);
      container.setSize(TILE_SIZE, TILE_SIZE);
      container.setInteractive();
      this.plotSprites.set(key, container);
    } else {
      container.removeAll(true);
    }

    const grass = this.add.image(0, 0, 'grass');
    grass.setOrigin(0, 0);
    container.add(grass);

    if (!plot.unlocked) {
      const locked = this.add.image(0, 0, 'plot_locked');
      locked.setOrigin(0, 0);
      container.add(locked);
      return;
    }

    if (plot.state === 'tilled' || plot.state === 'planted' || plot.state === 'watered' || plot.state === 'ready') {
      const soilTexture = plot.state === 'watered' ? 'soil_wet' : 'soil_tilled';
      const soil = this.add.image(0, 0, soilTexture);
      soil.setOrigin(0, 0);
      container.add(soil);
    }

    if (plot.crop) {
      const config = getCropConfig(plot.crop.type);
      if (config) {
        const growth = this.gameStore.cropGrowth?.calculateGrowth(plot.crop, this.currentTime || Date.now());
        const stage = Math.min(config.stages - 1, Math.floor(growth * config.stages));
        const cropSprite = this.add.image(TILE_SIZE / 2, TILE_SIZE / 2, `crop_${plot.crop.type}_${stage}`);
        cropSprite.setOrigin(0.5, 1);
        cropSprite.setY(TILE_SIZE - 4);
        container.add(cropSprite);

        if (plot.state === 'ready') {
          const readyGlow = this.add.graphics();
          readyGlow.fillStyle(0xffff00, 0.3);
          readyGlow.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 20);
          container.add(readyGlow);
        }

        if (plot.crop.frozen) {
          const frozenOverlay = this.add.image(0, 0, 'frozen_overlay');
          frozenOverlay.setOrigin(0, 0);
          frozenOverlay.setDepth(5);
          container.add(frozenOverlay);
        }
      }
    }

    container.on('pointerdown', () => {
      this.onPlotClick(plot.x, plot.y);
    });

    container.on('pointerover', () => {
      if (plot.unlocked) {
        this.highlightSprite.setPosition(x, y);
        this.highlightSprite.setVisible(true);
      }
    });

    container.on('pointerout', () => {
      this.highlightSprite.setVisible(false);
    });
  }

  private renderAnimals() {
    if (!this.gameStore.livestock) return;

    this.animalSprites.forEach(container => {
      container.destroy();
    });
    this.animalSprites.clear();

    const animals = this.gameStore.livestock.getAnimals();
    const startX = GRID_WIDTH * TILE_SIZE + 32;
    
    animals.forEach((animal, index) => {
      const x = startX + (index % 2) * (TILE_SIZE + 16);
      const y = 32 + Math.floor(index / 2) * (TILE_SIZE + 16);

      const container = this.add.container(x, y);
      container.setSize(TILE_SIZE, TILE_SIZE);
      container.setInteractive();
      
      const bg = this.add.graphics();
      bg.fillStyle(0x8d6e63, 0.5);
      bg.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      container.add(bg);

      const animalSprite = this.add.image(TILE_SIZE / 2, TILE_SIZE / 2, animal.type);
      animalSprite.setScale(0.9);
      container.add(animalSprite);

      if (animal.hasProduct) {
        const productY = TILE_SIZE - 12;
        const productSprite = this.add.image(TILE_SIZE - 12, productY, animal.type === 'chicken' ? 'egg' : 'milk');
        productSprite.setScale(0.8);
        container.add(productSprite);

        const readyGlow = this.add.graphics();
        readyGlow.fillStyle(0xffff00, 0.4);
        readyGlow.fillCircle(TILE_SIZE - 12, productY, 10);
        container.addAt(readyGlow, 0);
      }

      container.on('pointerdown', () => {
        this.onAnimalClick(animal.id);
        this.refreshAnimals();
      });

      this.animalSprites.set(animal.id, container);
    });
  }

  private onPlotClick(x: number, y: number) {
    this.gameStore.handlePlotClick(x, y);
    this.refreshPlot(x, y);
  }

  private onAnimalClick(animalId: string) {
    this.gameStore.handleAnimalClick(animalId);
  }

  private refreshPlot(x: number, y: number) {
    const plot = this.gameStore.mapGrid?.getPlot(x, y);
    if (plot) {
      this.renderPlot(plot);
    }
  }

  private refreshAllPlots() {
    if (this.gameStore.mapGrid) {
      const plots = this.gameStore.mapGrid.getAllPlots();
      plots.forEach(plot => {
        if (plot.unlocked) {
          this.renderPlot(plot);
        }
      });
    }
  }

  private refreshAnimals() {
    this.renderAnimals();
  }

  private setupInput() {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.cameras.main);
    });
  }

  private checkSeason() {
    if (this.seasonOverlay && this.gameStore.season) {
      const season = this.gameStore.season;
      this.seasonOverlay.setTexture(`season_${season}`);
      this.cameras.main.setBackgroundColor(this.getSeasonBgColor(season));
    }
  }

  private setupEventListeners() {
    this.events.on('shutdown', () => {
      this.gameStore.saveGame();
    });
  }

  private onSecondTick() {
    const now = Date.now();
    this.currentTime = now;
    
    this.gameStore.updateGame(now);
    
    this.refreshAllPlots();
    
    this.renderAnimals();
    this.checkSeason();
    if (now - this.lastSave > 10000) {
      this.gameStore.saveGame();
      this.lastSave = now;
    }
  }

  update(_time: number, delta: number) {
    this.currentTime = this.currentTime || Date.now();
  }

  private renderWeatherBar() {
    if (this.weatherBarContainer) {
      this.weatherBarContainer.destroy();
    }
    this.weatherIcons.clear();

    this.weatherBarContainer = this.add.container(0, 0);
    this.weatherBarContainer.setDepth(200);

    const bg = this.add.image(0, 0, 'weather_bar_bg');
    bg.setOrigin(0, 0);
    this.weatherBarContainer.add(bg);

    const title = this.add.text(12, 18, '天气', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.weatherBarContainer.add(title);

    this.weatherLabel = this.add.text(52, 18, this.gameStore.weatherName, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffd54f',
      fontStyle: 'bold'
    });
    this.weatherBarContainer.add(this.weatherLabel);

    const allWeathers: WeatherType[] = [this.gameStore.currentWeather, ...this.gameStore.weatherForecast];
    const iconSize = 60;
    const startX = 768 - (allWeathers.length * iconSize) - 12;
    const labels = ['今日', '明日', '后日', '大后日'];

    allWeathers.forEach((weather, index) => {
      const iconContainer = this.add.container(startX + index * iconSize, 6);
      
      const frameTexture = index === 0 ? 'weather_frame_active' : 'weather_frame';
      const frame = this.add.image(0, 0, frameTexture);
      frame.setOrigin(0, 0);
      iconContainer.add(frame);

      const icon = this.add.image(6, 6, `weather_${weather}`);
      icon.setOrigin(0, 0);
      icon.setScale(1);
      iconContainer.add(icon);

      const label = this.add.text(30, 50, labels[index] || '', {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: index === 0 ? '#ffd54f' : '#cccccc',
        align: 'center'
      });
      label.setOrigin(0.5, 0);
      label.setX(30);
      iconContainer.add(label);

      if (index === 0) {
        iconContainer.setData('active', true);
      }

      this.weatherIcons.set(`weather_${index}`, iconContainer);
      this.weatherBarContainer.add(iconContainer);
    });

    this.dayProgressBar = this.add.graphics();
    this.weatherBarContainer.add(this.dayProgressBar);

    const barX = 12;
    const barY = 42;
    const barWidth = 180;
    this.dayText = this.add.text(barX + barWidth + 8, barY - 2, '', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff'
    });
    this.weatherBarContainer.add(this.dayText);

    this.updateDayProgress();

    this.lastWeatherType = this.gameStore.currentWeather;
    this.lastForecast = [...this.gameStore.weatherForecast];
  }

  private updateWeatherBar() {
    if (!this.gameStore.isInitialized || !this.weatherBarContainer) return;

    const currentWeather = this.gameStore.currentWeather;
    const forecast = this.gameStore.weatherForecast;
    const allWeathers: WeatherType[] = [currentWeather, ...forecast];
    const labels = ['今日', '明日', '后日', '大后日'];

    const forecastChanged = forecast.length !== this.lastForecast.length ||
      forecast.some((w, i) => w !== this.lastForecast[i]);
    const weatherChanged = this.lastWeatherType !== currentWeather;

    if (weatherChanged || forecastChanged) {
      this.weatherIcons.forEach((container, key) => {
        const index = parseInt(key.split('_')[1]);
        if (index < allWeathers.length) {
          const frame = container.getAt(0) as Phaser.GameObjects.Image;
          const icon = container.getAt(1) as Phaser.GameObjects.Image;
          const label = container.getAt(2) as Phaser.GameObjects.Text;

          if (frame) {
            const frameTexture = index === 0 ? 'weather_frame_active' : 'weather_frame';
            if (frame.texture.key !== frameTexture) {
              frame.setTexture(frameTexture);
            }
          }

          if (icon) {
            const iconTexture = `weather_${allWeathers[index]}`;
            if (icon.texture.key !== iconTexture) {
              icon.setTexture(iconTexture);
            }
          }

          if (label) {
            const labelColor = index === 0 ? '#ffd54f' : '#cccccc';
            label.setColor(labelColor);
          }

          container.setData('active', index === 0);
        }
      });

      this.lastWeatherType = currentWeather;
      this.lastForecast = [...forecast];
    }

    this.weatherIcons.forEach((container, key) => {
      const index = parseInt(key.split('_')[1]);
      if (index === 0) {
        const pulse = Math.sin(Date.now() / 300) * 0.03 + 1;
        container.setScale(pulse);
      } else {
        container.setScale(1);
      }
    });

    if (this.weatherLabel) {
      this.weatherLabel.setText(this.gameStore.weatherName);
    }

    this.updateDayProgress();
  }

  private updateDayProgress() {
    if (!this.dayProgressBar || !this.gameStore.weather) return;

    this.dayProgressBar.clear();

    const progress = this.gameStore.weather.getDayProgress(this.currentTime || Date.now());
    const barX = 12;
    const barY = 42;
    const barWidth = 180;
    const barHeight = 8;

    this.dayProgressBar.fillStyle(0x000000, 0.5);
    this.dayProgressBar.fillRect(barX, barY, barWidth, barHeight);

    const progressColor = this.getProgressColor(progress);
    this.dayProgressBar.fillStyle(progressColor, 1);
    this.dayProgressBar.fillRect(barX, barY, barWidth * progress, barHeight);

    this.dayProgressBar.lineStyle(1, 0xffffff, 0.5);
    this.dayProgressBar.strokeRect(barX, barY, barWidth, barHeight);

    const dayLabel = this.gameStore.day ? `第${this.gameStore.day}天` : '';
    if (this.dayText) {
      this.dayText.setText(dayLabel);
    }
  }

  private getProgressColor(progress: number): number {
    if (progress < 0.25) return 0x90caf9;
    if (progress < 0.5) return 0xffd54f;
    if (progress < 0.75) return 0xffb74d;
    return 0xef5350;
  }
}
