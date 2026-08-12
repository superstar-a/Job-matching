# Lộ trình & Theo dõi tiến độ: AI & Data Engineer

Tài liệu này là roadmap thực thi cho phần `ai-service` của dự án Job Matching. Mục tiêu của role AI & Data Engineer là biến dữ liệu JD/CV thô thành dữ liệu có cấu trúc, cung cấp API nội bộ cho Backend, và tạo nền tảng matching/AI suggestion có thể giải thích được.

## Đánh giá nhanh

Lộ trình ban đầu ổn để khởi động MVP, nhưng cần bổ sung các phần sau để dự án ít rủi ro hơn khi ghép team:

- Chốt contract API giữa Backend và FastAPI trước khi code sâu.
- Chốt nguồn dữ liệu, quy tắc scraping, rate limit và điều kiện sử dụng từng website.
- Chốt chiến lược xử lý tiếng Việt/tiếng Anh, vì JD/CV ở Việt Nam thường trộn cả hai ngôn ngữ.
- Có bộ dữ liệu mẫu và tiêu chí đánh giá matching, tránh chỉ demo bằng mock data.
- Matching cần trả về giải thích: kỹ năng khớp, kỹ năng thiếu, kinh nghiệm thiếu, gợi ý cải thiện CV.

## Ưu tiên triển khai

- P0 - MVP bắt buộc: API contract, scrape/ingest JD mẫu, parse CV, extract skills, matching baseline, Swagger, test với Backend.
- P1 - Nâng chất lượng: deduplicate jobs, skill taxonomy, tiếng Việt tốt hơn, evaluation set, background jobs, logging.
- P2 - Nâng cấp AI: AI hỗ trợ viết CV/cover letter, embeddings, learning-to-rank, dashboard phân tích thị trường.

## 0. Chốt kiến trúc & contract với team

- [x] Chốt hệ CSDL thực tế: dự án dùng Microsoft SQL Server. Local/dev chạy container `mcr.microsoft.com/mssql/server:2022-latest` trong `docker-compose.yml`, Backend dùng `DB_TYPE=mssql`, còn `.env.example` cấu hình `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- [ ] Chốt luồng dữ liệu chính: `Crawler/Scraper -> Normalize JD -> Store -> Extract Entities -> Match CV-JD -> Recommend`.
- [ ] Chốt Backend gọi FastAPI qua URL nội bộ `AI_SERVICE_URL=http://ai-service:8000`.
- [ ] Định nghĩa format lỗi chung cho AI API: `code`, `message`, `details`, `request_id`.
- [ ] Định nghĩa Pydantic schema cho toàn bộ request/response trước khi triển khai endpoint.
- [ ] Thống nhất dữ liệu file CV: Backend gửi file trực tiếp, gửi S3 key, hay gửi extracted text.
- [ ] Thống nhất nơi lưu dữ liệu: AI-service chỉ xử lý và trả JSON, Backend chịu trách nhiệm ghi SQL Server, trừ khi team quyết định khác.
- [x] Tạo thư mục code chuẩn cho `ai-service`: `app/api`, `app/schemas`, `app/services`, `app/pipelines`, `app/utils`, `tests`, `data/samples`.

Definition of done:

- Có file schema/API contract để Backend và Frontend bám theo.
- Swagger của FastAPI có example request/response rõ ràng.
- Tài liệu, biến môi trường và API contract thống nhất rằng CSDL của dự án là Microsoft SQL Server.

## 1. Môi trường & nền tảng

- [x] Cài đặt Python 3.10 và các công cụ cơ bản.
- [x] Tạo và kích hoạt môi trường ảo `venv`.
- [x] Cài đặt thư viện lõi: FastAPI, spaCy, scikit-learn, BeautifulSoup, Selenium, boto3.
- [x] Tải model ngôn ngữ tiếng Anh `en_core_web_sm`.
- [x] Xuất file `requirements.txt`.
- [x] Khởi tạo FastAPI server cơ bản và health check.
- [x] Thêm cấu hình `.env` cho AI-service: AWS region, timeout, crawl delay, log level.
- [x] Thêm `pytest` cho unit test và smoke test API.
- [ ] Thêm format/lint nhẹ: `ruff` hoặc `black` nếu team đồng ý.
- [x] Thêm endpoint health chuẩn: `GET /health` trả `status`, `service`, `version`.

