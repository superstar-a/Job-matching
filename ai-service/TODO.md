# Lộ trình & Theo dõi tiến độ: AI & Data Engineer

Tài liệu này là roadmap thực thi cho phần `ai-service` của dự án Job Matching. Mục tiêu là xây dựng AI Job Assistant dạng chat: user upload CV hoặc ảnh CV, nhập yêu cầu tìm việc, hệ thống hiểu intent, crawl/search JD theo nguồn phù hợp, lọc job theo điều kiện, chấm điểm CV-JD, giải thích chi tiết và gợi ý sửa CV có căn cứ.

## Cách đọc roadmap

- Các phase được sắp xếp theo thứ tự phát triển từ trên xuống. Phase trước là nền cho phase sau.
- Mỗi phase có checklist riêng để theo dõi tiến độ, tránh lẫn giữa việc đã xong, đang làm và việc để P2.
- Bước nên làm tiếp sau trạng thái hiện tại: **Phase 5 - Conversational Job Assistant & backend integration**.
- Chiến lược AI hiện tại là `pretrained-first, fine-tune-later`: MVP không tự train model từ đầu, mà dùng rule-based baseline trước, sau đó benchmark model pretrained trên dữ liệu thật của dự án.

## Trạng thái hiện tại

- Đã có nền FastAPI, health check, cấu trúc thư mục, sample JD/CV, taxonomy/alias, data cleaning, crawler tĩnh, parse CV PDF/DOCX và endpoint extract entities rule-based.
- Đã có code Phase 3 cho matching rule-based: scoring baseline, explanation, `POST /api/match-cv-jd`, `POST /api/recommend-jobs`, test matching và evaluation set nhỏ.
- Đã bắt đầu Phase 5: Backend `/api/match` đã nối AI-service qua `AI_SERVICE_URL`, Frontend demo đã gửi CV upload sang Backend và hiển thị ranking; logic sản phẩm mới cần mở rộng thành chat assistant: hiểu yêu cầu user, chọn nguồn job, crawl/filter, match/rank, phân tích chi tiết và gợi ý sửa CV.
- Model pretrained như `BAAI/bge-m3` chưa tích hợp; chỉ nên làm sau khi matching rule-based đã được verify ổn định.

## Ưu tiên triển khai

- P0 - MVP bắt buộc: API contract, parse CV/ảnh CV, intent extraction từ chat, scrape/search JD mẫu, matching baseline có giải thích, hiển thị job ranking và phân tích chi tiết.
- P1 - Nâng chất lượng: pretrained embeddings cho semantic CV-JD, benchmark model tiếng Việt/đa ngôn ngữ, job source routing, deduplicate jobs, skill taxonomy, evaluation set, background jobs, logging.
- P2 - Nâng cấp AI: reranker, fine-tune NER/intent classifier khi có dữ liệu gán nhãn, AI hỗ trợ sửa CV/cover letter, learning-to-rank, dashboard phân tích thị trường.

## Phase 0 - Contract, Setup & API Foundation

Mục tiêu: chốt nền tảng kỹ thuật để Backend, Frontend và AI-service có cùng contract trước khi đi sâu vào matching.

- [x] Chốt hệ CSDL thực tế: dự án dùng Microsoft SQL Server. Local/dev chạy container `mcr.microsoft.com/mssql/server:2022-latest` trong `docker-compose.yml`, Backend dùng `DB_TYPE=mssql`, còn `.env.example` cấu hình `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- [x] Tạo thư mục code chuẩn cho `ai-service`: `app/api`, `app/schemas`, `app/services`, `app/pipelines`, `app/utils`, `tests`, `data/samples`.
- [x] Cài đặt Python 3.10 và các công cụ cơ bản.
- [x] Tạo và kích hoạt môi trường ảo `venv`.
- [x] Cài đặt thư viện lõi: FastAPI, spaCy, scikit-learn, BeautifulSoup, Selenium, boto3.
- [x] Tải model ngôn ngữ tiếng Anh `en_core_web_sm`.
- [x] Xuất file `requirements.txt`.
- [x] Khởi tạo FastAPI server cơ bản và health check.
- [x] Thêm cấu hình `.env` cho AI-service: AWS region, timeout, crawl delay, log level.
- [x] Thêm `pytest` cho unit test và smoke test API.
- [x] Thêm endpoint health chuẩn: `GET /health` trả `status`, `service`, `version`.
- [ ] Chốt luồng dữ liệu chính theo logic chat assistant: `Chat Request -> Intent Extraction -> CV/Image Parsing -> Job Source Selection -> Crawl/Search JD -> Normalize/Filter -> Match/Rank -> Explain -> CV Improvement Suggestions`.
- [x] Chốt Backend gọi FastAPI qua URL nội bộ `AI_SERVICE_URL=http://ai-service:8000`.
- [ ] Định nghĩa format lỗi chung cho AI API: `code`, `message`, `details`, `request_id`.
- [ ] Định nghĩa Pydantic schema cho toàn bộ request/response trước khi triển khai endpoint.
- [ ] Định nghĩa schema cho chat job-search request:
  - `conversation_id`, `message`, `attachments`, `user_profile_context`
  - `parsed_intent`, `selected_sources`, `filters`, `cv_profile`
  - `ranked_jobs`, `assistant_message`, `follow_up_questions`
