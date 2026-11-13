import { describe, expect, it } from 'vitest';

import {
  CLOSED_FOOTER_MENU,
  footerMenuReducer,
  type FooterMenuEvent,
  type FooterMenuState,
} from '../site-footer-menu';

function run(...events: FooterMenuEvent[]): FooterMenuState {
  return events.reduce(footerMenuReducer, CLOSED_FOOTER_MENU);
}

/**
 * Hover opened the footer submenu and the click that followed toggled it
 * shut. A click on a menu opened by hover now pins it open.
 */
describe('footerMenuReducer', () => {
  it('opens on hover and closes when the pointer leaves', () => {
    expect(run('enter').open).toBe(true);
    expect(run('enter', 'leave').open).toBe(false);
  });

  it('stays open when a hover is followed by a click', () => {
    expect(run('enter', 'click')).toEqual({ open: true, pinned: true });
  });

  it('stays open after hover, click and the pointer leaving', () => {
    expect(run('enter', 'click', 'leave').open).toBe(true);
  });

  it('opens on a click with no hover and closes on a second click', () => {
    expect(run('click').open).toBe(true);
    expect(run('click', 'click').open).toBe(false);
    expect(run('enter', 'click', 'click').open).toBe(false);
  });

  it('toggles from the keyboard', () => {
    expect(run('toggle').open).toBe(true);
    expect(run('toggle', 'toggle').open).toBe(false);
    expect(run('enter', 'toggle').open).toBe(false);
  });

  it('closes on dismiss whether pinned or previewed', () => {
    expect(run('enter', 'dismiss').open).toBe(false);
    expect(run('enter', 'click', 'dismiss')).toEqual(CLOSED_FOOTER_MENU);
  });

  it('keeps a pinned menu pinned when the pointer comes back', () => {
    expect(run('click', 'leave', 'enter')).toEqual({ open: true, pinned: true });
  });
});
