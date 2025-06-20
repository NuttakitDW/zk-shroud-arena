# ZK Hack 2025 Project

A monolith application with Rust backend and Next.js frontend for ZK Hack 2025.

## 🏗️ Project Structure

```
zkth-zkhack2025/
├── src/
│   ├── backend/                 # Rust backend
│   │   ├── src/
│   │   │   └── main.rs         # Entry point
│   │   ├── api/                # API route handlers
│   │   ├── controllers/        # Request controllers
│   │   ├── models/             # Data models
│   │   ├── middleware/         # Custom middleware
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Backend utilities
│   │   ├── config/             # Configuration files
│   │   └── Cargo.toml          # Rust dependencies
│   └── frontend/               # Next.js frontend
│       ├── src/
│       │   └── app/            # App Router (Next.js 15)
│       ├── components/         # React components
│       ├── pages/              # Page components
│       ├── hooks/              # Custom React hooks
│       ├── utils/              # Frontend utilities
│       ├── styles/             # CSS/SCSS files
│       ├── assets/             # Static assets
│       └── package.json        # Node.js dependencies
├── tests/
│   ├── backend/                # Backend tests
│   ├── frontend/               # Frontend tests
│   └── e2e/                    # End-to-end tests
├── docs/                       # Documentation
├── scripts/                    # Build/deployment scripts
├── Makefile                    # Development commands
└── CLAUDE.md                   # This file
```

## 🚀 Development

### Quick Start Commands

Use the Makefile for common development tasks:

```bash
make dev        # Start both backend and frontend in development mode
make tail-logs  # Tail application logs
make build      # Build both backend and frontend
make test       # Run all tests
make clean      # Clean build artifacts
```

### Backend (Rust)
- **Framework**: To be determined (Axum/Actix-web/Warp)
- **Database**: To be determined
- **Port**: 8000 (default)

### Frontend (Next.js 15)
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS
- **TypeScript**: Enabled
- **Bundler**: Turbopack (dev mode)
- **Port**: 3000 (default)

## 📋 Development Rules

### Git Commit Convention

**ALWAYS use conventional commit format:**

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples:**
```bash
feat: add user authentication API
fix(frontend): resolve login form validation
docs: update API documentation
refactor(backend): simplify database connection logic
test: add unit tests for user service
```

### File Scope Restrictions

**IMPORTANT: Only work within this repository:**

✅ **ALLOWED:**
- Files under `/Users/nuttakit/project/zk/zkth-zkhack2025/`
- Reading, editing, creating files in this project
- Running commands within this project directory

❌ **FORBIDDEN:**
- Modifying files outside this repository
- Global system configuration changes
- Editing files in other projects
- Modifying global Git configuration
- Installing global packages without explicit permission

### Frontend Focus Mode

**CRITICAL: Claude must ONLY work with frontend files:**

✅ **FRONTEND ONLY:**
- Files under `src/frontend/` directory
- Frontend-related configuration files (`package.json`, `next.config.ts`, `tailwind.config.js`)
- Frontend tests under `tests/frontend/`
- Frontend-specific documentation

❌ **STRICTLY FORBIDDEN:**
- Any files in `src/backend/` directory
- Backend configuration files (`Cargo.toml`, `src/backend/config/`)
- Backend tests under `tests/backend/`
- Backend-related API development
- Rust code modifications
- Backend service implementations

### Code Quality Standards

- **Rust**: Follow standard Rust conventions, use `cargo fmt` and `cargo clippy`
- **TypeScript/React**: Follow Next.js and React best practices
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update documentation for significant changes

## 🧪 Testing

- **Backend**: `cargo test`
- **Frontend**: `npm test`
- **E2E**: To be configured

## 📦 Dependencies

### Backend Dependencies (Cargo.toml)
- Core Rust dependencies to be added based on requirements

### Frontend Dependencies (package.json)
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- ESLint

## 🔧 Configuration

- **Backend config**: `src/backend/config/`
- **Frontend config**: `next.config.ts`, `tailwind.config.js`
- **Development**: Environment variables in `.env.local`

