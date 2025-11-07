/**
 * AI Fleet Discovery API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/backend/services';

const aiService = new AIService();

// POST /api/ai/discover-fleets/[loadId] - Discover fleets for a load
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ loadId: string }> }
) {
  try {
    const { loadId } = await params;
    const recommendations = await aiService.discoverFleets(loadId);
    return NextResponse.json(recommendations);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to discover fleets' },
      { status: 500 }
    );
  }
}

