import { Load, Truck, Recommendation } from '@/types';
import loadsData from '@/mockData/loads.json';
import trucksData from '@/mockData/trucks.json';
import { synthesizeRoutes } from '@/lib/ai-simulation';

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getLoads(): Promise<Load[]> {
  await delay(500);
  return loadsData.loads as Load[];
}

export async function getTrucks(): Promise<Truck[]> {
  await delay(500);
  return trucksData.trucks as Truck[];
}

export async function getRecommendations(loadId?: string): Promise<Recommendation[]> {
  await delay(1000); // Simulate AI processing time
  const loads = await getLoads();
  const trucks = await getTrucks();
  
  if (loadId) {
    const load = loads.find((l) => l.id === loadId);
    if (load) {
      return synthesizeRoutes(load, trucks);
    }
  }
  
  // Return default recommendations
  return synthesizeRoutes(loads[0], trucks);
}

export async function getRecommendationById(id: string): Promise<Recommendation | null> {
  await delay(500);
  const recommendations = await getRecommendations();
  return recommendations.find((r) => r.id === id) || null;
}

