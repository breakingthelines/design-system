/**
 * How a footer submenu opens and closes. Hover previews it; a click pins it.
 * Before this, hover opened the menu and the click that followed toggled it
 * shut, so clicking a menu you could already see closed it.
 *
 * - `enter` opens it as a preview; `leave` closes a preview, never a pinned menu.
 * - A pointer `click` on a closed menu or a hover preview opens and pins it;
 *   a click on a pinned menu closes it.
 * - `toggle` (Enter or Space on the trigger) flips it, pinned when open.
 * - `dismiss` (Escape, a click outside, picking a link) closes it.
 */
export interface FooterMenuState {
  open: boolean;
  pinned: boolean;
}

export type FooterMenuEvent = 'enter' | 'leave' | 'click' | 'toggle' | 'dismiss';

export const CLOSED_FOOTER_MENU: FooterMenuState = { open: false, pinned: false };

export function footerMenuReducer(state: FooterMenuState, event: FooterMenuEvent): FooterMenuState {
  switch (event) {
    case 'enter':
      return state.open ? state : { open: true, pinned: false };
    case 'leave':
      return state.pinned ? state : CLOSED_FOOTER_MENU;
    case 'click':
      return state.open && state.pinned ? CLOSED_FOOTER_MENU : { open: true, pinned: true };
    case 'toggle':
      return state.open ? CLOSED_FOOTER_MENU : { open: true, pinned: true };
    case 'dismiss':
      return CLOSED_FOOTER_MENU;
  }
}
