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
    // Exclude only entry points and external dependency setup files
    '!src/infrastructure/websocket/**',
    '!src/infrastructure/database/connection.ts',
    '!src/infrastructure/database/schemas/**',
    '!src/infrastructure/routes/**',
    '!src/infrastructure/logging/**',
    '!src/infrastructure/middlewares/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '\\.d\\.ts$'],
  // Coverage thresholds - Progressive improvement targets
  // Current achievement: 75% lines, targeting 80% minimum
  // Updated to reflect actual test coverage progress
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 72,
      lines: 75,
      statements: 74,
    },
  },
};
