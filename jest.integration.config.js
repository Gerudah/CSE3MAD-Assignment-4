/**
 * Jest config for Firestore integration tests.
 *
 * Prerequisites:
 *   firebase emulators:start --only firestore
 *   (default port 8080 — adjust FIRESTORE_EMULATOR_HOST below if different)
 *
 * Run:
 *   npm run test:integration
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.integration.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { allowJs: true } }],
  },
  testTimeout: 30000,
  // Point Firebase SDK at the local emulator
  globalSetup: undefined,
};
