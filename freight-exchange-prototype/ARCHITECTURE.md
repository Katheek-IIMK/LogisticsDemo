# Architecture Documentation

## Overview

This application follows a **separation of concerns** architecture with distinct backend and frontend layers.

## Architecture Layers

### 1. Backend Layer (`/lib/backend/`)

The backend handles all business logic and data processing:

#### Data Store (`data-store.ts`)
- **Purpose**: Handles data persistence and retrieval
- **Storage**: File-based JSON storage (can be replaced with database)
- **Location**: `data/store.json`
- **Features**:
  - Singleton pattern for consistent state
  - Automatic persistence on every write
  - Async initialization

#### Business Services (`services.ts`)
- **LoadService**: Creates and manages loads
- **RecommendationService**: Handles load-to-fleet matching
- **NegotiationService**: Manages negotiation logic and execution
- **TripService**: Creates and manages trips
- **AIService**: Handles AI predictions and fleet discovery

### 2. API Layer (`/app/api/`)

RESTful API endpoints using Next.js API Routes:

#### Endpoints

**Loads:**
- `GET /api/loads` - Get all loads
- `POST /api/loads` - Create a load
- `GET /api/loads/[id]` - Get specific load
- `PUT /api/loads/[id]` - Update load

**Recommendations:**
- `GET /api/recommendations` - Get all recommendations
- `POST /api/recommendations` - Create recommendation
- `GET /api/recommendations/[id]` - Get specific recommendation
- `PUT /api/recommendations/[id]` - Update recommendation

**Negotiations:**
- `GET /api/negotiations` - Get all negotiations
- `POST /api/negotiations` - Create negotiation
- `GET /api/negotiations/[id]` - Get specific negotiation
- `PUT /api/negotiations/[id]` - Update negotiation
- `POST /api/negotiations/[id]/start` - Start negotiation process

**Trips:**
- `GET /api/trips` - Get all trips
- `POST /api/trips` - Create trip
- `GET /api/trips/[id]` - Get specific trip
- `PUT /api/trips/[id]` - Update trip

**KPIs:**
- `GET /api/kpis` - Get current KPIs
- `PUT /api/kpis` - Update KPIs

**AI Services:**
- `POST /api/ai/predict-price` - Predict price for a load
- `POST /api/ai/discover-fleets/[loadId]` - Discover fleets for a load

### 3. Frontend Layer

#### API Client (`/lib/api-client.ts`)
- **Purpose**: Centralized HTTP client for all API calls
- **Features**:
  - Type-safe API methods
  - Error handling
  - Consistent request/response handling

#### State Management (`/lib/store.ts`)
- **Purpose**: Frontend state management with Zustand
- **Features**:
  - Syncs with backend API
  - Local caching for performance
  - Automatic persistence to localStorage
  - Sync methods to refresh from backend

#### UI Components (`/app/` and `/components/`)
- **Purpose**: User interface and visual presentation
- **Features**:
  - React components
  - Client-side interactivity
  - Calls API through store methods

## Data Flow

```
User Action (Frontend)
    ↓
Component calls Store method
    ↓
Store method calls API Client
    ↓
API Client makes HTTP request
    ↓
API Route receives request
    ↓
API Route calls Backend Service
    ↓
Backend Service uses Data Store
    ↓
Data Store persists to file/database
    ↓
Response flows back through layers
    ↓
Store updates local state
    ↓
Component re-renders with new data
```

## Key Benefits

1. **Separation of Concerns**: Business logic separated from UI
2. **Scalability**: Backend can be moved to separate server
3. **Testability**: Each layer can be tested independently
4. **Maintainability**: Clear boundaries between layers
5. **Flexibility**: Easy to swap storage (file → database)
6. **Type Safety**: TypeScript throughout all layers

## Migration Path

### Current State
- Backend and frontend in same Next.js app
- File-based storage
- All layers in one codebase

### Future Options

1. **Separate Backend Server**
   - Move `/app/api/` to Express/Fastify server
   - Update API_BASE_URL in frontend
   - Deploy separately

2. **Database Integration**
   - Replace `data-store.ts` with database adapter
   - Use PostgreSQL, MongoDB, or other database
   - Keep same service interfaces

3. **Microservices**
   - Split services into separate services
   - Use message queue for communication
   - Independent scaling

## File Structure

```
freight-exchange-prototype/
├── app/
│   ├── api/              # Backend API routes
│   │   ├── loads/
│   │   ├── recommendations/
│   │   ├── negotiations/
│   │   ├── trips/
│   │   ├── kpis/
│   │   └── ai/
│   └── [pages]/          # Frontend pages
├── lib/
│   ├── backend/          # Backend logic
│   │   ├── data-store.ts
│   │   └── services.ts
│   ├── api-client.ts     # Frontend API client
│   └── store.ts          # Frontend state
├── components/           # UI components
└── data/                # Backend data storage
    └── store.json
```

## Environment Variables

```env
# Optional: For separate backend deployment
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Development Workflow

1. **Backend Changes**: Modify `/lib/backend/` or `/app/api/`
2. **Frontend Changes**: Modify `/app/[pages]/` or `/components/`
3. **API Changes**: Update both API routes and API client
4. **Testing**: Test each layer independently

## Best Practices

1. **Backend**: Keep business logic in services, not API routes
2. **Frontend**: Use store methods, not direct API calls
3. **Error Handling**: Handle errors at each layer
4. **Type Safety**: Use TypeScript types throughout
5. **Async Operations**: All store methods are async

