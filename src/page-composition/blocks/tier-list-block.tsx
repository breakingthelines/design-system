import * as React from 'react';

import type { PageBlockRendererProps } from '../types';
import { parseTierListConfig } from '../config';

export function TierListBlock({
  block,
  mode,
  composition,
  adapters,
}: PageBlockRendererProps): React.ReactNode {
  const config = parseTierListConfig(block.config);
  if (!config) {
    return null;
  }

  const rendered = adapters.renderTierList?.({
    block,
    config,
    mode,
    composition,
  });

  if (rendered) {
    return rendered;
  }

  const headingId = `${blockKey(block)}-tier-list-heading`;

  return (
    <section className="mx-auto w-full max-w-[1144px] px-4 pb-12" aria-labelledby={headingId}>
      <div className="flex flex-col gap-6 rounded-[28px] border border-white/10 bg-white/[0.025] px-6 py-7">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-[2px] w-8 shrink-0 bg-red-100" />
          <p className="font-display text-[11px] font-bold tracking-[0.32em] text-white/70 uppercase">
            Tiers
          </p>
        </div>
        <div>
          <h2
            id={headingId}
            className="font-display max-w-[600px] text-[28px] leading-[1.05] font-bold tracking-[-0.02em] text-white sm:text-[34px]"
          >
            {config.label || 'Take your seat'}
          </h2>
          <p className="mt-3 max-w-[520px] text-sm leading-7 text-white/58">
            {config.layoutStyle} tier list for {config.target.scope.kind.toLowerCase()} scope.
            Provide a host adapter to render live prices, actions, and membership state.
          </p>
        </div>
      </div>
    </section>
  );
}

function blockKey(block: { id: string; kind: number; sortOrder: number }): string {
  return block.id || `kind-${block.kind}-${block.sortOrder}`;
}
