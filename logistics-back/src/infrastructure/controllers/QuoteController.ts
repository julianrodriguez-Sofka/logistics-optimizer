import { Request, Response } from 'express';
import { QuoteService } from '../../application/services/QuoteService';
import { BadgeService } from '../../application/services/BadgeService';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';

export class QuoteController {
  constructor(
    private readonly quoteService: QuoteService,
    private readonly badgeService: BadgeService
  ) {}

  /**
   * Handle POST /api/quotes request
   */
  async requestQuotes(req: Request, res: Response): Promise<void> {
    try {
      // Validate and create QuoteRequest entity
      const quoteRequest = new QuoteRequest({
        origin: req.body.origin,
        destination: req.body.destination,
        weight: req.body.weight,
        pickupDate: new Date(req.body.pickupDate),
        fragile: req.body.fragile,
      });

      // Get quotes from all providers
      const quotes = await this.quoteService.getAllQuotes(quoteRequest);

      // Check if any providers responded
      if (quotes.length === 0) {
        res.status(503).json({
          error: 'Service unavailable. No providers are currently available. Please try again later.',
        });
        return;
      }

      // Assign badges (cheapest, fastest)
      const quotesWithBadges = this.badgeService.assignBadges(quotes);

      // Return standardized response
      res.status(200).json({
        quotes: quotesWithBadges.map(quote => ({
          providerId: quote.providerId,
          providerName: quote.providerName,
          price: quote.price,
          currency: quote.currency,
          minDays: quote.minDays,
          maxDays: quote.maxDays,
          estimatedDays: quote.estimatedDays,
          transportMode: quote.transportMode,
          isCheapest: quote.isCheapest,
          isFastest: quote.isFastest,
        })),
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        res.status(400).json({
          error: error.message,
        });
      } else {
        res.status(500).json({
          error: 'An unexpected error occurred',
        });
      }
    }
  }
}
