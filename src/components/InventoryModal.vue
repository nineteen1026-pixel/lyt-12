<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { getItem } from '../game/data/items';

const gameStore = useGameStore();

const inventoryItems = computed(() => {
  if (!gameStore.inventory) return [];
  const items = gameStore.inventory.getItems();
  const result: Array<{ itemId: string; quantity: number; item: any }> = [];
  items.forEach((quantity, itemId) => {
    const item = getItem(itemId);
    if (item) {
      result.push({ itemId, quantity, item });
    }
  });
  return result;
});

const gridItems = computed(() => {
  const items = [...inventoryItems.value];
  while (items.length < 36) {
    items.push({ itemId: '', quantity: 0, item: null });
  }
  return items;
});

const totalValue = computed(() => {
  return inventoryItems.value.reduce((sum, inv) => {
    return sum + (inv.item?.sellPrice || 0) * inv.quantity;
  }, 0);
});

const sellItem = (itemId: string, quantity: number) => {
  if (itemId) {
    gameStore.sellItem(itemId, quantity);
  }
};
</script>

<template>
  <div 
    v-if="gameStore.showInventory" 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="gameStore.showInventory = false"
  >
    <div class="bg-farm-ui border-4 border-farm-wood-dark p-6 shadow-pixel w-[600px]">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-pixel text-xl text-farm-wood-dark">🎒 背包</h2>
        <button 
          class="font-pixel text-sm px-3 py-1 bg-farm-ui-dark border-2 border-farm-wood-dark hover:bg-farm-gold transition-colors"
          @click="gameStore.showInventory = false"
        >
          ✕ 关闭
        </button>
      </div>
      
      <div class="grid grid-cols-6 gap-2 mb-4">
        <div 
          v-for="(inv, index) in gridItems" 
          :key="index"
          class="aspect-square bg-farm-ui-dark border-2 border-farm-wood-dark flex flex-col items-center justify-center relative"
          :class="{ 'cursor-pointer hover:border-farm-gold': inv.itemId }"
          @click="inv.itemId && sellItem(inv.itemId, 1)"
        >
          <span v-if="inv.item" class="text-2xl">{{ inv.item.icon }}</span>
          <span v-if="inv.quantity > 0" class="absolute bottom-1 right-1 font-pixel text-[10px] text-farm-wood-dark">
            {{ inv.quantity }}
          </span>
        </div>
      </div>
      
      <div v-if="inventoryItems.length > 0" class="flex items-center justify-between border-t-2 border-farm-wood-dark pt-4">
        <div class="font-pixel text-sm text-farm-wood-dark">
          总价值: <span class="text-farm-gold-dark">💰{{ totalValue }}</span>
        </div>
        <button 
          class="font-pixel text-xs px-4 py-2 bg-farm-gold border-2 border-farm-wood-dark hover:bg-farm-gold-dark transition-colors text-farm-wood-dark"
          @click="gameStore.sellAllItems()"
        >
          一键出售全部
        </button>
      </div>
      
      <div v-else class="text-center py-8">
        <span class="text-4xl">📭</span>
        <p class="font-pixel text-sm text-farm-wood-dark mt-2">背包是空的</p>
      </div>
      
      <p class="font-pixel text-[10px] text-farm-wood-dark/60 mt-4 text-center">
        点击物品可单个出售
      </p>
    </div>
  </div>
</template>
