# @quorum/sdk

TypeScript SDK for the Quorum governance protocol on Stellar/Soroban: read
proposals and config through `QuorumClient`, build transactions, sign them
with Freighter, and decode the events both contracts emit.

```bash
npm install @quorum/sdk
```

## Configure and make your first call

```typescript
import { QuorumClient, TESTNET } from '@quorum/sdk';

const client = new QuorumClient({
  ...TESTNET,
  governanceContractId: 'CC...', // deployed governance contract
  tokenContractId: 'CC...',      // deployed QUORUM token contract
});

const proposal = await client.getProposal(1n);
console.log(proposal?.title, proposal?.status);
```

`TESTNET` supplies Stellar testnet's RPC URL and network passphrase. Use
`MAINNET`, or provide `rpcUrl` and `networkPassphrase` yourself, for another
network. `tokenContractId` is optional when only governance methods are used.

Both module systems are supported — `import` resolves the ESM build,
`require()` the CommonJS build, and TypeScript picks up the matching types.

### Signing with Freighter

The wallet helper lives behind an optional entry point so Node consumers never
load it. It requires the peer dependency:

```bash
npm install @stellar/freighter-api
```

```typescript
import { signWithFreighter, FreighterError, FreighterErrorCode } from '@quorum/sdk/freighter';

const xdr = await client.buildFinalize(sourceAddress, proposalId);
const { signedXdr } = await signWithFreighter(xdr, { networkPassphrase });
```

Every failure is a `FreighterError` with a `code` — `NOT_INSTALLED`,
`LOCKED`, `ACCESS_DENIED`, `SIGNING_REJECTED` or `WALLET_ERROR`.

### Events

```typescript
import { decodeEvent, decodeEvents } from '@quorum/sdk';

for (const event of decodeEvents(rpcEvents)) {
  if (event.type === 'vote_cast') console.log(event.proposalId, event.votingPower);
}
```

Covers `proposal_created`, `vote_cast`, `proposal_finalized`,
`proposal_queued`, `proposal_executed`, `proposal_cancelled`, `transfer`,
`mint`, `burn`, `approve` and `admin_transferred`. Unknown topics decode to
`null` instead of throwing.

## Method status

The following `QuorumClient` methods are implemented:

- Governance reads: `getProposal`, `getProposalCount`, `getProposals`,
  `getAllProposals`, `getProposalsByStatus`, `getConfig`, `hasVoted`,
  `getVote`, `getLatestLedger`, `getVotingPower` and `getDelegate`
- Token reads: `getBalance`, `getTokenDecimals`, `balance`, `getPastBalance`,
  `allowance` and `totalSupply`
- Transaction flow: `buildCreateProposal`, `buildVote`, `buildDelegate`,
  `buildUndelegate`, `buildFinalize`, `buildExecute`, `buildCancel`,
  `buildTransfer`, `buildApprove`, `buildTransferFrom` and `submitAndWait`

`getVotingPower` reads the token's delegated weight at the proposal snapshot
through `get_past_votes`. `buildDelegate` and `buildUndelegate` build unsigned
governance transactions; the holder must authorize even if a different source
account pays the fee. Self-delegation clears an existing assignment.

## Contract errors

`GovernanceError` and `TokenError` mirror the Rust `#[contracterror]` enums;
`parseGovernanceError(error)` maps `Error(Contract, #N)` to a code.

## Releasing

See [docs/publishing.md](https://github.com/StellarQuorum/StellarQuorum/blob/main/docs/publishing.md)
for the versioning policy and release checklist.

## License

MIT
