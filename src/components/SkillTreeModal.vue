<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../game/stores/gameStore';
import { SKILL_BRANCHES, SKILL_NODES, getSkillNode, getBranchConfig, getSkillsByBranch } from '../game/data/skillTree';
import type { SkillBranch, SkillNode as SkillNodeType } from '../game/types/game';

const gameStore = useGameStore();
const activeBranch = ref<SkillBranch | 'all'>('all');
const selectedSkill = ref<string | null>(null);

const branches = computed(() => [
  { id: 'all' as const, name: '全部', icon: '🌳', color: '#795548' },
  ...SKILL_BRANCHES
]);

const filteredSkills = computed(() => {
  let list = SKILL_NODES;
  if (activeBranch.value !== 'all') {
    list = list.filter(s => s.branch === activeBranch.value);
  }
  return list.map(s => ({
    ...s,
    currentLevel: gameStore.getSkillNodeLevel(s.id),
    isMaxed: gameStore.getSkillNodeLevel(s.id) >= s.maxLevel,
    canUnlock: gameStore.canUnlockSkillNode(s.id).canUnlock,
    unlockReason: gameStore.canUnlockSkillNode(s.id).reason,
    isLocked: gameStore.skillTreeLevel < s.unlockAtLevel,
    requirementsMet: s.requires.every(reqId => gameStore.getSkillNodeLevel(reqId) >= (getSkillNode(reqId)?.maxLevel || 1))
  }));
});

const overallProgress = computed(() => {
  const total = SKILL_NODES.reduce((sum, s) => sum + s.maxLevel, 0);
  const current = gameStore.skillTotalLevels;
  return total > 0 ? Math.floor((current / total) * 100) : 0;
});

const getBranchColor = (branch: string) => {
  return getBranchConfig(branch)?.color || '#9e9e9e';
};

const getBranchName = (branch: string) => {
  return getBranchConfig(branch)?.name || branch;
};