- [ ] Định nghĩa schema `JobSearchIntent`:
  - `target_role`, `required_skills`, `preferred_skills`
  - `job_sources`: TopCV, ITviec, VietnamWorks, company career pages, uploaded JD
  - `location`, `work_mode`, `salary_min`, `salary_max`, `currency`
  - `level`, `company_type`, `industry_domain`
  - `must_have_filters`, `nice_to_have_filters`, `excluded_keywords`
- [x] Thống nhất dữ liệu file CV cho MVP: Frontend gửi `fileBase64`, Backend chuyển thành `file_base64` cho AI-service `/api/parse-cv`; S3 key để phase sau.
- [ ] Thống nhất nơi lưu dữ liệu: AI-service chỉ xử lý và trả JSON, Backend chịu trách nhiệm ghi SQL Server, trừ khi team quyết định khác.
- [ ] Thêm example payload trong Swagger cho từng endpoint.
- [ ] Thêm validation lỗi input: file không hỗ trợ, text rỗng, URL lỗi, payload quá lớn.
- [ ] Thêm format/lint nhẹ: `ruff` hoặc `black` nếu team đồng ý.

Definition of done:

- Có file schema/API contract để Backend và Frontend bám theo, bao gồm contract cho chat request, intent, job ranking và job explanation.
- Swagger của FastAPI có example request/response rõ ràng.
- Backend biết chính xác gọi AI-service qua URL nào và nhận lỗi theo format nào.

## Phase 1 - JD Ingestion, Cleaning & Dataset

Mục tiêu: có dữ liệu JD/CV mẫu đủ sạch để test parser, extractor và matching mà không phụ thuộc demo bằng mock data.

- [x] Lập danh sách nguồn dữ liệu P0/P1/P2: TopCV, ITviec, VietnamWorks, company career pages, dữ liệu nhập tay.
- [ ] Gắn metadata cho từng nguồn job để chat assistant chọn nguồn phù hợp theo intent: loại job mạnh, khu vực, khả năng lấy salary, độ ổn định crawler, điều kiện sử dụng.
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
- [ ] Tạo flow search/crawl theo intent: chỉ crawl/search nguồn được user yêu cầu hoặc nguồn phù hợp, không crawl toàn bộ khi không cần.
- [ ] Chuẩn hóa filter sau crawl: salary, location, remote/hybrid/on-site, level, company type, source, keyword bắt buộc và keyword loại trừ.
- [x] Tạo bộ dữ liệu mẫu trong `ai-service/data/samples`: JD text, CV PDF/DOCX, expected JSON.
- [x] Xây dựng skill taxonomy ban đầu cho IT: language, framework, database, cloud, tool, soft skill.
- [x] Tạo alias mapping: `js -> JavaScript`, `ts -> TypeScript`, `reactjs -> React`, `aws -> Amazon Web Services`.
- [x] Chuẩn hóa salary, location, level, job type và số năm kinh nghiệm.
- [x] Thêm cờ chất lượng dữ liệu: `missing_salary`, `missing_company`, `short_description`, `parse_confidence`.
- [x] Tách dữ liệu theo lớp: raw, cleaned, normalized.
- [x] Thêm test tự động cho HTML cleaner, crawler tĩnh, LinkedIn policy, dedup, endpoint và batch output policy.
- [x] Viết test cho các case dữ liệu lỗi: thiếu lương, nhiều địa điểm, mô tả quá ngắn, text lẫn HTML.

Definition of done:

- Scrape hoặc ingest được ít nhất 20-50 JD mẫu từ nguồn được phép hoặc từ file mẫu.
- Mỗi JD được normalize thành JSON cùng schema.
- Có thể lấy danh sách JD dựa trên intent đã parse từ chat request.
- Có ít nhất 1 file taxonomy/alias dễ cập nhật.
- Có sample input/output để demo và test pipeline mà không phụ thuộc website thật.

