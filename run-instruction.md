# 🚀 Hướng Dẫn Khởi Chạy Nhanh Dự Án Job-Matching (Cho Team)

Tài liệu hướng dẫn dành cho thành viên team khi clone Repository về máy cá nhân để khởi chạy và phát triển dự án.

---

## 🛠️ 1. Yêu cầu Tiền đề (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Git**
- **Docker Desktop** (Đang ở trạng thái **Running**)
- *(Tùy chọn)* **SQL Server Management Studio (SSMS)** hoặc Azure Data Studio để xem Cơ sở dữ liệu.

---

## ⚡ 2. Các Bước Khởi Chạy Nhanh (Từ A - Z)

### Bước 1: Mở Terminal tại thư mục dự án
```bash
cd Job-matching
```

### Bước 2: Tạo file cấu hình môi trường `.env`
Sao chép cấu hình mẫu từ `.env.example`:

- **Trên macOS / Linux / Git Bash:**
  ```bash
  cp .env.example .env
  ```
- **Trên Windows PowerShell:**
  ```powershell
  Copy-Item .env.example .env
  ```
- **Trên Windows Command Prompt (CMD):**
  ```cmd
  copy .env.example .env
  ```

### Bước 3: Khởi chạy toàn bộ hệ thống bằng Docker Compose
Chạy câu lệnh sau để tự động build Image và bật tất cả 4 dịch vụ (`frontend`, `backend`, `ai-service`, `db`):

```bash
docker compose up -d --build
```

### Bước 4: Kiểm tra trạng thái hệ thống
Chạy lệnh bên dưới để đảm bảo cả 4 container đều ở trạng thái `Running`:
```bash
docker compose ps
```

---

## 🌐 3. Danh Sách Cổng & Địa Chỉ Dịch Vụ

Sau khi các container khởi chạy thành công, truy cập các địa chỉ sau trên trình duyệt:

| Dịch vụ | Công nghệ | Địa chỉ / URL | Mô tả |
|---|---|---|---|
| 🖥️ **Web App (Frontend)** | Next.js / Node.js | **[http://localhost:3000](http://localhost:3000)** | Giao diện chính: Tìm việc, Upload CV, xem gợi ý AI |
| ⚡ **API Gateway (Backend)** | NestJS / Node.js | **[http://localhost:4000/api/jobs](http://localhost:4000/api/jobs)** | REST APIs quản lý công việc, người dùng & ứng tuyển |
| 🤖 **AI & NLP Service** | FastAPI / Python | **[http://localhost:8000/docs](http://localhost:8000/docs)** | Tài liệu Swagger API cào dữ liệu, NLP & Machine Learning |
| 🗄️ **Database (MS SQL Server)** | SQL Server 2022 | **`localhost,1434`** | Cơ sở dữ liệu lưu trữ chính |

---

## 🗄️ 4. Hướng Dẫn Kết Nối Database Trên SSMS

1. Mở phần mềm **SQL Server Management Studio (SSMS)**.
2. Tại cửa sổ **Connect to Server**, nhập:
   - **Server name**: `localhost,1434` *(Bắt buộc dùng dấu phẩy `,` 1434)*
   - **Authentication**: `SQL Server Authentication`
   - **Login**: `sa`
   - **Password**: `YourPassword123!` *(hoặc mật khẩu trong file `.env`)*
3. **Lưu ý tránh lỗi SSL**: Nhấn vào nút **Options >>** -> Tích chọn vào **Trust server certificate** -> Nhấn **Connect**.

### 📝 Khởi tạo Database cho lần đầu chạy:
Khi mới chạy container lần đầu, bấm **New Query** trong SSMS và chạy lệnh:
```sql
CREATE DATABASE job_matching_db;
GO
```

---

## 🛠️ 5. Các Câu Lệnh Hữu Ích Cho Team

- **Xem log trực tiếp của một dịch vụ:**
  ```bash
  docker logs -f job-backend-api    # Log Backend
  docker logs -f job-ai-pipeline    # Log AI Service
  docker logs -f job-frontend-web   # Log Frontend
  ```

- **Khởi động lại toàn bộ hệ thống:**
  ```bash
  docker compose restart
  ```

- **Tắt và dọn dẹp hệ thống:**
  ```bash
  docker compose down
  ```