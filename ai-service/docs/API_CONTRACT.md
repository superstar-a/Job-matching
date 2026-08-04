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
      "confidence": 0.95
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

### POST /api/cv-suggestions

Nhan CV + JD, tra ve goi y cai thien CV theo section. Khong bia kinh nghiem, chi goi y cach dien dat dua tren thong tin da co.
