# Implementation Plan: Image Processing Before/After UI

**Branch**: `001-image-processing-ui` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-image-processing-ui/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a static Next.js web app that lets users select multiple local images, automatically runs an OpenCV-based detector to find “ống nước” pipes, returns one or more BoundingBoxes per image, and renders an “After” preview with BoundingBoxes drawn.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Next.js default)  
**Primary Dependencies**: Next.js (App Router), React, OpenCV.js (WASM build)  
**Storage**: N/A (in-memory only; no database)  
**Testing**: Vitest + @testing-library/react for unit/UI logic; optional Playwright smoke test  
**Target Platform**: Modern evergreen browsers with WebAssembly support  
**Project Type**: web (static export)  
**Performance Goals**: Process a typical batch of 10 images without UI freezing; show per-image progress/status  
**Constraints**: Offline-capable, no uploads by default, avoid blocking initial render  
**Scale/Scope**: Single page workflow (select → auto-process → before/after)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Static-first: PASS (Next.js static export; no backend required)
- Simple tooling: PASS (standard Next.js tooling; minimal config)
- Quality gates: PASS (plan includes lint + tests for non-trivial detection logic)
- Accessibility baseline: PASS (file input, buttons, previews require keyboard + labels)
- Security & privacy: PASS (no uploads by default; no secrets; avoid logging image data)

Post-Phase-1 re-check: PASS (design artifacts created in `research.md`, `data-model.md`, `contracts/`, `quickstart.md` align with the constitution).

## Project Structure

### Documentation (this feature)

```text
specs/001-image-processing-ui/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
├── layout.tsx
├── page.tsx
└── (components)/
  ├── ImagePicker.tsx
  ├── ImageResultCard.tsx
  └── BeforeAfterPreview.tsx

src/
├── domain/
│   ├── types.ts
│   └── detection-contract.ts
├── opencv/
│   ├── loadOpenCv.ts
│   └── detectPipeBoundingBoxes.ts
└── utils/
  └── imageDecoding.ts

public/
└── opencv/
  ├── opencv.js
  └── opencv_js.wasm

tests/
├── unit/
└── integration/
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

**Structure Decision**: Single Next.js web application using the App Router, with detection logic isolated under `src/opencv/` and domain contracts under `src/domain/` for testability.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

No constitution violations are required for this feature.

## Phase 0 — Research (Output: research.md)

- Decide how to run OpenCV in-browser within Next.js (loading `opencv.js` + WASM from `public/`)
- Decide minimal pipe BoundingBox detection strategy suitable for orange vertical pipes
- Decide how to keep UI responsive while processing multiple images

See [research.md](./research.md).

## Phase 1 — Design & Contracts (Outputs: data-model.md, contracts/, quickstart.md)

- Define in-memory entities and state transitions for multi-image processing UI
- Define a stable contract for detection output (BoundingBox list + status)
- Document how to run/build as a static export

See [data-model.md](./data-model.md), [quickstart.md](./quickstart.md), and [contracts/](./contracts/).

## Phase 2 — Implementation Plan (no code in this phase)

1. Scaffold Next.js app configured for static export.
2. Implement UI workflow: select images → list → before/after cards → per-image status.
3. Implement OpenCV loader (lazy, client-only) and detection function returning BoundingBoxes.
4. Render BoundingBoxes on canvas for the After image.
5. Add unit tests for BoundingBox post-processing and basic UI state.
6. Add lightweight integration test using sample `pipe/` images.
