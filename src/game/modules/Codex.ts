import type { CodexEntry, CodexCategory, Rarity } from '../types/game';
import { CODEX_ENTRIES, getCodexEntryById } from '../data/codex';

export interface DiscoveryResult {
  entry: CodexEntry;
  isNew: boolean;
  count: number;
}

export class CodexSystem {
  private entries: Record<string, CodexEntry> = {};
  private discoveredCount: number = 0;
  private totalCount: number = 0;
  private listeners: Array<(result: DiscoveryResult) => void> = [];

  constructor(savedEntries?: Record<string, CodexEntry>) {
    this.initializeEntries(savedEntries);
  }

  private initializeEntries(savedEntries?: Record<string, CodexEntry>) {
    this.entries = {};
    this.discoveredCount = 0;

    for (const entry of CODEX_ENTRIES) {
      if (savedEntries && savedEntries[entry.id]) {
        const saved = savedEntries[entry.id];
        this.entries[entry.id] = { ...saved };
        if (saved.discovered) {
          this.discoveredCount++;
        }
      } else {
        this.entries[entry.id] = { ...entry };
      }
    }

    this.totalCount = CODEX_ENTRIES.length;
  }

  subscribe(callback: (result: DiscoveryResult) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(result: DiscoveryResult) {
    for (const listener of this.listeners) {
      listener(result);
    }
  }

  getEntry(entryId: string): CodexEntry | undefined {
    return this.entries[entryId];
  }

  getAllEntries(): CodexEntry[] {
    return Object.values(this.entries);
  }

  getDiscoveredCount(): number {
    return this.discoveredCount;
  }

  getTotalCount(): number {
    return this.totalCount;
  }

  getCompletionPercentage(): number {
    if (this.totalCount === 0) return 0;
    return (this.discoveredCount / this.totalCount) * 100;
  }

  getEntriesByCategory(category: CodexCategory): CodexEntry[] {
    return Object.values(this.entries).filter(e => e.category === category);
  }

  getDiscoveredEntriesByCategory(category: CodexCategory): CodexEntry[] {
    return Object.values(this.entries).filter(e => e.category === category && e.discovered);
  }

  getCategoryCompletion(category: CodexCategory): number {
    const categoryEntries = this.getEntriesByCategory(category);
    if (categoryEntries.length === 0) return 0;
    const discovered = categoryEntries.filter(e => e.discovered).length;
    return (discovered / categoryEntries.length) * 100;
  }

  discoverEntry(entryId: string, count: number = 1): DiscoveryResult | null {
    const entry = this.entries[entryId];
    if (!entry) return null;

    const isNew = !entry.discovered;

    entry.discovered = true;
    entry.count += count;
    
    if (isNew) {
      entry.discoveredAt = Date.now();
      this.discoveredCount++;
    }

    const result: DiscoveryResult = {
      entry: { ...entry },
      isNew,
      count: entry.count
    };

    this.notify(result);
    return result;
  }

  discoverByType(category: CodexCategory, itemId: string, count: number = 1): DiscoveryResult | null {
    const prefixMap: Record<CodexCategory, string> = {
      crop: 'crop_',
      animal: 'animal_',
      item: 'item_',
      building: 'building_',
      villager: 'villager_',
      fish: 'fish_',
      artifact: 'artifact_'
    };

    const entryId = `${prefixMap[category]}${itemId}`;
    return this.discoverEntry(entryId, count);
  }

  discoverCrop(cropId: string, count: number = 1): DiscoveryResult | null {
    return this.discoverByType('crop', cropId, count);
  }

  discoverAnimal(animalId: string, count: number = 1): DiscoveryResult | null {
    return this.discoverByType('animal', animalId, count);
  }

  discoverItem(itemId: string, count: number = 1): DiscoveryResult | null {
    return this.discoverByType('item', itemId, count);
  }

  discoverBuilding(buildingId: string): DiscoveryResult | null {
    return this.discoverByType('building', buildingId, 1);
  }

  discoverVillager(villagerId: string): DiscoveryResult | null {
    return this.discoverByType('villager', villagerId, 1);
  }

  discoverFish(fishId: string, count: number = 1): DiscoveryResult | null {
    return this.discoverByType('fish', fishId, count);
  }

  discoverArtifact(artifactId: string): DiscoveryResult | null {
    return this.discoverByType('artifact', artifactId, 1);
  }

  isDiscovered(entryId: string): boolean {
    return this.entries[entryId]?.discovered ?? false;
  }

  getRarestDiscovered(): CodexEntry | null {
    const discovered = Object.values(this.entries).filter(e => e.discovered);
    if (discovered.length === 0) return null;

    const rarityOrder: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    return discovered.reduce((rarest, entry) => {
      const entryRarityIndex = rarityOrder.indexOf(entry.rarity);
      const rarestIndex = rarityOrder.indexOf(rarest.rarity);
      return entryRarityIndex > rarestIndex ? entry : rarest;
    });
  }

  getMostCollected(): CodexEntry | null {
    const discovered = Object.values(this.entries).filter(e => e.discovered && e.count > 0);
    if (discovered.length === 0) return null;

    return discovered.reduce((most, entry) => 
      entry.count > most.count ? entry : most
    );
  }

  getRecentDiscoveries(limit: number = 5): CodexEntry[] {
    return Object.values(this.entries)
      .filter(e => e.discovered && e.discoveredAt)
      .sort((a, b) => (b.discoveredAt || 0) - (a.discoveredAt || 0))
      .slice(0, limit);
  }
}
