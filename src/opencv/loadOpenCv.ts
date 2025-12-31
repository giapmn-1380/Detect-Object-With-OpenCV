/**
 * Lazy OpenCV.js loader
 * Loads OpenCV WASM from public/opencv/ on first call
 */

import type { OpenCV } from "./opencv.d";

declare global {
  interface Window {
    cv: OpenCV | ((module?: object) => Promise<OpenCV>) | undefined;
    _cvInitialized: OpenCV | undefined;
  }
}

let loadPromise: Promise<OpenCV | undefined> | null = null;

/**
 * Load OpenCV.js lazily and return cv namespace
 * Idempotent: multiple calls return same promise
 */
export function loadOpenCv(): Promise<OpenCV | undefined> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OpenCV.js can only be loaded in browser"));
  }

  // Return cached initialized instance
  if (window._cvInitialized) {
    console.log("[OpenCV] Returning cached instance");
    return Promise.resolve(window._cvInitialized);
  }

  // Check if cv is already available (script loaded by previous call)
  if (window.cv && typeof window.cv === "object" && "Mat" in window.cv) {
    console.log("[OpenCV] cv already available, caching it");
    window._cvInitialized = window.cv as OpenCV;
    return Promise.resolve(window.cv as OpenCV);
  }

  if (loadPromise) {
    console.log("[OpenCV] Returning existing load promise");
    return loadPromise;
  }

  console.log("[OpenCV] Starting to load opencv.js script");
  loadPromise = new Promise((resolve, reject) => {
    // Set up Module for Emscripten
    const module = {
      onRuntimeInitialized: () => {
        console.log("[OpenCV] Runtime initialized!");
        // Use setTimeout to ensure we're back in browser event loop
        setTimeout(() => {
          if (window.cv && "Mat" in window.cv) {
            console.log("[OpenCV] cv.Mat available:", typeof window.cv.Mat);
            window._cvInitialized = window.cv as OpenCV;
            console.log("[OpenCV] Calling resolve...");
            resolve(window.cv as OpenCV);
            console.log("[OpenCV] Resolve called");
          } else {
            console.error("[OpenCV] cv.Mat not available after initialization");
            reject(new Error("OpenCV runtime initialized but Mat not found"));
          }
        }, 0);
      },
    };
    
    // Assign to window
    (window as any).Module = module;
    
    const script = document.createElement("script");
    script.src = "/opencv/opencv.js";
    script.async = true;

    script.onload = () => {
      console.log("[OpenCV] Script loaded, waiting for runtime initialization...");
    };

    script.onerror = () => {
      console.error("[OpenCV] Script failed to load");
      loadPromise = null;
      reject(new Error("Failed to load OpenCV.js from /opencv/opencv.js"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
