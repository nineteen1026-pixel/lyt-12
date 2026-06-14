import { openDB, IDBPDatabase } from 'idb';
import { DB_CONFIG, STORE_CONFIGS, INITIAL_GAME_STATE, type DBStores } from './schema';
import type { GameState, Plot, Animal, InventoryItem } from '../types/game';
import { GRID_WIDTH, GRID_HEIGHT, INITIAL_UNLOCKED } from '../types/game';

class GameDatabase {
  private db: IDBPDatabase<DBStores> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<DBStores>(DB_CONFIG.name, DB_CONFIG.version, {
      upgrade: (db) => {
        STORE_CONFIGS.forEach(config => {
          if (!db.objectStoreNames.contains(config.name as any)) {
            db.createObjectStore(config.name, {
              keyPath: config.keyPath as string | string[]
            });
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
    state.lastSaveTime = Date.now();
    await db.put('gameState', state);
  }

  async getGameState(): Promise<GameState | undefined> {
    const db = this.ensureDB();
    return await db.get('gameState', 'main');
  }

  async savePlot(plot: Plot): Promise<void> {
    const db = this.ensureDB();
    await db.put('plots', plot);
  }

  async saveAllPlots(plots: Plot[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('plots', 'readwrite');
    await Promise.all([
      ...plots.map(plot => tx.store.put(plot)),
      tx.done
    ]);
  }

  async getAllPlots(): Promise<Plot[]> {
    const db = this.ensureDB();
    return await db.getAll('plots');
  }

  async saveAnimal(animal: Animal): Promise<void> {
    const db = this.ensureDB();
    await db.put('animals', animal);
  }

  async saveAllAnimals(animals: Animal[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('animals', 'readwrite');
    await Promise.all([
      ...animals.map(animal => tx.store.put(animal)),
      tx.done
    ]);
  }

  async getAllAnimals(): Promise<Animal[]> {
    const db = this.ensureDB();
    return await db.getAll('animals');
  }

  async saveInventoryItem(item: InventoryItem): Promise<void> {
    const db = this.ensureDB();
    if (item.quantity <= 0) {
      await db.delete('inventory', item.itemId);
    } else {
      await db.put('inventory', item);
    }
  }

  async saveAllInventory(items: InventoryItem[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('inventory', 'readwrite');
    await Promise.all([
      ...items.map(item => 
        item.quantity <= 0 ? tx.store.delete(item.itemId) : tx.store.put(item)
      ),
      tx.done
    ]);
  }

  async getAllInventory(): Promise<InventoryItem[]> {
    const db = this.ensureDB();
    return await db.getAll('inventory');
  }

  async initializeNewGame(): Promise<{ state: GameState; plots: Plot[]; animals: Animal[]; inventory: InventoryItem[] }> {
    const now = Date.now();
    const state: GameState = {
      ...INITIAL_GAME_STATE,
      lastSaveTime: now,
      lastSeasonAdvance: now
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

    const animals: Animal[] = [];
    const inventory: InventoryItem[] = [
      { itemId: 'turnip_seed', quantity: 5 },
      { itemId: 'potato_seed', quantity: 3 }
    ];

    await this.saveGameState(state);
    await this.saveAllPlots(plots);
    await this.saveAllAnimals(animals);
    await this.saveAllInventory(inventory);

    return { state, plots, animals, inventory };
  }

  async loadGame(): Promise<{ state: GameState; plots: Plot[]; animals: Animal[]; inventory: InventoryItem[] } | null> {
    const state = await this.getGameState();
    if (!state) {
      return null;
    }

    const plots = await this.getAllPlots();
    const animals = await this.getAllAnimals();
    const inventory = await this.getAllInventory();

    return { state, plots, animals, inventory };
  }

  async saveCompleteGame(state: GameState, plots: Plot[], animals: Animal[], inventory: InventoryItem[]): Promise<void> {
    await this.saveGameState(state);
    await this.saveAllPlots(plots);
    await this.saveAllAnimals(animals);
    await this.saveAllInventory(inventory);
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