## Phase 2 - CV/JD Parsing & Rule-Based Entity Extraction

Mục tiêu: biến CV/JD thô thành JSON có cấu trúc và entity có evidence để chuẩn bị cho matching explainable.

- [x] Tích hợp đọc PDF bằng PyMuPDF.
- [x] Tích hợp đọc DOCX bằng `python-docx`.
- [ ] Tích hợp OCR cho ảnh CV hoặc CV scan: nhận PNG/JPG/PDF scan, chuyển thành text trước khi parse.
- [ ] Trả lỗi rõ khi ảnh mờ, scan không có text, file quá lớn hoặc định dạng không hỗ trợ.
- [x] Tách text theo section CV: summary, skills, experience, education, projects, certificates.
- [x] Detect ngôn ngữ CV/JD: tiếng Việt, tiếng Anh, hoặc mixed.
- [x] Tạo rule-based extractor MVP để lấy entity ban đầu trước khi có dữ liệu train.
- [x] Gắn `confidence` và `source_span` cho entity quan trọng nếu làm được.
- [x] Mask hoặc bỏ qua PII không cần thiết: email, phone, address chi tiết.
- [x] Tạo endpoint `POST /api/parse-cv`.
- [x] Tạo endpoint `POST /api/extract-entities`.
- [ ] Extract entity tối thiểu bằng rule-based extractor MVP trước, sau đó so sánh với mô hình NER fine-tuned ở P2:
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

Definition of done:

- Parse được CV PDF/DOCX thường gặp.
- Parse được ảnh CV ở mức MVP thông qua OCR, hoặc trả lỗi rõ nếu OCR không đọc được.
- Trả về JSON có cấu trúc, không chỉ trả text thô.
- Entity có `normalized`, `confidence`, `source_span`, `section` và `evidence` đủ dùng cho matching.
- Có test với ít nhất 5 CV mẫu.

## Phase 3 - Matching MVP Rule-Based

Mục tiêu: có score CV-JD ổn định, giải thích được và endpoint để Backend gọi. Đây là bước nên làm tiếp trước khi tích hợp embedding.

- [x] Xây dựng scoring baseline có trọng số, ví dụ:
  - skills match: 45%
  - experience/level: 20%
  - title/category similarity: 15%
  - location/work mode: 10%
  - salary fit: 10%
- [x] Tính skill match theo taxonomy, alias, evidence, recency và mức độ bắt buộc/tùy chọn trong JD; không so sánh string thô đơn giản.
- [ ] Tính thêm các tín hiệu matching từ entity đã extract: seniority, domain, project evidence, education/certificates, language level, work mode, availability, salary/location fit.
- [x] Tính text similarity bằng TF-IDF + cosine similarity cho JD/CV cleaned text.
- [x] Kết hợp điểm rule-based và TF-IDF bằng trọng số rõ ràng.
- [x] Trả về `overall_score` từ 0-100.
- [x] Trả về giải thích:
  - `matched_skills`
  - `missing_required_skills`
  - `nice_to_have_skills`
  - `experience_gap`
  - `salary_gap`
  - `recommendation_reason`
- [x] Tạo endpoint `POST /api/match-cv-jd`: nhận CV structured + JD structured, trả score và explanation.
- [x] Tạo endpoint `POST /api/recommend-jobs`: nhận CV + danh sách JD, trả ranking.
- [x] Thêm example payload trong Swagger cho `match-cv-jd` và `recommend-jobs`.
- [x] Chuẩn bị evaluation set nhỏ: mỗi CV có 5-10 JD và nhãn phù hợp/không phù hợp.

Definition of done:

- Backend có thể gọi FastAPI để lấy score và lý do matching.
- Score ổn định, giải thích được, không random.
- Có test cho case match cao, match trung bình, match thấp.
- Có evaluation set nhỏ đủ để so sánh các lần cải tiến sau.

## Phase 4 - Pretrained Embedding Benchmark

Mục tiêu: sau khi baseline rule-based chạy được, thêm semantic similarity bằng model pretrained để cải thiện ranking CV-JD mà vẫn giữ explanation.

Quyết định kỹ thuật: AI-service chạy local/free bằng model open-source đã train sẵn trên Hugging Face. Fine-tune chỉ chuyển thành ưu tiên khi có dữ liệu gán nhãn, evaluation set và tiêu chí chất lượng rõ.

Lưu ý phạm vi model:

