<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { STAGE_NAMES, STAGE_COLORS, getVillagerDetail } from '../game/data/villagers';
import { getItem } from '../game/data/items';
import { FESTIVALS, getVillagerFestivalPreference } from '../game/data/festivalGifts';
import type { DialogueNode, QualityGrade, FestivalDialogueNode } from '../game/types/game';

const gameStore = useGameStore();
const selectedVillagerId = ref<string | null>(null);
const dialogueView = ref(false);
const giftView = ref(false);
const festivalView = ref(false);
const festivalDialogueView = ref(false);

const villagers = computed(() => gameStore.allVillagersInfo);

const selectedVillager = computed(() => {
  if (!selectedVillagerId.value) return null;
  return gameStore.getVillagerInfo(selectedVillagerId.value);
});

const currentDialogue = computed((): DialogueNode | null => {
  if (!selectedVillagerId.value) return null;
  return gameStore.getCurrentDialogue(selectedVillagerId.value);
});

const currentFestivalDialogue = computed((): FestivalDialogueNode | null => {
  if (!selectedVillagerId.value) return null;
  return gameStore.getCurrentFestivalDialogue(selectedVillagerId.value);
});

const giftableItems = computed(() => {
  if (!gameStore.inventory) return [];
  const items = gameStore.inventory.getInventoryItems();
  return items.filter(i => i.quantity > 0 && (
    i.itemId.includes('_product') || i.itemId.includes('_seed')
  )).map(i => ({
    ...i,
    itemData: getItem(i.itemId)
  })).filter(i => i.itemData);
});

const festivalGiftableItems = computed(() => {
  if (!gameStore.inventory || !gameStore.isFestivalActive || !selectedVillagerId.value) return [];
  const items = gameStore.inventory.getInventoryItems();
  const currentFestival = gameStore.currentFestival;
  if (!currentFestival) return [];
  const preference = getVillagerFestivalPreference(selectedVillagerId.value, currentFestival.id);
  return items.filter(i => i.quantity > 0 && (
    i.itemId.includes('_product') || i.itemId === 'egg' || i.itemId === 'milk'
  )).map(i => {
    const itemData = getItem(i.itemId);
    const isPreferred = preference?.preferredItems.includes(i.itemId) ?? false;
    const isDisliked = preference?.dislikedItems.includes(i.itemId) ?? false;
    return { ...i, itemData, isPreferred, isDisliked };
  }).filter(i => i.itemData);
});

const isFestivalActive = computed(() => gameStore.isFestivalActive);
const currentFestival = computed(() => gameStore.currentFestival);
const festivalInfo = computed(() => gameStore.currentFestivalInfo);

const selectVillager = (id: string) => {
  selectedVillagerId.value = id;
  dialogueView.value = false;
  giftView.value = false;
  festivalView.value = false;
  festivalDialogueView.value = false;
};

const startDialogue = () => {
  if (!selectedVillager.value?.canInteract) return;
  dialogueView.value = true;
  giftView.value = false;
  festivalView.value = false;
  festivalDialogueView.value = false;
};

const advanceDialogue = (choiceIndex?: number) => {
  if (!selectedVillagerId.value) return;
  const result = gameStore.advanceVillagerDialogue(selectedVillagerId.value, choiceIndex);
  if (result?.ended) {
    setTimeout(() => {
      dialogueView.value = false;
    }, 1500);
  }
};

const openGiftPanel = () => {
  giftView.value = true;
  dialogueView.value = false;
  festivalView.value = false;
  festivalDialogueView.value = false;
};

const giveGift = (itemId: string) => {
  if (!selectedVillagerId.value) return;
  const result = gameStore.giveGiftToVillager(selectedVillagerId.value, itemId, 1);
  if (result.success) {
    giftView.value = false;
  }
};

const openFestivalPanel = () => {
  festivalView.value = true;
  dialogueView.value = false;
  giftView.value = false;
  festivalDialogueView.value = false;
};

const openFestivalDialogue = () => {
  festivalDialogueView.value = true;
  festivalView.value = false;
};

const advanceFestivalDialogue = (choiceIndex?: number) => {
  if (!selectedVillagerId.value) return;
  const result = gameStore.advanceFestivalDialogue(selectedVillagerId.value, choiceIndex);
  if (result?.ended) {
    setTimeout(() => {
      festivalDialogueView.value = false;
    }, 1500);
  }
};

