// Book3D — a genuinely-3D magazine book on react-three-fiber.
//
// Pages are SkinnedMeshes (a subdivided plane bent by a bone chain), so a turn
// is REAL geometry — not a CSS-transform fake (StPageFlip) nor a flat single-
// quad shader. The realistic feel comes from the turn-timing S-curve bending
// the bones mid-turn, plus real lighting, contact shadows, and page thickness.
// Faithful adaptation of Wawa Sensei's R3F book
// (github.com/wass08/r3f-animated-book-slider-final).
//
// This is a presentation-only engine: it takes already-rendered page TEXTURES
// (front/back per physical leaf) and a controlled page index. The Issue faces
// (cover, content, photos, back) are drawn to those textures upstream by
// drawFaceCanvas — the owner's tactical doodle is composited into the inner-page
// textures there, so it rides the page geometry as it bends.

import { Environment, Float, OrbitControls, useCursor } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bone,
  BoxGeometry,
  Color,
  Float32BufferAttribute,
  type Group,
  MathUtils,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  type Texture,
  Uint16BufferAttribute,
  Vector3,
} from 'three';

import type { BookTexturePage } from '../faces/use-face-textures';

const easingFactor = 0.5;
const easingFactorFold = 0.3;
const insideCurveStrength = 0.18;
const outsideCurveStrength = 0.05;
const turningCurveStrength = 0.09;

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71;
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const pageGeometry = new BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, PAGE_SEGMENTS, 2);
pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);
{
  const position = pageGeometry.attributes.position;
  const vertex = new Vector3();
  const skinIndexes: number[] = [];
  const skinWeights: number[] = [];
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const x = vertex.x;
    const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
    const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;
    skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
  }
  pageGeometry.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndexes, 4));
  pageGeometry.setAttribute('skinWeight', new Float32BufferAttribute(skinWeights, 4));
}

const whiteColor = new Color('white');
// Hover feedback darkens the page (a quiet press affordance) — no red glow.
const dimColor = new Color('#b4b4bb');

// Box side faces = the page-block edges. Off-white paper edges read as a real
// magazine page-stack against the dark cover; the fore-edge (-x) is shadowed.
const pageMaterials = [
  new MeshStandardMaterial({ color: '#e8e6e0', roughness: 0.9 }),
  new MeshStandardMaterial({ color: '#23232a', roughness: 0.9 }),
  new MeshStandardMaterial({ color: '#e8e6e0', roughness: 0.95 }),
  new MeshStandardMaterial({ color: '#e8e6e0', roughness: 0.95 }),
];

function Page({
  number,
  totalPages,
  page,
  opened,
  bookClosed,
  data,
  onSelect,
}: {
  number: number;
  totalPages: number;
  page: number;
  opened: boolean;
  bookClosed: boolean;
  data: BookTexturePage;
  onSelect: (n: number) => void;
}) {
  const group = useRef<Group>(null);
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);
  const skinnedMeshRef = useRef<SkinnedMesh>(null);
  const [highlighted, setHighlighted] = useState(false);
  useCursor(highlighted);

  const manualSkinnedMesh = useMemo(() => {
    const bones: Bone[] = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      const bone = new Bone();
      bone.position.x = i === 0 ? 0 : SEGMENT_WIDTH;
      if (i > 0) bones[i - 1].add(bone);
      bones.push(bone);
    }
    const skeleton = new Skeleton(bones);
    const materials = [
      ...pageMaterials,
      new MeshStandardMaterial({
        color: whiteColor,
        map: data.front,
        roughness: number === 0 ? 0.32 : 0.62,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: data.back,
        roughness: number === totalPages - 1 ? 0.32 : 0.62,
      }),
    ];
    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mesh built once; maps swapped below
  }, []);

  // Swap the face maps when the textures change (e.g. a heading-font switch
  // rebuilds the page textures) without rebuilding the skinned mesh.
  useEffect(() => {
    const mats = manualSkinnedMesh.material as MeshStandardMaterial[];
    const swap = (mat: MeshStandardMaterial, tex: Texture) => {
      if (mat.map !== tex) {
        mat.map = tex;
        mat.needsUpdate = true;
      }
    };
    swap(mats[4], data.front);
    swap(mats[5], data.back);
  }, [data.front, data.back, manualSkinnedMesh]);

  useFrame((_, delta) => {
    const skinned = skinnedMeshRef.current;
    if (!skinned || !group.current) return;

    // Darken the hovered leaf (both faces) toward a dim grey; no red glow.
    const mats = skinned.material as MeshStandardMaterial[];
    const hoverColor = highlighted ? dimColor : whiteColor;
    mats[4].color.lerp(hoverColor, 0.12);
    mats[5].color.lerp(hoverColor, 0.12);

    if (lastOpened.current !== opened) {
      turnedAt.current = performance.now();
      lastOpened.current = opened;
    }
    let turningTime = Math.min(400, performance.now() - turnedAt.current) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) targetRotation += MathUtils.degToRad(number * 0.8);

    const bones = skinned.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i];
      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity = Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;
      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;
      let foldRotationAngle = MathUtils.degToRad(Math.sign(targetRotation) * 2);
      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }
      easing.dampAngle(target.rotation, 'y', rotationAngle, easingFactor, delta);
      const foldIntensity =
        i > 8 ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime : 0;
      easing.dampAngle(
        target.rotation,
        'x',
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta
      );
    }
  });

  return (
    <group
      ref={group}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHighlighted(true);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHighlighted(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(opened ? number : number + 1);
        setHighlighted(false);
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />
    </group>
  );
}

