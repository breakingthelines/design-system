import preview from '#.storybook/preview';
import { ThoughtCard } from './thought-card';
import type { ThoughtItem } from '#/types/content';

const meta = preview.meta({
  title: 'UI/ThoughtCard',
  component: ThoughtCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
});

const thought: ThoughtItem = {
  id: '1',
  body: 'Jude Bellingham should be walking away from Mentalfa with a last-second winner. Instead, he walks away empty-handed, and he will be suspended for the upcoming match vs. Celta alongside Antonio Rüdiger.\n\nGoing to be a very challenging week for Los Blancos…',
  author: {
    name: 'Zach Lowy',
    handle: 'zachlowy',
    initials: 'ZL',
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    verified: true,
  },
  createdAt: '2h ago',
  stats: { likes: 3400, comments: 5 },
};

export const Default = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ThoughtCard thought={thought} />
    </div>
  ),
});

export const WithImage = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ThoughtCard
        thought={{
          ...thought,
          id: '2',
          body: "Pote is playing like a man who wants to convince Carlo Ancelotti of a place in next season's squad. Really lively cameos.",
          imageUrl:
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop',
        }}
      />
    </div>
  ),
});

export const Liked = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ThoughtCard thought={{ ...thought, liked: true }} />
    </div>
  ),
});

export const Feed = meta.story({
  name: 'Feed — Stacked',
  render: () => (
    <div className="w-[500px]">
      <ThoughtCard thought={thought} />
      <ThoughtCard
        thought={{
          ...thought,
          id: '2',
          body: "One word to describe today's match between Real Madrid and Valencia: Locura.",
          createdAt: '3h ago',
          stats: { likes: 1200, comments: 2 },
        }}
      />
      <ThoughtCard
        thought={{
          ...thought,
          id: '3',
          body: 'Ibrahim Díaz continues to step up and make the difference in the final third for Real Madrid.',
          createdAt: '4h ago',
          stats: { likes: 890, comments: 8 },
          liked: true,
        }}
      />
    </div>
  ),
});

export const FromGradePill = meta.story({
  name: 'From-grade pill (Wave 6.8)',
  render: () => (
    <div className="w-[500px]">
      <ThoughtCard
        thought={{
          ...thought,
          id: 'grade-1',
          author: {
            name: 'Tommy',
            handle: 'tommy',
            initials: 'T',
            avatarUrl: 'https://i.pravatar.cc/150?u=tommy',
          },
          body: 'Get this dude off my team man. Two glaring chances, zero hunger. Walking through games like the badge owes him something.',
          createdAt: 'Just now',
          stats: { likes: 12, comments: 3 },
          fromGrade: {
            value: 5,
            subjectLabel: 'Saka',
            matchLabel: 'Arsenal v Spurs',
            matchHref: '/game/football/arsenal-spurs/season-25-26',
          },
        }}
      />
      <ThoughtCard
        thought={{
          ...thought,
          id: 'grade-2',
          author: {
            name: 'Tommy',
            handle: 'tommy',
            initials: 'T',
          },
          body: 'Imperious. Closed the game by himself in the last 20.',
          createdAt: '10m ago',
          stats: { likes: 86, comments: 4 },
          fromGrade: {
            value: 1,
            subjectLabel: 'Rodri',
            matchLabel: 'Man City v Liverpool',
            matchHref: '/game/football/city-liverpool/season-25-26',
          },
        }}
      />
    </div>
  ),
});

export const FromGradePillFallback = meta.story({
  name: 'From-grade pill (Wave 6.16) — no label hydration',
  render: () => (
    <div className="w-[500px]">
      <ThoughtCard
        thought={{
          ...thought,
          id: 'grade-3',
          author: {
            name: 'Tommy',
            handle: 'tommy',
            initials: 'T',
          },
          body: 'Pre-6.16 fan-out left the subject ref unhydrated; pill should still render the cast value even with a placeholder label.',
          createdAt: 'Just now',
          stats: { likes: 4, comments: 0 },
          fromGrade: {
            value: 3,
            // Mapper degrades to "Grade" when neither person nor game ref
            // carries a label. Pinning this shape into the story so the
            // visual contract is documented.
            subjectLabel: 'Grade',
          },
        }}
      />
    </div>
  ),
});

/**
 * A thought carrying a game/decorator block (lineup, stats, StatsBomb viz).
 * The block is full-bleed to the card's edges (via ThoughtCard's
 * `blockClassName` → ThoughtBody), matching the full-width composer, while the
 * text paragraph keeps the normal content-column inset. The mock renderer here
 * mirrors the real `GameBlockReader` container (`my-6` + a rounded plate) so a
 * measurement / visual diff catches any regression to the bleed geometry.
 */
export const GameBlockFullBleed = meta.story({
  name: 'Game block — full-bleed',
  render: () => (
    <div className="w-[600px]">
      <ThoughtCard
        thought={{
          ...thought,
          id: 'gb-1',
          body: 'My XI for the north London derby — back three, invert the fullbacks:',
          bodyJson: JSON.stringify({
            root: {
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'My XI for the north London derby — back three, invert the fullbacks:',
                    },
                  ],
                },
                { type: 'game-lineup', config: { teamName: 'Arsenal' } },
              ],
            },
          }),
          stats: { likes: 210, comments: 12 },
        }}
        blockRenderers={{
          'game-lineup': () => (
            <div className="my-6">
              <div
                data-testid="mock-lineup-plate"
                className="flex h-40 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.04] text-sm text-white/60"
              >
                Lineup card (full-bleed to card edges)
              </div>
            </div>
          ),
        }}
      />
    </div>
  ),
});

/**
 * Header meta row (display name + tier badge + @handle + timestamp) at
 * narrow mobile widths. Regression coverage for the overflow bug: without
 * `min-w-0` + `truncate` on the name, a long display name pushes
 * @handle/timestamp off the right edge of the ~276px content column instead
 * of wrapping or truncating. Each `data-testid="mobile-header-*"` wrapper
 * pins a viewport width so a measurement pass (Storybook + a real browser)
 * can assert the header row never exceeds its content column at
 * 320 / 375 / 430px. The tier badge must stay fully visible at every width.
 */
export const MobileHeaderOverflow = meta.story({
  name: 'Header — mobile overflow (320/375/430)',
  render: () => (
    <div className="flex flex-col gap-6">
      {[320, 375, 430].map((width) => (
        <div key={width} data-testid={`mobile-header-${width}`} style={{ width }}>
          <p className="pb-2 font-mono text-[10px] text-white/40">{width}px</p>
          <ThoughtCard
            thought={{
              ...thought,
              id: `overflow-reported-${width}`,
              author: {
                name: 'Thomas',
                handle: 'tommy',
                initials: 'T',
                tier: 'Line Breaker',
              },
              body: 'Reported repro: short-ish name, still enough meta to overflow the column pre-fix.',
              createdAt: 'Just now',
              stats: { likes: 12, comments: 3 },
            }}
          />
          <ThoughtCard
            thought={{
              ...thought,
              id: `overflow-longname-${width}`,
              author: {
                name: 'Alexandria Fitzgerald-Whitmore',
                handle: 'alexfw',
                initials: 'AF',
                tier: 'Line Breaker',
              },
              body: 'Stress test: a genuinely long display name — must ellipsize, badge must stay visible.',
              createdAt: '2h ago',
              stats: { likes: 4, comments: 1 },
            }}
          />
        </div>
      ))}
    </div>
  ),
});
