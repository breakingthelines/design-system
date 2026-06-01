import { shaderMaterial } from '@react-three/drei';
import { extend, type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Cylindrical page-curl, computed entirely in the fragment shader.
 *
 * Ported from Andrew Hung's "Page Curl Shader Breakdown"
 * (https://andrewhungblog.wordpress.com/2018/04/29/page-curl-shader-breakdown/)
 * and Shadertoy `ls3cDB` (https://www.shadertoy.com/view/ls3cDB).
 *
 * Why per-pixel and not vertex displacement: the geometry is a flat 1×1 quad
 * (4 verts). The curl is an analytic UV remap done per fragment, so the page
 * texture is resampled — not stretched across a deformed mesh. That keeps text
 * crisp (the whole point) and avoids the smearing you get from cloth/verlet or
 * subdivided-plane bending.
 *
 * ── The geometry (occlusion-correct) ────────────────────────────────────────
 * The page lies flat on a table; we lift its trailing portion, wrap it around a
 * cylinder of radius `r`, and let the part past the half-turn fall back FLAT on
 * top of the page as a doubled-over flap. Viewed straight down (orthographic),
 * three surfaces can occupy a screen column — and the renderer must pick exactly
 * the one nearest the eye, or two pages bleed through each other (the classic
 * "interleave" at mid-turn). The surfaces, front-to-back:
 *
 *   1. FLAP        the lifted paper that has rolled past the crest and now lies
 *                  flat ON TOP, doubling back toward the spine. Its visible face
 *                  is the leaf's UNDERSIDE = the next page (`uPageBack`). It
 *                  OCCLUDES everything beneath it within its silhouette.
 *   2. CYLINDER    the quarter/half-pipe of paper still wrapping the roll. In a
 *                  top-down view we see its near (upper) face only — the FRONT of
 *                  the turning leaf (`uPageA`), climbing to the crest.
 *   3. FLAT FRONT  page A still lying flat on the table, ahead of the contact
 *                  line (`uPageA`), and the REVEALED page beneath the lifted part
 *                  (`uPageB`) once the flap/cylinder no longer covers it.
 *
 * We march along the drag axis with a single coordinate. `xc` is the CONTACT
 * line (where flat paper leaves the table and starts to wrap); the cylinder axis
 * sits a radius further along at `xc + r`, the crest projects to `xc + r`, and
 * lift-off (where the half-wrap completes and the flap begins) projects back to
 * `xc`. So the cylinder's silhouette spans exactly `[xc, xc + 2r]`… no — the
 * near face we see spans `[xc, xc + r]` (contact → crest); past the crest the
 * paper is the flap, lying flat back over `[xc + r - flapLen, xc + r]`. Every
 * screen column resolves to ONE surface by testing flap-first, then cylinder,
 * then the flat layers — so there is never an A/B interleave at any progress.
 *
 * Crisp text: within the cylinder we resample by true surface ARC LENGTH from
 * the contact line (`arc = r·angle`), so the texel grid is walked 1:1 along the
 * paper — no stretch. The flap is a flat, mirrored continuation of that same
 * arc parameter, so its next-page text reads the right way round (a flap is the
 * back of the sheet seen from the front; the arc-unroll already accounts for the
 * fold, so we do NOT additionally mirror it).
 *
 * `uPageA` is the FRONT of the page being turned. `uPageBack` is its UNDERSIDE
 * (the back of the leaf — a real *next* page, never a mirror of the front).
 * `uPageB` is the page revealed underneath as the leaf lifts away.
 * `uProgress` 0→1 sweeps the curl across the quad.
 *
 * Uniforms:
 *  - uProgress      0 (flat, page A fully shown) → 1 (turned, page B shown)
 *  - uRadius        cylinder radius in normalised page units (smaller = tighter roll)
 *  - uCurlAxis      drag direction (unit-ish vec2); curl axis is perpendicular to it
 *  - uPageA         front face of the turning leaf
 *  - uPageBack      underside of the turning leaf (the next page, or a paper back)
 *  - uPageB         the page revealed underneath
 *  - uShadowStrength 0..1 depth of the soft shadow the curl casts on page B and
 *                    of the ambient-occlusion darkening into the roll
 *  - uAspect        quad aspect (w/h). Reserved: with the axis-aligned (vertical
 *                    curl axis / horizontal drag) flips we ship, arc-length runs
 *                    purely along x and reads correctly without correction. It's
 *                    here so a future diagonal curl can keep the cylinder round.
 *  - uBacksideTint  multiplier applied to the back face (paper is dimmer in shadow)
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uProgress;
  uniform float uRadius;
  uniform vec2  uCurlAxis;
  uniform sampler2D uPageA;
  uniform sampler2D uPageBack;
  uniform sampler2D uPageB;
  uniform float uShadowStrength;
  uniform float uAspect;
  uniform float uBacksideTint;

  const float PI = 3.14159265359;

  // Is a UV inside the page? (off-edge samples must not show.)
  bool inPage(vec2 uv) {
    return uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;
  }

  void main() {
    vec2 dir = normalize(uCurlAxis);   // travel direction of the fold (e.g. +x)
    float r = max(uRadius, 1e-3);
    vec2 uv = vUv;

    // This fragment's coordinate along the fold's travel axis (0 at the spine
    // edge, 1 at the leading edge for a +x curl).
    float x = dot(uv, dir);

    // ── Where the roll sits ───────────────────────────────────────────────────
    // xc is the CONTACT line: flat paper to the left of it (smaller x along
    // dir) is still on the table; paper to the right has been lifted into the
    // roll. The cylinder's near (viewer-facing) face spans [xc, xc + r]: contact
    // at xc, crest at xc + r. Past the crest the paper lies back FLAT as a flap.
    //
    // At progress 0 the contact sits a crest-radius beyond the leading edge
    // (xc = 1 + r), so the whole quad is flat page A. At progress 1 the contact
    // has swept past the spine (xc = -r) and page B fully shows. The roll's
    // near face therefore travels right→left as progress climbs.
    float xc = mix(1.0 + r, -r, uProgress);
    float crestX = xc + r;                    // screen-x of the crest (top of roll)

    // Total paper length lifted off the table = everything from the contact line
    // to the leading edge (x = 1) of the sheet, measured in page units. The
    // first half-circumference (PI*r) of it wraps the cylinder; any surplus lies
    // flat on top as the doubled-over flap.
    float lifted = max(1.0 - xc, 0.0);
    float halfCirc = PI * r;
    float flapLen = max(lifted - halfCirc, 0.0);   // flat run of paper on top
    // The flap's free (leading) edge projects this far left of the crest.
    float flapLeftX = crestX - flapLen;

    vec3 pageA = texture2D(uPageA, uv).rgb;
    vec3 pageB = texture2D(uPageB, uv).rgb;

    // ── 1. FLAP — lifted paper lying flat ON TOP, occludes everything ─────────
    // It covers the screen band [flapLeftX, crestX]. Its visible face is the
    // leaf UNDERSIDE — a real next page (uPageBack), laid out to READ CORRECTLY
    // (never the front mirrored: that mirrored-front is the exact bug we fixed).
    //
    // The leaf is rotating to become the next spread's LEFT page: its outer edge
    // meets the fold at the crest, its spine trails toward the free edge. So we
    // lay uPageBack on the flap with its OUTER edge (source x = 1) at the crest
    // and walk INWARD (decreasing source x) toward the free edge. Mapping
    // screen-x → source-x is therefore strictly increasing — no horizontal flip,
    // so the next page's type is upright and forward-reading. The flap is flat,
    // so one screen unit = one page unit: a 1:1 resample, text stays crisp.
    if (flapLen > 0.0 && x <= crestX && x >= flapLeftX) {
      float sourceX = 1.0 - (crestX - x);           // crest → 1.0, free edge → 1.0 - flapLen
      vec2 sourceUv = uv + dir * (sourceX - x);
      if (inPage(sourceUv)) {
        // Soft AO where the flap meets the crest fold, lightening toward its
        // free edge; a faint drop where it lifts away from page B beneath.
        float toEdge = clamp((x - flapLeftX) / max(flapLen, 1e-3), 0.0, 1.0);
        float ao = mix(0.62, 0.98, toEdge);          // dark in the valley, light at the lip
        vec3 col = texture2D(uPageBack, sourceUv).rgb * uBacksideTint * ao;
        // Fold seam: a tight dark line right at the crest where it bends over.
        float seam = smoothstep(0.018, 0.0, abs(x - crestX)) * uShadowStrength;
        col *= (1.0 - 0.55 * seam);
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        return;
      }
      // Flap material ran off the printed sheet → fall through to whatever is
      // beneath this column (cylinder / page B), handled below.
    }

    // ── 2. CYLINDER near face — the front of the leaf wrapping up to the crest ─
    // Spans [xc, crestX]. Screen offset from the crest is s = x - crestX, in
    // [-r, 0]; on the near (upper) half of the cylinder that is s = -r·cos(phi)
    // with phi the wrap angle from contact (0 at contact → PI/2 at crest). We
    // resample by ARC LENGTH from contact (arc = r·phi) so text stays crisp.
    if (x >= xc && x <= crestX) {
      float s = clamp((x - crestX) / r, -1.0, 0.0); // -1 at contact, 0 at crest
      float phi = acos(-s);                          // 0 at contact → PI/2 at crest
      float arc = phi * r;                           // 0 → (PI/2)*r
      float sourceX = xc + arc;
      vec2 sourceUv = uv + dir * (sourceX - x);
      if (inPage(sourceUv)) {
        // facing = sin(phi): 0 at the grazing contact line, 1 at the crest.
        float facing = sin(phi);
        float lit = mix(1.0 - uShadowStrength * 0.85, 1.06, facing);
        float highlight = 0.10 * smoothstep(0.6, 1.0, facing);
        // Sample the FRONT at the arc-unrolled coordinate (sourceUv), not the
        // fragment's flat uv — that is the 1:1 resample that keeps curved text
        // crisp instead of squashing the flat page into the cylinder's width.
        vec3 col = texture2D(uPageA, sourceUv).rgb * lit + highlight;
        float seam = smoothstep(0.018, 0.0, abs(x - crestX)) * uShadowStrength;
        col *= (1.0 - 0.5 * seam);
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        return;
      }
      // Off the sheet on the curve → revealed page falls through below.
    }

    // ── 3. FLAT layers ────────────────────────────────────────────────────────
    // Ahead of the contact line: flat, untouched front page A.
    if (x < xc) {
      gl_FragColor = vec4(pageA, 1.0);
      return;
    }

    // Behind the roll / under the flap's shadow: the revealed page B, with the
    // soft contact shadow the lifted paper throws just behind the crest.
    float distBehind = x - crestX;                   // ≥ 0 to the right of the crest
    float sh = smoothstep(r * 2.0, 0.0, distBehind); // 1 at the crest → 0 two radii out
    float shade = 1.0 - uShadowStrength * 0.8 * sh;
    gl_FragColor = vec4(pageB * shade, 1.0);
  }
`;

export const PageCurlMaterialImpl = shaderMaterial(
  {
    uProgress: 0,
    uRadius: 0.18,
    uCurlAxis: new THREE.Vector2(1, 0),
    uPageA: null,
    uPageBack: null,
    uPageB: null,
    uShadowStrength: 0.55,
    uAspect: 1,
    uBacksideTint: 0.82,
  },
  vertexShader,
  fragmentShader
);

// Register as a JSX element so it can be used declaratively: <pageCurlMaterial />
extend({ PageCurlMaterial: PageCurlMaterialImpl });

export interface PageCurlMaterialUniforms {
  uProgress?: number;
  uRadius?: number;
  uCurlAxis?: THREE.Vector2;
  uPageA?: THREE.Texture | null;
  uPageBack?: THREE.Texture | null;
  uPageB?: THREE.Texture | null;
  uShadowStrength?: number;
  uAspect?: number;
  uBacksideTint?: number;
}

/**
 * Props for the `<pageCurlMaterial>` JSX element. We compose the standard R3F
 * material element props (so `ref`, `key`, `attach`, `transparent`, … type)
 * with our own uniform setters typed precisely.
 *
 * We deliberately do NOT intersect `ThreeElement<typeof PageCurlMaterialImpl>`:
 * drei's `shaderMaterial` infers each uniform's type from its *default value*,
 * so `uPageA: null` is inferred as the literal `null` and a real `THREE.Texture`
 * won't assign. Borrowing the base `meshBasicMaterial` element props (a real
 * material element) and overlaying our uniforms keeps the textures assignable
 * without any per-call `@ts-expect-error` escape hatch.
 */
export type PageCurlMaterialElement = Omit<
  ThreeElements['meshBasicMaterial'],
  keyof PageCurlMaterialUniforms | 'args'
> &
  PageCurlMaterialUniforms;

// Augment R3F's JSX catalogue with the extended material so TS knows the props.
declare module '@react-three/fiber' {
  interface ThreeElements {
    pageCurlMaterial: PageCurlMaterialElement;
  }
}
