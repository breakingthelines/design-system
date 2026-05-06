import * as React from 'react';

import type { PageBlockRendererProps } from '../types';
import { parseProgrammeNumberingConfig } from '../config';

export function ProgrammeNumberingBlock({
  block,
  mode,
  composition,
  adapters,
}: PageBlockRendererProps): React.ReactNode {
  const config = parseProgrammeNumberingConfig(block.config);
  if (!config) {
    return null;
  }

  const rendered = adapters.renderProgrammeNumbering?.({
    block,
    config,
    mode,
    composition,
  });

  if (rendered) {
    return rendered;
  }

  const headingId = `${blockKey(block)}-programme-numbering-heading`;

  return (
    <section
      className="mx-auto w-full max-w-[1144px] px-4 pb-6"
      aria-labelledby={headingId}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <h2
          id={headingId}
          className="font-display text-[11px] font-semibold tracking-[0.28em] text-white/55 uppercase"
        >
          {config.showIssueNumber ? 'Issue identity' : 'Programme'}
        </h2>
        {config.showHistory ? (
          <p className="text-[11px] tracking-[0.12em] text-white/45 uppercase">
            History · last {config.historyLimit}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function blockKey(block: { id: string; kind: number; sortOrder: number }): string {
  return block.id || `kind-${block.kind}-${block.sortOrder}`;
}
