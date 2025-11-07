import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role, KPI, Recommendation, Negotiation, Trip, Load } from '@/types';
import { apiClient } from './api-client';

interface AppState {
  selectedRole: Role | null;
  kpis: KPI;
  loads: Load[];
  recommendations: Recommendation[];
  negotiations: Negotiation[];
  trips: Trip[];
  setRole: (role: Role) => void;
  updateKPIs: (kpis: Partial<KPI>) => Promise<void>;
  addLoad: (load: Omit<Load, 'id' | 'createdAt' | 'status'>) => Promise<Load>;
  updateLoad: (id: string, updates: Partial<Load>) => Promise<Load>;
  addRecommendation: (rec: Omit<Recommendation, 'id'> & { loadSnapshot?: Load }) => Promise<Recommendation>;
  updateRecommendation: (id: string, updates: Partial<Recommendation>) => Promise<Recommendation>;
  addNegotiation: (
    neg: Omit<Negotiation, 'id'> & {
      recommendationSnapshot?: Recommendation;
      loadSnapshot?: Load;
      negotiationSnapshot?: Negotiation;
    }
  ) => Promise<Negotiation>;
  updateNegotiation: (id: string, updates: Partial<Negotiation>) => Promise<Negotiation>;
  addTrip: (trip: Omit<Trip, 'id'>) => Promise<Trip>;
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<Trip>;
  syncLoads: () => Promise<void>;
  syncRecommendations: () => Promise<void>;
  syncNegotiations: () => Promise<void>;
  syncTrips: () => Promise<void>;
  syncKPIs: () => Promise<void>;
  syncAll: () => Promise<void>;
}

const initialKPIs: KPI = {
  emptyMileRatio: 0.35,
  utilization: 0.68,
  co2Saved: 1250,
  avgRevenuePerTonKm: 45,
};

// Load role from localStorage on initialization
const getInitialRole = (): Role | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('selectedRole');
    if (stored && (stored === 'load-owner' || stored === 'fleet-manager' || stored === 'driver')) {
      return stored as Role;
    }
  }
  return null;
};

const getPersistedLoads = (): Load[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem('freight-exchange-storage');
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    const loads = parsed?.state?.loads;
    return Array.isArray(loads) ? (loads as Load[]) : [];
  } catch (error) {
    console.warn('Failed to read persisted loads from storage:', error);
    return [];
  }
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedRole: getInitialRole(),
      kpis: initialKPIs,
      loads: getPersistedLoads(),
      recommendations: [],
      negotiations: [],
      trips: [],
      setRole: (role) => {
        set({ selectedRole: role });
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedRole', role);
        }
      },
      updateKPIs: async (kpis) => {
        try {
          const updated = await apiClient.updateKPIs(kpis);
          set({ kpis: updated });
        } catch (error) {
          console.error('Failed to update KPIs:', error);
          // Fallback to local update if API fails
          set((state) => ({
            kpis: { ...state.kpis, ...kpis },
          }));
        }
      },
      addLoad: async (load) => {
        try {
          const created = await apiClient.createLoad(load);
          set((state) => ({
            loads: [...state.loads, created],
          }));
          return created;
        } catch (error) {
          console.error('Failed to create load:', error);
          throw error;
        }
      },
      updateLoad: async (id, updates) => {
        try {
          const updated = await apiClient.updateLoad(id, updates);
          set((state) => ({
            loads: state.loads.map((l) =>
              l.id === id ? updated : l
            ),
          }));
          return updated;
        } catch (error) {
          console.error('Failed to update load:', error);
          throw error;
        }
      },
      addRecommendation: async (rec) => {
        try {
          const created = await apiClient.createRecommendation(rec);
          set((state) => ({
            recommendations: [...state.recommendations, created],
          }));
          return created;
        } catch (error) {
          console.error('Failed to create recommendation:', error);
          throw error;
        }
      },
      updateRecommendation: async (id, updates) => {
        try {
          const updated = await apiClient.updateRecommendation(id, updates);
          set((state) => ({
            recommendations: state.recommendations.map((r) =>
              r.id === id ? updated : r
            ),
          }));
          return updated;
        } catch (error) {
          console.error('Failed to update recommendation:', error);
          throw error;
        }
      },
      addNegotiation: async (neg) => {
        try {
          const created = await apiClient.createNegotiation(neg);
          set((state) => ({
            negotiations: [...state.negotiations, created],
          }));
          return created;
        } catch (error) {
          console.error('Failed to create negotiation:', error);
          throw error;
        }
      },
      updateNegotiation: async (id, updates) => {
        try {
          const updated = await apiClient.updateNegotiation(id, updates);
          set((state) => ({
            negotiations: state.negotiations.map((n) =>
              n.id === id ? updated : n
            ),
          }));
          return updated;
        } catch (error) {
          console.error('Failed to update negotiation:', error);
          throw error;
        }
      },
      addTrip: async (trip) => {
        try {
          const created = await apiClient.createTrip(trip);
          set((state) => ({
            trips: [...state.trips, created],
          }));
          return created;
        } catch (error) {
          console.error('Failed to create trip:', error);
          throw error;
        }
      },
      updateTrip: async (id, updates) => {
        try {
          const updated = await apiClient.updateTrip(id, updates);
          set((state) => ({
            trips: state.trips.map((t) =>
              t.id === id ? updated : t
            ),
          }));
          return updated;
        } catch (error) {
          console.error('Failed to update trip:', error);
          throw error;
        }
      },
      // New methods to sync with backend
      syncLoads: async () => {
        try {
          const loads = await apiClient.getLoads();
          if (loads.length === 0) {
            const fallbackLoads = getPersistedLoads();
            if (fallbackLoads.length > 0) {
              console.warn('Backend returned no loads; using locally persisted loads.');
              set({ loads: fallbackLoads });
              return;
            }
          }
          set({ loads });
        } catch (error) {
          console.error('Failed to sync loads:', error);
          const fallbackLoads = getPersistedLoads();
          if (fallbackLoads.length > 0) {
            set({ loads: fallbackLoads });
          }
        }
      },
      syncRecommendations: async () => {
        try {
          const recommendations = await apiClient.getRecommendations();
          set({ recommendations });
        } catch (error) {
          console.error('Failed to sync recommendations:', error);
        }
      },
      syncNegotiations: async () => {
        try {
          const negotiations = await apiClient.getNegotiations();
          if (negotiations.length === 0) {
            set((state) => {
              if (state.negotiations.length > 0) {
                console.warn('Backend returned no negotiations; keeping existing local negotiations.');
                return state;
              }
              return { negotiations: [] };
            });
            return;
          }
          set({ negotiations });
        } catch (error) {
          console.error('Failed to sync negotiations:', error);
        }
      },
      syncTrips: async () => {
        try {
          const trips = await apiClient.getTrips();
          set({ trips });
        } catch (error) {
          console.error('Failed to sync trips:', error);
        }
      },
      syncKPIs: async () => {
        try {
          const kpis = await apiClient.getKPIs();
          set({ kpis });
        } catch (error) {
          console.error('Failed to sync KPIs:', error);
        }
      },
      syncAll: async () => {
        const state = get();
        await Promise.all([
          state.syncLoads(),
          state.syncRecommendations(),
          state.syncNegotiations(),
          state.syncTrips(),
          state.syncKPIs(),
        ]);
      },
    }),
    {
      name: 'freight-exchange-storage',
      partialize: (state) => ({
        loads: state.loads,
        recommendations: state.recommendations,
        negotiations: state.negotiations,
        trips: state.trips,
        kpis: state.kpis,
      }),
    }
  )
);

