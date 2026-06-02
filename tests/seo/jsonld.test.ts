import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import type { CollectionEntry } from 'astro:content';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';
import {
  personLd,
  websiteLd,
  blogPostingLd,
  creativeWorkLd,
  eventLd,
  breadcrumbLd,
  faqPageLd,
} from '@/lib/jsonld';

/**
 * JSON-LD from Zod (#52). Unit-tests the builders (the schema shape) then validates the rendered
 * `dist/**` output: every `application/ld+json` block must be parseable (proving the `</script>`
 * breakout guard), carry `@context`, and expose the expected node types with Google-safe fields
 * (author/performer name-only, dateModified present, sameAs on the rich Person).
 */

const URL_ = 'https://rsicarelli.com/en/x';

const cvData: CollectionEntry<'cv'>['data'] = {
  name: 'Rodrigo Sicarelli',
  headline: 'Staff Software Engineer · Kotlin Multiplatform',
  location: 'São Paulo, Brazil',
  email: 'rodrigo@example.com',
  summary: 'Summary',
  knowsAbout: ['Kotlin', 'Kotlin Multiplatform'],
  profiles: [
    { network: 'GitHub', url: 'https://github.com/rsicarelli' },
    { network: 'LinkedIn', url: 'https://linkedin.com/in/rsicarelli' },
  ],
  work: [{ company: 'Stone', role: 'Staff Software Engineer', startDate: '2021' }],
};

describe('personLd', () => {
  const p = personLd(cvData, { url: URL_ });
  it('is a Person whose name is just the name (no job title)', () => {
    expect(p['@type']).toBe('Person');
    expect(p.name).toBe('Rodrigo Sicarelli');
    expect(p.jobTitle).toBe('Staff Software Engineer · Kotlin Multiplatform');
  });
  it('reconciles identity via sameAs from the CV profiles (#59)', () => {
    expect(p.sameAs).toEqual([
      'https://github.com/rsicarelli',
      'https://linkedin.com/in/rsicarelli',
    ]);
  });
  it('carries knowsAbout (topical authority) and worksFor (current employer)', () => {
    expect(p.knowsAbout).toContain('Kotlin Multiplatform');
    expect(p.worksFor).toMatchObject({ '@type': 'Organization', name: 'Stone' });
  });
});

describe('websiteLd', () => {
  it('is a WebSite with inLanguage from the locale', () => {
    const w = websiteLd({
      url: 'https://rsicarelli.com/en',
      name: 'rsicarelli.com',
      locale: 'pt-br',
    });
    expect(w['@type']).toBe('WebSite');
    expect(w.inLanguage).toBe('pt-BR');
  });
});

describe('blogPostingLd', () => {
  const data: CollectionEntry<'blog'>['data'] = {
    title: 'KMP in production',
    description: 'A post.',
    draft: false,
    pubDate: new Date('2026-01-10T00:00:00Z'),
    updatedDate: new Date('2026-02-20T00:00:00Z'),
    tags: ['kotlin', 'kmp'],
  };
  it('maps headline/dates and a name-only author', () => {
    const b = blogPostingLd(data, { url: URL_, locale: 'en', authorName: 'Rodrigo Sicarelli' });
    expect(b['@type']).toBe('BlogPosting');
    expect(b.headline).toBe('KMP in production');
    expect(b.datePublished).toBe('2026-01-10');
    expect(b.dateModified).toBe('2026-02-20');
    expect(b.author).toEqual({ '@type': 'Person', name: 'Rodrigo Sicarelli' });
    expect(b.keywords).toEqual(['kotlin', 'kmp']);
  });
  it('falls back dateModified to pubDate when never updated', () => {
    const b = blogPostingLd(
      { ...data, updatedDate: undefined },
      {
        url: URL_,
        locale: 'en',
        authorName: 'X',
      },
    );
    expect(b.dateModified).toBe('2026-01-10');
  });
});

describe('creativeWorkLd', () => {
  const base: CollectionEntry<'portfolio'>['data'] = {
    title: 'fakt',
    description: 'A library.',
    draft: false,
    tech: ['Kotlin', 'KMP'],
    featured: true,
  };
  it('is SoftwareSourceCode with codeRepository when a repo is set', () => {
    const c = creativeWorkLd(
      { ...base, repo: 'https://github.com/rsicarelli/fakt' },
      { url: URL_, locale: 'en', authorName: 'X' },
    );
    expect(c['@type']).toBe('SoftwareSourceCode');
    expect(c.codeRepository).toBe('https://github.com/rsicarelli/fakt');
    expect(c.programmingLanguage).toEqual(['Kotlin', 'KMP']);
  });
  it('is CreativeWork (keywords, no repo) otherwise', () => {
    const c = creativeWorkLd(base, { url: URL_, locale: 'en', authorName: 'X' });
    expect(c['@type']).toBe('CreativeWork');
    expect(c.codeRepository).toBeUndefined();
    expect(c.keywords).toEqual(['Kotlin', 'KMP']);
  });
});

