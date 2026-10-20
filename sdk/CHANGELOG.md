# Changelog

All notable changes to `@quorum/sdk` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Package-local README with installation, configuration, first-call guidance,
  and an explicit method support matrix.

## [0.1.0] - 2026-09-26

### Added

- Initial TypeScript SDK with governance models, network presets, proposal and
  configuration reads, and transaction builder APIs.
- Working `getVote` and `hasVoted` contract calls, replacing their original
  throwing stubs.
- Governance and token contract error types and parsers.
- Proposal filtering and paginated listing helpers.
- Token balance, historical balance, allowance, and total-supply reads.
- Finalize, execute, cancel, transfer, approve, and transfer-from transaction
  builders, plus transaction submission and confirmation polling.
- Freighter signing helpers through the optional `@quorum/sdk/freighter`
  entry point.
- Typed governance and token event decoders.
- ESM and CommonJS package entry points.

### Changed

- Upgraded the Stellar SDK dependency and added RPC timeouts, retries, and
  typed transaction-failure handling.

### Known limitations

- `buildCreateProposal` and `buildVote` remain throwing stubs.

[Unreleased]: https://github.com/StellarQuorum/StellarQuorum/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/StellarQuorum/StellarQuorum/releases/tag/v0.1.0
