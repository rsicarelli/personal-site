/**
 * Cloudflare Pages Function (#199) — `GET /api/health`.
 *
 * The first endpoint of the engagement backend. The site itself stays a fully static Astro build
 * (no adapter); Cloudflare deploys anything under `functions/**` alongside `dist/`. This route
 * doubles as a **binding check**: it reports whether the D1 database binding (`DB`) is wired and
 * reachable, so a deployed preview can confirm the backend is live before we build views/reactions
 * on top of it (#200/#201).
 *
 * Typed structurally (no `@cloudflare/workers-types` dependency); `functions/` is excluded from the
 * Astro typecheck (see tsconfig.json) since Cloudflare bundles it separately.
 */
interface D1Like {
  prepare(query: string): { first(): Promise<unknown> };
}
interface Env {
  /** D1 binding configured in the Cloudflare Pages dashboard (Settings → Functions). */
  DB?: D1Like;
}

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  let db = false;
  try {
    if (context.env.DB) {
      await context.env.DB.prepare('SELECT 1').first();
      db = true;
    }
  } catch {
    db = false;
  }

  return new Response(JSON.stringify({ ok: true, db, time: new Date().toISOString() }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
