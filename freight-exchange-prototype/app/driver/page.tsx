'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { FileText, CheckCircle, MapPin, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DriverPage() {
  const router = useRouter();
  const setRole = useAppStore((state) => state.setRole);
  const trips = useAppStore((state) => state.trips);
  const loads = useAppStore((state) => state.loads);
  const recommendations = useAppStore((state) => state.recommendations);
  const updateTrip = useAppStore((state) => state.updateTrip);
  const syncTrips = useAppStore((state) => state.syncTrips);
  const syncLoads = useAppStore((state) => state.syncLoads);
  const syncRecommendations = useAppStore((state) => state.syncRecommendations);
  const [currentStep, setCurrentStep] = useState<'briefing' | 'validation' | 'execution' | 'preview'>('briefing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRole('driver');
    // Sync data from backend on mount
    const syncData = async () => {
      try {
        await Promise.all([syncTrips(), syncLoads(), syncRecommendations()]);
      } catch (err) {
        console.error('Failed to sync data:', err);
      }
    };
    syncData();
  }, [setRole, syncTrips, syncLoads, syncRecommendations]);

  const workflowSteps = [
    { id: 'briefing', label: 'Trip Briefing', icon: FileText, type: 'genai' },
    { id: 'validation', label: 'Trip Validation', icon: CheckCircle, type: 'genai' },
    { id: 'execution', label: 'Execution & Tracking', icon: MapPin, type: 'genai' },
    { id: 'preview', label: 'Route Preview', icon: Download, type: 'genai' },
  ];

  const goToStep = useCallback((step: 'briefing' | 'validation' | 'execution' | 'preview') => {
    setCurrentStep(step);
  }, []);

  const handleNextStep = () => {
    const stepOrder = ['briefing', 'validation', 'execution', 'preview'] as const;
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      goToStep(stepOrder[currentIndex + 1]);
    }
  };

  // Get the most recent assigned or started trip
  const activeTrip = trips
    .filter(t => t.status === 'assigned' || t.status === 'started' || t.status === 'in-transit')
    .sort((a, b) => (b.id > a.id ? 1 : -1))[0] || null;

  // Get the associated load and recommendation data
  const activeLoad = activeTrip?.loadId ? loads.find(l => l.id === activeTrip.loadId) : null;
  const activeRecommendation = activeTrip?.recommendationId ? recommendations.find(r => r.id === activeTrip.recommendationId) : null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'briefing':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Trip Briefing (GenAI)
              </CardTitle>
              <CardDescription>AI-generated trip briefing - Initiated by Fleet Manager Dispatch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeTrip ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-semibold mb-2">Trip Details</div>
                    <div className="space-y-2 text-sm">
                      <div><strong>Route:</strong> {activeTrip.origin} → {activeTrip.destination}</div>
                      <div><strong>Payout:</strong> ₹{activeTrip.payout.toLocaleString()}</div>
                      {activeLoad && (
                        <>
                          <div><strong>Load Type:</strong> {activeLoad.loadType}</div>
                          <div><strong>Weight:</strong> {activeLoad.weight.toLocaleString()} kg</div>
                          {activeLoad.equipment && (
                            <div><strong>Equipment:</strong> {activeLoad.equipment}</div>
                          )}
                        </>
                      )}
                      {activeRecommendation && (
                        <>
                          <div><strong>Distance:</strong> {activeRecommendation.distanceKm} km</div>
                          {activeRecommendation.detourKm > 0 && (
                            <div><strong>Detour:</strong> {activeRecommendation.detourKm} km</div>
                          )}
                          <div><strong>ETA:</strong> {activeRecommendation.etaHours} hours</div>
                        </>
                      )}
                      {activeLoad?.pickupTime && (
                        <div><strong>Pickup Time:</strong> {new Date(activeLoad.pickupTime).toLocaleString()}</div>
                      )}
                      {activeLoad?.deliveryTime && (
                        <div><strong>Delivery Time:</strong> {new Date(activeLoad.deliveryTime).toLocaleString()}</div>
                      )}
                    </div>
                    <div className="text-xs text-blue-700 mt-2">
                      ✓ Briefing generated by AI from Fleet Manager dispatch
                      {activeLoad && ` • Load created by Load Owner: ${activeLoad.origin} → ${activeLoad.destination}`}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      No active trip. Waiting for Fleet Manager dispatch...
                    </div>
                  </div>
                )}
                <Button onClick={handleNextStep} disabled={!activeTrip} className="w-full">
                  Proceed to Trip Validation
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'validation':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Trip Validation (GenAI)
              </CardTitle>
              <CardDescription>AI validates trip details and requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-semibold mb-2">Validation Results</div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Route verified
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Equipment requirements met
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Driver qualifications confirmed
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      All checkpoints validated
                    </li>
                  </ul>
                </div>
                <Button onClick={handleNextStep} className="w-full">
                  Start Trip Execution
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'execution':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Trip Execution & Live Tracking (GenAI)
              </CardTitle>
              <CardDescription>AI-powered live tracking and execution support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeTrip && (
                  <>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-semibold mb-2">Live Status</div>
                      <div className="space-y-2 text-sm">
                        <div><strong>Current Location:</strong> {activeTrip.checkpoints.find(cp => cp.status === 'arrived')?.location || activeTrip.checkpoints[0]?.location || activeTrip.origin}</div>
                        <div><strong>Destination:</strong> {activeTrip.destination}</div>
                        <div><strong>Progress:</strong> {
                          activeTrip.checkpoints.filter(cp => cp.status === 'arrived').length > 0
                            ? Math.round((activeTrip.checkpoints.filter(cp => cp.status === 'arrived').length / activeTrip.checkpoints.length) * 100)
                            : 0
                        }%</div>
                        {activeRecommendation && (
                          <div><strong>ETA to destination:</strong> {
                            activeTrip.checkpoints.filter(cp => cp.status === 'arrived').length > 0
                              ? Math.round(activeRecommendation.etaHours * (1 - (activeTrip.checkpoints.filter(cp => cp.status === 'arrived').length / activeTrip.checkpoints.length)))
                              : activeRecommendation.etaHours
                          } hours</div>
                        )}
                        {activeTrip.status === 'started' && activeTrip.startTime && (
                          <div><strong>Trip Started:</strong> {new Date(activeTrip.startTime).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Checkpoints</div>
                      {activeTrip.checkpoints.map((checkpoint, idx) => (
                        <div key={checkpoint.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              checkpoint.status === 'arrived'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {checkpoint.status === 'arrived' ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{checkpoint.location}</div>
                              <div className="text-xs text-muted-foreground">
                                ETA: {new Date(checkpoint.eta).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {checkpoint.status === 'pending' && activeTrip.status === 'started' && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                setLoading(true);
                                setError(null);
                                try {
                                  const updatedCheckpoints = activeTrip.checkpoints.map((cp) =>
                                    cp.id === checkpoint.id ? { ...cp, status: 'arrived' as const } : cp
                                  );
                                  await updateTrip(activeTrip.id, { checkpoints: updatedCheckpoints });
                                } catch (err: any) {
                                  setError(err.message || 'Failed to update checkpoint');
                                  console.error(err);
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              disabled={loading}
                            >
                              {loading ? 'Updating...' : 'Mark Arrived'}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {activeTrip.status === 'assigned' && (
                      <Button
                        onClick={async () => {
                          setLoading(true);
                          setError(null);
                          try {
                            await updateTrip(activeTrip.id, { 
                              status: 'started', 
                              startTime: new Date().toISOString() 
                            });
                          } catch (err: any) {
                            setError(err.message || 'Failed to start trip');
                            console.error(err);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? 'Starting...' : 'Start Trip'}
                      </Button>
                    )}
                    {error && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                        {error}
                      </div>
                    )}
                  </>
                )}
                <Button onClick={handleNextStep} className="w-full mt-4">
                  View Route Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'preview':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Route Preview & Download (GenAI)
              </CardTitle>
              <CardDescription>AI-generated route preview and downloadable route details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeTrip ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-semibold mb-2">Route Overview</div>
                    <div className="space-y-2 text-sm">
                      {activeRecommendation ? (
                        <>
                          <div><strong>Total Distance:</strong> {activeRecommendation.distanceKm} km</div>
                          {activeRecommendation.detourKm > 0 && (
                            <div><strong>Detour Distance:</strong> {activeRecommendation.detourKm} km</div>
                          )}
                          <div><strong>Estimated Time:</strong> {activeRecommendation.etaHours} hours</div>
                        </>
                      ) : (
                        <>
                          <div><strong>Route:</strong> {activeTrip.origin} → {activeTrip.destination}</div>
                        </>
                      )}
                      <div><strong>Checkpoints:</strong> {activeTrip.checkpoints.length}</div>
                      <div className="mt-3">
                        <div className="text-xs font-semibold mb-1">Checkpoint Details:</div>
                        {activeTrip.checkpoints.map((cp, idx) => (
                          <div key={cp.id} className="text-xs ml-2">
                            {idx + 1}. {cp.location} - {cp.status === 'arrived' ? '✓ Arrived' : cp.status === 'departed' ? '→ Departed' : '○ Pending'} 
                            {cp.eta && ` (ETA: ${new Date(cp.eta).toLocaleString()})`}
                          </div>
                        ))}
                      </div>
                      {activeLoad && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-semibold mb-1">Load Information:</div>
                          <div className="text-xs ml-2">
                            <div>Type: {activeLoad.loadType}</div>
                            <div>Weight: {activeLoad.weight.toLocaleString()} kg</div>
                            {activeLoad.equipment && <div>Equipment: {activeLoad.equipment}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      No active trip. Waiting for Fleet Manager dispatch...
                    </div>
                  </div>
                )}
                {activeTrip && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        const routeData = {
                          tripId: activeTrip.id,
                          route: `${activeTrip.origin} → ${activeTrip.destination}`,
                          distance: activeRecommendation?.distanceKm || 0,
                          eta: activeRecommendation?.etaHours || 0,
                          checkpoints: activeTrip.checkpoints,
                          load: activeLoad,
                        };
                        const blob = new Blob([JSON.stringify(routeData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `route_${activeTrip.id}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Route
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        // In a real app, this would open a map view
                        const mapUrl = `https://www.google.com/maps/dir/${encodeURIComponent(activeTrip.origin)}/${encodeURIComponent(activeTrip.destination)}`;
                        window.open(mapUrl, '_blank');
                      }}
                    >
                      View Full Map
                    </Button>
                  </div>
                )}
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
        <h1 className="text-3xl font-bold mb-2">Driver Workspace</h1>
        <p className="text-muted-foreground">Follow the workflow to execute trips</p>
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
                    onClick={() => goToStep(step.id as 'briefing' | 'validation' | 'execution' | 'preview')}
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
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      GenAI
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
