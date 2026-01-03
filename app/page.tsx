"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ImagePicker } from "./(components)/ImagePicker";
import { ImageResultCard } from "./(components)/ImageResultCard";
import type { ImageItem, SelectedImage, ProcessedImageResult, DetectedPipe } from "@/src/domain/types";
import { loadImageFromFile, getImageDimensions, getImageData } from "@/src/utils/imageDecoding";
import { detectPipeBoundingBoxes } from "@/src/opencv/detectPipeBoundingBoxes";
import type { OpenCV } from "@/src/opencv/opencv.d";

// Generate unique ID for each image
function generateId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default function Home() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cvLoaded, setCvLoaded] = useState(false);
  const processingRef = useRef(false);

  // Load OpenCV once on mount
  useEffect(() => {
    const initOpenCV = async () => {
      if (window.cv && "Mat" in window.cv) {
        console.log("[OpenCV] Already loaded");
        setCvLoaded(true);
        return;
      }

      console.log("[OpenCV] Loading script...");
      const script = document.createElement("script");
      script.src = "/opencv/opencv.js";
      script.async = true;
      
      script.onload = () => {
        console.log("[OpenCV] Script loaded, setting up runtime callback");
        if (window.cv) {
          (window.cv as any)["onRuntimeInitialized"] = () => {
            console.log("[OpenCV] Runtime initialized!");
            setCvLoaded(true);
          };
        } else {
          // For some OpenCV builds, need to set Module first
          (window as any).Module = {
            onRuntimeInitialized: () => {
              console.log("[OpenCV] Runtime initialized via Module!");
              setCvLoaded(true);
            }
          };
        }
      };
      
      script.onerror = () => {
        console.error("[OpenCV] Failed to load script");
      };
      
      document.head.appendChild(script);
    };

    initOpenCV();
  }, []);

  // Process a single image
  const processImage = useCallback(
    async (item: ImageItem): Promise<ProcessedImageResult> => {
      const { image } = item;
      console.log("[Processing] Starting image:", image.id);

      try {
        // Check if OpenCV is ready
        if (!window.cv || !("Mat" in window.cv)) {
          console.error("[Processing] OpenCV not ready");
          return {
            imageId: image.id,
            status: "failed",
            pipes: [],
            errorMessage: "OpenCV not ready",
            afterPreviewUrl: null,
          };
        }
        
        const cv = window.cv;
        console.log("[Processing] Using OpenCV, Mat:", typeof cv.Mat);

        // Load and decode image
        console.log("[Processing] Loading image...");
        const img = await loadImageFromFile(image.source);
        console.log("[Processing] Image loaded:", img.width, "x", img.height);
        
        console.log("[Processing] Getting ImageData...");
        const imageData = getImageData(img);
        console.log("[Processing] ImageData created:", imageData.width, "x", imageData.height);

        // Run detection
        console.log("[Processing] Running detection...");
        const result = detectPipeBoundingBoxes(cv, imageData);
        console.log("[Processing] Detection result:", result);

        const pipes: DetectedPipe[] = result.boxes.map((box) => ({
          box,
          confidence: null,
        }));

        return {
          imageId: image.id,
          status: result.status,
          pipes,
          errorMessage: result.error ?? null,
          afterPreviewUrl: null,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[Processing] Error:", message);
        return {
          imageId: image.id,
          status: "failed",
          pipes: [],
          errorMessage: message,
          afterPreviewUrl: null,
        };
      }
    },
    []
  );

  // Process all pending images sequentially
  const processAllImages = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    setItems((currentItems) => {
      // Process items that are not started
      const updatedItems = [...currentItems];
      return updatedItems;
    });

    // Get current items and process sequentially
    const currentItems = items.filter(
      (item) => !item.result || item.result.status === "not_started"
    );

    for (const item of currentItems) {
      // Update status to processing
      setItems((prev) =>
        prev.map((i) =>
          i.image.id === item.image.id
            ? {
                ...i,
                result: {
                  imageId: i.image.id,
                  status: "processing",
                  pipes: [],
                  errorMessage: null,
                  afterPreviewUrl: null,
                },
              }
            : i
        )
      );

      // Yield to event loop for UI update
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Process
      const result = await processImage(item);

      // Update with result
      setItems((prev) =>
        prev.map((i) =>
          i.image.id === item.image.id ? { ...i, result } : i
        )
      );
    }

    processingRef.current = false;
    setIsProcessing(false);
  }, [items, processImage]);

  // Handle new images selected
  const handleImagesSelected = useCallback(async (files: File[]) => {
    const newItems: ImageItem[] = [];

    for (const file of files) {
      const id = generateId();
      const previewUrl = URL.createObjectURL(file);

      // Try to get dimensions
      let dimensions: { width: number; height: number } | null = null;
      try {
        const img = await loadImageFromFile(file);
        dimensions = getImageDimensions(img);
      } catch {
        // Will show error during processing
      }

      const selectedImage: SelectedImage = {
        id,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        source: file,
        originalPreviewUrl: previewUrl,
        dimensions,
      };

      newItems.push({
        image: selectedImage,
        result: null,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  // Auto-process when new items are added and OpenCV is ready
  useEffect(() => {
    const hasPending = items.some((item) => !item.result);
    if (hasPending && !processingRef.current && cvLoaded) {
      processAllImages();
    }
  }, [items, processAllImages, cvLoaded]);

  // Remove a single image
  const handleRemove = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.image.id === id);
      if (item) {
        URL.revokeObjectURL(item.image.originalPreviewUrl);
      }
      return prev.filter((i) => i.image.id !== id);
    });
  }, []);

  // Clear all
  const handleClearAll = useCallback(() => {
    items.forEach((item) => {
      URL.revokeObjectURL(item.image.originalPreviewUrl);
    });
    setItems([]);
  }, [items]);

  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Pipe Detection - Before/After</h1>

      {/* Image Picker */}
      <section className="mb-8">
        <div className="flex items-center gap-4">
          <ImagePicker onImagesSelected={handleImagesSelected} disabled={!cvLoaded || isProcessing} />
          {!cvLoaded && (
            <span className="text-sm text-gray-500">Loading OpenCV...</span>
          )}
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isProcessing}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Clear All
            </button>
          )}
        </div>
      </section>

      {/* Results list */}
      <section>
        {items.length === 0 ? (
          <div className="text-gray-500 text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p>No images selected.</p>
            <p className="text-sm mt-1">Click &quot;Select Images&quot; to begin.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <ImageResultCard
                key={item.image.id}
                item={item}
                onRemove={!isProcessing ? handleRemove : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
