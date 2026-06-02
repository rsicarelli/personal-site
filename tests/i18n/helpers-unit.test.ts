import { describe, it, expect } from 'vitest';
import { stripLocale, contentSuffix, hreflangOf, useTranslations } from '@/i18n/utils';
import { ui } from '@/i18n/ui';
import { LOCALES } from '@/config/site';

describe('stripLocale', () => {
  it('drops a leading locale segment', () => {
    expect(stripLocale('/en/about')).toBe('/about');
    expect(stripLocale('/pt-br/blog/post')).toBe('/blog/post');
  });
  it('returns / for a bare locale root (with or without trailing slash)', () => {
    expect(stripLocale('/en')).toBe('/');
    expect(stripLocale('/pt-br/')).toBe('/');
  });
  it('leaves a path without a locale prefix unchanged', () => {
    expect(stripLocale('/')).toBe('/');
    expect(stripLocale('/about')).toBe('/about');
  });
});

describe('contentSuffix', () => {
  it('maps the URL slug to the on-disk file suffix (pt-br → pt)', () => {
    expect(contentSuffix('en')).toBe('en');
    expect(contentSuffix('pt-br')).toBe('pt');
  });
});

describe('hreflangOf', () => {
  it('uppercases the region for the hreflang attribute', () => {
    expect(hreflangOf('en')).toBe('en');
    expect(hreflangOf('pt-br')).toBe('pt-BR');
  });
});

describe('useTranslations', () => {
  it('returns the localized string for a key', () => {
    expect(useTranslations('en')('nav.about')).toBe('About');
    expect(useTranslations('pt-br')('nav.about')).toBe('Sobre');
  });
});

describe('UI dictionary', () => {
  it('every locale defines exactly the same keys', () => {
    const enKeys = Object.keys(ui.en).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(ui[locale]).sort(), locale).toEqual(enKeys);
    }
  });
  it('navigation labels are actually translated, not copied', () => {
    expect(ui.en['nav.about']).not.toBe(ui['pt-br']['nav.about']);
    expect(ui.en['nav.talks']).not.toBe(ui['pt-br']['nav.talks']);
  });
});
