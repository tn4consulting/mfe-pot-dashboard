// Production/development build for the React dashboard remote. Replaces
// the `@angular-architects/native-federation:build` executor. Same shape
// as job-bank's/employment-insurance's own build.mjs -- this app is a
// plain federation remote (not a host), so it needs both a federation
// build (for `./Component` and `./PaymentHistoryWidget`) and a standalone
// build (direct, non-federated access).
import { runEsBuildBuilder } from '@softarc/native-federation-esbuild';
import * as esbuild from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

const dev = process.argv.includes('--dev');
const outputPath = 'dist/apps/dashboard/browser';

await rm(outputPath, { recursive: true, force: true });
await mkdir(outputPath, { recursive: true });

await cp('apps/dashboard/public', outputPath, { recursive: true });
await cp('apps/dashboard/src/index.html', join(outputPath, 'index.html'));
await cp(require.resolve('es-module-shims'), join(outputPath, 'es-module-shims.js'));

// Deliberately NOT using @softarc/native-federation-esbuild's built-in
// `reactFrameworkPlugin()` wholesale -- see job-bank's build.mjs for the
// full explanation (stale React-19 file-replacement map).
// `needsCommonJsPlugin: true` keeps the shared react/react-dom chunks'
// CJS-interop working without it.
const result = await runEsBuildBuilder('apps/dashboard/federation.config.mjs', {
  workspaceRoot: process.cwd(),
  outputPath,
  tsConfig: 'apps/dashboard/tsconfig.federation.json',
  packageJson: 'package.json',
  dev,
  watch: false,
  adapterConfig: {
    plugins: [],
    frameworks: [{ needsCommonJsPlugin: true }],
  },
});
await result.close();

await esbuild.build({
  entryPoints: ['apps/dashboard/src/main.tsx'],
  outfile: join(outputPath, 'main.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  target: 'es2022',
  minify: !dev,
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
  },
});

console.log(`dashboard built to ${outputPath} (${dev ? 'development' : 'production'})`);
