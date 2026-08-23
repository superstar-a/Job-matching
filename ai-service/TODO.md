# Lộ trình & Theo dõi tiến độ: AI & Data Engineer

Tài liệu này là roadmap thực thi cho phần **AI & Data Engineer** của dự án Job Matching. Mục tiêu là xây dựng lõi AI/Data cho Job Assistant dạng chat: user upload CV hoặc ảnh CV, nhập yêu cầu tìm việc, hệ thống đọc hiểu CV, hiểu intent, chọn nguồn JD phù hợp, chuẩn hóa dữ liệu, chấm điểm CV-JD, giải thích chi tiết và gợi ý sửa CV có căn cứ.

## Cách đọc roadmap

- Các phase được sắp xếp theo thứ tự phát triển từ trên xuống. Phase trước là nền cho phase sau.
- Mỗi phase có checklist riêng để theo dõi tiến độ, tránh lẫn giữa việc đã xong, đang làm và việc để P2.
- Bước nên làm tiếp sau trạng thái hiện tại: **Phase 7.5 - Training Data Readiness**.
- Chiến lược AI hiện tại là `pretrained-first, fine-tune-later`: MVP không tự train model từ đầu, mà dùng rule-based baseline trước, sau đó benchmark model pretrained trên dữ liệu thật của dự án.
- Frontend, Backend Gateway, Cloud/S3/Deploy là phần team khác phụ trách. Roadmap này chỉ ghi các contract tối thiểu để AI-service trả JSON đúng cho các team đó tích hợp.

## Phạm vi trách nhiệm AI & Data Engineer

### In scope - AI/Data Core

- Thiết kế pipeline dữ liệu: CV/JD raw -> cleaned -> normalized -> entities -> features -> ranking/explanation.
- Parse CV PDF/DOCX/ảnh scan, OCR, tách section, mask PII.
- Ingest/crawl/search JD theo intent đã parse, clean HTML, normalize schema, deduplicate.
- Chuẩn hóa skill/occupation theo taxonomy nội bộ và ESCO-compatible metadata.
- Xây dựng intent extraction cho yêu cầu tìm việc ở mức AI-service contract: role, source, salary, location, work mode, level, company type.
- Xây dựng matching/ranking CV-JD, explanation, job-fit analysis, CV suggestions có evidence.
- Thiết kế và triển khai DB cho AI/Data: schema SQL Server, migration, seed taxonomy/ESCO, feature store nhẹ, labeled dataset, evaluation set, model run và audit.
- Benchmark pretrained embeddings, reranker và fine-tune model khi đủ dữ liệu gán nhãn.
- Thiết kế metric đánh giá: entity F1, intent field accuracy, ranking NDCG/Precision@K, suggestion quality checklist, latency.

### Integration contract only

- Định nghĩa request/response schema để Backend gọi AI-service.
- Định nghĩa dữ liệu tối thiểu Frontend cần hiển thị: ranked jobs, score, explanation, fit gaps, suggestion sections.
- Định nghĩa ownership dữ liệu: AI/Data sở hữu schema và dữ liệu phục vụ parse/match/train/evaluate; Backend sở hữu business/session/auth/API gateway và phối hợp ghi/đọc qua contract rõ.

### Out of scope cho roadmap này

- Thiết kế UI/chat screen, CSS, job cards, detail panel frontend.
- Backend Gateway/session/auth/payment/business API.
- Cloud/S3/IAM/deployment pipeline/production infra, trừ các yêu cầu dữ liệu tối thiểu để AI-service không lộ PII và chạy được.

## Logic sản phẩm nhìn từ AI/Data

Luồng user mong muốn:

`User chat + CV/image -> OCR/Parse CV -> Mask PII -> Intent Extraction -> Job Source Selection -> JD Crawl/Search/Ingest -> JD Normalize/Filter -> CV-JD Match/Rank -> Job Fit Analysis -> CV Suggestions -> JSON response cho Backend/Frontend`

AI/Data cần đảm bảo:

- Nếu user upload ảnh CV, hệ thống OCR trước, sau đó parse như CV text.
- Nếu user nêu yêu cầu như công ty, mức lương, TopCV, remote/hybrid, role, level, hệ thống tách thành structured intent.
- Dữ liệu JD được lấy/lọc theo intent và dữ liệu trong CV, không crawl toàn bộ khi không cần.
- Mỗi job trả về phải có score, matched evidence, missing evidence và lý do ranking.
- Khi xem chi tiết job, AI phân tích CV hợp/không hợp từng điểm, gắn evidence từ CV/JD và gợi ý sửa CV mà không bịa kỹ năng/kinh nghiệm.

## Chiến lược DB/Data Model cho AI

AI/Data Engineer cần sở hữu phần DB phục vụ dữ liệu AI, không chỉ viết schema trên giấy. Backend/DB team vẫn có thể sở hữu hạ tầng SQL Server và các bảng business khác, nhưng AI/Data cần thiết kế migration, seed, mapping và quy tắc lưu trữ cho các vùng dữ liệu sau:

- Raw zone:
  - `raw_cv_documents`: metadata file CV/ảnh, hash, mime type, source, created_at; hạn chế lưu raw text nếu chưa có chính sách privacy.
  - `raw_job_postings`: source, source_url, external_id, raw_html/raw_text reference, crawled_at, crawl_status.
  - `crawl_runs`: source, query/intent snapshot, status, count, duration, error_code.
