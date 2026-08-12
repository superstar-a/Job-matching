# Tests

Thu muc nay se chua unit test va integration test cho `ai-service`.

Thu tu nen viet test:

1. Schema validation cho sample JD/CV.
2. Skill extractor.
3. CV parser.
4. JD normalizer.
5. Matching score.

Chay test local:

```powershell
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt -r requirements-dev.txt
python -m pytest
```