## 2. Nguồn dữ liệu & scraping JD

- [x] Lập danh sách nguồn dữ liệu P0/P1/P2: TopCV, ITviec, VietnamWorks, company career pages, dữ liệu nhập tay.
- [x] Kiểm tra điều kiện sử dụng, `robots.txt`, rate limit và policy của từng nguồn trước khi scraping.
- [x] Với LinkedIn, để P2 hoặc dùng nguồn hợp lệ/API/dữ liệu người dùng cung cấp, không đặt làm nguồn scraping MVP.
- [x] Xây dựng crawler tĩnh bằng BeautifulSoup cho website có HTML render sẵn.
- [ ] Xây dựng crawler động bằng Selenium cho website cần render JavaScript.
- [x] Thêm cơ chế `User-Agent`, timeout, retry, backoff và crawl delay.
- [x] Viết hàm làm sạch HTML: loại script/style/nav/footer, chuẩn hóa whitespace, decode HTML entities.
- [x] Chuẩn hóa một JD về schema chung:
  - `source`, `source_url`, `external_id`
  - `title`, `company_name`, `location`, `salary_min`, `salary_max`, `currency`
  - `job_type`, `level`, `posted_at`, `expired_at`
  - `description_text`, `requirements_text`, `benefits_text`
  - `raw_html`, `crawl_status`, `crawled_at`
- [x] Thêm logic chống trùng job theo `source_url`, `external_id`, hoặc hash của title/company/location.
- [x] Tạo script chạy batch local với input là danh sách URL.
- [x] Đóng gói thành endpoint nội bộ `POST /api/scrape-jd`.
- [x] Thêm test tự động cho HTML cleaner, crawler tĩnh, LinkedIn policy, dedup, endpoint và batch output policy.

Definition of done:

- Scrape được ít nhất 20-50 JD mẫu từ nguồn được phép hoặc từ file mẫu.
- Mỗi JD được normalize thành JSON cùng schema.
- Có log lỗi cho URL fail và không làm crash cả batch.

## 3. Data cleaning, taxonomy & dataset

- [x] Tạo bộ dữ liệu mẫu trong `ai-service/data/samples`: JD text, CV PDF/DOCX, expected JSON.
- [x] Xây dựng skill taxonomy ban đầu cho IT: language, framework, database, cloud, tool, soft skill.
- [x] Tạo alias mapping: `js -> JavaScript`, `ts -> TypeScript`, `reactjs -> React`, `aws -> Amazon Web Services`.
- [x] Chuẩn hóa salary, location, level, job type và số năm kinh nghiệm.
- [x] Thêm cờ chất lượng dữ liệu: `missing_salary`, `missing_company`, `short_description`, `parse_confidence`.
- [x] Tách dữ liệu theo lớp: raw, cleaned, normalized.
- [x] Viết test cho các case dữ liệu lỗi: thiếu lương, nhiều địa điểm, mô tả quá ngắn, text lẫn HTML.

Definition of done:

- Có ít nhất 1 file taxonomy/alias dễ cập nhật.
- Có sample input/output để demo và test pipeline mà không phụ thuộc website thật.

## 4. Parse CV & NLP entity extraction

