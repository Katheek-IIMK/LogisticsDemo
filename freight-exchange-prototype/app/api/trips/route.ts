/**
 * Trips API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackendDataStore } from '@/lib/backend/data-store';
import { TripService } from '@/lib/backend/services';

const dataStore = BackendDataStore.getInstance();
const tripService = new TripService();

// GET /api/trips - Get all trips
export async function GET() {
  try {
    const trips = await dataStore.getTrips();
    return NextResponse.json(trips);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loadId, recommendationId, loadSnapshot, recommendationSnapshot, ...tripData } = body;
    const trip = await tripService.createTrip(
      loadId,
      recommendationId,
      tripData,
      {
        loadSnapshot,
        recommendationSnapshot,
      }
    );
    return NextResponse.json(trip, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create trip' },
      { status: 500 }
    );
  }
}

