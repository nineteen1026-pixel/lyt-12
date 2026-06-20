import { openDB, IDBPDatabase } from 'idb';
import { DB_CONFIG, STORE_CONFIGS, INITIAL_GAME_STATE, INITIAL_REPUTATION, type DBStores } from './schema';
import type { GameState, Plot, Animal, Pet, InventoryItem, Order, Building, GameStats, AchievementProgress, CodexEntry, SkillTreeState, VillagerRelationsState, FarmHireState, AuctionState, InsuranceState, FestivalGiftState } from '../types/game';
import { GRID_WIDTH, GRID_HEIGHT, INITIAL_UNLOCKED } from '../types/game';
import { INITIAL_STATS } from '../modules/Statistics';
import { INITIAL_SKILL_TREE_STATE } from '../modules/SkillTree';
import { ACHIEVEMENTS } from '../data/achievements';
import { CODEX_ENTRIES } from '../data/codex';
import { createInitialVillagerRelations } from '../data/villagers';
import { createInitialFarmHireState } from '../modules/FarmHire';
import { createInitialAuctionState } from '../data/auction';
import { createInitialFestivalGiftState } from '../modules/FestivalGift';

class GameDatabase {
  private db: IDBPDatabase<DBStores> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<DBStores>(DB_CONFIG.name, DB_CONFIG.version, {
      upgrade: (db, oldVersion) => {
        STORE_CONFIGS.forEach(config => {
          if (!db.objectStoreNames.contains(config.name as any)) {
            const store = db.createObjectStore(config.name as any, {
              keyPath: config.keyPath as string | string[]
            });
            if ((config as any).indexes) {
              (config as any).indexes.forEach((idx: any) => {
                store.createIndex(idx.name, idx.keyPath, { unique: false });
              });
            }
          } else if (oldVersion < 2 && config.name === 'orders') {
            const tx = db.transaction(config.name as any, 'readonly');
            const store = tx.objectStore(config.name as any);
            if ((config as any).indexes) {
              (config as any).indexes.forEach((idx: any) => {
                if (!store.indexNames.contains(idx.name)) {
                }
              });
            }
          }
        });
      }
    });
  }

  private ensureDB(): IDBPDatabase<DBStores> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async saveGameState(state: GameState): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(state));
    clone.lastSaveTime = Date.now();
    await db.put('gameState', clone);
  }

  async getGameState(): Promise<GameState | undefined> {
    const db = this.ensureDB();
    return await db.get('gameState', 'main');
  }

  async savePlot(plot: Plot): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(plot));
    await db.put('plots', clone);
  }

  async saveAllPlots(plots: Plot[]): Promise<void> {
    const db = this.ensureDB();
    const clones = JSON.parse(JSON.stringify(plots));
    const tx = db.transaction('plots', 'readwrite');
    await Promise.all([
      ...clones.map((plot: Plot) => tx.store.put(plot)),
      tx.done
    ]);
  }

  async getAllPlots(): Promise<Plot[]> {
    const db = this.ensureDB();
    return await db.getAll('plots');
  }

  async saveAnimal(animal: Animal): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(animal));
    await db.put('animals', clone);
  }

  async saveAllAnimals(animals: Animal[]): Promise<void> {
    const db = this.ensureDB();
    const clones = JSON.parse(JSON.stringify(animals));
    const tx = db.transaction('animals', 'readwrite');
    await Promise.all([
      ...clones.map((animal: Animal) => tx.store.put(animal)),
      tx.done
    ]);
  }

  async getAllAnimals(): Promise<Animal[]> {
    const db = this.ensureDB();
    return await db.getAll('animals');
  }

  async savePet(pet: Pet): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(pet));
    await db.put('pets', clone);
  }

  async saveAllPets(pets: Pet[]): Promise<void> {
    const db = this.ensureDB();
    const clones = JSON.parse(JSON.stringify(pets));
    const tx = db.transaction('pets', 'readwrite');
    await Promise.all([
      ...clones.map((pet: Pet) => tx.store.put(pet)),
      tx.done
    ]);
  }

  async getAllPets(): Promise<Pet[]> {
    const db = this.ensureDB();
    try {
      return await db.getAll('pets');
    } catch (e) {
      return [];
    }
  }

  async deletePet(petId: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('pets', petId);
  }

  async saveInventoryItem(item: InventoryItem): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(item));
    clone.dbKey = clone.quality ? `${clone.itemId}_q${clone.quality}` : clone.itemId;
    if (clone.quantity <= 0) {
      await db.delete('inventory', clone.dbKey);
    } else {
      await db.put('inventory', clone);
    }
  }

  async saveAllInventory(items: InventoryItem[]): Promise<void> {
    const db = this.ensureDB();
    const clones = JSON.parse(JSON.stringify(items));
    for (const item of clones) {
      item.dbKey = item.quality ? `${item.itemId}_q${item.quality}` : item.itemId;
    }
    const tx = db.transaction('inventory', 'readwrite');
    await Promise.all([
      ...clones.map((item: InventoryItem) => 
        item.quantity <= 0 ? tx.store.delete(item.dbKey!) : tx.store.put(item)
      ),
      tx.done
    ]);
  }

  async getAllInventory(): Promise<InventoryItem[]> {
    const db = this.ensureDB();
    return await db.getAll('inventory');
  }

  async saveOrder(order: Order): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(order));
    await db.put('orders', clone);
  }

  async saveAllOrders(orders: Order[]): Promise<void> {
    const db = this.ensureDB();
    const clones = JSON.parse(JSON.stringify(orders));
    const tx = db.transaction('orders', 'readwrite');
    await Promise.all([
      ...clones.map((order: Order) => tx.store.put(order)),
      tx.done
    ]);
  }

  async getAllOrders(): Promise<Order[]> {
    const db = this.ensureDB();
    return await db.getAll('orders');
  }

  async deleteOrder(orderId: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('orders', orderId);
  }

  async saveBuilding(building: Building): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(building));
    await db.put('buildings', clone);
  }

  async saveAllBuildings(buildings: Building[]): Promise<void> {
    const db = this.ensureDB();
    const clones = JSON.parse(JSON.stringify(buildings));
    const tx = db.transaction('buildings', 'readwrite');
    await Promise.all([
      ...clones.map((building: Building) => tx.store.put(building)),
      tx.done
    ]);
  }

  async getAllBuildings(): Promise<Building[]> {
    const db = this.ensureDB();
    try {
      return await db.getAll('buildings');
    } catch (e) {
      return [];
    }
  }

  async deleteBuilding(buildingId: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('buildings', buildingId);
  }

  async saveStats(stats: GameStats): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(stats));
    clone.id = 'main';
    await db.put('stats', clone);
  }

  async getStats(): Promise<GameStats | undefined> {
    const db = this.ensureDB();
    try {
      return await db.get('stats', 'main');
    } catch (e) {
      return undefined;
    }
  }

  async saveAllAchievements(achievements: AchievementProgress[]): Promise<void> {
    const db = this.ensureDB();
    const clones = JSON.parse(JSON.stringify(achievements));
    const tx = db.transaction('achievements', 'readwrite');
    await Promise.all([
      ...clones.map((a: AchievementProgress) => tx.store.put(a)),
      tx.done
    ]);
  }

  async getAllAchievements(): Promise<AchievementProgress[]> {
    const db = this.ensureDB();
    try {
      return await db.getAll('achievements');
    } catch (e) {
      return [];
    }
  }

  async saveAllCodexEntries(entries: CodexEntry[]): Promise<void> {
    const db = this.ensureDB();
    const clones = JSON.parse(JSON.stringify(entries));
    const tx = db.transaction('codex', 'readwrite');
    await Promise.all([
      ...clones.map((e: CodexEntry) => tx.store.put(e)),
      tx.done
    ]);
  }

  async getAllCodexEntries(): Promise<CodexEntry[]> {
    const db = this.ensureDB();
    try {
      return await db.getAll('codex');
    } catch (e) {
      return [];
    }
  }

  async saveSkillTree(skillTree: SkillTreeState): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(skillTree));
    await db.put('skillTree', clone);
  }

  async getSkillTree(): Promise<SkillTreeState | undefined> {
    const db = this.ensureDB();
    try {
      return await db.get('skillTree', 'main');
    } catch (e) {
      return undefined;
    }
  }

  async saveVillagerRelations(relations: VillagerRelationsState): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(relations));
    clone.id = 'main';
    await db.put('villagerRelations', clone);
  }

  async getVillagerRelations(): Promise<VillagerRelationsState | undefined> {
    const db = this.ensureDB();
    try {
      return await db.get('villagerRelations', 'main');
    } catch (e) {
      return undefined;
    }
  }

  async saveFarmHire(farmHire: FarmHireState): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(farmHire));
    clone.id = 'main';
    await db.put('farmHire', clone);
  }

  async getFarmHire(): Promise<FarmHireState | undefined> {
    const db = this.ensureDB();
    try {
      return await db.get('farmHire', 'main');
    } catch (e) {
      return undefined;
    }
  }

  async saveAuction(auction: AuctionState): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(auction));
    clone.id = 'main';
    await db.put('auction', clone);
  }

  async getAuction(): Promise<AuctionState | undefined> {
    const db = this.ensureDB();
    try {
      return await db.get('auction', 'main');
    } catch (e) {
      return undefined;
    }
  }

  async saveCropInsurance(insurance: InsuranceState): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(insurance));
    clone.id = 'main';
    await db.put('cropInsurance', clone);
  }

  async getCropInsurance(): Promise<InsuranceState | undefined> {
    const db = this.ensureDB();
    try {
      return await db.get('cropInsurance', 'main');
    } catch (e) {
      return undefined;
    }
  }

  async saveFestivalGift(festivalGift: FestivalGiftState): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(festivalGift));
    clone.id = 'main';
    await db.put('festivalGift', clone);
  }

  async getFestivalGift(): Promise<FestivalGiftState | undefined> {
    const db = this.ensureDB();
    try {
      return await db.get('festivalGift', 'main');
    } catch (e) {
      return undefined;
    }
  }

  async initializeNewGame(): Promise<{
    state: GameState;
    plots: Plot[];
    animals: Animal[];
    pets: Pet[];
    inventory: InventoryItem[];
    orders: Order[];
    buildings: Building[];
    stats: GameStats;
    achievements: AchievementProgress[];
    codex: CodexEntry[];
    skillTree: SkillTreeState;
    villagerRelations: VillagerRelationsState;
    farmHire: FarmHireState;
    auction: AuctionState;
    cropInsurance: InsuranceState;
    festivalGift: FestivalGiftState;
  }> {
    const now = Date.now();
    const state: GameState = {
      ...INITIAL_GAME_STATE,
      lastSaveTime: now,
      lastSeasonAdvance: now,
      weather: {
        current: 'sunny',
        currentSeverity: 'normal',
        forecast: [],
        forecastSeverities: [],
        lastWeatherChange: now,
        lastDayWeather: now,
        lastIssuedWarningTargetDay: undefined
      }
    };

    const plots: Plot[] = [];
    const centerX = Math.floor(GRID_WIDTH / 2);
    const centerY = Math.floor(GRID_HEIGHT / 2);
    const unlockedSet = new Set<string>();
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        unlockedSet.add(`${centerX + dx},${centerY + dy}`);
      }
    }

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        plots.push({
          x,
          y,
          state: 'empty',
          unlocked: unlockedSet.has(`${x},${y}`)
        });
      }
    }

    state.reputation = { ...INITIAL_REPUTATION };
    state.lastOrderRefreshDay = 0;

    const animals: Animal[] = [];
    const pets: Pet[] = [];
    const inventory: InventoryItem[] = [
      { itemId: 'turnip_seed', quantity: 5 },
      { itemId: 'potato_seed', quantity: 3 }
    ];
    const orders: Order[] = [];
    const buildings: Building[] = [];
    
    const stats: GameStats = {
      ...INITIAL_STATS,
      id: 'main'
    } as GameStats;

    const achievements: AchievementProgress[] = ACHIEVEMENTS.map(a => ({
      achievementId: a.id,
      unlocked: false,
      progress: 0
    }));

    const codex: CodexEntry[] = CODEX_ENTRIES.map(e => ({ ...e }));
    const skillTree: SkillTreeState = { ...INITIAL_SKILL_TREE_STATE };
    const villagerRelations: VillagerRelationsState = createInitialVillagerRelations();
    const farmHire: FarmHireState = createInitialFarmHireState();
    const auction: AuctionState = createInitialAuctionState();
    const cropInsurance: InsuranceState = {
      id: 'main',
      activePlan: null,
      insuredSince: null,
      totalPremiumsPaid: 0,
      totalClaimsPaid: 0,
      claimsCount: 0,
      lastPremiumDay: 0,
      pendingClaim: null,
      claimHistory: []
    };
    const festivalGift: FestivalGiftState = createInitialFestivalGiftState();

    await this.saveGameState(state);
    await this.saveAllPlots(plots);
    await this.saveAllAnimals(animals);
    await this.saveAllPets(pets);
    await this.saveAllInventory(inventory);
    await this.saveAllOrders(orders);
    await this.saveAllBuildings(buildings);
    await this.saveStats(stats);
    await this.saveAllAchievements(achievements);
    await this.saveAllCodexEntries(codex);
    await this.saveSkillTree(skillTree);
    await this.saveVillagerRelations(villagerRelations);
    await this.saveFarmHire(farmHire);
    await this.saveAuction(auction);
    await this.saveCropInsurance(cropInsurance);
    await this.saveFestivalGift(festivalGift);

    return { state, plots, animals, pets, inventory, orders, buildings, stats, achievements, codex, skillTree, villagerRelations, farmHire, auction, cropInsurance, festivalGift };
  }

  async loadGame(): Promise<{
    state: GameState;
    plots: Plot[];
    animals: Animal[];
    pets: Pet[];
    inventory: InventoryItem[];
    orders: Order[];
    buildings: Building[];
    stats?: GameStats;
    achievements?: AchievementProgress[];
    codex?: CodexEntry[];
    skillTree?: SkillTreeState;
    villagerRelations?: VillagerRelationsState;
    farmHire?: FarmHireState;
    auction?: AuctionState;
    cropInsurance?: InsuranceState;
    festivalGift?: FestivalGiftState;
  } | null> {
    const state = await this.getGameState();
    if (!state) {
      return null;
    }

    if (!state.weather) {
      const now = Date.now();
      state.weather = {
        current: 'sunny',
        currentSeverity: 'normal',
        forecast: [],
        forecastSeverities: [],
        lastWeatherChange: now,
        lastDayWeather: now
      };
    } else {
      const wAny = state.weather as any;
      if (!wAny.currentSeverity) wAny.currentSeverity = 'normal';
      if (!wAny.forecastSeverities) wAny.forecastSeverities = [];
      if (wAny.lastIssuedWarningTargetDay === undefined) wAny.lastIssuedWarningTargetDay = undefined;
    }

    if (!state.reputation) {
      state.reputation = { ...INITIAL_REPUTATION };
    }

    if (state.lastOrderRefreshDay === undefined) {
      state.lastOrderRefreshDay = 0;
    }

    const plots = await this.getAllPlots();
    const animals = await this.getAllAnimals();
    const pets = await this.getAllPets();
    const inventory = await this.getAllInventory();
    let orders: Order[] = [];
    try {
      orders = await this.getAllOrders();
    } catch (e) {
      orders = [];
    }
    const buildings = await this.getAllBuildings();
    
    const stats = await this.getStats();
    const achievements = await this.getAllAchievements();
    const codex = await this.getAllCodexEntries();
    const skillTree = await this.getSkillTree();
    const villagerRelations = await this.getVillagerRelations();
    const farmHire = await this.getFarmHire();
    const auction = await this.getAuction();
    const cropInsurance = await this.getCropInsurance();
    const festivalGift = await this.getFestivalGift();

    return { state, plots, animals, pets, inventory, orders, buildings, stats, achievements, codex, skillTree, villagerRelations, farmHire, auction, cropInsurance, festivalGift };
  }

  async saveCompleteGame(
    state: GameState,
    plots: Plot[],
    animals: Animal[],
    pets: Pet[],
    inventory: InventoryItem[],
    orders: Order[],
    buildings: Building[],
    stats?: GameStats,
    achievements?: AchievementProgress[],
    codex?: CodexEntry[],
    skillTree?: SkillTreeState,
    villagerRelations?: VillagerRelationsState,
    farmHire?: FarmHireState,
    auction?: AuctionState,
    cropInsurance?: InsuranceState,
    festivalGift?: FestivalGiftState
  ): Promise<void> {
    await this.saveGameState(state);
    await this.saveAllPlots(plots);
    await this.saveAllAnimals(animals);
    await this.saveAllPets(pets);
    await this.saveAllInventory(inventory);
    await this.saveAllOrders(orders);
    await this.saveAllBuildings(buildings);
    
    if (stats) {
      await this.saveStats(stats);
    }
    if (achievements) {
      await this.saveAllAchievements(achievements);
    }
    if (codex) {
      await this.saveAllCodexEntries(codex);
    }
    if (skillTree) {
      await this.saveSkillTree(skillTree);
    }
    if (villagerRelations) {
      await this.saveVillagerRelations(villagerRelations);
    }
    if (farmHire) {
      await this.saveFarmHire(farmHire);
    }
    if (auction) {
      await this.saveAuction(auction);
    }
    if (cropInsurance) {
      await this.saveCropInsurance(cropInsurance);
    }
    if (festivalGift) {
      await this.saveFestivalGift(festivalGift);
    }
  }

  async clearAll(): Promise<void> {
    const db = this.ensureDB();
    const stores = STORE_CONFIGS.map(c => c.name);
    for (const store of stores) {
      await db.clear(store as any);
    }
  }
}

export const gameDB = new GameDatabase();
