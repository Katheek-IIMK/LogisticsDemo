'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import { Package, DollarSign, Search, CheckCircle, TrendingUp, Handshake, Eye, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function LoadOwnerWorkspace() {
  const router = useSearchParams();
  const setRole = useAppStore((state) => state.setRole);
  const addLoad = useAppStore((state) => state.addLoad);
  const updateLoad = useAppStore((state) => state.updateLoad);
  const addRecommendation = useAppStore((state) => state.addRecommendation);
  const addNegotiation = useAppStore((state) => state.addNegotiation);
  const loads = useAppStore((state) => state.loads);
  const recommendations = useAppStore((state) => state.recommendations);
  const negotiations = useAppStore((state) => state.negotiations);
  const syncRecommendations = useAppStore((state) => state.syncRecommendations);
  const syncNegotiations = useAppStore((state) => state.syncNegotiations);
  const trips = useAppStore((state) => state.trips);
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<'create' | 'price' | 'discovery' | 'compliance' | 'feasibility' | 'negotiation' | 'review' | 'monitoring' | 'kpis'>('create');
  const [currentLoad, setCurrentLoad] = useState<{
    origin: string;
    destination: string;
    loadType: string;
    weight: string;
    pickupTime: string;
    deliveryTime: string;
  } | null>(null);
  const [createdLoadId, setCreatedLoadId] = useState<string | null>(null);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null);
  const [availableFleets, setAvailableFleets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [negotiationId, setNegotiationId] = useState<string | null>(null);
  const [creatingNegotiation, setCreatingNegotiation] = useState(false);

  const confirmedLoad = useMemo(() => {
    if (createdLoadId) {
      const load = loads.find((l) => l.id === createdLoadId);
      if (load) {
        return load;
      }
    }
    const eligibleLoads = loads
      .filter((l) => ['approved', 'negotiating', 'dispatched', 'in-transit', 'completed'].includes(l.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return eligibleLoads[0] || null;
  }, [loads, createdLoadId]);

  const confirmedRecommendation = useMemo(() => {
    if (!confirmedLoad?.recommendationId) return null;
    return recommendations.find((r) => r.id === confirmedLoad.recommendationId) || null;
  }, [confirmedLoad, recommendations]);

  const confirmedNegotiation = useMemo(() => {
    if (!confirmedLoad?.negotiationId) return null;
    return negotiations.find((n) => n.id === confirmedLoad.negotiationId) || null;
  }, [confirmedLoad, negotiations]);

  const confirmedTrip = useMemo(() => {
    if (!confirmedLoad) return null;
    return trips.find((t) => t.loadId === confirmedLoad.id) || null;
  }, [trips, confirmedLoad]);

  const procurementKPIs = useMemo(() => {
    if (!confirmedLoad) {
      return null;
    }
    const predicted = confirmedLoad.pricePredicted || confirmedRecommendation?.priceSuggested || 0;
    const finalized = confirmedLoad.finalizedPrice || confirmedNegotiation?.finalizedPrice || predicted;
    const target = predicted ? predicted * 1.05 : finalized;
    return {
      predicted,
      finalized,
      variance: finalized - predicted,
      savingsVsTarget: target - finalized,
      supplierReliability: confirmedTrip ? 0.96 : 0.9,
      cycleTimeHours: confirmedTrip?.checkpoints.length ? confirmedTrip.checkpoints.length * 4 : 18,
    };
  }, [confirmedLoad, confirmedRecommendation, confirmedNegotiation, confirmedTrip]);

  // Set role on mount
  useEffect(() => {
    setRole('load-owner');
    // Sync data from backend on mount
    const syncData = async () => {
      try {
        const { syncLoads, syncRecommendations: syncRecs, syncNegotiations: syncNegs, syncTrips: syncTripsFn } = useAppStore.getState();
        await Promise.all([syncLoads(), syncRecs(), syncNegs(), syncTripsFn()]);
      } catch (err) {
        console.error('Failed to sync data:', err);
      }
    };
    syncData();
  }, [setRole]);

  // Update negotiationId when load changes
  useEffect(() => {
    if (createdLoadId) {
      const currentLoad = loads.find(l => l.id === createdLoadId);
      if (currentLoad?.negotiationId && !negotiationId) {
        setNegotiationId(currentLoad.negotiationId);
      }
    }
  }, [createdLoadId, loads, negotiationId]);

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam && ['create','price','discovery','compliance','feasibility','negotiation','review','monitoring','kpis'].includes(stepParam) && stepParam !== currentStep) {
      setCurrentStep(stepParam as typeof currentStep);
    }
  }, [searchParams, currentStep]);

  const workflowSteps = [
    { id: 'create', label: 'Create Shipment Request', icon: Package, type: 'manual' },
    { id: 'price', label: 'Price Prediction', icon: DollarSign, type: 'genai' },
    { id: 'discovery', label: 'Fleet Discovery', icon: Search, type: 'genai' },
    { id: 'compliance', label: 'Compliance Check', icon: CheckCircle, type: 'agentic' },
    { id: 'feasibility', label: 'Feasibility Scoring', icon: TrendingUp, type: 'agentic' },
    { id: 'negotiation', label: 'Negotiation Simulation', icon: Handshake, type: 'agentic' },
    { id: 'review', label: 'Review & Approve', icon: Eye, type: 'manual' },
    { id: 'monitoring', label: 'Trip Monitoring', icon: Eye, type: 'genai' },
    { id: 'kpis', label: 'Post-Trip KPIs', icon: BarChart3, type: 'genai' },
  ];

  const handleNextStep = () => {
    const stepOrder = ['create', 'price', 'discovery', 'compliance', 'feasibility', 'negotiation', 'review', 'monitoring', 'kpis'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1] as any);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'create':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Create Shipment Request
              </CardTitle>
              <CardDescription>Manual step - Create your shipment request</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Origin</label>
                  <input 
                    type="text" 
                    className="w-full mt-1 px-3 py-2 border rounded-md" 
                    placeholder="Enter origin city (e.g., Hyderabad)"
                    value={currentLoad?.origin || ''}
                    onChange={(e) => setCurrentLoad({ ...currentLoad || {} as any, origin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Destination</label>
                  <input 
                    type="text" 
                    className="w-full mt-1 px-3 py-2 border rounded-md" 
                    placeholder="Enter destination city (e.g., Guntur)"
                    value={currentLoad?.destination || ''}
                    onChange={(e) => setCurrentLoad({ ...currentLoad || {} as any, destination: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Load Type</label>
                  <select 
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={currentLoad?.loadType || ''}
                    onChange={(e) => setCurrentLoad({ ...currentLoad || {} as any, loadType: e.target.value })}
                  >
                    <option value="">Select load type</option>
                    <option>20T Reefer</option>
                    <option>15T Dry</option>
                    <option>5T Dry</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <input 
                    type="number" 
                    className="w-full mt-1 px-3 py-2 border rounded-md" 
                    placeholder="Enter weight"
                    value={currentLoad?.weight || ''}
                    onChange={(e) => setCurrentLoad({ ...currentLoad || {} as any, weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Pickup Time</label>
                  <input 
                    type="datetime-local" 
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={currentLoad?.pickupTime || ''}
                    onChange={(e) => setCurrentLoad({ ...currentLoad || {} as any, pickupTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Delivery Time</label>
                  <input 
                    type="datetime-local" 
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={currentLoad?.deliveryTime || ''}
                    onChange={(e) => setCurrentLoad({ ...currentLoad || {} as any, deliveryTime: e.target.value })}
                  />
                </div>
                <Button 
                  onClick={async () => {
                    if (!currentLoad?.origin || !currentLoad?.destination || !currentLoad?.loadType || !currentLoad?.weight) {
                      alert('Please fill in all required fields');
                      return;
                    }
                    try {
                      // Create the load via API
                      const newLoad = {
                        origin: currentLoad.origin,
                        destination: currentLoad.destination,
                        loadType: currentLoad.loadType,
                        weight: parseFloat(currentLoad.weight),
                        pickupTime: currentLoad.pickupTime || new Date().toISOString(),
                        deliveryTime: currentLoad.deliveryTime || new Date(Date.now() + 86400000).toISOString(),
                        createdBy: 'load-owner' as const,
                      };
                      const created = await addLoad(newLoad);
                      setCreatedLoadId(created.id);
                      handleNextStep();
                    } catch (error) {
                      alert('Failed to create load. Please try again.');
                      console.error(error);
                    }
                  }}
                  className="w-full"
                  disabled={!currentLoad?.origin || !currentLoad?.destination || !currentLoad?.loadType || !currentLoad?.weight}
                >
                  Submit Request & Proceed to Price Prediction
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'price':
        const load = createdLoadId ? loads.find(l => l.id === createdLoadId) : null;
        // Calculate distance (simplified - in real app would use mapping API)
        // Use deterministic calculation based on load ID to avoid hydration mismatch
        const loadHash = load?.id ? load.id.split('_').pop() || '0' : '0';
        const distance = load ? Math.round((parseInt(loadHash) % 500) + 200) : 0;
        const priceMin = distance * 50;
        const priceMax = distance * 60;
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Price Prediction (GenAI)
              </CardTitle>
              <CardDescription>AI-powered price prediction based on route and load characteristics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {load && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-900 font-semibold mb-2">Predicted Price Range</div>
                    <div className="text-2xl font-bold text-blue-900">₹{priceMin.toLocaleString()} - ₹{priceMax.toLocaleString()}</div>
                    <div className="text-xs text-blue-700 mt-2">
                      Based on: Route ({load.origin} → {load.destination}), Distance (~{distance} km), Load type ({load.loadType}), Market rates, Fuel costs
                    </div>
                  </div>
                )}
                <Button 
                  onClick={async () => {
                    if (load && createdLoadId) {
                      await updateLoad(createdLoadId, {
                        pricePredicted: (priceMin + priceMax) / 2,
                        priceRange: { min: priceMin, max: priceMax },
                      });
                      // Discover fleets for this load
                      setLoading(true);
                      try {
                        const discoveredFleets = await apiClient.discoverFleets(createdLoadId);
                        setAvailableFleets(discoveredFleets);
                      } catch (err) {
                        console.error('Failed to discover fleets:', err);
                        // Create mock recommendations if API fails
                        // Use deterministic IDs based on load ID to avoid hydration issues
                        const baseId = createdLoadId.split('_').pop() || '0';
                        const mockFleets = [
                          {
                            id: `rec_${baseId}_1`,
                            loadId: createdLoadId,
                            origin: load.origin,
                            destination: load.destination,
                            loadType: load.loadType,
                            distanceKm: distance,
                            detourKm: Math.round(distance * 0.1),
                            feasibility: 0.91,
                            priceSuggested: (priceMin + priceMax) / 2,
                            complianceFlags: [],
                            etaHours: Math.round(distance / 60),
                            status: 'pending' as const,
                          },
                          {
                            id: `rec_${baseId}_2`,
                            loadId: createdLoadId,
                            origin: load.origin,
                            destination: load.destination,
                            loadType: load.loadType,
                            distanceKm: distance + 50,
                            detourKm: Math.round((distance + 50) * 0.15),
                            feasibility: 0.85,
                            priceSuggested: (priceMin + priceMax) / 2 + 5000,
                            complianceFlags: [],
                            etaHours: Math.round((distance + 50) / 60),
                            status: 'pending' as const,
                          },
                          {
                            id: `rec_${baseId}_3`,
                            loadId: createdLoadId,
                            origin: load.origin,
                            destination: load.destination,
                            loadType: load.loadType,
                            distanceKm: distance + 100,
                            detourKm: Math.round((distance + 100) * 0.2),
                            feasibility: 0.78,
                            priceSuggested: (priceMin + priceMax) / 2 + 10000,
                            complianceFlags: [],
                            etaHours: Math.round((distance + 100) / 60),
                            status: 'pending' as const,
                          },
                        ];
                        setAvailableFleets(mockFleets);
                      } finally {
                        setLoading(false);
                      }
                    }
                    handleNextStep();
                  }}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Discovering Fleets...' : 'Proceed to Fleet Discovery'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'discovery':
        const loadForDiscovery = createdLoadId ? loads.find(l => l.id === createdLoadId) : null;
        // Sort fleets by feasibility score (highest first)
        const sortedFleets = [...availableFleets].sort((a, b) => (b.feasibility || 0) - (a.feasibility || 0));
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Fleet Discovery (GenAI)
              </CardTitle>
              <CardDescription>Select a fleet manager based on feasibility score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadForDiscovery && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <div className="text-sm font-semibold mb-2">Your Shipment</div>
                    <div className="text-sm space-y-1">
                      <div><strong>Route:</strong> {loadForDiscovery.origin} → {loadForDiscovery.destination}</div>
                      <div><strong>Load Type:</strong> {loadForDiscovery.loadType}</div>
                      <div><strong>Weight:</strong> {loadForDiscovery.weight.toLocaleString()} kg</div>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Available Fleets (Ranked by Feasibility)</div>
                  {sortedFleets.length > 0 ? (
                    sortedFleets.map((fleet, index) => (
                      <div
                        key={fleet.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedRecommendationId === fleet.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedRecommendationId(fleet.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                                Rank #{index + 1}
                              </span>
                              <span className="text-sm font-semibold">
                                Feasibility: {Math.round((fleet.feasibility || 0) * 100)}%
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <div><strong>Distance:</strong> {fleet.distanceKm} km</div>
                              {fleet.detourKm > 0 && (
                                <div><strong>Detour:</strong> {fleet.detourKm} km</div>
                              )}
                              <div><strong>Price Suggested:</strong> ₹{fleet.priceSuggested?.toLocaleString() || '0'}</div>
                              <div><strong>ETA:</strong> {fleet.etaHours} hours</div>
                            </div>
                          </div>
                          {selectedRecommendationId === fleet.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                      No fleets available. Please try again or proceed with manual selection.
                    </div>
                  )}
                </div>
                <Button 
                  onClick={async () => {
                    if (selectedRecommendationId && createdLoadId) {
                      const selectedFleet = sortedFleets.find(f => f.id === selectedRecommendationId);
                      if (selectedFleet) {
                        try {
                          const recommendation = await addRecommendation({
                            loadId: createdLoadId,
                            origin: selectedFleet.origin,
                            destination: selectedFleet.destination,
                            loadType: selectedFleet.loadType,
                            distanceKm: selectedFleet.distanceKm,
                            detourKm: selectedFleet.detourKm,
                            feasibility: selectedFleet.feasibility,
                            priceSuggested: selectedFleet.priceSuggested,
                            complianceFlags: selectedFleet.complianceFlags || [],
                            etaHours: selectedFleet.etaHours,
                            status: 'pending',
                          });

                          await updateLoad(createdLoadId, {
                            recommendationId: recommendation.id,
                            status: 'matched',
                          });

                          setSelectedRecommendationId(recommendation.id);
                          setNegotiationId(null);
                        } catch (err) {
                          console.error('Failed to save recommendation:', err);
                        }
                      }
                    }
                    handleNextStep();
                  }}
                  className="w-full"
                  disabled={!selectedRecommendationId}
                >
                  {selectedRecommendationId ? 'Proceed with Selected Fleet' : 'Please Select a Fleet'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'compliance':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Compliance Check (Agentic AI)
              </CardTitle>
              <CardDescription>Bidirectional check with Fleet Manager - AI verifies compliance rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Compliance Status</div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Weight limits: Passed
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Route restrictions: Passed
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Equipment requirements: Passed
                    </li>
                  </ul>
                  <div className="text-xs text-purple-700 mt-2">
                    ✓ Synchronized with Fleet Manager compliance check
                  </div>
                </div>
                <Button onClick={handleNextStep} className="w-full">
                  Proceed to Feasibility Scoring
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'feasibility':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Feasibility Scoring (Agentic AI)
              </CardTitle>
              <CardDescription>Bidirectional scoring with Fleet Manager - AI calculates feasibility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Feasibility Score: 91%</div>
                  <div className="text-xs space-y-1 mt-2">
                    <div>• Capacity Match: 90%</div>
                    <div>• Detour Distance: 85%</div>
                    <div>• Idle Hours: 95%</div>
                    <div>• Compliance: 100%</div>
                  </div>
                  <div className="text-xs text-purple-700 mt-2">
                    ✓ Synchronized with Fleet Manager feasibility scoring
                  </div>
                </div>
                <Button 
                  onClick={async () => {
                    // Create negotiation before proceeding
                    const currentLoad = createdLoadId ? loads.find(l => l.id === createdLoadId) : null;
                    const currentRec = currentLoad?.recommendationId 
                      ? recommendations.find(r => r.id === currentLoad.recommendationId)
                      : null;
                    
                    if (currentRec && currentLoad && !currentLoad.negotiationId) {
                      setCreatingNegotiation(true);
                      try {
                        await syncNegotiations();
                        const negotiation = await addNegotiation({
                          recommendationId: currentRec.id,
                          buyerAgent: {
                            id: 'buyer_001',
                            name: 'Load Owner Agent',
                            minPrice: Math.round((currentRec.priceSuggested || 45000) * 0.8),
                            maxPrice: Math.round((currentRec.priceSuggested || 45000) * 1.1),
                            concessionRate: 2,
                          },
                          sellerAgent: {
                            id: 'seller_001',
                            name: 'Fleet Manager Agent',
                            minPrice: Math.round((currentRec.priceSuggested || 45000) * 0.9),
                            maxPrice: Math.round((currentRec.priceSuggested || 45000) * 1.2),
                            concessionRate: 2,
                          },
                          offers: [],
                          status: 'active',
                          currentRound: 0,
                        });
                        await updateLoad(currentLoad.id, {
                          negotiationId: negotiation.id,
                          status: 'negotiating',
                        });
                        setNegotiationId(negotiation.id);
                      } catch (err) {
                        console.error('Failed to create negotiation:', err);
                      } finally {
                        setCreatingNegotiation(false);
                      }
                    }
                    handleNextStep();
                  }}
                  className="w-full"
                  disabled={creatingNegotiation}
                >
                  {creatingNegotiation ? 'Creating negotiation...' : 'Proceed to Negotiation Simulation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'negotiation': {
        const negotiationLoad = createdLoadId ? loads.find(l => l.id === createdLoadId) : null;
        const negotiationRec = negotiationLoad?.recommendationId 
          ? recommendations.find(r => r.id === negotiationLoad.recommendationId)
          : null;
        const currentNegotiationId = negotiationId || negotiationLoad?.negotiationId;
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5" />
                Negotiation Simulation (Agentic AI)
              </CardTitle>
              <CardDescription>Bidirectional negotiation with Fleet Manager - AI agents negotiate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {negotiationRec && negotiationLoad && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <div className="text-sm font-semibold mb-2">Selected Matchmaking</div>
                    <div className="text-sm space-y-1">
                      <div><strong>Route:</strong> {negotiationLoad.origin} → {negotiationLoad.destination}</div>
                      <div><strong>Feasibility:</strong> {Math.round((negotiationRec.feasibility || 0) * 100)}%</div>
                      <div><strong>Price Suggested:</strong> ₹{negotiationRec.priceSuggested?.toLocaleString() || '0'}</div>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Negotiation Console</div>
                  <div className="text-xs text-purple-700 mb-2">
                    {creatingNegotiation 
                      ? 'Creating negotiation...'
                      : currentNegotiationId
                        ? 'Click below to open the negotiation console where AI agents will negotiate'
                        : 'Please wait while negotiation is being set up...'}
                  </div>
                </div>
                {currentNegotiationId ? (
                  <Link href={`/negotiation?id=${currentNegotiationId}`}>
                    <Button className="w-full" disabled={creatingNegotiation}>
                      Open Negotiation Console
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" disabled>
                    {creatingNegotiation ? 'Setting up negotiation...' : 'No Negotiation Available'}
                  </Button>
                )}
                {currentNegotiationId && (
                  <Button onClick={handleNextStep} variant="outline" className="w-full">
                    Skip to Review (Demo Mode)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      }

      case 'review': {
        const price = confirmedLoad?.finalizedPrice || confirmedNegotiation?.finalizedPrice;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Review Outcome & Approve (Manual)
              </CardTitle>
              <CardDescription>Review the negotiated outcome before activating the trip</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Final Agreement</div>
                  <div className="space-y-2 text-sm">
                    <div><strong>Final Price:</strong> ₹{price?.toLocaleString() || 'Pending'}</div>
                    {confirmedRecommendation && (
                      <>
                        <div><strong>Route:</strong> {confirmedRecommendation.origin} → {confirmedRecommendation.destination}</div>
                        <div><strong>Distance:</strong> {confirmedRecommendation.distanceKm} km</div>
                        <div><strong>ETA:</strong> {confirmedRecommendation.etaHours} hours</div>
                      </>
                    )}
                    {confirmedNegotiation && (
                      <div><strong>Negotiation Rounds:</strong> {confirmedNegotiation.currentRound}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCurrentStep('negotiation')}
                  >
                    Revisit Negotiation
                  </Button>
                  <Button
                    onClick={() => setCurrentStep('monitoring')}
                    className="flex-1"
                    disabled={!confirmedTrip && confirmedLoad?.status !== 'approved'}
                  >
                    Proceed to Trip Monitoring
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      case 'monitoring':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Trip Monitoring Dashboard (GenAI)
              </CardTitle>
              <CardDescription>Live status of the confirmed trip and procurement impact</CardDescription>
            </CardHeader>
            <CardContent>
              {confirmedTrip && confirmedLoad ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-semibold mb-2">Trip Status</div>
                      <div className="space-y-2 text-sm">
                        <div><strong>Status:</strong> {confirmedTrip.status.replace('-', ' ')}</div>
                        <div><strong>Driver:</strong> {confirmedTrip.driverName}</div>
                        <div><strong>Route:</strong> {confirmedTrip.origin} → {confirmedTrip.destination}</div>
                        <div><strong>Payout:</strong> ₹{confirmedTrip.payout.toLocaleString()}</div>
                        {confirmedTrip.startTime && (
                          <div><strong>Started:</strong> {new Date(confirmedTrip.startTime).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-semibold mb-2">Checkpoint Progress</div>
                      <div className="space-y-2 text-sm">
                        {confirmedTrip.checkpoints.map((cp, idx) => (
                          <div key={cp.id} className="flex items-center justify-between">
                            <span>{idx + 1}. {cp.location}</span>
                            <span className="text-xs text-muted-foreground">
                              {cp.status === 'arrived' ? 'Arrived' : cp.status === 'departed' ? 'Departed' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-semibold mb-2">Route Snapshot</div>
                    <p className="text-xs text-muted-foreground mb-2">
                      The AI agent continuously monitors telematics to flag delays or compliance issues across the route.
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span>Distance Covered:</span>
                      <span>{confirmedTrip.checkpoints.filter(cp => cp.status !== 'pending').length}/{confirmedTrip.checkpoints.length} checkpoints</span>
                    </div>
                  </div>
                  <Button onClick={() => setCurrentStep('kpis')} className="w-full">
                    View Procurement KPIs
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                  Trip details are not yet available. Once the Fleet Manager dispatches the trip, live monitoring will appear here.
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'kpis':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Post-Trip KPIs (Procurement Impact)
              </CardTitle>
              <CardDescription>How this shipment influenced sourcing KPIs</CardDescription>
            </CardHeader>
            <CardContent>
              {procurementKPIs ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-semibold mb-2">Commercials</div>
                      <div className="space-y-1 text-sm">
                        <div><strong>Predicted Cost:</strong> ₹{procurementKPIs.predicted.toLocaleString()}</div>
                        <div><strong>Finalized Cost:</strong> ₹{procurementKPIs.finalized.toLocaleString()}</div>
                        <div><strong>Cost Variance:</strong> ₹{procurementKPIs.variance.toLocaleString()}</div>
                        <div><strong>Savings vs Target:</strong> ₹{procurementKPIs.savingsVsTarget.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-semibold mb-2">Supplier & Cycle Metrics</div>
                      <div className="space-y-1 text-sm">
                        <div><strong>Supplier Reliability Index:</strong> {(procurementKPIs.supplierReliability * 100).toFixed(0)}%</div>
                        <div><strong>Cycle Time:</strong> {procurementKPIs.cycleTimeHours} hrs</div>
                        <div><strong>Compliance:</strong> 100% (Docs & equipment cleared)</div>
                      </div>
                    </div>
                  </div>
                  <Link href="/load-owner">
                    <Button className="w-full">
                      Start New Shipment
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                  KPIs will be available once a shipment has been fully executed.
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Load Owner Workspace</h1>
        <p className="text-muted-foreground">Follow the workflow to create and manage shipments</p>
      </div>

      {/* Workflow Steps Indicator */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = workflowSteps.findIndex(s => s.id === currentStep) > index;
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => setCurrentStep(step.id as any)}
                    className={`flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-muted text-muted-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs text-center max-w-[100px]">{step.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      step.type === 'genai' ? 'bg-blue-100 text-blue-700' :
                      step.type === 'agentic' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {step.type === 'genai' ? 'GenAI' : step.type === 'agentic' ? 'Agentic' : 'Manual'}
                    </span>
                  </button>
                  {index < workflowSteps.length - 1 && (
                    <div className="w-8 h-0.5 bg-border mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      {renderStepContent()}
    </div>
  );
}

