import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST } from '../i18n/_helpers';

/**
 * IndexNow key file (#54). The verification file `public/<key>.txt` must ship to the site root with
 * its body exactly equal to the filename stem — that's how IndexNow proves key ownership. A wrong
 * body (e.g. a stray trailing newline added by an editor) silently breaks submission.
 */
describe('IndexNow key file', () => {
  it('exists at the dist root with body === filename stem', async () => {
    const keyFiles = (await readdir(DIST)).filter((f) => /^[a-f0-9]{8,128}\.txt$/i.test(f));
    expect(keyFiles.length, 'expected exactly one IndexNow key file in dist').toBe(1);
    const key = keyFiles[0].replace(/\.txt$/, '');
    const body = await readFile(join(DIST, keyFiles[0]), 'utf8');
    expect(body).toBe(key); // no trailing newline, no surrounding whitespace
  });
});
