import { Load, Truck, Recommendation } from '@/types';

interface FeasibilityParams {
  capacityMatch: number;
  detourKm: number;
  idleHours: number;
  failedRules: number;
}

export function computeFeasibility({
  capacityMatch,
  detourKm,
  idleHours,
  failedRules,
}: FeasibilityParams): number {
  const maxDetour = 300;
  const capacityScore = capacityMatch; // 0..1
  const detourScore = 1 - Math.min(detourKm, maxDetour) / maxDetour;
  const idleScore = 1 - Math.min(idleHours, 24) / 24;
  const complianceScore = failedRules === 0 ? 1 : Math.max(0, 1 - failedRules * 0.25);
  const raw =
    0.4 * capacityScore +
    0.2 * detourScore +
    0.2 * idleScore +
    0.2 * complianceScore;
  return Math.max(0, Math.min(1, raw));
}

export function synthesizeRoutes(
  load: Load,
  nearbyTrucks: Truck[]
): Recommendation[] {
  const candidates: Recommendation[] = [];
  const maxDetour = 150;
  const minDetour = 50;

  for (const truck of nearbyTrucks) {
    // Check if equipment matches
    if (load.equipment && truck.equipment !== load.equipment) {
      continue;
    }

    // Calculate distance and detour
    const baseDistance = estimateDistance(load.origin, load.destination);
    const currentToOrigin = estimateDistance(truck.currentLocation, load.origin);
    const detourKm = currentToOrigin;
    const totalDistance = baseDistance + detourKm;

    if (detourKm < minDetour || detourKm > maxDetour) {
      continue;
    }

    // Check for milk-run opportunities
    const capacityMatch = Math.min(load.weight / truck.capacity, 1);
    const failedRules = checkCompliance(load, truck);
    const feasibility = computeFeasibility({
      capacityMatch,
      detourKm,
      idleHours: truck.idleHours,
      failedRules,
    });

    // Calculate price (base rate + detour cost)
    const basePrice = baseDistance * 50; // ₹50 per km
    const detourCost = detourKm * 30;
    const priceSuggested = basePrice + detourCost;

    // Generate route summary
    let routeSummary = `Direct route: ${load.origin}→${load.destination}`;
    if (detourKm > 0) {
      routeSummary = `Route with ${detourKm}km detour: ${truck.currentLocation}→${load.origin}→${load.destination}`;
    }

    // Check for milk-run (combine with nearby loads)
    const compatibleLoads = findCompatibleLoads(load, truck);
    if (compatibleLoads.length > 0) {
      const totalRevenue = priceSuggested + compatibleLoads.reduce((sum, l) => sum + estimateDistance(l.origin, l.destination) * 50, 0);
      routeSummary = `Milk-run: ${truck.currentLocation}→${load.origin}→${compatibleLoads.map(l => l.destination).join('→')} — combines ${load.loadType} + ${compatibleLoads.map(l => l.loadType).join(', ')}; est. revenue ₹${totalRevenue.toLocaleString()}`;
    }

    candidates.push({
      id: `rec_${Date.now()}_${truck.id}`,
      origin: load.origin,
      destination: load.destination,
      loadType: load.loadType,
      distanceKm: totalDistance,
      detourKm,
      feasibility,
      priceSuggested: Math.round(priceSuggested),
      complianceFlags: failedRules > 0 ? ['permitRequired'] : [],
      etaHours: Math.ceil(totalDistance / 60), // Assuming 60 km/h average
      routeSummary,
      truckId: truck.id,
    });
  }

  // Sort by feasibility and return top 3
  return candidates.sort((a, b) => b.feasibility - a.feasibility).slice(0, 3);
}

function estimateDistance(origin: string, destination: string): number {
  // Mock distance calculation (in real app, use Google Maps API or similar)
  const distances: Record<string, Record<string, number>> = {
    Pune: { Bangalore: 840, Satara: 120, Mumbai: 150 },
    Mumbai: { Delhi: 1400, Pune: 150 },
    Satara: { Bangalore: 720, Pune: 120 },
    Bangalore: { Pune: 840, Satara: 720 },
    Delhi: { Mumbai: 1400 },
  };
  return distances[origin]?.[destination] || 500;
}

function checkCompliance(load: Load, truck: Truck): number {
  // Mock compliance check
  let failedRules = 0;
  if (load.loadType.includes('Hazardous')) {
    failedRules += 1;
  }
  if (truck.capacity < load.weight) {
    failedRules += 1;
  }
  return failedRules;
}

function findCompatibleLoads(load: Load, truck: Truck): Load[] {
  // Mock function to find compatible loads for milk-run
  // In real implementation, query nearby loads
  return [];
}

export function generateListingText(formFields: {
  origin: string;
  destination: string;
  loadType: string;
  weight: number;
  pickupTime: string;
  deliveryTime: string;
}): string {
  const { origin, destination, loadType, weight, pickupTime, deliveryTime } = formFields;
  const pickupDate = new Date(pickupTime).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const deliveryDate = new Date(deliveryTime).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `Seeking transport for ${weight / 1000}T ${loadType} from ${origin} to ${destination}. Pickup required by ${pickupDate} with delivery deadline of ${deliveryDate}. Specialized equipment may be required. Competitive rates offered for reliable carriers.`;
}

