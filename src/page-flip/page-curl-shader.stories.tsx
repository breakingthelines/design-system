import preview from '#.storybook/preview';
import { Canvas, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { PageCurlMaterialImpl } from './page-curl-material';

/**
 * Shader-debug stories.
 *
 * These mount the page-curl fragment shader directly at a *fixed* uProgress so
 * the curl geometry, the front/back-face split, the back-page tint, and the
 * soft shadow can be inspected frame-by-frame (and screenshotted in CI) without
 * fighting the live turn animation. The page faces are drawn to 2D canvases —
 * deterministic, CORS-clean, and crisp enough to confirm there's no UV
 * smearing of text on the curl.
 *
 * The production component (`PageFlip`) freezes *live DOM* to textures instead;
 * this harness just substitutes a synthetic, repeatable texture pair.
 */

const meta = preview.meta({
  title: 'Page Flip/Curl Shader (debug)',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Fixed-progress harness for visually QA-ing the cylindrical page-curl fragment ' +
          'shader. Sweep uProgress to watch the curl roll; the type must stay sharp ' +
          '(per-pixel UV remap, not mesh deformation).',
      },
    },
  },
  argTypes: {
    uProgress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    uRadius: { control: { type: 'range', min: 0.05, max: 0.4, step: 0.01 } },
    uShadowStrength: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
});

const PAGE_W = 700;
const PAGE_H = 1000;

type FacePaint = {
  bg: string;
  kicker: string;
  headline: string[];
  stat: string;
  statLabel: string;
  byline: string;
};

function paintFace(paint: FacePaint): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const ink = '#f2f0ee';
  const red = '#eb0000';
  const muted = '#807c7c';

  ctx.fillStyle = paint.bg;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  const padX = 72;

  // Full-width top rule + a right-aligned issue label. Content that spans the
  // FULL page width (not just the left column) is what makes the curl's
  // back-face legibility verifiable: at high progress the rolled-over flap
  // samples the page's RIGHT edge, so a page with only left-aligned copy reads
  // as blank paper there. The running marks below give every face edge-to-edge
  // content so the flap shows real, correctly-oriented type.
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(padX, 70, PAGE_W - padX * 2, 2);
  ctx.fillStyle = muted;
  ctx.font = '600 13px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('BREAKING THE LINES — ISSUE 01', PAGE_W - padX, 60);
  ctx.textAlign = 'left';

  // Right-margin vertical running title — lives in the page's right third, so
  // the curling flap (which samples that region) carries legible back content.
  ctx.save();
  ctx.translate(PAGE_W - 40, PAGE_H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = muted;
  ctx.font = '700 15px Helvetica, Arial, sans-serif';
  ctx.fillText(paint.kicker.toUpperCase(), 0, 0);
  ctx.restore();
  ctx.textAlign = 'left';

  // Kicker
  ctx.fillStyle = red;
  ctx.font = '700 16px Helvetica, Arial, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(paint.kicker.toUpperCase(), padX, 130);
  // letter-spacing fudge: draw a rule under the kicker
  ctx.fillRect(padX, 146, 44, 3);

  // Headline (serif, multi-line)
  ctx.fillStyle = ink;
  ctx.font = '700 58px Georgia, "Times New Roman", serif';
  let y = 230;
  for (const line of paint.headline) {
    ctx.fillText(line, padX, y);
    y += 66;
  }

  // Stat
  ctx.fillStyle = red;
  ctx.font = '700 96px Georgia, serif';
  ctx.fillText(paint.stat, padX, y + 140);
  ctx.fillStyle = muted;
  ctx.font = '600 15px Helvetica, Arial, sans-serif';
  ctx.fillText(paint.statLabel.toUpperCase(), padX, y + 180);

  // Byline footer
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, PAGE_H - 150);
  ctx.lineTo(PAGE_W - padX, PAGE_H - 150);
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.font = '600 16px Helvetica, Arial, sans-serif';
  ctx.fillText(paint.byline, padX, PAGE_H - 120);

  // Folio — left mark + a right-aligned page number, so the bottom band also
  // carries content to the page's right edge (visible on the rolled flap).
  ctx.fillStyle = muted;
  ctx.font = '400 12px Helvetica, Arial, sans-serif';
  ctx.fillText('BREAKING THE LINES', padX, PAGE_H - 60);
  ctx.textAlign = 'right';
  ctx.fillText(paint.stat, PAGE_W - padX, PAGE_H - 60);
  ctx.textAlign = 'left';

  return canvas;
}

