import * as React from 'react';

import preview from '#.storybook/preview';

import { PaginationFooter, buildPageList } from './pagination-footer';

const meta = preview.meta({
  title: 'UI/PaginationFooter',
  component: PaginationFooter,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The footer under a paged list: a total, the page controls, and a per-page selector. It holds no paging state. Pass buildPageList(totalPages, activePage) to get the elided page list.',
      },
    },
  },
});

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

function Paged({ totalCount = 1284 }: { totalCount?: number }) {
  const [pageIndex, setPageIndex] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PER_PAGE_OPTIONS[0]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const activePage = Math.min(pageIndex, totalPages);

  return (
    <PaginationFooter
      totalLabel={`Total users: ${totalCount.toLocaleString('en-GB')}`}
      pages={buildPageList(totalPages, activePage)}
      activePage={activePage}
      hasPrevious={activePage > 1}
      hasNext={activePage < totalPages}
      onPrevious={() => setPageIndex((page) => Math.max(1, page - 1))}
      onNext={() => setPageIndex((page) => page + 1)}
      onPageChange={(page) => setPageIndex(page)}
      perPage={pageSize}
      perPageOptions={PER_PAGE_OPTIONS}
      onPerPageChange={(option) => {
        setPageSize(option);
        setPageIndex(1);
      }}
    />
  );
}

export const Default = meta.story({
  render: () => <Paged />,
});

export const ShortList = meta.story({
  name: 'Seven pages or fewer (no gaps)',
  render: () => <Paged totalCount={54} />,
});

export const SinglePage = meta.story({
  name: 'One page',
  parameters: {
    docs: {
      description: {
        story: 'Prev and Next are disabled rather than hidden, so the control keeps its shape.',
      },
    },
  },
  render: () => <Paged totalCount={7} />,
});

export const Compact = meta.story({
  name: 'Compact density',
  render: () => (
    <PaginationFooter
      density="compact"
      totalLabel="Total logs: 312"
      pages={buildPageList(32, 6)}
      activePage={6}
      perPage={10}
      perPageOptions={PER_PAGE_OPTIONS}
    />
  ),
});

export const ReadOnlyPerPage = meta.story({
  name: 'Per-page with no options',
  parameters: {
    docs: {
      description: {
        story:
          'Leave perPageOptions off where the page size is fixed. The value still shows and the trigger is disabled.',
      },
    },
  },
  render: () => (
    <PaginationFooter
      totalLabel="Total entries: 96"
      pages={buildPageList(10, 3)}
      activePage={3}
      perPage={10}
    />
  ),
});

export const Narrow = meta.story({
  name: 'Narrow viewport (wraps)',
  parameters: {
    docs: {
      description: {
        story:
          'The footer wraps onto as many lines as it needs. Nothing here scrolls, so Prev and Next stay reachable however many pages there are.',
      },
    },
  },
  render: () => (
    <div className="w-[360px] border border-dashed border-border p-2">
      <Paged />
    </div>
  ),
});
