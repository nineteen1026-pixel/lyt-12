<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { getCropConfig } from '../game/data/crops';
import { QUALITY_COLORS, QUALITY_NAMES } from '../game/types/game';
import type { QualityGrade } from '../game/types/game';

const gameStore = useGameStore();
const activeTab = ref<'buy' | 'sell'>('buy');
const buyQuantity = ref<Record<string, number>>({});

const buyItems = computed(() => {
  if (!gameStore.shop) return [];
  return gameStore.shop.getBuyableItems();
});

const sellItems = computed(() => {
  if (!gameStore.shop) return [];
  return gameStore.shop.getSellableItems();
});

const expandPrice = computed(() => {
  return gameStore.shop?.getExpandPlotPrice() || -1;
});

const canExpand = computed(() => {
  return gameStore.shop?.canExpandPlot() || false;
});

const getQuantity = (itemId: string) => buyQuantity.value[itemId] || 1;

const setQuantity = (itemId: string, value: number) => {
  buyQuantity.value[itemId] = Math.max(1, value);
};

const buy = (itemId: string) => {
  const qty = getQuantity(itemId);
  gameStore.buyItem(itemId, qty);
};

const sell = (itemId: string, quantity: number, quality?: QualityGrade) => {
  gameStore.sellItem(itemId, quantity, quality);
};

const expand = () => {
  gameStore.expandPlot();
};

const getCropForSeed = (itemId: string) => {
  const cropType = itemId.replace('_seed', '');
  return getCropConfig(cropType);
};
</script>

