/**
 * Individual Recommendation API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackendDataStore } from '@/lib/backend/data-store';

const dataStore = BackendDataStore.getInstance();

// GET /api/recommendations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recommendation = await dataStore.getRecommendation(id);
    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(recommendation);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recommendation' },
      { status: 500 }
    );
  }
}

// PUT /api/recommendations/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const recommendation = await dataStore.updateRecommendation(id, updates);
    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(recommendation);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}

