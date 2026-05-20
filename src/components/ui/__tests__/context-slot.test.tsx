import { describe, expect, it } from 'vitest';

import { ContextSlot } from '../context-slot';
import { getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('ContextSlot', () => {
  it('exposes the slot id and state on the root', () => {
    const markup = render(
      <ContextSlot slotId="lineups" title="Lineups" state="filled">
        <p>real content</p>
      </ContextSlot>
    );
    expect(getSlotAttr(markup, 'context-slot', 'data-slot-id')).toBe('lineups');
    expect(getSlotAttr(markup, 'context-slot', 'data-state')).toBe('filled');
  });

  it('renders children only when state is filled', () => {
    const markup = render(
      <ContextSlot slotId="lineups" title="Lineups" state="filled">
        body-content
      </ContextSlot>
    );
    expect(slotText(markup, 'context-slot-body')).toContain('body-content');
  });

  it('renders honest "loading" copy in pending state and hides children', () => {
    const markup = render(
      <ContextSlot slotId="x" title="Live timeline" state="pending">
        body-content
      </ContextSlot>
    );
    expect(hasSlot(markup, 'context-slot-pending')).toBe(true);
    expect(slotText(markup, 'context-slot-body')).not.toContain('body-content');
  });

  it('renders honest empty copy in empty state', () => {
    const markup = render(
      <ContextSlot slotId="x" title="Predictions" state="empty" emptyLabel="No picks yet.">
        body-content
      </ContextSlot>
    );
    expect(hasSlot(markup, 'context-slot-empty')).toBe(true);
    expect(slotText(markup, 'context-slot-empty')).toBe('No picks yet.');
  });

  it('renders the title and (when supplied) the description', () => {
    const markup = render(
      <ContextSlot slotId="x" title="Lineups" description="Confirmed 1h before kickoff." />
    );
    expect(slotText(markup, 'context-slot-title')).toBe('Lineups');
    expect(slotText(markup, 'context-slot-description')).toContain('Confirmed');
  });

  it('renders an actions rail when provided', () => {
    const markup = render(
      <ContextSlot slotId="x" title="x" actions={<button type="button">Refresh</button>} />
    );
    expect(hasSlot(markup, 'context-slot-actions')).toBe(true);
  });

  it('respects a custom pendingLabel override', () => {
    const markup = render(
      <ContextSlot slotId="x" title="x" state="pending" pendingLabel="Waiting for kickoff…" />
    );
    expect(slotText(markup, 'context-slot-pending')).toBe('Waiting for kickoff…');
  });
});
