// Ambient type declarations for the MIT-licensed `page-flip` engine
// (StPageFlip, https://github.com/Nodlik/StPageFlip — MIT © 2020 Nodlik).
//
// The published `page-flip@2.0.7` package ships compiled JS
// (`dist/js/page-flip.module.js`) but NO `.d.ts`, so we describe the slice of
// its public API we depend on here. Kept intentionally minimal — only the
// settings, methods, and events our `<PageFlip>` runtime actually uses. See the
// upstream `src/PageFlip.ts` / `src/Settings.ts` for the full surface.

declare module 'page-flip' {
  /** Active corner a turn animates from. */
  export type FlipCornerName = 'top' | 'bottom';

  /** Book orientation. `'portrait'` shows a single page; `'landscape'` a spread. */
  export type OrientationName = 'portrait' | 'landscape';

  /** Book lifecycle states emitted on the `changeState` event. */
  export type FlippingStateName = 'user_fold' | 'fold_corner' | 'flipping' | 'read';

  /** Subset of the upstream `FlipSetting` we configure. All optional here. */
  export interface FlipSetting {
    /** Page index to start on. Default 0. */
    startPage: number;
    /** `'fixed'` (use width/height) or `'stretch'` (fit parent within bounds). */
    size: 'fixed' | 'stretch';
    /** Base page width (required by the engine). */
    width: number;
    /** Base page height (required by the engine). */
    height: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    /** Cast realistic page-edge shadows during a turn. */
    drawShadow: boolean;
    /** Turn animation time (ms). */
    flippingTime: number;
    /** Allow collapsing to a single-page portrait layout (clones page DOM). */
    usePortrait: boolean;
    startZIndex: number;
    /** Size the parent element to the book. */
    autoSize: boolean;
    /** Shadow intensity, 0..1. */
    maxShadowOpacity: number;
    /** Render the first/last page as a single hard cover. */
    showCover: boolean;
    /** Don't hijack touch scroll on mobile until a turn starts. */
    mobileScrollSupport: boolean;
    /** Forward clicks on `<a>`/`<button>` page children instead of flipping. */
    clickEventForward: boolean;
    /** Wire the engine's own mouse/touch drag + click-to-flip. */
    useMouseEvents: boolean;
    swipeDistance: number;
    /** Fold the page corner when the pointer hovers it. */
    showPageCorners: boolean;
    /** Lock click-to-flip except on the corners. */
    disableFlipByClick: boolean;
  }

  /**
   * The book's current size and position, in coordinates relative to the
   * engine's `.stf__block` (which fills the mount host). Returned by
   * {@link PageFlip.getBoundsRect}. `pageWidth` is the width of ONE page — equal
   * to the whole book width in portrait, half of it in landscape.
   *
   * The visible page edges derive from this:
   *  - portrait: a single page drawn on the RIGHT slot — spans
   *    `[left + pageWidth, left + 2*pageWidth]`.
   *  - landscape: a two-page spread — spans `[left, left + width]`.
   */
  export interface PageRect {
    left: number;
    top: number;
    width: number;
    height: number;
    pageWidth: number;
  }

  /** Payload shape for the `init` / `update` events. */
  export interface PageFlipPageEvent {
    page: number;
    mode: OrientationName;
  }

  /** The event object passed to `on(...)` listeners. */
  export interface WidgetEvent<T = unknown> {
    data: T;
    object: PageFlip;
  }

  export class PageFlip {
    constructor(inBlock: HTMLElement, setting: Partial<FlipSetting>);

    /** Load book pages from existing HTML elements (HTML mode). */
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    /** Replace the current pages from HTML elements. */
    updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void;

    /** Animated turn forward. */
    flipNext(corner?: FlipCornerName): void;
    /** Animated turn backward. */
    flipPrev(corner?: FlipCornerName): void;
    /** Animated turn to a specific page. */
    flip(page: number, corner?: FlipCornerName): void;
    /** Jump to a page without animation. */
    turnToPage(page: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;

    getPageCount(): number;
    getCurrentPageIndex(): number;
    getOrientation(): OrientationName;
    getState(): FlippingStateName;
    /** Current book size + position (relative to the mount host). */
    getBoundsRect(): PageRect;

    /** Re-measure and re-render (call after a container resize). */
    update(): void;

    /** Remove the root element and all engine handlers. */
    destroy(): void;

    on(event: 'flip', cb: (e: WidgetEvent<number>) => void): PageFlip;
    on(event: 'changeOrientation', cb: (e: WidgetEvent<OrientationName>) => void): PageFlip;
    on(event: 'changeState', cb: (e: WidgetEvent<FlippingStateName>) => void): PageFlip;
    on(event: 'init', cb: (e: WidgetEvent<PageFlipPageEvent>) => void): PageFlip;
    on(event: 'update', cb: (e: WidgetEvent<PageFlipPageEvent>) => void): PageFlip;
    on(event: string, cb: (e: WidgetEvent) => void): PageFlip;
  }
}
