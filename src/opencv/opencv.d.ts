/**
 * Minimal OpenCV.js type definitions for pipe detection
 * Only includes types needed for this application
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

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MatVector {
  size(): number;
  get(index: number): Mat;
  delete(): void;
}

export interface OpenCV {
  // Mat creation
  Mat: MatConstructor;
  matFromImageData(imageData: ImageData): Mat;
  
  // MatVector
  MatVector: new () => MatVector;
  
  // Color conversion
  COLOR_RGBA2RGB: number;
  COLOR_RGB2HSV: number;
  cvtColor(src: Mat, dst: Mat, code: number): void;
  
  // Thresholding
  inRange(src: Mat, lowerb: Mat, upperb: Mat, dst: Mat): void;
  
  // Morphology
  MORPH_OPEN: number;
  MORPH_CLOSE: number;
  getStructuringElement(shape: number, ksize: Size): Mat;
  morphologyEx(src: Mat, dst: Mat, op: number, kernel: Mat): void;
  MORPH_RECT: number;
  
  // Contours
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  findContours(image: Mat, contours: MatVector, hierarchy: Mat, mode: number, method: number): void;
  contourArea(contour: Mat): number;
  boundingRect(contour: Mat): Rect;
  
  // Mat types
  CV_8U: number;
  CV_8UC1: number;
  CV_8UC3: number;
  CV_8UC4: number;
  CV_32SC4: number;
}
