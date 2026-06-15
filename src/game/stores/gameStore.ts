import { defineStore } from 'pinia';
import { ref, computed, toRaw } from 'vue';
import type { GameState, Plot, Animal, InventoryItem, ToolType, Season, WeatherType, WeatherState, Order, Building, BuildingType, BuildingConfig, GameStats, AchievementProgress, CodexEntry, QualityGrade } from '../types/game';
import { QUALITY_PRICE_MULTIPLIER, QUALITY_NAMES } from '../types/game';
import { MapGrid } from '../modules/MapGrid';
import { CropGrowth } from '../modules/CropGrowth';
import { Livestock } from '../modules/Livestock';
import { Inventory } from '../modules/Inventory';
import { Shop } from '../modules/Shop';
import { Weather } from '../modules/Weather';
import type { WeatherEffects } from '../modules/Weather';
import { Orders } from '../modules/Orders';
import { Buildings } from '../modules/Buildings';
import { Statistics } from '../modules/Statistics';
import { AchievementSystem, type AchievementUnlockResult } from '../modules/Achievements';
import { CodexSystem, type DiscoveryResult } from '../modules/Codex';
import { shareCardGenerator } from '../modules/ShareCard';
import { getQualitySellPrice, getQualityStars } from '../modules/Quality';
import { gameDB } from '../db';
import { getItem } from '../data/items';
import { getCropConfig } from '../data/crops';
import { getVillagerById, getReputationLevel } from '../data/orders';
import { getBuildingConfig } from '../data/buildings';
import { ACHIEVEMENTS, getAchievementById } from '../data/achievements';
import { CODEX_ENTRIES, getCodexEntryById } from '../data/codex';
import { rollFish, rollArtifact, FISH_COOLDOWN, DIG_COOLDOWN } from '../data/exploration';