- Clean/normalized zone:
  - `cv_profiles`: parsed sections, language, years_experience, target_roles, sanitized profile JSON.
  - `job_posts_normalized`: title, company, salary, location, work_mode, level, description, requirements, benefits, data_quality_flags.
  - `entities`: entity_text, normalized, entity_type, source_object, section, source_span, confidence.
  - `esco_concepts`: esco_uri, preferred_label, esco_type, isco_group, aliases, version.
  - `entity_concept_links`: entity_id -> esco_uri/taxonomy_id, confidence, mapper_version.
- Feature/ranking zone:
  - `cv_job_features`: skill_overlap, missing_required_count, experience_gap, salary_fit, location_fit, tfidf_similarity, embedding_similarity.
  - `match_runs`: model_version, feature_version, weights, score, explanation JSON, latency_ms.
  - `job_fit_analyses`: fit gaps, evidence refs, risk flags, generated_at, analyzer_version.
  - `cv_suggestions`: suggestion section, suggested wording, evidence refs, guardrail flags.
- Evaluation/training zone:
  - `labeled_cv_jd_pairs`: cv_id, job_id, label, reason, reviewer, split train/val/test.
  - `labeled_entities`: text/span/entity_type/concept label cho NER và taxonomy mapping.
  - `labeled_intents`: user utterance, expected intent fields, expected follow-up question.
  - `model_experiments`: model_name, revision, dataset_version, metrics, latency, notes.
- Vector/cache zone P1:
  - `text_chunks`: object_type, object_id, section, chunk_text_hash, chunk_order.
  - `embeddings`: chunk_id, model_name, model_revision, vector_ref hoặc vector nếu DB/vector store hỗ trợ, created_at.

Nguyên tắc privacy:

- Không log raw CV, email, phone, access token hoặc fileBase64.
- Tách PII khỏi feature dùng train nếu không cần.
- Mọi suggestion phải tham chiếu evidence đã extract; không dùng model để tự tạo kinh nghiệm.

## Chiến lược Train AI

MVP không train model từ đầu. Lộ trình đúng hơn cho AI/Data Engineer:

1. **Baseline explainable trước**: rule-based extractor + taxonomy/ESCO + TF-IDF/matching weights. Đây là nền để có output ổn định và có evidence.
2. **Thu dữ liệu đánh giá trước khi train**: CV/JD samples, labeled CV-JD fit, labeled entity spans, labeled intent utterances, expected suggestions.
3. **Benchmark pretrained embeddings**: dùng `BAAI/bge-m3`, `intfloat/multilingual-e5-base`, `bkai-foundation-models/vietnamese-bi-encoder` trên cùng evaluation set; chỉ chọn model nếu thắng baseline theo metric và latency chấp nhận được.
4. **Audit dữ liệu train trước khi train**: nếu đã có dataset thật, kiểm tra schema, label, evidence, PII, duplicate, split train/val/test và dataset version trước khi chạy bất kỳ training job nào.
5. **Train ranking/calibration model trước fine-tune nặng**: ưu tiên mô hình nhẹ cho CV-JD fit score/ranking dựa trên feature đã có, chỉ promote nếu thắng rule-based baseline trên test set.
6. **Fine-tune NER/intent classifier sau**: chỉ làm khi có tối thiểu khoảng 100-500 mẫu gán nhãn chất lượng, guideline nhãn, train/val/test split và metric F1/field accuracy rõ.
7. **Reranker/learning-to-rank P2**: dùng khi có danh sách JD lớn và có nhãn hoặc behavior data đủ để đánh giá ranking.
8. **LLM chỉ là lớp diễn giải/gợi ý** nếu dùng ở P2: luôn bị ràng buộc bởi evidence, guardrail và không thay thế scoring/evaluation.

Theo phase hiện tại: **Phase 6.5 đã hoàn thành**, **Phase 7 = evaluation/metric**, **Phase 4 = benchmark pretrained**, **Phase 7.5 = audit/chuẩn hóa dữ liệu train**, **Phase 9 = train/fine-tune sau khi dataset pass audit và baseline đã rõ**.

## Trạng thái hiện tại

- Đã có nền FastAPI, health check, cấu trúc thư mục, sample JD/CV, taxonomy/alias, data cleaning, crawler tĩnh, parse CV PDF/DOCX và endpoint extract entities rule-based.
- Đã có code Phase 3 cho matching rule-based: scoring baseline, explanation, `POST /api/match-cv-jd`, `POST /api/recommend-jobs`, test matching và evaluation set nhỏ.
- Đã hoàn thiện lát cắt Phase 5 demo tích hợp: Backend `/api/job-assistant/chat` đã parse intent rule-based, chọn source/filter job mẫu theo intent, rank qua AI-service/fallback, trả `job_details` và giữ conversation context in-memory; Frontend đặt Chat Assistant làm màn hình chính. Từ thời điểm này, các việc Frontend/Backend/Cloud chuyển về team tương ứng, AI/Data chỉ giữ contract và lõi xử lý.
- Đã bắt đầu lớp chuẩn hóa ESCO-compatible: có seed taxonomy nhỏ với URI ESCO thật cho một số skill/occupation IT/data và mapper resolve alias Việt/Anh sang concept chuẩn. Chưa import full ESCO dataset và chưa fine-tune model theo ESCO.
- Phase 6.5 đã hoàn thành phần DB thật cho AI/Data: migration, schema check, ESCO seed, sample persistence seed, smoke test và persistence handoff contract.
- Đã benchmark pretrained embedding candidates ở mức sample nhỏ; chưa tích hợp vào matching mặc định vì chưa thắng rule-based baseline và cần evaluation set lớn hơn.
- Nếu đã có dữ liệu train thật, bước tiếp theo không phải train ngay mà là audit/chuẩn hóa dataset theo Phase 7.5 để biết dữ liệu có đủ label, evidence, split và privacy để train an toàn không.

