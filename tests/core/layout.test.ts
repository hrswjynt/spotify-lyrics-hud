import { describe, expect, it } from 'vitest';
import { calculateLayout } from '../../src/core/layout.js';
import { Display, Placement } from '../../src/core/types.js';

describe('Layout Engine - Anchored Positioning', () => {
  const primaryDisplay1080p: Display = {
    id: 'display-1',
    name: 'Primary-1080p',
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 40, width: 1920, height: 1040 }, // Taskbar 40px at top
    scaleFactor: 1.0,
    primary: true,
  };

  const secondaryDisplayLeftNegative: Display = {
    id: 'display-2',
    name: 'Secondary-Left',
    bounds: { x: -1920, y: 0, width: 1920, height: 1080 },
    workArea: { x: -1920, y: 0, width: 1920, height: 1080 },
    scaleFactor: 1.0,
    primary: false,
  };

  const display4K: Display = {
    id: 'display-3',
    name: '4K-Monitor',
    bounds: { x: 1920, y: 0, width: 3840, height: 2160 },
    workArea: { x: 1920, y: 0, width: 3840, height: 2112 }, // 48px panel at bottom
    scaleFactor: 1.5,
    primary: false,
  };

  describe('Standard 1080p Display Anchors (Work Area)', () => {
    it('calculates bottom-center placement with negative vertical offset', () => {
      const placement: Placement = {
        anchor: 'bottom-center',
        offset: { x: 0, y: -48 },
        size: { width: 700, height: 100 },
        relativeTo: 'workArea',
      };

      const result = calculateLayout(placement, primaryDisplay1080p);

      // workArea is y: 40, height: 1040 (bottom is 40 + 1040 = 1080)
      // x = 0 + (1920 - 700)/2 = 610
      // y = 40 + (1040 - 100) + (-48) = 40 + 940 - 48 = 932
      expect(result.geometry).toEqual({
        x: 610,
        y: 932,
        width: 700,
        height: 100,
      });

      // Layer-shell config
      expect(result.layerShellConfig.anchorBottom).toBe(true);
      expect(result.layerShellConfig.anchorTop).toBe(false);
      expect(result.layerShellConfig.marginBottom).toBe(48);
    });

    it('calculates top-left placement with positive offset', () => {
      const placement: Placement = {
        anchor: 'top-left',
        offset: { x: 20, y: 15 },
        size: { width: 300, height: 80 },
        relativeTo: 'workArea',
      };

      const result = calculateLayout(placement, primaryDisplay1080p);

      // x = 0 + 20 = 20
      // y = 40 + 15 = 55
      expect(result.geometry).toEqual({
        x: 20,
        y: 55,
        width: 300,
        height: 80,
      });
      expect(result.layerShellConfig.anchorTop).toBe(true);
      expect(result.layerShellConfig.anchorLeft).toBe(true);
      expect(result.layerShellConfig.marginTop).toBe(15);
      expect(result.layerShellConfig.marginLeft).toBe(20);
    });

    it('calculates top-center placement', () => {
      const placement: Placement = {
        anchor: 'top-center',
        offset: { x: 0, y: 10 },
        size: { width: 500, height: 60 },
        relativeTo: 'workArea',
      };

      const result = calculateLayout(placement, primaryDisplay1080p);
      expect(result.geometry).toEqual({
        x: (1920 - 500) / 2, // 710
        y: 40 + 10, // 50
        width: 500,
        height: 60,
      });
    });

    it('calculates top-right placement', () => {
      const placement: Placement = {
        anchor: 'top-right',
        offset: { x: -20, y: 10 },
        size: { width: 400, height: 70 },
        relativeTo: 'workArea',
      };

      const result = calculateLayout(placement, primaryDisplay1080p);
      expect(result.geometry).toEqual({
        x: 1920 - 400 - 20, // 1500
        y: 40 + 10, // 50
        width: 400,
        height: 70,
      });
      expect(result.layerShellConfig.anchorRight).toBe(true);
      expect(result.layerShellConfig.marginRight).toBe(20);
    });

    it('calculates center placement', () => {
      const placement: Placement = {
        anchor: 'center',
        offset: { x: 0, y: 0 },
        size: { width: 600, height: 200 },
        relativeTo: 'workArea',
      };

      const result = calculateLayout(placement, primaryDisplay1080p);
      expect(result.geometry).toEqual({
        x: (1920 - 600) / 2, // 660
        y: 40 + (1040 - 200) / 2, // 460
        width: 600,
        height: 200,
      });
    });

    it('calculates bottom-left placement', () => {
      const placement: Placement = {
        anchor: 'bottom-left',
        offset: { x: 30, y: -20 },
        size: { width: 350, height: 90 },
        relativeTo: 'workArea',
      };

      const result = calculateLayout(placement, primaryDisplay1080p);
      expect(result.geometry).toEqual({
        x: 30,
        y: 40 + 1040 - 90 - 20, // 990
        width: 350,
        height: 90,
      });
    });

    it('calculates bottom-right placement', () => {
      const placement: Placement = {
        anchor: 'bottom-right',
        offset: { x: -15, y: -15 },
        size: { width: 400, height: 120 },
        relativeTo: 'workArea',
      };

      const result = calculateLayout(placement, primaryDisplay1080p);
      expect(result.geometry).toEqual({
        x: 1920 - 400 - 15, // 1505
        y: 40 + 1040 - 120 - 15, // 945
        width: 400,
        height: 120,
      });
    });
  });

  describe('Negative Monitor Coordinates (Multi-Monitor Setup)', () => {
    it('positions correctly on a monitor positioned to the left (negative X coordinates)', () => {
      const placement: Placement = {
        anchor: 'bottom-center',
        offset: { x: 0, y: -50 },
        size: { width: 800, height: 120 },
        relativeTo: 'workArea',
      };

      const result = calculateLayout(placement, secondaryDisplayLeftNegative);

      // targetRect.x = -1920
      // x = -1920 + (1920 - 800)/2 = -1920 + 560 = -1360
      // y = 0 + (1080 - 120) - 50 = 910
      expect(result.geometry).toEqual({
        x: -1360,
        y: 910,
        width: 800,
        height: 120,
      });
    });

    it('positions correctly on top-left of negative coordinate monitor', () => {
      const placement: Placement = {
        anchor: 'top-left',
        offset: { x: 50, y: 50 },
        size: { width: 300, height: 100 },
        relativeTo: 'workArea',
      };

      const result = calculateLayout(placement, secondaryDisplayLeftNegative);
      expect(result.geometry).toEqual({
        x: -1920 + 50, // -1870
        y: 50,
        width: 300,
        height: 100,
      });
    });
  });

  describe('4K Display & Full Bounds Placement', () => {
    it('positions relative to raw display bounds ignoring workArea when requested', () => {
      const placement: Placement = {
        anchor: 'bottom-center',
        offset: { x: 0, y: 0 },
        size: { width: 1200, height: 150 },
        relativeTo: 'bounds',
      };

      const result = calculateLayout(placement, display4K);

      // bounds: x=1920, y=0, w=3840, h=2160
      // x = 1920 + (3840 - 1200)/2 = 1920 + 1320 = 3240
      // y = 0 + (2160 - 150) = 2010
      expect(result.geometry).toEqual({
        x: 3240,
        y: 2010,
        width: 1200,
        height: 150,
      });
    });
  });
});
