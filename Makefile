.DEFAULT_GOAL := help

.PHONY: help build build-contracts build-sdk build-frontend \
        lint lint-contracts lint-frontend lint-sdk clippy \
        test test-contracts test-frontend test-sdk test-integration \
        audit audit-contracts audit-frontend audit-sdk \
        check-wasm-size check ci clean

help: ## Show this help message
	@echo "Quorum Contributor Makefile"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "High-level targets:"
	@echo "  make build             Build all packages (contracts WASM, SDK, frontend)"
	@echo "  make lint              Lint all packages (contracts clippy, frontend, SDK)"
	@echo "  make test              Run all test suites (contracts, frontend, SDK, integration)"
	@echo "  make audit             Run security vulnerability audits across all packages"
	@echo "  make check             Run all checks (lint, test, build, audit, wasm size check)"
	@echo "  make ci                Alias for make check"
	@echo ""
	@echo "Build targets:"
	@echo "  make build-contracts   Build Soroban smart contracts to release WASM"
	@echo "  make build-sdk         Build TypeScript SDK"
	@echo "  make build-frontend    Build Next.js frontend"
	@echo ""
	@echo "Lint targets:"
	@echo "  make lint-contracts    Run cargo clippy on contracts"
	@echo "  make lint-frontend     Run eslint on frontend"
	@echo "  make lint-sdk          Run eslint on SDK"
	@echo "  make clippy            Alias for make lint-contracts"
	@echo ""
	@echo "Test targets:"
	@echo "  make test-contracts    Run contract tests (cargo test)"
	@echo "  make test-frontend     Run frontend unit/component tests (npm test)"
	@echo "  make test-sdk          Run SDK tests (npm test)"
	@echo "  make test-integration  Run integration test stubs (npx jest ../tests)"
	@echo ""
	@echo "Audit & Verification targets:"
	@echo "  make audit-contracts   Run cargo audit on contracts"
	@echo "  make audit-frontend    Run npm audit on frontend"
	@echo "  make audit-sdk         Run npm audit on SDK"
	@echo "  make check-wasm-size   Run WASM size regression check"
	@echo ""
	@echo "Cleanup targets:"
	@echo "  make clean             Clean build artifacts across all packages"

# --- Build Targets ---

build-contracts:
	cd contracts && cargo build --target wasm32-unknown-unknown --release

build-sdk:
	cd sdk && npm run build

build-frontend:
	cd frontend && npm run build

# SDK is built before frontend because frontend imports @quorum/sdk
build: build-sdk build-frontend build-contracts

# --- Lint Targets ---

lint-contracts:
	cd contracts && cargo clippy --all-targets --all-features -- -D warnings

clippy: lint-contracts

lint-frontend:
	cd frontend && npm run lint

lint-sdk:
	cd sdk && npm run lint

lint: lint-contracts lint-frontend lint-sdk

# --- Test Targets ---

test-contracts:
	cd contracts && cargo test

test-frontend:
	cd frontend && npm test

test-sdk:
	cd sdk && npm test

test-integration:
	cd frontend && npx jest ../tests

test: test-contracts test-frontend test-sdk test-integration

# --- Audit & Security Targets ---

audit-contracts:
	cd contracts && cargo audit --config audit.toml

audit-frontend:
	cd frontend && npm audit --audit-level=high

audit-sdk:
	cd sdk && npm audit --audit-level=high

audit: audit-contracts audit-frontend audit-sdk

# --- Verification & CI Targets ---

check-wasm-size:
	bash scripts/check-wasm-size.sh

check: lint test build audit check-wasm-size

ci: check

# --- Cleanup Targets ---

clean:
	cd contracts && cargo clean
	rm -rf frontend/.next frontend/out frontend/coverage
	rm -rf sdk/dist sdk/coverage
