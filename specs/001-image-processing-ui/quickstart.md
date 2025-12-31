# Quickstart: 001-image-processing-ui

## Prerequisites

- Node.js (LTS recommended)
- A browser with WebAssembly support

## Run locally (dev)

1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`
3. Open the app in your browser and select images.

## Build as a static site

- `npm run build`

Notes:

- Configure Next.js for static export (no server/runtime backend required).
- Ensure OpenCV assets (e.g., `public/opencv/opencv.js` and `.wasm`) are included in the exported output.

## Sample images

Sample pipe images are available under:

- `pipe/pipe_1.jpg`
- `pipe/pipe_2.jpg`
- `pipe/pipe_3.png`
