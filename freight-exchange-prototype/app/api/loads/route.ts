/**
 * Loads API Routes
 * Handles all load-related operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackendDataStore } from '@/lib/backend/data-store';
import { LoadService } from '@/lib/backend/services';
import { Load } from '@/types';

const dataStore = BackendDataStore.getInstance();
const loadService = new LoadService();

// GET /api/loads - Get all loads
export async function GET() {
  try {
    const loads = await dataStore.getLoads();
    return NextResponse.json(loads);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch loads' },
      { status: 500 }
    );
  }
}

// POST /api/loads - Create a new load
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const load = await loadService.createLoad(body);
    return NextResponse.json(load, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create load' },
      { status: 500 }
    );
  }
}