- [ ] Tích hợp đọc PDF bằng PyMuPDF.
- [ ] Tích hợp đọc DOCX bằng `python-docx`.
- [ ] Tách text theo section CV: summary, skills, experience, education, projects, certificates.
- [ ] Detect ngôn ngữ CV/JD: tiếng Việt, tiếng Anh, hoặc mixed.
- [ ] Thiết lập hệ thống gán nhãn dữ liệu (Data Labeling) với Label Studio cho CV/JD tiếng Việt & Anh.
- [ ] Gán nhãn thủ công (Annotate) ít nhất 100-500 mẫu CV/JD để tạo tập dữ liệu huấn luyện.
- [ ] Tự huấn luyện (Fine-tune) mô hình ngôn ngữ (ví dụ: PhoBERT hoặc spaCy custom NER pipeline) thay vì dùng rule-based.
- [ ] Extract entity tối thiểu bằng mô hình tự train:
  - skills: hard skills, soft skills, tools, frameworks, databases, cloud, methodology
  - skill evidence: kỹ năng xuất hiện ở section nào, dùng trong project/job nào, số năm hoặc mức độ thành thạo nếu suy ra được
  - years of experience: tổng số năm, số năm liên quan tới role, số năm theo từng kỹ năng/domain quan trọng
  - job titles và target roles
  - seniority/level: intern, fresher, junior, middle, senior, lead, manager
  - work history: company, industry/domain, role, start/end date, duration, responsibility
  - achievements/impact: metric, kết quả định lượng, giải thưởng, thành tích nổi bật
  - projects/products: tên dự án, vai trò, tech stack, quy mô, kết quả, link nếu có
  - education: degree, major, school, graduation year, GPA nếu có
  - certificates/licenses
  - location, relocation preference, remote/hybrid/on-site preference, timezone nếu có
  - salary expectation hoặc salary range, currency, gross/net nếu có
  - languages: ngôn ngữ, level, chứng chỉ liên quan nếu có
  - availability: thời điểm có thể bắt đầu, notice period, employment type mong muốn
  - portfolio/profile links: GitHub, LinkedIn, personal website, portfolio
  - keywords/domain expertise: fintech, e-commerce, healthcare, edtech, outsourcing, product company, startup
- [ ] Với JD, tách rõ entity theo nhóm `required`, `nice_to_have`, `responsibilities`, `benefits`, `company_domain`, `work_mode`, `salary_range`, `level`.
- [ ] Chuẩn hóa entity để matching không chỉ đếm keyword: `normalized`, `aliases`, `confidence`, `source_span`, `section`, `evidence`, `recency`.
- [ ] Gắn `confidence` và `source_span` cho entity quan trọng nếu làm được.
- [ ] Mask hoặc bỏ qua PII không cần thiết: email, phone, address chi tiết.
- [ ] Tạo endpoint `POST /api/parse-cv`.
- [ ] Tạo endpoint `POST /api/extract-entities`.

Definition of done:

- Parse được CV PDF/DOCX thường gặp.
- Trả về JSON có cấu trúc, không chỉ trả text thô.
- Có test với ít nhất 5 CV mẫu.

## 5. Matching CV-JD baseline

- [ ] Xây dựng scoring baseline có trọng số, ví dụ:
  - skills match: 45%
  - experience/level: 20%
  - title/category similarity: 15%
  - location/work mode: 10%
  - salary fit: 10%
- [ ] Tính skill match theo taxonomy, alias, evidence, recency và mức độ bắt buộc/tùy chọn trong JD; không so sánh string thô đơn giản.
- [ ] Tính thêm các tín hiệu matching từ entity đã extract: seniority, domain, project evidence, education/certificates, language level, work mode, availability, salary/location fit.
- [ ] Tính text similarity bằng TF-IDF + cosine similarity cho JD/CV cleaned text.
- [ ] Trả về `overall_score` từ 0-100.
- [ ] Trả về giải thích:
  - `matched_skills`
  - `missing_required_skills`
  - `nice_to_have_skills`
  - `experience_gap`
  - `salary_gap`
  - `recommendation_reason`
- [ ] Tạo endpoint `POST /api/match-cv-jd`.
- [ ] Tạo endpoint `POST /api/recommend-jobs` để chấm một CV với nhiều JD.
- [ ] Chuẩn bị evaluation set nhỏ: mỗi CV có 5-10 JD và nhãn phù hợp/không phù hợp.
- [ ] Đánh giá bằng Precision@K, Recall@K hoặc NDCG@K cho danh sách gợi ý.

