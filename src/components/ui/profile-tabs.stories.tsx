'use client';

import * as React from 'react';
import preview from '#.storybook/preview';
import { ProfileTabs, type ProfileTab } from './profile-tabs';

const meta = preview.meta({
  title: 'UI/ProfileTabs',
  component: ProfileTabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
});

const tabs: ProfileTab[] = [
  { id: 'content', label: 'Content' },
  { id: 'thoughts', label: 'Thoughts' },
  { id: 'about', label: 'About' },
];

export const Default = meta.story({
  args: {
    tabs,
    activeTab: 'content',
  },
});

export const Interactive = meta.story({
  render: function InteractiveTabs() {
    const [active, setActive] = React.useState('content');
    return (
      <div className="w-[500px]">
        <ProfileTabs tabs={tabs} activeTab={active} onTabChange={setActive} />
        <p className="mt-4 text-sm text-muted-foreground">
          Active tab: <strong className="text-foreground">{active}</strong>
        </p>
      </div>
    );
  },
});
