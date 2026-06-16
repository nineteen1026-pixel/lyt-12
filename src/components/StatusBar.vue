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

      <div class="flex items-center gap-2">
        <span class="text-xl">🏗️</span>
        <span class="font-pixel text-xs text-farm-wood-dark">建筑:{{ gameStore.buildingCount }}</span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xl">📦</span>
        <span class="font-pixel text-xs text-farm-wood-dark">
          容量:{{ gameStore.inventoryUsed }}/{{ gameStore.inventoryCapacity }}
          <span v-if="gameStore.barnCapacityBonus > 0" class="text-farm-green-dark ml-1">
            (+{{ gameStore.barnCapacityBonus }})
          </span>
        </span>
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

      <div class="flex items-center gap-2 pl-4 border-l-2 border-farm-wood-dark/30">
        <span class="text-xl">🌳</span>
        <div class="flex flex-col">
          <span class="font-pixel text-[10px] text-farm-wood-dark leading-tight">
            技能 Lv.{{ gameStore.skillTreeLevel }}
          </span>
          <div class="w-20 h-1.5 bg-farm-wood-dark/30 overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
              :style="{ width: `${gameStore.skillExperienceProgress * 100}%` }"
            ></div>
          </div>
        </div>
        <div 
          v-if="gameStore.skillPoints > 0"
          class="ml-1 px-2 py-0.5 bg-yellow-400 border-2 border-yellow-600 rounded"
        >
          <span class="font-pixel text-[8px] text-yellow-900">+{{ gameStore.skillPoints }}点</span>
        </div>
      </div>
    </div>
  </div>
</template>
