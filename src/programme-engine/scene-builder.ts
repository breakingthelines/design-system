import * as THREE from 'three';

import {
  THREE_PROGRAMME_ENGINE_VERSION,
  type ProgrammeEngineAssetKind,
  type ProgrammeEngineBlock,
  type ProgrammeEngineInput,
  type ProgrammeSceneBuildResult,
  type ProgrammeSceneNode,
} from './types';

export interface ProgrammeSceneBuildOptions {
  assetKind: ProgrammeEngineAssetKind;
  width: number;
  height: number;
}

export function buildProgrammeScene(
  input: ProgrammeEngineInput,
  options: ProgrammeSceneBuildOptions,
): ProgrammeSceneBuildResult {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(input.theme.background);

  const camera = new THREE.OrthographicCamera(
    -options.width / 2,
    options.width / 2,
    options.height / 2,
    -options.height / 2,
    0.1,
    1000,
  );
  camera.position.z = 500;

  const root = new THREE.Group();
  root.name = 'ProgrammeSceneRoot';
  scene.add(root);

  const nodes = programmeSceneNodes(input, options);
  for (const node of nodes) {
    const mesh = nodeToMesh(node);
    root.add(mesh);
  }

  return {
    scene,
    camera,
    root,
    description: {
      engineVersion: THREE_PROGRAMME_ENGINE_VERSION,
      programmeId: input.programmeId,
      issueNumber: input.issueNumber.toString(),
      assetKind: options.assetKind,
      width: options.width,
      height: options.height,
      nodes,
    },
  };
}

export function programmeSceneNodes(
  input: ProgrammeEngineInput,
  options: ProgrammeSceneBuildOptions,
): ProgrammeSceneNode[] {
  const cardWidth = options.width * 0.78;
  const cardHeight = options.height * 0.7;
  const baseNodes: ProgrammeSceneNode[] = [
    {
      id: 'background',
      role: 'background',
      color: input.theme.background,
      position: [0, 0, 0],
      size: [options.width, options.height],
    },
    {
      id: 'main-panel',
      role: 'panel',
      color: input.theme.muted,
      position: [0, 0, 8],
      size: [cardWidth, cardHeight],
      rotation: [0, options.assetKind === 'animated-programme' ? -0.18 : 0, 0],
    },
    {
      id: 'accent-spine',
      role: 'accent',
      color: input.theme.accent,
      position: [-cardWidth / 2 + 22, 0, 14],
      size: [18, cardHeight * 0.86],
    },
    textProxy(
      'owner',
      input.ownerLabel,
      input.theme.foreground,
      [-cardWidth / 2 + 74, cardHeight / 2 - 68, 18],
      [cardWidth * 0.56, 28],
    ),
    textProxy('title', input.title, input.theme.foreground, [-cardWidth / 2 + 74, 40, 18], [
      cardWidth * 0.72,
      82,
    ]),
    textProxy(
      'issue',
      `Issue #${input.issueNumber.toString()}`,
      input.theme.accent,
      [cardWidth / 2 - 190, -cardHeight / 2 + 68, 18],
      [220, 34],
    ),
  ];

  if (input.subtitle) {
    baseNodes.push(
      textProxy('subtitle', input.subtitle, input.theme.foreground, [-cardWidth / 2 + 74, -60, 18], [
        cardWidth * 0.62,
        46,
      ]),
    );
  }

  if (options.assetKind === 'spread-card') {
    baseNodes.push(...spreadNodes(input.blocks.slice(0, 3), input.theme, cardWidth, cardHeight));
  }

  if (options.assetKind === 'animated-programme') {
    baseNodes.push({
      id: 'programme-page-shadow',
      role: 'page',
      color: '#050505',
      position: [38, -28, 4],
      size: [cardWidth * 0.92, cardHeight * 0.86],
      rotation: [0, 0.16, 0],
    });
  }

  return baseNodes;
}

function spreadNodes(
  blocks: ProgrammeEngineBlock[],
  theme: ProgrammeEngineInput['theme'],
  cardWidth: number,
  cardHeight: number,
): ProgrammeSceneNode[] {
  return blocks.map((block, index) =>
    textProxy(
      `spread-${block.id}`,
      block.title,
      theme.foreground,
      [-cardWidth / 2 + 96, -cardHeight / 2 + 138 + index * 54, 20],
      [cardWidth * 0.58, 28],
    ),
  );
}

function textProxy(
  id: string,
  label: string,
  color: string,
  position: readonly [number, number, number],
  size: readonly [number, number],
): ProgrammeSceneNode {
  return {
    id,
    role: 'text-proxy',
    label,
    color,
    position,
    size,
  };
}

function nodeToMesh(node: ProgrammeSceneNode): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(node.size[0], node.size[1]);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(node.color),
    transparent: node.role === 'text-proxy',
    opacity: node.role === 'text-proxy' ? 0.84 : 1,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = node.id;
  mesh.position.set(...node.position);
  if (node.rotation) {
    mesh.rotation.set(...node.rotation);
  }
  mesh.userData = {
    role: node.role,
    label: node.label,
  };
  return mesh;
}
