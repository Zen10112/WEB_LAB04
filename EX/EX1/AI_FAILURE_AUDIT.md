# AI Failure Audit — Lab 4, Exercise 1

Ba lỗi dưới đây đã được tái hiện bằng test trước khi sửa. Các commit và lệnh kiểm tra được ghi lại để có thể đối chiếu với mã nguồn. Chạy các lệnh `npm test` từ thư mục `EX/EX1`.

## 1. PersonDetail render thêm một lần sau khi tải xong

- **Hiện tượng:** Test đếm số lần render nhận được 2 lần thay vì 1 trong cùng một lượt tải hồ sơ.
- **Nguyên nhân:** Khi Suspense hiển thị chi tiết, `DetailStatus` cập nhật trạng thái để thông báo đã tải. Lần render tiếp theo của `App` tạo lại phần tử JSX của `PersonDetail` dù props không đổi.
- **Cách sửa:** Giữ cùng phần tử JSX khi chỉ có trạng thái thông báo thay đổi. Sau khi hỗ trợ nhiều hồ sơ, `App` dùng `useMemo` theo prop `person` để phần tử chỉ được tạo lại khi hồ sơ thay đổi.
- **Kiểm chứng:** `npm test -- src/test/loading-resiliency.test.jsx` kiểm tra một lần gọi render của component thật sau khi mở khóa dynamic import. Commit sửa ban đầu: `81c3e12`.

## 2. Sidebar đánh dấu nhầm hồ sơ với ID sai chữ hoa/thường

- **Hiện tượng:** Mở `/people/MINH-ANH` thấy thông báo không tìm thấy người, nhưng link Nguyễn Minh Anh vẫn có `aria-current="page"` và nhãn “Đang xem”.
- **Nguyên nhân:** Phép tra cứu hồ sơ phân biệt chữ hoa và chữ thường. `NavLink` mặc định so khớp URL không phân biệt chữ hoa và chữ thường, khiến vùng chi tiết và sidebar cho hai kết quả khác nhau.
- **Cách sửa:** Dùng chung `findPersonByRouteId` để xác định hồ sơ và bật `caseSensitive` cho các link trong sidebar. Với hồ sơ hợp lệ, link đang chọn dùng đúng pathname hiện tại để vẫn đánh dấu được URL dạng số hoặc URL đã mã hóa.
- **Kiểm chứng:** `npm test -- src/test/people-detail-route.test.jsx` xác nhận URL sai hiển thị 404 và không có link hồ sơ nào mang `aria-current`. Các URL hợp lệ vẫn đánh dấu đúng link. Commit sửa: `91aa162`.

## 3. Callback submit có thể làm đổi dữ liệu form và JSON đã gửi

- **Hiện tượng:** Test để callback `onSubmit` đổi email từ `minh@example.test` sang `changed@example.test`. Trước khi sửa, chính ô email và dữ liệu dùng cho inspector cũng bị đổi.
- **Nguyên nhân:** Callback nhận cùng đối tượng `values` mà Context và inspector sử dụng. Kiểu `Readonly` kiểm tra ở TypeScript nhưng không ngăn một callback JavaScript thay đổi đối tượng khi chạy.
- **Cách sửa:** Truyền bản sao `{ ...values }` cho callback. Form và inspector giữ dữ liệu gốc của lần submit hợp lệ. Bản sao nông là đủ vì hai trường đều là chuỗi.
- **Kiểm chứng:** `npm test -- src/test/form-submission.test.jsx` xác nhận callback vẫn được gọi, còn ô nhập và JSON đều giữ email gốc. Commit sửa: `adff683`.

## Kết quả kiểm tra

Chạy lại toàn bộ `npm test` khi lập audit. Kết quả: **37/37 test pass**, gồm cả ba test hồi quy trên. Không có bằng chứng về API không tồn tại hoặc vòng lặp effect trong các ca được ghi ở đây.
