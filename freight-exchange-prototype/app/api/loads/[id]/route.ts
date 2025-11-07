/**
 * Individual Load API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackendDataStore } from '@/lib/backend/data-store';

const dataStore = BackendDataStore.getInstance();

// GET /api/loads/[id] - Get a specific load
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const load = await dataStore.getLoad(id);
    if (!load) {
      return NextResponse.json(
        { error: 'Load not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(load);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch load' },
      { status: 500 }
    );
  }
}

// PUT /api/loads/[id] - Update a load
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const load = await dataStore.updateLoad(id, updates);
    if (!load) {
      return NextResponse.json(
        { error: 'Load not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(load);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update load' },
      { status: 500 }
    );
  }
}

