# Lab 4 — Exercises 1.1 và 1.2

Ứng dụng React 19 và React Router v7 minh họa Lazy Loading và điều hướng Master–Detail. Danh bạ giữ sidebar khi đổi hồ sơ. `PersonDetail` được tải bằng `React.lazy()`, với Skeleton trong lúc chờ và thông báo tải cho công nghệ hỗ trợ.

## Chạy từ thư mục gốc của repo

```sh
cd "EX/EX1.1 AND 1.2"
npm ci
npm run dev
```

Mở địa chỉ Vite in trong terminal.

| URL | Nội dung |
| --- | --- |
| `/` | Trang chủ |
| `/people` | Danh bạ và lời nhắc chọn hồ sơ |
| `/people/1` | Hồ sơ Nguyễn Minh Anh |
| `/people/2` | Hồ sơ Trần Bảo Trân |
| `/people/invalid-id` | Trạng thái 404 trong vùng chi tiết |

## Kiểm thử

```sh
npm test
npm run build
```

Vitest kiểm tra trạng thái tải, chunk riêng của `PersonDetail`, nested routes, active link và xử lý ID sai. Xem các lỗi đã ghi nhận và cách kiểm chứng trong [AI_FAILURE_AUDIT.md](./AI_FAILURE_AUDIT.md).
