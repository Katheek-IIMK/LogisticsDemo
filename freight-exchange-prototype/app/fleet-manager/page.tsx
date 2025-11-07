'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { Truck, Search, CheckCircle, TrendingUp, Handshake, Eye, User, MapPin, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const FLEET_MANAGER_STEPS = ['post', 'matching', 'compliance', 'feasibility', 'negotiation', 'review', 'driver', 'dispatch', 'monitoring', 'kpis'] as const;
type FleetManagerStep = typeof FLEET_MANAGER_STEPS[number];

type DriverOption = {
  id: string;
  name: string;
  experience: number;
  routeMatch: number;
  availability: string;
  preferredRoute?: string;
};

export default function FleetManagerWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setRole = useAppStore((state) => state.setRole);
  const loads = useAppStore((state) => state.loads);
  const trips = useAppStore((state) => state.trips);
  const recommendations = useAppStore((state) => state.recommendations);
  const negotiations = useAppStore((state) => state.negotiations);
  const addRecommendation = useAppStore((state) => state.addRecommendation);
  const addNegotiation = useAppStore((state) => state.addNegotiation);
  const updateLoad = useAppStore((state) => state.updateLoad);
  const syncLoads = useAppStore((state) => state.syncLoads);
  const syncRecommendations = useAppStore((state) => state.syncRecommendations);
  const syncNegotiations = useAppStore((state) => state.syncNegotiations);
  const [currentStep, setCurrentStep] = useState<FleetManagerStep>('post');
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRole('fleet-manager');
    // Sync data from backend on mount
    const syncData = async () => {
      try {
        await Promise.all([syncLoads(), syncRecommendations(), syncNegotiations()]);
      } catch (err) {
        console.error('Failed to sync data:', err);
      }
    };
    syncData();
  }, [setRole, syncLoads, syncRecommendations, syncNegotiations]);

  const workflowSteps = [
    { id: 'post', label: 'Post Capacities', icon: Truck, type: 'manual' },
    { id: 'matching', label: 'Load Matching', icon: Search, type: 'genai' },
    { id: 'compliance', label: 'Compliance Check', icon: CheckCircle, type: 'agentic' },
    { id: 'feasibility', label: 'Feasibility Scoring', icon: TrendingUp, type: 'agentic' },
    { id: 'negotiation', label: 'Negotiation Simulation', icon: Handshake, type: 'agentic' },
    { id: 'review', label: 'Review & Approve', icon: Eye, type: 'manual' },
    { id: 'driver', label: 'Driver Recommendation', icon: User, type: 'genai' },
    { id: 'dispatch', label: 'Dispatch & Route', icon: MapPin, type: 'genai' },
    { id: 'monitoring', label: 'Trip Monitoring', icon: Eye, type: 'genai' },
    { id: 'kpis', label: 'Post-Trip KPIs', icon: BarChart3, type: 'genai' },
  ];

  const driverOptions = useMemo(() => {
    const route = loads.find((l) => l.id === selectedLoadId) || null;
    const baseDrivers: DriverOption[] = [
      { id: 'driver_001', name: 'John Doe', experience: 6, routeMatch: 0.95, availability: 'Immediate' },
      { id: 'driver_002', name: 'Anita Sharma', experience: 8, routeMatch: 0.9, availability: '2 hrs' },
      { id: 'driver_003', name: 'Rahul Verma', experience: 4, routeMatch: 0.88, availability: '4 hrs' },
    ];
    if (!route) return baseDrivers;
    return baseDrivers.map((driver) => ({
      ...driver,
      routeMatch: driver.routeMatch + 0.02,
      preferredRoute: `${route.origin} → ${route.destination}`,
    }));
  }, [loads, selectedLoadId]);

  const activeLoad = useMemo(() => {
    if (selectedLoadId) {
      const load = loads.find((l) => l.id === selectedLoadId);
      if (load) return load;
    }
    const prioritized = loads
      .filter((l) => ['matched', 'negotiating', 'approved', 'dispatched', 'in-transit'].includes(l.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return prioritized[0] || null;
  }, [loads, selectedLoadId]);

  const activeRecommendation = useMemo(() => {
    if (selectedRecommendationId) {
      const rec = recommendations.find((r) => r.id === selectedRecommendationId);
      if (rec) return rec;
    }
    if (activeLoad?.recommendationId) {
      return recommendations.find((r) => r.id === activeLoad.recommendationId) || null;
    }
    return null;
  }, [selectedRecommendationId, recommendations, activeLoad]);

  const activeNegotiation = useMemo(() => {
    if (!activeLoad?.negotiationId) return null;
    return negotiations.find((n) => n.id === activeLoad.negotiationId) || null;
  }, [activeLoad, negotiations]);

  const activeTrip = useMemo(() => {
    if (!activeLoad) return null;
    return trips.find((t) => t.loadId === activeLoad.id) || null;
  }, [trips, activeLoad]);

  const selectedDriver = useMemo(() => {
    if (!selectedDriverId) return driverOptions[0] || null;
    return driverOptions.find((d) => d.id === selectedDriverId) || driverOptions[0] || null;
  }, [driverOptions, selectedDriverId]);

  const fleetProcurementKPIs = useMemo(() => {
    if (!activeLoad) return null;
    const predicted = activeLoad.pricePredicted || activeRecommendation?.priceSuggested || 0;
    const finalized = activeLoad.finalizedPrice || activeNegotiation?.finalizedPrice || predicted;
    const budget = predicted ? predicted * 1.05 : finalized;
    return {
      predicted,
      finalized,
      variance: finalized - predicted,
      savingsVsBudget: budget - finalized,
      driverUtilization: activeTrip ? 0.92 : 0.85,
      responseTimeHours: activeNegotiation ? activeNegotiation.currentRound * 1.5 : 6,
    };
  }, [activeLoad, activeRecommendation, activeNegotiation, activeTrip]);

  const goToStep = useCallback((step: FleetManagerStep) => {
    setCurrentStep(step);
    router.replace(`/fleet-manager?step=${step}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam && FLEET_MANAGER_STEPS.includes(stepParam as FleetManagerStep) && stepParam !== currentStep) {
      setCurrentStep(stepParam as FleetManagerStep);
    }
  }, [searchParams, currentStep]);

  useEffect(() => {
    if (currentStep === 'driver' && !selectedLoadId && activeLoad) {
      setSelectedLoadId(activeLoad.id);
    }
  }, [currentStep, selectedLoadId, activeLoad]);

  useEffect(() => {
    if (currentStep === 'driver' && !selectedDriverId && driverOptions.length > 0) {
      setSelectedDriverId(driverOptions[0].id);
    }
  }, [currentStep, selectedDriverId, driverOptions]);

  const handleNextStep = () => {
    const stepOrder = ['post', 'matching', 'compliance', 'feasibility', 'negotiation', 'review', 'driver', 'dispatch', 'monitoring', 'kpis'] as const;
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      goToStep(stepOrder[currentIndex + 1]);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'post':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Post Available Capacities (Manual)
              </CardTitle>
              <CardDescription>Manually post your fleet's available capacities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Truck Type</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option>20T Reefer</option>
                    <option>15T Dry Van</option>
                    <option>25T Flatbed</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Current Location</label>
                  <input type="text" className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="Enter location" />
                </div>
                <div>
                  <label className="text-sm font-medium">Available From</label>
                  <input type="datetime-local" className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <Button onClick={handleNextStep} className="w-full">
                  Post Capacity & Proceed to Matching
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'matching':
        // Get available loads (listed status)
        const availableLoads = loads.filter(l => ['draft', 'listed', 'matched', 'negotiating'].includes(l.status));
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Load Owner Matching Suggestions (GenAI)
              </CardTitle>
              <CardDescription>AI suggests matching loads from Load Owners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableLoads.length === 0 ? (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      No loads available yet. Load Owners need to create shipments first.
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Switch to Load Owner role to create a shipment, then return here.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-semibold mb-3">Available Loads from Load Owners</div>
                      <div className="space-y-3">
                        {availableLoads.map((load) => {
                          const matchScore = Math.round(Math.random() * 20 + 75); // 75-95% match
                          return (
                            <div
                              key={load.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedLoadId === load.id
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background hover:bg-accent'
                              }`}
                              onClick={() => setSelectedLoadId(load.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold">
                                    {load.origin} → {load.destination}
                                  </div>
                                  <div className="text-xs opacity-80">
                                    {load.loadType} • {load.weight} kg
                                  </div>
                                  {load.priceRange && (
                                    <div className="text-xs opacity-80 mt-1">
                                      Price Range: ₹{load.priceRange.min.toLocaleString()} - ₹{load.priceRange.max.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold">{matchScore}% match</div>
                                  <div className="text-xs opacity-80">AI Score</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <Button 
                      onClick={async () => {
                        if (!selectedLoadId) {
                          setError('Please select a load to proceed');
                          return;
                        }
                        setLoading(true);
                        setError(null);
                        try {
                          const selectedLoad = loads.find(l => l.id === selectedLoadId);
                          if (selectedLoad) {
                            // Create a recommendation via API
                            const distance = Math.round(Math.random() * 500 + 200);
                            const recommendation = await addRecommendation({
                              loadId: selectedLoad.id,
                              origin: selectedLoad.origin,
                              destination: selectedLoad.destination,
                              loadType: selectedLoad.loadType,
                              distanceKm: distance,
                              detourKm: Math.round(distance * 0.1),
                              feasibility: 0.91,
                              priceSuggested: selectedLoad.priceRange ? (selectedLoad.priceRange.min + selectedLoad.priceRange.max) / 2 : 45000,
                              complianceFlags: [],
                              etaHours: Math.round(distance / 60),
                              status: 'pending',
                            });
                            
                            // Create negotiation when recommendation is created
                            await syncNegotiations();
                            const negotiation = await addNegotiation({
                              recommendationId: recommendation.id,
                              buyerAgent: {
                                id: 'buyer_001',
                                name: 'Load Owner Agent',
                                minPrice: Math.round(recommendation.priceSuggested * 0.8),
                                maxPrice: Math.round(recommendation.priceSuggested * 1.1),
                                concessionRate: 2,
                              },
                              sellerAgent: {
                                id: 'seller_001',
                                name: 'Fleet Manager Agent',
                                minPrice: Math.round(recommendation.priceSuggested * 0.9),
                                maxPrice: Math.round(recommendation.priceSuggested * 1.2),
                                concessionRate: 2,
                              },
                              offers: [],
                              status: 'active',
                              currentRound: 0,
                            });
                            
                            await updateLoad(selectedLoadId, {
                              status: 'matched',
                              recommendationId: recommendation.id,
                              negotiationId: negotiation.id,
                            });
                            setSelectedRecommendationId(recommendation.id);
                            handleNextStep();
                          }
                        } catch (err: any) {
                          setError(err.message || 'Failed to create recommendation');
                          console.error(err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="w-full"
                      disabled={!selectedLoadId || loading}
                    >
                      {loading ? 'Processing...' : 'Select Load & Proceed to Compliance Check'}
                    </Button>
                    {error && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                        {error}
                      </div>
                    )}
                  </>
                )}
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
              <CardDescription>Bidirectional check with Load Owner - AI verifies compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Compliance Status</div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      All compliance rules satisfied
                    </li>
                  </ul>
                  <div className="text-xs text-purple-700 mt-2">
                    ✓ Synchronized with Load Owner compliance check
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
              <CardDescription>Bidirectional scoring with Load Owner</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Feasibility Score: 91%</div>
                  <div className="text-xs text-purple-700 mt-2">
                    ✓ Synchronized with Load Owner feasibility scoring
                  </div>
                </div>
                <Button onClick={handleNextStep} className="w-full">
                  Proceed to Negotiation Simulation
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'negotiation':
        const negotiationLoad = selectedLoadId ? loads.find(l => l.id === selectedLoadId) : null;
        const negotiationRec = negotiationLoad?.recommendationId 
          ? recommendations.find(r => r.id === negotiationLoad.recommendationId)
          : null;
        const negotiationId = negotiationLoad?.negotiationId;
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5" />
                Negotiation Simulation (Agentic AI)
              </CardTitle>
              <CardDescription>Bidirectional negotiation with Load Owner - AI agents negotiate</CardDescription>
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
                    {negotiationId 
                      ? 'Click below to open the negotiation console where AI agents will negotiate'
                      : 'Please select a load first to start negotiation'}
                  </div>
                </div>
                {negotiationId ? (
                  <Link href={`/negotiation?id=${negotiationId}`}>
                    <Button className="w-full">
                      Open Negotiation Console
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full" disabled>
                    No Negotiation Available
                  </Button>
                )}
                {negotiationId && (
                  <Button onClick={handleNextStep} variant="outline" className="w-full">
                    Skip to Review (Demo Mode)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'review':
        const reviewLoad = selectedLoadId ? loads.find(l => l.id === selectedLoadId) : null;
        const reviewRecommendation = selectedRecommendationId ? recommendations.find(r => r.id === selectedRecommendationId) : null;
        const reviewNegotiation = reviewLoad?.negotiationId ? useAppStore.getState().negotiations.find(n => n.id === reviewLoad.negotiationId) : null;
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Review Outcome & Approve (Manual)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Final Agreement</div>
                  <div className="space-y-2 text-sm">
                    {reviewNegotiation?.finalizedPrice ? (
                      <div><strong>Finalized Price:</strong> ₹{reviewNegotiation.finalizedPrice.toLocaleString()}</div>
                    ) : reviewLoad?.pricePredicted ? (
                      <div><strong>Predicted Price:</strong> ₹{reviewLoad.pricePredicted.toLocaleString()}</div>
                    ) : (
                      <div><strong>Price:</strong> To be negotiated</div>
                    )}
                    {reviewLoad && (
                      <>
                        <div><strong>Load:</strong> {reviewLoad.origin} → {reviewLoad.destination}</div>
                        <div><strong>Load Type:</strong> {reviewLoad.loadType}</div>
                        <div><strong>Weight:</strong> {reviewLoad.weight.toLocaleString()} kg</div>
                      </>
                    )}
                    {reviewRecommendation && (
                      <>
                        <div><strong>Distance:</strong> {reviewRecommendation.distanceKm} km</div>
                        <div><strong>ETA:</strong> {reviewRecommendation.etaHours} hours</div>
                        <div><strong>Feasibility:</strong> {(reviewRecommendation.feasibility * 100).toFixed(0)}%</div>
                      </>
                    )}
                  </div>
                </div>
                <Button onClick={handleNextStep} className="w-full">
                  Approve & Proceed to Driver Recommendation
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'driver':
        const driverLoad = activeLoad;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Driver Recommendation (GenAI)
              </CardTitle>
              <CardDescription>AI ranks drivers based on route familiarity, utilization, and compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {driverLoad ? (
                  <div className="p-4 bg-muted rounded-lg mb-2">
                    <div className="text-sm font-semibold mb-2">Trip Snapshot</div>
                    <div className="space-y-1 text-sm">
                      <div><strong>Route:</strong> {driverLoad.origin} → {driverLoad.destination}</div>
                      <div><strong>Load Type:</strong> {driverLoad.loadType}</div>
                      <div><strong>Weight:</strong> {driverLoad.weight.toLocaleString()} kg</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                    Select a load to see tailored driver suggestions.
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-3">
                  {driverOptions.map((driver) => {
                    const isSelected = selectedDriverId === driver.id;
                    return (
                      <button
                        key={driver.id}
                        type="button"
                        onClick={() => setSelectedDriverId(driver.id)}
                        className={`rounded-lg border p-4 text-left transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">{driver.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">{Math.round(driver.routeMatch * 100)}% match</span>
                        </div>
                        <div className="text-xs space-y-1 text-muted-foreground">
                          <div>Experience: {driver.experience} yrs</div>
                          <div>Availability: {driver.availability}</div>
                          {driver.preferredRoute && <div>Preferred: {driver.preferredRoute}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <Button onClick={handleNextStep} className="w-full" disabled={!selectedDriverId}>
                  Proceed to Dispatch & Route Activation
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'dispatch':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dispatch & Route Activation (GenAI)
              </CardTitle>
              <CardDescription>AI activates route and dispatches to driver - Links to Driver's Trip Briefing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Dispatch Status</div>
                  <div className="space-y-2 text-sm">
                    <div>✓ Route activated</div>
                    <div>✓ Driver notified ({selectedDriver?.name || 'Select driver'})</div>
                    <div>✓ Trip briefing sent to driver</div>
                  </div>
                </div>
                <Button 
                  onClick={async () => {
                    const selectedLoad = activeLoad;
                    if (!selectedLoad) {
                      setError('No load selected');
                      return;
                    }
                    if (!selectedDriver) {
                      setError('Select a driver before dispatching');
                      return;
                    }
                    setLoading(true);
                    setError(null);
                    try {
                      const { addTrip } = useAppStore.getState();
                      await addTrip({
                        loadId: selectedLoad.id,
                        recommendationId: selectedLoad.recommendationId || 'demo_rec_001',
                        driverId: selectedDriver.id,
                        driverName: selectedDriver.name,
                        origin: selectedLoad.origin,
                        destination: selectedLoad.destination,
                        status: 'assigned',
                        payout:
                          selectedLoad.finalizedPrice ||
                          activeNegotiation?.finalizedPrice ||
                          activeRecommendation?.priceSuggested ||
                          0,
                        checkpoints: [
                          { id: 'cp1', location: selectedLoad.origin, status: 'pending', eta: new Date(Date.now() + 3600000).toISOString() },
                          { id: 'cp2', location: 'Midpoint', status: 'pending', eta: new Date(Date.now() + 7200000).toISOString() },
                          { id: 'cp3', location: selectedLoad.destination, status: 'pending', eta: new Date(Date.now() + 14400000).toISOString() },
                        ],
                        startTime: null,
                        endTime: null,
                      });
                      // Load status is updated automatically by TripService
                      handleNextStep();
                    } catch (err: any) {
                      setError(err.message || 'Failed to dispatch trip');
                      console.error(err);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full"
                  disabled={!activeLoad || !selectedDriver || loading}
                >
                  {loading ? 'Dispatching...' : 'Dispatch Trip to Driver'}
                </Button>
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Link href="/driver">
                  <Button variant="outline" className="w-full">
                    View Driver Workspace
                  </Button>
                </Link>
                <Button onClick={handleNextStep} variant="outline" className="w-full">
                  Continue to Monitoring
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'monitoring':
        const monitoringTrip = activeTrip;
        const monitoringLoad = activeLoad;
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Trip Monitoring Dashboard (GenAI)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monitoringTrip ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-semibold mb-2">Trip Status</div>
                        <div className="space-y-2 text-sm">
                          <div><strong>Status:</strong> {monitoringTrip.status}</div>
                          <div><strong>Driver:</strong> {monitoringTrip.driverName}</div>
                          <div><strong>Route:</strong> {monitoringTrip.origin} → {monitoringTrip.destination}</div>
                          <div><strong>Progress:</strong> {
                            monitoringTrip.checkpoints.filter(cp => cp.status !== 'pending').length > 0
                              ? Math.round((monitoringTrip.checkpoints.filter(cp => cp.status !== 'pending').length / monitoringTrip.checkpoints.length) * 100)
                              : 0
                          }%</div>
                          {monitoringTrip.startTime && (
                            <div><strong>Trip Started:</strong> {new Date(monitoringTrip.startTime).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm font-semibold mb-2">Route Checkpoints</div>
                        <div className="space-y-2 text-sm">
                          {monitoringTrip.checkpoints.map((cp, idx) => (
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
                    {monitoringLoad && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-semibold mb-2">Load Information</div>
                        <div className="space-y-1 text-sm">
                          <div><strong>Load Type:</strong> {monitoringLoad.loadType}</div>
                          <div><strong>Weight:</strong> {monitoringLoad.weight.toLocaleString()} kg</div>
                          <div><strong>Payout:</strong> ₹{monitoringTrip.payout.toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      No active trip. Dispatch a trip to driver first.
                    </div>
                  </div>
                )}
                <Button onClick={handleNextStep} className="w-full" disabled={!monitoringTrip}>
                  View Post-Trip KPIs
                </Button>
              </div>
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fleetProcurementKPIs ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-semibold mb-2">Commercials</div>
                      <div className="space-y-1 text-sm">
                        <div><strong>Predicted Cost:</strong> ₹{fleetProcurementKPIs.predicted.toLocaleString()}</div>
                        <div><strong>Finalized Cost:</strong> ₹{fleetProcurementKPIs.finalized.toLocaleString()}</div>
                        <div><strong>Cost Variance:</strong> ₹{fleetProcurementKPIs.variance.toLocaleString()}</div>
                        <div><strong>Savings vs Budget:</strong> ₹{fleetProcurementKPIs.savingsVsBudget.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-semibold mb-2">Operational Procurement</div>
                      <div className="space-y-1 text-sm">
                        <div><strong>Driver Utilisation:</strong> {(fleetProcurementKPIs.driverUtilization * 100).toFixed(0)}%</div>
                        <div><strong>Response Time:</strong> {fleetProcurementKPIs.responseTimeHours} hrs</div>
                        <div><strong>Compliance:</strong> 100% (Docs, permits, ESG)</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                    KPIs will be computed once a negotiation has been approved for a load.
                  </div>
                )}
                <Link href="/fleet-manager">
                  <Button className="w-full">
                    Post New Capacity
                  </Button>
                </Link>
              </div>
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
        <h1 className="text-3xl font-bold mb-2">Fleet Manager Workspace</h1>
        <p className="text-muted-foreground">Follow the workflow to manage fleet operations</p>
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
                    onClick={() => goToStep(step.id as FleetManagerStep)}
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

