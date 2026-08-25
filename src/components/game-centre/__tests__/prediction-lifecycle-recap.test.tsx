import { describe, expect, it } from 'vitest';

import { PredictionLifecycleRecap, type PredictionRecapRow } from '../prediction-lifecycle-recap';
// Shared string-render helpers. They live under g5/__tests__ but are generic:
// the unit project runs without a DOM, so every assertion here is made against
// `renderToStaticMarkup` output.
import {
  countSlot,
  eachSlot,
  getAttr,
  getSlotAttr,
  hasSlot,
  render,
  slotText,
} from '../../g5/__tests__/test-utils';

const COMPARE_GRID = 'grid-cols-[104px_minmax(0,1fr)_minmax(0,1fr)_auto]';
const SINGLE_VALUE_GRID = 'grid-cols-[104px_minmax(0,1fr)_auto]';

/** Two rows that compare a pick against an actual — the original layout. */
const compareRows: readonly PredictionRecapRow[] = [
  {
    id: 'outcome',
    label: 'Outcome',
    pickValue: 'Home',
    actualValue: 'Away',
    pointsEarned: 0,
    pointsAvailable: 3,
    status: 'incorrect',
  },
  {
    id: 'exact',
    label: 'Exact score',
    pickValue: '2-1',
    pointsEarned: 0,
    pointsAvailable: 5,
    status: 'incorrect',
  },
];

/** The same fields with the comparison folded into the value. */
const singleValueRows: readonly PredictionRecapRow[] = [
  {
    id: 'outcome',
    label: 'Correct result',
    pickValue: 'Home',
    pointsEarned: 1,
    pointsAvailable: 1,
    status: 'correct',
  },
  {
    id: 'exact',
    label: 'Exact score',
    pickValue: '2-1 → 0-2',
    pointsEarned: 0,
    pointsAvailable: 5,
    status: 'incorrect',
  },
];

describe('PredictionLifecycleRecap · compare layout (unchanged)', () => {
  it('keeps four tracks and the Yours / Actual legend when a row carries an actual', () => {
    const markup = render(<PredictionLifecycleRecap rows={compareRows} />);
    expect(getSlotAttr(markup, 'prediction-lifecycle-recap-rows', 'data-layout')).toBe('compare');
    const head = getSlotAttr(markup, 'prediction-lifecycle-recap-head', 'class') ?? '';
    expect(head).toContain(COMPARE_GRID);
    expect(slotText(markup, 'prediction-lifecycle-recap-head')).toBe('Yours Actual Pts');
    for (const row of eachSlot(markup, 'prediction-lifecycle-recap-row')) {
      expect(getAttr(row, 'class') ?? '').toContain(COMPARE_GRID);
    }
  });

  it('still renders a placeholder for the one row that has no actual', () => {
    const markup = render(<PredictionLifecycleRecap rows={compareRows} />);
    expect(countSlot(markup, 'prediction-lifecycle-recap-actual')).toBe(2);
    const actuals = [...eachSlot(markup, 'prediction-lifecycle-recap-actual')];
    expect(slotText(actuals[0], 'prediction-lifecycle-recap-actual')).toBe('Away');
    expect(slotText(actuals[1], 'prediction-lifecycle-recap-actual')).toBe('\u2013');
  });
});

