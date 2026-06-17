<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { getPetConfig } from '../game/data/pets';
import type { Pet, PetBonusType } from '../game/types/game';

const gameStore = useGameStore();

const selectedPetId = ref<string | null>(null);
const renamingPetId = ref<string | null>(null);
const renameInput = ref('');
const petCooldowns = ref<Record<string, number>>({});
let cooldownTimer: number | null = null;

const selectedPet = computed(() => {
  if (!selectedPetId.value) return null;
  return gameStore.pets.find((p: Pet) => p.id === selectedPetId.value) || null;
});

const selectedPetConfig = computed(() => {
  if (!selectedPet.value) return null;
  return getPetConfig(selectedPet.value.type);
});

const activePetInfo = computed(() => {
  const pet = gameStore.activePet;
  if (!pet) return null;
  const config = getPetConfig(pet.type);
  return { pet, config };
});

const petBonusLabels: Record<string, string> = {
  crop_growth_speed: '作物生长',
  crop_yield: '作物产量',
  crop_quality: '作物品质',
  animal_production_speed: '家畜产出',
  animal_yield: '家畜产量',
  animal_quality: '家畜品质',
  water_bonus: '浇水加成',
  feed_bonus: '喂食加成',
  rare_chance: '稀有几率'
};

const happinessBarColor = computed(() => {
  if (!selectedPet.value) return 'bg-gray-400';
  const h = selectedPet.value.happiness;
  if (h >= 70) return 'bg-green-500';
  if (h >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
});

const startCooldownTimer = () => {
  if (cooldownTimer) return;
  cooldownTimer = window.setInterval(() => {
    const now = Date.now();
    let anyActive = false;
    for (const pet of gameStore.pets) {
      const elapsed = now - pet.lastPetTime;
      const remaining = Math.max(0, Math.ceil((30000 - elapsed) / 1000));
      petCooldowns.value[pet.id] = remaining;
      if (remaining > 0) anyActive = true;
    }
    if (!anyActive && cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
};

const selectPet = (petId: string) => {
  selectedPetId.value = petId;
  renamingPetId.value = null;
};

const handleSetActive = (petId: string) => {
  gameStore.setActivePet(petId);
};

const handlePet = (petId: string) => {
  const result = gameStore.petAnimal(petId);
  if (!result.success && result.remainingCooldown && result.remainingCooldown > 0) {
    startCooldownTimer();
  }
};

const handleFeed = (petId: string) => {
  gameStore.feedPet(petId);
};

const handleRelease = (petId: string) => {
  if (confirm('确定要释放这只宠物吗？释放后无法找回！')) {
    gameStore.releasePet(petId);
    if (selectedPetId.value === petId) {
      selectedPetId.value = null;
    }
  }
};

const startRename = (petId: string) => {
  const pet = gameStore.pets.find((p: Pet) => p.id === petId);
  if (pet) {
    renamingPetId.value = petId;
    renameInput.value = pet.name;
  }
};

const confirmRename = () => {
  if (renamingPetId.value && renameInput.value.trim()) {
    gameStore.renamePet(renamingPetId.value, renameInput.value.trim());
    renamingPetId.value = null;
  }
};

const cancelRename = () => {
  renamingPetId.value = null;
};

const getCooldown = (petId: string): number => {
  return petCooldowns.value[petId] || 0;
};

const formatDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};
</script>

<template>
  <div 
    v-if="gameStore.showPetPanel" 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="gameStore.showPetPanel = false"
  >
    <div class="bg-farm-ui border-4 border-farm-wood-dark p-6 shadow-pixel w-[750px] max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-pixel text-xl text-farm-wood-dark">🐾 宠物伙伴</h2>
        <button 
          class="font-pixel text-sm px-3 py-1 bg-farm-ui-dark border-2 border-farm-wood-dark hover:bg-farm-gold transition-colors"
          @click="gameStore.showPetPanel = false"
        >
          ✕ 关闭
        </button>
      </div>

      <div v-if="activePetInfo" class="mb-4 p-3 bg-farm-gold/20 border-2 border-farm-gold/50 flex items-center gap-3">
        <span class="text-3xl">{{ activePetInfo.config?.icon }}</span>
        <div class="flex-1">
          <div class="font-pixel text-sm text-farm-wood-dark">
            随行中：{{ activePetInfo.pet.name }}
          </div>
          <div class="flex gap-2 mt-1">
            <span 
              v-for="bonus in activePetInfo.config?.bonuses" 
              :key="bonus.type"
              class="font-pixel text-[9px] px-1.5 py-0.5 bg-farm-gold/30 border border-farm-gold/50 text-farm-wood-dark"
            >
              {{ petBonusLabels[bonus.type] }} +{{ (bonus.value * 100).toFixed(0) }}%
            </span>
          </div>
        </div>
        <div class="flex flex-col items-end">
          <span class="font-pixel text-[10px] text-farm-wood-dark/70">亲密度</span>
          <div class="w-24 h-2.5 bg-farm-wood-dark/20 overflow-hidden mt-1">
            <div 
              class="h-full transition-all duration-300"
              :class="activePetInfo.pet.happiness >= 70 ? 'bg-green-500' : activePetInfo.pet.happiness >= 40 ? 'bg-yellow-500' : 'bg-red-500'"
              :style="{ width: `${activePetInfo.pet.happiness}%` }"
            ></div>
          </div>
          <span class="font-pixel text-[9px] text-farm-wood-dark/70 mt-0.5">{{ Math.round(activePetInfo.pet.happiness) }}/100</span>
        </div>
      </div>

      <div v-if="gameStore.pets.length === 0" class="flex-1 flex flex-col items-center justify-center py-12">
        <span class="text-5xl mb-4">🐾</span>
        <p class="font-pixel text-sm text-farm-wood-dark">你还没有宠物</p>
        <p class="font-pixel text-[10px] text-farm-wood-dark/60 mt-1">去商店的宠物分类领养一只吧！</p>
        <button 
          class="font-pixel text-xs px-4 py-2 mt-4 bg-farm-gold border-2 border-farm-wood-dark hover:bg-farm-gold-dark transition-colors text-farm-wood-dark"
          @click="gameStore.showPetPanel = false; gameStore.showShop = true"
        >
          去商店看看
        </button>
      </div>

      <div v-else class="flex-1 flex gap-4 min-h-0">
        <div class="w-48 flex-shrink-0 overflow-y-auto space-y-2">
          <div 
            v-for="pet in gameStore.pets" 
            :key="pet.id"
            class="p-2 border-2 cursor-pointer transition-all hover:bg-farm-gold/30"
            :class="selectedPetId === pet.id ? 'border-farm-gold bg-farm-gold/20' : 'border-farm-wood-dark/50 bg-farm-ui-dark'"
            @click="selectPet(pet.id)"
          >
            <div class="flex items-center gap-2">
              <span class="text-xl">{{ getPetConfig(pet.type)?.icon }}</span>
              <div class="flex-1 min-w-0">
                <div class="font-pixel text-[10px] text-farm-wood-dark truncate">{{ pet.name }}</div>
                <div class="w-full h-1 bg-farm-wood-dark/20 overflow-hidden mt-1">
                  <div 
                    class="h-full transition-all duration-300"
                    :class="pet.happiness >= 70 ? 'bg-green-500' : pet.happiness >= 40 ? 'bg-yellow-500' : 'bg-red-500'"
                    :style="{ width: `${pet.happiness}%` }"
                  ></div>
                </div>
              </div>
              <span 
                v-if="pet.isActive" 
                class="font-pixel text-[8px] px-1 py-0.5 bg-green-500 text-white rounded"
              >随行</span>
            </div>
          </div>
        </div>

        <div v-if="selectedPet && selectedPetConfig" class="flex-1 overflow-y-auto">
          <div class="p-4 bg-farm-ui-dark border-2 border-farm-wood-dark">
            <div class="flex items-center gap-4 mb-4">
              <span class="text-5xl">{{ selectedPetConfig.icon }}</span>
              <div class="flex-1">
                <div v-if="renamingPetId === selectedPet.id" class="flex items-center gap-2">
                  <input 
                    v-model="renameInput"
                    class="font-pixel text-sm px-2 py-1 bg-white border-2 border-farm-wood-dark text-farm-wood-dark w-32"
                    maxlength="8"
                    @keyup.enter="confirmRename"
                    @keyup.escape="cancelRename"
                  />
                  <button 
                    class="font-pixel text-[9px] px-2 py-1 bg-farm-gold border border-farm-wood-dark hover:bg-farm-gold-dark"
                    @click="confirmRename"
                  >✓</button>
                  <button 
                    class="font-pixel text-[9px] px-2 py-1 bg-farm-ui border border-farm-wood-dark hover:bg-farm-ui-dark"
                    @click="cancelRename"
                  >✕</button>
                </div>
                <div v-else class="flex items-center gap-2">
                  <span class="font-pixel text-lg text-farm-wood-dark">{{ selectedPet.name }}</span>
                  <button 
                    class="font-pixel text-[9px] px-1.5 py-0.5 bg-farm-ui border border-farm-wood-dark/50 hover:bg-farm-gold/30 text-farm-wood-dark/70"
                    @click="startRename(selectedPet.id)"
                  >✏️改名</button>
                </div>
                <div class="font-pixel text-[10px] text-farm-wood-dark/60 mt-1">
                  {{ selectedPetConfig.description }}
                </div>
                <div class="font-pixel text-[9px] text-farm-wood-dark/50 mt-1">
                  领养于 {{ formatDate(selectedPet.adoptedAt) }} · 喂食 {{ selectedPet.feedCount || 0 }} 次
                </div>
              </div>
            </div>

            <div class="mb-4">
              <div class="flex items-center justify-between mb-1">
                <span class="font-pixel text-[10px] text-farm-wood-dark/70">亲密度</span>
                <span class="font-pixel text-[10px] text-farm-wood-dark">{{ Math.round(selectedPet.happiness) }}/100</span>
              </div>
              <div class="w-full h-3 bg-farm-wood-dark/20 overflow-hidden">
                <div 
                  class="h-full transition-all duration-300"
                  :class="happinessBarColor"
                  :style="{ width: `${selectedPet.happiness}%` }"
                ></div>
              </div>
              <div class="font-pixel text-[9px] text-farm-wood-dark/50 mt-1">
                亲密度越高，加成效果越强（最高额外 +{{ (selectedPetConfig.maxHappinessBonus * 100).toFixed(0) }}%）
              </div>
            </div>

            <div class="mb-4">
              <div class="font-pixel text-[10px] text-farm-wood-dark/70 mb-2">加成效果</div>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="bonus in selectedPetConfig.bonuses" 
                  :key="bonus.type"
                  class="font-pixel text-[10px] px-2.5 py-1 bg-farm-gold/20 border border-farm-gold/40 text-farm-wood-dark"
                >
                  {{ petBonusLabels[bonus.type] }} +{{ (bonus.value * 100).toFixed(0) }}%
                </span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button 
                v-if="!selectedPet.isActive"
                class="font-pixel text-xs px-4 py-2 bg-green-500 border-2 border-green-700 text-white hover:bg-green-600 transition-colors"
                @click="handleSetActive(selectedPet.id)"
              >
                🐾 设为随行
              </button>
              <span 
                v-else
                class="font-pixel text-xs px-4 py-2 bg-green-100 border-2 border-green-300 text-green-700"
              >
                ✅ 当前随行中
              </span>

              <button 
                class="font-pixel text-xs px-4 py-2 border-2 border-farm-wood-dark transition-colors"
                :class="getCooldown(selectedPet.id) > 0 ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-farm-gold hover:bg-farm-gold-dark text-farm-wood-dark'"
                :disabled="getCooldown(selectedPet.id) > 0"
                @click="handlePet(selectedPet.id)"
              >
                {{ getCooldown(selectedPet.id) > 0 ? `🖐️ 冷却 ${getCooldown(selectedPet.id)}s` : '🖐️ 抚摸' }}
              </button>

              <button 
                class="font-pixel text-xs px-4 py-2 bg-farm-gold border-2 border-farm-wood-dark hover:bg-farm-gold-dark transition-colors text-farm-wood-dark"
                @click="handleFeed(selectedPet.id)"
              >
                🍖 喂食
              </button>

              <button 
                class="font-pixel text-xs px-4 py-2 bg-red-400 border-2 border-red-600 text-white hover:bg-red-500 transition-colors ml-auto"
                @click="handleRelease(selectedPet.id)"
              >
                🚪 释放
              </button>
            </div>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <span class="text-3xl">👈</span>
            <p class="font-pixel text-[10px] text-farm-wood-dark/60 mt-2">选择一只宠物查看详情</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
