import { rmSync } from 'node:fs';
import path from 'node:path';
import { stdout } from 'node:process';

const nextDirectory = path.resolve(import.meta.dirname, '..', '.next');
const cacheDirectories = [path.resolve(nextDirectory, 'cache'), path.resolve(nextDirectory, 'dev')];

for (const cacheDirectory of cacheDirectories) {
  rmSync(cacheDirectory, { force: true, recursive: true });
}

stdout.write('Cleared Twinzy frontend Next.js cache.\n');
