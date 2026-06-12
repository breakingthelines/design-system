// FaceDOM — render a FaceSpec as real DOM, for the static (no-WebGL /
// reduced-motion) fallback reader. The same specs that feed the 3D canvas
// renderer feed this, so the issue reads identically in either mode. Tasteful,
// not a pixel-twin of the canvas: the dark token system, Inter/Le Monde
// headings, real crests/photos with a monogram fallback.

import { useRef, useState } from 'react';

import { type CoverTransform, type FaceImage, type FaceSpec, type HeadingFont } from './face-spec';
import { whitenLogo } from './whiten-logo';

function headingClass(font: HeadingFont): string {
  return font === 'le-monde' ? 'font-display' : 'font-sans';
}

/** The BTL bracket mark. */
function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 38.53" fill="none" className={className} aria-hidden="true">
      <path
        d="M17.142 0V11.709H12.442V26.83H17.142V38.53H0V0H17.142Z"
        fill="var(--color-red-100, #eb0000)"
      />
      <path
        d="M40 0V38.53H22.863V26.83H27.563V11.709H22.863V0H40Z"
        fill="var(--color-red-100, #eb0000)"
      />
    </svg>
  );
}

/**
 * A crest/logo whitened by the SAME `whitenLogo` the 3D book uses, drawn into a
 * canvas at the source's own resolution so the static poster matches the 3D pages
 * and stays crisp (CSS `object-contain` scales it into the display box). The
 * source is loaded crossOrigin (cache-busted to share the canvas-texture loader's
 * key). On any failure (no CORS, 404, no context) it renders `fallback`.
 */
