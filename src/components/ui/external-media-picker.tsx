'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * ExternalMediaPicker (L8 — Studio external media composer)
 *
 * Composer surface for embedding an external media reference (publisher URL,
 * YouTube video, Spotify/Apple podcast, viz subtype). The primitive renders:
 *
 *   - Source kind toggle  (Publisher URL | Video | Podcast | Visual)
 *   - URL / identifier input (controlled)
 *   - "Resolve" CTA slot (caller-supplied button)
 *   - Resolved preview (caller-supplied node — could be a video player,
 *     publisher OG card, etc.)
 *   - Fallback hint when the URL fails to resolve, wired through
 *     FallbackState in the consumer surface using the appropriate proto
 *     reason (EXTERNAL_URL_UNRESOLVED / EXTERNAL_VIDEO_UNAVAILABLE / etc.)
 *
 * The component never fakes resolution — it is fetcher-agnostic and renders
 * exactly what the consumer passes via `previewNode` / `errorNode`.
 * ──────────────────────────────────────────────────────────────────────────── */

export type ExternalMediaKind = 'publisher_url' | 'video' | 'podcast' | 'visual';

export interface ExternalMediaPickerProps {
  /** Current source kind selection. */
  kind: ExternalMediaKind;
  /** Called when the kind changes. */
  onKindChange?: (next: ExternalMediaKind) => void;
  /** Current URL / identifier value. */
  url: string;
  /** Called on every input change. */
  onUrlChange?: (next: string) => void;
  /** Called when the user explicitly commits the URL (Enter, "Resolve" CTA). */
  onResolve?: (url: string, kind: ExternalMediaKind) => void;
  /** Optional placeholder, defaults derived from `kind`. */
  placeholder?: string;
  /** Optional input label override. */
  inputLabel?: string;
  /** Resolved preview node — typically the consumer renders an embed. */
  previewNode?: React.ReactNode;
  /** Error / fallback node — typically a `<FallbackState />` with the matching proto reason. */
  errorNode?: React.ReactNode;
  /** Optional CTA slot rendered to the right of the input. */
  resolveCta?: React.ReactNode;
  /** Optional footer slot for help links etc. */
  footer?: React.ReactNode;
  /** Disable all inputs. */
  disabled?: boolean;
  className?: string;
}

const KIND_LABEL: Record<ExternalMediaKind, string> = {
  publisher_url: 'Publisher URL',
  video: 'Video',
  podcast: 'Podcast',
  visual: 'Visual',
};

const KIND_DESCRIPTION: Record<ExternalMediaKind, string> = {
  publisher_url: 'OG-card preview from any public URL.',
  video: 'YouTube video URL.',
  podcast: 'Spotify or Apple Podcasts episode URL.',
  visual: 'Identifier of a viz subtype registered in viz-service.',
};

const KIND_PLACEHOLDER: Record<ExternalMediaKind, string> = {
  publisher_url: 'https://example.com/article',
  video: 'https://www.youtube.com/watch?v=…',
  podcast: 'https://open.spotify.com/episode/…',
  visual: 'viz subtype id (e.g. shot-map-v2)',
};

const KIND_INPUT_TYPE: Record<ExternalMediaKind, string> = {
  publisher_url: 'url',
  video: 'url',
  podcast: 'url',
  visual: 'text',
};

const KIND_ORDER: ReadonlyArray<ExternalMediaKind> = [
  'publisher_url',
  'video',
  'podcast',
  'visual',
];

export function ExternalMediaPicker({
  kind,
  onKindChange,
  url,
  onUrlChange,
  onResolve,
  placeholder,
  inputLabel,
  previewNode,
  errorNode,
  resolveCta,
  footer,
  disabled,
  className,
}: ExternalMediaPickerProps) {
  const inputId = React.useId();
  return (
    <section
      data-slot="external-media-picker"
      data-kind={kind}
      data-state={errorNode ? 'error' : previewNode ? 'resolved' : 'idle'}
      className={cn(
        'flex w-full flex-col gap-3 border border-white/10 bg-[var(--color-grey-200)]',
        'px-4 py-3.5 text-white',
        className
      )}
    >
      <header className="flex flex-col gap-1">
        <span
          data-slot="external-media-picker-eyebrow"
          className="text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]"
        >
          External media
        </span>
        <h3 className="text-sm font-semibold tracking-tight">{KIND_LABEL[kind]}</h3>
        <p className="text-[11px] leading-snug text-white/65">{KIND_DESCRIPTION[kind]}</p>
      </header>

      <div
        data-slot="external-media-picker-kinds"
        role="tablist"
        aria-label="External media kind"
        className="inline-flex flex-wrap items-center gap-1"
      >
        {KIND_ORDER.map((option) => {
          const active = option === kind;
          return (
            <button
              key={option}
              type="button"
              role="tab"
              data-slot="external-media-picker-kind"
              data-id={option}
              data-active={active || undefined}
              aria-selected={active}
              onClick={() => onKindChange?.(option)}
              disabled={disabled}
              className={cn(
                'inline-flex h-7 items-center px-3 text-[11px] tracking-[0.04em]',
                'border transition-colors',
                active
                  ? 'border-[var(--color-red-100)] bg-[var(--color-red-100)]/15 text-[var(--color-red-100)]'
                  : 'border-white/15 text-white/70 hover:border-white/30',
                'focus-visible:outline-none focus-visible:border-[var(--color-red-100)]',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
            >
              {KIND_LABEL[option]}
            </button>
          );
        })}
      </div>

      <div
        data-slot="external-media-picker-row"
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <label htmlFor={inputId} className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[10px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]">
            {inputLabel ?? `${KIND_LABEL[kind]} URL`}
          </span>
          <input
            id={inputId}
            data-slot="external-media-picker-input"
            type={KIND_INPUT_TYPE[kind]}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={url}
            placeholder={placeholder ?? KIND_PLACEHOLDER[kind]}
            disabled={disabled}
            onChange={(event) => onUrlChange?.(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onResolve?.(url, kind);
              }
            }}
            className={cn(
              'h-9 w-full border border-white/15 bg-transparent px-2',
              'font-mono text-[12px] text-white',
              'focus-visible:outline-none focus-visible:border-[var(--color-red-100)]',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          />
        </label>
        {resolveCta ? (
          <div data-slot="external-media-picker-cta" className="flex shrink-0 items-center">
            {resolveCta}
          </div>
        ) : null}
      </div>

      {previewNode ? (
        <div
          data-slot="external-media-picker-preview"
          className="border border-white/[0.06] bg-[var(--color-grey-300)] p-3"
        >
          {previewNode}
        </div>
      ) : null}

      {errorNode ? <div data-slot="external-media-picker-error">{errorNode}</div> : null}

      {footer ? (
        <footer
          data-slot="external-media-picker-footer"
          className="border-t border-white/[0.06] pt-2 text-[11px] text-white/55"
        >
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
