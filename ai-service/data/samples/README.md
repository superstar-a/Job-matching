# AI-service sample dataset

This folder keeps small deterministic fixtures for local demos and tests.

- `raw/`: source-like JD/CV inputs before cleaning. CV fixtures include TXT, DOCX, and PDF.
- `cleaned/`: text after HTML cleanup and whitespace normalization.
- `normalized/`: expected structured JSON after taxonomy aliasing, salary/location/level/job type normalization, and quality flagging.

The existing `jd_sample.json`, `cv_sample.json`, `match_expected.json`, and `jd_samples_20.json` files are kept for backward-compatible tests.

