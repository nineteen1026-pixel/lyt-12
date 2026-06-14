<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import Phaser from 'phaser';
import { BootScene } from '../game/phaser/scenes/BootScene';
import { FarmScene } from '../game/phaser/scenes/FarmScene';
import { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE } from '../game/types/game';

const canvasRef = ref<HTMLDivElement | null>(null);
let game: Phaser.Game | null = null;

const initPhaser = () => {
  if (!canvasRef.value) return;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: canvasRef.value,
    width: GRID_WIDTH * TILE_SIZE + 192,
    height: GRID_HEIGHT * TILE_SIZE,
    scene: [BootScene, FarmScene],
    pixelArt: true,
    backgroundColor: '#7cb342',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
      activePointers: 1
    }
  };

  game = new Phaser.Game(config);
};

const destroyPhaser = () => {
  if (game) {
    game.destroy(true);
    game = null;
  }
};

onMounted(() => {
  initPhaser();
  window.addEventListener('beforeunload', destroyPhaser);
});

onUnmounted(() => {
  destroyPhaser();
  window.removeEventListener('beforeunload', destroyPhaser);
});
</script>

<template>
  <div 
    ref="canvasRef" 
    class="relative w-full h-full flex items-center justify-center"
    style="image-rendering: pixelated;"
  >
  </div>
</template>
