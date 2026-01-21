import request from 'supertest';
import express, { Express } from 'express';
import quotesRouter from '../../infrastructure/routes/quotes.routes';

/**
 * Integration tests for validation middleware in quotes endpoint
 * Verifies Task 2.4 from HU-02 plan: "Add validation middleware to POST /api/quotes route"
 */
// Helper function to get future date string
const getFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

describe('POST /api/quotes - Validation Middleware Integration (HU-02)', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Mount router at /api/quotes to match app.ts configuration
    app.use('/api/quotes', quotesRouter);
  });

  describe('Valid requests', () => {
    it('should pass validation and return quotes for valid input', async () => {
      const validRequest = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 5.5,
        pickupDate: getFutureDate(5), // 5 days from now
        fragile: false,
      };

      const response = await request(app)
        .post('/api/quotes')
        .send(validRequest);

      // Should not return validation error (400)
      expect(response.status).not.toBe(400);
      
      // Should either succeed (200) or have provider issues (503)
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('Invalid weight validation', () => {
    it('should return 400 when weight is below minimum', async () => {
      const invalidRequest = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 0.05, // Below 0.1 kg minimum
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      const response = await request(app)
        .post('/api/quotes')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('peso');
      expect(response.body.field).toBe('weight');
    });

    it('should return 400 when weight exceeds maximum', async () => {
      const invalidRequest = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 1001, // Above 1000 kg maximum
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      const response = await request(app)
        .post('/api/quotes')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('peso');
      expect(response.body.field).toBe('weight');
    });
  });

  describe('Invalid date validation', () => {
    it('should return 400 when pickupDate is in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const invalidRequest = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 5,
        pickupDate: yesterday.toISOString().split('T')[0],
        fragile: false,
      };

      const response = await request(app)
        .post('/api/quotes')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('fecha');
      expect(response.body.field).toBe('pickupDate');
    });

    it('should return 400 when pickupDate is more than 30 days ahead', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 35); // Clearly over the 30-day limit
      
      const invalidRequest = {
        origin: 'Bogotá',
        destination: 'Medellín',
        weight: 5,
        pickupDate: futureDate.toISOString().split('T')[0],
        fragile: false,
      };

      const response = await request(app)
        .post('/api/quotes')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('fecha');
      expect(response.body.field).toBe('pickupDate');
    });
  });

  describe('Missing required fields', () => {
    it('should return 400 when origin is missing', async () => {
      const invalidRequest = {
        origin: '',
        destination: 'Medellín',
        weight: 5,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      const response = await request(app)
        .post('/api/quotes')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('origen');
      expect(response.body.field).toBe('origin');
    });

    it('should return 400 when destination is missing', async () => {
      const invalidRequest = {
        origin: 'Bogotá',
        destination: '',
        weight: 5,
        pickupDate: getFutureDate(5),
        fragile: false,
      };

      const response = await request(app)
        .post('/api/quotes')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('destino');
      expect(response.body.field).toBe('destination');
    });
  });
});
