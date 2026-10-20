// Exercise the built SDK over real localhost HTTP. Count envelopes at the
// server, rather than estimating round trips or timing a fake client.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { QuorumClient } from '../dist/esm/index.js';
import { nativeToScVal, scValToNative, SorobanDataBuilder, TransactionBuilder, xdr } from '@stellar/stellar-sdk';

const pageSize = Number(process.argv[2] ?? 50);
assert.ok(Number.isInteger(pageSize) && pageSize >= 2 && pageSize <= 100, 'page size must be 2..100');
const networkPassphrase = 'Test SDF Network ; September 2015';
const governanceContractId = 'CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526';
const source = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const transactionData = new SorobanDataBuilder().build().toXDR('base64');
let httpRoundTrips = 0;

function reply(request) {
  const tx = TransactionBuilder.fromXDR(request.params.transaction, networkPassphrase);
  const invoke = tx.operations[0].func.invokeContract;
  const isCount = invoke.functionName.toString() === 'get_proposal_count';
  const id = isCount ? 0n : scValToNative(invoke.args[0]);
  const fields = {
    id: nativeToScVal(id, { type: 'u64' }), proposer: nativeToScVal(source),
    title: nativeToScVal(`Proposal ${id}`, { type: 'string' }), description: nativeToScVal('x'.repeat(4096), { type: 'string' }),
    for_votes: nativeToScVal(100n), against_votes: nativeToScVal(20n), abstain_votes: nativeToScVal(5n),
    snapshot_ledger: nativeToScVal(999, { type: 'u32' }), start_ledger: nativeToScVal(1000, { type: 'u32' }),
    end_ledger: nativeToScVal(2000, { type: 'u32' }), queue_ledger: nativeToScVal(0, { type: 'u32' }),
    quorum_required: nativeToScVal(50n), status: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Active')]),
  };
  const proposal = xdr.ScVal.scvMap(Object.keys(fields).sort().map(key => new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol(key), val: fields[key] })));
  return {
    jsonrpc: '2.0', id: request.id,
    result: { latestLedger: 1000, events: [], minResourceFee: '100', transactionData,
      results: [{ auth: [], xdr: (isCount ? nativeToScVal(BigInt(pageSize), { type: 'u64' }) : proposal).toXDR('base64') }] },
  };
}

const server = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString());
  httpRoundTrips += 1;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(Array.isArray(body) ? body.map(reply).reverse() : reply(body)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const rows = [];
  let expected;
  for (const batchSimulation of [false, true]) {
    httpRoundTrips = 0;
    const client = new QuorumClient({
      rpcUrl: `http://127.0.0.1:${server.address().port}`, networkPassphrase, governanceContractId,
      batchSimulation, simulationBatchSize: pageSize,
    });
    const start = performance.now();
    const proposals = await client.getProposals({ limit: pageSize });
    if (expected) assert.deepEqual(proposals, expected);
    else expected = proposals;
    rows.push({ strategy: batchSimulation ? 'batch' : 'individual', proposals: proposals.length, httpRoundTrips, elapsedMs: Math.round(performance.now() - start) });
  }
  assert.equal(rows[0].httpRoundTrips, pageSize + 1);
  assert.equal(rows[1].httpRoundTrips, 2);
  console.table(rows);
  console.log('Local mock provider; elapsed time is not a public RPC latency measurement.');
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
