/**
 * Unit tests for pipeCandidateFilter helpers.
 * Updated for Python-style scoring API.
 * Covers: aspect ratio, extent, size validation, scoring, and best selection.
 */

import { describe, it, expect } from "vitest";
import {
  computeAspectRatio,
  computeExtent,
  computeBBoxArea,
  isShapeValid,
  isSizeValid,
  calculateAreaScore,
  calculateAspectScore,
  scoreCandidate,
  selectBestCandidate,
  selectLargestCandidate,
  type CandidateMetrics,
} from "@/src/opencv/pipeCandidateFilter";
import { DEFAULT_PIPE_DETECTION_RULES } from "@/src/opencv/pipeDetectionRules";

const FRAME_AREA = 1000 * 1000; // 1 megapixel frame

function makeCandidate(
  x: number,
  y: number,
  width: number,
  height: number,
  contourArea: number,
  overlapRatio: number = 1.0
): CandidateMetrics {
  return {
    boundingBox: { x, y, width, height },
    contourArea,
    overlapRatio,
  };
}

describe("computeAspectRatio", () => {
  it("returns height/width", () => {
    expect(computeAspectRatio({ x: 0, y: 0, width: 50, height: 100 })).toBe(2);
  });

  it("returns 0 when width is 0", () => {
    expect(computeAspectRatio({ x: 0, y: 0, width: 0, height: 100 })).toBe(0);
  });
});

describe("computeExtent", () => {
  it("returns contourArea / bboxArea", () => {
    // bbox = 100x100 = 10000, contour = 8000 → extent = 0.8
    expect(computeExtent(8000, { x: 0, y: 0, width: 100, height: 100 })).toBeCloseTo(0.8);
  });

  it("returns 0 when bboxArea is 0", () => {
    expect(computeExtent(100, { x: 0, y: 0, width: 0, height: 0 })).toBe(0);
  });
});

describe("computeBBoxArea", () => {
  it("returns width * height", () => {
    expect(computeBBoxArea({ x: 0, y: 0, width: 40, height: 80 })).toBe(3200);
  });
});

describe("isShapeValid", () => {
  const rules = DEFAULT_PIPE_DETECTION_RULES;

  it("rejects candidate with aspect ratio <= minAspectRatio (0.3)", () => {
    // 100x30 => aspect = 0.3 (equal to min, should reject since < is exclusive)
    const c = makeCandidate(0, 0, 100, 30, 2700);
    expect(isShapeValid(c, rules)).toBe(false);
  });

  it("rejects candidate with aspect ratio >= maxAspectRatio (10)", () => {
    // 10x100 => aspect = 10 (equal to max, should reject)
    const c = makeCandidate(0, 0, 10, 100, 900);
    expect(isShapeValid(c, rules)).toBe(false);
  });

  it("accepts candidate with aspect ratio within (0.3, 10)", () => {
    // 100x200 => aspect = 2.0
    const c = makeCandidate(0, 0, 100, 200, 18000);
    expect(isShapeValid(c, rules)).toBe(true);
  });

  it("rejects candidate with low extent", () => {
    // extent = contourArea / bboxArea = 2000 / 20000 = 0.1 < 0.3
    const c = makeCandidate(0, 0, 100, 200, 2000);
    expect(isShapeValid(c, rules)).toBe(false);
  });

  it("accepts candidate with extent >= minExtent", () => {
    // extent = 6000 / 20000 = 0.3
    const c = makeCandidate(0, 0, 100, 200, 6000);
    expect(isShapeValid(c, rules)).toBe(true);
  });
});

describe("isSizeValid", () => {
  const rules = DEFAULT_PIPE_DETECTION_RULES;

  it("rejects candidate with area < minAreaRatio", () => {
    // bbox = 10x10 = 100, ratio = 0.0001 < 0.0005
    const c = makeCandidate(0, 0, 10, 10, 90);
    expect(isSizeValid(c, FRAME_AREA, rules)).toBe(false);
  });

  it("rejects candidate with area > maxAreaRatio (80%)", () => {
    // bbox = 1000x900 = 900000, ratio = 0.9 > 0.8
    const c = makeCandidate(0, 0, 1000, 900, 800000);
    expect(isSizeValid(c, FRAME_AREA, rules)).toBe(false);
  });

  it("accepts candidate with valid size", () => {
    // bbox = 200x200 = 40000, ratio = 0.04 (within 0.0005 - 0.8)
    const c = makeCandidate(0, 0, 200, 200, 35000);
    expect(isSizeValid(c, FRAME_AREA, rules)).toBe(true);
  });
});

describe("calculateAreaScore", () => {
  it("returns 1.0 for optimal area range (1-40%)", () => {
    expect(calculateAreaScore(0.01)).toBe(1.0);
    expect(calculateAreaScore(0.2)).toBe(1.0);
    expect(calculateAreaScore(0.4)).toBe(1.0);
  });

  it("scales down for areas < 1%", () => {
    expect(calculateAreaScore(0.005)).toBeCloseTo(0.5);
    expect(calculateAreaScore(0.001)).toBeCloseTo(0.1);
  });

  it("scales down for areas > 40%", () => {
    expect(calculateAreaScore(0.6)).toBeCloseTo(0.5);
    expect(calculateAreaScore(0.8)).toBeCloseTo(0);
  });
});

