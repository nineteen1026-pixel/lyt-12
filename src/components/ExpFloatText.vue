<script setup lang="ts">
import { ref, computed } from 'vue';

export interface FloatExpItem {
  id: number;
  amount: number;
  reason?: string;
  x: number;
  y: number;
  type: 'exp' | 'levelup' | 'skillpoint';
}

const floatTexts = ref<FloatExpItem[]>([]);
let nextId = 0;

const EXP_REASON_NAMES: Record<string, string> = {
  crop_harvested: '收获作物',
  seed_planted: '播种',
  product_collected: '收集产品',
  animal_bought: '购买动物',
  quality_harvest_1: '普通品质',
  quality_harvest_2: '良好品质',
  quality_harvest_3: '优质品质',
  quality_harvest_4: '稀有品质',
  quality_harvest_5: '传说品质'
};

function getReasonName(reason?: string): string {
  if (!reason) return '';
  return EXP_REASON_NAMES[reason] || reason;
}

function showFloatExp(amount: number, reason?: string, x?: number, y?: number, type: 'exp' | 'levelup' | 'skillpoint' = 'exp') {
  const id = ++nextId;
  
  const posX = x ?? (window.innerWidth / 2 + (Math.random() - 0.5) * 100);
  const posY = y ?? (window.innerHeight / 2 + (Math.random() - 0.5) * 50);
  
  const item: FloatExpItem = {
    id,
    amount,
    reason,
    x: posX,
    y: posY,
    type
  };
  
  floatTexts.value.push(item);
  
  setTimeout(() => {
    const index = floatTexts.value.findIndex(t => t.id === id);
    if (index > -1) {
      floatTexts.value.splice(index, 1);
    }
  }, 2000);
}

function getTypeClasses(item: FloatExpItem) {
  switch (item.type) {
    case 'levelup':
      return 'text-yellow-300 text-2xl';
    case 'skillpoint':
      return 'text-purple-300 text-xl';
    default:
      return 'text-green-300 text-lg';
  }
}

function getTypeIcon(item: FloatExpItem) {
  switch (item.type) {
    case 'levelup':
      return '⬆️';
    case 'skillpoint':
      return '⭐';
    default:
      return '✨';
  }
}

defineExpose({
  showFloatExp
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <TransitionGroup name="float-exp">
        <div
          v-for="item in floatTexts"
          :key="item.id"
          class="absolute font-pixel font-bold drop-shadow-lg flex items-center gap-1 animate-float-up"
          :class="getTypeClasses(item)"
          :style="{
            left: `${item.x}px`,
            top: `${item.y}px`,
            transform: 'translate(-50%, -50%)'
          }"
        >
          <span>{{ getTypeIcon(item) }}</span>
          <span v-if="item.type === 'exp'">+{{ item.amount }} 经验</span>
          <span v-else-if="item.type === 'levelup'">升级！Lv.{{ item.amount }}</span>
          <span v-else-if="item.type === 'skillpoint'">+{{ item.amount }} 天赋点</span>
          <span 
            v-if="item.reason && item.type === 'exp'" 
            class="text-xs opacity-70 ml-1"
          >
            ({{ getReasonName(item.reason) }})
          </span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.float-exp-enter-active {
  transition: all 0.3s ease-out;
}

.float-exp-leave-active {
  transition: all 1.7s ease-in;
}

.float-exp-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}

.float-exp-leave-to {
  opacity: 0;
  transform: translate(-50%, -150%) scale(1.2);
}

@keyframes float-up {
  0% {
    transform: translate(-50%, -50%) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) translateY(-80px);
    opacity: 0;
  }
}

.animate-float-up {
  animation: float-up 2s ease-out forwards;
}
</style>
