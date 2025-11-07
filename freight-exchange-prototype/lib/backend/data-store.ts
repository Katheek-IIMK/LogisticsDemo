/**
 * Backend Data Store
 * Handles data persistence and retrieval
 * In production, this would connect to a database
 */

import { Load, Recommendation, Negotiation, Trip, KPI } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';

const isReadOnlyEnvironment =
  process.env.NETLIFY === 'true' ||
  process.env.VERCEL === '1' ||
  process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

const READ_ONLY_ERROR_CODES = new Set(['EROFS', 'EACCES', 'EPERM']);

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface DataStore {
  loads: Load[];
  recommendations: Recommendation[];
  negotiations: Negotiation[];
  trips: Trip[];
  kpis: KPI;
}

const defaultStore: DataStore = {
  loads: [],
  recommendations: [],
  negotiations: [],
  trips: [],
  kpis: {
    emptyMileRatio: 0.35,
    utilization: 0.68,
    co2Saved: 1250,
    avgRevenuePerTonKm: 45,
  },
};

async function ensureDataDir(): Promise<void> {
  if (isReadOnlyEnvironment) {
    return;
  }
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist or be read-only
  }
}

async function loadStore(): Promise<DataStore> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist, return default
    return defaultStore;
  }
}

async function saveStore(store: DataStore): Promise<void> {
  if (isReadOnlyEnvironment) {
    // Skip persistence; lambda environments are often read-only
    return;
  }
  try {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (error: any) {
    if (READ_ONLY_ERROR_CODES.has(error?.code)) {
      console.warn('Filesystem is read-only. Disabling persistence for this session.');
      return;
    }
    console.error('Error saving store:', error);
    throw error;
  }
}

export class BackendDataStore {
  private static instance: BackendDataStore;
  private store: DataStore = defaultStore;
  private initialized = false;
  private persistenceDisabled = isReadOnlyEnvironment;

  private constructor() {}

  static getInstance(): BackendDataStore {
    if (!BackendDataStore.instance) {
      BackendDataStore.instance = new BackendDataStore();
    }
    return BackendDataStore.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.store = await loadStore();
    this.initialized = true;
  }

  private async persist(): Promise<void> {
    if (this.persistenceDisabled) {
      return;
    }
    try {
      await saveStore(this.store);
    } catch (error: any) {
      if (READ_ONLY_ERROR_CODES.has(error?.code) || isReadOnlyEnvironment) {
        console.warn('Disabling persistence due to read-only filesystem. Data will be stored in-memory only for this session.');
        this.persistenceDisabled = true;
        return;
      }
      throw error;
    }
  }

  // Loads
  async getLoads(): Promise<Load[]> {
    await this.initialize();
    return this.store.loads;
  }

  async getLoad(id: string): Promise<Load | null> {
    await this.initialize();
    return this.store.loads.find(l => l.id === id) || null;
  }

  async createLoad(load: Load): Promise<Load> {
    await this.initialize();
    this.store.loads.push(load);
    await this.persist();
    return load;
  }

  async updateLoad(id: string, updates: Partial<Load>): Promise<Load | null> {
    await this.initialize();
    const index = this.store.loads.findIndex(l => l.id === id);
    if (index === -1) return null;
    this.store.loads[index] = { ...this.store.loads[index], ...updates };
    await this.persist();
    return this.store.loads[index];
  }

  // Recommendations
  async getRecommendations(): Promise<Recommendation[]> {
    await this.initialize();
    return this.store.recommendations;
  }

  async getRecommendation(id: string): Promise<Recommendation | null> {
    await this.initialize();
    return this.store.recommendations.find(r => r.id === id) || null;
  }

  async createRecommendation(recommendation: Recommendation): Promise<Recommendation> {
    await this.initialize();
    this.store.recommendations.push(recommendation);
    await this.persist();
    return recommendation;
  }

  async updateRecommendation(id: string, updates: Partial<Recommendation>): Promise<Recommendation | null> {
    await this.initialize();
    const index = this.store.recommendations.findIndex(r => r.id === id);
    if (index === -1) return null;
    this.store.recommendations[index] = { ...this.store.recommendations[index], ...updates };
    await this.persist();
    return this.store.recommendations[index];
  }

  // Negotiations
  async getNegotiations(): Promise<Negotiation[]> {
    await this.initialize();
    return this.store.negotiations;
  }

  async getNegotiation(id: string): Promise<Negotiation | null> {
    await this.initialize();
    return this.store.negotiations.find(n => n.id === id) || null;
  }

  async createNegotiation(negotiation: Negotiation): Promise<Negotiation> {
    await this.initialize();
    this.store.negotiations.push(negotiation);
    await this.persist();
    return negotiation;
  }

  async updateNegotiation(id: string, updates: Partial<Negotiation>): Promise<Negotiation | null> {
    await this.initialize();
    const index = this.store.negotiations.findIndex(n => n.id === id);
    if (index === -1) return null;
    this.store.negotiations[index] = { ...this.store.negotiations[index], ...updates };
    await this.persist();
    return this.store.negotiations[index];
  }

  // Trips
  async getTrips(): Promise<Trip[]> {
    await this.initialize();
    return this.store.trips;
  }

  async getTrip(id: string): Promise<Trip | null> {
    await this.initialize();
    return this.store.trips.find(t => t.id === id) || null;
  }

  async createTrip(trip: Trip): Promise<Trip> {
    await this.initialize();
    this.store.trips.push(trip);
    await this.persist();
    return trip;
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | null> {
    await this.initialize();
    const index = this.store.trips.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.store.trips[index] = { ...this.store.trips[index], ...updates };
    await this.persist();
    return this.store.trips[index];
  }

  // KPIs
  async getKPIs(): Promise<KPI> {
    await this.initialize();
    return this.store.kpis;
  }

  async updateKPIs(updates: Partial<KPI>): Promise<KPI> {
    await this.initialize();
    this.store.kpis = { ...this.store.kpis, ...updates };
    await this.persist();
    return this.store.kpis;
  }
}