## Ưu tiên triển khai

- P0 - AI/Data MVP bắt buộc: parse CV/ảnh CV, intent extraction, JD ingest/normalize, taxonomy/ESCO mapping, matching baseline có giải thích, job-fit analysis và CV suggestions có evidence.
- P1 - Nâng chất lượng AI/Data: SQL Server schema/migration cho AI/Data, pretrained embeddings cho semantic CV-JD, benchmark model tiếng Việt/đa ngôn ngữ, job source routing, deduplicate jobs, evaluation set, training data readiness, feature logging.
- P2 - Nâng cấp AI: reranker, fine-tune NER/intent classifier khi có dữ liệu gán nhãn, LLM/template hỗ trợ sửa CV có guardrail, learning-to-rank, dashboard/báo cáo phân tích thị trường ở mức dữ liệu.

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
- [x] Tạo seed ESCO-compatible ban đầu cho skill/occupation IT/data có URI thật và mapper alias Việt/Anh sang ESCO concept.
- [ ] Import full ESCO dataset hoặc CSV/API subset theo ngành nghề mục tiêu vào `data/taxonomy/esco/`, có version pin rõ ràng.
- [x] Mở rộng entity extraction/schema để trả về `esco_uri`, `esco_preferred_label`, `esco_type`, `isco_group` cho skill/occupation đã map được.
- [ ] Mở rộng JD/CV structured schema để lưu ESCO metadata ở cấp skill/title/occupation khi Backend cần persist.
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

Lưu ý thứ tự: Phase 4 là benchmark model pretrained, không phải train/fine-tune. Nếu DB/evaluation set chưa đủ dữ liệu thật, ưu tiên hoàn thiện Phase 6.5 và Phase 7 trước rồi mới benchmark nghiêm túc.

Lưu ý phạm vi model:

- Embedding model Hugging Face dùng để đo semantic similarity/retrieval giữa CV, JD và yêu cầu user; không dùng trực tiếp để đọc ảnh CV.
- OCR là bước riêng trước parsing nếu user upload ảnh hoặc CV scan.
- Intent extraction cho chat MVP có thể làm bằng rule-based/template trước; chỉ fine-tune intent classifier khi có log hội thoại đã gán nhãn.
- Explanation và gợi ý sửa CV phải dựa trên evidence từ CV/JD, không để model tự bịa kinh nghiệm.

- [ ] Thêm dependency cho model pretrained local khi bắt đầu phase này: `sentence-transformers`, `transformers`, `torch`, `huggingface-hub`.
- [x] Chốt registry model P1 trong cấu hình, không hard-code rải rác trong service:
  - embedding chính: `BAAI/bge-m3`
  - embedding fallback/benchmark nhẹ hơn: `intfloat/multilingual-e5-base`
  - benchmark tiếng Việt: `bkai-foundation-models/vietnamese-bi-encoder`
  - reranker P2: `BAAI/bge-reranker-v2-m3`
  - NER fine-tune P2: `vinai/phobert-base` hoặc `FacebookAI/xlm-roberta-base`
- [x] Ghi rõ vai trò từng model trong tài liệu kỹ thuật:
  - `BAAI/bge-m3`: tạo embedding để đo semantic similarity CV-JD, phù hợp text dài và dữ liệu Việt/Anh mixed.
  - `intfloat/multilingual-e5-base`: baseline embedding nhẹ hơn, dễ deploy hơn, dùng để so sánh chất lượng/tài nguyên với `bge-m3`.
  - `bkai-foundation-models/vietnamese-bi-encoder`: benchmark riêng cho CV/JD tiếng Việt nhiều, đặc biệt khi cần kiểm tra độ nhạy ngữ nghĩa tiếng Việt.
  - `BAAI/bge-reranker-v2-m3`: rerank top JD sau bước embedding retrieval, chất lượng tốt hơn nhưng chậm hơn nên để P2.
  - `vinai/phobert-base`/`FacebookAI/xlm-roberta-base`: chỉ dùng để fine-tune NER khi có dữ liệu gán nhãn đủ tốt.
- [x] Tạo harness benchmark embedding trên evaluation set hiện có:
  - `data/model_registry/embedding_models.json`
  - `app/services/embedding_benchmark.py`
  - `tests/test_embedding_benchmark.py`
  - `scripts/benchmark_embeddings.py`
- [x] Thêm debug output cho embedding benchmark để xem từng prediction theo `cv_id`, `job_id`, rank, score, label, expected score range và reason.
- [x] Thêm analyzer tự động cho embedding benchmark errors:
  - `app/services/embedding_error_analysis.py`
  - `tests/test_embedding_error_analysis.py`
  - `scripts/analyze_embedding_errors.py`
