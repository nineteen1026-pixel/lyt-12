import Phaser from 'phaser';
import { PixelTextureGenerator } from '../textures/PixelTextureGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {}

  create() {
    PixelTextureGenerator.generateAll(this);
    this.scene.start('FarmScene');
  }
}
