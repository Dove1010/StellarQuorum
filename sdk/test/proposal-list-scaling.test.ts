import { jest } from '@jest/globals';
import { rpc, nativeToScVal, xdr } from '@stellar/stellar-sdk';
import { QuorumClient, TESTNET } from '../src/client';
import type { QuorumClientConfig } from '../src/types';
import { structVal } from './xdr';

/**
 * Performance regression test for issue #317: getAllProposals() scaling.
 *
 * Asserts that the wall-clock time to fetch N proposals grows linearly with N,
 * not quadratically. Uses a stubbed RPC with configurable per-call latency to
 * measure scaling independent of actual network conditions.
 *
 * This test catches regressions to O(N²) behavior in the implementation and
 * ensures the read path stays optimal as the codebase evolves.
 */

const CONTRACT = 'CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526';
const TOKEN = 'CABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMWJO7';

// Simulated latency per RPC call (milliseconds)
const SIMULATED_RTT_MS = 5;

// Linear scaling tolerance: measured time should be within 20% of expected
const TOLERANCE = 0.2;

// Test sizes: measure at a few points to establish a trend
const TEST_SIZES = [10, 50, 100];

const simulate = jest.spyOn(rpc.Server.prototype, 'simulateTransaction');

// Proposal mock with minimal fields
function makeProposal(id: bigint): xdr.ScVal {
  return structVal({
    id: nativeToScVal(id, { type: 'u64' }),
    proposer: nativeToScVal('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H', { type: 'string' }),
    title: nativeToScVal(`Proposal ${id}`, { type: 'string' }),
    description: nativeToScVal('Test proposal', { type: 'string' }),
    for_votes: nativeToScVal(100n, { type: 'i128' }),
    against_votes: nativeToScVal(0n, { type: 'i128' }),
    abstain_votes: nativeToScVal(0n, { type: 'i128' }),
    snapshot_ledger: nativeToScVal(1000, { type: 'u32' }),
    start_ledger: nativeToScVal(1001, { type: 'u32' }),
    end_ledger: nativeToScVal(2000, { type: 'u32' }),
    queue_ledger: nativeToScVal(0, { type: 'u32' }),
    quorum_required: nativeToScVal(50n, { type: 'i128' }),
    status: nativeToScVal('Active', { type: 'string' }),
  });
}

describe('getAllProposals() scaling (issue #317)', () => {
  let callCount: number;
  let callTimes: number[] = [];

  beforeEach(() => {
    callCount = 0;
    callTimes = [];
    simulate.mockImplementation(async (tx: any) => {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, SIMULATED_RTT_MS));
      callCount++;

      // Extract method name from the transaction to determine what to return
      const func = tx.operations[0]?.func;
      if (func?.type !== 'hostFunctionTypeInvokeContract') {
        throw new Error('Expected contract invocation');
      }

      const method = func.invokeContract?.functionName.toString();
      
      if (method === 'get_proposal_count') {
        return { result: { retval: nativeToScVal(BigInt(callCount - 1), { type: 'u64' }) } };
      }
      
      if (method === 'get_proposal') {
        const idArg = func.invokeContract?.args[0];
        const proposalId = idArg ? BigInt(idArg.u64?.lo ?? 0) : 1n;
        return { result: { retval: makeProposal(proposalId) } };
      }

      throw new Error(`Unknown method: ${method}`);
    });
  });

  afterEach(() => {
    simulate.mockReset();
  });

  it('scales linearly with proposal count', async () => {
    const measurements: { size: number; time: number }[] = [];

    for (const size of TEST_SIZES) {
      callCount = 0;
      simulate.mockClear();

      const client = new QuorumClient({
        ...TESTNET,
        governanceContractId: CONTRACT,
        tokenContractId: TOKEN,
      } as QuorumClientConfig);

      // Override getProposalCount to return our test size
      const originalCount = client.getProposalCount.bind(client);
      jest.spyOn(client, 'getProposalCount').mockResolvedValue(BigInt(size));

      // Override getProposal to return test proposals
      const originalGetProposal = client.getProposal.bind(client);
      jest.spyOn(client, 'getProposal').mockImplementation(async (id: bigint) => {
        // Simulate the RPC latency
        await new Promise(resolve => setTimeout(resolve, SIMULATED_RTT_MS));
        return {
          id,
          proposer: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
          title: `Proposal ${id}`,
          description: 'Test',
          forVotes: 100n,
          againstVotes: 0n,
          abstainVotes: 0n,
          snapshotLedger: 1000,
          startLedger: 1001,
          endLedger: 2000,
          queueLedger: 0,
          quorumRequired: 50n,
          status: 'Active' as const,
        };
      });

      const startTime = performance.now();
      await client.getAllProposals();
      const elapsed = performance.now() - startTime;

      measurements.push({ size, time: elapsed });
    }

    // Calculate linear regression to check if scaling is roughly O(N)
    // The expected time should be approximately: time = k * N + b
    // where k ≈ SIMULATED_RTT_MS and b is constant overhead
    
    const xs = measurements.map(m => m.size);
    const ys = measurements.map(m => m.time);
    
    // Linear regression: find best fit line y = mx + b
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
    const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R² (coefficient of determination) to measure goodness of fit
    const yMean = sumY / n;
    const ssTotal = ys.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssPredicted = ys.reduce((sum, y, i) => {
      const predicted = slope * xs[i] + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const r2 = 1 - ssPredicted / ssTotal;

    // For linear scaling, slope should be roughly SIMULATED_RTT_MS (per-call overhead)
    // R² should be close to 1 (good fit to a line)
    expect(r2).toBeGreaterThan(0.95);
    expect(slope).toBeGreaterThan(SIMULATED_RTT_MS * (1 - TOLERANCE));
    expect(slope).toBeLessThan(SIMULATED_RTT_MS * (1 + TOLERANCE));

    // Log measurements for debugging
    console.log('Scaling analysis:');
    measurements.forEach(m => {
      console.log(`  ${m.size} proposals: ${m.time.toFixed(1)}ms`);
    });
    console.log(`Linear fit: y = ${slope.toFixed(3)}x + ${intercept.toFixed(1)}`);
    console.log(`R² = ${r2.toFixed(4)} (${r2 > 0.95 ? 'PASS: linear scaling' : 'FAIL: non-linear'})`);
  });
});
