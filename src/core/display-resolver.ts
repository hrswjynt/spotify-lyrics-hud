import { Display, DisplaySelector, Point } from './types.js';

export interface DisplayResolutionContext {
  displays: Display[];
  primaryDisplay: Display;
  activeDisplay?: Display;
  cursorPosition?: Point;
  targetWindowDisplayId?: string;
}

/**
 * Resolves a semantic DisplaySelector into a concrete Display.
 * Handles fallbacks gracefully if a selected display is disconnected or hot-unplugged.
 */
export function resolveDisplay(
  selector: DisplaySelector,
  context: DisplayResolutionContext
): Display {
  const { displays, primaryDisplay, activeDisplay, cursorPosition, targetWindowDisplayId } = context;

  if (displays.length === 0) {
    throw new Error('No displays available in display resolution context.');
  }

  switch (selector.type) {
    case 'primary':
      return primaryDisplay || displays[0];

    case 'active':
      return activeDisplay || primaryDisplay || displays[0];

    case 'id': {
      const match = displays.find((d) => d.id === selector.id);
      if (match) {
        return match;
      }
      // Fallback if monitor was unplugged
      return primaryDisplay || displays[0];
    }

    case 'cursor': {
      if (cursorPosition) {
        const containing = displays.find(
          (d) =>
            cursorPosition.x >= d.bounds.x &&
            cursorPosition.x < d.bounds.x + d.bounds.width &&
            cursorPosition.y >= d.bounds.y &&
            cursorPosition.y < d.bounds.y + d.bounds.height
        );
        if (containing) {
          return containing;
        }
      }
      return activeDisplay || primaryDisplay || displays[0];
    }

    case 'target-window': {
      if (targetWindowDisplayId) {
        const match = displays.find((d) => d.id === targetWindowDisplayId);
        if (match) {
          return match;
        }
      }
      return activeDisplay || primaryDisplay || displays[0];
    }
  }
}
