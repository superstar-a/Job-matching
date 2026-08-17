# Huong dan test AI-service

Tai lieu nay huong dan cach test FastAPI `ai-service` trong du an Job Matching.

## 1. Mo terminal

Mo terminal trong VS Code hoac PowerShell, sau do di toi thu muc `ai-service`:

```powershell
cd D:\studies\AWS\Job-matching\ai-service
```

## 2. Kich hoat moi truong ao

Chay lenh:

```powershell
.\venv\Scripts\Activate.ps1
```

Neu thanh cong, terminal se hien them `(venv)` o dau dong:

```powershell
(venv) PS D:\studies\AWS\Job-matching\ai-service>
```

Kiem tra nhanh interpreter dang dung:

```powershell
where.exe python
```

Dong dau tien nen la:

```text
D:\studies\AWS\Job-matching\ai-service\venv\Scripts\python.exe
```

## 3. Cai dependencies neu chua cai

Chi can lam buoc nay lan dau, hoac sau khi `requirements.txt` / `requirements-dev.txt` thay doi:

```powershell
python -m pip install -r requirements.txt -r requirements-dev.txt
```

## 4. Chay test tu dong bang pytest

Chay:

```powershell
python -m pytest
```

Ket qua dung hien tai:

```text
27 passed
```

Neu thay `passed`, nghia la cac test dang thanh cong.

Hien tai test dang kiem tra:

- Endpoint `GET /health` tra dung `status`, `service`, `version`.
- Endpoint `GET /` van tra duoc health contract.
- Config doc dung cac bien moi truong: `AWS_REGION`, `AI_REQUEST_TIMEOUT_SECONDS`, `AI_CRAWL_DELAY_SECONDS`, `AI_LOG_LEVEL`.
- HTML cleaner bo layout tags, script/style va decode HTML entities.
- Static scraper block LinkedIn, dung crawl delay, va normalize JD fields co ban tu HTML/JSON-LD.
- Deduplicator phat hien trung lap theo URL, external ID, va fingerprint title/company/location.
- Endpoint `POST /api/scrape-jd` validate URL input.
- Batch scraper mac dinh chi ghi record `success` vao dataset JSONL.
- Sample JD dataset co it nhat 20 record va validate duoc voi `JDResponse`.
- CV parser doc duoc TXT/PDF/DOCX sample va tra `CVProfile` co cau truc.
- Entity extractor tra skill/year/location/work_mode co normalized value, section, evidence va source span.
- Endpoint `POST /api/parse-cv` va `POST /api/extract-entities` hoat dong qua FastAPI `TestClient`.

## 5. Chay server de test API that

Sau khi `pytest` pass, chay FastAPI server:

```powershell
python -m uvicorn main:app --reload --port 8000
```

Khi server dang chay, terminal se giu nguyen o trang thai logging. Dung dong terminal nay trong luc dang test API.

## 6. Test endpoint health tren trinh duyet

Mo trinh duyet va vao:

```text
http://localhost:8000/health
```

Ket qua dung:

```json
{
  "status": "ok",
  "service": "ai-service",
  "version": "1.0.0"
}
```

## 7. Test API bang Swagger

Mo:

```text
http://localhost:8000/docs
```

Day la giao dien Swagger UI do FastAPI tu sinh ra. Ban co the:

- Xem danh sach endpoint.
- Bam vao endpoint can test.
- Bam `Try it out`.
- Bam `Execute`.
- Xem response tra ve.

## 8. Dung server

Quay lai terminal dang chay `uvicorn`, bam:

```text
Ctrl + C
```

## 9. Checklist test nhanh moi lan code

Moi lan sua code trong `ai-service`, nen chay theo thu tu:

```powershell
cd D:\studies\AWS\Job-matching\ai-service
.\venv\Scripts\Activate.ps1
python -m pytest
python -m uvicorn main:app --reload --port 8000
```

Sau do mo:

```text
http://localhost:8000/health
http://localhost:8000/docs
```

## 10. Loi thuong gap

### Loi: Python was not found

Neu gap loi:

```text
Python was not found
```

Kiem tra lai venv da duoc kich hoat chua:

```powershell
where.exe python
```

Neu dong dau tien khong phai `ai-service\venv\Scripts\python.exe`, kich hoat lai:

```powershell
.\venv\Scripts\Activate.ps1
```

### Loi: Activate.ps1 cannot be loaded

Neu PowerShell chan kich hoat `venv`, chay:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Sau do thu lai:

```powershell
.\venv\Scripts\Activate.ps1
```

### Loi: ModuleNotFoundError

Neu gap loi thieu thu vien, cai lai dependencies:

```powershell
python -m pip install -r requirements.txt -r requirements-dev.txt
```

### Warning tu pytest

Neu thay warning nhung van co:

```text
27 passed
```

thi test van thanh cong. Warning co the xu ly sau khi nang cap dependency.
