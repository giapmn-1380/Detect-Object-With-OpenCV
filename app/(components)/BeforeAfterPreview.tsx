"use client";

import { useEffect, useRef } from "react";
import type { BoundingBox } from "@/src/domain/types";

interface BeforeAfterPreviewProps {
  originalUrl: string;
  boxes: BoundingBox[];
  width: number;
  height: number;
  showAfter: boolean;
}

/**
 * Before/After image preview with bounding box overlay
 * Draws boxes on a canvas overlaid on the original image
 */
export function BeforeAfterPreview({
  originalUrl,
  boxes,
  width,
  height,
  showAfter,
}: BeforeAfterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showAfter || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load image and draw boxes
    const img = new Image();
    img.onload = () => {
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw bounding boxes
      ctx.strokeStyle = "#22c55e"; // green-500
      ctx.lineWidth = 3;
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#22c55e";

      const scaleX = canvas.width / width;
      const scaleY = canvas.height / height;

      boxes.forEach((box, index) => {
        const x = box.x * scaleX;
        const y = box.y * scaleY;
        const w = box.width * scaleX;
        const h = box.height * scaleY;

        ctx.strokeRect(x, y, w, h);

        // Label
        const label = `Pipe ${index + 1}`;
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(x, y - 20, textWidth + 8, 20);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, x + 4, y - 6);
      });
    };
    img.src = originalUrl;
  }, [originalUrl, boxes, width, height, showAfter]);

  // Calculate display dimensions (max 400px wide, maintain aspect ratio)
  const maxWidth = 400;
  const displayWidth = Math.min(maxWidth, width);
  const displayHeight = (height / width) * displayWidth;

  return (
    <div className="flex gap-4 flex-wrap">
      {/* Before */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500 uppercase">Before</span>
        <img
          src={originalUrl}
          alt="Original"
          width={displayWidth}
          height={displayHeight}
          className="rounded border border-gray-200"
          style={{ width: displayWidth, height: displayHeight, objectFit: "cover" }}
        />
      </div>

      {/* After */}
      {showAfter && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase">After</span>
          <canvas
            ref={canvasRef}
            width={displayWidth}
            height={displayHeight}
            className="rounded border border-gray-200"
            style={{ width: displayWidth, height: displayHeight }}
          />
        </div>
      )}
    </div>
  );
}
