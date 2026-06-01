import preview from '#.storybook/preview';
import { useRef } from 'react';

import { IssueReader, type IssueFace, type IssueMeta, type IssueReaderHandle } from './issue-reader';

const meta = preview.meta({
  title: 'Page Flip/Issue Reader',
  component: IssueReader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The standalone "open an issue" experience. An Issue is a frozen snapshot whose ' +
          'spreads come from the page-composition block renderers rendered to page faces; ' +
          'IssueReader maps those ordered faces (cover → interior pages → back cover) onto the ' +
          'PageFlip leaf model and flips through them with the fragment-shader curl. It does ' +
          'NOT re-implement the flip — it composes the PageFlip runtime. The same reader powers ' +
          'the onboarding Issue #1 reveal (mode="reveal").',
      },
    },
  },
});

// ── Editorial palette + type (BTL dark + single red), matching the PageFlip
// stories so an opened issue reads like the same publication. ────────────────
const C = {
  ground: '#0d0d0d',
  panel: '#151515',
  rule: '#2b2b2b',
  red: '#eb0000',
  redDeep: '#bf0000',
  muted: '#807c7c',
  ink: '#f2f0ee',
} as const;

const SERIF = '"Le Monde Journal Std", Georgia, "Times New Roman", serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

function RunningHead({ left, right }: { left: string; right: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${C.rule}`,
        paddingBottom: 10,
        fontFamily: SANS,
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: C.muted,
      }}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: C.red,
        fontWeight: 700,
        margin: '28px 0 16px',
      }}
    >
      {children}
    </div>
  );
}

function Headline({ children, size = 40 }: { children: React.ReactNode; size?: number }) {
  return (
    <h2
      style={{
        fontFamily: SERIF,
        fontSize: size,
        lineHeight: 1.05,
        fontWeight: 700,
        letterSpacing: '-0.015em',
        margin: 0,
        maxWidth: '18ch',
        color: C.ink,
      }}
    >
      {children}
    </h2>
  );
}

function Column({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: SERIF,
        fontSize: 15,
        lineHeight: 1.7,
        color: '#d8d4d2',
        margin: '18px 0 0',
        maxWidth: '40ch',
      }}
    >
      {children}
    </p>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 32 }}>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 64,
          lineHeight: 0.9,
          color: C.red,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 12,
          color: C.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          maxWidth: '14ch',
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** A frozen interior page face — generous margins, a running head, one accent. */
function Page({
  head,
  folio,
  children,
}: {
  head: string;
  folio: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: C.ground,
        color: C.ink,
        padding: '40px 56px 56px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <RunningHead left={head} right="Breaking The Lines — Issue 01" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 10,
          letterSpacing: '0.3em',
          color: C.muted,
          textAlign: folio.length > 4 ? 'left' : 'right',
        }}
      >
        {folio}
      </div>
    </div>
  );
}

const Cover = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: C.ground,
      color: C.ink,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div
      style={{
        borderBottom: `2px solid ${C.red}`,
        padding: '40px 56px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, letterSpacing: '-0.01em' }}>
        Breaking The Lines
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 11,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: C.muted,
        }}
      >
        Issue No. 01
      </div>
    </div>
    <div
      style={{
        flex: 1,
        padding: '56px 56px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontSize: 12,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: C.red,
          fontWeight: 700,
          marginBottom: 24,
        }}
      >
        The Pressing Issue
      </div>
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: 56,
          lineHeight: 1.02,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          margin: 0,
          maxWidth: '15ch',
        }}
      >
        Why the counter-press has gone quiet
      </h1>
      <p
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 19,
          color: C.muted,
          marginTop: 28,
          maxWidth: '40ch',
          lineHeight: 1.5,
        }}
      >
        A season of restraint. The numbers behind football&rsquo;s slow retreat from chaos.
      </p>
    </div>
  </div>
);

const BackCover = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: C.ground,
      color: C.ink,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '56px',
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color: C.muted,
      }}
    >
      Fin
    </div>
    <div>
      <div style={{ height: 2, width: 64, background: C.red, marginBottom: 24 }} />
      <p style={{ fontFamily: SERIF, fontSize: 22, lineHeight: 1.5, color: C.ink, maxWidth: '28ch' }}>
        Next issue: the goalkeeper as playmaker, and the death of the clearance.
      </p>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginTop: 40,
        }}
      >
        Breaking The Lines
      </div>
    </div>
  </div>
);

// ── The frozen Issue: cover → interior pages (which pair into spreads) → back
// cover. Faces are ordered; PageFlip pairs them into spreads itself. ─────────
const issue: IssueMeta = {
  id: 'programme/01',
  title: 'The Pressing Issue',
  issueNumber: 1,
  handle: '@breakingthelines',
  byline: 'Breaking The Lines',
  publishedAt: '2026-06-01T00:00:00Z',
};

const faces: IssueFace[] = [
  { id: 'programme/01:cover', role: 'cover', render: () => <Cover /> },
  {
    id: 'programme/01:p1',
    role: 'page',
    render: () => (
      <Page head="Tactics / Build-up" folio="01">
        <Kicker>Tactics / Build-up</Kicker>
        <Headline>The full-back is no longer a full-back</Headline>
        <StatBlock value="61%" label="of progressive passes now start centrally" />
      </Page>
    ),
  },
  {
    id: 'programme/01:p2',
    role: 'page',
    render: () => (
      <Page head="Tactics / Build-up" folio="Breaking The Lines">
        <Column>
          For a decade the touchline was a full-back&rsquo;s whole world. Overlap, cross, recover,
          repeat. What changed was not the player but the question the coach asked of the half-space
          behind him.
        </Column>
        <Column>
          Pull one full-back inside at build-up and you have a third midfielder without ever subbing
          one on. The pitch tilts; the press has one more body to track.
        </Column>
      </Page>
    ),
  },
  {
    id: 'programme/01:p3',
    role: 'page',
    render: () => (
      <Page head="Data / Pressing" folio="03">
        <Kicker>Data / Pressing</Kicker>
        <Headline>A quieter game, measured in metres</Headline>
        <StatBlock value="+1.8" label="average rise in PPDA since 2021" />
      </Page>
    ),
  },
  {
    id: 'programme/01:p4',
    role: 'page',
    render: () => (
      <Page head="Data / Pressing" folio="Breaking The Lines">
        <Column>
          Passes Per Defensive Action is a blunt instrument, but blunt instruments are honest. A
          higher number means you let the opponent keep the ball longer before committing to win it
          back.
        </Column>
        <Column>
          The chaos has not vanished. It has been deferred, banked, and spent in one go.
        </Column>
      </Page>
    ),
  },
  {
    id: 'programme/01:p5',
    role: 'page',
    render: () => (
      <Page head="Long Read / Interview" folio="05">
        <Kicker>Long Read / Interview</Kicker>
        <Headline size={36}>&ldquo;We stopped chasing the ball&rdquo;</Headline>
        <StatBlock value="9" label="fewer high turnovers per match" />
      </Page>
    ),
  },
  { id: 'programme/01:back', role: 'back-cover', render: () => <BackCover /> },
];

// ── Frames ───────────────────────────────────────────────────────────────────

const LandscapeFrame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        position: 'relative',
        width: 'min(1100px, 94vw)',
        height: 'min(720px, 88vh)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {children}
    </div>
  </div>
);

const PortraitFrame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        position: 'relative',
        width: 'min(440px, 92vw)',
        height: 'min(780px, 90vh)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {children}
    </div>
  </div>
);

// ── Stories ────────────────────────────────────────────────────────────────

/**
 * A multi-spread issue: cover → spreads → back cover. Forced spread mode in a
 * landscape frame — open on the cover, then turn one leaf per spread.
 */
export const MultiSpreadIssue = meta.story({
  render: () => (
    <LandscapeFrame>
      <IssueReader issue={issue} faces={faces} bookMode="spread" style={{ fontFamily: SANS }} />
    </LandscapeFrame>
  ),
});

/**
 * Auto layout (the production default) — a spread on wide landscape, a single
 * page on portrait/narrow, à la DearFlip pageMode: AUTO.
 */
export const AutoLayout = meta.story({
  render: () => (
    <LandscapeFrame>
      <IssueReader issue={issue} faces={faces} style={{ fontFamily: SANS }} />
    </LandscapeFrame>
  ),
});

/** Single page (portrait / mobile) — what a phone gets under AUTO. */
export const SinglePortrait = meta.story({
  render: () => (
    <PortraitFrame>
      <IssueReader issue={issue} faces={faces} bookMode="single" style={{ fontFamily: SANS }} />
    </PortraitFrame>
  ),
});

/**
 * The onboarding "Issue #1 reveal" entry — same reader, `mode="reveal"`. The
 * reveal intent is surfaced on a `data-issue-mode` wrapper so the onboarding
 * flow can key its choreography off it without forking the reader.
 */
export const Issue1Reveal = meta.story({
  render: () => (
    <LandscapeFrame>
      <IssueReader
        issue={issue}
        faces={faces}
        mode="reveal"
        bookMode="spread"
        onReachedEnd={() => console.log('[issue-reader] reached end of Issue #1')}
        style={{ fontFamily: SANS }}
      />
    </LandscapeFrame>
  ),
});

/** Imperative controls via the handle ref (open / Prev / Next). */
export const WithControls = meta.story({
  render: () => {
    const ref = useRef<IssueReaderHandle>(null);
    const btn: React.CSSProperties = {
      fontFamily: SANS,
      fontSize: 12,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: C.ink,
      background: C.panel,
      border: `1px solid ${C.rule}`,
      padding: '8px 16px',
      cursor: 'pointer',
    };
    return (
      <LandscapeFrame>
        <IssueReader ref={ref} issue={issue} faces={faces} bookMode="spread" style={{ fontFamily: SANS }} />
        <div
          style={{
            position: 'absolute',
            bottom: -56,
            left: 0,
            right: 0,
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          <button type="button" style={btn} onClick={() => ref.current?.prev()}>
            ← Prev
          </button>
          <button type="button" style={btn} onClick={() => ref.current?.next()}>
            Next →
          </button>
        </div>
      </LandscapeFrame>
    );
  },
});