const selectSkill = (id: string) => {
  selectedSkill.value = selectedSkill.value === id ? null : id;
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

const unlockSkill = (id: string, event: MouseEvent | Event) => {
  setExpPosFromEvent(event);
  const result = gameStore.unlockSkillNode(id);
  if (result.success) {
    selectedSkill.value = null;
  }
};

const getEffectDescription = (effect: { type: string; value: number; perLevel: boolean }, level: number) => {
  const actualValue = effect.perLevel ? effect.value * level : effect.value;
  const percent = Math.round(actualValue * 100);
  
  const effectNames: Record<string, string> = {
    'crop_growth_speed': '作物生长速度',
    'crop_yield': '额外收获概率',
    'crop_quality': '作物高品质概率',
    'animal_production_speed': '动物产出速度',
    'animal_yield': '动物额外产出概率',
    'animal_quality': '动物产品高品质概率',
    'water_bonus': '浇水品质加成',
    'feed_bonus': '喂养品质加成',
    'greenhouse_boost': '温室效果',
    'rare_chance': '稀有品质概率'
  };
  
  const name = effectNames[effect.type] || effect.type;
  return `${name} +${percent}%`;
};

const close = () => {
  gameStore.closeSkillTreeModal();
  selectedSkill.value = null;
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};
</script>

<template>
  <div 
    v-if="gameStore.showSkillTree" 
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="close"
  >
    <div class="bg-farm-ui border-4 border-farm-wood-dark p-6 shadow-pixel w-[900px] max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-pixel text-xl text-farm-wood-dark">🌳 技能树系统</h2>
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
            <span class="text-4xl">🌟</span>
            <div>
              <div class="font-pixel text-sm text-farm-wood-dark">
                等级 Lv.{{ gameStore.skillTreeLevel }}
              </div>
              <div class="font-pixel text-[10px] text-farm-wood-dark/60 mt-1">
                总经验 {{ formatNumber(gameStore.skillTreeTotalExperience) }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-6">
            <div class="text-center">
              <div class="font-pixel text-lg text-farm-gold-dark">{{ gameStore.skillPoints }}</div>
              <div class="font-pixel text-[9px] text-farm-wood-dark/60">天赋点</div>
            </div>
            <div class="text-center">
              <div class="font-pixel text-lg text-green-600">{{ gameStore.skillNodesUnlocked }}/{{ SKILL_NODES.length }}</div>
              <div class="font-pixel text-[9px] text-farm-wood-dark/60">已解锁技能</div>
            </div>
            <div class="text-center">
              <div class="font-pixel text-lg text-blue-600">{{ overallProgress }}%</div>
              <div class="font-pixel text-[9px] text-farm-wood-dark/60">总进度</div>
            </div>
          </div>
        </div>
        <div class="w-full h-4 bg-farm-wood-dark/30 border border-farm-wood-dark overflow-hidden relative">
          <div 
            class="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
            :style="{ width: `${gameStore.skillExperienceProgress * 100}%` }"
          ></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="font-pixel text-[10px] text-white drop-shadow">
              {{ Math.floor(gameStore.skillExperienceProgress * 100) }}% 到下一级
            </span>
          </div>
        </div>
      </div>

      <div class="flex gap-2 mb-4 flex-wrap">
        <button 
          v-for="branch in branches" 
          :key="branch.id"
          class="font-pixel text-[10px] px-3 py-1.5 border-2 border-farm-wood-dark transition-colors flex items-center gap-1"
          :class="activeBranch === branch.id ? 'bg-farm-gold' : 'bg-farm-ui-dark hover:bg-farm-gold/50'"
          @click="activeBranch = branch.id"
        >
          <span>{{ branch.icon }}</span>
          <span>{{ branch.name }}</span>
          <span 
            v-if="branch.id !== 'all'"
            class="text-farm-wood-dark/60"
          >
            ({{ getSkillsByBranch(branch.id).filter(s => gameStore.getSkillNodeLevel(s.id) > 0).length }}/{{ getSkillsByBranch(branch.id).length }})
          </span>
        </button>
      </div>

      <div v-if="gameStore.skillEffectBonus" class="mb-4 p-3 bg-farm-gold/20 border-2 border-farm-gold rounded">
        <div class="font-pixel text-xs text-farm-wood-dark mb-2">✨ 当前加成效果</div>
        <div class="grid grid-cols-5 gap-2">
          <div v-if="gameStore.skillEffectBonus.cropGrowthSpeed > 0" class="text-center">
            <div class="text-lg">🌱</div>
            <div class="font-pixel text-[9px] text-farm-wood-dark">生长速度</div>
            <div class="font-pixel text-xs text-green-600">+{{ Math.round(gameStore.skillEffectBonus.cropGrowthSpeed * 100) }}%</div>
          </div>
          <div v-if="gameStore.skillEffectBonus.cropYield > 0" class="text-center">
            <div class="text-lg">🌾</div>
            <div class="font-pixel text-[9px] text-farm-wood-dark">作物产量</div>
            <div class="font-pixel text-xs text-green-600">+{{ Math.round(gameStore.skillEffectBonus.cropYield * 100) }}%</div>
          </div>
          <div v-if="gameStore.skillEffectBonus.animalProductionSpeed > 0" class="text-center">
            <div class="text-lg">🐄</div>
            <div class="font-pixel text-[9px] text-farm-wood-dark">产出速度</div>
            <div class="font-pixel text-xs text-green-600">+{{ Math.round(gameStore.skillEffectBonus.animalProductionSpeed * 100) }}%</div>
          </div>
          <div v-if="gameStore.skillEffectBonus.animalYield > 0" class="text-center">
            <div class="text-lg">🥚</div>
            <div class="font-pixel text-[9px] text-farm-wood-dark">动物产量</div>
            <div class="font-pixel text-xs text-green-600">+{{ Math.round(gameStore.skillEffectBonus.animalYield * 100) }}%</div>
          </div>
          <div v-if="gameStore.skillEffectBonus.rareChance > 0" class="text-center">
            <div class="text-lg">💎</div>
            <div class="font-pixel text-[9px] text-farm-wood-dark">稀有品质</div>
            <div class="font-pixel text-xs text-green-600">+{{ Math.round(gameStore.skillEffectBonus.rareChance * 100) }}%</div>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="filteredSkills.length > 0" class="grid grid-cols-3 gap-3">
          <div 
            v-for="skill in filteredSkills" 
            :key="skill.id"
            class="p-3 border-2 border-farm-wood-dark transition-all cursor-pointer relative"
            :class="{
              'bg-farm-ui-dark/50 opacity-50': skill.isLocked,
              'bg-farm-ui-dark': !skill.isLocked && !skill.isMaxed && !skill.canUnlock,
              'bg-green-50 border-green-400': skill.isMaxed,
              'bg-yellow-50 border-yellow-500': skill.canUnlock && !skill.isMaxed,
              'ring-2 ring-farm-gold': selectedSkill === skill.id
            }"
            :style="skill.isMaxed ? { borderLeftColor: getBranchColor(skill.branch), borderLeftWidth: '4px' } : {}"
            @click="selectSkill(skill.id)"
          >
            <div v-if="skill.isLocked" class="absolute top-1 right-1 text-lg">🔒</div>
            <div v-if="skill.isMaxed" class="absolute top-1 right-1 text-green-500 text-lg">✓</div>
            
            <div class="flex items-start gap-2 mb-2">
              <span 
                class="text-3xl"
                :class="{ 'grayscale': skill.isLocked && !skill.isMaxed }"
              >
                {{ skill.icon }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-pixel text-xs text-farm-wood-dark truncate">
                    {{ skill.isLocked ? '???' : skill.name }}
                  </span>
                  <span 
                    class="font-pixel text-[8px] px-1.5 py-0.5 text-white shrink-0"
                    :style="{ backgroundColor: getBranchColor(skill.branch) }"
                  >
                    {{ getBranchName(skill.branch) }}
                  </span>
                </div>
                <div class="font-pixel text-[9px] text-farm-wood-dark/70">
                  Lv.{{ skill.currentLevel }}/{{ skill.maxLevel }}
                </div>
              </div>
            </div>

            <div class="w-full h-1.5 bg-farm-wood-dark/20 overflow-hidden mb-2">
              <div 
                class="h-full transition-all duration-300"
                :class="skill.isMaxed ? 'bg-green-500' : 'bg-farm-gold'"
                :style="{ width: `${(skill.currentLevel / skill.maxLevel) * 100}%` }"
              ></div>
            </div>

            <div class="font-pixel text-[8px] text-farm-wood-dark/70 mb-2 line-clamp-2">
              {{ skill.isLocked ? `需要等级 ${skill.unlockAtLevel} 解锁` : skill.description }}
            </div>

            <div v-if="selectedSkill === skill.id && !skill.isLocked" class="mt-2 pt-2 border-t border-farm-wood-dark/20">
              <div class="font-pixel text-[8px] text-farm-wood-dark mb-1">效果：</div>
              <div 
                v-for="(effect, idx) in skill.effects" 
                :key="idx"
                class="font-pixel text-[8px] text-green-600"
              >
                • {{ getEffectDescription(effect, skill.currentLevel) }}
                <span v-if="skill.currentLevel < skill.maxLevel" class="text-farm-gold-dark">
                  (下一级: {{ getEffectDescription(effect, skill.currentLevel + 1) }})
                </span>
              </div>

              <div v-if="skill.requires.length > 0" class="mt-2">
                <div class="font-pixel text-[8px] text-farm-wood-dark mb-1">前置技能：</div>
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="reqId in skill.requires" 
                    :key="reqId"
                    class="font-pixel text-[7px] px-1.5 py-0.5 border border-farm-wood-dark"
                    :class="gameStore.getSkillNodeLevel(reqId) >= (getSkillNode(reqId)?.maxLevel || 1) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  >
                    {{ getSkillNode(reqId)?.name || reqId }}
                    {{ gameStore.getSkillNodeLevel(reqId) }}/{{ getSkillNode(reqId)?.maxLevel || 1 }}
                  </span>
                </div>
              </div>

              <div v-if="!skill.isMaxed" class="mt-3">
                <button
                  class="w-full font-pixel text-xs px-3 py-2 border-2 border-farm-wood-dark transition-colors"
                  :class="{
                    'bg-farm-gold hover:bg-farm-gold-dark cursor-pointer': skill.canUnlock,
                    'bg-gray-200 cursor-not-allowed opacity-50': !skill.canUnlock
                  }"
                  :disabled="!skill.canUnlock"
                  @click.stop="unlockSkill(skill.id, $event)"
                >
                  <span v-if="skill.canUnlock">✨ 解锁 (消耗1天赋点)</span>
                  <span v-else>{{ skill.unlockReason }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12">
          <span class="text-5xl">🌳</span>
          <p class="font-pixel text-sm text-farm-wood-dark mt-4">没有匹配的技能</p>
        </div>
      </div>
    </div>
  </div>
</template>
