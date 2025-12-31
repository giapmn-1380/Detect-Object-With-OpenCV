/**
 * Pipe BoundingBox detection using OpenCV.js
 * Detects orange vertical pipes via HSV thresholding + contour analysis
 */

import type { BoundingBox } from "@/src/domain/types";
import { clampBoundingBox } from "@/src/domain/detection-contract";
import type { OpenCV } from "./opencv.d";

// HSV range for orange pipe color (H, S, V, Alpha)
const ORANGE_HSV_LOW = [5, 100, 100, 0] as const;
const ORANGE_HSV_HIGH = [25, 255, 255, 0] as const;

// Filter thresholds
const MIN_AREA = 500; // minimum contour area in pixels
const MIN_ASPECT_RATIO = 1.5; // height/width ratio for vertical pipe

export interface DetectionResult {
  boxes: BoundingBox[];
  status: "completed" | "no_pipe_detected" | "failed";
  error?: string;
}

/**
 * Detect pipe bounding boxes in an image
 * @param cv - OpenCV namespace
 * @param imageData - ImageData from canvas
 * @returns Detection result with boxes
 */
export function detectPipeBoundingBoxes(
  cv: OpenCV,
  imageData: ImageData
): DetectionResult {
  if (!cv) {
    return { boxes: [], status: "failed", error: "OpenCV not loaded" };
  }

  const { width, height } = imageData;

  // Create Mat from ImageData
  const src = cv.matFromImageData(imageData);
  const hsv = new cv.Mat();
  const mask = new cv.Mat();
  const kernel = cv.Mat.ones(5, 5, cv.CV_8U);

  try {
    // Convert to HSV
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    const rgb = hsv.clone();
    cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);
    rgb.delete();

    // Threshold for orange color
    const low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), ORANGE_HSV_LOW);
    const high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), ORANGE_HSV_HIGH);
    cv.inRange(hsv, low, high, mask);
    low.delete();
    high.delete();

    // Morphological operations to clean noise
    cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel);
    cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel);

    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const boxes: BoundingBox[] = [];

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);

      if (area < MIN_AREA) {
        cnt.delete();
        continue;
      }

      const rect = cv.boundingRect(cnt);
      const aspectRatio = rect.height / rect.width;

      if (aspectRatio >= MIN_ASPECT_RATIO) {
        const box = clampBoundingBox(
          { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          width,
          height
        );
        boxes.push(box);
      }

      cnt.delete();
    }

    contours.delete();
    hierarchy.delete();

    // Sort by area descending
    boxes.sort((a, b) => b.width * b.height - a.width * a.height);

    return {
      boxes,
      status: boxes.length > 0 ? "completed" : "no_pipe_detected",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { boxes: [], status: "failed", error: message };
  } finally {
    src.delete();
    hsv.delete();
    mask.delete();
    kernel.delete();
  }
}
