import Phaser from 'phaser';
import { useGameStore } from '../../stores/gameStore';
import type { Plot, WeatherType, BuildingType, Building } from '../../types/game';
import { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE, DAY_DURATION } from '../../types/game';
import { getCropConfig } from '../../data/crops';
import { getBuildingConfig } from '../../data/buildings';

export class FarmScene extends Phaser.Scene {
  private gameStore!: ReturnType<typeof useGameStore>;
  private plotSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private buildingSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private sprinklerWateredTiles: Set<string> = new Set();
  private greenhouseTiles: Set<string> = new Set();
  private highlightSprite!: Phaser.GameObjects.Image;
  private buildPreviewSprite!: Phaser.GameObjects.Container;
  private buildRangeIndicator!: Phaser.GameObjects.Graphics;
  private sprinklerEffectGraphics!: Phaser.GameObjects.Graphics;
  private greenhouseEffectGraphics!: Phaser.GameObjects.Graphics;
  private seasonOverlay!: Phaser.GameObjects.Image;
  private weatherBarContainer!: Phaser.GameObjects.Container;
  private weatherIcons: Map<string, Phaser.GameObjects.Container> = new Map();
  private animalSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private dayProgressBar!: Phaser.GameObjects.Graphics;
  private weatherLabel!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private currentTime: number = 0;
  private lastUpdate: number = 0;
  private lastSave: number = 0;
  private lastWeatherType: WeatherType | null = null;
  private lastForecast: WeatherType[] = [];
  private lastBuildingCount: number = -1;
  private lastSelectedBuilding: BuildingType | null = null;
  private hoveredPlotX: number = -1;
  private hoveredPlotY: number = -1;

  constructor() {
    super('FarmScene');
  }

