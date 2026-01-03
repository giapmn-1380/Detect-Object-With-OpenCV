/**
 * Unit tests for pipe detection filtering logic (legacy tests).
 * NOTE: New filtering tests are in pipeCandidateFilter.test.ts.
 * These tests remain for backward-compatible validation of the old constants.
 */

import { describe, it, expect } from "vitest";
import { selectLargestCandidate, type CandidateMetrics } from "@/src/opencv/pipeCandidateFilter";
import { DEFAULT_PIPE_DETECTION_RULES } from "@/src/opencv/pipeDetectionRules";

// Legacy constants (kept for backward-compatible tests).
// New code should use DEFAULT_PIPE_DETECTION_RULES from pipeDetectionRules.ts.
const LEGACY_MIN_AREA = 500;
const LEGACY_MIN_ASPECT_RATIO = 1.5;

interface MockContour {
  area: number;
  width: number;
  height: number;
}

/**
 * Legacy filter function for backward-compatible tests.
 */
function shouldIncludeContour(contour: MockContour): boolean {
  if (contour.area < LEGACY_MIN_AREA) return false;
  const aspectRatio = contour.height / contour.width;
  return aspectRatio >= LEGACY_MIN_ASPECT_RATIO;
}

// ---------- US3 Tests: no_pipe_detected when empty ----------

describe("DetectionResult status", () => {
  const FRAME_AREA = 1000 * 1000; // 1 megapixel
  const rules = DEFAULT_PIPE_DETECTION_RULES;

  it("returns undefined (no_pipe_detected) when candidates list is empty", () => {
    const result = selectLargestCandidate([], FRAME_AREA, rules);
    expect(result).toBeUndefined();
  });

  it("returns undefined (no_pipe_detected) when all candidates are filtered out", () => {
    // Too small candidate
    const tiny: CandidateMetrics = {
      boundingBox: { x: 0, y: 0, width: 10, height: 15 },
      contourArea: 140,
      hullArea: 150,
    };
    const result = selectLargestCandidate([tiny], FRAME_AREA, rules);
    expect(result).toBeUndefined();
  });
});

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
