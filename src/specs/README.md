# Specs Testing Setup

Integration test project for backend prover.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm test
```

## Available Scripts

- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests with coverage report

## Configuration

- **Vitest Config**: `vitest.config.ts` - Main test configuration
- **TypeScript Config**: `tsconfig.json` - TypeScript configuration for tests
- **Package Config**: `package.json` - Dependencies and scripts

## Test Structure

Tests should be placed in files with the following naming patterns:
- `*.test.ts` - Test files
- `*.spec.ts` - Specification files

## Example

See `example.test.ts` for basic test examples including:
- Basic assertions
- String operations
- Array operations
- Async function testing
- Promise handling

## Features

- ✅ TypeScript support
- ✅ Coverage reporting
- ✅ UI interface
- ✅ Watch mode
- ✅ Node.js environment
- ✅ Global test functions 
