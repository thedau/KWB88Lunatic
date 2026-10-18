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

- Chỉ có thể thức Lunatic, mỗi bên 2 preban mỗi round (tổng 4 preban) và 5 pick.
- Hero pick ở round 1–6 nghỉ 1 round: R1 → R3, R2 → R4, R6 → R8. Hero pick từ round 7 nghỉ 2 round: R7 → R10, R8 → R11. Cooldown tính theo round đã pick và tiếp tục qua các cặp BO3; không kéo dài ngược cooldown của các lượt pick trước round 7.
- Slot thứ 3 được bảo vệ ở round 1–14. Round 15 không có protection; có thể postban cả 5 hero của đối thủ bằng cách bấm slot hoặc chọn trong roster.
- Hero pool ghi rõ round đã sử dụng và round được dùng lại. Khi cooldown kết thúc, hero vẫn có thể bị khóa bởi preban.
- Lịch sử chia từng bên với ba nhóm Pick, Ban (hero bị đối thủ loại) và Preban ở các hàng riêng. Lịch sử round hiện tại xuất hiện sau khi ghi nhận người thắng, kể cả round 15.
- Kết quả từng cặp đấu in đậm và highlight tên người thắng.
- Preban dùng nền, viền và highlight đỏ; tên hero luôn hiển thị.
- Chữ lớn hơn, độ tương phản cao hơn, tên hero xuống dòng trên màn hình nhỏ.
- Đồng hồ hiển thị thời gian thực từ lúc bắt đầu round, reset khi chuyển round.
