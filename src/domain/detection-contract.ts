/**
 * Detection result contract helpers
 * Maps to the JSON schema in contracts/pipe-detection-result.schema.json
 */

import type { BoundingBox, ProcessingStatus } from "./types";

/** Wire format for detection result (JSON-serializable) */
export interface DetectionResultDTO {
  imageId: string;
  status: "processing" | "completed" | "no_pipe_detected" | "failed";
  boxes: BoundingBox[];
  errorMessage: string | null;
}

/** Convert internal status to DTO status */
export function toWireStatus(
  status: ProcessingStatus
): DetectionResultDTO["status"] {
  if (status === "not_started") return "processing";
  return status;
}

/** Validate that a bounding box has positive dimensions */
export function isValidBoundingBox(box: BoundingBox): boolean {
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.width > 0 &&
    box.height > 0
  );
}

/** Clamp a bounding box to image boundaries */
export function clampBoundingBox(
  box: BoundingBox,
  imageWidth: number,
  imageHeight: number
): BoundingBox {
  const x = Math.max(0, Math.min(box.x, imageWidth - 1));
  const y = Math.max(0, Math.min(box.y, imageHeight - 1));
  const maxW = imageWidth - x;
  const maxH = imageHeight - y;
  return {
    x,
    y,
    width: Math.min(box.width, maxW),
    height: Math.min(box.height, maxH),
  };
}