- Embedding model Hugging Face dùng để đo semantic similarity/retrieval giữa CV, JD và yêu cầu user; không dùng trực tiếp để đọc ảnh CV.
- OCR là bước riêng trước parsing nếu user upload ảnh hoặc CV scan.
- Intent extraction cho chat MVP có thể làm bằng rule-based/template trước; chỉ fine-tune intent classifier khi có log hội thoại đã gán nhãn.
- Explanation và gợi ý sửa CV phải dựa trên evidence từ CV/JD, không để model tự bịa kinh nghiệm.

- [ ] Thêm dependency cho model pretrained local khi bắt đầu phase này: `sentence-transformers`, `transformers`, `torch`, `huggingface-hub`.
- [ ] Chốt registry model P1 trong cấu hình, không hard-code rải rác trong service:
  - embedding chính: `BAAI/bge-m3`
  - embedding fallback/benchmark nhẹ hơn: `intfloat/multilingual-e5-base`
  - benchmark tiếng Việt: `bkai-foundation-models/vietnamese-bi-encoder`
  - reranker P2: `BAAI/bge-reranker-v2-m3`
  - NER fine-tune P2: `vinai/phobert-base` hoặc `FacebookAI/xlm-roberta-base`
- [ ] Ghi rõ vai trò từng model trong tài liệu kỹ thuật:
  - `BAAI/bge-m3`: tạo embedding để đo semantic similarity CV-JD, phù hợp text dài và dữ liệu Việt/Anh mixed.
  - `intfloat/multilingual-e5-base`: baseline embedding nhẹ hơn, dễ deploy hơn, dùng để so sánh chất lượng/tài nguyên với `bge-m3`.
  - `bkai-foundation-models/vietnamese-bi-encoder`: benchmark riêng cho CV/JD tiếng Việt nhiều, đặc biệt khi cần kiểm tra độ nhạy ngữ nghĩa tiếng Việt.
  - `BAAI/bge-reranker-v2-m3`: rerank top JD sau bước embedding retrieval, chất lượng tốt hơn nhưng chậm hơn nên để P2.
  - `vinai/phobert-base`/`FacebookAI/xlm-roberta-base`: chỉ dùng để fine-tune NER khi có dữ liệu gán nhãn đủ tốt.
- [ ] Pin model name, license, revision/hash và ngày đánh giá trong file cấu hình hoặc tài liệu model card nội bộ.
- [ ] Thêm biến môi trường đề xuất: `AI_EMBEDDING_MODEL`, `AI_RERANKER_MODEL`, `AI_MODEL_CACHE_DIR`, `AI_MODEL_DEVICE`, `AI_MODEL_MAX_LENGTH`, `AI_ENABLE_RERANKER`.
- [ ] Thêm semantic similarity bằng pretrained embedding model vào matching:
  - P1 model chính: `BAAI/bge-m3`
  - model benchmark/fallback: `intfloat/multilingual-e5-base`
  - model benchmark tiếng Việt: `bkai-foundation-models/vietnamese-bi-encoder`
- [ ] Với CV/JD dài, thiết kế chunking theo section: summary, skills, experience, projects, requirements, responsibilities; không cắt text thô tùy tiện.
- [ ] Kết hợp điểm rule-based và embedding bằng trọng số rõ ràng; embedding không thay thế explanation từ taxonomy/entity.
- [ ] Benchmark tối thiểu trên local CPU trước khi chốt deploy: thời gian load model, RAM, latency encode 1 CV, latency encode 20-50 JD, throughput batch.
- [ ] Benchmark `BAAI/bge-m3`, `intfloat/multilingual-e5-base` và `bkai-foundation-models/vietnamese-bi-encoder` trên sample/evaluation set của dự án.
- [ ] Chốt model mặc định dựa trên chất lượng, RAM, latency và độ ổn định khi deploy.
- [ ] Giữ rule-based extractor là fallback bắt buộc: nếu model lỗi, API vẫn có thể trả matching dựa trên taxonomy/TF-IDF ở mức baseline.

Definition of done:

- Có danh sách model được chọn, vai trò, license, revision và lý do sử dụng.
- Có benchmark model trên dữ liệu mẫu thật của dự án, không chọn model chỉ dựa vào benchmark công khai.
- Có benchmark so sánh rule-based/TF-IDF baseline với pretrained embedding trên cùng evaluation set.
- AI-service có fallback rõ khi model không load được.

## Phase 5 - Conversational Job Assistant & End-to-End Demo

Mục tiêu: nối AI-service vào luồng sản phẩm thật dạng chat assistant: user upload CV/ảnh CV, nhập yêu cầu tìm việc, hệ thống hiểu intent, lấy job phù hợp, chấm điểm CV-JD, giải thích chi tiết và gợi ý sửa CV.

