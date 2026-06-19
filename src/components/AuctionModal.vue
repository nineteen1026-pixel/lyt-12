<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { RARITY_COLORS, RARITY_NAMES, QUALITY_NAMES } from '../game/types/game';
import { getAuctionRarityColor, getAuctionRarityName } from '../game/data/auction';

const gameStore = useGameStore();
const bidAmount = ref<Record<string, number>>({});
const timeRemaining = ref(0);
const activeTab = ref<'current' | 'history' | 'info'>('current');
let timer: number | null = null;

const currentItem = computed(() => {
  return gameStore.auction?.getCurrentItem() || null;
});

const auctionItems = computed(() => {
  return gameStore.auction?.getItems() || [];
});

const currentIndex = computed(() => {
  return gameStore.auction?.getCurrentItemIndex() || 0;
});

const auctionStatus = computed(() => {
  return gameStore.auction?.getStatus() || 'upcoming';
});

const isPlayerWinning = computed(() => {
  return gameStore.auction?.isPlayerWinning() || false;
});

const economicBalance = computed(() => {
  return gameStore.auction?.getEconomicBalanceFactor() || 1.0;
});

const wonItems = computed(() => {
  return gameStore.auction?.getWonItems() || [];
});

const totalAuctionsHeld = computed(() => {
  return gameStore.auction?.getTotalAuctionsHeld() || 0;
});

const totalAuctionsWon = computed(() => {
  return gameStore.auction?.getTotalAuctionsWon() || 0;
});

const totalCoinsSpent = computed(() => {
  return gameStore.auction?.getTotalCoinsSpent() || 0;
});

const isWeekend = computed(() => {
  return gameStore.auction?.isWeekend(gameStore.day) || false;
});

const canStartAuction = computed(() => {
  return gameStore.auction?.canStartAuction(gameStore.day) || false;
});

const getBidAmount = (itemId: string) => bidAmount.value[itemId] || 0;

const setBidAmount = (itemId: string, value: number) => {
  const item = auctionItems.value.find(i => i.id === itemId);
  if (!item) return;
  const minBid = item.currentBid + item.minBidIncrement;
  bidAmount.value[itemId] = Math.max(minBid, value);
};

const updateTimeRemaining = () => {
  if (gameStore.auction) {
    timeRemaining.value = gameStore.auction.getTimeRemaining();
  }
};

const formatTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const handleQuickBid = () => {
  if (!currentItem.value) return;
  const result = gameStore.placeQuickBid();
  if (result.success) {
    bidAmount.value[currentItem.value.id] = result.newBid || 0;
    gameStore.saveGame();
  }
};

const handlePlaceBid = () => {
  if (!currentItem.value) return;
  const amount = getBidAmount(currentItem.value.id);
  if (amount <= 0) return;
  const result = gameStore.placeBid(amount);
  if (result.success) {
    gameStore.saveGame();
  }
};

const handleBidInput = (e: Event) => {
  if (!currentItem.value) return;
  const target = e.target as HTMLInputElement;
  const value = parseInt(target.value) || 0;
  setBidAmount(currentItem.value.id, value);
};

const handleStartAuction = () => {
  const result = gameStore.startAuction();
  if (result.success && result.items && result.items.length > 0) {
    for (const item of result.items) {
      bidAmount.value[item.id] = item.startingPrice + item.minBidIncrement;
    }
    gameStore.saveGame();
  }
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

const getDayOfWeek = (): number => {
  return ((gameStore.day - 1) % 7) + 1;
};

const getDayName = (dayNum: number): string => {
  const names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return names[dayNum - 1] || '';
};

onMounted(() => {
  updateTimeRemaining();
  timer = window.setInterval(() => {
    updateTimeRemaining();
    if (auctionStatus.value === 'active') {
      if (timeRemaining.value <= 0) {
        handleAuctionItemEnd();
      } else if (Math.random() < 0.3) {
        gameStore.simulateAuctionNPBid();
      }
    }
  }, 1000);
});

const handleAuctionItemEnd = () => {
  if (!gameStore.auction) return;
  gameStore.settleAuctionCurrentItem();
  const hasMore = gameStore.nextAuctionItem();
  if (!hasMore) {
    gameStore.endAuction();
  }
};

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});

