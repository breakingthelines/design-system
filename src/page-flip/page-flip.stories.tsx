import preview from '#.storybook/preview';
import { useRef, useState } from 'react';
import { PageFlip, type PageFlipHandle, type PageFlipPage } from './page-flip';

const meta = preview.meta({
  title: 'Page Flip/PageFlip',
  component: PageFlip,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'WebGL "magazine" page-flip. A single-quad fragment-shader cylindrical page-curl ' +
          '(text stays crisp — the curl is a per-pixel UV remap, not mesh deformation). After ' +
          'the cover it opens to a two-page spread on wide landscape, a single page on ' +
          'portrait/narrow (à la DearFlip pageMode: AUTO). Adjacent page textures are ' +
          'pre-warmed on idle and the curl shader is pre-compiled on mount, so a flip is ' +
          'buttery from the first frame. Drag a corner/edge to peel, tap a half, hover the ' +
          'lower band for the advance control, or use Arrow keys. Flip sound is on with a ' +
          'persistent mute. Falls back to a no-WebGL cross-fade on reduced-motion / low-spec.',
      },
    },
  },
});

// ── Editorial palette (BTL dark + single red). No paper/warm tones — the page
// ground is the near-black house colour, the only chroma is the red rule. ────
const C = {
  ground: '#0d0d0d',
  panel: '#151515',
  rule: '#2b2b2b',
  red: '#eb0000',
  redDeep: '#bf0000',
  muted: '#807c7c',
  ink: '#f2f0ee',
} as const;

// Le Monde Journal Std is wired in the design-system via Adobe Typekit
// (globals.css). It loads at runtime; where the kit can't load (offline /
// headless) it falls back to Georgia, a real editorial serif. Helvetica Neue
// is the UI face per the brand spec.
const SERIF = '"Le Monde Journal Std", Georgia, "Times New Roman", serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

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
        marginBottom: 18,
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
        fontFamily: SERIF,
        fontSize: 19,
        lineHeight: 1.55,
        color: C.muted,
        maxWidth: '34ch',
        margin: '24px 0 0',
        fontStyle: 'italic',
      }}
    >
      {children}
    </p>
  );
}

function Byline({ name, role }: { name: string; role: string }) {
  return (
    <div style={{ marginTop: 'auto', paddingTop: 32 }}>
      <div style={{ height: 1, background: C.rule, marginBottom: 16 }} />
      <div style={{ fontFamily: SANS, fontSize: 12, color: C.ink, fontWeight: 600 }}>{name}</div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 11,
          color: C.muted,
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
        position: 'absolute',
        inset: 0,
        background: C.ground,
        color: C.ink,
        padding: '64px 64px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {children}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          right: 32,
          fontFamily: SANS,
          fontSize: 10,
          letterSpacing: '0.3em',
          color: C.muted,
        }}
      >
        {folio}
      </div>
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 36 }}>
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

/** A column of body copy so spreads read like a real magazine interior. */
function Column({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: SERIF,
        fontSize: 15,
        lineHeight: 1.7,
        color: '#d8d4d2',
        margin: '20px 0 0',
        maxWidth: '38ch',
      }}
    >
      {children}
    </p>
  );
}

const CoverFace = () => (
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
            fontSize: 40,
            lineHeight: 1.06,
            fontWeight: 700,
            letterSpacing: '-0.015em',
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
          repeat. The job was width and lungs. What changed was not the player but the question the
          coach asked of the half-space behind him.
        </Column>
        <Column>
          Pull one full-back inside at build-up and you have a third midfielder without ever subbing
          one on. The pitch tilts. The opposition press has one more body to track and one fewer
          trigger to chase.
        </Column>
        <Column>
          The cost is exposure on the far side, which is why the model only works with a centre-back
          willing to defend a channel alone &mdash; and a goalkeeper who can pass it.
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
            fontSize: 40,
            lineHeight: 1.06,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            margin: 0,
            maxWidth: '17ch',
          }}
        >
          A quieter game, measured in metres
        </h2>
        <Standfirst>
          PPDA crept up across the top five leagues this season. Teams are letting the first pass
          go.
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
          higher number means you are letting the opponent have the ball longer before you commit to
          winning it back.
        </Column>
        <Column>
          The rise is not uniform. The sides that climbed most are the ones who spent two windows
          buying for transition rather than suffocation &mdash; pace to punish a turnover, not
          numbers to force one.
        </Column>
        <Column>
          The chaos has not vanished. It has been deferred, banked, and spent in one go.
        </Column>
      </PageFrame>
    ),
  },
  {
    id: 'interview',
    render: () => (
      <PageFrame folio="05 — LONG READ">
        <Kicker>Long Read / Interview</Kicker>
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: 40,
            lineHeight: 1.06,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            margin: 0,
            maxWidth: '16ch',
          }}
        >
          &ldquo;We stopped chasing the ball&rdquo;
        </h2>
        <Standfirst>
          One coach on the season he taught a young squad to do less, later, and on purpose.
        </Standfirst>
        <StatBlock value="9" label="fewer high turnovers per match" />
        <Byline name="Tomás Herrera" role="Contributing Editor" />
      </PageFrame>
    ),
  },
];

