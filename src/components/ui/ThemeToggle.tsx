import * as React from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Theme = 'light' | 'dark';

/** Read the effective theme the same way the no-FOUC bootstrap in BaseLayout does. */
function readTheme(): Theme {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

/**
 * ThemeToggle (#42) — the one interactive island in the chrome. Toggles between light and dark,
 * persists the choice to localStorage (read back before paint by the BaseLayout bootstrap), and
 * follows the OS preference until the user makes an explicit choice. SSR and the first client
 * render both assume `light` (matching markup → no hydration mismatch); the real theme class is
 * already on <html> from the inline script, so only the icon settles after mount.
 */
export function ThemeToggle({ label }: { label: string }) {
  const [theme, setTheme] = React.useState<Theme>('light');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted) applyTheme(theme);
  }, [theme, mounted]);

  // Follow OS changes only while the user hasn't pinned a preference.
  React.useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {mounted && theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
