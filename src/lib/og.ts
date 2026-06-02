import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Dynamic OpenGraph card generation (#148). Renders a 1200×630 branded title card with satori
 * (text → SVG vector paths, so no font is needed at raster time) and rasterizes with sharp (already
 * a dep via astro:assets). Build-time only, via the `/og/**` endpoint — it's the OG-image FALLBACK:
 * pages prefer a real `cover` / remote `coverUrl`, and only use this card when they have no image.
 *
 * Fonts are read from `@fontsource/inter` (`.woff`, which satori accepts — not `.woff2`) at the
 * project root, so rendering is deterministic in any build environment (CI, Cloudflare Pages).
 */

const FONT_DIR = join(process.cwd(), 'node_modules/@fontsource/inter/files');
let fontsPromise: Promise<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[]>;
function fonts() {
  fontsPromise ??= Promise.all([
    readFile(join(FONT_DIR, 'inter-latin-400-normal.woff')),
    readFile(join(FONT_DIR, 'inter-latin-700-normal.woff')),
  ]).then(([regular, bold]) => [
    { name: 'Inter', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: bold, weight: 700 as const, style: 'normal' as const },
  ]);
  return fontsPromise;
}

// Brand palette (matches the static og-default.png / the Oklch design tokens).
const BG = '#15161e';
const ACCENT = '#8b7ff0';
const FG = '#f4f5f7';
const MUTED = '#a9adbd';

export interface OgCard {
  /** Page title — the headline, wrapped to fit. */
  title: string;
  /** Small label above the title, e.g. the localized section ("Blog" / "Projects"). */
  eyebrow: string;
}

/** Render an OG card to a PNG buffer. */
export async function renderOgCard({ title, eyebrow }: OgCard): Promise<Buffer> {
  const node = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: BG,
        color: FG,
        padding: '80px',
        borderLeft: `14px solid ${ACCENT}`,
        fontFamily: 'Inter',
      },
      children: [
        {
          type: 'div',
          props: { style: { fontSize: 30, color: ACCENT, fontWeight: 400 }, children: eyebrow },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              marginTop: 24,
              // Clamp very long titles so they never overflow the card.
              display: 'block',
              lineClamp: 3,
            },
            children: title,
          },
        },
        {
          type: 'div',
          props: {
            style: { fontSize: 26, color: MUTED, marginTop: 32, fontWeight: 400 },
            children: 'Rodrigo Sicarelli · rsicarelli.com',
          },
        },
      ],
    },
  };

  // satori accepts this plain VNode tree at runtime; its TS types only declare a React node, so we
  // cast to satori's own first-parameter type (no `any`).
  const tree = node as unknown as Parameters<typeof satori>[0];
  const svg = await satori(tree, { width: 1200, height: 630, fonts: await fonts() });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
