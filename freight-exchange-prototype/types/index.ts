export type Role = 'load-owner' | 'fleet-manager' | 'driver';

export interface Load {
  id: string;
  origin: string;
  destination: string;
  loadType: string;
  weight: number;
  pickupTime: string;
  deliveryTime: string;
  equipment?: string;
  createdBy: 'load-owner';
  ownerId?: string;
  status: 'draft' | 'listed' | 'matched' | 'negotiating' | 'approved' | 'dispatched' | 'in-transit' | 'completed';
  pricePredicted?: number;
  priceRange?: { min: number; max: number };
  createdAt: string;
  matchedFleetId?: string;
  recommendationId?: string;
  negotiationId?: string;
  finalizedPrice?: number;
}

export interface Truck {
  id: string;
  capacity: number;
  currentLocation: string;
  idleHours: number;
  equipment?: string;
  driverId?: string;
}

export interface Recommendation {
  id: string;
  loadId: string;
  origin: string;
  destination: string;
  loadType: string;
  distanceKm: number;
  detourKm: number;
  feasibility: number;
  priceSuggested: number;
  complianceFlags: string[];
  etaHours: number;
  routeSummary?: string;
  truckId?: string;
  fleetId?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface NegotiationOffer {
  id: string;
  agentId: string;
  agentName: string;
  price: number;
  reasoning: string[];
  timestamp: Date;
  round: number;
}

export interface Negotiation {
  id: string;
  recommendationId: string;
  buyerAgent: { id: string; name: string; minPrice: number; maxPrice: number; concessionRate?: number };
  sellerAgent: { id: string; name: string; minPrice: number; maxPrice: number; concessionRate?: number };
  offers: NegotiationOffer[];
  status: 'active' | 'converged' | 'failed' | 'escalated';
  currentRound: number;
  finalizedPrice?: number;
}

export interface KPI {
  emptyMileRatio: number;
  utilization: number;
  co2Saved: number;
  avgRevenuePerTonKm: number;
}

export interface Trip {
  id: string;
  loadId: string;
  recommendationId: string;
  driverId: string;
  driverName: string;
  origin: string;
  destination: string;
  status: 'assigned' | 'started' | 'in-transit' | 'completed';
  startTime?: string | null;
  endTime?: string | null;
  payout: number;
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  id: string;
  location: string;
  eta: string;
  status: 'pending' | 'arrived' | 'departed';
}

export interface Contract {
  id: string;
  tripId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  status: 'draft' | 'signed' | 'executed';
  escrowEnabled: boolean;
  createdAt: string;
}

