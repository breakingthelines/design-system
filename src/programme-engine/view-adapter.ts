import * as THREE from 'three';

import { buildProgrammeScene } from './scene-builder';
import type { ProgrammeEngineInput, ProgrammeSceneBuildResult } from './types';

export interface ProgrammeViewMountOptions {
  width: number;
  height: number;
  canvas?: HTMLCanvasElement;
}

export interface MountedProgrammeView {
  scene: ProgrammeSceneBuildResult;
  renderer: THREE.WebGLRenderer;
  render(): void;
  dispose(): void;
}

export function mountProgrammeView(
  input: ProgrammeEngineInput,
  options: ProgrammeViewMountOptions,
): MountedProgrammeView {
  const scene = buildProgrammeScene(input, {
    assetKind: 'animated-programme',
    width: options.width,
    height: options.height,
  });
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    canvas: options.canvas,
  });
  renderer.setSize(options.width, options.height, false);

  return {
    scene,
    renderer,
    render() {
      renderer.render(scene.scene, scene.camera);
    },
    dispose() {
      renderer.dispose();
    },
  };
}
