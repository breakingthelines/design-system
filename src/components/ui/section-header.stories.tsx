import preview from '#.storybook/preview';
import { SectionHeader } from './section-header';

const meta = preview.meta({
  title: 'UI/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
});

export const Default = meta.story({
  args: {
    label: 'Spotlight',
  },
});

export const WithMoreLink = meta.story({
  args: {
    label: 'Trending',
    moreHref: '#',
  },
});

export const AllVariants = meta.story({
  render: () => (
    <div className="flex w-[600px] flex-col gap-8">
      <SectionHeader label="Spotlight" />
      <SectionHeader label="Trending" moreHref="#" />
      <SectionHeader label="Podcasts" moreLabel="View all" onMoreClick={() => {}} />
      <SectionHeader label="Interviews" moreHref="#" moreLabel="See more" />
    </div>
  ),
});
