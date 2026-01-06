import { Quote } from '../../domain/entities/Quote';

export class BadgeService {
  /**
   * Assign isCheapest and isFastest badges to quotes
   * @param quotes - Array of quotes to process
   * @returns Array of quotes with badges assigned
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

    // Assign badges
    quotes[cheapestIndex].isCheapest = true;
    quotes[fastestIndex].isFastest = true;

    return quotes;
  }
}
