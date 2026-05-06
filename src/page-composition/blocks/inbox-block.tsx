import * as React from 'react';

import type { PageBlockRendererProps } from '../types';
import { parseInboxConfig } from '../config';

export function InboxBlock({
  block,
  mode,
  composition,
  adapters,
}: PageBlockRendererProps): React.ReactNode {
  const config = parseInboxConfig(block.config);
  if (!config) {
    return null;
  }

  const rendered = adapters.renderInbox?.({
    block,
    config,
    mode,
    composition,
  });

  if (rendered) {
    return rendered;
  }

  const headingId = `${blockKey(block)}-inbox-heading`;

  return (
    <section
      className="mx-auto w-full max-w-[1144px] px-4 pb-10"
      aria-labelledby={headingId}
    >
      <div className="rounded-[28px] border border-white/10 bg-white/[0.025] px-6 py-7">
        <div className="mb-4 flex items-center gap-3">
          <span aria-hidden="true" className="h-[2px] w-8 shrink-0 bg-red-100" />
          <p className="font-display text-[11px] font-bold tracking-[0.32em] text-white/70 uppercase">
            Inbox
          </p>
        </div>
        <h2
          id={headingId}
          className="font-display max-w-[600px] text-[28px] leading-[1.05] font-bold tracking-[-0.02em] text-white sm:text-[34px]"
        >
          Top {config.count} item{config.count === 1 ? '' : 's'}
        </h2>
        <p className="mt-3 max-w-[560px] text-sm leading-7 text-white/58">
          Priority {config.priorityMin.toLowerCase()} and above
          {config.includeCompleted ? ' · Completed items included' : ''}
          {config.voiceFramedOnly ? ' · Voice-framed only' : ''}. Provide a host adapter to render
          live Inbox items from notification-service.
        </p>
      </div>
    </section>
  );
}

function blockKey(block: { id: string; kind: number; sortOrder: number }): string {
  return block.id || `kind-${block.kind}-${block.sortOrder}`;
}
