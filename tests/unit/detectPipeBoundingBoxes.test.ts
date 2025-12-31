/**
 * Unit tests for pipe detection filtering logic
 * Tests the filtering by area and aspect ratio (without full OpenCV)
 */

import { describe, it, expect } from "vitest";

// Constants mirrored from detectPipeBoundingBoxes.ts
const MIN_AREA = 500;
const MIN_ASPECT_RATIO = 1.5;

interface MockContour {
  area: number;
  width: number;
  height: number;
}

/**
 * Filter function extracted from detection logic for testability
 */
function shouldIncludeContour(contour: MockContour): boolean {
  if (contour.area < MIN_AREA) return false;
  const aspectRatio = contour.height / contour.width;
  return aspectRatio >= MIN_ASPECT_RATIO;
}

describe("Contour filtering logic", () => {
  describe("Area threshold", () => {
    it("rejects contour below minimum area", () => {
      const contour: MockContour = { area: 400, width: 20, height: 40 };
      expect(shouldIncludeContour(contour)).toBe(false);
    });

    it("accepts contour at minimum area with valid aspect ratio", () => {
      const contour: MockContour = { area: 500, width: 10, height: 50 };
      expect(shouldIncludeContour(contour)).toBe(true);
    });

    it("accepts contour above minimum area with valid aspect ratio", () => {
      const contour: MockContour = { area: 2000, width: 40, height: 80 };
      expect(shouldIncludeContour(contour)).toBe(true);
    });
  });

  describe("Aspect ratio threshold", () => {
    it("rejects horizontal contour (height < width)", () => {
      const contour: MockContour = { area: 1000, width: 100, height: 50 };
      expect(shouldIncludeContour(contour)).toBe(false);
    });

    it("rejects square contour (aspect ratio 1.0)", () => {
      const contour: MockContour = { area: 1000, width: 50, height: 50 };
      expect(shouldIncludeContour(contour)).toBe(false);
    });

    it("rejects contour just below threshold (aspect ratio 1.4)", () => {
      const contour: MockContour = { area: 1000, width: 50, height: 70 };
      expect(shouldIncludeContour(contour)).toBe(false);
    });

    it("accepts contour at threshold (aspect ratio 1.5)", () => {
      const contour: MockContour = { area: 1000, width: 40, height: 60 };
      expect(shouldIncludeContour(contour)).toBe(true);
    });

    it("accepts tall vertical contour (aspect ratio 3.0)", () => {
      const contour: MockContour = { area: 1500, width: 25, height: 75 };
      expect(shouldIncludeContour(contour)).toBe(true);
    });
  });

  describe("Combined filtering", () => {
    it("rejects small vertical contour", () => {
      // Has good aspect ratio but too small
      const contour: MockContour = { area: 200, width: 5, height: 40 };
      expect(shouldIncludeContour(contour)).toBe(false);
    });

    it("rejects large horizontal contour", () => {
      // Has enough area but wrong orientation
      const contour: MockContour = { area: 5000, width: 100, height: 50 };
      expect(shouldIncludeContour(contour)).toBe(false);
    });

    it("accepts large vertical contour", () => {
      const contour: MockContour = { area: 10000, width: 50, height: 200 };
      expect(shouldIncludeContour(contour)).toBe(true);
    });
  });
});
