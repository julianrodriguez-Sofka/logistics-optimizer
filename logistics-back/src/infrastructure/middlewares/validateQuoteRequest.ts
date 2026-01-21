import { Request, Response, NextFunction } from 'express';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import { ValidationError } from '../../domain/exceptions/ValidationError';

/**
 * Middleware to validate quote request data
 * Implements Task 2.3 from HU-02 plan
 */
export function validateQuoteRequest(req: Request, res: Response, next: NextFunction): void {
  try {
    // Attempt to create QuoteRequest entity (will throw if invalid)
    new QuoteRequest({
      origin: req.body.origin,
      destination: req.body.destination,
      weight: req.body.weight,
      pickupDate: new Date(req.body.pickupDate),
      fragile: req.body.fragile,
      transportMode: req.body.transportMode, // Pass transport mode
    });

    // If validation passes, continue to controller
    next();
  } catch (error) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: error.message,
        field: error.field,
        value: error.value,
      });
      return;
    }

    // Handle other errors
    if (error instanceof Error) {
      res.status(400).json({
        error: error.message,
      });
      return;
    }

    // Unknown error
    res.status(500).json({
      error: 'An unexpected error occurred during validation',
    });
  }
}
