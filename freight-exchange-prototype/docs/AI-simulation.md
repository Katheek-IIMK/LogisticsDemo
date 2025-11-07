# AI Simulation Documentation

This document describes the deterministic heuristics and formulas used to simulate Generative AI and Agentic AI behaviors in the Freight Exchange prototype.

## Overview

The application simulates two types of AI:

1. **Generative AI**: Creates human-readable content and route summaries
2. **Agentic AI**: Makes autonomous decisions with transparent reasoning

All simulations are deterministic and explainable, making them suitable for investor demos without requiring actual ML models.

## Generative AI Simulation

### Route Synthesis (`synthesizeRoutes`)

**Purpose**: Creates optimal route recommendations by combining loads and trucks.

**Algorithm**:
1. For each truck, check equipment compatibility
2. Calculate detour distance from truck's current location to load origin
3. Filter trucks within acceptable detour window (50-150 km)
4. Compute feasibility score for each candidate
5. Generate route summary with natural language description
6. Return top 3 candidates sorted by feasibility

**Output Format**:
```
"Suggested milk-run: Pune→Satara→Bangalore — combines 20T reefer + 5T dry; est. revenue ₹62,000"
```

### NL Listing Generator (`generateListingText`)

**Purpose**: Converts structured form data into human-readable listings.

**Template-based approach**:
- Uses template strings with variable substitution
- Includes conditional clauses based on equipment requirements
- Formats dates and weights in readable format

## Agentic AI Simulation

### Feasibility Scoring (`computeFeasibility`)

**Formula**:
```typescript
feasibility = clamp(
  0.4 * capacityMatch +
  0.2 * (1 - detourKm/maxDetour) +
  0.2 * (1 - idleHours/24) +
  0.2 * complianceScore,
  0, 1
)
```

**Component Breakdown**:
- **Capacity Match (40%)**: Ratio of load weight to truck capacity (capped at 1.0)
- **Detour Score (20%)**: Inverse of detour distance (max 300 km)
- **Idle Hours Score (20%)**: Inverse of idle hours (max 24 hours)
- **Compliance Score (20%)**: Penalty for failed compliance rules (-0.25 per failure)

**Example**:
- Capacity: 18T/20T = 0.9
- Detour: 120km/300km = 0.6 → score = 0.4
- Idle: 4h/24h = 0.83 → score = 0.17
- Compliance: 0 failures = 1.0

Result: `0.4*0.9 + 0.2*0.4 + 0.2*0.17 + 0.2*1.0 = 0.754` (75.4%)

### Negotiation Agent (`simulateNegotiation`)

**Purpose**: Simulates bilateral negotiation between buyer and seller agents.

**Algorithm**:
1. Initialize with starting prices (buyer min, seller max)
2. For each round (max 5):
   - Buyer increases offer by concession rate (2% default)
   - Seller decreases offer by concession rate
   - Check convergence (price difference < ₹1,000)
   - Generate reasoning for each offer
3. If converged: status = 'converged'
4. If max rounds reached: status = 'failed'

**Concession Schedule**:
- Each agent concedes 2% of the price gap per round
- Agents respect their min/max price boundaries
- Reasoning includes: time constraints, fuel costs, driver hours, equipment match

**Example Reasoning**:
```
"Concession due to time window constraints"
"Current offer: ₹43,500"
"Willing to go up to ₹50,000"
```

### Execution Agent

**Purpose**: Automatically creates contracts and trips when negotiation succeeds.

**Actions**:
1. Extract final agreed price from negotiation
2. Create e-contract with buyer/seller details
3. Generate driver trip with checkpoints
4. Update KPIs:
   - Empty mile ratio decreases
   - Utilization increases
   - CO₂ saved increases

## Compliance Engine

**Rule Structure**:
```json
{
  "state": "MH",
  "maxAxleWeight": 12000,
  "restrictedHours": ["00:00", "06:00"],
  "permitRequired": ["oversized"]
}
```

**Checking Logic**:
- Verify weight against state limits
- Check pickup/delivery times against restrictions
- Flag permit requirements
- Return failed rules count

## Transparency & Explainability

All AI decisions include reasoning:

1. **Feasibility Cards**: Show breakdown of score components
2. **Negotiation Messages**: Include reasoning bullets for each offer
3. **Compliance Flags**: Surface rule violations in UI
4. **KPI Updates**: Animate changes with explanations

## Deterministic Behavior

All simulations are deterministic:
- Same inputs always produce same outputs
- No randomness or stochastic elements
- Formulas are auditable and transparent
- Suitable for demo purposes without actual ML

## Future: Real LLM Integration

To connect to real LLMs:

1. Add `LLM_MODE` environment variable
2. Create API endpoint `/api/llm` that proxies to OpenAI/Anthropic
3. Replace template functions with API calls
4. Keep deterministic fallback for demo mode

Example:
```typescript
if (process.env.LLM_MODE === 'openai') {
  return await fetch('/api/llm', {
    method: 'POST',
    body: JSON.stringify({ prompt, model: 'gpt-4' })
  });
} else {
  return generateListingText(formFields); // Fallback
}
```

