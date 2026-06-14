<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import type { BuildingType } from '../game/types/game';
import { getBuildingConfig } from '../game/data/buildings';

const gameStore = useGameStore();
const activeTab = ref<'build' | 'manage'>('build');
const hoveredBuildingType = ref<BuildingType | null>(null);

const buyableBuildings = computed(() => {
  return gameStore.getBuyableBuildings?.() || [];
});

const placedBuildings = computed(() => {
  return (gameStore.buildingList || []).map(building => {
    const config = getBuildingConfig(building.type);
    return {
      ...building,
      config,
      builtTime: new Date(building.builtAt).toLocaleString()
    };
  });
});

const selectBuilding = (type: BuildingType) => {
  const check = gameStore.getBuyableBuildings?.().find(b => b.building.id === type);
  if (!check || !check.unlocked) {
    return;
  }
  if (!check.canAfford) {
    return;
  }
  gameStore.selectBuilding?.(type);
  gameStore.showBuildings = false;
};

const demolishBuilding = (buildingId: string) => {
  if (confirm('确定要拆除这个建筑吗？将返还50%金币。')) {
    gameStore.demolishBuilding?.(buildingId);
  }
};

const getBuildingEffectText = (type: BuildingType): string => {
  const config = getBuildingConfig(type);
  if (!config) return '';
  switch (type) {
    case 'sprinkler':
      return `自动为周围 ${config.effect.sprinklerRange} 格范围的地块浇水`;
    case 'greenhouse':
      return '范围内的地块突破季节限制，全年可种植任意作物，并保护作物免受恶劣天气影响';
    case 'barn':
      return `库存容量 +${config.effect.barnCapacityBonus}，并防止农产品腐坏`;
    default:
      return '';
  }
};

const getFootprintText = (width: number, height: number): string => {
  if (width === 1 && height === 1) return '1×1 格';
  return `${width}×${height} 格`;
};

const isSelected = (type: BuildingType): boolean => {
  return gameStore.selectedBuilding === type;
};

const cancelBuildMode = () => {
  gameStore.selectedBuilding = null;
};
</script>

