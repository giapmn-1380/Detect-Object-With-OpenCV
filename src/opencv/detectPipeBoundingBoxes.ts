/**
 * Pipe BoundingBox detection using OpenCV.js
 * Converted from Python example_python.md implementation.
 *
 * Pipeline (hybrid approach):
 * 1. Create color mask (HSV for orange pipes)
 * 2. Create edge mask (Canny)
 * 3. Calculate edge density
 * 4. If edge density > threshold → use color mask directly
 * 5. Otherwise → try edge detection first, fallback to color mask
 * 6. Score candidates: 40% overlap + 40% area + 20% aspect
 * 7. Return best scoring pipe (0 or 1 BB)
 */

import type { BoundingBox } from "@/src/domain/types";
import { clampBoundingBox, isValidBoundingBox } from "@/src/domain/detection-contract";
import type { OpenCV, Mat, MatVector } from "./opencv.d";
import {
  DEFAULT_PIPE_DETECTION_RULES,
  type PipeDetectionRules,
} from "./pipeDetectionRules";
import {
  selectBestCandidate,
  type CandidateMetrics,
} from "./pipeCandidateFilter";

export interface DetectionResult {
  boxes: BoundingBox[];
  status: "completed" | "no_pipe_detected" | "failed";
  error?: string;
  /** Debug info about which method was used. */
  method?: "edge_detection" | "color_mask";
}

/** Helper: cleanup multiple Mats safely. */
function deleteMats(...mats: (Mat | MatVector | undefined)[]): void {
  for (const m of mats) {
    try {
      m?.delete();
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Create HSV color mask for orange pipes.
 * Python: detect_pipe_by_color()
 */
function createColorMask(
  cv: OpenCV,
  src: Mat,
  rules: PipeDetectionRules
): Mat {
  const rgb = new cv.Mat();
  const hsv = new cv.Mat();
  const mask = new cv.Mat();

  try {
    // RGBA → RGB → HSV
    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
    cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);

    // Create lower/upper bounds as Mats
    const lower = new cv.Mat(1, 3, cv.CV_8UC1);
    const upper = new cv.Mat(1, 3, cv.CV_8UC1);
    lower.data.set(rules.orangeHsvLow);
    upper.data.set(rules.orangeHsvHigh);

    // InRange for orange color
    cv.inRange(hsv, lower, upper, mask);

    lower.delete();
    upper.delete();
    rgb.delete();
    hsv.delete();

    return mask;
  } catch (err) {
    deleteMats(rgb, hsv, mask);
    throw err;
  }
}

/**
 * Create edge mask using Gaussian blur + Canny.
 * Python: detect_pipe_by_edge()
 */
function createEdgeMask(
  cv: OpenCV,
  src: Mat,
  rules: PipeDetectionRules
): Mat {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    const ksize = new cv.Size(rules.blurKernelSize, rules.blurKernelSize);
    cv.GaussianBlur(gray, blurred, ksize, 0);

    cv.Canny(blurred, edges, rules.cannyLow, rules.cannyHigh);

    gray.delete();
    blurred.delete();

    return edges;
  } catch (err) {
    deleteMats(gray, blurred, edges);
    throw err;
  }
}

/**
 * Calculate edge density (ratio of edge pixels to total pixels).
 */
function calculateEdgeDensity(cv: OpenCV, edges: Mat): number {
  const nonZero = cv.countNonZero(edges);
  const total = edges.rows * edges.cols;
  return total > 0 ? nonZero / total : 0;
}

/**
 * Find contours from a binary mask with morphological cleanup.
 * Python: find_contours()
 *
 * @param dilateEdges - If true, apply dilation for edge images
 */
function findContoursFromMask(
  cv: OpenCV,
  mask: Mat,
  rules: PipeDetectionRules,
  dilateEdges: boolean
): { contours: MatVector; cleaned: Mat } {
  const cleaned = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    if (dilateEdges) {
      // For edge images: dilate then close
      const ksize = new cv.Size(rules.edgeDilationKernel, rules.edgeDilationKernel);
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, ksize);

      const dilated = new cv.Mat();
      cv.dilate(mask, dilated, kernel, { x: -1, y: -1 }, 2);
      cv.morphologyEx(dilated, cleaned, cv.MORPH_CLOSE, kernel);

      kernel.delete();
      dilated.delete();
    } else {
      // For color masks: close then open
      const ksize = new cv.Size(rules.colorMorphKernel, rules.colorMorphKernel);
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, ksize);

      const temp = new cv.Mat();
      cv.morphologyEx(mask, temp, cv.MORPH_CLOSE, kernel);
      cv.morphologyEx(temp, cleaned, cv.MORPH_OPEN, kernel);

      kernel.delete();
      temp.delete();
    }

    cv.findContours(cleaned, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    hierarchy.delete();

    return { contours, cleaned };
  } catch (err) {
    deleteMats(cleaned, contours, hierarchy);
    throw err;
  }
}

/**
 * Calculate overlap ratio between a contour and color mask.
 * Python: filter_contours_by_color()
 */
function calculateOverlapRatio(
  cv: OpenCV,
  contour: Mat,
  colorMask: Mat
): number {
  const contourMask = new cv.Mat(colorMask.rows, colorMask.cols, cv.CV_8UC1, [0, 0, 0, 0]);
  const overlap = new cv.Mat();
  const contours = new cv.MatVector();

  try {
    contours.push_back(contour);
    cv.drawContours(contourMask, contours, 0, [255, 255, 255, 255], -1);

    cv.bitwise_and(contourMask, colorMask, overlap);

    const overlapPixels = cv.countNonZero(overlap);
    const contourArea = cv.contourArea(contour);

    return contourArea > 0 ? overlapPixels / contourArea : 0;
  } finally {
    deleteMats(contourMask, overlap, contours);
  }
}

