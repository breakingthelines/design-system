import * as React from 'react';
import { create } from '@bufbuild/protobuf';
import { PrincipalType } from '@breakingthelines/protos/btl/common/v1/enums_pb';
import {
  BlockKind,
  PageBlockSchema,
  PageCompositionSchema,
  PageRenderMode,
  PageSurface,
} from '@breakingthelines/protos/btl/content/v1/page_pb';

import preview from '#.storybook/preview';

import {
  createProgrammeBlockRouter,
  PageRenderer,
  type PageBlockRendererProps,
  type PageRendererAdapters,
  type ProgrammeBlockRenderer,
} from './index';

function ProgrammeHeadlineOverride({ block }: PageBlockRendererProps): React.ReactElement {
  return (
    <section className="mx-auto w-full max-w-[1144px] px-4 pt-10 pb-12">
      <div className="rounded-[28px] border border-amber-200/30 bg-amber-200/[0.04] px-6 py-7 text-amber-50/90">
        <p className="font-display text-[11px] font-bold tracking-[0.32em] uppercase">
          Mode override · PROGRAMME
        </p>
        <p className="mt-3 text-sm leading-7 text-amber-50/70">
          PageRenderer routed block <code>{block.id || block.kind}</code> through the
          PROGRAMME-specific registry. Real Programme renderers replace this banner.
        </p>
      </div>
    </section>
  );
}

const composition = create(PageCompositionSchema, {
  surface: PageSurface.PROGRAMME_ISSUE,
  principal: {
    id: 'squad-breaking-lines',
    type: PrincipalType.SQUAD,
    handle: 'breakingthelines',
    displayName: 'Breaking The Lines',
  },
  version: 'programme-fixture',
  blocks: [
    create(PageBlockSchema, {
      id: 'headline',
      surface: PageSurface.PROGRAMME_ISSUE,
      kind: BlockKind.HEADLINE,
      sortOrder: 10,
      isVisible: true,
      config: {
        schema_version: 1,
        eyebrow: 'Programme issue',
        text: 'Chelsea v Liverpool',
        subtitle:
          'A matchday edition built from typed PageBlock contracts, rendered by the design system.',
      },
    }),
    create(PageBlockSchema, {
      id: 'numeric-proof',
      surface: PageSurface.PROGRAMME_ISSUE,
      kind: BlockKind.NUMERIC_PROOF,
      sortOrder: 20,
      isVisible: true,
      config: {
        schema_version: 1,
        label: 'The archive',
        metrics: ['PIECES_TOTAL', 'PUBLISHED_LAST_30_DAYS', 'LAST_PUBLISHED'],
      },
    }),
    create(PageBlockSchema, {
      id: 'content-strip',
      surface: PageSurface.PROGRAMME_ISSUE,
      kind: BlockKind.CONTENT_STRIP,
      sortOrder: 30,
      isVisible: true,
      config: {
        schema_version: 1,
        layout_type: 'FEATURE_LEFT_LIST_RIGHT',
        source: {
          kind: 'LATEST',
          content_type: 'ARTICLE',
        },
        audience: 'OWNER',
        count: 4,
        label: 'Build-up reading',
      },
    }),
    create(PageBlockSchema, {
      id: 'tier-list',
      surface: PageSurface.PROGRAMME_ISSUE,
      kind: BlockKind.TIER_LIST,
      sortOrder: 40,
      isVisible: true,
      config: {
        schema_version: 1,
        label: 'Back the squad',
        target: {
          principal: {
            id: 'squad-breaking-lines',
            type: 'SQUAD',
          },
          scope: {
            principal_wide: true,
          },
        },
        layout_style: 'CARDS',
      },
    }),
  ],
});

