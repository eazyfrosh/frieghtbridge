'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { THEME_STORAGE_KEY, parseTheme, resolveTheme, type Theme } from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * Light / dark / system, as a three-way segmented control.
 *
 * Three options rather than a two-state switch, because "follow my system" is
 * a real answer and a binary toggle cannot express it — once someone taps a
 * plain switch they are pinned to that choice forever, including when their
 * phone moves to dark at sunset.
 */

const OPTIONS: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  // Starts at 'system' on both server and client so the markup matches, then
  // corrects on mount. The inline script in `<head>` has already applied the
  // right theme to the document, so this only catches the control up.
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(parseTheme(localStorage.getItem(THEME_STORAGE_KEY)));
    setMounted(true);
  }, []);

  const apply = useCallback((next: Theme) => {
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode. The choice still applies for this page view.
    }
    document.documentElement.classList.toggle('dark', resolveTheme(next) === 'dark');
  }, []);

  // While on "system", follow the OS if it changes mid-session — someone whose
  // phone switches at sunset should not have to reload.
  useEffect(() => {
    if (theme !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => document.documentElement.classList.toggle('dark', query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [theme]);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn('inline-flex items-center gap-0.5 rounded-full border border-ink-200 p-0.5', className)}
    >
      {OPTIONS.map((option) => {
        // Before mount nothing is marked selected, so the server and client
        // agree; a wrong highlight for one frame is worse than none.
        const active = mounted && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={`${option.label} theme`}
            onClick={() => apply(option.value)}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200',
              active
                ? 'bg-ink-900 text-surface'
                : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900',
            )}
          >
            <option.icon className="h-[0.95rem] w-[0.95rem]" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