export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameState | null>(null);
  const mapGrid = ref<MapGrid | null>(null);
  const cropGrowth = ref<CropGrowth | null>(null);
  const livestock = ref<Livestock | null>(null);
  const inventory = ref<Inventory | null>(null);
  const shop = ref<Shop | null>(null);
  const weather = ref<Weather | null>(null);
  const orders = ref<Orders | null>(null);
  const buildings = ref<Buildings | null>(null);
  const statistics = ref<Statistics | null>(null);
  const achievementSystem = ref<AchievementSystem | null>(null);
  const codexSystem = ref<CodexSystem | null>(null);
  const selectedTool = ref<ToolType>(null);
  const selectedSeed = ref<string | null>(null);
  const selectedBuilding = ref<BuildingType | null>(null);
  const showInventory = ref(false);
  const showShop = ref(false);
  const showOrders = ref(false);
  const showBuildings = ref(false);
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
  const inventoryCapacity = computed(() => inventory.value?.getCapacity() ?? 50);
  const inventoryUsed = computed(() => inventory.value?.getTotalQuantity() ?? 0);
  const buildingList = computed(() => buildings.value?.getBuildings() ?? []);
  const buildingCount = computed(() => buildingList.value.length);
  const hasBarn = computed(() => buildings.value?.hasBarn() ?? false);
  const barnCapacityBonus = computed(() => buildings.value?.getBarnCapacityBonus() ?? 0);

  const stats = computed<GameStats | null>(() => statistics.value?.getStats() ?? null);
  const achievementProgress = computed(() => achievementSystem.value?.getAllProgress() ?? {});
  const unlockedAchievementCount = computed(() => achievementSystem.value?.getUnlockedCount() ?? 0);
  const totalAchievementCount = computed(() => achievementSystem.value?.getTotalCount() ?? 0);
  const codexEntries = computed(() => codexSystem.value?.getAllEntries() ?? []);
  const discoveredCodexCount = computed(() => codexSystem.value?.getDiscoveredCount() ?? 0);
  const totalCodexCount = computed(() => codexSystem.value?.getTotalCount() ?? 0);
  const codexCompletionPercentage = computed(() => codexSystem.value?.getCompletionPercentage() ?? 0);
  
  const showAchievements = ref(false);
  const showCodex = ref(false);
  const showShareCard = ref(false);
  const currentShareCardDataUrl = ref<string | null>(null);

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

      buildings.value = new Buildings(savedGame.buildings, mapGrid.value.getPlotGrid());
      mapGrid.value.setBuildings(buildings.value);
      
      cropGrowth.value = new CropGrowth(mapGrid.value.getPlotGrid(), buildings.value);
      livestock.value = new Livestock(savedGame.animals);
      inventory.value = new Inventory(savedGame.inventory, buildings.value);
      weather.value = new Weather(savedGame.state.weather, savedGame.state.season, buildings.value);
      shop.value = new Shop(
        inventory.value,
        mapGrid.value,
        livestock.value,
        savedGame.state.coins,
        buildings.value
      );

      orders.value = new Orders(
        savedGame.orders,
        savedGame.state.reputation,
        inventory.value,
        shop.value,
        savedGame.state.season,
        savedGame.state.day
      );

      statistics.value = new Statistics(savedGame.stats);
      achievementSystem.value = new AchievementSystem(
        savedGame.achievements?.reduce((acc, a) => {
          acc[a.achievementId] = a;
          return acc;
        }, {} as Record<string, AchievementProgress>)
      );
      codexSystem.value = new CodexSystem(
        savedGame.codex?.reduce((acc, e) => {
          acc[e.id] = e;
          return acc;
        }, {} as Record<string, CodexEntry>)
      );

      achievementSystem.value.subscribe(handleAchievementUnlocked);
      codexSystem.value.subscribe(handleCodexDiscovered);

      statistics.value.recordPlotsUnlocked(mapGrid.value.getUnlockedCount());

      const now = Date.now();
      const offlineMs = now - savedGame.state.lastSaveTime;
      
      if (offlineMs > 0) {
        const spoiledItems = inventory.value.processSpoilage(now);
        if (spoiledItems.length > 0) {
          for (const spoiled of spoiledItems) {
            const item = getItem(spoiled.itemId);
            addNotification(`${item?.name || '物品'} x${spoiled.quantity} 已腐坏`, 'error');
          }
        }

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
        if (spoiledItems.length > 0) {
          offlineMsg += `${spoiledItems.length}种物品腐坏，`;
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

      buildings.value = new Buildings(newGame.buildings, mapGrid.value.getPlotGrid());
      mapGrid.value.setBuildings(buildings.value);

      cropGrowth.value = new CropGrowth(mapGrid.value.getPlotGrid(), buildings.value);
      livestock.value = new Livestock(newGame.animals);
      inventory.value = new Inventory(newGame.inventory, buildings.value);
      weather.value = new Weather(newGame.state.weather, newGame.state.season, buildings.value);
      if (weather.value.getForecast().length === 0) {
        const forecast = weather.value.generateForecast(3);
        gameState.value.weather.forecast = forecast;
      }
      shop.value = new Shop(
        inventory.value,
        mapGrid.value,
        livestock.value,
        newGame.state.coins,
        buildings.value
      );

      orders.value = new Orders(
        newGame.orders,
        newGame.state.reputation,
        inventory.value,
        shop.value,
        newGame.state.season,
        newGame.state.day
      );

      statistics.value = new Statistics(newGame.stats);
      achievementSystem.value = new AchievementSystem(
        newGame.achievements?.reduce((acc, a) => {
          acc[a.achievementId] = a;
          return acc;
        }, {} as Record<string, AchievementProgress>)
      );
      codexSystem.value = new CodexSystem(
        newGame.codex?.reduce((acc, e) => {
          acc[e.id] = e;
          return acc;
        }, {} as Record<string, CodexEntry>)
      );

      achievementSystem.value.subscribe(handleAchievementUnlocked);
      codexSystem.value.subscribe(handleCodexDiscovered);

      statistics.value.recordPlotsUnlocked(mapGrid.value.getUnlockedCount());
      
      codexSystem.value.discoverItem('turnip_seed', 5);
      codexSystem.value.discoverItem('potato_seed', 3);

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

  function handleAchievementUnlocked(result: AchievementUnlockResult) {
    const { achievement, reward } = result;
    let msg = `🏆 成就解锁：${achievement.name}！`;
    if (reward.coins) msg += ` +${reward.coins}金币`;
    if (reward.reputation) msg += ` +${reward.reputation}信誉`;
    if (reward.title) msg += ` [称号: ${reward.title}]`;
    addNotification(msg, 'success');
    
    if (reward.coins && shop.value) {
      shop.value.addCoins(reward.coins);
      gameState.value!.coins = shop.value.getCoins();
    }
    if (reward.reputation && orders.value) {
      orders.value.addReputation(reward.reputation);
      gameState.value!.reputation = orders.value.getReputation();
    }
  }

  function handleCodexDiscovered(result: DiscoveryResult) {
    if (result.isNew) {
      addNotification(`📖 图鉴发现：${result.entry.name}！`, 'info');
    }
  }

  function checkAchievements() {
    if (!achievementSystem.value || !statistics.value || !codexSystem.value) return;
    
    const codexCompletion = codexSystem.value.getCompletionPercentage();
    const newlyUnlocked = achievementSystem.value.checkAchievements(
      statistics.value.getStats(),
      codexCompletion
    );
    
    for (const result of newlyUnlocked) {
      handleAchievementUnlocked(result);
    }
  }

  function notifyWeatherEffects(effects: WeatherEffects, isOffline: boolean = false) {
    const parts: string[] = [];
    if (effects.wateredPlots > 0) {
      parts.push(`${effects.wateredPlots}块地被雨水浇灌`);
    }
    if (effects.sprinklerWatered > 0) {
      parts.push(`洒水器浇灌了${effects.sprinklerWatered}块地`);
    }
    if (effects.frozenCrops > 0) {
      parts.push(`${effects.frozenCrops}株作物被冻结`);
    }
    if (effects.destroyedCrops > 0) {
      parts.push(`${effects.destroyedCrops}株作物被雷暴摧毁`);
    }
    if (effects.greenhouseProtected > 0) {
      parts.push(`温室保护了${effects.greenhouseProtected}株作物`);
    }
    if (parts.length > 0) {
      const prefix = isOffline ? '离线期间' : '天气变化';
      addNotification(`${prefix}：${parts.join('，')}`, 'info');
    }
  }

  async function saveGame() {
    if (!gameState.value || !mapGrid.value || !livestock.value || !inventory.value || !shop.value || !weather.value || !orders.value || !buildings.value || !statistics.value || !achievementSystem.value || !codexSystem.value) {
      return;
    }

    gameState.value.coins = shop.value.getCoins();
    gameState.value.season = mapGrid.value.getSeason();
    gameState.value.day = mapGrid.value.getDay();
    gameState.value.lastSeasonAdvance = mapGrid.value.getLastSeasonAdvance();
    gameState.value.weather = weather.value.getState();
    gameState.value.reputation = orders.value.getReputation();

    const rawState = JSON.parse(JSON.stringify(toRaw(gameState.value)));
    const rawPlots = JSON.parse(JSON.stringify(toRaw(mapGrid.value.getAllPlots())));
    const rawAnimals = JSON.parse(JSON.stringify(toRaw(livestock.value.getAnimals())));
    const rawInventory = JSON.parse(JSON.stringify(toRaw(inventory.value.getInventoryItems())));
    const rawOrders = JSON.parse(JSON.stringify(toRaw(orders.value.getOrders())));
    const rawBuildings = JSON.parse(JSON.stringify(toRaw(buildings.value.getBuildings())));
    const rawStats = JSON.parse(JSON.stringify(toRaw(statistics.value.getStats())));
    const rawAchievements = JSON.parse(JSON.stringify(toRaw(Object.values(achievementSystem.value.getAllProgress()))));
    const rawCodex = JSON.parse(JSON.stringify(toRaw(codexSystem.value.getAllEntries())));

    await gameDB.saveCompleteGame(
      rawState,
      rawPlots,
      rawAnimals,
      rawInventory,
      rawOrders,
      rawBuildings,
      rawStats,
      rawAchievements,
      rawCodex
    );
  }

  function useTool(tool: ToolType) {
    selectedTool.value = tool;
    selectedSeed.value = null;
    selectedBuilding.value = null;
  }

  function selectBuilding(buildingType: BuildingType) {
    selectedBuilding.value = buildingType;
    selectedTool.value = null;
    selectedSeed.value = null;
  }

  function selectSeed(cropType: string) {
    selectedSeed.value = cropType;
    selectedTool.value = 'hand';
    selectedBuilding.value = null;
  }

  function handlePlotClick(x: number, y: number) {
    if (!mapGrid.value || !cropGrowth.value || !inventory.value || !shop.value || !gameState.value || !buildings.value) {
      return;
    }

    if (selectedBuilding.value) {
      const result = shop.value.buyBuilding(selectedBuilding.value, x, y);
      if (result.success) {
        const config = getBuildingConfig(selectedBuilding.value);
        gameState.value.coins = shop.value.getCoins();
        
        if (statistics.value) {
          statistics.value.recordBuildingBuilt(selectedBuilding.value);
          if (config) {
            statistics.value.recordCoinsSpent(config.price);
          }
        }
        if (codexSystem.value) {
          codexSystem.value.discoverBuilding(selectedBuilding.value);
        }
        checkAchievements();
        
        addNotification(`建造${config?.name}成功！`, 'success');
        saveGame();
      } else {
        addNotification(result.message || '建造失败！', 'error');
      }
      return;
    }

    const plot = mapGrid.value.getPlot(x, y);
    if (!plot || !plot.unlocked) {
      addNotification('这块地还没解锁哦！', 'error');
      return;
    }

    if (plot.buildingId) {
      const building = buildings.value.getBuilding(plot.buildingId);
      if (building) {
        const config = getBuildingConfig(building.type);
        addNotification(`这里建造了${config?.name}，点击建筑管理面板可拆除`, 'info');
      }
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
        dayCropsWatered.value++;
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
          inventory.value.addItem(result.itemId, result.quantity, result.quality);
          const item = getItem(result.itemId);
          
          if (statistics.value) {
            statistics.value.recordCropHarvested(plot.crop.type, result.quantity);
            statistics.value.recordQualityHarvest(result.quality);
          }
          if (codexSystem.value) {
            codexSystem.value.discoverCrop(plot.crop.type, result.quantity, result.quality);
            codexSystem.value.discoverItem(result.itemId, result.quantity, result.quality);
          }
          checkAchievements();
          
          const qualityName = QUALITY_NAMES[result.quality];
          addNotification(`收获了${result.quantity}个${item?.name}！品质：${qualityName}`, 'success');
          saveGame();
        }
        return;
      }

      if (selectedSeed.value && (plot.state === 'tilled' || plot.state === 'watered')) {
        const seedItemId = `${selectedSeed.value}_seed`;
        if (inventory.value.hasItem(seedItemId, 1)) {
          if (cropGrowth.value.plantSeed(x, y, selectedSeed.value, currentSeason)) {
            inventory.value.removeItem(seedItemId, 1);
            
            if (statistics.value) {
              statistics.value.recordSeedPlanted(selectedSeed.value, 1);
            }
            if (codexSystem.value) {
              codexSystem.value.discoverCrop(selectedSeed.value, 0);
            }
            checkAchievements();
            
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
      const defaultQuality = 3 as QualityGrade;
      inventory.value.addItem(result.itemId, result.quantity, defaultQuality);
      const item = getItem(result.itemId);
      
      if (statistics.value) {
        statistics.value.recordProductCollected(result.itemId, result.quantity);
        statistics.value.recordQualityHarvest(defaultQuality);
      }
      if (codexSystem.value) {
        codexSystem.value.discoverItem(result.itemId, result.quantity, defaultQuality);
      }
      checkAchievements();
      
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

    const item = getItem(itemId);
    const totalCost = item ? item.price * quantity : 0;
    const result = shop.value.buyItem(itemId, quantity);
    if (result.success) {
      gameState.value.coins = shop.value.getCoins();
      
      if (statistics.value && totalCost > 0) {
        statistics.value.recordCoinsSpent(totalCost);
        statistics.value.recordItemsBought(quantity);
      }
      if (codexSystem.value) {
        codexSystem.value.discoverItem(itemId, quantity);
      }
      
      const itemData = getItem(itemId);
      if (itemData?.type === 'animal' && statistics.value) {
        statistics.value.recordAnimalBought(itemId, quantity);
        codexSystem.value?.discoverAnimal(itemId, quantity);
      }
      checkAchievements();
      
      addNotification(`购买了${quantity}个${item?.name}！`, 'success');
      saveGame();
    } else {
      addNotification(result.message || '购买失败！', 'error');
    }
    return result;
  }

  function sellItem(itemId: string, quantity: number = 1, quality?: QualityGrade) {
    if (!shop.value || !gameState.value) {
      return { success: false };
    }

    const result = shop.value.sellItem(itemId, quantity, quality);
    if (result.success && result.earned) {
      gameState.value.coins = shop.value.getCoins();
      const item = getItem(itemId);
      
      if (statistics.value) {
        statistics.value.recordCoinsEarned(result.earned);
        statistics.value.recordItemsSold(quantity);
        const basePrice = item?.sellPrice || 0;
        const baseTotal = basePrice * quantity;
        const bonus = result.earned - baseTotal;
        if (bonus > 0) {
          statistics.value.recordQualityBonusCoins(bonus);
        }
      }
      checkAchievements();
      
      const qualityLabel = quality ? ` ${QUALITY_NAMES[quality]}` : '';
      addNotification(`出售了${quantity}个${item?.name}${qualityLabel}，获得${result.earned}金币！`, 'success');
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
      
      if (statistics.value) {
        statistics.value.recordCoinsEarned(result.totalEarned);
        statistics.value.recordItemsSold(result.sold.reduce((sum, s) => sum + s.quantity, 0));
      }
      checkAchievements();
      
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
      
      if (statistics.value && mapGrid.value) {
        statistics.value.recordPlotsUnlocked(mapGrid.value.getUnlockedCount());
        const price = shop.value.getExpandPlotPrice();
        if (price > 0) {
          statistics.value.recordCoinsSpent(price);
        }
      }
      checkAchievements();
      
      addNotification(`解锁了新地块！`, 'success');
      saveGame();
    } else {
      addNotification(result.message || '解锁失败！', 'error');
    }
    return result;
  }

  function updateGame(time: number, deltaTime: number = 0) {
    if (!mapGrid.value || !cropGrowth.value || !livestock.value || !weather.value || !orders.value || !gameState.value || !shop.value || !inventory.value) {
      return;
    }

    if (statistics.value && deltaTime > 0) {
      statistics.value.recordPlayTime(deltaTime);
    }

    const spoiledItems = inventory.value.processSpoilage(time);
    if (spoiledItems.length > 0) {
      for (const spoiled of spoiledItems) {
        const item = getItem(spoiled.itemId);
        addNotification(`${item?.name || '物品'} x${spoiled.quantity} 已腐坏`, 'error');
      }
    }

    const seasonUpdate = mapGrid.value.updateSeason(time);
    if (seasonUpdate.advanced) {
      addNotification(`季节变换：进入${getSeasonName(seasonUpdate.newSeason!)}！`, 'info');
      weather.value.setSeason(seasonUpdate.newSeason!);
      orders.value.setCurrentSeason(seasonUpdate.newSeason!);
      const newForecast = weather.value.generateForecast(3);
      weather.value.getState().forecast = newForecast;
      
      if (statistics.value && seasonUpdate.newSeason) {
        statistics.value.recordSeasonChanged(seasonUpdate.newSeason);
      }
      
      if (seasonUpdate.newDay) {
        checkPerfectDay();
        
        gameState.value.day = seasonUpdate.newDay;
        orders.value.setCurrentDay(seasonUpdate.newDay);
        if (statistics.value) {
          statistics.value.recordDayAdvanced();
        }
        
        onDayStart();
      }
      
      checkAchievements();
    }

    const weatherUpdate = weather.value.advanceDay(time);
    if (weatherUpdate.changed && weatherUpdate.newWeather) {
      addNotification(`今日天气：${weather.value.getWeatherName(weatherUpdate.newWeather)}！`, 'info');
      const effects = weather.value.applyWeatherEffects(mapGrid.value.getPlotGrid(), time);
      notifyWeatherEffects(effects, false);
      
      if (statistics.value && weatherUpdate.newWeather === 'stormy') {
        statistics.value.recordStormOccurred();
      }
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
      dayOrdersTotal.value = orders.value.getActiveOrderCount();
      saveGame();
    }

    cropGrowth.value.updateAllCrops(time);
    livestock.value.updateAllProduction(time);
  }

  function submitOrder(orderId: string) {
    if (!orders.value || !gameState.value || !shop.value) {
      return { success: false, message: '系统未初始化' };
    }

    const order = orders.value.getOrderById(orderId);
    const result = orders.value.submitOrder(orderId);
    if (result.success) {
      gameState.value.coins = shop.value.getCoins();
      gameState.value.reputation = orders.value.getReputation();
      
      dayOrdersCompleted.value++;
      
      if (statistics.value) {
        statistics.value.recordOrderCompleted(order?.tier || 'common');
        if (result.coins) {
          statistics.value.recordCoinsEarned(result.coins);
        }
        if (result.rareSeedId && result.rareSeedQuantity) {
          statistics.value.recordRareSeedFound(result.rareSeedQuantity);
        }
        const repLevel = getReputationLevel(gameState.value.reputation.score);
        statistics.value.recordReputationLevelUp(repLevel.level);
      }
      if (codexSystem.value && order) {
        codexSystem.value.discoverVillager(order.villagerId);
        if (result.rareSeedId) {
          codexSystem.value.discoverItem(result.rareSeedId, result.rareSeedQuantity || 1);
        }
      }
      checkAchievements();
      
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

  function demolishBuilding(buildingId: string) {
    if (!shop.value || !gameState.value) {
      return { success: false, message: '系统未初始化' };
    }
    const result = shop.value.demolishBuilding(buildingId);
    if (result.success) {
      gameState.value.coins = shop.value.getCoins();
      const msg = result.refund ? `拆除成功！返还${result.refund}金币` : '拆除成功！';
      addNotification(msg, 'success');
      saveGame();
    } else {
      addNotification(result.message || '拆除失败！', 'error');
    }
    return result;
  }

  function canPlaceBuilding(type: BuildingType, x: number, y: number) {
    if (!shop.value) return { canPlace: false, reason: '系统未初始化' };
    return shop.value.canPlaceBuilding(type, x, y);
  }

  function getBuyableBuildings() {
    if (!shop.value) return [];
    return shop.value.getBuyableBuildings();
  }

  function getBuildingAtPlot(x: number, y: number) {
    if (!buildings.value) return undefined;
    return buildings.value.getBuildingByPlot(x, y);
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

  function generateAchievementCard(achievementId: string): string | null {
    const achievement = getAchievementById(achievementId);
    if (!achievement || !achievementSystem.value || !statistics.value) return null;
    
    const progress = achievementSystem.value.getAchievementProgress(
      achievementId,
      statistics.value.getStats(),
      codexSystem.value?.getCompletionPercentage()
    );
    
    return shareCardGenerator.generateAchievementCard(achievement, progress);
  }

  function generateCodexCard(entryId: string): string | null {
    const entry = getCodexEntryById(entryId);
    if (!entry || !codexSystem.value) return null;
    
    const discoveredEntry = codexSystem.value.getEntry(entryId);
    if (!discoveredEntry || !discoveredEntry.discovered) return null;
    
    return shareCardGenerator.generateCodexCard(discoveredEntry);
  }

  function generateStatsCard(): string | null {
    if (!statistics.value) return null;
    return shareCardGenerator.generateStatsCard(statistics.value.getStats());
  }

  function downloadShareCard(dataUrl: string, filename: string) {
    shareCardGenerator.downloadCard(dataUrl, filename);
  }

  async function shareCard(dataUrl: string, title: string, text: string): Promise<boolean> {
    return await shareCardGenerator.shareCard(dataUrl, title, text);
  }

  function openAchievementsModal() {
    showAchievements.value = true;
  }

  function closeAchievementsModal() {
    showAchievements.value = false;
  }

  function openCodexModal() {
    showCodex.value = true;
  }

  function closeCodexModal() {
    showCodex.value = false;
  }

  const lastFishTime = ref(0);
  const lastDigTime = ref(0);

  function tryFish(): { success: boolean; fishId?: string; fishName?: string; rarity?: string; coinValue?: number; message: string } {
    if (!statistics.value || !codexSystem.value || !mapGrid.value) {
      return { success: false, message: '系统未初始化' };
    }

    const now = Date.now();
    if (now - lastFishTime.value < FISH_COOLDOWN) {
      const remaining = Math.ceil((FISH_COOLDOWN - (now - lastFishTime.value)) / 1000);
      return { success: false, message: `钓鱼冷却中，还需等待${remaining}秒` };
    }

    lastFishTime.value = now;
    const currentSeason = mapGrid.value.getSeason();
    const currentDay = mapGrid.value.getDay();
    const dayBoost = Math.floor(currentDay / 5);

    const fish = rollFish(currentSeason, dayBoost);
    if (!fish) {
      return { success: false, message: '当前季节没有鱼可钓' };
    }

    statistics.value.recordFishCaught(fish.id, 1);
    codexSystem.value.discoverFish(fish.id, 1);

    if (shop.value) {
      shop.value.addCoins(fish.coinValue);
      statistics.value.recordCoinsEarned(fish.coinValue);
    }

    checkAchievements();
    addNotification(`🎣 钓到了${fish.name}！价值${fish.coinValue}金币`, 'success');
    saveGame();

    return { success: true, fishId: fish.id, fishName: fish.name, rarity: fish.rarity, coinValue: fish.coinValue, message: `钓到了${fish.name}！` };
  }

  function tryDig(): { success: boolean; artifactId?: string; artifactName?: string; rarity?: string; coinValue?: number; message: string } {
    if (!statistics.value || !codexSystem.value || !mapGrid.value) {
      return { success: false, message: '系统未初始化' };
    }

    const now = Date.now();
    if (now - lastDigTime.value < DIG_COOLDOWN) {
      const remaining = Math.ceil((DIG_COOLDOWN - (now - lastDigTime.value)) / 1000);
      return { success: false, message: `挖掘冷却中，还需等待${remaining}秒` };
    }

    lastDigTime.value = now;
    const currentDay = mapGrid.value.getDay();
    const dayBoost = Math.floor(currentDay / 5);

    const artifact = rollArtifact(currentDay, dayBoost);
    if (!artifact) {
      return { success: false, message: '还需要更多天数才能挖掘到文物' };
    }

    statistics.value.recordArtifactFound(artifact.id);
    codexSystem.value.discoverArtifact(artifact.id);

    if (shop.value) {
      shop.value.addCoins(artifact.coinValue);
      statistics.value.recordCoinsEarned(artifact.coinValue);
    }

    checkAchievements();
    addNotification(`⛏️ 挖掘到${artifact.name}！价值${artifact.coinValue}金币`, 'success');
    saveGame();

    return { success: true, artifactId: artifact.id, artifactName: artifact.name, rarity: artifact.rarity, coinValue: artifact.coinValue, message: `挖掘到${artifact.name}！` };
  }

  const dayOrdersCompleted = ref(0);
  const dayOrdersTotal = ref(0);
  const dayCropsWatered = ref(0);
  const dayTotalCrops = ref(0);

  function getInventoryItemCount(itemId: string, minQuality?: QualityGrade): number {
    return inventory.value?.getItemCount(itemId, minQuality) ?? 0;
  }

  function checkPerfectDay() {
    if (!statistics.value || !orders.value || !mapGrid.value || !cropGrowth.value) return;

    const allOrdersCompleted = dayOrdersTotal.value === 0 || dayOrdersCompleted.value >= dayOrdersTotal.value;
    const allCropsWatered = dayTotalCrops.value === 0 || dayCropsWatered.value >= dayTotalCrops.value;

    if (allOrdersCompleted && allCropsWatered && (dayOrdersTotal.value > 0 || dayTotalCrops.value > 0)) {
      statistics.value.recordPerfectDay();
      addNotification('☀️ 完美一天！所有订单完成且所有作物已浇灌！', 'success');
      checkAchievements();
    }
  }

  function onDayStart() {
    if (!orders.value || !mapGrid.value || !cropGrowth.value) return;

    dayOrdersCompleted.value = 0;
    dayOrdersTotal.value = orders.value.getActiveOrderCount();

    const plots = mapGrid.value.getPlotGrid();
    let plantedCount = 0;
    let wateredCount = 0;
    for (const row of plots) {
      for (const plot of row) {
        if (plot.crop) {
          plantedCount++;
          if (plot.state === 'watered') wateredCount++;
        }
      }
    }
    dayTotalCrops.value = plantedCount;
    dayCropsWatered.value = wateredCount;
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
    buildings,
    statistics,
    achievementSystem,
    codexSystem,
    selectedTool,
    selectedSeed,
    selectedBuilding,
    showInventory,
    showShop,
    showOrders,
    showBuildings,
    showAchievements,
    showCodex,
    showShareCard,
    currentShareCardDataUrl,
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
    inventoryCapacity,
    inventoryUsed,
    buildingList,
    buildingCount,
    hasBarn,
    barnCapacityBonus,
    stats,
    achievementProgress,
    unlockedAchievementCount,
    totalAchievementCount,
    codexEntries,
    discoveredCodexCount,
    totalCodexCount,
    codexCompletionPercentage,
    initGame,
    saveGame,
    useTool,
    selectSeed,
    selectBuilding,
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
    refreshOrdersNow,
    demolishBuilding,
    canPlaceBuilding,
    getBuyableBuildings,
    getBuildingAtPlot,
    generateAchievementCard,
    generateCodexCard,
    generateStatsCard,
    downloadShareCard,
    shareCard,
    openAchievementsModal,
    closeAchievementsModal,
    openCodexModal,
    closeCodexModal,
    checkAchievements,
    tryFish,
    tryDig,
    lastFishTime,
    lastDigTime,
    dayOrdersCompleted,
    dayOrdersTotal,
    dayCropsWatered,
    dayTotalCrops,
    getInventoryItemCount,
    getQualitySellPrice,
    getQualityStars
  };
});