const adapters: PageRendererAdapters = {
  resolveNumericMetric: ({ metric }) => {
    const values = {
      PIECES_TOTAL: { label: 'Pieces total', value: '428', caption: 'In the archive' },
      PUBLISHED_LAST_30_DAYS: { label: 'Last 30 days', value: '37', caption: 'Fresh reports' },
      LAST_PUBLISHED: { label: 'Last published', value: '2h ago', caption: 'Most recent piece' },
    };

    return values[metric as keyof typeof values] ?? null;
  },
  renderContentStrip: ({ config }) => (
    <section className="mx-auto max-w-[1144px] px-4 pb-10">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.025] px-6 py-7">
        <p className="text-[11px] tracking-[0.12em] text-white/45 uppercase">Content adapter</p>
        <h2 className="font-display mt-3 text-2xl leading-tight font-bold tracking-[-0.04em] text-white sm:text-3xl">
          {config.label}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {['The pressing trap', 'The midfield duel', 'Why the left flank matters'].map((title) => (
            <article
              key={title}
              className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="font-display text-lg leading-tight font-semibold text-white">{title}</p>
              <p className="mt-3 text-sm leading-6 text-white/55">
                Host apps supply fetched content while the design system owns PageBlock layout.
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  ),
  renderTierList: () => (
    <section className="mx-auto max-w-[1144px] px-4 pb-12">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-6">
        <p className="font-display text-[11px] font-bold tracking-[0.32em] text-white/70 uppercase">
          Tier adapter
        </p>
        <p className="mt-4 text-sm leading-7 text-white/58">
          Platform or Studio can mount the live subscription tier component here.
        </p>
      </div>
    </section>
  ),
};

const meta = preview.meta({
  title: 'Page Composition/PageRenderer',
  component: PageRenderer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Headless PageRenderer for content-service Page Composition. The `mode` prop and the `modeRegistries` plumbing are wired so host apps can override renderers per `PageRenderMode`, but no block currently renders differently between Programme and Quick Browse modes — the design-system ships a single default renderer per registered BlockKind. The default registry covers 9 BlockKinds (HEADLINE, NUMERIC_PROOF, TIER_LIST, CONTENT_STRIP plus the 5 Programme blocks: PROGRAMME_COVER, PROGRAMME_BACK_COVER, PROGRAMME_NUMBERING, MATCHDAY, INBOX); 6 Squad-capability BlockKinds (YOUR_AUDIENCE, AUDIENCE_OVERLAP, DRAFTS_DASH, RISING_CREATORS, LEADERBOARD, RATINGS_GRID) flow through `adapters.renderUnknownBlock` by default. The stories below illustrate adapter-driven rendering, fallback notices, registry override, and per-kind routing for unregistered BlockKinds.',
      },
    },
  },
  decorators: [
    (Story): React.ReactElement => (
      <div className="min-h-screen bg-[#050505] py-8">
        <Story />
      </div>
    ),
  ],
});

export const WithHostAdapters = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          'Adapter-driven render. The host app supplies `renderContentStrip`, `renderTierList`, and `resolveNumericMetric` so the design system stays headless. Mode is set to `PROGRAMME` only to demonstrate that the prop reaches the registry; the rendered output is identical to Quick Browse until mode-specific renderers are added.',
      },
    },
  },
  render: () => (
    <PageRenderer composition={composition} mode={PageRenderMode.PROGRAMME} adapters={adapters} />
  ),
});

export const PresentationalFallbacks = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          'No adapters. Each block falls back to the design-system presentational renderer so host apps can preview the contract surface before wiring data sources.',
      },
    },
  },
  render: () => <PageRenderer composition={composition} mode={PageRenderMode.QUICK_BROWSE} />,
});

export const ModeRegistryOverride = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the `modeRegistries` plumbing. The headline renderer is swapped only when `mode = PROGRAMME`. This is the integration point a future Programme/Quick Browse split will use; the override below is a dev-only banner, not a production renderer.',
      },
    },
  },
  render: () => (
    <PageRenderer
      composition={composition}
      mode={PageRenderMode.PROGRAMME}
      adapters={adapters}
      modeRegistries={{
        [PageRenderMode.PROGRAMME]: {
          [BlockKind.HEADLINE]: ProgrammeHeadlineOverride,
        },
      }}
    />
  ),
});

const emptyComposition = create(PageCompositionSchema, {
  surface: PageSurface.PROGRAMME_ISSUE,
  principal: {
    id: 'squad-breaking-lines',
    type: PrincipalType.SQUAD,
    handle: 'breakingthelines',
    displayName: 'Breaking The Lines',
  },
  version: 'programme-empty-fixture',
  blocks: [],
});

export const EmptyComposition = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          'No visible blocks. The headless PageRenderer falls back to a neutral notice telling the reader the surface has no published composition yet. Host apps that want their own empty state pass an `emptyState` slot (see `WithCustomFallbacks`).',
      },
    },
  },
  render: () => <PageRenderer composition={emptyComposition} mode={PageRenderMode.QUICK_BROWSE} />,
});

