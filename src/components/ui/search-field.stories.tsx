import * as React from 'react';
import { Funnel } from '@phosphor-icons/react';

import preview from '#.storybook/preview';

import { SearchField } from './search-field';

const meta = preview.meta({
  title: 'UI/SearchField',
  component: SearchField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An InputGroup with the search affordance attached. It takes input props directly, it always has an accessible name, and it carries the 16px mobile floor that stops iOS Safari zooming on focus.',
      },
    },
  },
});

export const Default = meta.story({
  render: () => (
    <div className="max-w-[280px]">
      <SearchField />
    </div>
  ),
});

export const Named = meta.story({
  name: 'Named for its page',
  parameters: {
    docs: {
      description: {
        story:
          'The name defaults to "Search" so the control is never nameless. Give it something specific when the placeholder says what is being searched.',
      },
    },
  },
  render: () => (
    <div className="flex max-w-[420px] flex-col gap-3">
      <SearchField label="Search audit logs" placeholder="Search admin, action, entity or reason" />
      <SearchField label="Search content flags" placeholder="Search title or details" />
    </div>
  ),
});

function Controlled() {
  const [query, setQuery] = React.useState('ripley');
  return (
    <div className="flex max-w-[280px] flex-col gap-2">
      <SearchField
        label="Search admins"
        placeholder="Search admins"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      <p className="text-xs text-muted-foreground">Query: {query || 'none'}</p>
    </div>
  );
}

export const ControlledValue = meta.story({
  name: 'Controlled',
  parameters: {
    docs: {
      description: {
        story: 'value and onChange are its own props, not entries in a bag.',
      },
    },
  },
  render: () => <Controlled />,
});

export const Affordance = meta.story({
  name: 'Another affordance, or none',
  render: () => (
    <div className="flex max-w-[280px] flex-col gap-3">
      <SearchField />
      <SearchField icon={<Funnel aria-hidden="true" />} label="Filter rows" placeholder="Filter" />
      <SearchField icon={null} label="Search, no icon" />
    </div>
  ),
});

export const Disabled = meta.story({
  render: () => (
    <div className="max-w-[280px]">
      <SearchField disabled placeholder="Search users" label="Search users" />
    </div>
  ),
});

export const MobileFloor = meta.story({
  name: 'Mobile 16px floor',
  parameters: {
    docs: {
      description: {
        story:
          'Below md the input renders at 16px and the control grows to a 44px target. iOS Safari zooms the viewport when a focused input is smaller than that, which reads as the page breaking. Pages used to patch this one stylesheet at a time.',
      },
    },
  },
  render: () => (
    <div className="w-full">
      <SearchField label="Search users" placeholder="Search users" />
    </div>
  ),
});