Definition of done:

- Backend có thể gọi FastAPI để lấy score và lý do matching.
- Score ổn định, giải thích được, không random.
- Có test cho case match cao, match trung bình, match thấp.

## 6. AI hỗ trợ tạo và cải thiện CV

- [ ] Tạo chức năng phân tích gap giữa CV và JD.
- [ ] Sinh gợi ý cải thiện CV dựa trên dữ liệu thật đã extract, không bịa kinh nghiệm.
- [ ] Trả về gợi ý theo section: summary, skills, experience bullets, projects.
- [ ] Tạo checklist thiếu kỹ năng và keyword nên bổ sung nếu ứng viên thật sự có kỹ năng đó.
- [ ] Tạo endpoint `POST /api/cv-suggestions`.
- [ ] Nếu dùng LLM ở P2, thêm guardrail:
  - Không tạo thông tin sai sự thật.
  - Không lưu CV raw text vào log.
  - Không gửi PII sang provider ngoài nếu chưa có chính sách rõ.
  - Luôn phân biệt `suggested wording` và `verified experience`.
- [ ] Cân nhắc Amazon Bedrock hoặc provider LLM khác ở P2; MVP có thể dùng template/rule-based trước.

Definition of done:

- Người dùng nhận được gợi ý cụ thể theo JD.
- Gợi ý có căn cứ từ CV/JD đã parse.
- Không khuyến khích ứng viên thêm kỹ năng/kinh nghiệm không có thật.

## 7. FastAPI endpoints cần có cho MVP

- [x] `GET /health`: kiểm tra service sống.
- [x] `POST /api/scrape-jd`: nhận URL, trả JD normalized.
- [ ] `POST /api/parse-cv`: nhận file hoặc text/S3 key, trả CV structured JSON.
- [ ] `POST /api/extract-entities`: nhận text, trả entity list.
- [ ] `POST /api/match-cv-jd`: nhận CV structured + JD structured, trả score và explanation.
- [ ] `POST /api/recommend-jobs`: nhận CV + danh sách JD, trả ranking.
- [ ] `POST /api/cv-suggestions`: nhận CV + JD, trả gợi ý cải thiện CV.
- [ ] Thêm example payload trong Swagger cho từng endpoint.
- [ ] Thêm validation lỗi input: file không hỗ trợ, text rỗng, URL lỗi, payload quá lớn.

## 8. Tích hợp Backend, Storage & AWS

