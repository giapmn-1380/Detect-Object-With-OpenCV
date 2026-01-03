```
"""
Demo Detect Pipe - Phát hiện ống nước sử dụng OpenCV
"""

import cv2
import numpy as np
import os

def load_image(image_path):
    """Đọc ảnh từ đường dẫn"""
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Không thể đọc ảnh: {image_path}")
    return image

def detect_pipe_by_color(image):
    """
    Phát hiện ống nước dựa trên màu sắc cam.
    """
    # Chuyển sang không gian màu HSV
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Màu cam (ống nước cam) - mở rộng dải màu để bắt được nhiều shade hơn
    lower_orange = np.array([5, 80, 80])
    upper_orange = np.array([25, 255, 255])
    
    # Tạo mask cho màu cam
    mask_orange = cv2.inRange(hsv, lower_orange, upper_orange)
    
    return mask_orange

def detect_pipe_by_edge(image):
    """
    Phát hiện ống nước dựa trên edge detection và Hough Lines.
    Ống nước thường có hình dạng thẳng hoặc tròn.
    """
    # Chuyển sang ảnh grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Làm mờ để giảm noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Phát hiện cạnh bằng Canny
    edges = cv2.Canny(blurred, 50, 150)
    
    return edges

def detect_circles(image):
    """
    Phát hiện các hình tròn (đầu ống, mặt cắt ống).
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (9, 9), 2)
    
    # Phát hiện hình tròn bằng Hough Circle Transform
    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=50,
        param1=100,
        param2=30,
        minRadius=10,
        maxRadius=200
    )
    
    return circles

def detect_lines(edges):
    """
    Phát hiện các đường thẳng (thân ống).
    """
    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi/180,
        threshold=50,
        minLineLength=50,
        maxLineGap=10
    )
    
    return lines

def find_contours(mask, dilate_edges=False, image_size=None):
    """
    Tìm contours từ mask.
    
    Args:
        mask: Binary mask hoặc edge image
        dilate_edges: Nếu True, áp dụng dilation cho edges
        image_size: Tuple (width, height) để tính adaptive kernel size
    """
    # Tính adaptive kernel size dựa trên kích thước ảnh
    if dilate_edges and image_size:
        w, h = image_size
        # Kernel nhỏ hơn cho ảnh lớn, lớn hơn cho ảnh nhỏ
        ksize = max(3, min(10, int(min(w, h) / 100)))
        kernel = np.ones((ksize, ksize), np.uint8)
        mask_cleaned = cv2.dilate(mask, kernel, iterations=2)
        mask_cleaned = cv2.morphologyEx(mask_cleaned, cv2.MORPH_CLOSE, kernel)
    elif dilate_edges:
        kernel = np.ones((7, 7), np.uint8)
        mask_cleaned = cv2.dilate(mask, kernel, iterations=2)
        mask_cleaned = cv2.morphologyEx(mask_cleaned, cv2.MORPH_CLOSE, kernel)
    else:
        kernel = np.ones((5, 5), np.uint8)
        mask_cleaned = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask_cleaned = cv2.morphologyEx(mask_cleaned, cv2.MORPH_OPEN, kernel)
    
    # Tìm contours
    contours, _ = cv2.findContours(
        mask_cleaned,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )
    
    return contours, mask_cleaned


def filter_contours_by_shape(contours, aspect_ratio_range=(0.3, 10), min_extent=0.3):
    """
    Lọc contours theo các tiêu chí hình dạng cho ống nước.
    
    Args:
        contours: Danh sách contours
        aspect_ratio_range: Tuple (min, max) tỷ lệ H/W (mở rộng để hỗ trợ ảnh close-up)
        min_extent: Độ chữ nhật tối thiểu (area / bounding_rect_area)
    
    Returns:
        Danh sách contours đã lọc
    """
    filtered = []
    
    for contour in contours:
        area = cv2.contourArea(contour)
        
        # Lọc theo aspect ratio (H/W)
        x, y, w, h = cv2.boundingRect(contour)
        if w == 0 or h == 0:
            continue
        aspect_ratio = h / w
        if not (aspect_ratio_range[0] < aspect_ratio < aspect_ratio_range[1]):
            continue
        
        # Lọc theo extent (độ chữ nhật)
        rect_area = w * h
        extent = area / rect_area if rect_area > 0 else 0
        if extent < min_extent:
            continue
        
        filtered.append(contour)
    
    return filtered


def filter_contours_by_color(contours, color_mask, min_overlap_ratio=0.3):
    """
    Lọc contours dựa trên độ overlap với color mask.
    Trả về contours cùng với overlap ratio để ranking.
    
    Args:
        contours: Danh sách contours từ edge detection
        color_mask: Mask màu cam
        min_overlap_ratio: Tỷ lệ overlap tối thiểu
    
    Returns:
        Danh sách tuples (contour, overlap_ratio) có overlap đủ lớn
    """
    filtered = []
    
    for contour in contours:
        # Tạo mask cho contour hiện tại
        contour_mask = np.zeros(color_mask.shape, dtype=np.uint8)
        cv2.drawContours(contour_mask, [contour], -1, 255, -1)
        
        # Tính overlap giữa contour và color mask
        overlap = cv2.bitwise_and(contour_mask, color_mask)
        overlap_pixels = cv2.countNonZero(overlap)
        
        # Tính diện tích contour
        contour_area = cv2.contourArea(contour)
        if contour_area == 0:
            continue
        
        # Tính tỷ lệ overlap
        overlap_ratio = overlap_pixels / contour_area
        
        if overlap_ratio >= min_overlap_ratio:
            filtered.append((contour, overlap_ratio))
    
    return filtered


def select_best_pipe(contours_with_overlap, image_size):
    """
    Chọn contour tốt nhất dựa trên:
    - Overlap ratio cao (ưu tiên cao nhất)
    - Diện tích phù hợp (không quá lớn, không quá nhỏ)
    - Aspect ratio phù hợp với ống
    
    Args:
        contours_with_overlap: List of (contour, overlap_ratio)
        image_size: Tuple (width, height)
    
    Returns:
        Tuple (x, y, w, h) của bounding box, hoặc None
    """
    if not contours_with_overlap:
        return None
    
    w_img, h_img = image_size
    total_pixels = w_img * h_img
    
    scored_contours = []
    for contour, overlap_ratio in contours_with_overlap:
        area = cv2.contourArea(contour)
        x, y, w, h = cv2.boundingRect(contour)
        
        # Tỷ lệ diện tích so với ảnh
        area_ratio = area / total_pixels
        
        # Bỏ qua contour quá lớn (chiếm > 80% ảnh) - chắc chắn là background
        if area_ratio > 0.8:
            continue
        
        # Bỏ qua contour quá nhỏ (< 0.05% ảnh)
        if area_ratio < 0.0005:
            continue
        
        # Tính aspect ratio
        aspect_ratio = h / w if w > 0 else 0
        
        # Score: ưu tiên overlap cao + diện tích lớn hợp lý
        overlap_score = overlap_ratio  # 0-1
        
        # Area score: ưu tiên diện tích 1-40% của ảnh (ống có thể chiếm diện tích lớn)
        if 0.01 <= area_ratio <= 0.4:
            area_score = 1.0
        elif area_ratio < 0.01:
            area_score = area_ratio / 0.01  # Tăng dần từ 0 đến 1
        else:
            area_score = max(0, 1 - (area_ratio - 0.4) / 0.4)
        
        # Aspect score: ống dọc (1.5-5) hoặc gần vuông (0.8-1.25) đều OK
        if 1.5 <= aspect_ratio <= 5:
            aspect_score = 1.0
        elif 0.8 <= aspect_ratio <= 1.25:
            aspect_score = 0.9  # Close-up thường có aspect gần 1
        elif 0.5 <= aspect_ratio < 1.5:
            aspect_score = 0.7
        elif aspect_ratio > 5:
            aspect_score = 0.8
        else:
            aspect_score = 0.5
        
        # Ưu tiên: overlap 40%, area 40%, aspect 20%
        total_score = 0.4 * overlap_score + 0.4 * area_score + 0.2 * aspect_score
        
        scored_contours.append({
            'contour': contour,
            'bbox': (x, y, w, h),
            'score': total_score,
            'overlap': overlap_ratio,
            'area_ratio': area_ratio,
            'aspect': aspect_ratio
        })
    
    if not scored_contours:
        return None
    
    # Chọn contour có score cao nhất
    best = max(scored_contours, key=lambda x: x['score'])
    
    print(f"  Best pipe: score={best['score']:.2f}, overlap={best['overlap']:.2f}, "
          f"area={best['area_ratio']*100:.1f}%, aspect={best['aspect']:.2f}")
    
    return best['bbox']


def select_largest_pipe(contours):
    """
    Chọn contour lớn nhất và trả về bounding box.
    
    Args:
        contours: Danh sách contours đã lọc
    
    Returns:
        Tuple (x, y, w, h) của bounding box, hoặc None nếu không có
    """
    if not contours:
        return None
    
    # Tìm contour có diện tích lớn nhất
    largest_contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest_contour)
    
    return (x, y, w, h)

def draw_detections(image, bbox=None):
    """
    Vẽ bounding box của ống nước lên ảnh.
    
    Args:
        image: Ảnh gốc
        bbox: Tuple (x, y, w, h) của bounding box
    
    Returns:
        Ảnh với bounding box được vẽ
    """
    result = image.copy()
    
    if bbox is not None:
        x, y, w, h = bbox
        
        # Vẽ bounding box màu xanh lá
        cv2.rectangle(result, (x, y), (x + w, y + h), (0, 255, 0), 3)
        
        # Vẽ label với kích thước
        label = f"Pipe ({w}x{h})"
        
        # Tính vị trí label (phía trên bbox)
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
        label_y = y - 10 if y - 10 > label_size[1] else y + h + label_size[1] + 10
        
        # Vẽ background cho label
        cv2.rectangle(result, 
                     (x, label_y - label_size[1] - 5), 
                     (x + label_size[0] + 10, label_y + 5), 
                     (0, 255, 0), -1)
        
        # Vẽ text
        cv2.putText(result, label, (x + 5, label_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
    
    return result

def process_image(image_path, output_dir="output"):
    """
    Xử lý một ảnh và phát hiện ống nước dọc lớn nhất.
    
    Pipeline:
    1. Thử Edge Detection trước
    2. Nếu không tìm được contour đủ lớn (>1% ảnh), fallback sang Color Mask
    3. Scoring: overlap + area + aspect ratio
    4. Chọn contour có score cao nhất → bounding box
    """
    print(f"\n{'='*50}")
    print(f"Đang xử lý: {image_path}")
    print(f"{'='*50}")
    
    # Tạo thư mục output nếu chưa có
    os.makedirs(output_dir, exist_ok=True)
    
    # Đọc ảnh
    image = load_image(image_path)
    h, w = image.shape[:2]
    image_size = (w, h)
    total_pixels = w * h
    print(f"Kích thước ảnh: {w}x{h}")
    
    # Lấy color mask
    color_mask = detect_pipe_by_color(image)
    
    # Tính edge density
    edges = detect_pipe_by_edge(image)
    edge_density = cv2.countNonZero(edges) / total_pixels
    print(f"Edge density: {edge_density*100:.2f}%")
    
    bbox = None
    method_used = ""
    
    # Nếu edge density quá cao (> 5%), dùng color mask trực tiếp
    if edge_density > 0.05:
        print("→ Edge density cao, sử dụng Color Mask trực tiếp")
        bbox, method_used = try_color_mask_detection(image, color_mask, image_size)
    else:
        # Thử edge detection trước
        print("→ Thử Canny Edge Detection")
        bbox, method_used = try_edge_detection(image, edges, color_mask, image_size)
        
        # Nếu edge detection cho kết quả quá nhỏ (<1% ảnh), thử color mask
        if bbox:
            x, y, bw, bh = bbox
            bbox_area_ratio = (bw * bh) / total_pixels
            if bbox_area_ratio < 0.01:
                print(f"→ Edge detection cho bbox quá nhỏ ({bbox_area_ratio*100:.2f}%), thử Color Mask")
                color_bbox, color_method = try_color_mask_detection(image, color_mask, image_size)
                if color_bbox:
                    cx, cy, cbw, cbh = color_bbox
                    color_area_ratio = (cbw * cbh) / total_pixels
                    if color_area_ratio > bbox_area_ratio:
                        bbox = color_bbox
                        method_used = color_method
        elif not bbox:
            print("→ Edge detection thất bại, thử Color Mask")
            bbox, method_used = try_color_mask_detection(image, color_mask, image_size)
    
    if bbox:
        x, y, bw, bh = bbox
        print(f"✓ Phát hiện ống nước ({method_used}): x={x}, y={y}, w={bw}, h={bh}")
        print(f"  Aspect ratio (H/W): {bh/bw:.2f}")
    else:
        print("✗ Không phát hiện ống nước phù hợp")
    
    # Vẽ kết quả
    result = draw_detections(image, bbox)
    
    # Lưu kết quả
    filename = os.path.basename(image_path)
    name, ext = os.path.splitext(filename)
    
    output_path = os.path.join(output_dir, f"{name}_detected{ext}")
    cv2.imwrite(output_path, result)
    print(f"Đã lưu kết quả: {output_path}")
    
    # Lưu ảnh trung gian
    cv2.imwrite(os.path.join(output_dir, f"{name}_edges.jpg"), edges)
    cv2.imwrite(os.path.join(output_dir, f"{name}_color_mask.jpg"), color_mask)
    
    return result, bbox


def try_edge_detection(image, edges, color_mask, image_size):
    """Thử phát hiện ống bằng edge detection"""
    contours, _ = find_contours(edges, dilate_edges=True, image_size=image_size)
    print(f"Số contours từ edges: {len(contours)}")
    
    # Lọc theo màu cam
    color_filtered = filter_contours_by_color(contours, color_mask, min_overlap_ratio=0.3)
    print(f"Số contours sau lọc màu cam: {len(color_filtered)}")
    
    # Lọc theo hình dạng
    shape_filtered = []
    for contour, overlap in color_filtered:
        area = cv2.contourArea(contour)
        x, y, cw, ch = cv2.boundingRect(contour)
        if cw == 0 or ch == 0:
            continue
        aspect_ratio = ch / cw
        if not (0.3 < aspect_ratio < 10):
            continue
        rect_area = cw * ch
        extent = area / rect_area if rect_area > 0 else 0
        if extent < 0.3:
            continue
        shape_filtered.append((contour, overlap))
    
    print(f"Số contours sau lọc hình dạng: {len(shape_filtered)}")
    
    bbox = select_best_pipe(shape_filtered, image_size)
    return bbox, "edge_detection"


def try_color_mask_detection(image, color_mask, image_size):
    """Thử phát hiện ống bằng color mask trực tiếp"""
    contours, _ = find_contours(color_mask, dilate_edges=False)
    print(f"Số contours từ color mask: {len(contours)}")
    
    # Lọc theo shape
    shape_filtered = filter_contours_by_shape(
        contours,
        aspect_ratio_range=(0.3, 10),
        min_extent=0.3
    )
    print(f"Số contours sau lọc hình dạng: {len(shape_filtered)}")
    
    # Tạo contours_with_overlap với overlap = 1.0
    contours_with_overlap = [(c, 1.0) for c in shape_filtered]
    bbox = select_best_pipe(contours_with_overlap, image_size)
    return bbox, "color_mask"

def main():
    """
    Hàm chính - xử lý tất cả ảnh trong thư mục Pipe.
    """
    print("="*60)
    print("  DEMO DETECT PIPE - Phát hiện ống nước bằng OpenCV")
    print("="*60)
    
    # Đường dẫn đến thư mục chứa ảnh
    pipe_dir = "Pipe"
    output_dir = "output"
    
    # Kiểm tra thư mục Pipe có tồn tại không
    if not os.path.exists(pipe_dir):
        print(f"Lỗi: Không tìm thấy thư mục '{pipe_dir}'")
        return
    
    # Lấy danh sách các file ảnh
    image_extensions = ('.jpg', '.jpeg', '.png', '.bmp')
    image_files = [
        f for f in os.listdir(pipe_dir)
        if f.lower().endswith(image_extensions)
    ]
    
    if not image_files:
        print(f"Không tìm thấy ảnh trong thư mục '{pipe_dir}'")
        return
    
    print(f"\nTìm thấy {len(image_files)} ảnh:")
    for f in image_files:
        print(f"  - {f}")
    
    # Xử lý từng ảnh
    for image_file in image_files:
        image_path = os.path.join(pipe_dir, image_file)
        try:
            process_image(image_path, output_dir)
        except Exception as e:
            print(f"Lỗi khi xử lý {image_file}: {e}")
    
    print("\n" + "="*60)
    print("  HOÀN THÀNH!")
    print(f"  Kết quả được lưu trong thư mục: {output_dir}")
    print("="*60)

if __name__ == "__main__":
    main()
```