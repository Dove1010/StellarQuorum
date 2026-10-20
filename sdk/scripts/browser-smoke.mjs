import assert from 'node:assert/strict';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

const builtins = new Set(builtinModules.map(name => name.replace(/^node:/, '')));
const result = await build({
  absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
  entryPoints: ['dist/esm/index.js'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'QuorumSdk',
  target: 'es2020',
  write: false,
  metafile: true,
  plugins: [{
    name: 'reject-node-builtins',
    setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path }) => {
        if (path.startsWith('node:') || builtins.has(path)) {
          return { errors: [{ text: `Node built-in is not browser compatible: ${path}` }] };
        }
      });
    },
  }],
});

for (const output of Object.values(result.metafile.outputs)) {
  assert.deepEqual(output.imports, [], 'browser bundle must be self-contained');
}

// Evaluate without Node globals (Buffer, process, require). Browser dependency
// shims must provide their own globals, and the SDK must load in this context.
runInNewContext(`${result.outputFiles[0].text}\nnew QuorumSdk.QuorumClient({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  governanceContractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4',
});`, { URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, console });

console.log('browser smoke: ESM bundles and loads without Node built-ins or globals');