// ── Frames ───────────────────────────────────────────────────────────────────

/** A landscape "tablet/desktop" frame so a two-page spread reads like a held magazine. */
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

/** A portrait "phone" frame for the single-page mode. */
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
 * Auto layout — resolves to a spread on a wide landscape viewport, single on
 * portrait/narrow. This is the production default (DearFlip pageMode: AUTO).
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
 * Cover → Spread (desktop). Forced spread mode in a landscape frame: page 0 is
 * the single cover, then it opens to facing pages with a centre gutter/spine
 * shadow; turning curls one leaf to the next spread.
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
 * Single page (portrait / mobile). Forced single mode in a portrait frame —
 * what a phone or a narrow window gets under AUTO.
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
 * Hover control + sound toggle. Hover the lower band of the spread to reveal the
 * floating advance bar (reused from the article-detail floating-content-bar
 * design): back/next carets, a progress ring + folio count, and a persistent
 * mute toggle. Drag, tap, and Arrow keys still work too.
 */
export const HoverControl = meta.story({
  render: () => (
    <LandscapeFrame>
      <PageFlip
        bookMode="spread"
        showHoverControl
        sound
        pages={samplePages}
        aria-label="Breaking The Lines — hover control"
        style={{ fontFamily: SANS }}
      />
    </LandscapeFrame>
  ),
});