describe("calculateAspectScore", () => {
  it("returns 1.0 for vertical pipes (1.5-5)", () => {
    expect(calculateAspectScore(2.0)).toBe(1.0);
    expect(calculateAspectScore(3.5)).toBe(1.0);
  });

  it("returns 0.9 for near-square (0.8-1.25) - close-up", () => {
    expect(calculateAspectScore(1.0)).toBe(0.9);
    expect(calculateAspectScore(1.1)).toBe(0.9);
  });

  it("returns 0.7 for other ratios (0.5-1.5)", () => {
    expect(calculateAspectScore(1.4)).toBe(0.7);
  });

  it("returns 0.8 for very tall pipes (> 5)", () => {
    expect(calculateAspectScore(6)).toBe(0.8);
  });

  it("returns 0.5 for very wide shapes (< 0.5)", () => {
    expect(calculateAspectScore(0.3)).toBe(0.5);
  });
});

describe("scoreCandidate", () => {
  const rules = DEFAULT_PIPE_DETECTION_RULES;

  it("returns null for invalid size", () => {
    const c = makeCandidate(0, 0, 10, 10, 90); // too small
    expect(scoreCandidate(c, FRAME_AREA, rules)).toBeNull();
  });

  it("returns null for invalid shape", () => {
    // Large enough but low extent
    const c = makeCandidate(0, 0, 500, 500, 25000); // extent = 0.1
    expect(scoreCandidate(c, FRAME_AREA, rules)).toBeNull();
  });

  it("calculates weighted score for valid candidate", () => {
    // 200x400 = 80000 (8% of frame), aspect = 2.0
    const c = makeCandidate(0, 0, 200, 400, 70000, 0.8);
    const scored = scoreCandidate(c, FRAME_AREA, rules);

    expect(scored).not.toBeNull();
    expect(scored!.overlapScore).toBe(0.8);
    expect(scored!.areaScore).toBe(1.0); // 8% is optimal
    expect(scored!.aspectScore).toBe(1.0); // 2.0 is optimal
    // score = 0.4 * 0.8 + 0.4 * 1.0 + 0.2 * 1.0 = 0.32 + 0.4 + 0.2 = 0.92
    expect(scored!.score).toBeCloseTo(0.92);
  });
});

describe("selectBestCandidate", () => {
  const rules = DEFAULT_PIPE_DETECTION_RULES;

  it("returns undefined when no candidates", () => {
    expect(selectBestCandidate([], FRAME_AREA, rules)).toBeUndefined();
  });

  it("returns undefined when all candidates are invalid", () => {
    const invalid = makeCandidate(0, 0, 10, 10, 90); // too small
    expect(selectBestCandidate([invalid], FRAME_AREA, rules)).toBeUndefined();
  });

  it("returns the single valid candidate", () => {
    const valid = makeCandidate(0, 0, 200, 400, 70000, 1.0);
    expect(selectBestCandidate([valid], FRAME_AREA, rules)).toBe(valid);
  });

  it("returns candidate with highest score", () => {
    // Lower overlap but still valid
    const lowOverlap = makeCandidate(0, 0, 200, 400, 70000, 0.5);
    // Higher overlap → higher score
    const highOverlap = makeCandidate(0, 0, 200, 400, 70000, 1.0);

    const result = selectBestCandidate([lowOverlap, highOverlap], FRAME_AREA, rules);
    expect(result).toBe(highOverlap);
  });
});

describe("selectLargestCandidate", () => {
  const rules = DEFAULT_PIPE_DETECTION_RULES;

  it("returns undefined when no candidates", () => {
    expect(selectLargestCandidate([], FRAME_AREA, rules)).toBeUndefined();
  });

  it("returns undefined when all candidates are invalid", () => {
    const invalid = makeCandidate(0, 0, 10, 10, 90); // too small
    expect(selectLargestCandidate([invalid], FRAME_AREA, rules)).toBeUndefined();
  });

  it("returns the single valid candidate", () => {
    const valid = makeCandidate(0, 0, 200, 400, 70000);
    expect(selectLargestCandidate([valid], FRAME_AREA, rules)).toBe(valid);
  });

  it("returns the largest by bbox area among multiple valid candidates", () => {
    const small = makeCandidate(0, 0, 200, 400, 70000); // area = 80000
    const large = makeCandidate(0, 0, 300, 500, 130000); // area = 150000
    const result = selectLargestCandidate([small, large], FRAME_AREA, rules);
    expect(result).toBe(large);
  });

  it("ignores invalid candidates even if they have larger bbox area", () => {
    // Invalid due to low extent (contourArea too small vs bbox)
    const bigInvalid = makeCandidate(0, 0, 400, 500, 20000); // extent = 0.1
    const smallValid = makeCandidate(0, 0, 200, 400, 70000); // extent = 0.875
    const result = selectLargestCandidate([bigInvalid, smallValid], FRAME_AREA, rules);
    expect(result).toBe(smallValid);
  });
});
