import { describe, it, expect, beforeAll } from 'vitest';
import { buildReactionSeed, toSeedSql, SEED_EMOJI } from '../../scripts/seed-reactions.mjs';

/**
 * dev.to reaction seed (#216). Guards the pure mapping that converts each post's historical dev.to
 * like count (`provenance.reactions`) into a first-party reaction-seed row, plus the idempotent SQL
 * it renders. The seed path must byte-match the reaction key the Reactions component posts
 * (`/<locale>/blog/<slug>`, no trailing slash) or a seed would land on a slug nobody reacts to.
 */

interface SeedRow {
  path: string;
  count: number;
}

let rows: SeedRow[];
beforeAll(async () => {
  rows = (await buildReactionSeed()) as SeedRow[];
});

describe('buildReactionSeed', () => {
  it('emits a positive-count row per locale path, shaped like the reaction key', () => {
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.path, JSON.stringify(r)).toMatch(/^\/(en|pt-br)\/blog\/[^/]+$/);
      expect(r.path.endsWith('/')).toBe(false);
      expect(Number.isInteger(r.count) && r.count > 0, JSON.stringify(r)).toBe(true);
    }
  });

  it('seeds both locales and keeps per-locale counts independent', () => {
    expect(rows.some((r) => r.path.startsWith('/en/blog/'))).toBe(true);
    expect(rows.some((r) => r.path.startsWith('/pt-br/blog/'))).toBe(true);
    // No duplicate paths — one seed row per locale page at most.
    expect(new Set(rows.map((r) => r.path)).size).toBe(rows.length);
  });
});

describe('toSeedSql', () => {
  it('renders idempotent, non-destructive INSERTs for the chosen emoji', () => {
    const sql = toSeedSql(
      [
        { path: '/en/blog/x', count: 13 },
        { path: '/pt-br/blog/y', count: 1 },
      ],
      SEED_EMOJI,
    );
    expect(sql).toContain(
      `INSERT INTO reactions (slug, emoji, count) VALUES ('/en/blog/x', '${SEED_EMOJI}', 13) ON CONFLICT(slug, emoji) DO NOTHING;`,
    );
    expect(sql).toContain(`'/pt-br/blog/y', '${SEED_EMOJI}', 1`);
    // Every data line is guarded so a re-run never clobbers a real reader reaction.
    for (const line of sql.split('\n').filter((l) => l.startsWith('INSERT'))) {
      expect(line).toContain('ON CONFLICT(slug, emoji) DO NOTHING');
    }
  });

  it('escapes single quotes in the path', () => {
    const sql = toSeedSql([{ path: "/en/blog/o'brien", count: 2 }]);
    expect(sql).toContain("'/en/blog/o''brien'");
  });

  it('defaults to the ❤️ palette emoji', () => {
    expect(SEED_EMOJI).toBe('❤️');
  });
});