describe('eventLd', () => {
  const base: CollectionEntry<'events'>['data'] = {
    title: 'KotlinConf 2025',
    description: 'A talk.',
    draft: false,
    startDate: new Date('2025-05-21T00:00:00Z'),
    endDate: new Date('2025-05-23T00:00:00Z'),
    kind: 'talk',
  };
  it('is an offline Event with a Place when a location is set', () => {
    const e = eventLd(
      { ...base, location: 'Copenhagen, Denmark' },
      { url: URL_, locale: 'en', performerName: 'Rodrigo Sicarelli' },
    );
    expect(e['@type']).toBe('Event');
    expect(e.startDate).toBe('2025-05-21');
    expect(e.endDate).toBe('2025-05-23');
    expect(e.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode');
    expect(e.location).toMatchObject({ '@type': 'Place', name: 'Copenhagen, Denmark' });
    expect(e.performer).toEqual({ '@type': 'Person', name: 'Rodrigo Sicarelli' });
  });
  it('is online with a VirtualLocation when no location is set', () => {
    const e = eventLd(base, { url: URL_, locale: 'en', performerName: 'X' });
    expect(e.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
    expect(e.location).toMatchObject({ '@type': 'VirtualLocation' });
  });
});

describe('breadcrumbLd & faqPageLd', () => {
  it('numbers breadcrumb positions from 1', () => {
    const b = breadcrumbLd([
      { name: 'Home', url: 'https://x/en' },
      { name: 'Blog', url: 'https://x/en/blog' },
    ]);
    expect(b['@type']).toBe('BreadcrumbList');
    expect(b.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://x/en' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://x/en/blog' },
    ]);
  });
  it('builds a FAQPage of Question/acceptedAnswer pairs', () => {
    const f = faqPageLd([{ question: 'Q?', answer: 'A.' }]);
    expect(f['@type']).toBe('FAQPage');
    expect(f.mainEntity).toEqual([
      { '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } },
    ]);
  });
});

describe('rendered JSON-LD over dist/**', () => {
  let pages: RenderedPage[];

  /** Every ld+json node across every page, flattened from each block's @graph. */
  function allNodes(): { type: string; node: Record<string, unknown>; relPath: string }[] {
    const out: { type: string; node: Record<string, unknown>; relPath: string }[] = [];
    for (const p of pages) {
      const scripts = [
        ...parseHTML(p.html).document.querySelectorAll('script[type="application/ld+json"]'),
      ];
      for (const s of scripts) {
        const doc = JSON.parse(s.textContent ?? ''); // throws → fails the test (breakout guard)
        expect(doc['@context'], `${p.relPath}: missing @context`).toBe('https://schema.org');
        for (const node of doc['@graph'] ?? [doc]) {
          out.push({ type: node['@type'], node, relPath: p.relPath });
        }
      }
    }
    return out;
  }

  beforeAll(async () => {
    pages = await collectLocalePages();
  });

  it('every ld+json block is valid JSON with a schema.org context', () => {
    const nodes = allNodes();
    expect(nodes.length, 'no JSON-LD emitted anywhere').toBeGreaterThan(0);
  });

  it('blog posts emit a BlogPosting with a name-only author and dateModified', () => {
    const posts = allNodes().filter((n) => n.type === 'BlogPosting');
    expect(posts.length, 'no BlogPosting rendered').toBeGreaterThan(0);
    for (const { node, relPath } of posts) {
      const author = node.author as Record<string, unknown>;
      expect(author.name, relPath).toBe('Rodrigo Sicarelli');
      expect(author.jobTitle, `${relPath}: author must be name-only`).toBeUndefined();
      expect(node.dateModified, relPath).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('the rich Person node (with sameAs) is present', () => {
    const persons = allNodes().filter((n) => n.type === 'Person');
    expect(persons.some((p) => Array.isArray(p.node.sameAs))).toBe(true);
  });

  it('Event and SoftwareSourceCode/CreativeWork nodes render', () => {
    const types = new Set(allNodes().map((n) => n.type));
    expect(types.has('Event')).toBe(true);
    expect(types.has('SoftwareSourceCode') || types.has('CreativeWork')).toBe(true);
  });

  it('breadcrumbs are well-formed (positions 1..n)', () => {
    for (const { node, relPath } of allNodes().filter((n) => n.type === 'BreadcrumbList')) {
      const items = node.itemListElement as { position: number }[];
      items.forEach((it, i) => expect(it.position, relPath).toBe(i + 1));
    }
  });
});
