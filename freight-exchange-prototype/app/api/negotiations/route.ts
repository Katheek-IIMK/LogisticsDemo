/**
 * Negotiations API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackendDataStore } from '@/lib/backend/data-store';
import { NegotiationService } from '@/lib/backend/services';

const dataStore = BackendDataStore.getInstance();
const negotiationService = new NegotiationService();

// GET /api/negotiations - Get all negotiations
export async function GET() {
  try {
    const negotiations = await dataStore.getNegotiations();
    return NextResponse.json(negotiations);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch negotiations' },
      { status: 500 }
    );
  }
}

// POST /api/negotiations - Create a new negotiation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recommendationId,
      buyerAgent,
      sellerAgent,
      recommendationSnapshot,
      loadSnapshot,
      negotiationSnapshot,
    } = body;
    const negotiation = await negotiationService.createNegotiation(
      recommendationId,
      buyerAgent,
      sellerAgent,
      recommendationSnapshot,
      loadSnapshot,
      negotiationSnapshot
    );
    return NextResponse.json(negotiation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create negotiation' },
      { status: 500 }
    );
  }
}

