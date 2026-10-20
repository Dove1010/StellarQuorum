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
  `getVote`, `getLatestLedger` and `getVotingPower`
- Token reads: `getBalance`, `getTokenDecimals`, `balance`, `getPastBalance`,
  `allowance` and `totalSupply`
- Transaction flow: `buildFinalize`, `buildExecute`, `buildCancel`,
  `buildTransfer`, `buildApprove`, `buildTransferFrom` and `submitAndWait`

`buildCreateProposal` and `buildVote` are currently stubs and always throw
`Error('Not implemented')`. Do not ask users to sign or submit their output
until a later release marks them as implemented.

## Contract errors

`GovernanceError` and `TokenError` mirror the Rust `#[contracterror]` enums;
`parseGovernanceError(error)` maps `Error(Contract, #N)` to a code.

## Optional read cache

Caching is disabled by default and is local to each client. Enable it with
`cache: { enabled: true, ttlMs: 5_000, methodTtlMs: { getConfig: 60_000 } }`
in `QuorumClientConfig`. TTLs are milliseconds, start after a successful RPC,
and can be set to zero to disable a method. Entries are keyed by method and
arguments; `maxEntries` bounds memory (default 1000). Errors are never cached,
and returned objects can be modified without changing the cached value.

Every single read accepts a final options argument:

```typescript
await client.getProposal(7n, { bypassCache: true }); // fresh, leaves cache alone
await client.getConfig({ invalidateCache: true }); // evict, fetch, and cache
client.invalidateCache('getProposal', 7n);         // evict this proposal
client.invalidateCache('getVote');                // evict every vote
client.invalidateCache();                         // evict everything
```

Proposal-list options also accept `bypassCache` and `invalidateCache`, applied
to the count and every proposal in the window. `hasVoted` shares `getVote`'s
cache. After submitting a write, invalidate the affected reads or bypass the
cache when immediate freshness matters; no write automatically clears it.

## Contributor notes

Run `npm ci`, `npm run build`, and `npm run test:browser` in `sdk/` to
check browser compatibility. CI bundles the emitted ESM entry with esbuild's
browser target, rejects Node built-in imports (including `node:` imports),
and loads the bundle without Node globals such as `Buffer` or `process`.
Dependencies are bundled too, using their browser exports; do not externalize
them or add Node polyfills to hide a failing shared SDK code path.

## Releasing

See [docs/publishing.md](https://github.com/StellarQuorum/StellarQuorum/blob/main/docs/publishing.md)
for the versioning policy and release checklist.

## License

MIT
