'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { FileCheck, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ExecutionPage() {
  const router = useRouter();
  const negotiations = useAppStore((state) => state.negotiations);
  const recommendations = useAppStore((state) => state.recommendations);
  const loads = useAppStore((state) => state.loads);
  const updateKPIs = useAppStore((state) => state.updateKPIs);
  const addTrip = useAppStore((state) => state.addTrip);
  const syncNegotiations = useAppStore((state) => state.syncNegotiations);
  const syncRecommendations = useAppStore((state) => state.syncRecommendations);
  const syncLoads = useAppStore((state) => state.syncLoads);
  const [escrowEnabled, setEscrowEnabled] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncData = async () => {
      try {
        await Promise.all([syncNegotiations(), syncRecommendations(), syncLoads()]);
      } catch (err) {
        console.error('Failed to sync data:', err);
      }
    };
    syncData();
  }, [syncNegotiations, syncRecommendations, syncLoads]);

  const convergedNegotiation = negotiations.find((n) => n.status === 'converged');
  const recommendation = convergedNegotiation 
    ? recommendations.find(r => r.id === convergedNegotiation.recommendationId)
    : null;
  const load = recommendation 
    ? loads.find(l => l.id === recommendation.loadId)
    : null;

  const handleExecute = async () => {
    if (!convergedNegotiation || !recommendation || !load) {
      setError('Missing required data. Please ensure negotiation, recommendation, and load are available.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const finalPrice = convergedNegotiation.finalizedPrice || convergedNegotiation.offers[convergedNegotiation.offers.length - 1]?.price || 0;
      
      // Create trip with proper IDs
      await addTrip({
        loadId: load.id,
        recommendationId: recommendation.id,
        driverId: 'driver_001',
        driverName: 'John Doe',
        origin: load.origin,
        destination: load.destination,
        status: 'assigned',
        payout: finalPrice,
        checkpoints: [
          { id: 'cp1', location: load.origin, eta: new Date(Date.now() + 3600000).toISOString(), status: 'pending' },
          { id: 'cp2', location: 'Midpoint', eta: new Date(Date.now() + 7200000).toISOString(), status: 'pending' },
          { id: 'cp3', location: load.destination, eta: new Date(Date.now() + 14400000).toISOString(), status: 'pending' },
        ],
        startTime: null,
        endTime: null,
      });

      // Update KPIs
      await updateKPIs({
        emptyMileRatio: 0.28, // Reduced from 0.35
        utilization: 0.75, // Increased from 0.68
        co2Saved: 1350, // Increased
      });

      setExecuted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to execute contract. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!convergedNegotiation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Contract Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please complete a successful negotiation first.
            </p>
            <Link href="/negotiation">
              <Button>Go to Negotiation</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const finalPrice = convergedNegotiation.finalizedPrice || convergedNegotiation.offers[convergedNegotiation.offers.length - 1]?.price || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Contract Execution</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                E-Contract
              </CardTitle>
              <CardDescription>Review and execute the contract</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Contract ID</div>
                <div className="font-mono">CONT_{Date.now()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Buyer</div>
                <div>{convergedNegotiation.buyerAgent.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Seller</div>
                <div>{convergedNegotiation.sellerAgent.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Agreed Price</div>
                <div className="text-2xl font-bold">₹{finalPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Route</div>
                <div>{load ? `${load.origin} → ${load.destination}` : 'Pune → Bangalore'}</div>
              </div>
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="escrow"
                  checked={escrowEnabled}
                  onChange={(e) => setEscrowEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="escrow" className="text-sm">
                  Enable Escrow Payment
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment & Dispatch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {escrowEnabled && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">Escrow Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Payment held in escrow until delivery completion
                  </p>
                </div>
              )}
              {executed ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Contract Executed</span>
                  </div>
                  <Link href="/driver">
                    <Button className="w-full">View Driver Assignment</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full">
                      View Updated KPIs
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  onClick={handleExecute}
                  className="w-full"
                  size="lg"
                  disabled={loading || !convergedNegotiation || !recommendation || !load}
                >
                  {loading ? 'Executing...' : 'Execute & Dispatch'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

