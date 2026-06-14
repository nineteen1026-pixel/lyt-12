import { openDB, IDBPDatabase } from 'idb';
import { DB_CONFIG, STORE_CONFIGS, INITIAL_GAME_STATE, INITIAL_REPUTATION, type DBStores } from './schema';
import type { GameState, Plot, Animal, InventoryItem, Order, Building } from '../types/game';
import { GRID_WIDTH, GRID_HEIGHT, INITIAL_UNLOCKED } from '../types/game';

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

  async saveInventoryItem(item: InventoryItem): Promise<void> {
    const db = this.ensureDB();
    const clone = JSON.parse(JSON.stringify(item));
    if (clone.quantity <= 0) {
      await db.delete('inventory', clone.itemId);
    } else {
      await db.put('inventory', clone);
    }
  }

  async saveAllInventory(items: InventoryItem[]): Promise<void> {
    const db = this.ensureDB();
    const clones = JSON.parse(JSON.stringify(items));
    const tx = db.transaction('inventory', 'readwrite');
    await Promise.all([
      ...clones.map((item: InventoryItem) => 
        item.quantity <= 0 ? tx.store.delete(item.itemId) : tx.store.put(item)
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

  async initializeNewGame(): Promise<{ state: GameState; plots: Plot[]; animals: Animal[]; inventory: InventoryItem[]; orders: Order[]; buildings: Building[] }> {
    const now = Date.now();
    const state: GameState = {
      ...INITIAL_GAME_STATE,
      lastSaveTime: now,
      lastSeasonAdvance: now,
      weather: {
        current: 'sunny',
        forecast: [],
        lastWeatherChange: now,
        lastDayWeather: now
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
    const inventory: InventoryItem[] = [
      { itemId: 'turnip_seed', quantity: 5 },
      { itemId: 'potato_seed', quantity: 3 }
    ];
    const orders: Order[] = [];
    const buildings: Building[] = [];

    await this.saveGameState(state);
    await this.saveAllPlots(plots);
    await this.saveAllAnimals(animals);
    await this.saveAllInventory(inventory);
    await this.saveAllOrders(orders);
    await this.saveAllBuildings(buildings);

    return { state, plots, animals, inventory, orders, buildings };
  }

  async loadGame(): Promise<{ state: GameState; plots: Plot[]; animals: Animal[]; inventory: InventoryItem[]; orders: Order[]; buildings: Building[] } | null> {
    const state = await this.getGameState();
    if (!state) {
      return null;
    }

    if (!state.weather) {
      const now = Date.now();
      state.weather = {
        current: 'sunny',
        forecast: [],
        lastWeatherChange: now,
        lastDayWeather: now
      };
    }

    if (!state.reputation) {
      state.reputation = { ...INITIAL_REPUTATION };
    }

    if (state.lastOrderRefreshDay === undefined) {
      state.lastOrderRefreshDay = 0;
    }

    const plots = await this.getAllPlots();
    const animals = await this.getAllAnimals();
    const inventory = await this.getAllInventory();
    let orders: Order[] = [];
    try {
      orders = await this.getAllOrders();
    } catch (e) {
      orders = [];
    }
    const buildings = await this.getAllBuildings();

    return { state, plots, animals, inventory, orders, buildings };
  }

  async saveCompleteGame(state: GameState, plots: Plot[], animals: Animal[], inventory: InventoryItem[], orders: Order[], buildings: Building[]): Promise<void> {
    await this.saveGameState(state);
    await this.saveAllPlots(plots);
    await this.saveAllAnimals(animals);
    await this.saveAllInventory(inventory);
    await this.saveAllOrders(orders);
    await this.saveAllBuildings(buildings);
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
