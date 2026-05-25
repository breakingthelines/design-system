import preview from '#.storybook/preview';

import { StudioCockpitSidebar } from './studio-cockpit-sidebar';

const meta = preview.meta({
  title: 'UI/StudioCockpitSidebar',
  component: StudioCockpitSidebar,
  tags: ['autodocs'],
});

const sections = [
  {
    id: 'work',
    label: 'Work',
    items: [
      { id: 'drafts', label: 'Drafts', badgeCount: 3, isActive: true },
      { id: 'published', label: 'Published' },
      { id: 'scheduled', label: 'Scheduled', badgeCount: 1 },
    ],
  },
  {
    id: 'audience',
    label: 'Audience',
    items: [
      {
        id: 'engagement',
        label: 'Engagement',
        description: 'Squad-level KPIs',
        dot: 'doing' as const,
      },
      {
        id: 'opportunities',
        label: 'Opportunities',
        badgeCount: 4,
      },
      { id: 'composer', label: 'Compose From Source' },
    ],
  },
  {
    id: 'shell',
    label: 'Shell',
    items: [
      { id: 'squads', label: 'Squads' },
      { id: 'settings', label: 'Settings', dot: 'todo' as const },
    ],
  },
];

export const Default = meta.story({
  render: () => (
    <div className="h-[640px] w-[280px]">
      <StudioCockpitSidebar
        identity={{
          label: 'Editor One',
          secondary: 'Studio editor',
        }}
        sections={sections}
      />
    </div>
  ),
});

export const NoIdentity = meta.story({
  name: 'Without identity block',
  render: () => (
    <div className="h-[640px] w-[280px]">
      <StudioCockpitSidebar sections={sections} />
    </div>
  ),
});

export const WithFooter = meta.story({
  name: 'With footer slot',
  render: () => (
    <div className="h-[640px] w-[280px]">
      <StudioCockpitSidebar
        identity={{ label: 'Editor One', secondary: 'Studio editor' }}
        sections={sections}
        footer={
          <button
            type="button"
            className="h-9 w-full rounded border border-white/[0.12] bg-white/[0.04] text-sm text-white"
          >
            Switch shell
          </button>
        }
      />
    </div>
  ),
});
