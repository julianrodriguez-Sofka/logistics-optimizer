/**
 * Rate Limiting Middleware
 * Prevents abuse and brute-force attacks by limiting requests per IP
 */

import rateLimit from 'express-rate-limit';

/**
 * General rate limiter for all API routes
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health check endpoints
  skip: (req) => req.path === '/health' || req.path === '/api/health'
});

/**
 * Strict rate limiter for quote requests
 * 20 requests per 5 minutes per IP (prevents spam quotes)
 */
export const quoteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 quote requests per 5 minutes
  message: {
    error: 'Too many quote requests. Please wait before requesting more quotes.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Very strict rate limiter for shipment creation
 * 10 requests per 10 minutes per IP (prevents fraudulent shipments)
 */
export const shipmentCreationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 shipment creations per 10 minutes
  message: {
    error: 'Too many shipment requests. Please wait before creating more shipments.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authentication rate limiter (for future auth endpoints)
 * 5 attempts per 15 minutes per IP (prevents brute force)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
