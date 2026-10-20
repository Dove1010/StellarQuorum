# StellarQuorum Python SDK

Read-only governance queries for Python 3.10+. The package uses the official
Stellar Python SDK for Soroban transaction encoding and XDR decoding. No
wallet, secret key, funded account, or signing is needed. Transactions are
simulated only; this package does not submit transactions.

## Install from source

This package is not published to PyPI. From the repository root:

```bash
python -m pip install ./sdk/python
```

Or install directly from Git (pin a reviewed tag or commit for production):

```bash
python -m pip install 'git+https://github.com/StellarQuorum/StellarQuorum.git#subdirectory=sdk/python'
```

The Git installation requires a revision containing this package. While the
pull request is open, install from its checked-out source directory.

## Usage

```python
from quorum_sdk import QuorumClient, QuorumClientConfig

config = QuorumClientConfig(
    rpc_url="https://soroban-testnet.stellar.org",
    network_passphrase="Test SDF Network ; September 2015",
    governance_contract_id="C...",  # replace with your deployed contract
)

with QuorumClient(config) as client:
    governance = client.get_config()
    print(governance.quorum_bps, governance.proposal_threshold)

    proposal = client.get_proposal(1)
    if proposal is not None:
        print(proposal.title, proposal.status, proposal.for_votes)

    page = client.get_all_proposals(offset=0, limit=50)
    all_proposals = client.get_all_proposals()

    support = client.get_vote(1, "G...")  # replace with a voter address
    # None = no vote; 0 = Against; 1 = For; 2 = Abstain.
    print(support)
```

`Proposal` and `GovernanceConfig` are frozen dataclasses with the TypeScript
SDK's fields in snake_case. Addresses are Stellar strkey strings, statuses
are `Pending`, `Active`, `Passed`, `Failed`, `Queued`, `Executed`, or
`Cancelled`, and all u64/i128 values use arbitrary-precision Python `int`.
Use `dataclasses.asdict()` to convert a result to a dictionary.

`get_proposal()` returns `None` only for contract error 3 (ProposalNotFound).
Other simulation failures raise `SimulationError`, whose `code` exposes the
contract error number when present. Transport and invalid-XDR errors propagate.
`get_all_proposals()` reads the count then simulates each requested proposal
in order, omitting deleted/missing proposals. `get_proposal_count()` is also
available. Reads are synchronous, uncached, and do not use JSON-RPC batching.
Contract initialization and write transaction building remain in the TypeScript
SDK. Call `close()` when done, or use the context manager above.

## Contributor checks

From the repository root:

```bash
python -m pip install -e './sdk/python[test]'
python -m pytest sdk/python/tests
python -m pip install build
python -m build sdk/python
```

Tests run offline against an HTTP mock provider and share the exact base64
XDR fixtures in `sdk/test/fixtures/governance-reads.json` with the TypeScript
tests, including u64/i128 values above JavaScript's safe integer range.
