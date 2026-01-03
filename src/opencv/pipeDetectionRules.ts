/**
 * Detection rules/thresholds for pipe bounding-box detection.
 * Based on Python example_python.md implementation.
 *
 * Supports both color-based (HSV) and edge-based detection.
 */

export interface PipeDetectionRules {
  // ─────────────────────────────────────────────────────────
  // HSV Color Detection (Orange pipes)
  // ─────────────────────────────────────────────────────────
  /** Lower HSV bound for orange color [H, S, V]. */
  orangeHsvLow: readonly [number, number, number];
  /** Upper HSV bound for orange color [H, S, V]. */
  orangeHsvHigh: readonly [number, number, number];

  // ─────────────────────────────────────────────────────────
  // Edge Detection
  // ─────────────────────────────────────────────────────────
  /** Gaussian blur kernel size (must be odd). */
  blurKernelSize: number;
  /** Canny edge detector lower threshold. */
  cannyLow: number;
  /** Canny edge detector upper threshold. */
  cannyHigh: number;
  /** Edge density threshold to switch to color mask directly. */
  maxEdgeDensity: number;

  // ─────────────────────────────────────────────────────────
  // Contour Filtering
  // ─────────────────────────────────────────────────────────
  /** Minimum aspect ratio (H/W) for pipe shape. */
  minAspectRatio: number;
  /** Maximum aspect ratio (H/W) for pipe shape. */
  maxAspectRatio: number;
  /** Minimum extent (area / bounding_rect_area). */
  minExtent: number;
  /** Minimum overlap ratio with color mask. */
  minOverlapRatio: number;

  // ─────────────────────────────────────────────────────────
  // Size Filtering
  // ─────────────────────────────────────────────────────────
  /** Minimum area ratio of bbox relative to frame. */
  minAreaRatio: number;
  /** Maximum area ratio of bbox relative to frame. */
  maxAreaRatio: number;

  // ─────────────────────────────────────────────────────────
  // Morphology kernel sizes
  // ─────────────────────────────────────────────────────────
  /** Kernel size for edge dilation. */
  edgeDilationKernel: number;
  /** Kernel size for color mask morphology. */
  colorMorphKernel: number;

  // ─────────────────────────────────────────────────────────
  // Scoring weights (must sum to 1.0)
  // ─────────────────────────────────────────────────────────
  /** Weight for color overlap in scoring. */
  overlapWeight: number;
  /** Weight for area in scoring. */
  areaWeight: number;
  /** Weight for aspect ratio in scoring. */
  aspectWeight: number;
}

/** Default rules based on Python implementation. */
export const DEFAULT_PIPE_DETECTION_RULES: Readonly<PipeDetectionRules> = {
  // HSV for orange pipes (H: 5-25, S: 80-255, V: 80-255)
  orangeHsvLow: [5, 80, 80],
  orangeHsvHigh: [25, 255, 255],

  // Edge detection
  blurKernelSize: 5,
  cannyLow: 50,
  cannyHigh: 150,
  maxEdgeDensity: 0.05, // 5% threshold

  // Contour filtering
  minAspectRatio: 0.3,
  maxAspectRatio: 10,
  minExtent: 0.3,
  minOverlapRatio: 0.3,

  // Size filtering
  minAreaRatio: 0.0005, // 0.05%
  maxAreaRatio: 0.8, // 80%

  // Morphology
  edgeDilationKernel: 7,
  colorMorphKernel: 5,

  // Scoring weights (40% overlap, 40% area, 20% aspect)
  overlapWeight: 0.4,
  areaWeight: 0.4,
  aspectWeight: 0.2,
};
