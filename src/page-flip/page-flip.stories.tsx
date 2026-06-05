import preview from '#.storybook/preview';
import { useState } from 'react';
import { expect, waitFor } from 'storybook/test';

import { PageFlip, type PageFlipPage } from './page-flip';

const meta = preview.meta({
  title: 'Page Flip/PageFlip',
  component: PageFlip,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The BTL "magazine" page-flip, built on the MIT StPageFlip engine (`page-flip`). ' +
          'Pages are real, selectable DOM. On the server / first paint / reduced-motion it ' +
          'renders a plain scrollable page column (flat mode); on a capable client the same ' +
          'page elements are handed to the engine for a realistic paper turn with edge shadows. ' +
          'The cover is shown alone and opens to a two-page spread on wide/landscape viewports ' +
          '(single on portrait/narrow). Hovering near a page edge lifts a small page-curl; ' +
          'clicking the edge turns the page. There is NO drag-to-flip. The hover-control pill ' +
          '(reused from the article-detail floating bar) and Arrow keys also turn pages.',
      },
    },
  },
});

// ── Editorial palette (BTL dark + single red). The page ground is the near-black
// house colour; the only chroma is the red rule. ────────────────────────────
const C = {
  ground: '#0d0d0d',
  rule: '#2b2b2b',
  red: '#eb0000',
  muted: '#807c7c',
  ink: '#f2f0ee',
} as const;

// Le Monde Journal Std loads via Adobe Typekit at runtime; offline/headless
// falls back to Georgia (a real editorial serif). Helvetica Neue is the UI face.
const SERIF = '"Le Monde Journal Std", Georgia, "Times New Roman", serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: C.red,
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.22em',
        marginBottom: 18,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function Standfirst({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: C.muted,
        fontFamily: SERIF,
        fontSize: 19,
        fontStyle: 'italic',
        lineHeight: 1.55,
        margin: '24px 0 0',
        maxWidth: '34ch',
      }}
    >
      {children}
    </p>
  );
}

function Byline({ name, role }: { name: string; role: string }) {
  return (
    <div style={{ marginTop: 'auto', paddingTop: 32 }}>
      <div style={{ background: C.rule, height: 1, marginBottom: 16 }} />
      <div style={{ color: C.ink, fontFamily: SANS, fontSize: 12, fontWeight: 600 }}>{name}</div>
      <div
        style={{
          color: C.muted,
          fontFamily: SANS,
          fontSize: 11,
          letterSpacing: '0.04em',
          marginTop: 2,
        }}
      >
        {role}
      </div>
    </div>
  );
}

/** A restrained editorial page — generous margins, one accent rule, a stat. */
function PageFrame({ children, folio }: { children: React.ReactNode; folio: string }) {
  return (
    <div
      style={{
        background: C.ground,
        boxSizing: 'border-box',
        color: C.ink,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '56px 56px',
        position: 'relative',
        width: '100%',
      }}
    >
      {children}
      <div
        style={{
          bottom: 22,
          color: C.muted,
          fontFamily: SANS,
          fontSize: 10,
          letterSpacing: '0.3em',
          position: 'absolute',
          right: 28,
        }}
      >
        {folio}
      </div>
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ alignItems: 'baseline', display: 'flex', gap: 16, marginTop: 36 }}>
      <div
        style={{
          color: C.red,
          fontFamily: SERIF,
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 0.9,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: C.muted,
          fontFamily: SANS,
          fontSize: 12,
          letterSpacing: '0.14em',
          lineHeight: 1.4,
          maxWidth: '14ch',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** A column of body copy so spreads read like a real magazine interior. */
function Column({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: '#d8d4d2',
        fontFamily: SERIF,
        fontSize: 15,
        lineHeight: 1.7,
        margin: '20px 0 0',
        maxWidth: '38ch',
      }}
    >
      {children}
    </p>
  );
}

/** The hard cover — shown alone first, then it opens into the spread. */
const CoverFace = () => (
  <div
    style={{
      background: C.ground,
      color: C.ink,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
    }}
  >
    <div
      style={{
        alignItems: 'flex-end',
        borderBottom: `2px solid ${C.red}`,
        display: 'flex',
        justifyContent: 'space-between',
        padding: '40px 56px 28px',
      }}
    >
      <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, letterSpacing: '-0.01em' }}>
        Breaking The Lines
      </div>
      <div
        style={{
          color: C.muted,
          fontFamily: SANS,
          fontSize: 11,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
        }}
      >
        Issue No. 01
      </div>
    </div>

    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '56px 56px 64px',
      }}
    >
      <Kicker>The Pressing Issue</Kicker>
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: 56,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.02,
          margin: 0,
          maxWidth: '15ch',
        }}
      >
        Why the counter-press has gone quiet
      </h1>
      <Standfirst>
        A season of restraint. The numbers behind football&rsquo;s slow retreat from chaos.
      </Standfirst>
    </div>
  </div>
);