- [x] Ghi báo cáo so sánh model hiện tại: `docs/EMBEDDING_BENCHMARK_REPORT.md`.
- [ ] Pin model name, license, revision/hash và ngày đánh giá trong file cấu hình hoặc tài liệu model card nội bộ.
- [ ] Thêm biến môi trường đề xuất: `AI_EMBEDDING_MODEL`, `AI_RERANKER_MODEL`, `AI_MODEL_CACHE_DIR`, `AI_MODEL_DEVICE`, `AI_MODEL_MAX_LENGTH`, `AI_ENABLE_RERANKER`.
- [ ] Thêm semantic similarity bằng pretrained embedding model vào matching:
  - P1 model chính: `BAAI/bge-m3`
  - model benchmark/fallback: `intfloat/multilingual-e5-base`
  - model benchmark tiếng Việt: `bkai-foundation-models/vietnamese-bi-encoder`
- [ ] Với CV/JD dài, thiết kế chunking theo section: summary, skills, experience, projects, requirements, responsibilities; không cắt text thô tùy tiện.
- [ ] Kết hợp điểm rule-based và embedding bằng trọng số rõ ràng; embedding không thay thế explanation từ taxonomy/entity.
- [ ] Benchmark tối thiểu trên local CPU trước khi chốt deploy: thời gian load model, RAM, latency encode 1 CV, latency encode 20-50 JD, throughput batch.
- [x] Benchmark `BAAI/bge-m3`, `intfloat/multilingual-e5-base` và `bkai-foundation-models/vietnamese-bi-encoder` trên sample/evaluation set nhỏ của dự án.
  - Kết luận hiện tại: chưa model pretrained nào thắng rule-based baseline; `bkai-foundation-models/vietnamese-bi-encoder` là candidate đáng xem tiếp vì ít score-range violation nhất trong nhóm pretrained.
- [x] Phân tích lỗi ranking/debug cho từng model pretrained: low-label lọt top K, relevant job rớt top K, score-range violation.
- [ ] Chốt model mặc định dựa trên chất lượng, RAM, latency và độ ổn định khi deploy.
- [ ] Giữ rule-based extractor là fallback bắt buộc: nếu model lỗi, API vẫn có thể trả matching dựa trên taxonomy/TF-IDF ở mức baseline.

Definition of done:

- Có danh sách model được chọn, vai trò, license, revision và lý do sử dụng.
- Có benchmark model trên dữ liệu mẫu thật của dự án, không chọn model chỉ dựa vào benchmark công khai.
- Có benchmark so sánh rule-based/TF-IDF baseline với pretrained embedding trên cùng evaluation set.
- AI-service có fallback rõ khi model không load được.

## Phase 5 - Conversational Job Assistant Integration Contract [Handoff]

Mục tiêu AI/Data: định nghĩa contract và output cần thiết để team Backend/Frontend nối thành chat assistant. AI/Data không sở hữu UI, session gateway, auth, cloud upload hay deploy; AI-service chỉ cần nhận dữ liệu đã thỏa thuận, xử lý CV/JD/intent/matching và trả JSON có evidence.

Ghi chú handoff: các mục Backend/Frontend đã làm trước đây được giữ để biết demo end-to-end từng chạy, nhưng việc tiếp theo trong phase này chỉ nên là schema/API contract hoặc yêu cầu dữ liệu phục vụ AI.

- [x] Chốt cơ chế ghi DB production P0: Backend Gateway hoặc writer service có thể là service ghi chính, nhưng schema/bảng AI/Data và mapping dữ liệu do AI/Data định nghĩa.
- [x] Chốt P0: AI-service chưa truy cập DB trực tiếp; nếu cần sau này mới thêm driver/cấu hình SQL Server và repository/data-access layer riêng.
- [x] Chốt Backend upload CV lên S3 trước hay AI-service nhận file trực tiếp: MVP hiện dùng Frontend gửi `fileBase64` đến Backend `/api/match`, Backend gọi AI-service `/api/parse-cv`; S3 để P1/P2 khi cần lưu file thật.
- [ ] Nếu AI-service đọc S3: dùng boto3 với IAM quyền tối thiểu chỉ đọc object cần thiết.
- [ ] Không commit AWS key vào repo; chỉ dùng `.env` local và secret manager/CI secret khi deploy.
- [x] Thống nhất timeout khi Backend gọi FastAPI qua `AI_SERVICE_TIMEOUT_MS`, mặc định 10000ms.
- [ ] Với tác vụ lâu như crawl batch hoặc parse nhiều CV, cân nhắc background job thay vì request sync.
- [x] Ghi log dạng JSON cho fallback `/api/match`: endpoint, request_id, duration_ms, status, error_code.
- [x] Không log raw CV, email, phone, access token hoặc AWS credentials trong flow fallback `/api/match`.
- [x] Tích hợp Backend endpoint `/api/match` với AI-service.
- [x] Demo end-to-end với Frontend.
- [x] Thiết kế chat UI giống ChatGPT cho job assistant: message list, input box, upload attachment, job result cards và detail panel.
- [x] Tạo endpoint orchestration ở Backend, ví dụ `POST /api/job-assistant/chat`, để nhận message + attachment + conversation context.
- [x] Tạo service intent extraction MVP bằng rule-based cho câu chat của user:
  - Ví dụ: "tìm job TopCV lương 20tr ở HCM cho Python backend"
  - Output: `target_role`, `job_sources`, `salary_min`, `location`, `skills`, `level`, `work_mode`, `company_type`.
