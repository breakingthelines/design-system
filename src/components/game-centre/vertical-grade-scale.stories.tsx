import * as React from 'react';

import preview from '#.storybook/preview';

import { VerticalGradeScale } from './vertical-grade-scale';
import type { RatingScaleValue } from '#/components/ui/rating-scale';

const meta = preview.meta({
  title: 'GameCentre/VerticalGradeScale',
  component: VerticalGradeScale,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'select',
      options: [undefined, 1, 2, 3, 4, 5, 6],
    },
  },
});

function InteractiveShell(args: React.ComponentProps<typeof VerticalGradeScale>) {
  const [value, setValue] = React.useState<RatingScaleValue | undefined>(args.value);
  React.useEffect(() => setValue(args.value), [args.value]);
  return (
    <div className="w-[260px] rounded-[4px] border border-white/10 bg-neutral-950 p-5">
      <VerticalGradeScale {...args} value={value} onSelect={setValue} />
    </div>
  );
}

export const Default = meta.story({
  args: {},
  render: (args) => <InteractiveShell {...args} />,
});

export const Selected = meta.story({
  name: 'Selected (row 2)',
  args: { value: 2 },
  render: (args) => <InteractiveShell {...args} />,
});

export const Disabled = meta.story({
  args: { value: 3, disabled: true },
  render: (args) => (
    <div className="w-[260px] rounded-[4px] border border-white/10 bg-neutral-950 p-5">
      <VerticalGradeScale {...args} onSelect={() => {}} />
    </div>
  ),
});
