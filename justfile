# Quorum Contributor Justfile

default:
    @just --list

# Build all packages (contracts WASM, SDK, frontend)
build: build-sdk build-frontend build-contracts

# Build Soroban smart contracts to release WASM
build-contracts:
    cd contracts && cargo build --target wasm32-unknown-unknown --release

# Build TypeScript SDK
build-sdk:
    cd sdk && npm run build

# Build Next.js frontend
build-frontend:
    cd frontend && npm run build

# Lint all packages (contracts clippy, frontend, SDK)
lint: lint-contracts lint-frontend lint-sdk

# Run cargo clippy on contracts
lint-contracts:
    cd contracts && cargo clippy --all-targets --all-features -- -D warnings

# Alias for lint-contracts
clippy: lint-contracts

# Run eslint on frontend
lint-frontend:
    cd frontend && npm run lint

# Run eslint on SDK
lint-sdk:
    cd sdk && npm run lint

# Run all test suites (contracts, frontend, SDK, integration)
test: test-contracts test-frontend test-sdk test-integration

# Run contract tests
test-contracts:
    cd contracts && cargo test

# Run frontend tests
test-frontend:
    cd frontend && npm test

# Run SDK tests
test-sdk:
    cd sdk && npm test

# Run integration test stubs
test-integration:
    cd frontend && npx jest ../tests

# Run security vulnerability audits across all packages
audit: audit-contracts audit-frontend audit-sdk

# Run cargo audit on contracts
audit-contracts:
    cd contracts && cargo audit --config audit.toml

# Run npm audit on frontend
audit-frontend:
    cd frontend && npm audit --audit-level=high

# Run npm audit on SDK
audit-sdk:
    cd sdk && npm audit --audit-level=high

# Run WASM size regression check
check-wasm-size:
    bash scripts/check-wasm-size.sh

# Run all checks (lint, test, build, audit, wasm size check)
check: lint test build audit check-wasm-size

# Alias for check
ci: check

# Clean build artifacts across all packages
clean:
    cd contracts && cargo clean
    rm -rf frontend/.next frontend/out frontend/coverage
    rm -rf sdk/dist sdk/coverage