/**
 * Build candidate metrics from contours with color overlap.
 * Python: filter_contours_by_color() + filter_contours_by_shape()
 */
function buildCandidatesFromContours(
  cv: OpenCV,
  contours: MatVector,
  colorMask: Mat,
  rules: PipeDetectionRules,
  useColorOverlap: boolean
): CandidateMetrics[] {
  const candidates: CandidateMetrics[] = [];

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const contourArea = cv.contourArea(cnt);
    const rect = cv.boundingRect(cnt);

    // Skip empty contours
    if (rect.width === 0 || rect.height === 0) {
      cnt.delete();
      continue;
    }

    // Calculate overlap ratio with color mask
    let overlapRatio = 1.0; // Default for color mask contours
    if (useColorOverlap) {
      overlapRatio = calculateOverlapRatio(cv, cnt, colorMask);

      // Filter by minimum overlap
      if (overlapRatio < rules.minOverlapRatio) {
        cnt.delete();
        continue;
      }
    }

    candidates.push({
      boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      contourArea,
      overlapRatio,
    });

    cnt.delete();
  }

  return candidates;
}

/**
 * Try edge detection approach.
 * Python: try_edge_detection()
 */
function tryEdgeDetection(
  cv: OpenCV,
  edges: Mat,
  colorMask: Mat,
  frameArea: number,
  rules: PipeDetectionRules
): CandidateMetrics | undefined {
  const { contours, cleaned } = findContoursFromMask(cv, edges, rules, true);

  try {
    const candidates = buildCandidatesFromContours(cv, contours, colorMask, rules, true);
    return selectBestCandidate(candidates, frameArea, rules);
  } finally {
    deleteMats(contours, cleaned);
  }
}

/**
 * Try color mask approach.
 * Python: try_color_mask_detection()
 */
function tryColorMaskDetection(
  cv: OpenCV,
  colorMask: Mat,
  frameArea: number,
  rules: PipeDetectionRules
): CandidateMetrics | undefined {
  const { contours, cleaned } = findContoursFromMask(cv, colorMask, rules, false);

  try {
    // For color mask contours, overlap is always 1.0
    const candidates = buildCandidatesFromContours(cv, contours, colorMask, rules, false);
    return selectBestCandidate(candidates, frameArea, rules);
  } finally {
    deleteMats(contours, cleaned);
  }
}

/**
 * Detect pipe bounding boxes in an image.
 * Returns at most ONE bounding box (the best scoring candidate).
 *
 * Hybrid approach from Python:
 * 1. If edge density > 5% → use color mask directly
 * 2. Otherwise → try edge detection first
 * 3. If edge result is too small → try color mask as fallback
 *
 * @param cv - OpenCV namespace
 * @param imageData - ImageData from canvas
 * @param rules - Optional detection rules (defaults to spec defaults)
 * @returns Detection result with 0 or 1 box
 */
export function detectPipeBoundingBoxes(
  cv: OpenCV,
  imageData: ImageData,
  rules: PipeDetectionRules = DEFAULT_PIPE_DETECTION_RULES
): DetectionResult {
  if (!cv) {
    return { boxes: [], status: "failed", error: "OpenCV not loaded" };
  }

  const { width, height } = imageData;
  const frameArea = width * height;

  // Allocate main source Mat
  const src = cv.matFromImageData(imageData);
  let colorMask: Mat | undefined;
  let edges: Mat | undefined;

  try {
    // 1. Create masks
    colorMask = createColorMask(cv, src, rules);
    edges = createEdgeMask(cv, src, rules);

    // 2. Calculate edge density
    const edgeDensity = calculateEdgeDensity(cv, edges);

    let best: CandidateMetrics | undefined;
    let method: "edge_detection" | "color_mask";

    if (edgeDensity > rules.maxEdgeDensity) {
      // High edge density → use color mask directly
      best = tryColorMaskDetection(cv, colorMask, frameArea, rules);
      method = "color_mask";
    } else {
      // Try edge detection first
      best = tryEdgeDetection(cv, edges, colorMask, frameArea, rules);
      method = "edge_detection";

      // Check if edge result is too small (< 1% of frame)
      if (best) {
        const bboxArea = best.boundingBox.width * best.boundingBox.height;
        const bboxRatio = bboxArea / frameArea;

        if (bboxRatio < 0.01) {
          // Try color mask as fallback
          const colorBest = tryColorMaskDetection(cv, colorMask, frameArea, rules);
          if (colorBest) {
            const colorBboxArea = colorBest.boundingBox.width * colorBest.boundingBox.height;
            if (colorBboxArea > bboxArea) {
              best = colorBest;
              method = "color_mask";
            }
          }
        }
      } else {
        // Edge detection failed → try color mask
        best = tryColorMaskDetection(cv, colorMask, frameArea, rules);
        method = "color_mask";
      }
    }

    if (!best) {
      return { boxes: [], status: "no_pipe_detected", method };
    }

    // Clamp & validate the bounding box
    const clamped = clampBoundingBox(best.boundingBox, width, height);
    if (!isValidBoundingBox(clamped)) {
      return { boxes: [], status: "no_pipe_detected", method };
    }

    return { boxes: [clamped], status: "completed", method };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { boxes: [], status: "failed", error: message };
  } finally {
    deleteMats(src, colorMask, edges);
  }
}
