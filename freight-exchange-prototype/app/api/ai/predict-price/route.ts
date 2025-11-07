/**
 * AI Price Prediction API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/backend/services';

const aiService = new AIService();

// POST /api/ai/predict-price - Predict price for a load
export async function POST(request: NextRequest) {
  try {
    const { origin, destination, loadType, weight } = await request.json();
    const prediction = await aiService.predictPrice({ origin, destination, loadType, weight } as any);
    // Convert to match API client expected format
    return NextResponse.json({
      priceMin: prediction.min,
      priceMax: prediction.max,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to predict price' },
      { status: 500 }
    );
  }
}