const samplePages: PageFlipPage[] = [
  { id: 'cover', render: () => <CoverFace /> },
  {
    id: 'feature-l',
    render: () => (
      <PageFrame folio="01 — TACTICS">
        <Kicker>Tactics / Build-up</Kicker>
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: 38,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            lineHeight: 1.06,
            margin: 0,
            maxWidth: '18ch',
          }}
        >
          The full-back is no longer a full-back
        </h2>
        <Standfirst>
          Inverted, withdrawn, sometimes simply absent. The most reinvented role of the decade.
        </Standfirst>
        <StatBlock value="61%" label="of progressive passes now start centrally" />
        <Byline name="Zach Lowy" role="Senior Tactics Writer" />
      </PageFrame>
    ),
  },
  {
    id: 'feature-r',
    render: () => (
      <PageFrame folio="02 — TACTICS">
        <Column>
          For a decade the touchline was a full-back&rsquo;s whole world. Overlap, cross, recover,
          repeat. What changed was not the player but the question the coach asked of the half-space
          behind him.
        </Column>
        <Column>
          Pull one full-back inside at build-up and you have a third midfielder without ever subbing
          one on. The pitch tilts. The press has one more body to track and one fewer trigger to
          chase.
        </Column>
        <Column>
          The cost is exposure on the far side &mdash; which is why it only works with a centre-back
          willing to defend a channel alone, and a goalkeeper who can pass.
        </Column>
      </PageFrame>
    ),
  },
  {
    id: 'data-l',
    render: () => (
      <PageFrame folio="03 — DATA">
        <Kicker>Data / Pressing</Kicker>
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: 38,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            lineHeight: 1.06,
            margin: 0,
            maxWidth: '17ch',
          }}
        >
          A quieter game, measured in metres
        </h2>
        <Standfirst>
          PPDA crept up across the top five leagues this season. Teams are letting the first pass go.
        </Standfirst>
        <StatBlock value="+1.8" label="average rise in PPDA since 2021" />
        <Byline name="Maya Okonkwo" role="Data Editor" />
      </PageFrame>
    ),
  },
  {
    id: 'data-r',
    render: () => (
      <PageFrame folio="04 — DATA">
        <Column>
          Passes Per Defensive Action is a blunt instrument, but blunt instruments are honest. A
          higher number means letting the opponent have the ball longer before committing to win it
          back.
        </Column>
        <Column>
          The rise is not uniform. The sides that climbed most spent two windows buying for
          transition rather than suffocation &mdash; pace to punish a turnover, not numbers to force
          one.
        </Column>
        <Column>The chaos has not vanished. It has been deferred, banked, and spent in one go.</Column>
      </PageFrame>
    ),
  },
  {
    id: 'back-cover',
    render: () => (
      <PageFrame folio="END">
        <Kicker>Issue No. 01</Kicker>
        <Column>
          That is the whole of Issue No. 01 &mdash; a single beat to mark the start. From here the
          Arena is live and the writing is yours.
        </Column>
        <Byline name="Breaking The Lines" role="See you inside" />
      </PageFrame>
    ),
  },
];

// ── Frames ───────────────────────────────────────────────────────────────────

/** A landscape "tablet/desktop" frame so a two-page spread reads like a held magazine. */
const LandscapeFrame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      alignItems: 'center',
      background: '#000',
      boxSizing: 'border-box',
      display: 'flex',
      height: '100vh',
      justifyContent: 'center',
      padding: 24,
      width: '100vw',
    }}
  >
    <div
      style={{
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        height: 'min(720px, 88vh)',
        position: 'relative',
        width: 'min(1100px, 94vw)',
      }}
    >
      {children}
    </div>
  </div>
);

/** A portrait "phone" frame for the single-page mode. */
const PortraitFrame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      alignItems: 'center',
      background: '#000',
      boxSizing: 'border-box',
      display: 'flex',
      height: '100vh',
      justifyContent: 'center',
      padding: 24,
      width: '100vw',
    }}
  >
    <div
      style={{
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        height: 'min(780px, 90vh)',
        position: 'relative',
        width: 'min(440px, 92vw)',
      }}
    >
      {children}
    </div>
  </div>
);

// ── Stories ────────────────────────────────────────────────────────────────

/**
 * Auto layout — the production default. Resolves to a two-page spread on a wide
 * landscape viewport and a single page on portrait/narrow (DearFlip pageMode:
 * AUTO). The cover is shown alone first; the Next caret / right-edge click / →
 * key opens it into the spread.
 *
 * REAL-BROWSER CHECKPOINT (the engine needs a real browser; SSR/headless shows
 * the flat column): confirm the cover sits alone, opening reveals a facing
 * spread with edge shadows, hovering an edge lifts a small page-curl, and an
 * edge-click turns the page. There must be NO drag-to-flip.
 */
