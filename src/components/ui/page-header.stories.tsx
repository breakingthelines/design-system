import preview from '#.storybook/preview';

import { PageHeader } from './page-header';
import { Button } from './button';
import { SearchField } from './search-field';

const meta = preview.meta({
  title: 'UI/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The title bar at the top of a page, and the controls that act on the whole page. Not SectionHeader, which is the uppercase display heading that introduces a block inside a page.',
      },
    },
  },
  args: {
    title: 'Taxonomy',
  },
});

export const Default = meta.story({
  args: {
    description:
      'Govern canonical entities, aliases and global search facets. Local tags stay in Studio; this surface owns the platform vocabulary.',
  },
});

export const TitleOnly = meta.story({
  name: 'Title only',
  args: { title: 'Home' },
});

export const WithActions = meta.story({
  name: 'With actions',
  parameters: {
    docs: {
      description: {
        story:
          'Actions sit opposite the title while they fit on one line and wrap under it below md, so the title is never squeezed.',
      },
    },
  },
  args: {
    title: 'Advertisers',
    description: 'Accounts, quotas and guest-post inventory.',
  },
  render: (args) => (
    <PageHeader
      {...args}
      actions={
        <>
          <Button variant="outline">Export CSV</Button>
          <Button>New advertiser</Button>
        </>
      }
    />
  ),
});

export const WithKicker = meta.story({
  name: 'With a kicker',
  parameters: {
    docs: {
      description: {
        story:
          'There is no default kicker. A header that does not need a product name above the title is not given one.',
      },
    },
  },
  args: {
    kicker: 'BTL Admin',
    title: 'Audit logs',
    description: 'Every write an admin has made, and who made it.',
  },
});

export const WithChildren = meta.story({
  name: 'With a filter row',
  parameters: {
    docs: {
      description: {
        story: 'Children sit in the title column, under the description.',
      },
    },
  },
  render: (args) => (
    <PageHeader {...args} title="Users" description="Everyone with an account.">
      <SearchField className="mt-2 w-full max-w-[280px]" label="Search users" />
    </PageHeader>
  ),
});

export const Bordered = meta.story({
  parameters: {
    docs: {
      description: {
        story: 'A rule under the header, for a page whose content starts immediately below it.',
      },
    },
  },
  args: {
    bordered: true,
    title: 'Content',
    description: 'Everything published, scheduled or held.',
  },
});

export const Levels = meta.story({
  name: 'Heading levels',
  parameters: {
    docs: {
      description: {
        story:
          'h1 by default, because a page header names the page. Step down only where an h1 already sits above it.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <PageHeader title="Level 1" description="The page's own name." />
      <PageHeader level={2} title="Level 2" description="Nested inside a page that has an h1." />
      <PageHeader level={3} title="Level 3" description="Nested one deeper." />
    </div>
  ),
});
