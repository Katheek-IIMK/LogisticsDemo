/**
 * Individual Trip API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackendDataStore } from '@/lib/backend/data-store';

const dataStore = BackendDataStore.getInstance();

// GET /api/trips/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trip = await dataStore.getTrip(id);
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(trip);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}

// PUT /api/trips/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const trip = await dataStore.updateTrip(id, updates);
    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(trip);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update trip' },
      { status: 500 }
    );
  }
}

