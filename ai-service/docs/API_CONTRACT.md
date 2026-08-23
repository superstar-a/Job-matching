# AI Service API Contract

Tai lieu nay la hop dong ky thuat giua Backend Gateway va FastAPI AI-service.

## Quyet dinh hien tai

- Local database trong repo hien tai: MS SQL Server, theo `docker-compose.yml` va `.env.example`.
- Backend Gateway goi AI-service qua bien moi truong: `AI_SERVICE_URL=http://ai-service:8000`.
- AI-service uu tien xu ly va tra JSON co cau truc. Backend chiu trach nhiem luu DB, quan ly user, auth va permission.
- Neu team muon doi sang MySQL/RDS, can cap nhat dong bo: `docker-compose.yml`, `.env.example`, ORM config cua Backend, README va run instruction.

## Nguyen tac chung

- Tat ca response loi nen theo format:

```json
{
  "code": "INVALID_INPUT",
  "message": "Input text is empty",
  "details": {
    "field": "text"
  },
  "request_id": "req_123"
}
```

- Khong log raw CV, email, phone, token hoac AWS credentials.
- Endpoint xu ly nhanh co the chay sync. Tac vu lau nhu crawl batch hoac parse nhieu CV nen chuyen sang background job o giai doan sau.

## Endpoints MVP

### GET /health

Kiem tra service song.

Response:

```json
{
  "status": "ok",
  "service": "ai-service",
  "version": "1.0.0"
}
```

### POST /api/extract-entities

Nhan text JD/CV va tra ve danh sach entity.

Request:

```json
{
  "text": "We need a Python FastAPI developer with 2+ years of experience.",
  "language": "en",
  "document_type": "jd"
}
```

Response:

```json
{
  "language": "en",
  "document_type": "jd",
  "entities": [
    {
      "text": "Python",
      "label": "skill",
      "normalized": "Python",
      "confidence": 0.95,
      "esco_uri": "http://data.europa.eu/esco/skill/ccd0a1d9-afda-43d9-b901-96344886e14d",
      "esco_preferred_label": "Python (computer programming)",
      "esco_type": "skill",
      "isco_group": null
    }
  ]
}
```

### POST /api/parse-cv

Nhan CV dang file, S3 key, hoac text da extract. MVP nen uu tien text/file local truoc, S3 de P1 neu Backend upload file len S3.

Response chuan hoa theo schema `CVProfile`.

### POST /api/match-cv-jd

Nhan CV structured va JD structured, tra ve diem match va giai thich.

Response toi thieu:

```json
{
  "overall_score": 82.5,
  "matched_skills": ["Python", "FastAPI", "SQL"],
  "missing_required_skills": ["Docker"],
  "nice_to_have_skills": ["AWS"],
  "experience_gap": "Candidate has 1.5 years, job asks for 2 years.",
  "salary_gap": null,
  "recommendation_reason": "Strong backend Python fit but should improve Docker evidence."
}
```

### POST /api/recommend-jobs

Nhan mot CV va danh sach JD, tra ve ranking theo score.

### POST /api/job-assistant/chat

Backend orchestration endpoint cho chat MVP. Nhan message, optional CV attachment
va `conversation_id`; tra ve intent da parse, filter da ap dung, job da rank va
detail payload de Frontend mo panel chi tiet.

Request toi thieu:

```json
{
  "conversation_id": "conv_123",
  "message": "Tim job TopCV luong 20tr o HCM cho Python backend",
  "cv": {
    "fileName": "candidate-cv.pdf",
    "fileBase64": "base64-content",
    "skills": ["Python", "FastAPI"]
  }
}
```

Response toi thieu:

```json
{
  "success": true,
  "conversation_id": "conv_123",
  "assistant_message": "Found 1 job for Python Backend in ho chi minh.",
  "parsed_intent": {
    "target_role": "Python Backend",
    "required_skills": ["Python"],
    "job_sources": ["topcv"],
    "location": "ho chi minh",
    "work_mode": "remote",
    "salary_min": 20000000,
    "currency": "VND"
  },
  "selected_sources": ["topcv"],
  "filters": {
    "location": "ho chi minh",
    "work_mode": "remote",
    "salary_min": 20000000,
    "currency": "VND"
  },
  "ranked_jobs": [
    {
      "jobId": "job-1",
      "jobTitle": "Python Backend Developer",
      "company": "Product Lab",
      "salary": "25,000,000 - 35,000,000 VND",
      "score": 91,
      "matchedSkills": ["Python", "FastAPI"],
      "missingSkills": ["Docker"],
      "recommendationReason": "Strong backend match with one Docker gap."
    }
  ],
  "job_details": [
    {
      "job_id": "job-1",
      "title": "Python Backend Developer",
      "company_name": "Product Lab",
      "location": "TP. Ho Chi Minh (Remote)",
      "salary": "25,000,000 - 35,000,000 VND",
      "description": "Build backend APIs with Python and FastAPI.",
      "skills": ["Python", "FastAPI", "Docker"],
      "score": 91,
      "matched_skills": ["Python", "FastAPI"],
      "missing_skills": ["Docker"],
      "recommendation_reason": "Strong backend match with one Docker gap."
    }
  ],
  "follow_up_questions": []
}
```

Neu request chua co CV context, Backend chi rank theo intent/filter va tra
`source="intent-filter"`; khi user attach CV hoac session da co parsed CV
profile thi moi goi AI-service de rank theo do phu hop CV-JD.

MVP luu conversation/session in-memory o Backend de giu intent va parsed CV
profile cho cac follow-up nhu "loc them remote". Khong giu `fileBase64`/raw CV
text trong session. Khi len production can chuyen session sang DB hoac cache co
TTL.

### POST /api/cv-suggestions

Nhan CV + JD, tra ve goi y cai thien CV theo section. Khong bia kinh nghiem, chi goi y cach dien dat dua tren thong tin da co.
