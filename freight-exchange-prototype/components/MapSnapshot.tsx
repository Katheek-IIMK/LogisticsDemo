'use client';

import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface MapSnapshotProps {
  origin: string;
  destination: string;
  distanceKm: number;
  detourKm: number;
}

export function MapSnapshot({ origin, destination, distanceKm, detourKm }: MapSnapshotProps) {
  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Route Overview</span>
        </div>
        <div className="relative h-32 bg-muted rounded-lg flex items-center justify-center">
          {/* Simplified map visualization */}
          <div className="flex items-center gap-2 w-full px-4">
            <div className="flex-1 text-center">
              <div className="text-xs font-semibold">{origin}</div>
              <div className="text-xs text-muted-foreground">Origin</div>
            </div>
            <div className="flex-1 border-t-2 border-dashed border-primary relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-background px-1 text-xs text-muted-foreground">
                {distanceKm} km
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-xs font-semibold">{destination}</div>
              <div className="text-xs text-muted-foreground">Destination</div>
            </div>
          </div>
        </div>
        {detourKm > 0 && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Detour: {detourKm} km
          </div>
        )}
      </CardContent>
    </Card>
  );
}


