import * as React from 'react';

import type { PageBlockRendererProps } from '../types';
import { parseMatchdayConfig } from '../config';

export function MatchdayBlock({
  block,
  mode,
  composition,
  adapters,
}: PageBlockRendererProps): React.ReactNode {
  const config = parseMatchdayConfig(block.config);
  if (!config) {
    return null;
  }

  const rendered = adapters.renderMatchday?.({
    block,
    config,
    mode,
    composition,
  });

  if (rendered) {
    return rendered;
  }

  const headingId = `${blockKey(block)}-matchday-heading`;
  const windowLabel = MATCHDAY_WINDOW_LABELS[config.window];

  return (
    <section className="mx-auto w-full max-w-[1144px] px-4 pb-10" aria-labelledby={headingId}>
      <div className="rounded-[28px] border border-white/10 bg-white/[0.025] px-6 py-7">
        <div className="mb-4 flex items-center gap-3">
          <span aria-hidden="true" className="h-[2px] w-8 shrink-0 bg-red-100" />
          <p className="font-display text-[11px] font-bold tracking-[0.32em] text-white/70 uppercase">
            Matchday
          </p>
        </div>
        <h2
          id={headingId}
          className="font-display max-w-[600px] text-[28px] leading-[1.05] font-bold tracking-[-0.02em] text-white sm:text-[34px]"
        >
          {windowLabel}
        </h2>
        <p className="mt-3 max-w-[560px] text-sm leading-7 text-white/58">
          {summariseScope(config.competitionIds.length, config.teamIds.length)}. Provide a host
          adapter to render fixtures
          {config.showPredictions ? ', predictions' : ''}
          {config.showRatings ? ', and ratings' : ''} from game-service.
        </p>
      </div>
    </section>
  );
}

const MATCHDAY_WINDOW_LABELS = {
  LAST_BIG_MATCH: 'Last big match',
  THIS_WEEKEND: 'This weekend',
  GAMEWEEK: 'This gameweek',
} as const;

function summariseScope(competitions: number, teams: number): string {
  if (competitions === 0 && teams === 0) {
    return 'All competitions';
  }
  const parts: string[] = [];
  if (competitions > 0) {
    parts.push(`${competitions} competition${competitions === 1 ? '' : 's'}`);
  }
  if (teams > 0) {
    parts.push(`${teams} team${teams === 1 ? '' : 's'}`);
  }
  return parts.join(' · ');
}

function blockKey(block: { id: string; kind: number; sortOrder: number }): string {
  return block.id || `kind-${block.kind}-${block.sortOrder}`;
}
