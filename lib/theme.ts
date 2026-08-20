export type Theme = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'fb-theme';

/**
 * Applies the theme before the page paints.
 *
 * This runs as a blocking inline script in `<head>`, which is the one place it
 * can go. React cannot do it: the server has no idea what the visitor chose,
 * so markup rendered without the class would paint light, and a dark-mode
 * visitor would get a white flash on every navigation before hydration swapped
 * it. Blocking is the point — it is a few lines, and it runs before first
 * paint rather than after it.
 *
 * Kept as a string rather than a real function because it is injected with
 * `dangerouslySetInnerHTML`; it must be self-contained and survive minification
 * of the surrounding bundle, which it is not part of.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var dark = stored === 'dark' ||
      ((stored === 'system' || !stored) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {
    /* Private mode can throw on localStorage. Light is the safe default. */
  }
})();
`.trim();

/** Narrows whatever came out of storage — it is user-writable. */
export function parseTheme(value: unknown): Theme {
  return value === 'dark' || value === 'light' || value === 'system' ? value : 'system';
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}
