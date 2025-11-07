import { Negotiation, NegotiationOffer } from '@/types';

interface Agent {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  concessionRate: number; // Percentage to concede per round
}

export function simulateNegotiation(
  buyerAgent: Agent,
  sellerAgent: Agent,
  initialBuyerPrice: number,
  initialSellerPrice: number
): NegotiationOffer[] {
  const offers: NegotiationOffer[] = [];
  const maxRounds = 100; // Unlimited rounds (high limit to prevent infinite loops)

  let buyerOffer = initialBuyerPrice;
  let sellerOffer = initialSellerPrice;
  let round = 1;

  // Calculate target convergence price (average of min and max acceptable)
  const targetPrice = Math.round((buyerAgent.maxPrice + sellerAgent.minPrice) / 2);
  
  // Dynamic concession rates
  let dynamicBuyerConcession = buyerAgent.concessionRate || 2;
  let dynamicSellerConcession = sellerAgent.concessionRate || 2;

  // Start with initial offers
  offers.push({
    id: `offer_${round}_buyer`,
    agentId: buyerAgent.id,
    agentName: buyerAgent.name,
    price: Math.round(buyerOffer),
    reasoning: [
      `Initial offer based on market rates and time constraints`,
      `Current offer: ₹${Math.round(buyerOffer).toLocaleString()}`,
    ],
    timestamp: new Date(),
    round,
  });

  round++;

  offers.push({
    id: `offer_${round}_seller`,
    agentId: sellerAgent.id,
    agentName: sellerAgent.name,
    price: Math.round(sellerOffer),
    reasoning: [
      `Initial counter-offer considering fuel costs and driver hours`,
      `Current offer: ₹${Math.round(sellerOffer).toLocaleString()}`,
    ],
    timestamp: new Date(),
    round,
  });

  round++;

  while (round <= maxRounds) {
    // Buyer makes offer
    if (buyerOffer < sellerOffer) {
      buyerOffer = Math.min(
        buyerOffer + (sellerOffer - buyerOffer) * (dynamicBuyerConcession / 100),
        buyerAgent.maxPrice
      );
      offers.push({
        id: `offer_${round}_buyer`,
        agentId: buyerAgent.id,
        agentName: buyerAgent.name,
        price: Math.round(buyerOffer),
        reasoning: [
          `Increasing offer due to time window constraints`,
          `Current offer: ₹${Math.round(buyerOffer).toLocaleString()}`,
        ],
        timestamp: new Date(),
        round,
      });
    }

    // Check if converged (within 1000 rupees)
    if (Math.abs(buyerOffer - sellerOffer) < 1000) {
      // Add final converging offer
      const finalPrice = Math.round((buyerOffer + sellerOffer) / 2);
      if (buyerOffer < sellerOffer) {
        offers.push({
          id: `offer_${round}_converged`,
          agentId: buyerAgent.id,
          agentName: buyerAgent.name,
          price: finalPrice,
          reasoning: [
            `Agreement reached at ₹${finalPrice.toLocaleString()}`,
            `Price difference is acceptable`,
          ],
          timestamp: new Date(),
          round,
        });
      }
      break;
    }

    // Seller makes counter-offer
    if (sellerOffer > buyerOffer) {
      sellerOffer = Math.max(
        sellerOffer - (sellerOffer - buyerOffer) * (dynamicSellerConcession / 100),
        sellerAgent.minPrice
      );
      offers.push({
        id: `offer_${round}_seller`,
        agentId: sellerAgent.id,
        agentName: sellerAgent.name,
        price: Math.round(sellerOffer),
        reasoning: [
          `Reducing price due to fuel delta and driver hours`,
          `Current offer: ₹${Math.round(sellerOffer).toLocaleString()}`,
        ],
        timestamp: new Date(),
        round,
      });
    }

    // Check if converged again after seller's offer
    if (Math.abs(buyerOffer - sellerOffer) < 1000) {
      const finalPrice = Math.round((buyerOffer + sellerOffer) / 2);
      offers.push({
        id: `offer_${round}_converged`,
        agentId: sellerAgent.id,
        agentName: sellerAgent.name,
        price: finalPrice,
        reasoning: [
          `Agreement reached at ₹${finalPrice.toLocaleString()}`,
          `Price difference is acceptable`,
        ],
        timestamp: new Date(),
        round,
      });
      break;
    }

    // Increase concession rates slightly if not converging fast enough
    if (round > 10 && Math.abs(buyerOffer - sellerOffer) > 5000) {
      dynamicBuyerConcession = Math.min(dynamicBuyerConcession * 1.1, 5);
      dynamicSellerConcession = Math.min(dynamicSellerConcession * 1.1, 5);
    }

    round++;
  }

  return offers;
}

export function getNegotiationStatus(
  negotiation: Negotiation
): 'active' | 'converged' | 'failed' | 'escalated' {
  if (negotiation.status !== 'active') {
    return negotiation.status;
  }

  if (negotiation.offers.length === 0) {
    return 'active';
  }

  const lastTwoOffers = negotiation.offers.slice(-2);
  if (lastTwoOffers.length === 2) {
    const [offer1, offer2] = lastTwoOffers;
    const priceDiff = Math.abs(offer1.price - offer2.price);
    if (priceDiff < 1000) {
      return 'converged';
    }
  }

  // Remove round limit check - negotiation can continue until convergence

  return 'active';
}

