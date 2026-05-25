'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * StudioCockpitSidebar (L6 — Studio cockpit shell)
 *
 * Persistent navigation sidebar for the Studio cockpit shell. The cockpit has
 * a fixed left-column with grouped nav items (Drafts, Published, Insights,
 * Engagement, Composer From Source, Squads, Settings). Each item carries an
 * optional badge (count or dot) and an optional secondary line.
 *
 * The component is router-agnostic: callers wire `href` through the
 * existing `<LinkProvider>` context just like other navigation primitives.
 * When the consumer passes `onSelect`, the sidebar will fall back to a
 * button-style nav (used for actions that don't navigate).
 *
 * Sections collapse into an accordion at narrow widths, but at this layer the
 * primitive renders the full grouped list — collapse logic is consumer-side.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface StudioCockpitSidebarItem {
  /** Stable id used as the React key and the active-state matcher. */
  id: string;
  /** Visible label. */
  label: string;
  /** Optional secondary description line. */
  description?: string;
  /** Optional href — when present, rendered via the LinkProvider context. */
  href?: string;
  /** Optional click handler — when present, rendered as a button. */
  onSelect?: (id: string) => void;
  /** Optional numeric badge (e.g. unread count). */
  badgeCount?: number;
  /** Optional status dot — undefined hides the dot. */
  dot?: 'todo' | 'doing' | 'done' | 'warn';
  /** Optional icon node — caller provides a 16×16 React node. */
  icon?: React.ReactNode;
  /** Mark the item as active. */
  isActive?: boolean;
  /** Disable the item — renders muted, not interactive. */
  disabled?: boolean;
}

export interface StudioCockpitSidebarSection {
  /** Stable id for the section. */
  id: string;
  /** Eyebrow text. */
  label: string;
  /** Nav items in display order. */
  items: readonly StudioCockpitSidebarItem[];
}

export interface StudioCockpitSidebarProps {
  /** Cockpit identity — typically the active editor's name + role. */
  identity?: {
    label: string;
    secondary?: string;
    accentColor?: string;
    imageUrl?: string;
  };
  /** Grouped nav sections. */
  sections: readonly StudioCockpitSidebarSection[];
  /** Footer slot — typically a logout / shell-switch CTA. */
  footer?: React.ReactNode;
  className?: string;
}

export function StudioCockpitSidebar({
  identity,
  sections,
  footer,
  className,
}: StudioCockpitSidebarProps) {
  return (
    <nav
      data-slot="studio-cockpit-sidebar"
      data-section-count={sections.length}
      aria-label="Studio cockpit navigation"
      className={cn(
        'flex h-full w-full flex-col gap-3 border-r border-white/[0.06]',
        'bg-[var(--color-grey-100)] text-white',
        className
      )}
    >
      {identity ? (
        <header
          data-slot="studio-cockpit-sidebar-identity"
          className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3"
        >
          <span
            data-slot="studio-cockpit-sidebar-identity-avatar"
            aria-hidden="true"
            style={{ backgroundColor: identity.accentColor ?? 'var(--color-grey-300)' }}
            className={cn(
              'relative inline-flex size-9 shrink-0 items-center justify-center',
              'rounded-full border border-white/10 overflow-hidden',
              'text-[10px] font-bold tracking-tight text-white'
            )}
          >
            {identity.imageUrl ? (
              <img
                src={identity.imageUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
                loading="lazy"
              />
            ) : (
              <span>{initialsFor(identity.label)}</span>
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span
              data-slot="studio-cockpit-sidebar-identity-label"
              className="truncate text-[13px] font-semibold tracking-tight"
            >
              {identity.label}
            </span>
            {identity.secondary ? (
              <span
                data-slot="studio-cockpit-sidebar-identity-secondary"
                className="truncate text-[10px] tracking-[0.04em] uppercase text-[var(--color-grey-500)]"
              >
                {identity.secondary}
              </span>
            ) : null}
          </div>
        </header>
      ) : null}

      <div
        data-slot="studio-cockpit-sidebar-sections"
        className="flex flex-1 flex-col gap-4 px-2 py-2"
      >
        {sections.map((section) => (
          <section
            key={section.id}
            data-slot="studio-cockpit-sidebar-section"
            data-section-id={section.id}
            aria-labelledby={`studio-cockpit-sidebar-${section.id}-label`}
            className="flex flex-col gap-1"
          >
            <h4
              id={`studio-cockpit-sidebar-${section.id}-label`}
              data-slot="studio-cockpit-sidebar-section-label"
              className="px-2 text-[9px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]"
            >
              {section.label}
            </h4>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <li key={item.id}>
                  <SidebarItem item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {footer ? (
        <footer
          data-slot="studio-cockpit-sidebar-footer"
          className="border-t border-white/[0.06] px-4 py-3 text-[11px] text-white/60"
        >
          {footer}
        </footer>
      ) : null}
    </nav>
  );
}

function SidebarItem({ item }: { item: StudioCockpitSidebarItem }) {
  const interactive = !item.disabled && (item.href !== undefined || item.onSelect !== undefined);
  const Element: 'a' | 'button' | 'div' = item.href ? 'a' : item.onSelect ? 'button' : 'div';

  const elementProps =
    Element === 'a'
      ? ({ href: item.href } as React.AnchorHTMLAttributes<HTMLAnchorElement>)
      : Element === 'button'
        ? ({
            type: 'button' as const,
            onClick: () => item.onSelect?.(item.id),
            disabled: item.disabled,
          } as React.ButtonHTMLAttributes<HTMLButtonElement>)
        : {};

  return (
    <Element
      data-slot="studio-cockpit-sidebar-item"
      data-id={item.id}
      data-active={item.isActive || undefined}
      data-disabled={item.disabled || undefined}
      aria-current={item.isActive ? 'page' : undefined}
      {...elementProps}
      className={cn(
        'group/studio-cockpit-sidebar-item flex w-full items-center gap-2.5 px-2 py-1.5',
        'text-left text-[12px] tracking-tight',
        item.isActive
          ? 'bg-[var(--color-red-100)]/15 text-white border-l-2 border-[var(--color-red-100)]'
          : 'text-white/75 border-l-2 border-transparent',
        interactive && !item.isActive && 'hover:bg-white/[0.03] hover:text-white',
        interactive && 'focus-visible:outline-none focus-visible:bg-white/[0.04]',
        item.disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {item.icon ? (
        <span
          data-slot="studio-cockpit-sidebar-item-icon"
          aria-hidden="true"
          className="inline-flex size-4 shrink-0 items-center justify-center text-white/70"
        >
          {item.icon}
        </span>
      ) : null}

      <span className="flex min-w-0 flex-1 flex-col">
        <span data-slot="studio-cockpit-sidebar-item-label" className="truncate font-medium">
          {item.label}
        </span>
        {item.description ? (
          <span
            data-slot="studio-cockpit-sidebar-item-description"
            className="truncate text-[10px] tracking-[0.04em] text-white/55"
          >
            {item.description}
          </span>
        ) : null}
      </span>

      {item.dot ? <SidebarDot tone={item.dot} /> : null}
      {item.badgeCount !== undefined && item.badgeCount > 0 ? (
        <span
          data-slot="studio-cockpit-sidebar-item-badge"
          aria-label={`${item.badgeCount} pending`}
          className={cn(
            'inline-flex min-w-5 items-center justify-center px-1.5 py-0.5',
            'font-mono text-[10px] font-semibold tabular-nums',
            'border border-[var(--color-red-100)]/40 bg-[var(--color-red-100)]/15 text-[var(--color-red-100)]'
          )}
        >
          {item.badgeCount > 99 ? '99+' : item.badgeCount}
        </span>
      ) : null}
    </Element>
  );
}

function SidebarDot({ tone }: { tone: NonNullable<StudioCockpitSidebarItem['dot']> }) {
  return (
    <span
      data-slot="studio-cockpit-sidebar-item-dot"
      data-tone={tone}
      aria-hidden="true"
      className={cn(
        'size-1.5 shrink-0 rounded-full',
        tone === 'todo' && 'bg-[var(--color-status-todo)]',
        tone === 'doing' && 'bg-amber-300',
        tone === 'done' && 'bg-[var(--color-status-done)]',
        tone === 'warn' && 'bg-amber-400'
      )}
    />
  );
}

function initialsFor(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '··';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