describe('PredictionLifecycleRecap · single-value layout', () => {
  it('drops the actual column entirely when no row carries an actual', () => {
    const markup = render(<PredictionLifecycleRecap rows={singleValueRows} />);
    expect(hasSlot(markup, 'prediction-lifecycle-recap-actual')).toBe(false);
    expect(countSlot(markup, 'prediction-lifecycle-recap-pick')).toBe(2);
  });

  it('drops the tracks the actual column held, so the value gets the width', () => {
    const markup = render(<PredictionLifecycleRecap rows={singleValueRows} />);
    expect(getSlotAttr(markup, 'prediction-lifecycle-recap-rows', 'data-layout')).toBe(
      'single-value'
    );
    const head = getSlotAttr(markup, 'prediction-lifecycle-recap-head', 'class') ?? '';
    expect(head).toContain(SINGLE_VALUE_GRID);
    expect(head).not.toContain(COMPARE_GRID);
    for (const row of eachSlot(markup, 'prediction-lifecycle-recap-row')) {
      const cls = getAttr(row, 'class') ?? '';
      expect(cls).toContain(SINGLE_VALUE_GRID);
      expect(cls).not.toContain(COMPARE_GRID);
    }
  });

  it('names only the points, since one value column has nothing true to call it', () => {
    const markup = render(<PredictionLifecycleRecap rows={singleValueRows} />);
    const legend = slotText(markup, 'prediction-lifecycle-recap-head');
    expect(legend).toBe('Pts');
    expect(legend).not.toContain('Yours');
    expect(legend).not.toContain('Actual');
  });

  it('renders the folded correction as the row value', () => {
    const markup = render(<PredictionLifecycleRecap rows={singleValueRows} />);
    const picks = [...eachSlot(markup, 'prediction-lifecycle-recap-pick')];
    expect(slotText(picks[1], 'prediction-lifecycle-recap-pick')).toBe('2-1 → 0-2');
  });
});

describe('PredictionLifecycleRecap · overflow belongs to the host', () => {
  it('does not truncate the value cells in either layout', () => {
    for (const rows of [compareRows, singleValueRows]) {
      const markup = render(<PredictionLifecycleRecap rows={rows} />);
      for (const slot of ['prediction-lifecycle-recap-pick', 'prediction-lifecycle-recap-actual']) {
        for (const cell of eachSlot(markup, slot)) {
          expect(getAttr(cell, 'class') ?? '').not.toContain('truncate');
        }
      }
    }
  });
});

describe('PredictionLifecycleRecap · note line', () => {
  it('is absent unless the row supplies one', () => {
    const markup = render(<PredictionLifecycleRecap rows={singleValueRows} />);
    expect(hasSlot(markup, 'prediction-lifecycle-recap-note')).toBe(false);
  });

  it('renders under the value and runs to the end of the row', () => {
    const rows: readonly PredictionRecapRow[] = [
      {
        id: 'scorers',
        label: 'Goalscorers',
        pickValue: 'Pedro',
        note: 'Also scored: Iwobi',
        pointsEarned: 1,
        pointsAvailable: 2,
        status: 'partial',
      },
    ];
    const markup = render(<PredictionLifecycleRecap rows={rows} />);
    expect(slotText(markup, 'prediction-lifecycle-recap-note')).toBe('Also scored: Iwobi');
    expect(getSlotAttr(markup, 'prediction-lifecycle-recap-note', 'class') ?? '').toContain(
      '[grid-column:2/-1]'
    );
  });

  it('works in the compare layout too, where the match page renders', () => {
    const rows: readonly PredictionRecapRow[] = [
      {
        id: 'scorers',
        label: 'Goalscorers',
        pickValue: 'Pedro',
        actualValue: 'Iwobi',
        note: 'Also booked: Rice',
        pointsEarned: 0,
        pointsAvailable: 2,
        status: 'incorrect',
      },
    ];
    const markup = render(<PredictionLifecycleRecap rows={rows} />);
    expect(getSlotAttr(markup, 'prediction-lifecycle-recap-rows', 'data-layout')).toBe('compare');
    expect(slotText(markup, 'prediction-lifecycle-recap-note')).toBe('Also booked: Rice');
  });
});

describe('PredictionLifecycleRecap · unchanged behaviour', () => {
  it('still shows the honest empty state', () => {
    const markup = render(<PredictionLifecycleRecap rows={[]} />);
    expect(hasSlot(markup, 'prediction-lifecycle-recap-rows')).toBe(false);
    expect(markup).toContain('place a prediction');
  });

  it('still renders the crowd line and the eyebrow toggle', () => {
    const withCrowd = render(
      <PredictionLifecycleRecap rows={singleValueRows} crowd={{ total: 1247, resultHitPct: 41 }} />
    );
    expect(slotText(withCrowd, 'prediction-lifecycle-recap-crowd')).toContain('1,247 predicted');
    expect(withCrowd).toContain('Your prediction breakdown');
    const hidden = render(<PredictionLifecycleRecap hideHeader rows={singleValueRows} />);
    expect(hidden).not.toContain('Your prediction breakdown');
  });
});
