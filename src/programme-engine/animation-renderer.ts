import * as THREE from 'three';

import { programmeExportManifest } from './asset-renderer';
import { stableHash } from './hash';
import { buildProgrammeScene } from './scene-builder';
import {
  type AnimatedProgrammeExportFrame,
  type AnimatedProgrammeExportResult,
  type ProgrammeEngineInput,
  type ProgrammeSceneBuildResult,
} from './types';

export interface AnimatedProgrammeAssetOptions {
  width?: number;
  height?: number;
  durationMs?: number;
  fps?: number;
  recorder?: ProgrammeAnimationRecorder;
}

export interface ProgrammeAnimationRecorder {
  record(scene: ProgrammeSceneBuildResult, frames: AnimatedProgrammeExportFrame[]): Promise<Blob>;
}

export async function renderAnimatedProgrammeAsset(
  input: ProgrammeEngineInput,
  options: AnimatedProgrammeAssetOptions = {},
): Promise<AnimatedProgrammeExportResult & { blob?: Blob }> {
  const width = options.width ?? 1080;
  const height = options.height ?? 1080;
  const durationMs = options.durationMs ?? 2400;
  const fps = options.fps ?? 24;
  const scene = buildProgrammeScene(input, {
    assetKind: 'animated-programme',
    width,
    height,
  });
  const frames = programmeAnimationFrames(scene, durationMs, fps);
  const manifest = {
    ...programmeExportManifest(input, 'animated-programme', width, height, scene),
    contentHash: stableHash({ scene: scene.description, frames }),
    durationMs,
    fps,
    frameCount: frames.length,
  };
  const blob = options.recorder ? await options.recorder.record(scene, frames) : undefined;
  return {
    manifest,
    frames,
    scene,
    blob,
  };
}

export function programmeAnimationFrames(
  scene: ProgrammeSceneBuildResult,
  durationMs: number,
  fps: number,
): AnimatedProgrammeExportFrame[] {
  const frameCount = Math.max(1, Math.round((durationMs / 1000) * fps));
  return Array.from({ length: frameCount }, (_, index) => {
    const progress = frameCount === 1 ? 0 : index / (frameCount - 1);
    const rotationY = -0.24 + Math.sin(progress * Math.PI) * 0.48;
    return {
      index,
      atMs: Math.round(progress * durationMs),
      rotationY,
      contentHash: stableHash({
        scene: scene.description,
        index,
        atMs: Math.round(progress * durationMs),
        rotationY: Number(rotationY.toFixed(5)),
      }),
    };
  });
}

export function createMediaRecorderAnimationRecorder(): ProgrammeAnimationRecorder {
  return {
    async record(scene, frames) {
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setSize(scene.description.width, scene.description.height, false);

      const stream = renderer.domElement.captureStream(24);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
      });
      const chunks: Blob[] = [];
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });

      const stopped = new Promise<void>((resolve) => {
        recorder.addEventListener('stop', () => resolve(), { once: true });
      });
      recorder.start();
      for (const frame of frames) {
        scene.root.rotation.y = frame.rotationY;
        renderer.render(scene.scene, scene.camera);
        await nextAnimationFrame();
      }
      recorder.stop();
      await stopped;
      renderer.dispose();
      return new Blob(chunks, { type: 'video/webm' });
    },
  };
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
