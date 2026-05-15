import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { logger } from '@shared/logger';
import { FileCompiler } from '..';

async function createTempProject(source: string) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'vureact-watch-'));
  const srcDir = path.join(root, 'src');
  const vueFile = path.join(srcDir, 'App.vue');

  await mkdir(srcDir, { recursive: true });

  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'watch-regression-fixture',
      private: true,
      type: 'module',
    }),
    'utf-8',
  );
  await writeFile(vueFile, source, 'utf-8');

  return { root, vueFile };
}

function createCompiler(root: string) {
  return new FileCompiler({
    root,
    watch: true,
    output: {
      bootstrapVite: false,
    },
  });
}

test('watch mode recompiles when a Vue file is restored to its initial content', async () => {
  const initialSource = `<template><div>{{ label }}</div></template>
<script setup lang="ts">
const label = 'initial'
</script>
`;
  const changedSource = `<template><div>{{ label }}</div></template>
<script setup lang="ts">
const label = 'changed'
</script>
`;

  const { root, vueFile } = await createTempProject(initialSource);

  try {
    const buildCompiler = createCompiler(root);
    await buildCompiler.execute();

    const watchCompiler = createCompiler(root);
    await writeFile(vueFile, changedSource, 'utf-8');

    const changedUnit = await watchCompiler.processSFC(vueFile);
    assert.ok(changedUnit?.output, 'changed source should compile in watch mode');

    const outputFile = changedUnit!.output!.jsx.file;
    const changedOutput = await readFile(outputFile, 'utf-8');
    assert.match(changedOutput, /changed/);

    await writeFile(vueFile, initialSource, 'utf-8');

    const restoredUnit = await watchCompiler.processSFC(vueFile);
    assert.ok(restoredUnit?.output, 'restoring initial source should still recompile in watch mode');

    const restoredOutput = await readFile(outputFile, 'utf-8');
    assert.match(restoredOutput, /initial/);
    assert.doesNotMatch(restoredOutput, /changed/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('component name fallback does not emit unnamed-component warnings', () => {
  logger.clear();

  const compiler = new FileCompiler({
    output: {
      bootstrapVite: false,
    },
  });

  const source = `<template><div>Hello</div></template>
<script setup lang="ts">
const count = 1
</script>
`;

  const result = compiler.compile(source, path.join('fixtures', 'account-overview.vue'));
  const warnings = logger
    .getLogs()
    .filter((log) => log.level === 'warning')
    .map((log) => log.message);

  assert.match(result.code, /const AccountOverview = memo/);
  assert.equal(
    warnings.some((message) => message.includes('Unnamed component detected')),
    false,
  );

  logger.clear();
});
