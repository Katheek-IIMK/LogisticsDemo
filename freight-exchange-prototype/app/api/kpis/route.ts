/**
 * KPIs API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackendDataStore } from '@/lib/backend/data-store';

const dataStore = BackendDataStore.getInstance();

// GET /api/kpis - Get current KPIs
export async function GET() {
  try {
    const kpis = await dataStore.getKPIs();
    return NextResponse.json(kpis);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}

// PUT /api/kpis - Update KPIs
export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    const kpis = await dataStore.updateKPIs(updates);
    return NextResponse.json(kpis);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update KPIs' },
      { status: 500 }
    );
  }
}

