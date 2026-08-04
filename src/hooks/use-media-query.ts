import { useState, useEffect } from 'react';

/**
 * Resolves a `MediaQueryList`, or `null` where the host cannot answer.
 *
 * `matchMedia` is CSSOM View and has shipped in every browser for well over a
 * decade, but "every browser" is not "every host". jsdom does not implement
 * it, so a component that calls it unguarded throws
 * `window.matchMedia is not a function` the moment a consumer mounts that
 * component in a jsdom test — which is exactly what 0.85.0 did to studio when
 * `Sheet` started using {@link useIsMobile}.
 *
 * Three shapes are rejected, all of them real:
 *
 *  - no `window` at all (server render, node test environment);
 *  - a `window` with no `matchMedia` (jsdom);
 *  - a partial stub. The polyfill people paste into test setups is often
 *    `() => ({ matches: false, addListener() {}, removeListener() {} })`,
 *    which answers the query but has no `addEventListener` — so the guard has
 *    to cover subscribing as well as asking, or the crash simply moves one
 *    line down.
 */
export function resolveMediaQueryList(query: string): MediaQueryList | null {
  if (typeof window === 'undefined') return null;
  if (typeof window.matchMedia !== 'function') return null;

  const list = window.matchMedia(query);
  if (!list || typeof list.matches !== 'boolean') return null;

  return list;
}

/**
 * Whether `query` currently matches.
 *
 * ## What an unevaluable query returns, and why
 *
 * `false` — the query does not match. Where the host cannot answer,
 * {@link useIsMobile} therefore reports desktop.
 *
 *  1. It is already this hook's answer for "cannot evaluate YET": the state
 *     initialises `false` and only consults `matchMedia` in an effect, so the
 *     server and the client's first render agree. `Sheet` and the editor's
 *     `PlayerPickerSurface` both lean on that contract explicitly. Giving
 *     "cannot evaluate EVER" the same answer means there is one rule, not
 *     two, and no second hydration-mismatch surface to reason about.
 *  2. In a test environment it is the inert path. The desktop branch of
 *     `Sheet` subscribes to nothing and writes no inline style. Defaulting to
 *     mobile would switch on visual-viewport tracking in precisely the
 *     environment that also has no `visualViewport`, in service of a keyboard
 *     correction that cannot mean anything where there is no layout.
 *  3. In an exotic browser it is the conservative path. Layout is decided by
 *     CSS — `bottom-0 … sm:bottom-6` — and this hook only gates a JS
 *     correction layered on top. `false` means the JS adds nothing and the
 *     stylesheet alone decides, which is the behaviour that shipped for every
 *     release before the keyboard fix. `true` would let JS write an inline
 *     offset on a viewport where the `sm:` rules may be the active ones, so
 *     the two could disagree.
 *  4. The two ways of being wrong are not equally bad. Wrongly desktop
 *     reinstates a known, previously-shipped shortcoming on a host that
 *     almost certainly has no on-screen keyboard. Wrongly mobile invents a
 *     new one — an inline override fighting the stylesheet — on hosts where
 *     nothing was broken.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = resolveMediaQueryList(query);
    // Unevaluable: leave `matches` at `false`. See the doc comment above for
    // why that is the right way to be wrong.
    if (!media) return;

    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }

    // Safari below 14, and the common hand-written test stub, only have the
    // deprecated pair.
    if (typeof media.addListener === 'function') {
      media.addListener(listener);
      return () => media.removeListener?.(listener);
    }

    // Answered once, but there is no way to be told when it changes. A
    // correct first answer beats throwing.
    return;
  }, [query]);

  return matches;
}

// Convenience hooks
export const useIsMobile = () => useMediaQuery('(max-width: 639px)');
export const useIsTablet = () => useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
