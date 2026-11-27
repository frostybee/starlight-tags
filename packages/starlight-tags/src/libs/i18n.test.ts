import { describe, it, expect } from 'vitest';
import { buildLocaleKeys, resolveLocalizedString } from './i18n.js';

// Config from issue #12: root locale is Traditional Chinese, plus English
const rootZhTw = {
  locales: {
    root: { lang: 'zh-TW' },
    en: { lang: 'en' },
  },
  defaultLocale: { locale: undefined, lang: 'zh-TW' },
};

describe('buildLocaleKeys', () => {
  it('uses the root lang and "root" on root pages', () => {
    expect(buildLocaleKeys(undefined, rootZhTw)).toEqual(['zh-TW', 'root', 'en']);
  });

  it('does not try "root" on prefixed locale pages', () => {
    expect(buildLocaleKeys('en', rootZhTw)).toEqual(['en', 'zh-TW']);
  });

  it('includes the locale lang when it differs from the key', () => {
    const config = {
      locales: { root: { lang: 'en' }, 'pt-br': { lang: 'pt-BR' } },
      defaultLocale: { locale: undefined, lang: 'en' },
    };
    expect(buildLocaleKeys('pt-br', config)).toEqual(['pt-br', 'en']);
  });

  it('falls back to a non-root default locale', () => {
    const config = {
      locales: { fr: { lang: 'fr' }, de: { lang: 'de' } },
      defaultLocale: { locale: 'fr', lang: 'fr' },
    };
    expect(buildLocaleKeys('de', config)).toEqual(['de', 'fr', 'en']);
  });

  it('uses the default lang on single-language sites', () => {
    const config = { defaultLocale: { locale: undefined, lang: 'ja' } };
    expect(buildLocaleKeys(undefined, config)).toEqual(['ja', 'root', 'en']);
  });

  it('still returns "root" and "en" without any config', () => {
    expect(buildLocaleKeys(undefined, undefined)).toEqual(['root', 'en']);
  });
});

describe('resolveLocalizedString', () => {
  const rootKeys = buildLocaleKeys(undefined, rootZhTw);

  it('returns plain strings as-is', () => {
    expect(resolveLocalizedString('Hello', ['fr'])).toBe('Hello');
  });

  it('returns undefined for undefined values', () => {
    expect(resolveLocalizedString(undefined, ['en'])).toBeUndefined();
  });

  it('matches the first key in order', () => {
    expect(resolveLocalizedString({ en: 'Hello', fr: 'Bonjour' }, ['fr', 'en'])).toBe('Bonjour');
  });

  it('matches a "root" key on root pages', () => {
    expect(resolveLocalizedString({ en: 'Tag', root: '標籤' }, rootKeys)).toBe('標籤');
  });

  it('matches the root lang case-insensitively', () => {
    expect(resolveLocalizedString({ en: 'Tag', 'zh-tw': '標籤' }, rootKeys)).toBe('標籤');
    expect(resolveLocalizedString({ en: 'Tag', 'zh-TW': '標籤' }, rootKeys)).toBe('標籤');
  });

  it('prefers the lang over "root" when both exist', () => {
    expect(resolveLocalizedString({ root: 'Root', 'zh-TW': 'Lang' }, rootKeys)).toBe('Lang');
  });

  it('falls back to the default lang on prefixed pages', () => {
    const keys = buildLocaleKeys('en', rootZhTw);
    expect(resolveLocalizedString({ 'zh-TW': '標籤', de: 'Schlagwort' }, keys)).toBe('標籤');
  });

  it('falls back to "en", then to the first value', () => {
    expect(resolveLocalizedString({ de: 'Schlagwort', en: 'Tag' }, ['fr', 'en'])).toBe('Tag');
    expect(resolveLocalizedString({ de: 'Schlagwort', es: 'Etiqueta' }, ['fr', 'en'])).toBe('Schlagwort');
  });

  it('skips empty values', () => {
    expect(resolveLocalizedString({ fr: '', en: 'Tag' }, ['fr', 'en'])).toBe('Tag');
  });
});