## 🔌 API Documentation

### Available Backend Server

A temporary backend server is running at `http://localhost:8080` with the following endpoints:

#### Setup (macOS)

1. **Install dependencies**
```bash
brew install cmake pkgconf
```

2. **Build the project**
```bash
cargo build --release
```

3. **Run the backend**
```bash
./target/release/backend
```

#### Setup (Ubuntu)

1. **Install dependencies**
```bash
apt install build-essential cmake pkg-config libsqlite3-dev sqlite3
```

2. **Build the project**
```bash
cargo build --release
```

3. **Run the backend**
```bash
./target/release/backend
```

### API Endpoints

#### Prove
`POST /prove`

**Request Body:**
```json
{
  "lat": 40.689247,
  "lon": -74.044502,
  "resolution": 10,
  "h3_map": [
    "8a2a1072b5affff",
    "8a2a1072b51ffff",
    "8a2a1072b50ffff"
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "proof": {
    "a": "RefqUj58Pc0cZnxIMtP1LpGBfg1laa7wEM1U2LUtQxxGyNA9exnouk6HuYkKvy6JFOGjwDFycQ8ah3xgaMtbDw==",
    "b": "0f7MWKAiziNl0OlG033MY7l637et4H6o6+a9YAIq9CBZ0KUXwp2isNFfUo7hHkvc7lRJzef+HF2CVzqrKSZuAt/diotNZsy+FoGirPYLuSVLevvIQV9ZKTqOaBAKHusAQh34EhsV5UC7L+dYxuu8gFDBaSLN5MqQOmdCNB39jAE=",
    "c": "KOTXK6+628Iam7b1dbPR+p17e/8Mz17cUtjzjGKdJiimB+58TjZlkyiMWYI+j2Q2sRjIwSw3/C6NcAQrsKwGFw=="
  },
  "public_inputs": [
    "gNHwCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "4vEpFmxeY/ONNjSAQm8tOyCq0M2Z4MhQGpmWT2060Bc=",
    "J3mtmdI9u1p21NzGWwjVOMWEFac24KFDm5kK+pbgPAA=",
    "U8+fmMpbWCFe6NZ3Pf/6TwJGqB3EbPxQsqdVcNdEABA=",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
  ]
}
```

#### Verify
`POST /verify`

**Request Body:**
```json
{
  "proof": {
    "a": "RefqUj58Pc0cZnxIMtP1LpGBfg1laa7wEM1U2LUtQxxGyNA9exnouk6HuYkKvy6JFOGjwDFycQ8ah3xgaMtbDw==",
    "b": "0f7MWKAiziNl0OlG033MY7l637et4H6o6+a9YAIq9CBZ0KUXwp2isNFfUo7hHkvc7lRJzef+HF2CVzqrKSZuAt/diotNZsy+FoGirPYLuSVLevvIQV9ZKTqOaBAKHusAQh34EhsV5UC7L+dYxuu8gFDBaSLN5MqQOmdCNB39jAE=",
    "c": "KOTXK6+628Iam7b1dbPR+p17e/8Mz17cUtjzjGKdJiimB+58TjZlkyiMWYI+j2Q2sRjIwSw3/C6NcAQrsKwGFw=="
  },
  "public_inputs": [
    "gNHwCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "4vEpFmxeY/ONNjSAQm8tOyCq0M2Z4MhQGpmWT2060Bc=",
    "J3mtmdI9u1p21NzGWwjVOMWEFac24KFDm5kK+pbgPAA=",
    "U8+fmMpbWCFe6NZ3Pf/6TwJGqB3EbPxQsqdVcNdEABA=",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
  ]
}
```

**Response:**
```json
{
  "ok": true
}
```
or
```json
{
  "ok": false
}
```

### Environment Configuration

Use `.env.local` in the frontend directory to configure the API endpoint:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 📝 Notes

This is a ZK Hack 2025 project focusing on zero-knowledge proofs and blockchain technology. The monolith architecture allows for rapid development and easy deployment while maintaining clear separation between frontend and backend concerns.