<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { CODEX_CATEGORY_NAMES, CODEX_CATEGORY_ICONS, getCodexEntriesByCategory } from '../game/data/codex';
import { RARITY_COLORS, RARITY_NAMES, QUALITY_COLORS, QUALITY_NAMES } from '../game/types/game';
import type { CodexCategory, Rarity, CodexEntry, QualityGrade } from '../game/types/game';

const gameStore = useGameStore();
const activeCategory = ref<CodexCategory | 'all'>('all');
const showDiscoveredOnly = ref(false);
const selectedEntry = ref<string | null>(null);
const showSharePreview = ref(false);
const shareDataUrl = ref<string | null>(null);

const categories: Array<{ id: CodexCategory | 'all'; name: string; icon: string }> = [
  { id: 'all', name: '全部', icon: '📖' },
  { id: 'crop', name: '作物', icon: '🌾' },
  { id: 'animal', name: '动物', icon: '🐾' },
  { id: 'item', name: '物品', icon: '📦' },
  { id: 'building', name: '建筑', icon: '🏠' },
  { id: 'villager', name: '村民', icon: '👥' },
  { id: 'fish', name: '鱼类', icon: '🐟' },
  { id: 'artifact', name: '文物', icon: '🏺' }
];

const overallProgress = computed(() => Math.floor(gameStore.codexCompletionPercentage));

const filteredEntries = computed(() => {
  let entries = gameStore.codexEntries;
  if (activeCategory.value !== 'all') {
    entries = entries.filter(e => e.category === activeCategory.value);
  }
  if (showDiscoveredOnly.value) {
    entries = entries.filter(e => e.discovered);
  }
  return entries;
});

const getCategoryCount = (cat: CodexCategory | 'all') => {
  const allEntries = gameStore.codexEntries;
  const catEntries = cat === 'all' ? allEntries : allEntries.filter(e => e.category === cat);
  return {
    total: catEntries.length,
    discovered: catEntries.filter(e => e.discovered).length
  };
};

const getRarityColor = (rarity: Rarity) => RARITY_COLORS[rarity];
const getRarityName = (rarity: Rarity) => RARITY_NAMES[rarity];
const getCategoryName = (cat: CodexCategory) => CODEX_CATEGORY_NAMES[cat];

const selectEntry = (entryId: string) => {
  selectedEntry.value = selectedEntry.value === entryId ? null : entryId;
  showSharePreview.value = false;
};

const generateShareCard = (entryId: string) => {
  const dataUrl = gameStore.generateCodexCard(entryId);
  if (dataUrl) {
    shareDataUrl.value = dataUrl;
    showSharePreview.value = true;
  }
};

const downloadCard = () => {
  if (shareDataUrl.value) {
    gameStore.downloadShareCard(shareDataUrl.value, `codex-${selectedEntry.value || 'entry'}.png`);
  }
};

const shareToSystem = async () => {
  if (shareDataUrl.value) {
    await gameStore.shareCard(shareDataUrl.value, '像素农场图鉴', '我在像素农场发现了新图鉴！');
  }
};

const formatTime = (timestamp?: number) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString();
};

const close = () => {
  gameStore.showCodex = false;
  selectedEntry.value = null;
  showSharePreview.value = false;
};
</script>

