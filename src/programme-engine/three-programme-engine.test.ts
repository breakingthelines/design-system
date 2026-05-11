import { describe, expect, it } from 'vitest';

import {
  buildProgrammeScene,
  defaultProgrammeEngineTheme,
  programmeAnimationFrames,
  programmeEngineFixture,
  renderAnimatedProgrammeAsset,
  renderStaticProgrammeAsset,
  THREE_PROGRAMME_ENGINE_VERSION,
  type ProgrammeStaticExportRenderer,
} from './index';

describe('Three.js Programme engine', () => {
  it('builds a Programme scene from frozen fixture data and design-system tokens', () => {
    const scene = buildProgrammeScene(programmeEngineFixture, {
      assetKind: 'og-cover',
      width: 1200,
      height: 630,
    });

    expect(programmeEngineFixture.theme).toBe(defaultProgrammeEngineTheme);
    expect(scene.description.engineVersion).toBe(THREE_PROGRAMME_ENGINE_VERSION);
    expect(scene.description.programmeId).toBe('programme-fixture-1');
    expect(scene.description.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining(['background', 'main-panel', 'accent-spine', 'title', 'issue']),
    );
    expect(scene.root.children.length).toBe(scene.description.nodes.length);
  });

  it('proves static OG cover and spread card export manifests from the same scene contract', async () => {
    const renderer: ProgrammeStaticExportRenderer = {
      async render(scene) {
        return new Blob([scene.description.assetKind, scene.description.programmeId], {
          type: 'image/png',
        });
      },
    };

    const cover = await renderStaticProgrammeAsset(programmeEngineFixture, {
      kind: 'og-cover',
      renderer,
    });
    const spread = await renderStaticProgrammeAsset(programmeEngineFixture, {
      kind: 'spread-card',
      renderer,
    });

    expect(cover.manifest).toMatchObject({
      assetKind: 'og-cover',
      width: 1200,
      height: 630,
      source: 'three-programme-engine',
    });
    expect(spread.manifest).toMatchObject({
      assetKind: 'spread-card',
      width: 1080,
      height: 1080,
      source: 'three-programme-engine',
    });
    expect(cover.manifest.contentHash).toMatch(/^btl-/);
    expect(spread.manifest.contentHash).toMatch(/^btl-/);
    expect(cover.manifest.contentHash).not.toBe(spread.manifest.contentHash);
    expect(await cover.blob?.text()).toBe('og-coverprogramme-fixture-1');
    expect(await spread.blob?.text()).toBe('spread-cardprogramme-fixture-1');
  });

  it('proves animated 3D Programme export metadata from native frame intent', async () => {
    const animated = await renderAnimatedProgrammeAsset(programmeEngineFixture, {
      durationMs: 1000,
      fps: 6,
      recorder: {
        async record(_scene, frames) {
          return new Blob([frames.map((frame) => frame.contentHash).join('|')], {
            type: 'video/webm',
          });
        },
      },
    });

    expect(animated.manifest).toMatchObject({
      assetKind: 'animated-programme',
      durationMs: 1000,
      fps: 6,
      frameCount: 6,
      source: 'three-programme-engine',
    });
    expect(animated.frames).toHaveLength(6);
    expect(animated.frames[0]?.rotationY).toBeLessThan(0);
    expect(animated.frames.at(-1)?.rotationY).toBeLessThan(0);
    expect(animated.frames[3]?.rotationY).toBeGreaterThan(0);
    expect(await animated.blob?.text()).toContain('btl-');
  });

  it('keeps animation frames deterministic for a fixed scene', () => {
    const scene = buildProgrammeScene(programmeEngineFixture, {
      assetKind: 'animated-programme',
      width: 1080,
      height: 1080,
    });

    const first = programmeAnimationFrames(scene, 1000, 6);
    const second = programmeAnimationFrames(scene, 1000, 6);

    expect(first).toEqual(second);
  });
});
