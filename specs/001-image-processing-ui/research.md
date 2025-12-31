# Phase 0 Research: 001-image-processing-ui

## Decision 1: Run OpenCV in the Browser (static app)

- **Decision**: Use OpenCV.js (WebAssembly build) running fully client-side; bundle the `opencv.js` loader script and the `.wasm` binary under `public/opencv/` and load lazily only when processing starts.
- **Rationale**:
  - Meets the "no backend" / static constraint.
  - Avoids uploading images and keeps privacy.
  - Keeps build/deploy simple (static assets + JS).
- **Alternatives considered**:
  - Server-side OpenCV (Node/Python) → rejected (not static, introduces backend).
  - Canvas-only custom CV → rejected (higher implementation risk, less robust).

## Decision 2: BoundingBox detection approach for the orange vertical pipe

- **Decision**: Start with a classical CV pipeline that targets the orange pipe:
  1) Convert to HSV
  2) Threshold orange range
  3) Morphology (open/close) to denoise
  4) Find contours
  5) Convert each contour to `boundingRect`
  6) Filter candidates by area and aspect ratio (tall/vertical)
  7) Return remaining rectangles as BoundingBoxes (sorted by area desc)
- **Rationale**:
  - No model training required.
  - Aligns with a highly distinctive color cue (orange pipe).
  - Produces BoundingBoxes directly.
- **Alternatives considered**:
  - ML detection (YOLO, TFJS) → rejected for MVP due to model size + extra complexity.
  - Hough-line driven detection → possible enhancement, but contour + color is simpler.

## Decision 3: Keeping the UI responsive while processing many images

- **Decision**: Process images sequentially with per-image progress updates; optionally move detection into a Web Worker later if UI becomes unresponsive.
- **Rationale**:
  - Sequential processing simplifies status tracking and memory management.
  - Avoids complex bundling/worker-loading issues for OpenCV.js in the first iteration.
- **Alternatives considered**:
  - Web Worker from day 1 → beneficial but adds integration complexity (WASM + worker bundling).

## Decision 4: Memory management and safety with OpenCV.js

- **Decision**: Treat every `cv.Mat` as a resource that must be manually released; enforce a strict create/use/delete pattern inside detection.
- **Rationale**:
  - Prevent memory leaks for batch processing.
  - Makes behavior predictable for large images.
- **Alternatives considered**:
  - Relying on GC → rejected (OpenCV.js allocates outside JS heap).

## Decision 5: Output contract format

- **Decision**: Define a JSON-serializable per-image output contract:
  - `status`: `processing | completed | failed | no_pipe_detected`
  - `boxes`: array of `{ x, y, width, height }` in pixel coordinates relative to the decoded image
  - `error`: optional message (failed)
- **Rationale**:
  - Works for UI rendering (draw boxes on canvas).
  - Can be used in tests and future API integration without breaking.
- **Alternatives considered**:
  - Image-space normalized boxes (0..1) → possible later; pixels are simplest for initial overlay.
