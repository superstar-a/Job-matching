# AI/Data Database

This folder contains SQL Server assets owned by the AI/Data side of the
JobMatch AI project.

The migration creates schema `ai_data` inside the selected database. It does
not create user/session/auth/business workflow tables.

## Run Locally

If you use the repository Docker Compose setup, SQL Server is exposed on the
host port configured by `DB_PORT`. The sample `.env.example` uses `1434`.

Create the database first if it does not exist:

```powershell
sqlcmd -S 127.0.0.1,1434 -U sa -P "YourPassword123!" -Q "IF DB_ID(N'job_matching_db') IS NULL CREATE DATABASE job_matching_db;"
```

Run the base schema migration:

```powershell
sqlcmd -S 127.0.0.1,1434 -U sa -P "YourPassword123!" -d job_matching_db -i ai-service\db\migrations\001_create_ai_data_tables.sql
```

Run the relationship-strengthening migration:

```powershell
sqlcmd -S 127.0.0.1,1434 -U sa -P "YourPassword123!" -d job_matching_db -i ai-service\db\migrations\002_strengthen_ai_data_relationships.sql
```

If you run SQL Server directly on port `1433`, change `1434` to `1433`.

## Check In SQL Server

List the AI/Data tables:

```powershell
sqlcmd -S 127.0.0.1,1434 -U sa -P "YourPassword123!" -d job_matching_db -Q "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'ai_data' ORDER BY TABLE_NAME;"
```

Expected table count for migration `001`: `23`.

Run the schema checklist:

```powershell
sqlcmd -S 127.0.0.1,1434 -U sa -P "YourPassword123!" -d job_matching_db -i ai-service\db\schema_checks\001_ai_data_schema_check.sql
```

Run the relationship checklist:

```powershell
sqlcmd -S 127.0.0.1,1434 -U sa -P "YourPassword123!" -d job_matching_db -i ai-service\db\schema_checks\002_ai_data_relationships_check.sql
```

You can run the same files in SSMS or Azure Data Studio. Connect to the target
database, open the `.sql` file, and execute it.

If `sqlcmd` returns an SSL/encryption error, first try adding `-C`:

```powershell
sqlcmd -C -S 127.0.0.1,1434 -U sa -P "YourPassword123!" -d job_matching_db -i ai-service\db\migrations\001_create_ai_data_tables.sql
```

If it still fails, run the same SQL file in SSMS or Azure Data Studio with
Trust Server Certificate enabled, or update the local SQL Server ODBC driver.

## Seed ESCO Concepts

After migrations `001` and `002`, seed the starter ESCO concepts:

```powershell
sqlcmd -S 127.0.0.1,1433 -U sa -P "Nhan123" -d job_matching_db -i ai-service\db\seeds\001_seed_esco_concepts.sql
```

Check the seeded rows:

```powershell
sqlcmd -S 127.0.0.1,1433 -U sa -P "Nhan123" -d job_matching_db -Q "SELECT concept_type, COUNT(*) AS total FROM ai_data.esco_concepts GROUP BY concept_type;"
```

If the JSON seed changes, regenerate the SQL seed file:

```powershell
cd ai-service
.\venv\Scripts\python.exe scripts\seed_esco_concepts.py --output db\seeds\001_seed_esco_concepts.sql
```

Or run the Python seeder directly:

```powershell
cd ai-service
.\venv\Scripts\python.exe scripts\seed_esco_concepts.py --server 127.0.0.1,1433 --database job_matching_db --user sa --password "Nhan123"
```

## Seed Sample AI/Data Flow

After seeding ESCO, insert one complete sample flow from `data/samples`:

```powershell
sqlcmd -S 127.0.0.1,1433 -U sa -P "Nhan123" -d job_matching_db -i ai-service\db\seeds\002_seed_sample_ai_data.sql
```

This creates one CV profile, one normalized job, extracted entities, ESCO
links, matching features, a match run, fit analysis, CV suggestion, evidence,
guardrail, labels, text chunks, embedding refs, and a planned model experiment.

Run the local smoke test:

```powershell
sqlcmd -S 127.0.0.1,1433 -U sa -P "Nhan123" -d job_matching_db -i ai-service\db\smoke_tests\001_ai_data_local_smoke_test.sql
```

Expected final print:

```text
ai_data local smoke test passed.
```

## Notes

- Raw CV file content is not stored as base64.
- CV/JD text should be sanitized or stored as short previews unless a clear
  retention policy exists.
- Long URLs are deduplicated with `source_url_hash` instead of unique indexes
  on full URL text.
- Vectors can be stored via `vector_ref` first; `vector_blob` is available only
  if the team decides SQL Server should hold vector bytes.
