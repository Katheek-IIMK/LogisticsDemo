# Connected Flow Guide

This document explains how data flows seamlessly between different user roles in the platform.

## Overview

The platform now supports a **seamless, connected workflow** where data entered by one user appears in another user's workspace. All data is persisted using Zustand's persist middleware, so it remains available when switching between roles.

## Flow Sequence

### 1. Load Owner → Creates Shipment

**Steps:**
1. Navigate to `/load-owner` workspace
2. Fill in the "Create Shipment Request" form:
   - Origin (e.g., "Hyderabad")
   - Destination (e.g., "Guntur")
   - Load Type (e.g., "20T Reefer")
   - Weight (e.g., "20000")
   - Pickup Time
   - Delivery Time
3. Click "Submit Request & Proceed to Price Prediction"
4. The load is automatically saved to the shared store with status `listed`

**What Happens:**
- Load is created with unique ID
- Status set to `listed`
- Data persisted to localStorage
- Available for Fleet Manager to see

### 2. Fleet Manager → Views and Matches Loads

**Steps:**
1. Navigate to `/fleet-manager` workspace
2. Go to "Load Matching" step
3. You will see **all loads created by Load Owners** with status `listed`
4. Each load shows:
   - Route (Origin → Destination)
   - Load Type and Weight
   - Price Range (if predicted)
   - AI Match Score (75-95%)
5. Select a load and click "Select Load & Proceed to Compliance Check"

**What Happens:**
- Load status changes to `matched`
- A recommendation is created linking to the load
- Recommendation ID stored in load record

### 3. Fleet Manager → Negotiation

**Steps:**
1. Continue through Compliance, Feasibility steps
2. At "Negotiation Simulation" step, click "Open Negotiation Console"
3. This takes you to `/matchmaking` page
4. Click "Negotiate" on the recommendation
5. Agents negotiate and converge on a price

**What Happens:**
- Load status changes to `negotiating`
- Negotiation ID stored in load record
- When negotiation completes, load status changes to `approved`
- Finalized price stored in load record

### 4. Fleet Manager → Dispatch to Driver

**Steps:**
1. After negotiation, continue to "Review & Approve"
2. Proceed to "Driver Recommendation"
3. At "Dispatch & Route Activation" step:
   - Click "Dispatch Trip to Driver"
   - This creates a trip with:
     - Origin and Destination from the load
     - Payout from finalized price
     - Status `assigned`
   - Load status changes to `dispatched`

**What Happens:**
- Trip created in shared store
- Trip linked to load via `loadId`
- Trip visible to Driver immediately

### 5. Driver → Receives and Executes Trip

**Steps:**
1. Navigate to `/driver` workspace
2. You will see the trip in "Trip Briefing" step
3. Trip shows:
   - Route (from Load Owner's original entry)
   - Payout (from negotiated price)
   - All checkpoints
4. Follow through: Validation → Execution → Route Preview

**What Happens:**
- Driver can see all trip details
- Can update trip status (started, in-transit, completed)
- All updates reflected in shared store

## Data Persistence

All data is automatically persisted using Zustand's persist middleware:
- **Storage Key:** `freight-exchange-storage`
- **Persisted Data:**
  - Loads (all shipments)
  - Recommendations (matches)
  - Negotiations (price agreements)
  - Trips (driver assignments)
  - KPIs (performance metrics)

**Data persists across:**
- Page refreshes
- Role switches
- Browser sessions
- Navigation between pages

## Example Flow: Hyderabad → Guntur

1. **Load Owner:**
   - Creates shipment: Hyderabad → Guntur, 20T Reefer, 20000 kg
   - Gets price prediction: ₹35,000 - ₹42,000
   - Load saved with status `listed`

2. **Fleet Manager:**
   - Sees load in matching step: "Hyderabad → Guntur"
   - Selects load (91% match)
   - Goes through compliance, feasibility
   - Negotiates: Final price ₹38,500
   - Dispatches to driver

3. **Driver:**
   - Receives trip briefing: "Hyderabad → Guntur"
   - Payout: ₹38,500
   - Executes trip with checkpoints

## Key Features

✅ **Real-time Data Sharing:** Data entered by one user immediately available to others
✅ **Status Tracking:** Load status updates through workflow (listed → matched → negotiating → approved → dispatched)
✅ **Price Flow:** Price predicted → negotiated → finalized → paid to driver
✅ **Route Consistency:** Origin/Destination from Load Owner flows through to Driver
✅ **Persistent Storage:** All data saved to localStorage, survives refreshes

## Testing the Flow

1. **Start as Load Owner:**
   ```
   Home → Load Owner → Create Shipment (Hyderabad → Guntur)
   ```

2. **Switch to Fleet Manager:**
   ```
   Home → Fleet Manager → Load Matching → Select the load
   ```

3. **Complete Negotiation:**
   ```
   Continue workflow → Negotiation → Matchmaking → Negotiate
   ```

4. **Dispatch to Driver:**
   ```
   Review → Driver Recommendation → Dispatch
   ```

5. **View as Driver:**
   ```
   Home → Driver → See trip with Hyderabad → Guntur route
   ```

## Troubleshooting

**Q: Load not appearing in Fleet Manager?**
- Check that Load Owner completed "Create Shipment" step
- Verify load status is `listed` or `draft`
- Refresh the page to reload from localStorage

**Q: Trip not appearing for Driver?**
- Ensure Fleet Manager clicked "Dispatch Trip to Driver"
- Check trip status is `assigned`
- Verify trip is linked to load via `loadId`

**Q: Data not persisting?**
- Check browser localStorage is enabled
- Verify Zustand persist middleware is working
- Check browser console for errors

## Data Model

```
Load (created by Load Owner)
  ├── id: unique identifier
  ├── origin: "Hyderabad"
  ├── destination: "Guntur"
  ├── status: listed → matched → negotiating → approved → dispatched
  └── finalizedPrice: from negotiation

Recommendation (created by Fleet Manager)
  ├── id: unique identifier
  ├── loadId: links to Load
  └── priceSuggested: initial price

Negotiation (created during negotiation)
  ├── id: unique identifier
  ├── recommendationId: links to Recommendation
  └── finalizedPrice: agreed price

Trip (created by Fleet Manager dispatch)
  ├── id: unique identifier
  ├── loadId: links to Load
  ├── origin: from Load
  ├── destination: from Load
  └── payout: from Load.finalizedPrice
```

