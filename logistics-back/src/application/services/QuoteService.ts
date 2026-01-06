import { IShippingProvider } from '../../domain/interfaces/IShippingProvider';
import { Quote } from '../../domain/entities/Quote';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';

export class QuoteService {
  private readonly FRAGILE_SURCHARGE = 1.15; // 15% surcharge
  private readonly TIMEOUT_MS = 5000; // 5 seconds timeout

  constructor(private readonly providers: IShippingProvider[]) {}

  /**
   * Get quotes from all available providers
   * Uses Promise.allSettled to handle partial failures gracefully
   * @param request - Quote request with shipping details
   * @returns Array of quotes from available providers
   */
  async getAllQuotes(request: QuoteRequest): Promise<Quote[]> {
    // Create timeout wrapper for each provider call
    const providerPromises = this.providers.map((provider) =>
      this.callProviderWithTimeout(provider, request)
    );

    // Use Promise.allSettled to handle failures gracefully
    const results = await Promise.allSettled(providerPromises);

    // Extract successful quotes
    const quotes: Quote[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        quotes.push(result.value);
      } else if (result.status === 'rejected') {
        // Log error for monitoring (in production, use proper logging)
        console.error('Provider failed:', result.reason);
      }
    }

    return quotes;
  }

  /**
   * Call a provider with timeout and fragile surcharge handling
   */
  private async callProviderWithTimeout(
    provider: IShippingProvider,
    request: QuoteRequest
  ): Promise<Quote> {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Provider timeout')), this.TIMEOUT_MS);
    });

    // Race between provider call and timeout
    const quotePromise = provider.calculateShipping(
      request.weight,
      request.destination
    );

    const quote = await Promise.race([quotePromise, timeoutPromise]);

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
