<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { getItem } from '../game/data/items';
import { getCropConfig } from '../game/data/crops';
import { FISH_COOLDOWN, DIG_COOLDOWN } from '../game/data/exploration';

const gameStore = useGameStore();
const showSeedSelector = ref(false);
const fishCooldown = ref(0);
const digCooldown = ref(0);
let cooldownTimer: number | null = null;

const startCooldownTimer = () => {
  if (cooldownTimer) return;
  cooldownTimer = window.setInterval(() => {
    const now = Date.now();
    const fishRemaining = Math.max(0, FISH_COOLDOWN - (now - gameStore.lastFishTime));
    const digRemaining = Math.max(0, DIG_COOLDOWN - (now - gameStore.lastDigTime));
    fishCooldown.value = Math.ceil(fishRemaining / 1000);
    digCooldown.value = Math.ceil(digRemaining / 1000);
    if (fishRemaining <= 0 && digRemaining <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
};

const setExpPosFromEvent = (event: MouseEvent | Event) => {
  const mouseEvent = event as MouseEvent;
  if (mouseEvent.clientX !== undefined && mouseEvent.clientY !== undefined) {
    gameStore.setNextExpPosition(mouseEvent.clientX, mouseEvent.clientY);
  } else if (event.target) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    gameStore.setNextExpPosition(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
};

const handleFish = (event: MouseEvent | Event) => {
  setExpPosFromEvent(event);
  const result = gameStore.tryFish();
  if (!result.success) {
    startCooldownTimer();
  }
};

const handleDig = (event: MouseEvent | Event) => {
  setExpPosFromEvent(event);
  const result = gameStore.tryDig();
  if (!result.success) {
    startCooldownTimer();
  }
};

const tools = computed(() => [
  { id: 'hoe' as const, icon: '⛏️', name: '锄头', desc: '翻地' },
  { id: 'water' as const, icon: '💧', name: '水壶', desc: '浇水' },
  { id: 'hand' as const, icon: '✋', name: '手', desc: '播种/收获' }
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

const selectTool = (tool: 'hoe' | 'water' | 'hand') => {
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

const toggleBuildingsPanel = () => {
  if (gameStore.selectedBuilding) {
    gameStore.selectedBuilding = null;
  }
  gameStore.showBuildings = !gameStore.showBuildings;
  showSeedSelector.value = false;
  gameStore.selectedTool = null;
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
      class="tool-btn flex flex-col items-center justify-center w-16 h-16 bg-farm-ui-dark border-3 border-farm-wood-dark cursor-pointer transition-all hover:bg-farm-gold hover:scale-105 active:scale-95 relative"
      @click="gameStore.showOrders = true"
    >
      <span class="text-2xl">📜</span>
      <span class="font-pixel text-[8px] text-farm-wood-dark mt-1">委托</span>
      <span 
        v-if="gameStore.activeOrderCount > 0"
        class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white font-pixel text-[10px] rounded-full flex items-center justify-center border-2 border-farm-wood-dark"
      >
        {{ gameStore.activeOrderCount }}
      </span>
    </div>

    <div 
      class="tool-btn flex flex-col items-center justify-center w-16 h-16 bg-farm-ui-dark border-3 border-farm-wood-dark cursor-pointer transition-all hover:bg-farm-gold hover:scale-105 active:scale-95"
      :class="{ 'bg-farm-gold shadow-pixel-inset': gameStore.showBuildings || gameStore.selectedBuilding }"
      @click="toggleBuildingsPanel"
    >
      <span class="text-2xl">🏗️</span>
      <span class="font-pixel text-[8px] text-farm-wood-dark mt-1">建造</span>
    </div>

    <div class="w-px h-12 bg-farm-wood-dark mx-2"></div>

    <div 
      class="tool-btn flex flex-col items-center justify-center w-16 h-16 bg-farm-ui-dark border-3 border-farm-wood-dark cursor-pointer transition-all hover:bg-farm-gold hover:scale-105 active:scale-95 relative"
      :class="{ 'opacity-50 cursor-wait': fishCooldown > 0 }"
      @click="handleFish($event)"
    >
      <span class="text-2xl">🎣</span>
      <span class="font-pixel text-[8px] text-farm-wood-dark mt-1">钓鱼</span>
      <span v-if="fishCooldown > 0" class="font-pixel text-[7px] text-red-500 absolute bottom-0.5">
        {{ fishCooldown }}s
      </span>
    </div>
    
    <div 
      class="tool-btn flex flex-col items-center justify-center w-16 h-16 bg-farm-ui-dark border-3 border-farm-wood-dark cursor-pointer transition-all hover:bg-farm-gold hover:scale-105 active:scale-95 relative"
      :class="{ 'opacity-50 cursor-wait': digCooldown > 0 }"
      @click="handleDig"
    >
      <span class="text-2xl">⛏️</span>
      <span class="font-pixel text-[8px] text-farm-wood-dark mt-1">挖掘</span>
      <span v-if="digCooldown > 0" class="font-pixel text-[7px] text-red-500 absolute bottom-0.5">
        {{ digCooldown }}s
      </span>
    </div>

    <div 
      class="tool-btn flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-b from-amber-700 to-amber-900 border-3 border-amber-950 cursor-pointer transition-all hover:from-amber-600 hover:to-amber-800 hover:scale-105 active:scale-95 relative shadow-lg"
      @click="gameStore.openMiningModal()"
    >
      <span class="text-2xl">🕳️</span>
      <span class="font-pixel text-[8px] text-amber-100 mt-1">矿洞</span>
    </div>

    <div class="w-px h-12 bg-farm-wood-dark mx-2"></div>

    <div 
      class="tool-btn flex flex-col items-center justify-center w-16 h-16 bg-farm-ui-dark border-3 border-farm-wood-dark cursor-pointer transition-all hover:bg-farm-gold hover:scale-105 active:scale-95 relative"
      @click="gameStore.showAchievements = true"
    >
      <span class="text-2xl">🏆</span>
      <span class="font-pixel text-[8px] text-farm-wood-dark mt-1">成就</span>
      <span 
        v-if="gameStore.unlockedAchievementCount > 0"
        class="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white font-pixel text-[10px] rounded-full flex items-center justify-center border-2 border-farm-wood-dark"
      >
        {{ gameStore.unlockedAchievementCount }}
      </span>
    </div>
    
    <div 
      class="tool-btn flex flex-col items-center justify-center w-16 h-16 bg-farm-ui-dark border-3 border-farm-wood-dark cursor-pointer transition-all hover:bg-farm-gold hover:scale-105 active:scale-95 relative"
      @click="gameStore.showCodex = true"
    >
      <span class="text-2xl">📖</span>
      <span class="font-pixel text-[8px] text-farm-wood-dark mt-1">图鉴</span>
      <span 
        v-if="gameStore.discoveredCodexCount > 0"
        class="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white font-pixel text-[10px] rounded-full flex items-center justify-center border-2 border-farm-wood-dark"
      >
        {{ gameStore.discoveredCodexCount }}
      </span>
    </div>

    <div 
      class="tool-btn flex flex-col items-center justify-center w-16 h-16 bg-farm-ui-dark border-3 border-farm-wood-dark cursor-pointer transition-all hover:bg-farm-gold hover:scale-105 active:scale-95 relative"
      @click="gameStore.openSkillTreeModal()"
    >
      <span class="text-2xl">🌳</span>
      <span class="font-pixel text-[8px] text-farm-wood-dark mt-1">技能</span>
      <span 
        v-if="gameStore.skillPoints > 0"
        class="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white font-pixel text-[10px] rounded-full flex items-center justify-center border-2 border-farm-wood-dark"
      >
        {{ gameStore.skillPoints }}
      </span>
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
