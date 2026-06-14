import Phaser from 'phaser';
import { useGameStore } from '../../stores/gameStore';
import type { Plot } from '../../types/game';
import { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE } from '../../types/game';
import { getCropConfig } from '../../data/crops';

export class FarmScene extends Phaser.Scene {
  private gameStore!: ReturnType<typeof useGameStore>;
  private plotSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private animalSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private highlightSprite!: Phaser.GameObjects.Image;
  private seasonOverlay!: Phaser.GameObjects.Image;
  private currentTime: number = 0;
  private lastUpdate: number = 0;
  private lastSave: number = 0;

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
    
    this.time.addEvent({
      delay: 1000,
      callback: this.onSecondTick,
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
      plots.forEach(plot => this.renderPlot(plot));
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

  private setupEventListeners() {
    const checkSeason = () => {
      if (this.seasonOverlay && this.gameStore.season) {
        const season = this.gameStore.season;
        this.seasonOverlay.setTexture(`season_${season}`);
        this.cameras.main.setBackgroundColor(this.getSeasonBgColor(season));
      }
    };

    this.events.on('shutdown', () => {
      this.gameStore.saveGame();
    });
  }

  private onSecondTick() {
    const now = Date.now();
    this.currentTime = now;
    
    this.gameStore.updateGame(now);
    
    if (this.gameStore.mapGrid) {
      const plots = this.gameStore.mapGrid.getAllPlots();
      plots.forEach(plot => {
        if (plot.crop && plot.unlocked) {
          this.renderPlot(plot);
        }
      });
    }
    
    this.renderAnimals();
    checkSeason();
    if (now - this.lastSave > 10000) {
      this.gameStore.saveGame();
      this.lastSave = now;
    }
  }

  update(_time: number, delta: number) {
    this.currentTime = this.currentTime || Date.now();
  }
}
