'use client';

import * as React from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { InputGroup, InputGroupAddon, InputGroupInput } from '#/components/ui/input-group';

/* ─────────────────────────────────────────────────────────────────────────────
 * SearchField — a search input with its affordance attached.
 *
 * Composition, not a new box: `InputGroup` + an `inline-start` addon + an
 * `InputGroupInput`. The focus ring, the disabled and invalid states and the
 * click-the-addon-to-focus behaviour are the ones every other grouped field in
 * the system already has, so the addon and the control keep their own
 * `data-slot`s — `InputGroup` styles its focus ring by matching
 * `[data-slot=input-group-control]:focus-visible`, and renaming that slot would
 * quietly take the ring away.
 *
 * It takes input props directly. The local version wrapped them in an
 * `inputProps` bag, which is why `value` and `onChange` were buried in an
 * object literal at every call site, and why two of the four shipped an
 * unlabelled search box: nothing about a bag makes a name look required. Here
 * the component is an input — `value`, `onChange`, `disabled`, `name`, `form`
 * are its own props — and it always has an accessible name, defaulting to
 * "Search" rather than to nothing.
 *
 * The 16px mobile floor is carried here, not patched per page. iOS Safari zooms
 * the viewport when a focused input renders below 16px, which reads to the user
 * as the page breaking. `text-base md:text-sm` puts the floor below the
 * breakpoint and the system's own size above it. It is spelled out on this
 * element rather than left to `Input` so that a page-level override has to beat
 * a class on the input itself, and so a test can hold it. Below `md` the
 * control also grows to a 44px target, matching `PaginationFooter`.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface SearchFieldProps extends Omit<React.ComponentProps<'input'>, 'size'> {
  /**
   * The field's accessible name, rendered as `aria-label` on the input.
   *
   * Defaults to `Search`, so the control is never nameless. Pass something
   * specific when the page has more than one search box, or when the
   * placeholder says what is being searched: "Search audit logs", not "Search".
   */
  label?: string;
  /**
   * The affordance in the leading addon. Defaults to a magnifying glass; pass
   * `null` for none.
   */
  icon?: React.ReactNode;
  /** Class for the group — the bordered box. Width and margins belong here. */
  className?: string;
  /** Class for the input itself. */
  inputClassName?: string;
}

function SearchField({
  label = 'Search',
  icon,
  className,
  inputClassName,
  type = 'search',
  placeholder = 'Search',
  ...props
}: SearchFieldProps) {
  const affordance = icon === undefined ? <MagnifyingGlass aria-hidden="true" /> : icon;

  return (
    <InputGroup data-slot="search-field" className={cn('max-md:h-11', className)}>
      {affordance ? <InputGroupAddon align="inline-start">{affordance}</InputGroupAddon> : null}
      <InputGroupInput
        type={type}
        placeholder={placeholder}
        aria-label={label}
        className={cn('text-base md:text-sm', inputClassName)}
        {...props}
      />
    </InputGroup>
  );
}

export { SearchField };
