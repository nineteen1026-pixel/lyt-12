<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { getAllInsurancePlans, getUnlockedInsurancePlans, getInsurancePlan, isWeatherCovered } from '../game/data/insurance';
import type { InsurancePlanType, InsuranceClaim } from '../game/types/game';

const gameStore = useGameStore();

const allPlans = computed(() => getAllInsurancePlans());
const unlockedPlans = computed(() => getUnlockedInsurancePlans(gameStore.unlockedPlots || 0));

const currentPlan = computed(() => {
  if (!gameStore.insuranceState?.activePlan) return null;
  return getInsurancePlan(gameStore.insuranceState.activePlan);
});

const insuranceStats = computed(() => gameStore.insuranceStats);

const canAfford = (planId: InsurancePlanType): boolean => {
  const plan = getInsurancePlan(planId);
  if (!plan || !gameStore.coins) return false;
  return gameStore.coins >= plan.dailyPremium;
};

const isUnlocked = (planId: InsurancePlanType): boolean => {
  return unlockedPlans.value.some(p => p.id === planId);
};

const isActive = (planId: InsurancePlanType): boolean => {
  return gameStore.insuranceState?.activePlan === planId;
};

const handleSubscribe = (planId: InsurancePlanType) => {
  if (!isUnlocked(planId) || !canAfford(planId) || isActive(planId)) return;
  const result = gameStore.subscribeToInsurance?.(planId);
  if (result?.success) {
    // 成功提示已通过通知系统显示
  }
};

const handleCancel = () => {
  if (!gameStore.isInsured) return;
  if (confirm('确定要取消投保吗？取消后当日保费不退还。')) {
    gameStore.cancelInsurance?.();
  }
};

const getCoverageText = (planId: InsurancePlanType): string => {
  const plan = getInsurancePlan(planId);
  if (!plan) return '';
  const weatherNames: Record<string, string> = {
    stormy: '雷暴',
    snowy: '雪灾',
    drought: '干旱',
    heatwave: '热浪'
  };
  return plan.coveredWeathers.map((w: string) => weatherNames[w] || w).join('、');
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};
</script>