/** Imperative controls via the handle ref (Prev / Next buttons). */
export const WithControls = meta.story({
  render: () => {
    const ref = useRef<PageFlipHandle>(null);
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
        <PageFlip ref={ref} bookMode="spread" pages={samplePages} style={{ fontFamily: SANS }} />
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

/** Rigid rotateY skim turn (fast multi-page browsing). */
export const SkimMode = meta.story({
  render: () => (
    <PortraitFrame>
      <PageFlip mode="skim" bookMode="single" pages={samplePages} style={{ fontFamily: SANS }} />
    </PortraitFrame>
  ),
});

/** No-WebGL flat fallback — the reduced-motion / low-spec cross-fade path. */
export const FlatFallback = meta.story({
  render: () => (
    <PortraitFrame>
      <PageFlip mode="flat" bookMode="single" pages={samplePages} style={{ fontFamily: SANS }} />
    </PortraitFrame>
  ),
});

// ── Onboarding repro: full-bleed, multi-page, PROGRAMMATIC advance ───────────
// Mirrors the platform First Touch flow (app/routes/_fullbleed/onboarding):
//  - <PageFlip bookMode="auto" className="h-dvh w-screen"> filling the viewport,
//  - each page a full-bleed "screen" (header + body + a footer Continue button),
//  - the Continue button advances PROGRAMMATICALLY via the handle ref's next(),
//    exactly like the platform's `goNext` → `flipRef.current?.next()`.
//
// This is the configuration that wedged on staging: clicking Continue created a
// WebGL canvas, the deck lost pointer-events, and the next screen never
// re-activated (the turn never settled), while spread-mode squeezed each screen
// into a half-width column that overflowed off the viewport. The story drives
// purely through the live footer buttons (no Storybook controls) so a Playwright
// smoke test can reproduce + verify the fix end to end.

/** A full-bleed onboarding "screen" — header, scrolling body, footer nav. */
function OnboardingScreen({
  kicker,
  heading,
  folio,
  folioTotal,
  children,
  onBack,
  onContinue,
  canContinue = true,
}: {
  kicker: string;
  heading: string;
  folio: number;
  folioTotal: number;
  children: React.ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  canContinue?: boolean;
}) {
  return (
    <div
      data-slot="flip-screen"
      data-testid={`ob-screen-${folio}`}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: C.ground,
        color: C.ink,
        overflow: 'hidden',
        fontFamily: SANS,
      }}
    >
      <header style={{ padding: '36px 40px 0' }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: C.red,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          {kicker}
        </div>
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: 42,
            lineHeight: 1.05,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: 0,
            maxWidth: '18ch',
          }}
        >
          {heading}
        </h1>
      </header>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '28px 40px 16px' }}>
        {children}
      </div>

      <footer style={{ padding: '0 40px 32px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${C.rule}`,
            paddingTop: 12,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: C.muted,
            }}
          >
            {String(folio).padStart(2, '0')} / {String(folioTotal).padStart(2, '0')}
          </div>
          <nav style={{ display: 'flex', gap: 12 }}>
            {onBack ? (
              <button
                type="button"
                data-testid="ob-back"
                onClick={onBack}
                style={{
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            ) : null}
            {onContinue ? (
              <button
                type="button"
                data-testid="ob-continue"
                onClick={onContinue}
                disabled={!canContinue}
                style={{
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.ground,
                  background: '#fff',
                  border: 'none',
                  borderRadius: 999,
                  padding: '9px 20px',
                  cursor: canContinue ? 'pointer' : 'not-allowed',
                  opacity: canContinue ? 1 : 0.4,
                }}
              >
                Continue →
              </button>
            ) : null}
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** The shared onboarding flow body, parameterised by book mode. */
function OnboardingFlow({ bookMode }: { bookMode: 'auto' | 'single' | 'spread' }) {
  const ref = useRef<PageFlipHandle>(null);
  const [position, setPosition] = useState(0);

  const SCREENS = [
    { kicker: 'Your football', heading: 'Pick the football you care about.' },
    { kicker: 'Your masthead', heading: 'Claim your handle.' },
    { kicker: 'On the record', heading: 'Call one. Or rate one.' },
    { kicker: 'Join in', heading: 'React to a piece.' },
    { kicker: 'Your corner', heading: 'Follow a few.' },
    { kicker: 'No. 01', heading: 'Your first issue.' },
  ];
  const total = SCREENS.length;

  const goNext = () => ref.current?.next();
  const goPrev = () => ref.current?.prev();

  const pages: PageFlipPage[] = SCREENS.map((s, idx) => ({
    id: `ob-${idx}`,
    render: () => (
      <OnboardingScreen
        kicker={s.kicker}
        heading={s.heading}
        folio={idx + 1}
        folioTotal={total}
        onBack={idx > 0 ? goPrev : undefined}
        onContinue={idx < total - 1 ? goNext : undefined}
      >
        <p style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.7, color: '#d8d4d2' }}>
          Screen {idx + 1} body content. In the platform this is an interactive seed action (search
          box, crest grid, handle input, …). The footer Continue button advances the flip
          programmatically through the imperative handle.
        </p>
        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 48,
                borderRadius: 2,
                border: `1px solid ${C.rule}`,
                background: 'rgba(255,255,255,0.02)',
              }}
            />
          ))}
        </div>
      </OnboardingScreen>
    ),
  }));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: C.ground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Out-of-band probe: the settled index, for the smoke test. Excluded
          from any freeze so it never lands in a page texture. */}
      <div
        data-page-flip-exclude="true"
        data-testid="ob-position"
        style={{
          position: 'fixed',
          top: 4,
          left: 4,
          zIndex: 9999,
          fontFamily: SANS,
          fontSize: 11,
          color: '#fff',
          background: 'rgba(0,0,0,0.6)',
          padding: '2px 6px',
          pointerEvents: 'none',
        }}
      >
        pos:{position}
      </div>
      <PageFlip
        ref={ref}
        pages={pages}
        bookMode={bookMode}
        onIndexChange={(i) => setPosition(i)}
        freezeBackground="#0d0d0d"
        className="h-dvh w-screen"
        style={{ width: '100vw', height: '100vh' }}
        aria-label="Onboarding (programmatic)"
      />
    </div>
  );
}

/**
 * Full-bleed onboarding flow with PROGRAMMATIC advance — the staging-blocker
 * repro. Six live screens; Continue advances via the handle ref. The visible
 * `data-testid="ob-position"` mirrors the settled index so a test can assert the
 * turn actually completed (the wedge left it stuck at 0). `bookMode="auto"`
 * matches the platform exactly — on a wide viewport it resolves to a two-page
 * spread, so each full-bleed screen is squeezed into a half-width leaf (the
 * off-viewport symptom). For a full-bleed single-screen-per-page flow, prefer
 * {@link OnboardingSinglePage}.
 */
export const OnboardingProgrammatic = meta.story({
  render: () => <OnboardingFlow bookMode="auto" />,
});

/**
 * The same flow in `single` mode — the correct book mode for a full-bleed
 * one-screen-per-page onboarding (each screen fills the viewport, no half-width
 * spread). Programmatic Continue advances cleanly through every page. This is
 * the configuration the platform onboarding should pass.
 */
export const OnboardingSinglePage = meta.story({
  render: () => <OnboardingFlow bookMode="single" />,
});
