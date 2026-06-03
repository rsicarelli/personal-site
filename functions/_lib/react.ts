/**
 * Pure helpers for the anonymous reactions endpoint (#201) — separated so validation/parsing and the
 * dedup-key derivation are unit-testable without the Cloudflare runtime. Reuses the salted-hash
 * primitives from `view.ts` (Web Crypto works in both the Workers runtime and Node/vitest).
 */
import { sha256Hex } from './view';

/**
 * The fixed reaction palette — a server-side allowlist so the `reactions` table can only ever hold
 * these four keys. Editing this set is the only thing needed to change the offered reactions.
 */
export const REACTION_EMOJI = ['👍', '🎉', '❤️', '🚀'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJI)[number];

const EMOJI_SET: Set<string> = new Set(REACTION_EMOJI);

export function isValidEmoji(emoji: unknown): emoji is ReactionEmoji {
  return typeof emoji === 'string' && EMOJI_SET.has(emoji);
}

export interface ReactInput {
  path: string;
  emoji: string;
}

/** Parse the JSON body of a reaction POST (reacting is an interactive island, so it's always JSON). */
export async function parseReactBody(request: Request): Promise<ReactInput> {
  const b = (await request.json()) as Record<string, unknown>;
  return { path: String(b.path ?? ''), emoji: String(b.emoji ?? '') };
}

/**
 * Cookieless, PII-free dedup key for a reaction: a one-way hash of (dailySalt, path, IP, UA, emoji).
 * The emoji is part of the key so each reaction dedups independently (a reader may react with more
 * than one emoji, but only once per emoji per day). Raw IP/UA are never stored.
 */
export function reactDedupKey(
  salt: string,
  path: string,
  ip: string,
  ua: string,
  emoji: string,
): Promise<string> {
  return sha256Hex([salt, path, ip, ua, emoji].join('|'));
}

/** Build a zero-filled per-emoji counts map from the rows D1 returns for a slug. */
export function countsFromRows(rows: { emoji: string; count: number }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const emoji of REACTION_EMOJI) counts[emoji] = 0;
  for (const row of rows) {
    if (EMOJI_SET.has(row.emoji)) counts[row.emoji] = row.count;
  }
  return counts;
}
