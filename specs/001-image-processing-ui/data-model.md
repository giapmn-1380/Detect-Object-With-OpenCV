# Phase 1 Data Model: 001-image-processing-ui

> No database. All entities are in-memory, derived from user-selected local files.

## Entities

### SelectedImage

Represents a user-selected image file.

- `id`: string (stable within a session)
- `fileName`: string
- `mimeType`: string
- `sizeBytes`: number
- `source`: File (browser File object)
- `originalPreviewUrl`: string (object URL)
- `dimensions`: `{ width: number; height: number } | null`

### ProcessingStatus

Per-image state machine:

- `not_started`
- `processing`
- `completed`
- `no_pipe_detected`
- `failed`

Transitions:

- `not_started` → `processing`
- `processing` → `completed | no_pipe_detected | failed`

### BoundingBox

Rectangle in pixel coordinates relative to the decoded image.

- `x`: number
- `y`: number
- `width`: number
- `height`: number

Validation rules:

- `x >= 0`, `y >= 0`
- `width > 0`, `height > 0`
- `x + width <= imageWidth`, `y + height <= imageHeight`

### DetectedPipe

A single detected pipe instance.

- `box`: BoundingBox
- `confidence`: number | null (optional; may be null for classical CV)

### ProcessedImageResult

Result of processing a single SelectedImage.

- `imageId`: string
- `status`: ProcessingStatus
- `pipes`: DetectedPipe[]
- `errorMessage`: string | null
- `afterPreview`: string | null (data URL or object URL for rendered canvas)

Relationships:

- `SelectedImage (1) -> (0..1) ProcessedImageResult`
- `ProcessedImageResult (1) -> (0..N) DetectedPipe`

## Notes

- Rendering strategy: keep the original image and render After via canvas overlay using the returned BoundingBoxes.
- If multiple pipes are detected, UI can show one After image with multiple boxes.
