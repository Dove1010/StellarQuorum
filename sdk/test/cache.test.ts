import { jest } from '@jest/globals';
import { nativeToScVal, rpc, xdr } from '@stellar/stellar-sdk';
import { QuorumClient } from '../src/client';
import type { QuorumClientConfig } from '../src/types';
import { enumVariant, structVal } from './xdr';

const config: QuorumClientConfig = {
  rpcUrl: 'https://rpc.example.com',
  networkPassphrase: 'Test SDF Network ; September 2015',
  governanceContractId: 'CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526',
};
const voter = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const simulate = jest.spyOn(rpc.Server.prototype, 'simulateTransaction');
const response = (retval: xdr.ScVal) => ({ result: { retval } } as rpc.Api.SimulateTransactionResponse);
const proposal = structVal({
  id: nativeToScVal(1n, { type: 'u64' }), proposer: nativeToScVal(voter),
  title: nativeToScVal('Original'), description: nativeToScVal('Details'),
  for_votes: nativeToScVal(1n), against_votes: nativeToScVal(0n), abstain_votes: nativeToScVal(0n),
  snapshot_ledger: nativeToScVal(1), start_ledger: nativeToScVal(2), end_ledger: nativeToScVal(3),
  queue_ledger: nativeToScVal(0), quorum_required: nativeToScVal(1n), status: enumVariant('Active'),
});
const governanceConfig = structVal({
  token: nativeToScVal(config.governanceContractId), admin: nativeToScVal(voter),
  quorum_bps: nativeToScVal(5000, { type: 'u32' }), voting_period: nativeToScVal(100, { type: 'u32' }),
  timelock_period: nativeToScVal(10, { type: 'u32' }), proposal_threshold: nativeToScVal(1n),
});

beforeEach(() => {
  simulate.mockReset();
  simulate.mockResolvedValue(response(nativeToScVal(3n, { type: 'u64' })));
});
afterAll(() => simulate.mockRestore());

test('disabled by default, including an explicitly disabled config', async () => {
  for (const cache of [undefined, { enabled: false }]) {
    const client = new QuorumClient({ ...config, cache });
    await client.getProposalCount();
    await client.getProposalCount();
  }
  expect(simulate).toHaveBeenCalledTimes(4);
});

test('hits within TTL, and re-fetches exactly at expiry', async () => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
  try {
    const client = new QuorumClient({ ...config, cache: { enabled: true, ttlMs: 100 } });
    expect(await client.getProposalCount()).toBe(3n);
    clock.mockReturnValue(1099);
    expect(await client.getProposalCount()).toBe(3n);
    expect(simulate).toHaveBeenCalledTimes(1);
    clock.mockReturnValue(1100);
    await client.getProposalCount();
    expect(simulate).toHaveBeenCalledTimes(2);
  } finally { clock.mockRestore(); }
});

test('getConfig uses its own TTL and returned objects cannot mutate the cache', async () => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
  try {
    simulate.mockResolvedValue(response(governanceConfig));
    const client = new QuorumClient({ ...config, cache: { enabled: true, ttlMs: 10, methodTtlMs: { getConfig: 100 } } });
    const first = await client.getConfig();
    first.quorumBps = 1;
    clock.mockReturnValue(1020);
    expect((await client.getConfig()).quorumBps).toBe(5000);
    expect(simulate).toHaveBeenCalledTimes(1);
    clock.mockReturnValue(1100);
    await client.getConfig();
    expect(simulate).toHaveBeenCalledTimes(2);
  } finally { clock.mockRestore(); }
});

test('proposal ids and vote arguments have separate entries; null votes are cached', async () => {
  const client = new QuorumClient({ ...config, cache: { enabled: true } });
  simulate.mockResolvedValue(response(proposal));
  await client.getProposal(1n);
  await client.getProposal(2n);
  await client.getProposal(1n);
  expect(simulate).toHaveBeenCalledTimes(2);
  simulate.mockResolvedValue(response(xdr.ScVal.scvVoid()));
  expect(await client.getVote(1n, voter)).toBeNull();
  expect(await client.hasVoted(1n, voter)).toBe(false);
  await client.getVote(2n, voter);
  expect(simulate).toHaveBeenCalledTimes(4);
});