const giveFestivalGift = (itemId: string, quality: QualityGrade) => {
  if (!selectedVillagerId.value) return;
  const result = gameStore.giveFestivalGiftToVillager(selectedVillagerId.value, itemId, quality);
  if (result.success) {
    festivalView.value = false;
  }
};

const getQualityLabel = (q: QualityGrade): string => {
  const labels: Record<QualityGrade, string> = { 1: '一星', 2: '二星', 3: '三星', 4: '四星', 5: '五星' };
  return labels[q];
};

const formatProgress = (progress: { percentage: number; current: number; required: number }) => {
  return `${Math.floor(progress.current)}/${progress.required}`;
};

const getSpeakerName = (speaker: string) => {
  if (speaker === 'player') return '你';
  if (speaker === 'narrator') return '旁白';
  if (selectedVillager.value) {
    return selectedVillager.value.detail?.name || selectedVillager.value.villager?.name || '村民';
  }
  return '村民';
};
</script>

<template>
  <div 
    v-if="gameStore.showVillagers" 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="gameStore.closeVillagersPanel()"
  >
    <div class="bg-farm-ui border-4 border-farm-wood-dark p-5 shadow-pixel w-[820px] max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-pixel text-xl text-farm-wood-dark">
          <span>👥 村民关系</span>
          <span v-if="isFestivalActive" class="ml-2 text-sm" :style="{ color: '#ff9800' }">
            {{ currentFestival?.icon }} {{ currentFestival?.name }}进行中！
          </span>
        </h2>
        <div class="flex items-center gap-3">
          <div class="font-pixel text-xs text-farm-wood-dark/80">
            总好感度: {{ gameStore.totalAffinity }} | 
            剧情完成: {{ gameStore.storylinesCompletedCount }}/8 | 
            专属订单: {{ gameStore.exclusiveOrdersCompletedCount }}
          </div>
          <button 
            class="font-pixel text-sm px-3 py-1 bg-farm-ui-dark border-2 border-farm-wood-dark hover:bg-farm-gold transition-colors"
            @click="gameStore.closeVillagersPanel()"
          >
            ✕ 关闭
          </button>
        </div>
      </div>

      <div class="flex gap-4 flex-1 min-h-0">
        <div class="w-72 flex-shrink-0 bg-farm-ui-dark border-2 border-farm-wood-dark p-3 overflow-y-auto">
          <h3 class="font-pixel text-sm text-farm-wood-dark mb-3 border-b-2 border-farm-wood-dark/50 pb-2">村民列表</h3>
          <div class="flex flex-col gap-2">
            <div
              v-for="v in villagers"
              :key="v.villager?.id"
              class="p-2 border-2 cursor-pointer transition-all"
              :class="[
                selectedVillagerId === v.villager?.id 
                  ? 'bg-farm-gold border-farm-wood-dark shadow-pixel-inset' 
                  : 'bg-farm-ui/60 border-farm-wood-dark/50 hover:bg-farm-gold/60'
              ]"
              @click="selectVillager(v.villager!.id)"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="text-2xl">{{ v.detail?.avatar || v.villager?.avatar }}</span>
                <div class="flex-1 min-w-0">
                  <div class="font-pixel text-[13px] text-farm-wood-dark truncate">{{ v.detail?.name || v.villager?.name }}</div>
                  <div class="font-pixel text-[9px]" :style="{ color: v.stageColor }">
                    {{ v.stageName }}
                  </div>
                </div>
              </div>
              <div class="h-2 bg-farm-ui-dark/80 border border-farm-wood-dark/50 overflow-hidden">
                <div 
                  class="h-full transition-all duration-300"
                  :style="{ width: `${v.progress?.percentage || 0}%`, backgroundColor: v.stageColor }"
                ></div>
              </div>
              <div class="font-pixel text-[8px] text-farm-wood-dark/70 mt-1 text-right">
                {{ formatProgress(v.progress || { current: 0, required: 0, percentage: 0 }) }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 bg-farm-ui-dark border-2 border-farm-wood-dark p-4 flex flex-col min-h-0">
          <div v-if="!selectedVillager" class="flex-1 flex items-center justify-center">
            <p class="font-pixel text-sm text-farm-wood-dark/60">← 选择一位村民查看详情</p>
          </div>

          <template v-else>
            <div v-if="!dialogueView && !giftView && !festivalView && !festivalDialogueView" class="flex flex-col h-full overflow-y-auto">
              <div class="flex items-start gap-4 mb-4 pb-4 border-b-2 border-farm-wood-dark/30">
                <div class="w-20 h-20 flex items-center justify-center text-5xl bg-farm-ui border-2 border-farm-wood-dark">
                  {{ selectedVillager.detail?.avatar || selectedVillager.villager?.avatar }}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-pixel text-lg text-farm-wood-dark">
                      {{ selectedVillager.detail?.name || selectedVillager.villager?.name }}
                    </h3>
                    <span 
                      class="font-pixel text-[10px] px-2 py-0.5 border border-farm-wood-dark"
                      :style="{ backgroundColor: selectedVillager.stageColor + '33', color: selectedVillager.stageColor }"
                    >
                      {{ selectedVillager.stageName }}
                    </span>
                  </div>
                  <div class="font-pixel text-[11px] text-farm-wood-dark/80 mb-2">
                    {{ selectedVillager.detail?.occupation || '村民' }} · {{ selectedVillager.detail?.personality || '' }}
                  </div>
                  <div class="font-pixel text-[10px] text-farm-wood-dark/70">
                    好感度: {{ selectedVillager.affinity }} | 
                    生日: {{ selectedVillager.detail?.birthday || '未知' }}
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-pixel text-[10px] text-farm-wood-dark/80">阶段进度</span>
                  <span class="font-pixel text-[10px] text-farm-wood-dark">
                    {{ formatProgress(selectedVillager.progress || { current: 0, required: 0, percentage: 0 }) }}
                  </span>
                </div>
                <div class="h-3 bg-farm-ui border border-farm-wood-dark overflow-hidden">
                  <div 
                    class="h-full transition-all duration-500"
                    :style="{ 
                      width: `${selectedVillager.progress?.percentage || 0}%`, 
                      backgroundColor: selectedVillager.stageColor 
                    }"
                  ></div>
                </div>
                <div class="flex justify-between mt-1">
                  <span 
                    v-for="(name, idx) in STAGE_NAMES" 
                    :key="idx"
                    class="font-pixel text-[8px]"
                    :style="{ color: idx <= selectedVillager.stage ? STAGE_COLORS[idx as keyof typeof STAGE_COLORS] : '#999' }"
                  >
                    {{ name }}
                  </span>
                </div>
              </div>

              <div class="mb-4">
                <h4 class="font-pixel text-[12px] text-farm-wood-dark mb-2">📖 个人简介</h4>
                <p class="font-pixel text-[11px] text-farm-wood-dark/90 leading-relaxed">
                  {{ selectedVillager.detail?.backstory || '暂无信息' }}
                </p>
              </div>

              <div class="mb-4">
                <h4 class="font-pixel text-[12px] text-farm-wood-dark mb-2">💕 喜好</h4>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="like in selectedVillager.detail?.likes || []" 
                    :key="like"
                    class="font-pixel text-[10px] px-2 py-1 bg-green-100 border border-green-600 text-green-800"
                  >
                    ✓ {{ like }}
                  </span>
                  <span 
                    v-for="dis in selectedVillager.detail?.dislikes || []" 
                    :key="dis"
                    class="font-pixel text-[10px] px-2 py-1 bg-red-100 border border-red-600 text-red-800"
                  >
                    ✗ {{ dis }}
                  </span>
                </div>
              </div>

              <div v-if="selectedVillager.exclusiveOrders?.length > 0" class="mb-4">
                <h4 class="font-pixel text-[12px] text-farm-wood-dark mb-2">📜 专属订单</h4>
                <div class="flex flex-col gap-1">
                  <div 
                    v-for="order in selectedVillager.exclusiveOrders" 
                    :key="order.id"
                    class="p-2 bg-farm-ui border border-farm-wood-dark/50"
                  >
                    <div class="font-pixel text-[11px] text-farm-wood-dark font-bold">
                      {{ order.name }}
                    </div>
                    <div class="font-pixel text-[9px] text-farm-wood-dark/70">
                      {{ order.description }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-auto pt-4 border-t-2 border-farm-wood-dark/30 flex gap-2">
                <button
                  class="flex-1 font-pixel text-sm py-2 bg-farm-gold border-2 border-farm-wood-dark hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="!selectedVillager.canInteract"
                  @click="startDialogue"
                >
                  💬 对话
                </button>
                <button
                  class="flex-1 font-pixel text-sm py-2 bg-pink-200 border-2 border-farm-wood-dark hover:bg-pink-300 transition-colors"
                  @click="openGiftPanel"
                >
                  🎁 送礼
                </button>
                <button
                  v-if="isFestivalActive"
                  class="flex-1 font-pixel text-sm py-2 bg-orange-200 border-2 border-farm-wood-dark hover:bg-orange-300 transition-colors"
                  @click="openFestivalPanel"
                >
                  🎊 节日赠礼
                </button>
                <button
                  v-if="!selectedVillager.canInteract && selectedVillager.currentDialogue"
                  class="flex-1 font-pixel text-sm py-2 bg-farm-ui border-2 border-farm-wood-dark hover:bg-farm-ui-dark transition-colors"
                  @click="gameStore.resetVillagerDialogue(selectedVillager.villager!.id)"
                >
                  🔄 重新对话
                </button>
              </div>
            </div>

            <div v-else-if="dialogueView" class="flex flex-col h-full">
              <div class="flex items-center justify-between mb-3 pb-2 border-b-2 border-farm-wood-dark/30">
                <button
                  class="font-pixel text-[10px] px-2 py-1 bg-farm-ui-dark border border-farm-wood-dark hover:bg-farm-gold"
                  @click="dialogueView = false"
                >
                  ← 返回
                </button>
                <span 
                  class="font-pixel text-[10px] px-2 py-0.5 border border-farm-wood-dark"
                  :style="{ backgroundColor: selectedVillager.stageColor + '33', color: selectedVillager.stageColor }"
                >
                  {{ selectedVillager.stageName }}
                </span>
              </div>

              <div v-if="currentDialogue" class="flex-1 flex flex-col">
                <div class="flex-1 bg-farm-ui border-2 border-farm-wood-dark p-4 mb-4 overflow-y-auto">
                  <div 
                    class="mb-2 font-pixel text-[12px] font-bold"
                    :style="{ 
                      color: currentDialogue.speaker === 'narrator' ? '#888' : 
                             currentDialogue.speaker === 'player' ? '#2563eb' : selectedVillager.stageColor 
                    }"
                  >
                    【{{ getSpeakerName(currentDialogue.speaker) }}】
                  </div>
                  <p 
                    class="font-pixel text-[13px] text-farm-wood-dark leading-relaxed whitespace-pre-wrap"
                    :class="{ 'italic text-farm-wood-dark/70': currentDialogue.speaker === 'narrator' }"
                  >
                    {{ currentDialogue.text }}
                  </p>
                </div>

                <div class="flex flex-col gap-2">
                  <template v-if="currentDialogue.choices && currentDialogue.choices.length > 0">
                    <button
                      v-for="(choice, idx) in currentDialogue.choices"
                      :key="idx"
                      class="font-pixel text-[12px] p-3 bg-farm-ui border-2 border-farm-wood-dark hover:bg-farm-gold transition-all text-left"
                      @click="advanceDialogue(idx)"
                    >
                      <span>{{ choice.text }}</span>
                      <span 
                        v-if="choice.affinityDelta !== 0"
                        class="ml-2 font-pixel text-[10px]"
                        :class="choice.affinityDelta > 0 ? 'text-green-600' : 'text-red-600'"
                      >
                        (好感度 {{ choice.affinityDelta > 0 ? '+' : '' }}{{ choice.affinityDelta }})
                      </span>
                    </button>
                  </template>
                  <template v-else-if="currentDialogue.isEnding">
                    <div class="font-pixel text-center text-sm text-farm-wood-dark/70 py-3">
                      ✨ 本段对话结束
                    </div>
                  </template>
                  <template v-else>
                    <button
                      class="font-pixel text-[12px] p-3 bg-farm-gold border-2 border-farm-wood-dark hover:bg-yellow-400 transition-all"
                      @click="advanceDialogue()"
                    >
                      继续 →
                    </button>
                  </template>
                </div>
              </div>
              <div v-else class="flex-1 flex items-center justify-center">
                <p class="font-pixel text-sm text-farm-wood-dark/60">暂无可进行的对话，请提升好感度解锁更多</p>
              </div>
            </div>

            <div v-else-if="giftView" class="flex flex-col h-full">
              <div class="flex items-center justify-between mb-3 pb-2 border-b-2 border-farm-wood-dark/30">
                <button
                  class="font-pixel text-[10px] px-2 py-1 bg-farm-ui-dark border border-farm-wood-dark hover:bg-farm-gold"
                  @click="giftView = false"
                >
                  ← 返回
                </button>
                <span class="font-pixel text-[11px] text-farm-wood-dark/80">选择要赠送的物品</span>
              </div>

              <div v-if="giftableItems.length > 0" class="flex-1 overflow-y-auto">
                <div class="grid grid-cols-4 gap-2">
                  <div
                    v-for="g in giftableItems"
                    :key="g.itemId"
                    class="p-2 bg-farm-ui border-2 border-farm-wood-dark/50 hover:bg-farm-gold/60 cursor-pointer transition-all flex flex-col items-center"
                    @click="giveGift(g.itemId)"
                  >
                    <span class="text-2xl">{{ g.itemData?.icon }}</span>
                    <span class="font-pixel text-[9px] text-farm-wood-dark mt-1 text-center truncate w-full">
                      {{ g.itemData?.name }}
                    </span>
                    <span class="font-pixel text-[8px] text-farm-wood-dark/60">x{{ g.quantity }}</span>
                  </div>
                </div>
                <div class="mt-4 p-2 bg-farm-ui border border-farm-wood-dark/40">
                  <div class="font-pixel text-[10px] text-farm-wood-dark/80">
                    💡 提示：赠送{{ selectedVillager.detail?.likes?.join('、') }}可获得更多好感度，
                    赠送{{ selectedVillager.detail?.dislikes?.join('、') }}会降低好感度
                  </div>
                </div>
              </div>
              <div v-else class="flex-1 flex items-center justify-center">
                <p class="font-pixel text-sm text-farm-wood-dark/60">背包中没有可赠送的物品</p>
              </div>
            </div>

            <div v-else-if="festivalView" class="flex flex-col h-full">
              <div class="flex items-center justify-between mb-3 pb-2 border-b-2 border-farm-wood-dark/30">
                <button
                  class="font-pixel text-[10px] px-2 py-1 bg-farm-ui-dark border border-farm-wood-dark hover:bg-farm-gold"
                  @click="festivalView = false"
                >
                  ← 返回
                </button>
                <span class="font-pixel text-[11px] text-orange-700">
                  {{ currentFestival?.icon }} {{ currentFestival?.name }}·节日赠礼
                </span>
              </div>

              <div class="mb-3 p-2 bg-orange-50 border-2 border-orange-300">
                <div class="font-pixel text-[11px] text-orange-800">
                  {{ currentFestival?.description }} — 品质越高，好感加成越多！
                </div>
                <div class="font-pixel text-[10px] text-orange-700 mt-1">
                  好感倍率: x{{ currentFestival?.giftAffinityMultiplier }}
                </div>
              </div>

              <div v-if="currentFestival && selectedVillagerId" class="mb-3 p-2 bg-farm-ui border border-farm-wood-dark/50">
                <div class="font-pixel text-[10px] text-farm-wood-dark/80">
                  <span class="text-green-700">✓ 喜欢: </span>
                  <span 
                    v-for="itemId in getVillagerFestivalPreference(selectedVillagerId, currentFestival.id)?.preferredItems || []" 
                    :key="itemId"
                    class="mr-1"
                  >{{ getItem(itemId)?.name || itemId }}</span>
                </div>
                <div class="font-pixel text-[10px] text-farm-wood-dark/80">
                  <span class="text-red-700">✗ 不喜: </span>
                  <span 
                    v-for="itemId in getVillagerFestivalPreference(selectedVillagerId, currentFestival.id)?.dislikedItems || []" 
                    :key="itemId"
                    class="mr-1"
                  >{{ getItem(itemId)?.name || itemId }}</span>
                </div>
              </div>

              <div v-if="currentFestivalDialogue && !festivalDialogueView" class="mb-3">
                <button
                  class="w-full font-pixel text-[11px] p-2 bg-orange-200 border-2 border-orange-400 hover:bg-orange-300 transition-colors"
                  @click="openFestivalDialogue"
                >
                  💬 开启节日对话
                </button>
              </div>

              <div v-if="festivalGiftableItems.length > 0" class="flex-1 overflow-y-auto">
                <div class="grid grid-cols-4 gap-2">
                  <div
                    v-for="g in festivalGiftableItems"
                    :key="g.itemId + '_' + g.quality"
                    class="p-2 bg-farm-ui border-2 hover:bg-farm-gold/60 cursor-pointer transition-all flex flex-col items-center"
                    :class="[
                      g.isPreferred ? 'border-green-500' : g.isDisliked ? 'border-red-400' : 'border-farm-wood-dark/50'
                    ]"
                    @click="giveFestivalGift(g.itemId, g.quality)"
                  >
                    <span class="text-2xl">{{ g.itemData?.icon }}</span>
                    <span class="font-pixel text-[9px] text-farm-wood-dark mt-1 text-center truncate w-full">
                      {{ g.itemData?.name }}
                    </span>
                    <span class="font-pixel text-[8px]" :style="{ color: g.quality >= 4 ? '#9c27b0' : g.quality >= 3 ? '#2196f3' : '#999' }">
                      {{ getQualityLabel(g.quality) }}
                    </span>
                    <span class="font-pixel text-[8px] text-farm-wood-dark/60">x{{ g.quantity }}</span>
                    <span v-if="g.isPreferred" class="font-pixel text-[7px] text-green-700">节日喜好</span>
                    <span v-if="g.isDisliked" class="font-pixel text-[7px] text-red-600">节日不喜</span>
                  </div>
                </div>
                <div class="mt-3 p-2 bg-farm-ui border border-farm-wood-dark/40">
                  <div class="font-pixel text-[10px] text-farm-wood-dark/80">
                    🎊 节日赠礼品质加成: 三星+5 | 四星+10 | 五星+18（再乘以节日倍率）
                  </div>
                </div>
              </div>
              <div v-else class="flex-1 flex items-center justify-center">
                <p class="font-pixel text-sm text-farm-wood-dark/60">背包中没有可节日赠送的物品</p>
              </div>
            </div>

            <div v-else-if="festivalDialogueView" class="flex flex-col h-full">
              <div class="flex items-center justify-between mb-3 pb-2 border-b-2 border-farm-wood-dark/30">
                <button
                  class="font-pixel text-[10px] px-2 py-1 bg-farm-ui-dark border border-farm-wood-dark hover:bg-farm-gold"
                  @click="festivalDialogueView = false"
                >
                  ← 返回
                </button>
                <span class="font-pixel text-[10px] px-2 py-0.5 border border-orange-500 text-orange-700 bg-orange-100">
                  {{ currentFestival?.icon }} {{ currentFestival?.name }}
                </span>
              </div>

              <div v-if="currentFestivalDialogue" class="flex-1 flex flex-col">
                <div class="flex-1 bg-farm-ui border-2 border-orange-300 p-4 mb-4 overflow-y-auto">
                  <div 
                    class="mb-2 font-pixel text-[12px] font-bold"
                    :style="{ 
                      color: currentFestivalDialogue.speaker === 'narrator' ? '#888' : 
                             currentFestivalDialogue.speaker === 'player' ? '#2563eb' : '#ff9800' 
                    }"
                  >
                    【{{ getSpeakerName(currentFestivalDialogue.speaker) }}】
                  </div>
                  <p 
                    class="font-pixel text-[13px] text-farm-wood-dark leading-relaxed whitespace-pre-wrap"
                    :class="{ 'italic text-farm-wood-dark/70': currentFestivalDialogue.speaker === 'narrator' }"
                  >
                    {{ currentFestivalDialogue.text }}
                  </p>
                </div>

                <div class="flex flex-col gap-2">
                  <template v-if="currentFestivalDialogue.choices && currentFestivalDialogue.choices.length > 0">
                    <button
                      v-for="(choice, idx) in currentFestivalDialogue.choices"
                      :key="idx"
                      class="font-pixel text-[12px] p-3 bg-farm-ui border-2 border-farm-wood-dark hover:bg-farm-gold transition-all text-left"
                      @click="advanceFestivalDialogue(idx)"
                    >
                      <span>{{ choice.text }}</span>
                      <span 
                        v-if="choice.affinityDelta !== 0"
                        class="ml-2 font-pixel text-[10px]"
                        :class="choice.affinityDelta > 0 ? 'text-green-600' : 'text-red-600'"
                      >
                        (好感度 {{ choice.affinityDelta > 0 ? '+' : '' }}{{ choice.affinityDelta }})
                      </span>
                    </button>
                  </template>
                  <template v-else-if="currentFestivalDialogue.isEnding">
                    <div class="font-pixel text-center text-sm text-farm-wood-dark/70 py-3">
                      🎊 节日对话结束
                    </div>
                  </template>
                  <template v-else>
                    <button
                      class="font-pixel text-[12px] p-3 bg-orange-200 border-2 border-orange-400 hover:bg-orange-300 transition-all"
                      @click="advanceFestivalDialogue()"
                    >
                      继续 →
                    </button>
                  </template>
                </div>
              </div>
              <div v-else class="flex-1 flex items-center justify-center">
                <p class="font-pixel text-sm text-farm-wood-dark/60">暂无节日对话，请提升好感度解锁更多</p>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
