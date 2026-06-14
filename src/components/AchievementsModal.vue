<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORY_NAMES, getAchievementById } from '../game/data/achievements';
import { RARITY_COLORS, RARITY_NAMES } from '../game/types/game';
import type { AchievementCategory, Rarity, Achievement } from '../game/types/game';

const gameStore = useGameStore();
const activeCategory = ref<AchievementCategory | 'all'>('all');
const showUnlockedOnly = ref(false);
const selectedAchievement = ref<string | null>(null);
const showSharePreview = ref(false);
const shareDataUrl = ref<string | null>(null);

const categories: Array<{ id: AchievementCategory | 'all'; name: string; icon: string }> = [
  { id: 'all', name: '全部', icon: '🏆' },
  { id: 'farming', name: '农耕', icon: '🌱' },
  { id: 'animal', name: '畜牧', icon: '🐾' },
  { id: 'building', name: '建筑', icon: '🏗️' },
  { id: 'order', name: '订单', icon: '📋' },
  { id: 'economy', name: '经济', icon: '💰' },
  { id: 'exploration', name: '探索', icon: '🗺️' },
  { id: 'seasonal', name: '季节', icon: '🌍' }
];

const overallProgress = computed(() => {
  const total = gameStore.totalAchievementCount;
  const unlocked = gameStore.unlockedAchievementCount;
  return total > 0 ? Math.floor((unlocked / total) * 100) : 0;
});

const filteredAchievements = computed(() => {
  let list = ACHIEVEMENTS;
  if (activeCategory.value !== 'all') {
    list = list.filter(a => a.category === activeCategory.value);
  }
  if (showUnlockedOnly.value) {
    list = list.filter(a => gameStore.achievementProgress[a.id]?.unlocked);
  }
  return list.map(a => {
    const progress = gameStore.achievementProgress[a.id];
    const isUnlocked = progress?.unlocked ?? false;
    const percent = progress?.progress ?? 0;
    const isHidden = (a.hidden || a.secret) && !isUnlocked;
    return {
      ...a,
      isUnlocked,
      percent: isUnlocked ? 100 : Math.floor(percent),
      isHidden,
      unlockedAt: progress?.unlockedAt
    };
  });
});

const getCategoryCount = (cat: AchievementCategory | 'all') => {
  if (cat === 'all') {
    return {
      total: ACHIEVEMENTS.length,
      unlocked: ACHIEVEMENTS.filter(a => gameStore.achievementProgress[a.id]?.unlocked).length
    };
  }
  const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
  return {
    total: catAchievements.length,
    unlocked: catAchievements.filter(a => gameStore.achievementProgress[a.id]?.unlocked).length
  };
};

const getRarityColor = (rarity: Rarity) => RARITY_COLORS[rarity];
const getRarityName = (rarity: Rarity) => RARITY_NAMES[rarity];

const selectAchievement = (id: string) => {
  selectedAchievement.value = selectedAchievement.value === id ? null : id;
  showSharePreview.value = false;
};

const generateShareCard = (achievementId: string) => {
  const dataUrl = gameStore.generateAchievementCard(achievementId);
  if (dataUrl) {
    shareDataUrl.value = dataUrl;
    showSharePreview.value = true;
  }
};

const downloadCard = () => {
  if (shareDataUrl.value) {
    const achievement = selectedAchievement.value ? getAchievementById(selectedAchievement.value) : null;
    const filename = achievement ? `achievement-${achievement.id}.png` : 'achievement-card.png';
    gameStore.downloadShareCard(shareDataUrl.value, filename);
  }
};

const shareToSystem = async () => {
  if (shareDataUrl.value && selectedAchievement.value) {
    const achievement = getAchievementById(selectedAchievement.value);
    const title = achievement ? `成就解锁: ${achievement.name}` : '像素农场成就';
    const text = achievement ? `我在像素农场解锁了成就"${achievement.name}"！` : '我在像素农场取得了新成就！';
    await gameStore.shareCard(shareDataUrl.value, title, text);
  }
};

const close = () => {
  gameStore.showAchievements = false;
  selectedAchievement.value = null;
  showSharePreview.value = false;
};
</script>

