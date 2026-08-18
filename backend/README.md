# Job Matching Backend 🚀

Dự án Backend cho hệ thống Job Matching, được xây dựng dựa trên **NestJS**, **Prisma ORM** và CSDL **Microsoft SQL Server**.

## 📌 Yêu cầu hệ thống
- **Node.js** (Phiên bản v20 trở lên)
- **Microsoft SQL Server** (Local hoặc Docker)

---

## 🛠️ Hướng dẫn cài đặt & Khởi chạy

### Bước 1: Cài đặt thư viện
Mở Terminal/Command Prompt trong thư mục `backend` và chạy:
```bash
npm install
```

### Bước 2: Cấu hình biến môi trường
1. Copy file `.env.example` thành file `.env`:
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env` và cập nhật các thông tin quan trọng sau:
   - `DATABASE_URL`: Connection string để kết nối tới SQL Server của bạn. 
     *(Mẫu: `sqlserver://localhost:1433;database=job_matching;user=sa;password=MatKhau;encrypt=true;trustServerCertificate=true;`)*
   - `JWT_SECRET`: Chuỗi bí mật dùng để mã hóa JWT Token (nên dùng chuỗi ngẫu nhiên, dài và phức tạp).
   - `GOOGLE_CLIENT_ID`: Dùng cho chức năng đăng nhập bằng Google.

### Bước 3: Khởi tạo Database với công cụ CLI (`jm`)
Dự án được tích hợp sẵn một công cụ CLI chuyên dụng (lệnh `jm`) giúp bạn thao tác nhanh với hệ thống.

Để tạo các bảng trong Database dựa trên Schema hiện tại, chạy lệnh:
```bash
npm run build
npm link
jm db:i
# Hoặc sử dụng alias: npm run jm -- db:i
```
*(Lệnh này sẽ tự động chạy `prisma generate` và `prisma db push`)*

### Bước 4: Tạo tài khoản Quản trị viên (Admin)
Sau khi Database được khởi tạo, bạn cần tạo ngay một tài khoản Admin để có thể đăng nhập vào hệ thống:
```bash
npm run jm -- admin:create --email=admin@jobmatching.com --password=MySecretPassword123
jm a:c --email=admin@jobmatching.com --password=MySecretPassword123
# Hoặc dùng alias: npm run jm -- a:c --email=...
```

### Bước 5: Chạy ứng dụng
Khởi chạy Server ở chế độ Development (tự động reload khi có thay đổi code):
```bash
npm run start:dev
```
Backend sẽ khởi động tại **`http://localhost:4000`** (hoặc Port bạn cấu hình trong file `.env`).

---

## 📖 Tài liệu API (Swagger)
Khi Server đang chạy, bạn có thể truy cập toàn bộ tài liệu API và test API trực tiếp thông qua **Swagger UI** tại:
👉 **[http://localhost:4000/api/docs](http://localhost:4000/api/docs)**

### 🔐 Hướng dẫn xác thực (Authorize) trên Swagger
Để test các API yêu cầu quyền đăng nhập hoặc quyền Admin/User (có ổ khóa góc phải), bạn cần làm theo các bước sau:
1. Mở nhóm API **Authentication** và test API `POST /auth/login` với tài khoản bạn đã tạo qua CLI.
2. Lấy giá trị chuỗi `accessToken` trả về trong Response Body.
3. Bấm vào nút **Authorize** (biểu tượng ổ khóa màu xanh lá cây) ở góc phải trên cùng của trang Swagger.
4. **CHỈ CẦN DÁN TRỰC TIẾP** chuỗi Token vào ô Value (❌ KHÔNG GÕ thêm chữ `Bearer ` ở phía trước, vì Swagger đã được cấu hình tự động thêm từ khóa này vào Header).
5. Bấm **Authorize** để lưu lại. Kể từ giờ mọi API có ổ khóa sẽ tự động gửi kèm Token này!

---

## 🧰 Danh sách các lệnh CLI (`jm`) hỗ trợ

Nếu bạn muốn sử dụng lệnh `jm` như một lệnh Global trong Terminal mà không cần gõ `npm run jm --`, hãy chạy lệnh sau một lần duy nhất:
```bash
npm run build
npm link
```
Sau đó bạn có thể sử dụng các lệnh sau ở bất kỳ đâu trong dự án:

| Lệnh đầy đủ | Lệnh rút gọn (Alias) | Chức năng |
|---|---|---|
| `jm db:init` | `jm db:i` | Đẩy Schema hiện tại lên Database (tạo bảng) |
| `jm db:reset` | `jm db:rs` | ⚠️ Xóa toàn bộ các bảng trong Database (Reset sạch data) |
| `jm admin:create` | `jm a:c` | Tạo tài khoản có quyền Admin. Cần cờ `--email` và `--password` |
| `jm user:create` | `jm u:c` | Tạo tài khoản có quyền User. Cần cờ `--email` và `--password` |
| `jm --help` | `jm -h` | Hiển thị hướng dẫn sử dụng toàn bộ CLI |

*(Lưu ý: Nếu bạn có chỉnh sửa code của CLI, hãy chạy `npm run build` trước khi dùng lệnh global `jm` để nó cập nhật)*
