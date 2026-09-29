import {
  ActualWindowState,
  OverlayWindow,
  ResolvedOverlayState,
} from './types.js';

export type ReconciliationActionType =
  | 'create'
  | 'set_display'
  | 'set_geometry'
  | 'set_z_order'
  | 'set_input_mode'
  | 'set_opacity'
  | 'set_visibility';

export interface ReconciliationDiff {
  action: ReconciliationActionType;
  from: any;
  to: any;
}

/**
 * Compares desired state with actual window state and returns required actions.
 */
export function diffState(
  desired: ResolvedOverlayState,
  actual: ActualWindowState
): ReconciliationDiff[] {
  const diffs: ReconciliationDiff[] = [];

  if (!actual.created) {
    diffs.push({ action: 'create', from: false, to: true });
  }

  if (desired.displayId !== actual.displayId) {
    diffs.push({ action: 'set_display', from: actual.displayId, to: desired.displayId });
  }

  const geometryChanged =
    desired.geometry.x !== actual.geometry.x ||
    desired.geometry.y !== actual.geometry.y ||
    desired.geometry.width !== actual.geometry.width ||
    desired.geometry.height !== actual.geometry.height;

  if (geometryChanged) {
    diffs.push({
      action: 'set_geometry',
      from: { ...actual.geometry },
      to: { ...desired.geometry },
    });
  }

  if (desired.zOrder !== actual.zOrder) {
    diffs.push({ action: 'set_z_order', from: actual.zOrder, to: desired.zOrder });
  }

  if (desired.inputMode !== actual.inputMode) {
    diffs.push({ action: 'set_input_mode', from: actual.inputMode, to: desired.inputMode });
  }

  if (Math.abs(desired.opacity - actual.opacity) > 0.001) {
    diffs.push({ action: 'set_opacity', from: actual.opacity, to: desired.opacity });
  }

  if (desired.visible !== actual.visible) {
    diffs.push({ action: 'set_visibility', from: actual.visible, to: desired.visible });
  }

  return diffs;
}

/**
 * Reconciles the native window to match the desired state.
 * Executes native adapter calls only for state properties that actually changed.
 */
export async function reconcileOverlay(
  window: OverlayWindow,
  desired: ResolvedOverlayState
): Promise<ReconciliationDiff[]> {
  const actual = window.getActualState();
  const diffs = diffState(desired, actual);

  if (diffs.length === 0) {
    return [];
  }

  for (const diff of diffs) {
    switch (diff.action) {
      case 'create':
        await window.create();
        break;

      case 'set_display':
        await window.setDisplay(desired.displayId);
        break;

      case 'set_geometry':
        await window.setGeometry(desired.geometry, desired.layerShellConfig);
        break;

      case 'set_z_order':
        await window.setZOrder(desired.zOrder);
        break;

      case 'set_input_mode':
        await window.setInputMode(desired.inputMode);
        break;

      case 'set_opacity':
        await window.setOpacity(desired.opacity);
        break;

      case 'set_visibility':
        await window.setVisibility(desired.visible);
        break;
    }
  }

  return diffs;
}
