/**
 * Domain types for image processing and pipe detection
 */

/** Processing status for a single image */
export type ProcessingStatus =
  | "not_started"
  | "processing"
  | "completed"
  | "no_pipe_detected"
  | "failed";

/** Bounding box in pixel coordinates */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A detected pipe instance */
export interface DetectedPipe {
  box: BoundingBox;
  confidence: number | null;
}

/** User-selected image file with metadata */
export interface SelectedImage {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  source: File;
  originalPreviewUrl: string;
  dimensions: { width: number; height: number } | null;
}

/** Result of processing a single image */
export interface ProcessedImageResult {
  imageId: string;
  status: ProcessingStatus;
  pipes: DetectedPipe[];
  errorMessage: string | null;
  afterPreviewUrl: string | null;
}

/** Combined state for an image in the UI */
export interface ImageItem {
  image: SelectedImage;
  result: ProcessedImageResult | null;
}
