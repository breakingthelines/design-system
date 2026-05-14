import type { ImageFitMode, ImageFocalArea, ImagePresentation } from '#/types/content';

type ObjectFit = 'cover' | 'contain';

export interface ResolvedImagePresentation {
  fitMode: ImageFitMode;
  objectFit: ObjectFit;
  objectPosition: string;
  transform?: string;
  transformOrigin: string;
}

interface Size {
  width: number;
  height: number;
}

export interface ContainedImageFrame {
  width: number;
  height: number;
  left: number;
  top: number;
  edgeFadeAxis?: 'x' | 'y';
}

const DEFAULT_FIT_MODE: ImageFitMode = 'smart-cover';
const DEFAULT_OBJECT_POSITION = '50% 50%';
const MAX_ZOOM = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeUnit(value: number): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  return clamp(value > 1 ? value / 100 : value, 0, 1);
}

function normalizeZoom(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const zoom = clamp(value, 1, MAX_ZOOM);
  return zoom === 1 ? undefined : zoom;
}

export function focalAreaToObjectPosition(focalArea: ImageFocalArea | undefined): string {
  if (!focalArea) return DEFAULT_OBJECT_POSITION;

  const x = normalizeUnit(focalArea.x);
  const y = normalizeUnit(focalArea.y);
  const width = normalizeUnit(focalArea.width);
  const height = normalizeUnit(focalArea.height);

  if (x === undefined || y === undefined || width === undefined || height === undefined) {
    return DEFAULT_OBJECT_POSITION;
  }

  const centerX = clamp(x + width / 2, 0, 1);
  const centerY = clamp(y + height / 2, 0, 1);

  return `${Math.round(centerX * 10000) / 100}% ${Math.round(centerY * 10000) / 100}%`;
}

function parsePositionPart(value: string | undefined): number {
  if (!value) return 0.5;
  const trimmed = value.trim().toLowerCase();
  switch (trimmed) {
    case 'left':
    case 'top':
      return 0;
    case 'right':
    case 'bottom':
      return 1;
    case 'center':
      return 0.5;
    default: {
      const parsed = Number.parseFloat(trimmed);
      if (!Number.isFinite(parsed)) return 0.5;
      return clamp(trimmed.endsWith('%') ? parsed / 100 : parsed, 0, 1);
    }
  }
}

function parseObjectPosition(objectPosition: string): { x: number; y: number } {
  const [x, y] = objectPosition.trim().split(/\s+/);
  return {
    x: parsePositionPart(x),
    y: parsePositionPart(y ?? x),
  };
}

export function resolveContainedImageFrame(
  container: Size,
  image: Size,
  objectPosition: string = DEFAULT_OBJECT_POSITION
): ContainedImageFrame | undefined {
  if (
    container.width <= 0 ||
    container.height <= 0 ||
    image.width <= 0 ||
    image.height <= 0 ||
    !Number.isFinite(container.width) ||
    !Number.isFinite(container.height) ||
    !Number.isFinite(image.width) ||
    !Number.isFinite(image.height)
  ) {
    return undefined;
  }

  const position = parseObjectPosition(objectPosition);
  const imageAspect = image.width / image.height;
  const containerAspect = container.width / container.height;

  if (imageAspect >= containerAspect) {
    const height = container.width / imageAspect;
    return {
      width: container.width,
      height,
      left: 0,
      top: (container.height - height) * position.y,
      edgeFadeAxis: height < container.height - 0.5 ? 'y' : undefined,
    };
  }

  const width = container.height * imageAspect;
  return {
    width,
    height: container.height,
    left: (container.width - width) * position.x,
    top: 0,
    edgeFadeAxis: width < container.width - 0.5 ? 'x' : undefined,
  };
}

export function resolveImagePresentation(
  presentation: ImagePresentation | undefined,
  options: { containForeground?: boolean } = {}
): ResolvedImagePresentation | undefined {
  if (!presentation) return undefined;

  const fitMode = presentation.fitMode ?? DEFAULT_FIT_MODE;
  const objectPosition = focalAreaToObjectPosition(presentation.focalArea);
  const zoom = normalizeZoom(presentation.zoom);

  return {
    fitMode,
    objectFit: options.containForeground || fitMode === 'contain-bleed' ? 'contain' : 'cover',
    objectPosition,
    transform: zoom ? `scale(${zoom})` : undefined,
    transformOrigin: objectPosition,
  };
}

export function isContainBleedPresentation(presentation: ImagePresentation | undefined): boolean {
  return presentation?.fitMode === 'contain-bleed';
}

export type { ImageFitMode, ImageFocalArea, ImagePresentation };
