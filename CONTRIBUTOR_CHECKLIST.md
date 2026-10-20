# Contributor Checklist

A quick-start guide for first-time contributors. For full details, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Before You Start

- [ ] Read the [Code of Conduct](CODE_OF_CONDUCT.md)
- [ ] Fork the repository on GitHub
- [ ] Clone your fork: `git clone https://github.com/YOUR_USERNAME/StellarQuorum.git`
- [ ] Add upstream remote: `git remote add upstream https://github.com/StellarQuorum/StellarQuorum.git`

## Setup Your Environment

- [ ] Install [Node.js](https://nodejs.org/) (≥ 18)
- [ ] Install [Rust](https://rustup.rs/) (stable)
- [ ] Add WASM target: `rustup target add wasm32-unknown-unknown`
- [ ] Install Stellar CLI: `cargo install stellar-cli --features opt`

## Pick an Issue

- [ ] Browse [open issues](https://github.com/StellarQuorum/StellarQuorum/issues)
- [ ] Look for `good first issue` label if you're new
- [ ] Check if the issue has a `drips:*` label (points for Drips Wave contributors)
- [ ] Comment `/attempt #ISSUE_NUMBER` with a brief plan before starting work

## Development Workflow

- [ ] Create a branch from `main`: `git checkout -b feat/your-feature-name`
- [ ] Make your changes following the [layer-specific guidelines](CONTRIBUTING.md#contributing-to-contracts)
- [ ] Run tests: `make test` (or `npm run test:contracts`, `test:frontend`, `test:sdk`)
- [ ] Run linting: `make lint` (or `npm run lint`, `cargo clippy`)
- [ ] Build to verify: `make build` (or `npm run build`, `cargo build --release`)

## Open a Pull Request

- [ ] Push your branch: `git push origin feat/your-feature-name`
- [ ] Open a PR from your fork to `StellarQuorum/StellarQuorum:main`
- [ ] Fill out the PR template completely
- [ ] If claiming Drips Wave points, include `/claim #ISSUE_NUMBER` in the PR description
- [ ] Link the issue your PR addresses

## After Submission

- [ ] Respond to reviewer feedback promptly
- [ ] Make requested changes and push to your branch
- [ ] Celebrate when your PR is merged! 🎉

---

## Buddy System (Optional)

New contributors can request a buddy/mentor for guidance through their first contribution.

### How to Request a Buddy

1. When you comment `/attempt #ISSUE_NUMBER`, add: `@buddy-request` to signal you'd like mentorship
2. A maintainer will pair you with an experienced contributor
3. Your buddy will:
   - Answer questions about the codebase
   - Review your work before you open a PR
   - Help navigate the contribution process

### How to Volunteer as a Buddy

Experienced contributors can volunteer to mentor newcomers:
- Comment `@buddy-volunteer` on issues marked with `good first issue`
- Respond to buddy requests from maintainers
- Spend 1-2 hours per mentee providing guidance

### Buddy Guidelines

- Be patient and encouraging — everyone was new once
- Focus on teaching, not just solving
- Point to relevant documentation rather than giving all answers
- Respect the mentee's time and availability

---

## Stuck?

- Check the [full contributing guide](CONTRIBUTING.md)
- Ask questions in [GitHub Discussions > Governance Questions](https://github.com/StellarQuorum/StellarQuorum/discussions/categories/governance-questions)
- Join the community Discord (link in README)
- Tag maintainers in your issue for help