function WhitenedLogo({
  url,
  className,
  fallback,
}: {
  url: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const doneFor = useRef<string | null>(null);

  const drawTo = (canvas: HTMLCanvasElement | null) => {
    if (!canvas || doneFor.current === url) return;
    doneFor.current = url;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.addEventListener('load', () => {
      const light = whitenLogo(img);
      const ctx = canvas.getContext('2d');
      if (!light || !ctx) {
        setFailed(true);
        return;
      }
      canvas.width = light.width;
      canvas.height = light.height;
      ctx.drawImage(light, 0, 0);
    });
    img.addEventListener('error', () => setFailed(true));
    img.src = `${url}${url.includes('?') ? '&' : '?'}__cors=1`;
  };

  if (failed) return <>{fallback}</>;
  return <canvas ref={drawTo} className={className} aria-hidden="true" />;
}

function CircleMedia({ media, className }: { media: FaceImage; className?: string }) {
  const [broken, setBroken] = useState(false);

  // Crests + competition logos (contain) → the SAME engraved whitening the 3D
  // book uses (canvas), so the static poster matches. No art → BTL placeholder.
  if (media.fit === 'contain') {
    const placeholder = (
      <span
        className={`grid shrink-0 place-items-center rounded-lg bg-white/[0.05] ring-1 ring-white/10 ${className ?? ''}`}
      >
        <Mark className="h-1/2 w-auto" />
      </span>
    );
    if (media.url) {
      return (
        <WhitenedLogo
          url={media.url}
          className={`shrink-0 object-contain ${className ?? ''}`}
          fallback={placeholder}
        />
      );
    }
    return placeholder;
  }

  // Photos + avatars (cover) → a circular portrait.
  if (media.url && !broken) {
    return (
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-white/12 ${className ?? ''}`}
        style={{ background: media.tint ?? 'var(--color-grey-200, #151515)' }}
      >
        <img
          src={media.url}
          alt=""
          loading="eager"
          onError={() => setBroken(true)}
          className="size-full object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-[0.72em] font-bold text-white ring-1 ring-white/12 ${className ?? ''}`}
      style={{ background: media.tint ?? 'var(--color-grey-200, #151515)' }}
    >
      {media.monogram}
    </span>
  );
}

/** An engraved-white crest/logo (no background) or a bare white monogram — cover grids. */
function BareLogo({ media }: { media: FaceImage }) {
  const monogram = (
    <span
      className="grid size-11 place-items-center text-sm font-bold text-white"
      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
    >
      {media.monogram}
    </span>
  );
  if (!media.url) return monogram;
  return <WhitenedLogo url={media.url} className="size-11 object-contain" fallback={monogram} />;
}

/** Up to four logos in a right-aligned 2-column grid. */
function LogoGrid({ items }: { items: FaceImage[] }) {
  return (
    <div className="grid grid-cols-2 justify-items-end gap-2.5">
      {items.slice(0, 4).map((m, i) => (
        <BareLogo key={i} media={m} />
      ))}
    </div>
  );
}

function coverStyle(t?: CoverTransform): React.CSSProperties {
  if (!t) return {};
  return {
    transform: `scale(${t.scale}) translate(${t.x * 24}%, ${t.y * 24}%)`,
    transformOrigin: 'center',
  };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function Doodle() {
  return (
    <img
      src="/textures/mag-doodle.png"
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 size-full object-cover opacity-50"
    />
  );
}

export function FaceDOM({ spec, headingFont }: { spec: FaceSpec; headingFont: HeadingFont }) {
  const hc = headingClass(headingFont);

  if (spec.kind === 'cover') {
    return (
      <div className="relative isolate flex h-full w-full flex-col justify-between overflow-hidden bg-black p-8 text-white sm:p-9">
        {spec.coverImage ? (
          <img
            src={spec.coverImage.url}
            alt=""
            style={coverStyle(spec.coverImage.transform)}
            className="absolute inset-0 -z-20 size-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-[radial-gradient(125%_90%_at_50%_30%,#232327,#0b0b0d_72%)]"
          />
        )}
        {/* Darker overlay: whole-page darken + top/bottom gradients. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/35" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-1/3 bg-gradient-to-b from-black/60 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-black/95 to-transparent"
        />

        {/* Top row: wordmark cluster (left) · clubs (right). */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-start gap-2.5">
              <Mark className="mt-0.5 h-9 w-auto" />
              <span className="font-sans text-2xl leading-[0.92] font-extrabold lowercase">
                breaking
                <br />
                the lines
              </span>
            </div>
            {spec.kicker ? (
              <p className="mt-3 text-left font-sans text-[10px] font-medium tracking-[0.22em] text-white uppercase">
                {spec.kicker}
              </p>
            ) : null}
            {spec.date ? (
              <p className="mt-1 text-left font-sans text-[10px] font-medium tracking-[0.16em] text-white/60 uppercase">
                {spec.date}
              </p>
            ) : null}
          </div>
          {spec.clubs?.length ? <LogoGrid items={spec.clubs} /> : null}
        </div>

        {/* Bottom row: @handle (left, small) · leagues (right). */}
        <div className="flex items-end justify-between gap-4">
          <p
            className={`min-w-0 truncate ${hc} text-base leading-none font-bold tracking-wide text-white uppercase`}
          >
            {spec.handle}
          </p>
          {spec.leagues?.length ? <LogoGrid items={spec.leagues} /> : null}
        </div>
      </div>
    );
  }

  if (spec.kind === 'photo') {
    return (
      <div className="relative isolate flex h-full w-full flex-col justify-end overflow-hidden bg-black p-8 text-white sm:p-9">
        <img src={spec.url} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
        {spec.eyebrow ? (
          <p className="font-sans text-xs font-bold tracking-[0.18em] text-red-100 uppercase">
            {spec.eyebrow}
          </p>
        ) : null}
        {spec.caption ? (
          <p className={`mt-1 ${hc} text-3xl leading-tight font-bold tracking-tight text-white`}>
            {spec.caption}
          </p>
        ) : null}
      </div>
    );
  }

  if (spec.kind === 'back') {
    return (
      <div className="relative isolate flex h-full w-full flex-col justify-between overflow-hidden bg-black p-8 text-white sm:p-9">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(38,38,38,0.45),#000_72%)]"
        />
        <Doodle />
        {/* Top-left cluster — matches the cover. */}
        <div>
          <div className="flex items-start gap-2.5">
            <Mark className="mt-0.5 h-9 w-auto" />
            <span className="font-sans text-2xl leading-[0.92] font-extrabold lowercase">
              breaking
              <br />
              the lines
            </span>
          </div>
          {spec.kicker ? (
            <p className="mt-3 text-left font-sans text-[10px] font-medium tracking-[0.22em] text-white uppercase">
              {spec.kicker}
            </p>
          ) : null}
          {spec.date ? (
            <p className="mt-1 text-left font-sans text-[10px] font-medium tracking-[0.16em] text-white/60 uppercase">
              {spec.date}
            </p>
          ) : null}
        </div>
        {/* Closing copy + red CTA. */}
        <div className="flex flex-col">
          <p
            className={`max-w-sm ${hc} text-3xl leading-tight font-bold tracking-tight text-white`}
          >
            {spec.line}
          </p>
          {spec.ctaLead || spec.ctaAccent ? (
            <p className="mt-5 font-sans text-xl font-bold text-white">
              {spec.ctaLead ? `${spec.ctaLead} ` : ''}
              {spec.ctaAccent ? <span className="text-red-100">{spec.ctaAccent}</span> : null}
            </p>
          ) : null}
        </div>
        {spec.colophon ? (
          <p className="text-grey-500 font-sans text-[11px] font-medium">{spec.colophon}</p>
        ) : null}
      </div>
    );
  }

  // content
  return (
    <div className="relative isolate flex h-full w-full flex-col overflow-hidden bg-black p-8 text-white sm:p-9">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(38,38,38,0.45),#000_72%)]"
      />
      <Doodle />
      <p className="font-sans text-xs font-bold tracking-[0.18em] text-red-100 uppercase">
        {spec.eyebrow}
      </p>
      {spec.heading ? (
        <h2 className={`mt-2 ${hc} text-2xl leading-tight font-bold tracking-tight text-white`}>
          {spec.heading}
        </h2>
      ) : null}
      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        {spec.body.type === 'list' ? (
          <div className="flex flex-col gap-4">
            {spec.body.items.slice(0, 6).map((it, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <CircleMedia media={it.media} className="size-14 text-base" />
                <div className="min-w-0">
                  <p className="truncate font-sans text-lg leading-tight font-bold text-white">
                    {it.name}
                  </p>
                  {it.secondary ? (
                    <p className="text-grey-500 truncate font-sans text-sm">{it.secondary}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`flex min-h-0 flex-1 flex-col ${
              spec.body.align === 'top'
                ? 'justify-start'
                : spec.body.align === 'bottom'
                  ? 'justify-end'
                  : 'justify-center'
            }`}
          >
            <p
              className={`${hc} text-[clamp(40px,12vw,140px)] leading-[0.95] font-bold tracking-tight break-words text-white`}
            >
              {spec.body.big}
              {spec.body.unit ? (
                <span className="text-grey-500 align-baseline text-[0.34em] font-semibold">
                  {' '}
                  {spec.body.unit}
                </span>
              ) : null}
            </p>
            {spec.body.caption ? (
              <p className="text-grey-500 mt-5 max-w-xs font-sans text-base leading-relaxed">
                {spec.body.caption}
              </p>
            ) : null}
          </div>
        )}
      </div>
      {spec.folio != null ? (
        <p className="text-grey-500 mt-4 font-sans text-[11px] font-medium tabular-nums">
          {pad2(spec.folio)}
        </p>
      ) : null}
    </div>
  );
}
