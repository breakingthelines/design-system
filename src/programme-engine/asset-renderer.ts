import * as THREE from 'three';

import { stableHash } from './hash';
import { buildProgrammeScene } from './scene-builder';
import {
  THREE_PROGRAMME_ENGINE_VERSION,
  type ProgrammeEngineAssetKind,
  type ProgrammeEngineInput,
  type ProgrammeExportManifest,
  type ProgrammeSceneBuildResult,
  type StaticProgrammeExportResult,
} from './types';

export interface StaticProgrammeAssetOptions {
  kind: Extract<ProgrammeEngineAssetKind, 'og-cover' | 'spread-card'>;
  width?: number;
  height?: number;
  renderer?: ProgrammeStaticExportRenderer;
}

export interface ProgrammeStaticExportRenderer {
  render(scene: ProgrammeSceneBuildResult): Promise<Blob>;
}

const STATIC_DIMENSIONS: Record<
  StaticProgrammeAssetOptions['kind'],
  { width: number; height: number }
> = {
  'og-cover': { width: 1200, height: 630 },
  'spread-card': { width: 1080, height: 1080 },
};

export async function renderStaticProgrammeAsset(
  input: ProgrammeEngineInput,
  options: StaticProgrammeAssetOptions
): Promise<StaticProgrammeExportResult> {
  const defaults = STATIC_DIMENSIONS[options.kind];
  const width = options.width ?? defaults.width;
  const height = options.height ?? defaults.height;
  const scene = buildProgrammeScene(input, {
    assetKind: options.kind,
    width,
    height,
  });

  const manifest = programmeExportManifest(input, options.kind, width, height, scene);
  const blob = options.renderer ? await options.renderer.render(scene) : undefined;
  return {
    manifest,
    blob,
    scene,
  };
}

export function programmeExportManifest(
  input: ProgrammeEngineInput,
  assetKind: ProgrammeEngineAssetKind,
  width: number,
  height: number,
  scene: ProgrammeSceneBuildResult,
  warnings: string[] = []
): ProgrammeExportManifest {
  return {
    assetKind,
    programmeId: input.programmeId,
    issueNumber: input.issueNumber.toString(),
    engineVersion: THREE_PROGRAMME_ENGINE_VERSION,
    width,
    height,
    contentHash: stableHash(scene.description),
    source: 'three-programme-engine',
    warnings,
  };
}

export function createThreeCanvasStaticRenderer(): ProgrammeStaticExportRenderer {
  return {
    async render(scene) {
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(1);
      renderer.setSize(scene.description.width, scene.description.height, false);
      renderer.render(scene.scene, scene.camera);

      const blob = await canvasToBlob(renderer.domElement);
      renderer.dispose();
      return blob;
    },
  };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Three.js canvas export produced no blob'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}
