/**
 * Unit tests for BoundingBox validation and clamping helpers
 */

import { describe, it, expect } from "vitest";
import {
  isValidBoundingBox,
  clampBoundingBox,
} from "@/src/domain/detection-contract";
import type { BoundingBox } from "@/src/domain/types";

describe("isValidBoundingBox", () => {
  it("returns true for a valid box", () => {
    const box: BoundingBox = { x: 10, y: 20, width: 100, height: 200 };
    expect(isValidBoundingBox(box)).toBe(true);
  });

  it("returns false when x is negative", () => {
    const box: BoundingBox = { x: -1, y: 20, width: 100, height: 200 };
    expect(isValidBoundingBox(box)).toBe(false);
  });

  it("returns false when y is negative", () => {
    const box: BoundingBox = { x: 10, y: -5, width: 100, height: 200 };
    expect(isValidBoundingBox(box)).toBe(false);
  });

  it("returns false when width is zero", () => {
    const box: BoundingBox = { x: 10, y: 20, width: 0, height: 200 };
    expect(isValidBoundingBox(box)).toBe(false);
  });

  it("returns false when height is zero", () => {
    const box: BoundingBox = { x: 10, y: 20, width: 100, height: 0 };
    expect(isValidBoundingBox(box)).toBe(false);
  });

  it("returns false when width is negative", () => {
    const box: BoundingBox = { x: 10, y: 20, width: -10, height: 200 };
    expect(isValidBoundingBox(box)).toBe(false);
  });
});

describe("clampBoundingBox", () => {
  const imageWidth = 640;
  const imageHeight = 480;

  it("returns box unchanged when fully inside image", () => {
    const box: BoundingBox = { x: 10, y: 20, width: 100, height: 100 };
    const result = clampBoundingBox(box, imageWidth, imageHeight);
    expect(result).toEqual(box);
  });

  it("clamps x to 0 when negative", () => {
    const box: BoundingBox = { x: -10, y: 20, width: 100, height: 100 };
    const result = clampBoundingBox(box, imageWidth, imageHeight);
    expect(result.x).toBe(0);
  });

  it("clamps y to 0 when negative", () => {
    const box: BoundingBox = { x: 10, y: -20, width: 100, height: 100 };
    const result = clampBoundingBox(box, imageWidth, imageHeight);
    expect(result.y).toBe(0);
  });

  it("clamps width when box extends past right edge", () => {
    const box: BoundingBox = { x: 600, y: 20, width: 100, height: 100 };
    const result = clampBoundingBox(box, imageWidth, imageHeight);
    expect(result.x).toBe(600);
    expect(result.width).toBe(40); // 640 - 600
  });

  it("clamps height when box extends past bottom edge", () => {
    const box: BoundingBox = { x: 10, y: 400, width: 100, height: 100 };
    const result = clampBoundingBox(box, imageWidth, imageHeight);
    expect(result.y).toBe(400);
    expect(result.height).toBe(80); // 480 - 400
  });

  it("clamps x and width when starting before and extending past image", () => {
    const box: BoundingBox = { x: -50, y: 20, width: 800, height: 100 };
    const result = clampBoundingBox(box, imageWidth, imageHeight);
    expect(result.x).toBe(0);
    expect(result.width).toBe(640);
  });
});
