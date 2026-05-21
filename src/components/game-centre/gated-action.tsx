'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

import { FallbackState } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * GatedAction
 *
 * Wrapper around an action surface (a button, a sheet trigger) that
 * applies a viewer-gating policy in one place:
 *
 *   - Logged-out viewer + rich action (rate / predict / thought-compose):
 *     keep the action surface visible but hijack the click via the
 *     `onRequireAuth` callback so the consumer's sign-in modal can pop
 *     without losing the page.
 *
 *   - Logged-out viewer + shallow toggle (follow / save / comment):
 *     replace the surface with the inline sign-in CTA the consumer
 *     injects via the `signInCta` slot.
 *
 *   - Authed but role-missing (e.g. needs `squad-member` and isn't one):
 *     render a small "Members only" hint via `<FallbackState reason="VIEWER_NOT_ELIGIBLE" />`.
 *     Override with `roleHint` if a richer surface is needed.
 *
 *   - Authed and role-satisfied: render `children` as-is.
 *
 * Framework-agnostic by design: the design-system has no opinion on how
 * sign-in works, so all auth-driven surfaces are slots / callbacks.
 *
 * The roles probe is shallow: there is no light-weight "is this viewer a
 * squad member of <handle>?" check in the design-system, so the primitive
 * treats `squad-member` (or any non-"viewer"/"authed" role) as deferred
 * work. Callers that need a role check evaluate it themselves and toggle
 * `rolesSatisfied`; this primitive renders the hint when the caller
 * explicitly says `requiresRoles` cannot be met.
 * ──────────────────────────────────────────────────────────────────────────── */

export type GatedRole = 'viewer' | 'authed' | 'squad-member' | 'creator' | 'admin';

/**
 * Render mode for the anonymous-viewer treatment.
 *
 *   - `inline`  : replace the surface with the consumer's inline sign-in CTA
 *                 (`signInCta`). Use for shallow toggles (follow / save /
 *                 comment) where the inline copy reads better than a modal.
 *   - `sheet`   : keep the surface visible; clicks are intercepted and
 *                 `onRequireAuth(action)` fires so the consumer can open a
 *                 bottom-sheet sign-in flow. Use on mobile-first surfaces.
 *   - `overlay` : keep the surface visible; clicks are intercepted and
 *                 `onRequireAuth(action)` fires so the consumer can open a
 *                 centred modal / overlay sign-in flow. Use on desktop.
 */
export type GatedActionMode = 'inline' | 'sheet' | 'overlay';

export interface GatedActionProps {
  /** Active control rendered when access is granted. */
  children: React.ReactNode;
  /** Is the viewer authenticated? */
  viewerAuthed: boolean;
  /**
   * Roles required for access. Default: `["authed"]`.
   *
   * If a non-authed role (e.g. `squad-member`) is required but the caller
   * cannot verify it client-side, pass `rolesSatisfied={false}` to render
   * the "Members only" hint. Defaulting to `true` means the wrapper
   * stays out of the way for the simple authed-vs-anon flow.
   */
  requiresRoles?: readonly GatedRole[];
  /** Caller-side role check result. Default: true. */
  rolesSatisfied?: boolean;
  /**
   * Descriptor passed to `onRequireAuth` when the wrapper intercepts a
   * click for an anonymous viewer. The design-system does not interpret
   * this string; it is forwarded verbatim so the consumer can drive an
   * analytics event or pre-fill the sign-in modal.
   */
  action: string;
  /**
   * Called BEFORE the gating wrapper takes its decision. Useful for
   * analytics; the wrapper still applies its own policy.
   */
  onAttempt?: () => void;
  /**
   * Called when an anonymous viewer clicks a `sheet` or `overlay` mode
   * surface, after `preventDefault()` and `stopPropagation()` have
   * already fired. Consumers wire this to their sign-in modal.
   */
  onRequireAuth?: (action: string) => void;
  /**
   * Render mode. Default: `overlay`.
   *
   *   - `inline`  : show consumer-injected `signInCta` instead of children
   *   - `sheet`   : keep children visible; intercept clicks to onRequireAuth
   *   - `overlay` : keep children visible; intercept clicks to onRequireAuth
   */
  mode?: GatedActionMode;
  /**
   * Consumer-injected inline sign-in CTA. Required when `mode === "inline"`.
   * Renders in place of `children` for anonymous viewers.
   */
  signInCta?: React.ReactNode;
  /**
   * Optional override for the "Members only" role-hint. Defaults to a
   * `<FallbackState reason="VIEWER_NOT_ELIGIBLE" />` block.
   */
  roleHint?: React.ReactNode;
  /**
   * When mode resolves to `inline`, this className is forwarded to the
   * outer span around the sign-in CTA. The active control's own
   * className is unchanged.
   */
  ctaClassName?: string;
  className?: string;
}

export function GatedAction({
  children,
  viewerAuthed,
  requiresRoles,
  rolesSatisfied = true,
  action,
  onAttempt,
  onRequireAuth,
  mode = 'overlay',
  signInCta,
  roleHint,
  ctaClassName,
  className,
}: GatedActionProps) {
  const wrapper = cn('inline-block', className);

  // 1) Anonymous viewer
  if (!viewerAuthed) {
    if (mode === 'inline') {
      return (
        <span
          data-slot="gated-action"
          data-state="anon-inline"
          data-mode="inline"
          className={cn(wrapper, ctaClassName)}
        >
          {signInCta ?? null}
        </span>
      );
    }

    // mode === "sheet" | "overlay" - keep the surface visible, intercept clicks.
    return (
      <span
        data-slot="gated-action"
        data-state={mode === 'sheet' ? 'anon-sheet' : 'anon-overlay'}
        data-mode={mode}
        className={wrapper}
      >
        {interceptClick(children, (event) => {
          event.preventDefault();
          event.stopPropagation();
          onAttempt?.();
          onRequireAuth?.(action);
        })}
      </span>
    );
  }

  // 2) Authed but role-missing
  const needsExtraRoles =
    requiresRoles && requiresRoles.some((role) => role !== 'viewer' && role !== 'authed');
  if (needsExtraRoles && !rolesSatisfied) {
    return (
      <span data-slot="gated-action" data-state="role-missing" className={wrapper}>
        {roleHint ?? <FallbackState reason="VIEWER_NOT_ELIGIBLE" tone="info" />}
      </span>
    );
  }

  // 3) Authed + roles satisfied - render the control as-is.
  return (
    <span data-slot="gated-action" data-state="ready" className={wrapper}>
      {children}
    </span>
  );
}

/**
 * Wrap children with a click interceptor. If children is a single
 * element, clone it and prepend our handler to its onClick. Otherwise
 * wrap in a span that captures the event in the bubble phase.
 */
function interceptClick(
  children: React.ReactNode,
  handler: (event: React.MouseEvent) => void
): React.ReactNode {
  if (React.isValidElement(children)) {
    const el = children as React.ReactElement<{ onClick?: (event: React.MouseEvent) => void }>;
    const originalOnClick = el.props.onClick;
    return React.cloneElement(el, {
      onClick: (event: React.MouseEvent) => {
        handler(event);
        if (event.defaultPrevented) return;
        originalOnClick?.(event);
      },
    });
  }
  return (
    <span role="presentation" onClickCapture={(event: React.MouseEvent) => handler(event)}>
      {children}
    </span>
  );
}
