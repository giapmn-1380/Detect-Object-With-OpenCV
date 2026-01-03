# Quickstart: 002-pipe-bbox-detection

## Yêu cầu

- Node.js (khuyến nghị bản LTS)
- Trình duyệt có hỗ trợ WebAssembly

## Chạy local (dev)

1. Cài dependency:
   - `npm install`
2. Chạy dev server:
   - `npm run dev`
3. Mở web app và chọn ảnh để chạy detect.

## Chạy test

- `npm test`

## Build

- `npm run build`

Ghi chú:

- Ứng dụng chạy theo hướng static-first, xử lý OpenCV.js phía client.
- OpenCV assets nằm trong `public/opencv/` (đảm bảo được include trong output build).
