# Epic Seven Lunatic Draft Lab

Web draft Lunatic cho Epic Seven: 5 cặp đấu BO3, một người điều khiển draft và nhiều người theo dõi trực tiếp.

## Chạy local

Yêu cầu Node.js 22.18+ hoặc 24+.

```bash
npm install
npm run dev
```

Mở URL Vite hiển thị trong terminal. Build production bằng `npm run build`, kiểm tra mã bằng `npm run lint` và kiểm thử dữ liệu đồng bộ bằng `npm test`.

## Draft và spectate trực tiếp

1. Chủ phòng mở website, bấm **Tạo phòng live**.
2. Khi trạng thái hiện **Đang trực tiếp**, bấm **Copy link spectate** và gửi link cho người xem.
3. Người xem mở link trên thiết bị của họ; chỉ chủ phòng có thể sửa tên, pick/ban, chọn lượt đầu, ghi điểm, reset và chuyển round/cặp đấu. Bộ lọc và tìm hero vẫn dùng riêng trên từng thiết bị.
4. Người mới vào nhận ngay toàn bộ trạng thái hiện tại, gồm preban tích lũy, hero bị khóa, điểm và lịch sử các round. Trạng thái kết nối, số spectator và thời điểm nhận dữ liệu hiển thị trong khung live.
5. Chủ phòng bấm **Dừng live** để ngắt phát; draft hiện tại vẫn giữ trong tab. Người xem tự thử kết nối lại nếu mất kết nối và giữ bản cập nhật cuối để tham khảo.

Giữ tab chủ phòng mở. Đóng hoặc tải lại tab kết thúc phòng hiện tại và không lưu draft; cần tạo phòng mới và chia sẻ link mới. Link spectate chỉ cấp quyền xem, không cấp quyền điều khiển draft. Người có link có thể xem tên và diễn biến trận đấu.

## Kết nối

Live dùng WebRTC qua [PeerJS](https://peerjs.com/client/getting-started) và máy chủ báo hiệu PeerJS Cloud, nên chạy được trên GitHub Pages mà không cần cấu hình backend hoặc API key. Trạng thái draft được gửi từ trình duyệt chủ phòng đến các spectator; website không lưu phòng trên server. Cần HTTPS (hoặc localhost), Internet và trình duyệt hỗ trợ WebRTC. Dịch vụ báo hiệu, TURN và chính sách mạng có thể ảnh hưởng kết nối; nếu không vào được, bấm **Kết nối lại**, kiểm tra chủ phòng còn online, hoặc thử mạng khác.

## Giao diện

- Chỉ có thể thức Lunatic, mỗi bên 1 preban và 5 pick, slot thứ 3 được bảo vệ.
- Preban dùng nền, viền và highlight đỏ; tên hero luôn hiển thị.
- Chữ lớn hơn, độ tương phản cao hơn, tên hero xuống dòng trên màn hình nhỏ.
- Đồng hồ hiển thị thời gian thực từ lúc bắt đầu round, reset khi chuyển round.
