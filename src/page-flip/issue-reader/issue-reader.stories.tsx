import preview from '#.storybook/preview';

import { IssueReader, type IssueMeta } from './issue-reader';
import type { FaceSpec } from '../faces/face-spec';

const meta = preview.meta({
  title: 'Page Flip/Issue Reader',
  component: IssueReader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Open a frozen Issue. Content is structured FaceSpecs (one source of truth); on a ' +
          'capable client it renders as a genuinely-3D Book3D (SkinnedMesh pages, real lighting + ' +
          'contact shadows, crisp canvas-drawn type, real crests/photos, the owner doodle ' +
          'composited into inner pages), and falls back to a calm static DOM column under ' +
          'reduced-motion / no-WebGL. Powers the onboarding Issue #1 reveal (mode="reveal").',
      },
    },
  },
});

// Real photos from a CORS-`*` host so the localhost canvas stays clean (the BTL
// CDN only allows the prod origin; in prod the real crests/photos load).
const COVER_PHOTO = 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1280&q=80';
const PLAYER_PHOTO = 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1280&q=80';

const issue: IssueMeta = {
  id: 'first-touch/tommy',
  title: 'Tommy Anderson · First Touch',
  issueNumber: 1,
  handle: '@tommy',
  byline: 'Tommy Anderson',
  publishedAt: '2026-06-12T00:00:00Z',
};

const specs: FaceSpec[] = [
  {
    kind: 'cover',
    issueNumber: 1,
    kicker: 'Official First Touch',
    date: '12 JUN 2026',
    handle: '@tommy',
    clubs: [
      { url: null, monogram: 'AR', fit: 'contain' },
      { url: null, monogram: 'CH', fit: 'contain' },
      { url: null, monogram: 'BR', fit: 'contain' },
    ],
    leagues: [
      { url: null, monogram: 'PL', fit: 'contain' },
      { url: null, monogram: 'LL', fit: 'contain' },
    ],
    coverImage: { url: COVER_PHOTO, transform: { scale: 1.06, x: 0, y: -0.15 } },
  },
  {
    kind: 'content',
    eyebrow: 'Your football',
    heading: 'The teams you picked',
    folio: 1,
    body: {
      type: 'list',
      items: [
        { media: { url: null, monogram: 'AR', fit: 'contain', tint: '#9b1b22' }, name: 'Arsenal', secondary: 'Premier League' },
        { media: { url: null, monogram: 'BR', fit: 'contain', tint: '#1f6b3a' }, name: 'Brazil', secondary: 'National team' },
        { media: { url: null, monogram: 'MØ', fit: 'cover', tint: '#2b2b2b' }, name: 'José Mourinho', secondary: 'Manager' },
      ],
    },
  },
  {
    kind: 'content',
    eyebrow: 'Your first grade',
    folio: 2,
    body: { type: 'stat', big: '8.5', unit: '/ 10', caption: 'Logged. It counts toward the club average.' },
  },
  { kind: 'photo', url: PLAYER_PHOTO, eyebrow: 'In your corner', caption: 'Matchday' },
  {
    kind: 'content',
    eyebrow: "Who you're reading",
    heading: 'Your first follows',
    folio: 3,
    body: {
      type: 'list',
      items: [
        { media: { url: null, monogram: 'TF', tint: '#2b2b2b' }, name: 'Tifo Football', secondary: '@tifofootball' },
        { media: { url: null, monogram: 'AT', tint: '#2b2b2b' }, name: 'The Athletic', secondary: '@theathletic' },
      ],
    },
  },
  { kind: 'back', line: "That's your first touch.", sub: 'Welcome to Breaking The Lines.', colophon: 'First Touch · @tommy' },
];

const Stage = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: '100vw', height: '100vh', background: '#08080a' }}>{children}</div>
);

/** The Issue #1 reveal in the 3D book, Inter headings. */
export const Reveal = meta.story({
  render: () => (
    <Stage>
      <IssueReader issue={issue} specs={specs} mode="reveal" headingFont="inter" className="size-full" />
    </Stage>
  ),
});

/** Same issue, Le Monde (serif) headings — the alternate heading-font choice. */
export const LeMondeHeadings = meta.story({
  render: () => (
    <Stage>
      <IssueReader issue={issue} specs={specs} mode="reveal" headingFont="le-monde" className="size-full" />
    </Stage>
  ),
});

/** Everyday read mode (no close ceremony). */
export const Read = meta.story({
  render: () => (
    <Stage>
      <IssueReader issue={issue} specs={specs} mode="read" headingFont="inter" className="size-full" />
    </Stage>
  ),
});
