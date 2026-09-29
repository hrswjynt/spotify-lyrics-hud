import { writable } from 'svelte/store';
import { InputMode, OverlayIntent, ZOrder } from '../../../core/types.js';

export interface OverlayUIBridgeState {
  inputMode: InputMode;
  zOrder: ZOrder;
  displayId: string;
  visible: boolean;
  opacity: number;
}

export const overlayBridge = writable<OverlayUIBridgeState>({
  inputMode: 'passthrough',
  zOrder: 'overlay',
  displayId: 'primary',
  visible: true,
  opacity: 0.95,
});

// Listener callbacks when UI requests an intent change in the native engine
type IntentChangeCallback = (intent: Partial<OverlayIntent>) => void;
const intentListeners: IntentChangeCallback[] = [];

export function onUIIntentChange(callback: IntentChangeCallback): () => void {
  intentListeners.push(callback);
  return () => {
    const idx = intentListeners.indexOf(callback);
    if (idx !== -1) intentListeners.splice(idx, 1);
  };
}

export function toggleClickThrough(): void {
  overlayBridge.update((s) => {
    const nextMode: InputMode =
      s.inputMode === 'passthrough' ? 'interactive' : 'passthrough';

    for (const listener of intentListeners) {
      listener({
        interaction: {
          pointer: nextMode,
          keyboard: nextMode === 'interactive' ? 'interactive' : 'none',
        },
      });
    }

    return {
      ...s,
      inputMode: nextMode,
    };
  });
}

export function setOverlayOpacity(opacity: number): void {
  overlayBridge.update((s) => {
    for (const listener of intentListeners) {
      listener({ opacity });
    }
    return { ...s, opacity };
  });
}

export function syncWithEngineState(state: {
  inputMode: InputMode;
  zOrder: ZOrder;
  displayId: string;
  visible: boolean;
  opacity: number;
}): void {
  overlayBridge.set({
    inputMode: state.inputMode,
    zOrder: state.zOrder,
    displayId: state.displayId,
    visible: state.visible,
    opacity: state.opacity,
  });
}
