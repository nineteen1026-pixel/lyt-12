import { defineStore } from 'pinia';
import { ref, computed, toRaw } from 'vue';
import type { GameState, Plot, Animal, Pet, PetType, InventoryItem, ToolType, Season, WeatherType, WeatherState, WeatherSeverity, WeatherWarning, Order, Building, BuildingType, BuildingConfig, GameStats, AchievementProgress, CodexEntry, QualityGrade, SkillTreeState, SkillEffectBonus, SkillNode, LevelUpResult, PetCompanionBonus, AffinityStage, DialogueResult, ExclusiveOrderTemplate, FarmHireState, FarmWorkerTaskType, AuctionItem, AuctionBidResult, AuctionSettleResult, FestivalType, FestivalGiftState, FestivalDialogueNode, FestivalGiftResult } from '../types/game';
import { QUALITY_PRICE_MULTIPLIER, QUALITY_NAMES, DAY_DURATION } from '../types/game';
import { MapGrid } from '../modules/MapGrid';
import { CropGrowth } from '../modules/CropGrowth';
import { Livestock } from '../modules/Livestock';
import { PetCompanion, HAPPINESS_PER_FEED } from '../modules/PetCompanion';
import { Inventory } from '../modules/Inventory';
import { Shop } from '../modules/Shop';
import { Weather } from '../modules/Weather';
import type { WeatherEffects } from '../modules/Weather';
import { Orders } from '../modules/Orders';
import { Buildings } from '../modules/Buildings';
import { Statistics } from '../modules/Statistics';
import { SkillTree, type SkillEvent, type SkillExperienceGain } from '../modules/SkillTree';
import { AchievementSystem, type AchievementUnlockResult } from '../modules/Achievements';
import { CodexSystem, type DiscoveryResult } from '../modules/Codex';
import { shareCardGenerator } from '../modules/ShareCard';
import { getQualitySellPrice, getQualityStars } from '../modules/Quality';
import { VillagerRelations, type DialogueAdvanceResult } from '../modules/VillagerRelations';
import { FarmHire, createInitialFarmHireState } from '../modules/FarmHire';
import { AuctionSystem } from '../modules/Auction';
import { CropInsurance } from '../modules/CropInsurance';
import { FestivalGift, type FestivalVillagerAccess, type FestivalInventoryAccess, type FestivalRewardAccess, type FestivalStatisticsAccess } from '../modules/FestivalGift';
import { FESTIVALS, getVillagerFestivalPreference, getFestivalById } from '../data/festivalGifts';
import type { InsurancePlanType, InsuranceState, InsurancePayoutResult } from '../types/game';
import { gameDB } from '../db';
import { getItem } from '../data/items';
import { getCropConfig } from '../data/crops';
import { getAnimalConfig } from '../data/animals';
import { getPetConfig, getPetPrice, getAllPetConfigs } from '../data/pets';
import { getVillagerById, getReputationLevel } from '../data/orders';
import { getBuildingConfig } from '../data/buildings';
import { ACHIEVEMENTS, getAchievementById } from '../data/achievements';
import { CODEX_ENTRIES, getCodexEntryById } from '../data/codex';
import { rollFish, rollArtifact, FISH_COOLDOWN, DIG_COOLDOWN } from '../data/exploration';
import type { MineSession, MineFloor, MineTile, MineExploreResult } from '../types/game';
import { createMineSession, generateMineFloor, canMoveTo, getStaminaCost, isAdjacent, revealAround, addItemsToSession, getMineralConfig, MINE_ENTRY_COST, MINE_STAMINA_POTION_COST, MINE_STAMINA_POTION_AMOUNT, TOTAL_MINE_FLOORS } from '../data/mining';
import { getExclusiveOrderById, getVillagerDetail, STAGE_NAMES, STAGE_COLORS } from '../data/villagers';
import { getMaxHireSlots, TASK_DESCRIPTIONS, TASK_ICONS } from '../data/farmWorkers';
import { getAuctionRarityName } from '../data/auction';
import { getInsurancePlan, getUnlockedInsurancePlans } from '../data/insurance';