watch(() => currentItem.value?.id, (newId) => {
  if (newId) {
    const item = auctionItems.value.find(i => i.id === newId);
    if (item && !bidAmount.value[newId]) {
      bidAmount.value[newId] = item.currentBid + item.minBidIncrement;
    }
  }
});
</script>

<template>
  <div 
    v-if="gameStore.showAuction" 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="gameStore.showAuction = false"
  >
    <div class="bg-farm-ui border-4 border-farm-wood-dark p-6 shadow-pixel w-[750px] max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-pixel text-xl text-farm-wood-dark">🎪 周末集市拍卖会</h2>
        <button 
          class="font-pixel text-sm px-3 py-1 bg-farm-ui-dark border-2 border-farm-wood-dark hover:bg-farm-gold transition-colors"
          @click="gameStore.showAuction = false"
        >
          ✕ 关闭
        </button>
      </div>

      <div class="flex items-center gap-4 mb-4 p-3 bg-farm-ui-dark border-2 border-farm-wood-dark">
        <span class="text-2xl">💰</span>
        <span class="font-pixel text-lg text-farm-gold-dark">{{ gameStore.coins }} 金币</span>
        <div class="flex-1"></div>
        <div class="flex items-center gap-2">
          <span class="text-xl">📊</span>
          <span class="font-pixel text-xs text-farm-wood-dark">
            经济指数: 
            <span :class="{
              'text-green-600': economicBalance < 1,
              'text-yellow-600': economicBalance === 1,
              'text-red-600': economicBalance > 1
            }">
              {{ (economicBalance * 100).toFixed(0) }}%
            </span>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xl">📅</span>
          <span class="font-pixel text-xs text-farm-wood-dark">
            {{ getDayName(getDayOfWeek()) }} (第{{ gameStore.day }}天)
          </span>
        </div>
      </div>

      <div class="flex gap-2 mb-4">
        <button 
          class="font-pixel text-sm px-6 py-2 border-2 border-farm-wood-dark transition-colors"
          :class="activeTab === 'current' ? 'bg-farm-gold' : 'bg-farm-ui-dark hover:bg-farm-gold/50'"
          @click="activeTab = 'current'"
        >
          🔨 拍卖中
        </button>
        <button 
          class="font-pixel text-sm px-6 py-2 border-2 border-farm-wood-dark transition-colors"
          :class="activeTab === 'history' ? 'bg-farm-gold' : 'bg-farm-ui-dark hover:bg-farm-gold/50'"
          @click="activeTab = 'history'"
        >
          📜 历史记录
        </button>
        <button 
          class="font-pixel text-sm px-6 py-2 border-2 border-farm-wood-dark transition-colors"
          :class="activeTab === 'info' ? 'bg-farm-gold' : 'bg-farm-ui-dark hover:bg-farm-gold/50'"
          @click="activeTab = 'info'"
        >
          ℹ️ 拍卖说明
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <template v-if="activeTab === 'current'">
          <div v-if="auctionStatus === 'upcoming' && !isWeekend" class="text-center py-12">
            <span class="text-5xl">📅</span>
            <p class="font-pixel text-sm text-farm-wood-dark mt-4">拍卖会只在周末开放哦！</p>
            <p class="font-pixel text-[10px] text-farm-wood-dark/60 mt-2">今天是 {{ getDayName(getDayOfWeek()) }}，耐心等待周末吧~</p>
          </div>

          <div v-else-if="auctionStatus === 'upcoming' && canStartAuction" class="text-center py-12">
            <span class="text-5xl">🎉</span>
            <p class="font-pixel text-sm text-farm-wood-dark mt-4">周末到啦！拍卖会即将开始！</p>
            <p class="font-pixel text-[10px] text-farm-wood-dark/60 mt-2">点击下方按钮开始今日的拍卖会</p>
            <button 
              class="mt-6 font-pixel text-sm px-8 py-3 bg-farm-gold border-2 border-farm-wood-dark hover:bg-farm-gold-dark transition-colors text-farm-wood-dark"
              @click="handleStartAuction"
            >
              🎪 开始拍卖会
            </button>
          </div>

          <div v-else-if="auctionStatus === 'ended'" class="text-center py-12">
            <span class="text-5xl">🏁</span>
            <p class="font-pixel text-sm text-farm-wood-dark mt-4">今日的拍卖会已结束</p>
            <p class="font-pixel text-[10px] text-farm-wood-dark/60 mt-2">下次拍卖会在下周周末哦~</p>
            <div class="mt-6 p-4 bg-farm-ui-dark border-2 border-farm-wood-dark inline-block text-left">
              <p class="font-pixel text-xs text-farm-wood-dark">
                本次拍卖: {{ totalAuctionsWon }} / {{ auctionItems.length }} 件物品
              </p>
              <p class="font-pixel text-xs text-farm-wood-dark mt-1">
                共花费: {{ totalCoinsSpent }} 金币
              </p>
            </div>
          </div>

          <div v-else-if="auctionStatus === 'active' && currentItem" class="space-y-4">
            <div class="p-4 bg-farm-ui-dark border-2 border-farm-wood-dark">
              <div class="flex items-center justify-between mb-3">
                <span class="font-pixel text-xs text-farm-wood-dark">
                  第 {{ currentIndex + 1 }} / {{ auctionItems.length }} 件
                </span>
                <div 
                  class="px-3 py-1 border-2 border-farm-wood-dark font-pixel text-xs"
                  :class="timeRemaining < 10000 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-farm-gold/30 text-farm-wood-dark'"
                >
                  ⏱️ {{ formatTime(timeRemaining) }}
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div 
                  class="w-20 h-20 flex items-center justify-center text-5xl border-4 bg-farm-ui"
                  :style="{ borderColor: getAuctionRarityColor(currentItem.rarity) }"
                >
                  {{ currentItem.icon }}
                </div>

                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-pixel text-base text-farm-wood-dark font-bold">
                      {{ currentItem.name }}
                    </span>
                    <span 
                      class="font-pixel text-[10px] px-2 py-0.5 border border-farm-wood-dark"
                      :style="{ backgroundColor: getAuctionRarityColor(currentItem.rarity) + '20', color: getAuctionRarityColor(currentItem.rarity) }"
                    >
                      {{ getAuctionRarityName(currentItem.rarity) }}
                    </span>
                  </div>
                  <p class="font-pixel text-[10px] text-farm-wood-dark/70 mb-2">
                    {{ currentItem.description }}
                  </p>

                  <div v-if="currentItem.itemId && currentItem.itemQuantity" class="font-pixel text-[10px] text-farm-wood-dark/80">
                    物品: {{ currentItem.itemQuantity }} 个
                    <span v-if="currentItem.itemQuality" class="ml-2">
                      品质: {{ QUALITY_NAMES[currentItem.itemQuality] }}
                    </span>
                  </div>

                  <div v-if="currentItem.bonusReputation" class="font-pixel text-[10px] text-farm-gold-dark">
                    额外声望: +{{ currentItem.bonusReputation }}
                  </div>

                  <div v-if="currentItem.bonusCoins" class="font-pixel text-[10px] text-yellow-600">
                    额外金币: +{{ currentItem.bonusCoins }}
                  </div>

                  <div v-if="currentItem.bonusAffinity && currentItem.bonusAffinity.length > 0" class="font-pixel text-[10px] text-pink-600">
                    村民好感度: 全体 +{{ currentItem.bonusAffinity[0]?.amount || 0 }}
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t-2 border-farm-wood-dark/30">
                <div class="flex items-center justify-between mb-3">
                  <span class="font-pixel text-sm text-farm-wood-dark">当前出价</span>
                  <div class="flex items-center gap-2">
                    <span class="font-pixel text-xl text-farm-gold-dark font-bold">
                      💰 {{ currentItem.currentBid }}
                    </span>
                    <span 
                      v-if="isPlayerWinning"
                      class="font-pixel text-[10px] px-2 py-0.5 bg-green-100 text-green-700 border border-green-500"
                    >
                      ✓ 你领先
                    </span>
                    <span 
                      v-else
                      class="font-pixel text-[10px] px-2 py-0.5 bg-red-100 text-red-700 border border-red-500"
                    >
                      ✗ 被超越
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-2">
                    <button 
                      class="w-8 h-8 bg-farm-wood-dark text-white font-pixel text-sm"
                      @click="setBidAmount(currentItem.id, getBidAmount(currentItem.id) - currentItem.minBidIncrement)"
                    >-</button>
                    <input 
                      type="number"
                      :value="getBidAmount(currentItem!.id)"
                      @input="handleBidInput"
                      class="w-24 h-8 text-center font-pixel text-sm border-2 border-farm-wood-dark bg-farm-ui"
                    />
                    <button 
                      class="w-8 h-8 bg-farm-wood-dark text-white font-pixel text-sm"
                      @click="setBidAmount(currentItem.id, getBidAmount(currentItem.id) + currentItem.minBidIncrement)"
                    >+</button>
                  </div>

                  <button 
                    class="flex-1 font-pixel text-sm py-2 border-2 border-farm-wood-dark transition-colors"
                    :class="gameStore.coins >= getBidAmount(currentItem.id) ? 'bg-farm-gold hover:bg-farm-gold-dark text-farm-wood-dark' : 'bg-gray-400 text-gray-600 cursor-not-allowed'"
                    :disabled="gameStore.coins < getBidAmount(currentItem.id)"
                    @click="handlePlaceBid"
                  >
                    💰 出价
                  </button>

                  <button 
                    class="font-pixel text-sm px-4 py-2 border-2 border-farm-wood-dark transition-colors"
                    :class="gameStore.coins >= currentItem.currentBid + currentItem.minBidIncrement ? 'bg-blue-400 hover:bg-blue-500 text-white' : 'bg-gray-400 text-gray-600 cursor-not-allowed'"
                    :disabled="gameStore.coins < currentItem.currentBid + currentItem.minBidIncrement"
                    @click="handleQuickBid"
                  >
                    ⚡ 快速加价
                  </button>
                </div>

                <p class="font-pixel text-[10px] text-farm-wood-dark/50 mt-2">
                  最低加价: {{ currentItem.minBidIncrement }} 金币
                </p>
              </div>
            </div>

            <div class="p-3 bg-farm-ui-dark border-2 border-farm-wood-dark">
              <p class="font-pixel text-xs text-farm-wood-dark mb-2">📋 本次拍卖品列表</p>
              <div class="flex gap-2 overflow-x-auto pb-2">
                <div 
                  v-for="(item, index) in auctionItems" 
                  :key="item.id"
                  class="flex-shrink-0 w-16 p-2 border-2 cursor-pointer transition-all"
                  :class="{
                    'border-farm-gold bg-farm-gold/20': index === currentIndex,
                    'border-farm-wood-dark bg-farm-ui': index !== currentIndex
                  }"
                  @click="bidAmount[item.id] = item.currentBid + item.minBidIncrement"
                >
                  <div class="text-2xl text-center">{{ item.icon }}</div>
                  <div class="font-pixel text-[8px] text-center text-farm-wood-dark mt-1 truncate">
                    {{ item.name }}
                  </div>
                  <div 
                    class="h-1 mt-1"
                    :style="{ backgroundColor: getAuctionRarityColor(item.rarity) }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === 'history'">
          <div v-if="wonItems.length > 0" class="space-y-3">
            <div 
              v-for="item in wonItems" 
              :key="`${item.auctionId}_${item.itemId}`"
              class="flex items-center gap-3 p-3 bg-farm-ui-dark border-2 border-farm-wood-dark"
            >
              <span class="text-2xl">🏆</span>
              <div class="flex-1">
                <div class="font-pixel text-sm text-farm-wood-dark">{{ item.itemName }}</div>
                <div class="font-pixel text-[10px] text-farm-wood-dark/60">
                  成交价: {{ item.finalPrice }} 金币
                </div>
              </div>
              <div class="font-pixel text-[10px] text-farm-wood-dark/50">
                {{ new Date(item.wonAt).toLocaleDateString() }}
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12">
            <span class="text-4xl">📦</span>
            <p class="font-pixel text-sm text-farm-wood-dark mt-2">还没有拍卖成功的物品</p>
            <p class="font-pixel text-[10px] text-farm-wood-dark/60 mt-1">去周末拍卖会看看吧！</p>
          </div>

          <div class="mt-6 p-4 bg-farm-ui-dark border-2 border-farm-wood-dark">
            <p class="font-pixel text-sm text-farm-wood-dark mb-2">📊 拍卖统计</p>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="font-pixel text-xl text-farm-gold-dark">{{ totalAuctionsHeld }}</div>
                <div class="font-pixel text-[10px] text-farm-wood-dark/60">拍卖会次数</div>
              </div>
              <div>
                <div class="font-pixel text-xl text-green-600">{{ totalAuctionsWon }}</div>
                <div class="font-pixel text-[10px] text-farm-wood-dark/60">拍得物品</div>
              </div>
              <div>
                <div class="font-pixel text-xl text-farm-gold-dark">{{ totalCoinsSpent }}</div>
                <div class="font-pixel text-[10px] text-farm-wood-dark/60">总花费</div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeTab === 'info'">
          <div class="space-y-4 p-4 bg-farm-ui-dark border-2 border-farm-wood-dark">
            <div>
              <h3 class="font-pixel text-sm text-farm-wood-dark mb-2">🎪 什么是周末集市拍卖会？</h3>
              <p class="font-pixel text-[10px] text-farm-wood-dark/70 leading-relaxed">
                每个周末，村子里都会举办热闹的拍卖会。你可以在这里竞拍各种稀有的物品，
                包括珍贵的矿石、宝石、特殊种子，甚至还有能提升村民好感度的礼物！
              </p>
            </div>

            <div>
              <h3 class="font-pixel text-sm text-farm-wood-dark mb-2">⏰ 拍卖时间</h3>
              <p class="font-pixel text-[10px] text-farm-wood-dark/70">
                每周六和周日开放，每件物品有独立的拍卖时间。
              </p>
            </div>

            <div>
              <h3 class="font-pixel text-sm text-farm-wood-dark mb-2">💰 经济平衡</h3>
              <p class="font-pixel text-[10px] text-farm-wood-dark/70 leading-relaxed">
                拍卖价格会受到经济指数的影响。当你大量消费时，经济指数会上升，
                物品的起拍价也会变高。合理规划你的金币使用，才能用最优的价格拍到心仪的物品！
              </p>
            </div>

            <div>
              <h3 class="font-pixel text-sm text-farm-wood-dark mb-2">⭐ 声望影响</h3>
              <p class="font-pixel text-[10px] text-farm-wood-dark/70 leading-relaxed">
                成功拍得物品会增加你的声望值，稀有物品带来的声望加成更多。
                声望越高，你在村子里的地位就越高哦！
              </p>
            </div>

            <div>
              <h3 class="font-pixel text-sm text-farm-wood-dark mb-2">🎯 竞拍技巧</h3>
              <ul class="font-pixel text-[10px] text-farm-wood-dark/70 space-y-1">
                <li>• 观察其他竞拍者的出价节奏</li>
                <li>• 在最后时刻出价可能捡漏</li>
                <li>• 合理使用快速加价功能</li>
                <li>• 注意经济指数对价格的影响</li>
              </ul>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
