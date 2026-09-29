import {
  Display,
  FullscreenState,
  OverlayIntent,
  PlatformCapabilities,
  ResolvedOverlayState,
} from './types.js';

export interface OverlayDiagnosticReport {
  platform: string;
  backend: string;
  compositor?: string;
  displayId: string;
  displayName: string;
  displayScale: number;
  anchor: string;
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  inputMode: string;
  zOrder: string;
  visible: boolean;
  fullscreenState: FullscreenState;
  capabilities: PlatformCapabilities;
}

export function formatDiagnosticLog(report: OverlayDiagnosticReport): string {
  return [
    `Platform: ${report.platform}`,
    `Backend: ${report.backend}`,
    report.compositor ? `Compositor: ${report.compositor}` : null,
    `Display: ${report.displayName} (${report.displayId})`,
    `Scale: ${report.displayScale}`,
    `Overlay: ${report.anchor} (${report.geometry.width}x${report.geometry.height} at ${report.geometry.x},${report.geometry.y})`,
    `Input: ${report.inputMode}`,
    `Z-Order: ${report.zOrder}`,
    `Visible: ${report.visible}`,
    `Fullscreen: ${report.fullscreenState.state}`,
    `Capabilities: [layerShell=${report.capabilities.layerShell}, clickThrough=${report.capabilities.clickThrough}, fullscreenDetection=${report.capabilities.fullscreenDetection}]`,
  ]
    .filter(Boolean)
    .join('\n');
}
