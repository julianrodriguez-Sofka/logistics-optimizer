import { IShippingProvider } from '../../domain/interfaces/IShippingProvider';
import { Quote } from '../../domain/entities/Quote';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import { withTimeout } from '../utils/timeout';

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

  constructor(private readonly providers: IShippingProvider[]) {}

  /**
   * Get quotes from all available providers with error messages
   * Uses Promise.allSettled to handle partial failures gracefully
   * @param request - Quote request with shipping details
   * @returns Object with quotes array and messages array for failed providers
   */
  async getAllQuotesWithMessages(request: QuoteRequest): Promise<IQuoteResponse> {
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

        // Log error for monitoring (in production, use proper logging)
        console.error('Provider failed:', result.reason);
      }
    }

    return { quotes, messages };
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
