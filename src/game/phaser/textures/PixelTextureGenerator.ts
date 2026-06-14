import Phaser from 'phaser';

export class PixelTextureGenerator {
  static generateAll(scene: Phaser.Scene) {
    this.generateGrass(scene);
    this.generateTilledSoil(scene);
    this.generateWetSoil(scene);
    this.generatePlotLocked(scene);
    this.generatePlotHighlight(scene);
    this.generateCropSprites(scene);
    this.generateAnimalSprites(scene);
    this.generateSeasonsOverlay(scene);
    this.generateWeatherIcons(scene);
    this.generateFrozenOverlay(scene);
  }

  private static generateGrass(scene: Phaser.Scene) {
    const size = 64;
    const graphics = scene.make.graphics({ add: false });
    
    graphics.fillStyle(0x7cb342);
    graphics.fillRect(0, 0, size, size);
    
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, size - 1);
      const y = Phaser.Math.Between(0, size - 1);
      const shade = Phaser.Math.Between(0, 1);
      graphics.fillStyle(shade === 0 ? 0x8bc34a : 0x689f38, 0.5);
      graphics.fillRect(x, y, 2, 2);
    }
    
    graphics.generateTexture('grass', size, size);
    graphics.destroy();
  }

  private static generateTilledSoil(scene: Phaser.Scene) {
    const size = 64;
    const graphics = scene.make.graphics({ add: false });
    
    graphics.fillStyle(0x8d6e63);
    graphics.fillRect(2, 2, size - 4, size - 4);
    
    for (let y = 8; y < size - 4; y += 12) {
      graphics.fillStyle(0x6d4c41);
      graphics.fillRect(4, y, size - 8, 3);
    }
    
    graphics.lineStyle(3, 0x5d4037);
    graphics.strokeRect(2, 2, size - 4, size - 4);
    
    graphics.generateTexture('soil_tilled', size, size);
    graphics.destroy();
  }

  private static generateWetSoil(scene: Phaser.Scene) {
    const size = 64;
    const graphics = scene.make.graphics({ add: false });
    
    graphics.fillStyle(0x4e342e);
    graphics.fillRect(2, 2, size - 4, size - 4);
    
    for (let y = 8; y < size - 4; y += 12) {
      graphics.fillStyle(0x3e2723);
      graphics.fillRect(4, y, size - 8, 3);
    }
    
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(6, size - 10);
      const y = Phaser.Math.Between(6, size - 10);
      graphics.fillStyle(0x5d4037, 0.6);
      graphics.fillRect(x, y, 3, 3);
    }
    
    graphics.lineStyle(3, 0x3e2723);
    graphics.strokeRect(2, 2, size - 4, size - 4);
    
    graphics.generateTexture('soil_wet', size, size);
    graphics.destroy();
  }

  private static generatePlotLocked(scene: Phaser.Scene) {
    const size = 64;
    const graphics = scene.make.graphics({ add: false });
    
    graphics.fillStyle(0x607d8b, 0.7);
    graphics.fillRect(0, 0, size, size);
    
    graphics.lineStyle(2, 0x455a64);
    for (let i = 0; i < size; i += 8) {
      graphics.beginPath();
      graphics.moveTo(i, 0);
      graphics.lineTo(0, i);
      graphics.strokePath();
    }
    
    graphics.fillStyle(0xcfd8dc);
    graphics.fillRect(size / 2 - 8, size / 2 - 6, 16, 12);
    graphics.fillStyle(0x90a4ae);
    graphics.fillRect(size / 2 - 6, size / 2 - 12, 12, 8);
    graphics.fillStyle(0x455a64);
    graphics.fillRect(size / 2 - 2, size / 2 - 2, 4, 6);
    
    graphics.generateTexture('plot_locked', size, size);
    graphics.destroy();
  }

  private static generatePlotHighlight(scene: Phaser.Scene) {
    const size = 64;
    const graphics = scene.make.graphics({ add: false });
    
    graphics.lineStyle(4, 0xffd54f);
    graphics.strokeRect(0, 0, size, size);
    
    graphics.fillStyle(0xffd54f, 0.3);
    graphics.fillRect(0, 0, size, size);
    
    graphics.generateTexture('plot_highlight', size, size);
    graphics.destroy();
  }

  private static generateCropSprites(scene: Phaser.Scene) {
    const crops = [
      { id: 'turnip', stages: 4, color: 0xffffff },
      { id: 'potato', stages: 4, color: 0xd4a574 },
      { id: 'tomato', stages: 5, color: 0xe53935 },
      { id: 'corn', stages: 5, color: 0xffd54f },
      { id: 'pumpkin', stages: 5, color: 0xff9800 },
      { id: 'strawberry', stages: 6, color: 0xe91e63 }
    ];

    crops.forEach(crop => {
      for (let stage = 0; stage < crop.stages; stage++) {
        this.generateCropStage(scene, crop.id, stage, crop.stages, crop.color);
      }
    });
  }

  private static generateCropStage(
    scene: Phaser.Scene,
    cropId: string,
    stage: number,
    maxStages: number,
    color: number
  ) {
    const size = 64;
    const graphics = scene.make.graphics({ add: false });
    
    const progress = (stage + 1) / maxStages;
    const height = Math.floor(8 + progress * 40);
    const width = Math.floor(6 + progress * 20);
    const baseY = size - 8;
    
    if (progress > 0.5) {
      graphics.fillStyle(0x66bb6a);
      for (let i = 0; i < 2; i++) {
        const leafX = size / 2 - width / 2 + (i * width);
        graphics.fillEllipse(leafX, baseY - height + 10, 8, 12);
      }
    }
    
    graphics.fillStyle(0x4caf50);
    graphics.fillRect(size / 2 - 2, baseY - height, 4, height);
    
    if (progress >= 0.8) {
      const fruitSize = Math.floor(8 + progress * 8);
      graphics.fillStyle(color);
      graphics.fillRect(size / 2 - fruitSize / 2, baseY - height - fruitSize + 4, fruitSize, fruitSize);
      
      if (progress >= 1) {
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillRect(size / 2 - fruitSize / 2 + 2, baseY - height - fruitSize + 6, 3, 3);
      }
    }
    
    graphics.generateTexture(`crop_${cropId}_${stage}`, size, size);
    graphics.destroy();
  }

  private static generateAnimalSprites(scene: Phaser.Scene) {
    this.generateChicken(scene);
    this.generateCow(scene);
    this.generateEgg(scene);
    this.generateMilk(scene);
  }

  private static generateChicken(scene: Phaser.Scene) {
    const size = 64;
    const graphics = scene.make.graphics({ add: false });
    
    graphics.fillStyle(0xfff8e1);
    graphics.fillEllipse(size / 2, size / 2 + 4, 28, 24);
    
    graphics.fillStyle(0xfff8e1);
    graphics.fillCircle(size / 2 - 10, size / 2 - 10, 12);
    
    graphics.fillStyle(0xff7043);
    graphics.fillTriangle(size / 2 - 18, size / 2 - 10, size / 2 - 24, size / 2 - 8, size / 2 - 18, size / 2 - 6);
    
    graphics.fillStyle(0xe53935);
    graphics.fillRect(size / 2 - 12, size / 2 - 24, 8, 6);
    
    graphics.fillStyle(0x000000);
    graphics.fillCircle(size / 2 - 14, size / 2 - 10, 2);
    
    graphics.fillStyle(0xffcc80);
    graphics.fillRect(size / 2 - 8, size / 2 + 12, 4, 8);
    graphics.fillRect(size / 2 + 2, size / 2 + 12, 4, 8);
    
    graphics.generateTexture('chicken', size, size);
    graphics.destroy();
  }

  private static generateCow(scene: Phaser.Scene) {
    const size = 64;
    const graphics = scene.make.graphics({ add: false });
    
    graphics.fillStyle(0xfafafa);
    graphics.fillEllipse(size / 2, size / 2 + 8, 32, 22);
    
    graphics.fillStyle(0x424242);
    graphics.fillEllipse(size / 2 - 8, size / 2 + 4, 8, 6);
    graphics.fillEllipse(size / 2 + 10, size / 2 + 12, 6, 5);
    
    graphics.fillStyle(0xfafafa);
    graphics.fillEllipse(size / 2 - 18, size / 2 - 8, 16, 14);
    
    graphics.fillStyle(0xffccbc);
    graphics.fillEllipse(size / 2 - 30, size / 2 - 4, 10, 8);
    
    graphics.fillStyle(0xe0e0e0);
    graphics.fillEllipse(size / 2 + 8, size / 2 + 20, 12, 8);
    
    graphics.fillStyle(0x000000);
    graphics.fillCircle(size / 2 - 22, size / 2 - 10, 2);
    
    graphics.fillStyle(0x795548);
    graphics.fillRect(size / 2 - 20, size / 2 + 14, 5, 12);
    graphics.fillRect(size / 2 + 12, size / 2 + 14, 5, 12);
    
    graphics.generateTexture('cow', size, size);
    graphics.destroy();
  }

  private static generateEgg(scene: Phaser.Scene) {
    const size = 32;
    const graphics = scene.make.graphics({ add: false });
    
    graphics.fillStyle(0xffffff);
    graphics.fillEllipse(size / 2, size / 2, 14, 18);
    
    graphics.fillStyle(0xeeeeee);
    graphics.fillEllipse(size / 2 - 3, size / 2 - 3, 4, 4);
    
    graphics.generateTexture('egg', size, size);
    graphics.destroy();
  }

  private static generateMilk(scene: Phaser.Scene) {
    const size = 32;
    const graphics = scene.make.graphics({ add: false });
    
    graphics.fillStyle(0xffffff);
    graphics.fillRect(size / 2 - 10, size / 2 - 8, 20, 18);
    
    graphics.fillStyle(0xe0e0e0);
    graphics.fillRect(size / 2 - 10, size / 2 + 8, 20, 2);
    
    graphics.fillStyle(0x8d6e63);
    graphics.fillRect(size / 2 - 8, size / 2 - 12, 16, 6);
    
    graphics.generateTexture('milk', size, size);
    graphics.destroy();
  }

  private static generateSeasonsOverlay(scene: Phaser.Scene) {
    const width = 768;
    const height = 512;
    
    const spring = scene.make.graphics({ add: false });
    spring.fillStyle(0xaed581, 0.15);
    spring.fillRect(0, 0, width, height);
    spring.generateTexture('season_spring', width, height);
    spring.destroy();
    
    const summer = scene.make.graphics({ add: false });
    summer.fillStyle(0xffd54f, 0.1);
    summer.fillRect(0, 0, width, height);
    summer.generateTexture('season_summer', width, height);
    summer.destroy();
    
    const autumn = scene.make.graphics({ add: false });
    autumn.fillStyle(0xff9800, 0.15);
    autumn.fillRect(0, 0, width, height);
    autumn.generateTexture('season_autumn', width, height);
    autumn.destroy();
    
    const winter = scene.make.graphics({ add: false });
    winter.fillStyle(0xe0e0e0, 0.3);
    winter.fillRect(0, 0, width, height);
    winter.generateTexture('season_winter', width, height);
    winter.destroy();
  }

  private static generateWeatherIcons(scene: Phaser.Scene) {
    const size = 48;

    this.generateSunnyIcon(scene, size);
    this.generateRainyIcon(scene, size);
    this.generateSnowyIcon(scene, size);
    this.generateStormyIcon(scene, size);
    this.generateWeatherBg(scene, size);
  }

  private static generateSunnyIcon(scene: Phaser.Scene, size: number) {
    const graphics = scene.make.graphics({ add: false });

    graphics.fillStyle(0xffd54f);
    graphics.fillCircle(size / 2, size / 2, 12);

    graphics.lineStyle(3, 0xffd54f);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const cx = size / 2;
      const cy = size / 2;
      graphics.beginPath();
      graphics.moveTo(cx + Math.cos(angle) * 14, cy + Math.sin(angle) * 14);
      graphics.lineTo(cx + Math.cos(angle) * 20, cy + Math.sin(angle) * 20);
      graphics.strokePath();
    }

    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillCircle(size / 2 - 5, size / 2 - 5, 4);

    graphics.generateTexture('weather_sunny', size, size);
    graphics.destroy();
  }

  private static generateRainyIcon(scene: Phaser.Scene, size: number) {
    const graphics = scene.make.graphics({ add: false });

    graphics.fillStyle(0x90a4ae);
    graphics.fillEllipse(size / 2 - 6, size / 2 - 6, 18, 12);
    graphics.fillEllipse(size / 2 + 4, size / 2 - 8, 16, 10);
    graphics.fillEllipse(size / 2, size / 2 - 2, 22, 10);

    graphics.fillStyle(0x64b5f6);
    for (let i = 0; i < 5; i++) {
      const rx = Phaser.Math.Between(size / 2 - 12, size / 2 + 12);
      const ry = size / 2 + 4 + i * 3;
      graphics.fillTriangle(rx, ry, rx - 2, ry - 4, rx + 2, ry - 4);
    }

    graphics.generateTexture('weather_rainy', size, size);
    graphics.destroy();
  }

  private static generateSnowyIcon(scene: Phaser.Scene, size: number) {
    const graphics = scene.make.graphics({ add: false });

    graphics.fillStyle(0xb0bec5);
    graphics.fillEllipse(size / 2 - 6, size / 2 - 6, 18, 12);
    graphics.fillEllipse(size / 2 + 4, size / 2 - 8, 16, 10);
    graphics.fillEllipse(size / 2, size / 2 - 2, 22, 10);

    graphics.fillStyle(0xffffff);
    for (let i = 0; i < 6; i++) {
      const sx = Phaser.Math.Between(size / 2 - 14, size / 2 + 14);
      const sy = size / 2 + 2 + i * 3;
      graphics.fillCircle(sx, sy, 2);
    }

    graphics.generateTexture('weather_snowy', size, size);
    graphics.destroy();
  }

  private static generateStormyIcon(scene: Phaser.Scene, size: number) {
    const graphics = scene.make.graphics({ add: false });

    graphics.fillStyle(0x546e7a);
    graphics.fillEllipse(size / 2 - 6, size / 2 - 8, 18, 12);
    graphics.fillEllipse(size / 2 + 4, size / 2 - 10, 16, 10);
    graphics.fillEllipse(size / 2, size / 2 - 4, 22, 10);

    graphics.fillStyle(0x455a64);
    for (let i = 0; i < 4; i++) {
      const rx = Phaser.Math.Between(size / 2 - 12, size / 2 + 12);
      const ry = size / 2 + 2 + i * 3;
      graphics.fillTriangle(rx, ry, rx - 2, ry - 4, rx + 2, ry - 4);
    }

    graphics.fillStyle(0xffeb3b);
    graphics.fillTriangle(
      size / 2 - 2, size / 2 - 2,
      size / 2 - 8, size / 2 + 10,
      size / 2 + 4, size / 2 + 2
    );
    graphics.fillTriangle(
      size / 2 + 2, size / 2 + 2,
      size / 2 - 4, size / 2 + 14,
      size / 2 + 8, size / 2 + 6
    );

    graphics.generateTexture('weather_stormy', size, size);
    graphics.destroy();
  }

  private static generateWeatherBg(scene: Phaser.Scene, size: number) {
    const width = 768;
    const height = 60;
    const graphics = scene.make.graphics({ add: false });

    graphics.fillStyle(0x000000, 0.5);
    graphics.fillRect(0, 0, width, height);
    graphics.generateTexture('weather_bar_bg', width, height);
    graphics.destroy();

    const frame = scene.make.graphics({ add: false });
    const frameSize = size + 12;
    frame.fillStyle(0xffffff, 0.15);
    frame.lineStyle(2, 0xffffff, 0.5);
    frame.fillRect(0, 0, frameSize, frameSize);
    frame.strokeRect(0, 0, frameSize, frameSize);
    frame.generateTexture('weather_frame', frameSize, frameSize);
    frame.destroy();

    const activeFrame = scene.make.graphics({ add: false });
    activeFrame.fillStyle(0xffd54f, 0.2);
    activeFrame.lineStyle(3, 0xffd54f, 0.8);
    activeFrame.fillRect(0, 0, frameSize, frameSize);
    activeFrame.strokeRect(0, 0, frameSize, frameSize);
    activeFrame.generateTexture('weather_frame_active', frameSize, frameSize);
    activeFrame.destroy();
  }

  private static generateFrozenOverlay(scene: Phaser.Scene) {
    const size = 64;
    const graphics = scene.make.graphics({ add: false });

    graphics.fillStyle(0x81d4fa, 0.4);
    graphics.fillRect(4, 4, size - 8, size - 8);

    graphics.lineStyle(2, 0x4fc3f7, 0.8);
    for (let i = 0; i < 5; i++) {
      const sx = Phaser.Math.Between(6, size - 10);
      const sy = Phaser.Math.Between(6, size - 10);
      graphics.beginPath();
      graphics.moveTo(sx, sy - 3);
      graphics.lineTo(sx - 3, sy);
      graphics.lineTo(sx, sy + 3);
      graphics.lineTo(sx + 3, sy);
      graphics.closePath();
      graphics.strokePath();
    }

    graphics.lineStyle(1, 0xb3e5fc, 0.6);
    graphics.strokeRect(6, 6, size - 12, size - 12);

    graphics.generateTexture('frozen_overlay', size, size);
    graphics.destroy();
  }
}
