# AI Failure Audit — Lab 4, EX1.1 AND 1.2

Hai lỗi dưới đây đã được tái hiện bằng test trước khi sửa. Chạy lệnh kiểm chứng từ thư mục `EX/EX1.1 AND 1.2`.

## PersonDetail render thêm một lần sau khi tải xong

- **Hiện tượng:** Test đếm số lần render nhận được 2 lần thay vì 1 trong cùng một lượt tải hồ sơ.
- **Nguyên nhân:** Khi Suspense hiển thị chi tiết, `DetailStatus` cập nhật trạng thái để thông báo đã tải. Lần render tiếp theo của `App` tạo lại phần tử JSX của `PersonDetail` dù props không đổi.
- **Cách sửa:** Giữ cùng phần tử JSX khi chỉ có trạng thái thông báo thay đổi. Sau khi hỗ trợ nhiều hồ sơ, `App` dùng `useMemo` theo prop `person` để phần tử chỉ được tạo lại khi hồ sơ thay đổi.
- **Kiểm chứng:** `npm test -- src/test/loading-resiliency.test.jsx` kiểm tra một lần gọi render của component thật sau khi mở khóa dynamic import. Commit sửa ban đầu: `81c3e12`.

## Sidebar đánh dấu nhầm hồ sơ với ID sai chữ hoa/thường

- **Hiện tượng:** Mở `/people/MINH-ANH` thấy thông báo không tìm thấy người, nhưng link Nguyễn Minh Anh vẫn có `aria-current="page"` và nhãn “Đang xem”.
- **Nguyên nhân:** Phép tra cứu hồ sơ phân biệt chữ hoa và chữ thường. `NavLink` mặc định so khớp URL không phân biệt chữ hoa và chữ thường, khiến vùng chi tiết và sidebar cho hai kết quả khác nhau.
- **Cách sửa:** Dùng chung `findPersonByRouteId` để xác định hồ sơ và bật `caseSensitive` cho các link trong sidebar. Với hồ sơ hợp lệ, link đang chọn dùng đúng pathname hiện tại để vẫn đánh dấu được URL dạng số hoặc URL đã mã hóa.
- **Kiểm chứng:** `npm test -- src/test/people-detail-route.test.jsx` xác nhận URL sai hiển thị 404 và không có link hồ sơ nào mang `aria-current`. Các URL hợp lệ vẫn đánh dấu đúng link. Commit sửa: `91aa162`.
