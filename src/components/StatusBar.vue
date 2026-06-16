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

const weatherInfo = computed(() => {
  const icons: Record<string, string> = {
    sunny: '☀️',
    rainy: '🌧️',
    snowy: '❄️',
    stormy: '⛈️',
    drought: '🌵',
    heatwave: '🔥'
  };
  return {
    icon: icons[gameStore.currentWeather] || '☀️',
    severity: gameStore.currentWeatherSeverity,
    severityName:
      gameStore.currentWeatherSeverity === 'severe' ? '剧烈' :
      gameStore.currentWeatherSeverity === 'light' ? '轻度' : '中度'
  };
});

const suggestedBuildings = computed(() => {
  if (!gameStore.activeWeatherWarning) return [];
  const w = gameStore.activeWeatherWarning.weather;
  switch (w) {
    case 'stormy': return ['🏠温室', '⚡防雷针', '🌊排水沟'];
    case 'snowy': return ['🏠温室', '🔥加热器'];
    case 'drought': return ['💧洒水器', '🏚️谷仓'];
    case 'heatwave': return ['🏠温室', '💧洒水器'];
    default: return [];
  }
});

const disasterStats = computed(() => {
  const s = gameStore.stats;
  if (!s) return null;
  return {
    saved: s.totalCropsSavedByBuildings || 0,
    lost: s.totalCropsLostToDisasters || 0,
    perfect: s.perfectDisasterDefense || 0,
    severe: s.severeDisastersSurvived || 0
  };
});
</script>

<template>
  <div class="flex flex-col gap-2 w-full max-w-[1024px]">
    <transition name="warning-slide">
      <div
        v-if="gameStore.activeWeatherWarning"
        class="border-4 border-red-600 shadow-pixel px-4 py-3 flex items-center justify-between gap-4"
        :class="{
          'bg-red-500 text-white animate-pulse': gameStore.activeWeatherWarning.severity === 'severe',
          'bg-orange-400 text-white': gameStore.activeWeatherWarning.severity === 'normal',
          'bg-yellow-300 text-farm-wood-dark': gameStore.activeWeatherWarning.severity === 'light'
        }"
      >
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <span class="text-3xl flex-shrink-0">
            {{ gameStore.activeWeatherWarning.weather === 'stormy' ? '⛈️' :
               gameStore.activeWeatherWarning.weather === 'snowy' ? '❄️' :
               gameStore.activeWeatherWarning.weather === 'drought' ? '🌵' :
               gameStore.activeWeatherWarning.weather === 'heatwave' ? '🔥' : '⚠️' }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="font-pixel text-sm font-bold leading-tight">
              {{ gameStore.activeWeatherWarning.message }}
            </p>
            <p v-if="suggestedBuildings.length > 0" class="font-pixel text-[10px] mt-1 leading-tight opacity-90">
              💡 推荐建筑：{{ suggestedBuildings.join(' · ') }}
            </p>
          </div>
        </div>
        <button
          @click="gameStore.dismissWeatherWarning()"
          class="px-3 py-1 border-2 border-current font-pixel text-xs flex-shrink-0 hover:bg-white/20 transition-colors"
        >
          ✅ 已处理
        </button>
      </div>
    </transition>

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

        <div class="flex items-center gap-2 pl-4 border-l-2 border-farm-wood-dark/30">
          <span class="text-2xl">{{ weatherInfo.icon }}</span>
          <div class="flex flex-col">
            <span class="font-pixel text-xs text-farm-wood-dark leading-tight">
              {{ gameStore.weatherName }}
            </span>
            <span
              class="font-pixel text-[9px] leading-tight"
              :class="{
                'text-green-700': weatherInfo.severity === 'light',
                'text-orange-700': weatherInfo.severity === 'normal',
                'text-red-700 font-bold animate-pulse': weatherInfo.severity === 'severe'
              }"
            >
              {{ weatherInfo.severityName }}{{ weatherInfo.severity === 'severe' ? ' ⚠️' : '' }}
            </span>
          </div>
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

        <div
          v-if="disasterStats && (disasterStats.saved > 0 || disasterStats.lost > 0)"
          class="flex items-center gap-2 pl-4 border-l-2 border-farm-wood-dark/30"
          :title="`灾害统计：累计保护${disasterStats.saved}株，累计损失${disasterStats.lost}株，剧烈灾害${disasterStats.severe}次，无损${disasterStats.perfect}次`"
        >
          <span class="text-xl">🛡️</span>
          <div class="flex flex-col">
            <span class="font-pixel text-[10px] text-farm-wood-dark leading-tight">
              <span class="text-green-700">保{{ disasterStats.saved }}</span>
              <span class="mx-1 text-farm-wood-dark/50">/</span>
              <span class="text-red-700">损{{ disasterStats.lost }}</span>
            </span>
            <span class="font-pixel text-[9px] text-farm-wood-dark/70 leading-tight">
              无损 {{ disasterStats.perfect }} 次
            </span>
          </div>
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
  </div>
</template>

<style scoped>
.warning-slide-enter-active,
.warning-slide-leave-active {
  transition: all 0.4s ease;
}
.warning-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.warning-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
