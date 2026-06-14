<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';

const gameStore = useGameStore();

const seasonInfo = computed(() => {
  const icons: Record<string, string> = {
    spring: '🌸',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️'
  };
  const names: Record<string, string> = {
    spring: '春季',
    summer: '夏季',
    autumn: '秋季',
    winter: '冬季'
  };
  return {
    icon: icons[gameStore.season] || '🌸',
    name: names[gameStore.season] || '春季'
  };
});
</script>

<template>
  <div class="bg-farm-ui border-4 border-farm-wood-dark px-6 py-3 flex items-center justify-between shadow-pixel">
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <span class="text-2xl">💰</span>
        <span class="font-pixel text-lg text-farm-wood-dark">{{ gameStore.coins }}</span>
      </div>
      
      <div class="flex items-center gap-2">
        <span class="text-2xl">{{ seasonInfo.icon }}</span>
        <span class="font-pixel text-sm text-farm-wood-dark">{{ seasonInfo.name }}</span>
      </div>
      
      <div class="flex items-center gap-2">
        <span class="text-2xl">📅</span>
        <span class="font-pixel text-sm text-farm-wood-dark">第{{ gameStore.day }}天</span>
      </div>
    </div>
    
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <span class="text-xl">🌾</span>
        <span class="font-pixel text-xs text-farm-wood-dark">地块:{{ gameStore.unlockedPlots }}</span>
      </div>
      
      <div class="flex items-center gap-2">
        <span class="text-xl">🐔</span>
        <span class="font-pixel text-xs text-farm-wood-dark">{{ gameStore.animalCount.chickens }}</span>
      </div>
      
      <div class="flex items-center gap-2">
        <span class="text-xl">🐄</span>
        <span class="font-pixel text-xs text-farm-wood-dark">{{ gameStore.animalCount.cows }}</span>
      </div>

      <div class="flex items-center gap-2 pl-4 border-l-2 border-farm-wood-dark/30">
        <span class="text-xl">⭐</span>
        <div class="flex flex-col">
          <span class="font-pixel text-[10px] text-farm-wood-dark leading-tight">
            Lv.{{ gameStore.reputationLevelInfo.level }} {{ gameStore.reputationLevelInfo.name }}
          </span>
          <span class="font-pixel text-[9px] text-farm-gold-dark leading-tight">
            {{ gameStore.reputation.score }}分
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
