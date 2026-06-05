import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { hashSeed, mulberry32 } from '@/lib/cover';

/**
 * Dynamic OpenGraph card generation (#148). Renders a 1200×630 branded title card with satori
 * (text → SVG vector paths, so no font is needed at raster time) and rasterizes with sharp (already
 * a dep via astro:assets). Build-time only, via the `/og/**` endpoint — it's the OG-image FALLBACK:
 * pages prefer a local `cover` image, and only use this card when they have none.
 *
 * The card mirrors the on-site Contour cover art (#R2): the same seeded topographic accent lines sit
 * behind the title, so a shared-link preview matches the rest of the brand. satori can't read our CSS
 * tokens or render inline SVG reliably, so the contour field is drawn as an SVG string, rasterized to
 * a PNG with sharp, and set as the card's background (literal hex, single dark theme — social cards
 * aren't theme-aware).
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

// Brand palette (matches the static og-default.png / the Oklch design tokens, dark theme).
const BG = '#15161e';
const ACCENT = '#8b7ff0';
const FG = '#f4f5f7';
const MUTED = '#a9adbd';
const W = 1200;
const H = 630;

/** Build the Contour line field (same math as Cover.astro's Contour variant) as a standalone SVG. */
function contourSvg(seed: string): string {
  const rng = mulberry32(hashSeed(seed));
  const rows = 7 + Math.floor(rng() * 4); // 7–10 lines
  const baseFreq = 0.0035 + rng() * 0.0035;
  let paths = '';
  for (let i = 0; i < rows; i++) {
    const baseY = 60 + (i + 0.5) * ((H - 120) / rows);
    const amp = 26 + rng() * 46;
    const freq = baseFreq * (0.7 + rng() * 0.8);
    const phase = rng() * Math.PI * 2;
    const amp2 = 12 + rng() * 24;
    const freq2 = freq * 2.4;
    const phase2 = rng() * Math.PI * 2;
    let d = '';
    for (let x = 0; x <= W; x += 24) {
      const y = baseY + amp * Math.sin(freq * x + phase) + amp2 * Math.sin(freq2 * x + phase2);
      d += x === 0 ? `M${x} ${y.toFixed(1)}` : ` L${x} ${y.toFixed(1)}`;
    }
    const op = Math.max(0.1, 0.42 - i * (0.3 / rows)).toFixed(3);
    paths += `<path d="${d}" fill="none" stroke="${ACCENT}" stroke-opacity="${op}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${BG}"/>${paths}</svg>`;
}

/** Rasterize the contour field to a PNG data URI satori can use as a background. */
async function contourBackground(seed: string): Promise<string> {
  const png = await sharp(Buffer.from(contourSvg(seed)))
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

export interface OgCard {
  /** Page title — the headline, wrapped to fit. */
  title: string;
  /** Small label above the title, e.g. the localized section ("Blog" / "Projects"). */
  eyebrow: string;
  /** Seed for the contour art (the post slug) — per-post variation matching the on-site cover. */
  seed?: string;
}

/** Render an OG card to a PNG buffer. */
export async function renderOgCard({ title, eyebrow, seed = title }: OgCard): Promise<Buffer> {
  const background = await contourBackground(seed);
  const node = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: BG,
        backgroundImage: `url(${background})`,
        backgroundSize: `${W}px ${H}px`,
        backgroundRepeat: 'no-repeat',
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
