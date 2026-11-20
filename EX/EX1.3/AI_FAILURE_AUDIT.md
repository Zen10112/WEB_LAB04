# AI Failure Audit — Lab 4, EX1.3

Lỗi dưới đây đã được tái hiện bằng test trước khi sửa. Commit sửa thuộc giai đoạn form còn nằm trong `EX/EX1`. Chạy lệnh kiểm chứng từ thư mục `EX/EX1.3`.

## Callback submit có thể làm đổi dữ liệu form và JSON đã gửi

- **Hiện tượng:** Test để callback `onSubmit` đổi email từ `minh@example.test` sang `changed@example.test`. Trước khi sửa, chính ô email và dữ liệu dùng cho inspector cũng bị đổi.
- **Nguyên nhân:** Callback nhận cùng đối tượng `values` mà Context và inspector sử dụng. Kiểu `Readonly` kiểm tra ở TypeScript nhưng không ngăn một callback JavaScript thay đổi đối tượng khi chạy.
- **Cách sửa:** Truyền bản sao `{ ...values }` cho callback. Form và inspector giữ dữ liệu gốc của lần submit hợp lệ. Bản sao nông là đủ vì hai trường đều là chuỗi.
- **Kiểm chứng:** `npm test -- src/test/form-submission.test.jsx` xác nhận callback vẫn được gọi, còn ô nhập và JSON đều giữ email gốc. Commit sửa: `adff683`.
