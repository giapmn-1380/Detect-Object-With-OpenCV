---

description: "Task list for feature implementation"
---

# Tasks: 002-pipe-bbox-detection — Tối ưu phát hiện Bounding Box của ống (lấy ống lớn nhất)

**Input**: Design documents from `/specs/002-pipe-bbox-detection/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Spec không bắt buộc TDD, nhưng repo constitution yêu cầu có test cho logic không-trivial ⇒ có bao gồm các task test (unit) để bảo vệ hành vi lọc/đánh giá.

**Organization**: Tasks được nhóm theo user story để mỗi story có thể triển khai và kiểm thử độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể làm song song (khác file, không phụ thuộc)
- **[Story]**: User story mà task thuộc về ([US1], [US2], [US3])
- Mỗi task có mô tả + **đường dẫn file cụ thể**

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Xác nhận baseline project và tài liệu chạy/kiểm thử

- [x] T001 Validate quickstart commands và cập nhật nếu cần trong specs/002-pipe-bbox-detection/quickstart.md
- [x] T002 [P] Đồng bộ contract "boxes tối đa 1 phần tử" giữa docs và helper types trong src/domain/detection-contract.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Các mảnh ghép nền tảng dùng chung cho tất cả user stories

- [x] T003 Tạo bộ cấu hình/threshold cho pipe detection trong src/opencv/pipeDetectionRules.ts (minAreaRatio=0.01, aspect 1.2–2.2, minConvexity=0.90, blurKernel=5x5, canny thresholds)
- [x] T004 [P] Tạo pure helper để tính metric + lọc candidate trong src/opencv/pipeCandidateFilter.ts (aspectRatio, bboxArea, solidity, chọn BB lớn nhất)
- [x] T005 [P] Tạo unit tests cho helper/filter trong tests/unit/pipeCandidateFilter.test.ts
- [x] T006 Refactor tests hiện tại để không duplicate constant (import từ src/opencv/pipeDetectionRules.ts) trong tests/unit/detectPipeBoundingBoxes.test.ts

**Checkpoint**: Foundation ready — bắt đầu user stories

---

## Phase 3: User Story 1 — Trả về BB của ống lớn nhất (Priority: P1) 🎯 MVP

**Goal**: Pipeline phát hiện dựa trên contour/edge và **chỉ trả về 0..1 BoundingBox** (chọn lớn nhất nếu có nhiều candidates)

**Independent Test**: Dùng 1 ảnh có 1 ống rõ ràng, kết quả trả về đúng 1 BB bao phủ sát ống; với ảnh có nhiều ống, chỉ trả về BB của ống lớn nhất.

### Tests for User Story 1

- [x] T007 [P] [US1] Thêm test cho việc "luôn trả về tối đa 1 BB (largest-only)" trong tests/unit/pipeCandidateFilter.test.ts
- [x] T008 [P] [US1] Thêm test cho lọc aspect ratio trong khoảng 1.2–2.2 trong tests/unit/pipeCandidateFilter.test.ts

### Implementation for User Story 1

- [x] T009 [US1] Refactor pipeline detect theo spec (grayscale → Gaussian blur 5x5 → Canny → findContours) trong src/opencv/detectPipeBoundingBoxes.ts
- [x] T010 [US1] Áp dụng lọc aspect ratio + chọn BB lớn nhất và chỉ trả về 0..1 BB trong src/opencv/detectPipeBoundingBoxes.ts
- [x] T011 [US1] Clamp & validate BB trước khi trả về (dùng clampBoundingBox/isValidBoundingBox) trong src/domain/detection-contract.ts và gọi từ src/opencv/detectPipeBoundingBoxes.ts

**Checkpoint**: US1 chạy được và cho kết quả largest-only

---

## Phase 4: User Story 2 — Tránh nhận nhầm do nhiễu/đối tượng nhỏ (Priority: P2)

**Goal**: Giảm false positive bằng lọc theo diện tích tương đối và độ lồi (convexity/solidity)

**Independent Test**: Dùng ảnh không có ống (nhiễu/texture), kết quả không trả BB; các mảnh nhỏ bị loại.

### Tests for User Story 2

- [x] T012 [P] [US2] Thêm test lọc min area ratio = 1% frame area trong tests/unit/pipeCandidateFilter.test.ts
- [x] T013 [P] [US2] Thêm test lọc convexity/solidity (ngưỡng ≥ 0.90) trong tests/unit/pipeCandidateFilter.test.ts

### Implementation for User Story 2

- [x] T014 [US2] Implement lọc diện tích tương đối (minAreaRatio) trong src/opencv/pipeCandidateFilter.ts và truyền frameArea từ src/opencv/detectPipeBoundingBoxes.ts
- [x] T015 [US2] Tính solidity (contourArea / convexHullArea) và lọc theo minConvexityScore trong src/opencv/detectPipeBoundingBoxes.ts

**Checkpoint**: US2 giảm false positive trên ảnh nhiễu/đối tượng nhỏ

---

## Phase 5: User Story 3 — Hành vi “không có kết quả” rõ ràng, dự đoán được (Priority: P3)

**Goal**: Chuẩn hoá status/no-result và làm chắc chắn error handling

**Independent Test**: Dùng ảnh trống/blank hoặc không có ống, kết quả phải là `no_pipe_detected` và `boxes=[]` (không có toạ độ không hợp lệ).

### Tests for User Story 3

- [x] T016 [P] [US3] Thêm test: empty candidates ⇒ status `no_pipe_detected` và boxes rỗng trong tests/unit/detectPipeBoundingBoxes.test.ts
- [x] T017 [P] [US3] Thêm test: clamp + validate đảm bảo width/height > 0 trong tests/unit/boundingBox.test.ts

### Implementation for User Story 3

- [x] T018 [US3] Chuẩn hoá status output (không trả `completed` khi boxes rỗng; không trả quá 1 box) trong src/opencv/detectPipeBoundingBoxes.ts
- [x] T019 [US3] Làm chắc chắn cleanup Mat/MatVector trong mọi path (success/no-result/error) trong src/opencv/detectPipeBoundingBoxes.ts
- [x] T020 [US3] Chuẩn hoá error message và status `failed` khi gặp exception trong src/opencv/detectPipeBoundingBoxes.ts

**Checkpoint**: US3 predictable, an toàn cho downstream

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Dọn dẹp, đảm bảo build/test xanh, và cập nhật docs

- [x] T021 [P] Xoá/cleanup code HSV thresholding cũ (hằng số ORANGE_HSV_*) sau khi pipeline mới ổn định trong src/opencv/detectPipeBoundingBoxes.ts
- [x] T022 [P] Cập nhật mô tả/ghi chú trong specs/002-pipe-bbox-detection/quickstart.md nếu có thay đổi hành vi/threshold
- [x] T023 Chạy `npm test` và fix các test fail liên quan trong tests/unit/
- [x] T024 Chạy `npm run build` để đảm bảo build vẫn pass (tham chiếu package.json)

---

## Dependencies & Execution Order

### Dependency Graph (story completion order)

```text
Phase 1 (Setup)
	↓