<template>
  <div 
    v-if="gameStore.showShop" 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="gameStore.showShop = false"
  >
    <div class="bg-farm-ui border-4 border-farm-wood-dark p-6 shadow-pixel w-[700px] max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-pixel text-xl text-farm-wood-dark">🏪 农场商店</h2>
        <button 
          class="font-pixel text-sm px-3 py-1 bg-farm-ui-dark border-2 border-farm-wood-dark hover:bg-farm-gold transition-colors"
          @click="gameStore.showShop = false"
        >
          ✕ 关闭
        </button>
      </div>
      
      <div class="flex gap-2 mb-4">
        <button 
          class="font-pixel text-sm px-6 py-2 border-2 border-farm-wood-dark transition-colors"
          :class="activeTab === 'buy' ? 'bg-farm-gold' : 'bg-farm-ui-dark hover:bg-farm-gold/50'"
          @click="activeTab = 'buy'"
        >
          🛒 购买
        </button>
        <button 
          class="font-pixel text-sm px-6 py-2 border-2 border-farm-wood-dark transition-colors"
          :class="activeTab === 'sell' ? 'bg-farm-gold' : 'bg-farm-ui-dark hover:bg-farm-gold/50'"
          @click="activeTab = 'sell'"
        >
          💰 出售
        </button>
      </div>
      
      <div class="flex items-center gap-4 mb-4 p-3 bg-farm-ui-dark border-2 border-farm-wood-dark">
        <span class="text-2xl">💰</span>
        <span class="font-pixel text-lg text-farm-gold-dark">{{ gameStore.coins }} 金币</span>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        <template v-if="activeTab === 'buy'">
          <div class="space-y-3">
            <div 
              v-for="{ item, canAfford } in buyItems" 
              :key="item.id"
              class="flex items-center gap-4 p-3 bg-farm-ui-dark border-2 border-farm-wood-dark"
            >
              <span class="text-3xl">{{ item.icon }}</span>
              <div class="flex-1">
                <div class="font-pixel text-sm text-farm-wood-dark">{{ item.name }}</div>
                <div class="font-pixel text-[10px] text-farm-wood-dark/70 mt-1">
                  {{ item.description }}
                  <span v-if="item.type === 'seed' && getCropForSeed(item.id)" class="ml-2">
                    生长: {{ Math.round(getCropForSeed(item.id)!.growthTime / 1000) }}秒
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-pixel text-sm text-farm-gold-dark">💰{{ item.price }}</span>
                <div class="flex items-center gap-1">
                  <button 
                    class="w-6 h-6 bg-farm-wood-dark text-white font-pixel text-xs"
                    @click="setQuantity(item.id, getQuantity(item.id) - 1)"
                  >-</button>
                  <span class="w-8 text-center font-pixel text-sm">{{ getQuantity(item.id) }}</span>
                  <button 
                    class="w-6 h-6 bg-farm-wood-dark text-white font-pixel text-xs"
                    @click="setQuantity(item.id, getQuantity(item.id) + 1)"
                  >+</button>
                </div>
                <button 
                  class="font-pixel text-xs px-3 py-2 border-2 border-farm-wood-dark transition-colors"
                  :class="canAfford ? 'bg-farm-gold hover:bg-farm-gold-dark text-farm-wood-dark' : 'bg-gray-400 text-gray-600 cursor-not-allowed'"
                  :disabled="!canAfford"
                  @click="buy(item.id)"
                >
                  购买
                </button>
              </div>
            </div>
            
            <div 
              v-if="expandPrice > 0"
              class="flex items-center gap-4 p-3 bg-farm-gold/30 border-2 border-farm-wood-dark"
            >
              <span class="text-3xl">🌾</span>
              <div class="flex-1">
                <div class="font-pixel text-sm text-farm-wood-dark">扩展地块</div>
                <div class="font-pixel text-[10px] text-farm-wood-dark/70 mt-1">
                  解锁一块相邻的新耕地
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-pixel text-sm text-farm-gold-dark">💰{{ expandPrice }}</span>
                <button 
                  class="font-pixel text-xs px-4 py-2 border-2 border-farm-wood-dark transition-colors"
                  :class="canExpand ? 'bg-farm-gold hover:bg-farm-gold-dark text-farm-wood-dark' : 'bg-gray-400 text-gray-600 cursor-not-allowed'"
                  :disabled="!canExpand"
                  @click="expand"
                >
                  解锁
                </button>
              </div>
            </div>
          </div>
        </template>
        
        <template v-else>
          <div v-if="sellItems.length > 0" class="space-y-3">
            <div 
              v-for="{ item, quantity, sellPrice, quality } in sellItems" 
              :key="`${item.id}_q${quality}`"
              class="flex items-center gap-4 p-3 bg-farm-ui-dark border-2 border-farm-wood-dark"
              :style="{ borderLeftColor: QUALITY_COLORS[quality], borderLeftWidth: '4px' }"
            >
              <span class="text-3xl">{{ item.icon }}</span>
              <div class="flex-1">
                <div class="font-pixel text-sm text-farm-wood-dark">{{ item.name }}</div>
                <div class="font-pixel text-[10px] text-farm-wood-dark/70 mt-1">
                  库存: {{ quantity }}
                  <span class="ml-2" :style="{ color: QUALITY_COLORS[quality] }">
                    {{ '★'.repeat(quality) }}{{ QUALITY_NAMES[quality] }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-pixel text-sm text-farm-gold-dark">💰{{ sellPrice }}/个</span>
                <button 
                  class="font-pixel text-xs px-3 py-2 bg-farm-gold border-2 border-farm-wood-dark hover:bg-farm-gold-dark transition-colors text-farm-wood-dark"
                  @click="sell(item.id, 1, quality)"
                >
                  卖1个
                </button>
                <button 
                  v-if="quantity > 1"
                  class="font-pixel text-xs px-3 py-2 bg-farm-gold border-2 border-farm-wood-dark hover:bg-farm-gold-dark transition-colors text-farm-wood-dark"
                  @click="sell(item.id, quantity, quality)"
                >
                  全卖
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12">
            <span class="text-4xl">📦</span>
            <p class="font-pixel text-sm text-farm-wood-dark mt-2">没有可出售的物品</p>
            <p class="font-pixel text-[10px] text-farm-wood-dark/60 mt-1">去种植作物或养殖动物吧！</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
