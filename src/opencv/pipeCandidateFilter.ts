/**
 * Pure helper functions for filtering and scoring pipe candidates.
 * Based on Python example_python.md implementation.
 * No OpenCV dependency – works on simple metric objects.
 */

import type { BoundingBox } from "@/src/domain/types";
import type { PipeDetectionRules } from "./pipeDetectionRules";
import { DEFAULT_PIPE_DETECTION_RULES } from "./pipeDetectionRules";

/** Metrics computed for a single contour candidate. */
export interface CandidateMetrics {
  /** Bounding box of the contour. */
  boundingBox: BoundingBox;
  /** Contour area in pixels. */
  contourArea: number;
  /** Overlap ratio with color mask (0-1). */
  overlapRatio: number;
}

/** Scored candidate with computed score. */
export interface ScoredCandidate {
  candidate: CandidateMetrics;
  score: number;
  overlapScore: number;
  areaScore: number;
  aspectScore: number;
  areaRatio: number;
  aspectRatio: number;
}

/** Compute aspect ratio (height / width). */
export function computeAspectRatio(box: BoundingBox): number {
  return box.width > 0 ? box.height / box.width : 0;
}

/** Compute extent (contourArea / boundingBoxArea). */
export function computeExtent(contourArea: number, box: BoundingBox): number {
  const bboxArea = box.width * box.height;
  return bboxArea > 0 ? contourArea / bboxArea : 0;
}

/** Compute bounding-box area. */
export function computeBBoxArea(box: BoundingBox): number {
  return box.width * box.height;
}

/**
 * Check whether a candidate passes shape filtering rules.
 * Based on filter_contours_by_shape in Python.
 */
export function isShapeValid(
  candidate: CandidateMetrics,
  rules: PipeDetectionRules = DEFAULT_PIPE_DETECTION_RULES
): boolean {
  const { boundingBox, contourArea } = candidate;
  
  // Check aspect ratio (H/W)
  const aspectRatio = computeAspectRatio(boundingBox);
  if (aspectRatio <= rules.minAspectRatio || aspectRatio >= rules.maxAspectRatio) {
    return false;
  }

  // Check extent (area / bounding_rect_area)
  const extent = computeExtent(contourArea, boundingBox);
  if (extent < rules.minExtent) {
    return false;
  }

  return true;
}

/**
 * Check whether a candidate passes size filtering rules.
 */
export function isSizeValid(
  candidate: CandidateMetrics,
  frameArea: number,
  rules: PipeDetectionRules = DEFAULT_PIPE_DETECTION_RULES
): boolean {
  const bboxArea = computeBBoxArea(candidate.boundingBox);
  const areaRatio = bboxArea / frameArea;

  // Skip if too large (> 80% of frame)
  if (areaRatio > rules.maxAreaRatio) {
    return false;
  }

  // Skip if too small (< 0.05% of frame)
  if (areaRatio < rules.minAreaRatio) {
    return false;
  }

  return true;
}

/**
 * Calculate area score based on Python's select_best_pipe logic.
 * Optimal range: 1-40% of frame area.
 */
export function calculateAreaScore(areaRatio: number): number {
  if (areaRatio >= 0.01 && areaRatio <= 0.4) {
    return 1.0;
  } else if (areaRatio < 0.01) {
    return areaRatio / 0.01; // Scale from 0 to 1
  } else {
    return Math.max(0, 1 - (areaRatio - 0.4) / 0.4);
  }
}

/**
 * Calculate aspect score based on Python's select_best_pipe logic.
 * - Vertical pipe (1.5-5): score = 1.0
 * - Near-square (0.8-1.25): score = 0.9 (close-up)
 * - Other ranges: lower scores
 */
export function calculateAspectScore(aspectRatio: number): number {
  if (aspectRatio >= 1.5 && aspectRatio <= 5) {
    return 1.0;
  } else if (aspectRatio >= 0.8 && aspectRatio <= 1.25) {
    return 0.9; // Close-up view
  } else if (aspectRatio >= 0.5 && aspectRatio < 1.5) {
    return 0.7;
  } else if (aspectRatio > 5) {
    return 0.8;
  } else {
    return 0.5;
  }
}

/**
 * Score a candidate using the Python scoring formula.
 * Total score = overlapWeight * overlap + areaWeight * areaScore + aspectWeight * aspectScore
 */
export function scoreCandidate(
  candidate: CandidateMetrics,
  frameArea: number,
  rules: PipeDetectionRules = DEFAULT_PIPE_DETECTION_RULES
): ScoredCandidate | null {
  const bboxArea = computeBBoxArea(candidate.boundingBox);
  const areaRatio = bboxArea / frameArea;
  const aspectRatio = computeAspectRatio(candidate.boundingBox);

  // Size validation
  if (!isSizeValid(candidate, frameArea, rules)) {
    return null;
  }

  // Shape validation
  if (!isShapeValid(candidate, rules)) {
    return null;
  }

  // Calculate individual scores
  const overlapScore = candidate.overlapRatio; // Already 0-1
  const areaScore = calculateAreaScore(areaRatio);
  const aspectScore = calculateAspectScore(aspectRatio);

  // Weighted total score
  const score =
    rules.overlapWeight * overlapScore +
    rules.areaWeight * areaScore +
    rules.aspectWeight * aspectScore;

  return {
    candidate,
    score,
    overlapScore,
    areaScore,
    aspectScore,
    areaRatio,
    aspectRatio,
  };
}

/**
 * Select the best candidate by highest score.
 * Returns undefined if no candidates pass filters.
 */
export function selectBestCandidate(
  candidates: CandidateMetrics[],
  frameArea: number,
  rules: PipeDetectionRules = DEFAULT_PIPE_DETECTION_RULES
): CandidateMetrics | undefined {
  let bestScored: ScoredCandidate | null = null;

  for (const candidate of candidates) {
    const scored = scoreCandidate(candidate, frameArea, rules);
    if (scored && (!bestScored || scored.score > bestScored.score)) {
      bestScored = scored;
    }
  }

  return bestScored?.candidate;
}

/**
 * Select the largest valid candidate by bounding-box area.
 * Fallback when scoring is not needed.
 */
export function selectLargestCandidate(
  candidates: CandidateMetrics[],
  frameArea: number,
  rules: PipeDetectionRules = DEFAULT_PIPE_DETECTION_RULES
): CandidateMetrics | undefined {
  let best: CandidateMetrics | undefined;
  let bestArea = -1;

  for (const c of candidates) {
    if (!isSizeValid(c, frameArea, rules)) continue;
    if (!isShapeValid(c, rules)) continue;

    const area = computeBBoxArea(c.boundingBox);
    if (area > bestArea) {
      bestArea = area;
      best = c;
    }
  }

  return best;
}