  create() {
    this.gameStore = useGameStore();
    
    this.setupScene();
    this.renderPlots();
    this.renderAnimals();
    this.renderBuildings();
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

    this.sprinklerEffectGraphics = this.add.graphics();
    this.sprinklerEffectGraphics.setDepth(8);

    this.greenhouseEffectGraphics = this.add.graphics();
    this.greenhouseEffectGraphics.setDepth(8);

    this.buildRangeIndicator = this.add.graphics();
    this.buildRangeIndicator.setDepth(20);

    this.buildPreviewSprite = this.add.container(0, 0);
    this.buildPreviewSprite.setDepth(25);
    this.buildPreviewSprite.setVisible(false);
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

  private renderBuildings() {
    if (!this.gameStore.buildings) return;

    this.buildingSprites.forEach(container => container.destroy());
    this.buildingSprites.clear();

    const buildings = this.gameStore.buildings.getBuildings();
    
    buildings.forEach(building => {
      this.renderBuilding(building);
    });

    this.refreshBuildingEffects();
  }

  private renderBuilding(building: Building) {
    const config = getBuildingConfig(building.type);
    if (!config) return;

    const x = building.x * TILE_SIZE;
    const y = building.y * TILE_SIZE;
    const width = config.footprint.width * TILE_SIZE;
    const height = config.footprint.height * TILE_SIZE;

    const container = this.add.container(x, y);
    container.setSize(width, height);
    container.setDepth(15);

    const bg = this.add.graphics();
    bg.fillStyle(0x8d6e63, 0.8);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(3, 0x5d4037, 1);
    bg.strokeRect(0, 0, width, height);
    container.add(bg);

    const iconSize = Math.min(width, height) * 0.7;
    const iconX = width / 2;
    const iconY = height / 2;
    
    const iconText = this.add.text(iconX, iconY, config.icon, {
      fontFamily: 'Arial',
      fontSize: `${iconSize}px`,
      color: '#ffffff'
    });
    iconText.setOrigin(0.5, 0.5);
    iconText.setShadow(2, 2, '#000000', 2, true, true);
    container.add(iconText);

    const typeLabel = this.add.text(width / 2, height - 8, config.name, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    typeLabel.setOrigin(0.5, 1);
    typeLabel.setShadow(1, 1, '#000000', 1, true, true);
    container.add(typeLabel);

    this.buildingSprites.set(building.id, container);
  }

  private refreshBuildingEffects() {
    this.sprinklerWateredTiles.clear();
    this.greenhouseTiles.clear();
    this.sprinklerEffectGraphics.clear();
    this.greenhouseEffectGraphics.clear();

    if (!this.gameStore.buildings) return;

    const wateredPlots = this.gameStore.buildings.getSprinklerWateredPlots();
    wateredPlots.forEach(p => {
      this.sprinklerWateredTiles.add(`${p.x},${p.y}`);
      const px = p.x * TILE_SIZE;
      const py = p.y * TILE_SIZE;
      this.sprinklerEffectGraphics.fillStyle(0x4fc3f7, 0.25);
      this.sprinklerEffectGraphics.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      this.sprinklerEffectGraphics.lineStyle(2, 0x29b6f6, 0.6);
      this.sprinklerEffectGraphics.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    });

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (this.gameStore.buildings.isGreenhousePlot(x, y) && !this.gameStore.buildings.isPlotOccupied(x, y)) {
          this.greenhouseTiles.add(`${x},${y}`);
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          this.greenhouseEffectGraphics.fillStyle(0x81c784, 0.18);
          this.greenhouseEffectGraphics.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          this.greenhouseEffectGraphics.lineStyle(2, 0x66bb6a, 0.5);
          this.greenhouseEffectGraphics.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        }
      }
    }
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

    if (plot.buildingId) {
      const buildingOverlay = this.add.graphics();
      buildingOverlay.fillStyle(0x6d4c41, 0.4);
      buildingOverlay.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      buildingOverlay.lineStyle(2, 0x4e342e, 1);
      buildingOverlay.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
      container.add(buildingOverlay);
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
        const growth = this.gameStore.cropGrowth?.calculateGrowth(plot.crop, this.currentTime || Date.now()) ?? 0;
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

    const hasSprinklerEffect = this.sprinklerWateredTiles.has(key);
    const hasGreenhouseEffect = this.greenhouseTiles.has(key);

    if (hasSprinklerEffect || hasGreenhouseEffect) {
      const effectOverlay = this.add.container(0, 0);
      effectOverlay.setDepth(4);
      
      if (hasSprinklerEffect) {
        const waterIcon = this.add.text(TILE_SIZE - 8, 6, '💧', {
          fontSize: '12px'
        });
        waterIcon.setOrigin(1, 0);
        waterIcon.setAlpha(0.8);
        effectOverlay.add(waterIcon);
      }
      
      if (hasGreenhouseEffect) {
        const ghIcon = this.add.text(8, 6, '🏠', {
          fontSize: '12px'
        });
        ghIcon.setOrigin(0, 0);
        ghIcon.setAlpha(0.8);
        effectOverlay.add(ghIcon);
      }
      
      container.add(effectOverlay);
    }

    container.on('pointerdown', () => {
      this.onPlotClick(plot.x, plot.y);
    });

    container.on('pointerover', () => {
      this.hoveredPlotX = plot.x;
      this.hoveredPlotY = plot.y;
      if (this.gameStore.selectedBuilding) {
        this.updateBuildPreview(plot.x, plot.y);
      } else if (plot.unlocked) {
        this.highlightSprite.setPosition(x, y);
        this.highlightSprite.setVisible(true);
      }
    });

    container.on('pointerout', () => {
      this.hoveredPlotX = -1;
      this.hoveredPlotY = -1;
      if (this.gameStore.selectedBuilding) {
        this.clearBuildPreview();
      } else {
        this.highlightSprite.setVisible(false);
      }
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
      } else if (animal.feedCount && animal.feedCount > 0) {
        const heartText = this.add.text(TILE_SIZE - 8, 4, `♥${animal.feedCount}`, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#ff4081'
        });
        heartText.setOrigin(1, 0);
        container.add(heartText);
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
    
    if (this.gameStore.selectedBuilding) {
      this.refreshAllWithBuildings();
      if (!this.gameStore.selectedBuilding) {
        this.clearBuildPreview();
      } else if (this.hoveredPlotX >= 0 && this.hoveredPlotY >= 0) {
        this.updateBuildPreview(this.hoveredPlotX, this.hoveredPlotY);
      }
    } else {
      this.refreshPlot(x, y);
    }
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

  private updateBuildPreview(x: number, y: number) {
    const buildingType = this.gameStore.selectedBuilding;
    if (!buildingType || !this.gameStore.canPlaceBuilding) return;

    const config = getBuildingConfig(buildingType);
    if (!config) return;

    this.clearBuildPreview();

    const canPlace = this.gameStore.canPlaceBuilding(buildingType, x, y);
    const isValid = canPlace.canPlace;

    this.buildPreviewSprite.setPosition(x * TILE_SIZE, y * TILE_SIZE);
    this.buildPreviewSprite.setVisible(true);

    const width = config.footprint.width * TILE_SIZE;
    const height = config.footprint.height * TILE_SIZE;

    const bg = this.add.graphics();
    const fillColor = isValid ? 0x4caf50 : 0xf44336;
    bg.fillStyle(fillColor, 0.3);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(3, fillColor, 0.8);
    bg.strokeRect(0, 0, width, height);
    this.buildPreviewSprite.add(bg);

    const iconSize = Math.min(width, height) * 0.5;
    const iconText = this.add.text(width / 2, height / 2, config.icon, {
      fontFamily: 'Arial',
      fontSize: `${iconSize}px`,
      color: '#ffffff'
    });
    iconText.setOrigin(0.5, 0.5);
    iconText.setAlpha(0.8);
    iconText.setShadow(2, 2, '#000000', 2, true, true);
    this.buildPreviewSprite.add(iconText);

    this.buildRangeIndicator.clear();
    const range = config.effect.sprinklerRange ?? 0;
    if (buildingType === 'sprinkler' && range > 0) {
      const cx = x + Math.floor(config.footprint.width / 2);
      const cy = y + Math.floor(config.footprint.height / 2);
      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          const px = cx + dx;
          const py = cy + dy;
          if (px < 0 || px >= GRID_WIDTH || py < 0 || py >= GRID_HEIGHT) continue;
          this.buildRangeIndicator.fillStyle(0x4fc3f7, 0.25);
          this.buildRangeIndicator.fillRect(
            px * TILE_SIZE + 4,
            py * TILE_SIZE + 4,
            TILE_SIZE - 8,
            TILE_SIZE - 8
          );
          this.buildRangeIndicator.lineStyle(2, 0x29b6f6, 0.5);
          this.buildRangeIndicator.strokeRect(
            px * TILE_SIZE + 4,
            py * TILE_SIZE + 4,
            TILE_SIZE - 8,
            TILE_SIZE - 8
          );
        }
      }
    }

    if (buildingType === 'greenhouse') {
      const range = config.footprint.width - 1;
      const cx = x + Math.floor(config.footprint.width / 2);
      const cy = y + Math.floor(config.footprint.height / 2);
      for (let dy = -(range + 1); dy <= range + 1; dy++) {
        for (let dx = -(range + 1); dx <= range + 1; dx++) {
          const px = cx + dx;
          const py = cy + dy;
          if (px < 0 || px >= GRID_WIDTH || py < 0 || py >= GRID_HEIGHT) continue;
          this.buildRangeIndicator.fillStyle(0x81c784, 0.2);
          this.buildRangeIndicator.fillRect(
            px * TILE_SIZE + 6,
            py * TILE_SIZE + 6,
            TILE_SIZE - 12,
            TILE_SIZE - 12
          );
          this.buildRangeIndicator.lineStyle(2, 0x66bb6a, 0.4);
          this.buildRangeIndicator.strokeRect(
            px * TILE_SIZE + 6,
            py * TILE_SIZE + 6,
            TILE_SIZE - 12,
            TILE_SIZE - 12
          );
        }
      }
    }

    this.buildPreviewSprite.setData('canPlace', isValid);
  }

  private clearBuildPreview() {
    this.buildPreviewSprite.removeAll(true);
    this.buildPreviewSprite.setVisible(false);
    this.buildRangeIndicator.clear();
  }

  private refreshAllWithBuildings() {
    this.refreshAllPlots();
    this.renderBuildings();
  }

  private setupInput() {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.cameras.main);
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.gameStore.selectedBuilding) {
        this.gameStore.selectedBuilding = null;
        this.clearBuildPreview();
      }
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

    const buildingCount = this.gameStore.buildingCount;
    const selectedBuilding = this.gameStore.selectedBuilding;
    
    if (buildingCount !== this.lastBuildingCount) {
      this.renderBuildings();
      this.lastBuildingCount = buildingCount;
    }

    if (selectedBuilding !== this.lastSelectedBuilding) {
      if (!selectedBuilding) {
        this.clearBuildPreview();
      }
      this.lastSelectedBuilding = selectedBuilding;
    }

    if (selectedBuilding && this.hoveredPlotX >= 0 && this.hoveredPlotY >= 0) {
      this.updateBuildPreview(this.hoveredPlotX, this.hoveredPlotY);
    }
    
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