<template>
  <div 
    v-if="gameStore.showAchievements" 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="close"
  >
    <div class="bg-farm-ui border-4 border-farm-wood-dark p-6 shadow-pixel w-[850px] max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-pixel text-xl text-farm-wood-dark">🏆 成就系统</h2>
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
            <span class="text-3xl">🏆</span>
            <div>
              <div class="font-pixel text-sm text-farm-wood-dark">
                已解锁 {{ gameStore.unlockedAchievementCount }} / {{ gameStore.totalAchievementCount }}
              </div>
              <div class="font-pixel text-[10px] text-farm-wood-dark/60 mt-1">
                总进度 {{ overallProgress }}%
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="font-pixel text-xs px-3 py-1 border-2 border-farm-wood-dark transition-colors"
              :class="showUnlockedOnly ? 'bg-farm-gold' : 'bg-farm-ui hover:bg-farm-gold/50'"
              @click="showUnlockedOnly = !showUnlockedOnly"
            >
              {{ showUnlockedOnly ? '🔓 仅已解锁' : '📋 全部' }}
            </button>
            <button
              class="font-pixel text-xs px-3 py-1 bg-farm-gold border-2 border-farm-wood-dark hover:bg-farm-gold-dark transition-colors"
              @click="gameStore.generateStatsCard && (shareDataUrl = gameStore.generateStatsCard()) && (showSharePreview = true)"
            >
              📊 分享战绩
            </button>
          </div>
        </div>
        <div class="w-full h-3 bg-farm-wood-dark/30 border border-farm-wood-dark overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
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
          <span class="text-farm-wood-dark/60">({{ getCategoryCount(cat.id).unlocked }}/{{ getCategoryCount(cat.id).total }})</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="filteredAchievements.length > 0" class="grid grid-cols-2 gap-3">
          <div 
            v-for="ach in filteredAchievements" 
            :key="ach.id"
            class="p-3 border-2 border-farm-wood-dark transition-all cursor-pointer"
            :class="{
              'bg-farm-ui-dark': !ach.isUnlocked && !ach.isHidden,
              'bg-green-50 border-green-400': ach.isUnlocked,
              'bg-gray-200 opacity-60': ach.isHidden,
              'ring-2 ring-farm-gold': selectedAchievement === ach.id
            }"
            :style="ach.isUnlocked ? { borderLeftColor: getRarityColor(ach.rarity), borderLeftWidth: '4px' } : {}"
            @click="selectAchievement(ach.id)"
          >
            <div class="flex items-start gap-3">
              <span class="text-3xl" :class="{ 'grayscale opacity-50': !ach.isUnlocked && !ach.isHidden }">
                {{ ach.isHidden ? '❓' : ach.icon }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-pixel text-xs text-farm-wood-dark truncate">
                    {{ ach.isHidden ? '???' : ach.name }}
                  </span>
                  <span 
                    class="font-pixel text-[8px] px-1.5 py-0.5 text-white shrink-0"
                    :style="{ backgroundColor: getRarityColor(ach.rarity) }"
                  >
                    {{ getRarityName(ach.rarity) }}
                  </span>
                </div>
                <div class="font-pixel text-[9px] text-farm-wood-dark/70 mb-2 line-clamp-2">
                  {{ ach.isHidden ? '隐藏成就，继续探索来发现！' : ach.description }}
                </div>
                <div class="w-full h-1.5 bg-farm-wood-dark/20 overflow-hidden">
                  <div 
                    class="h-full transition-all duration-300"
                    :class="ach.isUnlocked ? 'bg-green-500' : 'bg-farm-gold'"
                    :style="{ width: `${ach.percent}%` }"
                  ></div>
                </div>
                <div class="font-pixel text-[8px] text-farm-wood-dark/50 mt-1">
                  {{ ach.percent }}%
                </div>
              </div>
              <span v-if="ach.isUnlocked" class="text-green-500 text-lg shrink-0">✓</span>
            </div>

            <div v-if="ach.isUnlocked && ach.reward" class="mt-2 pt-2 border-t border-farm-wood-dark/20 flex items-center gap-2 flex-wrap">
              <span v-if="ach.reward.coins" class="font-pixel text-[8px] text-farm-gold-dark">💰{{ ach.reward.coins }}</span>
              <span v-if="ach.reward.reputation" class="font-pixel text-[8px] text-purple-600">⭐+{{ ach.reward.reputation }}</span>
              <span v-if="ach.reward.title" class="font-pixel text-[8px] text-blue-600">🏅{{ ach.reward.title }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12">
          <span class="text-5xl">🏆</span>
          <p class="font-pixel text-sm text-farm-wood-dark mt-4">没有匹配的成就</p>
        </div>
      </div>

      <div v-if="selectedAchievement && showSharePreview && shareDataUrl" class="mt-4 p-4 bg-farm-ui-dark border-2 border-farm-wood-dark">
        <div class="flex items-center gap-4">
          <img :src="shareDataUrl" class="w-[200px] border-2 border-farm-wood-dark" alt="分享卡片" />
          <div class="flex flex-col gap-2">
            <p class="font-pixel text-xs text-farm-wood-dark">生成分享卡片成功！</p>
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