- [ ] Ưu tiên để Backend Gateway là service ghi DB chính; AI-service chỉ đọc/ghi SQL Server khi có contract rõ về ownership dữ liệu.
- [ ] Nếu AI-service cần truy cập DB trực tiếp, thêm driver/cấu hình kết nối SQL Server phù hợp, ví dụ `pyodbc` hoặc SQLAlchemy dialect cho MSSQL, và dùng các biến `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- [x] Chốt Backend upload CV lên S3 trước hay AI-service nhận file trực tiếp: MVP hiện dùng Frontend gửi `fileBase64` đến Backend `/api/match`, Backend gọi AI-service `/api/parse-cv`; S3 để P1/P2 khi cần lưu file thật.
- [ ] Nếu AI-service đọc S3: dùng boto3 với IAM quyền tối thiểu chỉ đọc object cần thiết.
- [ ] Không commit AWS key vào repo; chỉ dùng `.env` local và secret manager/CI secret khi deploy.
- [x] Thống nhất timeout khi Backend gọi FastAPI qua `AI_SERVICE_TIMEOUT_MS`, mặc định 10000ms.
- [ ] Với tác vụ lâu như crawl batch hoặc parse nhiều CV, cân nhắc background job thay vì request sync.
- [x] Ghi log dạng JSON cho fallback `/api/match`: endpoint, request_id, duration_ms, status, error_code.
- [x] Không log raw CV, email, phone, access token hoặc AWS credentials trong flow fallback `/api/match`.
- [x] Tích hợp Backend endpoint `/api/match` với AI-service.
- [x] Demo end-to-end với Frontend.
- [ ] Thiết kế chat UI giống ChatGPT cho job assistant: message list, input box, upload attachment, job result cards và detail panel.
- [x] Tạo endpoint orchestration ở Backend, ví dụ `POST /api/job-assistant/chat`, để nhận message + attachment + conversation context.
- [x] Tạo service intent extraction MVP bằng rule-based cho câu chat của user:
  - Ví dụ: "tìm job TopCV lương 20tr ở HCM cho Python backend"
  - Output: `target_role`, `job_sources`, `salary_min`, `location`, `skills`, `level`, `work_mode`, `company_type`.
- [ ] Tạo flow chọn nguồn job theo intent: TopCV, ITviec, VietnamWorks, company career pages, dữ liệu mẫu hoặc JD user upload.
- [x] Tạo flow lấy và lọc job đang có theo intent trước khi match: source, salary, location, work mode, level, company type, keyword bắt buộc/loại trừ.
- [x] Tạo response dạng chat gồm:
  - message tóm tắt kết quả
  - danh sách job cards đã rank
  - score từng job
  - lý do ngắn cho từng job
  - câu hỏi follow-up nếu yêu cầu user còn thiếu thông tin.
- [ ] Tạo endpoint hoặc action xem chi tiết job: phân tích CV hợp/không hợp JD ở từng điểm và gợi ý sửa CV theo JD.
- [ ] Lưu trạng thái conversation/session ở Backend để user có thể hỏi tiếp: "lọc thêm remote", "chỉ lấy công ty product", "mức lương cao hơn".
- [ ] Với attachment là ảnh CV, route qua OCR trước khi gọi `/api/parse-cv`.

Definition of done:

- Backend gọi được các endpoint AI-service qua Docker Compose.
- Có ít nhất một flow end-to-end dạng chat: upload CV/ảnh CV -> parse/OCR -> hiểu yêu cầu user -> lấy/lọc job -> match/rank -> hiển thị job cards.
- User xem chi tiết một job và nhận được phân tích hợp/không hợp kèm gợi ý sửa CV có evidence.
- Logs đủ trace lỗi mà không lộ PII.

## Phase 6 - Job Detail Analysis, CV Suggestions & Guardrails

Mục tiêu: khi user mở chi tiết một job, AI phân tích CV hợp job ở điểm nào, chưa hợp ở điểm nào, vì sao, và hướng dẫn sửa CV dựa trên dữ liệu thật đã extract.

- [ ] Tạo chức năng phân tích gap giữa CV và JD.
- [ ] Tạo job detail analysis theo từng nhóm:
  - kỹ năng khớp
  - kỹ năng thiếu
  - kinh nghiệm/level
  - domain/project evidence
  - salary/location/work mode
  - keyword quan trọng trong JD nhưng CV chưa thể hiện rõ.
- [ ] Với mỗi nhận xét, gắn evidence từ CV/JD: section, source_span, requirement tương ứng trong JD.
- [ ] Sinh gợi ý cải thiện CV dựa trên dữ liệu thật đã extract, không bịa kinh nghiệm.
- [ ] Trả về gợi ý theo section: summary, skills, experience bullets, projects.
- [ ] Tạo checklist thiếu kỹ năng và keyword nên bổ sung nếu ứng viên thật sự có kỹ năng đó.
- [ ] Tạo endpoint `POST /api/cv-suggestions`: nhận CV + JD, trả gợi ý cải thiện CV.
- [ ] Tạo endpoint `POST /api/analyze-job-fit`: nhận CV + JD/job_id, trả phân tích chi tiết hợp/không hợp và lý do.
- [ ] Thêm example payload trong Swagger cho `cv-suggestions`.
- [ ] Nếu dùng LLM ở P2, thêm guardrail:
  - Không tạo thông tin sai sự thật.
  - Không lưu CV raw text vào log.
  - Không gửi PII sang provider ngoài nếu chưa có chính sách rõ.
  - Luôn phân biệt `suggested wording` và `verified experience`.
- [ ] Cân nhắc Amazon Bedrock hoặc provider LLM khác ở P2; MVP có thể dùng template/rule-based trước.

Definition of done:

- Người dùng nhận được gợi ý cụ thể theo JD.
- Gợi ý có căn cứ từ CV/JD đã parse.
- Mỗi phân tích chi tiết có evidence rõ, không chỉ là nhận xét chung chung.
- Không khuyến khích ứng viên thêm kỹ năng/kinh nghiệm không có thật.

## Phase 7 - Testing, Quality & Evaluation

Mục tiêu: biến các flow chính thành test và metric để biết thay đổi sau này có làm chất lượng tốt hơn hay tệ đi.

- [ ] Unit test cho parser JD.
- [ ] Unit test cho parser CV.
- [ ] Unit test cho OCR/image-CV handling: ảnh đọc được, ảnh mờ, file quá lớn, định dạng không hỗ trợ.
- [ ] Unit test cho skill extractor.
- [ ] Unit test cho intent extraction từ chat:
  - nguồn job: TopCV, ITviec, VietnamWorks
  - salary/location/work mode
  - role/level/skill
  - filter bắt buộc và filter tùy chọn.
- [x] Unit test cho matching score.
- [x] Integration test FastAPI bằng `TestClient`.
- [ ] Integration test cho flow chat assistant: message + CV -> parsed intent -> filtered jobs -> ranked response.
- [ ] Smoke test Docker: service start được và `/health` trả OK.
- [ ] Golden file test: input text cố định phải cho output JSON gần như cố định.
- [ ] Test dữ liệu tiếng Việt có dấu, tiếng Anh, và mixed Vietnamese-English.
- [ ] Test các lỗi phổ biến: PDF scan không có text, DOCX rỗng, URL timeout, HTML thiếu field.
- [ ] Đánh giá ranking bằng Precision@K, Recall@K hoặc NDCG@K.
- [ ] Đánh giá intent extraction bằng exact match hoặc field-level accuracy trên tập câu chat mẫu.
- [ ] Đánh giá explanation bằng checklist: có evidence, không bịa, nêu rõ điểm hợp/không hợp, gợi ý sửa CV có căn cứ.
- [ ] Benchmark model deployment: thời gian load model, RAM peak, latency P50/P95 cho parse/match/recommend.
- [ ] Kiểm tra fallback khi model không load được: API trả lỗi rõ hoặc chuyển về baseline rule-based theo cấu hình.

Definition of done:

- Test tự động bao phủ các endpoint MVP, service chính và flow chat assistant.
- Có evaluation set đủ nhỏ để chạy nhanh nhưng đủ thật để so sánh matching.
- Có metric ranking và latency trước/sau khi thêm embedding.

## Phase 8 - Deployment, Operations & Model Runtime

Mục tiêu: chuẩn bị AI-service chạy ổn khi deploy web, đặc biệt khi có model local.

- [ ] Cập nhật Dockerfile để đảm bảo model spaCy, dependency NLP và model pretrained local được cài/load ổn định trong container.
- [ ] Cập nhật Dockerfile/dependencies cho OCR nếu bật ảnh CV trong MVP.
- [ ] Thêm `.dockerignore` để không copy `venv`, cache, data lớn vào image.
- [ ] Không copy Hugging Face cache rác vào image; chọn rõ một trong hai chiến lược: bake model revision vào image production hoặc download vào persistent volume lúc startup/deploy.
- [ ] Cấu hình `HF_HOME`/`TRANSFORMERS_CACHE`/model cache dir cho môi trường local và production.
- [ ] Thiết kế service load model theo lazy-load hoặc startup warm-up để tránh request đầu tiên bị timeout.
- [ ] Thêm startup warm-up hoặc endpoint model readiness để biết embedding/reranker đã load xong.
- [ ] Thêm healthcheck trong `docker-compose.yml` nếu team muốn monitor local tốt hơn.
- [ ] Viết hướng dẫn chạy riêng AI-service local.
- [ ] Thêm CI tối thiểu: install dependencies, run tests, build Docker image.
- [ ] Chuẩn bị cấu hình production: worker count, timeout, memory, log level.
- [ ] Thiết kế timeout riêng cho chat orchestration, crawl/search job, OCR, parse CV và model inference.
- [ ] Theo dõi các metric cơ bản: số request, latency, số job crawl thành công/thất bại, parse success rate, model load time, model inference latency, RAM usage.
- [ ] Theo dõi thêm metric chat assistant: intent parse success rate, job source selected, filtered job count, recommendation click/detail rate, suggestion accepted rate nếu có.

Definition of done:

- AI-service container start ổn trong local/dev.
- Có chiến lược cache model và warm-up rõ ràng trước khi deploy production.
- Có health/readiness signal để Backend hoặc monitor biết service có sẵn sàng không.

## Phase 9 - Fine-Tune NER, Reranker & Advanced AI Later

Mục tiêu: chỉ nâng cấp AI phức tạp sau khi MVP đã chạy và có dữ liệu đánh giá. Đây là phase sau, không chặn Matching MVP.

- [ ] Thiết lập hệ thống gán nhãn dữ liệu với Label Studio cho CV/JD tiếng Việt & Anh.
- [ ] Gán nhãn thủ công ít nhất 100-500 mẫu CV/JD để tạo tập dữ liệu huấn luyện NER.
- [ ] Gán nhãn thêm dữ liệu hội thoại/job-search intent khi có log thật:
  - câu user nhập
  - intent đúng
  - filter đúng
  - nguồn job đúng
  - follow-up question đúng khi thiếu thông tin.
- [ ] Tạo train/val/test split, guideline nhãn và quy tắc review nhãn.
- [ ] Fine-tune mô hình pretrained cho NER:
  - `vinai/phobert-base` nếu dữ liệu thiên tiếng Việt
  - `FacebookAI/xlm-roberta-base` nếu dữ liệu mixed Vietnamese-English
- [ ] Tích hợp mô hình NER đã fine-tune vào FastAPI endpoint để extract skills/experience/location/salary.
- [ ] Fine-tune intent classifier hoặc dùng LLM/rule hybrid chỉ khi rule-based intent extraction không đủ tốt trên evaluation set.
- [ ] Đánh giá độ chính xác NER bằng Precision/Recall/F1 trên tập test.
- [ ] Nếu danh sách JD lớn, dùng embedding retrieval lấy top K trước, sau đó dùng `BAAI/bge-reranker-v2-m3` để rerank top K.
- [ ] Cân nhắc `faiss-cpu` nếu cần vector search local.
- [ ] Cân nhắc `FlagEmbedding` nếu dùng reranker từ BAAI.
- [ ] Cân nhắc learning-to-rank khi đã có dữ liệu hành vi hoặc nhãn matching đủ lớn.
- [ ] Chuẩn bị dashboard phân tích thị trường hoặc báo cáo kỹ thuật cho phần AI & Data.

Definition of done:

- Fine-tune chỉ bắt đầu khi dữ liệu gán nhãn đủ tốt và metric baseline đã rõ.
- Model mới phải thắng baseline trên evaluation set nội bộ, không chỉ dựa vào benchmark công khai.
- Advanced AI không làm mất tính giải thích của matching.

## Milestone gọn để theo dõi

### Milestone 1 - Foundation & Data Ready

- [x] Chốt DB đang dùng là Microsoft SQL Server.
- [ ] Chốt API contract.
- [x] Tạo sample JD/CV và expected JSON.
- [x] Tạo cấu trúc thư mục `app/` và `tests/`.
- [x] Viết schema Pydantic cho JD, CV, entity, match result.

### Milestone 2 - Parsing & Entity MVP

- [x] Scrape hoặc ingest JD mẫu.
- [x] Parse PDF/DOCX CV.
- [x] Dùng rule-based extractor + taxonomy để extract entity MVP.
- [x] Có endpoint `parse-cv` và `extract-entities`.
- [ ] Hoàn thiện entity JD theo `required`, `nice_to_have`, `responsibilities`, `benefits`, `company_domain`, `work_mode`, `salary_range`, `level`.

### Milestone 3 - Matching MVP

- [x] Implement scoring baseline.
- [x] Tạo endpoint `POST /api/match-cv-jd`.
- [x] Tạo endpoint `POST /api/recommend-jobs`.
- [x] Trả về explanation rõ ràng.
- [x] Tạo evaluation set nhỏ.
- [x] Tích hợp Backend endpoint `/api/match`.
- [x] Demo end-to-end với Frontend.

### Milestone 4 - Conversational Job Assistant MVP

- [ ] Tạo chat UI giống ChatGPT: message, upload CV/ảnh, job cards, detail panel.
- [ ] Tạo endpoint orchestration `POST /api/job-assistant/chat`.
- [ ] Parse được intent từ yêu cầu user: nguồn job, role, salary, location, work mode, level, company type.
- [ ] Search/crawl/filter job theo intent trước khi match.
- [ ] Trả về danh sách job đã rank kèm score và lý do ngắn.
- [ ] Xem chi tiết job để thấy CV hợp/không hợp ở đâu và nên sửa CV thế nào.

### Milestone 5 - Pretrained Embedding Benchmark

- [ ] Tích hợp pretrained embedding model đầu tiên, ưu tiên `BAAI/bge-m3`.
- [ ] Benchmark `BAAI/bge-m3`, `intfloat/multilingual-e5-base` và `bkai-foundation-models/vietnamese-bi-encoder` trên sample/evaluation set của dự án.
- [ ] Chốt model mặc định dựa trên chất lượng, RAM, latency và độ ổn định khi deploy.
- [ ] Giữ rule-based baseline làm fallback.

### Milestone 6 - Suggestion, Deploy & Advanced AI

- [ ] Gợi ý cải thiện CV theo JD dựa trên evidence, không bịa kinh nghiệm.
- [ ] OCR cho ảnh CV nếu bật upload ảnh trong MVP.
- [ ] Logging, error handling, Docker smoke test.
- [ ] Chuẩn bị model cache/warm-up/readiness cho deploy.
- [ ] Hoãn fine-tune Custom NER Model sang P2, sau khi có dữ liệu gán nhãn train/val/test.
- [ ] Chuẩn bị báo cáo kỹ thuật cho phần AI & Data.

## Ghi chú kỹ thuật quan trọng

- MVP hiện tại ưu tiên chiến lược `pretrained-first, fine-tune-later`: dùng model open-source đã train sẵn trên Hugging Face để có kết quả nhanh, có thể chạy local/free, giảm rủi ro privacy và không phụ thuộc provider trả phí.
- Không tự train model từ đầu cho MVP. Fine-tune NER bằng PhoBERT/XLM-R chỉ nên làm khi đã có dữ liệu gán nhãn chất lượng cao, train/val/test split và metric rõ ràng.
- `BAAI/bge-m3` là ứng viên chính cho semantic matching vì hỗ trợ đa ngôn ngữ, input dài và retrieval tốt; `intfloat/multilingual-e5-base` là baseline nhẹ hơn; `bkai-foundation-models/vietnamese-bi-encoder` dùng để benchmark riêng cho tiếng Việt; `BAAI/bge-reranker-v2-m3` để rerank top K ở P2.
- Matching giai đoạn đầu vẫn cần explainable baseline. Embedding similarity giúp hiểu ngữ nghĩa CV-JD, nhưng không thay thế taxonomy/rule-based explanation như kỹ năng khớp, kỹ năng thiếu, kinh nghiệm thiếu.
- Chat assistant gồm nhiều lớp: intent extraction, CV/OCR parsing, job source routing, crawler/search, filter, ranking, explanation. Hugging Face embedding chỉ là một lớp semantic matching/retrieval trong pipeline này.
- Nếu user upload ảnh CV, cần OCR trước khi parse. Embedding model không đọc ảnh trực tiếp.
- Gợi ý sửa CV phải dựa trên evidence từ CV/JD. AI chỉ diễn giải và đề xuất wording; không được tạo kinh nghiệm, kỹ năng hoặc thành tích không có trong CV.
- Selenium dùng được, nhưng nếu phần scraping JS phức tạp và team có thời gian, có thể cân nhắc Playwright ở P1 vì workflow browser automation/test thường gọn hơn.
- Với dữ liệu CV, privacy quan trọng ngang với độ chính xác. Hạn chế log raw text và không gửi PII sang dịch vụ ngoài khi chưa có chính sách rõ.
