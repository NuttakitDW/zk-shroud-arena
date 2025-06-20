const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setup.ts'],
  testEnvironment: 'jsdom',
  
  // Performance optimizations
  maxWorkers: process.env.CI ? 1 : '75%',
  bail: 1, // Stop on first failure for fast feedback
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false, // Faster than full reset
  forceExit: true, // Prevent hanging processes
  detectOpenHandles: false, // Disable in dev for speed
  silent: process.env.JEST_SILENT === 'true',
  verbose: false, // Reduce output for speed
  moduleNameMapper: {
    // Handle module aliases (if you use them in your Next.js app)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/.vercel/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/error.tsx',
    '!src/__tests__/**/*',
    '!src/__mocks__/**/*',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: ['next/babel'],
      cacheDirectory: true,
      compact: false, // Faster transforms
    }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  // watchPlugins: [
  //   'jest-watch-typeahead/filename',
  //   'jest-watch-typeahead/testname',
  // ],
  // ZK proof testing specific configurations
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
  // Mock WebAssembly for ZK proof libraries
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testTimeout: process.env.CI ? 30000 : 10000, // Shorter timeout for faster feedback
  // WebSocket specific test configuration
  setupFiles: ['<rootDir>/src/test-utils/websocket-polyfill.js'],
  testEnvironmentOptions: {
    // Enable WebSocket support in jsdom
    resources: 'usable',
    runScripts: 'dangerously',
    // Speed optimizations
    pretendToBeVisual: false,
    includeNodeLocations: false,
  },
  
  // Faster test discovery
  haste: {
    computeSha1: false,
  },
  
  // Optimize module resolution
  resolver: undefined, // Use default resolver for speed
  
  // Reduce filesystem overhead
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/.vercel/',
    '<rootDir>/coverage/',
    '<rootDir>/.jest-cache/',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)