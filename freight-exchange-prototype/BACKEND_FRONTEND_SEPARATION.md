# Backend and Frontend Separation Guide

## Overview

The application has been restructured to separate backend processing from frontend presentation. This document explains the changes and how to use the new architecture.

## What Changed

### Before
- All logic was in frontend components
- Data stored only in browser localStorage
- No API layer
- Business logic mixed with UI code

### After
- **Backend**: Handles all business logic and data processing
- **API Layer**: RESTful endpoints for communication
- **Frontend**: Focuses on UI and user interaction
- **Data Store**: Backend manages persistent storage

## Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (React/Next.js)        │
│  - UI Components                        │
│  - State Management (Zustand)          │
│  - API Client                           │
└─────────────────┬───────────────────────┘
                  │ HTTP Requests
                  ↓
┌─────────────────────────────────────────┐
│         API Layer (Next.js Routes)      │
│  - /api/loads                           │
│  - /api/recommendations                 │
│  - /api/negotiations                   │
│  - /api/trips                          │
│  - /api/kpis                           │
│  - /api/ai/*                           │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│      Backend Services                   │
│  - LoadService                          │
│  - RecommendationService                │
│  - NegotiationService                   │
│  - TripService                          │
│  - AIService                            │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│      Data Store (File/Database)        │
│  - Persistent storage                   │
│  - Data retrieval                      │
└─────────────────────────────────────────┘
```

## Key Files

### Backend Files
- `lib/backend/data-store.ts` - Data persistence layer
- `lib/backend/services.ts` - Business logic services
- `app/api/**/*.ts` - API route handlers

### Frontend Files
- `lib/api-client.ts` - HTTP client for API calls
- `lib/store.ts` - State management (syncs with backend)
- `app/**/page.tsx` - UI components

## Usage Examples

### Creating a Load (Frontend)

```typescript
// In a component
const addLoad = useAppStore((state) => state.addLoad);

const handleCreate = async () => {
  try {
    const load = await addLoad({
      origin: 'Hyderabad',
      destination: 'Guntur',
      loadType: '20T Reefer',
      weight: 20000,
      createdBy: 'load-owner',
    });
    console.log('Load created:', load.id);
  } catch (error) {
    console.error('Failed to create load:', error);
  }
};
```

### Backend Processing

```typescript
// In lib/backend/services.ts
export class LoadService {
  async createLoad(loadData) {
    // Business logic here
    const load = {
      ...loadData,
      id: `load_${Date.now()}`,
      status: 'listed',
      createdAt: new Date().toISOString(),
    };
    // Persist to storage
    return dataStore.createLoad(load);
  }
}
```

### API Route Handler

```typescript
// In app/api/loads/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const load = await loadService.createLoad(body);
  return NextResponse.json(load, { status: 201 });
}
```

## Data Flow Example

1. **User clicks "Create Load"** in frontend
2. **Component calls** `addLoad()` from store
3. **Store calls** `apiClient.createLoad()`
4. **API Client sends** POST request to `/api/loads`
5. **API Route receives** request and calls `LoadService.createLoad()`
6. **Service processes** business logic and calls `dataStore.createLoad()`
7. **Data Store saves** to file/database
8. **Response flows back** through all layers
9. **Store updates** local state
10. **Component re-renders** with new data

## Benefits

1. **Separation of Concerns**: Business logic separate from UI
2. **Scalability**: Backend can be moved to separate server
3. **Testability**: Each layer can be tested independently
4. **Maintainability**: Clear boundaries between layers
5. **Flexibility**: Easy to swap storage or add features

## Migration Notes

### Store Methods Are Now Async

All store methods that interact with backend are now async:

```typescript
// Before
addLoad(load); // Synchronous

// After
await addLoad(load); // Async
```

### Error Handling

Always wrap API calls in try-catch:

```typescript
try {
  const result = await addLoad(load);
} catch (error) {
  // Handle error
}
```

### Syncing Data

Use sync methods to refresh from backend:

```typescript
// Sync all data
await useAppStore.getState().syncAll();

// Or sync specific data
await useAppStore.getState().syncLoads();
```

## Next Steps

1. **Update Components**: Make sure all components handle async operations
2. **Add Error Handling**: Wrap API calls in try-catch blocks
3. **Add Loading States**: Show loading indicators during API calls
4. **Test API Endpoints**: Verify all endpoints work correctly
5. **Consider Database**: Replace file storage with database if needed

## Deployment

### Same Server (Current)
- Backend and frontend in same Next.js app
- Works out of the box

### Separate Servers (Future)
1. Move `/app/api/` to separate Express/Fastify server
2. Update `NEXT_PUBLIC_API_URL` in frontend
3. Deploy backend and frontend separately

## Troubleshooting

### API Calls Failing
- Check that API routes are accessible
- Verify data directory exists and is writable
- Check browser console for errors

### Data Not Persisting
- Verify `data/` directory exists
- Check file permissions
- Look for errors in server logs

### Store Not Updating
- Ensure async/await is used
- Check for error handling
- Verify API responses are correct

