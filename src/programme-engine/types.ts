import type * as THREE from 'three';
import type { BlockKind } from '@breakingthelines/protos/btl/content/v1/page_pb';

export const THREE_PROGRAMME_ENGINE_VERSION = 'three-programme-engine.v0';

export type ProgrammeEngineAssetKind = 'og-cover' | 'spread-card' | 'animated-programme';

export interface ProgrammeEngineTheme {
  background: string;
  foreground: string;
  accent: string;
  muted: string;
}

export interface ProgrammeEngineBlock {
  id: string;
  kind: BlockKind;
  title: string;
  subtitle?: string;
  snapshotState?: string;
  fallbackReasons?: string[];
}

export interface ProgrammeEngineInput {
  programmeId: string;
  issueNumber: bigint;
  ownerLabel: string;
  title: string;
  subtitle?: string;
  theme: ProgrammeEngineTheme;
  blocks: ProgrammeEngineBlock[];
}

export interface ProgrammeSceneNode {
  id: string;
  role: 'background' | 'panel' | 'accent' | 'text-proxy' | 'page';
  label?: string;
  color: string;
  position: readonly [number, number, number];
  size: readonly [number, number];
  rotation?: readonly [number, number, number];
}

export interface ProgrammeSceneDescription {
  engineVersion: string;
  programmeId: string;
  issueNumber: string;
  assetKind: ProgrammeEngineAssetKind;
  width: number;
  height: number;
  nodes: ProgrammeSceneNode[];
}

export interface ProgrammeSceneBuildResult {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  root: THREE.Group;
  description: ProgrammeSceneDescription;
}

export interface ProgrammeExportManifest {
  assetKind: ProgrammeEngineAssetKind;
  programmeId: string;
  issueNumber: string;
  engineVersion: string;
  width: number;
  height: number;
  contentHash: string;
  source: 'three-programme-engine';
  warnings: string[];
}

export interface StaticProgrammeExportResult {
  manifest: ProgrammeExportManifest;
  blob?: Blob;
  scene: ProgrammeSceneBuildResult;
}

export interface AnimatedProgrammeExportFrame {
  index: number;
  atMs: number;
  rotationY: number;
  contentHash: string;
}

export interface AnimatedProgrammeExportResult {
  manifest: ProgrammeExportManifest & {
    durationMs: number;
    fps: number;
    frameCount: number;
  };
  frames: AnimatedProgrammeExportFrame[];
  scene: ProgrammeSceneBuildResult;
}
