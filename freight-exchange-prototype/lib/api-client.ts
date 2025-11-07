/**
 * Frontend API Client
 * Handles all HTTP requests to the backend API
 */

import { Load, Recommendation, Negotiation, Trip, KPI } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Loads API
  async createLoad(load: Omit<Load, 'id' | 'createdAt' | 'status'>): Promise<Load> {
    return this.request<Load>('/loads', {
      method: 'POST',
      body: JSON.stringify(load),
    });
  }

  async getLoads(): Promise<Load[]> {
    return this.request<Load[]>('/loads');
  }

  async getLoad(id: string): Promise<Load> {
    return this.request<Load>(`/loads/${id}`);
  }

  async updateLoad(id: string, updates: Partial<Load>): Promise<Load> {
    return this.request<Load>(`/loads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Recommendations API
  async createRecommendation(rec: Omit<Recommendation, 'id'> & { loadSnapshot?: Load }): Promise<Recommendation> {
    return this.request<Recommendation>('/recommendations', {
      method: 'POST',
      body: JSON.stringify(rec),
    });
  }

  async getRecommendations(): Promise<Recommendation[]> {
    return this.request<Recommendation[]>('/recommendations');
  }

  async getRecommendation(id: string): Promise<Recommendation> {
    return this.request<Recommendation>(`/recommendations/${id}`);
  }

  async updateRecommendation(id: string, updates: Partial<Recommendation>): Promise<Recommendation> {
    return this.request<Recommendation>(`/recommendations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Negotiations API
  async createNegotiation(
    neg: Omit<Negotiation, 'id'> & {
      recommendationSnapshot?: Recommendation;
      loadSnapshot?: Load;
      negotiationSnapshot?: Negotiation;
    }
  ): Promise<Negotiation> {
    return this.request<Negotiation>('/negotiations', {
      method: 'POST',
      body: JSON.stringify(neg),
    });
  }

  async getNegotiations(): Promise<Negotiation[]> {
    return this.request<Negotiation[]>('/negotiations');
  }

  async getNegotiation(id: string): Promise<Negotiation> {
    return this.request<Negotiation>(`/negotiations/${id}`);
  }

  async updateNegotiation(id: string, updates: Partial<Negotiation>): Promise<Negotiation> {
    return this.request<Negotiation>(`/negotiations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async startNegotiation(id: string): Promise<Negotiation> {
    return this.request<Negotiation>(`/negotiations/${id}/start`, {
      method: 'POST',
    });
  }

  // Trips API
  async createTrip(trip: Omit<Trip, 'id'>): Promise<Trip> {
    return this.request<Trip>('/trips', {
      method: 'POST',
      body: JSON.stringify(trip),
    });
  }

  async getTrips(): Promise<Trip[]> {
    return this.request<Trip[]>('/trips');
  }

  async getTrip(id: string): Promise<Trip> {
    return this.request<Trip>(`/trips/${id}`);
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    return this.request<Trip>(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // KPIs API
  async getKPIs(): Promise<KPI> {
    return this.request<KPI>('/kpis');
  }

  async updateKPIs(updates: Partial<KPI>): Promise<KPI> {
    return this.request<KPI>('/kpis', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Price Prediction API
  async predictPrice(origin: string, destination: string, loadType: string, weight: number): Promise<{ priceMin: number; priceMax: number }> {
    return this.request<{ priceMin: number; priceMax: number }>('/ai/predict-price', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, loadType, weight }),
    });
  }

  // Fleet Discovery API
  async discoverFleets(loadId: string): Promise<Recommendation[]> {
    return this.request<Recommendation[]>(`/ai/discover-fleets/${loadId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }
}

export const apiClient = new ApiClient();

