# ⚡ Job Matching - Nền Tảng Phân Tích & Gợi Ý Việc Làm Thông Minh

> **Bộ não AI & Hệ thống Microservices Monorepo** đứng sau ứng dụng gợi ý việc làm thông minh, kết hợp Xử lý ngôn ngữ tự nhiên (NLP), Khai phá dữ liệu và Mô hình Học máy (Machine Learning).

---

## 📌 1. Tổng Quan Đề Tài

Hệ thống **Job-Matching** được thiết kế để giải quyết bài toán tự động phân tích hồ sơ ứng viên (CV) và kết nối với danh sách mô tả công việc (Job Descriptions - JD) nhằm đưa ra kết quả gợi ý công việc chính xác nhất.

### 🌟 Các Trụ Cột Tính Năng Chính:

- 🕷️ **Thu thập dữ liệu (Data Scraping & Pipeline)**:
  Chương trình tự động thu thập thông tin bài tuyển dụng (JD) từ các trang tuyển dụng hàng đầu (TopCV, ITviec...), chuẩn hóa và lưu trữ tập trung vào cơ sở dữ liệu **Microsoft SQL Server**.

- 🧠 **Đọc hiểu văn bản (NLP + Amazon Comprehend)**:
  Tự động bóc tách và phân loại thông tin thô từ CV và JD thành các thực thể có cấu trúc: *Tên kỹ năng (Flutter, Node.js, SQL Server...), Số năm kinh nghiệm, Mức lương*.

- 🔍 **Khai phá quy luật (Data Mining & Association Rules)**:
  Phát hiện các nhóm công việc tương đồng và các luật ẩn trong thị trường tuyển dụng *(Ví dụ: "82% công ty tuyển Flutter đều yêu cầu thêm kỹ năng SQL Server & REST API")*.

- 🤖 **Đưa ra quyết định (Machine Learning Matching)**:
  Mô hình AI dự đoán tỷ lệ trúng tuyển (% Match Score) giữa CV ứng viên và vị trí tuyển dụng, tự động đưa ra danh sách công việc phù hợp nhất.

---

## 🛠️ 2. Kiến Trúc Công Nghệ (Tech Stack)

| Thành phần | Công nghệ / Framework | Vai trò & Cổng hoạt động |
|---|---|---|
| 🖥️ **Frontend Web** | Next.js / Node.js | Giao diện người dùng chính (Cổng `3000`) |
| ⚡ **Backend Gateway** | NestJS / Node.js | API Gateway & Business Logic (Cổng `4000`) |
| 🤖 **AI & NLP Pipeline** | FastAPI / Python | Scraping, NLP Extraction & ML Model (Cổng `8000`) |
| 🗄️ **Database** | MS SQL Server 2022 | Cơ sở dữ liệu quan hệ lưu trữ (Cổng `1434`) |
| 🐳 **Orchestration** | Docker & Docker Compose | Đóng gói & Quản lý Container toàn hệ thống |

---

## 📂 3. Cấu Trúc Thư Mục Dự Án (Monorepo)

```text
job-matching/
├── frontend/                  # Next.js Web App (Port 3000)
│   ├── Dockerfile.dev
│   ├── server.js              # Server UI & Interactive Pages
│   └── package.json
├── backend/                   # NestJS API Gateway & Logic (Port 4000)
│   ├── Dockerfile.dev
│   ├── server.js              # REST APIs (Jobs, Match, Stats)
│   └── package.json
├── ai-service/                # FastAPI AI Microservice (Port 8000)
│   ├── Dockerfile
│   ├── main.py                # NLP Entity Extraction & ML Predictor
│   └── requirements.txt
├── docker-compose.yml         # Container Orchestration cho Local Dev
├── .env.example               # Mẫu cấu hình biến môi trường
├── .env                       # File cấu hình môi trường thực tế
└── run-instruction.md         # Hướng dẫn khởi chạy chi tiết cho Team
```

---

## 🚀 4. Khởi Chạy Nhanh (Quick Start)

Tài liệu hướng dẫn chi tiết từng bước dành cho các thành viên team có tại **[run-instruction.md](file:///d:/PROJECT/Job-matching/run-instruction.md)**.

### các bước thực hiện nhanh:

1. **Tạo file môi trường `.env`**:
   ```bash
   cp .env.example .env
   ```

2. **Khởi chạy toàn bộ hệ thống bằng Docker Compose**:
   ```bash
   docker compose up -d --build
   ```

3. **Truy cập các dịch vụ**:
   - 🖥️ **Web App (Frontend)**: [http://localhost:3000](http://localhost:3000)
   - ⚡ **API Gateway (Backend)**: [http://localhost:4000/api/jobs](http://localhost:4000/api/jobs)
   - 🤖 **AI & NLP Service (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - 🗄️ **MS SQL Server**: Kết nối SSMS qua `localhost,1434` (User: `sa` / Pass: `YourPassword123!`)

---

## 📝 5. Đóng Góp & Giấy Phép (License)

Dự án thuộc đề tài nghiên cứu và phát triển **Hệ thống Phân tích & Gợi ý Việc làm Thông minh**. Tất cả mã nguồn được đóng gói chuẩn Monorepo Microservices.