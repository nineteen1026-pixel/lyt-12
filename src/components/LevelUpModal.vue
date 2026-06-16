<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import type { LevelUpResult } from '../game/types/game';
import { getSkillNode } from '../game/data/skillTree';

const gameStore = useGameStore();

const showModal = ref(false);
const currentLevelUp = ref<LevelUpResult | null>(null);
const pendingLevelUps = ref<LevelUpResult[]>([]);
const isAnimating = ref(false);
const showConfetti = ref(false);

const unlockedSkillNames = computed(() => {
  if (!currentLevelUp.value) return [];
  return currentLevelUp.value.unlockedSkills.map(id => {
    const node = getSkillNode(id);
    return node?.name || id;
  });
});

function showLevelUp(levelUp: LevelUpResult) {
  pendingLevelUps.value.push(levelUp);
  if (!isAnimating.value) {
    showNextLevelUp();
  }
}

function showNextLevelUp() {
  if (pendingLevelUps.value.length === 0) {
    showModal.value = false;
    isAnimating.value = false;
    return;
  }

  isAnimating.value = true;
  currentLevelUp.value = pendingLevelUps.value.shift()!;
  showModal.value = true;
  showConfetti.value = true;

  setTimeout(() => {
    showConfetti.value = false;
  }, 2000);
}

function closeModal() {
  showNextLevelUp();
}

function skipAll() {
  pendingLevelUps.value = [];
  showModal.value = false;
  isAnimating.value = false;
  showConfetti.value = false;
}

defineExpose({
  showLevelUp
});
</script>

<template>
  <Teleport to="body">
    <Transition name="levelup">
      <div 
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @click.self="closeModal"
      >
        <div 
          v-if="showConfetti"
          class="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div 
            v-for="i in 50" 
            :key="i"
            class="absolute w-2 h-2 rounded-full animate-confetti"
            :style="{
              left: `${Math.random() * 100}%`,
              top: '-20px',
              backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'][Math.floor(Math.random() * 7)],
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${1.5 + Math.random()}s`
            }"
          ></div>
        </div>

        <div class="relative bg-gradient-to-b from-yellow-400 via-yellow-500 to-orange-500 border-4 border-yellow-700 p-8 max-w-md w-full mx-4 shadow-pixel animate-bounce-in">
          <div class="absolute -top-6 left-1/2 -translate-x-1/2">
            <div class="text-6xl animate-pulse">⬆️</div>
          </div>

          <div class="text-center mt-6">
            <h2 class="font-pixel text-3xl text-white mb-2 animate-pulse">
              等级提升！
            </h2>
            
            <div class="my-6">
              <div class="font-pixel text-6xl text-white drop-shadow-lg animate-scale-in">
                Lv.{{ currentLevelUp?.newLevel }}
              </div>
            </div>

            <div class="bg-white/20 rounded-lg p-4 mb-4">
              <div class="font-pixel text-lg text-yellow-100 mb-2">
                🎁 获得天赋点
              </div>
              <div class="font-pixel text-4xl text-white">
                +{{ currentLevelUp?.skillPointsGained }}
              </div>
            </div>

            <div v-if="unlockedSkillNames.length > 0" class="bg-purple-500/30 rounded-lg p-4 mb-4">
              <div class="font-pixel text-sm text-purple-100 mb-2">
                🔓 解锁新技能
              </div>
              <div class="font-pixel text-lg text-white">
                {{ unlockedSkillNames.join('、') }}
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button 
                v-if="pendingLevelUps.length > 0"
                class="flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-pixel text-sm border-2 border-gray-700 transition-all"
                @click="skipAll"
              >
                跳过全部 ({{ pendingLevelUps.length }})
              </button>
              <button 
                class="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-pixel text-sm border-2 border-green-700 transition-all hover:scale-105 active:scale-95"
                @click="closeModal"
              >
                {{ pendingLevelUps.length > 0 ? '下一个' : '太棒了！' }}
              </button>
            </div>

            <p class="font-pixel text-xs text-yellow-100/70 mt-4">
              点击工具栏"技能"按钮分配天赋点
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.levelup-enter-active,
.levelup-leave-active {
  transition: all 0.3s ease;
}

.levelup-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.levelup-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

@keyframes bounce-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-bounce-in {
  animation: bounce-in 0.5s ease-out;
}

@keyframes scale-in {
  0% {
    transform: scale(0);
  }
  70% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.6s ease-out;
}

@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.animate-confetti {
  animation: confetti 2s ease-out forwards;
}
</style>
