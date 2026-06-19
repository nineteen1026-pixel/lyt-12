<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import { useGameStore } from './game/stores/gameStore';
import GameCanvas from './components/GameCanvas.vue';
import StatusBar from './components/StatusBar.vue';
import ToolBar from './components/ToolBar.vue';
import InventoryModal from './components/InventoryModal.vue';
import ShopModal from './components/ShopModal.vue';
import OrdersModal from './components/OrdersModal.vue';
import BuildingsModal from './components/BuildingsModal.vue';
import AchievementsModal from './components/AchievementsModal.vue';
import CodexModal from './components/CodexModal.vue';
import SkillTreeModal from './components/SkillTreeModal.vue';
import LevelUpModal from './components/LevelUpModal.vue';
import ExpFloatText from './components/ExpFloatText.vue';
import MiningModal from './components/MiningModal.vue';
import PetPanel from './components/PetPanel.vue';
import VillagerPanel from './components/VillagerPanel.vue';
import HireWorkerModal from './components/HireWorkerModal.vue';
import AuctionModal from './components/AuctionModal.vue';

const gameStore = useGameStore();
const isLoading = ref(true);

const levelUpModalRef = ref<InstanceType<typeof LevelUpModal> | null>(null);
const expFloatTextRef = ref<InstanceType<typeof ExpFloatText> | null>(null);

onMounted(async () => {
  await gameStore.initGame();
  isLoading.value = false;
  
  await nextTick();
  if (levelUpModalRef.value) {
    gameStore.setLevelUpModalRef(levelUpModalRef.value);
  }
  if (expFloatTextRef.value) {
    gameStore.setExpFloatTextRef(expFloatTextRef.value);
  }
});
</script>

<template>
  <div class="min-h-screen bg-farm-wood-dark flex flex-col items-center justify-center p-4">
    <div v-if="isLoading" class="text-center">
      <div class="text-6xl mb-4 animate-bounce">🌱</div>
      <p class="font-pixel text-farm-ui text-lg">正在加载像素农场...</p>
    </div>
    
    <template v-else>
      <div class="flex flex-col gap-4 w-full max-w-[1024px]">
        <StatusBar />
        
        <div class="flex-1 min-h-[512px] bg-farm-wood border-4 border-farm-wood-dark shadow-pixel overflow-hidden">
          <GameCanvas />
        </div>
        
        <ToolBar />
      </div>
      
      <InventoryModal />
      <ShopModal />
      <OrdersModal />
      <BuildingsModal />
      <AchievementsModal />
      <CodexModal />
      <SkillTreeModal />
      <LevelUpModal ref="levelUpModalRef" />
      <ExpFloatText ref="expFloatTextRef" />
      <MiningModal />
      <PetPanel />
      <VillagerPanel />
      <HireWorkerModal />
      <AuctionModal />
      
      <div class="fixed top-4 right-4 flex flex-col gap-2 z-40">
        <transition-group name="notification">
          <div 
            v-for="notification in gameStore.notifications" 
            :key="notification.id"
            class="px-4 py-3 border-2 border-farm-wood-dark shadow-pixel font-pixel text-xs max-w-xs"
            :class="{
              'bg-green-400 text-farm-wood-dark': notification.type === 'success',
              'bg-red-400 text-white': notification.type === 'error',
              'bg-blue-300 text-farm-wood-dark': notification.type === 'info'
            }"
          >
            {{ notification.message }}
          </div>
        </transition-group>
      </div>
      
      <div class="fixed bottom-4 left-4 font-pixel text-[10px] text-farm-ui/60">
        <p>💡 提示：先选锄头翻地 → 选手播种 → 浇水加速生长 → 成熟后收获</p>
        <p class="mt-1">🏗️ 建造：点击"建造"按钮选择建筑 → 点击地块放置 → 建造后自动生效</p>
        <p class="mt-1">📦 建造谷仓扩展容量，建造洒水器自动浇水，建造温室突破季节限制！</p>
        <p class="mt-1">🛡️ 防灾：建造防雷针/排水沟减弱雷暴，建造加热器抵御寒潮，组合建筑最大化保护</p>
        <p class="mt-1">⚠️ 灾害预警：剧烈天气会提前一天发布预警，请及时建造防护建筑或收获作物</p>
        <p class="mt-1">🏆 成就：完成各种挑战解锁成就奖励 | 📖 图鉴：收集图鉴条目发现更多内容</p>
        <p class="mt-1">🌳 技能：种植养殖获得经验升级，分配天赋点提升产量、速度与品质！</p>
      </div>
    </template>
  </div>
</template>

<style>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
