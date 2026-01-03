# Kế hoạch triển khai: Tối ưu phát hiện Bounding Box của ống (lấy ống lớn nhất)

**Branch**: `002-pipe-bbox-detection` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-pipe-bbox-detection/spec.md`

**Note**: File này được tạo theo workflow của `/speckit.plan`.

## Summary

Tối ưu thuật toán phát hiện ống để trả về **tối đa 1 BoundingBox** cho mỗi frame (nếu có nhiều ứng viên thì chọn ống lớn nhất), đồng thời giảm false positive bằng các bộ lọc theo diện tích, tỷ lệ khung (H/W) và độ lồi (convexity).

## Technical Context

**Language/Version**: TypeScript 5.9 (Next.js 16)  
**Primary Dependencies**: Next.js (App Router), React, OpenCV.js (WASM build)  
**Storage**: N/A (xử lý in-memory; không có database)  
**Testing**: Vitest (unit tests)  
**Target Platform**: Trình duyệt evergreen hiện đại có hỗ trợ WebAssembly  
**Project Type**: web (static-first; không yêu cầu backend riêng)  
**Performance Goals**: Thời gian detect trong client cho một frame ảnh “thông thường” phù hợp mục tiêu SC-003 (≤ 500 ms)  
**Constraints**: Không upload ảnh mặc định; tránh log dữ liệu ảnh; ưu tiên chạy phía client; không làm block initial render  
**Scale/Scope**: Cải tiến thuật toán trong `src/opencv/detectPipeBoundingBoxes.ts` và cập nhật test liên quan

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Static-first: PASS (thuật toán chạy client-side; không yêu cầu backend)
- Simple tooling: PASS (giữ nguyên Next.js + OpenCV.js; không thêm build step tuỳ biến)
- Quality gates: PASS (cập nhật/viết test cho logic lọc BoundingBox)
- Accessibility baseline: PASS (không thay đổi UI trong feature này)
- Security & privacy: PASS (không lưu secret; không upload; tránh log image data)

Post-Phase-1 re-check: PASS (design artifacts được tạo trong `research.md`, `data-model.md`, `contracts/`, `quickstart.md` phù hợp constitution).

## Project Structure

### Documentation (this feature)

```text
specs/002-pipe-bbox-detection/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

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
└── unit/
  ├── boundingBox.test.ts
  └── detectPipeBoundingBoxes.test.ts
```

**Structure Decision**: Single Next.js web application; thuật toán detect tách riêng trong `src/opencv/` và contract/domain types trong `src/domain/` để dễ test.

## Complexity Tracking

Không có constitution violation cần justify cho feature này.

## Phase 0 — Research (Output: research.md)

- Chốt pipeline detect theo spec: grayscale → Gaussian blur (5x5) → Canny → findContours → lọc theo area/aspect/convexity → chọn 1 BB lớn nhất.
- Chốt cách tính “convexity score” trong OpenCV.js (solidity = contourArea / hullArea).
- Chốt các ngưỡng mặc định theo spec và cách cấu hình để dễ tuning trong tương lai.

Xem [research.md](./research.md).

## Phase 1 — Design & Contracts (Outputs: data-model.md, contracts/, quickstart.md)

- Mô hình hoá entity/contract cho kết quả detect (tối đa 1 BoundingBox).
- Định nghĩa JSON schema + ví dụ output.
- Hướng dẫn chạy/test.

Xem [data-model.md](./data-model.md), [quickstart.md](./quickstart.md), và [contracts/](./contracts/).

## Phase 2 — Implementation Plan (no code in this phase)

1. Refactor `detectPipeBoundingBoxes` sang pipeline contour-based theo spec và đảm bảo chỉ trả về 0..1 BB.
2. Thay ngưỡng diện tích cố định bằng ngưỡng tương đối theo % diện tích frame.
3. Thêm tính convexity score (solidity) và lọc theo ngưỡng mặc định.
4. Chuẩn hoá việc clamp BB vào frame và đảm bảo output contract.
5. Update/viết unit tests cho: lọc theo area/aspect/convexity, chọn BB lớn nhất, và case không có kết quả.
