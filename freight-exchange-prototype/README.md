# Federated Backhaul Freight Exchange

AI-powered freight exchange platform prototype for optimizing backhaul freight management.

## Features

- **AI Matchmaking**: Intelligent route synthesis and feasibility scoring
- **Agent Negotiation**: Automated negotiation with transparent reasoning
- **Real-time Analytics**: Live KPIs and performance tracking
- **Contract Execution**: E-contract management with escrow support
- **Driver Dashboard**: Trip management and checkpoint tracking

## Tech Stack

- **Next.js 15** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Zustand** for state management
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Script

### As Load Owner:

1. **Landing Page**: Select "Load Owner" role
2. **Dashboard**: View KPIs (Empty Mile Ratio, Utilization, CO₂ Saved, Avg Revenue)
3. **Matchmaking**: View AI recommendations
   - Click "Negotiate" on a recommendation
4. **Negotiation**: 
   - Click "Let Agents Negotiate" to start automated negotiation
   - Watch agents exchange offers with reasoning
   - Once converged, click "Accept & Proceed to Execution"
5. **Execution**: 
   - Review e-contract
   - Toggle escrow if desired
   - Click "Execute & Dispatch"
6. **Driver**: View the newly created trip assignment
7. **Dashboard**: Check updated KPIs (empty miles reduced, utilization increased)

### As Fleet Manager:

1. Follow similar flow from Fleet Manager perspective
2. Monitor fleet utilization metrics
3. Review negotiation outcomes

### As Driver:

1. **Driver Dashboard**: View assigned trips
2. Click "Start Trip" when ready
3. Mark checkpoints as "Arrived" during the trip
4. Complete trip when all checkpoints are done

## Project Structure

```
freight-exchange-prototype/
├── app/                    # Next.js app router pages
│   ├── dashboard/          # KPI dashboard
│   ├── matchmaking/        # AI recommendations
│   ├── negotiation/        # Agent negotiation
│   ├── execution/          # Contract execution
│   ├── analytics/          # Analytics & visualizations
│   └── driver/             # Driver dashboard
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   └── Navigation.tsx     # Main navigation
├── lib/                    # Core logic
│   ├── ai-simulation.ts   # AI simulation functions
│   ├── negotiation.ts     # Negotiation logic
│   ├── store.ts           # Zustand state management
│   └── utils.ts           # Utility functions
├── mockData/              # Mock JSON data
├── mockApi/               # Mock API functions
└── types/                 # TypeScript type definitions
```

## AI Simulation

The application simulates Generative AI and Agentic AI behaviors:

### Generative AI Simulation

- **Route Synthesis**: `synthesizeRoutes()` - Creates milk-run routes combining compatible loads
- **NL Listing Generation**: `generateListingText()` - Generates human-readable listings from structured data

### Agentic AI Simulation

- **Feasibility Scoring**: `computeFeasibility()` - Transparent scoring algorithm based on:
  - Capacity match (40%)
  - Detour distance (20%)
  - Idle hours (20%)
  - Compliance score (20%)
- **Negotiation Agents**: `simulateNegotiation()` - Deterministic negotiation with concession schedules
- **Execution Agent**: Automatic contract creation and trip assignment

## Key Algorithms

### Feasibility Score Formula

```typescript
feasibility = clamp(
  0.4 * capacityMatch +
  0.2 * (1 - detourKm/maxDetour) +
  0.2 * (1 - idleHours/24) +
  0.2 * complianceScore,
  0, 1
)
```

### Negotiation Loop

1. Agents start with initial offers
2. Each round, agents concede based on concession rate (2% default)
3. Negotiation converges when offers are within ₹1,000
4. Maximum 5 rounds before escalation

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Deploy automatically

### Manual Build

```bash
npm run build
npm start
```

## Acceptance Criteria

✅ All 7 routes exist and are navigable
✅ Matchmaking recommendations can be negotiated end-to-end
✅ KPIs update when trips are executed
✅ NL listing generator creates readable listings
✅ Negotiation shows at least 3 steps with reasoning
✅ Driver "Start Trip" updates trip status
✅ All buttons/links trigger state changes

## Future Enhancements

- Connect to real LLM APIs (OpenAI, Anthropic)
- Real-time GPS tracking
- Advanced compliance rule engine
- Multi-party negotiations
- Payment gateway integration

## License

This is a prototype/demo project.

## Documentation

See `docs/AI-simulation.md` (to be created) for detailed algorithm documentation.
