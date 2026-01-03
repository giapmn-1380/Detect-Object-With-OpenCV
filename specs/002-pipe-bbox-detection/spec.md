# Đặc tả tính năng: Phát hiện Bounding Box của ống (chỉ lấy ống lớn nhất)

**Feature Branch**: `002-pipe-bbox-detection`  
**Created**: 2025-12-31  
**Status**: Draft  
**Input**: User description: "Tối ưu thuật toán detect pipe để tìm BoundingBox: grayscale -> Gaussian blur 5x5 -> Canny -> findContours -> lọc theo area/aspect ratio/convexity -> lấy 1 ống lớn nhất"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trả về BB của ống lớn nhất (Priority: P1)

Là người dùng, tôi muốn hệ thống trả về chính xác một bounding box cho đối tượng giống “ống” nổi bật nhất trong một frame, để tôi có thể tập trung vào ống chính mà không bị nhiễu.

**Vì sao ưu tiên này**: Đây là giá trị cốt lõi của tính năng; các cải tiến khác chỉ mang tính hỗ trợ.

**Kiểm thử độc lập**: Cung cấp một frame có một ống rõ ràng; kiểm tra hệ thống trả về đúng một bounding box bao phủ sát ống.

**Kịch bản chấp nhận (Acceptance Scenarios)**:

1. **Given** một frame có một đối tượng giống ống nhìn thấy rõ ràng, **When** frame được phân tích, **Then** hệ thống trả về chính xác một bounding box khớp với đối tượng giống ống.
2. **Given** một frame có nhiều đối tượng giống ống, **When** frame được phân tích, **Then** hệ thống trả về chính xác một bounding box tương ứng với đối tượng giống ống có kích thước lớn nhất (theo diện tích).

---

### User Story 2 - Tránh nhận nhầm do nhiễu/đối tượng nhỏ (Priority: P2)

Là người dùng, tôi muốn các hình dạng nhỏ hoặc nhiễu bị bỏ qua, để hệ thống không nhận nhầm các chi tiết lặt vặt thành ống.

**Vì sao ưu tiên này**: Giảm kết quả sai và tăng độ tin cậy của phát hiện.

**Kiểm thử độc lập**: Cung cấp một frame có nhiều cạnh/texture nhỏ nhưng không có ống; kiểm tra hệ thống không trả về bounding box.

**Kịch bản chấp nhận (Acceptance Scenarios)**:

1. **Given** một frame không có đối tượng giống ống nhưng có nền nhiều texture/nhiễu, **When** frame được phân tích, **Then** hệ thống không trả về bounding box.
2. **Given** một frame có các mảnh “giống ống” nhỏ chiếm một phần rất nhỏ của ảnh, **When** frame được phân tích, **Then** hệ thống không trả về bounding box.

---

### User Story 3 - Hành vi “không có kết quả” rõ ràng, dự đoán được (Priority: P3)

Là người dùng, tôi muốn hệ thống có hành vi nhất quán khi không thể tìm thấy ống, để các bước xử lý phía sau có thể dựa vào kết quả một cách chắc chắn.

**Vì sao ưu tiên này**: Giúp tích hợp an toàn; tránh trả về kết quả mơ hồ.

**Kiểm thử độc lập**: Cung cấp một frame trống/blank; kiểm tra kết quả rỗng và không có toạ độ không hợp lệ.

**Kịch bản chấp nhận (Acceptance Scenarios)**:

1. **Given** một frame không chứa đối tượng giống ống, **When** frame được phân tích, **Then** hệ thống trả về kết quả rỗng (không có bounding box).

### Edge Cases

- Không tìm thấy contour/candidate nào (ví dụ: tương phản thấp hoặc ảnh trống).
- Nhiều candidate thoả các tiêu chí “giống ống”; việc chọn theo “diện tích lớn nhất” phải mang tính quyết định (deterministic).
- Ống bị cắt một phần do nằm sát viền ảnh.
- Ống bị che khuất một phần bởi vật thể khác.
- Các vật thể cao (chai, hộp chữ nhật...) có thể bị nhầm là hình dạng giống ống.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST nhận đầu vào là một frame và trả về hoặc (a) chính xác một bounding box cho một đối tượng giống ống được phát hiện, hoặc (b) kết quả rỗng.
- **FR-002**: Hệ thống MUST trả về tối đa một bounding box cho mỗi frame.
- **FR-003**: Khi có nhiều candidate giống ống, hệ thống MUST trả về candidate có diện tích bounding box lớn nhất.
- **FR-004**: Hệ thống MUST bỏ qua candidate có diện tích nhỏ hơn 1% tổng diện tích frame.
- **FR-005**: Hệ thống MUST bỏ qua candidate có tỷ lệ khung (height/width) nằm ngoài khoảng $1.2$ đến $2.2$.
- **FR-006**: Hệ thống MUST bỏ qua candidate có độ lồi (convexity) không đủ theo một điểm số convexity, trong đó ngưỡng chấp nhận mặc định là $\ge 0.90$.
- **FR-007**: Bounding box trả về MUST nằm trong phạm vi frame và MUST có width và height dương.
- **FR-008**: Nếu không có candidate nào thoả các tiêu chí lọc, hệ thống MUST trả về kết quả rỗng.

### Assumptions

- Mục tiêu “giống ống” được kỳ vọng là chủ yếu theo phương dọc trong frame, và bounding box trục-aligned là đủ cho nhu cầu sử dụng phía sau.
- Các tiêu chí lọc mặc định phản ánh use case hiện tại:
	- Kích thước tối thiểu của candidate là 1% diện tích frame.
	- Khoảng tỷ lệ khung kỳ vọng là $1.2$ đến $2.2$.
	- Điểm số convexity tối thiểu là $\ge 0.90$.
- Để kiểm chứng các tiêu chí thành công liên quan đến độ chính xác (SC-001/SC-002), có sẵn một bộ dữ liệu gán nhãn (bao gồm ground-truth bounding box của ống lớn nhất và các ảnh không có ống).

### Key Entities *(include if feature involves data)*

- **Frame**: Một ảnh đơn cần phân tích; bao gồm chiều rộng và chiều cao.
- **BoundingBox**: Một hình chữ nhật được định nghĩa bởi x, y, width, height theo hệ toạ độ của frame.
- **Candidate**: Một vùng ứng viên giống ống được suy ra từ frame và được đánh giá theo các tiêu chí lọc.
- **Detection Rules**: Tập các ràng buộc dùng để xác định candidate có “giống ống” hay không (ngưỡng diện tích, khoảng tỷ lệ khung, ngưỡng độ lồi).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trên một bộ test được gán nhãn tối thiểu 100 frame, hệ thống xác định đúng đối tượng giống ống lớn nhất trong ít nhất 90% số frame có ống.
- **SC-002**: Trên một bộ test tối thiểu 100 frame không có ống, hệ thống không tạo bounding box trong ít nhất 95% số frame.
- **SC-003**: Người dùng nhận được kết quả (một bounding box hoặc “không có kết quả”) trong vòng 500 ms sau khi cung cấp một frame có kích thước ảnh “thông thường”.
- **SC-004**: Với các frame có nhiều đối tượng giống ống, việc chọn “lớn nhất” của hệ thống là nhất quán giữa các lần chạy (không bị thay đổi ngẫu nhiên).
