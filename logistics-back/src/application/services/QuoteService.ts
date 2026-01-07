import { IShippingProvider } from '../../domain/interfaces/IShippingProvider';
import { Quote } from '../../domain/entities/Quote';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import { IQuoteRepository } from '../../domain/interfaces/IQuoteRepository';
import { withTimeout } from '../utils/timeout';
import { BadgeService } from './BadgeService';
import { logger } from '../../infrastructure/logging/Logger';

export interface IProviderMessage {
  provider: string;
  message: string;
  error?: string;
}

export interface IQuoteResponse {
  quotes: Quote[];
  messages: IProviderMessage[];
}

export class QuoteService {
  private readonly FRAGILE_SURCHARGE = 1.15; // 15% surcharge
  private readonly TIMEOUT_MS = 5000; // 5 seconds timeout
  private readonly badgeService: BadgeService;
  private readonly logger = logger;

  constructor(
    private readonly providers: IShippingProvider[],
    private readonly quoteRepository?: IQuoteRepository 
  ) {
    this.badgeService = new BadgeService();
  }

  /**
   * Get quotes from all available providers with error messages
   * Uses Promise.allSettled to handle partial failures gracefully
   * Implements caching with 5-minute TTL if repository is available
   * @param request - Quote request with shipping details
   * @returns Object with quotes array and messages array for failed providers
   */
  async getAllQuotesWithMessages(request: QuoteRequest): Promise<IQuoteResponse> {
    this.logger.info('Processing quote request', {
      origin: request.origin,
      destination: request.destination,
      weight: request.weight,
      fragile: request.fragile,
    });

    // Check cache first (if repository is available)
    if (this.quoteRepository) {
      try {
        const cachedQuotes = await this.quoteRepository.findCached(request);
        if (cachedQuotes && cachedQuotes.length > 0) {
          this.logger.info('Cache hit - returning cached quotes', { count: cachedQuotes.length });
          return { quotes: cachedQuotes, messages: [] };
        }
        this.logger.debug('Cache miss - fetching fresh quotes');
      } catch (error) {
        this.logger.error('Error checking cache', error);
        // Continue without cache on error
      }
    }

    // Create timeout wrapper for each provider call with provider metadata
    const providerPromises = this.providers.map((provider, index) =>
      this.callProviderWithTimeout(provider, request)
        .then(quote => ({ 
          status: 'fulfilled' as const, 
          value: quote, 
          providerIndex: index,
          providerName: quote.providerName 
        }))
        .catch(error => ({ 
          status: 'rejected' as const, 
          reason: error, 
          providerIndex: index,
          providerName: this.getProviderName(index)
        }))
    );

    // Use Promise.all since we wrapped the promises
    const results = await Promise.all(providerPromises);

    // Extract successful quotes and failed providers
    const quotes: Quote[] = [];
    const messages: IProviderMessage[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        quotes.push(result.value);
      } else if (result.status === 'rejected') {
        const providerName = result.providerName || `Provider ${result.providerIndex + 1}`;
        const errorMessage = result.reason?.message || 'Provider unavailable';
        
        messages.push({
          provider: providerName,
          message: `${providerName} is not available at this time`,
          error: errorMessage,
        });

        // Log error for monitoring
        this.logger.error(`Provider ${providerName} failed`, result.reason);
      }
    }

    // Assign badges to quotes before returning
    const quotesWithBadges = this.badgeService.assignBadges(quotes);

    this.logger.info('Quotes processed successfully', {
      totalQuotes: quotesWithBadges.length,
      failedProviders: messages.length,
    });

    // Save quotes to database (if repository is available)
    if (this.quoteRepository && quotesWithBadges.length > 0) {
      try {
        console.log('💾 Attempting to save quotes to database...', {
          quoteCount: quotesWithBadges.length,
          hasRepository: !!this.quoteRepository
        });
        await this.quoteRepository.saveMany(quotesWithBadges, request);
        this.logger.info('Quotes saved to database');
        console.log('✅ Quotes saved successfully to MongoDB');
      } catch (error) {
        this.logger.error('Error saving quotes to database', error);
        console.error('❌ Error saving quotes to database:', error);
        // Don't fail the request if database save fails (graceful degradation)
      }
    } else {
      console.log('⚠️  Skipping database save:', {
        hasRepository: !!this.quoteRepository,
        quoteCount: quotesWithBadges.length
      });
    }

    return { quotes: quotesWithBadges, messages };
  }

  /**
   * Get quotes from all available providers (backwards compatibility)
   * @param request - Quote request with shipping details
   * @returns Array of quotes from available providers
   */
  async getAllQuotes(request: QuoteRequest): Promise<Quote[]> {
    const { quotes } = await this.getAllQuotesWithMessages(request);
    return quotes;
  }

  /**
   * Get provider name by index (helper method)
   */
  private getProviderName(index: number): string {
    // Use generic provider name since we can't reliably get the name when adapter fails
    return `Provider ${index + 1}`;
  }

  /**
   * Call a provider with timeout and fragile surcharge handling
   */
  private async callProviderWithTimeout(
    provider: IShippingProvider,
    request: QuoteRequest
  ): Promise<Quote> {
    // Use withTimeout utility for consistent timeout handling
    const quotePromise = provider.calculateShipping(
      request.weight,
      request.destination
    );

    const quote = await withTimeout(quotePromise, this.TIMEOUT_MS);

    // Apply fragile surcharge if needed
    if (request.fragile) {
      return this.applyFragileSurcharge(quote);
    }

    return quote;
  }

  /**
   * Apply fragile surcharge to a quote
   */
  private applyFragileSurcharge(quote: Quote): Quote {
    const newPrice = quote.price * this.FRAGILE_SURCHARGE;
    
    return new Quote({
      providerId: quote.providerId,
      providerName: quote.providerName,
      price: newPrice,
      currency: quote.currency,
      minDays: quote.minDays,
      maxDays: quote.maxDays,
      transportMode: quote.transportMode,
      isCheapest: quote.isCheapest,
      isFastest: quote.isFastest,
    });
  }
}
