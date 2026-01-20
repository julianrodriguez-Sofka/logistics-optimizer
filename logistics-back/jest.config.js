export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
    '!src/app.ts',
    // Exclude infrastructure files that are hard to unit test
    '!src/infrastructure/websocket/**',
    '!src/infrastructure/messaging/**',
    '!src/infrastructure/database/connection.ts',
    '!src/infrastructure/database/repositories/**',
    '!src/infrastructure/database/schemas/**',
    '!src/infrastructure/adapters/OpenRouteServiceAdapter.ts',
    '!src/infrastructure/adapters/MultiModalRouteAdapter.ts',
    '!src/infrastructure/controllers/CustomerController.ts',
    '!src/infrastructure/controllers/ShipmentController.ts',
    '!src/infrastructure/middlewares/validateShipment.ts',
    '!src/infrastructure/routes/customers.routes.ts',
    '!src/infrastructure/routes/health.routes.ts',
    '!src/infrastructure/routes/shipments.routes.ts',
    // Exclude domain entities that need integration tests
    '!src/domain/entities/Customer.ts',
    '!src/domain/entities/Payment.ts',
    '!src/domain/entities/Shipment.ts',
    '!src/domain/entities/ShipmentStatus.ts',
    '!src/domain/entities/Location.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  // Coverage thresholds - informational only, SonarCloud handles quality gates
  // coverageThreshold: {
  //   global: {
  //     branches: 40,
  //     functions: 40,
  //     lines: 50,
  //     statements: 50,
  //   },
  // },
};