- [x] Tạo flow chọn nguồn job theo intent: TopCV, ITviec, VietnamWorks, company career pages, dữ liệu mẫu hoặc JD user upload.
- [x] Tạo flow lấy và lọc job đang có theo intent trước khi match: source, salary, location, work mode, level, company type, keyword bắt buộc/loại trừ.
- [x] Tạo response dạng chat gồm:
  - message tóm tắt kết quả
  - danh sách job cards đã rank
  - score từng job
  - lý do ngắn cho từng job
  - câu hỏi follow-up nếu yêu cầu user còn thiếu thông tin.
- [x] Tạo action xem chi tiết job MVP: hiển thị description, matched/missing skills và lý do ranking; phân tích/gợi ý sửa CV sâu chuyển sang Phase 6.
- [x] Lưu trạng thái conversation/session ở Backend dạng in-memory, chỉ giữ parsed CV profile/sanitized skills thay vì raw `fileBase64`, để user có thể hỏi tiếp: "lọc thêm remote", "chỉ lấy công ty product", "mức lương cao hơn".
- [ ] Với attachment là ảnh CV, route qua OCR trước khi gọi `/api/parse-cv`.

Definition of done:

- AI-service có contract rõ cho chat request, parsed intent, ranked jobs, job details, fit analysis và CV suggestions.
- Backend/Frontend team có đủ JSON fields để hiển thị chat UI, job cards và detail panel mà không cần tự suy luận logic AI.
- AI-service không log raw CV, fileBase64, email, phone hoặc dữ liệu nhạy cảm.
- Các phần UI/session/cloud được handoff cho team tương ứng.

## Phase 6 - Job Detail Analysis, CV Suggestions & Guardrails [AI/Data Core]

Mục tiêu: khi user mở chi tiết một job, AI phân tích CV hợp job ở điểm nào, chưa hợp ở điểm nào, vì sao, và hướng dẫn sửa CV dựa trên dữ liệu thật đã extract.

- [x] Thiết kế schema AI/Data bước đầu cho `JobFitAnalysis`, `FitGap`, `EvidenceRef`, `CvSuggestion`, `SuggestionGuardrail`.
- [x] Tạo chức năng phân tích gap giữa CV và JD bằng baseline rule-based có evidence.
- [x] Tạo job detail analysis P0 theo từng nhóm: kỹ năng khớp/thiếu, kinh nghiệm/level, domain/project evidence, salary/location/work mode.
- [ ] Mở rộng job detail analysis cho keyword quan trọng trong JD nhưng CV chưa thể hiện rõ.
- [x] Với mỗi nhận xét P0, gắn evidence từ CV/JD: section, source_span, requirement tương ứng trong JD.
- [x] Sinh gợi ý cải thiện CV rule-based dựa trên dữ liệu thật đã extract, không bịa kinh nghiệm.
- [x] Trả về gợi ý theo section bước đầu: summary, skills, experience; gồm guardrail cho skill thiếu, experience thiếu, salary và work mode.
- [x] Tạo checklist thiếu kỹ năng bắt buộc nên bổ sung nếu ứng viên thật sự có kỹ năng đó.
- [ ] Mở rộng checklist keyword quan trọng ngoài skill taxonomy.
- [x] Tạo endpoint `POST /api/cv-suggestions`: nhận CV + JD, trả gợi ý cải thiện CV có guardrail.
- [x] Tạo endpoint `POST /api/analyze-job-fit`: nhận CV + JD, trả phân tích chi tiết hợp/không hợp và lý do có evidence.
- [x] Thêm example payload trong Swagger cho `cv-suggestions`.
- [x] Thiết kế logical DB fields cho fit analysis/suggestions để Backend/DB team có thể persist: `analysis_id`, `cv_profile_id`, `job_id`, `feature_version`, `analyzer_version`, `evidence_refs`, `guardrail_flags`; xem `docs/AI_DATA_MODEL.md`.
- [x] Tạo test/golden cases P0: CV thiếu skill bắt buộc, project evidence cho skill, JD yêu cầu senior nhưng CV junior, salary/work mode không khớp.
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

## Phase 6.5 - AI/Data Database Schema & Persistence [Completed]

Mục tiêu: tạo DB thật cho phần AI/Data trên Microsoft SQL Server để lưu dữ liệu đã parse/normalize, feature matching, fit analysis, suggestion, evidence, dataset đánh giá và dữ liệu phục vụ train sau này. Phase này không xử lý UI/session/auth; các bảng business ngoài AI/Data cần phối hợp Backend/DB team qua contract riêng.

- [x] Chốt ownership DB theo nhóm bảng:
  - AI/Data sở hữu: CV/JD normalized, entities, ESCO mapping, features, match runs, fit analysis, suggestions, evaluation/training datasets, model experiments.
  - Backend/business sở hữu: user account, session, auth, payment, application workflow, notification, employer/job management nếu có.
  - Bảng giao nhau cần contract rõ: `user_id`, `cv_profile_id`, `job_id`, `conversation_id`, `application_id`.
- [x] Tạo data dictionary chi tiết cho bảng/column/source/privacy/index: `docs/AI_DATA_DICTIONARY.md`.
- [x] Tạo thư mục migration/schema cho AI/Data: `ai-service/db/migrations`, `ai-service/db/schema_checks`.
- [x] Viết SQL Server migration cho raw zone:
  - `raw_cv_documents`
  - `raw_job_postings`
  - `crawl_runs`