function Book({
  pages,
  page,
  onPageChange,
}: {
  pages: BookTexturePage[];
  page: number;
  onPageChange: (p: number) => void;
}) {
  const [delayedPage, setDelayedPage] = useState(page);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const goToPage = () => {
      setDelayedPage((dp) => {
        if (page === dp) return dp;
        timeout = setTimeout(goToPage, Math.abs(page - dp) > 2 ? 50 : 150);
        return page > dp ? dp + 1 : dp - 1;
      });
    };
    goToPage();
    return () => clearTimeout(timeout);
  }, [page]);

  return (
    <group rotation-y={-Math.PI / 2}>
      {pages.map((data, index) => (
        <Page
          key={index}
          number={index}
          totalPages={pages.length}
          page={delayedPage}
          opened={delayedPage > index}
          bookClosed={delayedPage === 0 || delayedPage === pages.length}
          data={data}
          onSelect={onPageChange}
        />
      ))}
    </group>
  );
}

export interface Book3DProps {
  /** Paired front/back textures per physical leaf (cover leaf first). */
  pages: BookTexturePage[];
  /**
   * Turn index (0 = closed on the cover; N turns the Nth leaf). Controlled —
   * the reader owns this and reacts to clicks via {@link onPageChange}.
   */
  page: number;
  onPageChange: (page: number) => void;
  /** Resting tilt of the floating book, in degrees. Default 22 (readable but dimensional). */
  tiltDeg?: number;
  /** Allow drag-to-orbit. Default true. */
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** The 3D book stage: lighting, contact shadow, a gentle float, orbit. */
export function Book3D({
  pages,
  page,
  onPageChange,
  tiltDeg = 22,
  interactive = true,
  className,
  style,
}: Book3DProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        // Explicit PCFShadowMap. `shadows` (boolean) requests PCFSoftShadowMap,
        // which three r0.184 deprecated: WebGLShadowMap.render() warns AND resets
        // to PCFShadowMap on every frame, while R3F re-applies the soft type each
        // frame — an endless per-frame console warning. The render is already
        // PCFShadowMap (three's fallback), so this is identical output, no warning.
        shadows="percentage"
        frameloop="always"
        dpr={[1, 2]}
        camera={{ position: [2.28, 0.5, 3.18], fov: 40 }}
      >
        <color attach="background" args={['#08080a']} />
        <group position-y={0.12}>
          <Float
            rotation-x={-MathUtils.degToRad(tiltDeg)}
            floatIntensity={0.28}
            speed={1.1}
            rotationIntensity={0.2}
          >
            <Book pages={pages} page={page} onPageChange={onPageChange} />
          </Float>
        </group>
        <directionalLight
          position={[2, 5, 2]}
          intensity={1.25}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <ambientLight intensity={0.3} />
        {/* IBL lighting only — isolated in its own Suspense so a slow HDR load
            never blanks the whole book (the "needs a nudge to appear" bug). */}
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.4} />
        </Suspense>
        <mesh position-y={-1.7} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <shadowMaterial transparent opacity={0.32} />
        </mesh>
        {interactive ? (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={0.4}
            maxPolarAngle={Math.PI / 1.95}
            minAzimuthAngle={-Math.PI / 5}
            maxAzimuthAngle={Math.PI / 5}
          />
        ) : null}
      </Canvas>
    </div>
  );
}
