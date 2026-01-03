# Data Model: 002-pipe-bbox-detection

> Mục tiêu: Mô tả các thực thể và quan hệ phục vụ feature “phát hiện ống và trả về tối đa 1 BoundingBox”.

## Entities

### Frame

- **Ý nghĩa**: Ảnh đầu vào cần phân tích.
- **Fields**:
  - `width`: number
  - `height`: number
  - `pixels`: (không ràng buộc ở mức contract; có thể là ImageData hoặc tương đương)

### BoundingBox

- **Ý nghĩa**: Hình chữ nhật bao đối tượng trong hệ toạ độ của frame.
- **Fields**:
  - `x`: number (≥ 0)
  - `y`: number (≥ 0)
  - `width`: number (> 0)
  - `height`: number (> 0)
- **Validation rules**:
  - BB phải nằm trong frame (có thể clamp để đảm bảo).

### Candidate

- **Ý nghĩa**: Một vùng ứng viên “giống ống” được tạo ra từ contour.
- **Fields**:
  - `boundingBox`: BoundingBox
  - `area`: number (diện tích contour)
  - `aspectRatio`: number (= height/width)
  - `convexityScore`: number (ví dụ solidity = contourArea / hullArea)

### DetectionRules

- **Ý nghĩa**: Bộ luật lọc ứng viên.
- **Fields (defaults theo spec)**:
  - `minAreaRatio`: 0.01 (1% diện tích frame)
  - `minAspectRatio`: 1.2
  - `maxAspectRatio`: 2.2
  - `minConvexityScore`: 0.90

### DetectionResult

- **Ý nghĩa**: Kết quả detect trả về cho 1 frame.
- **Fields**:
  - `status`: one of `completed | no_pipe_detected | failed`
  - `boxes`: BoundingBox[] (tối đa 1 phần tử)
  - `errorMessage`: string | null

## Relationships

- `Frame` → tạo ra nhiều `Candidate`.
- `DetectionRules` → được áp dụng để lọc `Candidate`.
- Tập `Candidate` sau lọc → chọn 1 candidate “lớn nhất” → `DetectionResult.boxes[0]`.

## State transitions

- Nếu detect thành công và có candidate hợp lệ: `status = completed`, `boxes.length = 1`.
- Nếu detect thành công nhưng không có candidate hợp lệ: `status = no_pipe_detected`, `boxes.length = 0`.
- Nếu có lỗi trong quá trình xử lý: `status = failed`, `boxes.length = 0`, `errorMessage != null`.
