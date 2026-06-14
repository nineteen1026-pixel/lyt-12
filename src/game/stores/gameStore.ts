import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GameState, Plot, Animal, InventoryItem, ToolType, Season, WeatherType, WeatherState, Order } from '../types/game';
import { MapGrid } from '../modules/MapGrid';
import { CropGrowth } from '../modules/CropGrowth';
import { Livestock } from '../modules/Livestock';
import { Inventory } from '../modules/Inventory';
import { Shop } from '../modules/Shop';
import { Weather } from '../modules/Weather';
import type { WeatherEffects } from '../modules/Weather';
import { Orders } from '../modules/Orders';
import { gameDB } from '../db';
import { getItem } from '../data/items';
import { getCropConfig } from '../data/crops';
import { getVillagerById, getReputationLevel } from '../data/orders';

export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameState | null>(null);
  const mapGrid = ref<MapGrid | null>(null);
  const cropGrowth = ref<CropGrowth | null>(null);
  const livestock = ref<Livestock | null>(null);
  const inventory = ref<Inventory | null>(null);
  const shop = ref<Shop | null>(null);
  const weather = ref<Weather | null>(null);
  const orders = ref<Orders | null>(null);
  const selectedTool = ref<ToolType>(null);
  const selectedSeed = ref<string | null>(null);
  const showInventory = ref(false);
  const showShop = ref(false);
  const showOrders = ref(false);
  const isInitialized = ref(false);
  const notifications = ref<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const coins = computed(() => gameState.value?.coins ?? 0);
  const season = computed(() => mapGrid.value?.getSeason() ?? 'spring');
  const day = computed(() => mapGrid.value?.getDay() ?? 1);
  const unlockedPlots = computed(() => mapGrid.value?.getUnlockedCount() ?? 0);
  const animalCount = computed(() => livestock.value?.getAnimalCount() ?? { chickens: 0, cows: 0 });
  const currentWeather = computed(() => weather.value?.getCurrent() ?? 'sunny');
  const weatherForecast = computed(() => weather.value?.getForecast() ?? []);
  const weatherName = computed(() => weather.value?.getWeatherName(currentWeather.value) ?? '晴天');
  const reputation = computed(() => orders.value?.getReputation() ?? { score: 0, level: 1, completedOrders: 0, failedOrders: 0, rareSeedDropBoost: 0 });
  const reputationLevelInfo = computed(() => getReputationLevel(reputation.value.score));
  const activeOrders = computed(() => orders.value?.getActiveOrders() ?? []);
  const activeOrderCount = computed(() => orders.value?.getActiveOrderCount() ?? 0);

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
      weather.value = new Weather(savedGame.state.weather, savedGame.state.season);
      shop.value = new Shop(
        inventory.value,
        mapGrid.value,
        livestock.value,
        savedGame.state.coins
      );

      orders.value = new Orders(
        savedGame.orders,
        savedGame.state.reputation,
        inventory.value,
        shop.value,
        savedGame.state.season,
        savedGame.state.day
      );

      const now = Date.now();
      const offlineMs = now - savedGame.state.lastSaveTime;
      
      if (offlineMs > 0) {
        const seasonUpdate = mapGrid.value.updateSeason(now);
        if (seasonUpdate.advanced) {
          weather.value.setSeason(mapGrid.value.getSeason());
          const newForecast = weather.value.generateForecast(3);
          weather.value.getState().forecast = newForecast;
        }

        orders.value.setCurrentSeason(mapGrid.value.getSeason());
        orders.value.setCurrentDay(mapGrid.value.getDay());

        const weatherHistory = weather.value.processOfflineWeather(offlineMs, now);
        if (weatherHistory.length > 0) {
          const weatherEffects = weather.value.applyWeatherHistory(
            mapGrid.value.getPlotGrid(),
            weatherHistory,
            savedGame.state.lastSaveTime,
            now
          );
          notifyWeatherEffects(weatherEffects, true);
        }

        const cropUpdates = cropGrowth.value.processOfflineGrowth(offlineMs, now);
        const animalUpdates = livestock.value.processOfflineProduction(offlineMs, now);

        const expiredOrders = orders.value.checkAndProcessExpiredOrders();
        if (expiredOrders.length > 0) {
          gameState.value.coins = shop.value.getCoins();
        }

        let offlineMsg = '离线期间：';
        let hasContent = false;
        if (weatherHistory.length > 0) {
          offlineMsg += `经过${weatherHistory.length}天，`;
          hasContent = true;
        }
        if (cropUpdates.some(u => u.becameReady)) {
          offlineMsg += `${cropUpdates.filter(u => u.becameReady).length}个作物成熟，`;
          hasContent = true;
        }
        if (animalUpdates.length > 0) {
          offlineMsg += `${animalUpdates.length}只动物产出产品，`;
          hasContent = true;
        }
        if (seasonUpdate.advanced) {
          offlineMsg += `进入${getSeasonName(seasonUpdate.newSeason!)}，`;
          hasContent = true;
        }
        if (expiredOrders.length > 0) {
          offlineMsg += `${expiredOrders.length}个订单超时违约，`;
          hasContent = true;
        }
        if (hasContent) {
          addNotification(offlineMsg.slice(0, -1), 'info');
        }
        
        gameState.value.lastSeasonAdvance = mapGrid.value.getLastSeasonAdvance();
        gameState.value.season = mapGrid.value.getSeason();
        gameState.value.day = mapGrid.value.getDay();
        gameState.value.weather = weather.value.getState();
        gameState.value.reputation = orders.value.getReputation();
      }

      if (orders.value.shouldRefreshOrders(savedGame.state.lastOrderRefreshDay)) {
        const { newOrders, failedOrders } = orders.value.refreshOrders();
        gameState.value.lastOrderRefreshDay = mapGrid.value.getDay();
        gameState.value.reputation = orders.value.getReputation();
        gameState.value.coins = shop.value.getCoins();
        if (failedOrders.length > 0) {
          addNotification(`${failedOrders.length}个订单因未完成而违约`, 'error');
        }
        if (newOrders.length > 0) {
          addNotification(`今日有${newOrders.length}个新村民订单！`, 'info');
        }
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
      weather.value = new Weather(newGame.state.weather, newGame.state.season);
      if (weather.value.getForecast().length === 0) {
        const forecast = weather.value.generateForecast(3);
        gameState.value.weather.forecast = forecast;
      }
      shop.value = new Shop(
        inventory.value,
        mapGrid.value,
        livestock.value,
        newGame.state.coins
      );

      orders.value = new Orders(
        newGame.orders,
        newGame.state.reputation,
        inventory.value,
        shop.value,
        newGame.state.season,
        newGame.state.day
      );

      const { newOrders } = orders.value.refreshOrders();
      gameState.value.lastOrderRefreshDay = newGame.state.day;
      gameState.value.reputation = orders.value.getReputation();

      addNotification('欢迎来到像素农场！', 'success');
      if (newOrders.length > 0) {
        addNotification(`今日有${newOrders.length}个村民订单等你完成！`, 'info');
      }
    }

    isInitialized.value = true;
  }

  function notifyWeatherEffects(effects: WeatherEffects, isOffline: boolean = false) {
    const parts: string[] = [];
    if (effects.wateredPlots > 0) {
      parts.push(`${effects.wateredPlots}块地被雨水浇灌`);
    }
    if (effects.frozenCrops > 0) {
      parts.push(`${effects.frozenCrops}株作物被冻结`);
    }
    if (effects.destroyedCrops > 0) {
      parts.push(`${effects.destroyedCrops}株作物被雷暴摧毁`);
    }
    if (parts.length > 0) {
      const prefix = isOffline ? '离线期间' : '天气变化';
      addNotification(`${prefix}：${parts.join('，')}`, 'info');
    }
  }

  async function saveGame() {
    if (!gameState.value || !mapGrid.value || !livestock.value || !inventory.value || !shop.value || !weather.value || !orders.value) {
      return;
    }

    gameState.value.coins = shop.value.getCoins();
    gameState.value.season = mapGrid.value.getSeason();
    gameState.value.day = mapGrid.value.getDay();
    gameState.value.lastSeasonAdvance = mapGrid.value.getLastSeasonAdvance();
    gameState.value.weather = weather.value.getState();
    gameState.value.reputation = orders.value.getReputation();

    await gameDB.saveCompleteGame(
      gameState.value,
      mapGrid.value.getAllPlots(),
      livestock.value.getAnimals(),
      inventory.value.getInventoryItems(),
      orders.value.getOrders()
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

  function sellAllItems() {
    if (!shop.value || !gameState.value) {
      return { success: false, totalEarned: 0, sold: [] };
    }

    const result = shop.value.sellAllItems();
    if (result.success) {
      gameState.value.coins = shop.value.getCoins();
      addNotification(`一键出售完成！获得${result.totalEarned}金币！`, 'success');
      saveGame();
    } else {
      addNotification('没有可出售的物品！', 'error');
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
    if (!mapGrid.value || !cropGrowth.value || !livestock.value || !weather.value || !orders.value || !gameState.value || !shop.value) {
      return;
    }

    const seasonUpdate = mapGrid.value.updateSeason(time);
    if (seasonUpdate.advanced) {
      addNotification(`季节变换：进入${getSeasonName(seasonUpdate.newSeason!)}！`, 'info');
      weather.value.setSeason(seasonUpdate.newSeason!);
      orders.value.setCurrentSeason(seasonUpdate.newSeason!);
      const newForecast = weather.value.generateForecast(3);
      weather.value.getState().forecast = newForecast;
      if (seasonUpdate.newDay) {
        gameState.value.day = seasonUpdate.newDay;
        orders.value.setCurrentDay(seasonUpdate.newDay);
      }
    }

    const weatherUpdate = weather.value.advanceDay(time);
    if (weatherUpdate.changed && weatherUpdate.newWeather) {
      addNotification(`今日天气：${weather.value.getWeatherName(weatherUpdate.newWeather)}！`, 'info');
      const effects = weather.value.applyWeatherEffects(mapGrid.value.getPlotGrid(), time);
      notifyWeatherEffects(effects, false);
    }

    const expiredOrders = orders.value.checkAndProcessExpiredOrders();
    if (expiredOrders.length > 0) {
      gameState.value.coins = shop.value.getCoins();
      gameState.value.reputation = orders.value.getReputation();
      for (const expired of expiredOrders) {
        const villager = getVillagerById(expired.villagerId);
        addNotification(`${villager?.name || '村民'}的订单超时违约！信誉-15`, 'error');
      }
      saveGame();
    }

    if (orders.value.shouldRefreshOrders(gameState.value.lastOrderRefreshDay)) {
      orders.value.setCurrentSeason(mapGrid.value.getSeason());
      orders.value.setCurrentDay(mapGrid.value.getDay());
      const { newOrders, failedOrders } = orders.value.refreshOrders();
      gameState.value.lastOrderRefreshDay = mapGrid.value.getDay();
      gameState.value.reputation = orders.value.getReputation();
      gameState.value.coins = shop.value.getCoins();
      if (failedOrders.length > 0) {
        addNotification(`${failedOrders.length}个订单因未完成而违约`, 'error');
      }
      if (newOrders.length > 0) {
        addNotification(`今日有${newOrders.length}个新村民订单！`, 'info');
      }
      saveGame();
    }

    cropGrowth.value.updateAllCrops(time);
    livestock.value.updateAllProduction(time);
  }

  function submitOrder(orderId: string) {
    if (!orders.value || !gameState.value || !shop.value) {
      return { success: false, message: '系统未初始化' };
    }

    const result = orders.value.submitOrder(orderId);
    if (result.success) {
      gameState.value.coins = shop.value.getCoins();
      gameState.value.reputation = orders.value.getReputation();
      
      let msg = `订单完成！获得${result.coins}金币，+${result.reputation}信誉`;
      if (result.rareSeedId && result.rareSeedQuantity) {
        const seedItem = getItem(result.rareSeedId);
        msg += `，额外获得${result.rareSeedQuantity}个${seedItem?.name || '稀有种子'}`;
      }
      addNotification(msg, 'success');
      saveGame();
    } else {
      addNotification(result.message || '提交失败！', 'error');
    }
    return result;
  }

  function canSubmitOrder(orderId: string) {
    if (!orders.value) {
      return { canSubmit: false, missingItems: [] };
    }
    const order = orders.value.getOrderById(orderId);
    if (!order) {
      return { canSubmit: false, missingItems: [] };
    }
    return orders.value.canSubmitOrder(order);
  }

  function getOrderRemainingDays(orderId: string): number {
    if (!orders.value) return 0;
    const order = orders.value.getOrderById(orderId);
    if (!order) return 0;
    return orders.value.getRemainingDays(order);
  }

  function refreshOrdersNow() {
    if (!orders.value || !gameState.value) {
      return { newOrders: [], failedOrders: [] };
    }
    const result = orders.value.forceRefreshAll();
    gameState.value.lastOrderRefreshDay = mapGrid.value?.getDay() ?? gameState.value.lastOrderRefreshDay;
    gameState.value.reputation = orders.value.getReputation();
    gameState.value.coins = shop.value?.getCoins() ?? gameState.value.coins;
    if (result.failedOrders.length > 0) {
      addNotification(`强制刷新导致${result.failedOrders.length}个订单违约`, 'error');
    }
    addNotification(`已刷新${result.newOrders.length}个新订单`, 'info');
    saveGame();
    return result;
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
    weather,
    orders,
    selectedTool,
    selectedSeed,
    showInventory,
    showShop,
    showOrders,
    isInitialized,
    notifications,
    coins,
    season,
    day,
    unlockedPlots,
    animalCount,
    currentWeather,
    weatherForecast,
    weatherName,
    reputation,
    reputationLevelInfo,
    activeOrders,
    activeOrderCount,
    initGame,
    saveGame,
    useTool,
    selectSeed,
    handlePlotClick,
    handleAnimalClick,
    buyItem,
    sellItem,
    sellAllItems,
    expandPlot,
    updateGame,
    addNotification,
    submitOrder,
    canSubmitOrder,
    getOrderRemainingDays,
    refreshOrdersNow
  };
});
