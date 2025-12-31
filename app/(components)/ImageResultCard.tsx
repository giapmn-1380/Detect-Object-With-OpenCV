"use client";

import type { ImageItem } from "@/src/domain/types";
import { BeforeAfterPreview } from "./BeforeAfterPreview";

interface ImageResultCardProps {
  item: ImageItem;
  onRemove?: (id: string) => void;
}

/**
 * Card displaying a single image with its processing status and before/after preview
 */
export function ImageResultCard({ item, onRemove }: ImageResultCardProps) {
  const { image, result } = item;

  const getStatusBadge = () => {
    if (!result) {
      return <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Not started</span>;
    }

    switch (result.status) {
      case "processing":
        return (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded animate-pulse">
            Processing...
          </span>
        );
      case "completed":
        return (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            {result.pipes.length} pipe(s) detected
          </span>
        );
      case "no_pipe_detected":
        return (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
            No pipe detected
          </span>
        );
      case "failed":
        return (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const showAfter = result?.status === "completed" || result?.status === "no_pipe_detected";

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm truncate max-w-[200px]" title={image.fileName}>
            {image.fileName}
          </span>
          {getStatusBadge()}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className="text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            aria-label={`Remove ${image.fileName}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {result?.status === "failed" && result.errorMessage && (
        <div className="text-sm text-red-600 mb-3 p-2 bg-red-50 rounded">
          {result.errorMessage}
        </div>
      )}

      {image.dimensions && (
        <BeforeAfterPreview
          originalUrl={image.originalPreviewUrl}
          boxes={result?.pipes.map((p) => p.box) ?? []}
          width={image.dimensions.width}
          height={image.dimensions.height}
          showAfter={showAfter}
        />
      )}

      {!image.dimensions && (
        <div className="text-sm text-gray-500">Loading preview...</div>
      )}
    </div>
  );
}
