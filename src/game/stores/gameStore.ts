import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GameState, Plot, Animal, InventoryItem, ToolType, Season } from '../types/game';
import { MapGrid } from '../modules/MapGrid';
import { CropGrowth } from '../modules/CropGrowth';
import { Livestock } from '../modules/Livestock';
import { Inventory } from '../modules/Inventory';
import { Shop } from '../modules/Shop';
import { gameDB } from '../db';
import { getItem } from '../data/items';
import { getCropConfig } from '../data/crops';

export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameState | null>(null);
  const mapGrid = ref<MapGrid | null>(null);
  const cropGrowth = ref<CropGrowth | null>(null);
  const livestock = ref<Livestock | null>(null);
  const inventory = ref<Inventory | null>(null);
  const shop = ref<Shop | null>(null);
  const selectedTool = ref<ToolType>(null);
  const selectedSeed = ref<string | null>(null);
  const showInventory = ref(false);
  const showShop = ref(false);
  const isInitialized = ref(false);
  const notifications = ref<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const coins = computed(() => gameState.value?.coins ?? 0);
  const season = computed(() => mapGrid.value?.getSeason() ?? 'spring');
  const day = computed(() => mapGrid.value?.getDay() ?? 1);
  const unlockedPlots = computed(() => mapGrid.value?.getUnlockedCount() ?? 0);
  const animalCount = computed(() => livestock.value?.getAnimalCount() ?? { chickens: 0, cows: 0 });

  let notificationId = 0;

  function addNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = ++notificationId;
    notifications.value.push({ id, message, type });
    setTimeout(() => {
      const index = notifications.value.findIndex(n => n.id === id);
      if (index > -1) {
        notifications.value.splice(index, 1);
      }
    }, 3000);
  }

  async function initGame() {
    await gameDB.init();
    
    const savedGame = await gameDB.loadGame();
    
    if (savedGame) {
      gameState.value = savedGame.state;
      
      mapGrid.value = new MapGrid(
        savedGame.plots,
        savedGame.state.season,
        savedGame.state.day,
        savedGame.state.lastSeasonAdvance
      );
      
      cropGrowth.value = new CropGrowth(mapGrid.value.getPlotGrid());
      livestock.value = new Livestock(savedGame.animals);
      inventory.value = new Inventory(savedGame.inventory);
      shop.value = new Shop(
        inventory.value,
        mapGrid.value,
        livestock.value,
        savedGame.state.coins
      );

      const now = Date.now();
      const offlineMs = now - savedGame.state.lastSaveTime;
      
      if (offlineMs > 0) {
        const cropUpdates = cropGrowth.value.processOfflineGrowth(offlineMs, now);
        const animalUpdates = livestock.value.processOfflineProduction(offlineMs, now);
        const seasonUpdate = mapGrid.value.updateSeason(now);
        
        if (cropUpdates.length > 0 || animalUpdates.length > 0 || seasonUpdate.advanced) {
          let offlineMsg = '离线期间：';
          if (cropUpdates.some(u => u.becameReady)) {
            offlineMsg += `${cropUpdates.filter(u => u.becameReady).length}个作物成熟，`;
          }
          if (animalUpdates.length > 0) {
            offlineMsg += `${animalUpdates.length}只动物产出产品，`;
          }
          if (seasonUpdate.advanced) {
            offlineMsg += `进入${getSeasonName(seasonUpdate.newSeason!)}，`;
          }
          if (offlineMsg.length > 5) {
            addNotification(offlineMsg.slice(0, -1), 'info');
          }
        }
        
        gameState.value.lastSeasonAdvance = mapGrid.value.getLastSeasonAdvance();
        gameState.value.season = mapGrid.value.getSeason();
        gameState.value.day = mapGrid.value.getDay();
      }
    } else {
      const newGame = await gameDB.initializeNewGame();
      gameState.value = newGame.state;
      mapGrid.value = new MapGrid(
        newGame.plots,
        newGame.state.season,
        newGame.state.day,
        newGame.state.lastSeasonAdvance
      );
      cropGrowth.value = new CropGrowth(mapGrid.value.getPlotGrid());
      livestock.value = new Livestock(newGame.animals);
      inventory.value = new Inventory(newGame.inventory);
      shop.value = new Shop(
        inventory.value,
        mapGrid.value,
        livestock.value,
        newGame.state.coins
      );
      addNotification('欢迎来到像素农场！', 'success');
    }

    isInitialized.value = true;
  }

  async function saveGame() {
    if (!gameState.value || !mapGrid.value || !livestock.value || !inventory.value || !shop.value) {
      return;
    }

    gameState.value.coins = shop.value.getCoins();
    gameState.value.season = mapGrid.value.getSeason();
    gameState.value.day = mapGrid.value.getDay();
    gameState.value.lastSeasonAdvance = mapGrid.value.getLastSeasonAdvance();

    await gameDB.saveCompleteGame(
      gameState.value,
      mapGrid.value.getAllPlots(),
      livestock.value.getAnimals(),
      inventory.value.getInventoryItems()
    );
  }

  function useTool(tool: ToolType) {
    selectedTool.value = tool;
    selectedSeed.value = null;
  }

  function selectSeed(cropType: string) {
    selectedSeed.value = cropType;
    selectedTool.value = 'hand';
  }

  function handlePlotClick(x: number, y: number) {
    if (!mapGrid.value || !cropGrowth.value || !inventory.value || !shop.value || !gameState.value) {
      return;
    }

    const plot = mapGrid.value.getPlot(x, y);
    if (!plot || !plot.unlocked) {
      addNotification('这块地还没解锁哦！', 'error');
      return;
    }

    const currentSeason = mapGrid.value.getSeason();

    if (selectedTool.value === 'hoe') {
      if (mapGrid.value.tillPlot(x, y)) {
        addNotification('翻地成功！', 'success');
        saveGame();
      } else {
        addNotification('这块地不能翻！', 'error');
      }
      return;
    }

    if (selectedTool.value === 'water') {
      if (cropGrowth.value.waterPlot(x, y)) {
        addNotification('浇水成功！作物会更快生长~', 'success');
        saveGame();
      } else {
        addNotification('这块地不需要浇水！', 'error');
      }
      return;
    }

    if (selectedTool.value === 'hand') {
      if (plot.state === 'ready' && plot.crop) {
        const result = cropGrowth.value.harvest(x, y);
        if (result) {
          inventory.value.addItem(result.itemId, result.quantity);
          const item = getItem(result.itemId);
          addNotification(`收获了${result.quantity}个${item?.name}！`, 'success');
          saveGame();
        }
        return;
      }

      if (selectedSeed.value && (plot.state === 'tilled' || plot.state === 'watered')) {
        const seedItemId = `${selectedSeed.value}_seed`;
        if (inventory.value.hasItem(seedItemId, 1)) {
          if (cropGrowth.value.plantSeed(x, y, selectedSeed.value, currentSeason)) {
            inventory.value.removeItem(seedItemId, 1);
            addNotification('播种成功！', 'success');
            saveGame();
          } else {
            addNotification('这个季节不能种这个作物！', 'error');
          }
        } else {
          addNotification('没有足够的种子！', 'error');
        }
        return;
      }

      if (plot.state === 'tilled' || plot.state === 'watered') {
        const seeds = inventory.value.getSeeds();
        if (seeds.length > 0) {
          const availableSeeds = seeds.filter(s => {
            const cropConfig = getCropConfig(s.cropType);
            return cropConfig && cropConfig.seasons.includes(currentSeason);
          });
          if (availableSeeds.length > 0) {
            selectedSeed.value = availableSeeds[0].cropType;
            addNotification(`已选择${getItem(`${availableSeeds[0].cropType}_seed`)?.name}`, 'info');
          } else {
            addNotification('背包里没有适合当前季节的种子！', 'error');
          }
        } else {
          addNotification('背包里没有种子，去商店买一些吧！', 'info');
        }
        return;
      }
    }

    addNotification('请先选择一个工具！', 'info');
  }

  function handleAnimalClick(animalId: string) {
    if (!livestock.value || !inventory.value) {
      return;
    }

    const result = livestock.value.collectProduct(animalId);
    if (result) {
      inventory.value.addItem(result.itemId, result.quantity);
      const item = getItem(result.itemId);
      addNotification(`收集了${result.quantity}个${item?.name}！`, 'success');
      saveGame();
    } else {
      const animal = livestock.value.getAnimal(animalId);
      if (animal && !animal.hasProduct) {
        addNotification('还没产出呢，再等等~', 'info');
      }
    }
  }

  function buyItem(itemId: string, quantity: number = 1) {
    if (!shop.value || !gameState.value) {
      return { success: false, message: '商店未初始化' };
    }

    const result = shop.value.buyItem(itemId, quantity);
    if (result.success) {
      gameState.value.coins = shop.value.getCoins();
      const item = getItem(itemId);
      addNotification(`购买了${quantity}个${item?.name}！`, 'success');
      saveGame();
    } else {
      addNotification(result.message || '购买失败！', 'error');
    }
    return result;
  }

  function sellItem(itemId: string, quantity: number = 1) {
    if (!shop.value || !gameState.value) {
      return { success: false };
    }

    const result = shop.value.sellItem(itemId, quantity);
    if (result.success && result.earned) {
      gameState.value.coins = shop.value.getCoins();
      const item = getItem(itemId);
      addNotification(`出售了${quantity}个${item?.name}，获得${result.earned}金币！`, 'success');
      saveGame();
    } else {
      addNotification(result.message || '出售失败！', 'error');
    }
    return result;
  }

  function expandPlot() {
    if (!shop.value || !gameState.value) {
      return { success: false };
    }

    const result = shop.value.expandPlot();
    if (result.success) {
      gameState.value.coins = shop.value.getCoins();
      addNotification(`解锁了新地块！`, 'success');
      saveGame();
    } else {
      addNotification(result.message || '解锁失败！', 'error');
    }
    return result;
  }

  function updateGame(time: number) {
    if (!mapGrid.value || !cropGrowth.value || !livestock.value) {
      return;
    }

    const seasonUpdate = mapGrid.value.updateSeason(time);
    if (seasonUpdate.advanced) {
      addNotification(`季节变换：进入${getSeasonName(seasonUpdate.newSeason!)}！`, 'info');
    }

    cropGrowth.value.updateAllCrops(time);
    livestock.value.updateAllProduction(time);
  }

  function getSeasonName(s: Season): string {
    const names: Record<Season, string> = {
      spring: '春季',
      summer: '夏季',
      autumn: '秋季',
      winter: '冬季'
    };
    return names[s];
  }

  return {
    gameState,
    mapGrid,
    cropGrowth,
    livestock,
    inventory,
    shop,
    selectedTool,
    selectedSeed,
    showInventory,
    showShop,
    isInitialized,
    notifications,
    coins,
    season,
    day,
    unlockedPlots,
    animalCount,
    initGame,
    saveGame,
    useTool,
    selectSeed,
    handlePlotClick,
    handleAnimalClick,
    buyItem,
    sellItem,
    expandPlot,
    updateGame,
    addNotification
  };
});