export const LoadError = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          'Network or service failure path. When the host passes `loadError`, the headless PageRenderer ignores the composition and renders an error notice. Host apps that want their own error UI pass an `errorState` slot (see `WithCustomFallbacks`).',
      },
    },
  },
  render: () => <PageRenderer loadError mode={PageRenderMode.QUICK_BROWSE} />,
});

const HostFallbackNotice = ({
  tone,
  message,
}: {
  tone: 'empty' | 'error';
  message: string;
}): React.ReactElement => (
  <div className="mx-auto max-w-[1144px] px-4 py-20">
    <div
      className={
        tone === 'error'
          ? 'rounded-[28px] border border-red-100/30 bg-red-100/10 px-6 py-8 text-sm leading-7 text-white/80'
          : 'rounded-[28px] border border-white/15 bg-white/[0.04] px-6 py-8 text-sm leading-7 text-white/70'
      }
    >
      <p className="font-display text-[11px] font-bold tracking-[0.32em] text-white/70 uppercase">
        Host {tone} state
      </p>
      <p className="mt-3">{message}</p>
    </div>
  </div>
);

export const WithCustomFallbacks = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          'Host apps replace the headless fallback notices verbatim by passing `emptyState` and `errorState`. The PageRenderer returns the host node as-is; the design-system fallback is bypassed entirely. The grid below shows the empty fallback (top) and the loadError fallback (bottom).',
      },
    },
  },
  render: () => (
    <div className="space-y-6">
      <PageRenderer
        composition={emptyComposition}
        mode={PageRenderMode.QUICK_BROWSE}
        emptyState={
          <HostFallbackNotice
            tone="empty"
            message="No composition published yet. Host apps own this empty state via the `emptyState` slot."
          />
        }
      />
      <PageRenderer
        loadError
        mode={PageRenderMode.QUICK_BROWSE}
        errorState={
          <HostFallbackNotice
            tone="error"
            message="Page load failed. Host apps own this error state via the `errorState` slot."
          />
        }
      />
    </div>
  ),
});

const PROGRAMME_ROUTING_KIND_LABELS: Partial<Record<BlockKind, string>> = {
  [BlockKind.PROGRAMME_COVER]: 'Programme cover',
  [BlockKind.PROGRAMME_BACK_COVER]: 'Programme back cover',
  [BlockKind.PROGRAMME_NUMBERING]: 'Programme numbering',
  [BlockKind.MATCHDAY]: 'Matchday',
  [BlockKind.INBOX]: 'Inbox',
  [BlockKind.YOUR_AUDIENCE]: 'Your audience',
  [BlockKind.AUDIENCE_OVERLAP]: 'Audience overlap',
  [BlockKind.DRAFTS_DASH]: 'Drafts dash',
  [BlockKind.RISING_CREATORS]: 'Rising creators',
  [BlockKind.LEADERBOARD]: 'Leaderboard',
  [BlockKind.RATINGS_GRID]: 'Ratings grid',
};

// 6 BlockKinds the `content-service` registers schemas for that the
// design-system does NOT include in `defaultPageBlockRegistry`. With the
// default registry intact these are the only kinds that flow through
// `renderUnknownBlock` (and therefore through `createProgrammeBlockRouter`).
const ROUTER_DEFAULT_KINDS: readonly BlockKind[] = [
  BlockKind.YOUR_AUDIENCE,
  BlockKind.AUDIENCE_OVERLAP,
  BlockKind.DRAFTS_DASH,
  BlockKind.RISING_CREATORS,
  BlockKind.LEADERBOARD,
  BlockKind.RATINGS_GRID,
];

// 5 Programme BlockKinds the design-system DOES include in
// `defaultPageBlockRegistry`. They never reach `renderUnknownBlock` while
// the host uses the default registry. Hosts can force them through the
// router by clearing the registry with `registry={{}}` (see the override
// story below).
const REGISTRY_DEFAULT_PROGRAMME_KINDS: readonly BlockKind[] = [
  BlockKind.PROGRAMME_COVER,
  BlockKind.PROGRAMME_BACK_COVER,
  BlockKind.PROGRAMME_NUMBERING,
  BlockKind.MATCHDAY,
  BlockKind.INBOX,
];

