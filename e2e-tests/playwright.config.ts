import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Logistics Optimizer E2E Tests
 * 
 * BDD Testing Strategy:
 * - Tests organized by business features (quote, shipment, warehouse)
 * - Uses Page Object Model for maintainability
 * - Captures video, screenshots, and traces for debugging
 * - Tags: @smoke for critical paths, @regression for full coverage
 */
export default defineConfig({
  testDir: './tests',
  
  /* Maximum time one test can run for */
  timeout: 60 * 1000, // Reduced from 120s to 60s
  
  /* Run tests in files in parallel */
  fullyParallel: false,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests for database consistency */
  workers: 1,
  
  /* Global timeout for entire test run */
  globalTimeout: 10 * 60 * 1000, // 10 minutes total
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:5173',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure and on success for documentation */
    screenshot: 'on',
    
    /* Video for all tests to showcase the application */
    video: 'on',
    
    /* Action timeout */
    actionTimeout: 20000,
    
    /* Navigation timeout */
    navigationTimeout: 20000,
    
    /* Viewport size */
    viewport: { width: 1920, height: 1080 },
  },
  
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: process.env.HEADLESS !== 'false',
      },
    },
  ],
  
  /* Run your local dev server before starting the tests */
  // Assuming Docker Compose is already running the frontend on port 5173
  // and backend on port 3000
});
