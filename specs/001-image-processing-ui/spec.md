# Feature Specification: Image Processing Before/After UI

**Feature Branch**: `001-image-processing-ui`  
**Created**: 2025-12-31  
**Status**: Draft  
**Input**: User description: "Tôi muốn build 1 static web app với chức năng chính là xử lý ảnh, có button sẽ chọn ảnh, nhập vào 1 danh sách file ảnh chọn từ máy tính, sau đó xử lý ảnh và trả về kết quả sau khi xử lý ảnh. UI sẽ có hiển thị before/after của ảnh trước và sau khi sửa."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

Chọn một hoặc nhiều ảnh từ máy tính; hệ thống tự động nhận dạng “ống nước” trong ảnh; và người dùng xem ảnh trước/sau (ảnh sau được chú thích kết quả nhận dạng) cho từng ảnh.

**Why this priority**: Đây là luồng chính tạo ra giá trị (xử lý ảnh + xem kết quả).

**Independent Test**: Có thể kiểm thử đầy đủ bằng cách chọn các ảnh mẫu, bấm xử lý, và xác nhận UI hiển thị before/after cùng trạng thái cho từng ảnh.

**Acceptance Scenarios**:

1. **Given** người dùng đang ở trang chính và chưa chọn ảnh, **When** người dùng chọn nhiều file ảnh từ máy, **Then** danh sách ảnh được hiển thị và sẵn sàng để xử lý.
2. **Given** danh sách ảnh đã được chọn, **When** việc chọn file kết thúc, **Then** hệ thống tự động xử lý từng ảnh và hiển thị ảnh “Before/After” tương ứng.
3. **Given** có ít nhất một ảnh không hợp lệ/không thể đọc, **When** việc chọn file kết thúc và hệ thống bắt đầu xử lý, **Then** ảnh đó hiển thị lỗi rõ ràng và các ảnh còn lại vẫn được xử lý.
4. **Given** một ảnh có chứa “ống nước” rõ ràng, **When** xử lý hoàn tất, **Then** ảnh “After” hiển thị BoundingBox của ống nước (khung bao/đánh dấu) và kết quả trả về bao gồm toạ độ BoundingBox.
5. **Given** một ảnh không có “ống nước”, **When** xử lý hoàn tất, **Then** ảnh được đánh dấu là “không phát hiện ống nước” (không coi là lỗi hệ thống).

---

### User Story 2 - [Brief Title] (Priority: P2)

Quản lý danh sách ảnh đã chọn (xóa ảnh khỏi danh sách, xóa tất cả) trước khi xử lý hoặc sau khi xem kết quả.

**Why this priority**: Hỗ trợ thao tác thực tế khi người dùng chọn nhầm file hoặc muốn làm lại với danh sách mới.

**Independent Test**: Chọn 3 ảnh, xóa 1 ảnh, xử lý phần còn lại; sau đó xóa tất cả và xác nhận UI trở về trạng thái ban đầu.

**Acceptance Scenarios**:

1. **Given** danh sách có nhiều ảnh, **When** người dùng xóa một ảnh khỏi danh sách, **Then** ảnh đó biến mất khỏi danh sách và không được xử lý.
2. **Given** danh sách có ảnh (đã hoặc chưa xử lý), **When** người dùng chọn “xóa tất cả”, **Then** danh sách và mọi kết quả hiển thị được dọn sạch.

---

### User Story 3 - [Brief Title] (Priority: P3)

Theo dõi tiến trình xử lý và nhận phản hồi thân thiện khi đang xử lý hoặc khi gặp lỗi.

**Why this priority**: Với danh sách nhiều ảnh, phản hồi trạng thái giúp người dùng tin tưởng hệ thống và giảm thao tác nhầm.

**Independent Test**: Chọn nhiều ảnh và bấm xử lý; xác nhận UI hiển thị trạng thái “đang xử lý/hoàn tất/lỗi” theo từng ảnh và/hoặc toàn bộ.

**Acceptance Scenarios**:

