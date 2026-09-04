import type * as React from 'react';

import preview from '#.storybook/preview';

import { DataRow, DataTable } from './data-table';
import { LoadingOverlay } from './loading-overlay';

const ROWS = [
  ['Nkiru Adeyemi', 'Editor', 'Active'],
  ['Tomas Brandt', 'Moderator', 'Active'],
  ['Priya Raman', 'Editor', 'Suspended'],
];

function Panel({ children, radius }: { children: React.ReactNode; radius?: string }) {
  return (
    <div className={`relative border border-border bg-card p-4 ${radius ?? 'rounded-btl-sm'}`}>
      <DataTable
        columns="minmax(180px, 1.2fr) minmax(110px, 0.8fr) minmax(120px, 0.8fr)"
        header={['Name', 'Role', 'Status']}
      >
        {ROWS.map((row) => (
          <DataRow key={row[0]}>
            {row.map((cell) => (
              <span key={cell}>{cell}</span>
            ))}
          </DataRow>
        ))}
      </DataTable>
      {children}
    </div>
  );
}

const meta = preview.meta({
  title: 'UI/LoadingOverlay',
  component: LoadingOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A scrim over a panel whose contents are still on screen: a table being refetched, a list changing under a new filter. The rows underneath stay legible and the layout does not collapse. For a wait that owns the viewport use FullscreenLoader, and for a body being swapped out use Skeleton. The scrim is absolute, so the panel it covers needs position relative.',
      },
    },
  },
  args: {
    label: 'Loading admins...',
  },
  render: (args) => (
    <Panel>
      <LoadingOverlay {...args} />
    </Panel>
  ),
});

export const Default = meta.story({});

export const Unlabelled = meta.story({
  name: 'Spinner only',
  parameters: {
    docs: {
      description: {
        story:
          'The label is optional but announced when present, so name what is being waited on wherever a page has more than one reason to wait.',
      },
    },
  },
  args: { label: undefined },
});

export const RoundedCard = meta.story({
  name: 'Over a rounded card',
  parameters: {
    docs: {
      description: {
        story:
          'Match the radius of the panel underneath so the scrim does not square off its corners.',
      },
    },
  },
  args: { label: 'Loading content...', radius: 'md', size: 24 },
  render: (args) => (
    <Panel radius="rounded-btl-md">
      <LoadingOverlay {...args} />
    </Panel>
  ),
});