function makeTexture(paint: FacePaint): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(paintFace(paint));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

const FACE_A: FacePaint = {
  bg: '#0d0d0d',
  kicker: 'Tactics / Build-up',
  headline: ['The full-back is', 'no longer a', 'full-back'],
  stat: '61%',
  statLabel: 'progressive passes start centrally',
  byline: 'Zach Lowy — Senior Tactics Writer',
};

const FACE_B: FacePaint = {
  bg: '#0d0d0d',
  kicker: 'Data / Pressing',
  headline: ['A quieter game,', 'measured in', 'metres'],
  stat: '+1.8',
  statLabel: 'average rise in PPDA since 2021',
  byline: 'Maya Okonkwo — Data Editor',
};

// The UNDERSIDE of the turning leaf — a distinct page so the curl's back-face
// is visibly NOT the front text mirrored. A clean mid-turn screenshot should
// show this content (the right way round) on the rolled-over flap.
const FACE_BACK: FacePaint = {
  bg: '#111111',
  kicker: 'Interview / Long Read',
  headline: ['We stopped', 'chasing the', 'ball'],
  stat: '9',
  statLabel: 'fewer high turnovers per match',
  byline: 'Tomás Herrera — Contributing Editor',
};

interface CurlArgs {
  uProgress: number;
  uRadius: number;
  uShadowStrength: number;
}

function FixedCurl({ uProgress, uRadius, uShadowStrength }: CurlArgs) {
  const { viewport } = useThree();
  const texA = useMemo(() => makeTexture(FACE_A), []);
  const texBack = useMemo(() => makeTexture(FACE_BACK), []);
  const texB = useMemo(() => makeTexture(FACE_B), []);
  const axis = useMemo(() => new THREE.Vector2(1, 0), []);
  const matRef = useRef<InstanceType<typeof PageCurlMaterialImpl> | null>(null);
  const aspect = viewport.width / viewport.height || 1;

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <pageCurlMaterial
        ref={matRef}
        key={PageCurlMaterialImpl.key}
        uPageA={texA}
        uPageBack={texBack}
        uPageB={texB}
        uCurlAxis={axis}
        uProgress={uProgress}
        uRadius={uRadius}
        uShadowStrength={uShadowStrength}
        uAspect={aspect}
        transparent
      />
    </mesh>
  );
}

function Stage(args: CurlArgs) {
  return (
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
        data-curl-stage="true"
        style={{
          position: 'relative',
          width: 'min(560px, 92vw)',
          height: 'min(800px, 88vh)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        <Canvas
          orthographic
          camera={{ position: [0, 0, 5], zoom: 1, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%' }}
        >
          <FixedCurl {...args} />
        </Canvas>
      </div>
    </div>
  );
}

export const Progress25 = meta.story({
  args: { uProgress: 0.25, uRadius: 0.18, uShadowStrength: 0.55 },
  render: (args) => <Stage {...(args as CurlArgs)} />,
});

export const Progress50 = meta.story({
  args: { uProgress: 0.5, uRadius: 0.18, uShadowStrength: 0.55 },
  render: (args) => <Stage {...(args as CurlArgs)} />,
});

export const Progress75 = meta.story({
  args: { uProgress: 0.75, uRadius: 0.18, uShadowStrength: 0.55 },
  render: (args) => <Stage {...(args as CurlArgs)} />,
});

export const Playground = meta.story({
  args: { uProgress: 0.4, uRadius: 0.18, uShadowStrength: 0.55 },
  render: (args) => <Stage {...(args as CurlArgs)} />,
});
