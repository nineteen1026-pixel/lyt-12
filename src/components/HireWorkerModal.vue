<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { getVillagerDetail, STAGE_NAMES, STAGE_COLORS } from '../game/data/villagers';
import { TASK_DESCRIPTIONS, TASK_ICONS, getAvailableTasksForStage, getAvailableTasksForReputation, getDailyWage, getYieldShareRate, canHireVillager, getMaxHireSlots } from '../game/data/farmWorkers';
import type { FarmWorkerTaskType, AffinityStage } from '../game/types/game';

const gameStore = useGameStore();

const allVillagersInfo = computed(() => gameStore.allVillagersInfo);
const activeSlots = computed(() => gameStore.farmHireActiveSlots);
const maxSlots = computed(() => gameStore.farmHireMaxSlots);
const usedSlots = computed(() => gameStore.farmHireUsedSlots);
const availableSlots = computed(() => gameStore.farmHireAvailableSlots);
const totalDailyWage = computed(() => gameStore.farmHireTotalDailyWage);
const coins = computed(() => gameStore.coins);
const reputationLevel = computed(() => gameStore.reputationLevelInfo);
const unlockedTasks = computed(() => getAvailableTasksForReputation(reputationLevel.value.level));

const hiredVillagerIds = computed(() => new Set(activeSlots.value.map(s => s.villagerId)));

const hireableVillagers = computed(() => {
  return allVillagersInfo.value.filter(v => {
    const stage = v.stage as AffinityStage;
    return canHireVillager(stage) && v.villager?.id && !hiredVillagerIds.value.has(v.villager.id) && unlockedTasks.value.length > 0;
  });
});

const hiredVillagers = computed(() => {
  return activeSlots.value.map(slot => {
    const info = allVillagersInfo.value.find(v => v.villager?.id === slot.villagerId);
    return { slot, info };
  }).filter(v => v.info);
});

const getTaskIcon = (type: FarmWorkerTaskType) => TASK_ICONS[type] || '';
const getTaskDesc = (type: FarmWorkerTaskType) => TASK_DESCRIPTIONS[type] || type;

const handleHire = (villagerId: string) => {
  gameStore.hireWorker(villagerId);
};

const handleDismiss = (villagerId: string) => {
  gameStore.dismissWorker(villagerId);
};

const handleToggleTask = (villagerId: string, taskType: FarmWorkerTaskType) => {
  gameStore.toggleWorkerTask(villagerId, taskType);
};

const getNextUnlockInfo = computed(() => {
  const current = reputationLevel.value.level;
  if (current >= 5) return null;
  const nextLevel = current + 1;
  const nextSlots = getMaxHireSlots(nextLevel);
  const currentSlots = getMaxHireSlots(current);
  const nextTasks = getAvailableTasksForReputation(nextLevel);
  const currentTasks = getAvailableTasksForReputation(current);
  const newTasks = nextTasks.filter(t => !currentTasks.includes(t));
  return {
    level: nextLevel,
    additionalSlots: nextSlots - currentSlots,
    newTasks
  };
});
</script>