1. **Given** danh sách có nhiều ảnh, **When** việc chọn file kết thúc và hệ thống bắt đầu xử lý, **Then** UI hiển thị trạng thái xử lý (theo ảnh và/hoặc tổng thể) cho đến khi hoàn tất.
2. **Given** hệ thống đang xử lý, **When** có lỗi xảy ra ở một ảnh, **Then** lỗi được hiển thị ở đúng ảnh đó và không làm “treo” toàn bộ danh sách.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Người dùng chọn file không phải ảnh hoặc định dạng không hỗ trợ.
- Người dùng chọn ảnh rất lớn dẫn đến xử lý chậm hoặc lỗi bộ nhớ.
- Người dùng chọn lại ảnh lần thứ hai (thay đổi danh sách) sau khi đã có kết quả.
- Người dùng đóng hộp chọn file (cancel) mà không chọn gì.
- Danh sách có nhiều ảnh trùng tên file.
- Ống nước bị nghiêng/không thẳng đứng hoặc bị cắt mất một phần trong khung hình.
- Ống nước bị che khuất (tay, vật thể khác) hoặc nền màu tương tự làm giảm độ tương phản.
- Trong một ảnh có nhiều hơn một ống nước.
- Ống nước bị mờ/loá khiến BoundingBox không ổn định.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST provide a button/control to select one or more image files from the user’s device.
- **FR-002**: System MUST display a list of the selected files (at minimum: filename and a visual preview).
- **FR-003**: System MUST automatically start processing after the user finishes selecting images (no separate “start” action required).
- **FR-004**: System MUST process each selected image and produce a corresponding processed image result.
- **FR-005**: System MUST display a clear before/after comparison for each image (original vs processed).
- **FR-006**: System MUST surface per-image status: not started / processing / completed / failed.
- **FR-007**: System MUST allow users to remove an image from the list before processing, and it MUST not be processed afterward.
- **FR-008**: System MUST allow users to clear the entire selection and results.
- **FR-009**: System MUST handle unsupported or unreadable files by showing an error message associated with that file while continuing to process other valid images.
- **FR-010**: System MUST NOT upload selected images to any remote server by default.
- **FR-011**: System MUST apply a single, predefined image-processing pipeline with no user-selectable processing modes.
- **FR-012**: The pipeline MUST detect water-pipe objects in an image based on the product definition of a “pipe”:
  - A vertical cylindrical pipe
  - Distinctive orange color
  - An internal measurement scale area showing levels from -15 to 5 cm (white background with black border and black tick marks)
  - (Optionally present in the image) a pipeNumber marking
- **FR-013**: For each detected pipe, the system MUST produce an annotated “After” image that visually indicates the detected pipe region.
- **FR-014**: For each detected pipe, the system MUST return the BoundingBox coordinates in the processing result.
- **FR-015**: The BoundingBox MUST be drawn/overlaid on the “After” image.
- **FR-016**: If no pipe is detected in an image, the system MUST mark the result as “no pipe detected” and still show the before/after view (after may be unchanged or minimally annotated to reflect the outcome).
- **FR-017**: If multiple pipes are detected in one image, the system MUST report results for each detected pipe (each with its own BoundingBox).

### Key Entities *(include if feature involves data)*

- **Selected Image**: A user-chosen image file with attributes like name, type, size, and an original preview.
- **Processed Image Result**: The processed output associated 1:1 with a Selected Image, including a processed preview.
- **Processing Status**: Per-image state (not started / processing / completed / failed) and optional error detail.
- **Detected Pipe**: A pipe instance found in an image, including a visual region and extracted fields.
- **BoundingBox**: A rectangle describing the detected pipe region (coordinates and dimensions).

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Users can select multiple images and see processing start automatically in under 30 seconds without guidance.
- **SC-002**: For a batch of 10 typical photos, at least 95% of runs complete processing with visible results without requiring a page refresh.
- **SC-003**: Task completion rate (select → process → view before/after for at least one image) is at least 90% in a basic usability test.
- **SC-004**: When an unsupported/corrupted file is included, the user still obtains results for the remaining valid images in at least 95% of attempts.
- **SC-005**: On a labeled validation set of pipe images, at least 90% of images that contain a clearly visible pipe are correctly marked as “pipe detected”.


## Assumptions

- The app is a static web app and runs fully in the browser.
- Selected images are processed locally on the user’s device and are not transmitted.
- Supported input types will include common image formats (e.g., JPEG/PNG/WebP), unless restricted later.
- The primary object of interest is the orange vertical pipe described above (“ống nước”).
- Images may contain 0, 1, or multiple pipes; the system reports what it finds.

## Out of Scope

- User accounts, authentication, or cloud storage.
- Editing tools beyond the defined “processing” behavior.
- Sharing/publishing processed images.
- Editing the detected values manually inside the app.

## Dependencies

- Browser capabilities to load and render local image files.
