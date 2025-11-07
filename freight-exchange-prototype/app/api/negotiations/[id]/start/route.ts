/**
 * Start Negotiation API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { NegotiationService } from '@/lib/backend/services';

const negotiationService = new NegotiationService();

// POST /api/negotiations/[id]/start - Start negotiation process
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const negotiation = await negotiationService.startNegotiation(id);
    return NextResponse.json(negotiation);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to start negotiation' },
      { status: 500 }
    );
  }
}

