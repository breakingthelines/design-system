import * as React from 'react';

import type { NumericMetricDisplay, PageBlockRendererProps } from '../types';
import { parseNumericProofConfig, type NumericProofMetric } from '../config';

const FALLBACK_LABELS: Record<NumericProofMetric, string> = {
  SUBSCRIBERS: 'Subscribers',
  LAST_PUBLISHED: 'Last published',
  PUBLISHED_LAST_30_DAYS: 'Last 30 days',
  MEMBERS_SINCE: 'On BTL since',
  PIECES_TOTAL: 'Pieces total',
  AVG_WORDS_PER_PIECE: 'Average length',
};

export function NumericProofBlock({
  block,
  mode,
  composition,
  adapters,
}: PageBlockRendererProps): React.ReactNode {
  const config = parseNumericProofConfig(block.config);
  if (!config) {
    return null;
  }

  const rendered = adapters.renderNumericProof?.({
    block,
    config,
    mode,
    composition,
  });

  if (rendered) {
    return rendered;
  }

  const metrics = config.metrics.map((metric) => {
    return (
      adapters.resolveNumericMetric?.({
        metric,
        block,
        mode,
        composition,
      }) ?? fallbackMetric(metric)
    );
  });

  // The metric grid is rendered as a definition list so screen readers
  // announce label/value pairs with proper term/definition relationships.
  // The section heading is wired with aria-labelledby when a label is
  // configured, otherwise we fall back to aria-label so the section still
  // has an accessible name.
  const headingId = `${blockKey(block)}-numeric-proof-label`;
  const sectionLabelProps = config.label
    ? { 'aria-labelledby': headingId }
    : { 'aria-label': 'Numeric proof' };

  return (
    <section className="mx-auto max-w-[1144px] px-4 pb-8" {...sectionLabelProps}>
      <div className="rounded-[28px] border border-white/10 bg-white/[0.025] px-6 py-5 sm:px-7">
        {config.label ? (
          <h2
            id={headingId}
            className="mb-5 text-[11px] tracking-[0.12em] text-white/45 uppercase"
          >
            {config.label}
          </h2>
        ) : null}
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <MetricCell key={`${metric.label}-${index}`} metric={metric} isDivided={index > 0} />
          ))}
        </dl>
      </div>
    </section>
  );
}

function MetricCell({
  metric,
  isDivided,
}: {
  metric: NumericMetricDisplay;
  isDivided: boolean;
}): React.ReactElement {
  return (
    <div className={isDivided ? 'border-t border-white/8 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5' : ''}>
      <dt className="text-[11px] tracking-[0.12em] text-white/42 uppercase">{metric.label}</dt>
      <dd className="mt-3 text-2xl leading-none font-semibold tracking-[-0.04em] text-white sm:text-[2rem]">
        {metric.value}
      </dd>
      {metric.caption ? (
        <dd className="mt-2 max-w-[18ch] text-sm leading-6 text-white/58">{metric.caption}</dd>
      ) : null}
    </div>
  );
}

function fallbackMetric(metric: NumericProofMetric): NumericMetricDisplay {
  return {
    label: FALLBACK_LABELS[metric],
    value: '—',
    caption: 'Connect a host adapter to resolve this metric.',
  };
}

function blockKey(block: { id: string; kind: number; sortOrder: number }): string {
  return block.id || `kind-${block.kind}-${block.sortOrder}`;
}