function buildProgrammeRoutingComposition(
  fixtureVersion: string,
  blockKinds: readonly BlockKind[]
) {
  return create(PageCompositionSchema, {
    surface: PageSurface.PROGRAMME_ISSUE,
    principal: {
      id: 'squad-breaking-lines',
      type: PrincipalType.SQUAD,
      handle: 'breakingthelines',
      displayName: 'Breaking The Lines',
    },
    version: fixtureVersion,
    blocks: blockKinds.map((kind, index) =>
      create(PageBlockSchema, {
        id: `programme-${kind}-${index}`,
        surface: PageSurface.PROGRAMME_ISSUE,
        kind,
        sortOrder: (index + 1) * 10,
        isVisible: true,
      })
    ),
  });
}

const programmeRoutingComposition = buildProgrammeRoutingComposition(
  'programme-routing-fixture',
  ROUTER_DEFAULT_KINDS
);

const programmeRoutingOverrideComposition = buildProgrammeRoutingComposition(
  'programme-routing-override-fixture',
  REGISTRY_DEFAULT_PROGRAMME_KINDS
);

const ProgrammeBlockPlaceholder: ProgrammeBlockRenderer = ({ block, mode }) => {
  const label = PROGRAMME_ROUTING_KIND_LABELS[block.kind] ?? `Block kind ${block.kind}`;
  return (
    <section className="mx-auto max-w-[1144px] px-4 pb-6">
      <div className="rounded-[28px] border border-emerald-200/30 bg-emerald-200/[0.04] px-6 py-7 text-emerald-50/90">
        <p className="font-display text-[11px] font-bold tracking-[0.32em] uppercase">
          Host adapter · {label}
        </p>
        <p className="mt-3 text-sm leading-7 text-emerald-50/70">
          Host-supplied <code>renderUnknownBlock</code> dispatched this block (mode{' '}
          <code>{mode}</code>, sortOrder {block.sortOrder}). At adoption time, hosts replace this
          placeholder with the live Programme renderer for the matching <code>BlockKind</code>.
        </p>
      </div>
    </section>
  );
};

const programmeRoutingAdapters: PageRendererAdapters = {
  renderUnknownBlock: createProgrammeBlockRouter(
    Object.fromEntries(ROUTER_DEFAULT_KINDS.map((kind) => [kind, ProgrammeBlockPlaceholder]))
  ),
};

const programmeRoutingOverrideAdapters: PageRendererAdapters = {
  renderUnknownBlock: createProgrammeBlockRouter(
    Object.fromEntries(
      REGISTRY_DEFAULT_PROGRAMME_KINDS.map((kind) => [kind, ProgrammeBlockPlaceholder])
    )
  ),
};

export const ProgrammeBlockRouting = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the host-side per-kind dispatch pattern for the 6 Programme/Squad-capability BlockKinds the design-system does NOT register a default renderer for: YOUR_AUDIENCE, AUDIENCE_OVERLAP, DRAFTS_DASH, RISING_CREATORS, LEADERBOARD, and RATINGS_GRID. The other 5 Programme BlockKinds the `content-service` emits today (PROGRAMME_COVER, PROGRAMME_BACK_COVER, PROGRAMME_NUMBERING, MATCHDAY, INBOX) live in `defaultPageBlockRegistry` and are rendered by their dedicated design-system block components — the router never sees them while the host uses the default registry. See `ProgrammeBlockRoutingWithRegistryOverride` for the deliberate-override pattern hosts use to push registry-default kinds through the router.',
      },
    },
  },
  render: () => (
    <PageRenderer
      composition={programmeRoutingComposition}
      mode={PageRenderMode.PROGRAMME}
      adapters={programmeRoutingAdapters}
    />
  ),
});

export const ProgrammeBlockRoutingWithRegistryOverride = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the deliberate-override pattern: passing `registry={{}}` clears the default block-kind → renderer map, so every visible block — including the 5 default-registered Programme kinds (PROGRAMME_COVER, PROGRAMME_BACK_COVER, PROGRAMME_NUMBERING, MATCHDAY, INBOX) — flows through `renderUnknownBlock`. Hosts that want to own the full Programme rendering surface (rather than mix design-system fallbacks with custom renderers) use this pattern. The placeholder banners below stand in for the real per-kind Programme renderers a host would ship.',
      },
    },
  },
  render: () => (
    <PageRenderer
      composition={programmeRoutingOverrideComposition}
      mode={PageRenderMode.PROGRAMME}
      registry={{}}
      adapters={programmeRoutingOverrideAdapters}
    />
  ),
});
