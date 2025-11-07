'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { simulateNegotiation } from '@/lib/negotiation';
import { Bot, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AgentReasonCard } from '@/components/AgentReasonCard';
import type { Negotiation } from '@/types';

function NegotiationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const negotiationId = searchParams.get('id');
  const negotiations = useAppStore((state) => state.negotiations);
  const loads = useAppStore((state) => state.loads);
  const recommendations = useAppStore((state) => state.recommendations);
  const addNegotiation = useAppStore((state) => state.addNegotiation);
  const updateNegotiation = useAppStore((state) => state.updateNegotiation);
  const updateLoad = useAppStore((state) => state.updateLoad);
  const syncNegotiations = useAppStore((state) => state.syncNegotiations);
  const syncLoads = useAppStore((state) => state.syncLoads);
  const selectedRole = useAppStore((state) => state.selectedRole);
  const syncRecommendations = useAppStore((state) => state.syncRecommendations);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [finalizedPrice, setFinalizedPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const rehydrateAttemptedRef = useRef(false);
  const startRetryRef = useRef(false);

  const attemptNegotiationRehydrate = useCallback(async () => {
    if (rehydrateAttemptedRef.current) {
      return null;
    }
    rehydrateAttemptedRef.current = true;

    try {
      if (!negotiationId) {
        return null;
      }

      const baseNegotiation = negotiation || null;
      const baseLoad =
        loads.find((l) => l.negotiationId === negotiationId) ||
        (baseNegotiation?.recommendationId
          ? loads.find((l) => l.recommendationId === baseNegotiation.recommendationId)
          : null);

      const baseRecommendation =
        baseNegotiation?.recommendationId
          ? recommendations.find((r) => r.id === baseNegotiation.recommendationId)
          : baseLoad?.recommendationId
          ? recommendations.find((r) => r.id === baseLoad.recommendationId)
          : null;

      if (!baseRecommendation || !baseLoad) {
        return null;
      }

      const priceBasis =
        baseRecommendation.priceSuggested ||
        baseLoad.pricePredicted ||
        baseLoad.finalizedPrice ||
        45000;

      const buyerAgent =
        baseNegotiation?.buyerAgent || {
          id: 'buyer_001',
          name: 'Load Owner Agent',
          minPrice: Math.round(priceBasis * 0.8),
          maxPrice: Math.round(priceBasis * 1.1),
          concessionRate: 2,
        };

      const sellerAgent =
        baseNegotiation?.sellerAgent || {
          id: 'seller_001',
          name: 'Fleet Manager Agent',
          minPrice: Math.round(priceBasis * 0.9),
          maxPrice: Math.round(priceBasis * 1.2),
          concessionRate: 2,
        };

      const snapshot =
        baseNegotiation && baseNegotiation.id === negotiationId
          ? { ...baseNegotiation }
          : baseNegotiation
          ? { ...baseNegotiation, id: negotiationId }
          : undefined;

      const recreated = await addNegotiation({
        recommendationId: baseRecommendation.id,
        buyerAgent,
        sellerAgent,
        offers: snapshot?.offers ?? [],
        status: snapshot?.status ?? 'active',
        currentRound: snapshot?.currentRound ?? 0,
        recommendationSnapshot: baseRecommendation,
        loadSnapshot: baseLoad,
        negotiationSnapshot: snapshot
          ? {
              ...snapshot,
              recommendationId: baseRecommendation.id,
            }
          : undefined,
      });

      await updateLoad(baseLoad.id, {
        negotiationId: recreated.id,
        status: 'negotiating',
      });

      router.replace(`/negotiation?id=${recreated.id}`, { scroll: false });

      const normalized = {
        ...recreated,
        offers: recreated.offers ?? [],
      };

      setNegotiation(normalized);
      if (normalized.finalizedPrice) {
        setFinalizedPrice(normalized.finalizedPrice);
      }

      return normalized;
    } catch (rehydrateError) {
      console.error('Failed to rehydrate negotiation:', rehydrateError);
      return null;
    } finally {
      rehydrateAttemptedRef.current = false;
    }
  }, [
    negotiationId,
    negotiation,
    loads,
    recommendations,
    addNegotiation,
    updateLoad,
    router,
  ]);

  // Get the selected recommendation (only one matchmaking)
  const selectedRecommendation = negotiation 
    ? recommendations.find(r => r.id === negotiation.recommendationId)
    : null;
  const selectedLoad = selectedRecommendation
    ? loads.find(l => l.id === selectedRecommendation.loadId)
    : null;

  useEffect(() => {
    const loadNegotiation = async () => {
      if (!negotiationId) {
        setIsLoading(false);
        setError('No negotiation ID provided');
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Sync negotiations from backend first
        await syncNegotiations();
        
        // Get fresh negotiations from store after sync
        const currentNegotiations = useAppStore.getState().negotiations;
        let found = currentNegotiations.find((n) => n.id === negotiationId);
        
        // If not found, try to fetch from API
        if (!found) {
          try {
            const response = await fetch(`/api/negotiations/${negotiationId}`);
            if (response.ok) {
              found = await response.json();
              if (found) {
                await addNegotiation(found);
                const updatedNegotiations = useAppStore.getState().negotiations;
                found = updatedNegotiations.find((n) => n.id === negotiationId);
              }
            } else {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to fetch negotiation: ${response.status}`);
            }
          } catch (e: any) {
            console.error('Error fetching negotiation:', e);
            setError(e.message || 'Failed to fetch negotiation from API');
          }
        }
        
        if (found) {
          const normalizedFound: Negotiation = {
            ...found,
            offers: found.offers ?? [],
          };
          setNegotiation(normalizedFound);
          if (normalizedFound.finalizedPrice) {
            setFinalizedPrice(normalizedFound.finalizedPrice);
          }
        } else {
          const recreated = await attemptNegotiationRehydrate();
          if (!recreated) {
            setError(`Negotiation with ID "${negotiationId}" not found. Please check the ID and try again.`);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load negotiation');
        console.error('Error loading negotiation:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadNegotiation();
  }, [negotiationId, addNegotiation, syncNegotiations, attemptNegotiationRehydrate]);
  
  // Update local state when negotiations change
  useEffect(() => {
    if (negotiationId && negotiations.length > 0) {
      const found = negotiations.find((n) => n.id === negotiationId);
      if (found) {
        const normalizedFound: Negotiation = {
          ...found,
          offers: found.offers ?? [],
        };
        setNegotiation(normalizedFound);
        if (normalizedFound.finalizedPrice) {
          setFinalizedPrice(normalizedFound.finalizedPrice);
        }
      }
    }
  }, [negotiations, negotiationId]);

  const handleStartNegotiation = async (target?: Negotiation) => {
    const negotiationToStart = target ?? negotiation;
    if (!negotiationToStart) return;
    setIsNegotiating(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/negotiations/${negotiationToStart.id}/start`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const message = payload?.error || 'Failed to start negotiation';
        if (!startRetryRef.current && message.toLowerCase().includes('not found')) {
          startRetryRef.current = true;
          const recreated = await attemptNegotiationRehydrate();
          startRetryRef.current = false;
          if (recreated) {
            await handleStartNegotiation(recreated);
            return;
          }
        }
        throw new Error(message);
      }
      
      const updatedNegotiation = payload as Negotiation;
      await updateNegotiation(negotiationToStart.id, updatedNegotiation);
      setNegotiation({
        ...updatedNegotiation,
        offers: updatedNegotiation.offers ?? [],
      });
      
      if (updatedNegotiation.finalizedPrice) {
        setFinalizedPrice(updatedNegotiation.finalizedPrice);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start negotiation');
      console.error(err);
    } finally {
      setIsNegotiating(false);
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Negotiation...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Negotiation Found</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-destructive font-semibold mb-2">Error:</p>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
                {negotiationId && (
                  <p className="text-sm text-muted-foreground">
                    Negotiation ID: <code className="bg-muted px-2 py-1 rounded">{negotiationId}</code>
                  </p>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                  <Link href="/matchmaking">
                    <Button variant="outline">Go to Matchmaking</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">
                  Please select a recommendation from the matchmaking page to start a negotiation.
                </p>
                {negotiationId && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Negotiation ID: <code className="bg-muted px-2 py-1 rounded">{negotiationId}</code>
                  </p>
                )}
                <Link href="/matchmaking">
                  <Button className="mt-4">Go to Matchmaking</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConverged = negotiation.status === 'converged';
  const isFailed = negotiation.status === 'failed';
  const finalPrice = finalizedPrice || negotiation.finalizedPrice;

  const getPostNegotiationPath = () => {
    if (selectedRole === 'fleet-manager') {
      return '/fleet-manager?step=driver';
    }
    if (selectedRole === 'load-owner') {
      return '/load-owner?step=monitoring';
    }
    return '/dashboard';
  };

  const handleApprove = async () => {
    if (!finalPrice || !negotiation?.recommendationId) {
      return;
    }

    const recommendation = recommendations.find(r => r.id === negotiation.recommendationId);
    if (recommendation) {
      const load = loads.find(l => l.id === recommendation.loadId);
      if (load) {
        await updateLoad(load.id, {
          status: 'approved',
          finalizedPrice: finalPrice,
        });
      }
    }

    await Promise.all([syncNegotiations(), syncRecommendations(), syncLoads()]);
    router.push(getPostNegotiationPath());
  };

  const handleManualOffer = async () => {
    const manualPrice = prompt('Enter your manual price offer:', finalPrice?.toString() || '');
    if (!manualPrice || isNaN(parseFloat(manualPrice))) {
      return;
    }

    const price = parseFloat(manualPrice);
    try {
      await updateNegotiation(negotiation.id, {
        finalizedPrice: price,
        status: 'converged',
      });
      if (negotiation?.recommendationId) {
        const recommendation = recommendations.find(r => r.id === negotiation.recommendationId);
        if (recommendation) {
          const load = loads.find(l => l.id === recommendation.loadId);
          if (load) {
            await updateLoad(load.id, {
              status: 'approved',
              finalizedPrice: price,
            });
          }
        }
      }
      setFinalizedPrice(price);
      await Promise.all([syncNegotiations(), syncRecommendations(), syncLoads()]);
      router.push(getPostNegotiationPath());
    } catch (err) {
      console.error('Failed to update with manual price:', err);
      alert('Failed to save manual price. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Agent Negotiation</h1>

      {/* Show selected matchmaking (only one) */}
      {selectedRecommendation && selectedLoad && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selected Matchmaking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Load Details</div>
                <div className="text-sm space-y-1">
                  <div><strong>Route:</strong> {selectedLoad.origin} → {selectedLoad.destination}</div>
                  <div><strong>Load Type:</strong> {selectedLoad.loadType}</div>
                  <div><strong>Weight:</strong> {selectedLoad.weight.toLocaleString()} kg</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Fleet Recommendation</div>
                <div className="text-sm space-y-1">
                  <div><strong>Feasibility:</strong> {Math.round((selectedRecommendation.feasibility || 0) * 100)}%</div>
                  <div><strong>Distance:</strong> {selectedRecommendation.distanceKm} km</div>
                  <div><strong>Price Suggested:</strong> ₹{selectedRecommendation.priceSuggested?.toLocaleString() || '0'}</div>
                  <div><strong>ETA:</strong> {selectedRecommendation.etaHours} hours</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Negotiation Console</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
                <div className="grid gap-3 md:grid-cols-2 flex-1">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-semibold mb-1">{negotiation.buyerAgent.name}</div>
                    <div className="text-xs text-muted-foreground mb-3">Load Owner Agent Constraints</div>
                    <ul className="text-sm space-y-1">
                      <li>Min Offer: ₹{negotiation.buyerAgent.minPrice.toLocaleString()}</li>
                      <li>Max Offer: ₹{negotiation.buyerAgent.maxPrice.toLocaleString()}</li>
                      <li>Concession Rate: {negotiation.buyerAgent.concessionRate ?? 2}%</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-semibold mb-1">{negotiation.sellerAgent.name}</div>
                    <div className="text-xs text-muted-foreground mb-3">Fleet Manager Agent Constraints</div>
                    <ul className="text-sm space-y-1">
                      <li>Min Offer: ₹{negotiation.sellerAgent.minPrice.toLocaleString()}</li>
                      <li>Max Offer: ₹{negotiation.sellerAgent.maxPrice.toLocaleString()}</li>
                      <li>Concession Rate: {negotiation.sellerAgent.concessionRate ?? 2}%</li>
                    </ul>
                  </div>
                </div>
                <div className="w-full md:w-64 flex flex-col gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={!isConverged || !finalPrice}
                    className="w-full flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Agreement
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleManualOffer}
                    disabled={!isConverged}
                    className="w-full flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Manually Offer Price
                  </Button>
                  {!isConverged && (
                    <p className="text-xs text-muted-foreground text-center">
                      Agents must converge before final approval.
                    </p>
                  )}
                </div>
              </div>

              {isConverged && finalPrice && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <div className="font-semibold text-green-900">Negotiation Finalized</div>
                      <div className="text-sm text-green-700">Agents have reached an agreement</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-900 mb-2">
                    Finalized Price: ₹{typeof finalPrice === 'number' ? finalPrice.toLocaleString() : finalPrice || '0'}
                  </div>
                  <div className="text-sm text-green-700">
                    This price has been confirmed by both agents and is ready for execution.
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-4 mb-4">
                {negotiation.offers && negotiation.offers.length > 0 ? (
                  <AnimatePresence>
                    {negotiation.offers.map((offer) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex gap-3 ${
                        offer.agentId === negotiation.buyerAgent.id
                          ? 'justify-start'
                          : 'justify-end'
                      }`}
                    >
                      <div
                        className={`max-w-md rounded-lg p-4 ${
                          offer.agentId === negotiation.buyerAgent.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {offer.agentId === negotiation.buyerAgent.id ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                          <span className="font-semibold">{offer.agentName}</span>
                          <span className="text-xs opacity-70">Round {offer.round}</span>
                        </div>
                        <div className="text-2xl font-bold mb-2">
                          ₹{offer.price && typeof offer.price === 'number' ? offer.price.toLocaleString() : offer.price || '0'}
                        </div>
                        <ul className="text-sm space-y-1">
                          {offer.reasoning.map((reason, idx) => (
                            <li key={idx}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed rounded-lg">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No offers yet</p>
                    <p className="text-sm text-muted-foreground">
                      Click "Let Agents Negotiate" to start the automated negotiation process.
                    </p>
                  </div>
                )}
              </div>

              {/* Agent Reason Cards for Transparency */}
              {negotiation.offers.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-semibold mb-2">Agent Decision Breakdown</h4>
                  {negotiation.offers.slice(-2).map((offer) => (
                    <AgentReasonCard
                      key={`reason-${offer.id}`}
                      agentName={offer.agentName}
                      decision={`Round ${offer.round} Offer: ₹${offer.price && typeof offer.price === 'number' ? offer.price.toLocaleString() : offer.price || '0'}`}
                      reasoning={offer.reasoning}
                      factors={{
                        timeCost: offer.agentId === negotiation.buyerAgent.id ? 'Time window constraints' : 'Driver hours available',
                        fuelDelta: offer.agentId === negotiation.sellerAgent.id ? `${Math.round((typeof offer.price === 'number' ? offer.price : 0) * 0.15)} fuel cost` : undefined,
                        driverHours: offer.agentId === negotiation.sellerAgent.id ? 'Optimal utilization' : undefined,
                        equipmentMatch: 'Equipment compatible',
                        compliance: 'All rules satisfied',
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-6">
                {negotiation.offers.length === 0 && (
                  <Button
                    onClick={() => handleStartNegotiation()}
                    disabled={isNegotiating}
                    className="w-full"
                  >
                    {isNegotiating ? 'Negotiating...' : 'Let Agents Negotiate'}
                  </Button>
                )}
                {isFailed && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Escalate to Human
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Negotiation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="text-lg font-semibold capitalize">
                    {negotiation.status}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current Round</div>
                  <div className="text-lg font-semibold">
                    {negotiation.currentRound}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Negotiation continues until agreement
                  </div>
                </div>
                {negotiation.offers.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground">Last Offer</div>
                    <div className="text-lg font-semibold">
                      ₹{(() => {
                        const lastOffer = negotiation.offers[negotiation.offers.length - 1];
                        return lastOffer?.price && typeof lastOffer.price === 'number' 
                          ? lastOffer.price.toLocaleString() 
                          : lastOffer?.price || '0';
                      })()}
                    </div>
                  </div>
                )}
                {finalPrice && (
                  <div>
                    <div className="text-sm text-muted-foreground">Finalized Price</div>
                    <div className="text-xl font-bold text-green-600">
                      ₹{typeof finalPrice === 'number' ? finalPrice.toLocaleString() : finalPrice}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function NegotiationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NegotiationContent />
    </Suspense>
  );
}

