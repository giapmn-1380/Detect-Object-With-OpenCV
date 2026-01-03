# Research: 002-pipe-bbox-detection

## Mục tiêu nghiên cứu

- Chốt hướng tiếp cận phát hiện BoundingBox của ống theo đặc tả (tối đa 1 BB, chọn ống lớn nhất).
- Chọn cách tính “convexity score” phù hợp trong OpenCV.js.
- Đảm bảo giải pháp phù hợp static-first và chạy tốt trong trình duyệt.

## Quyết định

### Decision 1 — Pipeline detect dựa trên biên/contour thay vì dựa màu

- **Decision**: Dùng pipeline: grayscale → Gaussian blur (5x5) → Canny → findContours → lọc (area/aspect/convexity) → chọn BB lớn nhất.
- **Rationale**:
  - Ít phụ thuộc vào màu sắc/ánh sáng hơn so với HSV thresholding (có thể fail khi màu pipe thay đổi hoặc ánh sáng mạnh).
  - Canny + contour phù hợp khi mục tiêu có biên rõ ràng.
  - Dễ bổ sung các bộ lọc hình học (tỷ lệ khung, độ lồi) để giảm false positive.
- **Alternatives considered**:
  - HSV thresholding + morphology (cách hiện tại trong code): đơn giản nhưng phụ thuộc màu.
  - Hough Lines / Hough Rectangles: có thể kém ổn định với nhiễu và đòi hỏi tuning nhiều.

### Decision 2 — Cách tính “convexity score”

- **Decision**: Dùng **solidity** làm proxy cho convexity: `solidity = contourArea / convexHullArea`.
- **Rationale**:
  - Có thể tính trực tiếp bằng OpenCV.js thông qua `cv.convexHull` (tạo hull) và `cv.contourArea`.
  - Cho phép đặt ngưỡng dạng số liên tục (phù hợp FR-006: mặc định ≥ 0.90).
- **Alternatives considered**:
  - `cv.isContourConvex`: chỉ trả boolean, không có “điểm số” nên khó tuning theo ngưỡng.
  - Tính convexity defects: phức tạp hơn, ít cần thiết cho mục tiêu MVP.

### Decision 3 — Ngưỡng diện tích theo % frame

- **Decision**: Dùng ngưỡng diện tích tối thiểu = 1% tổng diện tích frame.
- **Rationale**:
  - Ổn định hơn so với ngưỡng pixel tuyệt đối (ảnh có nhiều độ phân giải khác nhau).
  - Phù hợp FR-004.
- **Alternatives considered**:
  - Ngưỡng pixel cố định (ví dụ 500px): dễ sai khi ảnh to/nhỏ.

### Decision 4 — Chỉ trả về 1 BoundingBox

- **Decision**: Sau khi lọc candidates, luôn chọn **candidate có diện tích BB lớn nhất** và trả về 0..1 BB.
- **Rationale**:
  - Phù hợp FR-002/FR-003 và yêu cầu “Detect 1 ống lớn nhất thôi”.
  - Kết quả đơn giản cho UI và downstream.
- **Alternatives considered**:
  - Trả về nhiều BB: không đúng scope feature này.

## Ghi chú về hiệu năng & độ ổn định

- Ưu tiên dùng `cv.RETR_EXTERNAL` để chỉ lấy contour ngoài cùng (giảm số contour và tăng tốc).
- Cần đảm bảo giải phóng `cv.Mat` / `cv.MatVector` để tránh memory leak trong WASM.
- Có thể cân nhắc resize ảnh xuống (nếu cần) để đáp ứng SC-003, nhưng chưa đưa vào scope bắt buộc (chỉ là phương án tối ưu nếu cần sau).
