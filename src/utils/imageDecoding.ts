/**
 * Image decoding utilities
 * Converts File objects to HTMLImageElement for processing
 */

/** Load a File as an HTMLImageElement */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode image: ${file.name}`));
    };
    img.src = url;
  });
}

/** Extract dimensions from an HTMLImageElement */
export function getImageDimensions(
  img: HTMLImageElement
): { width: number; height: number } {
  return { width: img.naturalWidth, height: img.naturalHeight };
}

/** Draw image to a canvas and return the context */
export function imageToCanvas(
  img: HTMLImageElement
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx };
}

/** Get ImageData from an HTMLImageElement */
export function getImageData(img: HTMLImageElement): ImageData {
  const { ctx, canvas } = imageToCanvas(img);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