Phase 2 (Foundational)
	↓
US1 (P1: Largest-only BB)
	↓
US2 (P2: Reduce false positives)
	↓
US3 (P3: Predictable no-result)
	↓
Phase 6 (Polish)
```

### Phase Dependencies

- Phase 1 (Setup) → Phase 2 (Foundational)
- Phase 2 (Foundational) BLOCKS mọi user story
- Sau Phase 2, triển khai theo thứ tự ưu tiên: US1 → US2 → US3
- Polish phụ thuộc các story mong muốn đã hoàn tất

### User Story Dependencies

- **US1 (P1)**: phụ thuộc Phase 2; không phụ thuộc story khác
- **US2 (P2)**: phụ thuộc US1 (cần pipeline + chọn BB lớn nhất trước)
- **US3 (P3)**: phụ thuộc US1 (output/selection) và có thể chạy song song với một phần US2 (tests/cleanup), nhưng nên hoàn tất sau khi filter core ổn định

---

## Parallel Opportunities

- [P] tasks trong Phase 1/2 có thể chạy song song vì khác file
- Trong mỗi story: các test task [P] có thể viết trước/đồng thời với code thay đổi khác file

## Parallel Example: User Story 1

- Task: "[US1] Thêm test largest-only" trong tests/unit/pipeCandidateFilter.test.ts
- Task: "[US1] Thêm test aspect ratio" trong tests/unit/pipeCandidateFilter.test.ts

---

## Parallel Example: User Story 2

- Task: "[US2] Thêm test min area ratio" trong tests/unit/pipeCandidateFilter.test.ts
- Task: "[US2] Thêm test convexity/solidity" trong tests/unit/pipeCandidateFilter.test.ts

---

## Parallel Example: User Story 3

- Task: "[US3] Thêm test empty ⇒ no_pipe_detected" trong tests/unit/detectPipeBoundingBoxes.test.ts
- Task: "[US3] Thêm test clamp + validate width/height" trong tests/unit/boundingBox.test.ts

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2
2. US1: triển khai pipeline + largest-only
3. Chạy test + kiểm tra độc lập US1
4. Dừng lại để demo/đánh giá chất lượng

### Incremental Delivery

- US1 (MVP) → US2 (giảm false positives) → US3 (no-result + robustness) → Polish