export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameState | null>(null);
  const mapGrid = ref<MapGrid | null>(null);
  const cropGrowth = ref<CropGrowth | null>(null);
  const livestock = ref<Livestock | null>(null);
  const petCompanion = ref<PetCompanion | null>(null);
  const inventory = ref<Inventory | null>(null);
  const shop = ref<Shop | null>(null);
  const weather = ref<Weather | null>(null);
  const orders = ref<Orders | null>(null);
  const buildings = ref<Buildings | null>(null);
  const statistics = ref<Statistics | null>(null);
  const skillTree = ref<SkillTree | null>(null);
  const achievementSystem = ref<AchievementSystem | null>(null);
  const codexSystem = ref<CodexSystem | null>(null);
  const villagerRelations = ref<VillagerRelations | null>(null);
  const farmHire = ref<FarmHire | null>(null);
  const auction = ref<AuctionSystem | null>(null);
  const cropInsurance = ref<CropInsurance | null>(null);
  const festivalGift = ref<FestivalGift | null>(null);
  const showInsurance = ref(false);
  const selectedTool = ref<ToolType>(null);
  const selectedSeed = ref<string | null>(null);
  const selectedBuilding = ref<BuildingType | null>(null);
  const showInventory = ref(false);
  const showShop = ref(false);
  const showOrders = ref(false);
  const showBuildings = ref(false);
  const showVillagers = ref(false);
  const showAuction = ref(false);
  const isInitialized = ref(false);
  const notifications = ref<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>>([]);
  
  const levelUpModalRef = ref<{ showLevelUp: (levelUp: LevelUpResult) => void } | null>(null);
  const expFloatTextRef = ref<{ showFloatExp: (amount: number, reason?: string, x?: number, y?: number, type?: 'exp' | 'levelup' | 'skillpoint') => void } | null>(null);
  
  let expMergeTimer: number | null = null;
  let expMergeTotal = 0;
  let expMergeReason = '';
  let expMergeX: number | undefined = undefined;
  let expMergeY: number | undefined = undefined;

  const coins = computed(() => gameState.value?.coins ?? 0);
  const season = computed(() => mapGrid.value?.getSeason() ?? 'spring');
  const day = computed(() => mapGrid.value?.getDay() ?? 1);
  const unlockedPlots = computed(() => mapGrid.value?.getUnlockedCount() ?? 0);
  const animalCount = computed(() => livestock.value?.getAnimalCount() ?? { chickens: 0, cows: 0 });
  const currentWeather = computed(() => weather.value?.getCurrent() ?? 'sunny');
  const currentWeatherSeverity = computed<WeatherSeverity>(() => weather.value?.getCurrentSeverity() ?? 'normal');
  const weatherForecast = computed(() => weather.value?.getForecast() ?? []);
  const weatherForecastSeverities = computed<WeatherSeverity[]>(() => weather.value?.getForecastSeverities() ?? []);
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

  const pets = computed(() => petCompanion.value?.getPets() ?? []);
  const activePet = computed(() => petCompanion.value?.getActivePet());
  const petCount = computed(() => petCompanion.value?.getPetCount() ?? { cat: 0, dog: 0, rabbit: 0, bird: 0, fox: 0 });
  const totalPetCount = computed(() => petCompanion.value?.getTotalPetCount() ?? 0);
  const petBonuses = computed<PetCompanionBonus>(() => petCompanion.value?.getActiveBonuses() ?? {
    cropGrowthSpeed: 0, cropYield: 0, cropQuality: 0,
    animalProductionSpeed: 0, animalYield: 0, animalQuality: 0,
    waterBonus: 0, feedBonus: 0, greenhouseBoost: 0, rareChance: 0
  });
  const combinedEffectBonus = computed<SkillEffectBonus>(() => {
    const skillBonus = skillTree.value?.getEffectBonus() ?? null;
    return petCompanion.value?.combineWithSkillBonus(skillBonus) ?? skillBonus ?? {
      cropGrowthSpeed: 0, cropYield: 0, cropQuality: 0,
      animalProductionSpeed: 0, animalYield: 0, animalQuality: 0,
      waterBonus: 0, feedBonus: 0, rareChance: 0,
      greenhouseBoost: 0
    };
  });

  const stats = computed<GameStats | null>(() => statistics.value?.getStats() ?? null);
  const skillTreeState = computed<SkillTreeState | null>(() => skillTree.value?.getState() ?? null);
  const skillTreeLevel = computed(() => skillTree.value?.getLevel() ?? 1);
  const skillTreeExperience = computed(() => skillTree.value?.getExperience() ?? 0);
  const skillTreeTotalExperience = computed(() => skillTree.value?.getTotalExperience() ?? 0);
  const skillPoints = computed(() => skillTree.value?.getSkillPoints() ?? 0);
  const skillExperienceProgress = computed(() => skillTree.value?.getExperienceProgress() ?? 0);
  const skillEffectBonus = computed<SkillEffectBonus | null>(() => skillTree.value?.getEffectBonus() ?? null);
  const skillNodesUnlocked = computed(() => skillTree.value?.getTotalNodesUnlocked() ?? 0);
  const skillTotalLevels = computed(() => skillTree.value?.getTotalSkillLevels() ?? 0);
  const achievementProgress = computed(() => achievementSystem.value?.getAllProgress() ?? {});
  const unlockedAchievementCount = computed(() => achievementSystem.value?.getUnlockedCount() ?? 0);
  const totalAchievementCount = computed(() => achievementSystem.value?.getTotalCount() ?? 0);
  const codexEntries = computed(() => codexSystem.value?.getAllEntries() ?? []);
  const discoveredCodexCount = computed(() => codexSystem.value?.getDiscoveredCount() ?? 0);
  const totalCodexCount = computed(() => codexSystem.value?.getTotalCount() ?? 0);
  const codexCompletionPercentage = computed(() => codexSystem.value?.getCompletionPercentage() ?? 0);
  const allVillagersInfo = computed(() => villagerRelations.value?.getAllVillagersInfo() ?? []);
  const totalAffinity = computed(() => villagerRelations.value?.getTotalAffinity() ?? 0);
  const highestAffinityStage = computed(() => villagerRelations.value?.getHighestStage() ?? 0);
  const storylinesCompletedCount = computed(() => statistics.value?.getStats().villagerStorylinesCompleted ?? 0);
  const exclusiveOrdersCompletedCount = computed(() => villagerRelations.value?.getExclusiveOrdersCompleted() ?? 0);
  const farmHireState = computed<FarmHireState | null>(() => farmHire.value?.getState() ?? null);
  const farmHireMaxSlots = computed(() => farmHire.value?.getMaxSlots() ?? 0);
  const farmHireUsedSlots = computed(() => farmHire.value?.getUsedSlots() ?? 0);
  const farmHireAvailableSlots = computed(() => farmHire.value?.getAvailableSlots() ?? 0);
  const farmHireTotalDailyWage = computed(() => farmHire.value?.getTotalDailyWage() ?? 0);
  const farmHireActiveSlots = computed(() => farmHire.value?.getActiveSlots() ?? []);

  const insuranceState = computed<InsuranceState | null>(() => cropInsurance.value?.getState() ?? null);
  const isInsured = computed(() => cropInsurance.value?.isInsured() ?? false);
  const activeInsurancePlan = computed<InsurancePlanType | null>(() => cropInsurance.value?.getActivePlan() ?? null);
  const insuranceStats = computed(() => cropInsurance.value?.getStats() ?? null);

  const festivalGiftState = computed<FestivalGiftState | null>(() => festivalGift.value?.getState() ?? null);
  const isFestivalActive = computed(() => festivalGift.value?.isFestivalActive() ?? false);
  const currentFestivalInfo = computed(() => festivalGift.value?.getFestivalInfo() ?? null);
  const currentFestival = computed(() => festivalGift.value?.getCurrentFestivalConfig() ?? null);

  const combinedBonusAccess = {
    getSkillBonus: (): SkillEffectBonus => {
      return combinedEffectBonus.value;
    }
  };
  
  const showAchievements = ref(false);
  const showCodex = ref(false);
  const showSkillTree = ref(false);
  const showShareCard = ref(false);
  const currentShareCardDataUrl = ref<string | null>(null);
  const showMiningModal = ref(false);
  const showPetPanel = ref(false);
  const showHireWorker = ref(false);
  const currentMineSession = ref<MineSession | null>(null);
  const activeWeatherWarning = ref<WeatherWarning | null>(null);

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
      petCompanion.value = new PetCompanion(savedGame.pets);
      inventory.value = new Inventory(savedGame.inventory, buildings.value);
      weather.value = new Weather(savedGame.state.weather, savedGame.state.season, buildings.value);
      if (weather.value.getForecast().length === 0) {
        const forecast = weather.value.generateForecast(3);
        gameState.value.weather.forecast = forecast;
        gameState.value.weather.forecastSeverities = weather.value.getForecastSeverities();
      } else if (gameState.value.weather.forecastSeverities.length === 0) {
        gameState.value.weather.forecastSeverities = weather.value.getForecastSeverities();
      }

      if (savedGame.state.activeWeatherWarning) {
        activeWeatherWarning.value = savedGame.state.activeWeatherWarning;
      } else {
        const loadedWarning = weather.value.checkAndIssueInitialWarning(mapGrid.value.getDay());
        if (loadedWarning) {
          activeWeatherWarning.value = loadedWarning;
          if (statistics.value) statistics.value.recordWeatherWarningReceived();
          addNotification(loadedWarning.message, 'error');
        }
      }

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

      skillTree.value = new SkillTree(savedGame.skillTree);
      statistics.value = new Statistics(savedGame.stats, skillTree.value);
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

      const rewardAccess_vr = {
        addCoins: (amount: number) => {
          if (shop.value) {
            shop.value.addCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
          }
        },
        addReputation: (amount: number) => {
          if (orders.value) {
            orders.value.addReputation(amount);
            if (gameState.value) gameState.value.reputation = orders.value.getReputation();
          }
        },
        addItem: (itemId: string, quantity: number) => {
          return inventory.value?.addItem(itemId, quantity) ?? false;
        }
      };

      const statisticsAccess_vr = {
        recordAffinityGained: (amount: number) => statistics.value?.recordAffinityGained(amount),
        recordStageUp: (villagerId: string, newStage: AffinityStage, oldStage: AffinityStage) => statistics.value?.recordStageUp(villagerId, newStage, oldStage),
        recordDialogueCompleted: (villagerId: string) => statistics.value?.recordDialogueCompleted(villagerId),
        recordExclusiveOrderCompleted: (villagerId: string, orderId: string) => statistics.value?.recordExclusiveOrderCompleted(villagerId, orderId),
        recordGiftGiven: (villagerId: string, itemId: string) => statistics.value?.recordGiftGiven(villagerId, itemId),
        recordVillagerStorylineCompleted: (villagerId: string) => statistics.value?.recordVillagerStorylineCompleted(villagerId)
      };

      villagerRelations.value = new VillagerRelations(
        savedGame.villagerRelations ?? null,
        rewardAccess_vr,
        statisticsAccess_vr
      );

      villagerRelations.value.subscribe(handleDialogueCompleted);

      farmHire.value = new FarmHire(savedGame.farmHire ?? null);
      farmHire.value.setMapAccess(mapGrid.value);
      farmHire.value.setCropAccess(cropGrowth.value);
      farmHire.value.setVillagerAccess(villagerRelations.value);
      farmHire.value.setCoinAccess({
        getCoins: () => shop.value?.getCoins() ?? 0,
        spendCoins: (amount: number) => {
          if (shop.value && shop.value.getCoins() >= amount) {
            shop.value.spendCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
            return true;
          }
          return false;
        }
      });
      farmHire.value.setInventoryAccess({
        addItem: (itemId: string, quantity: number, quality?: QualityGrade) => {
          return inventory.value?.addItem(itemId, quantity, quality) ?? false;
        }
      });
      farmHire.value.updateReputationLevel(getReputationLevel(gameState.value!.reputation.score).level);

      const auctionCoinAccess_saved = {
        getCoins: () => shop.value?.getCoins() ?? 0,
        spendCoins: (amount: number) => {
          if (shop.value && shop.value.getCoins() >= amount) {
            shop.value.spendCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
            return true;
          }
          return false;
        },
        addCoins: (amount: number) => {
          if (shop.value) {
            shop.value.addCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
          }
        }
      };

      const auctionInventoryAccess_saved = {
        addItem: (itemId: string, quantity: number, quality?: QualityGrade) => {
          return inventory.value?.addItem(itemId, quantity, quality) ?? false;
        }
      };

      const auctionReputationAccess_saved = {
        addReputation: (amount: number) => {
          if (orders.value) {
            orders.value.addReputation(amount);
            if (gameState.value) gameState.value.reputation = orders.value.getReputation();
          }
        },
        getReputationScore: () => orders.value?.getReputation().score ?? 0
      };

      const auctionVillagerAccess_saved = {
        addAffinity: (villagerId: string, amount: number) => {
          return villagerRelations.value?.addAffinity(villagerId, amount) ?? {
            stageAdvanced: false,
            newStage: 0,
            stageCodexTriggers: [],
            stageAchievementTriggers: []
          };
        }
      };

      auction.value = new AuctionSystem(
        savedGame.auction ?? null,
        auctionCoinAccess_saved,
        auctionInventoryAccess_saved,
        auctionReputationAccess_saved,
        auctionVillagerAccess_saved
      );

      const insuranceCoinAccess_saved = {
        getCoins: () => shop.value?.getCoins() ?? 0,
        spendCoins: (amount: number) => {
          if (shop.value && shop.value.getCoins() >= amount) {
            shop.value.spendCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
            return true;
          }
          return false;
        },
        addCoins: (amount: number) => {
          if (shop.value) {
            shop.value.addCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
          }
        }
      };

      cropInsurance.value = new CropInsurance(
        savedGame.cropInsurance ?? null,
        insuranceCoinAccess_saved
      );
      cropInsurance.value.setBuildingsAccess(buildings.value);
      cropInsurance.value.setSkillAccess(combinedBonusAccess);
      cropInsurance.value.setCurrentSeason(savedGame.state.season);

      festivalGift.value = new FestivalGift(savedGame.festivalGift ?? null);
      festivalGift.value.setVillagerAccess({
        getStage: (villagerId: string) => villagerRelations.value?.getStage(villagerId) ?? 0,
        getAffinity: (villagerId: string) => villagerRelations.value?.getAffinity(villagerId) ?? 0,
        addAffinity: (villagerId: string, amount: number) => villagerRelations.value?.addAffinity(villagerId, amount) ?? { stageAdvanced: false, newStage: 0, stageCodexTriggers: [], stageAchievementTriggers: [] }
      });
      festivalGift.value.setInventoryAccess({
        hasItem: (itemId: string, quantity: number, minQuality?: QualityGrade) => inventory.value?.hasItem(itemId, quantity, minQuality) ?? false,
        removeItem: (itemId: string, quantity: number, quality?: QualityGrade) => inventory.value?.removeItem(itemId, quantity, quality) ?? false,
        getItemQuality: (itemId: string) => {
          const products = inventory.value?.getProducts() || [];
          const match = products.find(p => p.itemId === itemId);
          return match?.quality ?? 3;
        },
        getBestQuality: (itemId: string) => {
          const products = inventory.value?.getProducts() || [];
          const matches = products.filter(p => p.itemId === itemId);
          if (matches.length === 0) return 3 as QualityGrade;
          return Math.max(...matches.map(m => m.quality)) as QualityGrade;
        }
      });
      festivalGift.value.setRewardAccess({
        addCoins: (amount: number) => {
          if (shop.value) {
            shop.value.addCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
          }
        },
        addReputation: (amount: number) => {
          if (orders.value) {
            orders.value.addReputation(amount);
            if (gameState.value) gameState.value.reputation = orders.value.getReputation();
          }
        },
        addItem: (itemId: string, quantity: number, quality?: QualityGrade) => {
          return inventory.value?.addItem(itemId, quantity, quality) ?? false;
        }
      });
      festivalGift.value.setStatisticsAccess({
        recordFestivalGiftGiven: (villagerId: string, itemId: string, festivalId: FestivalType) => statistics.value?.recordFestivalGiftGiven(villagerId, itemId, festivalId),
        recordFestivalOrderCompleted: (villagerId: string, orderId: string) => statistics.value?.recordFestivalOrderCompleted(villagerId, orderId),
        recordFestivalDialogueCompleted: (villagerId: string, festivalId: FestivalType) => statistics.value?.recordFestivalDialogueCompleted(villagerId, festivalId),
        recordFestivalParticipated: () => statistics.value?.recordFestivalParticipated(),
        recordAffinityGained: (amount: number) => statistics.value?.recordAffinityGained(amount)
      });
      const festivalResult = festivalGift.value.checkAndStartFestival(gameState.value.season, gameState.value.day);
      if (festivalResult) {
        const festConfig = FESTIVALS[festivalResult];
        addNotification(`${festConfig.icon} ${festConfig.name}到了！${festConfig.description}`, 'success');
      }

      if (cropGrowth.value) {
        cropGrowth.value.setSkillAccess(combinedBonusAccess);
      }
      if (livestock.value) {
        livestock.value.setSkillAccess(combinedBonusAccess);
      }
      if (petCompanion.value) {
        petCompanion.value.setSkillAccess(skillTree.value);
      }

      skillTree.value.subscribe(handleSkillTreeChanged);
      skillTree.value.onEvent(handleSkillEvent);
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
          weather.value.getState().forecastSeverities = weather.value.getForecastSeverities();
        }

        orders.value.setCurrentSeason(mapGrid.value.getSeason());
        orders.value.setCurrentDay(mapGrid.value.getDay());

        const weatherHistoryResult = processOfflineWeatherWithHistory(offlineMs, now);
        if (weatherHistoryResult.history.length > 0) {
          const totalEffects: WeatherEffects = {
            wateredPlots: 0,
            frozenCrops: 0,
            destroyedCrops: 0,
            sprinklerWatered: 0,
            greenhouseProtected: 0,
            lightningRodProtected: 0,
            heaterProtected: 0,
            drainageProtected: 0,
            witheredCrops: 0,
            scorchedCrops: 0,
            totalCropsLost: 0,
            totalCropsSaved: 0,
            severity: 'normal'
          };
          
          const originalWeather = weather.value.getState().current;
          const originalSeverity = weather.value.getState().currentSeverity;
          const interval = (now - savedGame.state.lastSaveTime) / weatherHistoryResult.history.length;
          const startDay = mapGrid.value.getDay() - weatherHistoryResult.history.length;
          
          for (let i = 0; i < weatherHistoryResult.history.length; i++) {
            const w = weatherHistoryResult.history[i];
            const sev = weatherHistoryResult.severities[i] ?? 'normal';
            const simulatedTime = savedGame.state.lastSaveTime + (i + 1) * interval;
            const currentDay = startDay + i + 1;
            
            weather.value.getState().current = w;
            weather.value.getState().currentSeverity = sev;
            
            const cropSnapshot = takeCropSnapshot();
            
            const effects = weather.value.applyWeatherEffects(mapGrid.value.getPlotGrid(), simulatedTime);
            
            for (const key in effects) {
              if (key !== 'severity' && typeof effects[key as keyof WeatherEffects] === 'number') {
                (totalEffects as any)[key] += effects[key as keyof WeatherEffects] as number;
              }
            }
            
            recordDisasterStats(w, sev, effects);
            
            if (effects.totalCropsLost > 0 && cropInsurance.value) {
              const lostCrops = findLostCrops(cropSnapshot);
              if (lostCrops.length > 0) {
                processInsuranceClaim(w, sev, lostCrops, currentDay);
              }
            }
            
            if (cropInsurance.value) {
              cropInsurance.value.chargeDailyPremium(currentDay);
            }
          }
          
          weather.value.getState().current = originalWeather;
          weather.value.getState().currentSeverity = originalSeverity;
          
          notifyWeatherEffects(totalEffects, true);
        }

        const cropUpdates = cropGrowth.value.processOfflineGrowth(offlineMs, now);
        const animalUpdates = livestock.value.processOfflineProduction(offlineMs, now);
        petCompanion.value.processOfflineTime(offlineMs, now);

        const expiredOrders = orders.value.checkAndProcessExpiredOrders();
        if (expiredOrders.length > 0) {
          gameState.value.coins = shop.value.getCoins();
        }

        let offlineMsg = '离线期间：';
        let hasContent = false;
        if (weatherHistoryResult.history.length > 0) {
          offlineMsg += `经过${weatherHistoryResult.history.length}天，`;
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
        gameState.value.activeWeatherWarning = activeWeatherWarning.value;
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
      petCompanion.value = new PetCompanion(newGame.pets);
      inventory.value = new Inventory(newGame.inventory, buildings.value);
      weather.value = new Weather(newGame.state.weather, newGame.state.season, buildings.value);
      if (weather.value.getForecast().length === 0) {
        const forecast = weather.value.generateForecast(3);
        gameState.value.weather.forecast = forecast;
        gameState.value.weather.forecastSeverities = weather.value.getForecastSeverities();
      }
      const initialWarning = weather.value.checkAndIssueInitialWarning(gameState.value.day);
      if (initialWarning) {
        activeWeatherWarning.value = initialWarning;
        if (statistics.value) statistics.value.recordWeatherWarningReceived();
        addNotification(initialWarning.message, 'error');
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

      skillTree.value = new SkillTree(newGame.skillTree);
      statistics.value = new Statistics(newGame.stats, skillTree.value);
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

      const rewardAccess_vr_new = {
        addCoins: (amount: number) => {
          if (shop.value) {
            shop.value.addCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
          }
        },
        addReputation: (amount: number) => {
          if (orders.value) {
            orders.value.addReputation(amount);
            if (gameState.value) gameState.value.reputation = orders.value.getReputation();
          }
        },
        addItem: (itemId: string, quantity: number) => {
          return inventory.value?.addItem(itemId, quantity) ?? false;
        }
      };

      const statisticsAccess_vr_new = {
        recordAffinityGained: (amount: number) => statistics.value?.recordAffinityGained(amount),
        recordStageUp: (villagerId: string, newStage: AffinityStage, oldStage: AffinityStage) => statistics.value?.recordStageUp(villagerId, newStage, oldStage),
        recordDialogueCompleted: (villagerId: string) => statistics.value?.recordDialogueCompleted(villagerId),
        recordExclusiveOrderCompleted: (villagerId: string, orderId: string) => statistics.value?.recordExclusiveOrderCompleted(villagerId, orderId),
        recordGiftGiven: (villagerId: string, itemId: string) => statistics.value?.recordGiftGiven(villagerId, itemId),
        recordVillagerStorylineCompleted: (villagerId: string) => statistics.value?.recordVillagerStorylineCompleted(villagerId)
      };

      villagerRelations.value = new VillagerRelations(
        newGame.villagerRelations ?? null,
        rewardAccess_vr_new,
        statisticsAccess_vr_new
      );

      villagerRelations.value.subscribe(handleDialogueCompleted);

      farmHire.value = new FarmHire(newGame.farmHire ?? null);
      farmHire.value.setMapAccess(mapGrid.value);
      farmHire.value.setCropAccess(cropGrowth.value);
      farmHire.value.setVillagerAccess(villagerRelations.value);
      farmHire.value.setCoinAccess({
        getCoins: () => shop.value?.getCoins() ?? 0,
        spendCoins: (amount: number) => {
          if (shop.value && shop.value.getCoins() >= amount) {
            shop.value.spendCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
            return true;
          }
          return false;
        }
      });
      farmHire.value.setInventoryAccess({
        addItem: (itemId: string, quantity: number, quality?: QualityGrade) => {
          return inventory.value?.addItem(itemId, quantity, quality) ?? false;
        }
      });
      farmHire.value.updateReputationLevel(getReputationLevel(gameState.value!.reputation.score).level);

      const auctionCoinAccess_new = {
        getCoins: () => shop.value?.getCoins() ?? 0,
        spendCoins: (amount: number) => {
          if (shop.value && shop.value.getCoins() >= amount) {
            shop.value.spendCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
            return true;
          }
          return false;
        },
        addCoins: (amount: number) => {
          if (shop.value) {
            shop.value.addCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
          }
        }
      };

      const auctionInventoryAccess_new = {
        addItem: (itemId: string, quantity: number, quality?: QualityGrade) => {
          return inventory.value?.addItem(itemId, quantity, quality) ?? false;
        }
      };

      const auctionReputationAccess_new = {
        addReputation: (amount: number) => {
          if (orders.value) {
            orders.value.addReputation(amount);
            if (gameState.value) gameState.value.reputation = orders.value.getReputation();
          }
        },
        getReputationScore: () => orders.value?.getReputation().score ?? 0
      };

      const auctionVillagerAccess_new = {
        addAffinity: (villagerId: string, amount: number) => {
          return villagerRelations.value?.addAffinity(villagerId, amount) ?? {
            stageAdvanced: false,
            newStage: 0,
            stageCodexTriggers: [],
            stageAchievementTriggers: []
          };
        }
      };

      auction.value = new AuctionSystem(
        newGame.auction ?? null,
        auctionCoinAccess_new,
        auctionInventoryAccess_new,
        auctionReputationAccess_new,
        auctionVillagerAccess_new
      );

      const insuranceCoinAccess_new = {
        getCoins: () => shop.value?.getCoins() ?? 0,
        spendCoins: (amount: number) => {
          if (shop.value && shop.value.getCoins() >= amount) {
            shop.value.spendCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
            return true;
          }
          return false;
        },
        addCoins: (amount: number) => {
          if (shop.value) {
            shop.value.addCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
          }
        }
      };

      cropInsurance.value = new CropInsurance(
        newGame.cropInsurance ?? null,
        insuranceCoinAccess_new
      );
      cropInsurance.value.setBuildingsAccess(buildings.value);
      cropInsurance.value.setSkillAccess(combinedBonusAccess);
      cropInsurance.value.setCurrentSeason(newGame.state.season);

      festivalGift.value = new FestivalGift(newGame.festivalGift ?? null);
      festivalGift.value.setVillagerAccess({
        getStage: (villagerId: string) => villagerRelations.value?.getStage(villagerId) ?? 0,
        getAffinity: (villagerId: string) => villagerRelations.value?.getAffinity(villagerId) ?? 0,
        addAffinity: (villagerId: string, amount: number) => villagerRelations.value?.addAffinity(villagerId, amount) ?? { stageAdvanced: false, newStage: 0, stageCodexTriggers: [], stageAchievementTriggers: [] }
      });
      festivalGift.value.setInventoryAccess({
        hasItem: (itemId: string, quantity: number, minQuality?: QualityGrade) => inventory.value?.hasItem(itemId, quantity, minQuality) ?? false,
        removeItem: (itemId: string, quantity: number, quality?: QualityGrade) => inventory.value?.removeItem(itemId, quantity, quality) ?? false,
        getItemQuality: (itemId: string) => {
          const products = inventory.value?.getProducts() || [];
          const match = products.find(p => p.itemId === itemId);
          return match?.quality ?? 3;
        },
        getBestQuality: (itemId: string) => {
          const products = inventory.value?.getProducts() || [];
          const matches = products.filter(p => p.itemId === itemId);
          if (matches.length === 0) return 3 as QualityGrade;
          return Math.max(...matches.map(m => m.quality)) as QualityGrade;
        }
      });
      festivalGift.value.setRewardAccess({
        addCoins: (amount: number) => {
          if (shop.value) {
            shop.value.addCoins(amount);
            if (gameState.value) gameState.value.coins = shop.value.getCoins();
          }
        },
        addReputation: (amount: number) => {
          if (orders.value) {
            orders.value.addReputation(amount);
            if (gameState.value) gameState.value.reputation = orders.value.getReputation();
          }
        },
        addItem: (itemId: string, quantity: number, quality?: QualityGrade) => {
          return inventory.value?.addItem(itemId, quantity, quality) ?? false;
        }
      });
      festivalGift.value.setStatisticsAccess({
        recordFestivalGiftGiven: (villagerId: string, itemId: string, festivalId: FestivalType) => statistics.value?.recordFestivalGiftGiven(villagerId, itemId, festivalId),
        recordFestivalOrderCompleted: (villagerId: string, orderId: string) => statistics.value?.recordFestivalOrderCompleted(villagerId, orderId),
        recordFestivalDialogueCompleted: (villagerId: string, festivalId: FestivalType) => statistics.value?.recordFestivalDialogueCompleted(villagerId, festivalId),
        recordFestivalParticipated: () => statistics.value?.recordFestivalParticipated(),
        recordAffinityGained: (amount: number) => statistics.value?.recordAffinityGained(amount)
      });
      const festivalResult = festivalGift.value.checkAndStartFestival(newGame.state.season, newGame.state.day);
      if (festivalResult) {
        const festConfig = FESTIVALS[festivalResult];
        addNotification(`${festConfig.icon} ${festConfig.name}到了！${festConfig.description}`, 'success');
      }

      if (cropGrowth.value) {
        cropGrowth.value.setSkillAccess(combinedBonusAccess);
      }
      if (livestock.value) {
        livestock.value.setSkillAccess(combinedBonusAccess);
      }
      if (petCompanion.value) {
        petCompanion.value.setSkillAccess(skillTree.value);
      }

      skillTree.value.subscribe(handleSkillTreeChanged);
      skillTree.value.onEvent(handleSkillEvent);
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

  function processOfflineWeatherWithHistory(offlineMs: number, currentTime: number): { history: WeatherType[]; severities: WeatherSeverity[] } {
    if (!weather.value || !mapGrid.value) return { history: [], severities: [] };
    const elapsed = Math.max(0, offlineMs);
    const dayCount = Math.floor(elapsed / DAY_DURATION);
    const history: WeatherType[] = [];
    const severities: WeatherSeverity[] = [];

    const wState = weather.value.getState();
    for (let i = 0; i < dayCount; i++) {
      if (wState.forecast.length > 0) {
        history.push(wState.forecast.shift()!);
        severities.push(wState.forecastSeverities.shift() ?? 'normal');
      }
    }

    weather.value.processOfflineWeather(offlineMs, currentTime, mapGrid.value.getDay());

    while (wState.forecast.length < 3) {
      wState.forecast.push(weather.value.getForecast()[wState.forecast.length]);
      wState.forecastSeverities.push(weather.value.getForecastSeverities()[wState.forecastSeverities.length]);
    }

    return { history, severities };
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

  function handleDialogueCompleted(result: DialogueResult) {
    const detail = getVillagerDetail(result.villagerId);
    if (result.stageAdvanced) {
      const stageName = STAGE_NAMES[result.newStage];
      const color = STAGE_COLORS[result.newStage];
      addNotification(`💖 与${detail?.name || '村民'}好感度提升至【${stageName}】！`, 'success');
    }
    for (const orderId of result.unlockedOrders) {
      const template = getExclusiveOrderById(orderId);
      if (template && orders.value && villagerRelations.value) {
        const order = orders.value.addExclusiveOrder(template);
        if (order) {
          addNotification(`📜 解锁专属订单：${template.name}`, 'info');
        }
      }
    }
    for (const codexId of result.codexTriggers) {
      if (codexSystem.value) {
        codexSystem.value.discoverEntry(codexId);
      }
    }
    if (achievementSystem.value && statistics.value) {
      const newlyUnlocked = achievementSystem.value.checkAchievements(
        statistics.value.getStats(),
        codexSystem.value?.getCompletionPercentage()
      );
      for (const unlocked of newlyUnlocked) {
        handleAchievementUnlocked(unlocked);
      }
    }
    if (result.achievementTriggers.length > 0) {
      for (const achId of result.achievementTriggers) {
        if (achievementSystem.value && !achievementSystem.value.isUnlocked(achId)) {
          const unlockResult = achievementSystem.value.forceUnlock(achId);
          if (unlockResult) {
            handleAchievementUnlocked(unlockResult);
          }
        }
      }
    }
  }

  function handleSkillTreeChanged(state: SkillTreeState, bonus: SkillEffectBonus) {
  }

  function handleSkillEvent(event: SkillEvent) {
    switch (event.type) {
      case 'experience_gained':
        if (event.data.amount > 0) {
          addExpToMerge(
            event.data.amount,
            event.data.reason,
            expMergeX,
            expMergeY
          );
        }
        break;
      case 'level_up':
        if (levelUpModalRef.value) {
          levelUpModalRef.value.showLevelUp(event.data);
        }
        if (expFloatTextRef.value) {
          expFloatTextRef.value.showFloatExp(
            event.data.newLevel,
            undefined,
            expMergeX,
            expMergeY,
            'levelup'
          );
        }
        addNotification(`🎉 恭喜升级到 Lv.${event.data.newLevel}！获得 ${event.data.skillPointsGained} 天赋点`, 'success');
        break;
      case 'skill_point_gained':
        if (expFloatTextRef.value) {
          expFloatTextRef.value.showFloatExp(
            event.data.pointsGained,
            undefined,
            expMergeX,
            expMergeY,
            'skillpoint'
          );
        }
        break;
      case 'skill_unlocked':
        const skillName = event.data.node?.name || event.data.nodeId;
        const levelText = event.data.isMaxLevel ? '（已满级）' : ` Lv.${event.data.newLevel}`;
        addNotification(`✨ 解锁技能：${skillName}${levelText}`, 'success');
        break;
    }
  }

  function addExpToMerge(amount: number, reason: string, x?: number, y?: number) {
    expMergeTotal += amount;
    if (expMergeReason === '') {
      expMergeReason = reason;
    }
    if (x !== undefined) {
      expMergeX = x;
    }
    if (y !== undefined) {
      expMergeY = y;
    }

    if (expMergeTimer !== null) {
      clearTimeout(expMergeTimer);
    }

    expMergeTimer = window.setTimeout(() => {
      flushExpMerge();
    }, 150);
  }

  function flushExpMerge() {
    if (expMergeTimer !== null) {
      clearTimeout(expMergeTimer);
      expMergeTimer = null;
    }

    if (expMergeTotal > 0 && expFloatTextRef.value) {
      expFloatTextRef.value.showFloatExp(
        expMergeTotal,
        expMergeReason,
        expMergeX,
        expMergeY,
        'exp'
      );
    }

    expMergeTotal = 0;
    expMergeReason = '';
    expMergeX = undefined;
    expMergeY = undefined;
  }

  function setNextExpPosition(screenX: number, screenY: number) {
    expMergeX = screenX;
    expMergeY = screenY;
  }

  function setLevelUpModalRef(ref: any) {
    levelUpModalRef.value = ref;
  }

  function setExpFloatTextRef(ref: any) {
    expFloatTextRef.value = ref;
  }

  function showExpFloatAtScreen(
    screenX: number,
    screenY: number,
    amount: number,
    reason?: string,
    type: 'exp' | 'levelup' | 'skillpoint' = 'exp'
  ) {
    if (expFloatTextRef.value) {
      expFloatTextRef.value.showFloatExp(amount, reason, screenX, screenY, type);
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

  function takeCropSnapshot(): Array<{ x: number; y: number; cropType: string; waterCount: number; growthProgress: number; hasCrop: boolean }> {
    if (!mapGrid.value || !cropGrowth.value) return [];

    const plots = mapGrid.value.getPlotGrid();
    const snapshot: Array<{ x: number; y: number; cropType: string; waterCount: number; growthProgress: number; hasCrop: boolean }> = [];

    for (let y = 0; y < plots.length; y++) {
      for (let x = 0; x < plots[y].length; x++) {
        const plot = plots[y][x];
        if (plot.unlocked && plot.crop) {
          const growth = cropGrowth.value.calculateGrowth(plot.crop, Date.now());
          snapshot.push({
            x,
            y,
            cropType: plot.crop.type,
            waterCount: plot.crop.waterCount || 0,
            growthProgress: growth,
            hasCrop: true
          });
        }
      }
    }

    return snapshot;
  }

  function findLostCrops(
    snapshot: Array<{ x: number; y: number; cropType: string; waterCount: number; growthProgress: number; hasCrop: boolean }>
  ): Array<{ x: number; y: number; cropType: string; waterCount: number; growthProgress: number }> {
    if (!mapGrid.value) return [];

    const plots = mapGrid.value.getPlotGrid();
    const lost: Array<{ x: number; y: number; cropType: string; waterCount: number; growthProgress: number }> = [];

    for (const snap of snapshot) {
      const plot = plots[snap.y]?.[snap.x];
      if (!plot || !plot.crop) {
        lost.push({
          x: snap.x,
          y: snap.y,
          cropType: snap.cropType,
          waterCount: snap.waterCount,
          growthProgress: snap.growthProgress
        });
      }
    }

    return lost;
  }

  function processInsuranceClaim(
    weather: WeatherType,
    severity: WeatherSeverity,
    lostCrops: Array<{ x: number; y: number; cropType: string; waterCount: number; growthProgress: number }>,
    currentDay: number
  ): InsurancePayoutResult | null {
    if (!cropInsurance.value || !mapGrid.value || lostCrops.length === 0) return null;

    const plots = mapGrid.value.getPlotGrid();
    const result = cropInsurance.value.processClaim(
      plots,
      weather,
      severity,
      lostCrops,
      currentDay
    );

    if (result.covered && result.totalPayout > 0) {
      const planName = getInsurancePlan(result.plan!)?.name || '保险';
      addNotification(
        `🛡️ ${planName}理赔：+${result.totalPayout}金币（${result.cropsLost}株作物受损）`,
        'success'
      );
      if (statistics.value) {
        statistics.value.recordCoinsEarned(result.totalPayout);
      }
      checkAchievements();
    }

    return result;
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
    if (effects.witheredCrops > 0) {
      parts.push(`${effects.witheredCrops}株作物因干旱枯萎`);
    }
    if (effects.scorchedCrops > 0) {
      parts.push(`${effects.scorchedCrops}株作物被热浪灼伤`);
    }
    if (effects.greenhouseProtected > 0) {
      parts.push(`温室保护了${effects.greenhouseProtected}株作物`);
    }
    if (effects.lightningRodProtected > 0) {
      parts.push(`防雷针保护了${effects.lightningRodProtected}株作物`);
    }
    if (effects.heaterProtected > 0) {
      parts.push(`加热器保护了${effects.heaterProtected}株作物`);
    }
    if (effects.drainageProtected > 0) {
      parts.push(`排水沟保护了${effects.drainageProtected}株作物`);
    }
    if (parts.length > 0) {
      const prefix = isOffline ? '离线期间' : '天气变化';
      addNotification(`${prefix}：${parts.join('，')}`, 'info');
    }
  }

  async function saveGame() {
    if (!gameState.value || !mapGrid.value || !livestock.value || !petCompanion.value || !inventory.value || !shop.value || !weather.value || !orders.value || !buildings.value || !statistics.value || !skillTree.value || !achievementSystem.value || !codexSystem.value || !villagerRelations.value) {
      return;
    }

    gameState.value.coins = shop.value.getCoins();
    gameState.value.season = mapGrid.value.getSeason();
    gameState.value.day = mapGrid.value.getDay();
    gameState.value.lastSeasonAdvance = mapGrid.value.getLastSeasonAdvance();
    gameState.value.weather = weather.value.getState();
    gameState.value.activeWeatherWarning = activeWeatherWarning.value;
    gameState.value.reputation = orders.value.getReputation();

    const rawState = JSON.parse(JSON.stringify(toRaw(gameState.value)));
    const rawPlots = JSON.parse(JSON.stringify(toRaw(mapGrid.value.getAllPlots())));
    const rawAnimals = JSON.parse(JSON.stringify(toRaw(livestock.value.getAnimals())));
    const rawPets = JSON.parse(JSON.stringify(toRaw(petCompanion.value.getPets())));
    const rawInventory = JSON.parse(JSON.stringify(toRaw(inventory.value.getInventoryItems())));
    const rawOrders = JSON.parse(JSON.stringify(toRaw(orders.value.getOrders())));
    const rawBuildings = JSON.parse(JSON.stringify(toRaw(buildings.value.getBuildings())));
    const rawStats = JSON.parse(JSON.stringify(toRaw(statistics.value.getStats())));
    const rawSkillTree = JSON.parse(JSON.stringify(toRaw(skillTree.value.getState())));
    const rawAchievements = JSON.parse(JSON.stringify(toRaw(Object.values(achievementSystem.value.getAllProgress()))));
    const rawCodex = JSON.parse(JSON.stringify(toRaw(codexSystem.value.getAllEntries())));
    const rawVillagerRelations = JSON.parse(JSON.stringify(toRaw(villagerRelations.value.getState())));
    const rawFarmHire = farmHire.value ? JSON.parse(JSON.stringify(toRaw(farmHire.value.getState()))) : undefined;
    const rawAuction = auction.value ? JSON.parse(JSON.stringify(toRaw(auction.value.getState()))) : undefined;
    const rawCropInsurance = cropInsurance.value ? JSON.parse(JSON.stringify(toRaw(cropInsurance.value.getState()))) : undefined;
    const rawFestivalGift = festivalGift.value ? JSON.parse(JSON.stringify(toRaw(festivalGift.value.getState()))) : undefined;

    await gameDB.saveCompleteGame(
      rawState,
      rawPlots,
      rawAnimals,
      rawPets,
      rawInventory,
      rawOrders,
      rawBuildings,
      rawStats,
      rawAchievements,
      rawCodex,
      rawSkillTree,
      rawVillagerRelations,
      rawFarmHire,
      rawAuction,
      rawCropInsurance,
      rawFestivalGift
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
      inventory.value.addItem(result.itemId, result.quantity, result.quality);
      const item = getItem(result.itemId);
      const qualityName = QUALITY_NAMES[result.quality];
      const stars = getQualityStars(result.quality);
      
      if (statistics.value) {
        statistics.value.recordProductCollected(result.itemId, result.quantity);
        statistics.value.recordQualityHarvest(result.quality);
      }
      if (codexSystem.value) {
        codexSystem.value.discoverItem(result.itemId, result.quantity, result.quality);
      }
      checkAchievements();
      
      addNotification(`收集了${result.quantity}个${item?.name}！${stars} ${qualityName}`, 'success');
      saveGame();
    } else {
      const animal = livestock.value.getAnimal(animalId);
      if (animal && !animal.hasProduct) {
        const fed = livestock.value.feedAnimal(animalId);
        if (fed) {
          const animalConfig = getAnimalConfig(animal.type);
          addNotification(`喂养了${animalConfig?.name || '动物'}！（${animal.feedCount}次）`, 'info');
          saveGame();
        }
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

  function adoptPet(type: PetType): { success: boolean; message: string; pet?: Pet } {
    if (!petCompanion.value || !shop.value || !gameState.value || !skillTree.value) {
      return { success: false, message: '系统未初始化' };
    }

    const price = getPetPrice(type);
    if (gameState.value.coins < price) {
      return { success: false, message: '金币不足' };
    }

    const pet = petCompanion.value.adoptPet(type);
    if (!pet) {
      return { success: false, message: '领养失败' };
    }

    shop.value.spendCoins(price);
    gameState.value.coins = shop.value.getCoins();

    if (statistics.value) {
      statistics.value.recordCoinsSpent(price);
      statistics.value.recordPetAdopted(type);
    }
    if (codexSystem.value) {
      codexSystem.value.discoverPet(type, 1);
    }

    checkAchievements();
    saveGame();

    const config = getPetConfig(type);
    addNotification(`恭喜领养了${config?.name || '宠物'}！`, 'success');
    return { success: true, message: '领养成功', pet };
  }

  function releasePet(petId: string): { success: boolean; message: string } {
    if (!petCompanion.value) {
      return { success: false, message: '系统未初始化' };
    }

    const pet = petCompanion.value.getPet(petId);
    if (!pet) {
      return { success: false, message: '宠物不存在' };
    }

    const result = petCompanion.value.releasePet(petId);
    if (result) {
      addNotification(`已释放${pet.name}`, 'info');
      saveGame();
      return { success: true, message: '释放成功' };
    }
    return { success: false, message: '释放失败' };
  }

  function setActivePet(petId: string): { success: boolean; message: string } {
    if (!petCompanion.value) {
      return { success: false, message: '系统未初始化' };
    }

    const result = petCompanion.value.setActivePet(petId);
    if (result) {
      const pet = petCompanion.value.getPet(petId);
      addNotification(`${pet?.name || '宠物'}现在随行了！`, 'success');
      saveGame();
      return { success: true, message: '设置成功' };
    }
    return { success: false, message: '设置失败' };
  }

  function petAnimal(petId: string): { success: boolean; message: string; happinessGained?: number; remainingCooldown?: number } {
    if (!petCompanion.value || !skillTree.value) {
      return { success: false, message: '系统未初始化' };
    }

    const result = petCompanion.value.petAnimal(petId);
    if (result.success) {
      if (skillTree.value) {
        skillTree.value.addExperience(5, 'pet_petted');
      }
      saveGame();
      return { success: true, message: `抚摸成功！亲密度+${result.happinessGained}`, happinessGained: result.happinessGained };
    } else if (result.remainingCooldown > 0) {
      return { success: false, message: `冷却中，还需${result.remainingCooldown}秒`, remainingCooldown: result.remainingCooldown };
    }
    return { success: false, message: '抚摸失败' };
  }

  function feedPet(petId: string): { success: boolean; message: string } {
    if (!petCompanion.value) {
      return { success: false, message: '系统未初始化' };
    }

    const result = petCompanion.value.feedPet(petId);
    if (result) {
      const pet = petCompanion.value.getPet(petId);
      addNotification(`喂食${pet?.name || '宠物'}成功！亲密度+${HAPPINESS_PER_FEED}`, 'success');
      saveGame();
      return { success: true, message: '喂食成功' };
    }
    return { success: false, message: '喂食失败' };
  }

  function getPetCooldown(petId: string): number {
    return petCompanion.value?.getPetCooldown(petId) ?? 0;
  }

  function renamePet(petId: string, newName: string): { success: boolean; message: string } {
    if (!petCompanion.value) {
      return { success: false, message: '系统未初始化' };
    }

    const result = petCompanion.value.renamePet(petId, newName);
    if (result) {
      addNotification(`宠物已改名为${newName}`, 'success');
      saveGame();
      return { success: true, message: '改名成功' };
    }
    return { success: false, message: '改名失败' };
  }

  function getBuyablePets() {
    return getAllPetConfigs();
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
      weather.value.getState().forecastSeverities = weather.value.getForecastSeverities();
      
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

    const currentDay = mapGrid.value.getDay();
    const weatherUpdate = weather.value.advanceDay(time, currentDay);
    if (weatherUpdate.changed && weatherUpdate.newWeather) {
      const sevLabel = weather.value.getSeverityName(weatherUpdate.newSeverity ?? 'normal');
      addNotification(`今日天气：${sevLabel}${weather.value.getWeatherName(weatherUpdate.newWeather)}！`, 'info');
      
      const cropSnapshot = takeCropSnapshot();
      
      const effects = weather.value.applyWeatherEffects(mapGrid.value.getPlotGrid(), time);
      notifyWeatherEffects(effects, false);
      recordDisasterStats(weatherUpdate.newWeather, weatherUpdate.newSeverity ?? 'normal', effects);

      if (effects.totalCropsLost > 0) {
        const lostCrops = findLostCrops(cropSnapshot);
        if (lostCrops.length > 0 && cropInsurance.value) {
          processInsuranceClaim(
            weatherUpdate.newWeather,
            weatherUpdate.newSeverity ?? 'normal',
            lostCrops,
            currentDay
          );
        }
      }

      if (statistics.value && weatherUpdate.newWeather === 'stormy') {
        statistics.value.recordStormOccurred();
      }

      activeWeatherWarning.value = null;
    }

    if (weatherUpdate.warning) {
      activeWeatherWarning.value = weatherUpdate.warning;
      if (statistics.value) {
        statistics.value.recordWeatherWarningReceived();
      }
      addNotification(weatherUpdate.warning.message, 'error');
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
    petCompanion.value?.updateAll(time);
  }

  function recordDisasterStats(weather: WeatherType, severity: WeatherSeverity, effects: WeatherEffects) {
    if (!statistics.value) return;
    const isSevere = severity === 'severe';
    const isDangerous = ['stormy', 'snowy', 'drought', 'heatwave'].includes(weather);

    if (isDangerous) {
      statistics.value.recordDisasterOccurred(weather, isSevere);
    }

    if (effects.greenhouseProtected > 0) {
      statistics.value.recordCropsSavedByBuilding('greenhouse', effects.greenhouseProtected);
    }
    if (effects.lightningRodProtected > 0) {
      statistics.value.recordCropsSavedByBuilding('lightning_rod', effects.lightningRodProtected);
    }
    if (effects.heaterProtected > 0) {
      statistics.value.recordCropsSavedByBuilding('heater', effects.heaterProtected);
    }
    if (effects.drainageProtected > 0) {
      statistics.value.recordCropsSavedByBuilding('drainage', effects.drainageProtected);
    }
    if (effects.sprinklerWatered > 0) {
      statistics.value.recordCropsSavedByBuilding('sprinkler', effects.sprinklerWatered);
    }

    const lost = effects.frozenCrops + effects.destroyedCrops + effects.witheredCrops + effects.scorchedCrops;
    if (lost > 0) {
      statistics.value.recordCropsLostToDisaster(weather, lost);
    }

    if (isSevere && isDangerous && lost === 0) {
      statistics.value.recordPerfectDisasterDefense();
    }
  }

  function dismissWeatherWarning() {
    if (activeWeatherWarning.value && statistics.value) {
      statistics.value.recordWeatherWarningActed();
    }
    activeWeatherWarning.value = null;
  }

  function submitOrder(orderId: string) {
    if (!orders.value || !gameState.value || !shop.value) {
      return { success: false, message: '系统未初始化' };
    }

    const order = orders.value.getOrderById(orderId);
    const isExclusive = order?.isExclusive ?? false;
    const result = isExclusive 
      ? orders.value.submitExclusiveOrder(orderId)
      : orders.value.submitOrder(orderId);

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
        if (order?.villagerId) {
          statistics.value.recordOrderCompletedForVillager(order.villagerId);
        }
        if (isExclusive && order?.villagerId && (result as any).templateId) {
          statistics.value.recordExclusiveOrderCompleted(order.villagerId, (result as any).templateId);
        }
      }
      if (codexSystem.value && order) {
        codexSystem.value.discoverVillager(order.villagerId);
        if (result.rareSeedId) {
          codexSystem.value.discoverItem(result.rareSeedId, result.rareSeedQuantity || 1);
        }
      }
      if (villagerRelations.value && order?.villagerId) {
        const affinityDelta = villagerRelations.value.recordOrderCompleted(
          order.villagerId,
          order.tier,
          isExclusive
        );
        if (affinityDelta > 0) {
          const detail = getVillagerDetail(order.villagerId);
          addNotification(`💝 ${detail?.name || '村民'}好感度 +${affinityDelta}`, 'info');
        }
        if (isExclusive && (result as any).templateId) {
          villagerRelations.value.completeExclusiveOrder(order.villagerId, (result as any).templateId);
        }
      }
      checkAchievements();
      
      let msg = isExclusive ? `【专属订单】完成！` : `订单完成！`;
      msg += `获得${result.coins}金币，+${result.reputation}信誉`;
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

  function openSkillTreeModal() {
    showSkillTree.value = true;
  }

  function closeSkillTreeModal() {
    showSkillTree.value = false;
  }

  function unlockSkillNode(nodeId: string): { success: boolean; message: string; node?: SkillNode } {
    if (!skillTree.value) {
      return { success: false, message: '技能树系统未初始化' };
    }

    const result = skillTree.value.unlockNode(nodeId);
    if (result.success) {
      addNotification(result.message, 'success');
      checkAchievements();
      saveGame();
    } else {
      addNotification(result.message, 'error');
    }
    return result;
  }

  function canUnlockSkillNode(nodeId: string): { canUnlock: boolean; reason: string } {
    if (!skillTree.value) {
      return { canUnlock: false, reason: '技能树系统未初始化' };
    }
    return skillTree.value.canUnlockNode(nodeId);
  }

  function getSkillNodeLevel(nodeId: string): number {
    return skillTree.value?.getNodeLevel(nodeId) ?? 0;
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

    if (cropInsurance.value && gameState.value) {
      const currentDay = mapGrid.value.getDay();
      const premiumResult = cropInsurance.value.chargeDailyPremium(currentDay);
      if (premiumResult.charged && premiumResult.amount > 0) {
        addNotification(`🛡️ 保险保费扣除：-${premiumResult.amount}金币`, 'info');
      } else if (premiumResult.message) {
        addNotification(premiumResult.message, 'error');
      }
    }

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

    if (farmHire.value && gameState.value) {
      farmHire.value.updateReputationLevel(getReputationLevel(gameState.value.reputation.score).level);
      farmHire.value.refreshWorkerStats();

      const currentDay = mapGrid.value.getDay();
      const wageResult = farmHire.value.settleWages(currentDay);
      if (wageResult.totalWage > 0) {
        addNotification(`💰 雇工日薪结算：-${wageResult.totalWage}金币（${wageResult.settledWorkers.length}人）`, 'info');
      } else if (wageResult.insufficientFunds && wageResult.dismissedWorkers.length > 0) {
        const names = wageResult.dismissedWorkers.map(id => getVillagerDetail(id)?.name || '村民').join('、');
        addNotification(`💸 金币不足！已自动解雇雇工：${names}`, 'error');
      }

      const harvestShares = farmHire.value.executeWorkerTasks();
      if (harvestShares.length > 0) {
        for (const share of harvestShares) {
          const item = getItem(share.itemId);
          addNotification(`🌾 雇工${getVillagerDetail(share.villagerId)?.name || '村民'}收获了${share.quantity}个${item?.name || '作物'}（分成部分）`, 'info');
        }
      }
    }

    if (auction.value && mapGrid.value) {
      const dayOfWeek = ((mapGrid.value.getDay() - 1) % 7) + 1;
      const auctionResult = auction.value.checkAndUpdateAuction(dayOfWeek);
      
      if (auctionResult.settledItems && auctionResult.settledItems.length > 0) {
        for (const settled of auctionResult.settledItems) {
          const repChange = settled.reputationImpact || 0;
          const repText = repChange > 0 ? `⭐ 声望 +${repChange}` : repChange < 0 ? `💔 声望 ${repChange}` : '';
          
          if (settled.won) {
            const parts = [`🎉 【离线拍卖】你以${settled.finalPrice}金币拍得【${settled.item.name}】`];
            if (repText) parts.push(repText);
            if (settled.rewards?.coins) parts.push(`💰 额外 +${settled.rewards.coins}金币`);
            addNotification(parts.join(' | '), 'success');
          } else {
            const parts = [`😔 【离线拍卖】【${settled.item.name}】被别人拍走了，成交价${settled.finalPrice}金币`];
            if (repText) parts.push(repText);
            addNotification(parts.join(' | '), 'info');
          }
        }
      }
      
      if (auctionResult.started) {
        addNotification(`🎉 周末到啦！集市拍卖会开始了！`, 'info');
      }
      
      if (auctionResult.ended) {
        addNotification('🏁 今日拍卖会已结束', 'info');
      }
      
      if (auctionResult.started || auctionResult.ended || (auctionResult.settledItems && auctionResult.settledItems.length > 0)) {
        saveGame();
      }
    }
  }

  function openMiningModal() {
    showMiningModal.value = true;
  }

  function closeMiningModal() {
    showMiningModal.value = false;
  }

  function startMineExploration(): { success: boolean; message: string } {
    if (!shop.value || !statistics.value) {
      return { success: false, message: '系统未初始化' };
    }

    const coins = shop.value.getCoins();
    if (coins < MINE_ENTRY_COST) {
      return { success: false, message: `进入矿洞需要${MINE_ENTRY_COST}金币` };
    }

    if (currentMineSession.value?.active) {
      return { success: false, message: '已有正在进行的矿洞探险' };
    }

    shop.value.spendCoins(MINE_ENTRY_COST);
    gameState.value!.coins = shop.value.getCoins();
    statistics.value.recordCoinsSpent(MINE_ENTRY_COST);
    statistics.value.recordMineExploration();

    const session = createMineSession(TOTAL_MINE_FLOORS);
    currentMineSession.value = session;
    statistics.value.recordMineFloorReached(1);
    checkAchievements();
    saveGame();

    addNotification('⛏️ 进入矿洞第1层！', 'info');
    return { success: true, message: '矿洞探险开始' };
  }

  function getCurrentMineFloor(): MineFloor | null {
    if (!currentMineSession.value) return null;
    return currentMineSession.value.floors[currentMineSession.value.currentFloor] || null;
  }

  function moveInMine(x: number, y: number): { success: boolean; message: string } {
    const session = currentMineSession.value;
    if (!session || !session.active) {
      return { success: false, message: '没有进行中的矿洞探险' };
    }

    const floor = session.floors[session.currentFloor];
    if (!floor) {
      return { success: false, message: '当前层数据错误' };
    }

    if (!isAdjacent(floor.playerX, floor.playerY, x, y)) {
      return { success: false, message: '只能移动到相邻的格子' };
    }

    if (!canMoveTo(floor, x, y)) {
      return { success: false, message: '该位置无法通过，请先挖掘' };
    }

    floor.playerX = x;
    floor.playerY = y;
    revealAround(floor.tiles, x, y);

    if (x === floor.exitX && y === floor.exitY) {
      return advanceToNextFloor();
    }

    return { success: true, message: '移动成功' };
  }

  function advanceToNextFloor(): { success: boolean; message: string } {
    const session = currentMineSession.value;
    if (!session) return { success: false, message: '无进行中的探险' };

    const currentFloorNum = session.currentFloor;
    const currentFloor = session.floors[currentFloorNum];
    currentFloor.cleared = true;
    currentFloor.explored = true;

    if (currentFloorNum >= session.maxFloor) {
      statistics.value?.recordMineCleared();
      endMineExploration(true);
      addNotification('🎉 恭喜！通关矿洞全部层数！', 'success');
      return { success: true, message: '通关成功！' };
    }

    const nextFloorNum = currentFloorNum + 1;
    if (!session.floors[nextFloorNum]) {
      session.floors[nextFloorNum] = generateMineFloor(nextFloorNum);
    }

    session.currentFloor = nextFloorNum;
    const newFloor = session.floors[nextFloorNum];
    session.stamina = newFloor.maxStamina;
    session.maxStamina = newFloor.maxStamina;

    statistics.value?.recordMineFloorReached(nextFloorNum);
    checkAchievements();
    addNotification(`⬇️ 进入矿洞第${nextFloorNum}层！`, 'info');
    saveGame();

    return { success: true, message: `进入第${nextFloorNum}层`, clearedFloor: true, advancedFloor: true } as any;
  }

  function mineTile(x: number, y: number): MineExploreResult & { success: boolean } {
    const session = currentMineSession.value;
    const defaultResult = {
      sessionId: '',
      floor: 0,
      quantity: 0,
      staminaCost: 0,
      message: '',
      tilesMined: 0,
      reachedFloor: 0,
      newDiscoveries: [],
      success: false
    };

    if (!session || !session.active) {
      return { ...defaultResult, message: '没有进行中的矿洞探险' };
    }

    const floor = session.floors[session.currentFloor];
    if (!floor) {
      return { ...defaultResult, message: '当前层数据错误' };
    }

    if (!isAdjacent(floor.playerX, floor.playerY, x, y)) {
      return { ...defaultResult, message: '只能挖掘相邻的格子' };
    }

    const tile = floor.tiles[y]?.[x];
    if (!tile) {
      return { ...defaultResult, message: '位置无效' };
    }

    if (tile.mined) {
      return { ...defaultResult, message: '该位置已经挖掘过了' };
    }

    if (tile.type === 'wall' || tile.type === 'entry' || tile.type === 'exit' || tile.type === 'empty') {
      return { ...defaultResult, message: '该位置无法挖掘' };
    }

    const staminaCost = getStaminaCost(tile);
    if (session.stamina < staminaCost) {
      return { ...defaultResult, message: `体力不足！需要${staminaCost}点体力` };
    }

    session.stamina -= staminaCost;
    tile.mined = true;
    revealAround(floor.tiles, x, y);

    let mineralId: string | undefined;
    let mineralName: string | undefined;
    let coins = 0;
    let quantity = 0;
    const newDiscoveries: string[] = [];

    if ((tile.type === 'ore' || tile.type === 'rare_ore') && tile.mineralId) {
      const config = getMineralConfig(tile.mineralId);
      mineralId = tile.mineralId;
      mineralName = config?.name;
      quantity = tile.type === 'rare_ore' ? 2 : 1;

      if (inventory.value) {
        inventory.value.addItem(mineralId, quantity);
      }

      addItemsToSession(session, mineralId, quantity);
      statistics.value?.recordMineralMined(mineralId, quantity);

      const discovery = codexSystem.value?.discoverMineral(mineralId, quantity);
      if (discovery?.isNew) {
        newDiscoveries.push(mineralId);
      }

      addNotification(`⛏️ 挖到了${quantity}个${config?.icon}${mineralName}！`, 'success');
    } else if (tile.type === 'treasure' && tile.reward) {
      if (tile.reward.coins) {
        coins = tile.reward.coins;
        shop.value?.addCoins(coins);
        gameState.value!.coins = shop.value!.getCoins();
        session.totalCoinsGained += coins;
        statistics.value?.recordCoinsEarned(coins);
        addNotification(`💰 发现宝箱！获得${coins}金币！`, 'success');
      }
    } else if (tile.type === 'mushroom' && tile.reward?.itemId) {
      const mushQty = tile.reward.quantity || 1;
      if (inventory.value) {
        inventory.value.addItem(tile.reward.itemId, mushQty);
      }
      addItemsToSession(session, tile.reward.itemId, mushQty);
      statistics.value?.recordItemDiscovered(tile.reward.itemId, mushQty);
      codexSystem.value?.discoverItem(tile.reward.itemId, mushQty);
      codexSystem.value?.discoverMineral(tile.reward.itemId, mushQty);
      addNotification(`🍄 采集了${mushQty}个矿洞蘑菇！`, 'success');
    } else if (tile.type === 'rock') {
      addNotification('🪨 挖开了一块岩石', 'info');
    }

    checkAchievements();
    saveGame();

    return {
      sessionId: session.id,
      floor: session.currentFloor,
      mineralId,
      mineralName,
      quantity,
      coins,
      staminaCost,
      message: '挖掘成功',
      tilesMined: 1,
      reachedFloor: session.currentFloor,
      newDiscoveries,
      success: true
    };
  }

  function buyMineStaminaPotion(): { success: boolean; message: string } {
    const session = currentMineSession.value;
    if (!session || !session.active) {
      return { success: false, message: '没有进行中的矿洞探险' };
    }
    if (!shop.value) {
      return { success: false, message: '系统未初始化' };
    }

    const coins = shop.value.getCoins();
    if (coins < MINE_STAMINA_POTION_COST) {
      return { success: false, message: `体力药水需要${MINE_STAMINA_POTION_COST}金币` };
    }

    shop.value.spendCoins(MINE_STAMINA_POTION_COST);
    gameState.value!.coins = shop.value.getCoins();
    statistics.value?.recordCoinsSpent(MINE_STAMINA_POTION_COST);

    session.stamina = Math.min(session.maxStamina, session.stamina + MINE_STAMINA_POTION_AMOUNT);
    addNotification(`🧪 使用体力药水，恢复${MINE_STAMINA_POTION_AMOUNT}点体力！`, 'success');
    saveGame();
    return { success: true, message: '体力恢复成功' };
  }

  function endMineExploration(completed: boolean = false) {
    const session = currentMineSession.value;
    if (!session) return;

    session.active = false;

    if (!completed) {
      addNotification('🏃 结束矿洞探险，返回地面', 'info');
    }

    checkAchievements();
    saveGame();
  }

  function exitMine() {
    endMineExploration(false);
    currentMineSession.value = null;
    closeMiningModal();
  }

  function openVillagersPanel() {
    showVillagers.value = true;
  }

  function closeVillagersPanel() {
    showVillagers.value = false;
  }

  function toggleVillagersPanel() {
    showVillagers.value = !showVillagers.value;
  }

  function getVillagerInfo(villagerId: string) {
    return villagerRelations.value?.getVillagerInfo(villagerId) ?? null;
  }

  function getCurrentDialogue(villagerId: string) {
    return villagerRelations.value?.getCurrentDialogue(villagerId) ?? null;
  }

  function advanceVillagerDialogue(villagerId: string, choiceIndex?: number): DialogueAdvanceResult | null {
    if (!villagerRelations.value) return null;
    const result = villagerRelations.value.advanceDialogue(villagerId, choiceIndex);
    if (result.affinityDelta > 0) {
      addNotification(`💬 对话好感度 +${result.affinityDelta}`, 'info');
    }
    if (result.unlockedRewards.length > 0 || result.claimedReward) {
      const reward = result.claimedReward;
      if (reward) {
        let msg = '🎁 获得剧情奖励：';
        if (reward.type === 'coins') msg += `${reward.amount}金币`;
        else if (reward.type === 'reputation') msg += `${reward.amount}声望`;
        else if (reward.type === 'item' || reward.type === 'seed') {
          const it = getItem(reward.itemId || '');
          msg += `${it?.name || reward.itemId} x${reward.amount}`;
        }
        addNotification(msg, 'success');
      }
    }
    checkAchievements();
    saveGame();
    return result;
  }

  function giveGiftToVillager(villagerId: string, itemId: string, quantity: number = 1): { success: boolean; message: string; affinityDelta?: number } {
    if (!villagerRelations.value || !inventory.value) {
      return { success: false, message: '系统未初始化' };
    }
    if (!inventory.value.hasItem(itemId, quantity)) {
      const item = getItem(itemId);
      return { success: false, message: `${item?.name || itemId}数量不足` };
    }
    if (!inventory.value.removeItem(itemId, quantity)) {
      return { success: false, message: '扣除物品失败' };
    }
    const result = villagerRelations.value.giveGift(villagerId, itemId);
    if (result.success && result.affinityDelta) {
      const detail = getVillagerDetail(villagerId);
      if (result.affinityDelta > 0) {
        addNotification(`🎁 ${detail?.name || '村民'}很喜欢这个礼物！好感度 +${result.affinityDelta}`, 'success');
      } else if (result.affinityDelta < 0) {
        addNotification(`😞 ${detail?.name || '村民'}似乎不喜欢...好感度 ${result.affinityDelta}`, 'error');
      }
    }
    checkAchievements();
    saveGame();
    return {
      success: result.success,
      message: result.message || (result.success ? '赠送成功' : '赠送失败'),
      affinityDelta: result.affinityDelta
    };
  }

  function resetVillagerDialogue(villagerId: string): boolean {
    return villagerRelations.value?.resetVillagerDialogue(villagerId) ?? false;
  }

  function giveFestivalGiftToVillager(villagerId: string, itemId: string, quality: QualityGrade): FestivalGiftResult {
    if (!festivalGift.value) {
      return { success: false, message: '系统未初始化', affinityDelta: 0, isFavorite: false, isDisliked: false, qualityBonus: 0, stageAdvanced: false, newStage: 0, unlockedOrders: [], unlockedDialogues: [], codexTriggers: [], achievementTriggers: [] };
    }
    const result = festivalGift.value.giveFestivalGift(villagerId, itemId, quality);
    if (result.success) {
      const detail = getVillagerDetail(villagerId);
      if (result.isFavorite) {
        addNotification(`🎊 ${detail?.name || '村民'}在节日里非常喜欢这份礼物！好感度 +${result.affinityDelta}`, 'success');
      } else if (result.isDisliked) {
        addNotification(`😞 ${detail?.name || '村民'}在节日里不太喜欢这个...好感度 ${result.affinityDelta}`, 'error');
      } else {
        addNotification(`🎁 ${detail?.name || '村民'}在节日收下了礼物。好感度 +${result.affinityDelta}`, 'info');
      }
      if (result.stageAdvanced) {
        addNotification(`💖 与${detail?.name || '村民'}好感度提升！`, 'success');
      }
      for (const orderId of result.unlockedOrders) {
        addNotification(`📜 解锁节日专属订单！`, 'info');
      }
    }
    checkAchievements();
    saveGame();
    return result;
  }

  function advanceFestivalDialogue(villagerId: string, choiceIndex?: number) {
    if (!festivalGift.value) return null;
    const result = festivalGift.value.advanceFestivalDialogue(villagerId, choiceIndex);
    if (result.affinityDelta > 0) {
      addNotification(`💬 节日对话好感度 +${result.affinityDelta}`, 'info');
    }
    for (const orderId of result.unlockedOrders) {
      addNotification(`📜 解锁节日专属订单！`, 'info');
    }
    checkAchievements();
    saveGame();
    return result;
  }

  function getCurrentFestivalDialogue(villagerId: string) {
    return festivalGift.value?.getCurrentFestivalDialogue(villagerId) ?? null;
  }

  function checkFestivalStart() {
    if (!festivalGift.value || !gameState.value) return;
    const result = festivalGift.value.checkAndStartFestival(gameState.value.season, gameState.value.day);
    if (result) {
      const festConfig = FESTIVALS[result];
      addNotification(`${festConfig.icon} ${festConfig.name}到了！${festConfig.description}`, 'success');
    }
  }

  function openHireWorkerPanel() {
    showHireWorker.value = true;
  }

  function closeHireWorkerPanel() {
    showHireWorker.value = false;
  }

  function hireWorker(villagerId: string): { success: boolean; message: string } {
    if (!farmHire.value) {
      return { success: false, message: '系统未初始化' };
    }
    const result = farmHire.value.hireWorker(villagerId);
    if (result.success) {
      const detail = getVillagerDetail(villagerId);
      addNotification(`👷 雇佣${detail?.name || '村民'}成功！${result.message}`, 'success');
      saveGame();
    } else {
      addNotification(result.message, 'error');
    }
    return result;
  }

  function dismissWorker(villagerId: string): { success: boolean; message: string } {
    if (!farmHire.value) {
      return { success: false, message: '系统未初始化' };
    }
    const result = farmHire.value.dismissWorker(villagerId);
    if (result.success) {
      const detail = getVillagerDetail(villagerId);
      addNotification(`👷 已解雇${detail?.name || '村民'}`, 'info');
      saveGame();
    } else {
      addNotification(result.message, 'error');
    }
    return result;
  }

  function toggleWorkerTask(villagerId: string, taskType: FarmWorkerTaskType): { success: boolean; enabled: boolean } {
    if (!farmHire.value) {
      return { success: false, enabled: false };
    }
    const result = farmHire.value.toggleTask(villagerId, taskType);
    if (result.success) {
      saveGame();
    }
    return result;
  }

  function openAuctionModal() {
    showAuction.value = true;
  }

  function closeAuctionModal() {
    showAuction.value = false;
  }

  function toggleInsuranceModal() {
    showInsurance.value = !showInsurance.value;
  }

  function subscribeToInsurance(planId: InsurancePlanType): { success: boolean; message: string } {
    if (!cropInsurance.value || !mapGrid.value) {
      return { success: false, message: '系统未初始化' };
    }
    const currentDay = mapGrid.value.getDay();
    const result = cropInsurance.value.subscribeToPlan(planId, currentDay);
    if (result.success) {
      saveGame();
    }
    return result;
  }

  function cancelInsurance(): { success: boolean; message: string } {
    if (!cropInsurance.value) {
      return { success: false, message: '系统未初始化' };
    }
    const result = cropInsurance.value.cancelSubscription();
    if (result.success) {
      saveGame();
    }
    return result;
  }

  function toggleAuctionModal() {
    showAuction.value = !showAuction.value;
  }

  function startAuction(): { success: boolean; message: string; items?: AuctionItem[] } {
    if (!auction.value || !mapGrid.value) {
      return { success: false, message: '系统未初始化' };
    }
    const day = ((mapGrid.value.getDay() - 1) % 7) + 1;
    const result = auction.value.startAuction(day);
    if (result.success) {
      addNotification(`🎉 周末拍卖会开始了！共有${auction.value.getState().items.length}件稀有物品`, 'info');
      saveGame();
    }
    return result;
  }

  function placeBid(bidAmount: number): AuctionBidResult {
    if (!auction.value) {
      return { success: false, message: '系统未初始化' };
    }
    const result = auction.value.placeBid(bidAmount);
    if (result.success) {
      saveGame();
    }
    return result;
  }

  function placeQuickBid(): AuctionBidResult {
    if (!auction.value) {
      return { success: false, message: '系统未初始化' };
    }
    const result = auction.value.placeQuickBid();
    if (result.success) {
      saveGame();
    }
    return result;
  }

  function simulateAuctionNPBid(): { success: boolean; npcBid?: number; npcName?: string } {
    if (!auction.value) {
      return { success: false };
    }
    const success = auction.value.simulateNPCBid();
    if (success) {
      const currentItem = auction.value.getCurrentItem();
      const npcNames = ['老木匠', '神秘商人', '富家公子', '旅行收藏家', '古董商人'];
      const npcName = npcNames[Math.floor(Math.random() * npcNames.length)];
      addNotification(`📢 ${npcName}出价 ${currentItem?.currentBid || 0} 金币！`, 'info');
      saveGame();
      return { success: true, npcBid: currentItem?.currentBid, npcName };
    }
    return { success: false };
  }

  function settleAuctionCurrentItem(): AuctionSettleResult | null {
    if (!auction.value) return null;
    const result = auction.value.settleCurrentItem();
    if (result) {
      const repChange = result.reputationImpact || 0;
      const repText = repChange > 0 ? `⭐ 声望 +${repChange}` : repChange < 0 ? `💔 声望 ${repChange}` : '';
      
      if (result.won) {
        const parts = [`🎉 恭喜！你以${result.finalPrice}金币拍得【${result.item.name}】`];
        if (repText) parts.push(repText);
        if (result.rewards?.coins) parts.push(`💰 额外 +${result.rewards.coins}金币`);
        addNotification(parts.join(' | '), 'success');
      } else {
        const parts = [`😔 【${result.item.name}】被别人拍走了，成交价${result.finalPrice}金币`];
        if (repText) parts.push(repText);
        addNotification(parts.join(' | '), 'info');
      }
      saveGame();
    }
    return result;
  }

  function nextAuctionItem(): boolean {
    if (!auction.value) return false;
    const result = auction.value.nextItem();
    saveGame();
    return result;
  }

  function endAuction() {
    if (!auction.value) return;
    auction.value.endAuction();
    addNotification('拍卖会结束了，感谢参与！', 'info');
    saveGame();
  }

  function getAuctionState() {
    return auction.value?.getState() ?? null;
  }

  function getCurrentAuctionItem() {
    return auction.value?.getCurrentItem() ?? null;
  }

  function getEconomicIndex() {
    return auction.value?.getEconomicBalanceFactor() ?? 1.0;
  }

  function getAuctionHistory() {
    return auction.value?.getWonItems() ?? [];
  }

  function checkAndUpdateAuction() {
    if (!auction.value || !mapGrid.value) return;
    const dayOfWeek = ((mapGrid.value.getDay() - 1) % 7) + 1;
    auction.value.checkAndUpdateAuction(dayOfWeek);
    saveGame();
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
    currentWeatherSeverity,
    weatherForecast,
    weatherForecastSeverities,
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
    skillTree,
    skillTreeState,
    skillTreeLevel,
    skillTreeExperience,
    skillTreeTotalExperience,
    skillPoints,
    skillExperienceProgress,
    skillEffectBonus,
    skillNodesUnlocked,
    skillTotalLevels,
    showSkillTree,
    achievementProgress,
    unlockedAchievementCount,
    totalAchievementCount,
    codexEntries,
    discoveredCodexCount,
    totalCodexCount,
    codexCompletionPercentage,
    villagerRelations,
    showVillagers,
    allVillagersInfo,
    totalAffinity,
    highestAffinityStage,
    storylinesCompletedCount,
    exclusiveOrdersCompletedCount,
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
    openSkillTreeModal,
    closeSkillTreeModal,
    unlockSkillNode,
    canUnlockSkillNode,
    getSkillNodeLevel,
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
    getQualityStars,
    showMiningModal,
    currentMineSession,
    openMiningModal,
    closeMiningModal,
    startMineExploration,
    getCurrentMineFloor,
    moveInMine,
    mineTile,
    buyMineStaminaPotion,
    exitMine,
    endMineExploration,
    setLevelUpModalRef,
    setExpFloatTextRef,
    showExpFloatAtScreen,
    setNextExpPosition,
    activeWeatherWarning,
    dismissWeatherWarning,
    pets,
    activePet,
    petCount,
    totalPetCount,
    petBonuses,
    showPetPanel,
    adoptPet,
    releasePet,
    setActivePet,
    petAnimal,
    feedPet,
    renamePet,
    openVillagersPanel,
    closeVillagersPanel,
    toggleVillagersPanel,
    getVillagerInfo,
    getCurrentDialogue,
    advanceVillagerDialogue,
    giveGiftToVillager,
    resetVillagerDialogue,
    showHireWorker,
    farmHire,
    farmHireState,
    farmHireMaxSlots,
    farmHireUsedSlots,
    farmHireAvailableSlots,
    farmHireTotalDailyWage,
    farmHireActiveSlots,
    openHireWorkerPanel,
    closeHireWorkerPanel,
    hireWorker,
    dismissWorker,
    toggleWorkerTask,
    auction,
    showAuction,
    openAuctionModal,
    closeAuctionModal,
    toggleAuctionModal,
    startAuction,
    placeBid,
    placeQuickBid,
    simulateAuctionNPBid,
    settleAuctionCurrentItem,
    nextAuctionItem,
    endAuction,
    getAuctionState,
    getCurrentAuctionItem,
    getEconomicIndex,
    getAuctionHistory,
    checkAndUpdateAuction,
    cropInsurance,
    showInsurance,
    insuranceState,
    isInsured,
    activeInsurancePlan,
    insuranceStats,
    toggleInsuranceModal,
    subscribeToInsurance,
    cancelInsurance,
    festivalGift,
    festivalGiftState,
    isFestivalActive,
    currentFestivalInfo,
    currentFestival,
    giveFestivalGiftToVillager,
    advanceFestivalDialogue,
    getCurrentFestivalDialogue,
    checkFestivalStart
  };
});