<template>
  <div
    v-if="gameStore.showHireWorker"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="gameStore.closeHireWorkerPanel()"
  >
    <div class="bg-farm-ui border-4 border-farm-wood-dark p-5 shadow-pixel w-[780px] max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-pixel text-xl text-farm-wood-dark">👷 农场雇工</h2>
        <div class="flex items-center gap-3">
          <div class="font-pixel text-xs text-farm-wood-dark/80">
            名额: {{ usedSlots }}/{{ maxSlots }} |
            日薪合计: {{ totalDailyWage }}💰 |
            余额: {{ coins }}💰
          </div>
          <button
            class="font-pixel text-sm px-3 py-1 bg-farm-ui-dark border-2 border-farm-wood-dark hover:bg-farm-gold transition-colors"
            @click="gameStore.closeHireWorkerPanel()"
          >
            ✕ 关闭
          </button>
        </div>
      </div>

      <div v-if="maxSlots === 0" class="flex-1 flex flex-col items-center justify-center gap-4">
        <p class="font-pixel text-sm text-farm-wood-dark/70">声望等级不足，无法雇佣村民</p>
        <p class="font-pixel text-[11px] text-farm-wood-dark/50">声望等级2「热心农夫」可解锁1个雇工名额</p>
      </div>

      <template v-else>
        <div class="flex gap-4 flex-1 min-h-0">
          <!-- 已雇佣列表 -->
          <div class="w-1/2 flex-shrink-0 bg-farm-ui-dark border-2 border-farm-wood-dark p-3 flex flex-col min-h-0">
            <h3 class="font-pixel text-sm text-farm-wood-dark mb-3 border-b-2 border-farm-wood-dark/50 pb-2">
              📋 已雇佣 ({{ usedSlots }}/{{ maxSlots }})
            </h3>
            <div v-if="hiredVillagers.length === 0" class="flex-1 flex items-center justify-center">
              <p class="font-pixel text-[11px] text-farm-wood-dark/50">暂未雇佣任何村民</p>
            </div>
            <div v-else class="flex flex-col gap-2 overflow-y-auto flex-1">
              <div
                v-for="{ slot, info } in hiredVillagers"
                :key="slot.villagerId"
                class="p-3 bg-farm-ui border-2 border-farm-wood-dark/50"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ info?.detail?.avatar || info?.villager?.avatar }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="font-pixel text-[12px] text-farm-wood-dark">{{ info?.detail?.name || info?.villager?.name }}</div>
                    <div class="font-pixel text-[9px] text-farm-wood-dark/70">
                      日薪{{ slot.dailyWage }}💰 · 分成{{ Math.round(slot.yieldShareRate * 100) }}%
                    </div>
                  </div>
                  <button
                    class="font-pixel text-[10px] px-2 py-1 bg-red-100 border border-red-600 text-red-700 hover:bg-red-200 transition-colors"
                    @click="handleDismiss(slot.villagerId)"
                  >
                    解雇
                  </button>
                </div>
                <!-- 任务开关 -->
                <div class="flex flex-col gap-1">
                  <div
                    v-for="task in slot.tasks"
                    :key="task.type"
                    class="flex items-center gap-2 p-1"
                  >
                    <button
                      class="w-6 h-6 flex items-center justify-center border-2 transition-colors"
                      :class="task.enabled
                        ? 'bg-green-300 border-green-700 text-green-900'
                        : 'bg-farm-ui-dark border-farm-wood-dark/50 text-farm-wood-dark/40'"
                      @click="handleToggleTask(slot.villagerId, task.type)"
                    >
                      <span class="font-pixel text-[10px]">{{ task.enabled ? '✓' : '✗' }}</span>
                    </button>
                    <span class="font-pixel text-[10px]">{{ getTaskIcon(task.type) }}</span>
                    <span class="font-pixel text-[10px] text-farm-wood-dark/80">{{ getTaskDesc(task.type) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 可雇佣列表 -->
          <div class="w-1/2 bg-farm-ui-dark border-2 border-farm-wood-dark p-3 flex flex-col min-h-0">
            <h3 class="font-pixel text-sm text-farm-wood-dark mb-3 border-b-2 border-farm-wood-dark/50 pb-2">
              👤 可雇佣村民
            </h3>
            <div v-if="hireableVillagers.length === 0" class="flex-1 flex items-center justify-center">
              <p class="font-pixel text-[11px] text-farm-wood-dark/50">
                {{ availableSlots > 0 ? (unlockedTasks.length === 0 ? '声望等级不足，暂无可解锁的农活' : '没有可雇佣的村民（需好感度≥初识）') : '雇工名额已满' }}
              </p>
            </div>
            <div v-else class="flex flex-col gap-2 overflow-y-auto flex-1">
              <div
                v-for="v in hireableVillagers"
                :key="v.villager?.id"
                class="p-3 bg-farm-ui border-2 border-farm-wood-dark/50"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ v.detail?.avatar || v.villager?.avatar }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="font-pixel text-[12px] text-farm-wood-dark">{{ v.detail?.name || v.villager?.name }}</div>
                    <div class="font-pixel text-[9px]" :style="{ color: v.stageColor }">
                      {{ v.stageName }}
                    </div>
                  </div>
                  <button
                    class="font-pixel text-[11px] px-3 py-1 bg-farm-gold border-2 border-farm-wood-dark hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="availableSlots <= 0 || coins < getDailyWage(v.stage as any)"
                    @click="handleHire(v.villager!.id)"
                  >
                    雇佣
                  </button>
                </div>
                <div class="font-pixel text-[9px] text-farm-wood-dark/70 mb-1">
                  日薪: {{ getDailyWage(v.stage as any) }}💰 · 产量分成: {{ Math.round(getYieldShareRate(v.stage as any) * 100) }}%
                </div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="task in unlockedTasks"
                    :key="task"
                    class="font-pixel text-[9px] px-1.5 py-0.5 bg-farm-ui-dark border border-farm-wood-dark/40 text-farm-wood-dark/70"
                  >
                    {{ getTaskIcon(task) }} {{ task === 'till' ? '翻地' : task === 'water' ? '浇水' : '收获' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部信息栏 -->
        <div class="mt-4 pt-3 border-t-2 border-farm-wood-dark/30 flex items-center justify-between">
          <div class="font-pixel text-[10px] text-farm-wood-dark/70">
            <span>💡 好感度越高，日薪越低，分成越少。声望等级解锁农活类型：2级→翻地，3级→浇水，4级→收获。</span>
            <span v-if="getNextUnlockInfo" class="ml-2 text-farm-gold">
              声望等级{{ getNextUnlockInfo.level }}可解锁
              <template v-if="getNextUnlockInfo.additionalSlots > 0">+{{ getNextUnlockInfo.additionalSlots }}个名额</template>
              <template v-if="getNextUnlockInfo.additionalSlots > 0 && getNextUnlockInfo.newTasks.length > 0">、</template>
              <template v-if="getNextUnlockInfo.newTasks.length > 0">
                {{ getNextUnlockInfo.newTasks.map(t => t === 'till' ? '翻地' : t === 'water' ? '浇水' : '收获').join('、') }}
              </template>
            </span>
          </div>
          <div class="font-pixel text-[11px] text-farm-wood-dark">
            每日工资: <span :class="totalDailyWage > coins ? 'text-red-600' : 'text-farm-wood-dark'">{{ totalDailyWage }}💰</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
</style>