<template>
  <div 
    v-if="gameStore.showBuildings || gameStore.selectedBuilding"
    class="fixed inset-0 z-50"
  >
    <div 
      v-if="gameStore.showBuildings"
      class="absolute inset-0 bg-black/50"
      @click.self="gameStore.showBuildings = false"
    >
      <div class="bg-farm-ui border-4 border-farm-wood-dark p-6 shadow-pixel w-[800px] max-h-[80vh] flex flex-col absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-pixel text-xl text-farm-wood-dark">🏗️ 建筑系统</h2>
          <button 
            class="font-pixel text-sm px-3 py-1 bg-farm-ui-dark border-2 border-farm-wood-dark hover:bg-farm-gold transition-colors"
            @click="gameStore.showBuildings = false"
          >
            ✕ 关闭
          </button>
        </div>

        <div class="flex gap-2 mb-4">
          <button 
            class="font-pixel text-sm px-6 py-2 border-2 border-farm-wood-dark transition-colors"
            :class="activeTab === 'build' ? 'bg-farm-gold' : 'bg-farm-ui-dark hover:bg-farm-gold/50'"
            @click="activeTab = 'build'"
          >
            🏗️ 建造
          </button>
          <button 
            class="font-pixel text-sm px-6 py-2 border-2 border-farm-wood-dark transition-colors"
            :class="activeTab === 'manage' ? 'bg-farm-gold' : 'bg-farm-ui-dark hover:bg-farm-gold/50'"
            @click="activeTab = 'manage'"
          >
            📋 管理 ({{ placedBuildings.length }})
          </button>
        </div>

        <div class="flex items-center gap-4 mb-4 p-3 bg-farm-ui-dark border-2 border-farm-wood-dark">
          <span class="text-2xl">💰</span>
          <span class="font-pixel text-lg text-farm-gold-dark">{{ gameStore.coins }} 金币</span>
          <span class="font-pixel text-xs text-farm-wood-dark/70 ml-4">
            已解锁地块: {{ gameStore.unlockedPlots }}
          </span>
        </div>

        <div class="flex-1 overflow-y-auto">
          <template v-if="activeTab === 'build'">
            <div class="space-y-3">
              <div 
                v-for="{ building, unlocked, canAfford } in buyableBuildings"
                :key="building.id"
                class="p-4 bg-farm-ui-dark border-2 border-farm-wood-dark transition-all"
                :class="{ 
                  'ring-2 ring-farm-gold bg-farm-gold/20': isSelected(building.id),
                  'opacity-50': !unlocked,
                  'hover:border-farm-gold': unlocked
                }"
                @mouseenter="hoveredBuildingType = building.id"
                @mouseleave="hoveredBuildingType = null"
              >
                <div class="flex items-start gap-4">
                  <div class="text-5xl">{{ building.icon }}</div>
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="font-pixel text-base text-farm-wood-dark">{{ building.name }}</span>
                      <span v-if="isSelected(building.id)" class="px-2 py-0.5 bg-farm-gold text-farm-wood-dark font-pixel text-[10px] border border-farm-wood-dark">
                        已选择
                      </span>
                      <span v-if="!unlocked" class="px-2 py-0.5 bg-red-400 text-white font-pixel text-[10px] border border-farm-wood-dark">
                        🔒 需要解锁 {{ building.unlockPlotCount }} 块地块
                      </span>
                    </div>
                    <div class="font-pixel text-[10px] text-farm-wood-dark/70 mb-2">
                      {{ building.description }}
                    </div>
                    <div class="font-pixel text-[10px] text-farm-green-dark mb-2">
                      ✨ {{ getBuildingEffectText(building.id) }}
                    </div>
                    <div class="flex items-center gap-4 font-pixel text-[10px] text-farm-wood-dark/70">
                      <span>📐 占地: {{ getFootprintText(building.footprint.width, building.footprint.height) }}</span>
                      <span>🎯 解锁条件: {{ building.unlockPlotCount }} 块地块</span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    <span class="font-pixel text-base text-farm-gold-dark">💰{{ building.price }}</span>
                    <button 
                      class="font-pixel text-xs px-4 py-2 border-2 border-farm-wood-dark transition-colors"
                      :class="[
                        isSelected(building.id)
                          ? 'bg-red-400 hover:bg-red-500 text-white'
                          : (unlocked && canAfford)
                            ? 'bg-farm-gold hover:bg-farm-gold-dark text-farm-wood-dark'
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      ]"
                      :disabled="!unlocked || !canAfford"
                      @click="isSelected(building.id) ? cancelBuildMode() : selectBuilding(building.id)"
                    >
                      {{ isSelected(building.id) ? '取消' : '选择建造' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="gameStore.selectedBuilding" class="mt-4 p-4 bg-farm-gold/30 border-2 border-farm-gold-dark text-center">
              <span class="font-pixel text-sm text-farm-wood-dark">
                ✅ 已选择 {{ getBuildingConfig(gameStore.selectedBuilding)?.name }}，点击地块放置！再次点击按钮可取消
              </span>
            </div>
          </template>

          <template v-else>
            <div v-if="placedBuildings.length > 0" class="space-y-3">
              <div 
                v-for="building in placedBuildings"
                :key="building.id"
                class="p-4 bg-farm-ui-dark border-2 border-farm-wood-dark"
              >
                <div class="flex items-start gap-4">
                  <div class="text-4xl">{{ building.config?.icon }}</div>
                  <div class="flex-1">
                    <div class="font-pixel text-sm text-farm-wood-dark mb-1">
                      {{ building.config?.name }}
                    </div>
                    <div class="font-pixel text-[10px] text-farm-wood-dark/70 mb-1">
                      位置: ({{ building.x }}, {{ building.y }})
                    </div>
                    <div class="font-pixel text-[10px] text-farm-wood-dark/50">
                      建造时间: {{ building.builtTime }}
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    <span class="font-pixel text-xs text-farm-gold-dark">
                      💰{{ Math.floor((building.config?.price || 0) * 0.5) }} (拆除返还)
                    </span>
                    <button 
                      class="font-pixel text-xs px-3 py-1 bg-red-400 border-2 border-farm-wood-dark hover:bg-red-500 transition-colors text-white"
                      @click="demolishBuilding(building.id)"
                    >
                      拆除
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-12">
              <span class="text-4xl">🏗️</span>
              <p class="font-pixel text-sm text-farm-wood-dark mt-2">还没有建造任何建筑</p>
              <p class="font-pixel text-[10px] text-farm-wood-dark/60 mt-1">去"建造"标签页选择建筑吧！</p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div 
      v-if="gameStore.selectedBuilding"
      class="absolute bottom-24 left-1/2 -translate-x-1/2 bg-farm-ui border-4 border-farm-gold-dark px-6 py-3 shadow-pixel"
    >
      <div class="flex items-center gap-4">
        <span class="text-3xl">{{ getBuildingConfig(gameStore.selectedBuilding)?.icon }}</span>
        <div class="flex flex-col">
          <span class="font-pixel text-sm text-farm-wood-dark">
            建造模式: {{ getBuildingConfig(gameStore.selectedBuilding)?.name }}
          </span>
          <span class="font-pixel text-[10px] text-farm-wood-dark/70">
            点击地块放置，或按 ESC / 点击取消按钮退出
          </span>
        </div>
        <button 
          class="font-pixel text-xs px-3 py-1 bg-red-400 border-2 border-farm-wood-dark hover:bg-red-500 transition-colors text-white ml-4"
          @click="cancelBuildMode"
        >
          ✕ 取消
        </button>
      </div>
    </div>
  </div>
</template>