- [x] Viết SQL Server migration cho clean/normalized zone:
  - `cv_profiles`
  - `job_posts_normalized`
  - `entities`
  - `esco_concepts`
  - `entity_concept_links`
- [x] Viết SQL Server migration cho feature/ranking zone:
  - `cv_job_features`
  - `match_runs`
  - `job_fit_analyses`
  - `job_fit_gap_items`
  - `cv_suggestions`
  - `cv_suggestion_items`
  - `evidence_refs`
  - `guardrail_flags`
- [x] Viết SQL Server migration cho evaluation/training zone:
  - `labeled_cv_jd_pairs`
  - `labeled_entities`
  - `labeled_intents`
  - `model_experiments`
- [x] Viết SQL Server migration cho vector/cache zone P1:
  - `text_chunks`
  - `embeddings`
  - Chỉ lưu vector thật khi đã chọn DB/vector store phù hợp; MVP có thể lưu `vector_ref`, model name, revision và chunk hash trước.
- [x] Tạo seed script cho `esco_concepts` từ `data/taxonomy/esco_seed.json` và taxonomy/alias hiện có: `scripts/seed_esco_concepts.py`, `db/seeds/001_seed_esco_concepts.sql`.
- [x] Tăng cường quan hệ/FK cho ERD rõ ràng hơn: `db/migrations/002_strengthen_ai_data_relationships.sql`, `db/schema_checks/002_ai_data_relationships_check.sql`.
- [x] Thêm hướng dẫn chạy/check migration local: `ai-service/db/README.md`.
- [x] Tạo mapping document từ AI-service JSON response sang bảng DB:
  - `/api/parse-cv` -> `cv_profiles`, `entities`
  - `/api/extract-entities` -> `entities`, `entity_concept_links`
  - `/api/match-cv-jd` và `/api/recommend-jobs` -> `cv_job_features`, `match_runs`
  - `/api/analyze-job-fit` -> `job_fit_analyses`, `job_fit_gap_items`, `evidence_refs`, `guardrail_flags`
  - `/api/cv-suggestions` -> `cv_suggestions`, `cv_suggestion_items`, `evidence_refs`, `guardrail_flags`
- [x] Thiết kế index tối thiểu cho truy vấn AI/Data:
  - lookup theo `cv_profile_id`, `job_id`, `source`, `external_id`, `esco_uri`, `model_version`, `dataset_version`
  - unique key chống trùng job theo `source + external_id` hoặc hash title/company/location.
- [x] Chốt privacy policy cho DB:
  - không lưu `fileBase64`
  - không log email/phone/access token
  - raw CV text chỉ lưu khi có policy rõ; mặc định lưu sanitized JSON, hash và text preview ngắn.
- [x] Thêm script smoke test migration local trên SQL Server dev: `db/smoke_tests/001_ai_data_local_smoke_test.sql`.
- [x] Thêm test hoặc checklist kiểm tra schema không thiếu bảng/field quan trọng cho train/evaluate: `ai-service/db/schema_checks/001_ai_data_schema_check.sql`.
- [x] Chuẩn bị sample insert từ `data/samples` để có dữ liệu demo DB cho parser, matching, analysis và suggestions: `db/seeds/002_seed_sample_ai_data.sql`.
- [x] Chốt P0: AI-service chưa ghi DB trực tiếp; nếu cần sau này sẽ thêm repository/data-access layer riêng, không trộn vào service scoring/parsing.
- [x] Nếu Backend là service ghi DB chính, định nghĩa payload handoff để Backend persist đúng các bảng AI/Data: `docs/AI_DATA_PERSISTENCE_HANDOFF.md`.

Definition of done:

- Có migration SQL Server tạo được toàn bộ bảng AI/Data P0/P1.
- Có seed ESCO/taxonomy tối thiểu.
- Có mapping rõ từ endpoint AI-service sang bảng DB.
- Có quy tắc privacy cho raw CV/JD và evidence.
- Có dữ liệu mẫu đủ để bắt đầu tạo evaluation set và benchmark embedding.

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
- [x] Đánh giá ranking bằng Precision@K, Recall@K hoặc NDCG@K.
  - Đã thêm `app/services/evaluation.py`, `tests/test_evaluation_metrics.py`, `scripts/evaluate_matching.py`.
  - Đã có baseline prediction file: `data/samples/matching_predictions_baseline.json`.
- [x] Đánh giá intent extraction bằng exact match hoặc field-level accuracy trên tập câu chat mẫu.
  - Đã thêm `app/services/intent_evaluation.py`, `tests/test_intent_evaluation.py`, `scripts/evaluate_intent.py`.
  - Đã có labeled/prediction sample: `data/samples/intent_evaluation.json`, `data/samples/intent_predictions_baseline.json`.
- [x] Đánh giá explanation bằng checklist: có evidence, không bịa, nêu rõ điểm hợp/không hợp, gợi ý sửa CV có căn cứ.
  - Đã thêm `app/services/explanation_evaluation.py`, `tests/test_explanation_evaluation.py`, `scripts/evaluate_explanations.py`.
  - Đã có sample quality gate: `data/samples/explanation_evaluation.json`.