export const Magazine = meta.story({
  render: () => (
    <LandscapeFrame>
      <PageFlip
        pages={samplePages}
        aria-label="Breaking The Lines — Issue No. 01"
        style={{ fontFamily: SANS }}
      />
    </LandscapeFrame>
  ),
});

/**
 * Forced spread (desktop). Page 0 is the single cover; it opens to facing pages
 * with a centre gutter, turning one leaf to the next spread.
 */
export const Spread = meta.story({
  render: () => (
    <LandscapeFrame>
      <PageFlip
        bookMode="spread"
        pages={samplePages}
        aria-label="Breaking The Lines — spread"
        style={{ fontFamily: SANS }}
      />
    </LandscapeFrame>
  ),
});

/**
 * Single page (portrait / mobile) — what a phone or narrow window gets under
 * AUTO. The cover and each interior page fill the frame one at a time.
 */
export const SinglePortrait = meta.story({
  render: () => (
    <PortraitFrame>
      <PageFlip
        bookMode="single"
        pages={samplePages}
        aria-label="Breaking The Lines — single page"
        style={{ fontFamily: SANS }}
      />
    </PortraitFrame>
  ),
});

/**
 * Cover-open ceremony (the Issue #1 reveal intent). Forced single so the cover
 * stays full-bleed; the turn runs a touch slower. Under reduced motion this
 * degrades to the flat reader (no animation, never blocks).
 */
export const CoverOpen = meta.story({
  render: () => (
    <PortraitFrame>
      <PageFlip
        mode="cover-open"
        bookMode="single"
        pages={samplePages}
        aria-label="Breaking The Lines — Issue No. 01 (cover-open reveal)"
        style={{ fontFamily: SANS }}
      />
    </PortraitFrame>
  ),
});

/**
 * Reduced-motion / SSR-equivalent flat reader. Forcing `mode="flat"` renders the
 * plain scrollable single-page column with no engine — the crawlable, always-
 * navigable fallback. The hover control and edge clicks still advance it.
 */
export const ReducedMotionFlat = meta.story({
  render: () => (
    <PortraitFrame>
      <PageFlip
        mode="flat"
        pages={samplePages}
        aria-label="Breaking The Lines — flat reader"
        style={{ fontFamily: SANS }}
      />
    </PortraitFrame>
  ),
});

/**
 * Interaction checkpoint — drives the real engine in the headed browser test
 * runner. Mounts the reader, reports the live page index, then clicks the RIGHT
 * EDGE affordance (the click-to-advance path the owner specced) and asserts the
 * page turned. Also asserts there is no drag: the engine is configured with
 * `useMouseEvents: false`, so only edge clicks / keys / the control move pages.
 */
export const Interaction = meta.story({
  render: () => <InteractionHarness />,
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const readIndex = () =>
      Number(doc.querySelector('[data-testid="pf-index"]')?.getAttribute('data-index') ?? '-1');

    // The reader starts on the cover (index 0). The engine mounts a beat after
    // paint (its own safari-fix setTimeout), so wait for it to settle at 0.
    await waitFor(() => expect(readIndex()).toBe(0), { timeout: 6000 });

    // Click the right-edge advance affordance — the click-to-advance path.
    await waitFor(() => {
      const edge = doc.querySelector(
        '[data-page-flip-root] [data-edge="right"]'
      ) as HTMLButtonElement | null;
      if (!edge) throw new Error('right edge affordance not mounted yet');
      edge.click();
    });

    // The cover opens / the page turns: index advances past 0. (The engine's
    // turn animation resolves the index via its `flip` event.)
    await waitFor(() => expect(readIndex()).toBeGreaterThanOrEqual(1), { timeout: 6000 });
  },
});

/** Mount harness exposing the live page index for the interaction assertion. */
function InteractionHarness() {
  const [index, setIndex] = useState(0);
  return (
    <LandscapeFrame>
      <div
        data-page-flip-exclude="true"
        data-testid="pf-index"
        data-index={index}
        style={{
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          fontFamily: SANS,
          fontSize: 11,
          left: 4,
          padding: '2px 6px',
          pointerEvents: 'none',
          position: 'fixed',
          top: 4,
          zIndex: 9999,
        }}
      >
        page:{index}
      </div>
      <PageFlip
        bookMode="spread"
        pages={samplePages}
        onIndexChange={(i) => setIndex(i)}
        aria-label="Breaking The Lines — interaction"
        style={{ fontFamily: SANS }}
      />
    </LandscapeFrame>
  );
}
