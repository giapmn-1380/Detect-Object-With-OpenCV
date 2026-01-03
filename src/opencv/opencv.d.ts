/**
 * Minimal OpenCV.js type definitions for pipe detection
 * Supports both color-based (HSV) and edge-based detection
 */

export interface Mat {
  rows: number;
  cols: number;
  type(): number;
  data: Uint8Array;
  data32S: Int32Array;
  clone(): Mat;
  delete(): void;
}

export interface MatConstructor {
  new (): Mat;
  new (rows: number, cols: number, type: number, scalar?: readonly number[]): Mat;
  ones(rows: number, cols: number, type: number): Mat;
  zeros(rows: number, cols: number, type: number): Mat;
}

export interface Scalar {
  [index: number]: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface SizeConstructor {
  new (width: number, height: number): Size;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MatVector {
  size(): number;
  get(index: number): Mat;
  push_back(mat: Mat): void;
  delete(): void;
}

export interface OpenCV {
  // Mat creation
  Mat: MatConstructor;
  matFromImageData(imageData: ImageData): Mat;

  // Size constructor
  Size: SizeConstructor;
  
  // MatVector
  MatVector: new () => MatVector;
  
  // ─────────────────────────────────────────────────────────
  // Color conversion constants
  // ─────────────────────────────────────────────────────────
  COLOR_RGBA2RGB: number;
  COLOR_RGB2HSV: number;
  COLOR_BGR2HSV: number;
  COLOR_RGBA2GRAY: number;
  COLOR_RGB2GRAY: number;
  COLOR_BGR2GRAY: number;
  cvtColor(src: Mat, dst: Mat, code: number): void;
  
  // ─────────────────────────────────────────────────────────
  // Blur
  // ─────────────────────────────────────────────────────────
  GaussianBlur(src: Mat, dst: Mat, ksize: Size, sigmaX: number, sigmaY?: number): void;

  // ─────────────────────────────────────────────────────────
  // Edge detection
  // ─────────────────────────────────────────────────────────
  Canny(src: Mat, dst: Mat, threshold1: number, threshold2: number, apertureSize?: number, L2gradient?: boolean): void;
  
  // ─────────────────────────────────────────────────────────
  // Thresholding
  // ─────────────────────────────────────────────────────────
  inRange(src: Mat, lowerb: Mat, upperb: Mat, dst: Mat): void;
  
  // ─────────────────────────────────────────────────────────
  // Morphology
  // ─────────────────────────────────────────────────────────
  MORPH_OPEN: number;
  MORPH_CLOSE: number;
  MORPH_RECT: number;
  getStructuringElement(shape: number, ksize: Size): Mat;
  morphologyEx(src: Mat, dst: Mat, op: number, kernel: Mat): void;
  dilate(src: Mat, dst: Mat, kernel: Mat, anchor?: { x: number; y: number }, iterations?: number): void;
  
  // ─────────────────────────────────────────────────────────
  // Contours
  // ─────────────────────────────────────────────────────────
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  findContours(image: Mat, contours: MatVector, hierarchy: Mat, mode: number, method: number): void;
  contourArea(contour: Mat): number;
  boundingRect(contour: Mat): Rect;
  convexHull(contour: Mat, hull: Mat, clockwise?: boolean, returnPoints?: boolean): void;
  drawContours(image: Mat, contours: MatVector, contourIdx: number, color: Scalar, thickness?: number, lineType?: number, hierarchy?: Mat, maxLevel?: number, offset?: { x: number; y: number }): void;
  
  // ─────────────────────────────────────────────────────────
  // Bitwise operations
  // ─────────────────────────────────────────────────────────
  bitwise_and(src1: Mat, src2: Mat, dst: Mat, mask?: Mat): void;
  countNonZero(src: Mat): number;
  
  // ─────────────────────────────────────────────────────────
  // Mat types
  // ─────────────────────────────────────────────────────────
  CV_8U: number;
  CV_8UC1: number;
  CV_8UC3: number;
  CV_8UC4: number;
  CV_32SC4: number;
}

// Augment global Window for OpenCV runtime
declare global {
  interface Window {
    cv: OpenCV | ((module?: object) => Promise<OpenCV>) | undefined;
  }
}
