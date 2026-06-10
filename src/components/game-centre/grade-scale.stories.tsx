import preview from '#.storybook/preview';

import { GradeScale, type GradeScaleCounts } from './grade-scale';

const meta = preview.meta({
  title: 'GameCentre/GradeScale',
  component: GradeScale,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['input', 'readout', 'composite'],
    },
    userGrade: {
      control: 'select',
      options: [undefined, 1, 2, 3, 4, 5, 6],
    },
  },
});

const distribution: GradeScaleCounts = {
  1: 12,
  2: 48,
  3: 60,
  4: 21,
  5: 8,
  6: 3,
};

export const Composite = meta.story({
  name: 'Composite (input + readout)',
  args: {
    mode: 'composite',
    userGrade: 2,
    counts: distribution,
    aggregate: { mean: 2.7, count: 152 },
  },
  render: (args) => (
    <div className="w-[420px] rounded-[4px] border border-white/10 bg-[var(--color-grey-200)] p-4">
      <GradeScale {...args} />
    </div>
  ),
});

export const InputOnly = meta.story({
  name: 'Input only',
  args: {
    mode: 'input',
  },
  render: (args) => (
    <div className="w-[420px] rounded-[4px] border border-white/10 bg-[var(--color-grey-200)] p-4">
      <GradeScale {...args} />
    </div>
  ),
});

export const ReadoutOnly = meta.story({
  name: 'Readout only',
  args: {
    mode: 'readout',
    counts: distribution,
    aggregate: { mean: 3.2, count: 152 },
  },
  render: (args) => (
    <div className="w-[420px] rounded-[4px] border border-white/10 bg-[var(--color-grey-200)] p-4">
      <GradeScale {...args} />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Empty readout (no grades yet)',
  args: {
    mode: 'composite',
  },
  render: (args) => (
    <div className="w-[420px] rounded-[4px] border border-white/10 bg-[var(--color-grey-200)] p-4">
      <GradeScale {...args} />
    </div>
  ),
});

export const Locked = meta.story({
  name: 'Locked (readout, disabled)',
  args: {
    mode: 'readout',
    disabled: true,
    counts: distribution,
    aggregate: { mean: 2.4, count: 152 },
    userGrade: 3,
  },
  render: (args) => (
    <div className="w-[420px] rounded-[4px] border border-white/10 bg-[var(--color-grey-200)] p-4">
      <GradeScale {...args} />
    </div>
  ),
});
