import { Anchor, Display, Placement, Rect, ResolvedOverlayState } from './types.js';

export interface LayoutResult {
  geometry: Rect;
  layerShellConfig: NonNullable<ResolvedOverlayState['layerShellConfig']>;
}

/**
 * Calculates absolute desktop geometry and native layer-shell margins
 * for a semantic placement on a given display.
 *
 * Correctly accounts for:
 * - Multi-monitor coordinate offsets (including negative origins)
 * - Work area vs display bounds
 * - Anchor semantic alignment
 * - Positive and negative directional offsets
 */
export function calculateLayout(placement: Placement, display: Display): LayoutResult {
  const targetRect: Rect =
    placement.relativeTo === 'bounds' ? display.bounds : display.workArea;

  const { anchor, offset, size } = placement;

  let x = targetRect.x;
  let y = targetRect.y;

  // Layer shell anchor flags and margins
  let anchorTop = false;
  let anchorBottom = false;
  let anchorLeft = false;
  let anchorRight = false;

  let marginTop = 0;
  let marginBottom = 0;
  let marginLeft = 0;
  let marginRight = 0;

  switch (anchor) {
    case 'top-left':
      x = targetRect.x + offset.x;
      y = targetRect.y + offset.y;
      anchorTop = true;
      anchorLeft = true;
      marginTop = offset.y;
      marginLeft = offset.x;
      break;

    case 'top-center':
      x = targetRect.x + Math.round((targetRect.width - size.width) / 2) + offset.x;
      y = targetRect.y + offset.y;
      anchorTop = true;
      marginTop = offset.y;
      marginLeft = offset.x;
      break;

    case 'top-right':
      x = targetRect.x + (targetRect.width - size.width) + offset.x;
      y = targetRect.y + offset.y;
      anchorTop = true;
      anchorRight = true;
      marginTop = offset.y;
      marginRight = -offset.x;
      break;

    case 'center-left':
      x = targetRect.x + offset.x;
      y = targetRect.y + Math.round((targetRect.height - size.height) / 2) + offset.y;
      anchorLeft = true;
      marginLeft = offset.x;
      marginTop = offset.y;
      break;

    case 'center':
      x = targetRect.x + Math.round((targetRect.width - size.width) / 2) + offset.x;
      y = targetRect.y + Math.round((targetRect.height - size.height) / 2) + offset.y;
      marginLeft = offset.x;
      marginTop = offset.y;
      break;

    case 'center-right':
      x = targetRect.x + (targetRect.width - size.width) + offset.x;
      y = targetRect.y + Math.round((targetRect.height - size.height) / 2) + offset.y;
      anchorRight = true;
      marginRight = -offset.x;
      marginTop = offset.y;
      break;

    case 'bottom-left':
      x = targetRect.x + offset.x;
      y = targetRect.y + (targetRect.height - size.height) + offset.y;
      anchorBottom = true;
      anchorLeft = true;
      marginBottom = -offset.y;
      marginLeft = offset.x;
      break;

    case 'bottom-center':
      x = targetRect.x + Math.round((targetRect.width - size.width) / 2) + offset.x;
      y = targetRect.y + (targetRect.height - size.height) + offset.y;
      anchorBottom = true;
      marginBottom = -offset.y;
      marginLeft = offset.x;
      break;

    case 'bottom-right':
      x = targetRect.x + (targetRect.width - size.width) + offset.x;
      y = targetRect.y + (targetRect.height - size.height) + offset.y;
      anchorBottom = true;
      anchorRight = true;
      marginBottom = -offset.y;
      marginRight = -offset.x;
      break;
  }

  return {
    geometry: {
      x,
      y,
      width: size.width,
      height: size.height,
    },
    layerShellConfig: {
      anchorTop,
      anchorBottom,
      anchorLeft,
      anchorRight,
      marginTop: Math.max(0, marginTop),
      marginBottom: Math.max(0, marginBottom),
      marginLeft: Math.max(0, marginLeft),
      marginRight: Math.max(0, marginRight),
    },
  };
}
