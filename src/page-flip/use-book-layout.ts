import { useEffect, useState } from 'react';

/** How many page-faces a turn shows at once. */
export type BookMode = 'single' | 'spread';

/** Caller intent for the layout: force one mode, or let it auto-resolve. */
export type BookModePreference = BookMode | 'auto';

/**
 * Width (px) below which `auto` always uses a single page, even in landscape —
 * a narrow landscape window (a phone, a thin split-view) can't fit a readable
 * two-page spread. Mirrors DearFlip's `pageMode: AUTO` breakpoint behaviour.
 */
export const SPREAD_MIN_WIDTH = 820;

/**
 * Resolve the book layout responsively, à la DearFlip `pageMode: AUTO`:
 *  - landscape AND wide enough → two-page **spread**
 *  - portrait, or too narrow → **single** page
 *
 * Re-resolves on resize / orientation change. Pass an explicit `preference`
 * (`'single'` | `'spread'`) to override the auto behaviour (e.g. in Storybook).
 *
 * SSR-safe: starts `single` (the conservative, always-fits choice) and upgrades
 * on the client after mount. The page-flip's at-rest layer is live DOM either
 * way, so a single→spread flip on hydration costs nothing structurally.
 */
export function useBookLayout(preference: BookModePreference = 'auto'): BookMode {
  const [mode, setMode] = useState<BookMode>(preference === 'spread' ? 'spread' : 'single');

  useEffect(() => {
    if (preference !== 'auto') {
      setMode(preference);
      return;
    }
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const landscape = window.matchMedia('(orientation: landscape)');
    const wide = window.matchMedia(`(min-width: ${SPREAD_MIN_WIDTH}px)`);

    const resolve = () => setMode(landscape.matches && wide.matches ? 'spread' : 'single');
    resolve();

    landscape.addEventListener('change', resolve);
    wide.addEventListener('change', resolve);
    return () => {
      landscape.removeEventListener('change', resolve);
      wide.removeEventListener('change', resolve);
    };
  }, [preference]);

  return mode;
}
