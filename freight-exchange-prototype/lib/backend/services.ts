/**
 * Backend Business Logic Services
 * Contains all processing logic separated from frontend
 */

import { Load, Recommendation, Negotiation, Trip } from '@/types';
import { BackendDataStore } from './data-store';
import { simulateNegotiation } from '@/lib/negotiation';

const dataStore = BackendDataStore.getInstance();

export class LoadService {
  async createLoad(loadData: Omit<Load, 'id' | 'createdAt' | 'status'>): Promise<Load> {
    const load: Load = {
      ...loadData,
      id: `load_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'listed',
      createdBy: 'load-owner',
    };
    return dataStore.createLoad(load);
  }

  async updateLoadStatus(id: string, status: Load['status']): Promise<Load | null> {
    return dataStore.updateLoad(id, { status });
  }
}

export class RecommendationService {
  async createRecommendation(
    loadId: string,
    recommendationData: Omit<Recommendation, 'id' | 'loadId' | 'status'>,
    loadSnapshot?: Load
  ): Promise<Recommendation> {
    let load = await dataStore.getLoad(loadId);
    if (!load && loadSnapshot) {
      await dataStore.createLoad(loadSnapshot);
      load = await dataStore.getLoad(loadId);
    }
    if (!load) {
      throw new Error('Load not found');
    }

    const recommendation: Recommendation = {
      ...recommendationData,
      id: `rec_${Date.now()}`,
      loadId,
      status: 'pending',
    };
    return dataStore.createRecommendation(recommendation);
  }

  async matchLoadToFleet(loadId: string): Promise<Recommendation> {
    const load = await dataStore.getLoad(loadId);
    if (!load) {
      throw new Error('Load not found');
    }

    // Simulate AI matching logic
    const distance = Math.round(Math.random() * 500 + 200);
    const recommendation: Recommendation = {
      id: `rec_${Date.now()}`,
      loadId: load.id,
      origin: load.origin,
      destination: load.destination,
      loadType: load.loadType,
      distanceKm: distance,
      detourKm: Math.round(distance * 0.1),
      feasibility: 0.91,
      priceSuggested: load.priceRange ? (load.priceRange.min + load.priceRange.max) / 2 : 45000,
      complianceFlags: [],
      etaHours: Math.round(distance / 60),
      status: 'pending',
    };

    await dataStore.createRecommendation(recommendation);
    await dataStore.updateLoad(loadId, {
      status: 'matched',
      recommendationId: recommendation.id,
    });

    return recommendation;
  }
}

export class NegotiationService {
  async createNegotiation(
    recommendationId: string,
    buyerAgent: Negotiation['buyerAgent'],
    sellerAgent: Negotiation['sellerAgent']
  ): Promise<Negotiation> {
    const recommendation = await dataStore.getRecommendation(recommendationId);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    const negotiation: Negotiation = {
      id: `neg_${Date.now()}`,
      recommendationId,
      buyerAgent,
      sellerAgent,
      offers: [],
      status: 'active',
      currentRound: 0,
    };

    await dataStore.createNegotiation(negotiation);
    
    // Update load status
    const load = await dataStore.getLoad(recommendation.loadId);
    if (load) {
      await dataStore.updateLoad(load.id, {
        status: 'negotiating',
        negotiationId: negotiation.id,
      });
    }

    return negotiation;
  }

  async startNegotiation(negotiationId: string): Promise<Negotiation> {
    const negotiation = await dataStore.getNegotiation(negotiationId);
    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    // Ensure agents have concessionRate for negotiation simulation
    const buyerAgentWithConcession = {
      ...negotiation.buyerAgent,
      concessionRate: negotiation.buyerAgent.concessionRate || 2,
    };
    const sellerAgentWithConcession = {
      ...negotiation.sellerAgent,
      concessionRate: negotiation.sellerAgent.concessionRate || 2,
    };
    
    const offers = simulateNegotiation(
      buyerAgentWithConcession as any,
      sellerAgentWithConcession as any,
      negotiation.buyerAgent.minPrice,
      negotiation.sellerAgent.maxPrice
    );

    const finalOffer = offers[offers.length - 1];
    const secondLastOffer = offers[offers.length - 2] || finalOffer;
    const finalizedPrice = Math.round((secondLastOffer.price + finalOffer.price) / 2);

    const updatedNegotiation: Negotiation = {
      ...negotiation,
      offers,
      status: 'converged',
      currentRound: finalOffer.round,
      finalizedPrice,
    };

    await dataStore.updateNegotiation(negotiationId, updatedNegotiation);

    // Update load with finalized price
    const recommendation = await dataStore.getRecommendation(negotiation.recommendationId);
    if (recommendation) {
      const load = await dataStore.getLoad(recommendation.loadId);
      if (load) {
        await dataStore.updateLoad(load.id, {
          status: 'approved',
          finalizedPrice,
        });
      }
    }

    return updatedNegotiation;
  }
}

export class TripService {
  async createTrip(
    loadId: string,
    recommendationId: string,
    tripData: Omit<Trip, 'id' | 'loadId' | 'recommendationId' | 'status'>
  ): Promise<Trip> {
    const load = await dataStore.getLoad(loadId);
    if (!load) {
      throw new Error('Load not found');
    }

    const trip: Trip = {
      ...tripData,
      id: `trip_${Date.now()}`,
      loadId,
      recommendationId,
      origin: load.origin,
      destination: load.destination,
      status: 'assigned',
      payout: load.finalizedPrice || load.pricePredicted || 45000,
    };

    await dataStore.createTrip(trip);
    await dataStore.updateLoad(loadId, {
      status: 'dispatched',
    });

    return trip;
  }
}

export class AIService {
  async predictPrice(load: Partial<Load>): Promise<{ min: number; max: number; predicted: number }> {
    // Simulate AI price prediction
    const distance = Math.round(Math.random() * 500 + 200);
    const min = distance * 50;
    const max = distance * 60;
    const predicted = (min + max) / 2;

    return { min, max, predicted };
  }

  async discoverFleets(loadId: string): Promise<Recommendation[]> {
    const load = await dataStore.getLoad(loadId);
    if (!load) {
      throw new Error('Load not found');
    }

    // Simulate fleet discovery
    const distance = Math.round(Math.random() * 500 + 200);
    const recommendations: Recommendation[] = [
      {
        id: `rec_${Date.now()}`,
        loadId: load.id,
        origin: load.origin,
        destination: load.destination,
        loadType: load.loadType,
        distanceKm: distance,
        detourKm: Math.round(distance * 0.1),
        feasibility: 0.91,
        priceSuggested: load.priceRange ? (load.priceRange.min + load.priceRange.max) / 2 : 45000,
        complianceFlags: [],
        etaHours: Math.round(distance / 60),
        status: 'pending',
      },
    ];

    return recommendations;
  }
}

