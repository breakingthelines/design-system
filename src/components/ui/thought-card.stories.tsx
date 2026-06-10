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
