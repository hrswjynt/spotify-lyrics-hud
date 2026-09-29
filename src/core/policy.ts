import {
  FullscreenBehavior,
  FullscreenState,
  InputMode,
  InteractionPolicy,
  KeyboardMode,
} from './types.js';

export interface FullscreenEvaluationParams {
  intentVisible: boolean;
  behavior: FullscreenBehavior;
  fullscreenState: FullscreenState;
  targetDisplayId: string;
}

/**
 * Pure policy function that evaluates whether the overlay should be visible
 * given the user intent, fullscreen state, and target display.
 */
export function evaluateFullscreenVisibility(params: FullscreenEvaluationParams): boolean {
  const { intentVisible, behavior, fullscreenState, targetDisplayId } = params;

  if (!intentVisible) {
    return false;
  }

  if (fullscreenState.state === 'windowed' || fullscreenState.state === 'unknown') {
    return true;
  }

  // At this point, fullscreenState.state === "fullscreen"
  switch (behavior) {
    case 'always-show':
      return true;

    case 'always-hide':
    case 'hide-on-any-fullscreen':
      return false;

    case 'hide-on-exclusive-fullscreen': {
      // If fullscreen is on a specific display, only hide if it matches our overlay display
      if (fullscreenState.displayId && fullscreenState.displayId !== targetDisplayId) {
        return true;
      }
      return false;
    }
  }
}

/**
 * Resolves the effective input mode from interaction policy.
 * Distinguishes pointer input transparency from visual opacity.
 */
export function resolveInteraction(policy: InteractionPolicy): {
  pointer: InputMode;
  keyboard: KeyboardMode;
} {
  return {
    pointer: policy.pointer,
    keyboard: policy.keyboard,
  };
}
