import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { onRequestGet } from '../../functions/api/health';

/**
 * Engagement backend enabler (#199) — the `/api/health` Pages Function + the D1 migration.
 * Functions run on the Cloudflare runtime (verified end-to-end on a deployed preview); here we
 * unit-test the handler's logic with a mock context and sanity-check the checked-in migration.
 */

const ROOT = new URL('../../', import.meta.url);

describe('GET /api/health', () => {
  it('returns 200 + no-store JSON reporting db:false when no binding is present', async () => {
    const res = await onRequestGet({ env: {} });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, db: false });
    expect(typeof body.time).toBe('string');
  });

  it('reports db:true when the D1 binding answers', async () => {
    const env = { DB: { prepare: () => ({ first: async () => ({ '1': 1 }) }) } };
    const body = await (await onRequestGet({ env })).json();
    expect(body.db).toBe(true);
  });

  it('stays db:false (never throws) when the binding errors', async () => {
    const env = {
      DB: {
        prepare: () => ({
          first: async () => {
            throw new Error('unreachable');
          },
        }),
      },
    };
    const body = await (await onRequestGet({ env })).json();
    expect(body.ok).toBe(true);
    expect(body.db).toBe(false);
  });
});

describe('D1 migration 0001', () => {
  it('creates the counters, reactions and dedup tables idempotently', async () => {
    const sql = await readFile(
      fileURLToPath(new URL('migrations/0001_engagement.sql', ROOT)),
      'utf8',
    );
    for (const table of ['counters', 'reactions', 'dedup']) {
      expect(sql, table).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
    }
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_dedup_ts/);
  });
});
