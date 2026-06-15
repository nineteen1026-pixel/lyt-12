<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { TILE_ICONS, getMineralConfig, MINERAL_CONFIGS, MINE_ENTRY_COST, MINE_STAMINA_POTION_COST, MINE_STAMINA_POTION_AMOUNT } from '../game/data/mining';
import { RARITY_COLORS, RARITY_NAMES } from '../game/types/game';
import type { MineTile, MineFloor, MineTileType } from '../game/types/game';

const gameStore = useGameStore();

const localMessage = ref<string>('');
const messageTimer = ref<number | null>(null);

function showLocalMessage(msg: string, type: 'info' | 'success' | 'error' = 'info') {
  localMessage.value = msg;
  if (messageTimer.value) clearTimeout(messageTimer.value);
  messageTimer.value = window.setTimeout(() => { localMessage.value = ''; }, 2000);
}

const hasSession = computed(() => gameStore.currentMineSession?.active ?? false);
const currentSession = computed(() => gameStore.currentMineSession);
const currentFloor = computed<MineFloor | null>(() => gameStore.getCurrentMineFloor());

const staminaPercent = computed(() => {
  if (!currentSession.value) return 0;
  return Math.max(0, Math.min(100, (currentSession.value.stamina / currentSession.value.maxStamina) * 100));
});

const totalCoins = computed(() => gameStore.coins);

const sessionItemsSummary = computed(() => {
  if (!currentSession.value) return [];
  return currentSession.value.totalItemsGained.map(item => {
    const config = getMineralConfig(item.itemId);
    return {
      ...item,
      name: config?.name || item.itemId,
      icon: config?.icon || '❓'
    };
  });
});

const totalSessionCoins = computed(() => currentSession.value?.totalCoinsGained ?? 0);

const tileBgClass = (tile: MineTile, isPlayer: boolean) => {
  if (isPlayer) return 'bg-yellow-300 ring-2 ring-yellow-500';
  if (!tile.revealed) return 'bg-gray-800';
  if (tile.mined) return 'bg-gray-600';
  switch (tile.type) {
    case 'wall': return 'bg-stone-900';
    case 'entry': return 'bg-emerald-700';
    case 'exit': return 'bg-amber-600';
    case 'empty': return 'bg-stone-700';
    case 'rock': return 'bg-stone-500';
    case 'ore': return 'bg-sky-800';
    case 'rare_ore': return 'bg-purple-700';
    case 'treasure': return 'bg-yellow-600';
    case 'mushroom': return 'bg-rose-800';
    default: return 'bg-stone-700';
  }
};

const tileTextColor = (tile: MineTile) => {
  if (!tile.revealed) return 'text-gray-700';
  if (tile.type === 'wall') return 'text-stone-700';
  return 'text-white';
};

const tileContent = (tile: MineTile) => {
  if (!tile.revealed) return '❓';
  if (tile.mined) {
    if (tile.type === 'entry') return '🏁';
    if (tile.type === 'exit') return '🚪';
    return '';
  }
  if (tile.type === 'ore' || tile.type === 'rare_ore') {
    const cfg = tile.mineralId ? getMineralConfig(tile.mineralId) : null;
    return cfg?.icon || TILE_ICONS[tile.type];
  }
  return TILE_ICONS[tile.type as MineTileType] || '·';
};

const isClickable = (tile: MineTile, x: number, y: number) => {
  if (!currentFloor.value) return false;
  const { playerX, playerY } = currentFloor.value;
  if (x === playerX && y === playerY) return false;
  const dx = Math.abs(x - playerX);
  const dy = Math.abs(y - playerY);
  if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) return false;
  if (!tile.revealed) return false;
  if (tile.mined) return tile.type !== 'wall';
  return true;
};

function handleTileClick(x: number, y: number) {
  if (!currentFloor.value) return;
  const tile = currentFloor.value.tiles[y]?.[x];
  if (!tile || !isClickable(tile, x, y)) return;

  const needsMine = !tile.mined && (tile.type === 'rock' || tile.type === 'ore' || tile.type === 'rare_ore' || tile.type === 'treasure' || tile.type === 'mushroom');

  if (needsMine) {
    const result = gameStore.mineTile(x, y);
    if (!result.success) {
      showLocalMessage(result.message, 'error');
    } else if (result.newDiscoveries && result.newDiscoveries.length > 0) {
      showLocalMessage(`📖 新发现！`, 'success');
    }
  } else {
    const result = gameStore.moveInMine(x, y);
    if (!result.success) {
      showLocalMessage(result.message, 'error');
    }
  }
}

function handleStart() {
  const result = gameStore.startMineExploration();
  if (!result.success) {
    showLocalMessage(result.message, 'error');
  }
}

function handleBuyStamina() {
  const result = gameStore.buyMineStaminaPotion();
  if (!result.success) {
    showLocalMessage(result.message, 'error');
  }
}

function handleExit() {
  gameStore.exitMine();
}

