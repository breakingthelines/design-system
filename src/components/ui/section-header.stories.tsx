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
  render: () => (
    <div className="w-[800px]">
      <SectionHeader label="Spotlight" />
    </div>
  ),
});

export const WithShowMore = meta.story({
  render: () => (
    <div className="w-[800px]">
      <SectionHeader label="Trending" onMoreClick={() => {}} />
    </div>
  ),
});

export const AllVariants = meta.story({
  render: () => (
    <div className="flex w-[800px] flex-col gap-10">
      <SectionHeader label="Spotlight" />
      <SectionHeader label="Trending" onMoreClick={() => {}} />
      <SectionHeader label="Podcasts" moreLabel="View all" moreHref="#" />
      <SectionHeader label="Interviews" onMoreClick={() => {}} moreLabel="See more" />
    </div>
  ),
});
