# Quick Start Guide

## Start Development Server

```bash
cd freight-exchange-prototype
npm install
npm run dev
```

Visit http://localhost:3000

## Demo Flow

### Complete End-to-End Demo

1. **Landing Page** (`/`)
   - Select "Load Owner" role
   - Click "Enter Workspace"

2. **Dashboard** (`/dashboard`)
   - View KPIs: Empty Mile Ratio (35%), Utilization (68%), CO₂ Saved (1250 kg), Avg Revenue (₹45/ton-km)
   - View charts showing trends

3. **Matchmaking** (`/matchmaking`)
   - See AI recommendations with feasibility scores
   - Click "Negotiate" on any recommendation

4. **Negotiation** (`/negotiation`)
   - Click "Let Agents Negotiate"
   - Watch agents exchange offers (3-5 rounds)
   - Each offer shows reasoning bullets
   - When converged, click "Accept & Proceed to Execution"

5. **Execution** (`/execution`)
   - Review e-contract
   - Toggle escrow if desired
   - Click "Execute & Dispatch"
   - This creates a driver trip and updates KPIs

6. **Driver** (`/driver`)
   - See newly created trip
   - Click "Start Trip"
   - Mark checkpoints as "Arrived"
   - Complete trip when done

7. **Dashboard** (back to `/dashboard`)
   - Verify KPIs updated:
     - Empty Mile Ratio: 28% (was 35%)
     - Utilization: 75% (was 68%)
     - CO₂ Saved: 1350 kg (was 1250)

8. **Analytics** (`/analytics`)
   - View time series charts
   - Click "Simulate Disruption" to see self-healing scenario
   - See ROI breakdown

## Key Features to Demo

- ✅ All 7 pages are fully functional
- ✅ AI recommendations with feasibility scores
- ✅ Agent negotiation with reasoning
- ✅ Real-time KPI updates
- ✅ Interactive charts
- ✅ Driver trip management
- ✅ State persistence (refresh page to see)

## Troubleshooting

If you see any errors:
1. Make sure all dependencies are installed: `npm install`
2. Clear `.next` folder: `rm -rf .next` (or delete on Windows)
3. Restart dev server: `npm run dev`

## Next Steps

- Deploy to Vercel for production demo
- Customize mock data in `mockData/` folder
- Adjust AI simulation parameters in `lib/ai-simulation.ts`
- Add more features as needed