<template>
  <div 
    v-if="gameStore.showInsurance"
    class="fixed inset-0 z-50"
  >
    <div 
      class="absolute inset-0 bg-black/50"
      @click.self="gameStore.toggleInsuranceModal?.()"
    >
      <div class="bg-farm-ui border-4 border-farm-wood-dark p-6 shadow-pixel w-[700px] max-h-[80vh] flex flex-col absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-pixel text-xl text-farm-wood-dark">🛡️ 农作物保险</h2>
          <button 
            class="font-pixel text-sm px-3 py-1 bg-farm-ui-dark border-2 border-farm-wood-dark hover:bg-farm-gold transition-colors"
            @click="gameStore.toggleInsuranceModal?.()"
          >
            ✕ 关闭
          </button>
        </div>

        <div v-if="gameStore.insuranceState" class="mb-4 p-3 bg-farm-ui-dark border-2 border-farm-wood-dark">
          <div class="font-pixel text-sm text-farm-wood-dark mb-2">当前状态</div>
          <div v-if="gameStore.isInsured" class="flex items-center justify-between">
            <div>
              <span class="font-pixel text-farm-gold text-lg">✓ {{ currentPlan?.name }}</span>
              <div class="font-pixel text-xs text-farm-wood-dark mt-1">
                每日保费：{{ currentPlan?.dailyPremium }} 金币
              </div>
            </div>
            <button 
              class="font-pixel text-sm px-3 py-1 bg-red-500 text-white border-2 border-farm-wood-dark hover:bg-red-600 transition-colors"
              @click="handleCancel"
            >
              取消投保
            </button>
          </div>
          <div v-else class="font-pixel text-sm text-farm-wood-dark">
            暂未投保，为你的作物选择一份保障吧！
          </div>
        </div>

        <div v-if="insuranceStats" class="mb-4 grid grid-cols-3 gap-2">
          <div class="p-2 bg-farm-ui-dark border-2 border-farm-wood-dark text-center">
            <div class="font-pixel text-xs text-farm-wood-dark">累计保费</div>
            <div class="font-pixel text-farm-gold">{{ insuranceStats.totalPremiumsPaid }} 金币</div>
          </div>
          <div class="p-2 bg-farm-ui-dark border-2 border-farm-wood-dark text-center">
            <div class="font-pixel text-xs text-farm-wood-dark">累计理赔</div>
            <div class="font-pixel text-farm-gold">{{ insuranceStats.totalClaimsPaid }} 金币</div>
          </div>
          <div class="p-2 bg-farm-ui-dark border-2 border-farm-wood-dark text-center">
            <div class="font-pixel text-xs text-farm-wood-dark">理赔次数</div>
            <div class="font-pixel text-farm-gold">{{ insuranceStats.claimsCount }} 次</div>
          </div>
        </div>

        <div class="font-pixel text-sm text-farm-wood-dark mb-2">保险计划</div>
        <div class="flex-1 overflow-y-auto space-y-3">
          <div 
            v-for="plan in allPlans" 
            :key="plan.id"
            class="p-3 bg-farm-ui-dark border-2 border-farm-wood-dark transition-all"
            :class="{
              'border-farm-gold bg-farm-gold/10': isActive(plan.id),
              'opacity-50': !isUnlocked(plan.id)
            }"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-pixel text-farm-gold">{{ plan.name }}</span>
                  <span v-if="isActive(plan.id)" class="font-pixel text-xs bg-green-500 text-white px-2 py-0.5">
                    已投保
                  </span>
                  <span v-if="!isUnlocked(plan.id)" class="font-pixel text-xs text-farm-wood-dark">
                    🔒 需解锁 {{ plan.unlockPlotCount }} 块地
                  </span>
                </div>
                <div class="font-pixel text-xs text-farm-wood-dark mt-1">
                  每日保费：<span class="text-farm-gold">{{ plan.dailyPremium }} 金币</span>
                </div>
                <div class="font-pixel text-xs text-farm-wood-dark mt-1">
                  覆盖灾害：{{ getCoverageText(plan.id) }}
                </div>
                <div class="font-pixel text-xs text-farm-wood-dark mt-1">
                  赔付倍率：{{ (plan.payoutMultiplier * 100).toFixed(0) }}% 基础售价
                </div>
                <div class="font-pixel text-xs text-farm-wood-dark mt-1">
                  品质加成：每星 +{{ (plan.qualityBonus * 100).toFixed(0) }}%
                </div>
              </div>
              <button 
                v-if="!isActive(plan.id)"
                class="font-pixel text-sm px-4 py-2 border-2 border-farm-wood-dark transition-colors"
                :class="{
                  'bg-farm-gold hover:bg-farm-gold/80 cursor-pointer': isUnlocked(plan.id) && canAfford(plan.id),
                  'bg-gray-400 cursor-not-allowed': !isUnlocked(plan.id) || !canAfford(plan.id)
                }"
                :disabled="!isUnlocked(plan.id) || !canAfford(plan.id)"
                @click="handleSubscribe(plan.id)"
              >
                投保
              </button>
            </div>
            <div class="font-pixel text-xs text-farm-wood-dark mt-2 italic">
              {{ plan.description }}
            </div>
          </div>
        </div>

        <div v-if="gameStore.insuranceState && gameStore.insuranceState.claimHistory.length > 0" class="mt-4">
          <div class="font-pixel text-sm text-farm-wood-dark mb-2">最近理赔记录</div>
          <div class="max-h-32 overflow-y-auto space-y-1">
            <div 
              v-for="(claim, index) in gameStore.insuranceState!.claimHistory.slice().reverse().slice(0, 5)" 
              :key="index"
              class="p-2 bg-farm-ui-dark border border-farm-wood-dark flex justify-between items-center"
            >
              <div>
                <span class="font-pixel text-xs text-farm-wood-dark">
                  {{ formatDate(claim.claimedAt) }} · {{ claim.weatherType }}
                </span>
                <span class="font-pixel text-xs text-farm-wood-dark ml-2">
                  {{ claim.cropsLost }} 株作物
                </span>
              </div>
              <span class="font-pixel text-sm text-farm-gold">+{{ claim.payout }} 金币</span>
            </div>
          </div>
        </div>

        <div class="mt-4 p-2 bg-farm-ui-dark border-2 border-farm-wood-dark">
          <div class="font-pixel text-xs text-farm-wood-dark">
            💡 提示：高品质作物赔付更高。建筑防护可以减少灾害损失，与保险搭配使用效果更佳！
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