function getTileRarityColor(tile: MineTile): string | undefined {
  if ((tile.type === 'ore' || tile.type === 'rare_ore') && tile.mineralId && !tile.mined) {
    const cfg = getMineralConfig(tile.mineralId);
    if (cfg) return RARITY_COLORS[cfg.rarity];
  }
  return undefined;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="gameStore.showMiningModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      @click.self="gameStore.closeMiningModal()"
    >
      <div class="w-full max-w-4xl max-h-[90vh] overflow-auto bg-gradient-to-b from-stone-800 to-stone-900 rounded-2xl shadow-2xl border border-stone-600 flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-stone-600 bg-gradient-to-r from-amber-900/50 to-stone-800 rounded-t-2xl">
          <div class="flex items-center gap-3">
            <span class="text-3xl">⛏️</span>
            <div>
              <h2 class="text-xl font-bold text-amber-100">矿洞探险</h2>
              <p class="text-xs text-stone-400">探索深不见底的神秘矿洞，发掘稀有矿石！</p>
            </div>
          </div>
          <button
            class="w-9 h-9 rounded-full bg-stone-700 hover:bg-red-700 text-stone-200 hover:text-white transition text-xl leading-none flex items-center justify-center"
            @click="gameStore.closeMiningModal()"
          >
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 flex-1 overflow-auto">
          <!-- Start screen -->
          <div v-if="!hasSession" class="space-y-5">
            <div class="bg-stone-700/50 rounded-xl p-6 border border-stone-600">
              <h3 class="text-lg font-bold text-amber-200 mb-4 flex items-center gap-2">
                <span>🗺️</span> 探险须知
              </h3>
              <ul class="space-y-2 text-sm text-stone-200">
                <li class="flex gap-2"><span class="text-amber-400">•</span> 进入矿洞需支付 <span class="text-yellow-300 font-bold">{{ MINE_ENTRY_COST }} 金币</span></li>
                <li class="flex gap-2"><span class="text-amber-400">•</span> 点击相邻格子 <span class="text-sky-300">移动</span> 或 <span class="text-purple-300">挖掘</span></li>
                <li class="flex gap-2"><span class="text-amber-400">•</span> 挖掘会消耗 <span class="text-green-300">体力值</span>，更硬的矿石消耗更多</li>
                <li class="flex gap-2"><span class="text-amber-400">•</span> 找到 <span class="text-yellow-400">🚪出口</span> 即可进入下一层</li>
                <li class="flex gap-2"><span class="text-amber-400">•</span> 共有 <span class="text-purple-300 font-bold">12 层</span>，越深矿石越稀有</li>
                <li class="flex gap-2"><span class="text-amber-400">•</span> 可花 <span class="text-yellow-300">{{ MINE_STAMINA_POTION_COST }} 金币</span> 购买体力药水（+{{ MINE_STAMINA_POTION_AMOUNT }}）</li>
              </ul>
            </div>

            <div class="bg-stone-700/50 rounded-xl p-6 border border-stone-600">
              <h3 class="text-lg font-bold text-amber-200 mb-4 flex items-center gap-2">
                <span>💎</span> 矿石图鉴
              </h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <div
                  v-for="m in MINERAL_CONFIGS"
                  :key="m.id"
                  class="p-3 rounded-lg border-2 bg-stone-800/60 transition"
                  :style="{ borderColor: RARITY_COLORS[m.rarity] }"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-2xl">{{ m.icon }}</span>
                    <span class="text-sm font-semibold text-white">{{ m.name }}</span>
                  </div>
                  <div class="text-xs space-y-0.5">
                    <div>
                      <span class="text-stone-400">稀有度：</span>
                      <span :style="{ color: RARITY_COLORS[m.rarity] }">{{ RARITY_NAMES[m.rarity] }}</span>
                    </div>
                    <div class="text-yellow-300">💰 {{ m.sellPrice }} 金币</div>
                    <div class="text-sky-300">📍 第{{ m.minFloor }}层+</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-center pt-2">
              <button
                class="px-10 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-lg shadow-lg hover:shadow-amber-500/30 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                :disabled="totalCoins < MINE_ENTRY_COST"
                @click="handleStart"
              >
                💰 支付 {{ MINE_ENTRY_COST }} 金币开始探险
              </button>
            </div>
            <p v-if="totalCoins < MINE_ENTRY_COST" class="text-center text-red-400 text-sm">
              金币不足！当前：{{ totalCoins }}
            </p>
          </div>

          <!-- Exploration screen -->
          <div v-else class="space-y-4">
            <!-- Stats bar -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-stone-700/60 rounded-lg p-3 border border-stone-600">
                <div class="text-xs text-stone-400">当前层数</div>
                <div class="text-xl font-bold text-amber-300">第 {{ currentSession?.currentFloor }} 层</div>
              </div>
              <div class="bg-stone-700/60 rounded-lg p-3 border border-stone-600">
                <div class="text-xs text-stone-400">体力值</div>
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-3 bg-stone-900 rounded-full overflow-hidden">
                    <div
                      class="h-full transition-all rounded-full"
                      :class="staminaPercent > 50 ? 'bg-green-500' : staminaPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'"
                      :style="{ width: staminaPercent + '%' }"
                    />
                  </div>
                  <span class="text-sm font-mono text-white">{{ currentSession?.stamina }}/{{ currentSession?.maxStamina }}</span>
                </div>
              </div>
              <div class="bg-stone-700/60 rounded-lg p-3 border border-stone-600">
                <div class="text-xs text-stone-400">探险金币</div>
                <div class="text-xl font-bold text-yellow-300">+{{ totalSessionCoins }}</div>
              </div>
              <div class="bg-stone-700/60 rounded-lg p-3 border border-stone-600">
                <div class="text-xs text-stone-400">矿石收集</div>
                <div class="text-xl font-bold text-purple-300">{{ sessionItemsSummary.reduce((s, i) => s + i.quantity, 0) }} 个</div>
              </div>
            </div>

            <!-- Local message -->
            <div
              v-if="localMessage"
              class="text-center py-2 px-4 rounded-lg bg-stone-700/80 border border-stone-500 text-sm text-amber-200 animate-pulse"
            >
              {{ localMessage }}
            </div>

            <!-- Map -->
            <div v-if="currentFloor" class="bg-stone-900/80 rounded-xl p-4 border border-stone-600">
              <div
                class="grid gap-1 mx-auto w-fit"
                :style="{ gridTemplateColumns: `repeat(${currentFloor.width}, minmax(0, 1fr))` }"
              >
                <template v-for="(row, y) in currentFloor.tiles" :key="y">
                  <button
                    v-for="(tile, x) in row"
                    :key="`${x}-${y}`"
                    class="w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center text-lg md:text-xl border transition select-none"
                    :class="[
                      tileBgClass(tile, currentFloor!.playerX === x && currentFloor!.playerY === y),
                      isClickable(tile, x, y) ? 'border-amber-400/60 hover:scale-110 hover:z-10 cursor-pointer shadow-md' : 'border-stone-800/40 cursor-default',
                      (currentFloor!.playerX === x && currentFloor!.playerY === y) ? 'animate-pulse' : ''
                    ]"
                    :disabled="!isClickable(tile, x, y)"
                    @click="handleTileClick(x, y)"
                  >
                    <span v-if="currentFloor!.playerX === x && currentFloor!.playerY === y" class="text-2xl drop-shadow-lg">🧑‍🌾</span>
                    <span v-else :class="tileTextColor(tile)" class="drop-shadow">
                      {{ tileContent(tile) }}
                    </span>
                    <span
                      v-if="getTileRarityColor(tile) && !tile.mined"
                      class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-black/30"
                      :style="{ backgroundColor: getTileRarityColor(tile)! }"
                    />
                  </button>
                </template>
              </div>

              <div class="mt-4 flex flex-wrap gap-3 justify-center text-xs text-stone-300">
                <span class="flex items-center gap-1"><span class="w-4 h-4 bg-emerald-700 rounded"></span> 入口</span>
                <span class="flex items-center gap-1"><span class="w-4 h-4 bg-amber-600 rounded"></span> 出口</span>
                <span class="flex items-center gap-1"><span class="w-4 h-4 bg-stone-500 rounded"></span> 岩石</span>
                <span class="flex items-center gap-1"><span class="w-4 h-4 bg-sky-800 rounded"></span> 矿石</span>
                <span class="flex items-center gap-1"><span class="w-4 h-4 bg-purple-700 rounded"></span> 富矿</span>
                <span class="flex items-center gap-1"><span class="w-4 h-4 bg-yellow-600 rounded"></span> 宝箱</span>
                <span class="flex items-center gap-1"><span class="w-4 h-4 bg-rose-800 rounded"></span> 蘑菇</span>
              </div>
            </div>

            <!-- Collected items -->
            <div v-if="sessionItemsSummary.length > 0" class="bg-stone-700/50 rounded-xl p-4 border border-stone-600">
              <h4 class="text-sm font-semibold text-amber-200 mb-2">本次收集：</h4>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="item in sessionItemsSummary"
                  :key="item.itemId"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 border border-stone-500 text-sm"
                >
                  <span class="text-lg">{{ item.icon }}</span>
                  <span class="text-white">{{ item.name }}</span>
                  <span class="text-amber-300 font-bold">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex flex-wrap gap-3 justify-center pt-2">
              <button
                class="px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="totalCoins < MINE_STAMINA_POTION_COST"
                @click="handleBuyStamina"
              >
                🧪 体力药水 ({{ MINE_STAMINA_POTION_COST }}💰)
              </button>
              <button
                class="px-5 py-2.5 rounded-lg bg-gradient-to-r from-stone-600 to-stone-500 hover:from-stone-500 hover:to-stone-400 text-white font-semibold shadow transition"
                @click="handleExit"
              >
                🏃 结束探险
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
