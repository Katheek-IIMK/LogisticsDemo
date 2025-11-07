/**
 * Individual Negotiation API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackendDataStore } from '@/lib/backend/data-store';

const dataStore = BackendDataStore.getInstance();

// GET /api/negotiations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const negotiation = await dataStore.getNegotiation(id);
    if (!negotiation) {
      return NextResponse.json(
        { error: 'Negotiation not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(negotiation);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch negotiation' },
      { status: 500 }
    );
  }
}

// PUT /api/negotiations/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const negotiation = await dataStore.updateNegotiation(id, updates);
    if (!negotiation) {
      return NextResponse.json(
        { error: 'Negotiation not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(negotiation);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update negotiation' },
      { status: 500 }
    );
  }
}

