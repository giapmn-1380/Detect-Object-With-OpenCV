---

description: "Task list for implementing 001-image-processing-ui"
---

# Tasks: Image Processing Before/After UI

**Input**: Design documents from `/specs/001-image-processing-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included for non-trivial logic (OpenCV detection + core UI state), per project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Includes exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Goal**: Initialize a Next.js (TypeScript) static web app skeleton and baseline tooling.

- [x] T001 Initialize Next.js + TypeScript project (create `package.json`, `next.config.*`, `app/`) at repo root
- [x] T002 [P] Add npm scripts for dev/build/lint/test in `package.json`
- [x] T003 [P] Configure ESLint for Next.js in `.eslintrc.*` (or `eslint.config.*`) and ensure `npm run lint` works
- [x] T004 [P] Configure formatting baseline (Prettier) in `.prettierrc` and `.prettierignore`
- [x] T005 [P] Add `.gitignore` entries for Next.js build artifacts and local env files in `.gitignore`
- [x] T006 Create initial page shell in `app/page.tsx` with placeholder layout for picker + results list

**Checkpoint**: `npm install`, `npm run dev`, and `npm run build` succeed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Create the core domain types/contracts and OpenCV loading infrastructure that all stories depend on.

- [x] T007 Create domain types for images, statuses, and bounding boxes in `src/domain/types.ts`
- [x] T008 Create detection result contract helpers (mapping to JSON schema) in `src/domain/detection-contract.ts`
- [x] T009 [P] Add image decoding utilities (File -> HTMLImageElement/ImageBitmap) in `src/utils/imageDecoding.ts`
- [x] T010 Implement lazy OpenCV loader (client-only, idempotent) in `src/opencv/loadOpenCv.ts`
- [x] T011 Implement pipe detector API (signature + stubs) in `src/opencv/detectPipeBoundingBoxes.ts`
- [x] T012 [P] Place OpenCV runtime assets under `public/opencv/opencv.js` and `public/opencv/opencv_js.wasm` (or document alternative in `README.md`)
- [x] T013 Configure Next.js for static export in `next.config.*` (e.g., output/export settings) and verify `npm run build` produces static output in `out/`

**Checkpoint**: App builds as static site; OpenCV loader can be invoked from the browser without crashing.

---

## Phase 3: User Story 1 (Priority: P1) 🎯 MVP

**Goal**: Select multiple local images; auto-run pipe detection; show before/after with BoundingBoxes drawn.

**Independent Test**: Using sample images in `pipe/`, a user can select multiple images and see per-image before/after; images with pipes show BoundingBoxes, images without pipes show “no pipe detected”.

### Tests for User Story 1 (required for non-trivial logic)

- [x] T014 [P] [US1] Add unit test scaffolding (Vitest) in `vitest.config.ts` and `tests/unit/setup.ts`
- [x] T015 [P] [US1] Add unit tests for BoundingBox validation/clamping helpers in `tests/unit/boundingBox.test.ts`
- [x] T016 [P] [US1] Add unit tests for detector filtering logic (aspect ratio/area thresholds) in `tests/unit/detectPipeBoundingBoxes.test.ts`

### Implementation for User Story 1

- [x] T017 [P] [US1] Implement `ImagePicker` component (multi-file input + callbacks) in `app/(components)/ImagePicker.tsx`
- [x] T018 [P] [US1] Implement `BeforeAfterPreview` component (canvas overlay drawing) in `app/(components)/BeforeAfterPreview.tsx`
- [x] T019 [P] [US1] Implement `ImageResultCard` component (filename, status, previews) in `app/(components)/ImageResultCard.tsx`
- [x] T020 [US1] Wire page state + rendering in `app/page.tsx` (selected images list, results map, error display)
- [x] T021 [US1] Implement OpenCV detection pipeline (HSV threshold → morphology → contours → boundingRect → filtering) in `src/opencv/detectPipeBoundingBoxes.ts`
- [x] T022 [US1] Integrate OpenCV loader + detector into UI flow in `app/page.tsx` (auto-start after selection; sequential processing; per-image status updates)
- [x] T023 [US1] Implement "no pipe detected" status handling in `app/page.tsx` and `app/(components)/ImageResultCard.tsx`
- [x] T024 [US1] Ensure privacy baseline: no network calls for processing; avoid logging raw image content in `app/page.tsx`

**Checkpoint**: US1 works end-to-end using `pipe/pipe_*.{jpg,png}`.

---

## Phase 4: User Story 2 (Priority: P2)

**Goal**: Manage the selected image list (remove one, clear all) without breaking processing.

**Independent Test**: Select 3 images → remove 1 → remaining images process; then clear all → UI resets.

- [ ] T025 [P] [US2] Add remove-image action UI in `app/(components)/ImageResultCard.tsx`
- [ ] T026 [US2] Implement remove-image state update (and cancel/skip if not started) in `app/page.tsx`
- [ ] T027 [P] [US2] Add clear-all button component UI in `app/(components)/ImagePicker.tsx` (or `app/page.tsx`)
- [ ] T028 [US2] Implement clear-all behavior (revoke object URLs, reset results/status) in `app/page.tsx`
- [ ] T029 [P] [US2] Add unit tests for list mutation helpers in `tests/unit/selectionState.test.ts`

**Checkpoint**: US2 works independently (even if detection is stubbed).

---

## Phase 5: User Story 3 (Priority: P3)

**Goal**: Show processing progress/status per image; friendly error reporting; avoid UI freeze.

**Independent Test**: Select multiple images; UI shows per-image `processing/completed/no_pipe_detected/failed` and does not become unresponsive.

- [ ] T030 [US3] Add per-image progress/status presentation in `app/(components)/ImageResultCard.tsx`
- [ ] T031 [US3] Ensure sequential processing updates status frequently (yield to event loop) in `app/page.tsx`
- [ ] T032 [US3] Add user-friendly error messages for decode/detection failures in `app/page.tsx`
- [ ] T033 [P] [US3] Add integration smoke test that processes sample `pipe/` images in `tests/integration/pipeSamples.test.ts`

**Checkpoint**: US3 works independently with meaningful status feedback.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Tighten accessibility, performance, and documentation.

- [ ] T034 [P] Add accessibility labels/keyboard support for file input and action buttons in `app/(components)/ImagePicker.tsx`
- [ ] T035 [P] Add basic empty-state and error-state copy in `app/page.tsx`
- [ ] T036 Performance pass: downscale large images before detection (if needed) in `src/utils/imageDecoding.ts`
- [ ] T037 [P] Update quickstart docs if commands/config differ in `specs/001-image-processing-ui/quickstart.md`
- [ ] T038 Validate static export output includes OpenCV assets (`public/opencv/*`) by running `npm run build` and verifying assets exist in `out/opencv/`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → Foundational (Phase 2) → User Stories (Phase 3+)
- User Stories can proceed in priority order (P1 → P2 → P3); P2/P3 require the same foundation but can be worked on after Phase 2.

### User Story Dependencies

- US1 is the MVP and blocks nothing else.
- US2 depends on shared state shape from Phase 2 and should not require detection correctness.
- US3 depends on the processing loop/status fields and can build on US1.

### Dependency Graph (story completion order)

- Phase 1 → Phase 2 → US1 → (US2, US3) → Polish

---

## Parallel Opportunities

### Setup / Foundational

- Parallel after T001: T002, T003, T004, T005 can run together.
- In Phase 2: T009 and T012 can run in parallel with T007/T008.

### User Story 1

- Parallel components: T017, T018, T019 can be built in parallel.
- Parallel tests: T015 and T016 can be written in parallel after T014.

### User Story 2

- Parallel UI tasks: T025 and T027 can be built in parallel.

### User Story 3

- T033 can be prepared in parallel once the contract and sample images exist.

---

## Parallel Example: User Story 1

```bash
# In parallel:
Task: "T017 Implement ImagePicker component in app/(components)/ImagePicker.tsx"
Task: "T018 Implement BeforeAfterPreview component in app/(components)/BeforeAfterPreview.tsx"
Task: "T019 Implement ImageResultCard component in app/(components)/ImageResultCard.tsx"

# In parallel (after T014 sets up Vitest):
Task: "T015 Add unit tests for BoundingBox validation/clamping helpers in tests/unit/boundingBox.test.ts"
Task: "T016 Add unit tests for detector filtering logic in tests/unit/detectPipeBoundingBoxes.test.ts"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2
2. Implement US1 (end-to-end)
3. Validate with `pipe/pipe_1.jpg`, `pipe/pipe_2.jpg`, `pipe/pipe_3.png`

### Incremental Delivery

- Add US2 (list management)
- Add US3 (progress + error polish)
- Finish with Polish tasks
