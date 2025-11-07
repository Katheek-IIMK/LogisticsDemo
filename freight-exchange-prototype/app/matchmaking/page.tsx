'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { Handshake, MapPin, Package, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import recommendationsData from '@/mockData/recommendations.json';
import { MapSnapshot } from '@/components/MapSnapshot';
import type { Recommendation } from '@/types';

export default function MatchmakingPage() {
  const router = useRouter();
  const storeRecommendations = useAppStore((state) => state.recommendations);
  const loads = useAppStore((state) => state.loads);
  const addRecommendation = useAppStore((state) => state.addRecommendation);
  const addNegotiation = useAppStore((state) => state.addNegotiation);
  const updateLoad = useAppStore((state) => state.updateLoad);
  const syncRecommendations = useAppStore((state) => state.syncRecommendations);
  const syncLoads = useAppStore((state) => state.syncLoads);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use store recommendations if available, otherwise use mock data
  const recommendations = storeRecommendations.length > 0 
    ? storeRecommendations 
    : recommendationsData.recommendations;

  useEffect(() => {
    // Sync data from backend on mount
    const syncData = async () => {
      try {
        await Promise.all([syncRecommendations(), syncLoads()]);
      } catch (err) {
        console.error('Failed to sync data:', err);
      }
    };
    syncData();
  }, [syncRecommendations, syncLoads]);

  const handleNegotiate = async (rec: typeof recommendations[0]) => {
    setLoading(true);
    setError(null);
    try {
      const negotiation = await addNegotiation({
        recommendationId: rec.id,
        buyerAgent: {
          id: 'buyer_001',
          name: 'Load Owner Agent',
          minPrice: Math.round(rec.priceSuggested * 0.8),
          maxPrice: Math.round(rec.priceSuggested * 1.1),
          concessionRate: 2,
        },
        sellerAgent: {
          id: 'seller_001',
          name: 'Fleet Manager Agent',
          minPrice: Math.round(rec.priceSuggested * 0.9),
          maxPrice: Math.round(rec.priceSuggested * 1.2),
          concessionRate: 2,
        },
        offers: [],
        status: 'active',
        currentRound: 0,
      });
      
      // Update load status if it has a loadId
      if ('loadId' in rec && rec.loadId) {
        await updateLoad(rec.loadId, {
          status: 'negotiating',
          negotiationId: negotiation.id,
        });
      }
      
      router.push(`/negotiation?id=${negotiation.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create negotiation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (rec: typeof recommendations[0]) => {
    setLoading(true);
    setError(null);
    try {
      const associatedLoad =
        'loadId' in rec && rec.loadId
          ? loads.find((load) => load.id === rec.loadId) || null
          : loads.find((load) =>
              load.origin === rec.origin && load.destination === rec.destination
            ) || (loads.length > 0 ? loads[0] : null);

      if (!associatedLoad) {
        throw new Error('No available load to attach this recommendation to. Create a load first.');
      }

      const status: Recommendation['status'] =
        'status' in rec ? (rec.status as Recommendation['status']) : 'pending';

      const payload: Omit<Recommendation, 'id'> = {
        loadId: 'loadId' in rec && rec.loadId ? rec.loadId : associatedLoad.id,
        origin: rec.origin,
        destination: rec.destination,
        loadType: rec.loadType,
        distanceKm: rec.distanceKm,
        detourKm: rec.detourKm,
        feasibility: rec.feasibility,
        priceSuggested: rec.priceSuggested,
        complianceFlags: rec.complianceFlags,
        etaHours: rec.etaHours,
        status,
        routeSummary: 'routeSummary' in rec ? rec.routeSummary : undefined,
        truckId: 'truckId' in rec ? rec.truckId : undefined,
      };

      const created = await addRecommendation(payload);

      await updateLoad(payload.loadId, {
        status: 'matched',
        recommendationId: created.id,
      });

      alert('Recommendation assigned successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to assign recommendation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">AI Matchmaking</h1>
      <p className="text-muted-foreground mb-8">
        AI-powered recommendations for optimal route matching
      </p>
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="hover:shadow-lg transition-shadow relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {rec.loadType}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {rec.routeSummary || `${rec.origin} → ${rec.destination}`}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">₹{rec.priceSuggested.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    Feasibility: {(rec.feasibility * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Route:</span>
                  <span>{rec.origin} → {rec.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Distance:</span>
                  <span>{rec.distanceKm} km ({rec.detourKm} km detour)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">ETA:</span>
                  <span>{rec.etaHours} hours</span>
                </div>
                {rec.complianceFlags.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-destructive">Compliance:</span>
                    <span className="text-destructive">
                      {rec.complianceFlags.join(', ')}
                    </span>
                  </div>
                )}
              </div>
              <MapSnapshot
                origin={rec.origin}
                destination={rec.destination}
                distanceKm={rec.distanceKm}
                detourKm={rec.detourKm}
              />
              <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleNegotiate(rec)}
                      disabled={loading}
                      className="flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                      <Handshake className="h-4 w-4" />
                      {loading ? 'Processing...' : 'Negotiate'}
                    </Button>
                <Button
                  onClick={() => handleAssign(rec)}
                  className="flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  Assign
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