test('bypass does not populate the cache; invalidation refreshes just the selected read', async () => {
  const client = new QuorumClient({ ...config, cache: { enabled: true } });
  await client.getProposalCount({ bypassCache: true });
  await client.getProposalCount();
  await client.getProposalCount();
  expect(simulate).toHaveBeenCalledTimes(2);
  await client.getProposalCount({ invalidateCache: true });
  await client.getProposalCount();
  expect(simulate).toHaveBeenCalledTimes(3);
  client.invalidateCache('getProposalCount');
  await client.getProposalCount();
  expect(simulate).toHaveBeenCalledTimes(4);
  client.invalidateCache();
  await client.getProposalCount();
  expect(simulate).toHaveBeenCalledTimes(5);
});

test('argument-specific invalidation preserves other ids and clients are isolated', async () => {
  simulate.mockResolvedValue(response(proposal));
  const client = new QuorumClient({ ...config, cache: { enabled: true } });
  await client.getProposal(1n);
  await client.getProposal(2n);
  client.invalidateCache('getProposal', 1n);
  await client.getProposal(1n);
  await client.getProposal(2n);
  await new QuorumClient({ ...config, cache: { enabled: true } }).getProposal(2n);
  expect(simulate).toHaveBeenCalledTimes(4);
});

test('errors are never cached', async () => {
  const client = new QuorumClient({ ...config, cache: { enabled: true } });
  simulate.mockResolvedValueOnce({ error: 'HostError: Error(Contract, #2)' } as rpc.Api.SimulateTransactionResponse);
  await expect(client.getProposalCount()).rejects.toThrow('#2');
  expect(await client.getProposalCount()).toBe(3n);
  expect(simulate).toHaveBeenCalledTimes(2);
});

test('concurrent reads of different arguments all populate the cache', async () => {
  const client = new QuorumClient({ ...config, cache: { enabled: true } });
  simulate.mockResolvedValue(response(proposal));
  await Promise.all([1n, 2n, 3n].map(id => client.getProposal(id)));
  await Promise.all([1n, 2n, 3n].map(id => client.getProposal(id)));
  expect(simulate).toHaveBeenCalledTimes(3);
});

test('invalidation during an in-flight read prevents stale cache repopulation', async () => {
  const client = new QuorumClient({ ...config, cache: { enabled: true } });
  let finish!: (value: rpc.Api.SimulateTransactionResponse) => void;
  simulate.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const pending = client.getProposalCount();
  client.invalidateCache('getProposalCount');
  finish(response(nativeToScVal(1n, { type: 'u64' })));
  expect(await pending).toBe(1n);
  expect(await client.getProposalCount()).toBe(3n);
  expect(simulate).toHaveBeenCalledTimes(2);
});

test('zero TTL disables a method, and the entry limit evicts old reads', async () => {
  const client = new QuorumClient({ ...config, cache: { enabled: true, maxEntries: 1, methodTtlMs: { getProposalCount: 0 } } });
  await client.getProposalCount();
  await client.getProposalCount();
  simulate.mockResolvedValue(response(proposal));
  await client.getProposal(1n);
  await client.getProposal(2n);
  await client.getProposal(1n);
  expect(simulate).toHaveBeenCalledTimes(5);
});

test('rejects invalid TTLs and entry limits', () => {
  for (const ttlMs of [-1, Infinity, NaN]) {
    expect(() => new QuorumClient({ ...config, cache: { enabled: true, ttlMs } })).toThrow('TTL');
  }
  expect(() => new QuorumClient({ ...config, cache: { enabled: true, maxEntries: 0 } })).toThrow('maxEntries');
});
