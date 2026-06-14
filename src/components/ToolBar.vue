<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { getItem } from '../game/data/items';
import { getCropConfig } from '../game/data/crops';
import type { ToolType } from '../game/types/game';

const gameStore = useGameStore();
const showSeedSelector = ref(false);

const tools = computed(() => [
  { id: 'hoe' as ToolType, icon: '⛏️', name: '锄头', desc: '翻地' },
  { id: 'water' as ToolType, icon: '💧', name: '水壶', desc: '浇水' },
  { id: 'hand' as ToolType, icon: '✋', name: '手', desc: '播种/收获' }
]);

const availableSeeds = computed(() => {
  if (!gameStore.inventory) return [];
  const seeds = gameStore.inventory.getSeeds();
  return seeds.filter(s => {
    const config = getCropConfig(s.cropType);
    return config && config.seasons.includes(gameStore.season);
  }).map(s => ({
    ...s,
    item: getItem(s.itemId)
  }));
});

const selectTool = (tool: ToolType) => {
  gameStore.useTool(tool);
  if (tool === 'hand' && availableSeeds.value.length > 0) {
    showSeedSelector.value = true;
  } else {
    showSeedSelector.value = false;
  }
};

const selectSeed = (cropType: string) => {
  gameStore.selectSeed(cropType);
  showSeedSelector.value = false;
};
</script>

<template>
  <div class="bg-farm-ui border-4 border-farm-wood-dark px-4 py-3 flex items-center justify-center gap-4 shadow-pixel relative">
    <div 
      v-for="tool in tools" 
      :key="tool.id"
      class="tool-btn flex flex-col items-center justify-center w-16 h-16 bg-farm-ui-dark border-3 border-farm-wood-dark cursor-pointer transition-all hover:bg-farm-gold hover:scale-105 active:scale-95"
      :class="{ 'bg-farm-gold shadow-pixel-inset': gameStore.selectedTool === tool.id }"
      @click="selectTool(tool.id)"
    >
      <span class="text-2xl">{{ tool.icon }}</span>
      <span class="font-pixel text-[8px] text-farm-wood-dark mt-1">{{ tool.name }}</span>
    </div>
    
    <div class="w-px h-12 bg-farm-wood-dark mx-2"></div>
    
    <div 
      class="tool-btn flex flex-col items-center justify-center w-16 h-16 bg-farm-ui-dark border-3 border-farm-wood-dark cursor-pointer transition-all hover:bg-farm-gold hover:scale-105 active:scale-95"
      @click="gameStore.showInventory = true"
    >
      <span class="text-2xl">🎒</span>
      <span class="font-pixel text-[8px] text-farm-wood-dark mt-1">背包</span>
    </div>
    
    <div 
      class="tool-btn flex flex-col items-center justify-center w-16 h-16 bg-farm-ui-dark border-3 border-farm-wood-dark cursor-pointer transition-all hover:bg-farm-gold hover:scale-105 active:scale-95"
      @click="gameStore.showShop = true"
    >
      <span class="text-2xl">🏪</span>
      <span class="font-pixel text-[8px] text-farm-wood-dark mt-1">商店</span>
    </div>

    <div 
      v-if="showSeedSelector && availableSeeds.length > 0"
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-farm-ui border-4 border-farm-wood-dark p-3 shadow-pixel flex gap-2"
    >
      <div 
        v-for="seed in availableSeeds" 
        :key="seed.itemId"
        class="flex flex-col items-center justify-center w-14 h-14 bg-farm-ui-dark border-2 border-farm-wood-dark cursor-pointer hover:bg-farm-gold transition-all"
        :class="{ 'bg-farm-gold': gameStore.selectedSeed === seed.cropType }"
        @click="selectSeed(seed.cropType)"
      >
        <span class="text-xl">{{ seed.item?.icon }}</span>
        <span class="font-pixel text-[7px] text-farm-wood-dark">x{{ seed.quantity }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.border-3 {
  border-width: 3px;
}
</style>
