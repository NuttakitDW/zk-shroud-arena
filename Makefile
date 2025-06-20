# ZK Hack 2025 Project Makefile

.PHONY: dev build test clean install tail-logs help backend frontend

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev        - Start both backend and frontend in development mode"
	@echo "  make backend    - Start only the Rust backend"
	@echo "  make frontend   - Start only the Next.js frontend"
	@echo "  make build      - Build both backend and frontend"
	@echo "  make test       - Run all tests"
	@echo "  make install    - Install all dependencies"
	@echo "  make tail-logs  - Tail application logs"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make help       - Show this help message"

# Development
dev:
	@echo "🚀 Starting development servers..."
	@trap 'kill %1 %2 2>/dev/null || true' INT; \
	$(MAKE) backend & \
	$(MAKE) frontend & \
	wait

backend:
	@echo "🦀 Starting Rust backend..."
	@cd src/backend && cargo run

frontend:
	@echo "⚛️  Starting Next.js frontend..."
	@cd src/frontend && npm run dev

# Build
build:
	@echo "🏗️  Building project..."
	@$(MAKE) build-backend
	@$(MAKE) build-frontend

build-backend:
	@echo "🦀 Building Rust backend..."
	@cd src/backend && cargo build --release

build-frontend:
	@echo "⚛️  Building Next.js frontend..."
	@cd src/frontend && npm run build

# Testing
test:
	@echo "🧪 Running all tests..."
	@$(MAKE) test-backend
	@$(MAKE) test-frontend

test-backend:
	@echo "🦀 Running Rust tests..."
	@cd src/backend && cargo test

test-frontend:
	@echo "⚛️  Running Next.js tests..."
	@cd src/frontend && npm test

# Dependencies
install:
	@echo "📦 Installing dependencies..."
	@$(MAKE) install-backend
	@$(MAKE) install-frontend

install-backend:
	@echo "🦀 Installing Rust dependencies..."
	@cd src/backend && cargo fetch

install-frontend:
	@echo "⚛️  Installing Node.js dependencies..."
	@cd src/frontend && npm install

# Logs
tail-logs:
	@echo "📋 Tailing application logs..."
	@echo "Backend logs (if available):"
	@if [ -f "logs/backend.log" ]; then \
		tail -f logs/backend.log & \
	else \
		echo "No backend log file found at logs/backend.log"; \
	fi
	@echo "Frontend logs (if available):"
	@if [ -f "logs/frontend.log" ]; then \
		tail -f logs/frontend.log & \
	else \
		echo "No frontend log file found at logs/frontend.log"; \
	fi
	@echo "Use Ctrl+C to stop tailing logs"
	@wait

# Cleanup
clean:
	@echo "🧹 Cleaning build artifacts..."
	@cd src/backend && cargo clean
	@cd src/frontend && rm -rf .next node_modules/.cache
	@rm -rf logs/*.log

# Development helpers
fmt:
	@echo "🎨 Formatting code..."
	@cd src/backend && cargo fmt
	@cd src/frontend && npm run lint:fix

lint:
	@echo "🔍 Linting code..."
	@cd src/backend && cargo clippy
	@cd src/frontend && npm run lint

# Database (placeholder for future use)
db-setup:
	@echo "🗄️  Setting up database..."
	@echo "Database setup not implemented yet"

db-migrate:
	@echo "🗄️  Running database migrations..."
	@echo "Database migrations not implemented yet"

# Docker (placeholder for future use)
docker-build:
	@echo "🐳 Building Docker images..."
	@echo "Docker build not implemented yet"

docker-up:
	@echo "🐳 Starting Docker containers..."
	@echo "Docker compose not implemented yet"

docker-down:
	@echo "🐳 Stopping Docker containers..."
	@echo "Docker compose not implemented yet"