- [x] Xác nhận CSDL dùng chung là Microsoft SQL Server trong Docker Compose service `db`.
- [ ] Nếu AI-service cần truy cập DB trực tiếp, thêm driver/cấu hình kết nối SQL Server phù hợp, ví dụ `pyodbc` hoặc SQLAlchemy dialect cho MSSQL, và dùng các biến `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- [ ] Ưu tiên để Backend Gateway là service ghi DB chính; AI-service chỉ đọc/ghi SQL Server khi có contract rõ về ownership dữ liệu.
- [ ] Chốt Backend upload CV lên S3 trước hay AI-service nhận file trực tiếp.
- [ ] Nếu AI-service đọc S3: dùng boto3 với IAM quyền tối thiểu chỉ đọc object cần thiết.
- [ ] Không commit AWS key vào repo; chỉ dùng `.env` local và secret manager/CI secret khi deploy.
- [ ] Thống nhất timeout khi Backend gọi FastAPI.
- [ ] Với tác vụ lâu như crawl batch hoặc parse nhiều CV, cân nhắc background job thay vì request sync.
- [ ] Ghi log dạng JSON: endpoint, request_id, duration_ms, status, error_code.
- [ ] Không log raw CV, email, phone, access token hoặc AWS credentials.

Definition of done:

- Backend gọi được các endpoint AI-service qua Docker Compose.
- Có ít nhất một flow end-to-end: upload CV -> parse -> match -> hiển thị kết quả.

## 9. Testing & chất lượng

- [ ] Unit test cho parser JD.
- [ ] Unit test cho parser CV.
- [ ] Unit test cho skill extractor.
- [ ] Unit test cho matching score.
- [ ] Integration test FastAPI bằng `TestClient`.
- [ ] Smoke test Docker: service start được và `/health` trả OK.
- [ ] Golden file test: input text cố định phải cho output JSON gần như cố định.
- [ ] Test dữ liệu tiếng Việt có dấu, tiếng Anh, và mixed Vietnamese-English.
- [ ] Test các lỗi phổ biến: PDF scan không có text, DOCX rỗng, URL timeout, HTML thiếu field.

## 10. Triển khai & vận hành

- [ ] Cập nhật Dockerfile để đảm bảo model spaCy và dependency được cài ổn định trong container.
- [ ] Thêm `.dockerignore` để không copy `venv`, cache, data lớn vào image.
- [ ] Thêm healthcheck trong `docker-compose.yml` nếu team muốn monitor local tốt hơn.
- [ ] Viết hướng dẫn chạy riêng AI-service local.
- [ ] Thêm CI tối thiểu: install dependencies, run tests, build Docker image.
- [ ] Chuẩn bị cấu hình production: worker count, timeout, memory, log level.
- [ ] Theo dõi các metric cơ bản: số request, latency, số job crawl thành công/thất bại, parse success rate.

## 11. Milestone đề xuất

### Milestone 1 - Sau setup: Contract + sample data

- [x] Chốt DB đang dùng là Microsoft SQL Server.
- [ ] Chốt API contract.
- [x] Tạo sample JD/CV và expected JSON.
- [x] Tạo cấu trúc thư mục `app/` và `tests/`.
- [x] Viết schema Pydantic cho JD, CV, entity, match result.

### Milestone 2 - Data extraction & Custom AI MVP

- [ ] Scrape hoặc ingest JD mẫu.
- [ ] Parse PDF/DOCX CV.
- [ ] Thiết lập Data Pipeline: Cài đặt công cụ gán nhãn, chuẩn bị tập dữ liệu train/val/test.
- [ ] Huấn luyện Custom NER Model (PhoBERT/spaCy) để nhận diện thực thể tiếng Việt.
- [ ] Tích hợp mô hình đã train vào FastAPI endpoint để extract skills/experience/location/salary.
- [ ] Đánh giá độ chính xác (Precision/Recall/F1) của mô hình trên tập Test.

### Milestone 3 - Matching MVP

- [ ] Implement scoring baseline.
- [ ] Trả về explanation rõ ràng.
- [ ] Tích hợp Backend endpoint `/api/match`.
- [ ] Demo end-to-end với Frontend.

### Milestone 4 - AI suggestion & polish

- [ ] Gợi ý cải thiện CV theo JD.
- [ ] Đánh giá matching bằng bộ nhãn nhỏ.
- [ ] Logging, error handling, Docker smoke test.
- [ ] Chuẩn bị báo cáo kỹ thuật cho phần AI & Data.

## Ghi chú kỹ thuật quan trọng

- MVP hiện tại ưu tiên tự huấn luyện (Train) mô hình AI chuyên biệt (Custom AI Model) cho tác vụ NER. Quá trình này đòi hỏi đầu tư thời gian vào việc gán nhãn dữ liệu (Data Annotation) chất lượng cao và tài nguyên GPU để Fine-tuning. Lựa chọn khuyến nghị là Fine-tune các mô hình tiếng Việt như PhoBERT.
- Selenium dùng được, nhưng nếu phần scraping JS phức tạp và team có thời gian, có thể cân nhắc Playwright ở P1 vì workflow browser automation/test thường gọn hơn.
- Matching giai đoạn đầu không cần mô hình ML phức tạp. Một baseline có trọng số, có giải thích tốt, có evaluation rõ thường đáng giá hơn một mô hình khó kiểm chứng.
- Với dữ liệu CV, privacy quan trọng ngang với độ chính xác. Hạn chế log raw text và không gửi PII sang dịch vụ ngoài khi chưa có chính sách rõ.