- [x] Benchmark model deployment: thời gian load model, RAM peak, latency P50/P95 cho parse/match/recommend.
  - Đã thêm `app/services/runtime_benchmark.py`, `tests/test_runtime_benchmark.py`, `scripts/benchmark_runtime.py`.
  - Baseline hiện tại là `rule-based-baseline`: `model_load_ms = 0.0`, đo P50/P95 và peak memory cho parse CV text, match, recommend top 5, analyze-job-fit, cv-suggestions và các evaluator.
- [ ] Kiểm tra fallback khi model không load được: API trả lỗi rõ hoặc chuyển về baseline rule-based theo cấu hình.

Definition of done:

- Test tự động bao phủ các endpoint MVP, service chính và flow chat assistant.
- Có evaluation set đủ nhỏ để chạy nhanh nhưng đủ thật để so sánh matching.
- Có metric ranking và latency trước/sau khi thêm embedding.

## Phase 7.5 - Training Data Readiness

Mục tiêu: kiểm tra và chuẩn hóa dữ liệu train thật trước khi chuyển sang Phase 9. Phase này là cổng chất lượng bắt buộc: có dataset chưa đồng nghĩa với train được; chỉ train khi dữ liệu có schema, label, evidence, split và privacy rõ ràng.

- [ ] Chốt loại dataset đang có:
  - CV-JD labeled fit pairs cho matching/ranking.
  - Chat utterance + labeled intent cho intent extraction.
  - CV/JD text + labeled entity spans cho NER/entity extraction.
  - CV/JD raw chưa gán nhãn, chỉ dùng làm nguồn tạo label chứ chưa train trực tiếp.
- [ ] Định nghĩa folder chuẩn cho dữ liệu train local:
  - `data/training/raw/` cho dữ liệu gốc đã mask PII.
  - `data/training/processed/` cho dataset đã normalize.
  - `data/training/splits/` cho train/validation/test split.
  - `data/training/reports/` cho audit report và dataset quality report.
- [ ] Định nghĩa schema tối thiểu cho CV-JD matching dataset:
  - `cv_id`, `job_id`, `label`, `expected_min_score`, `expected_max_score`
  - `cv_text` hoặc `cv_profile_ref`
  - `job_text` hoặc `job_post_ref`
  - `reason`, `evidence_refs`
  - `source`, `reviewer`, `split`, `dataset_version`
- [ ] Định nghĩa schema tối thiểu cho intent dataset:
  - `sample_id`, `utterance`, `expected_intent`
  - `target_role`, `required_skills`, `source`, `salary`, `location`, `work_mode`, `level`
  - `must_have_filters`, `nice_to_have_filters`, `follow_up_question`, `split`, `dataset_version`
- [ ] Định nghĩa schema tối thiểu cho entity/NER dataset:
  - `document_id`, `object_type`, `text`
  - `span_start`, `span_end`, `entity_text`, `entity_type`
  - `normalized_text`, `esco_uri`, `reviewer`, `split`, `dataset_version`
- [ ] Viết script audit dữ liệu train:
  - `scripts/audit_training_data.py`
  - kiểm tra missing required fields, label sai format, score range sai, duplicate CV-JD pair, split thiếu, evidence rỗng, text quá ngắn, PII pattern phổ biến.
- [ ] Tạo sample training dataset đã ẩn PII để test audit:
  - `data/training/samples/cv_jd_training_sample.json`
  - `data/training/samples/intent_training_sample.json`
  - `data/training/samples/entity_training_sample.json`
- [ ] Tạo report `data/training/reports/training_data_audit_report.json` sau khi audit dataset thật.
- [ ] Nếu dataset đang ở CSV/XLSX/SQL Server, thêm converter về JSON normalized trước khi train.
- [ ] Import hoặc map dataset pass audit vào các bảng AI/Data đã có:
  - `labeled_cv_jd_pairs`
  - `labeled_entities`
  - `labeled_intents`
  - `model_experiments`
- [ ] Chốt dataset version đầu tiên, ví dụ `training-dataset-v0.1`.
- [ ] Chạy lại baseline rule-based/pretrained embedding trên dataset thật trước khi train.
- [ ] Chỉ mở Phase 9 train khi:
  - dữ liệu pass audit
  - có train/val/test split
  - có metric baseline
  - không có PII raw trong feature train
  - có đủ label cho mục tiêu model cần train.

Definition of done:

- Có schema dữ liệu train rõ cho matching, intent và entity.
- Có script audit chạy được trên dataset local.
- Có report chất lượng dữ liệu trước train.
- Có dataset version và split train/val/test.
- Biết chắc dataset nào train được ngay, dataset nào chỉ là raw source cần gán nhãn thêm.

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
- [ ] Chốt API contract cho AI-service với Backend team.
- [x] Chốt logical AI data model: raw, normalized, feature/ranking, evaluation/training, vector/cache.
- [x] Tạo SQL Server migration thật cho các bảng AI/Data ở Phase 6.5.
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

### Milestone 4 - Conversational Job Assistant Contract

- [x] Xác định contract để chat UI có thể gửi message + CV/ảnh và nhận ranked jobs/detail analysis.
- [x] Hỗ trợ Backend orchestration qua `POST /api/job-assistant/chat` ở mức demo; ownership lâu dài thuộc Backend team.
- [x] Parse được intent từ yêu cầu user: nguồn job, role, salary, location, work mode, level, company type.
- [x] Search/crawl/filter job theo intent trước khi match.
- [x] Trả về danh sách job đã rank kèm score và lý do ngắn.
- [x] Trả fields đủ để team Frontend hiển thị matched/missing skills và lý do ranking; gợi ý sửa CV chi tiết làm ở Phase 6.

