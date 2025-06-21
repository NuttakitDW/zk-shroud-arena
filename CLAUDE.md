# Claude Code Configuration

## Build Commands
- `cd src/frontend && npm run dev`: Start frontend development server on port 3001
- `cd src/frontend && npm run build`: Build the project
- `make test-fast`: **PREFERRED** - Run fast frontend tests (no coverage, bail on failure)
- `cd src/frontend && npm run test`: Run tests (fast, no coverage)
- `cd src/frontend && npm run test:fast`: Run tests with bail on first failure
- `cd src/frontend && npm run test:coverage`: Run tests with coverage (slower)
- `cd src/frontend && npm run lint`: Run ESLint and format checks
- `cd src/frontend && npm run typecheck`: Run TypeScript type checking
- `./claude-flow --help`: Show all available commands

## 🚨 CRITICAL PROJECT CONSTRAINTS 🚨

### FRONTEND-ONLY DEVELOPMENT POLICY
**⚠️ STRICTLY ENFORCED RULES:**

1. **DO NOT TOUCH BACKEND CODE**
   - ❌ NEVER modify files in `src/backend/`
   - ❌ NEVER edit `Cargo.toml` or any `.rs` files
   - ❌ NEVER change backend configuration
   - ❌ NEVER run cargo commands

2. **BACKEND IS RUNNING**
   - ✅ Backend server is already running
   - ✅ API endpoints available:
     - `POST /api/prove` - ZK proof generation
     - `POST /api/verify` - ZK proof verification
   - ✅ Use these endpoints in frontend code via environment configuration

3. **FRONTEND-ONLY WORK AREAS**
   - ✅ Work ONLY in `src/frontend/` directory
   - ✅ Modify React/Next.js components (.tsx, .ts, .jsx, .js)
   - ✅ Update styles (.css, .scss)
   - ✅ Edit frontend configuration (package.json, next.config.ts, etc.)
   - ✅ Create frontend documentation
   - ✅ Frontend runs on port 3001 (to avoid conflicts with claude-flow on port 3000)

4. **API INTEGRATION PATTERN**
   ```typescript
   // ✅ CORRECT: Frontend API calls to backend
   import { env } from '@/config/environment';
   
   const response = await fetch(env.getApiUrl(env.API.PROVE), {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(proofData)
   });
   ```

5. **AGENT BEHAVIOR**
   - All 4 agents (dev, docs, design, research) focus ONLY on frontend
   - Backend is a black box - consume its APIs but never modify it
   - Report any backend-related issues to user, don't try to fix them

**These rules apply to ALL agents and ALL operations. No exceptions.**

## Development Best Practices

### Change and Test Workflow
- When making any change, ALWAYS follow these steps:
  - Make the minimum required change
  - **IMMEDIATELY run `make test-fast`** to verify no errors (fastest feedback)
  - If any errors occur, fix the issue before proceeding
  - Repeat testing until 0 errors are present
  - Only consider the change complete when all tests pass without any errors

### Testing Strategy for Speed
- **Primary command**: `make test-fast` - Use this for all development testing
- **Why it's faster**: No coverage collection, parallel workers, bail on first failure
- **Full coverage**: Use `npm run test:coverage` only when needed for final validation
- **Specific tests**: Use `npm run test -- specific.test.ts` to run single test files

## Development Notes
- No need to implement heavy game logic yet

## Commit Conventions
- When making commits, divide changed files into reasonable commit groups
- Follow GitHub commit message convention for clear and consistent commit messages