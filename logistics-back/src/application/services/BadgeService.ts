// HUMAN REVIEW
/**
 * Analiza las cotizaciones y marca las cotizaciones con "isCheapest" de que es el mas barato y "isFastest" 
 * de que es el mas rapido.
 * 
 */

import { Quote } from '../../domain/entities/Quote';

export class BadgeService {
  /**
   * Assign isCheapest and isFastest badges to quotes
   * Returns new Quote instances without mutating the input
   * @param quotes - Array of quotes to process
   * @returns Array of new quotes with badges assigned
   */
  assignBadges(quotes: Quote[]): Quote[] {
    if (quotes.length === 0) {
      return [];
    }

    // Find cheapest quote (lowest price)
    let cheapestIndex = 0;
    let lowestPrice = quotes[0].price;
    
    for (let i = 1; i < quotes.length; i++) {
      if (quotes[i].price < lowestPrice) {
        lowestPrice = quotes[i].price;
        cheapestIndex = i;
      }
    }

    // Find fastest quote (lowest estimatedDays)
    let fastestIndex = 0;
    let lowestDays = quotes[0].estimatedDays;
    
    for (let i = 1; i < quotes.length; i++) {
      if (quotes[i].estimatedDays < lowestDays) {
        lowestDays = quotes[i].estimatedDays;
        fastestIndex = i;
      }
    }

    // Create new Quote instances with badges assigned
    return quotes.map((quote, index) => {
      return new Quote({
        providerId: quote.providerId,
        providerName: quote.providerName,
        price: quote.price,
        currency: quote.currency,
        minDays: quote.minDays,
        maxDays: quote.maxDays,
        transportMode: quote.transportMode,
        isCheapest: index === cheapestIndex,
        isFastest: index === fastestIndex,
      });
    });
  }
}
