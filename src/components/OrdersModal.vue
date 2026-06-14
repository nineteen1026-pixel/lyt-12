<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { getItem } from '../game/data/items';
import { getVillagerById, TIER_CONFIG, REPUTATION_LEVELS } from '../game/data/orders';
import type { Order, OrderTier } from '../game/types/game';
import { DAY_DURATION } from '../game/types/game';

const gameStore = useGameStore();
const activeTab = ref<'active' | 'history'>('active');
const tick = ref(0);
let timer: number | null = null;

onMounted(() => {
  timer = window.setInterval(() => {
    tick.value++;
  }, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});

const orders = computed(() => {
  if (!gameStore.orders) return [];
  tick.value;
  if (activeTab.value === 'active') {
    return gameStore.orders.getActiveOrders();
  }
  return [
    ...gameStore.orders.getCompletedOrders(),
    ...gameStore.orders.getFailedOrders()
  ].sort((a, b) => b.createdAt - a.createdAt);
});

const reputation = computed(() => gameStore.reputation);
const repLevelInfo = computed(() => gameStore.reputationLevelInfo);

const nextLevelProgress = computed(() => {
  const current = REPUTATION_LEVELS.find(l => l.level === repLevelInfo.value.level) || REPUTATION_LEVELS[0];
  const next = REPUTATION_LEVELS.find(l => l.level === repLevelInfo.value.level + 1);
  if (!next) return { percent: 100, current: reputation.value.score, max: current.minScore, showMax: false };
  const progress = reputation.value.score - current.minScore;
  const total = next.minScore - current.minScore;
  return { 
    percent: Math.min(100, Math.floor((progress / total) * 100)), 
    current: reputation.value.score, 
    max: next.minScore,
    showMax: true
  };
});

const getVillager = (villagerId: string) => getVillagerById(villagerId);

const getItemData = (itemId: string) => getItem(itemId);

const getTierInfo = (tier: OrderTier) => TIER_CONFIG[tier];

const formatTimeRemaining = (deadline: number) => {
  const remaining = Math.max(0, deadline - Date.now());
  const gameDays = remaining / DAY_DURATION;
  
  if (gameDays >= 1) {
    const wholeDays = Math.floor(gameDays);
    const dayProgress = (gameDays - wholeDays) * 100;
    return {
      text: `${wholeDays + 1} 天`,
      subText: `约 ${wholeDays}天多`,
      showProgress: false,
      progress: 0
    };
  }
  
  if (remaining > 0) {
    const seconds = Math.ceil(remaining / 1000);
    const dayPercent = (remaining / DAY_DURATION) * 100;
    return {
      text: `今日内到期`,
      subText: `剩 ${seconds} 秒`,
      showProgress: true,
      progress: dayPercent
    };
  }
  
  return {
    text: `已过期`,
    subText: '',
    showProgress: false,
    progress: 0
  };
};

const getUrgency = (order: Order) => {
  const remaining = order.deadline - Date.now();
  const totalDuration = order.deadline - order.createdAt;
  const ratio = remaining / totalDuration;
  if (ratio <= 0) return 'expired';
  if (ratio < 0.2) return 'urgent';
  if (ratio < 0.5) return 'warning';
  return 'normal';
};

const canSubmit = (order: Order) => {
  const result = gameStore.canSubmitOrder(order.id);
  return result.canSubmit;
};

const getMissingItems = (order: Order) => {
  const result = gameStore.canSubmitOrder(order.id);
  return result.missingItems;
};

const getInventoryCount = (itemId: string) => {
  return gameStore.inventory?.getItemCount(itemId) || 0;
};

const submit = (orderId: string) => {
  gameStore.submitOrder(orderId);
};

const refreshOrders = () => {
  if (confirm('强制刷新会让当前未完成的订单全部违约，扣除信誉！确定刷新吗？')) {
    gameStore.refreshOrdersNow();
  }
};
</script>

<template>
  <div 
    v-if="gameStore.showOrders" 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="gameStore.showOrders = false"
  >
    <div class="bg-farm-ui border-4 border-farm-wood-dark p-6 shadow-pixel w-[750px] max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-pixel text-xl text-farm-wood-dark">📜 村民委托</h2>
        <button 
          class="font-pixel text-sm px-3 py-1 bg-farm-ui-dark border-2 border-farm-wood-dark hover:bg-farm-gold transition-colors"
          @click="gameStore.showOrders = false"
        >
          ✕ 关闭
        </button>
      </div>

      <div class="mb-4 p-4 bg-farm-ui-dark border-2 border-farm-wood-dark">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <span class="text-3xl">⭐</span>
            <div>
              <div class="font-pixel text-sm text-farm-wood-dark">
                信誉等级: Lv.{{ repLevelInfo.level }} - {{ repLevelInfo.name }}
              </div>
              <div class="font-pixel text-[10px] text-farm-wood-dark/70 mt-1">
                完成: {{ reputation.completedOrders }} | 违约: {{ reputation.failedOrders }}
                <span v-if="repLevelInfo.seedBoost > 0" class="ml-2 text-green-700">
                  稀有种子掉率 +{{ Math.floor(repLevelInfo.seedBoost * 100) }}%
                </span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-pixel text-sm text-farm-gold-dark">{{ reputation.score }} 信誉分</div>
          </div>
        </div>
        <div class="w-full h-3 bg-farm-wood-dark/30 border border-farm-wood-dark overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
            :style="{ width: `${nextLevelProgress.percent}%` }"
          ></div>
        </div>
        <div v-if="nextLevelProgress.showMax" class="font-pixel text-[10px] text-farm-wood-dark/60 mt-1 text-right">
          下一级: {{ nextLevelProgress.max }} 分
        </div>
      </div>
      
      <div class="flex gap-2 mb-4">
        <button 
          class="font-pixel text-sm px-6 py-2 border-2 border-farm-wood-dark transition-colors"
          :class="activeTab === 'active' ? 'bg-farm-gold' : 'bg-farm-ui-dark hover:bg-farm-gold/50'"
          @click="activeTab = 'active'"
        >
          📋 当前委托 ({{ gameStore.activeOrderCount }})
        </button>
        <button 
          class="font-pixel text-sm px-6 py-2 border-2 border-farm-wood-dark transition-colors"
          :class="activeTab === 'history' ? 'bg-farm-gold' : 'bg-farm-ui-dark hover:bg-farm-gold/50'"
          @click="activeTab = 'history'"
        >
          📖 历史记录
        </button>
        <div class="flex-1"></div>
        <button 
          v-if="activeTab === 'active'"
          class="font-pixel text-xs px-4 py-2 bg-red-500/80 text-white border-2 border-farm-wood-dark hover:bg-red-600 transition-colors"
          @click="refreshOrders"
        >
          🔄 强制刷新
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="orders.length > 0" class="space-y-3">
          <div 
            v-for="order in orders" 
            :key="order.id"
            class="border-2 border-farm-wood-dark overflow-hidden"
            :class="{
              'bg-farm-ui-dark': order.status !== 'completed',
              'bg-green-50': order.status === 'completed',
              'bg-red-50': order.status === 'failed'
            }"
          >
            <div 
              class="p-3 flex items-center gap-3 border-b-2 border-farm-wood-dark"
              :style="{ borderLeft: `4px solid ${getTierInfo(order.tier).color}` }"
            >
              <span class="text-3xl">{{ getVillager(order.villagerId)?.avatar || '👤' }}</span>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-pixel text-sm text-farm-wood-dark">
                    {{ getVillager(order.villagerId)?.name || '村民' }}
                  </span>
                  <span 
                    class="font-pixel text-[10px] px-2 py-0.5 text-white"
                    :style="{ backgroundColor: getTierInfo(order.tier).color }"
                  >
                    {{ getTierInfo(order.tier).name }}
                  </span>
                </div>
                <div class="font-pixel text-[10px] text-farm-wood-dark/60 mt-0.5">
                  订单号: {{ order.id.slice(-8) }}
                </div>
              </div>
              <div class="text-right min-w-[90px]">
                <template v-if="order.status === 'active'">
                  <div 
                    class="font-pixel text-sm"
                    :class="{
                      'text-red-600 animate-pulse': getUrgency(order) === 'urgent',
                      'text-orange-500': getUrgency(order) === 'warning',
                      'text-farm-wood-dark': getUrgency(order) === 'normal',
                      'text-gray-500 line-through': getUrgency(order) === 'expired'
                    }"
                  >
                    ⏰ {{ formatTimeRemaining(order.deadline).text }}
                  </div>
                  <div 
                    v-if="formatTimeRemaining(order.deadline).subText" 
                    class="font-pixel text-[10px] text-farm-wood-dark/60 mt-0.5"
                  >
                    {{ formatTimeRemaining(order.deadline).subText }}
                  </div>
                  <div 
                    v-if="formatTimeRemaining(order.deadline).showProgress"
                    class="w-full h-1.5 bg-farm-wood-dark/20 mt-1.5 overflow-hidden rounded-none"
                  >
                    <div 
                      class="h-full transition-all duration-1000 ease-linear"
                      :class="{
                        'bg-red-500': getUrgency(order) === 'urgent' || getUrgency(order) === 'expired',
                        'bg-orange-400': getUrgency(order) === 'warning',
                        'bg-green-500': getUrgency(order) === 'normal'
                      }"
                      :style="{ width: `${formatTimeRemaining(order.deadline).progress}%` }"
                    ></div>
                  </div>
                </template>
                <div v-else-if="order.status === 'completed'" class="font-pixel text-xs text-green-600">
                  ✅ 已完成
                </div>
                <div v-else class="font-pixel text-xs text-red-600">
                  ❌ 已违约
                </div>
              </div>
            </div>

            <div class="p-3">
              <div class="mb-3">
                <div class="font-pixel text-[10px] text-farm-wood-dark/70 mb-2">📦 需要交付:</div>
                <div class="space-y-1">
                  <div 
                    v-for="item in order.items" 
                    :key="item.itemId"
                    class="flex items-center gap-3 p-2 bg-farm-ui border border-farm-wood-dark/50"
                  >
                    <span class="text-2xl">{{ getItemData(item.itemId)?.icon || '❓' }}</span>
                    <div class="flex-1">
                      <div class="font-pixel text-xs text-farm-wood-dark">
                        {{ getItemData(item.itemId)?.name || item.itemId }}
                      </div>
                    </div>
                    <div class="font-pixel text-xs">
                      <span 
                        v-if="order.status === 'active'"
                        :class="getInventoryCount(item.itemId) >= item.quantity ? 'text-green-600' : 'text-red-600'"
                      >
                        {{ getInventoryCount(item.itemId) }}
                      </span>
                      <span class="text-farm-wood-dark"> / {{ item.quantity }}</span>
                    </div>
                  </div>
                </div>
                <div 
                  v-if="order.status === 'active' && getMissingItems(order).length > 0" 
                  class="mt-2 font-pixel text-[10px] text-red-600"
                >
                  缺少: 
                  <span v-for="(m, i) in getMissingItems(order)" :key="m.itemId">
                    {{ getItemData(m.itemId)?.name }} x{{ m.quantity }}<span v-if="i < getMissingItems(order).length - 1">，</span>
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-farm-wood-dark/30">
                <div class="space-y-1">
                  <div class="font-pixel text-[10px] text-farm-wood-dark/70">🎁 奖励:</div>
                  <div class="flex items-center gap-3 flex-wrap">
                    <span class="font-pixel text-xs text-farm-gold-dark">
                      💰 {{ order.reward.coins }}
                    </span>
                    <span class="font-pixel text-xs text-purple-600">
                      ⭐ +{{ order.reward.reputation }}
                    </span>
                    <span 
                      v-if="order.reward.rareSeedId && order.reward.rareSeedQuantity" 
                      class="font-pixel text-xs text-blue-600"
                    >
                      {{ getItemData(order.reward.rareSeedId)?.icon }}
                      {{ getItemData(order.reward.rareSeedId)?.name }} x{{ order.reward.rareSeedQuantity }}
                    </span>
                  </div>
                </div>
                <button 
                  v-if="order.status === 'active'"
                  class="font-pixel text-xs px-5 py-2 border-2 border-farm-wood-dark transition-colors"
                  :class="canSubmit(order) 
                    ? 'bg-farm-gold hover:bg-farm-gold-dark text-farm-wood-dark' 
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'"
                  :disabled="!canSubmit(order)"
                  @click="submit(order.id)"
                >
                  交付
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12">
          <span class="text-5xl">📭</span>
          <p class="font-pixel text-sm text-farm-wood-dark mt-4">
            {{ activeTab === 'active' ? '当前没有进行中的委托' : '还没有任何历史记录' }}
          </p>
          <p class="font-pixel text-[10px] text-farm-wood-dark/60 mt-2">
            {{ activeTab === 'active' ? '新的一天会自动刷新委托哦~' : '完成村民委托赚取金币和信誉吧！' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