<template>
  <div 
    v-if="gameStore.showCodex" 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="close"
  >
    <div class="bg-farm-ui border-4 border-farm-wood-dark p-6 shadow-pixel w-[850px] max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-pixel text-xl text-farm-wood-dark">📖 图鉴系统</h2>
        <button 
          class="font-pixel text-sm px-3 py-1 bg-farm-ui-dark border-2 border-farm-wood-dark hover:bg-farm-gold transition-colors"
          @click="close"
        >
          ✕ 关闭
        </button>
      </div>

      <div class="mb-4 p-4 bg-farm-ui-dark border-2 border-farm-wood-dark">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <span class="text-3xl">📖</span>
            <div>
              <div class="font-pixel text-sm text-farm-wood-dark">
                已发现 {{ gameStore.discoveredCodexCount }} / {{ gameStore.totalCodexCount }}
              </div>
              <div class="font-pixel text-[10px] text-farm-wood-dark/60 mt-1">
                图鉴完成度 {{ overallProgress }}%
              </div>
            </div>
          </div>
          <button
            class="font-pixel text-xs px-3 py-1 border-2 border-farm-wood-dark transition-colors"
            :class="showDiscoveredOnly ? 'bg-farm-gold' : 'bg-farm-ui hover:bg-farm-gold/50'"
            @click="showDiscoveredOnly = !showDiscoveredOnly"
          >
            {{ showDiscoveredOnly ? '🔓 仅已发现' : '📖 全部' }}
          </button>
        </div>
        <div class="w-full h-3 bg-farm-wood-dark/30 border border-farm-wood-dark overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
            :style="{ width: `${overallProgress}%` }"
          ></div>
        </div>
      </div>

      <div class="flex gap-2 mb-4 flex-wrap">
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          class="font-pixel text-[10px] px-3 py-1.5 border-2 border-farm-wood-dark transition-colors flex items-center gap-1"
          :class="activeCategory === cat.id ? 'bg-farm-gold' : 'bg-farm-ui-dark hover:bg-farm-gold/50'"
          @click="activeCategory = cat.id"
        >
          <span>{{ cat.icon }}</span>
          <span>{{ cat.name }}</span>
          <span class="text-farm-wood-dark/60">({{ getCategoryCount(cat.id).discovered }}/{{ getCategoryCount(cat.id).total }})</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="filteredEntries.length > 0" class="grid grid-cols-3 gap-3">
          <div 
            v-for="entry in filteredEntries" 
            :key="entry.id"
            class="p-3 border-2 border-farm-wood-dark transition-all cursor-pointer"
            :class="{
              'bg-farm-ui-dark': entry.discovered,
              'bg-gray-200 opacity-60': !entry.discovered,
              'ring-2 ring-farm-gold': selectedEntry === entry.id
            }"
            :style="entry.discovered ? { borderLeftColor: getRarityColor(entry.rarity), borderLeftWidth: '4px' } : {}"
            @click="selectEntry(entry.id)"
          >
            <div class="flex flex-col items-center text-center">
              <span class="text-3xl mb-1" :class="{ 'grayscale opacity-40': !entry.discovered }">
                {{ entry.discovered ? entry.icon : '❓' }}
              </span>
              <span class="font-pixel text-[10px] text-farm-wood-dark mb-1 truncate w-full">
                {{ entry.discovered ? entry.name : '???' }}
              </span>
              <span 
                class="font-pixel text-[7px] px-1.5 py-0.5 text-white mb-1"
                :style="{ backgroundColor: getRarityColor(entry.rarity) }"
              >
                {{ getRarityName(entry.rarity) }}
              </span>
              <span class="font-pixel text-[7px] text-farm-wood-dark/50">
                {{ getCategoryName(entry.category) }}
              </span>
              <span v-if="entry.discovered && entry.count > 0" class="font-pixel text-[7px] text-farm-wood-dark/60 mt-1">
                {{ entry.count }}
                <span v-if="entry.bestQuality" :style="{ color: QUALITY_COLORS[entry.bestQuality] }">
                  {{ '★'.repeat(entry.bestQuality) }}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12">
          <span class="text-5xl">📖</span>
          <p class="font-pixel text-sm text-farm-wood-dark mt-4">没有匹配的图鉴条目</p>
        </div>
      </div>

      <div v-if="selectedEntry" class="mt-3 p-3 bg-farm-ui-dark border-2 border-farm-wood-dark">
        <template v-if="(() => { const e = filteredEntries.find(x => x.id === selectedEntry); return e; })() as any">
          <div v-if="(filteredEntries.find(x => x.id === selectedEntry) as any)" class="flex items-start gap-4">
            <template v-for="e in [filteredEntries.find(x => x.id === selectedEntry)!]" :key="e.id">
              <span class="text-4xl" :class="{ 'grayscale opacity-40': !e.discovered }">
                {{ e.discovered ? e.icon : '❓' }}
              </span>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-pixel text-sm text-farm-wood-dark">
                    {{ e.discovered ? e.name : '???' }}
                  </span>
                  <span 
                    class="font-pixel text-[8px] px-1.5 py-0.5 text-white"
                    :style="{ backgroundColor: getRarityColor(e.rarity) }"
                  >
                    {{ getRarityName(e.rarity) }}
                  </span>
                  <span class="font-pixel text-[8px] text-farm-wood-dark/60">
                    {{ getCategoryName(e.category) }}
                  </span>
                </div>
                <div class="font-pixel text-[9px] text-farm-wood-dark/70 mb-1">
                  {{ e.discovered ? e.description : (e.hint || '继续探索来发现！') }}
                </div>
                <div v-if="e.discovered" class="font-pixel text-[8px] text-farm-wood-dark/50">
                  <span v-if="e.count > 0">收集数量: {{ e.count }} | </span>
                  <span v-if="e.bestQuality">最高品质: <span :style="{ color: QUALITY_COLORS[e.bestQuality] }">{{ '★'.repeat(e.bestQuality) }}</span> | </span>
                  <span>发现于: {{ formatTime(e.discoveredAt) }}</span>
                </div>
                <div v-if="!e.discovered && e.hint" class="font-pixel text-[8px] text-blue-600 mt-1">
                  💡 {{ e.hint }}
                </div>
              </div>
              <div v-if="e.discovered" class="flex flex-col gap-1">
                <button 
                  class="font-pixel text-[9px] px-3 py-1 bg-farm-gold border-2 border-farm-wood-dark hover:bg-farm-gold-dark transition-colors"
                  @click="generateShareCard(e.id)"
                >
                  📤 分享
                </button>
              </div>
            </template>
          </div>
        </template>
      </div>

      <div v-if="showSharePreview && shareDataUrl" class="mt-3 p-3 bg-farm-ui-dark border-2 border-farm-wood-dark">
        <div class="flex items-center gap-4">
          <img :src="shareDataUrl" class="w-[160px] border-2 border-farm-wood-dark" alt="分享卡片" />
          <div class="flex flex-col gap-2">
            <p class="font-pixel text-xs text-farm-wood-dark">图鉴卡片生成成功！</p>
            <button 
              class="font-pixel text-xs px-4 py-2 bg-farm-gold border-2 border-farm-wood-dark hover:bg-farm-gold-dark transition-colors"
              @click="downloadCard"
            >
              💾 下载卡片
            </button>
            <button 
              class="font-pixel text-xs px-4 py-2 bg-blue-500 text-white border-2 border-farm-wood-dark hover:bg-blue-600 transition-colors"
              @click="shareToSystem"
            >
              📤 系统分享
            </button>
            <button 
              class="font-pixel text-xs px-4 py-2 bg-farm-ui border-2 border-farm-wood-dark hover:bg-farm-gold/50 transition-colors"
              @click="showSharePreview = false"
            >
              ✕ 关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
