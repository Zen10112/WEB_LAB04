# Lab 4 — Exercise 1.3

Biểu mẫu liên hệ dùng React 19 và Context. `FormProvider` lưu giá trị nhập, còn lỗi và trạng thái hợp lệ được tính đồng bộ từ giá trị hiện tại. `ShowData` hiển thị JSON của lần gửi hợp lệ gần nhất.

## Chạy từ thư mục gốc của repo

```sh
cd "EX/EX1.3"
npm ci
npm run dev
```

Mở địa chỉ Vite in trong terminal, rồi chọn **Mở biểu mẫu liên hệ** hoặc truy cập `/form`.

1. Nhập họ tên có ít nhất 2 ký tự và email hợp lệ.
2. Chọn **Gửi thông tin** hoặc nhấn **Enter**. Nếu có lỗi, focus chuyển đến ô lỗi đầu tiên.
3. Sửa dữ liệu và quan sát JSON giữ nguyên cho đến lần gửi hợp lệ tiếp theo.

## Kiểm thử

```sh
npm test
npm run build
```

Vitest kiểm tra Context, validation, thông báo lỗi, submit, JSON và chuyển route. Xem lỗi đã ghi nhận và cách kiểm chứng trong [AI_FAILURE_AUDIT.md](./AI_FAILURE_AUDIT.md).