### Milestone 5 - Pretrained Embedding Benchmark

- [ ] Hoàn thiện DB/evaluation set tối thiểu trước khi benchmark nghiêm túc.
- [ ] Tích hợp pretrained embedding model đầu tiên, ưu tiên `BAAI/bge-m3`.
- [ ] Benchmark embedding trên evaluation set đã map ESCO concept, không chỉ trên string skill tự do.
- [x] Benchmark `BAAI/bge-m3`, `intfloat/multilingual-e5-base` và `bkai-foundation-models/vietnamese-bi-encoder` trên sample/evaluation set nhỏ của dự án.
- [ ] Chốt model mặc định dựa trên chất lượng, RAM, latency và độ ổn định khi deploy.
- [x] Giữ rule-based baseline làm fallback.

### Milestone 5.5 - Training Data Readiness

- [ ] Xác định dataset thật hiện có thuộc nhóm nào: matching/ranking, intent, entity/NER hay raw source chưa gán nhãn.
- [ ] Chuẩn hóa folder `data/training/raw`, `data/training/processed`, `data/training/splits`, `data/training/reports`.
- [ ] Viết script audit training data để kiểm tra schema, label, evidence, duplicate, split và PII.
- [ ] Tạo sample training dataset đã ẩn PII cho matching, intent và entity.
- [ ] Chốt dataset version đầu tiên, ví dụ `training-dataset-v0.1`.
- [ ] Chạy baseline evaluation trên dataset thật trước khi train.
- [ ] Chỉ chuyển sang Phase 9 train khi dataset pass audit và có baseline metric.

### Milestone 6 - Suggestions, Database & Advanced AI

- [x] Gợi ý cải thiện CV theo JD dựa trên evidence, không bịa kinh nghiệm.
- [ ] OCR cho ảnh CV nếu bật upload ảnh trong MVP.
- [x] Thiết kế `job_fit_analyses`, `cv_suggestions`, `labeled_cv_jd_pairs`, `model_experiments` cho DB/data team.
- [x] Tạo migration SQL Server cho `cv_profiles`, `job_posts_normalized`, `entities`, `esco_concepts`, `match_runs`, `job_fit_analyses`, `cv_suggestions`, `evidence_refs`, `labeled_*`, `model_experiments`.
- [x] Tạo seed ESCO/taxonomy và sample insert từ `data/samples`.
- [ ] Logging/error contract không lộ PII; infra/deploy chi tiết thuộc team Cloud/Backend.
- [ ] Chuẩn bị model cache/warm-up/readiness ở mức yêu cầu AI runtime; deploy chi tiết thuộc team Cloud.
- [ ] Hoãn fine-tune Custom NER Model sang P2, sau khi có dữ liệu gán nhãn train/val/test.
- [ ] Chuẩn bị báo cáo kỹ thuật cho phần AI & Data.

## Ghi chú kỹ thuật quan trọng

- MVP hiện tại ưu tiên chiến lược `pretrained-first, fine-tune-later`: dùng model open-source đã train sẵn trên Hugging Face để có kết quả nhanh, có thể chạy local/free, giảm rủi ro privacy và không phụ thuộc provider trả phí.
- Không tự train model từ đầu cho MVP. Fine-tune NER bằng PhoBERT/XLM-R chỉ nên làm khi đã có dữ liệu gán nhãn chất lượng cao, train/val/test split và metric rõ ràng.
- Nếu đã có dataset thật, bước đầu tiên vẫn là audit/chuẩn hóa dữ liệu train. Raw CV/JD chưa gán nhãn chỉ là dữ liệu nguồn; training data phải có label, evidence, split, dataset version và kiểm tra PII.
- `BAAI/bge-m3` là ứng viên chính cho semantic matching vì hỗ trợ đa ngôn ngữ, input dài và retrieval tốt; `intfloat/multilingual-e5-base` là baseline nhẹ hơn; `bkai-foundation-models/vietnamese-bi-encoder` dùng để benchmark riêng cho tiếng Việt; `BAAI/bge-reranker-v2-m3` để rerank top K ở P2.
- Matching giai đoạn đầu vẫn cần explainable baseline. Embedding similarity giúp hiểu ngữ nghĩa CV-JD, nhưng không thay thế taxonomy/rule-based explanation như kỹ năng khớp, kỹ năng thiếu, kinh nghiệm thiếu.
- Chat assistant gồm nhiều lớp: intent extraction, CV/OCR parsing, job source routing, crawler/search, filter, ranking, explanation. Hugging Face embedding chỉ là một lớp semantic matching/retrieval trong pipeline này.
- Nếu user upload ảnh CV, cần OCR trước khi parse. Embedding model không đọc ảnh trực tiếp.
- Gợi ý sửa CV phải dựa trên evidence từ CV/JD. AI chỉ diễn giải và đề xuất wording; không được tạo kinh nghiệm, kỹ năng hoặc thành tích không có trong CV.
- Selenium dùng được, nhưng nếu phần scraping JS phức tạp và team có thời gian, có thể cân nhắc Playwright ở P1 vì workflow browser automation/test thường gọn hơn.
- Với dữ liệu CV, privacy quan trọng ngang với độ chính xác. Hạn chế log raw text và không gửi PII sang dịch vụ ngoài khi chưa có chính sách rõ.
