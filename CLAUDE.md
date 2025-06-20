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

## 📝 Notes

This is a ZK Hack 2025 project focusing on zero-knowledge proofs and blockchain technology. The monolith architecture allows for rapid development and easy deployment while maintaining clear separation between frontend and backend concerns.