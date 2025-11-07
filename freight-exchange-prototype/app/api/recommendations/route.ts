/**
 * Recommendations API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackendDataStore } from '@/lib/backend/data-store';
import { RecommendationService } from '@/lib/backend/services';

const dataStore = BackendDataStore.getInstance();
const recommendationService = new RecommendationService();

// GET /api/recommendations - Get all recommendations
export async function GET() {
  try {
    const recommendations = await dataStore.getRecommendations();
    return NextResponse.json(recommendations);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

// POST /api/recommendations - Create a new recommendation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loadId, loadSnapshot, ...recommendationData } = body;
    const recommendation = await recommendationService.createRecommendation(
      loadId,
      recommendationData,
      loadSnapshot
    );
    return NextResponse.json(recommendation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create recommendation' },
      { status: 500 }
    );
  }
}

